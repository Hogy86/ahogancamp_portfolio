// Implements PRD §F7 AC2 (constant fall speed), §F7 AC3 (uncaught drops removed with
// no effect), §F7 AC4-AC6 (temporary effect timers decrement, remaining-duration
// pattern per ADR-0002 decision 5 - never wall-clock).

import { POWERUP_FALL_SPEED, PLAYFIELD_HEIGHT } from '../config/constants';
import type { World } from '../core/types';

/** Advances falling power-ups and despawns any that reach the bottom uncaught. */
function updateFalling(world: World, dt: number): void {
  for (const p of world.powerUps) {
    if (!p.active) continue;
    p.y += POWERUP_FALL_SPEED * dt;
    if (p.y - p.radius > PLAYFIELD_HEIGHT) p.active = false; // F7 AC3: no effect applied.
  }
  world.powerUps = world.powerUps.filter((p) => p.active);
}

/** Decrements all timed effects by dt. Only ever called from update() while
 * state == PLAYING, so pause cannot leak wall-clock time into these counters
 * (ADR-0002 decision 3/5). */
function updateTimers(world: World, dt: number): void {
  world.effects.hitPowerRemaining = Math.max(0, world.effects.hitPowerRemaining - dt);
  world.effects.speedRemaining = Math.max(0, world.effects.speedRemaining - dt);
  world.effects.shieldRemaining = Math.max(0, world.effects.shieldRemaining - dt);
  world.player.postHitInvulnRemaining = Math.max(0, world.player.postHitInvulnRemaining - dt);
}

export function updatePowerUps(world: World, dt: number): void {
  updateFalling(world, dt);
  updateTimers(world, dt);
}
