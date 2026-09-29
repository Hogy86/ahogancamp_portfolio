// Implements docs/mobile/architecture/mobile-architecture.md §1/§6.1/§8.5 (M-ADR-0004,
// Amendment A12): the thin TypeScript side of the first-party GameShell native plugin
// (live edge insets, immersive mode, keep-screen-on, window-focus events). Registered
// with a web fallback (§10 item 3) so the Playwright phone-emulation suite can run
// outside Capacitor: `?insets=l,r,t,b` (default 0) supplies fixed edge insets,
// `?cutout=top,bottom` (default 0,0 - a browser has no cutout, §6.1 A12 point 5)
// supplies the two cutout fields, and keep-awake/focus calls no-op. That web fallback
// (`parseWebInsets`/`parseWebCutout` below) reads `window.location` - the only DOM/
// browser API this file touches, and only on the non-native path used by the test
// harness - so it is still safe to import from anywhere under `src/platform/android/**`
// when running inside Capacitor.

import { registerPlugin } from '@capacitor/core';

export interface EdgeInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** §6.1 Amendment A12: the top display-cutout inset alone (not maxed with system
   * gestures) - the playfield's top limit only (§6.2 A12). Optional as delivered: a
   * stale native payload without this field is normalized by `layout.ts`'s
   * `normalizeInsets` (fail-safe, equal to `top`), not treated as an error here. */
  cutoutTop?: number;
  /** §6.1 Amendment A12: the bottom display-cutout inset alone - the playfield's
   * bottom limit only (§6.2 A12). Same optionality/fail-safe note as `cutoutTop`. */
  cutoutBottom?: number;
}

export interface GameShellPlugin {
  getEdgeInsets(): Promise<EdgeInsets>;
  setKeepAwake(options: { enabled: boolean }): Promise<void>;
  addListener(
    eventName: 'edgeInsetsChanged',
    listener: (insets: EdgeInsets) => void,
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'windowFocusChanged',
    listener: (event: { hasFocus: boolean }) => void,
  ): Promise<{ remove: () => void }>;
}

/** L5: a malformed component (empty, non-numeric, or missing) must fall back to 0, not
 * `NaN` - a `NaN` inset would poison every downstream layout calculation. Web-only
 * fallback path (§10 item 3); the native plugin always returns real numbers. */
function toFiniteOrZero(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) ? value : 0;
}

/** §6.1 Amendment A12 point 5: `?cutout=top,bottom` defaults to `0,0` (a browser has
 * no cutout) and a malformed value parses to 0, same as `?insets=`. The web fallback
 * ALWAYS emits both fields (never `undefined`), so `normalizeInsets`'s fail-safe
 * default only ever applies to a native payload that really lacks them. */
function parseWebCutout(): { cutoutTop: number; cutoutBottom: number } {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('cutout');
  if (!raw) return { cutoutTop: 0, cutoutBottom: 0 };
  const [top, bottom] = raw.split(',').map(Number);
  return { cutoutTop: toFiniteOrZero(top), cutoutBottom: toFiniteOrZero(bottom) };
}

function parseWebInsets(): EdgeInsets {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('insets');
  const { cutoutTop, cutoutBottom } = parseWebCutout();
  if (!raw) return { left: 0, right: 0, top: 0, bottom: 0, cutoutTop, cutoutBottom };
  const [left, right, top, bottom] = raw.split(',').map(Number);
  return {
    left: toFiniteOrZero(left),
    right: toFiniteOrZero(right),
    top: toFiniteOrZero(top),
    bottom: toFiniteOrZero(bottom),
    cutoutTop,
    cutoutBottom,
  };
}

export const GameShell = registerPlugin<GameShellPlugin>('GameShell', {
  web: async () => ({
    async getEdgeInsets() {
      return parseWebInsets();
    },
    async setKeepAwake() {
      // No-op outside Capacitor (§10 item 3).
    },
    async addListener() {
      return { remove: () => undefined };
    },
  }),
});
