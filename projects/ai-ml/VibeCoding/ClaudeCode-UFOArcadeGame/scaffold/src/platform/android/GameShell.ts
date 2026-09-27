// Implements docs/mobile/architecture/mobile-architecture.md §1/§6.1/§8.5 (M-ADR-0004):
// the thin TypeScript side of the first-party GameShell native plugin (live edge
// insets, immersive mode, keep-screen-on, window-focus events). Registered with a web
// fallback (§10 item 3) so the Playwright phone-emulation suite can run outside
// Capacitor: `?insets=l,r,t,b` (default 0) supplies fixed insets, and keep-awake/focus
// calls no-op. That web fallback (`parseWebInsets` below) reads `window.location` - the
// only DOM/browser API this file touches, and only on the non-native path used by the
// test harness - so it is still safe to import from anywhere under
// `src/platform/android/**` when running inside Capacitor.

import { registerPlugin } from '@capacitor/core';

export interface EdgeInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
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

function parseWebInsets(): EdgeInsets {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('insets');
  if (!raw) return { left: 0, right: 0, top: 0, bottom: 0 };
  const [left, right, top, bottom] = raw.split(',').map(Number);
  return {
    left: toFiniteOrZero(left),
    right: toFiniteOrZero(right),
    top: toFiniteOrZero(top),
    bottom: toFiniteOrZero(bottom),
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
