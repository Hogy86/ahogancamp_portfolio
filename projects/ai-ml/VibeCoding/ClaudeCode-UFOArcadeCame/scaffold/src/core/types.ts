// Implements PRD §F1-F19 (shared vocabulary for World state), ADR-0002 (state machine),
// ADR-0003 (LevelConfig shape). v2 additions: single active-power-up slot (F11), boss
// phase (F12), shield bounce/lifecycle (F15/F16), level-intro (F18), Game Complete (F19).

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
  /** Remaining seconds of post-hit invulnerability (F8 AC9). 0 = not invulnerable. */
  postHitInvulnRemaining: number;
}

/** Regular (non-boss) enemy HP tiers per the F4 hpMix table. Bosses are not bound to this
 * range - see LevelConfig.bossHp / Enemy.hitsToKill below (v2: boss HP is 5x the toughest
 * regular tier on that level, F12 AC2). */
export type HitsToKill = 1 | 2 | 3 | 4;

/** F4 AC6 / F17 AC6/AC9: an enemy's current damage state, used to select a distinct
 * (non-color-only) visual per remaining-hit-count. `hitsToKill` is a plain number (not the
 * narrower HitsToKill union) because boss HP can exceed the regular-enemy tiers. */
export interface Enemy {
  id: number;
  /** Grid column/row index within the formation - fixed at spawn, used for layout only
   * (destroyed enemies leave gaps; formation does not re-flow, F3 AC4). The boss is always
   * col 0 / row 0 (it is the sole enemy of its "formation", F12). */
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

/** F15/F16: the thrown shield now bounces off enemies (a velocity vector, not a fixed
 * up-only travel), has a max-lifetime safety valve, and carries a short rendering trail. */
export interface ShieldProjectile {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  /** F15: velocity components, px/s. Magnitude is always SHIELD_SPEED - a bounce changes
   * direction only, never speed (F15 AC6). */
  vx: number;
  vy: number;
  /** F16 Item E safety valve: seconds until this shield auto-despawns regardless of its
   * bounce state, so a persistently-bouncing shield can never lock out the next throw
   * forever (F16 AC3/AC4d). */
  lifetimeRemaining: number;
  /** F15 AC2 debounce: id of the enemy this shield most recently damaged while still
   * overlapping it. Cleared as soon as the shield separates from that enemy, so a later,
   * genuinely new contact (even with the same enemy) can damage it again. */
  lastHitEnemyId: number | null;
  /** F15 AC9: short trailing afterimage of recent positions (oldest first), capped at
   * SHIELD_TRAIL_LENGTH entries. Rendering aid only - never consulted for collision. */
  trail: Array<{ x: number; y: number }>;
}

export interface EnemyLaser {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

export type PowerUpType = 'HIT_POWER' | 'SPEED' | 'SHIELD' | 'PERMANENT_MULTIPLIER';

/** F11: the three timed power-ups that share the single active-effect slot. The permanent
 * multiplier is deliberately excluded - it has no timer and cannot occupy the slot (F11 AC5). */
export type TemporaryEffectType = Exclude<PowerUpType, 'PERMANENT_MULTIPLIER'>;

export interface PowerUpDrop {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

/** F11: the single active-temporary-effect slot (replaces v1's three independent parallel
 * timers, ActiveEffects). At most one temporary effect can be active; catching any temporary
 * power-up (same type or different) overwrites this slot with a full fresh duration - that
 * overwrite is the entirety of F11's mutual-exclusion rule (ADR-0002 decision 5: remaining-
 * duration pattern only, never wall-clock). */
export interface ActiveEffect {
  type: TemporaryEffectType | null;
  remaining: number;
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
  /** F12 AC1-AC2: null on levels with no boss phase (1-4, 6-9); 5x the level's toughest
   * regular HP tier on levels 5 and 10 (15 and 20 respectively). */
  bossHp: number | null;
  formationSpeedMultiplier: number;
  fireRateMultiplier: number;
  guaranteedPowerUpDrops: number;
}

/** F12: boss-encounter sub-state, tracked only on boss levels (5/10). NONE outside a boss
 * phase; WARNING during the ~1.75s "BOSS INCOMING" telegraph (F12 AC10-11, no boss present
 * yet, player has full control); ACTIVE once the boss has spawned and is interactive. */
export type BossPhase = 'NONE' | 'WARNING' | 'ACTIVE';

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

  effects: ActiveEffect;
  /** F7 AC7: permanent hit-power multiplier, stacks multiplicatively, reset only on
   * Restart Game / new run. */
  permanentMultiplier: number;

  formation: Formation;

  /** F5: seconds remaining until the next aggregate enemy shot may fire. */
  enemyFireCooldownRemaining: number;

  /** F3 AC6: whether the one-row-early danger cue is currently showing. */
  formationWarningActive: boolean;

  /** F18: seconds remaining in the level-start "LEVEL N" freeze/fade (0 = inactive; gameplay
   * is live). Set explicitly at each fresh-level-start call site (createNewRunWorld, the
   * WinLossSystem level-advance branch) - NOT inside resetForLevel, since resetForLevel is
   * also used by Restart Level, which must skip the intro (F18 AC9). */
  levelIntroRemaining: number;

  /** F12: current boss sub-state on boss levels; NONE (and meaningless) on non-boss levels. */
  bossPhase: BossPhase;
  /** F12 AC10-11: seconds remaining in the boss-incoming warning cue (0 = inactive). */
  bossWarningRemaining: number;

  /** F19: seconds remaining in the post-level-10-boss "Game Complete" celebration (0 =
   * inactive). Only ticks down while victoryHeld is false (F19 AC6/AC9). */
  victoryCelebrationRemaining: number;
  /** F19 AC9: true once the player has made one qualifying (non-Esc) key press during the
   * celebration, pausing the countdown until a second qualifying press advances to TITLE. */
  victoryHeld: boolean;

  /** F16 AC9: seconds remaining in the "+1 LIFE" catch-confirmation cue (0 = inactive). */
  lifeCatchFlashRemaining: number;

  /** Monotonic id counters for spawned entities (projectiles, power-ups). */
  nextEntityId: number;

  /** True for exactly one tick after entering PAUSED, so the ScreenController can
   * mount the overlay once rather than every frame. Consumed by ScreenController. */
  pauseMenuSelectedIndex: number;
  restartGameConfirmPending: boolean;

  /** True once quit has been attempted and window.close() was blocked (F6 AC9). */
  quitBlockedMessageActive: boolean;
}
