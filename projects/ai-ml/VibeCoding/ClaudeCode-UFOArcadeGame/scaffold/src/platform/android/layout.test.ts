// Implements docs/mobile/architecture/mobile-architecture.md §6.1/§6.2/§6.2.1/§6.3/§6.4
// (H6; Amendments A11, A12): the worked 640x360 profile table (both layouts), the
// device-matrix scale table, the belowFloor path, `normalizeInsets`, and the §6.2.1
// window classification (every worked-check row, PRD-mobile M2.10a/M2.3b).

import { describe, expect, it } from 'vitest';
import {
  classifyWindow,
  computeLayout,
  normalizeInsets,
  TEXT_BOTTOM_LOGICAL,
  TEXT_TOP_LOGICAL,
  type LayoutInsets,
  type RawInsets,
} from './layout';

/** Test-only shorthand for a fully-normalized `LayoutInsets` (cutout fields default
 * to 0, i.e. "no cutout" - the common case across most of these tables). */
function LI(left: number, right: number, top: number, bottom: number, cutoutTop = 0, cutoutBottom = 0): LayoutInsets {
  return { left, right, top, bottom, cutoutTop, cutoutBottom };
}

const PLANNING_INSETS = LI(24, 24, 0, 24);
// §6.3 Amendment A12: the binding worked profile - measured gesture-navigation insets
// from code-review-round8 E1 (rounded), no cutout.
const MEASURED_GESTURE_INSETS = LI(30, 30, 28.2, 32);

describe('computeLayout - §6.3 worked 640x360 profile (v1 planning insets, kept as history)', () => {
  // §6.2 Amendment A12: with (24, 24, 0, 24) the horizontal numbers are unchanged
  // (width still binds, s=0.52), but the vertical PLACEMENT changes because the
  // bottom reservation at the floor is now `max(cutoutBottom, bottom - 6.5)` = 17.5,
  // not the full 24 - see the §16 A12 amendment-log note ("640 × 360 pfY is 15.38, not
  // 12").
  it('unswapped: horizontal numbers are unchanged; playfieldY reflects the A12 formula', () => {
    const layout = computeLayout({ width: 640, height: 360 }, PLANNING_INSETS, false);

    expect(layout.buttonSize).toBe(56);
    expect(layout.scale).toBeCloseTo(0.52, 2);
    expect(layout.belowFloor).toBe(false);
    expect(layout.playfieldWidth).toBeCloseTo(416, 0);
    expect(layout.playfieldHeight).toBeCloseTo(312, 0);
    expect(layout.playfieldX).toBeCloseTo(144, 0);
    expect(layout.playfieldY).toBeCloseTo(15.38, 1);

    expect(layout.leftButtonX).toBeCloseTo(0, 0);
    expect(layout.rightButtonX).toBeCloseTo(64, 0);
    expect(layout.throwButtonX).toBeCloseTo(536, 0);
    expect(layout.pauseButtonX).toBeCloseTo(540, 0);
    expect(layout.pauseButtonY).toBe(16);
    expect(layout.controlRowY).toBeCloseTo(280, 0);
  });

  it('swapped: mirrors the movement/THROW columns; playfieldY matches the unswapped case', () => {
    const layout = computeLayout({ width: 640, height: 360 }, PLANNING_INSETS, true);

    expect(layout.buttonSize).toBe(56);
    expect(layout.scale).toBeCloseTo(0.52, 2);
    expect(layout.playfieldX).toBeCloseTo(80, 0);
    expect(layout.playfieldY).toBeCloseTo(15.38, 1);

    expect(layout.leftButtonX).toBeCloseTo(472, 0);
    expect(layout.rightButtonX).toBeCloseTo(536, 0);
    expect(layout.throwButtonX).toBeCloseTo(0, 0);
    expect(layout.pauseButtonX).toBeCloseTo(4, 0);
  });
});

describe('computeLayout - §6.3 Amendment A12: measured gesture-navigation profile (binding)', () => {
  it('unswapped: matches the A12 worked table (s=0.505, playfield 404x303, pfY~28.87)', () => {
    const layout = computeLayout({ width: 640, height: 360 }, MEASURED_GESTURE_INSETS, false);

    expect(layout.buttonSize).toBe(56);
    expect(layout.scale).toBeCloseTo(0.505, 3);
    expect(layout.belowFloor).toBe(false);
    expect(layout.playfieldWidth).toBeCloseTo(404, 0);
    expect(layout.playfieldHeight).toBeCloseTo(303, 0);
    expect(layout.playfieldX).toBeCloseTo(150, 0);
    expect(layout.playfieldY).toBeCloseTo(28.87, 1);
  });

  it('three-button navigation (0,48,24,0) plays at s=0.52, pfY~34.96 (§6.3 A12)', () => {
    const layout = computeLayout({ width: 640, height: 360 }, LI(0, 48, 24, 0), false);
    expect(layout.buttonSize).toBe(56);
    expect(layout.scale).toBeCloseTo(0.52, 2);
    expect(layout.playfieldY).toBeCloseTo(34.96, 1);
  });

  it('three-button navigation, mirrored (48,0,24,0), matches (§6.3 A12)', () => {
    const layout = computeLayout({ width: 640, height: 360 }, LI(48, 0, 24, 0), false);
    expect(layout.buttonSize).toBe(56);
    expect(layout.scale).toBeCloseTo(0.52, 2);
    expect(layout.playfieldY).toBeCloseTo(34.96, 1);
  });

  it('a top cutout (30,30,30,32;cT=30,cB=0) never draws art above the cutout (row 6)', () => {
    const layout = computeLayout({ width: 640, height: 360 }, LI(30, 30, 30, 32, 30, 0), false);
    expect(layout.scale).toBeCloseTo(0.505, 3);
    expect(layout.playfieldY).toBeGreaterThanOrEqual(30 - 1e-9);
    expect(layout.playfieldY).toBeCloseTo(30.78, 1);
  });

  it('a bottom cutout (30,30,24,32;cT=0,cB=32) never draws art below the cutout (row 7)', () => {
    const layout = computeLayout({ width: 640, height: 360 }, LI(30, 30, 24, 32, 0, 32), false);
    expect(layout.scale).toBeCloseTo(0.505, 3);
    const playfieldBottom = layout.playfieldY + layout.playfieldHeight;
    expect(playfieldBottom).toBeLessThanOrEqual(360 - 32 + 1e-9);
    expect(playfieldBottom).toBeCloseTo(326.49, 1);
  });

  it('round-8 measured Pixel 7 native window (915x412) plays at s~0.6005, height binds (row 10)', () => {
    const layout = computeLayout({ width: 915, height: 412 }, LI(51.8, 29.7, 28.2, 32), false);
    expect(layout.buttonSize).toBe(64);
    expect(layout.scale).toBeCloseTo(0.6005, 3);
  });

  it('the exact boundary (636x351.5, insets 30,30,28,32) plays at s=0.5 exactly (row 11)', () => {
    const layout = computeLayout({ width: 636, height: 351.5 }, LI(30, 30, 28, 32), false);
    expect(layout.scale).toBe(0.5);
    expect(layout.belowFloor).toBe(false);
  });

  it('640x352 with (30,30,28,32) plays at s~0.5008 - the v1.5 formula would have said tooSmall (row 14)', () => {
    const layout = computeLayout({ width: 640, height: 352 }, LI(30, 30, 28, 32), false);
    expect(layout.scale).toBeGreaterThanOrEqual(0.5);
    expect(layout.scale).toBeCloseTo(0.5008, 3);
  });
});

describe('computeLayout - §6.4 device-matrix scale table (v1 planning insets, kept as history)', () => {
  // §6.2 Amendment A12: only the height-bound rows' scale changes (the bottom
  // reservation at the floor shrank from 24 to 17.5); width-bound rows are unchanged.
  const cases: Array<[string, { width: number; height: number }, number, number]> = [
    ['Low-end / small phone 640x360 (width-bound, unchanged)', { width: 640, height: 360 }, 56, 0.52],
    ['Tall low-end 20:9, 800x360 (height-bound, A12 changes it)', { width: 800, height: 360 }, 64, 0.5708],
    ['Mid-range 20:9, ~915x412 (height-bound, A12 changes it)', { width: 915, height: 412 }, 64, 0.6575],
    ['10" tablet 16:10, 1280x800 (width-bound, unchanged)', { width: 1280, height: 800 }, 64, 1.29],
    ['4:3 tablet, 1024x768 (width-bound, unchanged)', { width: 1024, height: 768 }, 64, 0.97],
    ['Foldable inner, ~841x701 (width-bound, unchanged)', { width: 841, height: 701 }, 64, 0.741],
  ];

  // code-review-round11.md S1 (same defect as round-10 L2): '%s' after other `%`
  // placeholders is positional, not named, so `%i`/`%f` here consumed the
  // `viewport`/`expectedButton`/`expectedScale` values meant for the assertions,
  // printing literal "B=NaN, scale~NaN". A single '%s' title avoids the ambiguity.
  it.each(cases)('%s', (_label, viewport, expectedButton, expectedScale) => {
    const layout = computeLayout(viewport, PLANNING_INSETS, false);
    expect(layout.buttonSize).toBe(expectedButton);
    expect(layout.scale).toBeCloseTo(expectedScale, 2);
    expect(layout.scale).toBeGreaterThanOrEqual(0.5);
  });
});

describe('computeLayout - §6.4 Amendment A12: measured gesture-navigation profile table', () => {
  const cases: Array<[string, { width: number; height: number }, number, number]> = [
    ['Low-end / small phone 640x360', { width: 640, height: 360 }, 56, 0.505],
    ['Tall low-end 20:9, 800x360', { width: 800, height: 360 }, 64, 0.514],
    ['Mid-range 20:9, ~915x412', { width: 915, height: 412 }, 64, 0.6],
    ['10" tablet 16:10, 1280x800', { width: 1280, height: 800 }, 64, 1.247],
    ['4:3 tablet, 1024x768', { width: 1024, height: 768 }, 64, 0.955],
    ['Foldable inner, ~841x701', { width: 841, height: 701 }, 64, 0.726],
  ];

  // code-review-round11.md S1: see the identical fix and rationale above.
  it.each(cases)('%s', (_label, viewport, expectedButton, expectedScale) => {
    const layout = computeLayout(viewport, MEASURED_GESTURE_INSETS, false);
    expect(layout.buttonSize).toBe(expectedButton);
    expect(layout.scale).toBeCloseTo(expectedScale, 2);
    expect(layout.scale).toBeGreaterThanOrEqual(0.5);
  });
});

describe('computeLayout - belowFloor (M2.3a/M2.13)', () => {
  it('sets belowFloor and keeps controls at their minimum size when insets are too large', () => {
    const hugeInsets = LI(200, 200, 0, 24);
    const layout = computeLayout({ width: 640, height: 360 }, hugeInsets, false);

    expect(layout.belowFloor).toBe(true);
    expect(layout.buttonSize).toBe(56); // never shrinks below the minimum
    expect(layout.scale).toBeLessThan(0.5);
  });
});

describe('normalizeInsets (§6.1 Amendment A12)', () => {
  it('a missing or non-finite cutout falls back to the (already-normalized) matching edge inset', () => {
    expect(normalizeInsets({ left: 30, right: 30, top: 28.2, bottom: 32 })).toEqual(
      LI(30, 30, 28.2, 32, 28.2, 32),
    );
    expect(
      normalizeInsets({
        left: 30,
        right: 30,
        top: 28.2,
        bottom: 32,
        cutoutTop: Number.NaN,
        cutoutBottom: Number.POSITIVE_INFINITY,
      }),
    ).toEqual(LI(30, 30, 28.2, 32, 28.2, 32));
  });

  it('a negative cutout field normalizes to 0, not the fallback edge', () => {
    expect(normalizeInsets({ left: 30, right: 30, top: 28.2, bottom: 32, cutoutTop: -5, cutoutBottom: -1 })).toEqual(
      LI(30, 30, 28.2, 32, 0, 0),
    );
  });

  it('a cutout larger than its edge raises the edge to the cutout (never leaves cutout > edge)', () => {
    const result = normalizeInsets({ left: 30, right: 30, top: 10, bottom: 10, cutoutTop: 40, cutoutBottom: 50 });
    expect(result.cutoutTop).toBe(40);
    expect(result.cutoutBottom).toBe(50);
    expect(result.top).toBe(40);
    expect(result.bottom).toBe(50);
  });

  it('a complete, valid payload is unchanged', () => {
    const raw: RawInsets = { left: 12, right: 8, top: 4, bottom: 16, cutoutTop: 4, cutoutBottom: 10 };
    expect(normalizeInsets(raw)).toEqual(LI(12, 8, 4, 16, 4, 10));
  });

  it('missing/non-finite/negative edge fields normalize to 0, same as before A12', () => {
    expect(
      normalizeInsets({ left: Number.NaN, right: -5, top: undefined as unknown as number, bottom: 24 }),
    ).toEqual(LI(0, 0, 0, 24, 0, 24));
  });
});

describe('classifyWindow (§6.2.1, Amendment A12) - v1.6 worked-check table', () => {
  const cases: Array<[string, { width: number; height: number }, LayoutInsets, 'portrait' | 'tooSmall' | 'playable']> = [
    ['row 1: 640x360, gesture insets (t=24)', { width: 640, height: 360 }, LI(30, 30, 24, 32), 'playable'],
    ['row 2: 640x360, measured gesture insets', { width: 640, height: 360 }, MEASURED_GESTURE_INSETS, 'playable'],
    ['row 3: 640x360, round-8 measured (29.7,29.7,28.2,32)', { width: 640, height: 360 }, LI(29.7, 29.7, 28.2, 32), 'playable'],
    ['row 4: 640x360, three-button (0,48,24,0)', { width: 640, height: 360 }, LI(0, 48, 24, 0), 'playable'],
    ['row 5: 640x360, three-button mirrored (48,0,24,0)', { width: 640, height: 360 }, LI(48, 0, 24, 0), 'playable'],
    ['row 6: 640x360, top cutout (30,30,30,32;cT=30)', { width: 640, height: 360 }, LI(30, 30, 30, 32, 30, 0), 'playable'],
    ['row 7: 640x360, bottom cutout (30,30,24,32;cB=32)', { width: 640, height: 360 }, LI(30, 30, 24, 32, 0, 32), 'playable'],
    ['row 8: 600x360, measured gesture insets is too small (600 < 636)', { width: 600, height: 360 }, MEASURED_GESTURE_INSETS, 'tooSmall'],
    [
      'row 9: 640x360, side cutout pushes l+r past 64 (M2.3b known width limit)',
      { width: 640, height: 360 },
      LI(36.2, 29.7, 28.2, 32),
      'tooSmall',
    ],
    ['row 10: round-8 Pixel 7 native window 915x412', { width: 915, height: 412 }, LI(51.8, 29.7, 28.2, 32), 'playable'],
    ['row 11: 636x351.5 is the exact boundary (s=0.5) and plays', { width: 636, height: 351.5 }, LI(30, 30, 28, 32), 'playable'],
    ['row 12: 635x351.5 (1dp under minW) is too small', { width: 635, height: 351.5 }, LI(30, 30, 28, 32), 'tooSmall'],
    ['row 13: 636x351 (0.5dp under minH) is too small', { width: 636, height: 351 }, LI(30, 30, 28, 32), 'tooSmall'],
    ['row 14: 640x352 plays - the v1.5 formula would have said tooSmall', { width: 640, height: 352 }, LI(30, 30, 28, 32), 'playable'],
    ['row 15a: 624x300 plays (s=0.5 exactly)', { width: 624, height: 300 }, LI(24, 24, 0, 0), 'playable'],
    ['row 15b: 623x300 (1dp under minW) is too small', { width: 623, height: 300 }, LI(24, 24, 0, 0), 'tooSmall'],
    ['row 15c: 624x299 (1dp under minH) is too small', { width: 624, height: 299 }, LI(24, 24, 0, 0), 'tooSmall'],
    ['row 16: 640x360 with planning insets plays (§6.3 planning)', { width: 640, height: 360 }, PLANNING_INSETS, 'playable'],
    [
      'row 17: 640x360 with real insets above the 32dp headroom is too small (MR4)',
      { width: 640, height: 360 },
      LI(40, 40, 0, 24),
      'tooSmall',
    ],
    ['row 18: svr_api36_fold 412x309 is too small regardless of insets', { width: 412, height: 309 }, LI(0, 0, 0, 0), 'tooSmall'],
    ['row 19: 360x640 stays on the portrait path (M2.10 precedence)', { width: 360, height: 640 }, PLANNING_INSETS, 'portrait'],
  ];

  it.each(cases)('%s', (_label, viewport, insets, expected) => {
    expect(classifyWindow(viewport, insets, false)).toBe(expected);
  });

  it.each(cases)('%s (swapped - swap does not change the floor, M3.13)', (_label, viewport, insets, expected) => {
    expect(classifyWindow(viewport, insets, true)).toBe(expected);
  });

  // Row 20: an absent cutout payload is normalized to equal its edge inset (fail-safe,
  // §6.1 A12), which reproduces the v1.5 formula exactly and is stricter than the true
  // (no-cutout) result - proof that the native fields, once really absent, still
  // degrade safely rather than silently allowing art under a real cutout.
  it('row 20: absent cutout fields normalize to the v1.5-equivalent (stricter) result', () => {
    const normalized = normalizeInsets({ left: 30, right: 30, top: 28.2, bottom: 32 });
    expect(classifyWindow({ width: 640, height: 360 }, normalized, false)).toBe('tooSmall');
    expect(classifyWindow({ width: 640, height: 360 }, normalized, true)).toBe('tooSmall');
  });

  it('a square window (W === H) stays on the portrait path', () => {
    expect(classifyWindow({ width: 500, height: 500 }, LI(0, 0, 0, 0), false)).toBe('portrait');
  });
});

describe('classifyWindow/computeLayout agreement over the full invariant grid (§10.1 Amendment A12, binding)', () => {
  // code-review-round9.md R1: the previous version of this test cut the grid to a
  // "representative" 2,376-case sample and dropped the control-rect assertion
  // entirely, both undocumented deviations from the binding §10.1 A12 spec text. The
  // grid below is the spec's grid, built by loop rather than by hand-picked values, so
  // it cannot silently drift out of sync with §10.1 again: W 560-1400 and H 280-820 in
  // 20 dp steps; l, r in {0, 24, 30, 48}; t in {0, 24, 28.2, 36}; b in {0, 24, 32, 40};
  // cT in {0, t}; cB in {0, b}; both swap settings. That is 43 x 28 x 4 x 4 x 4 x 4 x 2
  // x 2 x 2 = 2,465,792 cases, matching the independent count in
  // code-review-round9.md's verification table.
  const WIDTHS: number[] = [];
  for (let w = 560; w <= 1400; w += 20) WIDTHS.push(w);
  const HEIGHTS: number[] = [];
  for (let h = 280; h <= 820; h += 20) HEIGHTS.push(h);
  const SIDE_INSETS = [0, 24, 30, 48];
  const TOP_INSETS = [0, 24, 28.2, 36];
  const BOTTOM_INSETS = [0, 24, 32, 40];
  // §6.2: PAUSE is fixed at 48 dp regardless of the chosen button size - not exported
  // from layout.ts (it never varies), so it is restated here for the control-rect check.
  const PAUSE_SIZE_DP = 48;

  interface Violation {
    label: string;
    reason: string;
  }

  /** Converts a `#safe-layer`-relative control rect (see layout.ts's C1/C2 header
   * comment) to the viewport frame the full-inset/playfield checks below use. */
  function toViewportRect(x: number, y: number, size: number, insets: LayoutInsets) {
    return { x: insets.left + x, y: insets.top + y, size };
  }

  it('every case: classifyWindow/belowFloor agree; every playable result keeps s>=0.5, art and text clear of the cutouts, and every control rect inside the full insets and clear of the playfield x-range', () => {
    // Collected and asserted once at the end (§10.1 A12's fix note): an `expect` call
    // per case, across 2.4M cases, is what would actually make this slow - the grid
    // itself runs in under a couple of seconds.
    const violations: Violation[] = [];

    for (const width of WIDTHS) {
      for (const height of HEIGHTS) {
        const portrait = width <= height;
        for (const left of SIDE_INSETS) {
          for (const right of SIDE_INSETS) {
            for (const top of TOP_INSETS) {
              for (const bottom of BOTTOM_INSETS) {
                for (const cutoutTop of [0, top]) {
                  for (const cutoutBottom of [0, bottom]) {
                    const insets: LayoutInsets = { left, right, top, bottom, cutoutTop, cutoutBottom };
                    for (const swapControls of [false, true]) {
                      const viewport = { width, height };
                      const windowClass = classifyWindow(viewport, insets, swapControls);
                      const label = `${width}x${height} l${left} r${right} t${top} b${bottom} cT${cutoutTop} cB${cutoutBottom} swap${swapControls}`;

                      if (portrait) {
                        if (windowClass !== 'portrait') {
                          violations.push({ label, reason: `expected portrait, got ${windowClass}` });
                        }
                        continue;
                      }

                      const layout = computeLayout(viewport, insets, swapControls);
                      // Assertion 5: classifyWindow agrees with belowFloor.
                      if ((windowClass === 'tooSmall') !== layout.belowFloor) {
                        violations.push({
                          label,
                          reason: `classifyWindow=${windowClass} but belowFloor=${layout.belowFloor}`,
                        });
                      }
                      if (windowClass !== 'playable') continue;

                      const { scale, playfieldX, playfieldY, playfieldWidth, playfieldHeight, buttonSize } = layout;

                      // Assertion 1: s >= 0.5.
                      if (scale < 0.5 - 1e-9) {
                        violations.push({ label, reason: `scale ${scale} < 0.5` });
                      }
                      // Assertion 2: no art under a cutout (M2.3b rule 1).
                      if (playfieldY < insets.cutoutTop - 1e-9) {
                        violations.push({ label, reason: `playfieldY ${playfieldY} above cutoutTop ${insets.cutoutTop}` });
                      }
                      if (playfieldY + playfieldHeight > height - insets.cutoutBottom + 1e-9) {
                        violations.push({ label, reason: 'playfield bottom edge is below cutoutBottom' });
                      }
                      // Assertion 3: text inside the full insets (M2.3b rule 2).
                      if (playfieldY + TEXT_TOP_LOGICAL * scale < insets.top - 1e-9) {
                        violations.push({ label, reason: 'top text is above the top inset' });
                      }
                      if (playfieldY + playfieldHeight - TEXT_BOTTOM_LOGICAL * scale > height - insets.bottom + 1e-9) {
                        violations.push({ label, reason: 'bottom text is below the bottom inset' });
                      }

                      // Assertion 4: every control rect is inside the full insets and
                      // does not overlap the playfield's x range (M2.3b rule 3, M2.4) -
                      // the regression this grid exists to catch, per A12 moving the
                      // playfield into the bands.
                      const rects = [
                        toViewportRect(layout.leftButtonX, layout.controlRowY, buttonSize, insets),
                        toViewportRect(layout.rightButtonX, layout.controlRowY, buttonSize, insets),
                        toViewportRect(layout.throwButtonX, layout.controlRowY, buttonSize, insets),
                        toViewportRect(layout.pauseButtonX, layout.pauseButtonY, PAUSE_SIZE_DP, insets),
                      ];
                      const pfLeft = playfieldX;
                      const pfRight = playfieldX + playfieldWidth;
                      for (const rect of rects) {
                        const insideInsets =
                          rect.x >= insets.left - 1e-9 &&
                          rect.x + rect.size <= width - insets.right + 1e-9 &&
                          rect.y >= insets.top - 1e-9 &&
                          rect.y + rect.size <= height - insets.bottom + 1e-9;
                        if (!insideInsets) {
                          violations.push({
                            label,
                            reason: `control rect [${rect.x},${rect.y},${rect.size}] is outside the full insets`,
                          });
                        }
                        const overlapsPlayfieldX = rect.x < pfRight - 1e-9 && rect.x + rect.size > pfLeft + 1e-9;
                        if (overlapsPlayfieldX) {
                          violations.push({
                            label,
                            reason: `control rect x-range overlaps the playfield [${pfLeft},${pfRight}]`,
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    expect(violations.slice(0, 20)).toEqual([]);
  });
});

describe('classifyWindow/computeLayout - every §6.2.1 A12 worked-check row, both swap settings (§10.1 A12)', () => {
  // §10.1 A12: "assert the numeric s/playfieldY results for every row of the §6.2.1
  // A12 worked-check table, in both swap settings" - a representative slice of rows
  // (1-7, 10, 14) covering the measured-gesture, three-button, top-cutout,
  // bottom-cutout, Pixel-7-native and v1.5-vs-A12-boundary cases. playfieldY does not
  // depend on swapControls (only the horizontal placement does - §6.2 A12), so this is
  // a loop over both swap settings for the same expected pfY.
  const rows: Array<[string, { width: number; height: number }, LayoutInsets, number, number]> = [
    ['row 1: 640x360, gesture insets (t=24)', { width: 640, height: 360 }, LI(30, 30, 24, 32), 0.505, 26.77],
    ['row 2: 640x360, measured gesture insets', { width: 640, height: 360 }, MEASURED_GESTURE_INSETS, 0.505, 28.87],
    [
      'row 3: 640x360, round-8 measured (29.7,29.7,28.2,32)',
      { width: 640, height: 360 },
      LI(29.7, 29.7, 28.2, 32),
      0.5058,
      28.65,
    ],
    ['row 4: 640x360, three-button (0,48,24,0)', { width: 640, height: 360 }, LI(0, 48, 24, 0), 0.52, 34.96],
    ['row 5: 640x360, three-button mirrored (48,0,24,0)', { width: 640, height: 360 }, LI(48, 0, 24, 0), 0.52, 34.96],
    [
      'row 6: 640x360, top cutout (30,30,30,32;cT=30)',
      { width: 640, height: 360 },
      LI(30, 30, 30, 32, 30, 0),
      0.505,
      30.78,
    ],
    [
      'row 7: 640x360, bottom cutout (30,30,24,32;cB=32)',
      { width: 640, height: 360 },
      LI(30, 30, 24, 32, 0, 32),
      0.505,
      23.49,
    ],
    [
      'row 10: round-8 Pixel 7 native window 915x412',
      { width: 915, height: 412 },
      LI(51.8, 29.7, 28.2, 32),
      0.6005,
      26.65,
    ],
    [
      'row 14: 640x352 plays - the v1.5 formula would have said tooSmall',
      { width: 640, height: 352 },
      LI(30, 30, 28, 32),
      0.5008,
      26.0,
    ],
  ];

  // L2 (code-review-round10.md): a single `%s` placeholder - `%f` after it would
  // consume the `viewport`/`insets` objects positionally (printf-style, not named),
  // which is why titles printed literal "s~NaN, playfieldY~NaN" before this fix.
  it.each(rows)('%s (unswapped)', (_label, viewport, insets, expectedScale, expectedPfY) => {
    const layout = computeLayout(viewport, insets, false);
    // L2: precision 3 (±0.0005) so this can tell row 3's 0.5058 from 0.505 and row
    // 14's 0.5008 from 0.5, matching the dedicated row-14 check below.
    expect(layout.scale).toBeCloseTo(expectedScale, 3);
    expect(layout.playfieldY).toBeCloseTo(expectedPfY, 1);
  });

  it.each(rows)('%s (swapped)', (_label, viewport, insets, expectedScale, expectedPfY) => {
    const layout = computeLayout(viewport, insets, true);
    expect(layout.scale).toBeCloseTo(expectedScale, 3);
    expect(layout.playfieldY).toBeCloseTo(expectedPfY, 1);
  });
});

// Architecture §6.2.1 Amendment A13 (PRD-mobile M2.3c): a three-button bar kept along the
// bottom, insets (l 0, r 0, t 24, b 48; no cutout). minW = 576, minH = 22 + 41.5 + 300 =
// 363.5. Worked-check rows 21-24, each in both swap settings.
describe('classifyWindow/computeLayout - §6.2.1 A13 worked-check rows 21-24 (bottom bar), both swap settings', () => {
  const BOTTOM_BAR = LI(0, 0, 24, 48);

  for (const swap of [false, true]) {
    const suffix = swap ? '(swapped)' : '(unswapped)';

    it(`row 21: 640x360 is tooSmall on height - the M2.3c known limit ${suffix}`, () => {
      expect(classifyWindow({ width: 640, height: 360 }, BOTTOM_BAR, swap)).toBe('tooSmall');
    });

    it(`row 22: 640x368 plays at B 64, s=0.5075, text inside the bands, controls placed ${suffix}`, () => {
      const viewport = { width: 640, height: 368 };
      expect(classifyWindow(viewport, BOTTOM_BAR, swap)).toBe('playable');
      const layout = computeLayout(viewport, BOTTOM_BAR, swap);
      expect(layout.buttonSize).toBe(64);
      expect(layout.belowFloor).toBe(false);
      expect(layout.scale).toBeCloseTo(0.5075, 3);
      expect(layout.playfieldWidth).toBeCloseTo(406, 3);
      expect(layout.playfieldHeight).toBeCloseTo(304.5, 3);
      expect(layout.playfieldX).toBeCloseTo(swap ? 81 : 153, 3);
      expect(layout.playfieldY).toBeCloseTo(22.034, 3);
      // HUD text top >= t (24) and hint bottom <= H - b (320).
      expect(layout.playfieldY + TEXT_TOP_LOGICAL * layout.scale).toBeGreaterThanOrEqual(24 - 0.001);
      expect(layout.playfieldY + layout.playfieldHeight - TEXT_BOTTOM_LOGICAL * layout.scale).toBeLessThanOrEqual(
        320 + 0.001,
      );
      // Controls are #safe-layer relative: PAUSE at the top band edge + 16, bottom row ends at H - b.
      expect(layout.pauseButtonY).toBe(16);
      expect(layout.controlRowY).toBeCloseTo(368 - 24 - 48 - 64, 3);
      // Spec row 22: unswapped THROW 576-640, left ◀ 0-64, ▶ 72-136; mirrored when swapped.
      expect(layout.throwButtonX).toBeCloseTo(swap ? 0 : 576, 3);
      expect(layout.leftButtonX).toBeCloseTo(swap ? 504 : 0, 3);
      expect(layout.rightButtonX).toBeCloseTo(swap ? 576 : 72, 3);
    });

    it(`row 23: 640x363.5 is the exact boundary: s=0.5, text edges equal the insets ${suffix}`, () => {
      const viewport = { width: 640, height: 363.5 };
      expect(classifyWindow(viewport, BOTTOM_BAR, swap)).toBe('playable');
      const layout = computeLayout(viewport, BOTTOM_BAR, swap);
      expect(layout.buttonSize).toBe(64);
      expect(layout.scale).toBe(0.5);
      expect(layout.playfieldY).toBe(22);
      expect(layout.playfieldY + TEXT_TOP_LOGICAL * layout.scale).toBe(24);
      expect(layout.playfieldY + layout.playfieldHeight - TEXT_BOTTOM_LOGICAL * layout.scale).toBe(315.5);
    });

    it(`row 24: 640x363 (0.5 dp under minH) is tooSmall ${suffix}`, () => {
      expect(classifyWindow({ width: 640, height: 363 }, BOTTOM_BAR, swap)).toBe('tooSmall');
    });
  }
});
