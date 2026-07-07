// Tests PRD §F2 (shield throw) AC1, AC2, AC4, and enemy laser despawn used by F5/F8.

import { describe, expect, it } from 'vitest';
import { updateProjectiles } from './ProjectileSystem';
import { FIXED_DT, PLAYFIELD_HEIGHT, SHIELD_SPEED, THROW_INTERVAL_SECONDS } from '../config/constants';
import { makeInput, makePlayingWorld } from '../test-utils/worldFactory';

describe('ProjectileSystem (F2)', () => {
  it('F2 AC1: pressing throw spawns a shield at the player position traveling up', () => {
    const world = makePlayingWorld();
    expect(world.shields).toHaveLength(0);
    updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    expect(world.shields).toHaveLength(1);
    const shield = world.shields[0]!;
    expect(shield.x).toBeCloseTo(world.player.x + world.player.width / 2, 5);
    // The shield is spawned at player.y, then travels within the same tick it was
    // thrown (updateThrow -> updateShields both run inside updateProjectiles), so
    // after one call it has already moved one step up from the spawn point.
    expect(shield.y).toBeCloseTo(world.player.y - SHIELD_SPEED * FIXED_DT, 5);
  });

  it('F2 AC1: a spawned shield moves straight up (decreasing y) at a constant speed each tick', () => {
    const world = makePlayingWorld();
    updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    const y0 = world.shields[0]!.y;
    updateProjectiles(world, makeInput({ throwHeld: false }), FIXED_DT);
    const y1 = world.shields[0]!.y;
    expect(y1).toBeCloseTo(y0 - SHIELD_SPEED * FIXED_DT, 5);
  });

  it('F2 AC2: holding/mashing throw does not spawn more than one shield within the 250ms window', () => {
    const world = makePlayingWorld();
    // Mash throw every tick (60Hz) for 200ms - well under the 250ms minimum interval.
    const ticksIn200ms = Math.round(0.2 / FIXED_DT);
    for (let i = 0; i < ticksIn200ms; i += 1) {
      updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    }
    expect(world.shields).toHaveLength(1);
  });

  it('F2 AC2: a new shield may spawn again once the 250ms interval elapses', () => {
    const world = makePlayingWorld();
    updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    expect(world.shields).toHaveLength(1);

    // Advance strictly past the 250ms cooldown window before mashing throw again.
    const ticksToClearCooldown = Math.ceil(THROW_INTERVAL_SECONDS / FIXED_DT) + 1;
    for (let i = 0; i < ticksToClearCooldown; i += 1) {
      updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    }
    expect(world.shields.length).toBeGreaterThanOrEqual(2);
  });

  it('F2 AC4: a shield that reaches the top of the playfield is removed (no infinite accumulation)', () => {
    const world = makePlayingWorld();
    updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    expect(world.shields).toHaveLength(1);

    // Advance enough ticks for the shield to travel off the top of the screen.
    const ticksToTop = Math.ceil((world.player.y + 50) / (SHIELD_SPEED * FIXED_DT)) + 5;
    for (let i = 0; i < ticksToTop; i += 1) {
      updateProjectiles(world, makeInput({ throwHeld: false }), FIXED_DT);
    }
    expect(world.shields).toHaveLength(0);
  });

  it('enemy lasers reaching the bottom of the playfield are removed (supports F5/F8 no-accumulation)', () => {
    const world = makePlayingWorld();
    world.enemyLasers.push({ id: 999, x: 100, y: 0, radius: 6, active: true });
    const ticksToBottom = Math.ceil(PLAYFIELD_HEIGHT / (220 * FIXED_DT)) + 10;
    for (let i = 0; i < ticksToBottom; i += 1) {
      updateProjectiles(world, makeInput(), FIXED_DT);
    }
    expect(world.enemyLasers).toHaveLength(0);
  });
});
