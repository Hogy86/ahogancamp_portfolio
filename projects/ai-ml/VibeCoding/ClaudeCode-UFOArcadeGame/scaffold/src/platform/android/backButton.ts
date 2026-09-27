// Implements docs/mobile/architecture/mobile-architecture.md §8.3 (M5). A single
// `App.addListener('backButton', ...)` listener stays registered for the app's whole
// life; the Capacitor App plugin implements it with `OnBackPressedCallback`, which
// works with predictive back (M5.3) without the deprecated `onBackPressed`.
// Resolution order (PRD-mobile M5 table): shell overlays first, then RotatePrompt,
// then the shared `handleBack()` GameCommand.

import { App } from '@capacitor/app';
import { handleBack } from '../../core/GameStateMachine';
import type { World } from '../../core/types';

export interface BackButtonHost {
  /** Closes the topmost shell overlay (Help/Settings/Privacy) if one is open, returning
   * to where it was opened (§8.3 rule 1). Returns whether one was open/closed. */
  closeTopOverlay(): boolean;
  isRotatePromptShowing(): boolean;
}

export function registerBackButton(getWorld: () => World, host: BackButtonHost): void {
  App.addListener('backButton', () => {
    if (host.closeTopOverlay()) return;
    if (host.isRotatePromptShowing()) {
      // M2.10 + M5 "Rotate your device" row: leave the app, same as from TITLE.
      void App.minimizeApp();
      return;
    }
    const result = handleBack(getWorld());
    if (result === 'leaveApp') void App.minimizeApp();
  });
}
