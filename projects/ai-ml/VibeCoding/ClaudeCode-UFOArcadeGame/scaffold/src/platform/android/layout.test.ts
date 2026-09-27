// Implements docs/mobile/architecture/mobile-architecture.md §6.2/§6.3/§6.4 (H6): the
// worked 640x360 profile table (both layouts), the device-matrix scale table, the
// belowFloor path, and the rotate-prompt rule.

import { describe, expect, it } from 'vitest';
import { computeLayout, needsRotatePrompt } from './layout';

const PLANNING_INSETS = { left: 24, right: 24, top: 0, bottom: 24 };

describe('computeLayout - §6.3 worked 640x360 profile', () => {
  it('unswapped: matches every number in the worked table', () => {
    const layout = computeLayout({ width: 640, height: 360 }, PLANNING_INSETS, false);

    expect(layout.buttonSize).toBe(56);
    expect(layout.scale).toBeCloseTo(0.52, 2);
    expect(layout.belowFloor).toBe(false);
    expect(layout.playfieldWidth).toBeCloseTo(416, 0);
    expect(layout.playfieldHeight).toBeCloseTo(312, 0);
    // Viewport frame: playfield spans x 144-560, y 12-324 (§6.3).
    expect(layout.playfieldX).toBeCloseTo(144, 0);
    expect(layout.playfieldY).toBeCloseTo(12, 0);

    // Safe-layer-local frame (origin at viewport (24, 0)): ◀ 0-56, ▶ 64-120,
    // THROW 536-592 (local width 592 = 640 - 24 - 24), PAUSE centred at 536+4=540.
    expect(layout.leftButtonX).toBeCloseTo(0, 0);
    expect(layout.rightButtonX).toBeCloseTo(64, 0);
    expect(layout.throwButtonX).toBeCloseTo(536, 0);
    expect(layout.pauseButtonX).toBeCloseTo(540, 0);
    expect(layout.pauseButtonY).toBe(16);
    // Row top: local bottom margin floor is 16, and insets.bottom (24) already
    // covers it, so controlRowY = localH - buttonSize = 336 - 56 = 280.
    expect(layout.controlRowY).toBeCloseTo(280, 0);
  });

  it('swapped: mirrors the movement/THROW columns, same sums', () => {
    const layout = computeLayout({ width: 640, height: 360 }, PLANNING_INSETS, true);

    expect(layout.buttonSize).toBe(56);
    expect(layout.scale).toBeCloseTo(0.52, 2);
    // Playfield now sits next to the (left-side) THROW column instead of the
    // (left-side) movement column: throwOuterViewport (24) + throwColWidth (56) = 80.
    expect(layout.playfieldX).toBeCloseTo(80, 0);
    expect(layout.playfieldY).toBeCloseTo(12, 0);

    // Movement zone now hugs the RIGHT edge of the local frame (592 wide):
    // leftButtonX = 592 - 120 = 472, rightButtonX = 472 + 64 = 536.
    expect(layout.leftButtonX).toBeCloseTo(472, 0);
    expect(layout.rightButtonX).toBeCloseTo(536, 0);
    // THROW now hugs the LEFT edge of the local frame.
    expect(layout.throwButtonX).toBeCloseTo(0, 0);
    expect(layout.pauseButtonX).toBeCloseTo(4, 0);
  });
});

describe('computeLayout - §6.4 device-matrix scale table', () => {
  const cases: Array<[string, { width: number; height: number }, number, number]> = [
    ['Low-end / small phone 640x360', { width: 640, height: 360 }, 56, 0.52],
    ['Tall low-end 20:9, 800x360', { width: 800, height: 360 }, 64, 0.56],
    ['Mid-range 20:9, ~915x412', { width: 915, height: 412 }, 64, 0.647],
    ['10" tablet 16:10, 1280x800', { width: 1280, height: 800 }, 64, 1.29],
    ['4:3 tablet, 1024x768', { width: 1024, height: 768 }, 64, 0.97],
    ['Foldable inner, ~841x701', { width: 841, height: 701 }, 64, 0.741],
  ];

  it.each(cases)('%s: B=%i, scale~%f', (_label, viewport, expectedButton, expectedScale) => {
    const layout = computeLayout(viewport, PLANNING_INSETS, false);
    expect(layout.buttonSize).toBe(expectedButton);
    expect(layout.scale).toBeCloseTo(expectedScale, 2);
    expect(layout.scale).toBeGreaterThanOrEqual(0.5);
  });
});

describe('computeLayout - belowFloor (M2.3a/M2.13)', () => {
  it('sets belowFloor and keeps controls at their minimum size when insets are too large', () => {
    const hugeInsets = { left: 200, right: 200, top: 0, bottom: 24 };
    const layout = computeLayout({ width: 640, height: 360 }, hugeInsets, false);

    expect(layout.belowFloor).toBe(true);
    expect(layout.buttonSize).toBe(56); // never shrinks below the minimum
    expect(layout.scale).toBeLessThan(0.5);
  });
});

describe('needsRotatePrompt (M2.10)', () => {
  it('flags a portrait-shaped viewport (width <= height)', () => {
    expect(needsRotatePrompt({ width: 360, height: 640 })).toBe(true);
    expect(needsRotatePrompt({ width: 500, height: 500 })).toBe(true);
  });

  it('flags a too-narrow or too-short landscape viewport', () => {
    expect(needsRotatePrompt({ width: 639, height: 400 })).toBe(true);
    expect(needsRotatePrompt({ width: 800, height: 359 })).toBe(true);
  });

  it('allows a landscape viewport at/above the minimum profile', () => {
    expect(needsRotatePrompt({ width: 640, height: 360 })).toBe(false);
  });
});
