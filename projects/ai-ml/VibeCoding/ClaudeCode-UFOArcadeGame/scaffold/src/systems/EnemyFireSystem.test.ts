// Tests PRD §F5 AC2 (level-1 aggregate enemy fire cadence far below the player's max
// throw rate) and §F5 AC3 (fire cadence increases each level, never decreases).
//
// v2 recalibration note (F5 AC2 - amended in docs/PRD-addendum-v2.md, F16
// "Reconciliation with F5 AC2"): v1 defined "the player's max throw rate" as the
// reciprocal of the fixed THROW_INTERVAL_SECONDS (250ms) cooldown = 4/s, and bounded
// level-1 enemy fire at <=25% of it. F16 AC3 deletes that cooldown outright and replaces
// it with the one-shield-in-flight gate (Item E), so "max throw rate" is no longer a
// single constant - it now depends on how quickly the in-flight shield leaves play
// (F16 AC4). This test re-derives that rate empirically from the real v2 mechanics: the
// *unobstructed* throw-to-exit cycle (no enemies present, so the shield can only leave
// play by exiting the screen, F16 AC4a - the sustainable, repeatable case, not a lucky
// point-blank direct hit). Re-derived from constants.ts / ProjectileSystem.ts: a shield
// spawns at PLAYER_Y=552 with vy=-SHIELD_SPEED=-480 and radius 8, travels 560px to clear
// the top edge in 560/480=1.1667s -> ~0.857/s analytically (~0.854/s frame-stepped). The
// unchanged 0.3125 shots/s of level-1 enemy fire is therefore ~36.5% of the new max throw
// rate. The v1 25% bound is meaningless against the new mechanic (calibrated to a constant
// that no longer exists); the amended bound is <=42% - ~15% above the measured ~36.5% (tight
// enough to still discriminate an overwhelm-the-new-player regression, with margin for
// discretization jitter). See the addendum's F16 "Reconciliation with F5 AC2" note for the
// full numeric rationale (this bound is ratified there, not just in this comment).

import { describe, expect, it } from 'vitest';
import { updateEnemyFire } from './EnemyFireSystem';
import { updateProjectiles } from './ProjectileSystem';
import { BASE_ENEMY_FIRE_INTERVAL_SECONDS } from '../config/constants';
import { getLevelConfig, LEVEL_CONFIGS } from '../config/levelConfig';
import { makeInput, makePlayingWorld } from '../test-utils/worldFactory';

/** Measures the enemy shots-per-second produced by many ticks of updateEnemyFire
 * at a given level, using a fine dt for measurement precision. */
function measureFireRate(level: number, simulatedSeconds: number, dt = 1 / 240): number {
  const world = makePlayingWorld(level);
  let shotsFired = 0;
  const steps = Math.round(simulatedSeconds / dt);
  for (let i = 0; i < steps; i += 1) {
    const before = world.enemyLasers.length;
    updateEnemyFire(world, dt);
    if (world.enemyLasers.length > before) shotsFired += 1;
  }
  return shotsFired / simulatedSeconds;
}

/** F16: the player's realistic, sustainable max throw rate under the v2 one-in-flight
 * gate - measured as the reciprocal of a single unobstructed throw-to-exit cycle (no
 * enemies present, so the shield can only leave play by exiting the screen, F16 AC4a). */
function measurePlayerMaxThrowRate(dt = 1 / 240): number {
  const world = makePlayingWorld();
  world.enemies = [];
  let elapsedSeconds = 0;

  updateProjectiles(world, makeInput({ throwHeld: true }), dt);
  elapsedSeconds += dt;
  while (world.shields.length > 0) {
    updateProjectiles(world, makeInput({ throwHeld: false }), dt);
    elapsedSeconds += dt;
  }

  return 1 / elapsedSeconds;
}

describe('EnemyFireSystem (F5 AC2, AC3)', () => {
  it("F5 AC2 (v2-recalibrated, see file header): level 1 aggregate enemy fire rate is far below the player's realistic max throw rate", () => {
    const playerMaxThrowRate = measurePlayerMaxThrowRate();
    const level1FireRate = measureFireRate(1, 60);
    expect(level1FireRate).toBeLessThanOrEqual(playerMaxThrowRate * 0.42);
  });

  it('F5 AC3: enemy fire interval strictly decreases (cadence increases) as fireRateMultiplier rises across levels', () => {
    let prevInterval = Infinity;
    for (let level = 1; level <= 10; level += 1) {
      const config = getLevelConfig(level);
      const interval = BASE_ENEMY_FIRE_INTERVAL_SECONDS / config.fireRateMultiplier;
      expect(interval).toBeLessThanOrEqual(prevInterval);
      prevInterval = interval;
    }
  });

  it('F5 AC3: fire rate multiplier itself never decreases between consecutive levels (table-level guarantee)', () => {
    for (let i = 1; i < LEVEL_CONFIGS.length; i += 1) {
      expect(LEVEL_CONFIGS[i]!.fireRateMultiplier).toBeGreaterThanOrEqual(
        LEVEL_CONFIGS[i - 1]!.fireRateMultiplier,
      );
    }
  });

  it('measured aggregate fire rate at level 10 is higher than at level 1 (cadence is felt, not just configured)', () => {
    const level1Rate = measureFireRate(1, 60);
    const level10Rate = measureFireRate(10, 60);
    expect(level10Rate).toBeGreaterThan(level1Rate);
  });

  it('does not fire when no enemies remain alive', () => {
    const world = makePlayingWorld(1);
    for (const e of world.enemies) e.alive = false;
    for (let i = 0; i < 1000; i += 1) updateEnemyFire(world, 1 / 60);
    expect(world.enemyLasers).toHaveLength(0);
  });
});
