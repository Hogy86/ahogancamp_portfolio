// Implements PRD §F5 AC1/AC4 (level clear advances/victory at 10), §F8 AC4-AC8
// (Game Over / Victory terminal states, single deterministic outcome when both
// loss triggers are true in the same tick), §F12 (v2: a boss level's regular-formation
// clear opens the boss-incoming warning window instead of advancing immediately - the boss
// itself is spawned by BossWarningSystem once that warning completes), §F18 AC9 (fresh
// level starts get the "LEVEL [N]" countdown), §F19 (level-10 boss defeat triggers the
// Game Complete celebration instead of a plain Victory). ADR-0002 decision 4: this system
// runs LAST among the gameplay systems, after lives and formation position are both
// finalized for the tick, and produces AT MOST ONE terminal transition.

import {
  BOSS_WARNING_SECONDS,
  LEVEL_INTRO_SECONDS,
  MAX_LEVEL,
  PLAYER_Y,
  VICTORY_CELEBRATION_SECONDS,
} from '../config/constants';
import { getLevelConfig } from '../config/levelConfig';
import { resetForLevel } from '../core/world';
import type { World } from '../core/types';
import { emit } from '../instrumentation/Instrumentation';
import { resetGuaranteedDrops } from './levelRuntimeState';

/** F3 AC5 / F12 AC8: formation (or a lone boss) reaching the player's row is a loss trigger. */
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

  // world.enemies is also empty (trivially "all cleared") throughout the WARNING window
  // (F12 AC10-11), since the regular formation has already been cleared and the boss has
  // not spawned yet - the two boss-phase guards below are what stop that from being
  // misread as "level cleared, advance now" during the telegraph.
  const allEnemiesCleared = world.enemies.every((e) => !e.alive);
  if (!allEnemiesCleared) return;

  const config = getLevelConfig(world.level);
  const isBossLevel = config.bossHp !== null;

  if (isBossLevel && world.bossPhase === 'NONE') {
    // F12 AC3/AC10: the regular formation just cleared - open the boss-incoming warning
    // window. BossWarningSystem spawns the boss and flips bossPhase to ACTIVE once it
    // completes; this system never spawns the boss directly.
    world.bossPhase = 'WARNING';
    world.bossWarningRemaining = BOSS_WARNING_SECONDS;
    // F16 AC8: a shield still bouncing when the formation clears must not persist into the
    // boss phase and hold the one-in-flight throw gate hostage through the whole warning
    // window and fight - clear it here, same as the level-advance/run-reset cases.
    world.shields = [];
    emit('bossWarningStarted', { level: world.level });
    return;
  }

  if (isBossLevel && world.bossPhase !== 'ACTIVE') return; // still in the WARNING window.

  // Either a non-boss level's formation is cleared, or the boss level's boss (the sole
  // remaining enemy once bossPhase === 'ACTIVE') has just been destroyed.
  if (world.level >= MAX_LEVEL) {
    // F19: defeating the level-10 boss triggers the Game Complete celebration, not a plain
    // static Victory screen.
    world.state = 'VICTORY';
    world.victoryCelebrationRemaining = VICTORY_CELEBRATION_SECONDS;
    world.victoryHeld = false;
    emit('victory', { score: world.score });
    return;
  }

  const nextLevel = world.level + 1;
  resetForLevel(world, nextLevel);
  // F18 AC1/AC9: every fresh level start (including a boss-phase-to-next-level transition)
  // gets the full countdown - resetForLevel itself deliberately does not set this, since
  // Restart Level (GameStateMachine) reuses resetForLevel but must skip the countdown.
  world.levelIntroRemaining = LEVEL_INTRO_SECONDS;
  resetGuaranteedDrops(nextLevel);
  emit('levelReached', { level: nextLevel });
}
