// docs/mobile/architecture/mobile-architecture.md §4 (M-ADR-0002): the platform
// boundary. SHARED TYPES ONLY - no runtime code, no Capacitor import, so this file can
// be imported (with `import type`) from anywhere in `src/` without pulling any
// Android-only code into the web bundle (§3.1's purity check depends on that).
//
// Rule: game logic never branches on platform. Only `src/main.ts` knows which
// `Platform` it is on; shared code receives a `Platform`/`PlatformCopy`/`GameServices`
// and calls it. Only four areas ever have Android-specific code: touch input, screen
// fitting, back, and lifecycle (src/platform/android/**).

import type { World } from '../core/types';
import type { InputManager } from '../core/InputManager';
import type { GameServices } from '../core/GameStateMachine';

export type { GameServices } from '../core/GameStateMachine';

export interface PlatformCopy {
  /** F9 AC2 / M8.3: one-line control text shown during play. */
  controlHint: string;
  /** Web: 'Press Enter to start'; Android: 'Start' button label. */
  titleStartLabel: string;
  /** web: []; Android: all three (M8.2, M6.2). */
  titleExtraActions: ReadonlyArray<'help' | 'settings' | 'quit'>;
  /** web: keyboard hint; Android: null. */
  menuHint: string | null;
  /** L4: the Restart Game confirmation prompt's keyboard hint. web: the literal
   * Enter/Esc text; Android: null (real Confirm/Cancel buttons, no keyboard hint). */
  confirmHint: string | null;
  /** web: 'Press Enter to start a new run'; Android: 'Play again'. */
  gameOverActionLabel: string;
}

/** What a platform's `init()` gets to mount touch/fit/back/lifecycle against. */
export interface PlatformContext {
  getWorld(): World;
  /** Platform registers extra InputSources on this (Android's touch move-zone/throw). */
  input: InputManager;
  loop: {
    suspend(): void;
    resume(): void;
  };
  dom: {
    appRoot: HTMLElement;
    canvas: HTMLCanvasElement;
    overlayRoot: HTMLElement;
  };
  /** code-review-round1.md M3: re-applies the canvas backing-store scale (M2.8) after
   * ANY re-layout, not just the one at boot - fold/resize/insets changes on Android
   * call this via ScreenFit. Never called by the web platform, so web output is
   * unchanged (renderer.applyScale's `=== 1` behavior no longer short-circuits, but
   * nothing on web ever calls this with a value other than the boot-time 1). */
  setRenderScale(scale: number): void;
  /** Android moves the formation-warning and boss-incoming words out of the canvas into a DOM row below
   * the HUD (M2.3b); the web platform never calls this, so its canvas text is unchanged. */
  setTopBannerTextOnCanvas(enabled: boolean): void;
}

export interface Platform {
  readonly id: 'web' | 'android';
  /** Undefined on web (today's exact copy/behavior is unchanged, M3.12). */
  readonly copy: PlatformCopy | undefined;
  readonly services: GameServices;
  /** Mounts touch/fit/back/lifecycle. Resolves once initial setup (e.g. reading
   * persisted settings) is done; does not block the first render. */
  init(ctx: PlatformContext): Promise<void>;
  /** Per-frame view sync (touch-control visibility, keep-awake). No-op on web. */
  onFrame(world: World): void;
  /** Canvas backing-store scale (M2.8). Web always returns 1. */
  renderScale(): number;
}
