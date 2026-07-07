// Tests PRD §F3 AC1 (enemies spawn in a rectangular grid per the level table),
// §F4 AC1-AC3 (HP distribution per level), §F6 AC4/AC5 (Restart Level vs Restart
// Game reset scope), §F10 AC4 (score reset on new run only, not level transitions).

import { describe, expect, it } from 'vitest';
import { createNewRunWorld, resetForLevel, spawnFormation } from './world';
import { getLevelConfig } from '../config/levelConfig';
import { STARTING_LIVES } from '../config/constants';

describe('spawnFormation (F3 AC1, F4 AC1-AC3)', () => {
  it('F3 AC1: spawns rows x cols enemies matching the level config', () => {
    for (let level = 1; level <= 10; level += 1) {
      const config = getLevelConfig(level);
      const enemies = spawnFormation(level);
      expect(enemies).toHaveLength(config.rows * config.cols);
    }
  });

  it('F4 AC1: level 1 - every enemy requires exactly 1 hit, no boss', () => {
    const enemies = spawnFormation(1);
    expect(enemies.every((e) => e.hitsToKill === 1)).toBe(true);
    expect(enemies.some((e) => e.isBoss)).toBe(false);
  });

  it('F4 AC2: level 2 - exactly one enemy (the boss) requires 2 hits; every other enemy requires 1 hit', () => {
    const enemies = spawnFormation(2);
    const bosses = enemies.filter((e) => e.isBoss);
    expect(bosses).toHaveLength(1);
    expect(bosses[0]!.hitsToKill).toBe(2);
    const nonBoss = enemies.filter((e) => !e.isBoss);
    expect(nonBoss.every((e) => e.hitsToKill === 1)).toBe(true);
  });

  it('F4 AC3: level 3 - 50% (+/-1 for odd counts) of regular enemies require 2 hits, the rest 1 hit', () => {
    const enemies = spawnFormation(3);
    const nonBoss = enemies.filter((e) => !e.isBoss);
    const twoHit = nonBoss.filter((e) => e.hitsToKill === 2).length;
    const oneHit = nonBoss.filter((e) => e.hitsToKill === 1).length;
    expect(twoHit + oneHit).toBe(nonBoss.length);
    expect(Math.abs(twoHit - nonBoss.length / 2)).toBeLessThanOrEqual(1);
  });

  it('F4: level 10 has a single boss with the elevated boss HP (12) distinct from regular tiers', () => {
    const enemies = spawnFormation(10);
    const bosses = enemies.filter((e) => e.isBoss);
    expect(bosses).toHaveLength(1);
    expect(bosses[0]!.hitsToKill).toBe(12);
  });

  it('every spawned enemy starts alive with zero hits taken', () => {
    const enemies = spawnFormation(5);
    expect(enemies.every((e) => e.alive && e.hitsTaken === 0)).toBe(true);
  });
});

describe('createNewRunWorld / resetForLevel (F6 AC4/AC5, F10 AC4)', () => {
  it('F10 AC1: a fresh run starts at score 0 with STARTING_LIVES lives', () => {
    const world = createNewRunWorld();
    expect(world.score).toBe(0);
    expect(world.lives).toBe(STARTING_LIVES);
    expect(world.permanentMultiplier).toBe(1);
  });

  it('F6 AC4: resetForLevel (Restart Level) does NOT reset score, lives, or permanent multiplier', () => {
    const world = createNewRunWorld();
    world.score = 500;
    world.lives = 1;
    world.permanentMultiplier = 3.24;

    resetForLevel(world, world.level);

    expect(world.score).toBe(500);
    expect(world.lives).toBe(1);
    expect(world.permanentMultiplier).toBe(3.24);
  });

  it('F6 AC4: resetForLevel resets level-scoped state (enemies, projectiles, power-ups, timers)', () => {
    const world = createNewRunWorld();
    world.shields = [{ id: 1, x: 0, y: 0, radius: 8, active: true }];
    world.enemyLasers = [{ id: 1, x: 0, y: 0, radius: 6, active: true }];
    world.powerUps = [{ id: 1, type: 'SPEED', x: 0, y: 0, radius: 12, active: true }];
    world.effects = { hitPowerRemaining: 5, speedRemaining: 5, shieldRemaining: 5 };
    world.formationWarningActive = true;

    resetForLevel(world, 1);

    expect(world.shields).toHaveLength(0);
    expect(world.enemyLasers).toHaveLength(0);
    expect(world.powerUps).toHaveLength(0);
    expect(world.effects).toEqual({ hitPowerRemaining: 0, speedRemaining: 0, shieldRemaining: 0 });
    expect(world.formationWarningActive).toBe(false);
  });

  it('F10 AC4: score is preserved across level transitions (only Restart Game/new-run resets it)', () => {
    const world = createNewRunWorld();
    world.score = 1200;
    resetForLevel(world, 2); // simulates advancing a level, not restarting the game
    expect(world.score).toBe(1200);
  });

  it('F6 AC5: Restart Game semantics (a brand-new World) reset score, lives, and permanent multiplier to defaults', () => {
    const fresh = createNewRunWorld();
    expect(fresh.score).toBe(0);
    expect(fresh.lives).toBe(STARTING_LIVES);
    expect(fresh.permanentMultiplier).toBe(1);
  });
});
