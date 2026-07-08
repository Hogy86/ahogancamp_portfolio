# UX Design Review — Addendum v2, Round 2 (Re-review of Round-1 FAIL)

**Reviewer:** ui-ux-designer subagent
**Stage:** Independent re-review of `docs/PRD-addendum-v2.md` after
product-manager's fixes to round-1's eight blocking findings (B1-B8) and five
non-blocking findings (N1-N5).
**Input reviewed:** `docs/PRD-addendum-v2.md` (current text, read fresh in
full) as the primary artifact; `docs/ux/design-review-v2-round1.md` used only
to know what to check, not as the source of the verdict; `docs/PRD.md` (v1)
consulted to verify claims about pre-existing ACs (F3 AC6, F6 AC8, F7 AC10b,
F9 AC2/AC3) that the addendum's fixes reference or amend.
**Date:** 2026-07-07

---

## Verdict: **FAIL**

All eight round-1 blocking findings (B1-B8) are genuinely resolved in the
current document text — not merely asserted away — and each new/amended AC is
specific enough to implement and test against. However, this re-review found
**one new blocking issue introduced by this round's own fix** (the B8/N1 fix
to F19), plus two non-blocking observations. This is a materially narrower
FAIL than round 1 (1 new blocking item vs. 8), but per the gate convention a
FAIL is a FAIL — the new item is a genuine untraced collision of exactly the
kind this document's own B1 fix was praised for closing, so it should not
pass through on a "close enough" basis.

---

## B1-B8 verification (each checked against current text)

### B1 — RESOLVED
F18's new "**Reconciliation with NFR-1 / F9 AC3**" section (between the
Description and Acceptance Criteria) explicitly names both metrics, states
the literal collision ("first controllable input ... is not ≤3s" under F18),
and redefines the measurement point as "the point the 3-second intro
*begins*" (input wired and ready, then held for 3s, live at intro-end). This
is a genuine reconciliation, not silence — it also cross-references itself
from the summary table's F18 "Amends v1" cell and the NFR notes section. Meets
the bar B1 required.

### B2 — RESOLVED
F18 AC9 explicitly carves out **Restart Level only**: "the 3-second 'LEVEL
[N]' intro is skipped entirely... This carve-out applies **only** to Restart
Level; fresh level starts (new run, level advance) and boss-phase-to-next-level
transitions still get the full 3-second intro per AC1." F18 AC1 also states
the exception up front. Explicit owner sign-off is recorded (document header
and F18 AC9's "Rationale (per owner sign-off)" clause). Fully resolved.

### B3 — RESOLVED
F12 AC10-AC11 add a ~1.75s (1.5-2s target) "screen-edge flash and/or brief
'BOSS INCOMING' text" cue, and AC11 explicitly enumerates why it is **not**
the same mechanism as F18: shorter duration, does not re-freeze the game
(player may still move), shows no "LEVEL [N]" text, does not increment the
level indicator. F18 AC7 is updated with a parenthetical pointing to F12
AC10-11 so the two features don't silently diverge. This is a clean,
explicit distinction between the two mechanisms — resolved.

### B4 — RESOLVED
F15 AC9 adds a concrete, testable AC: "a short visual trail / afterimage
tracing its recent path," explicitly scoped as a rendering aid only (does not
change collision radius or bounce geometry), with a stated rationale tying it
to the catch mechanic reading as skill-based rather than luck-based. Concrete
and implementable.

### B5 — RESOLVED (feedback); discoverability only partially addressed
F16 AC9 adds a concrete catch-confirmation cue ("a visual flash and/or a
brief on-screen text such as '+1 LIFE'"), explicitly modeled on F7 AC10b's
precedent. This closes the primary blocking claim (attributable,
perceptible catch event). Note: round-1's B5 finding also suggested (as a
secondary, "consider"-level recommendation) surfacing the catch-for-a-life
mechanic's *discoverability* via the persistent control line (F9 AC2) or a
first-bounce hint — this addendum does not add either. Since the original
finding's blocking core was the missing feedback (not discoverability, which
was phrased as "consider... so it is discoverable"), I'm treating this as
adequately resolved for gate purposes — a first successful bounce-catch now
gives immediate, legible "+1 LIFE" feedback, which is itself a reasonable
learn-by-doing discovery path for an arcade game. Flagged below as a
non-blocking residual recommendation, not a re-opened blocker.

### B6 — RESOLVED
F17 AC9 adds a concrete, contrast-adaptive rule: "lighter overlay strokes on
dark bodies... darker strokes on light bodies... maintaining a minimum
legible contrast against the body it sits on, rather than a single fixed
overlay color." Explicitly ties to the darkest tiers and the boss where the
failure mode was identified. Concrete and testable.

### B7 — RESOLVED
F11 AC8 adds: the four power-up types "are visually distinguishable from one
another while still falling... each has a distinct icon/shape,
differentiated by more than color alone (non-color-only per NFR-9)," with
explicit rationale tied to F11 AC3's new downgrade risk. Concrete and
testable.

### B8 — RESOLVED (see new finding C1 below for a side effect of this fix)
F19 AC9 adds an optional, additive key-press hold: first key press pauses the
5s countdown and holds the display, a second key press advances to title, and
"no key press leaks into or pre-triggers the title screen's own state." This
also explicitly closes N1 ("the single, explicit, defined behavior for any
key press during the celebration"). The core B8 tension (rigid 5s window vs.
F10's screenshot-a-score goal) is resolved — the mechanism is genuinely
additive and doesn't compromise the AC5 no-input default. However, this fix
introduces a new untraced collision — see **C1** below.

---

## New findings from this round's edits

### C1 (NEW — BLOCKING) — [F19 AC9 / F6 AC8] — Consistency, error prevention — "Any key" hold-to-pause on the Game Complete screen is not reconciled against the existing Esc-is-a-silent-no-op rule for non-play screens
**Issue:** F6 AC8 (v1, still binding) states: "On any screen that is NOT
active play — specifically the title/start screen, the Game Over screen (F8
AC4), and the **Victory screen (F8 AC6)** — pressing **Esc** is a silent
no-op." F19 replaces the Victory screen with the new "Game Complete"
sequence (F19's own "Supersedes/amends" section confirms this: "F19 changes
the trigger... and the behavior... rather than a static screen waiting for
input"). F19 AC9 (this round's new fix) then specifies: "pressing **any key**
during the celebration holds the screen... until a second key press advances
to the title screen." Esc is a key. Nothing in F19, F6, or the "Supersedes /
amends" notes states whether Esc is exempt from AC9's "any key" behavior
(i.e., continues to be a silent no-op, per F6 AC8's precedent for the screen
Game Complete replaces) or is included in it (i.e., pressing Esc during Game
Complete now pauses/holds the celebration, contradicting F6 AC8's literal
"silent no-op" rule for that screen). This is exactly the class of gap B1 was
required to close ("an explicit amendment note reconciling X with Y...
silence is not acceptable given both are named, acceptance-gated v1/v2
ACs") — F19's "Supersedes/amends" section names F8 AC6 and
`GameStateMachine.ts` as amended, but never mentions F6 AC8, even though F6
AC8 explicitly names the screen F19 is replacing.
**Fix:** Add one sentence to F19 AC9 (or F6 AC8) explicitly stating whether
Esc is included in or exempted from the "any key" hold behavior on the Game
Complete screen. Recommended default: treat Esc identically to every other
key for AC9's purposes (simplest, most consistent with "any key" as written)
and add a one-line amendment to F6 AC8 noting "Victory" is superseded by
"Game Complete," which now has its own key-handling rule (AC9) that
supersedes AC8's no-op for that specific screen only. Either resolution is
fine; the current silence is not, given the precedent this project itself
set with B1.

### C2 (NEW — non-blocking) — [F12 AC10 / F3 AC6] — Consistency, match between system and real world — The new boss-incoming cue and the existing formation-danger warning both use "screen-edge" visual language for opposite-valence events
**Issue:** v1 F3 AC6 established a "pulsing edge/border plus a shape or text
cue" to warn the player of an **impending loss** (formation approaching the
player's row). F12 AC10 (new) introduces "a screen-edge flash and/or a brief
'BOSS INCOMING' text" to announce an **impending escalation** (an exciting,
not a losing, event). The two events are temporally mutually exclusive (F3
AC6 requires a living, advancing formation; F12 AC10 only fires after the
formation is fully cleared), so there's no risk of them literally
co-occurring — but the addendum doesn't specify that the boss cue's color/
style is visually distinct from the pre-established "danger" edge-pulse
language a player has already learned (from levels 1-4) to associate with
"you are about to lose." Reusing a similar screen-edge treatment for a
positive escalation risks a first-time player momentarily misreading "BOSS
INCOMING" as another loss warning, undercutting the "visibly escalating
challenge" intent (UC3) the cue exists to serve.
**Fix:** Add a line to F12 AC10 or AC11 specifying the boss cue uses a
color/treatment distinct from F3 AC6's danger-warning pulse (e.g., a
different hue family, or a solid flash rather than a pulsing border) so the
two screen-edge cues remain semantically distinguishable. Low cost, does not
block architecture.

---

## Other observations (minor, non-blocking, noted for completeness)

- **F16 description vs. AC4:** F16's prose description lists three ways a
  shield "leaves play" (exits screen, direct center-face hit, caught by
  player) but omits the max-lifetime safety-valve case that AC4(d) adds. AC4
  is the authoritative, complete list and is correct; the prose paragraph is
  just stale relative to it. Cosmetic — recommend a one-word alignment pass
  but does not block implementation since ACs govern.
- **F12 AC11 / throwing during the boss-incoming cue:** AC11 clarifies the
  player "may still move" during the ~1.75s cue (unlike F18's full freeze)
  but does not explicitly say whether throwing a shield is permitted during
  that window. Since there are no enemies to hit, this is low-stakes, but a
  one-line clarification ("the player may move and throw during the cue;
  there is simply nothing for the shield to hit yet") would remove any
  residual ambiguity for code-implementer.
- **B5 discoverability (see above):** treated as adequately resolved via the
  learn-by-doing catch-confirmation feedback (F16 AC9), but flagged as a
  nice-to-have if the owner wants to add a one-time hint on first bounce.

---

## Summary for next step

**Verdict: FAIL** — narrowly, on one new item. B1-B8 are all genuinely
resolved with concrete, testable ACs; do not re-litigate them. The blocking
item to close before solution-architect proceeds is **C1**: reconcile F19
AC9's "any key" hold behavior against F6 AC8's pre-existing Esc-is-a-silent-
no-op rule for the screen F19 replaces (Victory → Game Complete). This is a
one-line fix, not a redesign. C2 and the minor observations are recommended
but do not block the gate.
