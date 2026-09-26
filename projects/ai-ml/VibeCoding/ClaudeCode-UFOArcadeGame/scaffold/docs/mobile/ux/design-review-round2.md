# Mobile UX Design Review — Round 2 (Pre-Architecture Gate, re-run)

**Reviewer:** mobile-ui-ux-designer subagent
**Stage:** Mobile Pipeline Step 3 — round 2 **[GATE]**, still pre-architecture
(re-run of the step-3 gate after `docs/mobile/PRD-mobile.md` was amended in
response to round 1's FAIL). `mobile-solution-architect` has not yet run;
`docs/mobile/architecture/mobile-architecture.md` does not exist.
**Date:** 2026-09-25
**Input reviewed (specs only):** `docs/mobile/PRD-mobile.md` (amended
2026-09-25, §9 amendment log), `docs/mobile/ux/design-review-round1.md`
(this reviewer's own prior findings F1-F4, N1-N3), `docs/PRD-addendum-v3.md`,
`docs/mobile/ux/store-assets-spec.md`.

---

## Verdict: **PASS**

Every round-1 blocking finding (F1-F4) is closed **at the spec level**: each
now has either an explicit, testable acceptance criterion (F1, F4) or numeric
arithmetic that is shown to close on the PRD's own stress case, the
640×360 dp profile (F2, F3). The two non-blocking findings that asked for a
stated number (N2) and a corrected screenshot caption (N3) are also closed.
N1 remains a legitimate implementation note carried forward, as originally
scoped (non-blocking).

`mobile-solution-architect` may proceed. Three items from F2/F3/F4 cannot be
*fully* verified until the architecture doc exists (that's the nature of a
pre-architecture gate) — these are listed below as **carry-forward checks**,
not failures, per this review's instructions. They are specific enough that
the architect and `mobile-lead-developer`/`mobile-ui-ux-designer` round-2
reviewers can act on them without re-deriving the problem.

---

## Round-1 findings — disposition

### F1 — Orientation lock scope ambiguous — **CLOSED**
New **M2.1a** states the landscape lock applies from process start (splash
included) on every screen, with an explicit test: cold-start in portrait with
auto-rotate on → splash/title render landscape with no rotation animation at
Start. This is exactly the fix F1 asked for. No further action.

### F2 — 640×360 dp side-column arithmetic didn't fit — **CLOSED**
New **M2.12** adopts F2's recommended fix (uneven, content-sized columns, not
a 50/50 split) and states the numbers:
- Movement column = 24 (edge inset) + 56 (◀) + 8 (gap) + 56 (▶) = **144 dp**
- Throw column = 24 (edge inset) + 56 (THROW) = **80 dp**
- Playfield on this profile = 640 − 224 = **416 dp wide** (scale ≈0.52×) ×
  **312 dp tall**, which is checked against the required ≥0.5× floor
  (400×300 dp) and clears it.

I re-did this arithmetic independently: 144 + 80 = 224; 640 − 224 = 416;
416/800 = 0.52; 600 × 0.52 = 312. It closes, with no target below its M3.1
floor and no overlap. M2.6's legibility note was also updated to cite the
actual 0.52× scale (not the original 0.6× estimate), which is the correct
knock-on fix — a reviewer re-checking M2.6 against the old 0.6× number would
have missed this. Good catch by the PRD author.

**Carry-forward check (cannot be fully closed until architecture exists):**
M2.12's own acceptance criterion (a) already requires
`docs/mobile/architecture/mobile-architecture.md` to restate these exact
numbers (column widths, edge insets, playfield scale and position) for the
640×360 dp profile and show the sums close. Round 2 of this gate (post-
implementation) must re-verify this against the actual architecture doc and
the device-matrix screenshot, not just against the PRD's own stated
arithmetic as done here.

### F3 — Gesture-exclusion insets not budgeted — **CLOSED**
New **M2.3a** requires the *edge inset* (the larger of display-cutout inset
and system-gesture inset) to be queried **at run time** per device/
orientation/nav-mode, folds a nominal 24 dp into the same M2.12 column
budget for layout planning, and adds a concrete player-facing test: 20
press-hold-slide gestures per side edge, in both landscape directions and
both control layouts, with 0 accidental back/home triggers. This is a
stronger fix than F3 asked for (F3 only asked for the inset to be budgeted;
the PRD also added the runtime-query requirement and the empirical gesture
test).

**Carry-forward check:** F3's original text flagged that "this exact number
may need a device-specific query rather than a hardcoded constant" and asked
the architect to confirm against Android's current `WindowInsetsCompat`
gesture-inset API (or the Capacitor-layer equivalent). M2.3a correctly defers
*how* the runtime query is implemented to the architect — that is
appropriate at this stage. Round 2 of this gate must confirm the
architecture doc names the specific API/plugin used, that it is queried live
(not a hardcoded 24 dp shipped as the actual value), and that the M2.12
budget still closes if a real device reports a larger inset than the 24 dp
planning number.

### F4 — No defined hit-testing model for ◀→▶ slide — **CLOSED at the
behavioral-contract level; the input-handling model itself is correctly
deferred to architecture**
New **M3.3a** fully specifies the *player-facing* contract (switch within
≤100 ms of entering the new button, no drop across the gap, no stick to the
first-touched button, slide-off/release semantics, independence from
THROW/PAUSE, symmetry across both control layouts and both landscape
directions) plus an instrumented test (40/40 scripted swipes, 0 frames of
zero velocity during the gap, 0 frames of wrong-direction movement after
crossing). This is precisely what F4 required — a testable behavior spec
that does not depend on knowing the implementation mechanism yet.

M3.3a explicitly states that *how* this is achieved (continuous per-frame
hit-testing of live touch position vs. discrete per-button events) "is not
decided here — it is owned by mobile-solution-architect and must be recorded
in `docs/mobile/architecture/mobile-architecture.md` (or an ADR)." This is
the correct division of labor for a pre-architecture gate: the spec is
sufficient for the architect to proceed, because the architect's job is
exactly to choose and record that mechanism against an already-fixed
behavioral target.

**Carry-forward check:** this is the one round-1 finding that is *not* fully
closed by the PRD alone and cannot be — it names its own re-review trigger
("which the UX round-1 re-review checks against M3.3a"). Round 2 of this
gate (post-implementation) must confirm: (a) the architecture doc/ADR states
which input model was chosen and why; (b) the chosen model satisfies all six
M3.3a sub-rules, not just the headline "switches within 100 ms" number; (c)
the 40/40-swipe instrumented test actually ran and its results are in the
test/validation report, not just asserted in the architecture doc.

---

## Non-blocking findings — disposition

### N1 — HUD CSS has no safe-area padding to build on — **still open,
correctly non-blocking**
No PRD change was made or needed here (N1 was an implementation note about
`src/style.css`, not a PRD gap). Carried forward unchanged: when
`mobile-solution-architect`/`mobile-junior-developer` add safe-area padding,
it must be **additive** to the existing `#hud-root`/`#control-text` pixel
constants, not a replacement of them, since those same constants are shared
with the (safe-area-exempt) website per M3.12/NFR-5.

### N2 — Tablet playfield scale floor unstated — **CLOSED**
New **M2.13** states the floor explicitly: playfield ≥0.5× (≥400×300 dp) on
every device-matrix profile, same side-column layout on near-square
tablets/foldables (no letterboxed-band layout), consistent with OQ-M7 (a).
Matches N2's request for "a number in the architecture doc, not discovered
during device-matrix testing" — though note the number is now in the *PRD*;
the architecture doc still needs to restate the resulting scale per profile
(M2.13's own last sentence already requires this — folded into the F2
carry-forward check above, not a separate one).

### N3 — Store copy overpromise — **CLOSED, and verified in
store-assets-spec.md**
`docs/mobile/ux/store-assets-spec.md` screenshot 5's caption uses the
corrected M12.2 wording ("Leave the app mid-level and it pauses
automatically — tap Resume and carry on.") and explicitly calls out *why*,
citing M4.6. Screenshot 6 goes further than N3 asked and adds a forward-
looking guard: omit the "Best: N"/"New best!" element entirely if it isn't
implemented yet in the build being screenshotted, rather than show a feature
that doesn't exist (M12.4). No further action.

---

## New material since round 1 — reviewed for new UX issues

Two documents new since round 1 were reviewed for regressions or gaps this
gate is responsible for catching: `docs/PRD-addendum-v3.md` (F20, saved best
score — a shared game-rule change) and `docs/mobile/ux/store-assets-spec.md`
(already covered under N3 above, produced by this same reviewer role in
round 1 as a companion doc, re-checked here for internal consistency with
the amended PRD).

- **F20 cross-platform wording is now consistent.** `PRD-addendum-v3.md`'s
  own cross-platform table flagged that mobile M7.1 hadn't yet adopted F20
  AC3's "strictly greater" rule for "New best!". The amended M7.1 now quotes
  that exact language. No open inconsistency between the two documents.
- **F20 does not add any new touch-layout risk.** "Best: N"/"New best!" only
  ever appear on the title screen and end screens (F20 AC14, M7.1), which
  per M3.9 are screens where touch controls are hidden — so F20 introduces
  no new competition for the side-column space that F2/F3 were about. No
  new finding required here.
- **Q-v3-1 (Restart Level score farming) is still open with the owner** —
  correctly not defaulted, and correctly not blocking this gate: it is a
  game-rule question (F6 AC4/F10 AC4), not a touch/layout/back-gesture/
  lifecycle question owned by this review. Flagging only so it isn't lost:
  if the owner picks option (b) or (c) in `PRD-addendum-v3.md`, the pause
  menu's Restart Level wording/behavior may need a fresh UX pass before it
  ships, since it changes what the player is told happens to their progress
  — but that is a future, conditional re-check, not a finding against the
  current spec.
- **No PAUSE-button vertical-stacking arithmetic is stated.** M3.2 requires
  PAUSE to sit ≥24 dp from THROW "in the same or opposite column," which on
  the 640×360 dp profile means stacking PAUSE above/below THROW within the
  80 dp-wide throw column. The *width* math already closes (PAUSE's 48 dp
  minimum fits inside the 80 dp column). The *height* budget (THROW 56 dp +
  gap 24 dp + PAUSE 48 dp = 128 dp, against ~360 dp of available column
  height) is comfortable by inspection and not treated as a blocking gap —
  but since the architecture doc is already required to state column
  *widths* for M2.12, it should state the vertical placement/heights too so
  this isn't left to be discovered during implementation. Added to the
  carry-forward list below as a minor addition, not a new blocking finding.

---

## Carry-forward checks for `mobile-solution-architect` and round 3 of this
gate (post-architecture / post-implementation)

These cannot be verified until `docs/mobile/architecture/mobile-architecture.md`
and/or `docs/mobile/tests/device-matrix.md` exist. Listed here so the next
UX review doesn't have to re-derive them:

1. **(from F2/N2/M2.12/M2.13)** Architecture doc states the exact column
   widths, edge insets, playfield scale and playfield position for the
   640×360 dp profile (movement 144 dp / throw 80 dp / playfield 416×312 dp)
   and shows the sums close with no target below its M3.1 floor; also states
   the resulting playfield scale for the tablet/foldable device-matrix
   profiles per M2.13.
2. **(from F3/M2.3a)** Architecture doc/ADR names the specific runtime API or
   Capacitor plugin used to query the live edge inset (not a hardcoded
   24 dp), and the M2.12 budget is shown to still close if a real device
   reports a larger inset.
3. **(from F4/M3.3a)** Architecture doc/ADR records which input-handling
   model was chosen for the ◀/▶ slide gesture (continuous per-frame
   hit-testing vs. an alternative) and confirms it satisfies all six M3.3a
   sub-rules; the 40/40-swipe instrumented test result is in the test/
   validation report, not only asserted in the architecture doc.
4. **(from N1)** Safe-area padding added to `#hud-root`/`#control-text` is
   additive to the existing shared pixel constants, not a replacement,
   confirmed by diff review once implementation exists.
5. **(new, minor)** Architecture doc states PAUSE's vertical placement/
   height budget relative to THROW within the throw column at the
   640×360 dp profile (not just the width, which M2.12 already covers).
6. **(from M2.7/M2.12(c))** Device-matrix screenshots at the 640×360 dp
   profile confirm HUD/menu text still reads at ≥12 sp-equivalent and game
   art (power-up shapes, 1-hit vs. 4-hit enemy distinction, shield trail)
   is still distinguishable at the *actual* ≈0.52× scale, since M2.6 was
   corrected from an earlier ~0.6× estimate.

---

## Owner question surfaced (not new, carried forward for visibility)

No new owner question is raised by this review. `PRD-addendum-v3.md`'s
**Q-v3-1** (whether Restart Level should stop letting players farm the
now-persistent best score) remains open and does not block this gate or
`mobile-solution-architect`'s work — it is a shared game-rule question, not
a touch/layout/back-gesture/lifecycle question. It is noted here only
because, if resolved as anything other than "leave as is," it will need a
follow-up UX pass on the pause menu's Restart Level option before ship
(§New material above).

---

## Summary for next step

**Verdict: PASS.** F1-F4 are closed at the spec level; N1-N3 are closed or
correctly carried forward as non-blocking. `mobile-solution-architect` may
proceed to `docs/mobile/architecture/mobile-architecture.md`. Six
carry-forward checks are listed above for the next round of this gate
(post-architecture/post-implementation) — none of them reopen OQ-M1..M10 or
this review's own six decision areas (touch scheme, orientation, back
behavior, pause/resume, first-launch help, haptics), all of which remain
validated from round 1.
