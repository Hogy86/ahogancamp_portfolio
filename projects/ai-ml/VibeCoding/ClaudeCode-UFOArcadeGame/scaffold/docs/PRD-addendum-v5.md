# Product Requirements Document — Addendum v5

**Product:** Shield vs Robots
**Stage:** 2 — Product Manager (PRD addendum, shared art change)
**Date:** 2026-09-29 (r1 2026-09-29, r2 2026-09-30, r3 2026-09-30, r4 2026-09-30, r5 2026-09-30)
**Author:** product-manager subagent (r5 written by mobile-product-manager)
**Status:** v5 r5 — DECIDED in scope. r3 carries the owner's final glyph
choices and one owner-accepted IP risk (2026-09-30, below). The change is art
only. No game rule, number, timing or text changes. The one change to the IP
rule (NFR-10 / F9 AC4, tightened by v4 F22 AC8) is a narrow, owner-accepted
exception for the Permanent Multiplier token (§r3 below, F22 AC8(c)).
*(Status updated 2026-09-30, r4: Q-v5-1 answered by
`docs/mobile/security/review-v2-addendum4.md`; the circle is kept. No glyph,
geometry or test bound changes, so "F23 r3" stays the glyph specification
that code, tests and other docs cite. See §Revision r4.)*
*(Status updated 2026-09-30, r5: **F23 r5 is now the glyph specification**
for the two filled glyphs (fist and rabbit): a larger bound (AC3(d)), new
rabbit proportions (AC4.2), a proportionally larger fist (AC4.1) and the
review evidence (AC6(b)). The circle, the capital X, the ring, the colours
and every owner choice are unchanged, so "F23 r3" citations for the circle
and the X stay valid. The status line above read "v5 r3" until r5. No owner
decision is needed for r5. See §Revision r5.)*

**Revision 2026-09-29 (r1)** — fixes `docs/mobile/reviews/code-review-round16.md`
**D6** (the addendum contradicted itself). The F11 AC8 amendment required
"each glyph" to meet F23 AC1-AC6, but AC3 bounded every glyph point to
±0.45r while the existing `HIT_POWER`, `SPEED` and `SHIELD` glyphs reach
±0.5r (`src/render/shapes.ts` ~301-326) and Out of Scope forbade changing
them. r1 limited AC1 and AC3 to the `PERMANENT_MULTIPLIER` glyph. No scope,
behavior or owner-facing change.

**Revision 2026-09-30 (r2) — owner instruction: redraw all four glyphs.**
(Superseded by r3; kept for the audit trail.)
The owner (Aaron) wrote in the project thread on 2026-09-30 at 19:48 UTC,
about the power-up token art shared by the website and the Android app:

> "Make the picture of a powerup look like a fist or an up arrow. Make speed
> increase look like a rabbit or like "<-->". Make a shield look like a
> circle shape or a wall "---"."

The owner offered two options per power-up. The main session took the
simplest option from each pair, because each glyph must stay legible in 2px
vector strokes at 24px diameter and distinct from the other three:

| Power-up | Chosen (r2) | Not chosen | Why not chosen (one line) |
|---|---|---|---|
| `HIT_POWER` ("5× Hit Power") | **Up arrow** | Fist | A fist needs curves and finger detail that blur into a blob at 24px in 2px strokes. |
| `SPEED` ("3× Speed") | **Horizontal double-headed arrow "<-->"** | Rabbit | A rabbit silhouette is illegible at 24px, and its two ears read as a "V" chevron. |
| `SHIELD` ("Indestructible Shield") | **Wall: one thick horizontal bar ("---")** | Circle | A circle inside the shared circular ring reads as a double ring or target, the weakest shape difference of the four. |
| `PERMANENT_MULTIPLIER` | **Three ascending vertical bars** (unchanged from r1) | — | The owner did not mention it; the r1 glyph stays. |

The owner can swap any row to its alternate. That would be a new revision
(r3) of F23 AC4, re-run through both pipelines' gates.

r2 changes, old text quoted next to new:

| r1 text (quoted) | r2 text |
|---|---|
| Title: "F23 — Permanent Multiplier power-up glyph: no "X" emblem" | "F23 — Power-up glyphs: up arrow, double arrow, wall, rising bars; no "X" emblem" |
| AC1: "**No crossing strokes (`PERMANENT_MULTIPLIER` glyph).** In the `PERMANENT_MULTIPLIER` glyph, no two strokes cross …" | AC1 applies to **all four** glyphs, and also bans "+"/"X" shapes built from arms that meet at a shared point. |
| AC3: "… Every point of the `PERMANENT_MULTIPLIER` glyph lies within ±0.45 × radius … This bound does not apply to the `HIT_POWER`, `SPEED` and `SHIELD` glyphs, which reach ±0.5r today and are out of scope." | AC3's ±0.45r bound applies to **all four** glyphs. The r1 exception is gone because the other three are now redrawn. |
| AC4: "Unless ui-ux-designer or mobile-ui-ux-designer records an equivalent … the glyph is **three vertical bars**" | AC4 gives exact geometry for all four glyphs: AC4.1 up arrow, AC4.2 double arrow, AC4.3 wall, AC4.4 bars (the r1 bar geometry, unchanged). |
| AC6(a): "… the multiplier glyph is the only one made of three vertical segments" | AC6(a) checks a stroke-count-and-direction signature per glyph (AC6 table). Each type matches only its own signature. |
| AC8: "Only the draw calls inside the `PERMANENT_MULTIPLIER` branch of `drawPowerUp` change." | "Only the glyph draw calls inside the four `switch` branches of `drawPowerUp` change." |
| Out of Scope: "Changing the other three glyphs, the ring, token colors or token size." | "Changing the ring, token colors or token size." |
| F11 AC8 amendment: "The ±0.45r point bound (F23 AC3) and the shape rules (F23 AC4/AC5) apply to the `PERMANENT_MULTIPLIER` glyph only …" | The bound and shape rules apply to all four glyphs. |

**Revision 2026-09-30 (r3) — owner's final choices: fist, rabbit, circle,
capital X.** The owner (Aaron) wrote directly to the main session in the
project thread on 2026-09-30 (UTC). All three messages, verbatim:

- 19:48 UTC:
  > "Make the picture of a powerup look like a fist or an up arrow. Make
  > speed increase look like a rabbit or like "<-->". Make a shield look like
  > a circle shape or a wall "---"."
- 19:52 UTC (after r2's choices):
  > "Do a fist, rabbit and circle. The Multiplier should be a capital X."
- 19:53 UTC, after the main session told him that a bold X inside the round
  token is essentially the X-Men logo shape, which is why
  `docs/mobile/security/review-v2.md` V2-M3 asked to remove the old "x":
  > "I'll take the risk"

r3 therefore sets:

| Power-up | r2 (superseded) | r3 (owner's choice) |
|---|---|---|
| `HIT_POWER` ("5× Hit Power") | Up arrow | **Fist**: one filled amber shape with 3-4 knuckle bumps |
| `SPEED` ("3× Speed") | Double-headed arrow "<-->" | **Rabbit**: one filled side-view silhouette with two ears |
| `SHIELD` ("Indestructible Shield") | Wall bar "---" | **Circle**: a stroked outline, radius about 0.25r-0.35r |
| `PERMANENT_MULTIPLIER` | Three ascending vertical bars | **Capital X**: two diagonal strokes. The current code, diagonals between (±0.35r, ±0.35r), already meets this. |

r2's legibility concerns (fist and rabbit blur at 24px; circle-in-ring reads
as a target) are not dropped. They become testable criteria: filled shapes
instead of 2px outlines for the fist and rabbit, a radius band for the circle
that keeps a wide gap to the ring, and a grayscale 24px check of all four
(AC4, AC6).

**Owner-accepted risk (r3), recorded against review-v2 V2-M3.** The capital X
inside the round amber ring is the basic shape of the X-Men emblem. V2-M3
(MEDIUM) and design-review-round5 ruling (a) asked for it to be replaced. The
owner was told this and chose to keep an X ("I'll take the risk", 19:53 UTC).
The risk is:
- **What:** Play Store IP complaint or rejection, or a trademark complaint
  against the website, citing the X-in-circle motif. The motif is small (24px),
  one amber color, thin 2px strokes, and appears only on one falling token.
- **Scope of the exception (narrow):** the "X" exception covers **only** the
  `PERMANENT_MULTIPLIER` power-up token glyph. The app icon, adaptive icon,
  splash, title/logo lockup and feature graphic stay X-free. Store screenshot
  4 ("Power-up catch moment") shows a power-up other than the Multiplier
  (AC9). No other X mark or X badge is allowed anywhere (F22 AC8(c) as
  amended below).
- **Who records it:**
  - mobile-product-manager records the owner's acceptance under condition
    **C7** in `docs/mobile/PRD-mobile.md` **M9.6** (a dated note on item 3
    and item 4 "Any hit is a FAIL": the Multiplier token X is an
    owner-accepted exception, not a hit).
  - mobile-security-compliance-reviewer closes **V2-M3** as
    **risk-accepted** (not fixed) in the next review-v2 addendum.
    security-compliance-reviewer records the same disposition in the website
    pass 2 against NFR-10.
- **Reversal:** if a complaint arrives or the owner changes his mind, the
  fallback is r2's AC4.4 bars (already specified above), as a new revision.

r3 changes, old r2 text quoted next to new:

| Where | r2 text (quoted) | r3 text |
|---|---|---|
| Title | "F23 — Power-up glyphs: up arrow, double arrow, wall, rising bars; no "X" emblem" | "F23 — Power-up glyphs: fist, rabbit, circle, capital X" |
| Description | "**5× Hit Power** — an **up arrow** … **3× Speed** — a **horizontal double-headed arrow "<-->"** … **Indestructible Shield** — a **wall** … **Permanent Hit-Power Multiplier** — **three vertical bars** …" | Fist, rabbit, circle, capital X (F23 Description). |
| Description | "All glyphs are stroked in the same amber at the same 2px weight. No glyph has crossing strokes, and none forms an "X" or "+"." | Fist and rabbit are filled amber; circle and X are stroked amber at 2px. Only the X's own two strokes cross. |
| AC1 | "**No crossing strokes, no "X" or "+" (all four glyphs).** … (c) the `HIT_POWER` glyph has no horizontal segment, and the `SPEED` glyph has no vertical segment …" | AC1: no **unintended** crossings. Fist and rabbit outlines are simple closed curves; the circle is one arc; the X's two strokes cross exactly once, at the center, and nothing else crosses. The "+" ban stays for all four. |
| AC3 | "Every glyph segment is stroked (not filled) … No new color and no glyph fill are introduced." | Fist and rabbit are filled in `LEVEL_INTRO_TEXT_COLOR`; circle and X are stroked in it at `lineWidth` 2. No new color. The ±0.45r bound stays for all four. |
| AC4 | "AC4.1 up arrow, AC4.2 double arrow, AC4.3 wall, AC4.4 bars" | AC4.1 fist, AC4.2 rabbit, AC4.3 circle, AC4.4 capital X. |
| AC5 | "… including the not-chosen alternates (fist, rabbit, circle), needs the owner's approval …" | All four shapes are the owner's choice; any change (including back to r2's arrow, "<-->", wall or bars) needs owner approval and a new revision. |
| AC6(a) table | Signatures by segment counts (3/5/4/3 segments). | Signatures by fill/stroke, primitive and outline features (AC6 table). |
| AC7 | "No player-visible art in the product shows an "X" inside or over a circle or ring: power-up tokens, HUD, title, icon …" | Same, **except** the `PERMANENT_MULTIPLIER` token (owner-accepted risk). |
| AC9 | "… shows the old ringed "x", chevron, speed lines or kite." | Old chevron, speed lines and kite gone. The Multiplier's current X is kept. Screenshot 4 does not show the Multiplier token. |
| F22 AC8(c) amendment | "No token, icon, HUD element, logo, splash or store asset shows an "X" emblem …" | Same rule, plus one named exception: the `PERMANENT_MULTIPLIER` token glyph (F23 AC4.4). |
| Cross-platform note | "… the ringed-"x" hit is resolved by F23 …" | The Multiplier X is an owner-accepted risk; mobile-product-manager records it under C7 in M9.6. |

**Revision 2026-09-30 (r4) — records review-v2 addendum 4; no glyph
change.** `docs/mobile/security/review-v2-addendum4.md` (2026-09-30) ruled on
the r3 glyphs. r4 writes three of its results into this addendum. It changes
no shape, radius band, colour, test bound or owner decision. The fist, the
rabbit, the circle and the capital X stay exactly as r3 specifies them.

| Where | r3 text (quoted) | r4 text |
|---|---|---|
| Open Question Q-v5-1 | "Q-v5-1 (new in r3, not blocking implementation) … This was not raised with the owner on 2026-09-30. Options: (a) … (b) … (c) …" | **Answered** by review-v2 addendum 4 §1.4: the circle is kept, on five binding limits; the wall bar (r2 AC4.3) is the fallback. The r3 question text is kept below the answer. |
| AC9 | "… never the Multiplier token (and, pending Q-v5-1, not the Shield token); the feature graphic shows no Multiplier token." | The Shield-token exclusion is **permanent** and covers every store asset (review-v2 addendum 4 §1.4 limit 3). No store asset shows the Multiplier token or the Shield token (addendum 4 A4-M1). |
| AC4.3 | "At r = 12 that is a 3-4.2px radius circle with a gap of at least 7.8px (0.65r) to the ring" | 7.8px is the centre-line distance. The visible dark gap between the two 2px strokes is at least about 5.8px (about 5.9px at the implemented 0.34r). Review-v2 addendum 4 A4-I2. |
| Cross-platform table, AC4.3 row | "See Q-v5-1." | "Q-v5-1 answered (r4)." |

**Revision 2026-09-30 (r5) — bigger filled glyphs and a re-proportioned
rabbit; the owner's four choices are unchanged.** Both design gates failed
the rabbit twice:
`docs/ux/design-review-v3-round1.md` and `-round2.md` (website) and
`docs/mobile/ux/design-review-round6.md` and `-round7.md` (Android). The fist,
the circle and the X passed and are not re-judged.

Why r3 could not pass, in plain terms:
- **Size (mobile round 7).** In play, the token is about 13 dp across (dp is
  Android's screen-size unit; on a "2x" phone 13 dp is about 26 pixels). The
  r3 glyph box of ±0.45r is then only about 10 pixels wide. A side-view rabbit
  with a head, two ears, a rump and legs does not fit in 10 pixels. Round 7
  ruled that another redraw at that size would fail again and asked for a
  larger glyph inside the same ring.
- **Composition (website round 2).** The ears stood over the middle of the
  back, straight and flat-topped, on a loaf-shaped body. They read as "two
  towers on a wall". The reviewer asked for ears attached to a round head at
  the head end, leaning back 15 to 25 degrees with rounded tips, a neck dip,
  a high rounded rump with lower shoulders, a tail bump and a notch under the
  belly.
- **A rule that fought the fix (r3 AC4.2(b)).** r3 said the two ear tips are
  "exactly 2 bumps with prominence of at least 0.2r" and "both lie in the same
  half … of the bounding box". Ears that lean back move their tips toward the
  middle of the box, and a high rump is itself a bump that can reach 0.2r. So
  the reviewers' required shape could break the r3 rule. r5 rewrites the rule
  (AC4.2(b), "Reconciliation" note) so the required shape is allowed and the
  tests can still tell ears from everything else.

The website reviewer wrote (round 2) that a larger glyph "is not needed". r5
still enlarges it, because the mobile reviewer measured the real in-play size
and the two fixes do not conflict: r5 applies the website reviewer's
composition changes at the mobile reviewer's larger size. Both reviewers
re-review (website v3 round 3, mobile round 8).

r5 changes, old r3/r4 text quoted next to new:

| Where | r3/r4 text (quoted) | r5 text |
|---|---|---|
| Header status | "**Status:** v5 r3 — DECIDED in scope." | "**Status:** v5 r5 — DECIDED in scope." plus the r5 status note. |
| AC3(d) | "Every recorded glyph point, including curve control points and the circle's extreme points, lies within ±0.45r of the token center on both axes, so each glyph, including its stroke, stays clear of the ring." | Circle and X: unchanged (±0.45r). Fist and rabbit: every recorded point within **±0.65r** on both axes, every flattened-outline point within **0.75r** of the center, and a visible dark gap of **at least 2.0 px** to the ring's inner edge at r = 12. |
| AC4.1 (fist) | "(a) Bounding box width between 0.6r and 0.9r, height between 0.5r and 0.9r …" / "(b) … 3 or 4 bumps … prominence between 0.04r and 0.15r, spaced at least 0.12r apart in x …" / "(c) … width measured at y = +0.3r is at least 0.6 × its width at y = 0 …" | The same fist scaled up in proportion: box **1.0r-1.3r** wide by **0.8r-1.2r** tall; 3 or 4 knuckle bumps, prominence **0.06r-0.22r**, at least **0.17r** apart; the no-forearm width is measured **0.12r above the lowest point** of the outline. |
| AC4.2 (rabbit) | "(a) Bounding box width between 0.6r and 0.9r, height between 0.5r and 0.9r …" / "(b) Ears: the flattened outline has **exactly 2 bumps** with prominence of at least 0.2r. They are the two highest points of the outline, both lie in the same half (left or right) of the bounding box (the head end), and both point up or up-and-back (no ear bent or folded down)." / "(c) Body: the part of the outline below the base of the ears is at least 1.3 × as wide as it is tall …" | New box (**1.1r-1.3r** by **0.9r-1.2r**, wider than tall) and numeric rules for the ears (on the head, leaning back 15°-25°, rounded tips, minimum widths and gap), the head lump and neck dip, the high rump, the tail bump, the underside notch and the four-leg crouch. The 1.3 × body rule is kept. (d) IP rules kept and two limits added. |
| AC6(a) table, fist row | "3-4 top bumps, prominence 0.04r-0.15r" | "3-4 top bumps, prominence 0.06r-0.22r, none ≥ 0.3r" |
| AC6(a) table, rabbit row | "exactly 2 top bumps, prominence ≥ 0.2r, one side" | "exactly 2 top bumps with prominence ≥ 0.3r (the ears), both rooted in the head half" |
| AC6(b) | "a capture of all four tokens side by side at r = 12 is attached … Capture it on the website at 1× and at the phone-emulation viewport, and a **grayscale** copy of each." | Named evidence set: unmagnified 1:1 crops of all four tokens at 13 dp on a 2x profile and at 24 px, each in colour and grayscale, plus one emulator capture; and the unprimed "rabbit or bunny" naming test. |
| F11 AC8 amendment | "… drawn only in `LEVEL_INTRO_TEXT_COLOR` within ±0.45r …" | "… within the F23 AC3(d) bounds …" |

**What r5 does not change (binding, from
`docs/mobile/security/review-v2-addendum4.md`):**
- The **capital X** stays two 2px amber strokes with a ≤ 0.4r (range
  0.3r-0.4r, 0.35r as built), inside ±0.45r, never touching the ring (AC4.4;
  addendum 4 §2.2 and A4-M1 limit 4).
- The **Shield circle** stays exactly one stroked circle, radius 0.25r-0.35r,
  inside ±0.45r, nothing inside it (AC4.3; addendum 4 §1.4 limits 1-2).
- The **rabbit IP bindings** of addendum 4 §1.3 stay: whole body, side view,
  never head-only, never upright, no eye cut-out, no clothing or accessories,
  amber only (AC4.2(d)).
- The owner's choices (fist, rabbit, circle, capital X), the ring, the disc,
  the colours, the token size (`POWERUP_RADIUS` = 12) and the catch hitbox.
- The store-asset rules (AC9) and the owner-accepted X risk (C7).

**New IP check owed.** Addendum 4 §1.3 says: "Any redraw outside the AC4
ranges needs a new F23 revision and a new IP check." r5 is that revision.
mobile-security-compliance-reviewer and security-compliance-reviewer check
the redrawn rabbit and fist renders by eye against AC4.2(d) and AC4.1 before
either version ships (see §Pipeline impact).

**Not an owner decision.** The owner chose a rabbit and the rabbit stays; r5
only makes it bigger inside the same ring and fixes its proportions. The
owner is told in one line in the next project-thread update. No question is
put to him.

**If the rabbit fails again (recorded now, asked later).** If mobile round 8
or website v3 round 3 still fails the rabbit on AC6(b), the pipeline does
**not** try another redraw. The fallback is the double arrow "<-->" (r2
AC4.2, already specified in the r2 record). That reverses an owner choice, so
it **needs the owner's approval**. product-manager / mobile-product-manager
put it to him **then**, with options and consequences (Job 0), and **not
before**. Until he answers, the rabbit stays in the spec and neither version
ships the new glyphs. Enlarging the whole token (design-review-round7 option
(a2)) changes the catch hitbox and is out of scope (§Out of Scope).

**What this addendum does.** It adds **F23**, which sets the icon ("glyph")
drawn inside each of the four power-up tokens. The shared amber ring and the
dark disc stay the same. Per the owner (r3), Hit Power becomes a fist, Speed a
rabbit, Shield a circle, and the Permanent Multiplier a capital X. The X is
kept against review-v2 V2-M3 as an owner-accepted risk.

This is a **shared game change**. The website and the Android app draw the
token from the same code (`src/render/shapes.ts` `drawPowerUp`), so it
applies to both. It must pass the gates of **both** pipelines
(`.claude/CLAUDE.md` §One codebase) before either version ships.

`docs/PRD.md` and addenda v2-v4 are **not edited**. Where this addendum
differs from them, this addendum wins. The old text is quoted next to the new
text below. `docs/mobile/PRD-mobile.md` is cross-referenced, not edited.

**Sources (upstream):**
- **Owner messages, 2026-09-30 19:48, 19:52 and 19:53 UTC** (quoted above):
  the source of all four r3 glyph choices and of the risk acceptance.
- `docs/mobile/security/review-v2.md` **V2-M3** (the ringed "x" is an
  unassessed hit against PRD-mobile M9.6 item 3, "no 'X' emblem"; fix (a),
  preferred: a shared glyph change routed through both pipelines) and
  condition **C7** ("the ringed "x" power-up glyph is ruled on under M9.6
  item 3"). r3 answers C7 with an owner ruling: risk accepted.
- `docs/mobile/ux/design-review-round5.md` — ruling (a): change the shared
  glyph. r3 overrides that ruling for the Multiplier by owner decision; its
  requirements 3-4 (distinguishable at 24px; both pipelines' gates) still
  apply.
- *(added r5)* `docs/mobile/ux/design-review-round6.md` (finding 1) and
  `docs/mobile/ux/design-review-round7.md` (FAIL, rabbit; required change
  (a): raise the filled-glyph bound to about ±0.65r; evidence list for round
  8; fallback (b) only after a further FAIL) → AC3(d), AC4.1, AC4.2, AC6(b).
- *(added r5)* `docs/ux/design-review-v3-round1.md` (Finding 1) and
  `docs/ux/design-review-v3-round2.md` (FAIL, rabbit; required changes 1-5:
  ears on the head, lean 15-25 degrees, rounded tips, head lump, neck dip,
  high rump, tail bump, underside notch) → AC4.2, AC6(b).
- *(added r5)* `docs/mobile/security/review-v2-addendum4.md` §1.3 (rabbit IP
  bindings; a redraw outside the AC4 ranges needs a new revision and IP
  check), §1.4 limits 1-2 (circle), §2.2 (X arms never reach the ring) → the
  limits r5 does not change.
- `docs/PRD.md` — **F7** (the four power-ups; AC7 permanent multiplier, AC10
  HUD readout), **NFR-9(a)** (not color-only), **NFR-10** and **F9 AC4**
  (original art, no trademark-adjacent motifs; hard requirement).
- `docs/PRD-addendum-v2.md` — **F11 AC8** (the four power-ups are visually
  distinguishable while still falling, by more than color).
- `docs/PRD-addendum-v4.md` — **F22 AC8** (IP rule kept and tightened),
  NFR-10 row of the F22 table.
- `docs/mobile/PRD-mobile.md` — **M9.6** item 2 ("no concentric-ring
  shield"), item 3 ("No X-Men imagery or iconography: no 'X' emblem …") and
  item 4 ("Any hit is a FAIL"); §0 rule 3 (shared changes go through both
  pipelines); the UC4 row ("power-up icons must stay distinguishable at phone
  scale (F11 AC8)").
- `docs/mobile/ux/store-assets-spec.md` screenshot 4 ("Power-up catch
  moment"; token rule V2-M3: "Use HIT_POWER, SPEED or SHIELD for the catch")
  and its 2026-09-29 change-log line.
- `docs/market/market-goals-and-use-cases.md` UC4 (catch power-ups), goal P4
  (catch rate).
- Existing implementation, read to ground the ACs (as of 2026-09-30; F23 r3
  is not yet implemented):
  - `src/render/shapes.ts` `drawPowerUp` (~280-344): every token is a dark
    filled disc `rgba(20, 20, 30, 0.85)` with a ring stroked in
    `LEVEL_INTRO_TEXT_COLOR` (`#ffd873`, `src/config/constants.ts`),
    `lineWidth = 2`. `fillStyle` and `strokeStyle` are both set to that amber
    before the `switch`. Current glyphs, all stroked in amber at 2px:
    `HIT_POWER` upward chevron (±0.5r), `SPEED` two horizontal speed lines,
    `SHIELD` kite (±0.5r), `PERMANENT_MULTIPLIER` "x" (two diagonals between
    (−0.35r, −0.35r)-(0.35r, 0.35r) and (0.35r, −0.35r)-(−0.35r, 0.35r)).
    The last one already meets AC4.4.
  - `src/config/constants.ts` `POWERUP_RADIUS = 12` (24px diameter in game
    units). The only caller is `CanvasRenderer.drawPowerUps`.
  - No test under `tests/` references glyph geometry or `drawPowerUp` today.

**Terminology (carried from v1-v4).** New in v5:
- **"token"**: the falling power-up as drawn: disc, ring and glyph.
- **"ring"**: the shared amber circle outline around every token.
- **"glyph"**: the icon drawn inside the ring, one per power-up type.
- **"segment"**: one straight stroke from a `moveTo`/`lineTo` point to the
  next `lineTo` (or `closePath`) point, as recorded from the 2D context.
- **"outline"** (r3): the closed path of a filled glyph, flattened to line
  segments (every curve sampled at 16 or more points, every arc at 32 or
  more).
- **"crossing strokes"**: two segments that intersect at a point that is not
  a shared endpoint of both. A "T" touch (one segment's end lands on the
  middle of another) counts as crossing.
- **"bump"** (r3): a local minimum of y (a high point, since +y is down) on a
  flattened outline. Its **prominence** is how far it rises above the lower
  of its two neighbouring local maxima of y.
- **"horizontal" / "vertical" / "diagonal" segment**: |dy| ≤ 0.02r /
  |dx| ≤ 0.02r / neither.
- **"upper envelope"** (r5, states what the tests already do): for each x,
  the highest point (smallest y) of a flattened outline. "Top bumps" are the
  peaks of the upper envelope. A top bump's prominence is its rise above the
  **higher** of the two envelope valleys next to it (or the outline's end).
- **"forward" / "back"** (r5, rabbit): toward the nose end / toward the tail
  end of the bounding box. The rabbit may face left or right.
- **"head half" / "tail half"** (r5): the half of the bounding-box width at
  the nose end / at the tail end.
- **"in-play size"** (r5): the size a token has on a phone during play, about
  13 dp across (about 26 px on a 2x screen). dp is Android's
  density-independent screen unit; "2x" means 2 physical pixels per dp.
- **r**: the token radius (`p.radius`, default `POWERUP_RADIUS` = 12).
  Coordinates are relative to the token center, +y down (canvas convention).

---

## Summary of the change → feature mapping

| # | Change (short) | Feature | Amends |
|---|---|---|---|
| 1 | Power-up glyphs redrawn: Hit Power a filled fist, Speed a filled side-view rabbit, Shield a stroked circle, Permanent Multiplier a capital X (current geometry kept; owner-accepted IP risk). Ring, disc, colors, size and behavior unchanged. | **F23** (r3; fist and rabbit bound and proportions per r5) | `docs/PRD.md` **F7** (power-up types list), **NFR-10**; `docs/PRD-addendum-v2.md` **F11 AC8**; `docs/PRD-addendum-v4.md` **F22 AC8** (adds item (c) with one exception). |

---

## Features (v5)

### F23 — Power-up glyphs: fist, rabbit, circle, capital X

Traces to: owner messages 2026-09-30 (19:48, 19:52, 19:53 UTC); UC4, goal
P4; NFR-9(a); NFR-10 / F9 AC4 / v4 F22 AC8 (IP avoidance);
`docs/mobile/security/review-v2.md` V2-M3 / C7 (risk-accepted);
`docs/mobile/ux/design-review-round5.md`; `docs/mobile/PRD-mobile.md` M9.6
items 2-4.

- Description: Every power-up token keeps the shared amber ring and dark
  disc. The glyph inside the ring is set per type:
  - **5× Hit Power** — a **fist**: one filled amber shape, knuckles on top
    (3-4 knuckle bumps). No forearm or wrist, so it reads as a punch, not a
    raised-arm symbol.
  - **3× Speed** — a **rabbit**: one filled amber side-view silhouette of a
    whole rabbit (body, head, two upright ears), crouched or mid-hop on four
    legs.
  - **Indestructible Shield** — a **circle**: one amber outline, stroked at
    2px, centered, radius about 0.25r-0.35r, so a clear dark gap separates it
    from the ring.
  - **Permanent Hit-Power Multiplier** — a **capital X**: two diagonal
    strokes crossing at the center, stroked in amber at 2px. The current code
    already draws this and stays as is.

  Fist and rabbit are filled because 2px outlines of them blur at 24px (r2).
  From r5 the two filled glyphs are drawn larger than the two stroked ones
  (AC3(d)), and the rabbit's ears sit on its head and lean back (AC4.2); the
  words "two upright ears" above mean "not folded or bent", not "vertical".
  Circle and X are stroked. The power-ups' behavior, drop rules, catch rules,
  HUD readout and on-catch feedback do not change.

**Supersedes / amends (quoted old text → v5 r3 text):**

Note: before v5 no PRD text described any glyph's shape. The chevron, speed
lines, kite and "x" were implementation choices made under F11 AC8. v5 makes
the shape rules explicit so they can be tested.

| Where | Old text (quoted) | v5 r3 text |
|---|---|---|
| `docs/PRD.md` F7, power-up types list | "**5× Hit Power** — hit power ×5 for 8 seconds (temporary)." / "**3× Speed** — player movement speed ×3 for 8 seconds (temporary)." / "**Indestructible Shield** — player is invulnerable for 8 seconds (temporary)." / "**Permanent Hit-Power Multiplier** — current hit power ×1.8, stacks, permanent for the rest of the run." | Effects unchanged. Added after the list: "Every token is the shared amber ring with a glyph: 5× Hit Power a filled fist, 3× Speed a filled side-view rabbit, Indestructible Shield a stroked circle, Permanent Hit-Power Multiplier a capital X (F23)." r2 text superseded: "… 5× Hit Power an up arrow, 3× Speed a horizontal double-headed arrow "<-->", Indestructible Shield a thick horizontal wall bar "---", Permanent Hit-Power Multiplier three ascending vertical bars. No glyph is an "x", "+" or any crossing-stroke shape (F23)." |
| `docs/PRD-addendum-v2.md` F11 AC8 | "each has a distinct icon/shape, differentiated by more than color alone (non-color-only per NFR-9)." | "each has a distinct icon/shape, differentiated by more than color alone (non-color-only per NFR-9), **and all four glyphs follow F23 AC1-AC4: no unintended crossing strokes and no "+" shape, drawn only in `LEVEL_INTRO_TEXT_COLOR` within the F23 AC3(d) bounds (r5; r3 text superseded: "within ±0.45r"), with the F23 AC4 shapes, and distinguishable at 24px diameter in grayscale (F23 AC6)**." r2 text superseded: "… no crossing strokes and no "X"/"+" shape, stroked in `LEVEL_INTRO_TEXT_COLOR` at `lineWidth` 2 within ±0.45r …". The rest of F11 AC8 (identify a drop's type while falling, before the catch) is unchanged. |
| `docs/PRD-addendum-v4.md` F22 AC8 | "(a) The word "Shield" is **never** styled as **S.H.I.E.L.D.** … (b) **No shield** anywhere in the product … uses a **red/white/blue star design** …" | Items (a) and (b) unchanged. **Added (c):** "No token, icon, HUD element, logo, splash or store asset shows an "X" emblem: two crossing diagonal strokes inside or over a circle or ring, or any X-shaped mark used as a badge. A plain "×" multiplication sign in running text (for example the HUD readout "Power ×3.24", F7 AC10) is text, not an emblem, and is allowed. **Single exception (owner-accepted risk, 2026-09-30, review-v2 V2-M3):** the `PERMANENT_MULTIPLIER` power-up token glyph is a capital X inside the shared ring (F23 AC4.4). The exception does not extend to the app icon, adaptive icon, splash, title/logo, feature graphic or store screenshot 4." r2 text superseded: item (c) without the exception sentence. |
| `docs/PRD.md` NFR-10 (as amended by v4 F22) | "ShieldMan/robots original designs only, plus F22 AC8-AC10." | "ShieldMan/robots original designs only, plus F22 AC8(a)-(c) (v5 r3, with the one owner-accepted Multiplier-token exception in (c)), AC9-AC10, and F23." Hard requirement, not contingent (unchanged). |

**Acceptance Criteria (website; Android equivalents in §Cross-platform
consistency).** All tests below run on the path recorded from `drawPowerUp`
by a recording 2D-context stub (or equivalent path capture) that records
`moveTo`, `lineTo`, `arc`, `ellipse`, `quadraticCurveTo`, `bezierCurveTo`,
`closePath`, `fill` and `stroke`, with the current `fillStyle`,
`strokeStyle` and `lineWidth`. The ring arc and disc fill are excluded from
glyph checks. Every test runs at r = 12 and at one other radius (for example
r = 20) so that the geometry is proven to scale with r.

1. **No unintended crossing strokes; no "+" (all four glyphs).**
   (a) `HIT_POWER` and `SPEED`: each glyph is one closed subpath whose
   flattened outline is a simple closed curve: no two outline segments cross
   (per Terminology) other than neighbours at their shared endpoint.
   (b) `SHIELD`: the glyph is exactly one full-circle `arc` (or `ellipse`
   with equal radii) and nothing else, so it has no crossings.
   (c) `PERMANENT_MULTIPLIER`: the glyph is exactly two segments, and they
   cross exactly once, at (0, 0) ± 0.05r. This is the only crossing allowed
   in any glyph.
   (d) No glyph contains a horizontal segment and a vertical segment that
   cross or meet at a shared midpoint, so no glyph forms a "+".
   *Test:* (a) pairwise segment check on each flattened outline; (b) and (c)
   exact call and intersection checks; (d) on all four.
   *r2 text superseded:* "(a) no two segments cross (per Terminology,
   including "T" touches); (b) no point is an endpoint of four or more
   segments …; (c) the `HIT_POWER` glyph has no horizontal segment, and the
   `SPEED` glyph has no vertical segment …"
2. **Ring and disc unchanged (shared ring kept).** Each token's disc and ring
   are drawn the same for all four types: same radius (`p.radius`, default
   `POWERUP_RADIUS` = 12), same fill `rgba(20, 20, 30, 0.85)`, ring stroked
   in `LEVEL_INTRO_TEXT_COLOR` (`#ffd873`) at `lineWidth` 2. *Test:* the
   recording stub shows identical arc/fill/stroke calls for all four types
   before the glyph calls. (Unchanged from r2.)
3. **Glyph style and bound (all four glyphs).**
   (a) `HIT_POWER` and `SPEED` are drawn with exactly one `fill()` each, in
   `LEVEL_INTRO_TEXT_COLOR`. An optional `stroke()` of the same path in the
   same color at `lineWidth` 2 is allowed.
   (b) `SHIELD` and `PERMANENT_MULTIPLIER` are drawn with `stroke()` only
   (no glyph `fill()`), in `LEVEL_INTRO_TEXT_COLOR` at `lineWidth` 2.
   (c) No new color is introduced (no glyph call uses any other
   `fillStyle`/`strokeStyle`), and no glyph has holes or interior cut-outs.
   (d) **Bound (r5).** The limit depends on the kind of glyph.
   - *Stroked glyphs (`SHIELD`, `PERMANENT_MULTIPLIER`) — unchanged.* Every
     recorded glyph point, including the circle's extreme points, lies
     within **±0.45r** of the token center on both axes.
   - *Filled glyphs (`HIT_POWER`, `SPEED`) — r5.*
     (i) Every recorded glyph point, including curve control points, lies
     within **±0.65r** of the token center on both axes.
     (ii) Every point of the flattened outline lies within a distance of
     **0.75r** of the token center. (The corners of the ±0.65r box are
     0.92r from the center and would touch the ring; (ii) keeps the glyph
     out of them.)
     (iii) Visible dark gap: at r = 12, `(r − 1) − d − s ≥ 2.0` px, where
     `r − 1` is the ring's inner edge (11 px; the ring's centre line is at
     r and its stroke is 2 px), `d` is the largest distance from the
     center to any flattened-outline point, and `s` is 1 if the optional
     same-path `stroke()` of AC3(a) is used, else 0. With no stroke, (ii)
     gives exactly this: 11 − 9 = 2.0 px at the closest point, and
     11 − 7.8 = 3.2 px on the axes.
   *r3 text superseded (r5):* "(d) Every recorded glyph point, including
   curve control points and the circle's extreme points, lies within ±0.45r
   of the token center on both axes, so each glyph, including its stroke,
   stays clear of the ring."
   *Test:* recorded styles, line widths, fill/stroke call counts per type,
   single-subpath check for (c), and a bound check on every recorded point.
   *Test (r5, (d)):* per type, the box check on every recorded point with
   the type's limit (0.45r or 0.65r); for the two filled glyphs also the
   0.75r distance check on the flattened outline at r = 12 and r = 20, and
   the 2.0 px gap formula at r = 12.
   *r2 text superseded:* "Every glyph segment is stroked (not filled) in
   `LEVEL_INTRO_TEXT_COLOR` at `lineWidth` 2. No new color and no glyph fill
   are introduced."
4. **Glyph shapes.** Tolerance ±0.05r on every stated coordinate unless a
   range is given. Where a range is given (all of AC4.1 and AC4.2 in r5),
   the test asserts the range as written, with floating-point tolerance
   only; angles are asserted to ±0.5°.
   - **4.1 `HIT_POWER` — fist (r5).** One filled closed outline. It is the
     r3 fist scaled up in proportion (the r3 ranges × 0.65/0.45 ≈ 1.44,
     rounded), so the fist and the rabbit have similar visual weight.
     (a) Bounding box width between **1.0r and 1.3r**, height between
     **0.8r and 1.2r**, centered on (0, 0) within ±0.1r. (The width floor is
     1.0r, not 0.87r, so the fist is never much smaller than the rabbit.)
     (b) Knuckles: the outline has **3 or 4 top bumps**, all in its upper
     half (y < 0), each with prominence between **0.06r and 0.22r**, spaced
     at least **0.17r** apart in x. No top bump has prominence of 0.3r or
     more.
     (c) No forearm or wrist: the outline's width measured **0.12r above its
     lowest point** is at least 0.6 × its width at y = 0 (the bottom is not
     a narrow stub). The fist faces the viewer or sideways; it is not a
     raised arm.
     (d) The AC3(d) filled-glyph bound holds. A fist wider than about 1.06r
     and as tall needs rounded lower corners to stay inside 0.75r.
     Note: the r3 fist as built (0.81r by 0.69r, bumps 0.11r high and 0.16r
     apart), scaled uniformly about the center by a factor between about
     1.25 and 1.45, meets (a)-(d).
     *r3 text superseded (r5):* "(a) Bounding box width between 0.6r and
     0.9r, height between 0.5r and 0.9r, centered on (0, 0) within ±0.1r.
     (b) Knuckles: the flattened outline has **3 or 4 bumps** in its upper
     half (y < 0), each with prominence between 0.04r and 0.15r, spaced at
     least 0.12r apart in x, all on the top edge. (c) No forearm or wrist:
     the outline's width measured at y = +0.3r is at least 0.6 × its width
     at y = 0 (the bottom is not a narrow stub). The fist faces the viewer
     or sideways; it is not a raised arm."
   - **4.2 `SPEED` — rabbit, side view (r5).** One filled closed outline of
     a whole rabbit, crouched on four legs, facing left or right.
     **Landmarks** (found on the flattened outline; the tests locate them
     the same way). Walking the top of the outline from the nose end to the
     tail end: the **front ear tip** and the **rear ear tip** (the two
     highest top bumps), the **ear valley V** (the lowest outline point
     between the two tips), the **neck dip N** (the lowest outline point
     between the rear ear tip and the rump top), and the **rump top R** (the
     highest outline point behind N). **E** is the ear height: the rise of
     the *lower* of the two ear tips above V. "At 0.25E / 0.5E / 0.75E"
     means on the horizontal line that far above V. W and H are the
     bounding-box width and height.
     (a) **Box.** W between **1.1r and 1.3r**; H between **0.9r and 1.2r**;
     **W ≥ H**; centered on (0, 0) within ±0.1r; AC3(d) filled-glyph bound.
     (b) **Ears: on the head, leaning back.**
     1. *Count.* Exactly **2** top bumps have prominence of at least
        **0.3r**. They are the two ear tips, and they are the two highest
        points of the outline. No ear is bent or folded down.
     2. *Height.* **0.3r ≤ E ≤ 0.55r**. The lower ear tip is also at least
        **0.3r** above the rump top R.
     3. *Width.* Each ear is between **0.2r and 0.3r** wide at 0.25E (its
        base), and between **0.12r and 0.25r** wide at 0.75E (near its tip).
     4. *Gap.* The dark gap between the two ears is at least **0.1r** at
        0.5E and at least **0.17r** (2 px at r = 12) at 0.75E.
     5. *Lean.* For each ear, the line from the midpoint of its width at
        0.25E to the midpoint of its width at 0.75E leans **back** (toward
        the tail) by **15° to 25°** from vertical. No ear leans forward,
        and no ear lies flatter than 25°.
     6. *Rounded tips.* Each ear tip is drawn by a curve call (`arc`,
        `quadraticCurveTo` or `bezierCurveTo`), and the flattened outline
        has no horizontal segment longer than 0.05r within 0.05r below the
        tip (no flat-topped ear).
     7. *Placement.* The midpoint of each ear at 0.25E (its root) lies in
        the **head half** of the box and **forward of the neck dip N**, so
        both ears attach to the head, not to the back. Each ear **tip** lies
        within the head-end **0.6 × W** of the box and forward of R.
     *Reconciliation with r3 AC4.2(b) (r5).* r3 required both ear tips to
     "lie in the same half … of the bounding box" and to be the only bumps
     of 0.2r or more. Ears that lean back 15°-25° carry their tips up to
     about 0.2r backward, which can put the rear tip past the middle of the
     box, and the high rump now required in (c) can itself rise 0.2r. r5
     therefore (1) applies the half-box rule to the ear **roots** and gives
     the **tips** the head-end 0.6 × W; (2) raises the ear threshold to
     0.3r and caps the rump at 0.25r, so the count of 2 can never include
     the rump; (3) replaces "point up or up-and-back" with the 15°-25° lean.
     A rabbit that meets (a)-(c) exists inside the AC3(d) bound: for
     example W = 1.25r, ear tips at y = −0.6r, V at y = −0.2r (E = 0.4r),
     N at y = −0.15r, R at y = −0.27r, feet at y = +0.5r.
     (c) **Head, body, tail, legs.**
     1. *Head lump.* The head is a round lump at the nose end. A disc of
        diameter at least **0.3r** fits inside the outline forward of N and
        below V. The horizontal distance from the nose (the head-end edge
        of the box) to N is between **0.35r and 0.65r**. (The website
        reviewer's "about 0.25r to 0.3r across" was written for the r3 box;
        r5 takes its upper value as the floor for the larger box.)
     2. *Neck dip and high rump.* R lies in the tail half of the box and
        is between **0.1r and 0.25r** higher than N (a clear neck dip, with
        the shoulders lower than the rump). The rump is drawn by curve
        calls (rounded).
     3. *Horizontal body (kept from r3).* The part of the outline below V
        is at least **1.3 ×** as wide as it is tall.
     4. *Tail bump.* Between R and the hind foot, the tail-end edge of the
        outline has one small rounded bump: the tail's rearmost point is
        between **0.06r and 0.15r** behind the notch directly under it, and
        at least **0.25r** above the foot line.
     5. *Underside notch.* The bottom edge has exactly **one** notch,
        between the front and hind legs: at least **0.15r** wide at half its
        depth and between **0.15r and 0.3r** deep, measured up from the
        foot line. Its top stays below the box's mid-height. It is a notch
        in the outline, not an interior hole (AC3(c)).
     6. *Four-leg crouch.* Exactly two foot contacts (runs of the outline
        within 0.03r of the lowest point), one in the head half and one in
        the tail half, each between **0.15r and 0.4r** long. Both feet are
        on the same line: their lowest points differ by at most 0.05r (a
        crouch, not a leap).
     (d) **IP** (checked by eye in the design and security reviews;
     unchanged from r3, binding per review-v2 addendum 4 §1.3): the
     silhouette must not resemble the **Playboy** rabbit logo (a head-only
     profile, bow tie, one bent ear, eye cut-out) or the **Energizer** or
     **Duracell** bunnies (an upright, standing, costumed or drum-carrying
     rabbit). Whole body only, side view, never head-only, never upright,
     no accessories, no clothing, no bow tie, no drum, no sunglasses, no
     eye or other cut-out (AC3(c)), amber only. *Added in r5, for the same
     reason:* the ears never lie flat along the back (lean ≤ 25°, (b)5) and
     the pose is never a stretched leap ((c)6), which keeps the glyph away
     from the leaping-rabbit car badge named in addendum 4 §1.3. The r5
     redraw gets a new IP check (addendum 4 §1.3, last bullet).
     *r3 text superseded (r5):* "(a) Bounding box width between 0.6r and
     0.9r, height between 0.5r and 0.9r, centered on (0, 0) within ±0.1r.
     (b) Ears: the flattened outline has **exactly 2 bumps** with prominence
     of at least 0.2r. They are the two highest points of the outline, both
     lie in the same half (left or right) of the bounding box (the head
     end), and both point up or up-and-back (no ear bent or folded down).
     (c) Body: the part of the outline below the base of the ears is at
     least 1.3 × as wide as it is tall (a horizontal, four-legged body, not
     an upright standing figure)." r3 (d) is kept word for word, with the
     r5 additions marked above.
   - **4.3 `SHIELD` — circle.** Exactly one stroked full circle (`arc`
     0 to 2π, or `ellipse` with equal radii), centered at (0, 0) ± 0.03r,
     with radius between **0.25r and 0.35r**. At r = 12 that is a 3-4.2px
     radius circle whose centre line is at least 7.8px (0.65r) from the
     ring's centre line. Both strokes are 2px wide, so the visible dark gap
     between them is at least about 5.8px (about 5.9px at the implemented
     radius of 0.34r). It reads as a small separate circle, not a second
     ring. No star, dot, fill or other mark inside it (M9.6 item 2; Open
     Question Q-v5-1, answered in r4).
     *r3 text superseded (r4, review-v2 addendum 4 A4-I2):* "At r = 12 that
     is a 3-4.2px radius circle with a gap of at least 7.8px (0.65r) to the
     ring, so it reads as a small separate circle, not a second ring." The
     7.8px figure was a centre-line distance, not the visible gap. No bound
     changes.
   - **4.4 `PERMANENT_MULTIPLIER` — capital X.** Exactly two diagonal
     segments:
     (a) one from (−a, −a) to (+a, +a) and one from (+a, −a) to (−a, +a),
     with a between 0.3r and 0.4r (the current code, a = 0.35r, meets this);
     (b) the two segments cross once, at (0, 0) ± 0.05r (AC1(c));
     (c) no other glyph call (no fill, no extra segment, no inner ring).

   *Test:* one unit test per glyph on the recorded path. (r5: for the fist
   and the rabbit, one assertion per numbered item of AC4.1(a)-(d) and
   AC4.2(a), (b)1-7 and (c)1-6.)
   *r2 text superseded:* "4.1 `HIT_POWER` — up arrow. Exactly 3 segments …",
   "4.2 `SPEED` — double-headed horizontal arrow "<-->". Exactly 5 segments
   …", "4.3 `SHIELD` — wall "---". Exactly 4 segments forming one closed
   axis-aligned rectangle …", "4.4 `PERMANENT_MULTIPLIER` — three ascending
   vertical bars. (r1 AC4, unchanged.) …"
5. **Changing a shape.** All four shapes are the owner's choice (r3). Any
   different shape, including a return to r2's arrow, "<-->", wall or bars,
   needs the owner's approval through product-manager and a new F23
   revision. The AC4 test for that glyph is then replaced by a test of the
   new glyph's recorded shape. A designer may tune proportions inside the
   AC4 ranges without a revision.
   *r2 text superseded:* "For `HIT_POWER`, `SPEED` and `SHIELD`, the shape is
   the owner's choice (r2). A different shape, including the not-chosen
   alternates (fist, rabbit, circle), needs the owner's approval … For
   `PERMANENT_MULTIPLIER`, a different glyph is acceptable only if …"
6. **Distinguishable at 24px, in grayscale, not by color.** All four tokens
   stay distinguishable from one another by glyph shape alone at 24px
   diameter (r = 12), while falling (F11 AC8, NFR-9(a)).
   *Tests:*
   (a) automated — each glyph's recorded path matches its own signature in
   the table below and does not match any other type's signature:

   | Type | Glyph `fill()` | Glyph `stroke()` only | Primitive | Distinguishing feature |
   |---|---|---|---|---|
   | `HIT_POWER` (fist) | 1 | no | one closed outline (curves allowed) | 3-4 top bumps, prominence 0.06r-0.22r, none ≥ 0.3r (r5; r3: "3-4 top bumps, prominence 0.04r-0.15r") |
   | `SPEED` (rabbit) | 1 | no | one closed outline (curves allowed) | exactly 2 top bumps with prominence ≥ 0.3r (the ears), both rooted in the head half (r5; r3: "exactly 2 top bumps, prominence ≥ 0.2r, one side") |
   | `SHIELD` (circle) | 0 | yes | one full-circle arc, radius 0.25r-0.35r | no line segments |
   | `PERMANENT_MULTIPLIER` (X) | 0 | yes | 2 diagonal segments | one crossing at center |

   (b) visual (r5) — the reviewers judge the tokens at the size a player
   really sees, without magnification. The evidence set below is attached
   to the website UX review (v3 round 3) and the mobile design review
   (round 8). All files go in `docs/mobile/tests/screenshots/`, are
   rendered from the shared `drawPowerUp` in a build that contains F23 r5,
   and show **all four tokens side by side** (fist, rabbit, circle, X):

   | # | File | What it is |
   |---|---|---|
   | 1 | `f23_tokens_13dp_at_2x_r5.png` | In-play size: 13 dp tokens on a 2x profile (each token about 26 px across), colour, 1:1 crop, no scaling |
   | 2 | `f23_tokens_13dp_at_2x_gray_r5.png` | The same crop in grayscale |
   | 3 | `f23_tokens_24px_r5.png` | 24 px tokens (r = 12 at 1×), colour, 1:1 crop, no scaling |
   | 4 | `f23_tokens_24px_gray_r5.png` | The same crop in grayscale |
   | 5 | `m2_7_lowend_powerup_rabbit_r5.png` (or `m2_7_pixel7_powerup_rabbit_r5.png`) | One capture from the Android emulator running the new build, with the rabbit token on screen during play, at native resolution |

   Files 1-4 may be harness renders. File 5 must be a real emulator
   capture. "1:1" means one image pixel per rendered pixel: no upscaling,
   no smoothing, no zoom. A magnified sheet (for example 8×) may be added
   for the IP check, but it is **not** evidence for this criterion.
   *Pass test.* Each reviewer, looking only at the unmagnified crops and
   not told the types, records what each token is. The rabbit passes only
   if the reviewer would write "rabbit" or "bunny": the mobile reviewer
   from file 2, the website reviewer from file 4. The reviewer also records
   that: every type can be named without colour; the fist does not read as
   a blob, a cloud or a paw; the rabbit does not read as a "V", a cat, a
   castle or a crown; the circle does not read as a second ring, a target
   or a bullseye; the X reads as a multiplier mark; and the dark gap
   between each filled glyph and the ring is visible in files 1 and 3.
   *If the rabbit fails this test again* in mobile round 8 or website v3
   round 3, no further redraw is attempted. The "<-->" fallback (r2 AC4.2)
   then goes to the owner for approval (AC5; §Open Questions, r5 note).
   *r3 text superseded (r5):* "(b) visual — a capture of all four tokens
   side by side at r = 12 is attached to the website UX round 2 review and
   the mobile design review. Capture it on the website at 1× and at the
   phone-emulation viewport, and a **grayscale** copy of each. The reviewer
   records that each type can be named without color, in grayscale, at
   24px. The reviewer also records that: the fist does not read as a blob,
   a cloud or a paw; the rabbit reads as a rabbit (ears visible) and not as
   a "V" or a cat; the circle does not read as a second ring, a target or a
   bullseye; and the X reads as a multiplier mark."
   *r2 text superseded:* the r2 signature table (3/5/4/3 segments by
   horizontal/vertical/diagonal count) and "the up arrow and the "<-->" do
   not read as a "+" or as each other, and the wall does not read as the old
   speed lines."
7. **No "X" emblem anywhere else (v4 F22 AC8(c), with the r3 exception).** No
   player-visible art in the product shows an "X" inside or over a circle or
   ring, **except** the `PERMANENT_MULTIPLIER` power-up token (owner-accepted
   risk, review-v2 V2-M3). In particular the HUD, title, app icon, adaptive
   icon, splash, logo, feature graphic and store screenshot 4 are X-free. The
   HUD text readout "Power ×N" (F7 AC10) is unchanged and allowed.
   *Test:* AC1(c) and AC4.4 confirm the X appears only in the Multiplier
   branch; a source search confirms no other draw code builds an X; reviewers
   check the icon, splash, feature graphic and store assets by eye.
   *r2 text superseded:* "No player-visible art in the product shows an "X"
   inside or over a circle or ring: power-up tokens, HUD, title, icon,
   splash, feature graphic or store screenshots."
8. **No behavior or text change.** Power-up type, drop rules (F7 AC1-AC3),
   catch hitbox, effects and durations (F7 AC4-AC7, including the ×1.8
   permanent effect and stacking), the HUD readout and on-catch feedback (F7
   AC10), and F11 rules are unchanged. Only the glyph draw calls inside the
   `HIT_POWER`, `SPEED` and `SHIELD` branches of `drawPowerUp` change; the
   `PERMANENT_MULTIPLIER` branch keeps its geometry (only its comment
   changes, AC10). The existing gameplay and power-up test suites pass
   without edits. The only exception is a test or visual snapshot that
   asserts an old glyph; it is updated to the new one.
   *r5 note:* r5 changes only the fist and rabbit glyph drawing (and their
   tests). The `SHIELD` and `PERMANENT_MULTIPLIER` branches, the ring, the
   disc, `POWERUP_RADIUS` and the catch hitbox are not touched.
   *r2 text superseded:* "Only the glyph draw calls inside the four `switch`
   branches of `drawPowerUp` change."
9. **Old tokens gone from all shipped art; screenshot 4 without the X.** No
   website build, Android build, store screenshot or feature graphic produced
   after this change shows the old chevron, speed lines or kite. The
   Multiplier's X stays (AC4.4). Store screenshot 4 ("Power-up catch moment",
   `docs/mobile/ux/store-assets-spec.md`) shows a **Hit Power (fist) or
   Speed (rabbit)** token, never the Multiplier token and never the Shield
   token. **No store asset** (screenshot 4, any other phone or tablet
   screenshot, the feature graphic, the store icon) shows the Multiplier (X)
   token or the Shield (circle) token. If a power-up is in frame, it is the
   fist or the rabbit. The Shield-token exclusion is **permanent** (r4;
   review-v2 addendum 4 §1.4 limit 3), not pending. All store assets are
   captured only from a build that contains the new glyphs.
   *r3 text superseded (r4):* "… never the Multiplier token (and, pending
   Q-v5-1, not the Shield token); the feature graphic shows no Multiplier
   token. Both are captured only from a build that contains the new glyphs."
   The Android power-up evidence screenshots (`m2_7_lowend_powerups_*`) are
   re-captured with the new glyphs for mobile-ui-ux-designer's next round.
   *r2 text superseded:* "… shows the old ringed "x", chevron, speed lines or
   kite."
10. **Traceability.** Each of the four glyph branches in
    `src/render/shapes.ts` carries a comment citing "PRD addendum v5 F23"
    and its AC4 item (4.1-4.4). The `PERMANENT_MULTIPLIER` branch also cites
    "review-v2 V2-M3 risk-accepted by owner 2026-09-30". The new test file or
    test cases cite F23 AC1-AC7.

---

## Cross-platform consistency (F23 ↔ `docs/mobile/PRD-mobile.md`)

| F23 AC | Android counterpart | Owner of the mobile side |
|---|---|---|
| AC1, AC7 | **M9.6 item 3** ("No X-Men imagery or iconography: no 'X' emblem") and item 4 ("Any hit is a FAIL"). The Multiplier token X is an owner-accepted exception, not a hit; everything else must stay X-free. | mobile-product-manager (records the acceptance under **C7** in M9.6), mobile-security-compliance-reviewer (closes review-v2 **V2-M3** as **risk-accepted**), mobile-ui-ux-designer (next round) |
| AC4.3 | **M9.6 item 2** ("no concentric-ring shield"). Q-v5-1 answered (r4): not a hit, on five binding limits; recorded in the PRD-mobile M9.6 note of 2026-09-30. | mobile-security-compliance-reviewer, mobile-ui-ux-designer |
| AC4.2(d) | Store/IP check of the rabbit silhouette (Playboy, Energizer, Duracell). | mobile-ui-ux-designer, mobile-security-compliance-reviewer |
| AC6 | UC4 row: "power-up icons must stay distinguishable at phone scale (F11 AC8)"; M2 phone-scale checks on the low-end profile, including a grayscale capture | mobile-junior-tester / mobile-lead-tester (device matrix captures) |
| AC3(d), AC4.1, AC4.2, AC6(b) (r5) | Same shared drawing. Mobile evidence: AC6(b) files 1, 2 and 5 at the in-play size (about 13 dp). Rabbit and fist renders get a new IP check (review-v2 addendum 4 §1.3). `docs/mobile/PRD-mobile.md` v1.9 change-log line points here. | mobile-junior-developer (redraw), mobile-lead-tester (captures), mobile-ui-ux-designer (round 8), mobile-security-compliance-reviewer (IP delta check) |
| AC9 | `store-assets-spec.md` screenshot 4 and feature graphic; review-v2 C7 ("before screenshots are captured (step 15)") | mobile-release-engineer, mobile-ui-ux-designer |
| AC2-AC5, AC8 | No mobile-specific text needed: the Android app draws the same `drawPowerUp` from the shared `src/`. After the change, rebuild and `npx cap sync android`. Never hand-edit the copied web assets. | mobile-junior-developer |

mobile-product-manager adds a dated note to PRD-mobile M9.6 that records,
under condition C7, the owner's 2026-09-30 acceptance of the Multiplier-token
X (quoting "I'll take the risk") and the limits of the exception (AC7, AC9).
mobile-security-compliance-reviewer closes V2-M3 as risk-accepted, not as
fixed. No other PRD-mobile text describes the glyphs, so no other mobile AC
changes.
*r2 text superseded:* "mobile-product-manager may add a one-line dated note
to PRD-mobile M9.6 that the ringed-"x" hit is resolved by F23 (r2 also
redraws the other three glyphs)."

---

## Out of Scope (v5 r3 — v1-v4 lists still hold)

- Changing the ring, token colors or token size.
- Changing any power-up rule, the HUD readout wording, or the "×" character
  in HUD text.
- Glyphs for anything other than the four power-up tokens (for example the
  player's own shield art, F14, is unchanged).
- A new icon, splash or logo (they are only re-checked under AC7, and stay
  X-free).
- (r5) Enlarging the whole token: `POWERUP_RADIUS`, the ring and the catch
  hitbox stay as they are (design-review-round7 option (a2) is not taken).
  r5 enlarges only the two filled glyphs inside the ring.
- (r5) Replacing the rabbit with "<-->". That reverses an owner choice and
  is only put to him if the rabbit fails again (§Open Questions, r5 note).
- Removing the Multiplier X. That would reverse the owner's r3 decision and
  needs a new revision.

---

## Open Questions v5 — for owner decision

**Q-v5-1 — ANSWERED 2026-09-30 (r4) by
`docs/mobile/security/review-v2-addendum4.md` §1.4 (finding A4-L1): the
circle is kept.** This is option (a) below. The reviewer ruled the circle
Shield token **not a hit** under PRD-mobile M9.6 item 2, on five binding
limits:
1. One amber stroked circle only: no fill, star, dot or second inner ring;
   no red, white or blue; no alternating bands. The test `SHIELD is exactly
   one full circle and nothing else` must stay.
2. The radius stays within 0.25r-0.35r (0.34r as implemented).
3. The Shield token appears in **no** store asset: not screenshot 4, not the
   feature graphic, not the icon, not a tablet screenshot (AC9, now
   permanent).
4. The glyph is never enlarged into a HUD badge, logo, splash or title
   element.
5. **Fallback:** if a complaint arrives or a later reviewer disagrees, the
   Shield token becomes the wall bar (r2 AC4.3, already specified), as a new
   F23 revision through both pipelines.

Option (b), a solid dot, is **not recommended** by the reviewer: a filled
dot inside a ring is closer to a retailer's bullseye logo than the hollow
circle is. Option (c), the wall, is the fallback in limit 5.

No owner decision is needed. The owner chose the circle on 2026-09-30
(19:52 UTC). The ruling (reviewed, acceptable with limits, kept out of store
art, wall bar as fallback) is stated to the owner by the main session in its
project-thread update of 2026-09-30, and recorded in the
`docs/mobile/PRD-mobile.md` M9.6 note of the same date. He can still ask for
the wall. The website pass 2 (security-compliance-reviewer) records the same
disposition against NFR-10.

*r3 question text, kept for the audit trail:*

**Q-v5-1 (new in r3, not blocking implementation): the circle Shield token
and PRD-mobile M9.6 item 2.** M9.6 item 2 bans a "concentric-ring shield"
(Captain America's shield is concentric rings). The r3 Shield token is an
amber circle centered inside the amber ring, labelled "Indestructible
Shield". It has no red/white/blue, no star, and a wide gap between the two
circles, but it is two concentric circles on a shield power-up. This was not
raised with the owner on 2026-09-30. Options:
- (a) **Recommended:** keep the circle as specified (amber only, no star or
  fill, radius 0.25r-0.35r) and have mobile-security-compliance-reviewer and
  security-compliance-reviewer rule on it under M9.6 item 2 / NFR-10 in
  their next pass; keep it out of screenshot 4 and the feature graphic
  (AC9) either way. Cost: none now; risk: a reviewer could still FAIL it,
  sending it back to the owner.
- (b) Make the circle a small solid filled dot instead of an outline. Not
  concentric rings, but it no longer matches "a circle shape" as clearly
  and may read as a bullet. Cost: one AC change and owner approval.
- (c) Switch Shield to the owner's other option, the wall "---" (r2 AC4.3,
  already specified). Cost: reverses an owner choice; needs owner approval.

**r5 note — no open question; one conditional question recorded.** r5 needs
no owner decision. If the rabbit fails AC6(b) again in mobile round 8 or
website v3 round 3, a new question **Q-v5-2** is opened and put to the owner
at that time, and not before: approve the double arrow "<-->" (r2 AC4.2) for
the Speed token in place of the rabbit, or choose another route. The
fallback is not applied without his approval, because he chose the rabbit on
2026-09-30 (19:52 UTC).

None open (r4: Q-v5-1 is answered above). The owner chose all four shapes
on 2026-09-30 and accepted the X risk. The change costs three redrawn glyph branches, their
unit tests, a grayscale capture and a screenshot re-capture.

---

## Pipeline impact (both platforms, per `.claude/CLAUDE.md` §One codebase)

F23 r3 is a shared art change, so before **either** version ships it must
pass the gates of **both** pipelines:
- **Website:** code-reviewer loop, test-writer / test-validator (AC1-AC4,
  AC6(a), AC7 source search, AC8), ui-ux-designer round 2 (AC6(b) including
  grayscale, AC7), security-compliance-reviewer pass 2 (AC4.2(d), AC4.3 /
  Q-v5-1, AC7, NFR-10, recording the owner-accepted X risk), docs-writer
  only if the glossary or README describes power-up icons, UAT
  (product-manager: each token is identifiable by shape while falling), then
  deploy + smoke.
- **Android:** steps 7-12 for the changed file (mobile-junior-developer →
  mobile-lead-developer, mobile-junior-tester → mobile-lead-tester including
  re-captured `m2_7_lowend_powerups_*` and a grayscale copy,
  mobile-ui-ux-designer next round, mobile-security-compliance-reviewer
  closing V2-M3 as risk-accepted under C7), mobile-product-manager's M9.6
  note, mobile UAT, and store capture per AC9.
- **r5 route (both pipelines, same order):** code-implementer /
  mobile-junior-developer redraw the fist and rabbit in
  `src/render/shapes.ts` to AC3(d), AC4.1 and AC4.2; code-reviewer and
  mobile-lead-developer review; test-writer / mobile-junior-tester update
  `src/render/powerUpGlyphs.test.ts` (bound, boxes, AC4.1, AC4.2 items,
  AC6(a) signatures); test-validator / mobile-lead-tester run them and
  produce the AC6(b) evidence set; ui-ux-designer (v3 round 3) and
  mobile-ui-ux-designer (round 8) judge the rabbit from the unmagnified
  crops; security-compliance-reviewer and
  mobile-security-compliance-reviewer do the IP delta check of the new
  fist and rabbit renders (addendum 4 §1.3). A second rabbit FAIL at either
  design gate goes to the owner as Q-v5-2, not back to the developer.
- `.github/workflows/deploy-pages.yml` remains the single CI check. The F23
  unit tests run there for both platforms.
- No ADR is needed: only the glyph branches of an existing draw function
  change.

---

## Traceability check (v5 r3)

F23 traces to the owner's three messages of 2026-09-30 (quoted verbatim),
UC4 / P4, NFR-9(a), NFR-10 / F9 AC4 / v4 F22 AC8. It answers
`docs/mobile/security/review-v2.md` V2-M3 (C7) with an owner risk acceptance
for the Multiplier X, and records where r3 departs from
`docs/mobile/ux/design-review-round5.md` ruling (a). Each amended text (F7
types list, v2 F11 AC8, v4 F22 AC8, NFR-10 row) is quoted next to its
replacement, each r1 → r2 change is quoted in the r2 revision table, and each
r2 → r3 change is quoted in the r3 revision table and next to the AC it
changes. The Android side maps to PRD-mobile M9.6 items 2-4 and the UC4
phone-scale row. These are cross-referenced, not edited. `docs/PRD.md` and
addenda v2-v4 are not edited, and this addendum wins where they differ.

**r5 (2026-09-30).** Each r3/r4 → r5 change is quoted in the r5 revision
table and next to the AC it changes (AC3(d), AC4.1, AC4.2, AC6(a) rows,
AC6(b), F11 AC8 row). r5 traces to `docs/mobile/ux/design-review-round6.md`
and `-round7.md`, `docs/ux/design-review-v3-round1.md` and `-round2.md`, and
keeps the limits of `docs/mobile/security/review-v2-addendum4.md` (§1.3,
§1.4, §2.2). The Android side is noted in the `docs/mobile/PRD-mobile.md`
v1.9 change-log line.
