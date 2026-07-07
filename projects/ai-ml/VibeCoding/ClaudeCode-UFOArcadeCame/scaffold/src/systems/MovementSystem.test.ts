// Tests PRD §F1 (player movement) AC1-AC3, AC5.
// F1 AC4 (input-to-visible-movement latency <=100ms) is an end-to-end timing/frame-rate
// property that cannot be meaningfully asserted against this pure function in isolation
// (it depends on the real RAF cadence achieved in-browser) - see final report note.
// F1 AC5's InputManager-level cancellation is covered separately in InputManager.test.ts;
// this file covers MovementSystem's own handling of an already-cancelled snapshot.

import { describe, expect, it } from 'vitest';
import { updateMovement } from './MovementSystem';
import { PLAYER_BASE_SPEED, PLAYFIELD_WIDTH, FIXED_DT } from '../config/constants';
import { makeInput, makePlayingWorld } from '../test-utils/worldFactory';

describe('MovementSystem (F1)', () => {
  it('F1 AC1: holding Right moves the player right at the base speed', () => {
    const world = makePlayingWorld();
    const startX = world.player.x;
    updateMovement(world, makeInput({ moveRight: true }), FIXED_DT);
    expect(world.player.x).toBeCloseTo(startX + PLAYER_BASE_SPEED * FIXED_DT, 5);
  });

  it('F1 AC1: holding Left moves the player left at the base speed', () => {
    const world = makePlayingWorld();
    const startX = world.player.x;
    updateMovement(world, makeInput({ moveLeft: true }), FIXED_DT);
    expect(world.player.x).toBeCloseTo(startX - PLAYER_BASE_SPEED * FIXED_DT, 5);
  });

  it('F1 AC2: player position is clamped at the left boundary (no wrap, no leaving playfield)', () => {
    const world = makePlayingWorld();
    world.player.x = 0;
    // Push left for a long time - should never go negative.
    for (let i = 0; i < 600; i += 1) {
      updateMovement(world, makeInput({ moveLeft: true }), FIXED_DT);
    }
    expect(world.player.x).toBe(0);
  });

  it('F1 AC2: player position is clamped at the right boundary (no wrap, no leaving playfield)', () => {
    const world = makePlayingWorld();
    const maxX = PLAYFIELD_WIDTH - world.player.width;
    for (let i = 0; i < 600; i += 1) {
      updateMovement(world, makeInput({ moveRight: true }), FIXED_DT);
    }
    expect(world.player.x).toBeCloseTo(maxX, 5);
    expect(world.player.x).toBeLessThanOrEqual(maxX);
  });

  it('F1 AC3: with no movement key held, the player does not drift', () => {
    const world = makePlayingWorld();
    const startX = world.player.x;
    updateMovement(world, makeInput(), FIXED_DT);
    updateMovement(world, makeInput(), FIXED_DT);
    updateMovement(world, makeInput(), FIXED_DT);
    expect(world.player.x).toBe(startX);
  });

  it('F1 AC5: simultaneous opposing keys (Left+Right held) cancel to no net movement', () => {
    const world = makePlayingWorld();
    const startX = world.player.x;
    updateMovement(world, makeInput({ moveLeft: true, moveRight: true }), FIXED_DT);
    expect(world.player.x).toBe(startX);
  });

  it('F7 AC5 interaction: 3x speed power-up increases movement speed while active', () => {
    const world = makePlayingWorld();
    world.effects.speedRemaining = 8;
    const startX = world.player.x;
    updateMovement(world, makeInput({ moveRight: true }), FIXED_DT);
    const movedWithBuff = world.player.x - startX;
    expect(movedWithBuff).toBeCloseTo(PLAYER_BASE_SPEED * 3 * FIXED_DT, 5);
  });
});
