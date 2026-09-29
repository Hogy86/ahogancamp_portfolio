// Implements docs/mobile/architecture/mobile-architecture.md §8.1 (M4). Maps every
// Android "left the foreground" signal to the shared `pauseForInterruption()` command
// plus the loop/keep-awake side effects that are genuinely platform-specific:
// - `@capacitor/app` `pause` AND `document.visibilitychange -> hidden`, whichever
//   fires first (both call the same idempotent handler).
// - GameShell's `windowFocusChanged {hasFocus:false}` (notification shade / system
//   dialog: the window loses focus but Android does not pause the app) - the loop
//   keeps rendering (no `loop.suspend()`), only the shared state pauses.
// - `@capacitor/app` `resume` -> `loop.resume()`. The game state itself is untouched
//   (M4.3: the player must tap Resume).

import { App } from '@capacitor/app';
import { pauseForInterruption } from '../../core/GameStateMachine';
import { GameShell } from './GameShell';
import type { PlatformContext } from '../Platform';

export interface LifecycleHost {
  /** M8: clears every tracked touch/throw pointer on the way to the background. The
   * render loop is suspended here (below), so `TouchControls.setVisible(false)` never
   * gets a chance to run on a later frame - a `pointerup`/`lostpointercapture` missed
   * during the transition would otherwise leave THROW stuck held or a direction stuck
   * on resume. */
  clearTouchPointers(): void;
  /** §6.2.1 "on resume" (code-review-round8 L3): re-checks the window classification
   * on the way back to the foreground - `ScreenFit.reclassify()`. */
  reclassifyWindow(): void;
}

export function registerLifecycle(ctx: PlatformContext, host: LifecycleHost): void {
  let handled = false;
  const onLeaveForeground = (): void => {
    if (handled) return; // idempotent: pause/visibilitychange may both fire.
    handled = true;
    pauseForInterruption(ctx.getWorld());
    host.clearTouchPointers();
    ctx.loop.suspend();
    void GameShell.setKeepAwake({ enabled: false });
  };

  void App.addListener('pause', onLeaveForeground);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onLeaveForeground();
  });

  void App.addListener('resume', () => {
    handled = false;
    host.reclassifyWindow();
    ctx.loop.resume();
  });

  // Notification shade / system dialog: focus lost but Android has not paused the
  // app - the render loop keeps running (no suspend()), only the game state pauses.
  void GameShell.addListener('windowFocusChanged', ({ hasFocus }) => {
    if (!hasFocus) pauseForInterruption(ctx.getWorld());
  });
}
