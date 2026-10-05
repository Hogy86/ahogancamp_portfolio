// Implements PRD §F9 (original Vanguard/Sentinel art), §F9 AC4 / NFR-10 (hard IP
// constraint - no licensed motifs), §F4 AC6 / §F17 AC6/AC9 (damage-state shape change,
// contrast-adaptive against each enemy's base color), §F7 AC6 / §F8 AC9 (invulnerability
// visual distinction), §F13 (humanoid Vanguard redesign), §F14 (circular avatar-blue
// shield), §F17 (humanoid Sentinel redesign, white-to-dark toughness scale, red
// eyes/lasers), §F19 AC4 (deterministic Game Complete fireworks).
// ADR-0004: all art is procedurally drawn vector primitives, never raster/external
// images. Anti-motif rules are binding: the shield is a plain single-color disc with no
// concentric rings/stars (explicitly NOT a red-white-blue concentric-star disc); Vanguard
// and Sentinels are generic humanoid forms (explicitly NOT any trademarked
// character/robot's silhouette or proportions).

import {
  BOSS_COLOR,
  BOSS_OUTLINE_COLOR,
  ENEMY_EYE_COLOR,
  ENEMY_OUTLINE_COLOR,
  ENEMY_TOUGHNESS_COLORS,
  FIREWORK_BURST_COUNT,
  FIREWORK_BURST_INTERVAL_SECONDS,
  FIREWORK_COLORS,
  FIREWORK_PARTICLES_PER_BURST,
  LEVEL_INTRO_TEXT_COLOR,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
  VANGUARD_BLUE,
  VANGUARD_WHITE,
} from '../config/constants';
import type { HitsToKill, PowerUpType } from '../core/types';

/**
 * Vanguard (the player). A humanoid silhouette with four distinguishable regions - head,
 * arms, torso, legs (F13 AC1) - in an artful blue/white combination (F13 AC2). No
 * red-white-blue star/shield motif (F13 AC5 / F9 AC4 / NFR-10).
 */
export function drawVanguard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  invulnerable: boolean,
  blinkOn: boolean,
): void {
  ctx.save();
  ctx.translate(x, y);

  // Invulnerability is shown with an aura ring (shape) in addition to a color
  // shift, satisfying the non-color-only requirement (F7 AC6 / F8 AC9). The aura
  // blinks (alternates visibility) rather than relying on hue alone.
  if (invulnerable && blinkOn) {
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width * 0.85, height * 0.9, 0, 0, Math.PI * 2);
    ctx.strokeStyle = LEVEL_INTRO_TEXT_COLOR;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const bodyColor = invulnerable && !blinkOn ? '#8fbdf5' : VANGUARD_BLUE;

  // Legs: two blue bars diverging from the torso base.
  ctx.fillStyle = bodyColor;
  ctx.fillRect(width * 0.28, height * 0.72, width * 0.16, height * 0.28);
  ctx.fillRect(width * 0.56, height * 0.72, width * 0.16, height * 0.28);

  // Torso: the figure's largest region, blue.
  ctx.fillStyle = bodyColor;
  ctx.fillRect(width * 0.22, height * 0.4, width * 0.56, height * 0.36);
  ctx.strokeStyle = VANGUARD_WHITE;
  ctx.lineWidth = 2;
  ctx.strokeRect(width * 0.22, height * 0.4, width * 0.56, height * 0.36);

  // Arms: white bars angled out from the torso's shoulders - the white half of the
  // "artful combination of blue and white" (F13 AC2).
  ctx.strokeStyle = VANGUARD_WHITE;
  ctx.lineWidth = Math.max(3, width * 0.1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(width * 0.22, height * 0.46);
  ctx.lineTo(width * 0.02, height * 0.68);
  ctx.moveTo(width * 0.78, height * 0.46);
  ctx.lineTo(width * 0.98, height * 0.68);
  ctx.stroke();

  // Head: white circle with a blue outline, the fourth distinguishable region.
  const headRadius = height * 0.22;
  const headCx = width / 2;
  const headCy = headRadius + 1;
  ctx.beginPath();
  ctx.arc(headCx, headCy, headRadius, 0, Math.PI * 2);
  ctx.fillStyle = VANGUARD_WHITE;
  ctx.fill();
  ctx.strokeStyle = VANGUARD_BLUE;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

/** F14: the shield projectile - a single-color disc in the exact Vanguard blue (F14 AC1-
 * AC2), with a thin white outline (a shape-level distinction, not a fill-color change) so a
 * bounced shield closing in on the player stays separable at close range (F14 AC5 / round-1
 * N2). No concentric rings/stars (F14 AC3 / F9 AC4 / NFR-10). */
export function drawShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = VANGUARD_BLUE;
  ctx.fill();
  ctx.strokeStyle = VANGUARD_WHITE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** F15 AC9: a single faded trail point behind an in-flight shield - a rendering aid only,
 * never consulted for collision. Caller supplies alpha (oldest = most transparent). */
export function drawShieldTrailPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = VANGUARD_BLUE;
  ctx.fill();
  ctx.restore();
}

/** Enemy laser bolt - a simple elongated diamond, distinct from the shield's disc shape. */
export function drawEnemyLaser(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.6);
  ctx.lineTo(radius * 0.5, 0);
  ctx.lineTo(0, radius * 1.6);
  ctx.lineTo(-radius * 0.5, 0);
  ctx.closePath();
  ctx.fillStyle = ENEMY_EYE_COLOR;
  ctx.fill();
  ctx.restore();
}

/**
 * A Sentinel. Humanoid silhouette with four distinguishable regions - head, arms, torso,
 * legs (F17 AC1) - deliberately generic geometry, not modeled on any specific trademarked
 * robot/character's silhouette or proportions (ADR-0004 anti-motif rule). Base body color
 * encodes toughness on a white -> dark-gray scale keyed by hitsToKill (F17 AC3); the boss
 * uses the darkest, boss-unique color with a lighter outline for background contrast (F17
 * AC5). Red eyes (F17 AC2). Damage state (hitsTaken) adds a crack overlay whose stroke color
 * is chosen for contrast against this enemy's own base color, light-on-dark or dark-on-light
 * (F17 AC9), so the non-color-only damage cue (F4 AC6) stays legible across the whole scale.
 */
export function drawSentinel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  hitsToKill: number,
  hitsTaken: number,
  isBoss: boolean,
): void {
  ctx.save();
  ctx.translate(x, y);

  const bodyColor = isBoss
    ? BOSS_COLOR
    : (ENEMY_TOUGHNESS_COLORS[hitsToKill as HitsToKill] ?? ENEMY_TOUGHNESS_COLORS[1]);
  const outlineColor = isBoss ? BOSS_OUTLINE_COLOR : ENEMY_OUTLINE_COLOR;

  // F17 AC9: dark-tier bodies (3-hit, 4-hit, boss) get a light damage-overlay stroke; light
  // bodies (1-hit white, 2-hit light gray) keep a dark stroke, so the crack cue stays
  // legible against either end of the toughness color scale.
  const isDarkBody = isBoss || hitsToKill >= 3;
  const damageOverlayColor = isDarkBody ? '#eef0f6' : '#1a1a1a';

  // Legs. Also stroked with outlineColor (design-review-v2-round4.md FAIL-3) so they get the
  // same contrast-floor treatment as the torso/head, matching all four humanoid regions -
  // without it, the boss's near-black BOSS_COLOR legs compute to ~1.3:1 against the canvas
  // background and are effectively invisible at BOSS_SIZE_MULTIPLIER scale.
  ctx.fillStyle = bodyColor;
  ctx.fillRect(width * 0.28, height * 0.75, width * 0.16, height * 0.25);
  ctx.fillRect(width * 0.56, height * 0.75, width * 0.16, height * 0.25);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(width * 0.28, height * 0.75, width * 0.16, height * 0.25);
  ctx.strokeRect(width * 0.56, height * 0.75, width * 0.16, height * 0.25);

  // Torso
  ctx.fillStyle = bodyColor;
  ctx.fillRect(width * 0.2, height * 0.4, width * 0.6, height * 0.38);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(width * 0.2, height * 0.4, width * 0.6, height * 0.38);

  // Arms. Drawn as a wider outlineColor pass first, then a narrower bodyColor pass on top -
  // the same bordered-stroke effect the torso/head get from strokeRect/arc+stroke, adapted to
  // a line shape (design-review-v2-round4.md FAIL-3: arms previously had no outline at all,
  // so the line color WAS the body color with zero contrast treatment).
  ctx.lineCap = 'round';
  const armWidth = Math.max(3, width * 0.1);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = armWidth + 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.2, height * 0.46);
  ctx.lineTo(width * 0.02, height * 0.65);
  ctx.moveTo(width * 0.8, height * 0.46);
  ctx.lineTo(width * 0.98, height * 0.65);
  ctx.stroke();
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = armWidth;
  ctx.beginPath();
  ctx.moveTo(width * 0.2, height * 0.46);
  ctx.lineTo(width * 0.02, height * 0.65);
  ctx.moveTo(width * 0.8, height * 0.46);
  ctx.lineTo(width * 0.98, height * 0.65);
  ctx.stroke();

  // Head
  const headRadius = height * 0.22;
  const headCx = width / 2;
  const headCy = headRadius + 1;
  ctx.beginPath();
  ctx.arc(headCx, headCy, headRadius, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.fill();
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Red eyes (F17 AC2). The boss uses a brighter red so its eyes retain contrast against
  // its own near-black body, not only against the background (F17 AC5 / round-1 N3).
  ctx.fillStyle = isBoss ? '#ff8080' : ENEMY_EYE_COLOR;
  ctx.beginPath();
  ctx.arc(headCx - headRadius * 0.4, headCy, headRadius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headCx + headRadius * 0.4, headCy, headRadius * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Damage-state crack overlay (F4 AC6 / F17 AC6/AC9): one crack line per hit taken,
  // contrast-adaptive against this enemy's own base body color, independent of the
  // toughness-color scale above.
  for (let i = 0; i < hitsTaken; i += 1) {
    const crackY = height * (0.45 + i * 0.14);
    ctx.beginPath();
    ctx.moveTo(width * 0.25, crackY);
    ctx.lineTo(width * 0.5, crackY + height * 0.08);
    ctx.lineTo(width * 0.75, crackY - height * 0.05);
    ctx.strokeStyle = damageOverlayColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

/** Power-up icons: each type is a distinct shape (not color-only), consistent with
 * the HUD readout describing the same type by name/text. Distinguishable while still
 * falling, before the catch collision (F11 AC8). Shared ring + disc for all four types;
 * only the glyph inside differs (PRD addendum v5 F23). All glyph coordinates are fractions
 * of `radius`. The stroked glyphs (double arrow, circle, X) stay within +-0.45 of the center; the
 * filled fist within +-0.65 and 0.75 of the center (F23 r5 AC3(d)). */
export function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  type: PowerUpType,
): void {
  ctx.save();
  ctx.translate(x, y);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
  ctx.fill();
  ctx.strokeStyle = LEVEL_INTRO_TEXT_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = LEVEL_INTRO_TEXT_COLOR;
  ctx.strokeStyle = LEVEL_INTRO_TEXT_COLOR;
  ctx.lineWidth = 2;

  switch (type) {
    case 'HIT_POWER':
      // PRD addendum v5 F23 AC4.1: filled fist, four knuckle bumps on top, no forearm.
      drawFistGlyph(ctx, radius);
      break;
    case 'SPEED':
      // Owner decision 2026-10-05: the double arrow "<-->" replaces the rabbit (F23 r6 AC4.2, Q-v5-2).
      drawDoubleArrowGlyph(ctx, radius);
      break;
    case 'SHIELD':
      // PRD addendum v5 F23 AC4.3: one small stroked circle, clear dark gap to the ring.
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.34, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'PERMANENT_MULTIPLIER':
      // PRD addendum v5 F23 AC4.4: capital "X" (two crossing diagonals). This is the one
      // "X" allowed by v4 F22 AC8(c); review-v2 V2-M3 risk-accepted by owner 2026-09-30.
      ctx.beginPath();
      ctx.moveTo(-radius * 0.35, -radius * 0.35);
      ctx.lineTo(radius * 0.35, radius * 0.35);
      ctx.moveTo(radius * 0.35, -radius * 0.35);
      ctx.lineTo(-radius * 0.35, radius * 0.35);
      ctx.stroke();
      break;
  }

  ctx.restore();
}

/** Knuckle dome spans (x0, x1) in the fist's own unit (see FIST_SCALE), left to right. */
const FIST_KNUCKLES = [
  [-0.26, -0.1],
  [-0.1, 0.06],
  [0.06, 0.22],
  [0.22, 0.38],
] as const;

/** The fist's unit as a multiple of the token radius. The filled glyphs are drawn larger
 * than the stroked ones so they survive the ~13 dp in-play token (F23 r5 AC3(d), AC4.1). */
const FIST_SCALE = 1.4;

/** Fist seen from the front, thumb tucked on the left: four round knuckle domes on the top
 * edge, a flat base (no wrist), drawn as one filled outline. Each dome is a bezier with
 * vertical end tangents, so the knuckles read as round bumps separated by sharp valleys
 * even at 24px. Spans about 1.12r by 0.97r (F23 r5 AC4.1). */
function drawFistGlyph(ctx: CanvasRenderingContext2D, radius: number): void {
  const r = radius * FIST_SCALE;
  const valleyY = -0.2 * r;
  const domeControlY = -0.347 * r;
  ctx.beginPath();
  ctx.moveTo(-0.26 * r, valleyY);
  for (const [x0, x1] of FIST_KNUCKLES) {
    ctx.bezierCurveTo(x0 * r, domeControlY, x1 * r, domeControlY, x1 * r, valleyY);
  }
  ctx.lineTo(0.38 * r, 0.3 * r);
  ctx.quadraticCurveTo(0.38 * r, 0.38 * r, 0.3 * r, 0.38 * r);
  ctx.lineTo(-0.18 * r, 0.38 * r);
  ctx.quadraticCurveTo(-0.26 * r, 0.38 * r, -0.26 * r, 0.3 * r);
  ctx.quadraticCurveTo(-0.44 * r, 0.26 * r, -0.42 * r, 0.12 * r); // thumb
  ctx.quadraticCurveTo(-0.4 * r, 0.02 * r, -0.26 * r, 0.02 * r);
  ctx.closePath();
  ctx.fill();
}

/** Horizontal double-headed arrow "<-->", stroked (F23 r6 AC4.2): one shaft through the
 * centre and an open chevron head at each end. Spans the full +-0.45r; each head is
 * 0.27r long and 0.6r tall (about 48 degrees off the shaft), so at r = 6.5 the heads are
 * still about 4 px tall. Five segments, no crossing strokes: the heads only touch the shaft
 * at its ends. */
function drawDoubleArrowGlyph(ctx: CanvasRenderingContext2D, r: number): void {
  const reach = 0.45 * r;
  ctx.beginPath();
  ctx.moveTo(-reach, 0);
  ctx.lineTo(reach, 0);
  for (const side of [-1, 1]) {
    ctx.moveTo(side * 0.18 * r, -0.3 * r);
    ctx.lineTo(side * reach, 0);
    ctx.lineTo(side * 0.18 * r, 0.3 * r);
  }
  ctx.stroke();
}

/** Rendering-only tuning: how long an individual firework particle burst stays visible
 * before fully fading. Not gameplay-affecting, so (unlike constants.ts) this lives beside
 * its only use, matching the existing precedent of CanvasRenderer's inline pulse threshold. */
const FIREWORK_PARTICLE_LIFE_SECONDS = 0.6;
const FIREWORK_PARTICLE_EXPANSION_SPEED = 140; // px/s
const FIREWORK_GRID_COLS = 3;

/**
 * F19 AC4: multi-colored firework bursts around the "Game Complete" text, replacing enemies
 * on screen. Purely a deterministic function of elapsed celebration time (no Math.random,
 * no wall clock) - same discipline as the existing blinkOn() helper - so bursts always
 * appear at the same moments and positions for a given elapsed time.
 */
export function drawFireworks(ctx: CanvasRenderingContext2D, elapsedSeconds: number): void {
  for (let i = 0; i < FIREWORK_BURST_COUNT; i += 1) {
    const burstStart = i * FIREWORK_BURST_INTERVAL_SECONDS;
    const age = elapsedSeconds - burstStart;
    if (age < 0 || age > FIREWORK_PARTICLE_LIFE_SECONDS) continue;

    const row = Math.floor(i / FIREWORK_GRID_COLS);
    const col = i % FIREWORK_GRID_COLS;
    const cx = (PLAYFIELD_WIDTH / FIREWORK_GRID_COLS) * (col + 0.5);
    const cy = (PLAYFIELD_HEIGHT / 2) * (row + 0.5) + 30;
    const alpha = Math.max(0, 1 - age / FIREWORK_PARTICLE_LIFE_SECONDS);
    const radius = age * FIREWORK_PARTICLE_EXPANSION_SPEED;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = FIREWORK_COLORS[i % FIREWORK_COLORS.length] ?? VANGUARD_WHITE;
    for (let p = 0; p < FIREWORK_PARTICLES_PER_BURST; p += 1) {
      const angle = (Math.PI * 2 * p) / FIREWORK_PARTICLES_PER_BURST;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
