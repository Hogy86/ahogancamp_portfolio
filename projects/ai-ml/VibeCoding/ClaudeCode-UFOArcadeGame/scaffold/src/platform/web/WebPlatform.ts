// docs/mobile/architecture/mobile-architecture.md §1/§3.1: today's web behavior,
// unchanged - keyboard only, `window.close()` quit with the F6 AC9 fallback text,
// current copy (`copy: undefined` so ScreenController/HUDView fall back to their
// pre-existing literal strings). The one new behavior this module adds is the F20
// AC4(e) "page hidden" best-score save trigger - the website counterpart of Android's
// "app goes to the background" (M7.2). No Capacitor import anywhere in this file or its
// imports, so it never appears in the web bundle even though it lives under `src/platform`.

import type { GameServices, Platform, PlatformContext } from '../Platform';
import { bestScore } from '../../persistence/bestScore';

/** L2 (round 2): the ONE implementation of the web quit behavior. This used to live in
 * `src/core/GameStateMachine.ts` as `webQuitApp`, but core must never touch `window`
 * directly - that's a platform concern, and web is a platform like any other. Core's
 * own default (`quitApp` returning 'blocked' with no side effect) is used only if a
 * composition root somehow skips `setGameServices`. */
const webQuitApp: GameServices = {
  quitApp(): 'closed' | 'blocked' {
    // Browsers generally block window.close() on tabs the script did not open
    // (F6 AC6, owner-confirmed). We attempt it and treat "still here after the call"
    // as the blocked case, matching the specified fallback behavior.
    window.close();
    return 'blocked';
  },
};

export const webPlatform: Platform = {
  id: 'web',
  copy: undefined,
  services: webQuitApp,
  renderScale(): number {
    return 1;
  },
  onFrame(): void {
    // No per-frame view sync on web (no touch layer, no keep-awake).
  },
  async init(ctx: PlatformContext): Promise<void> {
    const saveIfHidden = (): void => {
      if (document.visibilityState === 'hidden') {
        bestScore.commitIfRunActive(ctx.getWorld());
      }
    };
    document.addEventListener('visibilitychange', saveIfHidden);
    // `pagehide` fires on tab/browser close in browsers that don't reliably fire
    // `visibilitychange` first (F20 AC4(e): "tab switch, minimize, tab or browser close").
    window.addEventListener('pagehide', () => bestScore.commitIfRunActive(ctx.getWorld()));
  },
};
