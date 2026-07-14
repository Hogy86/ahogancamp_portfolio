# UX Design Review — Round 1 (Pre-Architecture Gate)

**Reviewer:** ui-ux-designer subagent
**Stage:** Pipeline step 3 — round-1 [GATE], reviewing before solution-architect
proceeds
**Input reviewed:** `docs/PRD.md` only (independent review, per gate rules — no
other upstream doc consulted)
**Date:** 2026-07-06

---

## Verdict: **FAIL**

The PRD is thorough on the happy path and has clearly had real design thought
put into pause/resume integrity (F6) and difficulty legibility (F4 AC6). It
does not pass as-is because several flows a player will realistically hit —
wrong-key input during pause-equivalent states, simultaneous end-of-run
conditions, power-up stacking edge cases, and first-run legibility of the
lives/damage model — have no specified behavior. These are not polish items;
they are undefined states that solution-architect and code-implementer cannot
build correctly because the PRD doesn't tell them what "correct" is. Each is
itemized below with the specific AC it attaches to and the fix needed before
architecture locks in.

---

## Blocking findings (must be resolved before solution-architect proceeds)

### B1 — [Pause flow / F6] — Error prevention — No specified behavior for Esc pressed on non-play screens
**Issue:** F6 AC1 specifies Esc "during active play" freezes state and shows
the pause overlay. The PRD never states what Esc does on the title screen, on
the Game Over screen, or on the Victory screen (F8 AC6, F9). A player's most
natural exploratory action after a support-required game is "try the same key
everywhere." If Esc is undefined on those screens, implementation will pick
arbitrary behavior (possibly throwing a pause overlay over a Game Over
screen, or doing nothing with no feedback).
**Fix:** Add an AC (F6 or F8) stating Esc is a no-op (or explicitly disabled)
on title/Game Over/Victory screens, and that no-op is silent (no error, no
partial overlay).

### B2 — [Pause flow / F6 AC6] — Help users recognize/diagnose/recover from errors — "Quit" has two divergent outcomes with no shared feedback requirement
**Issue:** AC6 says Quit either closes the tab or falls back to a title
screen "where the browser blocks programmatic tab-close." This is correct
technically, but the PRD gives no requirement that the player be told which
outcome happened. If `window.close()` silently fails (the common case per
AC6's own admission — most browsers block script-initiated close on tabs the
script didn't open), the player who clicked "Quit" and expected the tab to
disappear needs to see *something* register — otherwise Quit looks broken
("I clicked Quit and nothing happened"). Right now the fallback path is only
specified as "clearly ends the run," not "clearly communicates why the tab
is still open."
**Fix:** Add an AC: when tab-close is blocked, the title-screen fallback
must make explicit (via visible text, not just implicit navigation) that the
tab could not be closed automatically and the run has ended — e.g., a title
screen that says "Run ended — you may close this tab" rather than a bare
title screen indistinguishable from first load.

### B3 — [Game Over / Victory transition / F8] — Consistency, User control — Two competing end conditions (F3 AC5 formation-reaches-bottom vs. F8 lives=0) can trigger in the same frame with no precedence rule
**Issue:** F8 AC4 and AC5 both independently end the run in Game Over: lives
hit 0, or the formation's lowest enemy reaches the player's row. Nothing
prevents both from becoming true in the same tick (e.g., a laser hit that
drops the player to 0 lives on the same frame the formation also reaches the
bottom row). This is not just an implementation nuance — it affects what
message the player sees, and inconsistent messaging across a race condition
is a legibility bug the PRD should foreclose, not leave to whichever engineer
resolves it first.
**Fix:** Add an AC establishing an explicit precedence/tie-break rule (e.g.,
"if both conditions become true in the same frame, display Game Over with a
single unified message, not a flicker between two message variants") so the
end state is deterministic and legible.

### B4 — [Power-up stacking / F7 AC7 + AC9] — Recognition over recall, Visibility of system status — Permanent multiplier has no visible indicator; player cannot recognize their current hit-power state
**Issue:** F7 AC7 allows the Permanent Hit-Power Multiplier to stack
multiplicatively across an entire 10-level run (e.g., ×1.8, ×3.24, ×5.83...).
AC9 further composes this with the temporary 5× power-up. Nowhere in F7, F9,
or F10 is there a requirement to show the player their current hit-power
state. A skill-chaser (segment C) or completionist tracking "why did that
enemy die in one hit at level 8 when it's supposed to be 3-hit" has no
on-screen way to know they're carrying a stacked permanent multiplier — this
violates recognition-over-recall (the player must remember every past catch
across 10 levels to explain what they're currently seeing) and visibility of
system status.
**Fix:** Add an AC requiring some visible indicator of current
permanent-multiplier state (even a simple icon count or a small "×N power"
readout), at minimum during/just after a catch, so the effect is legible and
attributable in the moment it changes — this also matters for P4 (catch-rate
measurement implies catches should be perceptible events).

### B5 — [Damage/lives flow / F8 AC2-3] — Error prevention, Visibility of system status — Post-hit invulnerability window has no defined duration or visible signal spec
**Issue:** F8 describes "brief invulnerability" after a life is lost (Q3
resolution and AC3) but never specifies (a) how long "brief" is, or (b)
whether the player is visibly distinguished as invulnerable during this
window, unlike the Indestructible Shield power-up which explicitly requires
visible distinction (F7 AC6). Without a visible signal, a player who just
lost a life and is now safe for N frames has no way to know they're safe —
they may over-correct (panic-move away, wasting the i-frame window) or
under-correct (assume they're still vulnerable and lose confidence in the
control scheme). This is inconsistent with F7 AC6's own precedent in the same
document (same underlying mechanic — invulnerability — has a visibility
requirement in one case and not the other).
**Fix:** Add an AC specifying (1) a concrete i-frame duration (even a
placeholder like "1.5s, tunable"), and (2) a visible distinction requirement
identical in spirit to F7 AC6, so respawn invulnerability is as legible as
power-up invulnerability.

### B6 — [First-run legibility / F9 AC2-3] — Match between system and real world, Minimalist design — "Self-evident" controls fallback has no acceptance test, making P1's 10-second bar unverifiable
**Issue:** F9 AC2 allows controls to be conveyed either via "at most one line
of on-screen text" OR "self-evident" with no on-screen text at all. "Self-
evident" is not a testable condition — two implementers could reasonably
disagree on whether a given first frame is self-evident. Given that P1 (load-
to-first-throw ≤10s, no external instructions) is a headline success metric
and AC3 restates the same 10-second bar, leaving the control-legibility
mechanism ambiguous between "always show one line of text" and "trust visual
self-evidence" is a meaningful risk: the safe, always-testable choice (show
the one-line text) is available and cheap, but the PRD doesn't mandate it.
**Fix:** Either mandate the one-line control text unconditionally (simplest,
removes ambiguity, near-zero cost against the minimalist-design heuristic),
or add an explicit, testable definition of "self-evident" (e.g., "no player
in usability testing takes a game action other than move/throw within the
first 2 seconds without on-screen text present"). Leaving it as an either/or
with no test is not acceptable for a metric this central to the product's
differentiation claim (UC6).

### B7 — [Enemy formation reaching player / F3 AC5, F8 AC5] — Error prevention — No grace/warning before the "formation reached bottom" loss condition
**Issue:** F3 AC5 and F8 AC5 both specify that the formation reaching the
player's row is an instant, unconditional Game Over — including, per B3
above, potentially simultaneous with other loss conditions. There is no
specified warning state (e.g., a visual/audio cue when the formation crosses
some threshold row before the final one) before this terminal condition
fires. Classic Space Invaders has the same instant-loss rule, so this is
defensible as "match between system and real world" for segment A (nostalgic
replayers) — but segments B/D (casual, first-time) have no equivalent mental
model and no warning. This is a first-time-player trap: an instant, no-warning
loss condition with no on-ramp.
**Fix:** At minimum, require a decision on record (even if the decision is
"no warning, by design, matches genre convention") rather than silence. If
the PRD intends to rely on genre familiarity, say so explicitly as a design
rationale so it isn't mistaken for an oversight at the architecture stage.
Recommend (non-blocking if B3/B7 tie-break above is fixed): a visible
"formation is approaching" state change on the second-to-last row so segments
B/D get one frame of warning consistent with error-prevention.

---

## Non-blocking findings (recommended, does not block architecture)

### N1 — [Pause overlay / F6 AC2] — Accessibility baseline — No keyboard-navigation spec for the pause menu's four options
**Issue:** F6 AC2 lists four labeled options (Resume, Restart Level, Restart
Game, Quit) but the PRD only specifies Esc as an input for pause/resume.
NFR-5 confirms desktop-keyboard-only, no mouse requirement is stated either
way. If the pause menu requires mouse clicks to select among the four
options, that's a keyboard-navigation accessibility gap inconsistent with
NFR-5's "keyboard only" framing for the rest of the game.
**Fix:** Add an AC specifying keyboard navigation within the pause menu
(e.g., arrow keys + Enter to select an option, or numbered hotkeys), so the
whole game — including its menus — is keyboard-operable, not just gameplay.

### N2 — [Score display / F10] — Accessibility baseline — No color-contrast or non-color requirement stated for score/lives/level HUD
**Issue:** NFR-9 correctly requires enemy damage state not be color-only.
No equivalent contrast/legibility requirement is stated for the HUD elements
(score F10, lives F8 AC1, level indicator F5 AC5) which are equally essential
information. This is a smaller gap than B4/B5 but worth closing at the same
time since NFR-9 already establishes the project cares about this class of
issue.
**Fix:** Extend NFR-9 (or add NFR-9b) to require sufficient contrast for all
persistent HUD text against the game's background art, since backgrounds are
dynamic (moving formations, projectiles) and could reduce contrast
situationally.

### N3 — [Restart flows / F6 AC4-5] — Consistency — "Restart Level" vs. "Restart Game" distinction may not be legible to a first-time player under stress
**Issue:** The difference between Restart Level (current level only) and
Restart Game (full reset including stacked power-ups per AC5) is a
meaningful, potentially costly distinction — a completionist (segment C) who
has spent 6 levels stacking a permanent multiplier could accidentally wipe it
by misreading "Restart Game" as "Restart Level" under the time pressure of a
pause-menu decision. This isn't a blocking issue since both options are
reversible only in the sense that a new run can always be started, but the
cost asymmetry (losing a whole run's progress via one misclick) is worth a
guard.
**Fix (non-blocking, recommended):** Add a lightweight confirmation step (or
at least a visually distinct/warning-colored treatment) on Restart Game
specifically, since it's the higher-cost, harder-to-undo of the two restart
options — consistent with error-prevention for a destructive action.

### N4 — [Power-up drop / F7 AC1] — Visibility of system status — Extra-drop probability (10%) is an internal tuning detail, not a player-facing spec — confirm no player-facing implication expected
**Issue:** Not a UX defect, but flagging for architecture: F7 AC1's "10% per
enemy death" extra-drop chance is stated as a concrete probability in the
PRD. If this number is meant to be tunable/balanced during implementation
(likely, since it's a balance lever), the PRD should be clear this is a
starting default, not a locked AC — otherwise a later balance change could be
read as an AC violation requiring a PRD amendment for routine tuning.
**Fix (non-blocking):** Clarify (a note is enough) that the 10% figure is a
tunable default subject to playtesting against the P4 ≥50%-caught target,
not a fixed acceptance criterion in itself.

---

## Cross-cutting observation

The PRD is strong where the owner made explicit decisions (F4's difficulty
table, F6's pause semantics, F8's lives model) — those flows are unusually
well specified for a v1 PRD, with correctness bars (P2's 100%) that a UX
reviewer rarely sees stated this precisely. The gaps above cluster
specifically around **state transitions and combinations the owner wasn't
asked about**: what happens when two terminal conditions overlap (B3, B7),
what happens on screens outside the three explicitly discussed (title/pause/
game-over) (B1), and what the player sees when an effect *compounds* rather
than occurring in isolation (B4, B5). This is a consistent pattern, not
scattered nitpicks — recommend the same "propose default, get owner sign-off"
process used for Q1-Q6 be applied to these seven items (B1-B7) before
solution-architect locks in state-machine design, since retrofitting new
states after the architecture is built is materially more expensive than
before.

---

## Summary for next step

**Verdict: FAIL.** Blocking items B1-B7 above must each get an explicit
decision (owner sign-off where it's a product-behavior choice, e.g. B7's
"no warning is intentional"; PM/architect default where it's a pure spec gap,
e.g. B1's no-op) and be reflected as new/amended PRD acceptance criteria
before solution-architect proceeds to state-machine and screen-flow design.
None of these require re-litigating the six already-resolved Q1-Q6 decisions
— they are net-new gaps the Q1-Q6 process didn't cover.
