// Implements PRD §F1-F10 (application entry point wiring loop, renderer, HUD, and
// screen controller together), NFR-1 (load-to-first-input), ADR-0001 (hybrid
// canvas+DOM split), ADR-0002 (fixed-timestep loop + state machine).
//
// docs/mobile/architecture/mobile-architecture.md §3.1/§4 (M-ADR-0002): this is the
// ONLY file that reads `import.meta.env.MODE` and the ONLY place that picks a
// `Platform`. The Android module is loaded by a dynamic `import()` inside
// `if (import.meta.env.MODE === 'android')` - Vite replaces `MODE` with a literal at
// build time, so the web bundle contains neither the branch nor the Android chunk
// (§10 web-bundle purity check). The build target is `es2020` (no top-level await),
// so platform loading uses `loadPlatform().then(bootstrap)`.

import { createNewRunWorld } from './core/world';
import { GameLoop } from './core/GameLoop';
import { CanvasRenderer } from './render/CanvasRenderer';
import { HUDView } from './ui/HUDView';
import { ScreenController } from './ui/ScreenController';
import { resetGuaranteedDrops } from './systems/levelRuntimeState';
import { FIXED_DT } from './config/constants';
import { setGameServices } from './core/GameStateMachine';
import { bestScore } from './persistence/bestScore';
import { webPlatform } from './platform/web/WebPlatform';
import type { Platform, PlatformContext } from './platform/Platform';

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`main: required element #${id} not found`);
  return el as T;
}

function loadPlatform(): Promise<Platform> {
  if (import.meta.env.MODE === 'android') {
    return import('./platform/android/AndroidPlatform').then((m) => m.androidPlatform);
  }
  return Promise.resolve(webPlatform);
}

function bootstrap(platform: Platform): void {
  setGameServices(platform.services);

  const appRoot = getRequiredElement<HTMLElement>('app-root');
  const canvas = getRequiredElement<HTMLCanvasElement>('game-canvas');
  const hudRoot = getRequiredElement<HTMLElement>('hud-root');
  const overlayRoot = getRequiredElement<HTMLElement>('overlay-root');

  // Control-text line (F9 AC2) lives outside hud-root so HUDView can manage its
  // own fade lifecycle independently of the score/lives/level panels.
  const controlTextEl = document.createElement('div');
  controlTextEl.id = 'control-text';
  appRoot.appendChild(controlTextEl);

  const world = createNewRunWorld();
  // F20 AC1: the title screen shows the real saved best, not the fresh-world default.
  world.bestScore = bestScore.get();
  resetGuaranteedDrops(world.level);

  const renderer = new CanvasRenderer(canvas, platform.renderScale());
  const hud = new HUDView(hudRoot, controlTextEl, platform.copy);
  const screens = new ScreenController(overlayRoot, platform.copy);

  let hasThrownOnce = false;

  const loop = new GameLoop(world, (currentWorld) => {
    if (currentWorld.shields.length > 0) hasThrownOnce = true;

    renderer.render(currentWorld);
    hud.update(currentWorld, hasThrownOnce, FIXED_DT);
    screens.render(currentWorld);
    platform.onFrame(currentWorld);
  });

  const ctx: PlatformContext = {
    getWorld: () => world,
    input: loop.input,
    loop: { suspend: () => loop.suspend(), resume: () => loop.resume() },
    dom: { appRoot, canvas, overlayRoot },
    // code-review-round1.md M3: re-applies the canvas backing-store scale on every
    // Android re-layout (fold/resize/insets change), not just at boot. Web's platform
    // never calls this after the one boot-time call below.
    setRenderScale: (scale) => renderer.applyScale(scale),
    setTopBannerTextOnCanvas: (enabled) => renderer.setTopBannerTextOnCanvas(enabled),
  };

  // Mounting touch/fit/back/lifecycle is async only on Android (e.g. reading
  // persisted settings and the device's live edge insets); the web platform's
  // init() resolves on the same tick, so this never delays the game's first
  // render/input (NFR-1, M10.3). renderScale() is only meaningful after init() on
  // Android (GameShell's insets are async); re-applying it unconditionally here is a
  // no-op on web and before Android's first real layout pass (renderScale() still 1).
  //
  // code-review-round1.md M6: `platform.init()` can reject (e.g. GameShell.
  // getEdgeInsets() rejecting, or the Android chunk failing to load) - without a
  // `.catch`, `loop.start()` would never run and the splash would never hide (M9.4).
  // The fallback starts the loop with whatever default layout state already exists
  // (renderer/HUD/screens were already constructed above) so the player at least
  // reaches a playable, un-splashed screen instead of a permanent splash.
  platform
    .init(ctx)
    .then(() => {
      renderer.applyScale(platform.renderScale());
    })
    .catch((error) => {
      console.error('main: platform.init() failed - starting with default layout', error);
    })
    .finally(() => {
      loop.start();
    });
}

loadPlatform()
  .then(bootstrap)
  .catch((error) => {
    // M6: a failure before bootstrap() even runs (e.g. the Android dynamic import
    // itself rejecting). There is no Platform to fall back to at this point (bootstrap
    // never ran, so nothing was ever mounted) - logged with context per
    // coding-standards' error-handling rule rather than swallowed silently. Reaching
    // for `@capacitor/splash-screen` directly here would pull Capacitor into the web
    // bundle unconditionally (M-ADR-0002's mode gate exists precisely to prevent
    // that), so this is the one failure this file cannot also recover the splash from.
    console.error('main: loadPlatform() failed', error);
  });
