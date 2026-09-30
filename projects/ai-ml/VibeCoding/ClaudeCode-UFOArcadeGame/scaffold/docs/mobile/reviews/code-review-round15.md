# Code Review Round 15: Mobile Pipeline Step 8 (narrow scope)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Verdict: FAIL.** Two Medium findings (M1, M2), both regressions against PRD-mobile M2.11 that this change introduced. There are also three Low findings and one Info note.

The fixes this round was asked for are done:
- design-review-round4 N1: fixed at the default font.
- design-review-round4 L1: fixed at the default font.
- code-review-round14 L1: closed.
- code-review-round14 L3: closed.

All automated gates pass, the website bundle is byte-identical to HEAD, and no shared file changed.

- **Reviewer:** mobile-lead-developer
- **Date:** 2026-09-29
- **Branch / base:** `claude/project-thread-rm5222`, uncommitted diff vs HEAD `09cc962`, plus untracked files
- **Scope:**
  - `src/platform/android/android.css`
  - `src/platform/android/layout.ts` (comment only)
  - `tests/mobile-e2e/hud-clearance.spec.ts` (new)
  - `docs/mobile/tooling-setup-log.md` (round-7 entry)
  - `docs/mobile/tests/screenshots/svr_api36_lowend_640x360_{playing_L1,playing_L3,playing_L5,throw_wait}_round7.png`
- **Specs used:**
  - `docs/mobile/ux/design-review-round4.md` (N1, L1)
  - `docs/mobile/reviews/code-review-round14.md` (L1, L3)
  - `docs/mobile/PRD-mobile.md` (M2.4, M2.6, M2.11)
  - `docs/mobile/architecture/mobile-architecture.md` (§6.5 A12 / §12 MR21, and the §7.3 rule `textZoom = min(fontScale×100, 130)`: "layouts are tested at the 130% cap")
  - The coding-standards and mobile-touch-and-layout skills

## 1. Summary

- **Shared code is untouched.** `git diff HEAD` changes only the three files in scope. There is no change to `index.html`, `src/style.css`, `src/ui/*`, `src/core/*`, `src/systems/*`, `src/config/*`, `src/main.ts`, `src/render`, `src/platform/web/*`, `vite.config.ts`, `package.json`, the CI workflow, or anything under `android/`.
- **N1 (HUD covering the formation), at the default font: fixed.** Each HUD group is now one flex row, and the panels are tighter (`android.css:33-46`).
  - Measured HUD bottom in logical px, against the first row's top at `FORMATION_TOP_MARGIN = 70`:
    - 640x360: 37.2
    - 640x360 with insets: 39.5
    - 800x360: 35
    - 915x412: 32
    - 1280x800: 29
  - The round-7 screenshots at L1, L3 and L5 show a clear gap between the HUD and the formation.
- **L1 (THROW/WAIT size): done.** The label is 13px bold (`android.css:303-307`). It fits the 56dp button at the default font with 0.4 px to spare. At the 130% text cap it does not fit (see M2).
- **code-review-round14 L1: closed.** The `layout.ts:118-124` comment now matches round 14's requested wording and the value 13 is kept. §12 MR21 is satisfied.
- **code-review-round14 L3: closed for the two named selectors** (`android.css:80`, `android.css:293`). The file header is still inaccurate (see L2).
- **Text stays at or above 12 sp.**
  - HUD panels measure 12.00 px on screen on all four viewports, with and without insets.
  - THROW/WAIT is 13 px. The touch layer is not scaled, so that is 13 dp.
  - The hint is unchanged.
- **Tooling-log round-7 entry (rAF slowed to 0.25x through the debug port): nothing of it is in the repo.**
  - `git grep` over `src`, `tests`, `scripts`, `android/app/src`, `index.html` and `vite.config.ts` finds no `requestAnimationFrame` override, time-scale hook, `Runtime.evaluate` or devtools-socket code.
  - The new spec only reads the existing `__vvsTest.snapshot()`.
  - `capacitor.config.ts` still leaves `webContentsDebuggingEnabled` unset (debug builds only).
  - The slowed timestamps only affect how fast the game ran during capture. The L3/L5 frames are still valid evidence of static layout.

## 2. Verification (run by me)

| Check | Result |
|---|---|
| `npm run check:secrets` | Clean ("no tracked secret-shaped content found") |
| `npm run check:android-styles` | Clean |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, no output |
| `npx prettier --check` on the three changed code/test files | All formatted |
| `npm run test` | 31 files, **540/540 passed** |
| `npm run build` (website) | OK. `index-Cxv-oqtY.js` and `index-Bee-yMjM.css` are **byte-identical (`cmp`) to a HEAD build** I made from `git archive HEAD` in the scratchpad. `dist/index.html` differs only in line endings (git-archive CRLF); `diff -w` shows it identical. The web bundle has 0 occurrences of `platform-android` or `touch-glyph`. |
| `npm run build:android` | OK (`AndroidPlatform-emgoqypI.css`, 3.77 kB) |
| `npx playwright test -c playwright.mobile.config.ts --repeat-each=3` | **513/513 passed** (4.5 min) |
| New spec vs the **HEAD** Android build (scratchpad copy, port 4177) | **8/8 fail**. This confirms the junior's claim that the spec fails on the old CSS. |
| `git status` before and after the build and Playwright runs | Identical, apart from one file I did not create: `docs/mobile/security/review-v2.md` (untracked, mtime 20:56:37, written during my mirror step by a concurrent step-12 security session; its header names this in-flight CSS change). Nothing from my runs. |
| Mirror: `powershell.exe -NoProfile -File scripts\refresh-android-mirror.ps1` | robocopy exit 3 (informational only). **Parity check passed** (133 files plus 6 named files identical). |
| In the mirror: `build:android`, `npx cap sync android`, `gradlew.bat assembleDebug --no-daemon` (JDK 21.0.12, SDK `C:\Users\aaron\Android\sdk`) | **BUILD SUCCESSFUL** in 19 s. `app-debug.apk` is 3,961,885 bytes. The synced `AndroidPlatform-emgoqypI.css` contains the new `#hud-root>div` rule. No hand edits under `android/`. |
| Emulator | Not started (optional). I used the round-7 screenshots. |
| Cleanup | No java.exe left running and nothing listening on 4174/4176/4177. The scratchpad node_modules junctions were removed; the project `node_modules` is intact. No command was denied. |

**Extra measurements I ran.**
- These were throwaway Playwright specs in the scratchpad against `dist-android`, not project files.
- I set the HUD panels' text to realistic strings through the DOM, then measured the panel boxes against the canvas box and the `.touch-button` boxes.
- To approximate the WebView's 130% `textZoom` cap, I injected `font-size: calc(max(15px, 12px / var(--pf-scale)) * 1.3)`.

## 3. Findings

### M1 (Medium, required): the one-row HUD overflows the playfield and runs under the Pause button at the largest system font; at the default font it touches the edge in late game

- **Where:** `android.css:37-40` (`html.platform-android #hud-root > div { display: flex; }`) combined with the shared `.hud-panel { white-space: nowrap }`.
- **Rules broken:**
  - PRD-mobile **M2.11**: "With the Android system font size set to its largest value, HUD, menus and help text do not overflow, clip, or overlap controls."
  - Architecture §7.3: layouts are tested at the 130% cap.
- **Why it is a regression:**
  - Before this change the right group (Level, Power, effect) was stacked, so its width was one panel.
  - Now all five panels share one row across a 404 dp playfield (640x360 with the reference insets 30,30,24,32).
  - The groups can't shrink (the default `min-width: auto` on a no-wrap flex row). When they don't fit, the right group is pushed past the playfield's right edge.
- **What I measured:**

| Profile | Text size | HUD state | Result |
|---|---|---|---|
| 640x360, insets 30,30,24,32 | 130% | L3, Shield active: `Score: 4200 / Lives: 3 / Level: 3/10 / Power ×1.80 / Shield 8.0s` | Effect panel at x 485-568, y 29-51. Canvas right edge is 554. **Overlaps the Pause button** (x 558-606, y 40-88). |
| 640x360, insets 30,30,24,32 | 130% | Mid game: `Score: 12000 / Lives: 3 (+1 LIFE) / Level: 5/10 / Power ×3.24 / Shield 8.0s` | Effect panel at x 558-640: fully under Pause, through the 30 dp right inset, to the screen edge. |
| 800x360 with insets; 915x412 with insets | 130% | Same mid-game state | Overflows by 75 dp and 15 dp. |
| 640x360, insets 30,30,24,32 | default | L10 during the 1 s "+1 LIFE" flash, with an effect (`Score: 45000 / Lives: 4 (+1 LIFE) / Level: 10/10 / Power ×5.83 / 3x Speed 8.0s`) | Overflows by 8 dp; the groups touch. |
| 640x360, insets 30,30,24,32 | default | Extreme (`Score: 123456`, flash, `Power ×3.00`, `3x Speed 10.0s`) | Overflows by 21 dp and overlaps the Pause button. |

- The Pause button draws above the HUD (`#safe-layer` has z-index 30), so the overflowing text is hidden, not just crowded. Taps are not blocked, because the HUD has `pointer-events: none`.
- Nothing in the suite checks this:
  - `hud-clearance.spec.ts` only checks overlap with the formation, at level start with level-1 text.
  - M2.11 is manual-only (`manual-only-criteria.md:71`).
  - The device matrix has only measured menus at the largest font, never the in-game HUD.
  - None of the round-7 screenshots has an effect panel showing.
- **Required fix (junior developer; Android-only CSS; no shared change):**
  1. Let each group wrap instead of overflowing. Suggested rules:
     - `html.platform-android #hud-root > div { flex-wrap: wrap; min-width: 0; }`
     - `html.platform-android #hud-root > div:last-child { justify-content: flex-end; }`, so wrapped right-side panels stay right-aligned.
     - A small `column-gap` on `#hud-root`, so the two groups never touch.
     - Keep `line-height`, `padding` and `margin` as they are.
  2. Check that at the default font the level-start states (L1/L3/L5 text, no flash) still fit on one row, so the N1 acceptance still holds.
  3. At the 130% cap on 640x360, a wrapped second row reaches about 95 logical px and will cover the first formation row. M2.11 (no overlap with controls, no clipping) outranks N1's clearance at the largest font, because N1's acceptance is stated at the default font. Record this trade-off in the CSS comment. mobile-ui-ux-designer confirms it at step 11; it is not an owner-level change.
  4. Add a Playwright test next to `hud-clearance.spec.ts`, on all four projects, with and without insets 30,30,24,32. After `startRun`:
     - Set the five `.hud-panel`s to the longest realistic strings through the DOM (for example `Score: 99999`, `Lives: 4 (+1 LIFE)`, `Level: 10/10`, `Power ×9.99`, `3x Speed 8.0s`). This only changes text on test-only DOM, not game state.
     - Run once at the default font and once with an injected 1.3x `.hud-panel` font-size.
     - Assert that every visible panel lies inside the canvas's x-range and intersects no `.touch-button`.
  5. Add a device-matrix row for step 10: `svr_api36_lowend_640x360` at `font_scale 2.0`, in play with a power-up effect active. The lead tester captures it; the junior developer can add it to the tooling log if it is captured.

### M2 (Medium, required): at the 130% text cap the 13 px THROW label no longer fits its button, and the code comment's width is wrong

- **Where:** `android.css:299-307`.
- **What I measured:** the width of the text range inside `.touch-button--throw .touch-glyph`.

| Text size | THROW width | WAIT width | 56dp button (52 px content box, the insets case) | 64dp button (60 px content box) |
|---|---|---|---|---|
| Default | **51.6 px** | 34.5 px | Fits with 0.4 px to spare | Fits |
| 130% (textZoom cap) | **66.3 px** | 44.3 px | Past the content box by 14 px | Past the content box by 6 px (so it also crosses the 2px border) |

  - At 11 px, THROW was about 43.7 px (57 px at 130%), so it fit the 64dp button. This change breaks the 130% case for every button size.
  - The comment says "'THROW' is ~42px wide". That is the old 11 px width, not the 13 px width.
- **Rule:** M2.11 (no overflow at the largest font), plus design-review-round4 L1's own condition ("checking 'THROW' still fits the 56 dp button").
- **Required fix (junior developer, Android-only):** make the label fit at both the default font and 130%, without dropping below 12 sp. Pick one:
  - (a) Draw the word as inline SVG `<text>` in `glyphs.ts`, following the arrows/pause precedent (`createElementNS` and `setAttribute` only). Give it a fixed `textLength` of 44 and `lengthAdjust="spacingAndGlyphs"`, so its width is fixed whatever the text zoom. Keep 13 px bold and keep `aria-hidden`.
  - (b) Get the width under 52 px at 130% some other way, for example by dropping `letter-spacing` and using a condensed weight. If you choose this, give the measured widths in the comment.
- **Acceptance for either option:**
  - Correct the comment to the real measured widths.
  - Add a Playwright check: with the label's font-size multiplied by 1.3, both THROW and WAIT fit inside `button.clientWidth` on the 56dp (640x360 with insets) and 64dp layouts.
  - Get one lowend screenshot at `font_scale 2.0` at step 10.

### L1 (Low, suggested): `hud-clearance.spec.ts` only covers level-1 text at level start

- The test is sound. It maps enemy positions through the canvas box, treats the first row as the full playfield width (the formation drifts sideways) and runs with and without insets. It also fails on the old CSS, as it should.
- It does not cover wider HUD text or later levels. M1's new test covers the text width. Optionally, also reach L3/L5 through an existing test hook if one exists (do not add a new game-state hook).
- **Owner:** junior-tester (step 9).

### L2 (Low, suggested): the `android.css` header still says "Scoped entirely under html.platform-android"

- Round 14 L3's two selectors are fixed. About 20 others are still unscoped, including:
  - `#shell-overlay-root > .screen-overlay` (line 119)
  - `#safe-layer` (185)
  - `#overlay-root` (195)
  - `.touch-layer` (243)
  - `.touch-button` (270)
  - `.touch-glyph` (287)
  - `.touch-button--throw .touch-glyph` (303, edited in this very change)
  - `.hidden` (338)
  - `.rotate-prompt` (353)
  - `.privacy-*` (386-429)
- Runtime impact is none: the file ships only in the Android chunk, and the web bundle is byte-identical.
- **Fix, either:**
  - scope every selector under `html.platform-android`, or
  - reword the header to "Loaded only by the Android platform module; rules that touch shared elements are scoped under html.platform-android."
- The generic `.hidden` rule is the one most worth scoping.
- **Owner:** junior developer.

### L3 (Low, info for the tooling log)

- The round-7 log entry is accurate and complete: device, profile, the slowed-time method, the emulator wedge and restart, and the cleanup.
- It is preceded by two blank lines (cosmetic).
- Nothing to change in the repo.

### I1 (Info, route to mobile-product-manager, website pipeline): the shared website HUD probably overlaps the formation's first row too

- On the HEAD build, the new spec also fails at 1280x800, where the Android floor resolves to the shared 15 px. The stacked shared layout ends near logical y 81, against the first row's top at 70.
- This is item 1 of design-review-round4 N1 ("could not check the website"). The reference is design-review-round4 N1.
- Any fix changes shared layout, so it needs the website gates and both PRDs under the one-codebase rule.
- It does not block this mobile review.

## 4. Standards conformance

- **coding-standards**
  - Style: PASS with L2. Prettier and lint are clean.
  - Error handling: N/A (CSS and a comment only).
  - Logging: N/A.
  - Code documentation: PASS apart from M2's wrong width figure. Every new rule cites its design-review item and says why.
- **mobile-touch-and-layout**
  - Touch targets unchanged: 48/56/64 dp.
  - Uniform scaling unchanged.
  - Timing, lifecycle and back are untouched.
  - Screen fitting: **FAIL** on M1/M2 (at the largest font, text overflows the playfield into the control column and the THROW label overflows its button).
- **Platform pitfalls**
  - No game logic duplicated or branched per platform.
  - No frame-count timing.
  - No change to touch-action.
  - No generated `android/` files edited.
  - DPR and insets handling unchanged.

## 5. Routing

- Back to **mobile-junior-developer** (step 7) with this document, for M1 and M2 (required) and L2 (suggested).
- L1 goes to mobile-junior-tester at step 9.
- I1 goes to mobile-product-manager for the website pipeline. It is not blocking.
- mobile-junior-tester cannot start until round 16 reports PASS.
