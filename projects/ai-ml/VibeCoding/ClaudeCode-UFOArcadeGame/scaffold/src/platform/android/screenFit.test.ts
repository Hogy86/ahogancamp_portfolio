// Validation round 4 F2 / test gap T3: on svr_api36_pixel7 with `wm size 945x1680`
// (640 x 360 dp, real insets l + r = 65.9) the game played instead of showing the
// M2.10a prompt, because the layout read `window.innerWidth/innerHeight` and Android
// WebView transiently reported the zoomed visual viewport (642 x 361) at the `resize`
// event while the layout viewport was already exactly 640 x 360. These tests
// reproduce that rounding without a device: `window.innerWidth` is set to the
// transient device value and the layout viewport (`<html>` box) to the true one.

import { afterEach, describe, expect, it } from 'vitest';
import { classifyWindow, normalizeInsets } from './layout';
import { readLayoutViewport } from './screenFit';

/** The measured device payload: t 28.1905, b 32, l 36.1905, r 29.7143 (l + r = 65.9). */
const PIXEL7_REAL_INSETS = normalizeInsets({ left: 36.1905, right: 29.7143, top: 28.1905, bottom: 32 });

function stubWindow(inner: { width: number; height: number }, layout: { width: number; height: number }): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: inner.width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: inner.height });
  document.documentElement.getBoundingClientRect = () =>
    ({ width: layout.width, height: layout.height, top: 0, left: 0, right: layout.width, bottom: layout.height }) as DOMRect;
}

describe('readLayoutViewport (F2)', () => {
  afterEach(() => {
    // Remove the instance override so later tests see jsdom's own prototype method.
    delete (document.documentElement as { getBoundingClientRect?: unknown }).getBoundingClientRect;
  });

  it('returns the layout viewport, not the transiently zoomed innerWidth/innerHeight', () => {
    stubWindow({ width: 642, height: 361 }, { width: 640, height: 360 });
    expect(readLayoutViewport()).toEqual({ width: 640, height: 360 });
  });

  it('keeps the fractional part of the layout viewport (a 411.43 dp window is not rounded)', () => {
    stubWindow({ width: 411, height: 892 }, { width: 411.428, height: 891.43 });
    expect(readLayoutViewport()).toEqual({ width: 411.428, height: 891.43 });
  });

  it('640 x 360 with the measured pixel7 insets is tooSmall; the stale 642 x 361 reading would have said playable', () => {
    stubWindow({ width: 642, height: 361 }, { width: 640, height: 360 });
    expect(classifyWindow(readLayoutViewport(), PIXEL7_REAL_INSETS, false)).toBe('tooSmall');
    // What the pre-fix code classified (documents the bug this test guards).
    expect(classifyWindow({ width: window.innerWidth, height: window.innerHeight }, PIXEL7_REAL_INSETS, false)).toBe(
      'playable',
    );
  });
});
