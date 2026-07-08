# Test Validation Report — v2 (F11-F19), Round 1

**Validator:** test-validator (independent gate, pipeline step 10)
**Scope:** `scaffold/src/**/*.test.ts` (20 files) against `docs/PRD-addendum-v2.md`
(F11-F19) and `docs/reviews/code-review-v2-round1.md`.
**Command:** `npm run test -- --run` (vitest v3.2.7), executed independently by
this gate, not accepted on test-writer's reported numbers alone.

## Summary
**PASS (with one required follow-up before this can be considered fully
closed — see "Process finding" below)** — 265/265 tests passing across 20
files. Test-writer's reported count is independently reproduced exactly.
Spot-checked test logic (not just pass/fail) across every F11-F19 feature;
the tests are substantively discriminating, not tautological, with a small
number of real coverage gaps and one governance issue flagged below.

## Test run result
```
Test Files  20 passed (20)
     Tests  265 passed (265)
  Start at  19:56:20
  Duration  5.61s (transform 1.56s, setup 0ms, collect 3.45s, tests 587ms,
            environment 35.92s, prepare 5.02s)
```
No failures, no skipped tests, no `.only`/`.skip` found in any test file.
Full untruncated output: `docs/tests/raw-output-v2-round1.log`.

## Failures
None. All 265 tests passed on this independent run.

## Independent quality verification performed

### F15 — shield bounce zone geometry (`CollisionSystem.test.ts`)
I independently recomputed `classifyZone`'s penetration-depth math by hand
for every one of the 8 test fixtures against the enemy hitbox fixed at
`x=100,y=100,w=36,h=28` and `SHIELD_CORNER_ZONE_FRACTION=0.3`:

| Test coordinates | minOverlap face | fraction along face | Zone asserted | Matches authoritative table? |
|---|---|---|---|---|
| (118,135) | bottom (1px) | 0.5 | BOTTOM_CENTER → stop | Yes |
| (118,93) | top (1px) | 0.5 | TOP_CENTER → stop | Yes |
| (93,114) | left (1px) | 0.5 | LEFT_CENTER → due left | Yes |
| (143,114) | right (1px) | 0.5 | RIGHT_CENTER → due right | Yes |
| (103.6,135) | bottom (1px) | 0.10 | BOTTOM_LEFT → down-left | Yes |
| (132.4,135) | bottom (1px) | 0.90 | BOTTOM_RIGHT → down-right | Yes |
| (103.6,93) | top (1px) | 0.10 | TOP_LEFT → up-left | Yes |
| (132.4,93) | top (1px) | 0.90 | TOP_RIGHT → up-right | Yes |

Every test asserts the exact `vx`/`vy` sign pair the authoritative table
requires (bottom-center/top-center = stop; bottom-left = down-left;
bottom-right = down-right; left-center = due-left; right-center = due-right;
top-left = up-left; top-right = up-right). No zone is mixed up. These are
genuinely discriminating — I confirmed by inspection that swapping any two
`outcomeForZone` cases in `CollisionSystem.ts` would flip a test's expected
sign and fail it; this is not a tautological "does not throw" test.
Debounce (F15 AC2, one hit per contact until separation), multi-enemy
bounce-through-a-row (F15 AC2), and damage-composition-with-hit-power (F7
AC9 interaction) are also covered with concrete numeric assertions, not
just "doesn't crash."

### F16 — shield lifecycle, no self-harm, catch = life
`CollisionSystem.test.ts` covers: never-harms-player (AC1), actual-catch-only
grants life (AC2, plus the negative case: proximity without overlap grants
nothing), catch-confirmation cue timer fires (AC9), inert to lasers/power-ups
(AC6), unaffected by Indestructible Shield power-up (AC7), and the
freshly-thrown-shield-overlapping-player-at-spawn edge case (`vy<=0` gate) is
explicitly tested so a naive "any overlap = catch" regression would be caught.

**F16 AC8 regression test (shield clear on WARNING transition) — confirmed
present and correct.** `WinLossSystem.test.ts:181-203` ("F16 AC8 regression:
a shield still in flight when the regular formation clears into a boss
level's WARNING phase is cleared, freeing the throw gate") constructs a
world with an active in-flight shield, clears all regular enemies on a boss
level, calls `updateWinLoss`, and asserts `world.bossPhase === 'WARNING'`
**and** `world.shields` has length 0. This exactly exercises the one-line
fix (`world.shields = []`) applied after code review at
`WinLossSystem.ts:74`. Verified the implementation line is present and the
test would fail without it (removing that line would leave the fixture's
shield in `world.shields`, failing the length-0 assertion).

### F12 — boss `bossPhase` state machine (NONE→WARNING→ACTIVE)
`WinLossSystem.test.ts` and `BossWarningSystem.test.ts` together cover:
- Non-boss levels never open a WARNING window (`level 3` case).
- Level 5/10 clearing the regular formation opens WARNING exactly once,
  arming `bossWarningRemaining` to the full `BOSS_WARNING_SECONDS`, without
  touching score/lives/permanent multiplier.
- **"Opened exactly once" is explicitly tested**
  (`WinLossSystem.test.ts:161-179`): after WARNING is armed, the test
  manually sets `bossWarningRemaining = 0.4` (simulating a partially-elapsed
  timer) and calls `updateWinLoss` twice more while enemies stay empty,
  asserting the value is **still 0.4**, not reset to the full constant. This
  is a real regression guard against the exact bug class the task asked me
  to scrutinize (re-arming every tick) — it is not tautological.
- WARNING→ACTIVE transition and boss spawn (with correct HP: 15 at level 5,
  20 at level 10) is covered in `BossWarningSystem.test.ts`.
- Boss defeat routes correctly: level 5 boss death → level 6 with F18 intro
  armed; level 10 boss death → VICTORY/F19, not a plain level advance; boss
  reaching the player row → GAMEOVER (same as regular formation).
- Player retains full move/throw control during the WARNING cue (F12 AC11)
  is verified end-to-end in `GameLoop.test.ts:302-324` via a fake RAF driver
  that presses a real key and asserts `player.x` actually changed while
  `bossWarningRemaining` ticks down and `bossPhase` stays `'WARNING'`.

### F18 — level-start intro: Restart-Level-skips vs fresh-start-gets-intro
Both call sites are independently tested:
- **Fresh start / level advance arms the intro:** `world.test.ts:149-152`
  (`createNewRunWorld` starts with `levelIntroRemaining > 0`) and
  `WinLossSystem.test.ts:91-99` (a non-boss level-advance arms the full 3s
  countdown after being explicitly zeroed first — not a "value happens to be
  already truthy" false positive).
- **Restart Level skips the intro, regardless of prior state:**
  `GameStateMachine.test.ts:103-123` has two tests — one where
  `levelIntroRemaining` was already 0 (weak case) and, critically, a second
  where it is deliberately set to `3` (armed) immediately before Restart
  Level is invoked, asserting it becomes `0`. This second test is the
  genuinely discriminating one: it would fail if Restart Level merely left
  the countdown alone rather than actively clearing it.
- `world.test.ts:207-217` further confirms `resetForLevel` itself does
  **not** decide this — it leaves whatever the caller had — placing the
  decision correctly at the two call sites, matching the code review's
  observation ("set at fresh-start call sites only... and explicitly `= 0`
  on Restart Level").
- `GameLoop.test.ts:246-268` end-to-end-confirms the intro actually freezes
  Movement/Formation/Projectile/EnemyFire while `levelIntroRemaining > 0`
  even though `state === 'PLAYING'`, and unfreezes exactly when it reaches 0
  (F18 AC2/AC5/AC8).

### F19 — "Game Complete" + Esc-exempt hold/advance mechanism
`GameStateMachine.test.ts:199-265` is the strongest evidence of
non-tautological testing here: the Esc-exemption test
(`F19 AC9 / F6 AC8: Esc is a silent no-op on VICTORY`) fires an input with
**both** `escPressed: true` **and** `anyKeyPressed: true` simultaneously and
asserts `victoryHeld` stays `false`. This specifically catches an
implementation that checks `anyKeyPressed` before/instead of special-casing
Esc. I confirmed in `GameStateMachine.ts` (`case 'VICTORY'`) that
`if (input.escPressed) return;` is checked before the `anyKeyPressed` branch,
so Esc can never fall through into the hold logic — matching the test's
premise exactly. First-press-holds / second-press-advances, and the
run-state reset on advance (level 1, 3 lives, score 0, multiplier reset) are
all separately asserted. `VictoryCelebrationSystem.test.ts` separately
covers the timer itself: ticks down while not held, fully pauses (not just
slows) while held, resumes with no drift, and reliably reaches TITLE with no
input at all.

## F5 AC2 recalibration (25% → 50%) — independent verification

**This is the most consequential finding in this round.**

### (a) Is the 50% bound correctly derived from the real v2 throw-cycle?

I independently re-derived the numbers rather than trusting the test
comment:

- Shield spawn: `x = player.x + width/2`, `y = player.y = PLAYER_Y = 552`,
  `vy = -SHIELD_SPEED = -480`, `radius = SHIELD_RADIUS = 8`
  (`ProjectileSystem.ts:24-35`, `constants.ts`).
- With no enemies present, the shield travels straight up until
  `shield.y + shield.radius < 0`, i.e. it must travel `552 - (-8) = 560px`
  at `480px/s` → **1.16667s** exactly (560/480 = 7/6). The test's
  `measurePlayerMaxThrowRate()` (`EnemyFireSystem.test.ts:44-57`) reproduces
  this exactly via per-frame simulation at `dt=1/240`, giving
  `playerMaxThrowRate ≈ 1/1.16667 ≈ 0.857 shots/s`.
- Level-1 aggregate enemy fire rate: `BASE_ENEMY_FIRE_INTERVAL_SECONDS = 3.2`,
  `fireRateMultiplier = 1.0` at level 1 (`levelConfig.ts`) →
  `interval = 3.2s` → **rate = 0.3125 shots/s**.
- Ratio: `0.3125 / 0.857 ≈ 36.5%` of the measured max throw rate.

So the **actual measured ratio is ~36.5%**, and the test asserts
`level1FireRate <= playerMaxThrowRate * 0.5` (50%), which passes with
headroom (36.5% < 50%). The derivation methodology (spawn → travel →
unobstructed screen-edge exit → next throw allowed) is a real, reproducible
measurement of one legitimate v2 throw cycle, and the test's own comment is
honest about what it measures (the *unobstructed* unbounced cycle, chosen as
"the sustainable, repeatable case" rather than a lucky point-blank direct
hit). This is methodologically defensible engineering, not an arbitrary
number.

However: the 50% figure is **not tight to the derived 36.5%** — it is a
round, permissive number that happens to clear the actual ratio by a wide
margin (37% buffer above the measured value, versus v1's 25% bound which
left much less slack against its own baseline). It reads as "pick a number
comfortably above what we measured" rather than "re-derive what 'far below'
should numerically mean under the new mechanics." A tighter, still-safe
bound (e.g. 40%) would have been equally passable and would have preserved
more of v1's discriminating power.

### (b) Does the recalibrated bound still serve the AC's original intent?

Partially. The qualitative intent — "a new player is not overwhelmed by
enemy fire at level 1" — is still nominally protected, since the actual
measured ratio (36.5%) is well under even a stricter bound. But note the
bound itself was **doubled** (25%→50%), which is a much bigger change than
what the underlying throw-rate shift alone would justify: v1's max throw
rate was `1/0.25s = 4/s`; v2's is `~0.857/s`, a **4.67× reduction** in max
throw rate — if the *absolute* enemy fire rate had stayed exactly the same
(0.3125/s, which it did — `BASE_ENEMY_FIRE_INTERVAL_SECONDS` is unchanged
from v1), the ratio should have risen roughly in proportion
(0.3125 × 4.67 / 4 ≈ ratio moved from ~7.8% of old max to ~36.5% of new
max — consistent with my calculation above). A bound recalibrated purely to
"track the same relative severity as v1" would land close to the *actual*
measured 36.5%, with a modest safety margin (e.g. 40-45%), not jump all the
way to 50%. The chosen 50% doesn't functionally change today's pass/fail
outcome, but it does reduce the test's future discriminating power — it
would tolerate the level-1 aggregate fire rate climbing to nearly 1.5× its
current value before catching a real overwhelm-the-new-player regression.

### (c) Should this have been flagged to product-manager/owner rather than resolved unilaterally?

**Yes — this is a process/traceability gap, not (only) a numeric-accuracy
question.** Grounds:

1. `docs/PRD-addendum-v2.md`'s own stated convention (§"How this addendum
   relates to v1") requires: *"Where a v2 feature changes the behavior of an
   existing v1 AC, the affected v1 AC is called out explicitly under a
   'Supersedes / amends' line so the traceability chain stays intact and
   `code-reviewer`/`test-validator` know which v1 tests must change."*
   F16's own "Supersedes / amends" section explicitly lists **F2 AC1-AC2,
   AC4** as amended — but does **not** list F5 AC2, even though F16's
   removal of the 250ms cooldown is precisely what breaks F5 AC2's
   "player's max throw rate" definition. I grepped the entire addendum for
   "F5 AC2" — it appears **nowhere** outside of two unrelated summary-table
   cells (F12 and F18, neither of which is this issue). F5 AC2 is a
   documented gap in the addendum's own traceability chain.
2. The project has an established, better precedent for exactly this
   situation: F18's "Reconciliation with NFR-1 / F9 AC3" section
   (addendum lines 634-652) is a **model example** of how product-manager
   is supposed to handle "a v2 feature makes a v1 numeric metric no longer
   literally hold" — it explicitly renegotiates the metric's meaning *in the
   PRD itself*, with owner-visible rationale, and is cross-referenced in the
   summary table's "Amends v1" column. F5 AC2 needed the same treatment and
   did not get it anywhere in the PRD chain (not in the addendum, not in
   `code-review-v2-round1.md`, which likewise never mentions F5 AC2 or the
   throw-rate recalibration at all).
3. Per this project's own gate rules (`.claude/CLAUDE.md`), a change that
   "changes scope, risk, or direction" is exactly the class of decision
   product-manager is supposed to surface to the owner (Job 0), not one a
   downstream writer subagent should settle by editing a test file's
   docstring. A **previously-owner-approved numeric threshold** (25%, set in
   v1's PRD, presumably with the same owner sign-off rigor visible
   throughout this addendum's Open Questions A-F) was silently redefined to
   a different, materially looser number (50%), with the only record of
   that decision living in a test file comment — not in any PRD, ADR, or
   review document.

This is not a case where test-writer made a bad call — the empirical
derivation is careful and the reasoning is documented far better than a
typical silent test tweak. But *where* the decision was recorded is wrong:
it bypassed the PRD-amendment mechanism this exact project built and used
successfully one AC over (F18/NFR-1). **Recommendation: route this back to
product-manager to formally amend F5 AC2 in a PRD addendum note** (either
ratifying 50%, tightening it to something closer to the derived ~40%, or
choosing a different metric entirely), with the decision recorded the same
way F18's NFR-1 reconciliation was — not left solely in
`EnemyFireSystem.test.ts`'s header comment. This does not require
re-running the suite or changing test code once product-manager's call is
made (the test's assertion can stay `<= 0.5` if that's ratified, or change
if a different number is chosen); it is a documentation/traceability
gate, not a code defect.

## Test Quality Findings

### Tautological/trivial tests
None found. Every test I sampled asserts a specific, falsifiable numeric or
state outcome (exact vx/vy signs, exact HP values, exact timer values, exact
state transitions) rather than "the function ran without throwing." I
specifically looked for the F15 zone tests being mixed up (the task's
explicit concern) and hand-verified all 8 are correct against the
authoritative table — see table above.

### Acceptance criteria with no test coverage (real gaps)
- **F11 AC8** (falling power-up types visually distinguishable, non-color-only
  icon/shape per type) — `drawPowerUp` exists in `src/render/shapes.ts` and
  is wired into `CanvasRenderer.ts`, but `shapes.test.ts` never imports or
  calls `drawPowerUp`. Zero test coverage of this AC despite it being an
  explicit round-1 B7 error-prevention requirement (catching the wrong type
  is now an active downgrade under F11).
- **F17 AC9** (damage-overlay stroke color contrast-adaptive to each enemy's
  base body lightness — light strokes on dark bodies, dark strokes on light
  bodies) — implemented in `shapes.ts` (`drawSentinel`'s
  `damageOverlayColor` selection, lines ~189-249) but never asserted in
  `shapes.test.ts`. The existing damage-state tests only check base body
  fill color per tier, not the overlay's adaptivity, which is the entire
  point of round-1 B6.
- **F14 AC5** (thin outline/stroke on the shield, distinct from its fill, for
  close-range separability from the same-blue avatar) — `drawShield` sets
  `ctx.strokeStyle = VANGUARD_WHITE` (`shapes.ts:117`) but
  `shapes.test.ts`'s shield test only asserts `fillStyles`, never
  `strokeStyles`.
- **F13 AC4** (invulnerability visual — aura/blink — preserved on the new
  humanoid silhouette) — `drawVanguard`'s test call always passes
  `invulnerable=false`; the `invulnerable=true` branch of the function is
  never exercised by any test.
- **Whole-file gap: `src/render/CanvasRenderer.ts` has zero test coverage**
  (no `CanvasRenderer.test.ts` exists, and grep confirms no other test file
  imports it). This file is where several v2-specific visual ACs are
  actually implemented and are consequently entirely untested at the unit
  level: F18 AC3/AC4 ("LEVEL [N]" text color/fade-out timing), F12
  AC10/AC11 (the "BOSS INCOMING" cue's text/flash and its round-2 C2
  required color/treatment distinctness from F3 AC6's danger pulse), and
  F19 AC3/AC4 (background-unchanged + multi-color fireworks). This gap
  predates v2 (git history shows `CanvasRenderer.test.ts` never existed),
  but v2 substantially increased what this untested file is responsible
  for. `shapes.test.ts`'s `FakeCtx` pattern (recording `fillStyle`/
  `strokeStyle` calls without needing a real canvas) could be reused
  directly against `CanvasRenderer`'s methods to close this gap cheaply.

None of these gaps caused a false PASS on anything already tested elsewhere
(e.g., the underlying state/timer logic for F18/F19/F12 is well covered at
the system level even though their *rendering* is not) — but they are real
holes a code-reviewer or product-manager should not assume are covered.

### Tests with no corresponding acceptance criterion
None found that appear spurious. A handful of tests cover implementation
guarantees not tied to a single numbered AC (e.g. "no wall-clock leak,"
"clamps a very large elapsed-time gap") but these map to explicit NFR-2 /
ADR decisions cited in the file headers, not orphaned assertions.

### Flaky-looking tests
None found. `Math.random()` usage in `maybeDropPowerUp` is deterministically
mocked via `vi.spyOn(Math, 'random').mockReturnValue(...)` wherever exercised
(`levelRuntimeState.test.ts`). Loop-bounded tests in `FormationSystem.test.ts`
(iteration caps up to 20,000) are pure/deterministic — no real timers,
random values, or wall-clock dependencies — so they are slow but not flaky.
`GameLoop.test.ts` uses a fully-controlled fake `requestAnimationFrame`
driver rather than real RAF timing, eliminating the usual source of loop-test
flakiness.

## Verdict rationale

I am reporting **PASS** for this gate because: (1) the test suite itself is
green and independently reproduced at 265/265; (2) the sampled tests across
every F11-F19 feature — especially the highest-risk ones called out in the
task (F15 zone table, F12 state machine re-arm guard, F18 dual call sites,
F19 Esc exemption, F16 AC8 regression) — are genuinely discriminating, not
rubber-stamped; (3) the coverage gaps found (CanvasRenderer, F11 AC8, F17
AC9, F14 AC5, F13 AC4) are real but narrow, all in visual/rendering code
whose underlying state logic is otherwise tested, and are not evidence of
mis-tested logic, just untested logic.

However, the **F5 AC2 recalibration must be routed to product-manager**
before this feature set is considered fully traceable end-to-end — it is a
silent redefinition of a previously-approved numeric acceptance criterion,
made without the PRD-amendment step this project's own conventions (and its
own F18/NFR-1 precedent) require. This does not block `ui-ux-designer`
round 2 from a test-correctness standpoint, but it should not be allowed to
reach step 12 (security-compliance-reviewer pass 2) or final sign-off
without product-manager formally ratifying (or revising) the 25%→50% change
in the PRD, the same way NFR-1/F9 AC3 was reconciled.

## Raw output
Full untruncated run output saved to
`docs/tests/raw-output-v2-round1.log` — see that file for anything not
excerpted above.
