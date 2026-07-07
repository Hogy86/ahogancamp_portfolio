// Tests PRD §F2 AC3/AC5 (shield hits exactly one enemy, one hit of damage),
// §F7 AC4/AC5/AC6/AC7/AC9 (power-up effect application + composition),
// §F8 AC2/AC3 (laser hit costs a life unless invulnerable),
// §F10 AC2/AC3 (score per kill scaled by level, power-up catch bonus).
//
// Note: CollisionSystem only flips `.active = false` on consumed shields/power-ups;
// removing inactive entries from the array is ProjectileSystem's/PowerUpSystem's job
// on a later step. Tests here assert `.active` directly rather than array length for
// collision-only assertions.

import { describe, expect, it } from 'vitest';
import { updateCollisions } from './CollisionSystem';
import {
  HIT_POWER_MULTIPLIER,
  PERMANENT_MULTIPLIER_PER_CATCH,
  POST_HIT_INVULN_SECONDS,
  SCORE_PER_KILL_BASE,
  SCORE_PER_KILL_PER_LEVEL,
  SCORE_POWERUP_BONUS,
} from '../config/constants';
import { resetGuaranteedDrops } from './levelRuntimeState';
import { makePlayingWorld } from '../test-utils/worldFactory';
import type { Enemy } from '../core/types';

function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 1,
    col: 0,
    row: 0,
    x: 100,
    y: 100,
    width: 36,
    height: 28,
    hitsToKill: 1,
    hitsTaken: 0,
    isBoss: false,
    alive: true,
    ...overrides,
  };
}

describe('CollisionSystem - shield vs enemy (F2 AC3/AC5)', () => {
  it('F2 AC3: a shield hit applies exactly one hit of damage and the shield is consumed (deactivated)', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const enemy = makeEnemy({ hitsToKill: 3 });
    world.enemies = [enemy];
    world.shields = [{ id: 1, x: enemy.x + 10, y: enemy.y + 10, radius: 8, active: true }];

    updateCollisions(world);

    expect(enemy.hitsTaken).toBe(1);
    expect(enemy.alive).toBe(true);
    expect(world.shields[0]!.active).toBe(false);
  });

  it('F2 AC5: a shield is consumed by at most one enemy even if two enemies overlap its position', () => {
    const world = makePlayingWorld();
    resetGuaranteedDrops(world.level);
    const enemyA = makeEnemy({ id: 1, x: 100, y: 100, hitsToKill: 5 });
    const enemyB = makeEnemy({ id: 2, x: 100, y: 100, hitsToKill: 5 });
    world.enemies = [enemyA, enemyB];
    world.shields = [{ id: 1, x: 110, y: 110, radius: 8, active: true }];

    updateCollisions(world);

    const totalHits = enemyA.hitsTaken + enemyB.hitsTaken;
    expect(totalHits).toBe(1);
  });

  it('killing an enemy (hitsTaken reaches hitsToKill) marks it dead and awards score scaled by level (F10 AC2)', () => {
    const world = makePlayingWorld(3);
    resetGuaranteedDrops(world.level);
    const enemy = makeEnemy({ hitsToKill: 1 });
    world.enemies = [enemy];
    world.shields = [{ id: 1, x: enemy.x + 10, y: enemy.y + 10, radius: 8, active: true }];
    world.score = 0;

    updateCollisions(world);

    expect(enemy.alive).toBe(false);
    expect(world.score).toBe(SCORE_PER_KILL_BASE + SCORE_PER_KILL_PER_LEVEL * (3 - 1));
  });
});

describe('CollisionSystem - laser vs player (F8 AC2/AC3)', () => {
  it('F8 AC2: an enemy laser hitting a non-invulnerable player reduces lives by exactly 1', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.player.postHitInvulnRemaining = 0;
    world.effects.shieldRemaining = 0;
    world.enemyLasers = [
      { id: 1, x: world.player.x + world.player.width / 2, y: world.player.y, radius: 6, active: true },
    ];

    updateCollisions(world);

    expect(world.lives).toBe(2);
  });

  it('F8 AC9: a laser hit grants post-hit invulnerability for the tunable window', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.player.postHitInvulnRemaining = 0;
    world.enemyLasers = [
      { id: 1, x: world.player.x + world.player.width / 2, y: world.player.y, radius: 6, active: true },
    ];

    updateCollisions(world);

    expect(world.player.postHitInvulnRemaining).toBe(POST_HIT_INVULN_SECONDS);
  });

  it('F8 AC3: while post-hit i-frames are active, a laser hit deals no life loss', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.player.postHitInvulnRemaining = 1.0;
    world.enemyLasers = [
      { id: 1, x: world.player.x + world.player.width / 2, y: world.player.y, radius: 6, active: true },
    ];

    updateCollisions(world);

    expect(world.lives).toBe(3);
  });

  it('F7 AC6 / F8 AC3: while Indestructible Shield is active, a laser hit deals no life loss', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.player.postHitInvulnRemaining = 0;
    world.effects.shieldRemaining = 5;
    world.enemyLasers = [
      { id: 1, x: world.player.x + world.player.width / 2, y: world.player.y, radius: 6, active: true },
    ];

    updateCollisions(world);

    expect(world.lives).toBe(3);
  });

  it('a laser that does not overlap the player deals no damage', () => {
    const world = makePlayingWorld();
    world.lives = 3;
    world.enemyLasers = [{ id: 1, x: -9999, y: -9999, radius: 6, active: true }];

    updateCollisions(world);

    expect(world.lives).toBe(3);
  });
});

describe('CollisionSystem - power-up catch (F7)', () => {
  function withPowerUp(type: 'HIT_POWER' | 'SPEED' | 'SHIELD' | 'PERMANENT_MULTIPLIER') {
    const world = makePlayingWorld();
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.powerUps = [{ id: 1, type, x: px, y: py, radius: 12, active: true }];
    return world;
  }

  it('F7 AC3: catching a power-up (colliding with it) activates its effect and deactivates the drop', () => {
    const world = withPowerUp('SHIELD');
    updateCollisions(world);
    expect(world.powerUps[0]!.active).toBe(false);
    expect(world.effects.shieldRemaining).toBeGreaterThan(0);
  });

  it('F7 AC4: 5x Hit Power sets the temporary hitPowerRemaining timer to the full duration', () => {
    const world = withPowerUp('HIT_POWER');
    updateCollisions(world);
    expect(world.effects.hitPowerRemaining).toBe(8);
  });

  it('F7 AC5: 3x Speed sets the temporary speedRemaining timer to the full duration', () => {
    const world = withPowerUp('SPEED');
    updateCollisions(world);
    expect(world.effects.speedRemaining).toBe(8);
  });

  it('F7 AC6: Indestructible Shield sets the temporary shieldRemaining timer to the full duration', () => {
    const world = withPowerUp('SHIELD');
    updateCollisions(world);
    expect(world.effects.shieldRemaining).toBe(8);
  });

  it('F7 AC7: Permanent Hit-Power Multiplier multiplies permanentMultiplier by 1.8 and persists (no timer)', () => {
    const world = withPowerUp('PERMANENT_MULTIPLIER');
    updateCollisions(world);
    expect(world.permanentMultiplier).toBeCloseTo(PERMANENT_MULTIPLIER_PER_CATCH, 10);
  });

  it('F7 AC7: two permanent-multiplier catches stack multiplicatively (1.8 x 1.8 = 3.24)', () => {
    const world = makePlayingWorld();
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.powerUps = [{ id: 1, type: 'PERMANENT_MULTIPLIER', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);
    world.powerUps = [{ id: 2, type: 'PERMANENT_MULTIPLIER', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);
    expect(world.permanentMultiplier).toBeCloseTo(1.8 * 1.8, 10);
  });

  it('F7 AC8: catching a second temporary power-up of the same type refreshes rather than stacking the timer', () => {
    const world = makePlayingWorld();
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;

    world.powerUps = [{ id: 1, type: 'SHIELD', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);
    // Let some time pass (simulated by manually decrementing, since PowerUpSystem
    // owns timer decrement - here we only assert CollisionSystem's refresh behavior).
    world.effects.shieldRemaining = 3;

    world.powerUps = [{ id: 2, type: 'SHIELD', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);

    // Refreshed to a full 8s, not 3 + 8 = 11s (no stacking of duration).
    expect(world.effects.shieldRemaining).toBe(8);
  });

  it('F7 AC9: temporary 5x Hit Power composes with the permanent multiplier (permanent x1.8 x temporary x5 = x9)', () => {
    const world = makePlayingWorld();
    // Establish a permanent multiplier of 1.8 first via a catch.
    const px = world.player.x + world.player.width / 2;
    const py = world.player.y + world.player.height / 2;
    world.powerUps = [{ id: 1, type: 'PERMANENT_MULTIPLIER', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);
    expect(world.permanentMultiplier).toBeCloseTo(1.8, 10);

    // Now catch the temporary 5x Hit Power.
    world.powerUps = [{ id: 2, type: 'HIT_POWER', x: px, y: py, radius: 12, active: true }];
    updateCollisions(world);
    expect(world.effects.hitPowerRemaining).toBeGreaterThan(0);

    // A tough enemy should take round(1.8 * 5) = 9 rounded hit power in one shield hit.
    const enemy = makeEnemy({ id: 99, hitsToKill: 100, x: 100, y: 100 });
    world.enemies = [enemy];
    world.shields = [{ id: 3, x: 110, y: 110, radius: 8, active: true }];
    updateCollisions(world);

    expect(enemy.hitsTaken).toBe(Math.round(1.8 * HIT_POWER_MULTIPLIER));
  });

  it('F10 AC3: catching a power-up awards the flat catch bonus to the score', () => {
    const world = withPowerUp('SPEED');
    world.score = 0;
    updateCollisions(world);
    expect(world.score).toBe(SCORE_POWERUP_BONUS);
  });

  it('an uncaught power-up (no player overlap) is left untouched with no effect applied', () => {
    const world = makePlayingWorld();
    world.powerUps = [{ id: 1, type: 'SHIELD', x: -9999, y: -9999, radius: 12, active: true }];
    updateCollisions(world);
    expect(world.powerUps).toHaveLength(1);
    expect(world.powerUps[0]!.active).toBe(true);
    expect(world.effects.shieldRemaining).toBe(0);
  });
});
