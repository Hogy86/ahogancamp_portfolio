# UX Design Review — Addendum v2, Round 1 (Pre-Architecture Gate)

**Reviewer:** ui-ux-designer subagent
**Stage:** Round-1-style gate review of `docs/PRD-addendum-v2.md` (features
F11-F19), reviewed independently before any implementation plan exists.
**Input reviewed:** `docs/PRD-addendum-v2.md` (v2 — FINAL) only, cross-referenced
against `docs/PRD.md` (v1, for the ACs it amends) and
`docs/ux/design-review-round1.md` / `design-review-round3.md` (v1 UX history,
for established conventions this addendum should stay consistent with). No
implementation plan, code, or other agent's summary was consulted.
**Date:** 2026-07-07

---

## Verdict: **FAIL**

This addendum is unusually disciplined about traceability — every feature
names the exact v1 AC it amends, and all six flagged ambiguities (Items A-F)
were resolved by the owner before this document was finalized. However, the
review scope requested for this gate (the five *new* UI surfaces: F18 intro,
F19 celebration, F11 indicator collapse, F12 boss phase, F13/F14/F17 redesigns,
F15/F16 bounce-and-catch) surfaces eight blocking gaps that were not covered by
Items A-F and are not resolved anywhere in the document. Several of these
directly collide with **already-shipped v1 acceptance criteria** (NFR-1, F9
AC3, F7 AC10b, F10's traced goal) without being called out in this addendum's
own "Supersedes / amends" sections — which is exactly the kind of untraced
collision this project's traceability convention exists to prevent. None of
these require re-litigating Items A-F; they are net-new gaps this addendum's
own review process didn't cover, in the same spirit as v1's B1-B7 findings.

---

## Blocking findings

### B1 — [F18 level-intro / NFR-1, F9 AC3] — Consistency, traceability — The 3-second level-start freeze is not reconciled against the existing "first controllable input ≤3s" metrics
**Issue:** F18 AC1 mandates a 3-second frozen intro on **every** level start,
explicitly including "new-run start" — i.e., level 1 of a brand-new game. But
v1 already has two acceptance-gated metrics about time-to-first-input:
NFR-1 ("page load to first controllable input ≤3s on typical broadband") and
F9 AC3 ("reach first controllable input within 3 seconds"). Under F18, the
player literally cannot move or throw until the level-1 intro's 3 seconds
elapse, which means real first-controllable-input time becomes *(page load
time) + 3s minimum*, not ≤3s. F18's own "Supersedes / amends" section calls
out F5 AC1 and F6 as amended, but does not mention NFR-1 or F9 AC3 at all —
this is an untraced collision with two existing v1 ACs, not just a new
feature layered on top.
**Fix:** Add an explicit amendment note reconciling F18 with NFR-1/F9 AC3 —
e.g., redefine "first controllable input" as "the input becomes live," with
the 3s intro understood as separate from (and additive to) that budget, and
get explicit owner sign-off that the level-1-of-a-new-run intro is an
acceptable, intentional change to the B4/P1 first-input metric. Silence on
this is not acceptable given both are named, numeric, acceptance-gated v1
metrics.

### B2 — [F18 level-intro / F18 AC1] — Error prevention, minimalist design ("shortest path to value") — No skip mechanism for the countdown on repeated Restart Level
**Issue:** F18 AC1 explicitly applies the full 3-second frozen intro to
**Restart Level** as well as fresh level starts. Segments A (nostalgic
replayer) and D (time-boxed casual) are both characterized in the v1 PRD as
valuing "instant restart" (segment D: "values instant load + instant restart
above all"; UC7: "restart a level ... without page reload"). A player dying
repeatedly on levels 1-4 while learning the bounce/catch mechanic (F15/F16,
itself a harder mechanic to learn — see B5/B6 below) will now eat an
unskippable 3-second dead freeze on every single retry, with no way to
shorten or skip it. This is a direct tension with the project's own stated
value proposition for its most retry-heavy segments, introduced by this
addendum and not present in v1 (v1 restarted directly into play).
**Fix:** At minimum, get an explicit owner decision on record (mirroring the
Q7/B7 pattern from v1): either accept the dead time as intentional per the
owner's literal brief text ("every level" with no restart carve-out), or add
a skip affordance (e.g., holding Space/Enter during the intro fast-forwards
the fade only, not the underlying rule) for Restart Level specifically. Do
not let this go into implementation as a silent default.

### B3 — [F12 boss phase / F12 AC3, F18 AC7] — Visibility of system status, match with UC3 ("visibly escalating challenge") — The boss appears with zero warning, and the addendum acknowledges this without resolving it
**Issue:** F12 AC3 says the boss "appears only after every regular enemy...
is destroyed," with no telegraph, delay, or cue. F18 AC7 explicitly states
there is **no** "LEVEL [N]"-style countdown for the boss phase, and its own
parenthetical admits: *"If the owner wants a 'BOSS' callout before the boss
appears, that is a separate request — noted, not assumed."* This means a
5×-size, boss-uniquely-colored enemy — the single biggest escalation event in
the entire 10-level run — can appear on the same frame the last regular
enemy dies, with no visual or temporal cue distinguishing "level cleared" from
"boss incoming." This directly undercuts UC3's "experience visibly escalating
challenge" and P3's difficulty-legibility goal, and is inconsistent with this
same addendum's own precedent: F18 establishes that *every* significant level
event (level start) gets a 3-second legible announcement, but the largest
mid-level event (boss spawn) gets none. A player could reasonably perceive the
level as "won" for a beat before being blindsided.
**Fix:** This should not be left as a noted-but-unresolved gap in a document
marked "FINAL." At minimum, get an explicit owner decision on record (same
pattern as B1/B2): either confirm "no callout, boss ambush is intentional" as
a deliberate design choice (defensible for segment A/C who expect boss fights
to be a surprise spike), or add a lightweight signal (even a non-blocking one,
e.g., a brief "screen edge flash" or a short "BOSS" text cue that does not
require a full 3-second freeze) before the boss becomes active. Either
answer is fine; leaving it as "noted, not assumed" going into implementation
is not.

### B4 — [F15/F16 shield bounce / F15 AC4-AC7, F16 AC2] — User control, recognition over recall — Bounce trajectory is not predictable or trackable by the player in real time, undermining the mechanic's core "catch for a life" hook
**Issue:** F15's zone table is fully deterministic *in the implementation*,
but nothing in F15 or F16 gives the **player** any way to perceive, in the
moment, which zone a fast-moving shield is about to strike on a fast-moving,
small enemy hitbox — there is no trajectory preview, no bounce-path trail, no
slow-down-on-bounce cue, nothing. F15 AC6 further specifies the shield keeps
its full speed through every bounce. The result is that the single biggest
new gameplay hook this addendum introduces — "catch your own bounced shield
for a life" (F16 AC2) — asks the player to position themselves to intercept a
projectile whose path they had no realistic way to anticipate before it
happened, and can barely track once it's bouncing at full speed off small,
moving targets. This risks the mechanic reading as *lucky* rather than
*skill-based*, which undermines its value as a reward loop (P4-adjacent
"catch a falling power-up" precedent in v1 at least gives the player a slow,
falling, visually obvious target — this new catch target is fast, erratic,
and enemy-dependent).
**Fix:** Add at least one legibility aid to the spec before implementation:
a short visual trail/afterimage on the shield (helps players learn its recent
path and anticipate the next bounce), and/or confirm via owner sign-off that
"the catch is meant to be a low-probability bonus, not a learnable skill" if
that's the intended design. As written, this is a legibility gap serious
enough that code-implementer has no spec basis for building any player-facing
predictability aid, and test-writer has no AC to test "the player could
plausibly react to this."

### B5 — [F16 shield catch / F16 AC2] — Recognition over recall, help users recognize success — The "catch for an extra life" mechanic has zero discoverability and no catch-moment feedback
**Issue:** F9 AC2 (still binding, unamended) mandates a persistent one-line
control string at level start ("← → move · Space throw · Esc pause"); this
addendum does not add anything to that line, nor introduce any other
on-screen hint, about the fact that a bounced shield can be caught for a
life. A first-time player has no way to discover this mechanic except by
accident. Compounding this, unlike the **Permanent Hit-Power Multiplier**
catch in the very same product (F7 AC10b, v1: "a distinct catch-moment
feedback... a brief on-catch confirmation... so each permanent catch is a
perceptible event"), F16 AC2 specifies the life-gain effect but **no**
equivalent catch-moment feedback requirement — a player who catches a
returning shield only sees the lives counter (F8 AC1) silently tick up one
frame, with no confirmation tying that increment to the catch action they
just performed. This is inconsistent with a pattern this same document (via
its v1 predecessor) already established as necessary for a catch event to be
"legible and attributable in the moment" (F7 AC10b's own language).
**Fix:** Add an AC requiring a distinct catch-confirmation cue (visual flash,
brief text like "+1 LIFE", or similar) at the moment of a shield catch,
consistent with F7 AC10b's precedent, and consider adding the mechanic to the
persistent control-line text or an equivalent one-time hint (e.g., shown once
on first successful bounce) so it is discoverable without a support ticket.

### B6 — [F17 enemy redesign / F17 AC6, NFR-9(a)] — Accessibility baseline (non-color-only signal) — Damage-state overlay legibility against the darkest toughness tiers (including the boss) is unaddressed
**Issue:** F17 AC3 introduces a white→gray→dark toughness scale, and AC5 puts
the boss at the *darkest* end of that scale (near-black, with only a contrast
floor against the *background* specified). F17 AC6 separately requires the
existing non-color-only damage-state cue (F4 AC6's crack overlay) to "remain
legible on top of the toughness base color" and be "visually distinct from
the toughness-color scale." Nothing in F17 specifies *how* a crack/damage
overlay stays legible on the darkest bodies — if the overlay is rendered as a
fixed dark line color (as the v1 crack-line implementation plausibly would
default to, since it previously only had to read against an orange/purple
body), it risks being effectively invisible against a near-black 4-hit enemy
or especially the near-black boss — precisely the tier where "can the player
tell this tough enemy took a hit" matters most for P3 legibility. This is a
new failure mode introduced by combining F17's darker toughness scale with
F4 AC6's pre-existing damage cue; neither AC individually anticipates the
combination.
**Fix:** Add an explicit AC (or amend F17 AC6) requiring the damage overlay's
rendering to be contrast-adaptive — e.g., "the damage overlay uses a color
that maintains a minimum contrast ratio against that enemy's specific base
color" (lighter strokes on dark bodies, darker strokes on light bodies) —
rather than leaving overlay color as an implementation detail that could
pass on white enemies and silently fail on the darkest ones.

### B7 — [F11 single power-up slot / F11 AC3] — Error prevention — Catching the "wrong" power-up type is now a real, unavoidable downgrade, and falling power-ups are not visually distinguished by type before catch
**Issue:** Under v1, catching any power-up was always a net gain (three
temporary effects could overlap freely). F11 AC3 changes this: catching a
different-type temporary power-up while one is already active **cancels the
active effect immediately**, discarding its remaining time. This means, for
example, a player relying on Indestructible Shield to survive a dense laser
volley can have it involuntarily cancelled mid-danger by colliding with a
falling 3× Speed or 5× Hit Power drop — an outcome that is now actively
*harmful* to the player, not merely neutral. Neither this addendum nor the v1
PRD (F7) specifies that the four power-up types are visually distinguishable
by icon/shape/color while still falling and before the catch collision
happens. In v1 this gap was low-stakes (any catch was fine); under F11 it
becomes a genuine error-prevention gap — the player has no way to identify,
in time to dodge, that an incoming drop is the "wrong" type and would
downgrade their current buff.
**Fix:** Add an AC (either here or as an F7 amendment) requiring each of the
four power-up types to be visually distinguishable while falling (distinct
icon/shape/color, non-color-only per NFR-9), so a player under an active
temporary effect has a fair chance to choose to dodge an unwanted
replacement rather than being blindsided by an involuntary downgrade.

### B8 — [F19 Game Complete / F19 AC2, AC5, AC7; v1 F10 traced goal] — User control — The fixed, non-extendable 5-second auto-return conflicts with the score's own traced "screenshot a high score" purpose
**Issue:** F10 (v1) explicitly traces to "serves segment C's 'screenshot a
high score' motivation," and F19 AC7 requires the final score to be shown as
part of the Game Complete sequence specifically to preserve that intent.
However, F19 AC2/AC5 make the sequence a hard 5-second timer with **no**
player control — it is not pausable/interruptible (AC6) and auto-returns to
title with no input option to linger, replay, or extend. Combined with
"multiple distinct colors" of firework explosions animating "around" the text
(AC4), a player who wants to actually read/screenshot their score has a
narrow, uncontrolled 5-second window that may also be visually busy. This is
a real tension between two ACs in the same document (AC4's celebratory
fireworks vs. AC7's score-legibility purpose) with no resolution specified,
and it works against the specific segment-C motivation this feature exists
to serve.
**Fix:** Either (a) confirm with the owner that a fixed, non-extendable 5s
window is acceptable despite the screenshot use case (many players can
screenshot in 5s, so this may be a reasonable accept), or (b) add a
lightweight escape hatch — e.g., pressing any key holds the screen (pauses
the 5s timer) until a second key press advances to title, which doesn't
violate the "auto-return, no input required" default (AC5) since it only
adds an optional path, not a required one. At minimum this needs a recorded
decision, not silence, given it directly contradicts a named upstream goal.

---

## Non-blocking findings (recommended, does not block architecture)

### N1 — [F19 Game Complete] — Visibility of system status — Undefined behavior if the player presses a key during the celebration
**Issue:** F19 AC5 specifies the sequence "auto-returns... with no input
required," but does not state what happens if the player *does* press a key
(Esc, Enter, arrow, Space) during the 5 seconds. Left unspecified, an
implementer could accidentally let a stray Enter press interact with
whatever state the title screen initializes into, or could do nothing at
all — either is fine, but the v1 precedent (F6 AC8: Esc is a documented
silent no-op on non-play screens) suggests this should be stated explicitly
rather than left implicit.
**Fix:** Add a one-line AC: "input during the Game Complete sequence has no
effect; the sequence always runs to completion regardless of any key
pressed," mirroring F6 AC8's precedent.

### N2 — [F13/F14 shield-avatar same-color] — Accessibility baseline / minimalist design — Shield and avatar share an identical fill color, which could reduce legibility at the moment of catch
**Issue:** F14 AC2 mandates the shield use the *exact same* blue constant as
the Vanguard avatar (F13 AC3). The two are different shapes (circle vs.
humanoid), which should keep them distinguishable in most cases, but at the
specific moment a bounced shield closes in on the player for a catch (F16),
having zero color differentiation between the incoming projectile and the
player's own body could make the final approach slightly harder to track
precisely — the exact moment where B4/B5's predictability concerns are most
acute.
**Fix:** Consider a thin outline/stroke on the shield (a shape-level
distinction, not a color change, so it doesn't violate F14 AC2's identical-
fill requirement) to keep it visually separable from the avatar at close
range. Low cost, does not conflict with any AC as written.

### N3 — [F17 red eyes/lasers on dark bodies] — Accessibility baseline — Red accent contrast against the darkest toughness tiers not explicitly covered
**Issue:** F17 AC5 puts a contrast floor on the boss's *body* color against
the black background, but AC2 (red eyes) and AC4 (red lasers) don't have an
equivalent explicit floor when set against the darkest body tiers themselves
(as opposed to the background). Red accents can read as lower-contrast for
some colorblind users, and a near-black boss body could reduce the eyes'
perceived contrast further.
**Fix:** Extend AC5's contrast-floor language to also cover the red
eye/detail elements against their own (dark) body color, not just the boss
body against the background.

### N4 — [F13/F17 humanoid silhouettes at formation density] — Minimalist design / legibility — Four distinguishable body regions per enemy, at up to 54 enemies on screen (level 10), is an untested rendering-density risk
**Issue:** F13 AC1 and F17 AC1 both require "a viewer can point to" four
distinct regions (head/arms/torso/legs) per figure. This is plausibly
achievable for an isolated sprite reviewed at rest, but level 10's formation
is 6×9 = 54 enemies (per v1 F4's table, still the base formation size this
addendum doesn't change) plus the player, lasers, and a possibly-bouncing
shield all on screen at once. At the small on-screen scale a 54-enemy
formation implies, "arms" as a distinguishable region on every individual
enemy is a real rendering-density risk this addendum doesn't test for.
**Fix:** Not a spec change — recommend this be called out explicitly as a
test/playtest criterion ("regions must remain distinguishable at max
formation density, not just in isolation") so code-reviewer/test-validator
know to check it at scale, not just via a single-sprite screenshot.

### N5 — [F15 zone table] — Design/balance note, not a pure legibility defect — "STOP" outcomes may dominate the most natural play pattern, making bounces (and the catch mechanic) rare in organic play
**Issue:** A shield thrown straight up from directly beneath an enemy most
naturally strikes that enemy's bottom-center face — which is a **STOP**
outcome per the zone table, not a bounce. Bounces require hitting a corner or
side zone, which likely requires deliberate horizontal offset/aim. If the
most common, unaimed throw pattern mostly produces stops rather than bounces,
the marquee new mechanic (chained bounces, catch-for-a-life) may be
under-exposed in typical play, compounding the discoverability concern in B5.
**Fix:** Not blocking — flag for playtesting attention once implemented;
consider whether the corner/side zone widths (F15 AC7's "outer N%" boundary)
should be tuned generously enough that bounces are a reasonably common
outcome, not a rare one, if the intent is for players to learn and use this
mechanic.

---

## Cross-cutting observation

The pattern across B1, B3, B8, and B4/B5 is the same one v1's round-1 review
found: this addendum is strongest where the owner was asked a direct question
(Items A-F all have clean, unambiguous resolutions), and weakest exactly where
a *new* UI surface interacts with an *existing*, already-approved metric or
precedent (NFR-1/F9 AC3 vs. F18; F7 AC10b's catch-feedback precedent vs. F16;
F10's screenshot-goal vs. F19's rigid timer) or where the addendum itself
flags awareness of a gap but declines to resolve it (F12/F18's boss-callout
note). Recommend the same "propose a default, get owner sign-off" treatment
used for Items A-F be applied to B1-B8 before solution-architect locks in the
level-intro/boss-phase/bounce-physics state machine, since — per this
project's own experience with v1 — retrofitting new states after architecture
is built is materially more expensive than resolving them now.

---

## Summary for next step

**Verdict: FAIL.** Blocking findings B1-B8 must each get an explicit decision
(owner sign-off where it's a product-behavior tradeoff — B2, B3, B8 — or a
PM/architect default plus an added AC where it's a pure spec gap — B1, B4,
B5, B6, B7) and be reflected as new/amended acceptance criteria in the
addendum before solution-architect proceeds. None of these reopen the six
already-resolved Items A-F; they are net-new gaps in the newly-introduced
surfaces (F11, F12, F15, F16, F17, F18, F19) that this addendum's own
open-questions process didn't cover.
