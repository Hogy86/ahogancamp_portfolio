// Implements PRD §F7 AC2 (constant fall speed), §F7 AC3 (uncaught drops removed with
// no effect), §F11 (single active-temporary-effect slot decrements, remaining-duration
// pattern per ADR-0002 decision 5 - never wall-clock), §F16 AC9 (catch-confirmation cue timer).

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
 * (ADR-0002 decision 3/5). F11: the single active-temporary-effect slot decrements as one
 * unit and clears its type on expiry (replaces v1's three independent parallel timers). */
function updateTimers(world: World, dt: number): void {
  if (world.effects.type !== null) {
    world.effects.remaining = Math.max(0, world.effects.remaining - dt);
    if (world.effects.remaining === 0) world.effects.type = null;
  }
  world.player.postHitInvulnRemaining = Math.max(0, world.player.postHitInvulnRemaining - dt);
  world.lifeCatchFlashRemaining = Math.max(0, world.lifeCatchFlashRemaining - dt); // F16 AC9.
}

export function updatePowerUps(world: World, dt: number): void {
  updateFalling(world, dt);
  updateTimers(world, dt);
}
