// Implements PRD §F4 (10-level difficulty table, exact owner-approved progression),
// §F4 AC5 (monotonic escalation), §F12 (v2: boss phase replaces the old embedded-boss
// column - bossHp is now null except on levels 5/10, where it is 5x that level's
// toughest regular HP tier), ADR-0003 (data-driven level config, no per-level branching
// in consuming systems).
//
// This table is the single source of truth for per-level difficulty. Systems read
// fields from `LEVEL_CONFIGS[level - 1]` - none of them branch on `level` directly
// (ADR-0003 Risk R5). A monotonicity self-check and a boss-HP-formula self-check both
// run at module load (dev-time assertions) in addition to the unit tests test-writer
// will add.

import type { LevelConfig } from '../core/types';

/** Owner-approved 10-level progression (PRD §F4 table, Q1 resolved). */
export const LEVEL_CONFIGS: readonly LevelConfig[] = Object.freeze([
  {
    level: 1,
    rows: 4,
    cols: 6,
    hpMix: { 1: 1.0 },
    bossHp: null,
    formationSpeedMultiplier: 1.0,
    fireRateMultiplier: 1.0,
    guaranteedPowerUpDrops: 1,
  },
  {
    level: 2,
    rows: 4,
    cols: 6,
    hpMix: { 1: 1.0 },
    bossHp: null,
    formationSpeedMultiplier: 1.1,
    fireRateMultiplier: 1.3,
    guaranteedPowerUpDrops: 1,
  },
  {
    level: 3,
    rows: 4,
    cols: 7,
    hpMix: { 1: 0.5, 2: 0.5 },
    bossHp: null,
    formationSpeedMultiplier: 1.2,
    fireRateMultiplier: 1.6,
    guaranteedPowerUpDrops: 1,
  },
  {
    level: 4,
    rows: 5,
    cols: 7,
    hpMix: { 1: 0.4, 2: 0.6 },
    bossHp: null,
    formationSpeedMultiplier: 1.35,
    fireRateMultiplier: 2.0,
    guaranteedPowerUpDrops: 1,
  },
  {
    level: 5,
    rows: 5,
    cols: 7,
    hpMix: { 1: 0.25, 2: 0.5, 3: 0.25 },
    // F12 AC2: 5x the level's toughest regular tier (3-hit) = 15.
    bossHp: 15,
    formationSpeedMultiplier: 1.5,
    fireRateMultiplier: 2.4,
    guaranteedPowerUpDrops: 1,
  },
  {
    level: 6,
    rows: 5,
    cols: 8,
    hpMix: { 2: 0.5, 3: 0.5 },
    bossHp: null,
    formationSpeedMultiplier: 1.65,
    fireRateMultiplier: 2.8,
    guaranteedPowerUpDrops: 1,
  },
  {
    level: 7,
    rows: 5,
    cols: 8,
    hpMix: { 2: 0.4, 3: 0.6 },
    bossHp: null,
    formationSpeedMultiplier: 1.8,
    fireRateMultiplier: 3.3,
    guaranteedPowerUpDrops: 1,
  },
  {
    level: 8,
    rows: 6,
    cols: 8,
    hpMix: { 2: 0.25, 3: 0.5, 4: 0.25 },
    bossHp: null,
    formationSpeedMultiplier: 2.0,
    fireRateMultiplier: 3.8,
    guaranteedPowerUpDrops: 1,
  },
  {
    level: 9,
    rows: 6,
    cols: 8,
    hpMix: { 3: 0.5, 4: 0.5 },
    bossHp: null,
    formationSpeedMultiplier: 2.2,
    fireRateMultiplier: 4.4,
    guaranteedPowerUpDrops: 1,
  },
  {
    level: 10,
    rows: 6,
    cols: 9,
    hpMix: { 3: 0.4, 4: 0.6 },
    // F12 AC2: 5x the level's toughest regular tier (4-hit) = 20.
    bossHp: 20,
    formationSpeedMultiplier: 2.5,
    fireRateMultiplier: 5.0,
    guaranteedPowerUpDrops: 1,
  },
]);

export function getLevelConfig(level: number): LevelConfig {
  const config = LEVEL_CONFIGS[level - 1];
  if (!config) {
    throw new Error(
      `getLevelConfig: no config for level ${level} (valid range 1-${LEVEL_CONFIGS.length})`,
    );
  }
  return config;
}

/** Weighted average HP across the regular-enemy hpMix, used to assert monotonicity. */
function averageHp(config: LevelConfig): number {
  let total = 0;
  for (const [hp, weight] of Object.entries(config.hpMix)) {
    total += Number(hp) * (weight ?? 0);
  }
  return total;
}

/**
 * F4 AC5: each level's difficulty parameters must be >= the prior level's on HP mix,
 * formation size, speed, and fire rate. Runs once at module load as a fast-fail dev
 * assertion; test-writer additionally covers this with a proper unit test (ADR-0003).
 */
function assertMonotonicEscalation(configs: readonly LevelConfig[]): void {
  for (let i = 1; i < configs.length; i += 1) {
    const prev = configs[i - 1];
    const curr = configs[i];
    if (!prev || !curr) continue;

    const prevSize = prev.rows * prev.cols;
    const currSize = curr.rows * curr.cols;
    if (currSize < prevSize) {
      throw new Error(
        `LEVEL_CONFIGS monotonicity violation: level ${curr.level} formation size < level ${prev.level}`,
      );
    }
    if (curr.formationSpeedMultiplier < prev.formationSpeedMultiplier) {
      throw new Error(
        `LEVEL_CONFIGS monotonicity violation: level ${curr.level} speed < level ${prev.level}`,
      );
    }
    if (curr.fireRateMultiplier < prev.fireRateMultiplier) {
      throw new Error(
        `LEVEL_CONFIGS monotonicity violation: level ${curr.level} fire rate < level ${prev.level}`,
      );
    }
    if (averageHp(curr) < averageHp(prev)) {
      throw new Error(
        `LEVEL_CONFIGS monotonicity violation: level ${curr.level} avg HP < level ${prev.level}`,
      );
    }
  }
}

assertMonotonicEscalation(LEVEL_CONFIGS);

/** Highest regular-enemy HP tier present in a level's hpMix (the "toughest regular enemy"
 * the F12 AC2 boss-HP formula is defined against). */
function toughestRegularTier(config: LevelConfig): number {
  const tiers = Object.keys(config.hpMix).map(Number);
  return Math.max(0, ...tiers);
}

/**
 * F12 AC1-AC2: only levels 5 and 10 have a boss, and each boss's HP is exactly 5x that
 * level's toughest regular HP tier. Runs once at module load as a fast-fail dev assertion,
 * mirroring assertMonotonicEscalation (ADR-0003); test-writer additionally covers this with
 * a proper unit test.
 */
function assertBossHpFormula(configs: readonly LevelConfig[]): void {
  const BOSS_HP_MULTIPLIER = 5;
  const BOSS_LEVELS = new Set([5, 10]);

  for (const config of configs) {
    if (BOSS_LEVELS.has(config.level)) {
      const expected = toughestRegularTier(config) * BOSS_HP_MULTIPLIER;
      if (config.bossHp !== expected) {
        throw new Error(
          `LEVEL_CONFIGS boss HP violation: level ${config.level} bossHp ${String(config.bossHp)} !== expected ${expected}`,
        );
      }
    } else if (config.bossHp !== null) {
      throw new Error(
        `LEVEL_CONFIGS boss HP violation: level ${config.level} has a boss but is not a boss level (5/10 only)`,
      );
    }
  }
}

assertBossHpFormula(LEVEL_CONFIGS);
