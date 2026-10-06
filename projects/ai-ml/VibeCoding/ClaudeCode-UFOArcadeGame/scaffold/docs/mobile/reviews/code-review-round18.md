# Code Review Round 18: Mobile Pipeline Step 8

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Verdict: PASS (step-8 code gate).** All findings are Low. mobile-junior-tester may start step 9 for the UAT F1/F2/O5 change.

- **Reviewer:** mobile-lead-developer
- **Date:** 2026-09-30
- **Branch / base:** `claude/project-thread-rm5222`, uncommitted diff vs HEAD `afa31a4`, plus untracked `tests/mobile-e2e/menu-gaps.spec.ts`
- **Scope:**
  1. UAT F1 (Confirm/Cancel touching) and F2 (menu rows 6 dp apart): `src/platform/android/android.css`.
  2. UAT O5 (long-press `contextmenu`): `src/platform/android/AndroidPlatform.ts`.
  3. code-review-round17 L3 (per-call knuckle table): `src/render/shapes.ts`.
  4. New test `tests/mobile-e2e/menu-gaps.spec.ts`.
- **Specs used:** `docs/mobile/tests/uat-results.md` (F1, F2, O5); `code-review-round17.md` (L3); `PRD-mobile.md` M2.3b rule 3, M2.3c rule 3, M2.11, M3.1, M3.7, M3.8; `mobile-architecture.md` §5.3, §5.4, §6.5 A13; the coding-standards and mobile-touch-and-layout skills.
- **Not re-read this round:** the mobile ADRs. The diff changes no architecture decision, lifecycle, back or input-source code.

## 1. Summary

- **F2 is fixed.** Adjacent menu buttons are 8 dp apart on every menu at phone heights and 12 dp on the tablet (§3).
- **F1 is fixed.** Confirm and Cancel are 8 dp apart side by side on all four profiles, and 8 dp apart when stacked (§3).
- **48 dp targets are kept.** The smallest button height measured at the default font is 48 dp on every menu and profile.
- **Every menu still fits at the exact A13 bound.**
  - At safe height 291.5 dp the title column is 289 dp, leaving 2.5 dp of headroom, and nothing scrolls.
  - The existing `menu-insets.spec.ts` exact-bound case (tolerance 0.01, "no scrolling at the default font") passes in both layouts.
- **Enlarged fonts still scroll inside the insets.** The overlay box stays at the inset rectangle (30,24 to 610,328 on the reference phone) and the gaps stay at 8 dp.
- **Android CSS stays scoped.**
  - Every new or changed rule starts with `html.platform-android`.
  - `git diff HEAD` is empty for `src/style.css`, `index.html`, `src/ui`, `src/core` and `android/`.
  - The website CSS bundle keeps its hash (`index-Bee-yMjM.css`) and the web bundle contains no `platform-android`.
- **`shapes.ts` is geometry-neutral.**
  - The four `[x0, x1]` pairs moved unchanged into a module-level `FIST_KNUCKLES` constant, and the loop body is untouched.
  - The glyph unit tests pass.
  - The website JS hash changed, as expected for a shared file.
- **The `contextmenu` handler has no side effect on touch input.**
  - It only calls `preventDefault()` on `contextmenu`; pointer and click events are untouched.
  - In the probe, a PAUSE tap straight after a `contextmenu` on the playfield still paused the run.
  - It covers the playfield and all menus, but not the inset bands (L1).
- **The new test discriminates.** Reverting any one of the three fixes drops the measured gap below 8 dp on the screen that depends on it (§3). Its "wrapped Confirm/Cancel" case never actually wraps (L2).

## 2. Verification (run by me)

| Check | Result |
|---|---|
| `npm run check:secrets` | Clean (the one S1 template exemption notice, scanned clean) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test` | 32 files, **627/627 passed** |
| `npm run build` (website) | OK: `index-BhtWH2Pu.js`, `index-Bee-yMjM.css` |
| `npm run build:android` | OK: `index-D27qdc4w.js`, `AndroidPlatform-Buajo9VM.js`, `AndroidPlatform-CzKXBBts.css` |
| Playwright `--repeat-each=3 --workers=4 --retries=0` | **633/633 passed** in 8.4 min, no flakes (609 in round 17, plus 24 `menu-gaps` runs: 2 tests × 4 projects × 3) |
| `powershell.exe -NoProfile -File scripts\refresh-android-mirror.ps1` | robocopy exit 3 (informational). **Parity check passed**: 136 files plus 6 named files. |
| Mirror: `build:android`, `npx cap sync android`, `gradlew.bat assembleDebug --no-daemon` (JDK 21.0.12, SDK `C:\Users\aaron\Android\sdk`) | **BUILD SUCCESSFUL** in 19 s. `app-debug.apk` is 3,963,301 bytes. The synced CSS contains `confirm-box .menu-item{margin:8px 4px 0}` and the synced JS contains the `contextmenu` listener. |
| Gap, fit and `contextmenu` probe (scratch script against `vite preview` of `dist-android` on port 4178) | See §3 |
| `npx prettier --check` on the 4 changed files | 3 clean once line endings are normalized; `menu-gaps.spec.ts` is not formatted (L4) |
| Cleanup | Preview server on 4178 stopped; no listener on 4174-4179; no `java`, `adb` or emulator process left |
| `git status --porcelain` before vs after | Identical: the same 3 modified files and 1 untracked file |
| Denied commands | None |
| Emulators | None started |

**Not done:**
- No scratch rebuild with the CSS reverted. The fixes were reverted by injecting override styles into the built Android bundle and re-running the test's own measurement function.
- Nothing was measured on a device or emulator; the UAT re-run covers that.

## 3. Measurements

Smallest gap between any two visible `.menu-item` buttons, in dp, using the same function as `menu-gaps.spec.ts`. "Reverted" columns show the gap with one fix overridden back to its old value.

| Profile (default font) | Title | Settings | Pause | Confirm/Cancel | Confirm/Cancel stacked (forced) |
|---|---|---|---|---|---|
| 640 × 360 | 8 | 8 | 8 | 8 | 8 |
| 800 × 360 | 8 | 8 | 8 | 8 | 8 |
| 915 × 412 | 8 | 8 | 8 | 8 | 8 |
| 1280 × 800 | 12 | 12 | 12 | 8 | 8 |
| 640 × 360, insets 0,0,30,38.5 (A13 exact bound) | 8 | 8 | 8 | 8 | 8 |
| 640 × 360, insets 30,30,24,32 (reference phone) | 8 | 8 | 8 | 8 | 8 |

| Fix reverted | Title | Settings | Pause | Confirm/Cancel |
|---|---|---|---|---|
| `.screen-overlay` gap back to 6 | **6** | **6** | 8 | not affected |
| `.menu-list` gap back to 6 | **6** | 8 | **6** | not affected |
| `.confirm-box .menu-item` margin removed | not affected | not affected | not affected | **0** (side by side and stacked) |

- Each fix is caught by at least one screen in the walk, so the test fails if any one of them is reverted.
- With the enlarged fonts the gaps are the same on all six rows (8 dp, 12 dp on the tablet).

Fit at the default font:

| Window | Safe height | Title column | Scrolls? |
|---|---|---|---|
| A13 exact bound (0,0,30,38.5) | 291.5 | 289 (31.25 to 320.25; box 30 to 321.5) | No |
| Reference phone (30,30,24,32) | 304 | 289 (31.5 to 320.5; box 24 to 328) | No |

- Settings, pause and the Restart Game prompt do not scroll in either window.
- With enlarged fonts the title (407 dp of content) and pause menu (380 dp) scroll inside the overlay box, which stays at the inset rectangle.

`contextmenu` dispatched at a point, reference-phone insets:

| Point | Target | Default prevented? |
|---|---|---|
| Title, centre | `.screen-overlay` | Yes |
| Playfield centre, during play | `#safe-layer` | Yes |
| Bottom band (y = 350) | `body` | **No** |
| Top band (y = 10) | `body` | **No** |
| Left inset (x = 10) | `body` | **No** |

## 4. Findings

### L1 (Low, suggested): `contextmenu` is not cancelled outside `#safe-layer`

- **Where:** `src/platform/android/AndroidPlatform.ts:199`.
- **Problem:** the listener is on `screenFit.clickRoot`, which is `#safe-layer`.
  - A long-press in the top, bottom or side inset bands lands on `body` and is not cancelled.
  - `.rotate-prompt` is a `body` child outside `#safe-layer`, so a long-press on the too-small or rotate prompt is not cancelled either.
- **Why Low:**
  - O5's stated case (the playfield) is covered.
  - `MainActivity.java:26-27` already sets `setLongClickable(false)` and `setHapticFeedbackEnabled(false)`.
  - UAT saw nothing on screen even before this change.
- **Fix:** attach the listener to `document` instead. The separate one at `TouchControls.ts:140` then becomes redundant and can be removed.

### L2 (Low, suggested): the "wrapped Confirm/Cancel" test case never wraps

- **Where:** `tests/mobile-e2e/menu-gaps.spec.ts`, test "every menu, enlarged fonts (wrapped Confirm/Cancel included)".
- **Problem:** with the injected 36 px button font, Confirm and Cancel stay side by side on all four projects (for example x 96-316 and 324-544 at 640 × 360). The stacked layout that the CSS comment and the test title describe is never exercised.
- **Evidence the CSS is right anyway:** forcing a wrap with `max-width: 300px` on `.confirm-box` gave an 8 dp stacked gap, and 0 dp with the margin removed.
- **Fix:** either inject a narrow `.confirm-box` max-width in that test and assert the two buttons have different `top` values before measuring, or rename the test.
- **Owner:** mobile-junior-tester (step 9).

### L3 (Low, suggested): stale comment still says 6 px

- **Where:** `src/platform/android/android.css:140-143`, the comment above the `.menu-list` 12 px rule.
- **Problem:** it reads "(the short-window media query below already evens them at 6px)". The media query now uses 8 px.
- **Fix:** change "6px" to "8px".

### L4 (Low, suggested): formatting and line endings

- **Where:** `tests/mobile-e2e/menu-gaps.spec.ts`, and the working copies of the three changed `src` files.
- **Problem:**
  - `menu-gaps.spec.ts` fails `prettier --check` (lines over 100 columns). This is the same state as `menu-insets.spec.ts` at HEAD (round-17 L4); `npm run lint` covers only `src`.
  - The three changed `src` files have CRLF line endings in the working tree, so a local `npm run format` warns on them. Git stores them as LF and the LF content is prettier-clean, so the committed result is fine.
- **Fix:** run prettier on the spec file; no action is needed on the CRLF beyond knowing why `format` warns locally.

### L5 (Low, informational): 2.5 dp of headroom at the A13 bound

- **Where:** `src/platform/android/android.css:181-205`.
- **Problem:** the title column is 289 dp against 291.5 dp, so any further title row or gap increase makes the title scroll at the bound. A "New best!" line would add about 27 dp.
- **Status:** not a defect. The overflow path scrolls inside the insets, and the exact-bound test would report a default-font overflow. Noted for mobile-ui-ux-designer's round at step 11.

### Note (pre-existing, not from this diff)

- At the test's 2× fonts, a button with `min-height: 48px` in an overflowing overlay flex-shrinks to 48 dp while its 36 px text needs about 61 dp (the Start button measured 48 dp tall at 640 × 360).
- This cannot happen at the 130 % `textZoom` cap, where a button needs about 47 dp, so I raise no finding.

## 5. Standards conformance

- **coding-standards**
  - Style: PASS. One-line listener, one hoisted constant, no dead code.
  - Error handling: N/A. Logging: N/A.
  - Code documentation: PASS with L3. Each change carries a "why" comment citing its UAT finding and criterion, and `FIST_KNUCKLES` has a docstring.
- **mobile-touch-and-layout**
  - Touch targets: PASS (48 dp kept, 8 dp or more between adjacent menu targets).
  - Browser defaults: PASS with L1 (long-press cancelled across `#safe-layer`).
  - Screen fitting: PASS (menus inside the insets at the A13 bound and at enlarged fonts).
  - Timing, lifecycle, back: untouched.
- **Platform pitfalls**
  - No game logic duplicated or branched per platform; `shapes.ts` stays shared and both builds draw the same glyph.
  - No frame-count timing added.
  - No listener that needs removing on background: the new one is passive in effect and attached once at init.
  - No hand edits under `android/`; the mirror assets were regenerated by `cap sync`.

## 6. Routing

- **Step 9 (mobile-junior-tester) may start.** L2 belongs there, along with taking ownership of `menu-gaps.spec.ts` (UAT routed the gap assertion to step 9).
- **mobile-junior-developer:** L1, L3, L4 (suggested, non-blocking).
- **mobile-ui-ux-designer (step 11):** confirm the 8 dp gaps and the 1.2 heading line height on phone-height windows (UAT F2 asked for the designer's confirmation), and note L5.
- **Website pipeline:** `src/render/shapes.ts` is shared, so the website code-reviewer gate still applies to that hunk before either version ships.
- **UAT re-run (step 14):** UAT-13 and UAT-14 on one committed build, per the UAT next steps.
