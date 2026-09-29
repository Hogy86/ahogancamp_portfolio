// Implements docs/mobile/architecture/mobile-architecture.md §6.2/§6.2.1 (M-ADR-0004,
// Amendment A11): the control-column layout algorithm and the portrait/too-small/
// playable window classification (M2.10a). Pure functions, unit-tested - no DOM access
// here so the exact arithmetic in §6.3/§6.4 and every §6.2.1 worked-check row can be
// asserted without a real browser.
// PRD-mobile M2.2/M2.3a/M2.4/M2.10/M2.10a/M2.12/M2.13/M3.1/M3.2.
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

/** §6.1 Amendment A12: a payload as delivered by GameShell (or the `?insets=`/
 * `?cutout=` web fallback, §10 item 3) BEFORE normalization - the two cutout fields
 * are optional, and every field may be missing/non-finite/out of range, because this
 * is the shape a stale native build or a malformed query string can actually produce. */
export type RawInsets = EdgeInsets & { cutoutTop?: number; cutoutBottom?: number };

/** §6.1 Amendment A12: the normalized insets every layout function consumes.
 * `cutoutTop`/`cutoutBottom` are REQUIRED here (unlike `RawInsets`) so a call site
 * cannot silently leave them out - `normalizeInsets` is the only producer. */
export type LayoutInsets = EdgeInsets & { cutoutTop: number; cutoutBottom: number };

function normalizeEdge(value: number | undefined): number {
  // §6.1 A12 point 3.1: extends the pre-A12 `toFiniteOrZero` rule (missing/non-finite
  // -> 0, GameShell.ts) to negatives too - a negative inset is just as poisonous to
  // the layout arithmetic below as `NaN` was.
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeCutout(value: number | undefined, fallbackEdge: number): number {
  // §6.1 A12 point 3.2: a missing/non-finite cutout falls back to the ALREADY-
  // normalized matching edge inset (fail-safe: a payload without the new fields, e.g.
  // a stale native build, lays out exactly as in v1.5, with no art in the bands). A
  // negative cutout (unlike a missing one) is simply invalid input -> 0, same as an
  // edge field.
  if (value === undefined || !Number.isFinite(value)) return fallbackEdge;
  return value >= 0 ? value : 0;
}

/** §6.1 Amendment A12: the one pure function every GameShell payload (native or web
 * fallback) is normalized through before any other use (§10 item MR22). Applies, in
 * order: (1) edge fields -> 0 if missing/non-finite/negative; (2) cutout fields -> the
 * matching (already-normalized) edge inset if missing/non-finite, 0 if negative; (3)
 * raise `top`/`bottom` to their cutouts, so `0 <= cutoutTop <= top` and
 * `0 <= cutoutBottom <= bottom` always hold for every consumer downstream. */
export function normalizeInsets(raw: RawInsets): LayoutInsets {
  const left = normalizeEdge(raw.left);
  const right = normalizeEdge(raw.right);
  const edgeTop = normalizeEdge(raw.top);
  const edgeBottom = normalizeEdge(raw.bottom);

  const cutoutTop = normalizeCutout(raw.cutoutTop, edgeTop);
  const cutoutBottom = normalizeCutout(raw.cutoutBottom, edgeBottom);

  return {
    left,
    right,
    top: Math.max(edgeTop, cutoutTop),
    bottom: Math.max(edgeBottom, cutoutBottom),
    cutoutTop,
    cutoutBottom,
  };
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
/** §6.2/§6.5 Amendment A12: the nearest playfield text to the top edge (the formation/
 * boss warning's em box, `CanvasRenderer.drawFormationWarning`/`drawBossWarning`,
 * baseline y=24 minus a 20px em box = logical y 4). See §6.5 A12's text inventory
 * table and change-control rule (§12 MR21): a shared change moving this text closer
 * to the top edge must update this constant in the same change. */
export const TEXT_TOP_LOGICAL = 4;
/** §6.2/§6.5 Amendment A12: the nearest playfield text to the bottom edge
 * (`#control-text`'s content-box bottom, logical y 587 = 600 - 13). Same
 * change-control rule as `TEXT_TOP_LOGICAL` (§12 MR21). */
export const TEXT_BOTTOM_LOGICAL = 13;

/** §6.2: tries button sizes largest-first, accepting the first that reaches the 0.5x
 * scale floor; 56 is allowed as a fallback on any profile that needs it (M3.1). */
export function computeLayout(
  viewport: { width: number; height: number },
  insets: LayoutInsets,
  swapControls: boolean,
): Layout {
  const { width: W, height: H } = viewport;
  // `#safe-layer`'s own local frame: its origin is (insets.left, insets.top) in the
  // viewport, and it is sized so its far edge sits at (W - insets.right, H -
  // insets.bottom) - i.e. it has ALREADY removed every inset (C1/C2). Controls
  // (movement/THROW/PAUSE columns) are placed in this local frame, unchanged by A12
  // (§6.2 A12: "controls are unchanged"). Only playfieldX/playfieldY convert back to
  // the viewport frame that `#app-root` actually lives in - and, since A12, the
  // playfield's VERTICAL sizing/placement no longer uses `localH` at all; it uses
  // `availH`/`topMin`/`botMin` below instead, which are governed by the cutouts, not
  // the full top/bottom insets.
  const localW = W - insets.left - insets.right;
  const localH = H - insets.top - insets.bottom;

  // §6.2 Amendment A12: replaces `availH = H - insets.top - insets.bottom`. The
  // playfield's height reservation is governed by the cutouts, not the full insets -
  // `topRes`/`botRes` are how much vertical room the FLOOR (s=0.5) needs to keep the
  // topmost/bottommost playfield text inside the full inset while still allowing art
  // to reach into a cutout-free gesture band. Computed once - it does not depend on B.
  const topRes = Math.max(insets.cutoutTop, insets.top - TEXT_TOP_LOGICAL * MIN_SCALE);
  const botRes = Math.max(insets.cutoutBottom, insets.bottom - TEXT_BOTTOM_LOGICAL * MIN_SCALE);
  const availH = H - topRes - botRes;

  let chosen: number = BUTTON_SIZES[1]; // fallback (56) if the loop below never assigns
  let scale = 0;
  let availW = 0;

  for (const B of BUTTON_SIZES) {
    const movColWidth = 2 * B + CONTROL_GAP_DP; // ◀ gap ▶, side by side (M2.12)
    const throwColWidth = B; // THROW (PAUSE shares this column)
    const w = localW - movColWidth - throwColWidth;
    const s = Math.min(w / PLAYFIELD_WIDTH, availH / PLAYFIELD_HEIGHT);
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
  // §6.2 Amendment A12: replaces `playfieldY = insets.top + (localH - pfH) / 2`. The
  // playfield is centred between `topMin` (the highest its top edge may sit: never
  // above the top cutout, and never so high that its topmost text - logical y
  // TEXT_TOP_LOGICAL - would land above the top edge inset) and `H - botMin`
  // (the mirror image for the bottom). At scale >= MIN_SCALE this is always
  // non-negative (§6.2 A12 "always feasible").
  //
  // S1 (code-review-round9.md): `topMin`/`botMin`/`playfieldY` below are computed with
  // whatever `scale` the loop above landed on, even when that `scale < MIN_SCALE`
  // (belowFloor). That result is never actually applied to the DOM - screenFit.ts
  // shows the too-small prompt instead of laying out `#app-root` whenever
  // `classifyWindow(...) !== 'playable'` - so the "always feasible" proof in the
  // comment above (which assumes `scale >= MIN_SCALE`) does not need to, and does not,
  // cover the belowFloor case.
  const topMin = Math.max(insets.cutoutTop, insets.top - TEXT_TOP_LOGICAL * scale);
  const botMin = Math.max(insets.cutoutBottom, insets.bottom - TEXT_BOTTOM_LOGICAL * scale);
  const playfieldY = topMin + (H - topMin - botMin - pfH) / 2;

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

/** §6.2.1 (Amendment A11, M2.10/M2.10a): a window is `'portrait'` (M2.10, checked
 * first so a portrait-shaped window always keeps its own text even when it is also
 * too small), `'tooSmall'` (M2.10a: landscape-shaped but below the M2.12/M2.13
 * floor), or `'playable'`. */
export type WindowClass = 'portrait' | 'tooSmall' | 'playable';

/** Replaces the old fixed `W < 640 or H < 360` check (superseded by A11 - it ignored
 * the run-time insets M2.10a requires). `'tooSmall'` is derived from
 * `computeLayout(...).belowFloor` at the same B_MIN=56 fallback the layout algorithm
 * itself uses (§6.2.1's documented preference), so the classification and the layout
 * can never disagree - no separate floor constants are duplicated here. Swap does not
 * change the floor (`l + r` is the same either way, M3.13), so `swapControls` only
 * matters for `computeLayout`'s own control placement, not this yes/no result. */
export function classifyWindow(
  viewport: { width: number; height: number },
  insets: LayoutInsets,
  swapControls: boolean,
): WindowClass {
  if (viewport.width <= viewport.height) return 'portrait';
  return computeLayout(viewport, insets, swapControls).belowFloor ? 'tooSmall' : 'playable';
}
