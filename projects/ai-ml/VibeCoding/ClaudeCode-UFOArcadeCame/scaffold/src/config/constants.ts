// Implements PRD §F2 AC2, §F7 (power-up durations), §F8 AC9 (i-frames), §F11-F19 (v2
// additions), ADR-0003 (tunable base constants co-located with LevelConfig, not scattered
// magic numbers).
//
// All durations here are expressed in seconds and are consumed exclusively by the
// fixed-timestep simulation as remaining-duration counters (ADR-0002 decision 5).
// Nothing in this file is read against wall-clock time.

import type { HitsToKill } from '../core/types';

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

/** F2: shield projectile speed (constant magnitude - bounces change direction, never
 * speed, F15 AC6), px/s. */
export const SHIELD_SPEED = 480;
export const SHIELD_RADIUS = 8;

/** F16 Item E safety valve: a persistently-bouncing shield auto-despawns after this many
 * seconds, so the one-shield-in-flight rule (F16 AC3) can never permanently lock out the
 * next throw. */
export const SHIELD_MAX_LIFETIME_SECONDS = 6;

/** F15 AC7: the outer fraction of each enemy face (from either end) that counts as a
 * "corner" zone for bounce-direction classification; the middle 1 - 2*fraction is the
 * flat "center"/"side" zone. */
export const SHIELD_CORNER_ZONE_FRACTION = 0.3;

/** F15 AC9: number of recent shield positions retained for the rendering-only trail. */
export const SHIELD_TRAIL_LENGTH = 8;

/** F12 AC5: boss linear size is 5x a regular enemy of the same shape. */
export const BOSS_SIZE_MULTIPLIER = 5;

/** F12/F3 AC3: a lone boss uses this dedicated formation-speed multiplier instead of the
 * regular aliveCount/totalAtStart speedup formula, which would instantly saturate its 3.5x
 * cap for a single remaining enemy and undercut the boss's "big, tanky" feel. */
export const BOSS_FORMATION_SPEED_MULTIPLIER = 1.2;

/** F12 AC10-11: duration of the lightweight "BOSS INCOMING" telegraph that plays after the
 * regular formation clears and before the boss spawns/activates - deliberately much shorter
 * than LEVEL_INTRO_SECONDS and non-freezing (player retains full move/throw control). */
export const BOSS_WARNING_SECONDS = 1.75;

/** F18: duration of the level-start "LEVEL [N]" freeze/fade intro. */
export const LEVEL_INTRO_SECONDS = 3;
/** F18 AC3: near-white/accent color chosen to contrast against both the black background
 * and the white 1-hit enemies (F17). Reused for the boss-incoming warning cue (F12 AC10 -
 * a distinct amber/gold hue family from the red danger-pulse, per round-2 C2). */
export const LEVEL_INTRO_TEXT_COLOR = '#ffd873';
/** design-review-v2-round4.md FAIL-2: `LEVEL_INTRO_TEXT_COLOR` alone computes to only
 * ~1.27:1 contrast against the white 1-hit enemy/Vanguard color (`VANGUARD_WHITE`/
 * `ENEMY_TOUGHNESS_COLORS[1]`, both `#f4f6fb`) - nowhere near a usable floor, since amber and
 * white differ mainly in hue, not luminance. A dark stroke outline (drawn via
 * `ctx.strokeText` behind the amber fill, both level-intro and boss-warning text) gives the
 * text a real contrast margin against light backgrounds while the amber fill itself still
 * reads clearly against the black playfield. */
export const LEVEL_INTRO_TEXT_STROKE_COLOR = '#12121c';

/** F19: duration of the post-level-10-boss "Game Complete" celebration. */
export const VICTORY_CELEBRATION_SECONDS = 5;
/** F19 AC4: deterministic firework bursts driven purely by elapsed celebration time (no
 * Math.random/wall clock), same discipline as the existing blinkOn() helper. */
export const FIREWORK_BURST_COUNT = 6;
export const FIREWORK_PARTICLES_PER_BURST = 12;
export const FIREWORK_BURST_INTERVAL_SECONDS = 0.8;
/** F19 AC4: "multiple distinct colors, not a single color." */
export const FIREWORK_COLORS: readonly string[] = Object.freeze([
  '#ff5a5a',
  '#ffd873',
  '#6be675',
  '#5fb8ff',
  '#c77dff',
  '#ff9f4d',
]);

/** F13 AC3/F14 AC2: the exact blue shared identically by the Vanguard avatar and the
 * shield projectile. */
export const VANGUARD_BLUE = '#2f6fed';
/** F13 AC2: the white half of the Vanguard's "artful combination of blue and white". */
export const VANGUARD_WHITE = '#f4f6fb';

/** F17 AC3: base body color keyed by regular-enemy HP tier, white (1-hit, weakest) through
 * progressively darker gray (4-hit, toughest). */
export const ENEMY_TOUGHNESS_COLORS: Record<HitsToKill, string> = {
  1: '#f4f6fb',
  2: '#c3c6cf',
  3: '#787c86',
  4: '#3c3f46',
};
/** F17 AC5: the boss is darker than every regular tier, with a lighter outline so it still
 * clearly contrasts against the black background (never blends into it). */
export const BOSS_COLOR = '#242428';
export const BOSS_OUTLINE_COLOR = '#8a8a94';
/** design-review-v2-round5.md (non-blocking carry-forward): the regular-enemy outline was
 * previously a fixed `#2a2a3a`, which measures ~1.44:1 against the black canvas background
 * for the darkest regular tier (4-hit, `#3c3f46`) - essentially the same failure mode FAIL-3
 * fixed for the boss. This lighter mid-gray clears a real contrast margin (~4.4:1) while
 * staying visually distinct from the boss's own outline. */
export const ENEMY_OUTLINE_COLOR = '#6f7079';
/** F17 AC2/AC4: red eyes/lasers - matches the pre-existing enemy laser red. */
export const ENEMY_EYE_COLOR = '#ff5a5a';

/** F16 AC9: duration of the "+1 LIFE" catch-confirmation cue. */
export const LIFE_CATCH_FLASH_SECONDS = 1.0;

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
