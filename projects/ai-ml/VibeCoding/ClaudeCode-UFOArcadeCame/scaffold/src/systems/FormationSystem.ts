// Implements PRD §F3 (enemy formation & movement), §F3 AC6 (formation-approach warning,
// Q7 - toggleable via FORMATION_WARNING_ENABLED), §F12 AC3 (v2: a lone boss uses a dedicated
// speed multiplier instead of the regular speedup formula). ADR-0003: reads
// formationSpeedMultiplier from LevelConfig, no per-level branching.

import {
  BASE_FORMATION_SPEED,
  BOSS_FORMATION_SPEED_MULTIPLIER,
  FORMATION_STEP_DOWN,
  FORMATION_WARNING_ENABLED,
  FORMATION_WARNING_ROW_MARGIN_PX,
  PLAYER_Y,
  PLAYFIELD_WIDTH,
} from '../config/constants';
import { getLevelConfig } from '../config/levelConfig';
import type { World } from '../core/types';

/** Recomputes the formation's cached bounds from currently-alive enemies (gaps included). */
function recomputeBounds(world: World): void {
  const alive = world.enemies.filter((e) => e.alive);
  if (alive.length === 0) {
    world.formation.leftmostX = 0;
    world.formation.rightmostX = 0;
    world.formation.lowestY = 0;
    return;
  }

  let left = Infinity;
  let right = -Infinity;
  let lowest = -Infinity;
  for (const e of alive) {
    const x = e.x + world.formation.offsetX;
    const y = e.y + world.formation.offsetY;
    left = Math.min(left, x);
    right = Math.max(right, x + e.width);
    lowest = Math.max(lowest, y + e.height);
  }
  world.formation.leftmostX = left;
  world.formation.rightmostX = right;
  world.formation.lowestY = lowest;
}

/** F3 AC3: formation speed scales inversely with remaining enemy count. F12 AC3: a lone
 * boss is a special case - the regular aliveCount/totalAtStart formula would instantly
 * saturate its 3.5x "last enemy" cap for a single enemy, undercutting the boss's intended
 * "big, tanky" feel, so it uses a dedicated, much gentler multiplier instead. */
function currentSpeed(world: World): number {
  const config = getLevelConfig(world.level);
  const totalAtStart = config.rows * config.cols;
  const aliveEnemies = world.enemies.filter((e) => e.alive);
  const aliveCount = aliveEnemies.length;
  if (aliveCount === 0) return 0;

  const isSoloBoss = aliveCount === 1 && aliveEnemies[0]?.isBoss === true;
  if (isSoloBoss) {
    return BASE_FORMATION_SPEED * config.formationSpeedMultiplier * BOSS_FORMATION_SPEED_MULTIPLIER;
  }

  // Inverse scaling: fewer enemies remaining => faster, capped at a reasonable multiple
  // so the very last enemy is dramatically faster without becoming unplayably instant.
  const remainingFraction = aliveCount / totalAtStart;
  const speedupFactor = Math.min(3.5, 1 / Math.max(remainingFraction, 0.08));

  return BASE_FORMATION_SPEED * config.formationSpeedMultiplier * speedupFactor;
}

/** Moves the formation as a rigid block; steps down + reverses at screen edges (F3 AC2). */
export function updateFormation(world: World, dt: number): void {
  recomputeBounds(world);
  const aliveCount = world.enemies.filter((e) => e.alive).length;
  if (aliveCount === 0) return;

  const speed = currentSpeed(world);
  const proposedOffsetX = world.formation.offsetX + world.formation.direction * speed * dt;

  const proposedLeft = world.formation.leftmostX + world.formation.direction * speed * dt;
  const proposedRight = world.formation.rightmostX + world.formation.direction * speed * dt;

  if (proposedLeft <= 0 || proposedRight >= PLAYFIELD_WIDTH) {
    // Hit an edge: step down one row-height and reverse direction (F3 AC2), without
    // applying this tick's horizontal delta (classic snap-to-edge behavior).
    world.formation.offsetY += FORMATION_STEP_DOWN;
    world.formation.direction = world.formation.direction === 1 ? -1 : 1;
  } else {
    world.formation.offsetX = proposedOffsetX;
  }

  recomputeBounds(world);

  // F3 AC6 (Q7): one-row-early non-color-only warning cue, single toggleable flag.
  if (FORMATION_WARNING_ENABLED) {
    world.formationWarningActive =
      world.formation.lowestY >= PLAYER_Y - FORMATION_WARNING_ROW_MARGIN_PX;
  } else {
    world.formationWarningActive = false;
  }
}
