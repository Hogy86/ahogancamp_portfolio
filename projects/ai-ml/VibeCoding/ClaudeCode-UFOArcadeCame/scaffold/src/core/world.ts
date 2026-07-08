// Implements PRD §F1-F19 (initial run/level state), §F12 (v2: post-clear boss phase
// replaces the old embedded-boss spawn), ADR-0002 (single World object mutated by ordered
// systems), ADR-0003 (level spawn reads LevelConfig, no branching).

import {
  BOSS_SIZE_MULTIPLIER,
  ENEMY_H_SPACING,
  ENEMY_HEIGHT,
  ENEMY_V_SPACING,
  ENEMY_WIDTH,
  FORMATION_TOP_MARGIN,
  LEVEL_INTRO_SECONDS,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_Y,
  PLAYFIELD_WIDTH,
  STARTING_LIVES,
} from '../config/constants';
import { getLevelConfig } from '../config/levelConfig';
import type { Enemy, HitsToKill, World } from './types';

/** Deterministic-enough shuffle for HP-mix assignment; not security-sensitive (game balance only). */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

/** Builds the regular-enemy HP assignment list per the level's hpMix weights (F4 AC1-AC3). */
function buildHpAssignments(
  count: number,
  hpMix: Partial<Record<HitsToKill, number>>,
): HitsToKill[] {
  const entries = Object.entries(hpMix) as [string, number][];
  const assignments: HitsToKill[] = [];
  let assigned = 0;

  entries.forEach(([hpStr, weight], index) => {
    const hp = Number(hpStr) as HitsToKill;
    const isLast = index === entries.length - 1;
    // Last bucket absorbs rounding remainder so the total always equals `count`
    // exactly (F4 AC3: "50% ±1 enemy for odd counts").
    const n = isLast ? count - assigned : Math.round(count * weight);
    for (let i = 0; i < n; i += 1) assignments.push(hp);
    assigned += n;
  });

  // Guard against rounding shortfall (defensive - keeps the array exactly `count` long).
  while (assignments.length < count) assignments.push(1);
  while (assignments.length > count) assignments.pop();

  return shuffleInPlace(assignments);
}

/**
 * Spawns the regular-enemy grid for a level per its LevelConfig row (ADR-0003). v2 (F12):
 * every cell is now a regular enemy drawn from hpMix - the boss is never embedded in the
 * starting formation; it is installed separately by spawnBoss/enterBossPhase below, only
 * after the regular formation is fully cleared, only on levels 5/10.
 */
export function spawnFormation(level: number): Enemy[] {
  const config = getLevelConfig(level);
  const totalCells = config.rows * config.cols;
  const hpAssignments = buildHpAssignments(totalCells, config.hpMix);

  const formationWidth = config.cols * ENEMY_WIDTH + (config.cols - 1) * ENEMY_H_SPACING;
  const startX = (PLAYFIELD_WIDTH - formationWidth) / 2;

  const enemies: Enemy[] = [];
  let id = 0;

  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const cellIndex = row * config.cols + col;
      enemies.push({
        id: id++,
        col,
        row,
        x: startX + col * (ENEMY_WIDTH + ENEMY_H_SPACING),
        y: FORMATION_TOP_MARGIN + row * (ENEMY_HEIGHT + ENEMY_V_SPACING),
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        hitsToKill: hpAssignments[cellIndex] as HitsToKill,
        hitsTaken: 0,
        isBoss: false,
        alive: true,
      });
    }
  }

  return enemies;
}

/** F12 AC5-AC6: builds the single boss enemy - 5x the linear size of a regular enemy,
 * positioned at the existing FORMATION_TOP_MARGIN (already a known-safe, HUD/player-clear
 * spawn position), HP from the level's bossHp (F12 AC2). */
function spawnBoss(world: World): Enemy {
  const config = getLevelConfig(world.level);
  const width = ENEMY_WIDTH * BOSS_SIZE_MULTIPLIER;
  const height = ENEMY_HEIGHT * BOSS_SIZE_MULTIPLIER;
  return {
    id: 0,
    col: 0,
    row: 0,
    x: (PLAYFIELD_WIDTH - width) / 2,
    y: FORMATION_TOP_MARGIN,
    width,
    height,
    // getLevelConfig(world.level).bossHp is only null on non-boss levels; enterBossPhase is
    // only ever called on boss levels (5/10), so this is always a real value in practice.
    hitsToKill: config.bossHp ?? 0,
    hitsTaken: 0,
    isBoss: true,
    alive: true,
  };
}

/** F12: resets the formation transform (so the boss doesn't inherit wherever the regular
 * formation drifted to) and installs the boss as the sole enemy. Called by BossWarningSystem
 * once the boss-incoming warning cue (F12 AC10-11) completes - never directly by
 * WinLossSystem, which only opens the warning window. */
export function enterBossPhase(world: World): void {
  world.formation = {
    direction: 1,
    offsetX: 0,
    offsetY: 0,
    leftmostX: 0,
    rightmostX: 0,
    lowestY: 0,
  };
  world.enemies = [spawnBoss(world)];
  // Boss-phase entry is not a fresh level start (F12 AC4/AC11) - it never triggers F18's
  // "LEVEL [N]" countdown, so this is explicitly zeroed here as a defensive invariant.
  world.levelIntroRemaining = 0;
}

/** Creates a fresh World for the start of a brand-new run (title -> level 1, or Restart Game). */
export function createNewRunWorld(): World {
  return {
    state: 'TITLE',
    level: 1,
    score: 0,
    lives: STARTING_LIVES,
    gameOverReason: null,
    player: {
      x: PLAYFIELD_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: PLAYER_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      postHitInvulnRemaining: 0,
    },
    enemies: spawnFormation(1),
    shields: [],
    enemyLasers: [],
    powerUps: [],
    effects: { type: null, remaining: 0 },
    permanentMultiplier: 1,
    formation: { direction: 1, offsetX: 0, offsetY: 0, leftmostX: 0, rightmostX: 0, lowestY: 0 },
    enemyFireCooldownRemaining: 0,
    formationWarningActive: false,
    // F18 AC1: a brand-new run's level 1 gets the full countdown (level-advance and Restart
    // Level set this explicitly at their own call sites - see F18 AC9).
    levelIntroRemaining: LEVEL_INTRO_SECONDS,
    bossPhase: 'NONE',
    bossWarningRemaining: 0,
    victoryCelebrationRemaining: 0,
    victoryHeld: false,
    lifeCatchFlashRemaining: 0,
    nextEntityId: 1,
    pauseMenuSelectedIndex: 0,
    restartGameConfirmPending: false,
    quitBlockedMessageActive: false,
  };
}

/**
 * Resets only level-scoped state for Restart Level / level-advance (F6 AC4, F5 AC1). Score,
 * lives, and the permanent multiplier are NOT reset here (F6 AC4 vs AC5 distinction).
 *
 * v2 (F18 AC9): does NOT set levelIntroRemaining - Restart Level (GameStateMachine) and
 * level-advance (WinLossSystem) need different countdown behavior (skip vs. full 3s), so
 * each call site sets levelIntroRemaining explicitly after calling this function.
 */
export function resetForLevel(world: World, level: number): void {
  world.level = level;
  world.player.x = PLAYFIELD_WIDTH / 2 - PLAYER_WIDTH / 2;
  world.player.postHitInvulnRemaining = 0;
  world.enemies = spawnFormation(level);
  world.shields = [];
  world.enemyLasers = [];
  world.powerUps = [];
  world.effects = { type: null, remaining: 0 };
  world.formation = {
    direction: 1,
    offsetX: 0,
    offsetY: 0,
    leftmostX: 0,
    rightmostX: 0,
    lowestY: 0,
  };
  world.enemyFireCooldownRemaining = 0;
  world.formationWarningActive = false;
  world.gameOverReason = null;
  world.bossPhase = 'NONE';
  world.bossWarningRemaining = 0;
  world.lifeCatchFlashRemaining = 0;
}
