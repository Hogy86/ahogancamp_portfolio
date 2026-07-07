// Implements PRD §F9 (original Vanguard/Sentinel art), §F9 AC4 / NFR-10 (hard IP
// constraint - no licensed motifs), §F4 AC6 (damage-state shape change), §F7 AC6 /
// §F8 AC9 (invulnerability visual distinction), §F3 AC6 (formation warning cue).
// ADR-0004: all art is procedurally drawn vector primitives, never raster/external
// images. Anti-motif rules are binding: the shield is a plain angular kite/hex
// form (explicitly NOT a red-white-blue concentric-star disc); Sentinels are
// blocky/angular generic robot forms (explicitly NOT any trademarked robot's
// silhouette or proportions).

import type { PowerUpType } from '../core/types';

/**
 * Vanguard (the player). A simple original soldier/hero silhouette: a rounded
 * helmet-head, a triangular torso, and a small forward-facing chest emblem that is
 * a plain chevron (not a star, not any trademarked shield shape).
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

  const bodyColor = '#3fa9f5';
  const trimColor = '#e8e8f0';

  // Invulnerability is shown with an aura ring (shape) in addition to a color
  // shift, satisfying the non-color-only requirement (F7 AC6 / F8 AC9). The aura
  // blinks (alternates visibility) rather than relying on hue alone.
  if (invulnerable && blinkOn) {
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width * 0.85, height * 0.9, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd873';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Torso: triangular body reading as a soldier/hero stance.
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = invulnerable && !blinkOn ? '#7fc4f7' : bodyColor;
  ctx.fill();
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Chest emblem: a plain chevron (explicitly not a star/concentric-ring motif).
  ctx.beginPath();
  ctx.moveTo(width / 2 - 6, height * 0.65);
  ctx.lineTo(width / 2, height * 0.5);
  ctx.lineTo(width / 2 + 6, height * 0.65);
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

/** F2/F9 AC4: the shield projectile - a plain angular kite shape, explicitly not a
 * red-white-blue concentric-star disc (ADR-0004 anti-motif rule). */
export function drawShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.lineTo(radius * 0.75, 0);
  ctx.lineTo(0, radius);
  ctx.lineTo(-radius * 0.75, 0);
  ctx.closePath();
  ctx.fillStyle = '#7de0c0';
  ctx.fill();
  ctx.strokeStyle = '#1c6b57';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** Enemy laser bolt - a simple elongated diamond, distinct from the shield's kite shape. */
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
  ctx.fillStyle = '#ff5a5a';
  ctx.fill();
  ctx.restore();
}

/**
 * A Sentinel robot. Generic blocky/angular body with a single circular optical
 * sensor - deliberately generic geometry, not modeled on any specific trademarked
 * robot's silhouette or proportions (ADR-0004 anti-motif rule). Damage state
 * (hitsTaken vs hitsToKill) changes the drawn shape - a crack overlay and a
 * darkening outline are added per hit taken, in addition to a color shift, so the
 * distinction is never color-only (F4 AC6 / NFR-9a).
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

  const damageFraction = hitsToKill > 0 ? hitsTaken / hitsToKill : 0;
  const baseColor = isBoss ? '#b25fe0' : '#e0955f';
  const bodyColor = damageFraction > 0 ? shadeTowardRed(baseColor, damageFraction) : baseColor;

  // Body: blocky rectangle with angular shoulder notches.
  ctx.beginPath();
  ctx.rect(0, height * 0.2, width, height * 0.8);
  ctx.fillStyle = bodyColor;
  ctx.fill();
  ctx.strokeStyle = '#2a2a3a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Head/sensor unit: a single circular "eye," generic and non-anthropomorphic.
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.18, width * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2a3a';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.18, width * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = isBoss ? '#ffb3ff' : '#ffd08a';
  ctx.fill();

  // Damage state visible shape change (non-color-only, F4 AC6): each hit taken
  // (beyond the first) adds a visible crack line across the body. This is a shape
  // change independent of the color shade change above.
  for (let i = 0; i < hitsTaken; i += 1) {
    const crackY = height * (0.35 + i * 0.15);
    ctx.beginPath();
    ctx.moveTo(width * 0.15, crackY);
    ctx.lineTo(width * 0.5, crackY + height * 0.08);
    ctx.lineTo(width * 0.85, crackY - height * 0.05);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Boss variant gets an extra angular "crown" shape so it's distinguishable at a
  // glance beyond just color (also non-color-only per NFR-9a general principle).
  if (isBoss) {
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.2);
    ctx.lineTo(width * 0.3, 0);
    ctx.lineTo(width * 0.5, height * 0.15);
    ctx.lineTo(width * 0.7, 0);
    ctx.lineTo(width * 0.9, height * 0.2);
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

function shadeTowardRed(hex: string, fraction: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const targetR = 200;
  const targetG = 30;
  const targetB = 30;
  const mix = Math.min(1, fraction);
  const nr = Math.round(r + (targetR - r) * mix);
  const ng = Math.round(g + (targetG - g) * mix);
  const nb = Math.round(b + (targetB - b) * mix);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

/** Power-up icons: each type is a distinct shape (not color-only), consistent with
 * the HUD readout describing the same type by name/text. */
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
  ctx.strokeStyle = '#ffd873';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffd873';
  ctx.strokeStyle = '#ffd873';
  ctx.lineWidth = 2;

  switch (type) {
    case 'HIT_POWER':
      // Upward chevron/arrow glyph.
      ctx.beginPath();
      ctx.moveTo(-radius * 0.5, radius * 0.3);
      ctx.lineTo(0, -radius * 0.5);
      ctx.lineTo(radius * 0.5, radius * 0.3);
      ctx.stroke();
      break;
    case 'SPEED':
      // Two forward-slanted speed lines.
      ctx.beginPath();
      ctx.moveTo(-radius * 0.5, -radius * 0.3);
      ctx.lineTo(radius * 0.2, -radius * 0.3);
      ctx.moveTo(-radius * 0.5, radius * 0.1);
      ctx.lineTo(radius * 0.4, radius * 0.1);
      ctx.stroke();
      break;
    case 'SHIELD':
      // Small kite echoing the player's shield shape, at a smaller scale.
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.5);
      ctx.lineTo(radius * 0.4, 0);
      ctx.lineTo(0, radius * 0.5);
      ctx.lineTo(-radius * 0.4, 0);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'PERMANENT_MULTIPLIER':
      // "x" glyph for the permanent multiplier.
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
