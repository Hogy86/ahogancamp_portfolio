// Tests PRD §F2 AC1 (throw spawns a shield travelling up), §F16 (one-shield-in-flight
// gate replaces the v1 250ms cooldown; any-edge despawn; max-lifetime safety valve),
// and enemy laser despawn used by F5/F8.

import { describe, expect, it } from 'vitest';
import { updateProjectiles } from './ProjectileSystem';
import {
  FIXED_DT,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
  SHIELD_MAX_LIFETIME_SECONDS,
  SHIELD_SPEED,
} from '../config/constants';
import { makeInput, makePlayingWorld } from '../test-utils/worldFactory';

describe('ProjectileSystem (F2 AC1, F16)', () => {
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

  it('F16 AC3: mashing throw while a shield is already in flight spawns nothing - no queueing, no stacking', () => {
    const world = makePlayingWorld();
    updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    expect(world.shields).toHaveLength(1);
    const firstId = world.shields[0]!.id;

    // Mash throw every tick, but only for a window well under the unobstructed
    // exit time (~1.17s open-field) so the original shield is still genuinely in
    // flight throughout - this isolates the in-flight gate itself from the
    // separate (and separately tested) 'a new shield may be thrown once the
    // current one leaves play' behavior.
    const ticksWellUnderExitTime = Math.round(0.5 / FIXED_DT);
    for (let i = 0; i < ticksWellUnderExitTime; i += 1) {
      updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    }

    expect(world.shields).toHaveLength(1);
    expect(world.shields[0]!.id).toBe(firstId);
  });

  it('F16 AC3/AC4a: a new shield may be thrown once the current one leaves play by exiting the screen', () => {
    const world = makePlayingWorld();
    updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    expect(world.shields).toHaveLength(1);

    // Advance enough ticks for the shield to travel off the top of the screen.
    const ticksToTop = Math.ceil((world.player.y + 50) / (SHIELD_SPEED * FIXED_DT)) + 5;
    for (let i = 0; i < ticksToTop; i += 1) {
      updateProjectiles(world, makeInput({ throwHeld: false }), FIXED_DT);
    }
    expect(world.shields).toHaveLength(0);

    // The throw gate is now open again.
    updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    expect(world.shields).toHaveLength(1);
  });

  it('F16 AC4a/AC5: a shield exits (and is removed, never reflected) via the left edge', () => {
    const world = makePlayingWorld();
    world.shields = [
      {
        id: 1,
        x: 20,
        y: 300,
        radius: 8,
        active: true,
        vx: -SHIELD_SPEED,
        vy: 0,
        lifetimeRemaining: SHIELD_MAX_LIFETIME_SECONDS,
        lastHitEnemyId: null,
        trail: [],
      },
    ];
    for (let i = 0; i < 20; i += 1) {
      updateProjectiles(world, makeInput(), FIXED_DT);
    }
    expect(world.shields).toHaveLength(0);
  });

  it('F16 AC4a/AC5: a shield exits (and is removed, never reflected) via the right edge', () => {
    const world = makePlayingWorld();
    world.shields = [
      {
        id: 1,
        x: PLAYFIELD_WIDTH - 20,
        y: 300,
        radius: 8,
        active: true,
        vx: SHIELD_SPEED,
        vy: 0,
        lifetimeRemaining: SHIELD_MAX_LIFETIME_SECONDS,
        lastHitEnemyId: null,
        trail: [],
      },
    ];
    for (let i = 0; i < 20; i += 1) {
      updateProjectiles(world, makeInput(), FIXED_DT);
    }
    expect(world.shields).toHaveLength(0);
  });

  it('F16 AC4a/AC5: a shield exits (and is removed, never reflected) via the bottom edge (e.g. after a corner bounce sends it downward)', () => {
    const world = makePlayingWorld();
    world.shields = [
      {
        id: 1,
        x: 300,
        y: PLAYFIELD_HEIGHT - 20,
        radius: 8,
        active: true,
        vx: 0,
        vy: SHIELD_SPEED,
        lifetimeRemaining: SHIELD_MAX_LIFETIME_SECONDS,
        lastHitEnemyId: null,
        trail: [],
      },
    ];
    for (let i = 0; i < 20; i += 1) {
      updateProjectiles(world, makeInput(), FIXED_DT);
    }
    expect(world.shields).toHaveLength(0);
  });

  it('F16 AC4d / Item E: the max-lifetime safety valve despawns a shield even mid-screen, never having touched an edge', () => {
    const world = makePlayingWorld();
    world.shields = [
      {
        id: 1,
        x: PLAYFIELD_WIDTH / 2,
        y: PLAYFIELD_HEIGHT / 2,
        radius: 8,
        active: true,
        vx: 0,
        vy: 0, // stationary - only the lifetime valve can remove it, not an edge exit
        lifetimeRemaining: FIXED_DT / 2, // expires on the very next tick
        lastHitEnemyId: null,
        trail: [],
      },
    ];

    updateProjectiles(world, makeInput(), FIXED_DT);

    expect(world.shields).toHaveLength(0);
  });

  it('F16 AC4d / Item E: the safety valve reopens the one-in-flight throw gate', () => {
    const world = makePlayingWorld();
    world.shields = [
      {
        id: 1,
        x: PLAYFIELD_WIDTH / 2,
        y: PLAYFIELD_HEIGHT / 2,
        radius: 8,
        active: true,
        vx: 0,
        vy: 0,
        lifetimeRemaining: FIXED_DT / 2,
        lastHitEnemyId: null,
        trail: [],
      },
    ];

    updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT); // expires this same tick
    expect(world.shields).toHaveLength(0); // note: updateThrow ran first and saw a shield present, so it did not spawn

    updateProjectiles(world, makeInput({ throwHeld: true }), FIXED_DT);
    expect(world.shields).toHaveLength(1); // gate is open again on the following tick
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
