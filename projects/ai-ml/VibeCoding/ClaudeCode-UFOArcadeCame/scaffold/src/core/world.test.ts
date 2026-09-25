// Tests PRD §F3 AC1 (enemies spawn in a rectangular grid per the level table),
// §F4 AC1-AC3 (HP distribution per level), §F6 AC4/AC5 (Restart Level vs Restart
// Game reset scope), §F10 AC4 (score reset on new run only, not level transitions),
// §F12 AC1/AC3/AC5-AC6 (v2: the boss is never embedded in the starting formation -
// spawnFormation only ever produces regular enemies; enterBossPhase installs the
// single 5x-size boss separately, only when called).

import { describe, expect, it } from 'vitest';
import { createNewRunWorld, enterBossPhase, resetForLevel, spawnFormation } from './world';
import { getLevelConfig } from '../config/levelConfig';
import {
  BOSS_SIZE_MULTIPLIER,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  PLAYER_Y,
  PLAYFIELD_WIDTH,
  STARTING_LIVES,
} from '../config/constants';
import { makePlayingWorld } from '../test-utils/worldFactory';

describe('spawnFormation (F3 AC1, F4 AC1-AC3, F12 AC1/AC3 - no embedded boss)', () => {
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

  it('F4 AC3: level 3 - 50% (+/-1 for odd counts) of regular enemies require 2 hits, the rest 1 hit', () => {
    const enemies = spawnFormation(3);
    const twoHit = enemies.filter((e) => e.hitsToKill === 2).length;
    const oneHit = enemies.filter((e) => e.hitsToKill === 1).length;
    expect(twoHit + oneHit).toBe(enemies.length);
    expect(Math.abs(twoHit - enemies.length / 2)).toBeLessThanOrEqual(1);
  });

  it('F12 AC1/AC3: no level ever embeds a boss in its starting formation - not even levels 5 and 10', () => {
    for (let level = 1; level <= 10; level += 1) {
      const enemies = spawnFormation(level);
      expect(enemies.some((e) => e.isBoss)).toBe(false);
    }
  });

  it('F12 AC3: level 5 and level 10 starting formations contain only the regular hpMix tiers, never an elevated boss-only HP value', () => {
    const level5 = spawnFormation(5);
    expect(level5.every((e) => e.hitsToKill <= 3)).toBe(true); // level 5's toughest regular tier
    const level10 = spawnFormation(10);
    expect(level10.every((e) => e.hitsToKill <= 4)).toBe(true); // level 10's toughest regular tier
  });

  it('every spawned enemy starts alive with zero hits taken', () => {
    const enemies = spawnFormation(5);
    expect(enemies.every((e) => e.alive && e.hitsTaken === 0)).toBe(true);
  });
});

describe('enterBossPhase (F12 AC5-AC6, AC4, AC11)', () => {
  it('F12 AC3: installs exactly one boss enemy as the sole entry in world.enemies', () => {
    const world = makePlayingWorld(5);
    world.enemies = []; // regular formation already cleared

    enterBossPhase(world);

    expect(world.enemies).toHaveLength(1);
    expect(world.enemies[0]!.isBoss).toBe(true);
    expect(world.enemies[0]!.alive).toBe(true);
  });

  it('F12 AC2: the level-5 boss has 15 HP; the level-10 boss has 20 HP', () => {
    const world5 = makePlayingWorld(5);
    world5.enemies = [];
    enterBossPhase(world5);
    expect(world5.enemies[0]!.hitsToKill).toBe(15);

    const world10 = makePlayingWorld(10);
    world10.enemies = [];
    enterBossPhase(world10);
    expect(world10.enemies[0]!.hitsToKill).toBe(20);
  });

  it('F12 AC5: the boss is drawn at 5x the linear dimensions of a regular enemy of the same shape', () => {
    const world = makePlayingWorld(5);
    world.enemies = [];
    enterBossPhase(world);

    expect(world.enemies[0]!.width).toBe(ENEMY_WIDTH * BOSS_SIZE_MULTIPLIER);
    expect(world.enemies[0]!.height).toBe(ENEMY_HEIGHT * BOSS_SIZE_MULTIPLIER);
  });

  it('F12 AC5: the boss spawns fully within the playfield and clear of the player row', () => {
    const world = makePlayingWorld(10);
    world.enemies = [];
    enterBossPhase(world);

    const boss = world.enemies[0]!;
    expect(boss.x).toBeGreaterThanOrEqual(0);
    expect(boss.x + boss.width).toBeLessThanOrEqual(PLAYFIELD_WIDTH);
    expect(boss.y).toBeGreaterThanOrEqual(0);
    expect(boss.y + boss.height).toBeLessThan(PLAYER_Y); // does not reach the player's row at spawn
  });

  it('F12 AC4/AC11: entering the boss phase resets the formation transform and does not trigger the F18 level-intro countdown', () => {
    const world = makePlayingWorld(5);
    world.enemies = [];
    world.formation.offsetX = 250;
    world.formation.offsetY = 80;
    world.formation.direction = -1;
    world.levelIntroRemaining = 3; // sanity: if this were untouched it would wrongly gate play

    enterBossPhase(world);

    expect(world.formation.offsetX).toBe(0);
    expect(world.formation.offsetY).toBe(0);
    expect(world.formation.direction).toBe(1);
    expect(world.levelIntroRemaining).toBe(0);
  });

  it('F12 AC4: entering the boss phase does not touch score, lives, or the permanent multiplier', () => {
    const world = makePlayingWorld(5);
    world.enemies = [];
    world.score = 4200;
    world.lives = 2;
    world.permanentMultiplier = 3.24;

    enterBossPhase(world);

    expect(world.score).toBe(4200);
    expect(world.lives).toBe(2);
    expect(world.permanentMultiplier).toBe(3.24);
    expect(world.level).toBe(5); // level indicator still reads the same level (F12 AC4)
  });
});

describe('createNewRunWorld / resetForLevel (F6 AC4/AC5, F10 AC4)', () => {
  it('F10 AC1: a fresh run starts at score 0 with STARTING_LIVES lives', () => {
    const world = createNewRunWorld();
    expect(world.score).toBe(0);
    expect(world.lives).toBe(STARTING_LIVES);
    expect(world.permanentMultiplier).toBe(1);
  });

  it('F18 AC1: a fresh run world starts with the full level-intro countdown armed', () => {
    const world = createNewRunWorld();
    expect(world.levelIntroRemaining).toBeGreaterThan(0);
  });

  it('F12: a fresh run world starts with bossPhase NONE and no boss-warning time armed', () => {
    const world = createNewRunWorld();
    expect(world.bossPhase).toBe('NONE');
    expect(world.bossWarningRemaining).toBe(0);
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

  it('F6 AC4: resetForLevel resets level-scoped state (enemies, projectiles, power-ups, effects, boss phase)', () => {
    const world = createNewRunWorld();
    world.shields = [
      {
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
      },
    ];
    world.enemyLasers = [{ id: 1, x: 0, y: 0, radius: 6, active: true }];
    world.powerUps = [{ id: 1, type: 'SPEED', x: 0, y: 0, radius: 12, active: true }];
    world.effects = { type: 'SHIELD', remaining: 5 };
    world.formationWarningActive = true;
    world.bossPhase = 'WARNING';
    world.bossWarningRemaining = 1.2;

    resetForLevel(world, 1);

    expect(world.shields).toHaveLength(0);
    expect(world.enemyLasers).toHaveLength(0);
    expect(world.powerUps).toHaveLength(0);
    expect(world.effects).toEqual({ type: null, remaining: 0 });
    expect(world.formationWarningActive).toBe(false);
    expect(world.bossPhase).toBe('NONE');
    expect(world.bossWarningRemaining).toBe(0);
  });

  it('F18 AC9: resetForLevel itself does NOT set levelIntroRemaining - call sites (Restart Level vs level-advance) decide that separately', () => {
    const world = createNewRunWorld();
    world.levelIntroRemaining = 0; // simulate mid-play, intro already elapsed

    resetForLevel(world, world.level);

    // resetForLevel leaves whatever the caller had - it is not resetForLevel's job
    // to arm or skip the countdown (F18 AC9: Restart Level and level-advance need
    // opposite behavior here, so each call site sets this explicitly afterward).
    expect(world.levelIntroRemaining).toBe(0);
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
