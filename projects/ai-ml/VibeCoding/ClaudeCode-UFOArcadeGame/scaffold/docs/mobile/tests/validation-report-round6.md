# Mobile Test Validation Report - Round 6

**Stage:** Mobile Pipeline Step 10 - mobile-lead-tester (independent verification)
**Date:** 2026-09-30
**Verdict:** **PASS** (mobile-ui-ux-designer round 2 may start), with one intermittent-test finding (L1) that the owner of the tests should fix.

**One-line reason:** shared/website tests 627/627, both builds, secrets, styles and manifest checks are green; the new menu-gap and power-up-glyph tests fail when the code is broken (proved by mutation); on four emulators every menu now has at least 8 dp between buttons and fits at font scale 1.0 and 2.0, all four power-up tokens were captured in play on lowend and pixel7, long-press shows no context menu, and the fold "slow prompt" is emulator warm-up, not the app.

Inputs: `docs/mobile/PRD-mobile.md`, `docs/PRD-addendum-v5.md` r3 F23 (via `manual-only-criteria.md`), `docs/mobile/tests/uat-results.md`, `manual-only-criteria.md`, earlier reports. Committed HEAD `57f159e`, working tree clean. Raw output: `raw-output-round6.log`. Device detail: round-6 section of `device-matrix.md`. Screenshots: `screenshots/*_r6.png`.

---

## Part 1 - Test quality (test-strategy)

Reviewed: `tests/mobile-e2e/menu-gaps.spec.ts` (new), `src/render/powerUpGlyphs.test.ts` (new, 67 tests), changes to `cutout-insets.spec.ts`, `text-scale-fit.spec.ts`, `playwright.mobile.config.ts`, `scripts/check-no-secrets.test.mjs`.

**menu-gaps.spec.ts (M3.1 / M3.8, UAT F1 F2) - discriminating.** It measures the real bounding boxes of every `.menu-item` in each overlay and takes the larger of the horizontal and vertical separation, so side-by-side and stacked buttons are both handled. It also checks the 48 dp height, the button count, and that the Confirm/Cancel layout under test really is side-by-side or stacked (a case that silently wraps the wrong way fails). Three tests x four viewports. I proved it fails on the old behavior in a scratch copy (repo untouched):
- Mutation A, `android.css` short-window gap 8px back to 6px, 640x360: all 3 tests fail, `Title: smallest gap between adjacent buttons  Expected: >= 7.99  Received: 6`.
- Mutation B, `.confirm-box .menu-item` margin removed (the UAT F1 state), all 4 viewports: 12 of 12 fail, `Restart Game confirmation (side-by-side|stacked): smallest gap between adjacent buttons  Received: 0`.

Limits (INFO): Game Over and Game Complete are injected markup (shared constants, covered by `endScreenMarkup.test.ts` against the real renderer), and Chromium has no real Android font scale, so the large-font cases use injected CSS; the device run below covers that.

**powerUpGlyphs.test.ts (F23 AC1-AC4, AC6(a), AC7) - discriminating, not tautological.** It runs the real `drawPowerUp` against a recording 2D context and checks recorded geometry at r = 12 and r = 20: ring/disc identical, one simple closed outline for fist and rabbit, no "+", paint style, +-0.45r bound, fist box and 3-4 knuckle bumps, rabbit two ears pointing up/back and a horizontal body, shield circle radius, X arm size, and that each glyph matches only its own signature. Mutations on a scratch `shapes.ts`, all caught except the one that is legal under the AC:

| Mutation | Result |
|---|---|
| X changed to "+" | 5 failed |
| fist knuckle height flattened | 4 failed |
| fist with 2 / 5 knuckles | 4 failed / 4 failed |
| fist with 3 knuckles (AC allows 3-4) | 67 passed (correct) |
| rabbit ears folded down / one ear only | 4 failed / 8 failed |
| shield circle 0.34r to 0.6r | 4 failed |
| shared ring stroke 2 to 3 | 2 failed |
| extra stroke on the fist | 2 failed |
| X arms 0.35r to 0.6r | 4 failed |

AC5, AC8-AC10, AC6(b), AC4.2(d) and Q-v5-1 are correctly listed as manual-only in `manual-only-criteria.md`. AC7's `{ 'shapes.ts': 4 }` count is intentionally exact (it needs a conscious update if a second X is ever drawn); INFO.

**Other changed tests.** `cutout-insets.spec.ts`: one-off reads replaced by `expect.poll` against the post-inset fit, with a guard that the canvas has left the pre-fit box (removes a race, still asserts the same bounds). `text-scale-fit.spec.ts`: scales the THROW/WAIT `<text>` and adds an SVG-bounds check (closes review L3). `check-no-secrets.test.mjs`: new case that `#sk-proj-...` and `.sk-...` keys with digits still fail (round-16 L1). All discriminating; no orphan tests.

**Gap (L2, INFO):** the `contextmenu` `preventDefault` added to `AndroidPlatform.ts` (O5) has no automated test. A Playwright test that dispatches a cancelable `contextmenu` event on a menu button and on the canvas and asserts `defaultPrevented` would be cheap. It was verified on a device this round, so not blocking.

## Part 2 - Full suite (unabridged in the raw log)

| Check | Result |
|---|---|
| `check:secrets`, `typecheck`, `lint` | exit 0 |
| `npm run test` (website + shared + scripts) | **32 files, 627 tests passed** (round 5: 540); includes `powerUpGlyphs.test.ts` 67 and `check-no-secrets.test.mjs` 54 |
| `npm run build` / `build:android` | exit 0 / exit 0 |
| `check:android-styles`; `check-android-manifest --variant debug` on the new APK | exit 0; PASSED |
| Playwright mobile `--repeat-each=3 --retries=0`, run 1 | **643 passed, 2 failed** (8.2 m) - see Part 3 |
| Playwright mobile `--repeat-each=3 --retries=0`, run 2 (same build, nothing changed) | **645 passed, 0 failed** (7.8 m) |
| Isolated `slide-switch` + `menu-insets`, `--repeat-each=10` | 339 passed, 1 failed (the same slide-switch case, at 915x412) |
| Mirror refresh / `build:android` / `cap sync` / `gradlew assembleDebug` | parity passed (136 files + 6 named); BUILD SUCCESSFUL (20 s); `app-debug.apk` 3,963,301 bytes |

No website regression.

## Part 3 - Failures (verbatim; intermittent, not caused by round-6 changes)

**L1 (low). `tests/mobile-e2e/slide-switch.spec.ts:418:3` "M3.3a - 40/40 continuous slide-to-switch > default layout: 20 L->R and 20 R->L continuous swipes all switch cleanly", failed once at `[1280x800]` repeat1 (full run 1) and once at `[915x412]` repeat4 (isolated run). Maps to PRD M3.3a (slide-to-switch) rule 2 "no drop".**
```
Error: not enough recorded frames while crossing the gap to check rule 2 (increase CROSS_MS or check the recorder)
expect(received).toBeGreaterThanOrEqual(expected)
Expected: >= 2
Received:    0
  349 |     gapFrames.length,
  350 |     'not enough recorded frames while crossing the gap to check rule 2 (increase CROSS_MS or check the recorder)',
> 351 |   ).toBeGreaterThanOrEqual(2);
    at runOneSlide (tests\mobile-e2e\slide-switch.spec.ts:351:5)
    at runFortySwipes (tests\mobile-e2e\slide-switch.spec.ts:411:5)
    at tests\mobile-e2e\slide-switch.spec.ts:425:5
```
Artifacts (uncommitted): `test-results\slide-switch-M3-3a---40-40-78a77-s-swipes-all-switch-cleanly-1280x800-repeat1\` (`test-failed-1.png`, `trace.zip`, `error-context.md`).
Reading: the test's frame recorder saw zero frames during a swipe's crossing window, a timing-starvation condition (the message itself points at the recorder). The file was last changed in `2cb1cc9` (round 5, which passed 3x clean); round 6 touched neither it nor the code it drives. Rate about 1 in 100 runs of this test on this machine. Because this project's one CI check also gates the website deploy, an occasional red build has a real cost, so mobile-junior-tester should make the recorder tolerant (wait for frames with `expect.poll`, or lengthen CROSS_MS) or document the timing assumption. Not a product defect; not blocking.

**Infrastructure (not a test failure). Full run 1, `[640x360] menu-insets.spec.ts:220:7 ... measured gesture insets 30,30,28.2,32`, repeat1:**
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4174/?insets=30,30,28.2,32&e2e=1
```
The preview server did not answer one navigation. The same test passed in all 10 repeats of the isolated run and in all of run 2 (menu-insets at 8 dp spacing: 0 geometry failures).

## Part 4 - UAT findings re-checked on devices

| ID | Result | Evidence |
|---|---|---|
| F1 Confirm/Cancel touch (0 dp) | **CLOSED** | Gap 8 dp on lowend, pixel7 and tablet at font 1.0 and 2.0 (`*_confirm_gap_r6.png`). |
| F2 menu rows 6 dp apart | **CLOSED** | Title/Settings/Pause rows 8 dp apart on lowend and pixel7 (12 on tablet), all at least 48 dp tall. At font 2.0 on lowend the title is 24.4-327.6 inside the 24-328 band (0.4 dp to spare) and does not scroll; every other menu and device has more room. Numbers in `device-matrix.md`. |
| F3 fold prompt over 5 s | **Ruling: emulator warm-up, not the app. Behavior and timing PASS** | Settled fold: TotalTime 1430-1588 ms, prompt visible at 1.72-1.84 s (5 runs). Right after boot: 5.5 s first launch, then 4.8, 3.6, 2.7, 2.5, 1.6, 1.5 s. Same curve on other AVDs (first launch after clear 5.3 s lowend, 5.4 s tablet, 8.3 s pixel7). Same APK and same AVD config (4 cores, 1536 MB) as pixel7. logcat `Displayed` equals `am start` TotalTime. |
| O5 long-press context menu | **PASS (device)** | `contextmenu` fired and was prevented for a menu button, the title text, the playfield, THROW and the move control; no popup, empty selection (`lowend_O5_longpress_*_r6.png`). No automated test (L2). |
| F23 tokens in play | **Captured: all four, both profiles** | `m2_7_{lowend,pixel7}_powerup_{fist,rabbit,circle,X}_r6.png` plus close-up sheets. On lowend the fist reads as a block with small knuckle ticks and the rabbit is only about 10 px wide; both are distinguishable from each other and from the circle and X. AC6(b) legibility is the UX reviewer's call. |
| N1 frame rate | **Not re-measured**, unchanged | Needs real hardware (closed test). About 10 minutes of bot play on lowend and pixel7 (`-gpu host`) showed no obvious stutter, but no number was taken. |

Crashes: 0 `FATAL EXCEPTION` on lowend, pixel7, fold and tablet. Stale evidence: the two `m2_7_lowend_powerups_*_round6_b2.png` files (old icons) were deleted; `m2_7_lowend_mixed_robots_powerups_L3_round6_b2.png` still shows the old icons (ignore).

## Part 5 - Not covered this round (carried forward, not hidden)

Frame rate (N1), levels 2-10 and bosses (N2), real edge back-swipe (N3), incoming call (N4), real fold/split screen and portrait window (N5). The api30, api28 and api24 AVDs were not started because the diff has no WebView-version-sensitive change.

## Verdict basis

The tests are correct and discriminating (mutations prove it), the device-matrix rows touched by round 6 pass, the website/shared tests pass, and the full mobile suite passed 645/645 on a clean run with `--retries=0`. The only open items are L1 (an unchanged timing test that flakes about once per 100 runs) and L2 (no automated test for the contextmenu cancel); neither blocks round 2.
