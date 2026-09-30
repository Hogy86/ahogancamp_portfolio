# Product Requirements Document — Addendum v5

**Product:** Shield vs Robots
**Stage:** 2 — Product Manager (PRD addendum, shared art change)
**Date:** 2026-09-29
**Author:** product-manager subagent
**Status:** v5 — DECIDED in scope. No owner decision is needed: this is an
art-only change inside the existing, owner-approved IP rule (NFR-10 / F9 AC4,
tightened by v4 F22 AC8). No game rule, number, timing or text changes.

**What this addendum does.** It adds **F23**, which replaces the icon drawn
inside the **Permanent Hit-Power Multiplier** power-up token. Today the token
is the shared amber ring with a diagonal "x" inside it. Two crossing diagonal
strokes inside a circle is the basic construction of the X-Men emblem, so the
"x" is removed. The ring stays. The recommended new icon is three ascending
vertical bars.

This is a **shared game change**. The website and the Android app draw the
token from the same code (`src/render/shapes.ts` `drawPowerUp`), so it
applies to both, and it must pass the gates of **both** pipelines
(`.claude/CLAUDE.md` §One codebase) before either version ships.

`docs/PRD.md` and addenda v2-v4 are **not edited**. Where this addendum
differs from them, this addendum wins. The old text is quoted next to the new
text below. `docs/mobile/PRD-mobile.md` is cross-referenced, not edited.

**Sources (upstream):**
- `docs/mobile/security/review-v2.md` **V2-M3** (the ringed "x" is an
  unassessed hit against PRD-mobile M9.6 item 3, "no 'X' emblem"; fix (a),
  preferred: a shared glyph change routed through both pipelines) and
  condition **C7**.
- `docs/mobile/ux/design-review-round5.md` — ruling (a): change the shared
  glyph. Requirements 1-4 (no crossing strokes; three ascending vertical bars
  in the same amber, 2px, about ±0.4 × radius; distinguishable from the other
  three glyphs at 24px diameter; both pipelines' gates). Alternatives it
  rejected: "+" (reads as a heal pickup), double chevron (clashes with Hit
  Power), ringless "×N" text (breaks the shared ring; N is not fixed).
- `docs/PRD.md` — **F7** (the four power-ups; AC7 permanent multiplier, AC10
  HUD readout), **NFR-9(a)** (not color-only), **NFR-10** and **F9 AC4**
  (original art, no trademark-adjacent motifs; hard requirement).
- `docs/PRD-addendum-v2.md` — **F11 AC8** (the four power-ups are visually
  distinguishable while still falling, by more than color).
- `docs/PRD-addendum-v4.md` — **F22 AC8** (IP rule kept and tightened),
  NFR-10 row of the F22 table.
- `docs/mobile/PRD-mobile.md` — **M9.6** item 3 ("No X-Men imagery or
  iconography: no 'X' emblem …") and item 4 ("Any hit is a FAIL"); §0 rule 3
  (shared changes go through both pipelines); the UC4 row ("power-up icons
  must stay distinguishable at phone scale (F11 AC8)").
- `docs/mobile/ux/store-assets-spec.md` screenshot 4 ("Power-up catch
  moment") and its 2026-09-29 change-log line (no old "x" token in store art).
- `docs/market/market-goals-and-use-cases.md` UC4 (catch power-ups), goal P4
  (catch rate).
- Existing implementation, read to ground the ACs:
  - `src/render/shapes.ts` `drawPowerUp`: every token is a dark filled disc
    `rgba(20, 20, 30, 0.85)` with a ring stroked in `LEVEL_INTRO_TEXT_COLOR`
    (`#ffd873`, `src/config/constants.ts`), `lineWidth = 2`. Glyphs, all
    stroked in the same amber at 2px: `HIT_POWER` upward chevron, `SPEED` two
    horizontal speed lines, `SHIELD` kite, `PERMANENT_MULTIPLIER` "x" (two
    diagonals from (±0.35r, ±0.35r)).
  - `src/config/constants.ts` `POWERUP_RADIUS = 12` (24px diameter in game
    units). The only caller is `CanvasRenderer.drawPowerUps`.
  - No test under `tests/` references `PERMANENT_MULTIPLIER` glyph geometry
    or `drawPowerUp` today.

**Terminology (carried from v1-v4).** New in v5:
- **"token"**: the falling power-up as drawn: disc, ring and glyph.
- **"ring"**: the shared amber circle outline around every token.
- **"glyph"**: the icon strokes drawn inside the ring, one per power-up type.
- **"crossing strokes"**: two stroke segments that intersect at a point that
  is not a shared endpoint of both.

---

## Summary of the change → feature mapping

| # | Change (short) | Feature | Amends |
|---|---|---|---|
| 1 | Permanent Multiplier glyph: the ringed "x" is replaced by a non-crossing glyph (recommended: three ascending vertical bars); ring, colors, size and behavior unchanged | **F23** | `docs/PRD.md` **F7** (power-up types list, Permanent Hit-Power Multiplier art), **NFR-10**; `docs/PRD-addendum-v2.md` **F11 AC8**; `docs/PRD-addendum-v4.md` **F22 AC8** (adds item (c)). |

---

## Features (v5)

### F23 — Permanent Multiplier power-up glyph: no "X" emblem

Traces to: UC4, goal P4; NFR-9(a); NFR-10 / F9 AC4 / v4 F22 AC8 (IP
avoidance); `docs/mobile/security/review-v2.md` V2-M3;
`docs/mobile/ux/design-review-round5.md`; `docs/mobile/PRD-mobile.md` M9.6
item 3.

- Description: The Permanent Hit-Power Multiplier token keeps the shared
  amber ring. The diagonal "x" inside it is replaced by a glyph with no
  crossing strokes. The recommended glyph is three vertical bars that step up
  from left to right (a "growing" bar chart), drawn in the same amber at the
  same 2px weight as the other glyphs. The power-up's behavior, drop rules,
  catch rules, HUD readout and on-catch feedback do not change.

**Supersedes / amends (quoted old text → v5 text):**

Note: before v5 no PRD text described the multiplier's glyph shape. The "x"
was an implementation choice made under F11 AC8. v5 makes the shape rule
explicit so it can be tested.

| Where | Old text (quoted) | v5 text |
|---|---|---|
| `docs/PRD.md` F7, power-up types list | "**Permanent Hit-Power Multiplier** — current hit power ×1.8, stacks, permanent for the rest of the run." | "**Permanent Hit-Power Multiplier** — current hit power ×1.8, stacks, permanent for the rest of the run. Its token is the shared amber ring with a non-crossing glyph (recommended: three ascending vertical bars), never an "x" or any crossing-stroke shape (F23)." |
| `docs/PRD-addendum-v2.md` F11 AC8 | "each has a distinct icon/shape, differentiated by more than color alone (non-color-only per NFR-9)." | "each has a distinct icon/shape, differentiated by more than color alone (non-color-only per NFR-9), **and each glyph also meets F23 AC1-AC6** (no crossing strokes, no emblem-like shapes; all four distinguishable at 24px diameter)." The rest of F11 AC8 (identify a drop's type while falling, before the catch) is unchanged. |
| `docs/PRD-addendum-v4.md` F22 AC8 | "(a) The word "Shield" is **never** styled as **S.H.I.E.L.D.** … (b) **No shield** anywhere in the product … uses a **red/white/blue star design** …" | Items (a) and (b) unchanged. **Added (c):** "No token, icon, HUD element, logo, splash or store asset shows an "X" emblem: two crossing diagonal strokes inside or over a circle or ring, or any X-shaped mark used as a badge. A plain "×" multiplication sign in running text (for example the HUD readout "Power ×3.24", F7 AC10) is text, not an emblem, and is allowed." |
| `docs/PRD.md` NFR-10 (as amended by v4 F22) | "ShieldMan/robots original designs only, plus F22 AC8-AC10." | "ShieldMan/robots original designs only, plus F22 AC8(a)-(c) (v5), AC9-AC10, and F23." Hard requirement, not contingent (unchanged). |

**Acceptance Criteria (website; Android equivalents in §Cross-platform
consistency):**

1. **No crossing strokes.** The `PERMANENT_MULTIPLIER` glyph contains no two
   stroke segments that cross (intersect at a point that is not a shared
   endpoint of both). It contains no pair of diagonal strokes forming an "X"
   or "+" of any size. *Test:* a unit test draws the token into a recording
   2D-context stub (or equivalent path capture) and asserts, for every pair
   of glyph segments (the ring arc excluded), that they do not cross.
2. **Ring and disc unchanged.** The multiplier token's disc and ring are drawn
   exactly as the other three tokens': same radius (`p.radius`, default
   `POWERUP_RADIUS` = 12), same fill `rgba(20, 20, 30, 0.85)`, ring stroked in
   `LEVEL_INTRO_TEXT_COLOR` (`#ffd873`) at `lineWidth` 2. *Test:* the same
   recording stub shows identical arc/fill/stroke calls for all four types
   before the glyph strokes.
3. **Glyph style matches the family.** Glyph strokes use
   `LEVEL_INTRO_TEXT_COLOR` at `lineWidth` 2 (the same as the other three
   glyphs). No new color is introduced. Every glyph point lies within
   ±0.45 × radius of the token center on both axes, so the glyph stays clear
   of the ring. *Test:* recorded stroke style and line width, and a bound
   check on every recorded path point.
4. **Recommended shape (default).** Unless ui-ux-designer or
   mobile-ui-ux-designer records an equivalent in a design review (AC5), the
   glyph is **three vertical bars**:
   (a) exactly three vertical segments (x constant within each), at three
   distinct x positions spread across about −0.4r to +0.4r (outer bars at
   |x| between 0.3r and 0.45r, middle bar at x = 0 ± 0.05r);
   (b) all three share one bottom y (the baseline), at about +0.4r (between
   +0.3r and +0.45r);
   (c) heights strictly increase from left to right, and the tallest bar's
   top is at about −0.4r (between −0.3r and −0.45r).
   *Test:* unit test on the recorded segments.
5. **Equivalent glyph (only if chosen).** A different glyph is acceptable only
   if it meets AC1-AC3, AC6 and AC7, is not "+" or a chevron/double chevron
   (rejected in `design-review-round5.md`), and a design review names it and
   records the AC6 check. The AC4 test is then replaced by a test of that
   glyph's recorded shape.
6. **Distinguishable at 24px, not by color.** All four tokens stay
   distinguishable from one another by glyph shape alone at 24px diameter
   (radius 12), while falling (F11 AC8, NFR-9(a)). *Tests:* (a) automated —
   the recorded glyph segment lists of the four types are pairwise different
   (no two types share the same segment set, allowing a 0.05r tolerance), and
   the multiplier glyph is the only one made of three vertical segments;
   (b) visual — a capture showing all four tokens side by side at radius 12
   (website at 1× and at the phone-emulation viewport) is attached to the
   website UX round 2 review and the mobile design review, and the reviewer
   records that each type can be named without relying on color.
7. **No "X" emblem anywhere (v4 F22 AC8(c)).** No player-visible art in the
   product shows an "X" inside or over a circle or ring: power-up tokens, HUD,
   title, icon, splash, feature graphic or store screenshots. The HUD text
   readout "Power ×N" (F7 AC10) is unchanged and allowed. *Test:* the AC1 test
   runs for all four glyph types; reviewers check the icon, splash and store
   assets by eye.
8. **No behavior or text change.** Power-up type, drop rules (F7 AC1-AC3),
   catch hitbox, the ×1.8 permanent effect and stacking (F7 AC7), the HUD
   readout and on-catch feedback (F7 AC10), and F11 rules are unchanged.
   Only the draw calls inside the `PERMANENT_MULTIPLIER` branch of
   `drawPowerUp` change. The existing gameplay and power-up test suites pass
   without edits, except any test or visual snapshot that asserts the old "x"
   glyph, which is updated to the new one.
9. **Old token gone from all shipped art.** No website build, Android build,
   store screenshot or feature graphic produced after this change shows the
   old ringed "x". Store screenshot 4 ("Power-up catch moment",
   `docs/mobile/ux/store-assets-spec.md`) and the feature graphic are captured
   only from a build that contains the new glyph. The Android power-up
   evidence screenshots (`m2_7_lowend_powerups_*`) are re-captured with the
   new glyph for mobile-ui-ux-designer's next round.
10. **Traceability.** The `PERMANENT_MULTIPLIER` branch in
    `src/render/shapes.ts` carries a comment citing "PRD addendum v5 F23" and
    "review-v2 V2-M3". The new test file or test case cites F23 AC1-AC6.

---

## Cross-platform consistency (F23 ↔ `docs/mobile/PRD-mobile.md`)

| F23 AC | Android counterpart | Owner of the mobile side |
|---|---|---|
| AC1, AC7 | **M9.6 item 3** ("No X-Men imagery or iconography: no 'X' emblem"). F23 is how the in-app art meets it; M9.6 item 4 ("Any hit is a FAIL") is the mobile gate that re-checks it. | mobile-ui-ux-designer (next round), mobile-security-compliance-reviewer (closes V2-M3 / C7) |
| AC6 | UC4 row: "power-up icons must stay distinguishable at phone scale (F11 AC8)"; M2 phone-scale checks on the low-end profile | mobile-junior-tester / mobile-lead-tester (device matrix captures) |
| AC9 | `store-assets-spec.md` screenshot 4 and feature graphic; review-v2 C7 ("before screenshots are captured (step 15)") | mobile-release-engineer, mobile-ui-ux-designer |
| AC2-AC5, AC8 | No mobile-specific text needed: the Android app draws the same `drawPowerUp` from the shared `src/`. After the change, rebuild and `npx cap sync android`; never hand-edit the copied web assets. | mobile-junior-developer |

mobile-product-manager may add a one-line dated note to PRD-mobile M9.6 that
the ringed-"x" hit is resolved by F23. No other PRD-mobile text describes the
glyph, so no other mobile AC changes.

---

## Out of Scope (v5 — v1-v4 lists still hold)

- Changing the other three glyphs, the ring, token colors or token size.
- Changing any power-up rule, the HUD readout wording, or the "×" character in
  HUD text.
- A new icon, splash or logo (they are only re-checked under AC7).

---

## Open Questions v5 — for owner decision

None. The change stays inside the owner's existing IP rule (NFR-10, decided as
a hard requirement in v1 Q4 and tightened in v4 F22), changes no game rule,
and has no cost beyond one draw branch, one unit test and screenshot
re-capture. The owner is informed, not asked.

---

## Pipeline impact (both platforms, per `.claude/CLAUDE.md` §One codebase)

F23 is a shared art change, so before **either** version ships it must pass:
- **Website:** code-reviewer loop, test-writer / test-validator (AC1-AC4 or
  AC5, AC6(a), AC8), ui-ux-designer round 2 (AC6(b), AC7),
  security-compliance-reviewer pass 2 (AC7, NFR-10), docs-writer only if the
  glossary or README describes power-up icons, UAT (product-manager: the
  multiplier token is identifiable while falling), then deploy + smoke.
- **Android:** steps 7-12 for the changed file (mobile-junior-developer →
  mobile-lead-developer, mobile-junior-tester → mobile-lead-tester including
  re-captured `m2_7_lowend_powerups_*`, mobile-ui-ux-designer next round,
  mobile-security-compliance-reviewer closing V2-M3 / C7), mobile UAT, and
  store capture per AC9.
- `.github/workflows/deploy-pages.yml` remains the single CI check; the F23
  unit test runs there for both platforms.
- No ADR is needed: one branch of an existing draw function changes.

---

## Traceability check (v5)

F23 traces to UC4 / P4, NFR-9(a), NFR-10 / F9 AC4 / v4 F22 AC8, and answers
`docs/mobile/security/review-v2.md` V2-M3 (C7) and
`docs/mobile/ux/design-review-round5.md`. Each amended text (F7 types list,
v2 F11 AC8, v4 F22 AC8, NFR-10 row) is quoted next to its replacement. The
Android side maps to PRD-mobile M9.6 items 3-4 and the UC4 phone-scale row,
cross-referenced, not edited. `docs/PRD.md` and addenda v2-v4 are left
unedited, and this addendum is authoritative where they differ.
