# Mobile UX Design Review — Round 1 (Pre-Architecture Gate)

**Reviewer:** mobile-ui-ux-designer subagent
**Stage:** Mobile Pipeline Step 3 — round 1 **[GATE]**, reviewing before
mobile-solution-architect proceeds
**Date:** 2026-09-25
**Input reviewed:** `docs/mobile/PRD-mobile.md` (§0-§8, incl. owner decisions
OQ-M1..OQ-M10 in §7), `docs/mobile/market/play-store-research.md`,
`docs/mobile/market/listing-draft.md`, `docs/PRD.md`, `docs/PRD-addendum-v2.md`,
`docs/ux/design-review-round1.md` and `-round2.md` (website, for what's already
validated), `src/config/constants.ts`, `src/style.css`.

---

## Verdict: **FAIL**

`docs/mobile/PRD-mobile.md` is unusually thorough for a mobile addendum — the
touch-control, safe-area, lifecycle, and back-gesture requirements (M2-M5) are
already close to review-ready, and every owner decision (OQ-M1..M10) is
justified with real alternatives. This is not a "start over" FAIL. It is a
FAIL because three of the PRD's own numeric commitments do not fit together
on the device the PRD itself names as the stress case (the 640×360 dp
low-end/small-phone profile), and one required behavior (direction-switch
sliding between ◀/▶) has no defined input-handling model. If
mobile-solution-architect locks in a layout/input approach before these are
resolved, the smallest phones in the device matrix will ship with either
undersized controls, controls that clip system gesture zones, or a broken
slide-to-switch-direction gesture — which is exactly the "touch-target /
HUD-fit" failure pattern `play-store-research.md` §1 identifies as this
genre's #2 killer. Fixes are small (layout arithmetic + one clarifying AC),
not a redesign.

---

## Decisions reviewed and validated (no change required)

### 1. Touch control scheme
**Validated: on-screen buttons — ◀ ▶ (left thumb) / THROW (right thumb) /
PAUSE (small, top of a side column); tap-to-fire, not auto-fire or
press-and-hold-repeat.**

Alternatives on record in the PRD (OQ-M5) and re-considered here:
- **Drag-to-steer** (Vanguard follows the thumb) — rejected correctly. It
  quietly changes F1's movement rule (constant speed, discrete accel/decel,
  opposing-key cancel) into an analog-position rule; that's a shared-game-rule
  change requiring a PRD amendment and rebalancing, not a touch-mapping
  decision. Fixed buttons map 1:1 onto the existing keyboard state machine
  with zero rule risk.
- **Tilt controls** — not raised in the PRD; rejected here too. Tilt has no
  keyboard equivalent (breaks the "same rule, different trigger" mapping
  principle in PRD §0), fails badly one-handed or lying down, and this genre's
  comparables (`play-store-research.md` §1) uniformly ship buttons or drag,
  never tilt, for precision formation-shooters.
- **Auto-fire** — not proposed, correctly. F16 AC3's "one shield in flight"
  rule already gates throw rate; auto-fire would either spam no-ops against a
  dimmed button (bad affordance) or require changing the underlying rule.
  Tap-to-fire matches the Space-bar behavior exactly.

Thumb rest: ◀▶ bottom-left, THROW bottom-right, PAUSE top-right — correct for
a landscape two-handed grip and consistent with every comparable's layout.

### 2. Orientation and tablet/foldable layout
**Validated: landscape-only, both landscape directions, tablets/foldables
scale down rather than get a bespoke layout (OQ-M4 (a), OQ-M7 (a)).**
Zero game-rule risk, matches the fixed 4:3 playfield, and M2.9/M2.10 correctly
treat a fold/unfold or forced-portrait window as a pause event rather than a
squashed render. One clarification needed — see F1 below.

### 3. Back button/gesture per screen
**Validated in principle** — the M5 table (pause during play, resume from
pause, cancel from the restart-confirm prompt, close-and-return from
help/settings, title-from-Game-Over, leave-app from title) is a complete,
enumerated state table with no "elsewhere" gap, which is exactly the pattern
the website's own round-1 review (`docs/ux/design-review-round1.md` B1) had to
demand after the fact. Mobile gets it right from the start. The one
intentional exception — back is a silent no-op during the Game Complete
celebration — is a deliberate, disclosed mirror of the website's already-PASSed
Esc exemption (F19 AC9, validated in `docs/ux/design-review-round2.md` item 2),
not an oversight. No change required.

### 4. Pause/resume behavior
**Validated.** Auto-pause on any loss of foreground (M4.1), no simulated
time passing while away (M4.2), and — critically — **no auto-resume**: the
player must tap Resume every time (M4.3). This is the correct call for touch:
a keyboard player's hands stay near Esc; a phone player's hands are off the
glass entirely while backgrounded, so resuming straight into live fire on
return would cost a free hit. What the player sees on return: the pause menu,
every time, matching where they'd land if they'd pressed PAUSE themselves —
good consistency (same state, reached two different ways, looks identical).

### 5. First-launch "how to play"
**Validated.** One-time overlay after Start, before the level-1 countdown
(M8.1), reachable again from the title screen (M8.2), not duplicated into the
pause menu (correctly keeps F6 AC2's four pause options unchanged). Tap "Got
it" to dismiss and proceed — single, unambiguous exit, no timeout-based
dismissal that could fire while the player is still reading.

### 6. Haptics
**Validated default: none in v1**, consistent with PRD §6 (haptics/sound
listed as out-of-scope, requiring a *shared* decision since the game currently
has no audio/haptic feedback model at all on either platform — PRD.md Q6).
Recommendation for the record, not a blocker: a single short haptic pulse on
life-lost and on catching a power-up would be cheap, Android-only (native
`Haptics` plugin call triggered from existing shared game events, no shared
rule change), and directly reinforces P4/segment-C's "catches should be
perceptible" concern already raised in the website's round-1 review (B4). Do
not add it to v1 scope without an owner decision; flagging only so it's a
known, cheap v1.1 candidate rather than rediscovered later.

---

## Blocking findings (must be resolved before mobile-solution-architect proceeds)

### F1 — [Global] — Consistency — Orientation lock scope is ambiguous across app states
**Issue:** M2.1 says "the app runs in landscape only," but the PRD never
states whether the lock applies from cold start (splash/title) or only once
active play begins. If the OS is allowed to show the title screen in whatever
orientation the phone is currently held, then forcing landscape at the first
Start tap causes a jarring, unrequested rotation exactly when the player is
trying to focus on the "how to play" overlay (M8.1) — the opposite of the
"visibility of system status" and "minimalist design" heuristics this
sequence needs to nail for MG4 (≥80% first-throw-within-10s).
**Fix:** Add an explicit AC: the Android activity/window declares a fixed
landscape orientation from process start (splash screen included), so there
is never a mid-session rotation prompt or reflow. (Cross-reference M2.10's
"portrait window" handling, which already assumes landscape is the only
supported shape — this just needs to be stated for *every* screen, not only
during play.)

### F2 — [Small-phone control layout, M2.4 + M3.1] — Error prevention, minimalist design — The 640×360 dp profile's own numbers don't fit
**Issue:** Do the arithmetic the PRD implies. At 640×360 dp landscape, the
800×600 (4:3) playfield scaled to fill the 360 dp height is 480 dp wide,
leaving 160 dp total side margin — 80 dp per side column if split evenly
(M2.4's "controls sit outside the scaled playfield in the side columns").
THROW alone fits in an 80 dp column at the M3.1 floor for this profile
(≥56 dp). But ◀ and ▶ are two separate ≥56 dp targets that must sit
side-by-side so a finger can slide from one onto the other without lifting
(M3.3) — 56 + 8 (M3.1's minimum adjacent-target gap) + 56 = **120 dp**,
which does not fit in an 80 dp column. This is not a hypothetical edge case;
640×360 dp is the PRD's own named low-end reference profile (M10 reference
profiles), so this is the device the design is explicitly supposed to work on.
**Fix — one of, decided before architecture, not left to the developer:**
1. **(Recommended) Uneven column widths.** Stop treating the side margin as
   split 50/50. Since THROW only needs ~64-80 dp and ◀▶ together need
   ~120+ dp, size each column to its own contents and let the playfield sit
   off-center within the remaining space (scale the playfield down slightly
   further than M2.2's "largest size that fits" would otherwise allow, just
   enough to free the extra ~40 dp on the movement side). This preserves the
   left/right spatial mapping (◀ physically left of ▶, matching "match
   between system and real world") without shrinking either button below its
   AC floor.
2. Alternative: shrink ◀▶ further on this profile only (e.g., 44 dp) — **do
   not** do this; it drops below Android's 48 dp accessibility minimum that
   M3.1 itself is built on, and reintroduces the exact "touch-target ratio"
   complaint `play-store-research.md` §1 names.
3. Alternative: stack ◀/▶ vertically instead of side-by-side — rejected as a
   primary fix; it breaks the left/right spatial metaphor for a control the
   player will use thousands of times per run, and PRD's own wording ("slide
   from ◀ onto ▶") assumes a horizontal relationship.
Whichever option is chosen, `docs/mobile/architecture/mobile-architecture.md`
must state the exact column widths at the 640×360 dp profile and show the
arithmetic closes (no overlap, no sub-48dp target), and
`docs/mobile/tests/device-matrix.md` must include a screenshot check against
this exact number.

### F3 — [Small-phone control layout, M2.3 + M2.5] — Error prevention — Gesture-exclusion insets are not budgeted into the same 80 dp column
**Issue:** M2.3 requires controls stay clear of the system gesture zone; on
gesture-navigation Android, edge-swipe zones are typically ~24 dp wide from
the physical screen edge. The side-column math in F2 above (and the PRD's own
implicit 80/80 split) treats the full side margin as available for controls,
with no inset subtracted for the gesture-exclusion zone. If ◀▶/THROW are
placed flush to the screen edge to maximize size, an accidental edge swipe
while reaching for a button will fire Android's back gesture — which M5
correctly maps to "pause," so the failure mode is "the game keeps
interrupting itself," not a crash, but it directly contradicts M3.7's "no
stray gestures" intent and will read as a broken control to players exactly
as `play-store-research.md`'s pause-button and fire-button complaints do.
**Fix:** Add an explicit inset requirement to M2.3: touch controls' outer
edge sits at least [gesture-exclusion width, e.g. 24 dp — architect to
confirm against Android's current `WindowInsetsCompat` gesture-inset API,
this exact number may need a device-specific query rather than a hardcoded
constant] from the physical screen edge, and fold this inset into the same
column-width arithmetic F2 requires. This further tightens the already-tight
640×360 dp case, reinforcing that F2's fix must be the "uneven columns" option
that frees real width, not a cosmetic tweak.

### F4 — [Touch input handling, M3.3/M3.4] — Error prevention — No defined hit-testing model for the ◀→▶ slide-to-switch gesture
**Issue:** M3.3 requires "sliding a finger from ◀ onto ▶ without lifting
switches direction," and M3.1 requires ≥8 dp of dead space between adjacent
targets. Standard discrete per-element `touchstart`/`touchend` listeners will
not detect a slide that passes through the dead-space gap between two
separate DOM/canvas hit regions — the touch either "sticks" to whichever
element captured the initial `touchstart` (Pointer Capture default), or drops
input entirely while crossing the gap, producing exactly the "wrong-key input
during a fast state" failure the website's own round-1 review flagged
generically for keyboard (B1-class gap, now recurring for touch). This is an
architecture decision, not a UX polish item — it decides whether input is
modeled as continuous pointer-position tracking (poll the touch's current
x/y every frame against zone boundaries, independent of which element
received the original event) or discrete per-button events, and the PRD does
not say which.
**Fix:** Add an explicit AC (or an architecture note co-signed by
mobile-solution-architect) mandating continuous pointer-position tracking for
the movement control surface specifically: treat ◀/▶ (and the gap between
them) as one hit-tested zone that reports "left," "right," or "neither" based
on the live touch coordinate every frame, not as two independent buttons with
their own start/end listeners. THROW and PAUSE can remain discrete
tap-listeners since they don't need slide-over behavior.

---

## Non-blocking findings (recommended, does not block architecture)

### N1 — [HUD safe areas, style.css] — Consistency — Current desktop HUD CSS has no safe-area inset padding to build on
**Issue:** `src/style.css`'s `#hud-root` uses a hardcoded `padding: 8px 12px`
and `#control-text` a hardcoded `bottom: 8px`. Neither references
`env(safe-area-inset-*)`. This is fine for the website (M2.3 is Android-only)
but flagging now so mobile-solution-architect doesn't try to satisfy M2.3
("nothing important in unsafe areas") by nudging these same pixel constants —
the fix needs to be additive safe-area-aware padding layered on top of the
existing values, sourced from Capacitor's safe-area plugin or native inset
values, per `mobile-touch-and-layout` skill guidance.

### N2 — [Tablet layout, M2.4 + M2.8] — Minimalist design — 4:3-aspect tablets get zero side-column space at full scale by construction
**Issue:** M2.4's rule ("scale the playfield down until controls fit beside
it, on screens squarer than 16:10") is directionally correct but doesn't say
how far down, and a tablet whose landscape aspect ratio is close to 4:3 (the
playfield's own ratio) has *no* side margin at all when the playfield fills
the screen at 1:1 scale — the columns can only be created by shrinking the
playfield well below "fills the height," which trades away exactly the crisp,
full-size rendering M2.8 promises ("no text is pixelated or blurred").
**Fix (non-blocking, recommend before step 4 finalizes the layout algorithm):**
Define a minimum playfield-to-screen scale floor for square-ish tablets (e.g.,
"never below 80% of available height") and, below that floor, allow controls
to sit in a letterboxed band instead of side columns rather than continuing
to shrink the playfield indefinitely. Not release-blocking since M1.3/OQ-M7
already treat tablets as "scale cleanly, no bespoke layout is required" —
but the exact scale floor should be a number in the architecture doc, not
discovered during device-matrix testing.

### N3 — [Store copy, M12.2] — Help users recognize/diagnose/recover from errors — Confirm the corrected pause copy ships, not the original overpromise
**Issue:** `listing-draft.md`'s draft text ("your progress is never lost
mid-level") is already flagged as false by the PRD itself (M12.2, since
M4.6/OQ-M9 confirms a process-death-killed run is *not* restored). This is
already correctly identified and fixed at the PRD level — noting here only so
the store-assets-spec screenshot captions (below) don't accidentally
reintroduce the same overpromise in a caption instead of body copy.

---

## Summary for next step

**Verdict: FAIL.** F1-F4 must each get a stated resolution — F1 and F4 are
one-line AC additions; F2 and F3 require the architecture doc to show the
column-width/inset arithmetic actually closes for the 640×360 dp reference
profile before layout code is written, per `mobile-touch-and-layout`'s
48 dp/gesture-zone rules. None of these reopen OQ-M1..M10 (all six of this
review's assigned decision areas — control scheme, orientation, back
behavior, pause/resume, first-launch help, haptics — are validated above with
no owner input required). Re-run this gate once
`docs/mobile/architecture/mobile-architecture.md` states the F2/F3 numbers
and the F4 input model; N1-N3 can be picked up opportunistically during
implementation.
