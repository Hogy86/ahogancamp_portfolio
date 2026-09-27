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
//   change does not.

import { computeLayout, needsRotatePrompt, type EdgeInsets, type Layout } from './layout';
import { GameShell } from './GameShell';
import type { TouchControls } from './TouchControls';

const BACKING_STORE_SCALE_CAP = 3.2;

export interface ScreenFitCallbacks {
  onPause(): void;
  onRotatePromptChange(show: boolean): void;
  /** M3: called with the new canvas backing-store scale (M2.8) on every re-layout that
   * actually computes one - not just once at boot. */
  onScaleChange(scale: number): void;
}

export class ScreenFit {
  private insets: EdgeInsets = { left: 0, right: 0, top: 0, bottom: 0 };
  private swapControls = false;
  private lastViewportKey = '';
  private currentLayout: Layout | null = null;

  constructor(
    private readonly appRoot: HTMLElement,
    private readonly overlayRoot: HTMLElement,
    private readonly shellOverlayRoot: HTMLElement,
    private readonly touchControls: TouchControls,
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
  }

  /** The common ancestor of `overlayRoot`, `shellOverlayRoot` and the touch controls -
   * AndroidPlatform attaches its one delegated click listener here (§5.4) so a single
   * handler covers game screens, shell overlays and touch controls alike. */
  get clickRoot(): HTMLElement {
    return this.safeLayer;
  }

  private readonly safeLayer: HTMLElement;

  async init(): Promise<void> {
    this.insets = await GameShell.getEdgeInsets();
    await GameShell.addListener('edgeInsetsChanged', (insets) => {
      this.insets = insets;
      this.relayout(false); // insets-only change: no pause (§6.5).
    });
    window.addEventListener('resize', () => this.relayout(true));
    this.relayout(true);
  }

  setSwapControls(swap: boolean): void {
    this.swapControls = swap;
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

    if (needsRotatePrompt(viewport)) {
      this.callbacks.onRotatePromptChange(true);
      if (viewportSizeChanged && isNewSize) this.callbacks.onPause();
      return;
    }
    this.callbacks.onRotatePromptChange(false);

    const layout = computeLayout(viewport, this.insets, this.swapControls);
    this.currentLayout = layout;

    this.appRoot.style.transform = `scale(${layout.scale})`;
    this.appRoot.style.transformOrigin = '0 0';
    this.appRoot.style.margin = '0';
    this.appRoot.style.position = 'absolute';
    this.appRoot.style.left = `${layout.playfieldX}px`;
    this.appRoot.style.top = `${layout.playfieldY}px`;
    document.documentElement.style.setProperty('--pf-scale', String(layout.scale));

    this.safeLayer.style.left = `${this.insets.left}px`;
    this.safeLayer.style.right = `${this.insets.right}px`;
    this.safeLayer.style.top = `${this.insets.top}px`;
    this.safeLayer.style.bottom = `${this.insets.bottom}px`;

    this.touchControls.applyLayout(layout);
    this.callbacks.onScaleChange(this.renderScale());

    // M2.9: a genuine viewport size change (fold/split-screen/freeform resize) pauses,
    // same as M4.1; re-layout itself is synchronous and well under the 1s budget.
    if (viewportSizeChanged && isNewSize) this.callbacks.onPause();
  }
}
