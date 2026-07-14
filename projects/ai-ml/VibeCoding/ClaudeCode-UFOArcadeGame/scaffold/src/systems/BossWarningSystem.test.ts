// Tests PRD §F12 AC10-AC11 (the ~1.75s "BOSS INCOMING" telegraph counts down and then
// spawns the boss/flips the phase to ACTIVE) and §F12 AC5-AC6 (the spawned boss is 5x
// size, boss-unique color/HP, spawned clear of the HUD/player row). F12 AC11's "player
// retains full move/throw control during the cue" is covered end-to-end in
// GameLoop.test.ts, since that property depends on GameLoop's system ordering, not on
// this system in isolation.

import { describe, expect, it } from 'vitest';
import { updateBossWarning } from './BossWarningSystem';
import {
  BOSS_SIZE_MULTIPLIER,
  BOSS_WARNING_SECONDS,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  FIXED_DT,
  PLAYER_Y,
  PLAYFIELD_WIDTH,
} from '../config/constants';
import { makePlayingWorld } from '../test-utils/worldFactory';

describe('BossWarningSystem (F12 AC10-AC11)', () => {
  it('is a no-op when bossPhase is NONE', () => {
    const world = makePlayingWorld(5);
    world.bossPhase = 'NONE';
    world.bossWarningRemaining = 0;
    const enemiesBefore = world.enemies;

    updateBossWarning(world, FIXED_DT);

    expect(world.bossPhase).toBe('NONE');
    expect(world.enemies).toBe(enemiesBefore); // regular formation array untouched, no boss installed
  });

  it('is a no-op when bossPhase is already ACTIVE (does not re-spawn the boss)', () => {
    const world = makePlayingWorld(5);
    world.enemies = [];
    world.bossPhase = 'ACTIVE';
    world.bossWarningRemaining = 0;

    updateBossWarning(world, FIXED_DT);

    expect(world.enemies).toHaveLength(0); // still no boss installed by this system
    expect(world.bossPhase).toBe('ACTIVE');
  });

  it('counts down bossWarningRemaining while WARNING, without spawning the boss before it completes', () => {
    const world = makePlayingWorld(5);
    world.enemies = [];
    world.bossPhase = 'WARNING';
    world.bossWarningRemaining = BOSS_WARNING_SECONDS;

    updateBossWarning(world, FIXED_DT);

    expect(world.bossWarningRemaining).toBeCloseTo(BOSS_WARNING_SECONDS - FIXED_DT, 5);
    expect(world.bossPhase).toBe('WARNING');
    expect(world.enemies).toHaveLength(0); // boss not spawned yet
  });

  it('F12 AC3/AC11: once the warning timer completes, spawns the single boss and flips bossPhase to ACTIVE', () => {
    const world = makePlayingWorld(5);
    world.enemies = [];
    world.bossPhase = 'WARNING';
    world.bossWarningRemaining = BOSS_WARNING_SECONDS;

    const ticks = Math.ceil(BOSS_WARNING_SECONDS / FIXED_DT) + 2;
    for (let i = 0; i < ticks; i += 1) updateBossWarning(world, FIXED_DT);

    expect(world.bossPhase).toBe('ACTIVE');
    expect(world.bossWarningRemaining).toBe(0);
    expect(world.enemies).toHaveLength(1);
    expect(world.enemies[0]!.isBoss).toBe(true);
  });

  it('F12 AC2: the spawned boss on level 5 has 15 HP; on level 10 has 20 HP', () => {
    const world5 = makePlayingWorld(5);
    world5.enemies = [];
    world5.bossPhase = 'WARNING';
    world5.bossWarningRemaining = FIXED_DT / 2;
    updateBossWarning(world5, FIXED_DT);
    expect(world5.enemies[0]!.hitsToKill).toBe(15);

    const world10 = makePlayingWorld(10);
    world10.enemies = [];
    world10.bossPhase = 'WARNING';
    world10.bossWarningRemaining = FIXED_DT / 2;
    updateBossWarning(world10, FIXED_DT);
    expect(world10.enemies[0]!.hitsToKill).toBe(20);
  });

  it('F12 AC5: the spawned boss is 5x the linear size of a regular enemy and spawns clear of the playfield/HUD/player row', () => {
    const world = makePlayingWorld(5);
    world.enemies = [];
    world.bossPhase = 'WARNING';
    world.bossWarningRemaining = FIXED_DT / 2;

    updateBossWarning(world, FIXED_DT);

    const boss = world.enemies[0]!;
    expect(boss.width).toBe(ENEMY_WIDTH * BOSS_SIZE_MULTIPLIER);
    expect(boss.height).toBe(ENEMY_HEIGHT * BOSS_SIZE_MULTIPLIER);
    expect(boss.x).toBeGreaterThanOrEqual(0);
    expect(boss.x + boss.width).toBeLessThanOrEqual(PLAYFIELD_WIDTH);
    expect(boss.y).toBeGreaterThanOrEqual(0);
    expect(boss.y + boss.height).toBeLessThan(PLAYER_Y);
  });

  it('F12 AC4/AC11: spawning the boss does not arm the F18 level-intro countdown (it stays 0, not a fresh level start)', () => {
    const world = makePlayingWorld(5);
    world.enemies = [];
    world.bossPhase = 'WARNING';
    world.bossWarningRemaining = FIXED_DT / 2;
    world.levelIntroRemaining = 0;

    updateBossWarning(world, FIXED_DT);

    expect(world.levelIntroRemaining).toBe(0);
  });
});
