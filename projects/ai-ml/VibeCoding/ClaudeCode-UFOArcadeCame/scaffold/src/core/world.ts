// Implements PRD §F1-F10 (initial run/level state), ADR-0002 (single World object
// mutated by ordered systems), ADR-0003 (level spawn reads LevelConfig, no branching).

import {
  ENEMY_H_SPACING,
  ENEMY_HEIGHT,
  ENEMY_V_SPACING,
  ENEMY_WIDTH,
  FORMATION_TOP_MARGIN,
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

/** Spawns the enemy grid for a level per its LevelConfig row (ADR-0003). */
export function spawnFormation(level: number): Enemy[] {
  const config = getLevelConfig(level);
  const totalCells = config.rows * config.cols;
  // Boss occupies the center of the bottom row when present (F4: "boss" is a
  // single designated enemy, not a separate grid dimension).
  const bossIndex =
    config.bossHp !== null ? (config.rows - 1) * config.cols + Math.floor(config.cols / 2) : -1;

  const regularCount = config.bossHp !== null ? totalCells - 1 : totalCells;
  const hpAssignments = buildHpAssignments(regularCount, config.hpMix);

  const formationWidth = config.cols * ENEMY_WIDTH + (config.cols - 1) * ENEMY_H_SPACING;
  const startX = (PLAYFIELD_WIDTH - formationWidth) / 2;

  const enemies: Enemy[] = [];
  let hpCursor = 0;
  let id = 0;

  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const cellIndex = row * config.cols + col;
      const isBoss = cellIndex === bossIndex;
      // hitsToKill is a plain number on Enemy (see types.ts) because boss HP can
      // exceed the regular-enemy HitsToKill tiers (level 10 boss = 12).
      const hitsToKill: number = isBoss
        ? (config.bossHp as number)
        : (hpAssignments[hpCursor++] as HitsToKill);

      enemies.push({
        id: id++,
        col,
        row,
        x: startX + col * (ENEMY_WIDTH + ENEMY_H_SPACING),
        y: FORMATION_TOP_MARGIN + row * (ENEMY_HEIGHT + ENEMY_V_SPACING),
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        hitsToKill,
        hitsTaken: 0,
        isBoss,
        alive: true,
      });
    }
  }

  return enemies;
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
      throwCooldownRemaining: 0,
      postHitInvulnRemaining: 0,
    },
    enemies: spawnFormation(1),
    shields: [],
    enemyLasers: [],
    powerUps: [],
    effects: { hitPowerRemaining: 0, speedRemaining: 0, shieldRemaining: 0 },
    permanentMultiplier: 1,
    formation: { direction: 1, offsetX: 0, offsetY: 0, leftmostX: 0, rightmostX: 0, lowestY: 0 },
    enemyFireCooldownRemaining: 0,
    formationWarningActive: false,
    nextEntityId: 1,
    pauseMenuSelectedIndex: 0,
    restartGameConfirmPending: false,
    quitBlockedMessageActive: false,
  };
}

/** Resets only level-scoped state for Restart Level / level-advance (F6 AC4, F5 AC1).
 * Score, lives, and the permanent multiplier are NOT reset here (F6 AC4 vs AC5 distinction). */
export function resetForLevel(world: World, level: number): void {
  world.level = level;
  world.player.x = PLAYFIELD_WIDTH / 2 - PLAYER_WIDTH / 2;
  world.player.throwCooldownRemaining = 0;
  world.player.postHitInvulnRemaining = 0;
  world.enemies = spawnFormation(level);
  world.shields = [];
  world.enemyLasers = [];
  world.powerUps = [];
  world.effects = { hitPowerRemaining: 0, speedRemaining: 0, shieldRemaining: 0 };
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
}
