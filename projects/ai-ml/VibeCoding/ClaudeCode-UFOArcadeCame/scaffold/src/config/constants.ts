// Implements PRD §F2 AC2, §F7 (power-up durations), §F8 AC9 (i-frames), ADR-0003
// (tunable base constants co-located with LevelConfig, not scattered magic numbers).
//
// All durations here are expressed in seconds and are consumed exclusively by the
// fixed-timestep simulation as remaining-duration counters (ADR-0002 decision 5).
// Nothing in this file is read against wall-clock time.

/** Fixed simulation step, seconds. 60 Hz sim tick (NFR-2). */
export const FIXED_DT = 1 / 60;

/** Playfield dimensions in canvas pixels. */
export const PLAYFIELD_WIDTH = 800;
export const PLAYFIELD_HEIGHT = 600;

/** Reserved vertical band at the top for HUD is DOM-only; canvas draws the full area. */
export const PLAYER_Y = PLAYFIELD_HEIGHT - 48;
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 28;

/** F1 AC1: base player horizontal speed, px/s. */
export const PLAYER_BASE_SPEED = 260;

/** F2 AC2: minimum 250ms between shield throws. */
export const THROW_INTERVAL_SECONDS = 0.25;

/** F2: shield projectile vertical speed, px/s. */
export const SHIELD_SPEED = 480;
export const SHIELD_RADIUS = 8;

/** F8: starting lives. */
export const STARTING_LIVES = 3;

/** F8 AC9: post-hit invulnerability window, tunable default. */
export const POST_HIT_INVULN_SECONDS = 1.5;

/** F7: temporary power-up effect duration. */
export const POWERUP_DURATION_SECONDS = 8;

/** F7 AC7: permanent hit-power multiplier per catch. */
export const PERMANENT_MULTIPLIER_PER_CATCH = 1.8;

/** F7 AC4: temporary hit-power multiplier. */
export const HIT_POWER_MULTIPLIER = 5;

/** F7 AC5: temporary speed multiplier. */
export const SPEED_MULTIPLIER = 3;

/** F7 AC1 (UX-N4): tunable extra-drop chance per enemy death, beyond the guaranteed drop. */
export const EXTRA_DROP_CHANCE = 0.1;

/** F7 AC2: power-up fall speed, px/s. */
export const POWERUP_FALL_SPEED = 90;
export const POWERUP_RADIUS = 12;

/** F10: score constants. Points per kill scale by level; power-up catch bonus is flat. */
export const SCORE_PER_KILL_BASE = 100;
export const SCORE_PER_KILL_PER_LEVEL = 25;
export const SCORE_POWERUP_BONUS = 250;

/** Enemy formation base geometry. */
export const ENEMY_WIDTH = 36;
export const ENEMY_HEIGHT = 28;
export const ENEMY_H_SPACING = 20;
export const ENEMY_V_SPACING = 18;
export const FORMATION_TOP_MARGIN = 70;
export const FORMATION_STEP_DOWN = 24;

/** F4 design rationale: level-1 base formation speed (px/s) that F4's multipliers scale. */
export const BASE_FORMATION_SPEED = 30;

/** F5 AC2: level-1 base aggregate enemy fire interval (seconds between shots, aggregate). */
export const BASE_ENEMY_FIRE_INTERVAL_SECONDS = 3.2;

/** Enemy laser projectile speed, px/s. */
export const ENEMY_LASER_SPEED = 220;
export const ENEMY_LASER_RADIUS = 6;

/**
 * F3 AC6 / Q7: the formation-approach warning is a single toggleable config flag
 * (owner sign-off still pending per PRD Open Questions Q7). Disabling this flag
 * removes only the warning cue, never the underlying loss rule (F3 AC5).
 */
export const FORMATION_WARNING_ENABLED = true;

/** F3 AC6: warning triggers one row above the player's row. */
export const FORMATION_WARNING_ROW_MARGIN_PX = ENEMY_HEIGHT + FORMATION_STEP_DOWN;

/** Namespaced localStorage key for instrumentation counters (ADR-0005). */
export const INSTRUMENTATION_STORAGE_KEY = 'vvs:metrics';

/** Max levels (F5 AC4). */
export const MAX_LEVEL = 10;
