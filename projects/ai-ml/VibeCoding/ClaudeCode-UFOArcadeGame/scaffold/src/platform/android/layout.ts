// Implements docs/mobile/architecture/mobile-architecture.md §6.2 (M-ADR-0004): the
// control-column layout algorithm. Pure function, unit-tested - no DOM access here so
// the exact arithmetic in §6.3/§6.4 can be asserted without a real browser.
// PRD-mobile M2.2/M2.3a/M2.4/M2.12/M2.13/M3.1/M3.2.
//
// code-review-round1.md C1/C2: every control coordinate this module returns
// (`leftButtonX`, `rightButtonX`, `throwButtonX`, `pauseButtonX`, `controlRowY`,
// `pauseButtonY`) is expressed relative to `#safe-layer` - the un-scaled overlay layer
// that screenFit.ts already positions `insets.left/top` in from the real viewport edge
// (§6.5). Insets are therefore consumed exactly once, by `#safe-layer`'s own CSS
// position; this module must never add them again. `playfieldX`/`playfieldY` are the
// one exception: `#app-root` is positioned directly against the viewport (it is NOT a
// `#safe-layer` descendant, C1), so those two fields stay viewport-relative.

import { PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH } from '../../config/constants';

/** M2.3a: per-edge inset = max(display-cutout inset, system-gesture inset), read live
 * from GameShell - never a hard-coded constant. */
export interface EdgeInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Layout {
  scale: number;
  /** Viewport-relative (for `#app-root`, which sits outside `#safe-layer` - C1). */
  playfieldX: number;
  playfieldY: number;
  playfieldWidth: number;
  playfieldHeight: number;
  buttonSize: number;
  /** M2.3a/M2.13: true once the floor at buttonSize=56 still can't reach 0.5x - the
   * playfield shrinks further, but controls never shrink below their minimum (§6.2). */
  belowFloor: boolean;
  /** `#safe-layer`-relative left edge of ◀ (the move-zone's own left edge). */
  leftButtonX: number;
  /** `#safe-layer`-relative left edge of ▶. */
  rightButtonX: number;
  /** `#safe-layer`-relative left edge of THROW. */
  throwButtonX: number;
  /** `#safe-layer`-relative left edge of PAUSE (centred in THROW's B-wide lane). */
  pauseButtonX: number;
  /** `#safe-layer`-relative top edge shared by ◀ ▶ THROW (bottom-aligned row). */
  controlRowY: number;
  /** `#safe-layer`-relative top edge of PAUSE: always `16`, per §6.2 ("top edge at
   * t + 16") - t (insets.top) is already consumed by `#safe-layer`'s own offset. */
  pauseButtonY: number;
}

export const CONTROL_GAP_DP = 8;
const BUTTON_SIZES = [64, 56] as const;
const MIN_SCALE = 0.5;
const BOTTOM_MARGIN_MIN_DP = 16;
const PAUSE_SIZE_DP = 48;

/** §6.2: tries button sizes largest-first, accepting the first that reaches the 0.5x
 * scale floor; 56 is allowed as a fallback on any profile that needs it (M3.1). */
export function computeLayout(
  viewport: { width: number; height: number },
  insets: EdgeInsets,
  swapControls: boolean,
): Layout {
  const { width: W, height: H } = viewport;
  // `#safe-layer`'s own local frame: its origin is (insets.left, insets.top) in the
  // viewport, and it is sized so its far edge sits at (W - insets.right, H -
  // insets.bottom) - i.e. it has ALREADY removed every inset (C1/C2). Every size below
  // is computed in this local frame; only playfieldX/playfieldY convert back to the
  // viewport frame that `#app-root` actually lives in.
  const localW = W - insets.left - insets.right;
  const localH = H - insets.top - insets.bottom;

  let chosen: number = BUTTON_SIZES[1]; // fallback (56) if the loop below never assigns
  let scale = 0;
  let availW = 0;

  for (const B of BUTTON_SIZES) {
    const movColWidth = 2 * B + CONTROL_GAP_DP; // ◀ gap ▶, side by side (M2.12)
    const throwColWidth = B; // THROW (PAUSE shares this column)
    const w = localW - movColWidth - throwColWidth;
    const s = Math.min(w / PLAYFIELD_WIDTH, localH / PLAYFIELD_HEIGHT);
    chosen = B;
    scale = s;
    availW = w;
    if (s >= MIN_SCALE) break;
  }

  const belowFloor = scale < MIN_SCALE;
  const pfW = PLAYFIELD_WIDTH * scale;
  const pfH = PLAYFIELD_HEIGHT * scale;
  const movColWidth = 2 * chosen + CONTROL_GAP_DP;
  const throwColWidth = chosen;

  // Viewport-relative column widths (these DO include the real outer inset, since
  // `#app-root` is positioned against the viewport directly, not against `#safe-layer`).
  const moveOuterViewport = swapControls ? insets.right : insets.left;
  const throwOuterViewport = swapControls ? insets.left : insets.right;
  const movColViewport = moveOuterViewport + movColWidth;
  const throwColViewport = throwOuterViewport + throwColWidth;
  // C2: mirrored when swapped - the playfield sits next to whichever column now holds
  // the movement zone.
  const occupiedLeftViewport = swapControls ? throwColViewport : movColViewport;

  const playfieldX = occupiedLeftViewport + (availW - pfW) / 2;
  const playfieldY = insets.top + (localH - pfH) / 2;

  // Safe-layer-local control positions. Unswapped: ◀▶ hug the left edge of the local
  // frame, THROW/PAUSE the right edge. Swapped: mirrored (C2).
  const leftButtonX = swapControls ? localW - movColWidth : 0;
  const rightButtonX = leftButtonX + chosen + CONTROL_GAP_DP;
  const throwButtonX = swapControls ? 0 : localW - chosen;
  const pauseButtonX = throwButtonX + (chosen - PAUSE_SIZE_DP) / 2;

  // Bottom-aligned row (C2: THROW joins ◀▶ instead of pinning to the safe-layer's own
  // bottom edge). `#safe-layer`'s bottom is already at `insets.bottom` from H, so only
  // margin BEYOND that inset needs adding here.
  const extraBottomMargin = Math.max(0, BOTTOM_MARGIN_MIN_DP - insets.bottom);
  const controlRowY = localH - extraBottomMargin - chosen;

  return {
    scale,
    playfieldX,
    playfieldY,
    playfieldWidth: pfW,
    playfieldHeight: pfH,
    buttonSize: chosen,
    belowFloor,
    leftButtonX,
    rightButtonX,
    throwButtonX,
    pauseButtonX,
    controlRowY,
    pauseButtonY: 16,
  };
}

/** M2.10: Android forces (or the game itself detects) a portrait-shaped or too-small
 * window - the game must stay paused and show RotatePrompt instead of a squashed
 * playfield. */
export function needsRotatePrompt(viewport: { width: number; height: number }): boolean {
  return viewport.width <= viewport.height || viewport.width < 640 || viewport.height < 360;
}
