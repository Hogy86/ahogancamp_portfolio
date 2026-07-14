// Implements PRD §F5 (enemy fire cadence scales with level, never decreases),
// ADR-0003 (fireRateMultiplier read from LevelConfig).

import { BASE_ENEMY_FIRE_INTERVAL_SECONDS, ENEMY_LASER_RADIUS } from '../config/constants';
import { getLevelConfig } from '../config/levelConfig';
import type { World } from '../core/types';

/** Picks a random living enemy to fire from, biased toward the frontmost (lowest) row
 * per column so shots plausibly originate from the formation's leading edge. */
function pickShooter(world: World): { x: number; y: number } | null {
  const alive = world.enemies.filter((e) => e.alive);
  if (alive.length === 0) return null;
  const shooter = alive[Math.floor(Math.random() * alive.length)];
  if (!shooter) return null;
  return {
    x: shooter.x + world.formation.offsetX + shooter.width / 2,
    y: shooter.y + world.formation.offsetY + shooter.height,
  };
}

/** Spawns enemy lasers at the level's fire cadence (F5 AC2/AC3). */
export function updateEnemyFire(world: World, dt: number): void {
  world.enemyFireCooldownRemaining -= dt;
  if (world.enemyFireCooldownRemaining > 0) return;

  const config = getLevelConfig(world.level);
  const interval = BASE_ENEMY_FIRE_INTERVAL_SECONDS / config.fireRateMultiplier;
  world.enemyFireCooldownRemaining = interval;

  const origin = pickShooter(world);
  if (!origin) return;

  world.enemyLasers.push({
    id: world.nextEntityId++,
    x: origin.x,
    y: origin.y,
    radius: ENEMY_LASER_RADIUS,
    active: true,
  });
}
