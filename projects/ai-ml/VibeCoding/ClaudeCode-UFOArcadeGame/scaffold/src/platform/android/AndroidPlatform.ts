// Implements docs/mobile/architecture/mobile-architecture.md §1/§4 (M-ADR-0002): the
// AndroidPlatform composition root. Loaded only via the dynamic `import()` in
// src/main.ts when `import.meta.env.MODE === 'android'` - never reachable from the
// web bundle. Wires together the four Android-only areas (touch, screen fitting,
// back, lifecycle) plus the shell overlays, and implements the shared `Platform`
// contract so `src/main.ts` never branches on which platform it is on.

import './android.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import type { Platform, PlatformContext } from '../Platform';
import type { World } from '../../core/types';
import {
  pause,
  pauseForInterruption,
  selectPauseOption,
  startRun,
  confirmRestartGame,
  cancelRestartGame,
  quit,
  victoryTap,
} from '../../core/GameStateMachine';
import { TouchControls } from './TouchControls';
import { ScreenFit } from './screenFit';
import { AndroidOverlays } from './overlays';
import { registerBackButton } from './backButton';
import { registerLifecycle } from './lifecycle';
import { GameShell } from './GameShell';

let overlays: AndroidOverlays;
let touchControls: TouchControls;
let screenFit: ScreenFit;
let firstFrameRendered = false;
/** M4.5: tracked so `GameShell.setKeepAwake()` is only called on a PLAYING/not-PLAYING
 * transition, not every frame. */
let keepAwakeOn = false;
/** L4: tracked so `touchControls.setVisible()` (and therefore `clearAllPointers()`) is
 * only called on a PLAYING/not-PLAYING transition, not every non-PLAYING frame. */
let touchControlsVisible = true;

function handlePauseMenuClick(world: World, action: string): void {
  const match = /^pause-option:(\d+)$/.exec(action);
  if (match?.[1]) {
    selectPauseOption(world, Number(match[1]));
    return;
  }
  switch (action) {
    case 'confirm':
      confirmRestartGame(world);
      return;
    case 'cancel':
      cancelRestartGame(world);
      return;
    case 'quit':
      quit(world);
      return;
  }
}

export const androidPlatform: Platform = {
  id: 'android',
  copy: {
    // code-review-round3 L2: matches the ASCII glyphs the touch buttons actually show
    // (TouchControls.ts: '<', '>', 'THROW', 'II').
    controlHint: '< > move · THROW · II pause',
    titleStartLabel: 'Start',
    titleExtraActions: ['help', 'settings', 'quit'],
    menuHint: null,
    confirmHint: null,
    gameOverActionLabel: 'Play again',
  },
  services: {
    quitApp(): 'closed' | 'blocked' {
      // M6.1: the activity finishes; the next launch starts on the title.
      void App.exitApp();
      return 'closed';
    },
  },
  renderScale(): number {
    return screenFit ? screenFit.renderScale() : 1;
  },
  onFrame(world: World): void {
    const playing = world.state === 'PLAYING';
    if (playing !== touchControlsVisible) {
      touchControlsVisible = playing;
      touchControls.setVisible(playing);
    }
    touchControls.syncNotReadyState();
    if (!firstFrameRendered) {
      firstFrameRendered = true;
      // M9.4: hand off from the splash directly to a drawn frame.
      void SplashScreen.hide();
    }
    // M4.5: the screen stays awake only while actively in play.
    if (playing !== keepAwakeOn) {
      keepAwakeOn = playing;
      void GameShell.setKeepAwake({ enabled: playing });
    }
  },
  async init(ctx: PlatformContext): Promise<void> {
    document.documentElement.classList.add('platform-android');

    // A SEPARATE node from ctx.dom.overlayRoot: ScreenController clears and rebuilds
    // overlayRoot on every view-key change (§5.4), which would otherwise wipe out
    // these overlays' persistent DOM every time the game screen re-renders.
    const shellOverlayRoot = document.createElement('div');
    shellOverlayRoot.id = 'shell-overlay-root';

    // H2: "How to play" opened FROM the title's first Start tap (see the `start`
    // action below) must start a run once dismissed (M8.1); "How to play" reopened
    // from the title's menu row must not - it just closes back to the title. Tracked
    // here (not in AndroidOverlays, which has no opinion on why Help opened).
    let helpOpenedFromStart = false;

    overlays = new AndroidOverlays(
      shellOverlayRoot,
      (reason) => {
        // H1: only "Got it" starts a run, and only if Help was opened from the
        // title's Start tap. Any other close (back/Esc/overlay-close) must still
        // clear the flag so a LATER "Got it" (from a freshly reopened Help) doesn't
        // incorrectly start a run.
        if (reason === 'confirm' && helpOpenedFromStart) {
          helpOpenedFromStart = false;
          Object.assign(ctx.getWorld(), startRun());
        } else {
          helpOpenedFromStart = false;
        }
      },
      (swap) => screenFit.setSwapControls(swap),
    );

    touchControls = new TouchControls(
      () => pause(ctx.getWorld()),
      () => ctx.getWorld().shields.length > 0,
    );
    ctx.input.addSource(touchControls.input);

    screenFit = new ScreenFit(ctx.dom.appRoot, ctx.dom.overlayRoot, shellOverlayRoot, touchControls, {
      // M7: a viewport SIZE change (fold/split-screen/freeform resize, §8.1) goes
      // through the same shared interruption command as backgrounding - not the plain
      // `pause()` GameCommand - so it also holds VICTORY and commits the best score.
      onPause: () => pauseForInterruption(ctx.getWorld()),
      onRotatePromptChange: (show) => overlays.setRotatePromptVisible(show),
      // M3: re-applies the canvas backing-store scale on every re-layout, not just
      // once at boot (fold/resize/insets changes were previously never picked up).
      onScaleChange: (scale) => ctx.setRenderScale(scale),
    });
    await screenFit.init();
    screenFit.setSwapControls(overlays.swapControls);

    // Title/menu taps (Start, Help, Settings, Quit, pause options, confirm/cancel) all
    // go through one delegated click listener, attached to the common ancestor of the
    // game-screen overlay, the shell overlays and the touch controls (§5.4) - the web
    // platform attaches none, so web behavior is unchanged (OQ-M10 (a)).
    screenFit.clickRoot.addEventListener('click', (event) => {
      // H1 (F19 AC9 platform mapping, §5.4 victoryTap): on Game Complete, ANY tap on
      // the game surface - not only a `data-action` target - holds/advances the
      // celebration. Checked first since VICTORY has no `data-action` targets of its
      // own to conflict with.
      if (ctx.getWorld().state === 'VICTORY') {
        victoryTap(ctx.getWorld());
        return;
      }
      const target = event.target as HTMLElement | null;
      const action = target?.closest<HTMLElement>('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'start') {
        if (!overlays.helpSeen) {
          helpOpenedFromStart = true;
          overlays.showHelp();
        } else {
          Object.assign(ctx.getWorld(), startRun());
        }
        return;
      }
      if (action === 'help') {
        // H1: reopening Help from the title's menu row (not the Start tap) must never
        // start a run when it closes - defensively reset in case a stale flag from an
        // earlier Start tap survived (closeTopOverlay's 'closed' path should already
        // have cleared it, but this branch cannot rely on that alone).
        helpOpenedFromStart = false;
        overlays.showHelp();
        return;
      }
      if (action === 'settings') {
        overlays.showSettings();
        return;
      }
      if (action === 'play-again') {
        Object.assign(ctx.getWorld(), startRun());
        return;
      }
      handlePauseMenuClick(ctx.getWorld(), action);
    });

    registerBackButton(ctx.getWorld, {
      closeTopOverlay: () => overlays.closeTopOverlay(),
      isRotatePromptShowing: () => overlays.isRotatePromptShowing(),
    });
    registerLifecycle(ctx, {
      // M8: a THROW/move pointer lost while the app leaves the foreground (the render
      // loop suspends immediately after, so no later frame's `setVisible(false)` would
      // otherwise catch it) must not stick held/moving on resume.
      clearTouchPointers: () => touchControls.clearAllPointers(),
    });

    installE2eTestHook(ctx);
  },
};

/** H3: recursively freezes a plain-data object graph (arrays included) so a snapshot
 * handed to test code can never write back into itself, let alone the live world it
 * was cloned from. */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

/** M5 (§10 item 3, §10.2, L4a): a read-only test hook for the Playwright phone-emulation
 * suite (the 40/40 slide test needs to read live world/player-x state without going
 * through GameCommands). Gated so it is installed ONLY under `?e2e=1` outside a real
 * Capacitor runtime - `typeof window.__vvsTest === 'undefined'` on the installed app
 * is a release-review requirement (review-v1b "Carried to pass 2"). */
function installE2eTestHook(ctx: PlatformContext): void {
  const params = new URLSearchParams(window.location.search);
  if (params.get('e2e') !== '1' || Capacitor.isNativePlatform()) return;

  // L6: bounded so a long-running suite can never grow this without limit.
  const PLAYER_X_LOG_CAP = 500;
  const playerXLog: number[] = [];
  let lastPlayerX: number | null = null;
  let rafHandle: number | null = null;

  (window as unknown as { __vvsTest: unknown }).__vvsTest = Object.freeze({
    // H3: `{ ...ctx.getWorld() }` is a SHALLOW copy - `player`, `shields`, `enemies`
    // etc. are still live references into the real world, so a test writing through
    // the "read-only" snapshot (e.g. `snapshot().player.x = 5`) mutated the actual
    // running game. `structuredClone` + a recursive freeze makes every nested object
    // a genuine, inert copy.
    snapshot: () => deepFreeze(structuredClone(ctx.getWorld())),
    playerXLog: () => [...playerXLog],
  });

  const recordFrame = (): void => {
    const x = ctx.getWorld().player.x;
    if (x !== lastPlayerX) {
      lastPlayerX = x;
      playerXLog.push(x);
      if (playerXLog.length > PLAYER_X_LOG_CAP) playerXLog.shift();
    }
    rafHandle = requestAnimationFrame(recordFrame);
  };

  // L6: this test-only probe otherwise runs `requestAnimationFrame` forever, even
  // while the tab/app is backgrounded. Stop it on suspend and resume on foreground,
  // matching the same signal the shared loop suspend/resume logic uses.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafHandle !== null) cancelAnimationFrame(rafHandle);
      rafHandle = null;
    } else if (rafHandle === null) {
      rafHandle = requestAnimationFrame(recordFrame);
    }
  });

  rafHandle = requestAnimationFrame(recordFrame);
}
