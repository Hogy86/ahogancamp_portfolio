// Tests PRD §F19 (post-level-10-boss "Game Complete" celebration + auto-return to
// TITLE). Esc/any-key hold-and-advance input handling lives in GameStateMachine (see
// GameStateMachine.test.ts's "VICTORY / Game Complete input handling" suite) - this
// file covers the timer itself: it counts down only while not held, and reliably
// resets to a fresh TITLE world once it reaches 0.

import { describe, expect, it } from 'vitest';
import { updateVictoryCelebration } from './VictoryCelebrationSystem';
import { FIXED_DT, STARTING_LIVES, VICTORY_CELEBRATION_SECONDS } from '../config/constants';
import { makePlayingWorld } from '../test-utils/worldFactory';

describe('VictoryCelebrationSystem (F19 AC5/AC6/AC8/AC9)', () => {
  it('counts down victoryCelebrationRemaining by dt while not held', () => {
    const world = makePlayingWorld();
    world.state = 'VICTORY';
    world.victoryCelebrationRemaining = VICTORY_CELEBRATION_SECONDS;
    world.victoryHeld = false;

    updateVictoryCelebration(world, FIXED_DT);

    expect(world.victoryCelebrationRemaining).toBeCloseTo(
      VICTORY_CELEBRATION_SECONDS - FIXED_DT,
      5,
    );
    expect(world.state).toBe('VICTORY'); // has not yet auto-returned
  });

  it('F19 AC9: does not tick at all while victoryHeld is true (the hold gesture fully pauses the countdown, not just slows it)', () => {
    const world = makePlayingWorld();
    world.state = 'VICTORY';
    world.victoryCelebrationRemaining = 2.5;
    world.victoryHeld = true;

    for (let i = 0; i < 120; i += 1) updateVictoryCelebration(world, FIXED_DT);

    expect(world.victoryCelebrationRemaining).toBe(2.5);
    expect(world.state).toBe('VICTORY');
  });

  it('F19 AC5/AC6: reliably reaches TITLE after the full 5 seconds elapse with no input at all', () => {
    const world = makePlayingWorld();
    world.state = 'VICTORY';
    world.victoryCelebrationRemaining = VICTORY_CELEBRATION_SECONDS;
    world.victoryHeld = false;
    world.score = 55555;

    const ticks = Math.round(VICTORY_CELEBRATION_SECONDS / FIXED_DT) + 5;
    for (let i = 0; i < ticks; i += 1) updateVictoryCelebration(world, FIXED_DT);

    expect(world.state).toBe('TITLE');
  });

  it('F19 AC8: auto-returning to TITLE resets run state for a clean subsequent run', () => {
    const world = makePlayingWorld();
    world.state = 'VICTORY';
    world.victoryCelebrationRemaining = FIXED_DT / 2; // about to elapse
    world.victoryHeld = false;
    world.score = 55555;
    world.level = 10;
    world.lives = 1;
    world.permanentMultiplier = 3.24;

    updateVictoryCelebration(world, FIXED_DT);

    expect(world.state).toBe('TITLE');
    expect(world.score).toBe(0);
    expect(world.level).toBe(1);
    expect(world.lives).toBe(STARTING_LIVES);
    expect(world.permanentMultiplier).toBe(1);
  });

  it('resuming after a hold is released continues counting down from the exact remaining value (no drift)', () => {
    const world = makePlayingWorld();
    world.state = 'VICTORY';
    world.victoryCelebrationRemaining = 3;
    world.victoryHeld = true;

    for (let i = 0; i < 60; i += 1) updateVictoryCelebration(world, FIXED_DT); // held - no change
    expect(world.victoryCelebrationRemaining).toBe(3);

    world.victoryHeld = false;
    updateVictoryCelebration(world, FIXED_DT);
    expect(world.victoryCelebrationRemaining).toBeCloseTo(3 - FIXED_DT, 5);
  });
});
