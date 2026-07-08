// Implements PRD §F1 (player movement), §F7 AC5 (3x speed power-up).
// Runs first in the fixed per-tick system order (ADR-0002 decision 4).

import { PLAYER_BASE_SPEED, PLAYFIELD_WIDTH, SPEED_MULTIPLIER } from '../config/constants';
import type { InputSnapshot } from '../core/InputManager';
import type { World } from '../core/types';

/** Moves the player left/right, clamped to playfield bounds, no drift (F1 AC1-AC3). F11:
 * reads the single active-effect slot instead of a dedicated speed timer. */
export function updateMovement(world: World, input: InputSnapshot, dt: number): void {
  const speed =
    world.effects.type === 'SPEED' ? PLAYER_BASE_SPEED * SPEED_MULTIPLIER : PLAYER_BASE_SPEED;

  let dx = 0;
  if (input.moveLeft) dx -= speed * dt;
  if (input.moveRight) dx += speed * dt;

  world.player.x += dx;

  const minX = 0;
  const maxX = PLAYFIELD_WIDTH - world.player.width;
  world.player.x = Math.max(minX, Math.min(maxX, world.player.x));
}
