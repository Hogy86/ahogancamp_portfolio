// Implements PRD §F1-F10 (shared vocabulary for World state), ADR-0002 (state machine),
// ADR-0003 (LevelConfig shape).

/** Screen/pause state machine states (ADR-0002 decision 2). */
export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

/** Reason the run ended, so the end screen text and instrumentation can distinguish them
 * while F8 AC8 still guarantees exactly one GAMEOVER transition is ever made. */
export type GameOverReason = 'LIVES_DEPLETED' | 'FORMATION_REACHED_ROW' | null;

/** F1: the player entity (Vanguard). */
export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Remaining seconds until another throw is allowed (F2 AC2). */
  throwCooldownRemaining: number;
  /** Remaining seconds of post-hit invulnerability (F8 AC9). 0 = not invulnerable. */
  postHitInvulnRemaining: number;
}

/** Regular (non-boss) enemy HP tiers per the F4 hpMix table. Bosses are not bound
 * to this range - see LevelConfig.bossHp / Enemy.hitsToKill below (level 10's boss
 * has 12 HP). */
export type HitsToKill = 1 | 2 | 3 | 4;

/** F4 AC6: an enemy's current damage state, used to select a distinct (non-color-only)
 * visual per remaining-hit-count. `hitsToKill` is a plain number (not the narrower
 * HitsToKill union) because boss HP can exceed the regular-enemy tiers (F4 level 10
 * boss = 12). */
export interface Enemy {
  id: number;
  /** Grid column/row index within the formation - fixed at spawn, used for layout only
   * (destroyed enemies leave gaps; formation does not re-flow, F3 AC4). */
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hitsToKill: number;
  hitsTaken: number;
  isBoss: boolean;
  alive: boolean;
}

export interface ShieldProjectile {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

export interface EnemyLaser {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

export type PowerUpType = 'HIT_POWER' | 'SPEED' | 'SHIELD' | 'PERMANENT_MULTIPLIER';

export interface PowerUpDrop {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

/** F7: active temporary effect timers, remaining-duration pattern only (ADR-0002 decision 5). */
export interface ActiveEffects {
  hitPowerRemaining: number;
  speedRemaining: number;
  shieldRemaining: number;
}

/** F3 AC2: the formation moves as a single rigid block. */
export interface Formation {
  /** Horizontal direction: 1 = right, -1 = left. */
  direction: 1 | -1;
  /** Offset applied to every enemy's base position - the block's shared transform. */
  offsetX: number;
  offsetY: number;
  /** Cached bounds derived from currently-alive enemies, refreshed each tick. */
  leftmostX: number;
  rightmostX: number;
  lowestY: number;
}

/** ADR-0003: one immutable row of the F4 10-level progression table. */
export interface LevelConfig {
  level: number;
  rows: number;
  cols: number;
  /** Fractional HP-mix weights for regular (non-boss) enemies. Must sum to 1. */
  hpMix: Partial<Record<HitsToKill, number>>;
  /** Plain number, not HitsToKill - boss HP can exceed regular-enemy tiers (level 10 = 12). */
  bossHp: number | null;
  formationSpeedMultiplier: number;
  fireRateMultiplier: number;
  guaranteedPowerUpDrops: number;
}

/** The single source of truth mutated by systems each tick (ADR-0002 decision 4). */
export interface World {
  state: GameState;
  /** State the pause screen was entered from is always PLAYING by construction;
   * retained here only for clarity at call sites. */
  level: number;
  score: number;
  lives: number;
  gameOverReason: GameOverReason;

  player: Player;
  enemies: Enemy[];
  shields: ShieldProjectile[];
  enemyLasers: EnemyLaser[];
  powerUps: PowerUpDrop[];

  effects: ActiveEffects;
  /** F7 AC7: permanent hit-power multiplier, stacks multiplicatively, reset only on
   * Restart Game / new run. */
  permanentMultiplier: number;

  formation: Formation;

  /** F5: seconds remaining until the next aggregate enemy shot may fire. */
  enemyFireCooldownRemaining: number;

  /** F3 AC6: whether the one-row-early danger cue is currently showing. */
  formationWarningActive: boolean;

  /** Monotonic id counters for spawned entities (projectiles, power-ups). */
  nextEntityId: number;

  /** True for exactly one tick after entering PAUSED, so the ScreenController can
   * mount the overlay once rather than every frame. Consumed by ScreenController. */
  pauseMenuSelectedIndex: number;
  restartGameConfirmPending: boolean;

  /** True once quit has been attempted and window.close() was blocked (F6 AC9). */
  quitBlockedMessageActive: boolean;
}
