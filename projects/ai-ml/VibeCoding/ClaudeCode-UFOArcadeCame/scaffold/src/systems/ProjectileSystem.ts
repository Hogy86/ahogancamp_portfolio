// Implements PRD §F2 (shield throw), §F15 (bounce - direction changes applied by
// CollisionSystem, this file only moves shields along their current velocity), §F16
// (lifecycle: one-in-flight gate, any-edge despawn, max-lifetime safety valve), §F5 (enemy
// laser travel + despawn at player row).

import {
  ENEMY_LASER_SPEED,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
  SHIELD_MAX_LIFETIME_SECONDS,
  SHIELD_RADIUS,
  SHIELD_SPEED,
  SHIELD_TRAIL_LENGTH,
} from '../config/constants';
import type { InputSnapshot } from '../core/InputManager';
import type { World } from '../core/types';

/** F16 AC3: one shield in flight at a time is the sole throw gate (replaces v1's 250ms
 * cooldown). Pressing throw while a shield is already active does nothing - no queueing. */
function updateThrow(world: World, input: InputSnapshot): void {
  if (!input.throwHeld) return;
  if (world.shields.length > 0) return;

  world.shields.push({
    id: world.nextEntityId++,
    x: world.player.x + world.player.width / 2,
    y: world.player.y,
    radius: SHIELD_RADIUS,
    active: true,
    vx: 0,
    vy: -SHIELD_SPEED,
    lifetimeRemaining: SHIELD_MAX_LIFETIME_SECONDS,
    lastHitEnemyId: null,
    trail: [],
  });
}

/** F15 AC6: shields travel at their current velocity (direction set by CollisionSystem's
 * bounce resolution, magnitude always SHIELD_SPEED). F16 AC4a/AC4d/AC5: despawns on exiting
 * any screen edge (not just the top - a bounced shield can leave via any side) or on
 * reaching its max-lifetime safety valve; it never reflects off a wall (F16 AC5). */
function updateShields(world: World, dt: number): void {
  for (const shield of world.shields) {
    if (!shield.active) continue;

    // F15 AC9: record the pre-move position as a trail point (rendering aid only), capped
    // at SHIELD_TRAIL_LENGTH, oldest shifted off first.
    shield.trail.push({ x: shield.x, y: shield.y });
    if (shield.trail.length > SHIELD_TRAIL_LENGTH) shield.trail.shift();

    shield.x += shield.vx * dt;
    shield.y += shield.vy * dt;
    shield.lifetimeRemaining = Math.max(0, shield.lifetimeRemaining - dt);

    const exitedScreen =
      shield.x + shield.radius < 0 ||
      shield.x - shield.radius > PLAYFIELD_WIDTH ||
      shield.y + shield.radius < 0 ||
      shield.y - shield.radius > PLAYFIELD_HEIGHT;

    if (exitedScreen || shield.lifetimeRemaining <= 0) shield.active = false;
  }
  world.shields = world.shields.filter((s) => s.active);
}

/** Enemy lasers travel straight down; despawn off the bottom (they may also be
 * consumed by CollisionSystem on hitting the player). */
function updateEnemyLasers(world: World, dt: number): void {
  for (const laser of world.enemyLasers) {
    if (!laser.active) continue;
    laser.y += ENEMY_LASER_SPEED * dt;
    if (laser.y - laser.radius > PLAYFIELD_HEIGHT) laser.active = false;
  }
  world.enemyLasers = world.enemyLasers.filter((l) => l.active);
}

export function updateProjectiles(world: World, input: InputSnapshot, dt: number): void {
  updateThrow(world, input);
  updateShields(world, dt);
  updateEnemyLasers(world, dt);
}
