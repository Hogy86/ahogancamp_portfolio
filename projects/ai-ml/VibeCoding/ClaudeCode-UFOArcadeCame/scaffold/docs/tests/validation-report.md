# Test Validation Report — Round 1

## Summary
**PASS** — 133/133 tests passing (13 test files), verified by three independent
runs (identical 133/133 result each time — no flakiness observed). Test quality
is genuinely strong: assertions are behavior-driven (not tautological), the
security-critical localStorage fail-closed path is covered adversarially, and
the previously-reported PowerUpSystem/F7-AC3 tick-count fix was independently
re-derived and confirmed mathematically correct (see below).

This PASS is conditional on the gaps noted below being accepted as
out-of-scope for this round rather than silently missing — they do not block
the gate (no acceptance criterion is *contradicted* by a passing test), but
two of them (GameLoop / F6 AC7, and the "visible on-screen" UI-rendering ACs)
are real criteria with **zero automated coverage**, one of which is
misleadingly commented as if it were covered. These are flagged in "Test
Quality Findings" for code-implementer/test-writer to act on; they should not
be treated as silently resolved.

## Failures
None. All 133 tests pass across 13 test files, confirmed via three separate
`npm run test` invocations (Duration ~3.9s each, Vitest 3.2.7, jsdom
environment). No test needed re-running to produce this result.

## Verification of the reported PowerUpSystem / F7 AC3 fix

File: `src/systems/PowerUpSystem.test.ts:20-29` (`F7 AC3: an uncaught power-up
reaching the bottom of the playfield is removed with no effect`), testing
`src/systems/PowerUpSystem.ts:9-16` (`updateFalling`).

Despawn condition in source: `p.y - p.radius > PLAYFIELD_HEIGHT` (i.e. the
power-up must clear `PLAYFIELD_HEIGHT + radius`, not just `PLAYFIELD_HEIGHT`).

Test's tick-count formula (as fixed):
```
ticksToBottom = Math.ceil((PLAYFIELD_HEIGHT + 12) / (POWERUP_FALL_SPEED * FIXED_DT)) + 5
```
With `PLAYFIELD_HEIGHT=600`, `POWERUP_FALL_SPEED=90`, `FIXED_DT=1/60`,
`radius=12`:
- Per-tick delta = `90 * (1/60) = 1.5`px.
- Actual ticks required for the despawn condition to become true (simulated
  directly, tick-by-tick): **409 ticks** (`y` reaches `613.5`, clearing the
  `612` threshold).
- Fixed formula computes: `Math.ceil(612 / 1.5) + 5 = 408 + 5 = 413` ticks —
  comfortably ≥ the 409 actually required.
- The **prior (buggy) formula**, without `+ radius`, would have computed:
  `Math.ceil(600 / 1.5) + 5 = 400 + 5 = 405` ticks — which is **short of the
  409 needed**, so at tick 405 the power-up would still be active
  (`y=607.5`, not yet `>612`) and `expect(world.powerUps).toHaveLength(0)`
  would have failed (or, in a worse case, only appeared to pass by
  coincidence of margins on a different radius/speed combination — here it
  would have genuinely failed).

**Verdict: the fix is correct.** It closes a real off-by-margin gap (4 ticks
short) and the test now reliably exercises AC3 with 4 ticks of margin to
spare rather than running out before the entity actually despawns. This was
independently re-derived by simulation (Node.js), not accepted on the basis
of "the fix was applied and tests are green."

## Test Quality Findings

### Tautological/trivial tests
None found. All test files reviewed line-by-line (13/13) assert observable
World-state/output changes (position deltas, array lengths, state enum
transitions, score deltas, localStorage contents) rather than internal
implementation details that would break on a harmless refactor. Notable
positive patterns:
- `src/config/levelConfig.test.ts` includes a **self-check** of its own
  `isMonotonicNonDecreasing` helper against known-good/known-bad sequences
  (lines 77-85), plus a **deliberate regression-guard test** (lines 108-115)
  that breaks a copy of the real table and confirms the assertion helper
  actually flags it — directly satisfies the test-strategy skill's "verify
  by mentally/actually breaking the code" guidance, rather than assuming the
  monotonicity checks are non-vacuous.
- `src/instrumentation/Instrumentation.test.ts` is adversarial rather than
  happy-path-only: non-JSON, `null`, JSON arrays, JSON primitives, wrong-type
  values, non-finite/non-integer numeric values, nested-object "deep shape"
  attacks, `getItem`/`setItem` throwing, and empty-string content are all
  exercised, each asserting the concrete fail-closed output (`{eventName: 1}`
  fresh counter map), not just "didn't throw."
- `src/systems/levelRuntimeState.test.ts` correctly mocks `Math.random` to
  isolate the guaranteed-drop mechanism (F7 AC1) from the independent
  low-probability extra-drop roll, avoiding a flaky/probabilistic test.

### Minor quality notes (not blocking)
- `src/systems/WinLossSystem.test.ts:33-49` (F8 AC8, simultaneous
  lives=0/formation-reached-row): the second half of the test (lines 44-48,
  re-invoking `updateWinLoss` after manually resetting `world.state =
  'PLAYING'`) is somewhat redundant — it re-asserts the same `firstReason`
  value against itself rather than adding new discriminating power. The
  first half (`toContain(['LIVES_DEPLETED','FORMATION_REACHED_ROW'])`) is the
  part that actually validates "exactly one deterministic reason." Not a
  correctness problem, just lower signal-to-noise in that one test body.
- F1 AC4 (input-to-visible-movement latency ≤100ms, NFR-3) is explicitly and
  honestly documented as untestable at the unit level in
  `src/systems/MovementSystem.test.ts:2-4`, with a rationale, rather than
  silently omitted or faked with an internal-timer assertion. This is
  correct handling of a criterion that genuinely requires real-browser
  timing (UAT/manual), not a suite weakness — flagging only so
  product-manager's UAT plan (step 14) explicitly picks this AC up, since no
  automated test anywhere covers it.

### Acceptance criteria with no test coverage (real gaps)

1. **F6 AC7** ("Active power-up timers are paused while the game is paused
   and resume with the remaining duration intact") — **misleadingly
   documented as covered, but has zero actual test.** Two files explicitly
   defer this AC to "the GameLoop level":
   - `src/core/GameStateMachine.test.ts:2-4`: "F6 AC7 ... is tested at the
     GameLoop-integration level in GameLoop.test.ts"
   - `src/systems/PowerUpSystem.test.ts:3-5`: "F6 AC7 (timer-drift is a
     property of the caller only ticking this while PLAYING - covered at
     GameLoop level; here we confirm the decrement itself...)"

   **`src/core/GameLoop.test.ts` does not exist** (confirmed via filesystem
   search — no file matching `*GameLoop*.test.ts` or `*gameloop*` anywhere in
   `src/`). `src/core/GameLoop.ts` itself (the fixed-timestep
   accumulator/RAF loop that is the *only* place enforcing "simulation only
   ticks while `state === PLAYING`", per `GameLoop.ts:68-73`) has no test
   file at all. This means:
   - The actual pause/resume timer-drift guarantee (F6 AC7) is untested.
   - The "spiral of death" clamp (`MAX_FRAME_TIME_SECONDS = 0.25`,
     `GameLoop.ts:20-22`, relevant to NFR-2's "never drop below 30 FPS"
     robustness) is untested.
   - The deterministic system-execution order documented in
     `GameLoop.ts:83-85` (Movement → Formation → EnemyFire → Projectile →
     Collision → PowerUp → WinLoss) is asserted only in a code comment, not
     verified by any test.

   This should be corrected before treating F6 AC7 as closed — either write
   `GameLoop.test.ts` (e.g. drive `tick()` via a fake RAF/timestamp sequence
   and assert simulation systems are not invoked while `state !== 'PLAYING'`,
   and that `world.effects.*Remaining` values are unchanged across a
   pause/resume cycle), or correct the misleading comments in the two files
   above so they don't claim coverage that doesn't exist.

2. **DOM-rendering acceptance criteria have no test coverage at all.**
   `src/ui/ScreenController.ts` and `src/ui/HUDView.ts` have zero
   corresponding test files (confirmed: no test file references
   `ScreenController` or `HUDView` anywhere under `src/`). These modules are
   where several PRD ACs are actually realized as visible output, and none
   of the following are asserted against real DOM output by any test
   (they are only indirectly implied by GameStateMachine-level state
   assertions, which check the *state* the UI is supposed to render from,
   not what actually gets rendered):
   - F5 AC5 (visible level indicator 1-10 at all times)
   - F6 AC2 (pause overlay shows exactly the four labeled options) — the
     *labels/order* are tested at the state layer
     (`GameStateMachine.test.ts:67-69`, `PAUSE_MENU_OPTIONS` array), but
     whether `ScreenController.renderPause` actually renders each label as
     visible DOM text is untested.
   - F6 AC8 (Esc is a silent no-op with **no partial overlay or visible
     glitch** on non-play screens) — the *state* no-op is tested
     (`GameStateMachine.test.ts:26-45`), but "no partial overlay" is a DOM
     assertion never made.
   - F6 AC9 (blocked-Quit fallback shows the **explicit visible text** "Run
     ended — you may now close this tab.") — `world.quitBlockedMessageActive`
     boolean is tested (`GameStateMachine.test.ts:164-166`), but the actual
     rendered string in `ScreenController.ts:46` is never asserted by any
     test. A typo or accidental deletion of that exact string would not be
     caught by the current suite.
   - F6 AC10 (selected pause option is **visibly highlighted**,
     non-color-only) — `ScreenController.ts:85` toggles a `selected` CSS
     class; no test asserts this class is applied to the correct list item.
   - F7 AC10 (persistent HUD readout of permanent multiplier + distinct
     on-catch flash feedback) and F7 AC11 (active-temporary-effect visible
     indicator) — `HUDView.ts:49-66` implements both; neither is tested.
   - F8 AC1 (visible lives indicator), F10 AC1/AC5 (visible score during
     play and on end screens) — same gap; `HUDView.ts` and
     `ScreenController.renderGameOver`/`renderVictory` implement these but
     are untested.
   - F9 AC1/AC2 (Vanguard/Sentinel premise + one-line control text
     "← → move · Space throw · Esc pause" visible until first throw, per
     `HUDView.ts:38,68-71`) — untested.

   Some of this is legitimately the domain of ui-ux-designer's visual review
   rather than unit tests (e.g. whether the premise "reads as" Vanguard vs.
   Sentinels visually), but the **exact-text and DOM-structure assertions**
   (F6 AC9's specific fallback string, F6 AC2's four option labels actually
   appearing as rendered `<li>` text, F6 AC10's `selected` class placement,
   F10 AC5's score appearing on the Game Over/Victory screens) are
   mechanically testable with jsdom (already a project devDependency and
   already used in `InputManager.test.ts`) and currently are not tested at
   all. Recommend test-writer add a `ScreenController.test.ts` and
   `HUDView.test.ts` covering at least the exact-string and CSS-class
   assertions above before this is considered fully closed.

### Tests with no corresponding acceptance criterion
None found to be orphaned. Every `describe`/`it` block reviewed cites a
specific F-number/AC-number (or an explicitly-labeled security finding) in
its name or leading comment, and in each spot-checked case the cited AC's
text in `docs/PRD.md` matches what the test actually asserts (e.g. F7 AC7's
"stack multiplicatively" is asserted as literal `1.8 * 1.8` in
`CollisionSystem.test.ts:192-201`, not merely "increases"; F8 AC8's
"single deterministic Game Over" is asserted via `toContain` over the two
valid reasons plus a same-state re-invocation check, not a hand-wavy
"doesn't crash"). A few tests correctly test *emergent*/derived behavior not
tied to a single literal AC number but supporting one directly (e.g.
`EnemyFireSystem.test.ts`'s "measured aggregate fire rate at level 10 is
higher than at level 1" — supports F5 AC3's "cadence is felt" framing) —
these are appropriately labeled as such rather than mis-cited.

## Coverage against F1-F8, F10, and the 5 binding security constraints

| Area | Coverage |
|---|---|
| F1 (movement) | AC1-AC3, AC5 covered (`MovementSystem.test.ts`, `InputManager.test.ts`). AC4 (latency) explicitly untestable at unit level — see note above. |
| F2 (shield throw) | AC1-AC5 covered (`ProjectileSystem.test.ts`, `CollisionSystem.test.ts`). |
| F3 (formation) | AC1-AC6 covered (`world.test.ts` for AC1, `FormationSystem.test.ts` for AC2-AC6, `WinLossSystem.test.ts` for AC5's terminal effect). |
| F4 (difficulty/HP) | AC1-AC6 covered (`levelConfig.test.ts`, `world.test.ts`). AC6 (visible damage-state per hit) is a **rendering** AC not covered by any DOM test — same class of gap as the F6/F7/F8/F9/F10 UI gaps above; not separately re-flagged since it falls under the same "ScreenController/HUDView untested" finding, but noting it exists (no `damageState`/sprite-swap assertion found anywhere). |
| F5 (level progression) | AC1-AC5 covered (`WinLossSystem.test.ts`, `EnemyFireSystem.test.ts`). AC5 (visible level indicator) is the same rendering-gap class as F4 AC6. |
| F6 (pause menu) | AC1-AC6, AC8-AC11 covered at the state-transition layer (`GameStateMachine.test.ts`). AC7 has **no test at all** (see gap #1 above). AC2, AC8, AC9, AC10's *rendering* halves are untested (see gap #2). |
| F7 (power-ups) | AC1-AC9 covered (`levelRuntimeState.test.ts`, `PowerUpSystem.test.ts`, `CollisionSystem.test.ts`). AC10, AC11 (HUD visibility) untested — rendering gap. |
| F8 (lives/end states) | AC1-AC9 covered (`CollisionSystem.test.ts`, `WinLossSystem.test.ts`, `GameStateMachine.test.ts` for AC7). AC1 (visible lives indicator), AC4/AC6 (distinct Game Over/Victory screens) rendering halves untested — same gap class. |
| F9 (theme/legibility) | No test coverage at all (AC1, AC2, AC3, AC4) — appropriately deferred to ui-ux-designer/security-compliance-reviewer (IP-motif review is inherently a visual/human judgment call per security-review-v1.md's own MEDIUM finding #3), not a test-writer gap. |
| F10 (score) | AC1-AC4 covered (`world.test.ts`, `CollisionSystem.test.ts`). AC5 (score shown on end screens), AC6 (session-only, no leaderboard call) untested — AC5 is the rendering gap; AC6 is arguably vacuously true (no leaderboard code exists anywhere to test against) and low-risk to leave uncovered. |
| **Security constraint 1** (localStorage fail-closed) | **Extensively covered**, adversarially (`Instrumentation.test.ts`, 13 tests). Strongest area of the suite. |
| **Security constraint 2** (textContent-only DOM, no innerHTML) | Not unit-tested (would need a "grep for innerHTML" static check or a jsdom assertion that no `<script>`/HTML-injection survives a crafted string); verified manually in this review via `grep -rn innerHTML src` — zero matches outside comments. Acceptable as a code-review-level check per security-review-v1.md's own framing ("grep-verifiable... a code-review assertion for pass 2"), not a test-writer gap. |
| **Security constraint 3** (IP sign-off on draw functions) | Explicitly a human visual-judgment gate per security-review-v1.md, co-gated with ui-ux-designer round 2 — not applicable to unit tests. |
| **Security constraint 4** (container/CSP hardening) | Deployment-stage concern (step 16), not applicable to this test suite. |
| **Security constraint 5** (no setTimeout/setInterval/Date.now in sim) | Not unit-tested, but verified manually in this review via `grep -rn "setTimeout\|setInterval\|Date\.now" src --include=*.ts` (excluding test files) — zero matches. Grep-verifiable per the security review's own suggested remediation; acceptable as a code-review check rather than a unit test. |

## Raw output
Full untruncated run output saved to
`docs/tests/raw-output-round1.log` — see that file for the complete
per-test verbose listing (133 tests, 13 files) including console output
lines (e.g. `[vvs] gameOver {...}` instrumentation logs emitted during
`WinLossSystem.test.ts`/`GameStateMachine.test.ts` runs), timing, and the
final summary line (`13 passed (13)` files, `133 passed (133)` tests,
Duration 3.93s). Two additional confirmation reruns (133/133 both times,
~3.9-4.0s each) were performed to check for flakiness and are referenced in
this report but not separately saved, since their content was identical to
the saved log.
