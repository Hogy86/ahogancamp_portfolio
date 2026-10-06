// Implements PRD addendum v7 F24 AC1-AC3 (power-up guide on the title screen, website and
// Android) and supplies the F25 AC1 rows for the Android "How to play" overlay. Each icon is
// a small <canvas> drawn by the same `drawPowerUp` the falling token uses (no image files),
// marked `aria-hidden`; the label next to it is real text. Shared by ScreenController and
// src/platform/android/overlays.ts so both screens show the same icons and labels.
// All text goes through ui/dom.ts (`textContent` only, security binding constraint #2).

import { createElement } from './dom';
import { drawPowerUp } from '../render/shapes';
import {
  HIT_POWER_MULTIPLIER,
  POWERUP_DURATION_SECONDS,
  SPEED_MULTIPLIER,
} from '../config/constants';
import type { PowerUpType } from '../core/types';

export interface PowerUpGuideEntry {
  type: PowerUpType;
  /** F24 AC2: the visible label. */
  label: string;
  /** F25 AC1: one simple sentence. Built from the gameplay constants so it cannot drift
   * from what CollisionSystem/MovementSystem actually do (F25 AC2). */
  sentence: string;
}

/** F24 AC2 order: Power (fist), Speed (double arrow), Shield (circle), Multiplier (X). */
export const POWER_UP_GUIDE: readonly PowerUpGuideEntry[] = [
  {
    type: 'HIT_POWER',
    label: 'Power',
    sentence: `Your shield hits ${HIT_POWER_MULTIPLIER} times as hard for ${POWERUP_DURATION_SECONDS} seconds.`,
  },
  {
    type: 'SPEED',
    label: 'Speed',
    sentence: `You move ${SPEED_MULTIPLIER} times as fast for ${POWERUP_DURATION_SECONDS} seconds.`,
  },
  {
    type: 'SHIELD',
    label: 'Shield',
    sentence: `Robot lasers can't hurt you for ${POWERUP_DURATION_SECONDS} seconds.`,
  },
  {
    type: 'PERMANENT_MULTIPLIER',
    label: 'Multiplier',
    sentence: 'Your hits get stronger for the rest of the game.',
  },
];

/** Backing-store cap: sharp on high-density phones without large canvases. */
const MAX_PIXEL_RATIO = 3;

/**
 * A decorative power-up icon `cssSize` CSS px square, drawn by the game's own
 * `drawPowerUp`. The backing store is sized by devicePixelRatio so the icon is crisp. When
 * no 2D context exists (jsdom, or a browser that refuses one) the canvas stays blank; the
 * text label beside it still carries the meaning.
 */
export function createPowerUpIcon(type: PowerUpType, cssSize: number): HTMLCanvasElement {
  const canvas = createElement('canvas', 'power-up-icon');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.type = type;
  const ratio = Math.min(MAX_PIXEL_RATIO, Math.max(1, window.devicePixelRatio || 1));
  canvas.width = Math.round(cssSize * ratio);
  canvas.height = Math.round(cssSize * ratio);
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(ratio, ratio);
  // drawPowerUp strokes its ring 2px wide centred on the radius, so leave 1px for it.
  drawPowerUp(ctx, cssSize / 2, cssSize / 2, cssSize / 2 - 1, type);
  return canvas;
}

const TITLE_ICON_SIZE = 24;

/** F24: the title screen's row of four icons, each with its label. */
export function createPowerUpGuide(): HTMLElement {
  const list = createElement('ul', 'power-up-guide');
  list.setAttribute('aria-label', 'Power-ups');
  for (const { type, label } of POWER_UP_GUIDE) {
    const item = createElement('li', 'power-up-guide__item');
    item.append(
      createPowerUpIcon(type, TITLE_ICON_SIZE),
      createElement('span', 'power-up-guide__label', label),
    );
    list.append(item);
  }
  return list;
}

const HELP_ICON_SIZE = 20;

/** F25 AC1: one row per power-up - icon, label, then its one-sentence explanation. Used by
 * the Android "How to play" overlay (the website has no help screen, F25 AC4). */
export function createPowerUpHelpList(): HTMLElement {
  const list = createElement('ul', 'power-up-help');
  list.setAttribute('aria-label', 'Power-ups');
  for (const { type, label, sentence } of POWER_UP_GUIDE) {
    const item = createElement('li', 'power-up-help__item');
    item.append(
      createPowerUpIcon(type, HELP_ICON_SIZE),
      createElement('span', 'power-up-help__label', label),
      createElement('span', 'power-up-help__sentence', sentence),
    );
    list.append(item);
  }
  return list;
}
