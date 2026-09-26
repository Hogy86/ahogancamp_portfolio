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
