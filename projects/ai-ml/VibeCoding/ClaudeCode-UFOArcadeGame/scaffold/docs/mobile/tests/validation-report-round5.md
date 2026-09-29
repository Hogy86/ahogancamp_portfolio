# Mobile Test Validation Report - Round 5

**Stage:** Mobile Pipeline Step 10 - mobile-lead-tester (independent verification)
**Date:** 2026-09-28
**Verdict:** **PASS** (mobile-ui-ux-designer round 2 may start)

**One-line reason:** all automated gates are green (website/shared 540/540, mobile Playwright 417/417 at `--repeat-each=3`,
both builds, manifest, styles), the new tests are discriminating and deterministic, and the round-4 findings are closed on real
emulators: F1 (every menu screen inside the insets on the 640 x 360 AVD at normal and largest font), F2 (live `wm size 945x1680`
on pixel7 shows the prompt and restore returns to the pause menu), F3 (lowend 3-button shows the prompt as M2.3c says; tablet
3-button plays). No regressions on fold, api30, api28 (WebView 69) and api24.

Inputs: PRD-mobile v1.7, architecture v1.7, `docs/mobile/reviews/code-review-round13.md`, `manual-only-criteria.md` (modified),
the modified/new tests below. HEAD `2cb1cc9` plus uncommitted step-9 additions. Raw output: `raw-output-round5.log`. Device detail:
round-5 section of `device-matrix.md`. Screenshots: `screenshots/*_round5.png`.

---

## Part 1 - Test quality (test-strategy)

Reviewed: `src/platform/android/layout.test.ts` (+55, rows 21-24), `src/platform/android/screenFit.test.ts` (+17),
`tests/mobile-e2e/menu-insets.spec.ts` (refactor + A13 exact-bound case), new `src/test-utils/endScreenMarkup.ts` and
`src/ui/endScreenMarkup.test.ts`, `manual-only-criteria.md` diff.

- **layout.test.ts rows 21-24 (M2.3c, A13):** asserts `classifyWindow`/`computeLayout` outputs (640x360 tooSmall on height,
  640x368 playable at B 64, s 0.5075) for the bottom-bar insets, in both swap settings. Observable results against the spec
  numbers, not a re-derivation. Would fail if the bottom inset were ignored or the 300 dp floor changed.
- **screenFit.test.ts (L7):** restores jsdom's own `innerWidth/innerHeight` in `afterEach`, plus a leak test. Discriminating: if
  the restore is removed the leak test fails (642/361 would persist). Deterministic (no timing).
- **endScreenMarkup.test.ts (closes L2):** renders the real `ScreenController` (Android copy) for GAMEOVER and VICTORY and does
  `toEqual` against the constants the Playwright injector uses. Not tautological: the constants are literals, the actual side is
  the real renderer, so a renderer change (class, order, text, action) fails it. Mental mutation: renaming `best-score` or dropping
  `New best!` fails the test. The compared text includes the numbers (12345, level 12), so a copy tweak also fails it; that is
  the intended drift alarm.
- **menu-insets.spec.ts:** the injector now reads the shared constants; walks Title, Settings, Privacy, Help, Pause, Restart
  confirmation, Game Over, Game Complete at 640x360 with five insets sets plus 640x368 bottom bar, both swap settings, plus the
  A13 exact-bound case (0,0,30,38.5, cutout 0,0, 0.01 tolerance; closes L3). Discriminating: with the round-4 layout the title
  would fail by 13 dp. Geometry comes from bounding boxes against the insets, not from the app's own formula.
- **Determinism:** the full mobile suite at `--repeat-each=3` (417 tests) had 0 failed, 0 flaky. `git status --porcelain`
  identical before and after the run.
- **Residual gaps (INFO, not blocking):** Game Complete cannot be reached on a device in reasonable time, so it is covered only by
  the jsdom-vs-real-renderer test plus the injected e2e; the real Game Over was measured on the device (93.8-258.3 dp, inside).
  The L1 zoom-out has no automated test (device-only, carry-forward).
- No orphan tests; every new test maps to F1/F2/T1-T3/L2/L3/L4/L7 or PRD M2.3b/M2.3c/M2.10a.

## Part 2 - Full suite (unabridged in the raw log)

| Check | Result |
|---|---|
| `check:secrets`, `typecheck`, `lint` | exit 0 |
| `npm run test` (website + shared + scripts) | **31 files, 540 tests passed** (round 4: 526) |
| `npm run build` / `build:android` | exit 0 / exit 0 |
| `check:android-styles`, `check-capacitor-config` | exit 0 |
| Playwright mobile `--repeat-each=3` | **417 passed, 0 failed, 0 flaky** (4.5 m) |
| Mirror refresh script | exit 0, "Parity check passed: 130 file(s) ... and 6 named file(s)" (robocopy 3 informational) |
| Mirror `build:android`, `cap sync`, `gradlew assembleDebug --no-daemon`, `check-android-manifest --variant debug` | BUILD SUCCESSFUL (20 s), `app-debug.apk` 3,961,177 bytes, PASSED |
| `npm run format` | exit 1 (pre-existing prettier warnings in `src/`; not a CI step; INFO) |

No website regression. I ran `--repeat-each=3` only (not round 4's extra 1x and 40/40 x5 passes); the 40/40 spec is inside the 3x
run and passed all 3 repeats.

## Part 3 - Failures

None. Round-4 findings:

| ID | Result | Evidence |
|---|---|---|
| F1 title/menus overflow the insets (640 x 360 AVD) | **CLOSED** | Allowed band y [24,328], x [30,610]. Normal font: Title 37.8-314.3, Settings 77.3-274.8, Privacy 36-316, Help 109.3-242.8, Pause 50.3-301.8, Restart confirmation 102.3-239.8, real Game Over 93.8-258.3; no overlay scrolling (304/304). Largest font (2.0): Title 30-322, Settings 72.3-279.8, Help 98.8-253.3, Pause 42.3-309.8, confirmation 91.8-250.3. Round 4 was Quit bottom 341 (normal) and 351 (largest). |
| F2 pixel7 640 x 360 plays instead of prompting | **CLOSED** | Live `wm size 945x1680` during play: `.rotate-prompt` flex, `Paused` overlay hidden underneath, stable over 6 polls, l + r = 65.9. `wm size reset`: back at the first poll (+1.5 s) to the pause menu, Score 0 / Lives 3 unchanged, no auto-resume. |
| F3 / M2.3c (f3) lowend 3-button | **As expected** | inset t24 l0 r0 b48, prompt shown (known limit). |
| F3 / M2.3c (f4) tablet 3-button | **PASS** | inset t24 b56, prompt hidden, play (score 550), controls bottom 744 = 800 - 56, Back, Home/resume. |
| T1, T2, T3 | Covered (Part 1) | |

## Part 4 - Carry-forwards and notes

- **L1 (known, not a failure):** during the F2 prompt `visualViewport.scale` = **0.8682** (innerWidth x innerHeight 737 x 415 against
  a 640 x 360 layout viewport). After restore the scale is 1.
- **Screenshot naming:** 11 files with the `_round5` suffix already existed (timestamp 20:43, created during the round-13 code review:
  `f1_lowend_*_normal`, `f1_lowend_*_largest_font`, `f2_pixel7_640x360_live_wm_size_prompt`). My files use different base names
  (`f1_lowend_*` without `_normal`, `f1_lowend_largefont_*`, `f2_pixel7_640x360_prompt`, and others), so nothing was overwritten.
- Settings restored exactly: nav mode 2, font 1.0, physical wm size/density, fold `device_state reset`; `user_rotation` read 0 before
  and after. All emulators killed with `adb emu kill`, `adb kill-server`, no emulator/qemu/adb process left.
- On the swiftshader lowend AVD screenshots can lag the DOM; DOM probes were the source of truth.
- Known gaps unchanged: fold AVD cannot unfold-resize (M2.9), 10-level round and frame rate not measured (UAT/closed test),
  pre-API-30 with a modern WebView blocked on the owner's Play sign-in, Game Complete not reachable on a device quickly.

## Routing

PASS. Step 11 (mobile-ui-ux-designer round 2) may start. UX round-2 inputs: the round-5 screenshots and the round-4 UX notes
(hint text over ShieldMan at bottom-centre at 640 x 360, title heading visible above the Help panel).
