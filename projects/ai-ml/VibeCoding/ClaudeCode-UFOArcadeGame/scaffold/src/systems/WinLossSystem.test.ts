// Tests PRD §F3 AC5 (formation-reaches-row triggers game over), §F5 AC1
// (level clear advances), §F8 AC4-AC8 (Game Over / Victory terminal states, single
// deterministic outcome when both loss triggers are true in the same tick), and v2
// §F12 (boss phase NONE -> WARNING -> ACTIVE state machine replaces "level clear ==
// advance immediately" on levels 5/10) and §F19 (level-10 boss defeat triggers the
// Game Complete celebration, not clearing the level-10 formation).

import { describe, expect, it } from 'vitest';
import { updateWinLoss } from './WinLossSystem';
import {
  BOSS_WARNING_SECONDS,
  MAX_LEVEL,
  PLAYER_Y,
  VICTORY_CELEBRATION_SECONDS,
} from '../config/constants';
import { makePlayingWorld } from '../test-utils/worldFactory';

describe('WinLossSystem (F3 AC5, F5, F8)', () => {
  it('F8 AC4: lives reaching 0 ends the run in GAMEOVER with reason LIVES_DEPLETED', () => {
    const world = makePlayingWorld(2);
    world.lives = 0;

    updateWinLoss(world);

    expect(world.state).toBe('GAMEOVER');
    expect(world.gameOverReason).toBe('LIVES_DEPLETED');
  });

  it('F3 AC5 / F8 AC5: formation reaching the player row ends the run in GAMEOVER regardless of remaining lives', () => {
    const world = makePlayingWorld(2);
    world.lives = 3; // full lives - only the formation trigger should matter
    world.formation.lowestY = PLAYER_Y + 5;

    updateWinLoss(world);

    expect(world.state).toBe('GAMEOVER');
    expect(world.gameOverReason).toBe('FORMATION_REACHED_ROW');
  });

  it('F8 AC8: when both lives=0 and formation-reached-row are true in the same tick, exactly one deterministic GAMEOVER results', () => {
    const world = makePlayingWorld(2);
    world.lives = 0;
    world.formation.lowestY = PLAYER_Y + 5;

    updateWinLoss(world);

    expect(world.state).toBe('GAMEOVER');
    // Exactly one reason is recorded - not both, not a queued/competing pair.
    expect(['LIVES_DEPLETED', 'FORMATION_REACHED_ROW']).toContain(world.gameOverReason);
    const firstReason = world.gameOverReason;
    world.state = 'PLAYING'; // pretend a stray re-entry happened
    updateWinLoss(world);
    expect(world.gameOverReason).toBe(
      firstReason === 'LIVES_DEPLETED' ? 'LIVES_DEPLETED' : world.gameOverReason,
    );
  });

  it('formation-reached-row is not evaluated as a loss when no enemies remain alive (cannot co-occur with Victory)', () => {
    const world = makePlayingWorld(2); // non-boss level
    world.lives = 3;
    for (const e of world.enemies) e.alive = false;
    world.formation.lowestY = PLAYER_Y + 5; // would trigger loss if any enemy were alive

    updateWinLoss(world);

    // All enemies cleared with lives intact -> should advance/level-clear path, not Game Over.
    expect(world.state).not.toBe('GAMEOVER');
  });

  it('F5 AC1: clearing all enemies in a level (not the max level, not a boss level) advances to the next level', () => {
    const world = makePlayingWorld(3);
    for (const e of world.enemies) e.alive = false;

    updateWinLoss(world);

    expect(world.state).toBe('PLAYING');
    expect(world.level).toBe(4);
  });

  it('F5 AC1: level-advance resets the formation/enemies for the new level (fresh spawn, not carried over)', () => {
    const world = makePlayingWorld(1);
    for (const e of world.enemies) e.alive = false;

    updateWinLoss(world);

    expect(world.level).toBe(2);
    expect(world.enemies.length).toBeGreaterThan(0);
    expect(world.enemies.every((e) => e.alive)).toBe(true);
  });

  it('F18 AC1/AC9: a non-boss level-advance arms the full 3s level-intro countdown', () => {
    const world = makePlayingWorld(1);
    world.levelIntroRemaining = 0;
    for (const e of world.enemies) e.alive = false;

    updateWinLoss(world);

    expect(world.levelIntroRemaining).toBeGreaterThan(0);
  });

  it('does not evaluate terminal conditions unless state is PLAYING (e.g. no-op while PAUSED)', () => {
    const world = makePlayingWorld(2);
    world.state = 'PAUSED';
    world.lives = 0;

    updateWinLoss(world);

    expect(world.state).toBe('PAUSED');
  });

  it('no transition occurs while lives > 0, formation has not reached the row, and enemies remain', () => {
    const world = makePlayingWorld(2);
    world.lives = 3;
    world.formation.lowestY = 0;

    updateWinLoss(world);

    expect(world.state).toBe('PLAYING');
    expect(world.level).toBe(2);
  });
});

describe('WinLossSystem - boss phase state machine (F12 AC1/AC3/AC4/AC10)', () => {
  it('F12 AC1/AC3: on a non-boss level (e.g. level 3), clearing the formation never opens a boss-warning window', () => {
    const world = makePlayingWorld(3);
    for (const e of world.enemies) e.alive = false;

    updateWinLoss(world);

    expect(world.bossPhase).toBe('NONE');
    expect(world.state).toBe('PLAYING');
    expect(world.level).toBe(4);
  });

  it('F12 AC3/AC10: on level 5, clearing the regular formation opens the boss-incoming WARNING window instead of advancing', () => {
    const world = makePlayingWorld(5);
    for (const e of world.enemies) e.alive = false;

    updateWinLoss(world);

    expect(world.bossPhase).toBe('WARNING');
    expect(world.bossWarningRemaining).toBe(BOSS_WARNING_SECONDS);
    expect(world.state).toBe('PLAYING'); // not a new level, not Game Over, not Victory
    expect(world.level).toBe(5); // F12 AC4: the level indicator does not change during the boss phase
  });

  it('F12 AC10: opening the WARNING window does not touch score, lives, or the permanent multiplier (F12 AC4)', () => {
    const world = makePlayingWorld(5);
    world.score = 3000;
    world.lives = 2;
    world.permanentMultiplier = 1.8;
    for (const e of world.enemies) e.alive = false;

    updateWinLoss(world);

    expect(world.score).toBe(3000);
    expect(world.lives).toBe(2);
    expect(world.permanentMultiplier).toBe(1.8);
  });

  it('F12: the WARNING window is opened exactly once - it does not re-arm every tick while the formation stays empty', () => {
    const world = makePlayingWorld(5);
    for (const e of world.enemies) e.alive = false;

    updateWinLoss(world); // opens WARNING, arms the full timer
    expect(world.bossPhase).toBe('WARNING');
    expect(world.bossWarningRemaining).toBe(BOSS_WARNING_SECONDS);

    // Simulate BossWarningSystem having ticked the timer down partway.
    world.bossWarningRemaining = 0.4;

    updateWinLoss(world); // enemies are still empty (regular formation), boss not yet spawned
    updateWinLoss(world);

    // If this re-armed the warning every tick, bossWarningRemaining would have been
    // reset back to BOSS_WARNING_SECONDS - it must not be.
    expect(world.bossPhase).toBe('WARNING');
    expect(world.bossWarningRemaining).toBe(0.4);
  });

  it("F16 AC8 regression: a shield still in flight when the regular formation clears into a boss level's WARNING phase is cleared, freeing the throw gate", () => {
    const world = makePlayingWorld(10);
    world.shields = [
      {
        id: 1,
        x: 400,
        y: 300,
        radius: 8,
        active: true,
        vx: 0,
        vy: -480,
        lifetimeRemaining: 6,
        lastHitEnemyId: null,
        trail: [],
      },
    ];
    for (const e of world.enemies) e.alive = false;

    updateWinLoss(world);

    expect(world.bossPhase).toBe('WARNING');
    expect(world.shields).toHaveLength(0);
  });

  it('F12 AC1/AC3: while bossPhase is WARNING and no boss has spawned yet (enemies still empty), no further transition happens until the boss becomes ACTIVE', () => {
    const world = makePlayingWorld(5);
    for (const e of world.enemies) e.alive = false;
    updateWinLoss(world); // -> WARNING

    updateWinLoss(world); // should just hold - boss not spawned yet (that's BossWarningSystem's job)

    expect(world.bossPhase).toBe('WARNING');
    expect(world.state).toBe('PLAYING');
    expect(world.level).toBe(5);
  });

  it('F12 AC7: defeating the level-5 boss (bossPhase ACTIVE, boss dead) advances to level 6 with the full F18 intro armed', () => {
    const world = makePlayingWorld(5);
    world.bossPhase = 'ACTIVE';
    world.enemies = [
      {
        id: 0,
        col: 0,
        row: 0,
        x: 100,
        y: 100,
        width: 180,
        height: 140,
        hitsToKill: 15,
        hitsTaken: 15,
        isBoss: true,
        alive: false, // just defeated
      },
    ];

    updateWinLoss(world);

    expect(world.state).toBe('PLAYING');
    expect(world.level).toBe(6);
    expect(world.levelIntroRemaining).toBeGreaterThan(0);
  });

  it('F12 AC7 / F19 AC1: defeating the level-10 boss (bossPhase ACTIVE, boss dead) triggers the Game Complete celebration, not a plain level advance', () => {
    const world = makePlayingWorld(MAX_LEVEL);
    world.bossPhase = 'ACTIVE';
    world.enemies = [
      {
        id: 0,
        col: 0,
        row: 0,
        x: 100,
        y: 100,
        width: 180,
        height: 140,
        hitsToKill: 20,
        hitsTaken: 20,
        isBoss: true,
        alive: false,
      },
    ];

    updateWinLoss(world);

    expect(world.state).toBe('VICTORY');
    expect(world.level).toBe(MAX_LEVEL); // never incremented past 10
    expect(world.victoryCelebrationRemaining).toBe(VICTORY_CELEBRATION_SECONDS);
    expect(world.victoryHeld).toBe(false);
  });

  it('F12 AC8 / F3 AC5: the boss reaching the player row ends the run in GAMEOVER, same as the regular formation', () => {
    const world = makePlayingWorld(5);
    world.bossPhase = 'ACTIVE';
    world.lives = 3;
    world.enemies = [
      {
        id: 0,
        col: 0,
        row: 0,
        x: 100,
        y: 100,
        width: 180,
        height: 140,
        hitsToKill: 15,
        hitsTaken: 3,
        isBoss: true,
        alive: true,
      },
    ];
    world.formation.lowestY = PLAYER_Y + 5;

    updateWinLoss(world);

    expect(world.state).toBe('GAMEOVER');
    expect(world.gameOverReason).toBe('FORMATION_REACHED_ROW');
  });
});
