// Implements docs/mobile/architecture/mobile-architecture.md §8.3 (M5). A single
// `App.addListener('backButton', ...)` listener stays registered for the app's whole
// life; the Capacitor App plugin implements it with `OnBackPressedCallback`, which
// works with predictive back (M5.3) without the deprecated `onBackPressed`.
// Resolution order (PRD-mobile M5 table, as amended for M2.10a):
//   1. RotatePrompt (M2.10/M2.10a) - leave the app.
//   2. A shell overlay (Help/Settings/Privacy) - close the topmost one.
//   3. Otherwise, the shared `handleBack()` GameCommand.
//
// > Amendment A11 (2026-09-27, v1.5; PRD-mobile v1.5 M2.10a behavior 5): RotatePrompt
// > is now checked FIRST, before any shell overlay. While either prompt message shows,
// > any shell overlay underneath it is hidden (not closed, §6.2.1 behavior 2), so back
// > must leave the app - closing the hidden overlay would be invisible to the player,
// > and it returns on its own once the window is valid again.

import { App } from '@capacitor/app';
import { handleBack } from '../../core/GameStateMachine';
import type { World } from '../../core/types';

export interface BackButtonHost {
  /** Closes the topmost shell overlay (Help/Settings/Privacy) if one is open, returning
   * to where it was opened (§8.3 rule 2). Returns whether one was open/closed. */
  closeTopOverlay(): boolean;
  /** Read-only: is a shell overlay open, without closing it (§8.3 A11 - RotatePrompt
   * must win the order check before this is even asked). */
  hasOpenOverlay(): boolean;
  isRotatePromptShowing(): boolean;
}

export type BackTarget = 'leaveApp' | 'closeOverlay' | 'gameCommand';

/** Pure order-resolution, exported so the real listener below and the Playwright
 * test-only hook (§10.1 A11, `AndroidPlatform.ts`'s e2e hook) share the exact same
 * decision - the order is never re-implemented at a second call site. The hook calls
 * this directly instead of going through the real `App.addListener('backButton', ...)`
 * path: `docs/mobile/tests/manual-only-criteria.md`'s M5 entry documents that path as a
 * genuine, previously-reverted source of e2e flakiness (a web-fallback-only plugin
 * registration race in `@capacitor/app`, unrelated to this ordering logic), so the M5
 * table's real wiring stays a device-matrix-only check; only the ordering RULE this
 * amendment adds is asserted here, deterministically. */
export function resolveBackTarget(host: Pick<BackButtonHost, 'isRotatePromptShowing' | 'hasOpenOverlay'>): BackTarget {
  if (host.isRotatePromptShowing()) return 'leaveApp';
  if (host.hasOpenOverlay()) return 'closeOverlay';
  return 'gameCommand';
}

export function registerBackButton(getWorld: () => World, host: BackButtonHost): void {
  App.addListener('backButton', () => {
    switch (resolveBackTarget(host)) {
      case 'leaveApp':
        // M2.10/M2.10a + M5 "Rotate your device" row: leave the app, same as from TITLE.
        void App.minimizeApp();
        return;
      case 'closeOverlay':
        host.closeTopOverlay();
        return;
      case 'gameCommand': {
        const result = handleBack(getWorld());
        if (result === 'leaveApp') void App.minimizeApp();
      }
    }
  });
}
