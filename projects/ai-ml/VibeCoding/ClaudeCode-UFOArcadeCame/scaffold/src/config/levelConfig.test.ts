// Tests PRD §F4 (10-level difficulty table matches the owner-approved spec exactly)
// AC4, AC5 (monotonicity), and §F12 AC1-AC2 (v2: bossHp is null except on levels 5/10,
// where it is 5x that level's toughest regular HP tier - replaces v1's embedded-boss-
// on-every-level-2-10 column, docs/PRD-addendum-v2.md Item A/B).

import { describe, expect, it } from 'vitest';
import { getLevelConfig, LEVEL_CONFIGS } from './levelConfig';

// The owner-approved table from docs/PRD.md §F4 + docs/PRD-addendum-v2.md F12 AC2,
// transcribed exactly for comparison. bossHp is null on every level except 5 and 10
// (5x that level's toughest regular hpMix tier: level 5's toughest tier is 3-hit -> 15;
// level 10's toughest tier is 4-hit -> 20).
const EXPECTED = [
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
    bossHp: 20,
    formationSpeedMultiplier: 2.5,
    fireRateMultiplier: 5.0,
    guaranteedPowerUpDrops: 1,
  },
] as const;

function averageHp(hpMix: Partial<Record<number, number>>): number {
  let total = 0;
  for (const [hp, weight] of Object.entries(hpMix)) total += Number(hp) * (weight ?? 0);
  return total;
}

/** Generic monotonicity checker under test - same shape of check the table itself
 * must satisfy (F4 AC5), extracted here so we can prove it actually discriminates
 * a bad sequence before trusting it against the real LEVEL_CONFIGS export. */
function isMonotonicNonDecreasing(values: number[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i]! < values[i - 1]!) return false;
  }
  return true;
}

/** Highest regular-enemy HP tier present in a level's hpMix - the "toughest regular
 * enemy" F12 AC2's boss-HP formula is defined against. Mirrors levelConfig.ts's own
 * (private) toughestRegularTier, re-derived here so the test doesn't just re-import
 * the production helper and trivially agree with it. */
function toughestRegularTier(hpMix: Partial<Record<number, number>>): number {
  const tiers = Object.keys(hpMix).map(Number);
  return Math.max(0, ...tiers);
}

describe('LEVEL_CONFIGS (F4 AC4 - exact table match)', () => {
  it('has exactly 10 levels (F5 AC4: no level 11)', () => {
    expect(LEVEL_CONFIGS).toHaveLength(10);
  });

  it.each(EXPECTED)('level $level matches the PRD table exactly', (expected) => {
    const actual = getLevelConfig(expected.level);
    expect(actual.rows).toBe(expected.rows);
    expect(actual.cols).toBe(expected.cols);
    expect(actual.hpMix).toEqual(expected.hpMix);
    expect(actual.bossHp).toBe(expected.bossHp);
    expect(actual.formationSpeedMultiplier).toBeCloseTo(expected.formationSpeedMultiplier, 10);
    expect(actual.fireRateMultiplier).toBeCloseTo(expected.fireRateMultiplier, 10);
    expect(actual.guaranteedPowerUpDrops).toBe(expected.guaranteedPowerUpDrops);
  });

  it('F4 AC1: level 1 hpMix is 100% one-hit enemies with no boss', () => {
    const config = getLevelConfig(1);
    expect(config.hpMix).toEqual({ 1: 1.0 });
    expect(config.bossHp).toBeNull();
  });

  it('F4 AC3: level 3 hpMix is 50% one-hit / 50% two-hit', () => {
    const config = getLevelConfig(3);
    expect(config.hpMix[1]).toBeCloseTo(0.5, 10);
    expect(config.hpMix[2]).toBeCloseTo(0.5, 10);
  });

  it('throws a descriptive error for an out-of-range level (defensive - no silent undefined)', () => {
    expect(() => getLevelConfig(0)).toThrow();
    expect(() => getLevelConfig(11)).toThrow();
  });
});

describe('LEVEL_CONFIGS boss phase (F12 AC1-AC2 - replaces v1 F4 "Boss HP" column)', () => {
  it('F12 AC1: only levels 5 and 10 have a boss phase; every other level (1-4, 6-9) has none', () => {
    for (const config of LEVEL_CONFIGS) {
      if (config.level === 5 || config.level === 10) {
        expect(config.bossHp).not.toBeNull();
      } else {
        expect(config.bossHp).toBeNull();
      }
    }
  });

  it('F12 AC2: level 5 boss HP is exactly 5x its toughest regular tier (3-hit -> 15)', () => {
    const config = getLevelConfig(5);
    expect(toughestRegularTier(config.hpMix)).toBe(3);
    expect(config.bossHp).toBe(3 * 5);
  });

  it('F12 AC2: level 10 boss HP is exactly 5x its toughest regular tier (4-hit -> 20)', () => {
    const config = getLevelConfig(10);
    expect(toughestRegularTier(config.hpMix)).toBe(4);
    expect(config.bossHp).toBe(4 * 5);
  });

  it('F12 AC2 self-check (assertBossHpFormula) is actually exercised: importing levelConfig.ts runs it at module load and it did not throw', () => {
    // assertBossHpFormula runs once at module load (levelConfig.ts) as a fast-fail
    // dev assertion - the mere fact that this suite's `import { LEVEL_CONFIGS }`
    // above succeeded already proves it passed for the real table. This test makes
    // that implicit guarantee explicit and re-derives the same formula against the
    // live export, so a future edit to LEVEL_CONFIGS that broke the formula would
    // fail here even if someone weakened/removed the module-load assertion itself.
    const BOSS_LEVELS = new Set([5, 10]);
    for (const config of LEVEL_CONFIGS) {
      if (BOSS_LEVELS.has(config.level)) {
        expect(config.bossHp).toBe(toughestRegularTier(config.hpMix) * 5);
      } else {
        expect(config.bossHp).toBeNull();
      }
    }
  });
});

describe('isMonotonicNonDecreasing helper (self-check that the monotonicity assertion discriminates)', () => {
  it('returns true for a non-decreasing sequence', () => {
    expect(isMonotonicNonDecreasing([1, 1, 2, 2, 3])).toBe(true);
  });

  it('returns false for a sequence containing a decrease', () => {
    expect(isMonotonicNonDecreasing([1, 2, 3, 2, 5])).toBe(false);
  });
});

describe('LEVEL_CONFIGS monotonicity (F4 AC5)', () => {
  it('formation size (rows x cols) is non-decreasing level over level', () => {
    const sizes = LEVEL_CONFIGS.map((c) => c.rows * c.cols);
    expect(isMonotonicNonDecreasing(sizes)).toBe(true);
  });

  it('formationSpeedMultiplier is non-decreasing level over level', () => {
    const speeds = LEVEL_CONFIGS.map((c) => c.formationSpeedMultiplier);
    expect(isMonotonicNonDecreasing(speeds)).toBe(true);
  });

  it('fireRateMultiplier is non-decreasing level over level', () => {
    const fireRates = LEVEL_CONFIGS.map((c) => c.fireRateMultiplier);
    expect(isMonotonicNonDecreasing(fireRates)).toBe(true);
  });

  it('average regular-enemy HP is non-decreasing level over level', () => {
    const avgHps = LEVEL_CONFIGS.map((c) => averageHp(c.hpMix));
    expect(isMonotonicNonDecreasing(avgHps)).toBe(true);
  });

  it('no level is easier than the prior level on every axis simultaneously reversed (regression guard)', () => {
    // Deliberately break a copy the same way a bad edit to LEVEL_CONFIGS would,
    // and confirm the helper (the same one used above) flags it - proving the
    // real-table assertions above are not vacuously true.
    const brokenSpeeds = LEVEL_CONFIGS.map((c) => c.formationSpeedMultiplier);
    brokenSpeeds[5] = 0; // simulate level 6 regressing below level 5
    expect(isMonotonicNonDecreasing(brokenSpeeds)).toBe(false);
  });
});
