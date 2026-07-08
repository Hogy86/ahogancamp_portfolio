// Tests PRD §F7 AC1 (>=1 guaranteed power-up drop per level) end to end through
// CollisionSystem's kill path, since the guarantee is enforced by the interaction
// between levelRuntimeState's budget counter and CollisionSystem's drop roll.

import { describe, expect, it, vi } from 'vitest';
import { updateCollisions } from './CollisionSystem';
import {
  consumeGuaranteedDrop,
  getGuaranteedDropsRemaining,
  resetGuaranteedDrops,
} from './levelRuntimeState';
import { getLevelConfig } from '../config/levelConfig';
import { makePlayingWorld } from '../test-utils/worldFactory';
import type { Enemy, ShieldProjectile } from '../core/types';

function makeEnemy(id: number, overrides: Partial<Enemy> = {}): Enemy {
  return {
    id,
    col: 0,
    row: 0,
    x: 100 + id * 50,
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

function makeShield(overrides: Partial<ShieldProjectile> = {}): ShieldProjectile {
  return {
    id: 1,
    x: 0,
    y: 0,
    radius: 8,
    active: true,
    vx: 0,
    vy: -480,
    lifetimeRemaining: 6,
    lastHitEnemyId: null,
    trail: [],
    ...overrides,
  };
}

describe('levelRuntimeState (F7 AC1 bookkeeping)', () => {
  it('resetGuaranteedDrops sets the remaining budget to the level config value', () => {
    for (let level = 1; level <= 10; level += 1) {
      resetGuaranteedDrops(level);
      expect(getGuaranteedDropsRemaining()).toBe(getLevelConfig(level).guaranteedPowerUpDrops);
    }
  });

  it('consumeGuaranteedDrop decrements the remaining budget, floored at 0', () => {
    resetGuaranteedDrops(1); // guaranteedPowerUpDrops = 1
    expect(getGuaranteedDropsRemaining()).toBe(1);
    consumeGuaranteedDrop();
    expect(getGuaranteedDropsRemaining()).toBe(0);
    consumeGuaranteedDrop(); // must not go negative
    expect(getGuaranteedDropsRemaining()).toBe(0);
  });
});

describe('F7 AC1: at least one power-up is guaranteed to drop per level', () => {
  it('a guaranteed drop occurs on some enemy death within the level even with the extra-drop RNG disabled', () => {
    // Force Math.random() to a value that fails the low-probability "extra drop"
    // roll every time, isolating the guaranteed-drop mechanism from the random one.
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const world = makePlayingWorld(1);
    resetGuaranteedDrops(1);
    expect(getGuaranteedDropsRemaining()).toBe(1);

    // Kill every enemy one at a time via a fresh shield each time, and confirm a
    // power-up drop appears at least once across the whole level clear.
    let dropSeen = false;
    for (const enemy of world.enemies) {
      world.enemies = [enemy];
      world.shields = [makeShield({ id: enemy.id + 1000, x: enemy.x + 10, y: enemy.y + 10 })];
      world.powerUps = [];
      updateCollisions(world);
      if (world.powerUps.length > 0) dropSeen = true;
    }

    expect(dropSeen).toBe(true);
    expect(getGuaranteedDropsRemaining()).toBe(0);

    randomSpy.mockRestore();
  });

  it('once the guaranteed budget is consumed, further deaths do not drop when the extra-roll RNG fails', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99); // fails EXTRA_DROP_CHANCE roll

    const world = makePlayingWorld(1);
    resetGuaranteedDrops(1);

    const enemyA = makeEnemy(1);
    const enemyB = makeEnemy(2);
    world.enemies = [enemyA];
    world.shields = [makeShield({ id: 101, x: enemyA.x + 10, y: enemyA.y + 10 })];
    updateCollisions(world); // consumes the guaranteed drop
    expect(getGuaranteedDropsRemaining()).toBe(0);

    world.enemies = [enemyB];
    world.powerUps = [];
    world.shields = [makeShield({ id: 102, x: enemyB.x + 10, y: enemyB.y + 10 })];
    updateCollisions(world);

    expect(world.powerUps).toHaveLength(0);

    randomSpy.mockRestore();
  });
});
