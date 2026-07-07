# UX Design Review — Round 2 (Re-review)

**Reviewer:** ui-ux-designer subagent
**Date:** 2026-07-06
**Input reviewed:** `docs/PRD.md` only (independent re-review; prior round-1
review and resolution-log commentary intentionally NOT consulted as an input —
this review verifies the PRD's own text resolves the concerns, not the PRD
author's account of the resolution).
**Scope:** Round-1 gate re-review, focused per instruction on: Esc/pause
behavior across all screens; the two Game Over trigger conditions; permanent
hit-power multiplier visibility; invulnerability visibility/duration
consistency; first-run legibility/control-text testability; formation-approach
warning state. General heuristic pass applied per the `ux-heuristics` skill.

---

## Verdict: **PASS**

The PRD's acceptance criteria, as written, resolve all six focus areas with
specific, testable language. No blocking findings. Four non-blocking
observations are noted below for solution-architect / code-implementer
awareness; none require a return trip to product-manager before architecture
proceeds.

---

## Findings by severity

### Blocking

None.

### Non-blocking

**NB1 — [Game Over screen, F8 AC8] — Recognition/diagnosis heuristic —
Single unified Game Over message does not disclose which of the two trigger
conditions (lives=0 vs. formation-reached-row) fired — Consider (optional, not
required for PASS): a one-line sub-text variant ("Overwhelmed!" vs. "The
formation broke through!") under the same unified Game Over layout/heading, so
the determinism guarantee in AC8 is preserved (one screen, one code path, no
flicker) while still letting the player diagnose what killed them. Not
required to pass this gate — AC8's determinism requirement is satisfied as
written and was the actual prior blocking concern (UX-B3); this is a
polish suggestion only.**

**NB2 — [Invulnerability feedback, F7 AC6/AC11 vs F8 AC9] — Consistency
heuristic — F8 AC9 states post-hit i-frames use "the same visibility intent"
as the Indestructible Shield power-up (F7 AC6), but F7 AC11's HUD
temporary-effect indicator (with remaining-duration display) is explicitly
scoped only to the three catchable power-ups, not to post-hit i-frames. So the
two invulnerability sources get matching *character-level* treatment
(blink/flash/aura, non-color-only) but asymmetric *HUD-level* treatment
(Indestructible Shield gets a HUD countdown; post-hit i-frames do not).
This is a reasonable design choice (i-frames are a brief reactive mercy
window, not a strategic buff worth tracking in the HUD), but "same visibility
intent" in AC9 is soft enough that an implementer could read it either way.
Suggested fix: add one clause to F8 AC9 (or a shared note) making explicit
that HUD countdown display is intentionally power-up-only, so
code-implementer and code-reviewer don't have to infer it. Does not block
this gate — the character-level consistency requirement (the actual
substance of the prior finding) is met.**

**NB3 — [Control-text persistence, F9 AC2] — Minimalist design heuristic —
The control-text line is guaranteed present "at least until the player's
first shield throw," with fade after "so it does not clutter the playfield."
If a player only moves (never throws) for an extended period, no fade trigger
is defined, so the text could persist indefinitely — arguably correct
(favors legibility over minimalism when in doubt) but worth a one-line
clarification of intended behavior in that edge case for
code-implementer's benefit. Non-blocking; the core testability gap this AC
was written to close (UX-B6) is fully closed.**

**NB4 — [Formation-approach warning, F3 AC6 / Q7] — Traceability, not a UX
defect — F3 AC6's existence is conditional on Q7, which remains open pending
owner sign-off (the PRD is transparent about this and provides an explicit
owner veto path). The AC's *content* as currently written (concrete
one-row-early threshold, non-color-only signal, no change to the underlying
loss rule) is sound, specific, and testable, and fully resolves the prior
finding (UX-B7) on its own terms. Flagging only so solution-architect is
aware this specific AC could be removed by a later owner decision without
otherwise affecting the rest of F3. Not a gate blocker — the PRD's own gate
convention (§Open Questions Q7) already treats this as non-blocking for
architecture.**

---

## Focus-area verification detail

### 1. Esc/pause behavior across all screens
- Active play → Esc opens pause overlay, freezes all motion (player, enemies,
  projectiles, power-ups, timers) — F6 AC1. Specific and testable.
- Non-play screens (title, Game Over, Victory) → Esc is an explicit silent
  no-op with no partial overlay/glitch — F6 AC8. This directly and
  specifically closes the prior concern with an enumerated, closed list of
  screens rather than a vague "elsewhere."
- Resume path is doubly available (explicit Resume option, or pressing Esc
  again) — F6 AC2/AC3. Power-up timers correctly pause/resume without
  drift — F6 AC7.
- Quit's blocked-tab-close fallback now has mandated visible explanatory
  text so it doesn't read as broken — F6 AC9, with a concrete copy example.
- Pause menu is fully keyboard-operable (Up/Down + Enter), with visible
  non-color-only selection highlighting — F6 AC10. Satisfies the
  accessibility baseline (keyboard-navigable, not color-alone).
- Destructive Restart Game now has a confirmation guard; non-destructive
  Restart Level does not — proportionate friction, correctly scoped — F6
  AC11.
- **Verdict: resolved.** The only residual item is NB-level (see focus area
  overlap with NB1/NB4 above is n/a here) — no gap found in the Esc/pause
  flow itself worth flagging even as non-blocking beyond what's already
  covered.

### 2. The two Game Over trigger conditions
- Both conditions (lives=0 — AC4; formation-reaches-row — AC5) are named
  explicitly, and their simultaneous-truth case is resolved deterministically
  to one screen, one message, no flicker/queueing — F8 AC8. This is
  specific enough to test (a QA scenario can force both conditions in the
  same tick and assert exactly one screen renders).
- **Verdict: resolved.** See NB1 for an optional (non-blocking) diagnosis-
  quality polish suggestion.

### 3. Permanent hit-power multiplier visibility
- Persistent HUD readout (concrete example given: "Power ×3.24") plus a
  distinct on-catch confirmation moment (flash/increment) — F7 AC10.
  Explicitly tied to NFR-9's HUD legibility/contrast requirement.
- **Verdict: resolved.** Fully specific and testable; no residual finding.

### 4. Invulnerability visibility/duration consistency
- Indestructible Shield (power-up): 8 s, visibly distinguished,
  non-color-only — F7 AC6.
- Post-hit i-frames: 1.5 s tunable default, visibly distinguished,
  non-color-only, explicitly cross-referenced to match F7 AC6's visibility
  intent — F8 AC9.
- Durations are intentionally different (reward window vs. mercy window) —
  this is a deliberate, disclosed design choice, not an unresolved
  inconsistency, and the PRD says so directly.
- **Verdict: resolved** at the level the prior finding (UX-B5) required
  (a concrete duration + a visibility requirement matching the power-up
  precedent). See NB2 for a non-blocking wording-tightness suggestion on the
  HUD-countdown-vs-character-flash distinction.

### 5. First-run legibility / control-text testability
- The prior untestable "or self-evident" fallback is explicitly removed —
  F9 AC2. A single always-present control-text line is now mandatory, with
  a concrete example string, a legibility tie-in to NFR-9, and a defined
  minimum persistence window (until first throw).
- P1's 10-second first-throw bar and B4's 3-second first-input bar are both
  now stated as verifiable specifically because AC2 guarantees the on-screen
  text exists — F9 AC3. This closes the circularity/untestability problem
  the prior review presumably flagged.
- **Verdict: resolved.** See NB3 for a trivial edge-case clarification,
  non-blocking.

### 6. Formation-approach warning state
- A concrete, non-color-only warning is triggered when the formation's
  lowest living enemy crosses a defined one-row-early threshold, before the
  terminal loss condition fires — F3 AC6. The loss rule itself (F3 AC5) is
  explicitly unchanged.
- Rationale for adding the warning (serves segments B/D who lack a genre
  mental model) is documented, and an owner veto path exists (Q7) without
  blocking architecture.
- **Verdict: resolved** as written. See NB4 — purely a traceability/status
  note that Q7 is still open, not a defect in the AC's content.

---

## General heuristic pass (beyond the six focus areas)

No new blocking issues found. Notable positives:
- Simultaneous-opposing-key input (Left+Right) has explicit defined behavior
  (cancel, no undefined state) — F1 AC5. Good error-prevention practice.
- Damage-state legibility for multi-hit enemies is required to be
  non-color-only — F4 AC6 — consistent with the NFR-9 accessibility
  baseline applied throughout.
- The 10%-extra-drop-rate tunability note (F7 AC1) correctly distinguishes
  a locked AC ("≥1 guaranteed drop/level", "P4 ≥50% caught") from a tunable
  balance parameter, preventing scope-creep disputes later in the pipeline.
- HUD contrast against dynamic backgrounds is now a named requirement
  (NFR-9b) covering all four persistent HUD elements (score, lives, level,
  multiplier) — addresses a real WCAG-adjacent legibility risk (moving
  background art behind text) that is easy to miss until implementation.

No further blocking or non-blocking findings beyond NB1-NB4 above.

---

## Gate disposition

**PASS.** Solution-architect may proceed (pipeline step 4). NB1-NB4 are
informational and do not require a return trip to product-manager; they may
be picked up opportunistically by code-implementer/code-reviewer during
implementation, or left as-is, at the team's discretion.
