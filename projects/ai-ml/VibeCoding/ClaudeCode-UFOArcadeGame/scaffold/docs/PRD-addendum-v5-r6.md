# Product Requirements Document — Addendum v5, Revision r6

**Product:** Shield vs Robots (website and Android app; one shared drawing)
**Revises:** `docs/PRD-addendum-v5.md` F23 (r5). That file is not edited by
this revision. For the Speed token, this file is the live criterion.
**Date:** 2026-10-05
**Author:** mobile-product-manager
**Status:** F23 r6 — DECIDED by the owner. Art change only. No game rule,
number, timing or text changes.

## Summary

The Speed power-up token ("3× Speed") is now drawn as a horizontal double
arrow "<-->" instead of a rabbit. The fist, the circle and the capital X
are unchanged.

| Power-up | Before (r5) | r6 |
|---|---|---|
| `HIT_POWER` ("5× Hit Power") | Fist, filled (r5 AC4.1) | **Unchanged** |
| `SPEED` ("3× Speed") | Rabbit, filled silhouette (r3-r5 AC4.2) | **Double arrow "<-->"**, stroked (r6 AC4.2) |
| `SHIELD` | Small circle, stroked (r3 AC4.3) | **Unchanged** |
| `PERMANENT_MULTIPLIER` | Capital X, stroked (r3 AC4.4; owner-accepted risk) | **Unchanged** |

## The owner's decision

The rabbit failed the Android design gate on the small reference phone
(`docs/mobile/ux/design-review-round9.md`: about 15 pixels wide, reads as a
squiggle). Under r5 no further redraw was allowed, and question **Q-v5-2**
went to the owner with three options: the arrow, keep the rabbit, or bigger
tokens. On 2026-10-05 at 17:25:24 UTC the owner (Aaron) answered in the
project thread. The main session relayed his words verbatim to
mobile-product-manager, which cannot see the thread:

> "Yes, I want to replace the rabbit with the arros."

"arros" is his typo for "arrows": the "<-->" double arrow he first offered
on 2026-09-30. **Q-v5-2 is answered. No question is open.**

## What r6 supersedes

- **Superseded:** the rabbit criteria, that is AC4.2 as written in r3, r4
  and r5 of `docs/PRD-addendum-v5.md` (r5: items (a), (b)1-7, (c)1-6 and
  (d), with their notes), and every place in F23 that groups `SPEED` with
  the filled glyphs: AC1(a) "and `SPEED`", AC3(a) and AC3(d) "filled
  glyphs (`HIT_POWER`, `SPEED`)", the `SPEED` row of the AC6(a) table, the
  rabbit pass test in AC6(b), and "Speed (rabbit)" in AC9. That text is
  kept in the v5 file as the record.
- **Also superseded:** r5's Out of Scope bullet "Replacing the rabbit with
  '<-->'". The owner chose it, so it is in scope.
- **Not the source:** r2 of v5 first named a "<-->" glyph, but its full
  geometry was never committed. r6 AC4.2 below is written from the glyph
  as implemented, and is the only live text.

## What r6 does not change (binding)

- The fist (AC4.1 r5), the circle (AC4.3) and the capital X (AC4.4), with
  every limit r5 lists.
- The ring, the disc, the colours, `POWERUP_RADIUS` = 12 and the catch
  hitbox. "Bigger tokens" was not chosen.
- Every power-up rule: Speed's effect, duration and drop rule, the HUD
  readout "3x Speed", all text.
- AC2, AC5 (all four shapes are the owner's choice), AC7 (only the
  Multiplier token builds an X) and the owner-accepted X risk.

## Terminology

As in `docs/PRD-addendum-v5.md` §Terminology: r is the token radius; +y is
down; a **segment** is one straight stroke between two recorded points;
**horizontal** means |dy| ≤ 0.02r, **vertical** |dx| ≤ 0.02r, **diagonal**
neither; **crossing** means two segments meeting at a point that is not a
shared endpoint of both. New in r6:
- **shaft:** the arrow's horizontal line.
- **head:** the open "<" or ">" at one end of the shaft, made of two
  **wings** (diagonal segments) that meet at the **tip**.

## Features

### F23 r6 — Power-up glyphs: fist, double arrow, circle, capital X

Description: as F23 in `docs/PRD-addendum-v5.md`, with the Speed bullet
replaced by: **3× Speed — a double arrow "<-->"**: one horizontal amber
line through the middle of the token with an open arrowhead at each end,
stroked at 2px in the same amber as the X. From r6 only the fist is filled.

Acceptance criteria. Only the items r6 changes are listed; all others
stand as in v5 r5. Every criterion holds at r = 12 and r = 20.

**AC1(e) (new) — the arrow has no crossing strokes and no "+".**
1. The glyph is straight segments only: no arc, no curve, no closed
   subpath.
2. A wing touches the shaft only at the shaft's own end point. The two
   wings of a head meet only at their shared tip.
3. No horizontal segment and vertical segment cross in their interiors
   (the existing AC1(d) check, which runs on all four glyphs). The arrow
   has no vertical segment at all.
4. Nothing crosses at the token centre: the shaft is the only segment
   that passes through it. No wing of the left head crosses a wing of the
   right head.

AC1(a) (one closed simple outline) now applies to `HIT_POWER` only.

**AC3 (changed) — style and bound.** `SPEED` moves to the stroked group.
- (a) Only `HIT_POWER` is drawn with a `fill()`. The `SPEED` glyph has no
  `fill()`.
- (b) `SPEED`, `SHIELD` and `PERMANENT_MULTIPLIER` are each drawn with
  exactly one `stroke()` and no other paint call, in
  `LEVEL_INTRO_TEXT_COLOR` (amber, `#ffd873`) at `lineWidth` 2.
- (d) Every recorded point of the `SPEED` glyph lies within ±0.45r of the
  token centre on both axes (the stroked-glyph bound). The larger filled
  bound (±0.65r, 0.75r) applies to `HIT_POWER` only.

**AC4.2 (replaced) — `SPEED` is a double arrow "<-->".**

- (a) **Five segments, stroke only.** The glyph is exactly 5 straight
  segments in 3 open subpaths (the shaft; the left head; the right head),
  painted by one `stroke()` at 2px amber (AC3(b)). No fill, arc or curve.
- (b) **Shaft.** One horizontal segment at y = 0, through the token
  centre, from x = −L to x = +L with **L = 0.45r** (allowed range 0.40r to
  0.45r).
- (c) **Heads.** Each head is two wings that meet at a tip. The tips are
  the shaft's two ends, (−L, 0) and (+L, 0). Each head is open: no segment
  joins its two wing ends, so it reads "<" and ">", not a triangle.
- (d) **Head size.** For each head, the two wing ends share the same x.
  Head **length** (horizontal distance from tip to wing ends) is between
  **0.20r and 0.35r**. Head **height** (vertical distance between the two
  wing ends) is between **0.50r and 0.90r**, that is each wing end is
  0.25r to 0.45r above or below the shaft.
- (e) **Shaft visible between the heads.** Each wing end is more than
  **0.10r** from the vertical centre line (|x| > 0.10r) and inside the tip
  (|x| < L). So the two heads' inner ends are more than 0.20r apart and
  the glyph reads "<-->", not "<>".
- (f) **Each head on its own side.** The left head's wing ends have
  x < 0 and the right head's have x > 0. No wing comes within **0.25r** of
  the token centre.
- (g) **Mirror symmetry.** The glyph is its own mirror image left to
  right (the right head is the left head with x negated) and top to
  bottom (each head's lower wing is its upper wing with y negated).
- (h) **Not a "+" and not an "X".** As AC1(e): no vertical segment, no
  horizontal segment other than the shaft, no crossing at the centre.
- (i) **Bound.** Every point within ±0.45r on both axes (AC3(d)).

*As implemented (`src/render/shapes.ts`, `drawDoubleArrowGlyph`), for
reference:* shaft from (−0.45r, 0) to (+0.45r, 0); wing ends at
(±0.18r, −0.30r) and (±0.18r, +0.30r); tips at (±0.45r, 0). So L = 0.45r,
head length 0.27r, head height 0.60r, each wing about 0.40r long and about
48° off the shaft, inner ends 0.36r apart, nearest wing point about 0.33r
from the centre. At r = 12 the shaft is 10.8 px long and each head is 7.2
px tall; at the in-play size on a phone (about 26 px token, r = 13) 11.7 px
and 7.8 px. These exact values are not the criterion; the ranges in
(a)-(i) are. A designer may retune inside the ranges without a new
revision (AC5); note that the current tests pin L at exactly 0.45r (see
Test coverage).

**AC5 (note).** All four shapes remain the owner's choice: fist, circle
and X from 2026-09-30, the double arrow from 2026-10-05.

**AC6(a) (row replaced) — signature.** The `SPEED` row of the table
becomes:

| Type | Glyph `fill()` | Glyph `stroke()` only | Primitive | Distinguishing feature |
|---|---|---|---|---|
| `SPEED` (double arrow) | 0 | yes, exactly 1 | exactly 5 line segments in 3 open subpaths; no arc | 1 horizontal segment through the centre, 4 diagonals, no crossing |

The other three rows are unchanged. Each glyph's recorded path matches its
own signature and none of the other three. The arrow differs from the X
(2 segments in 2 subpaths, crossing at the centre), from the circle (one
arc, no segments) and from the fist (one fill, a closed outline).

**AC6(b) (evidence replaced) — visual check at the size a player sees.**
The r5 method is unchanged: each reviewer looks at the unmagnified crops,
is not told the types, and writes down what each token is. Evidence for r6:

| # | File (in `docs/mobile/tests/screenshots/`) | What it is |
|---|---|---|
| 1 | `f23_tokens_13dp_at_2x_r6.png` | All four tokens at in-play phone size, colour |
| 2 | `f23_tokens_13dp_at_2x_gray_r6.png` | The same in grayscale |
| 3 | `f23_tokens_24px_r6.png` | All four tokens at 24 px, colour |
| 4 | `f23_tokens_24px_gray_r6.png` | The same in grayscale |
| 5 | `f23_tokens_magnified_8x_r6.png` | 8× enlargement, for orientation only; not used for the judgment |
| 6 | An Android emulator capture with the Speed token on screen during play, taken at UAT round 3 (step 14) on the 640 × 360 dp low-end profile, where the rabbit failed. A Pixel 7 profile capture is added if it can be taken. File names are recorded in the UAT round 3 results. | What a player really sees |

*Pass test.* The Speed token passes only if the reviewer would write
"arrow", "double arrow", "left-right arrow" or the like: the mobile
reviewer from file 2 and from file 6, the website reviewer from file 4.
The reviewer also records that it does not read as an "X", a "+", a plain
dash or an "H", that both arrowheads can be seen, and that the fist, the
circle and the X still read correctly next to it.
*If the arrow fails:* one retune inside the AC4.2 ranges may be requested
(AC5). A second fail comes back to product-manager /
mobile-product-manager. No other shape is tried without the owner.
*State of the evidence on 2026-10-05:* files 1-5 are present in the folder
(uncommitted). mobile-lead-tester confirms they were rendered from the
current `shapes.ts`. File 6 does not exist yet.

**AC8 (changed).** r6 changes only the glyph draw calls of the `SPEED`
branch of `drawPowerUp` and their tests. The rabbit drawing code is
deleted, not left unused. Nothing else in the token changes.

**AC9 (wording).** Where v5 says "Speed (rabbit)" or "the rabbit", read
"Speed (double arrow)". No website or Android build made after r6 shows
the rabbit.

**AC10 (changed).** The `SPEED` branch comment in `drawPowerUp` cites "PRD
addendum v5 F23 r6 AC4.2" and the owner decision of 2026-10-05 (Q-v5-2).
The arrow tests cite F23 r6 AC1(e), AC3, AC4.2 and AC6(a).

## Test coverage (read from `src/render/powerUpGlyphs.test.ts`, working tree of 2026-10-05)

The tests were read, not run, for this revision. All cases run at r = 12
and r = 20.

| Criterion | Asserted by the existing tests? | Where |
|---|---|---|
| AC1(e)1 straight segments only | Yes: subpath point counts are exactly [2, 3, 3] and 5 segments, which a curve would break; signature has 0 arcs | "SPEED is one shaft and two open arrowheads…"; `signature` |
| AC1(e)2 wings touch the shaft only at its ends; wings of a head meet at the tip | Yes | same test |
| AC1(e)3 no "+" | Yes | "has no horizontal and vertical segment crossing…" |
| AC1(e)4 no wing of one head crosses a wing of the other | **No — gap G1** | |
| AC3(a), (b) one stroke, no fill, width 2, amber | Yes | "SPEED is stroke-only, width 2" |
| AC3(d), AC4.2(i) within ±0.45r | Yes | "keeps every point within +-0.45r" |
| AC4.2(a) 5 segments, 3 open subpaths | Yes | `signature`; AC1 test |
| AC4.2(b) shaft at y = 0 from −L to +L | Yes, and stricter: L must equal 0.45r exactly | "has a horizontal shaft through the center…" |
| AC4.2(c) tips at the shaft ends; heads open | Yes (tips exactly (±0.45r, 0); subpaths not closed) | "has an arrowhead tip at each shaft end…"; `signature` |
| AC4.2(d) wing ends share x; length ≥ 0.20r; height ≥ 0.50r | Yes | "has heads at least 0.5r tall and 0.2r long…" |
| AC4.2(d) upper limits (length ≤ 0.35r, height ≤ 0.90r) | Indirectly: \|wing x\| > 0.10r with the tip at 0.45r gives length < 0.35r **only if the wing is on its head's own side (G2)**; the ±0.45r bound gives height ≤ 0.90r | "keeps the wing vertices clear of the shaft…"; bound test |
| AC4.2(e) wing ends 0.10r < \|x\| < L | Yes | "keeps the wing vertices clear of the shaft…" |
| AC4.2(f) each head on its own side (sign of wing x) | **No — gap G2** | |
| AC4.2(f) no wing within 0.25r of the centre | **No — gap G3** | |
| AC4.2(g) mirror symmetry, both axes | Yes | tip/mirror test; head test |
| AC4.2(h) no vertical segment; no second horizontal | Not asserted directly. It follows from asserted facts (length ≥ 0.20r and half-height ≥ 0.25r make every wing diagonal). **Gap G4** (direct assertion) | |
| AC6(a) own signature only | Yes | "each glyph matches only its own signature" |
| AC6(b) visual | Manual. Not automated. | `docs/mobile/tests/manual-only-criteria.md` |

**Test gaps for mobile-junior-tester (and the website test-writer).** The
implemented glyph meets every one of these by its coordinates; the tests
do not yet prove it.
- **G1.** Pairwise check over all 5 segments: no two cross, including
  left-head wings against right-head wings.
- **G2.** Left head wing ends have x < 0, right head wing ends have
  x > 0. Without this, a glyph whose heads reach across the centre and
  cross each other would pass today's tests.
- **G3.** Distance from (0, 0) to each of the 4 wing segments ≥ 0.25r.
- **G4.** Direction check: exactly 1 horizontal segment, 0 vertical, 4
  diagonal (per Terminology).
- **G5 (note, not a gap in coverage).** The shaft test pins L = 0.45r and
  the tips exactly. A retune inside AC4.2(b)'s range would need that
  assertion loosened to the range.

**Comment follow-ups (AC10), found while reading the code.**
- `src/render/shapes.ts`: the `SPEED` branch comment and the
  `drawDoubleArrowGlyph` doc comment cite "F23 r2 AC4.2". They should cite
  "F23 r6 AC4.2" (mobile-junior-developer / code-implementer).
- `src/render/powerUpGlyphs.test.ts`: the file header and the AC4.2
  `describe` title cite "r2's AC4.2, restored". They should cite r6
  (mobile-junior-tester / test-writer).
- `docs/mobile/tests/manual-only-criteria.md` lists "AC4.2(d) (the rabbit
  is original art…)". That row no longer has a subject
  (mobile-junior-tester).

## Cross-platform consistency

The drawing is shared (`.claude/CLAUDE.md` §One codebase). There is one
`drawPowerUp` for the website and the Android app, and one test file. The
Android record of the decision is `docs/mobile/PRD-mobile-amendment-v2.0.md`
§2. No mobile acceptance criterion changes; M2.7 is re-judged on the arrow.

By a separate owner decision of the same day (same amendment, §1), the
Android app is not submitted to Google Play. The store-screenshot parts of
AC9 therefore have no Android use for now. They stay as written. The
website is not affected by that decision.

## Out of Scope (r6)

- Enlarging the token or changing the catch hitbox (not chosen).
- Any Speed shape other than the AC4.2 r6 double arrow.
- Any change to the fist, the circle, the X, the ring or the colours.
- Any game-rule, text or HUD change.

## Open Questions

None. Q-v5-2 is answered (above).

## Pipeline impact (both platforms)

The arrow and its tests are in the working tree, uncommitted. The gates
still run for the shared drawing: code review on both teams (code-reviewer,
mobile-lead-developer); tests closed against the gaps above and run
(test-validator, mobile-lead-tester), including confirmation of evidence
files 1-5; design review, unprimed (ui-ux-designer; mobile-ui-ux-designer
round 10); one look at the new render by the two security reviewers (a
plain double arrow is a generic symbol, but nobody in this pipeline clears
a mark by assumption). Then website UAT, deploy and smoke test. On Android,
UAT round 3 is the last gate and supplies evidence file 6.

## Sources

- Owner message, 2026-10-05 17:25:24 UTC, relayed verbatim by the main
  session → the decision, AC4.2, AC5, Q-v5-2.
- `docs/PRD-addendum-v5.md` r1-r5 → F23 AC1-AC10, Terminology, the rabbit
  text superseded here, the r5 rule that a further rabbit failure goes to
  the owner as Q-v5-2.
- `docs/mobile/ux/design-review-round9.md` → the rabbit's FAIL on the
  low-end profile and the options.
- `docs/mobile/tests/uat-results-round2.md` (Q2) → the question as put to
  the owner.
- `src/render/shapes.ts` (`drawPowerUp`, `drawDoubleArrowGlyph`) → the
  implemented geometry that AC4.2 is written around.
- `src/render/powerUpGlyphs.test.ts` → the Test coverage table and gaps.
- `docs/mobile/tests/screenshots/f23_tokens_*_r6.png` → AC6(b) evidence
  files 1-5.
- `docs/mobile/PRD-mobile-amendment-v2.0.md` → the Android record (§2) and
  the scope decision (§1).
