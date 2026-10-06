# Code Review Round 19: Mobile Pipeline Step 8

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Verdict: PASS (step-8 code gate).** All findings are Low. mobile-junior-tester may start step 9 for F23 r5 and the round-18 follow-ups.

- **Reviewer:** mobile-lead-developer
- **Date:** started 2026-09-30, finished 2026-10-04 (interrupted by a usage limit; see §2)
- **Branch / base:** `claude/project-thread-rm5222`, uncommitted diff vs HEAD `bfc1178`, plus untracked `tests/mobile-e2e/context-menu.spec.ts` and `scripts/render-powerup-tokens.mjs`
- **Scope:**
  1. F23 r5 (bigger fist, redrawn rabbit, ±0.65r / 0.75r bound): `src/render/shapes.ts`, `src/render/powerUpGlyphs.test.ts`.
  2. `contextmenu` listener moved to `document`: `AndroidPlatform.ts`, `TouchControls.ts`, new `context-menu.spec.ts`.
  3. Flake hardening (`MIN_GAP_DWELL_MS`): `tests/mobile-e2e/slide-switch.spec.ts`.
  4. New `scripts/render-powerup-tokens.mjs`.
- **Specs used:** `docs/PRD-addendum-v5.md` F23 r5 (AC3(d), AC4.1, AC4.2, AC6, AC8); `PRD-mobile.md` v1.9, M3.3a, M3.7; `code-review-round18.md` L1; the coding-standards and mobile-touch-and-layout skills.
- **Not re-read this round:** `mobile-architecture.md` and the mobile ADRs. The diff changes no architecture, lifecycle, back or input-model decision.

## 1. Summary

- **The r5 glyphs meet every r5 range.** Fist 1.12r × 0.97r, rabbit 1.27r × 1.05r, both centred within 0.05r (§3).
- **The larger glyphs never touch the ring.** Furthest outline point: fist 0.713r, rabbit 0.721r. Visible dark gap at r = 12: 2.45 px and 2.35 px (limit 2.0). My own flattening at 400 steps gives the same figures as the test's 16 steps.
- **Every r5 item is asserted.** 58 mutants of `shapes.ts` in a scratch copy: each of the 21 numbered items (AC3(d) i-iii, AC4.1 a-d, AC4.2 a, b1-b7, c1-c6) is killed by its own assertion, except b1, which is killed by a collection crash (L2).
- **Circle, X, ring, hitbox and `POWERUP_RADIUS` are untouched.**
  - The `SHIELD` and `PERMANENT_MULTIPLIER` branches and the ring/disc lines are not in the diff.
  - `git diff HEAD` is empty for `src/config`, `src/systems`, `src/core`, `src/style.css`, `index.html`, `package.json`, `.github` and `android/`.
  - Mutating the circle radius, the X arm, the ring width, ring radius or disc colour fails the suite.
- **Draw code stays cheap.** The rabbit is one path of 23 commands (17 at HEAD) and one `fill()`; the fist adds one multiplication. Headless Chromium: rabbit 24.8 → 28.8 µs per call, fist 25.3 → 26.0 µs. No allocation, no new state.
- **`contextmenu` now covers the whole document.** One listener in `AndroidPlatform.ts:197`; the `TouchControls` one is removed. The new test fails on HEAD code ("bare canvas") and with no listener ("menu button"), on all four profiles.
- **The slide-switch re-collection cannot mask an M3.3a defect.** A build with a real gap-drop defect fails on the first gesture, 4 of 4 runs, with no re-collection. One comment overstates what the test detects (L1).
- **The render script reproduces the committed evidence byte for byte** (all five `*_r5.png` files, SHA-1 equal).

## 2. Verification (run by me)

| Check | Result |
|---|---|
| `npm run check:secrets` | Clean (the one S1 template exemption notice) |
| `npm run typecheck` / `npm run lint` | exit 0 / exit 0 |
| `npm run test` | 32 files, **657/657 passed** (glyph file: 97 tests) |
| `npm run build` (website) | OK: `index-BsmJ8NH0.js`, `index-Bee-yMjM.css` (CSS hash unchanged) |
| `npm run build:android` | OK: `index-BgRf6kkT.js`, `AndroidPlatform-7pY-U7RO.js`, `AndroidPlatform-CzKXBBts.css` |
| Playwright `--repeat-each=3 --workers=4 --retries=0`, run 1 | **656/657** in 9.1 min. One failure: `controls-behavior.spec.ts:115` at 640x360, `page.goto: net::ERR_CONNECTION_REFUSED` after 386 ms (L5) |
| Same command, run 2 | **657/657** in 10.3 min, with the mutation runs loading the machine in parallel |
| `refresh-android-mirror.ps1` | robocopy exit 3 (informational). **Parity check passed**: 138 files plus 6 named files |
| Mirror: `build:android`, `npx cap sync android`, `gradlew.bat assembleDebug --no-daemon` | Same bundle hashes; **BUILD SUCCESSFUL** in 19 s; `app-debug.apk` 3,963,529 bytes; synced JS holds the new rabbit and the `contextmenu` listener |
| Glyph mutants (scratch copy) | 58 run; see §3 |
| Slide-switch and context-menu experiments (scratch copy, port 4176) | See §3 |
| `npx prettier --check` on the 7 files | 5 clean; the two spec files are not (L6) |
| `git status` and file hashes, before vs after | Identical; no code file changed during the review |
| Cleanup | No `node`, `java`, `adb` or emulator process left; nothing listening on 4170-4179 |
| Denied commands / emulators | None / none started |

**Interruption.** The static checks and both builds ran on 2026-09-30. The Playwright runs, mutants, experiments and mirror build ran on 2026-10-04, after confirming by hash that the seven code files were unchanged.

**Not done:**
- Nothing was measured on a device or emulator. AC6(b) file 5 (emulator capture) and the unprimed naming test belong to steps 10 and 11.
- The second Playwright run's shell wrapper was killed at the 10-minute background limit, after Playwright had printed `657 passed` and written its JSON report. No server was left behind.

## 3. Measurements

Glyph geometry at r = 12 and r = 20 (identical in units of r):

| Item | Limit | Fist | Rabbit |
|---|---|---|---|
| Box width × height | fist 1.0-1.3 × 0.8-1.2; rabbit 1.1-1.3 × 0.9-1.2 | 1.123 × 0.966 | 1.266 × 1.051 |
| Largest recorded coordinate | ≤ 0.65r | 0.616 | **0.650** |
| Furthest outline point | ≤ 0.75r | 0.713 | 0.721 |
| Dark gap to ring at r = 12 | ≥ 2.0 px | 2.45 px | 2.35 px |
| Knuckle prominence / spacing | 0.06-0.22 / ≥ 0.17 | 0.147-0.152 / 0.22 | n/a |
| Ear height E; lower tip above rump | 0.3-0.55; ≥ 0.3 | n/a | 0.439; 0.321 |
| Ear width at 0.25E / 0.75E | 0.2-0.3 / 0.12-0.25 | n/a | 0.210 / 0.179 |
| Ear gap at 0.5E / 0.75E | ≥ 0.1 / ≥ 0.17 | n/a | 0.141 / **0.171** |
| Ear lean | 15°-25° | n/a | 16.2° (both ears) |
| Nose to neck dip; rump rise | 0.35-0.65; 0.1-0.25 | n/a | **0.640**; 0.220 |

Glyph mutants (58):

| Outcome | Count | Notes |
|---|---|---|
| Failed on the named assertion | 48 | Scale up and down, shift, knuckle count/height/spacing, forearm stub, square corner, ear lean 0°/10°/14°/30°/forward, thin ears, ears together, flat-topped ears, ears on the back, upright body, no/shallow/deep/narrow notch, no/big tail, rump low/high, lifted/short/long foot, eye cut-out, added stroke, circle 0.45r/0.5r, X 0.5r, ring width/radius/colour |
| Failed by a collection crash | 4 | One ear, short ears, fist and rabbit swapped, ears moved back 0.3r (L2) |
| Survived, but still inside the spec ranges | 4 | Each was redone with a cleaner mutant, which failed |
| Mis-targeted (edited another function) | 1 | Redone inside `drawPowerUp`; failed |
| Valid left-facing rabbit, wrongly failed | 1 | L3 |

Slide-switch (`640x360`, scratch copy of the spec, scratch build with identical hashes):

| Case | Result | Re-collections |
|---|---|---|
| Unmodified build and spec | pass | 0 |
| Gap-drop defect (`moveZone.ts` gap branch returns `none`), unmodified spec, both layouts × 2 | **fail, 4/4**, first gesture: "not enough recorded frames … (dwell 216ms >= 120ms) … a real stall while crossing", received 0 | 0 |
| Main thread blocked 150 / 250 ms in the first `pointermove` handler | pass | 0 |
| Main thread blocked 100 / 170 ms by a timer just after gap entry | pass | 0 |
| Main thread blocked 400 ms in `pointerdown` | pass | 0 |
| Main thread blocked 300 ms from 60 ms after `pointerdown` (every, every 2nd, every 3rd gesture) | pass | 0 |
| Two full-suite runs (48 slide-switch runs, 1,920 gestures) | pass | 0 |

- A real M3.3a defect (ShieldMan stops in the gap) still fails, straight away and without a retry.
- An in-page main-thread stall never produced a compressed dwell: the CDP touch call waits for the page, so the gesture stretches instead. The re-collection path can therefore only be reached by delivery delay outside the page, and it was never reached in any of my runs.
- A missing `pointermove` is not treated as compressed (dwell is set to infinity) and still fails the "expected 2 recorded pointermove events" assertion.

`contextmenu` (four profiles): current code 4/4 pass; HEAD code 4/4 fail at "bare canvas"; no listener 4/4 fail at "menu button".

## 4. Findings

### L1 (Low, suggested): slide-switch comment overstates stall detection; re-collections are invisible

- **Where:** `tests/mobile-e2e/slide-switch.spec.ts:137-145`, `:359`, `:366`.
- **Problem:**
  - The comment says "A genuine stall inside a real dwell still leaves <2 frames and fails". Main-thread stalls of 100-400 ms pass (§3). What fails is ShieldMan not moving in the gap, which is the rule itself.
  - The reason predates this diff: the recorder drops frames where x did not change (line 93), so the `dx` "zero-velocity" assertion at line 370 can never fire.
  - The `recollected-compressed` annotation does not appear in the `list` reporter, and the bound is per gesture (3 attempts), so up to two thirds of gestures could be re-collected with nothing on screen.
- **Why Low:** the retry cannot hide a rule 1-3 defect (§3), and it never triggered in 1,920 gestures.
- **Fix:** reword the comment to "a drop in the gap leaves <2 moving frames and fails"; add a per-test cap (for example fail if more than 4 of 40 gestures are re-collected) and print the count. Owner: mobile-junior-tester.

### L2 (Low, suggested): the glyph test file crashes at collection when the rabbit does not have two ears

- **Where:** `src/render/powerUpGlyphs.test.ts:340-342` (`rabbitLandmarks`), called in the `describe` body at `:580` and in `signature()` at `:389`.
- **Problem:** with any ear count other than 2, `rear.x` throws `TypeError: Cannot read properties of undefined (reading 'x')`. The whole file reports "no tests", so the 96 other results are lost and AC4.2(b)1's own assertion never runs.
- **Why Low:** the run is still red (`vitest` exit 1).
- **Fix:** build the landmarks in `beforeAll` or lazily inside each test, and assert `ears` has length 2 before destructuring.

### L3 (Low, suggested): a left-facing rabbit, which the spec allows, fails b6

- **Where:** `src/render/powerUpGlyphs.test.ts`, test "6. rounds each tip with a curve call" and the rump check in "(c) 2.".
- **Problem:** the landmarks are mirrored so the head is at +x, but the curve end points (`o.x / r`) are compared unmirrored. A mirrored copy of the shipped rabbit fails b6; c2 passes only by coincidence.
- **Why Low:** the shipped rabbit faces right, and the error is a false fail, not a false pass.
- **Fix:** return the mirror flag from `rabbitLandmarks` and apply it to the curve end points.

### L4 (Low, informational): four rabbit values sit on or next to their limits

- **Where:** `src/render/shapes.ts:378-407`.
- **Problem:** largest coordinate 0.650 (limit 0.65), ear gap at 0.75E 0.171 (limit 0.17), nose to neck dip 0.640 (limit 0.65), lean 16.2° (limit 15°). Any later nudge to the ears or muzzle will fail a test.
- **Status:** not a defect; all are inside the ranges as written. Also, the AC3(d)(iii) test hard-codes `s = 0`; that is safe only because AC6(a) rejects a glyph `stroke()`.

### L5 (Low, informational): one connection-refused failure in the first Playwright run

- **Where:** `controls-behavior.spec.ts:116`, `page.goto('/?e2e=1')`, 640x360.
- **Problem:** `net::ERR_CONNECTION_REFUSED` to `localhost:4174`. No app code ran and the spec is not in this diff. I was copying files into a scratch directory at the time, which may have contributed; I did not find the cause.
- **Status:** the second run and all other tests on the same server passed. If it recurs in CI, pin the preview server and `baseURL` to `127.0.0.1`.

### L6 (Low, suggested): formatting and script housekeeping

- `tests/mobile-e2e/slide-switch.spec.ts` and `context-menu.spec.ts` fail `prettier --check` (long lines; same class as round-18 L4).
- `scripts/render-powerup-tokens.mjs` imports `esbuild`, which is only a transitive dependency of `vite`, and hard-codes `POWERUP_RADIUS = 12` instead of importing it. Add `esbuild` to `devDependencies` or bundle through Vite, and import the constant.
- The 26 px sheet is the 24 px token scaled by 26/24 on the canvas. That is a fair stand-in for the in-play size, but the emulator capture (AC6(b) file 5) remains the real evidence.

## 5. Standards conformance

- **coding-standards**
  - Style: PASS. Two small glyph functions, one named constant (`FIST_SCALE`), no dead code.
  - Error handling, logging: N/A.
  - Code documentation: PASS with L1. Docstrings give the measured sizes and the r5 criteria; the listener move cites UAT O5 and round-18 L1.
- **mobile-touch-and-layout**
  - Browser defaults: PASS. Long-press is cancelled anywhere in the document; pointer and click handling are untouched.
  - Timing and performance: PASS. Glyph cost is unchanged in practice; nothing is tied to frame count.
  - Touch targets, screen fitting, lifecycle, back: untouched.
- **Platform pitfalls**
  - No game logic duplicated or branched per platform; `shapes.ts` stays shared and both builds draw the same glyphs.
  - The new listener lives for the app's lifetime and needs no removal on background.
  - No hand edits under `android/`; the mirror assets were regenerated by `cap sync`.

## 6. Routing

- **Step 9 (mobile-junior-tester) may start.** L1, L2, L3 and the spec-file half of L6 belong there.
- **mobile-junior-developer:** the script half of L6 (suggested, non-blocking).
- **mobile-lead-tester (step 10):** AC6(b) file 5 on the emulator; watch for L5 recurring.
- **mobile-ui-ux-designer (round 8) and mobile-security-compliance-reviewer:** rabbit naming test and the r5 IP delta check, per the addendum.
- **Website pipeline:** `src/render/shapes.ts` and its test are shared, so the website code-reviewer gate still applies before either version ships.
