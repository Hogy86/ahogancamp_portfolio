# ADR M-0004: Screen fitting — content-sized side columns, live insets from a first-party GameShell plugin, scaled root with a text floor

## Status: Proposed

## Context
- M2.2, M2.4, M2.12 and M2.13: uniform scale of the fixed 800×600 playfield. Uneven,
  content-sized side columns. Playfield ≥ 0.5× on every profile. The 640×360 dp arithmetic
  must be stated and must close (UX F2, carry-forward 1 and 5).
- M2.3/M2.3a: controls stay outside max(cutout, system-gesture) insets queried **at run
  time**. No hard-coded 24 dp (UX F3, carry-forward 2).
- M2.5 immersive. M2.6/M2.11 text ≥ 12 dp and no overflow at the largest font. M2.8 crisp
  at device density. M2.9 re-layout on fold/resize. N1: don't replace the shared HUD pixel
  constants (carry-forward 4).
- CSS `env(safe-area-inset-*)` reports cutouts and system bars but **not** system-gesture
  insets, and its edge-to-edge support depends on the WebView version.

## Decision
1. **Pure `computeLayout(viewport, insets, swap)`.** Movement column = inset + B + 8 + B.
   THROW column = inset + B. B = 64, falling back to 56 only if 64 misses the 0.5× floor.
   `s = min(availW/800, availH/600)`, playfield centred in the remaining band, PAUSE 48×48
   at the top of the THROW lane. There is a rotate/too-small rule
   (W ≤ H, W < 640 or H < 360). The function is unit-tested against the profile table in
   `mobile-architecture.md` §6.4. On 640×360: 24+56+8+56 | 416 | 56+24 = 640, s = 0.52,
   PAUSE y 16-64, THROW y 280-336.
2. **Insets from a first-party local Capacitor plugin, GameShell**, in `android/app`. It
   uses `WindowInsetsCompat.getInsets(Type.displayCutout())` and
   `getInsets(Type.systemGestures())`, takes the per-edge max, converts to dp, and exposes
   `getEdgeInsets()` plus an `edgeInsetsChanged` event. The same plugin handles immersive
   mode (`WindowInsetsControllerCompat.hide(systemBars())`, transient-by-swipe),
   keep-screen-on, and window-focus events (M-ADR-0005). It does not consume insets and
   does not replace Capacitor's listener. Capacitor's own edge-to-edge margin handling is
   disabled.
3. **Scaled root, unscaled overlays.** `#app-root` (canvas + HUD) is placed at the
   playfield rect with `transform: scale(s)`. HUD/control-text keep their shared pixel
   padding, which is already inside the insets because the playfield is. Android-only
   `android.css`, scoped under `html.platform-android`, adds a font floor
   `max(<px>, 12px / s)`. `src/style.css` is **not edited**. Menus and overlays move to an
   unscaled, inset-padded `#safe-layer` so their targets are real dp (≥ 48).
4. **Canvas backing store** = `round(800k) × round(600k)`, with
   `k = min(s × devicePixelRatio, 3.2)`. The renderer draws in logical units under
   `setTransform(k…)`. The web passes k = 1 (unchanged).
5. WebView `textZoom` is capped at 130% of the system font scale (M2.11).

## Alternatives Considered (and why rejected)
- **Hard-coded 24 dp insets.** Rejected by M2.3a (must be live) and UX carry-forward 2.
- **CSS `env(safe-area-inset-*)` only.** Rejected. It has no system-gesture insets, so
  controls could sit in the back-gesture zone (UX F3), and its behavior varies with the
  WebView version on API 24-34.
- **Community plugins** (a safe-area plugin + keep-awake plugin + a status-bar/immersive
  plugin). Rejected. That is three third-party native dependencies for about 40 lines of
  first-party AndroidX code. Safe-area plugins also don't expose system-gesture insets, and
  support for new Capacitor majors lags.
- **`View.setSystemGestureExclusionRects` over the controls** instead of keeping them out
  of the insets. Rejected. Android caps exclusions at 200 dp per edge and ignores them for
  the bottom home gesture. It also contradicts M2.3a's "deliberate edge swipes still
  perform back".
- **Even 50/50 side columns.** Rejected by UX F2 (◀▶ do not fit in 80 dp).
- **Stacking ◀/▶ vertically, or buttons below 48/56 dp.** Rejected by UX F2 (breaks the
  left/right mapping and Android's 48 dp minimum).
- **Scaling HUD text with the playfield.** Rejected. At 0.52× the 15 px HUD becomes ≈ 8 dp,
  which fails M2.6.
- **Re-laying out the HUD in dp outside the scaled root.** Rejected for v1. It would fork
  HUD positioning per platform. The `max()` floor keeps one HUD layout.
- **Letterboxed band layout for near-square tablets.** Rejected by M2.13 / OQ-M7 (a).

## Consequences
- The layout numbers in the architecture doc are test-asserted, not prose-only.
- A device reporting more than 32 dp per side edge on a 640×360 screen drops below 0.5×
  (`belowFloor`), because M2.3a gives inset safety priority. This is recorded in the
  device matrix (risk MR4).
- The HUD at the 12 dp floor takes a larger share of a 0.52× playfield (risk MR5), which
  the UX round-2 screenshots check.
- GameShell is ~100 lines of first-party Java for the security reviewer to read. It has no
  permissions and no I/O.
- Traces to: M2.1-M2.13, M2.3a, M3.1, M3.2, UX F1-F3, N1, N2, carry-forward 1/2/4/5/6;
  `mobile-architecture.md` §6.

## Amendment note (2026-09-27, architecture v1.5, Amendment A11)
Recorded by the main session because the architect could not list this directory. The Decision text above is kept as the historical record; where later text differs, it wins.
- PRD-mobile v1.5 M2.10a (too-small window, any shape) is specified in mobile-architecture.md §6.2.1 (A11): portrait windows keep M2.10's prompt; a landscape window with `W < l + r + 576` or `H < t + b + 300` (run-time insets) pauses and shows "Make the window larger to play." The playfield never renders below 0.5×; the old fixed `W < 640 || H < 360` rule is replaced.
- Back order (§8.3, A11): the too-small/rotate prompt is checked before any open overlay, so Back leaves the app while the prompt shows.

## Amendment note (2026-09-28, architecture v1.6, Amendment A12)
Written by mobile-solution-architect. The Decision text above is kept as the historical
record; where later text differs, it wins. Full specification: `mobile-architecture.md`
§6.1-§6.5 A12, §6.2.1 A12 and §16 A12.

**Trigger.** PRD-mobile v1.6 **M2.3b**, a mobile-product-manager decision made in response
to `docs/mobile/reviews/code-review-round8.md` **E1**. Real gesture-navigation insets measured
on `svr_api36_pixel7` (t ≈ 28.2, b = 32, sides ≈ 29.7 dp) made the 640 × 360 dp reference
window miss the A11 floor (`t + b ≤ 60` needed; 60.19 measured). M2.3b lets the playfield
(non-interactive art) extend under the top and bottom **system-gesture** bands, never under
a display cutout. HUD/hint text, controls and menus stay inside the full insets.

**What changes in this ADR's decisions.**
- **Decision 2 (GameShell) is extended.** The inset payload (`getEdgeInsets()` and
  `edgeInsetsChanged`) gains `cutoutTop` and `cutoutBottom`: the display-cutout insets
  alone, in dp. The four edge fields keep their meaning, `max(cutout, gesture)`, and still
  govern controls, menus, prompts and all text. If a payload has no cutout fields (for
  example a stale native build), JS treats each cutout as equal to its edge inset. That is
  fail-safe: it reproduces the A11 layout, with no art in the bands. This is the only
  native change. It adds no permission, method, plugin, storage or network, and it goes to
  security pass 2.
- **Decision 1 (layout) changes on the vertical axis only:**
  - `availH = H − max(cT, t − 2) − max(cB, b − 6.5)`.
  - The playfield is centred between `max(cT, t − 4s)` and `H − max(cB, b − 13s)`.
  - Floor: `W ≥ l + r + 576` (unchanged) and `H ≥ max(cT, t − 2) + max(cB, b − 6.5) + 300`.
    The classification still equals `computeLayout(...).belowFloor`.
  - The width rule, the B = 64 → 56 order and control placement are unchanged.
- **Decision 3 is kept.** No safe-area padding is added to the HUD. Text stays safe through
  the playfield's position alone, using two documented constants:
  - `TEXT_TOP_LOGICAL = 4`: the canvas warnings' em-box top.
  - `TEXT_BOTTOM_LOGICAL = 13`: the control hint's content-box bottom.

  The HUD panels' content box starts at logical y 15, so it never binds.
- **RotatePrompt location (code-review-round8 I1).** RotatePrompt is a `<body>`-level,
  fixed, full-viewport layer above `#safe-layer`, not a child of it. Its message is kept
  inside the insets by padding.

**Consequences.**
- At measured gesture insets (30, 30, 28.2, 32), 640 × 360 plays at s = 0.505 (404 × 303
  dp). Headroom is 8.3 dp vertically and 4 dp horizontally.
- Three-button navigation (0, 48, 24, 0) plays at s = 0.52.
- The width limit `l + r ≤ 64` on a 640 dp wide window is an accepted known limit. A side
  cutout or an above-default back-gesture setting still shows the prompt (MR4), and the
  closed test watches for it.
- New risks: MR21 (the text constants drift from the shared CSS or canvas; covered by a
  Playwright DOM-bounds check and a change-control rule) and MR22 (the payload lacks the
  new fields; covered by the fail-safe default).

**Alternatives considered for A12 (and why rejected).**
- **A lower floor (0.48×) or smaller controls.** Rejected by PRD-mobile M2.3b rule 4,
  M2.13 and M3.1.
- **An exact, scale-dependent vertical solve** (using `4s` and `13s` in the sizing too).
  Rejected. It needs a piecewise solve to gain about 1-2 dp of height above the floor. The
  closed form is exact at s = 0.5, which is where the classification needs exactness.
- **Moving the HUD/hint text by the band overlap instead of moving the playfield.**
  Rejected. It forks the shared HUD positions per platform (the N1 decision) and pushes the
  HUD further into the formation area (MR5).
- **Letting text into the bands as well.** Rejected by M2.3b rule 2.
- **`env(safe-area-inset-*)` for the cutout.** Rejected for the same reason as Decision 2
  (it depends on the WebView version). GameShell already holds the exact value.

**Traces to:** PRD-mobile v1.6 M2.3b (rules 1-4, (a)-(e), known limit), the M2.10a and
M2.12 v1.6 notes, M2.3a, M2.13, M3.1, M3.2; code-review-round8 E1 and I1; OQ-M7 (a).

## Amendment note (2026-10-04, architecture v1.8, Amendment A14)
Written by mobile-solution-architect. The Decision text above is kept as the historical
record; where later text differs, it wins. On Android the two top warning words are a DOM
banner under the HUD, and the website keeps the canvas text, behind one `CanvasRenderer`
flag set through `PlatformContext` (default on). `TEXT_TOP_LOGICAL` stays 4. Full record:
M-ADR-0013 (`0013-android-top-banner.md`) and `docs/mobile/architecture/amendment-A14.md`.
