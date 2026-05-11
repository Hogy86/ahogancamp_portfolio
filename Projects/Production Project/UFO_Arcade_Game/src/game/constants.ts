/** PRD-tuned gameplay constants (Arcade UFO). */
export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;
export const ASPECT = LOGICAL_W / LOGICAL_H;

export const PLAYER_SPEED = 300;
export const PLAYER_RADIUS = 14;
export const PLAYER_LIVES_DEFAULT = 3;
export const PLAYER_IFRAME_SEC = 1.25;

export const FIRE_COOLDOWN_MS = 1000 / 6;
export const PLAYER_BOLT_SPEED = 900;
export const PLAYER_BOLT_LIFETIME = 1.2;
export const MAX_PLAYER_PROJECTILES = 30;

export const COMBO_WINDOW_SEC = 3;
export const COMBO_STEP = 0.25;
export const COMBO_MAX = 3;

export const POWERUP_DURATION = 10;
export const POWERUP_DROP_CHANCE = 0.12;
export const MAX_PICKUPS_FIELD = 2;
export const PICKUP_DESPAWN_SEC = 8;
export const PICKUP_DRIFT_SPEED = 50;

export const MENU_KEY_INITIAL_MS = 150;
export const MENU_KEY_REPEAT_MS = 75;

export const FIXED_DT = 1 / 60;
export const MAX_SUBSTEPS = 5;

export type PowerUpKind = 'wide' | 'power' | 'speed' | 'shields';

export type EnemyArchetype = 'scout' | 'gunner' | 'tank' | 'elite';

export interface LevelRow {
  level: number;
  enemyCount: number;
  enemySpeed: number;
  shieldHits: number;
  fireRate: number;
}

/** Section 8.1 progression table. */
export const LEVEL_TABLE: LevelRow[] = [
  { level: 1, enemyCount: 10, enemySpeed: 110, shieldHits: 3, fireRate: 0.5 },
  { level: 2, enemyCount: 12, enemySpeed: 120, shieldHits: 4, fireRate: 0.75 },
  { level: 3, enemyCount: 14, enemySpeed: 130, shieldHits: 5, fireRate: 1.0 },
  { level: 4, enemyCount: 16, enemySpeed: 140, shieldHits: 6, fireRate: 1.25 },
  { level: 5, enemyCount: 18, enemySpeed: 150, shieldHits: 7, fireRate: 1.5 },
  { level: 6, enemyCount: 20, enemySpeed: 160, shieldHits: 8, fireRate: 1.75 },
  { level: 7, enemyCount: 22, enemySpeed: 170, shieldHits: 9, fireRate: 2.0 },
  { level: 8, enemyCount: 24, enemySpeed: 180, shieldHits: 10, fireRate: 2.25 },
  { level: 9, enemyCount: 26, enemySpeed: 190, shieldHits: 11, fireRate: 2.5 },
  { level: 10, enemyCount: 28, enemySpeed: 200, shieldHits: 12, fireRate: 2.75 },
];

export function enemyProjectileSpeed(level: number): number {
  return Math.min(750, 550 + (level - 1) * 20);
}

export function fireRateForArchetype(base: number, arch: EnemyArchetype): number {
  const m =
    arch === 'scout' ? 1.1 : arch === 'gunner' ? 1.0 : arch === 'tank' ? 0.75 : 1.25;
  return base * m;
}

export function shieldChance(level: number): number {
  if (level <= 3) return 0.6;
  if (level <= 7) return 0.75;
  return 0.85;
}

export const KILL_SCORE: Record<EnemyArchetype, number> = {
  scout: 150,
  gunner: 200,
  tank: 350,
  elite: 500,
};
