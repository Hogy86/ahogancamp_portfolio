# Code Review, Round 14 (Mobile Pipeline Step 8)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.
>
> Main-session note (2026-09-29): L4 and L5 below say the round-13 test carry-forwards are still open. They were already done by mobile-junior-tester and committed in `ecb2508`, the base of this review: `layout.test.ts` has A13 rows 21-24, `menu-insets.spec.ts` has the exact 0,0,30,38.5 bound, `src/ui/endScreenMarkup.test.ts` checks the real end-screen markup, and `screenFit.test.ts` restores the stubbed `innerWidth`/`innerHeight`. The reviewer only looked at the diff against `ecb2508`, so it did not see them. L4 and L5 are treated as closed.

**Verdict: PASS**, with LOW findings to carry forward. There are no required fixes. mobile-junior-tester (step 9) may start.

- **Reviewer:** mobile-lead-developer
- **Date:** 2026-09-29
- **Branch:** `claude/project-thread-rm5222`
- **What was reviewed:** the uncommitted diff against HEAD `ecb2508`, plus these untracked files: `src/platform/android/glyphs.ts`, `tests/mobile-e2e/hint-position.spec.ts`, `docs/mobile/ux/design-review-round3.md` and the `*_round6.png` screenshots. I reviewed files and specs only.
- **Specs used:** `docs/mobile/architecture/mobile-architecture.md` v1.7 (§6.5 A12 text inventory and change control, §12 MR21), `docs/mobile/PRD-mobile.md` (M2.3b, M2.4, M2.10a, M6), `docs/mobile/ux/design-review-round3.md` (B1, F1-F5, F7, F10), `docs/mobile/reviews/code-review-round13.md` (L1, L6), and the coding-standards and mobile-touch-and-layout skills.

## 1. Summary

The change fixes UX round 3 finding B1 and findings F1-F5, F7 and F10, plus round-13 L1 and L6. All of it stays inside `src/platform/android/` and the new e2e spec.

- **Shared code is untouched.** `git diff HEAD` shows no change to `index.html`, `src/style.css`, `src/ui/*`, `src/core/*`, `src/systems/*`, `src/config/*`, `src/main.ts`, `src/platform/web/*` or anything under `android/`.
- **B1 (hint covering ShieldMan):** on Android, `#control-text` now sits 24 dp above ShieldMan's row (`bottom: calc(48px + 24px / var(--pf-scale))`, `android.css:34-37`). The new e2e spec checks that the hint's bottom is at or above the hero's top on all four viewports, with and without insets. On the pixel7 the hint's bottom is at 334.3 dp and the hero's top is at 357.8 dp.
- **F1 (HUD and hint showing through menus):** `AndroidPlatform.publishState` writes `<html data-vvs-state>` only when the state changes. The CSS hides the hint unless the state is PLAYING, and hides the HUD unless it is PLAYING or PAUSED.
- **F2 (button glyphs):** the arrows and pause bars are now inline SVG built with `createElementNS` and `setAttribute` only (`glyphs.ts`). The accessible names (`aria-label`s) are unchanged. The recharging state now reads `WAIT`.
- **F3 (copy):** the Help text is three stacked lines and names ShieldMan. The hint copy is words, not symbols.
- **F4 (title showing around Help):** the `vvs-shell-overlay-open` class hides `#overlay-root` while a shell overlay is open. `renderStack()` sets and clears it on every push and pop.
- **F5 (uneven menu gaps):** `.menu-list` now uses one 12 px gap.
- **F10 (empty HUD panel):** `.hud-panel:empty { display: none }`.
- **L1 (page zoom-out on the prompt):** `lockMinimumPageScale()` rewrites the viewport meta at Android startup. `index.html` is untouched.
- **L6 (formatting):** Prettier is now clean on every file in `src/platform/android/`. I checked that the diffs to `layout.test.ts`, `moveZone.test.ts`, `screenFit.test.ts` and `settings.test.ts` are formatting only: running Prettier on the HEAD version of `layout.test.ts` gives the working copy byte for byte, and a whitespace-insensitive word diff of the other three shows only line wrapping and trailing commas.

## 2. Verification (run by me)

| Check | Result |
|---|---|
| `npm run check:secrets` | Clean: "no tracked secret-shaped content found" |
| `npm run check:android-styles` | Clean |
| `npm run typecheck` | 0 errors |
| `npm run lint` (includes the L4b rule banning innerHTML-style and eval sinks) | 0 errors, 0 warnings |
| `npm run test` | **31 files, 540 tests passed** |
| `npm run build` (website) | Succeeds. `dist/index.html` keeps `content="width=device-width, initial-scale=1.0"`. |
| Website bundle purity: grep of `dist/` (including the source map) for `minimum-scale`, `vvsState`, `vvs-state`, `touch-glyph-svg`, `createElementNS`, `vvs-shell-overlay-open` and the new hint copy | **No matches.** None of the new code reaches the website. |
| `npx prettier --check src/platform/android` | Clean |
| `npm run build:android`, then `npx playwright test -c playwright.mobile.config.ts --repeat-each=3` | **489 passed** in 4.6 min, including hint-position.spec.ts: 3 tests × 2 inset cases × 4 projects × 3 repeats |
| `git status --porcelain` before and after the build and Playwright runs, and again at the end | Identical |
| `powershell.exe -NoProfile -File scripts\refresh-android-mirror.ps1` | "Parity check passed: 132 file(s) … identical. Mirror refresh complete and verified" |
| In the mirror: `build:android`, `npx cap sync android`, `gradlew.bat assembleDebug --no-daemon` (JDK 21.0.12, SDK at `C:\Users\aaron\Android\sdk`) | **BUILD SUCCESSFUL.** `app-debug.apk` is 3,961,821 bytes. The synced `AndroidPlatform-*.js` contains `minimum-scale=1` and `vvsState`. |
| `check-android-manifest.mjs --variant debug --apk …` with `AAPT2_PATH=<sdk>/build-tools/36.0.0/aapt2.exe` | **PASSED** |

### Device checks on `svr_api36_pixel7` (`-gpu host`, debug APK, CDP over `adb forward`)

| Scenario | Measured |
|---|---|
| Cold start, title | The viewport meta reads `width=device-width, initial-scale=1, minimum-scale=1`. `visualViewport.scale` is 1 at 915 × 412, DPR 2.625, `data-vvs-state=TITLE`. `#hud-root` and `#control-text` are `visibility: hidden`. The screenshot shows no ghost HUD stubs and no hint box under Quit, and the four title buttons are evenly spaced (F1 and F5 fixed). |
| PLAYING | The hint is visible, border box [374.4, 314.4, 634.7, 334.3] dp. The canvas top is 26.6 dp at s = 0.6, so the hero's top is 26.6 + 552 × 0.6 = 357.8 dp, a 23.5 dp clearance. The screenshot shows ShieldMan fully clear below the hint (B1 fixed). Three `<svg>` glyphs (SVG namespace) render at 28 × 28 in `currentColor`. HUD panels are 4 shown and the empty effects panel is `display: none` (F10). |
| PAUSED (PAUSE tapped at 2240, 180 px) | The hint is hidden and the HUD is visible (dimmed), as F1 asked. |
| **L1 acceptance:** live `wm size 945x1680` while paused | The prompt shows (`rotate-prompt` without `hidden`). **`visualViewport.scale === 1`**, and `innerWidth × innerHeight` and the visual viewport are both 640 × 360. In round 13 these were 0.868 and 737 × 415. The prompt text is full size in the screenshot. `#overlay-root` is hidden under the prompt. **L1 closed.** |
| `wm size reset` | The prompt hides, the game is still PAUSED on the pause menu (Resume / Restart Level / Restart Game / Quit), and the scale is 1. |
| Pause → Quit | The app closes to the launcher, as PRD M6.1 requires. On relaunch the state is TITLE. |
| Title → How to play | `html` has `vvs-shell-overlay-open`. `#overlay-root` is hidden and focus moved to `BODY`, not to a hidden button. The three Help lines match F3 and the screenshot shows no title bleed (F4). Back closes Help, the class is removed, `#overlay-root` is visible again and the state is TITLE. |

## 3. Focused checks the caller asked for

- **Nothing shared changed:** confirmed by diff (see §1).
- **No innerHTML-style sinks:** `glyphs.ts` uses `document.createElementNS` and `setAttribute` with fixed strings only. `TouchControls.appendGlyph` uses `setText` or `append(node)`. The lint gate passes and grep finds no `innerHTML`, `outerHTML` or `insertAdjacentHTML` in the Android code.
- **Website bundle purity:** confirmed (see §2).
- **The viewport rewrite has no website effect:**
  - It runs only inside `androidPlatform.init()`, which is loaded only through the Android-mode build.
  - `dist/` contains neither the string nor the function.
  - The website's `index.html` meta is unchanged.
- **Can the new data attribute cause game-state problems?**
  - `publishState` is write-only: nothing in JS reads `data-vvs-state`, and only CSS selectors consume it.
  - Its values are the fixed `GameState` union (`TITLE | PLAYING | PAUSED | GAMEOVER | VICTORY`, `src/core/types.ts:6`). No user data or score goes into the DOM through it.
  - It is written only on a change, so there is no per-frame DOM churn.
  - Before the first frame the attribute is absent, and the `:not([…='PLAYING'])` rules then hide the hint and HUD. That is the safe default.
  - Hiding the HUD on GAMEOVER and VICTORY loses nothing: both end screens print `Final Score` (`ScreenController.ts:194, 228`).
- **Is `TEXT_BOTTOM_LOGICAL` still correct?** It is now safely conservative, but its comment is stale. See L1 below.
  - On Android the hint's content-box bottom is now `48 + 24/s + 1 + 4` logical px from the playfield bottom. That is at least 77 logical px because s ≤ 1, and 93 logical px at s = 0.6.
  - The old value was 13 logical px.
  - No other playfield text is nearer the bottom edge (§6.5 A12 table).
  - `botRes`/`botMin = max(cB, b − 13·s)` therefore lets the playfield extend into the bottom inset band less than the real text position would allow. It is never more.
  - Rule 2 of §6.5 (change control) is mandatory only when text moves closer to an edge, so no constant change is required.
- **Width of the hint box:** `nowrap` makes the box 433 logical px wide on the pixel7 (font 20 px).
  - At 640 × 360 (font about 23.8 px) it is about 515 px. With a textZoom of 130 % (§7.3 cap) it is about 670 px.
  - That is under the 800 px playfield, so it does not reach the control columns.

## 4. Findings

### Required fixes
None.

### LOW (carry forward; not blocking)

**L1. The `TEXT_BOTTOM_LOGICAL` comment and the §6.5 A12 table no longer describe the Android layout.**
- **Where:** `src/platform/android/layout.ts:118-121` says "`#control-text`'s content-box bottom, logical y 587 = 600 - 13". The same claim is in architecture §6.5 A12 (table row "Control hint") and ADR-0004.
- **Problem:** since `android.css:34-37`, the Android hint's content box ends at least 77 logical px above the playfield bottom, not 13. The constant is still safe because it is conservative (see §3). But the comment states a source that is no longer true, and MR21 depends on these source comments being accurate.
- **Fix (junior developer, comment only):** keep the value 13. Change the comment to say that 13 is the website/shared `#control-text` position and is kept as a conservative bound. On Android the hint sits at `48 + 24/s + 5` logical px (`android.css`, design-review-round3 B1). Also say that lowering the Android offset below 8 logical px (the shared `bottom: 8px`) would need this constant to be reviewed.
- **Architect:** optionally add a note to the §6.5 A12 table at the next architecture revision.

**L2. `tests/mobile-e2e/hint-position.spec.ts` is not Prettier-formatted.**
- `npx prettier --check` flags it at lines 12, 46, 55 and 67 (lines over the print width).
- The 10 older `tests/mobile-e2e/*.spec.ts` files are flagged too, and `npm run format` only covers `src`. This matches the existing convention, so it is not a regression.
- **Suggested:** one formatting-only commit over `tests/mobile-e2e`, optionally with `format` extended to `tests/`.
- **Owner:** junior-tester (step 9).

**L3. Two `android.css` selectors are not scoped under `html.platform-android`.**
- **Where:** `.touch-glyph-svg` (about line 272) and `html.vvs-shell-overlay-open #overlay-root` (about line 59).
- **Problem:** the file header says "Scoped entirely under html.platform-android".
- **Runtime impact:** none. The stylesheet ships only in the Android chunk (web purity verified) and the class is toggled only by `AndroidOverlays`.
- **Fix:** prefix both selectors with `html.platform-android` so the header stays true.
- **Owner:** junior developer.

**L4 (from round 13, still open). `screenFit.test.ts` leaves stubbed `innerWidth`/`innerHeight` on `window`.**
- This round's diff to the file is formatting only.
- **Owner:** junior-tester.

**L5 (from round 13 L2-L5, still open).** These are unchanged by this diff:
- Game Over and Game Complete are still tested with injected markup (`menu-insets.spec.ts`).
- The A13 menu-fit test still does not use the exact bound from the spec.
- `layout.test.ts` still lacks the A13 rows 21-24.
- The `manual-only-criteria.md` three-button row and the drag-scroll row are still not updated.
- **Owner:** junior-tester (step 9).

### INFO (no action)

- **`lockMinimumPageScale()` does nothing if the meta tag is missing** (it uses optional chaining). This is acceptable because `index.html` always ships the tag. `minimum-scale=1` does not block zoom-in (`user-scalable` is not set), and the Android html already has `touch-action: none`.
- **`publishState(state: string)`** could take the type `World['state']` for stricter typing. This is cosmetic.
- **The hint can briefly overlap a descending formation.** It sits above the hero, so a formation that reaches it before the first throw would pass under the hint box (z-index 10). The hint fades after the first throw (M8.3) and the gap is clear at level start. This is UX's call in round 4 and was the option they chose (option 1).
- **`docs/mobile/ux/store-assets-spec.md` changed in this diff.** That is the UX reviewer's own doc revision (design-review-round3 §Marvel-avoidance), not code, so it is out of scope here.
- **Mobile pitfalls checklist:**
  - No game logic is duplicated or branched per platform.
  - No timing tied to frame count was added.
  - No new listeners or timers (only a DOM attribute and a class toggle).
  - Touch still has `touch-action: none`.
  - Back behavior was re-verified on the device (Help close, PAUSED under the prompt).
  - Canvas DPR is still 2.625.
  - There are no hand edits under `android/`: assets came from `cap sync` in the mirror.
- **Coding standards:**
  - Style: PASS, with L2 and L3.
  - Error handling: PASS.
  - Logging: N/A. Nothing new is logged.
  - Code documentation: PASS. Each new rule and function has a comment saying why, citing the design-review item. The one exception is the stale comment in L1.

## 5. Process notes (environment)

- **Emulators:**
  - I started `svr_api36_pixel7` with `-gpu host -no-snapshot-save`. It had already exited by cleanup: `adb emu kill` reported no emulator, and there was no pixel7 process.
  - I checked and ran `wm size reset` before that. With `-no-snapshot-save`, no rotation or size change persists.
  - I did not touch `svr_api36_lowend_640x360`, which another agent started at 14:30:41 (`emulator-5554`).
- **Possible interference with the other agent:**
  - My cleanup ran `adb kill-server` at about 14:30:50, before I saw the other agent's emulator.
  - An adb server that I did not start (fork-server, created 14:30:51) is running now, and `adb devices` shows `emulator-5554 device`. So their connection is up.
  - The other agent may have seen a brief adb reconnect at that moment. If their log shows an adb drop around 14:30:50, this was the cause.
- **Other state:**
  - Playwright's `vite preview` on port 4174 was stopped by Playwright itself, and nothing is listening on 4174 or 9333.
  - I removed the adb forwards.
  - The CDP helper scripts are in the session scratchpad only.
- **Permissions:** no command was denied.
- **Repo:** unchanged. `git status --porcelain` matches the baseline, and I made no Write or Edit to project files.

## 6. Routing

**PASS.**
- **Step 9 (mobile-junior-tester)** may start. Take L2, L4 and L5.
- **mobile-junior-developer:** L1 (comment only) and L3 are carry-forwards for the next code round.
- **Device matrix:** record the round-13 L1 acceptance row (pixel7, live `wm size 945x1680`, `visualViewport.scale = 1`, prompt showing) in `docs/mobile/tests/device-matrix.md`.
- **B2 (art legibility evidence at 0.505×)** belongs to mobile-lead-tester and is outside this code review.
- **UX round 4** re-reviews B1, B2 and F1-F3.
