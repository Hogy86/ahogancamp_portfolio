// Tests PRD §F5 AC2 (level-1 aggregate enemy fire cadence <=25% of player max throw
// rate) and §F5 AC3 (fire cadence increases each level, never decreases).

import { describe, expect, it } from 'vitest';
import { updateEnemyFire } from './EnemyFireSystem';
import { BASE_ENEMY_FIRE_INTERVAL_SECONDS, THROW_INTERVAL_SECONDS } from '../config/constants';
import { getLevelConfig, LEVEL_CONFIGS } from '../config/levelConfig';
import { makePlayingWorld } from '../test-utils/worldFactory';

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

describe('EnemyFireSystem (F5 AC2, AC3)', () => {
  it('F5 AC2: level 1 aggregate enemy fire rate is <=25% of the player max throw rate', () => {
    const playerMaxThrowRate = 1 / THROW_INTERVAL_SECONDS; // shots/sec
    const level1FireRate = measureFireRate(1, 60);
    expect(level1FireRate).toBeLessThanOrEqual(playerMaxThrowRate * 0.25);
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
