# Mobile Test Validation Report - Round 4

**Stage:** Mobile Pipeline Step 10 - mobile-lead-tester (independent verification)
**Date:** 2026-09-28
**Verdict:** **FAIL** (routes to step 7, then step 8)

**One-line reason:** every automated gate is green (website 526/526, mobile Playwright 333/333 at
`--repeat-each=3` plus 111/111 and 40/40 x5, both builds, manifest, styles), but the first real-device run of
the new 640 x 360 dp reference AVD found two spec/device mismatches that the emulation suite cannot see:
the title menu overflows the real insets (F1), and the pixel7 640 x 360 `wm size` run plays instead of
showing the prompt the PRD expects, with the THROW button 2 dp inside the right inset (F2).

Inputs: `docs/mobile/PRD-mobile.md` v1.6, `docs/mobile/architecture/mobile-architecture.md` v1.6,
`docs/mobile/reviews/code-review-round12.md`, `docs/mobile/tests/manual-only-criteria.md` (modified,
uncommitted), the three modified specs. HEAD `ce5255c`. Raw output: `docs/mobile/tests/raw-output-round4.log`.
Device detail: the round-4 section of `docs/mobile/tests/device-matrix.md`. Screenshots:
`docs/mobile/tests/screenshots/*_round4.png`.

---

## Part 1 - Test quality (test-strategy)

Reviewed the diffs of `cutout-insets.spec.ts` (+92 lines), `too-small-window.spec.ts` (+97) and
`slide-switch.spec.ts` (comment only).

- **Not tautological.** New tests assert observable geometry from bounding boxes against the PRD numbers
  (l/r/t/b insets, 300 dp floor, 12 px text) and state via `__vvsTest.snapshot()`. None re-derive the app's
  own formula. Names describe behavior and cite the AC (M2.3b rules 1-2, M2.10a behaviors 1-4, M4.2-M4.4).
- **Discriminating (mental mutation).** "Playfield really uses a gesture band" fails if the playfield were
  fitted inside the full insets (299.8 dp < 300). "Cutouts leave under 300 dp -> prompt" fails if the
  cutout were ignored. "No game time passes" fails if `pauseForInterruption` were dropped (enemies advance
  over 1.5 s). "Never resumes by itself" fails on auto-resume. Left/right-inset tests fail if a column
  ignored the side insets.
- **Deterministic.** `slide-switch.spec.ts` change is a comment aligning the text with
  `RUN_ONE_SLIDE_MAX_ATTEMPTS = 3` (verified at line 298). Three consecutive runs (repeat-each 3, repeat-each 1,
  40/40 x5) had 0 failures and 0 flaky.
- **Weak spot (LOW, T1).** "the message sits fully inside the full edge insets" is only weakly
  discriminating: the `<p>` is a centered flex child, so it sits far inside the insets at any window
  where the text is a single line. It would not fail if the prompt ignored the insets. It only has teeth
  under the largest font, which Chromium cannot set. Real coverage is the device row (M2.10a (d)).
- **Coverage gap (MEDIUM, T2, drives F1).** No automated test asserts that any menu screen (title,
  Settings, Help, pause, Game Over) lies inside the full edge insets at 640 x 360 with real insets, although
  M2.3 and M2.3b rule 3 require it. `controls-layout.spec.ts` checks menu items only for height >= 48. The
  manual-only file also does not list it, so nothing covers it.
- **Coverage gap (MEDIUM, T3, drives F2).** The Playwright "side-inset width shortfall shows the prompt"
  test passes in Chromium but the same numbers on a real device produce no prompt (F2). The suite cannot
  detect that divergence.
- **manual-only-criteria.md** changes (M2.3b (e), 3-button, known limit, M2.10a (a)-(d), fold states) are
  accurate and now executed in this round's matrix. Row "M2.3b ... three-button nav (nav bar left or right)"
  assumed a side bar; see F3.

## Part 2 - Full suite (unabridged output in the raw log)

| Check | Result |
|---|---|
| Mirror refresh via `scripts/refresh-android-mirror.ps1` | exit 0, robocopy 3, "Parity check passed: 126 file(s) ... and 6 named file(s)" |
| `check:secrets`, `typecheck`, `lint` | exit 0 |
| `npm run test` (website + shared + scripts/*.test.mjs) | **PASS 29 files, 526 tests** |
| `npm run build` (website) / `build:android` | exit 0 / exit 0 |
| `check:android-styles`, `check-capacitor-config` | exit 0 |
| Playwright mobile `--repeat-each=3` | **333 passed, 0 failed** (4.4 m) |
| Playwright mobile `--repeat-each=1` | **111 passed** (1.7 m) |
| Playwright `-g "40/40" --repeat-each=5` | **40 passed** (4.8 m) |
| Mirror `build:android`, `cap sync`, `gradlew assembleDebug`, `check-android-manifest --variant debug` | BUILD SUCCESSFUL, PASSED |
| Repo `git status --porcelain` before/after Playwright | identical |
| `npm run format` (prettier --check src) | exit 1 on 7 src files (GameStateMachine.test.ts, backButton.ts, layout.test.ts, moveZone.test.ts, moveZone.ts, overlays.ts, screenFit.ts). Pre-existing: `src/` is unchanged from HEAD, and `format` is not a step in `deploy-pages.yml`. INFO only. |

No website regression.

## Part 3 - Failures (verbatim detail; no re-run needed)

### F1 - Title menu overflows the real insets on the 640 x 360 dp reference phone (MEDIUM, blocking)

- **AC:** PRD M2.3b rule 3 ("every menu button stays inside the full edge insets on all four edges ...
  Menus, dialogs and the M2.10/M2.10a prompts stay inside the insets as today") and M2.3 / M2.3a (no menu
  button under a gesture band). M2.3b (e) asks for a full look at the reference AVD.
- **Device evidence** (`svr_api36_lowend_640x360`, gesture nav, WebView 133): `#safe-layer` style
  `inset: 24px 30px 32px` (t=24, l=r=30, b=32). Title screen element bounds in dp (CDP `getBoundingClientRect`):
  `H1 top=11 bottom=58`, `start 105-153`, `help 181-229`, `settings 237-285`, **`quit 293-341`**.
  Allowed band is y in [24, 328]. So the **Quit button's bottom 13 dp lies inside the bottom gesture
  band** (the swipe-up-home zone) and the title heading's top 13 dp lies inside the top band.
  The menu column is 330 dp tall in a 304 dp safe area (360 - 24 - 32). Screenshot:
  `screenshots/m2_3b_lowend_title_round4.png`.
- **Under the largest font** (font_scale 2.0) the column grows: `start 115-163 ... quit 303-351`
  (23 dp into the band); `screenshots/m2_11_lowend_largest_font_title_round4.png`.
- **Chromium reproduces it deterministically:** viewport 640 x 360, `?insets=30,30,24,32`:
  h1 7..60, quit 297..345 (limit 328). `insets=30,30,28.2,32`: h1 9.1..62.1, quit 299.1..347.1.
  `insets=24,24,0,24`: h1 -1..52 (above the viewport), quit 289..337 (limit 336).
  So this is not a device-only effect and it predates M2.3b (the v1.5 planning insets fail too).
- **Other screens checked OK on this device:** pause menu (PAUSED 28.5-75.5, options 107.5-323.5), help text
  (x 39-601 within 30-610), HUD and controls in play (pause 40-88, controls 272-328, hint text bottom 325.7).
  Settings, Game Over and Game Complete were not measured at these insets (see T2). Pixel7 (915 x 412) and
  the tablet are fine: quit bottom 368.95 <= 380 and 379 <= 380 even at the largest font.
- **Expected vs actual:** expected every title/menu element within [24, 328] at 640 x 360 with real insets;
  actual overflow of 13 dp at both ends.
- **Suggested direction (developer's call):** tighten the title layout at short heights (gap between Start and
  the other buttons is 28 dp, the heading is 47 dp), or scale/scroll the menu column; add a test (T2) that
  every visible menu element lies inside the full insets at `640x360` with `insets=30,30,28.2,32`,
  `29.7,29.7,28.2,32`, `0,48,24,0`, `48,0,24,0` and `24,24,0,24`, for title, Settings, Help, pause and end
  screens.

### F2 - pixel7 640 x 360 `wm size` run plays instead of showing the prompt; THROW is 2 dp inside the right inset (MEDIUM)

- **AC:** PRD M2.10a v1.6 (2) and M2.3b known limit ("l + r ~ 66 > 64 ... its prompt is therefore the expected
  result"), M2.3a (controls inside the full side insets). Automated proxy `too-small-window.spec.ts`
  "a side-inset width shortfall shows the prompt even at 640x360" (passes).
- **Device:** `svr_api36_pixel7`, landscape (ROTATION_90), gesture nav, `adb shell wm size 945x1680`
  (= 640 x 360 dp at 420 dpi). CDP: `inner [640,360]`, `#safe-layer` `inset: 28.1905px 29.7143px 32px 36.1905px`
  (l + r = 65.9 > 64), **`.rotate-prompt` is `hidden`**, `--pf-scale 0.5001`, canvas `[156.19, 30.81, 400.1, 300.07]`.
  Controls: left `[36.19,273,56,56]`, right `[100.19,273,56,56]`, **throw `[556.29,273,56,56]` right edge
  612.29 > 640 - 29.71 = 610.29**, pause `[560.29,44.19,48,48]`. The canvas ends at x = 556.19, the THROW
  starts at 556.29 (0.1 dp gap). Screenshot `screenshots/m2_10a_pixel7_640x360_playing_round4.png`,
  `screenshots/m2_10a_pixel7_640x360_real_insets_prompt_round4.png` (pause menu, no prompt).
- **Chromium disagrees with the same numbers:** viewport 640 x 360, DPR 2.625,
  `?insets=36.1905,29.7143,28.1905,32` and `?insets=36.2,29.7,28.2,32` both show the prompt.
- **Expected vs actual:** expected the M2.10a prompt (PRD, architecture, test); actual a squeezed but playable
  layout with THROW 2 dp under the right gesture inset. Either the layout math has a tolerance/rounding path
  the unit and e2e tests do not reach (for example a different insets normalization for the real
  GameShell payload than for `?insets=`), or the PRD text is out of date. The developer must find out which;
  do not change the test to match the device without a spec decision.
- **Not a blocker for the M2.3b (e) row:** the reference AVD itself (no cutout) is fine.

### F3 - Real three-button navigation on the reference AVD shows the prompt (INFO/spec question, not blocking by itself)

- **Device:** `svr_api36_lowend_640x360`, `cmd overlay enable-exclusive --category
  com.android.internal.systemui.navbar.threebutton` (`navigation_mode 0`), cold start. `#safe-layer`
  `inset: 24px 0px 48px` (t=24, l=r=0, **b=48**); the app shows "Make the window larger to play."
  (`screenshots/m2_3b_lowend_3button_title_round4.png`). `dumpsys window`: `navigationBars frame=[0,624][1280,720]
  sideHint=BOTTOM`.
- **Cause:** the AVD's display is natural-landscape (1280 x 720), so Android keeps the bar at the bottom in every
  rotation. PRD M2.3b (b) only specifies side bars ((0,48,24,0), (48,0,24,0)). With a 48 dp bottom bar the
  text bands (24 + 48) plus a 300 dp playfield exceed 360 dp, so the prompt is correct under the current formula.
- **Why it is not a FAIL by itself:** real phones are natural-portrait; on `svr_api36_pixel7` (a real phone shape)
  both landscape directions with three-button nav put the bar on the side and play (see device matrix), which
  is the case (b) describes. Real 640 x 360 natural-landscape hardware is essentially not a thing.
  Recorded so the PM can decide whether a bottom bar on a natural-landscape 640 x 360 device needs a statement.

## Part 4 - Device matrix summary (detail in `device-matrix.md`, round-4 section)

| AVD | Result |
|---|---|
| `svr_api36_lowend_640x360` | Plays 30 s with HUD/hint text/controls inside the real insets. **F1 on the title menu.** Real shrink/restore OK. Largest font: title worse (F1). 3-button: prompt (F3). |
| `svr_api36_pixel7` (-gpu host) | PASS play, back, home/resume, shrink/restore (state identical), 3-button both landscape directions, largest font. **F2** on the 640 x 360 run. |
| `svr_api36_tablet` (-gpu host) | PASS (first boot with swiftshader hit a SystemUI ANR = emulator environment; re-ran with host GPU). |
| `svr_api36_fold` (natural CLOSED) | PASS for M2.10a (a)/(d). Unfolded state does not resize the window (known AVD limit). Procedure recorded. |
| `svr_api30_mid` | PASS (3-button, plays, back, home/resume). |
| `svr_api29_webview` (API 28, WebView 69) | PASS (fallback text, 0 FATAL). |
| `svr_api24_small` (API 24) | PASS (launch, alive, 0 FATAL). |

## Part 5 - Carry-forwards and notes

- Emulator screenshot lag: on the swiftshader lowend AVD a screenshot 1.5 s after `wm size reset` showed a stale frame while the DOM
  was already correct; a screenshot 2 s later was correct. Treat as emulator compositing, not an app defect, but the 1 s M2.9 bound cannot be
  proven to the pixel with `screencap`.
- Layer timing: the prompt appeared within 614 ms of `wm size` returning on pixel7 (each CDP poll costs about 250 ms). The restore was seen
  at the first poll, +1430 ms including Node startup. Indicative only.
- The gameplay hint text ("< > move . THROW . II pause") sits over ShieldMan at the bottom-centre on the 640 x 360 profile
  (`m2_3b_lowend_playing_round4.png`). For UX round 2.
- On Help open at 640 x 360 the title heading remains visible in the top band above the opaque Help panel
  (`m2_3b_lowend_help_round4.png`). Cosmetic, for UX round 2 (related to F1).
- `svr_api30_mid` `user_rotation` was `0` before and deleted after (equivalent default). Every other override was restored exactly.
- Known gaps unchanged: M2.9 real fold/unfold resize is not exercisable on the fold AVD; pre-API-30 with a modern WebView is blocked on the
  owner's Play sign-in.

## Routing

FAIL routes to `mobile-junior-developer` (step 7) with F1 and F2 (and T2/T3 as test requests for `mobile-junior-tester`),
then `mobile-lead-developer` (step 8). F3 goes to `mobile-product-manager` as a question. `mobile-ui-ux-designer` round 2 must not start.
