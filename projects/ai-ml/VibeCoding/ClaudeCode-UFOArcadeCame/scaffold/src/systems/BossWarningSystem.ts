// Implements PRD §F12 AC10-AC11 (boss-incoming warning cue: a short, non-freezing telegraph
// that plays after the regular formation clears on a boss level and before the boss actually
// spawns/becomes active).

import { enterBossPhase } from '../core/world';
import type { World } from '../core/types';

/**
 * Counts down `bossWarningRemaining` while `bossPhase === 'WARNING'`. Unlike
 * LevelIntroSystem's gate, this cue never freezes Movement/Projectile systems (F12 AC11 -
 * the player retains full move/throw control) - it is purely cosmetic until it completes,
 * at which point the boss is spawned and the phase becomes ACTIVE.
 */
export function updateBossWarning(world: World, dt: number): void {
  if (world.bossPhase !== 'WARNING') return;

  world.bossWarningRemaining = Math.max(0, world.bossWarningRemaining - dt);
  if (world.bossWarningRemaining === 0) {
    enterBossPhase(world);
    world.bossPhase = 'ACTIVE';
  }
}
