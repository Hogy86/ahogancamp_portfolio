// Tests PRD §F4 (10-level difficulty table matches the owner-approved spec exactly)
// AC4, AC5 (monotonicity), and cross-checks against the PRD table verbatim.

import { describe, expect, it } from 'vitest';
import { getLevelConfig, LEVEL_CONFIGS } from './levelConfig';

// The owner-approved table from docs/PRD.md §F4, transcribed exactly for comparison.
const EXPECTED = [
  { level: 1, rows: 4, cols: 6, hpMix: { 1: 1.0 }, bossHp: null, formationSpeedMultiplier: 1.0, fireRateMultiplier: 1.0, guaranteedPowerUpDrops: 1 },
  { level: 2, rows: 4, cols: 6, hpMix: { 1: 1.0 }, bossHp: 2, formationSpeedMultiplier: 1.1, fireRateMultiplier: 1.3, guaranteedPowerUpDrops: 1 },
  { level: 3, rows: 4, cols: 7, hpMix: { 1: 0.5, 2: 0.5 }, bossHp: 3, formationSpeedMultiplier: 1.2, fireRateMultiplier: 1.6, guaranteedPowerUpDrops: 1 },
  { level: 4, rows: 5, cols: 7, hpMix: { 1: 0.4, 2: 0.6 }, bossHp: 4, formationSpeedMultiplier: 1.35, fireRateMultiplier: 2.0, guaranteedPowerUpDrops: 1 },
  { level: 5, rows: 5, cols: 7, hpMix: { 1: 0.25, 2: 0.5, 3: 0.25 }, bossHp: 5, formationSpeedMultiplier: 1.5, fireRateMultiplier: 2.4, guaranteedPowerUpDrops: 1 },
  { level: 6, rows: 5, cols: 8, hpMix: { 2: 0.5, 3: 0.5 }, bossHp: 6, formationSpeedMultiplier: 1.65, fireRateMultiplier: 2.8, guaranteedPowerUpDrops: 1 },
  { level: 7, rows: 5, cols: 8, hpMix: { 2: 0.4, 3: 0.6 }, bossHp: 7, formationSpeedMultiplier: 1.8, fireRateMultiplier: 3.3, guaranteedPowerUpDrops: 1 },
  { level: 8, rows: 6, cols: 8, hpMix: { 2: 0.25, 3: 0.5, 4: 0.25 }, bossHp: 8, formationSpeedMultiplier: 2.0, fireRateMultiplier: 3.8, guaranteedPowerUpDrops: 1 },
  { level: 9, rows: 6, cols: 8, hpMix: { 3: 0.5, 4: 0.5 }, bossHp: 9, formationSpeedMultiplier: 2.2, fireRateMultiplier: 4.4, guaranteedPowerUpDrops: 1 },
  { level: 10, rows: 6, cols: 9, hpMix: { 3: 0.4, 4: 0.6 }, bossHp: 12, formationSpeedMultiplier: 2.5, fireRateMultiplier: 5.0, guaranteedPowerUpDrops: 1 },
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

  it('F4 AC2: level 2 has a boss requiring 2 hits; all other enemies are one-hit', () => {
    const config = getLevelConfig(2);
    expect(config.bossHp).toBe(2);
    expect(config.hpMix).toEqual({ 1: 1.0 });
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
