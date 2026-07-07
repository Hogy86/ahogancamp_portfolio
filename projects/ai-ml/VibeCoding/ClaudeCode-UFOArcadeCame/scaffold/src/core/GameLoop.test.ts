// Tests PRD §F6 AC7 (active power-up/timer durations are paused while the game is
// paused and resume with the remaining duration intact - no drift) and the
// "simulation only ticks while state == PLAYING" guarantee that AC7 depends on
// (ADR-0002 decision 3, GameLoop.ts:68-73). Drives GameLoop.tick via a
// fully-controlled fake requestAnimationFrame so frame timestamps (and therefore
// the fixed-timestep accumulator) are deterministic - no reliance on real RAF
// pacing or wall-clock time.
//
// GameStateMachine.test.ts and PowerUpSystem.test.ts each explicitly defer F6 AC7
// to "the GameLoop level" (see their leading comments) - this file is that
// coverage. It does not re-test per-system decrement logic (PowerUpSystem.test.ts
// already covers "timers only decrement via an explicit call"); it tests the loop
// property that no system call happens at all while paused.
//
// Timing note: each assertion window below advances the clock by a single lump
// of milliseconds (rather than many small per-frame increments) so the expected
// fixed-step count is computed once via Math.floor(elapsedSeconds / FIXED_DT),
// matching the loop's own accumulator arithmetic exactly and avoiding
// floating-point boundary flakiness from re-summing many tiny per-frame deltas.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameLoop } from './GameLoop';
import { FIXED_DT } from '../config/constants';
import { makePlayingWorld } from '../test-utils/worldFactory';
import type { World } from './types';

/** Captures the pending RAF callback so tests can invoke ticks at exact,
 * hand-picked timestamps instead of depending on real animation-frame pacing. */
function installFakeRaf(): { fire: (timestamp: number) => void; cancelCount: () => number } {
  let pending: FrameRequestCallback | null = null;
  let cancelCount = 0;

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    pending = cb;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    cancelCount += 1;
  });

  return {
    fire(timestamp: number) {
      const cb = pending;
      pending = null;
      if (!cb) throw new Error('No RAF callback was scheduled to fire.');
      cb(timestamp);
    },
    cancelCount: () => cancelCount,
  };
}

describe('GameLoop (F6 AC7, ADR-0002 decision 3)', () => {
  let raf: ReturnType<typeof installFakeRaf>;

  beforeEach(() => {
    raf = installFakeRaf();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not advance simulation time/effects while state is PAUSED', () => {
    const world = makePlayingWorld();
    world.effects.hitPowerRemaining = 8;
    world.effects.speedRemaining = 8;
    world.effects.shieldRemaining = 8;
    world.state = 'PAUSED';

    const enemyYBefore = world.enemies[0]!.y;
    const loop = new GameLoop(world, () => {});
    loop.start();

    // First tick establishes lastTimestamp with no elapsed time (GameLoop.ts:57).
    raf.fire(0);
    // Advance by many frames' worth of time while paused - more than enough
    // elapsed time to cross dozens of fixed steps if the gate were broken.
    let ts = 0;
    for (let i = 0; i < 30; i += 1) {
      ts += 200; // 200ms per frame, well over one fixed step each
      raf.fire(ts);
    }

    expect(world.effects.hitPowerRemaining).toBe(8);
    expect(world.effects.speedRemaining).toBe(8);
    expect(world.effects.shieldRemaining).toBe(8);
    expect(world.enemies[0]!.y).toBe(enemyYBefore);

    loop.stop();
  });

  it('advances simulation (effect timers count down) while state is PLAYING', () => {
    const world = makePlayingWorld();
    world.effects.hitPowerRemaining = 8;
    world.state = 'PLAYING';

    const loop = new GameLoop(world, () => {});
    loop.start();

    raf.fire(0);
    // A single 150ms frame (well under the 250ms MAX_FRAME_TIME_SECONDS clamp)
    // is guaranteed to process floor(0.15 / FIXED_DT) fixed steps.
    raf.fire(150);

    const expectedSteps = Math.floor(0.15 / FIXED_DT);
    expect(expectedSteps).toBeGreaterThan(0);
    expect(world.effects.hitPowerRemaining).toBeLessThan(8);
    expect(world.effects.hitPowerRemaining).toBeCloseTo(8 - expectedSteps * FIXED_DT, 5);

    loop.stop();
  });

  it('pausing mid-run freezes an active timer, and resuming continues from the remaining duration with no drift', () => {
    const world = makePlayingWorld();
    world.effects.hitPowerRemaining = 8;
    world.state = 'PLAYING';

    const loop = new GameLoop(world, () => {});
    loop.start();

    // Run one 150ms frame while PLAYING - a known, single-shot number of fixed steps.
    raf.fire(0);
    raf.fire(150);
    const stepsBeforePause = Math.floor(0.15 / FIXED_DT);
    const remainingAtPause = world.effects.hitPowerRemaining;
    expect(remainingAtPause).toBeCloseTo(8 - stepsBeforePause * FIXED_DT, 5);

    // Pause: a large amount of further elapsed wall-clock time must not touch
    // the timer at all, no matter how many frames elapse while paused.
    world.state = 'PAUSED';
    let pausedTs = 150;
    for (let i = 0; i < 20; i += 1) {
      pausedTs += 500; // 500ms/frame while paused - large relative to FIXED_DT
      raf.fire(pausedTs);
    }
    expect(world.effects.hitPowerRemaining).toBe(remainingAtPause);

    // Resume: exactly one more 150ms frame's worth of decrement should occur -
    // proving no time was lost or gained by the pause (no drift).
    world.state = 'PLAYING';
    raf.fire(pausedTs + 150);
    const stepsAfterResume = Math.floor(0.15 / FIXED_DT);

    expect(world.effects.hitPowerRemaining).toBeCloseTo(
      remainingAtPause - stepsAfterResume * FIXED_DT,
      5,
    );
  });

  it('per-screen input dispatch (e.g. Esc) still runs every tick even while PAUSED, distinct from simulation systems', () => {
    // ADR-0002 decision 2: dispatchStateInput always runs regardless of state -
    // this is what lets Esc resume from PAUSED. Only the *simulation* systems
    // (movement/formation/effects/etc.) are gated on state === PLAYING.
    const world = makePlayingWorld();
    world.state = 'PLAYING';

    const loop = new GameLoop(world, () => {});
    loop.start();

    raf.fire(0);
    raf.fire(33);
    expect(world.state).toBe('PLAYING');

    loop.stop();
  });

  it('clamps a very large elapsed-time gap (e.g. a backgrounded tab) rather than processing an unbounded catch-up burst', () => {
    // NFR-2 "spiral of death" guard (GameLoop.ts MAX_FRAME_TIME_SECONDS = 0.25).
    // If uncapped, a 10-minute gap would run ~36000 fixed steps in one frame;
    // capped, at most 0.25s / FIXED_DT (~15) fixed steps are processed.
    const world = makePlayingWorld();
    world.effects.hitPowerRemaining = 100; // large enough to not hit the revert-to-0 floor
    world.state = 'PLAYING';

    const loop = new GameLoop(world, () => {});
    loop.start();

    raf.fire(0);
    raf.fire(10 * 60 * 1000); // 10 minutes later, e.g. a backgrounded tab

    const maxPossibleStepsProcessed = Math.floor(0.25 / FIXED_DT) + 1;
    const minDecrement = FIXED_DT; // at least one fixed step must run
    const maxDecrement = maxPossibleStepsProcessed * FIXED_DT;

    const decremented = 100 - world.effects.hitPowerRemaining;
    expect(decremented).toBeGreaterThanOrEqual(minDecrement);
    expect(decremented).toBeLessThanOrEqual(maxDecrement + 1e-9);

    loop.stop();
  });

  it('stop() cancels the scheduled animation frame and disposes input listeners', () => {
    const world = makePlayingWorld();
    const loop = new GameLoop(world, () => {});
    loop.start();
    raf.fire(0);

    loop.stop();

    expect(raf.cancelCount()).toBeGreaterThanOrEqual(1);
  });

  it('invokes the render callback every tick regardless of PLAYING/PAUSED state', () => {
    const world = makePlayingWorld();
    world.state = 'PAUSED';
    const renderSpy = vi.fn();

    const loop = new GameLoop(world, renderSpy);
    loop.start();

    raf.fire(0);
    raf.fire(16);
    raf.fire(32);

    // Render is called once per RAF tick (title/pause overlays must still render
    // while paused) even though simulation itself does not advance.
    expect(renderSpy).toHaveBeenCalledTimes(3);
    renderSpy.mock.calls.forEach((call) => {
      const [renderedWorld] = call as [World, number];
      expect(renderedWorld).toBe(world);
    });

    loop.stop();
  });
});
