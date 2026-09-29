// Implements docs/mobile/architecture/mobile-architecture.md §6.5/§6.6 (M-ADR-0004):
// applies computeLayout()'s numbers to the real DOM. PRD-mobile M2.1-M2.13.
// - `html.platform-android` scopes every Android-only CSS rule (android.css); `src/
//   style.css` is never edited (UX N1/carry-forward 4).
// - `#app-root` (canvas + HUD) is positioned/scaled; `#overlay-root` (ScreenController's
//   game screens), `#shell-overlay-root` (AndroidOverlays' Help/Settings/Privacy/
//   RotatePrompt - a SEPARATE node, since ScreenController clears and rebuilds
//   `#overlay-root` on every view-key change and would otherwise wipe out the shell
//   overlays' persistent DOM) and the touch layer are all moved once into a
//   full-viewport `#safe-layer` that is inset but never scaled, so menu text stays real
//   dp (M3.8) instead of shrinking with the playfield.
// - code-review-round1.md C1: `#safe-layer` is appended directly to `<body>` - a
//   SIBLING of `#app-root`, never a descendant of it. `#app-root` alone gets
//   `transform: scale()` (below); putting `#safe-layer` inside it would scale and clip
//   every overlay/touch control to the playfield rectangle, which is exactly the bug
//   C1 reported. C2: `layout.ts` already returns every control coordinate relative to
//   `#safe-layer`'s own (already-inset) local frame, so this module never re-adds an
//   inset on top of `#safe-layer`'s own `left`/`top`/`right`/`bottom` offset.
// - Re-layout triggers: resize (fold/split-screen/rotation), edgeInsetsChanged, and a
//   "Swap controls" change. A viewport SIZE change also pauses (§8.1); an insets-only
//   change does not, EXCEPT when it newly drops the window below the §6.2.1 floor -
//   Amendment A11 pauses on ENTERING either prompt regardless of what triggered it
//   (a 180-degree flip moving the cutout can do this with no `resize` event at all).

import { classifyWindow, computeLayout, normalizeInsets, type LayoutInsets, type Layout, type WindowClass } from './layout';
import { GameShell } from './GameShell';
import type { TouchControls } from './TouchControls';

const BACKING_STORE_SCALE_CAP = 3.2;

export interface ScreenFitCallbacks {
  onPause(): void;
  /** §6.2.1: `null` when the window is playable; otherwise which message RotatePrompt
   * shows ('portrait' or 'tooSmall', M2.10/M2.10a). */
  onWindowPromptChange(kind: 'portrait' | 'tooSmall' | null): void;
  /** M3: called with the new canvas backing-store scale (M2.8) on every re-layout that
   * actually computes one - not just once at boot. */
  onScaleChange(scale: number): void;
}

export class ScreenFit {
  // §6.1 Amendment A12: normalized on every assignment (init, and every
  // `edgeInsetsChanged` payload) - `this.insets` is always a complete `LayoutInsets`,
  // never a raw GameShell payload that might be missing the new cutout fields.
  private insets: LayoutInsets = { left: 0, right: 0, top: 0, bottom: 0, cutoutTop: 0, cutoutBottom: 0 };
  private swapControls = false;
  private lastViewportKey = '';
  private currentLayout: Layout | null = null;
  /** §6.2.1 behavior 1 / A11: tracks the previous classification so a transition INTO
   * a prompt can be told apart from staying in one - only entering pauses. Assuming
   * 'playable' before the first re-layout is harmless even if the window opens too
   * small: `pauseForInterruption()` is a no-op on TITLE (§8.1), which is the only
   * state a cold launch can be in. */
  private lastWindowClass: WindowClass = 'playable';

  constructor(
    private readonly appRoot: HTMLElement,
    private readonly overlayRoot: HTMLElement,
    private readonly shellOverlayRoot: HTMLElement,
    private readonly touchControls: TouchControls,
    // §6.2.1 Amendment A11: appended directly to `<body>`, a SIBLING of `#safe-layer`
    // (never inside it) - unlike Help/Settings/Privacy, RotatePrompt's background must
    // cover the true full viewport, insets included (M2.10a behavior 2), not just the
    // inset-safe area `#safe-layer` occupies.
    private readonly rotatePrompt: HTMLElement,
    private readonly callbacks: ScreenFitCallbacks,
  ) {
    // §6.5/C1: overlays and touch controls live in a separate, un-scaled,
    // inset-respecting layer that is a direct child of <body> - a SIBLING of
    // `#app-root`, never placed inside it (C1's "never a descendant" requirement).
    this.safeLayer = document.createElement('div');
    this.safeLayer.id = 'safe-layer';
    document.body.append(this.safeLayer);
    this.safeLayer.append(this.overlayRoot); // detaches it from #app-root
    this.safeLayer.append(this.shellOverlayRoot);
    this.safeLayer.append(this.touchControls.root);
    document.body.append(this.rotatePrompt); // detaches it from #shell-overlay-root
  }

  /** The common ancestor of `overlayRoot`, `shellOverlayRoot` and the touch controls -
   * AndroidPlatform attaches its one delegated click listener here (§5.4) so a single
   * handler covers game screens, shell overlays and touch controls alike. */
  get clickRoot(): HTMLElement {
    return this.safeLayer;
  }

  private readonly safeLayer: HTMLElement;

  async init(): Promise<void> {
    this.insets = normalizeInsets(await GameShell.getEdgeInsets());
    await GameShell.addListener('edgeInsetsChanged', (insets) => {
      // §6.5 A12 point 4: a cutout-only change (e.g. rotation moving the cutout) is
      // an insets-only change like any other - it does not pause unless the window
      // drops below the floor (checked inside relayout via classifyWindow).
      this.insets = normalizeInsets(insets);
      this.relayout(false); // insets-only change: no pause (§6.5).
    });
    window.addEventListener('resize', () => this.relayout(true));
    this.relayout(true);
  }

  setSwapControls(swap: boolean): void {
    this.swapControls = swap;
    this.relayout(false);
  }

  /** §6.2.1 "Where it runs ... and on app resume" (code-review-round8 L3): re-checks
   * the window classification when the app returns to the foreground. In practice a
   * size or insets change while backgrounded also fires `resize`/`edgeInsetsChanged`
   * on the way back, so this is defense in depth, not the only path - it costs one
   * synchronous re-layout call, treated like an insets-only change (no pause; §8.1's
   * `resume` handler already runs `loop.resume()` without touching game state). */
  reclassify(): void {
    this.relayout(false);
  }

  renderScale(): number {
    return this.currentLayout ? Math.min(this.currentLayout.scale * window.devicePixelRatio, BACKING_STORE_SCALE_CAP) : 1;
  }

  private relayout(viewportSizeChanged: boolean): void {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const viewportKey = `${viewport.width}x${viewport.height}`;
    const isNewSize = viewportKey !== this.lastViewportKey;
    this.lastViewportKey = viewportKey;

    // `#safe-layer` (RotatePrompt/shell overlays/touch controls, §6.5) is positioned
    // from the insets UNCONDITIONALLY, before the classification below - it hosts
    // RotatePrompt itself, which must render at a real, non-zero size on the very
    // FIRST re-layout even when that first classification is 'portrait'/'tooSmall'
    // (a cold launch straight into a too-small window, M2.10a (a)). Previously this
    // was only set in the 'playable' branch below, so `#safe-layer` (and therefore
    // `#shell-overlay-root`'s 100%-relative box) stayed at its unset, zero-size
    // default until the first playable re-layout - RotatePrompt rendered with
    // `display: flex` but a 0x0 bounding box, invisible despite not being `.hidden`.
    this.safeLayer.style.left = `${this.insets.left}px`;
    this.safeLayer.style.right = `${this.insets.right}px`;
    this.safeLayer.style.top = `${this.insets.top}px`;
    this.safeLayer.style.bottom = `${this.insets.bottom}px`;

    // §6.2.1 behavior 2: RotatePrompt's own box stays full-viewport (android.css), but
    // its message is "centred inside the edge insets" - padding (not a repositioned
    // box) keeps the background full-bleed while `box-sizing: border-box` (android.css)
    // shrinks only the flex CONTENT area the text centers within.
    this.rotatePrompt.style.paddingLeft = `${this.insets.left}px`;
    this.rotatePrompt.style.paddingRight = `${this.insets.right}px`;
    this.rotatePrompt.style.paddingTop = `${this.insets.top}px`;
    this.rotatePrompt.style.paddingBottom = `${this.insets.bottom}px`;

    // §6.1 Amendment A12 point 6: debug evidence only - step-10 evidence reads the
    // reported cutouts (next to `--pf-scale`) over WebView DevTools. Nothing is
    // logged, stored or transmitted.
    document.documentElement.style.setProperty('--vvs-cutout-top', `${this.insets.cutoutTop}px`);
    document.documentElement.style.setProperty('--vvs-cutout-bottom', `${this.insets.cutoutBottom}px`);

    const windowClass = classifyWindow(viewport, this.insets, this.swapControls);
    // §6.2.1 behavior 1 / §6.5 Amendment A11: pause on ENTERING a prompt, even from an
    // insets-only re-layout with no viewport size change (see the file header note).
    const enteringPrompt = windowClass !== 'playable' && this.lastWindowClass === 'playable';
    this.lastWindowClass = windowClass;

    if (windowClass !== 'playable') {
      // §6.2.1 behavior 2: hide (not destroy) `#app-root` and the contents of
      // `#safe-layer` while the prompt shows, so hidden controls receive no events -
      // code-review-round8 R1. The RotatePrompt cover alone blocks pointer hit-testing
      // but not accessibility-service `click()` dispatch, which bypasses hit-testing
      // entirely and can activate a "hidden" menu button under the prompt.
      //
      // S2 (code-review-round9.md): a cold launch straight into this branch returns
      // before `computeLayout` ever runs, so `#app-root` is left un-laid-out (still at
      // its CSS default, e.g. [0, 0, 800, 600] over CDP) for as long as the prompt
      // shows. Harmless: the layer above is `visibility: hidden`, and the first
      // playable re-layout (the `windowClass === 'playable'` path below) applies a
      // real `computeLayout` result before `#app-root` is ever shown.
      this.appRoot.style.visibility = 'hidden';
      this.safeLayer.style.visibility = 'hidden';
      this.callbacks.onWindowPromptChange(windowClass);
      if (enteringPrompt || (viewportSizeChanged && isNewSize)) this.callbacks.onPause();
      return;
    }
    // §6.2.1 behavior 5: restore visibility in the same re-layout that returns to
    // 'playable', before applying the fresh layout below.
    this.appRoot.style.visibility = '';
    this.safeLayer.style.visibility = '';
    this.callbacks.onWindowPromptChange(null);

    const layout = computeLayout(viewport, this.insets, this.swapControls);
    this.currentLayout = layout;

    this.appRoot.style.transform = `scale(${layout.scale})`;
    this.appRoot.style.transformOrigin = '0 0';
    this.appRoot.style.margin = '0';
    this.appRoot.style.position = 'absolute';
    this.appRoot.style.left = `${layout.playfieldX}px`;
    this.appRoot.style.top = `${layout.playfieldY}px`;
    document.documentElement.style.setProperty('--pf-scale', String(layout.scale));

    this.touchControls.applyLayout(layout);
    this.callbacks.onScaleChange(this.renderScale());

    // M2.9: a genuine viewport size change (fold/split-screen/freeform resize) pauses,
    // same as M4.1; re-layout itself is synchronous and well under the 1s budget.
    if (viewportSizeChanged && isNewSize) this.callbacks.onPause();
  }
}
