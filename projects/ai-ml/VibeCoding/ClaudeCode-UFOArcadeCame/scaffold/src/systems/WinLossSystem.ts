// Implements PRD §F5 AC1/AC4 (level clear advances/victory at 10), §F8 AC4-AC8
// (Game Over / Victory terminal states, single deterministic outcome when both
// loss triggers are true in the same tick). ADR-0002 decision 4: this system runs
// LAST among the gameplay systems, after lives and formation position are both
// finalized for the tick, and produces AT MOST ONE terminal transition.

import { MAX_LEVEL, PLAYER_Y } from '../config/constants';
import { resetForLevel } from '../core/world';
import type { World } from '../core/types';
import { emit } from '../instrumentation/Instrumentation';
import { resetGuaranteedDrops } from './levelRuntimeState';

/** F3 AC5: formation reaching the player's row is a loss trigger. */
function formationReachedPlayerRow(world: World): boolean {
  const aliveCount = world.enemies.filter((e) => e.alive).length;
  if (aliveCount === 0) return false; // no enemy remains -> cannot co-occur with Victory (F8 AC8 note).
  return world.formation.lowestY >= PLAYER_Y;
}

/**
 * Evaluates terminal conditions exactly once per tick, after WinLoss's upstream
 * systems (Lives via CollisionSystem, Formation position via FormationSystem) have
 * already finalized this tick's state. Both loss triggers collapse to the same
 * single GAMEOVER transition (F8 AC8) - there is no code path that can set two
 * different end states in one tick because this function returns after the first
 * transition it applies.
 */
export function updateWinLoss(world: World): void {
  if (world.state !== 'PLAYING') return;

  const livesDepleted = world.lives <= 0;
  const formationReachedRow = formationReachedPlayerRow(world);

  if (livesDepleted || formationReachedRow) {
    // F8 AC8: precedence is irrelevant to the player-visible outcome - both map to
    // the same unified Game Over. We still record which trigger(s) fired for
    // instrumentation/debugging, but the game only ever shows one GAMEOVER screen.
    world.state = 'GAMEOVER';
    world.gameOverReason = livesDepleted ? 'LIVES_DEPLETED' : 'FORMATION_REACHED_ROW';
    emit('gameOver', { reason: world.gameOverReason, level: world.level, score: world.score });
    return;
  }

  const allEnemiesCleared = world.enemies.every((e) => !e.alive);
  if (!allEnemiesCleared) return;

  if (world.level >= MAX_LEVEL) {
    world.state = 'VICTORY';
    emit('victory', { score: world.score });
    return;
  }

  const nextLevel = world.level + 1;
  resetForLevel(world, nextLevel);
  resetGuaranteedDrops(nextLevel);
  emit('levelReached', { level: nextLevel });
}
