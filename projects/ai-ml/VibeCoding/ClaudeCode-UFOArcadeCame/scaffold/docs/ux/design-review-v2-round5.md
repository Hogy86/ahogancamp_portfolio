# UX Design Review — v2 Addendum, Round 5 (independent re-verification of round-4 FAIL fixes)

**Reviewer:** ui-ux-designer (independent, code-only review)
**Scope:** re-verification of `docs/ux/design-review-v2-round4.md`'s three
blocking findings (FAIL-1 fireworks-hidden, FAIL-2 LEVEL/BOSS text contrast,
FAIL-3 Sentinel arms/legs outline) against the current, actual code — not the
implementer's fix summary.
**Inputs read (fresh, this round):** `src/ui/ScreenController.ts`,
`src/style.css`, `src/render/CanvasRenderer.ts`, `src/config/constants.ts`,
`src/render/shapes.ts`.
**Continuity:** this round does not restart from round 1. It verifies only
the three round-4 blocking findings, plus a general regression sanity pass
across the same files, per this round's assignment.

## Verdict: **PASS**

All three round-4 blocking findings are genuinely resolved in the code, with
real (not superficial) fixes. No new regression was found in the touched
render paths. One pre-existing, previously-flagged **non-blocking** item
(tier-4 regular-enemy outline contrast) remains unaddressed and is
re-flagged below for tracking, but it does not block this gate — see scoping
note under Finding 3.

---

## FAIL-1 (fireworks hidden behind overlay) — RESOLVED, verified

- **Where confirmed:** `src/ui/ScreenController.ts:132-142` (`renderVictory`)
  now constructs the overlay with two classes: `createElement('div',
  'screen-overlay screen-overlay--transparent-bg')`. `src/style.css:160-170`
  defines `.screen-overlay--transparent-bg { background: transparent; }`,
  declared *after* the base `.screen-overlay` rule (`background:
  rgba(2,2,8,0.86)`, `style.css:128-141`) — at equal class-selector
  specificity (0,1,0 vs 0,1,0), CSS cascade means the later-declared rule
  wins, so the Victory overlay's background genuinely resolves to
  `transparent`, not the opaque wash. Verified by reading the actual cascade
  order in the file, not assumed.
- **Other screens unaffected:** `renderTitle`, `renderPause`, and
  `renderGameOver` (`ScreenController.ts:47-118`) all still construct their
  overlay with the single `'screen-overlay'` class only — no
  `--transparent-bg` modifier is applied to them anywhere in the file. Their
  opaque `rgba(2,2,8,0.86)` background is unchanged. Confirmed no shared
  code path was altered in a way that could leak the transparent treatment
  onto Title/Pause/GameOver.
- **Fireworks now actually visible:** `CanvasRenderer.render` only draws
  `drawVictoryFireworks` (no entities) during `VICTORY`
  (`CanvasRenderer.ts:61-64`), and with the DOM overlay background now
  transparent, the canvas's firework particles (drawn at full/near-full
  `globalAlpha` per `drawFireworks`, `shapes.ts:358-384`) are no longer
  passed through an 86%-opacity near-black wash before reaching the player's
  eye. The z-index stack (`#game-canvas` auto/0 → `#hud-root` 10 →
  `#overlay-root` 20, `style.css:39-126`) is unchanged, so the overlay text
  still correctly draws on top of the fireworks rather than the fireworks
  bleeding over the text — stacking order is preserved, only the background
  fill of the topmost layer changed.
- **Text legibility over an animated multi-colored background:** the
  heading/paragraph text itself (`h1` inherits body color `#e8e8f0`; `p`
  is `#c8c8e0`, both near-white — `style.css:143-152`) gets a triple
  text-shadow specifically scoped to `.screen-overlay--transparent-bg h1,
  .screen-overlay--transparent-bg p` (`style.css:164-170`):
  `0 0 6px rgba(0,0,0,0.95)`, `0 0 12px rgba(0,0,0,0.85)`,
  `0 2px 4px rgba(0,0,0,0.9)`. This is a near-opaque black halo/blur stacked
  at two blur radii plus a drop-shadow, applied directly around each glyph —
  a standard, effective outline-via-shadow technique that is largely
  independent of what color sits directly behind the letterform (unlike a
  flat-color contrast pair, a tight near-opaque blurred halo keeps working
  as the background hue/luminance changes frame to frame). Traced the
  firework burst geometry (`shapes.ts:358-384`): burst centers land at
  y≈180 and y≈480 (two rows) with a max particle radius of ~84px per burst,
  so bursts can graze but do not concentrate directly on the vertically
  centered text block (~y=300, flex-centered per `.screen-overlay`'s
  `align-items: center`) — worst case is edge overlap, not a burst
  detonating directly under the text. Given the near-opaque halo and the
  burst geometry, this is adequate; a literal WCAG contrast-ratio number
  cannot be computed against an animated/blurred background (the technique
  is qualitatively, not numerically, verified), so this is flagged as a
  **soft, non-blocking watch item**: spot-check visually in a real browser
  during QA/UAT for the specific moment multiple bursts overlap the text
  before considering this fully closed.
- **Verdict: PASS.** Real fix, not a workaround; no scope creep into other
  screens.

## FAIL-2 (LEVEL N / BOSS INCOMING contrast) — RESOLVED, verified with contrast math

- **Where confirmed:** `src/config/constants.ts:63-70` adds
  `LEVEL_INTRO_TEXT_STROKE_COLOR = '#12121c'` with a comment explicitly
  citing this exact round-4 finding. `src/render/CanvasRenderer.ts:98-104`
  (`drawBossWarning`) and `:120-127` (`drawLevelIntro`) both now perform
  `ctx.strokeText(...)` with `strokeStyle = LEVEL_INTRO_TEXT_STROKE_COLOR`
  and `lineWidth = 4` **before** the existing `ctx.fillText(...)` with the
  amber fill — correct draw order (stroke painted first, fill on top),
  applied identically to both cues.
- **Contrast math (computed fresh, not trusted from comments):**
  - `#12121c` (stroke) vs `#f4f6fb` (white 1-hit enemy / Vanguard color):
    relative luminance ≈ 0.0064 vs ≈ 0.9213 → contrast ratio ≈ **17.2:1**.
    Far above the 3:1 floor for large/graphical text — this is the exact
    pairing that measured a failing 1.27:1 in round 4 (amber fill vs. white
    enemy); the new dark stroke fixes it decisively.
  - Checked the stroke against the full toughness range for completeness:
    vs. tier-2 `#c3c6cf` ≈ 10.9:1; vs. tier-4 `#3c3f46` ≈ 1.77:1 (weak, but
    irrelevant here — see next point).
  - The amber **fill** (`#ffd873`, established in round 4 as reading fine
    against black) also still carries real contrast against the darker
    enemy tiers where the stroke is weak: vs. tier-4 `#3c3f46` ≈ 7.7:1.
    Checked the one potential gap (mid-gray tier-2, where amber-on-tier2
    alone is weak at ≈1.25:1) and confirmed the dark stroke covers exactly
    that case at ≈10.9:1. Across the full white→dark enemy color range, at
    least one of {stroke, fill} clears a real contrast margin at every
    tier — no gap in the combined design.
  - Boss/black-background legibility (already-passing per round 4) is
    unaffected: the amber fill still reads against `#05050a`.
- **Verdict: PASS.** This is a real, quantifiably sufficient contrast fix,
  not merely "a stroke exists."

## FAIL-3 (Sentinel arms/legs missing outline) — RESOLVED, verified with contrast math

- **Where confirmed:** `src/render/shapes.ts:195-247` (`drawSentinel`).
  All four regions now receive `outlineColor` treatment:
  - **Legs** (`:199-205`): `fillRect` with `bodyColor`, followed by
    `ctx.strokeStyle = outlineColor; ctx.lineWidth = 2; ctx.strokeRect(...)`
    on both leg rectangles — previously had zero stroke.
  - **Torso** (`:208-212`): unchanged, already had `strokeRect` with
    `outlineColor` (this was passing in round 4).
  - **Arms** (`:214-235`): a new two-pass technique — a wider
    `outlineColor` stroke (`armWidth + 2`) drawn first, then the original
    narrower `bodyColor` stroke (`armWidth`) drawn on top along the same
    path, leaving a visible ~1px outline margin on each edge — a real
    outline effect adapted correctly to a line/stroke shape (a `strokeRect`
    equivalent isn't directly applicable to an angled line, and this
    double-stroke technique correctly substitutes for it). Previously the
    arm's only stroke color *was* `bodyColor` with no outline pass at all.
  - **Head** (`:237-247`): unchanged, already had `arc` + `outlineColor`
    stroke (passing in round 4).
- **Boss-specific contrast math (recomputed fresh):**
  - `BOSS_OUTLINE_COLOR = '#8a8a94'` vs. canvas background `#05050a`:
    luminance ≈ 0.2572 vs ≈ 0.00163 → contrast ratio ≈ **5.95:1**
    (consistent with round 4's "~6.2:1" estimate, recomputed independently
    here). Comfortably clears the 3:1 floor.
  - This ratio now applies uniformly to **all four** boss regions (head,
    arms, torso, legs), not just head/torso as in round 4. The boss's
    near-black fill (`BOSS_COLOR = '#242428'`, ≈1.3:1 against background,
    unchanged and still effectively invisible on its own) is no longer the
    only signal for the limbs — the ~5.95:1 outline now silhouettes the
    arms and legs exactly as it already did for the torso/head, so a viewer
    can point to all four humanoid regions per F17 AC1, and the boss no
    longer "reads as a floating torso+head with invisible limbs" as
    round 4 described.
  - Boss's leg stroke width (2px, unscaled by `BOSS_SIZE_MULTIPLIER`) and
    arm outline margin (~1px per edge) are thin relative to the boss's 5x
    scale, but this matches the pre-existing, already-accepted torso/head
    stroke treatment (also a flat 2px regardless of scale) — consistent
    with the established visual language of this file, not a new
    under-treatment specific to the fix.
- **Verdict: PASS** on the specific boss/near-black scope this round was
  asked to re-check.
- **Scoping note (non-blocking, carried forward, not a new finding):**
  round 4's FAIL-3 body text separately flagged, as a softer "consider"-level
  observation (not part of the quantified boss regression it required a fix
  for), that regular tier-4 enemies use the same `'#2a2a3a'` outline color,
  which is itself low-contrast against black. Recomputed here for
  completeness: `#2a2a3a` vs. `#05050a` ≈ **1.44:1** — still well under the
  3:1 floor, and unchanged by this round's fix (`shapes.ts:187` still maps
  `outlineColor = isBoss ? BOSS_OUTLINE_COLOR : '#2a2a3a'` for every regular
  tier, including tier-4). This round's assignment explicitly scoped
  re-verification to "the boss's near-black body specifically," so this is
  **not** treated as a new blocking finding here — but it is a real,
  still-open, previously-documented gap and should be tracked as a
  follow-up (e.g., a fast-follow ticket) before it resurfaces in a future
  audit, particularly since tier-4 enemies appear well before the boss
  encounter in the level progression.

---

## General regression sanity pass

- **Does the transparent Victory background leak into other screen
  states sharing the same overlay code path?** No. Confirmed by reading all
  four `render*` methods in `ScreenController.ts` — only `renderVictory`
  appends the `--transparent-bg` modifier class; `renderTitle`,
  `renderPause`, `renderGameOver` are textually unchanged and still resolve
  to the opaque `rgba(2,2,8,0.86)` background.
- **Does the Sentinel arm/leg outline change break the damage-crack overlay
  or invulnerability aura?** No. The damage-crack loop (`shapes.ts:262-271`)
  is drawn last, after all body-region strokes, using its own independent
  `damageOverlayColor` variable (unrelated to `outlineColor`) — its logic
  and draw order are untouched by this fix. The invulnerability aura lives
  entirely in `drawVanguard` (`shapes.ts:35-99`), a separate function never
  touched by the `drawSentinel` edits — no shared state or draw-order
  coupling between the two.
- **Does the Victory screen's canvas rendering still honor F19 AC3 ("no new
  scene/background swap")?** Yes — `CanvasRenderer.render`'s `VICTORY`
  branch (`CanvasRenderer.ts:61-64`) still only clears the canvas and draws
  fireworks; no entities, no new background fill beyond the existing
  `#game-canvas` CSS background (`#05050a`, unchanged).
- **Z-index / stacking order:** unchanged by any of the three fixes
  (`#game-canvas` auto → `#hud-root` z-index 10 → `#overlay-root` z-index
  20) — text still correctly draws above fireworks; nothing reordered.

---

## Summary for routing

**PASS.** All three round-4 blocking findings are resolved with real,
independently-verified fixes (traced actual cascade/draw order, not
implementer commentary; recomputed WCAG contrast ratios independently
rather than trusting code comments). No new regression was introduced in
the touched files. One previously-flagged, explicitly-non-blocking item
(tier-4 regular-enemy outline contrast, `'#2a2a3a'` ≈1.44:1 against black)
remains open and is re-flagged here for tracking as a fast-follow, but does
not block this gate per this round's stated scope. One soft watch item
(Victory-screen text-shadow legibility against animated fireworks) is
qualitatively sound but should get a real-browser visual spot-check during
UAT since it cannot be verified by contrast-ratio math alone.

This feature set may proceed to `security-compliance-reviewer` (pass 2) per
the pipeline.
