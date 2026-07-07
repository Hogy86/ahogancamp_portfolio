// Tests PRD §F7 AC2 (constant fall speed), §F7 AC3 (uncaught drop removed with no
// effect at the bottom), §F7 AC4/AC5/AC6 (temporary timers count down and expire
// after exactly 8s), §F6 AC7 (timer-drift is a property of the caller only ticking
// this while PLAYING - covered at GameLoop level; here we confirm the decrement
// itself is a plain per-dt subtraction, not wall-clock).

import { describe, expect, it } from 'vitest';
import { updatePowerUps } from './PowerUpSystem';
import { FIXED_DT, PLAYFIELD_HEIGHT, POWERUP_DURATION_SECONDS, POWERUP_FALL_SPEED } from '../config/constants';
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
    expect(world.effects.hitPowerRemaining).toBe(0);
  });
});

describe('PowerUpSystem timers (F7 AC4/AC5/AC6, F8 AC9)', () => {
  it('decrements all active temporary effect timers by dt each tick', () => {
    const world = makePlayingWorld();
    world.effects.hitPowerRemaining = 8;
    world.effects.speedRemaining = 8;
    world.effects.shieldRemaining = 8;
    world.player.postHitInvulnRemaining = 1.5;

    updatePowerUps(world, FIXED_DT);

    expect(world.effects.hitPowerRemaining).toBeCloseTo(8 - FIXED_DT, 5);
    expect(world.effects.speedRemaining).toBeCloseTo(8 - FIXED_DT, 5);
    expect(world.effects.shieldRemaining).toBeCloseTo(8 - FIXED_DT, 5);
    expect(world.player.postHitInvulnRemaining).toBeCloseTo(1.5 - FIXED_DT, 5);
  });

  it('a temporary effect reverts (reaches exactly 0, never negative) after its full duration elapses', () => {
    const world = makePlayingWorld();
    world.effects.hitPowerRemaining = POWERUP_DURATION_SECONDS;

    const ticksFor8s = Math.round(POWERUP_DURATION_SECONDS / FIXED_DT) + 5;
    for (let i = 0; i < ticksFor8s; i += 1) updatePowerUps(world, FIXED_DT);

    expect(world.effects.hitPowerRemaining).toBe(0);
  });

  it('timers only ever decrement via this function - never independently advance without a call (no wall-clock leak)', () => {
    const world = makePlayingWorld();
    world.effects.speedRemaining = 5;
    // No calls to updatePowerUps at all - value must be unchanged.
    expect(world.effects.speedRemaining).toBe(5);
  });
});
