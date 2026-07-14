// Tests PRD §F17 (white -> gray -> dark toughness color mapping for Sentinels, boss
// is the darkest tier) and §F13 AC3 / §F14 AC2 (the shield reuses the exact same blue
// constant as the Vanguard avatar). jsdom does not implement a real 2D canvas context
// (no `canvas` package installed), so these are pure unit tests against a minimal fake
// CanvasRenderingContext2D that records every `fillStyle`/`strokeStyle` value assigned
// during a draw call - this exercises the real, exported drawing functions' actual
// color-selection logic (not a re-statement of the constants table), while staying
// independent of real pixel rendering (out of scope per the addendum's N4 playtest note).

import { describe, expect, it } from 'vitest';
import { drawSentinel, drawShield, drawVanguard } from './shapes';
import {
  BOSS_COLOR,
  ENEMY_TOUGHNESS_COLORS,
  VANGUARD_BLUE,
  VANGUARD_WHITE,
} from '../config/constants';
import type { HitsToKill } from '../core/types';

/** Minimal fake 2D context: every draw primitive is a no-op, but `fillStyle` and
 * `strokeStyle` assignments are recorded in order, so a test can assert which colors
 * a draw call actually used without needing real canvas pixel output. */
class FakeCtx {
  fillStyles: string[] = [];
  strokeStyles: string[] = [];
  private _fillStyle = '';
  private _strokeStyle = '';

  get fillStyle(): string {
    return this._fillStyle;
  }
  set fillStyle(value: string) {
    this._fillStyle = value;
    this.fillStyles.push(value);
  }
  get strokeStyle(): string {
    return this._strokeStyle;
  }
  set strokeStyle(value: string) {
    this._strokeStyle = value;
    this.strokeStyles.push(value);
  }

  lineWidth = 1;
  lineCap = 'butt';
  globalAlpha = 1;

  save(): void {}
  restore(): void {}
  translate(): void {}
  beginPath(): void {}
  closePath(): void {}
  moveTo(): void {}
  lineTo(): void {}
  arc(): void {}
  ellipse(): void {}
  fill(): void {}
  stroke(): void {}
  fillRect(): void {}
  strokeRect(): void {}
  setLineDash(): void {}
}

function fakeCtx(): CanvasRenderingContext2D {
  return new FakeCtx() as unknown as CanvasRenderingContext2D;
}

/** Relative luminance of a `#rrggbb` hex color (0 = black, 1 = white) - used to assert
 * the F17 AC3 "progressively darker" ordering as an objective, not eyeballed, property. */
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe('F17 AC3: ENEMY_TOUGHNESS_COLORS is a white -> progressively darker gray scale', () => {
  it('tier 1 (weakest) is the lightest; each tougher tier is strictly darker than the last', () => {
    const tiers: HitsToKill[] = [1, 2, 3, 4];
    const lightnesses = tiers.map((t) => luminance(ENEMY_TOUGHNESS_COLORS[t]));
    for (let i = 1; i < lightnesses.length; i += 1) {
      expect(lightnesses[i]!).toBeLessThan(lightnesses[i - 1]!);
    }
  });

  it('F17 AC5: the boss color is darker than every regular tier, including the toughest (4-hit)', () => {
    const bossLuminance = luminance(BOSS_COLOR);
    for (const tier of [1, 2, 3, 4] as HitsToKill[]) {
      expect(bossLuminance).toBeLessThan(luminance(ENEMY_TOUGHNESS_COLORS[tier]));
    }
  });
});

describe('F17 AC3/AC5: drawSentinel actually applies the toughness/boss color mapping', () => {
  it('a 1-hit enemy is drawn with the tier-1 (white) body color', () => {
    const ctx = fakeCtx() as unknown as FakeCtx;
    drawSentinel(ctx as unknown as CanvasRenderingContext2D, 0, 0, 36, 28, 1, 0, false);
    expect(ctx.fillStyles).toContain(ENEMY_TOUGHNESS_COLORS[1]);
  });

  it('a 2-hit enemy is drawn with the tier-2 body color', () => {
    const ctx = fakeCtx() as unknown as FakeCtx;
    drawSentinel(ctx as unknown as CanvasRenderingContext2D, 0, 0, 36, 28, 2, 0, false);
    expect(ctx.fillStyles).toContain(ENEMY_TOUGHNESS_COLORS[2]);
  });

  it('a 3-hit enemy is drawn with the tier-3 body color', () => {
    const ctx = fakeCtx() as unknown as FakeCtx;
    drawSentinel(ctx as unknown as CanvasRenderingContext2D, 0, 0, 36, 28, 3, 0, false);
    expect(ctx.fillStyles).toContain(ENEMY_TOUGHNESS_COLORS[3]);
  });

  it('a 4-hit enemy is drawn with the tier-4 (darkest regular) body color', () => {
    const ctx = fakeCtx() as unknown as FakeCtx;
    drawSentinel(ctx as unknown as CanvasRenderingContext2D, 0, 0, 36, 28, 4, 0, false);
    expect(ctx.fillStyles).toContain(ENEMY_TOUGHNESS_COLORS[4]);
  });

  it('F12 AC6/F17 AC5: the boss (isBoss=true) is drawn with the boss-unique color, never a regular tier color', () => {
    const ctx = fakeCtx() as unknown as FakeCtx;
    drawSentinel(ctx as unknown as CanvasRenderingContext2D, 0, 0, 180, 140, 20, 0, true);
    expect(ctx.fillStyles).toContain(BOSS_COLOR);
    expect(ctx.fillStyles).not.toContain(ENEMY_TOUGHNESS_COLORS[1]);
    expect(ctx.fillStyles).not.toContain(ENEMY_TOUGHNESS_COLORS[4]);
  });

  it('F17 AC2: every Sentinel is drawn with red eyes (regular and boss alike)', () => {
    const regular = fakeCtx() as unknown as FakeCtx;
    drawSentinel(regular as unknown as CanvasRenderingContext2D, 0, 0, 36, 28, 1, 0, false);
    expect(regular.fillStyles.some((c) => c.toLowerCase().startsWith('#ff'))).toBe(true);

    const boss = fakeCtx() as unknown as FakeCtx;
    drawSentinel(boss as unknown as CanvasRenderingContext2D, 0, 0, 180, 140, 20, 0, true);
    expect(boss.fillStyles.some((c) => c.toLowerCase().startsWith('#ff'))).toBe(true);
  });
});

describe('F13 AC3 / F14 AC2: the shield reuses the exact same blue constant as the Vanguard avatar', () => {
  it('drawVanguard (non-invulnerable) fills its body with VANGUARD_BLUE', () => {
    const ctx = fakeCtx() as unknown as FakeCtx;
    drawVanguard(ctx as unknown as CanvasRenderingContext2D, 0, 0, 40, 28, false, true);
    expect(ctx.fillStyles).toContain(VANGUARD_BLUE);
  });

  it('drawVanguard also uses VANGUARD_WHITE (F13 AC2: an artful blue-and-white combination)', () => {
    const ctx = fakeCtx() as unknown as FakeCtx;
    drawVanguard(ctx as unknown as CanvasRenderingContext2D, 0, 0, 40, 28, false, true);
    expect(ctx.fillStyles).toContain(VANGUARD_WHITE);
  });

  it('drawShield fills the shield with the literal same VANGUARD_BLUE value used by drawVanguard', () => {
    const ctx = fakeCtx() as unknown as FakeCtx;
    drawShield(ctx as unknown as CanvasRenderingContext2D, 0, 0, 8);
    expect(ctx.fillStyles).toContain(VANGUARD_BLUE);
  });
});
