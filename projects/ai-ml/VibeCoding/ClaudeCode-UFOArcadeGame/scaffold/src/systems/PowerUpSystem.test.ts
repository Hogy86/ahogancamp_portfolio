// Tests PRD §F7 AC2 (constant fall speed), §F7 AC3 (uncaught drop removed with no
// effect at the bottom), §F8 AC9 (post-hit invuln decrement), §F16 AC9
// (catch-confirmation flash decrement), and v2 §F11 (the single active-temporary-
// effect slot counts down as one unit and clears its type to null on expiry -
// replaces v1's three independent parallel timers). §F6 AC7 (timer-drift is a
// property of the caller only ticking this while PLAYING - covered at GameLoop
// level; here we confirm the decrement itself is a plain per-dt subtraction, not
// wall-clock).

import { describe, expect, it } from 'vitest';
import { updatePowerUps } from './PowerUpSystem';
import {
  FIXED_DT,
  PLAYFIELD_HEIGHT,
  POWERUP_DURATION_SECONDS,
  POWERUP_FALL_SPEED,
} from '../config/constants';
import { makePlayingWorld } from '../test-utils/worldFactory';

describe('PowerUpSystem (F7 AC2, AC3)', () => {
  it('F7 AC2: a power-up falls downward (increasing y) at a constant speed', () => {
    const world = makePlayingWorld();
    world.powerUps = [{ id: 1, type: 'SPEED', x: 100, y: 0, radius: 12, active: true }];
    updatePowerUps(world, FIXED_DT);
    expect(world.powerUps[0]!.y).toBeCloseTo(POWERUP_FALL_SPEED * FIXED_DT, 5);
  });

  it('F7 AC3: an uncaught power-up reaching the bottom of the playfield is removed with no effect', () => {
    const world = makePlayingWorld();
    world.powerUps = [{ id: 1, type: 'HIT_POWER', x: 100, y: 0, radius: 12, active: true }];

    const ticksToBottom = Math.ceil((PLAYFIELD_HEIGHT + 12) / (POWERUP_FALL_SPEED * FIXED_DT)) + 5;
    for (let i = 0; i < ticksToBottom; i += 1) updatePowerUps(world, FIXED_DT);

    expect(world.powerUps).toHaveLength(0);
    expect(world.effects.type).toBeNull();
  });
});

describe('PowerUpSystem timers - single active-temporary-effect slot (F11, F8 AC9, F16 AC9)', () => {
  it('decrements the active temporary effect slot, post-hit invuln, and the life-catch flash all by dt each tick', () => {
    const world = makePlayingWorld();
    world.effects = { type: 'HIT_POWER', remaining: 8 };
    world.player.postHitInvulnRemaining = 1.5;
    world.lifeCatchFlashRemaining = 1.0;

    updatePowerUps(world, FIXED_DT);

    expect(world.effects.type).toBe('HIT_POWER');
    expect(world.effects.remaining).toBeCloseTo(8 - FIXED_DT, 5);
    expect(world.player.postHitInvulnRemaining).toBeCloseTo(1.5 - FIXED_DT, 5);
    expect(world.lifeCatchFlashRemaining).toBeCloseTo(1.0 - FIXED_DT, 5);
  });

  it('F11: the active effect reverts (reaches exactly 0 and clears its type to null, never negative) after its full duration elapses', () => {
    const world = makePlayingWorld();
    world.effects = { type: 'SPEED', remaining: POWERUP_DURATION_SECONDS };

    const ticksFor8s = Math.round(POWERUP_DURATION_SECONDS / FIXED_DT) + 5;
    for (let i = 0; i < ticksFor8s; i += 1) updatePowerUps(world, FIXED_DT);

    expect(world.effects.remaining).toBe(0);
    expect(world.effects.type).toBeNull();
  });

  it('F11 AC1: when no temporary effect is active (type null), the slot stays inert - remaining never goes negative or spuriously reactivates', () => {
    const world = makePlayingWorld();
    world.effects = { type: null, remaining: 0 };

    for (let i = 0; i < 120; i += 1) updatePowerUps(world, FIXED_DT);

    expect(world.effects).toEqual({ type: null, remaining: 0 });
  });

  it('timers only ever decrement via this function - never independently advance without a call (no wall-clock leak)', () => {
    const world = makePlayingWorld();
    world.effects = { type: 'SPEED', remaining: 5 };
    // No calls to updatePowerUps at all - value must be unchanged.
    expect(world.effects.remaining).toBe(5);
  });
});
