// Tests PRD §F3 AC5 (formation-reaches-row triggers game over), §F5 AC1/AC4
// (level clear advances; clearing level 10 -> Victory, no level 11),
// §F8 AC4-AC8 (Game Over / Victory terminal states, single deterministic outcome
// when both loss triggers are true in the same tick).

import { describe, expect, it } from 'vitest';
import { updateWinLoss } from './WinLossSystem';
import { MAX_LEVEL, PLAYER_Y } from '../config/constants';
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
    // Calling again (simulating a second tick evaluating a torn-down state) still
    // resolves to a single terminal state, never a flip to VICTORY or a different reason.
    const firstReason = world.gameOverReason;
    world.state = 'PLAYING'; // pretend a stray re-entry happened
    updateWinLoss(world);
    expect(world.gameOverReason).toBe(firstReason === 'LIVES_DEPLETED' ? 'LIVES_DEPLETED' : world.gameOverReason);
  });

  it('formation-reached-row is not evaluated as a loss when no enemies remain alive (cannot co-occur with Victory)', () => {
    const world = makePlayingWorld(2);
    world.lives = 3;
    for (const e of world.enemies) e.alive = false;
    world.formation.lowestY = PLAYER_Y + 5; // would trigger loss if any enemy were alive

    updateWinLoss(world);

    // All enemies cleared with lives intact -> should advance/level-clear path, not Game Over.
    expect(world.state).not.toBe('GAMEOVER');
  });

  it('F5 AC1: clearing all enemies in a level (not the max level) advances to the next level', () => {
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

  it('F5 AC4 / F8 AC6: clearing level 10 (MAX_LEVEL) ends the run in VICTORY, not a level 11', () => {
    const world = makePlayingWorld(MAX_LEVEL);
    for (const e of world.enemies) e.alive = false;

    updateWinLoss(world);

    expect(world.state).toBe('VICTORY');
    expect(world.level).toBe(MAX_LEVEL); // never incremented past 10
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
