// Implements PRD §F2 (shield throw, spawn + travel + top-of-screen despawn),
// §F5 (enemy laser travel + despawn at player row).

import {
  ENEMY_LASER_SPEED,
  PLAYFIELD_HEIGHT,
  SHIELD_RADIUS,
  SHIELD_SPEED,
  THROW_INTERVAL_SECONDS,
} from '../config/constants';
import type { InputSnapshot } from '../core/InputManager';
import type { World } from '../core/types';

/** F2 AC1-AC2: spawns a shield on throw, gated by the 250ms minimum interval. */
function updateThrow(world: World, input: InputSnapshot, dt: number): void {
  world.player.throwCooldownRemaining = Math.max(0, world.player.throwCooldownRemaining - dt);

  if (!input.throwHeld) return;
  if (world.player.throwCooldownRemaining > 0) return;

  world.player.throwCooldownRemaining = THROW_INTERVAL_SECONDS;
  world.shields.push({
    id: world.nextEntityId++,
    x: world.player.x + world.player.width / 2,
    y: world.player.y,
    radius: SHIELD_RADIUS,
    active: true,
  });
}

/** F2 AC1/AC4: shields travel straight up at constant speed; despawn off the top. */
function updateShields(world: World, dt: number): void {
  for (const shield of world.shields) {
    if (!shield.active) continue;
    shield.y -= SHIELD_SPEED * dt;
    if (shield.y + shield.radius < 0) shield.active = false;
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
  updateThrow(world, input, dt);
  updateShields(world, dt);
  updateEnemyLasers(world, dt);
}
