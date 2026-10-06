# Code Review, Round 13 (Mobile Pipeline Step 8)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Verdict: PASS.** All findings are LOW and carry forward. mobile-junior-tester (step 9) may start.

**Reviewer:** mobile-lead-developer (independent; I reviewed only what is on disk against the spec)
**Date:** 2026-09-28
**Scope:** the uncommitted diff against HEAD `ce5255c` plus untracked files, on branch `claude/project-thread-rm5222`:
- `src/platform/android/android.css`
- `src/platform/android/screenFit.ts`
- `src/platform/android/screenFit.test.ts` (new)
- `tests/mobile-e2e/menu-insets.spec.ts` (new)
- `tests/mobile-e2e/too-small-window.spec.ts`
- `tests/mobile-e2e/cutout-insets.spec.ts`
- `tests/mobile-e2e/slide-switch.spec.ts`
- `playwright.mobile.config.ts`
- `docs/mobile/tests/manual-only-criteria.md`
- `docs/mobile/PRD-mobile.md` v1.7 (M2.3c)
- `docs/mobile/architecture/mobile-architecture.md` v1.7 (A13)
- `docs/mobile/tooling-setup-log.md` ("Step 7 round 13")

**Spec inputs:** PRD-mobile v1.7 (M2.3, M2.3b rule 3, M2.3c, M2.6, M2.10a, M2.11), architecture v1.7 (§6.2.1 A12/A13, §6.5 A13, §14 A13), `docs/mobile/tests/validation-report-round4.md` (F1, F2, T1-T3), and the coding-standards and mobile-touch-and-layout skills.

---

## 1. Summary

| Item | Result |
|---|---|
| **F1** (menus inside the insets) | **Fixed.** The fix is Android-only CSS under `html.platform-android`. On the real 640 × 360 AVD, every menu is inside [24, 328] × [30, 610]. |
| **F2** (live shrink to 640 × 360 kept playing) | **Fixed.** `readLayoutViewport()` reads the layout viewport. On the pixel7 AVD, a live `wm size 945x1680` showed the prompt and the run paused. `wm size reset` came back to the Pause menu with no auto-resume. |
| **T1** (weak prompt-placement test) | Covered. An asymmetric 300 × 200 window forces the message to wrap, so the test would catch a prompt that ignored the insets. |
| **T2** (no menu-inside-insets test) | Covered by `menu-insets.spec.ts`: 16 walks, the (f1)/(f2) cases, and 4 enlarged-font tests. Game Over and Game Complete use injected markup instead of the real screens (L2). |
| **T3** (Chromium could not see F2) | Covered: 3 vitest cases plus 1 Playwright case that overrides the `innerWidth`/`innerHeight` getters. |
| M2.3c / A13 spec updates | Consistent with the code. No formula change, and no change to `classifyWindow`. |
| One codebase | **PASS.** No game logic touched. `src/style.css` and `index.html` are unchanged against HEAD. The web bundle (`dist/`) contains no `platform-android`, `readLayoutViewport` or `getBoundingClientRect`. No edits under `android/`. |
| Website build and tests | **PASS** (below). |

## 2. Verification (run by me)

| Check | Result |
|---|---|
| `npm run check:secrets` / `typecheck` / `lint` / `check:android-styles` | exit 0 / 0 / 0 / 0 |
| `npm run test` | **30 files, 529 passed** (0 failed) |
| `npm run build` (website) | exit 0. CSS is 2.33 kB with no Android rules. |
| `npm run build:android` | exit 0 |
| Playwright mobile, `--repeat-each=3` | **411 passed, 0 failed, 0 flaky** (4.5 m) |
| `git status --porcelain` before vs. after (Playwright, both builds, mirror build, devices) | **identical** (83 lines) |
| `powershell.exe -NoProfile -File scripts\refresh-android-mirror.ps1` | robocopy 3 (informational). "Parity check passed: 128 file(s) ... and 6 named file(s)". |
| Mirror: `build:android`, `npx cap sync android`, `gradlew.bat assembleDebug --no-daemon` | **BUILD SUCCESSFUL.** `app-debug.apk` is 3,961,177 bytes. |
| `check-android-manifest.mjs --variant debug --apk ...` | **PASSED.** It needed `AAPT2_PATH=<sdk>/build-tools/36.0.0/aapt2.exe`; the script's own message says so. |
| `npx prettier --check` on the changed files | Warns on `screenFit.test.ts` and `android.css`. `screenFit.ts` already failed before this round. `format` is not a CI step. See L6. |

The first mirror-script call failed because of path quoting in my shell (`scripts\\...` was collapsed). It passed when re-run with a quoted path. This was not a denial.

### Device checks (debug APK from the mirror; CDP over `adb forward` to `webview_devtools_remote_<pid>`)

**`svr_api36_lowend_640x360`** (gesture navigation, 1280×720 @ 320 dpi, font 1.0). `#safe-layer` inset is `24px 30px 32px 30px`, so the allowed area is y [24, 328] and x [30, 610].

| Screen | Content y range | Content x range | Scroll (scrollHeight/clientHeight) |
|---|---|---|---|
| Title | 37.75 – 314.25 | 199.4 – 440.6 | 304/304 (none) |
| Settings | 77.25 – 274.75 | 210 – 430 | 304/304 |
| How to play | 109.25 – 242.75 | 30 – 610 | 304/304 |
| Pause | 50.25 – 301.75 | 210 – 430 | 304/304 |
| Restart Game confirmation | 102.25 – 249.75 | 30 – 610 | 304/304 |

- All screens are inside the insets. The pause column is centred on the safe-area centre, 176 dp.
- Back: during play it opens Pause; on the confirmation it returns to Pause; on Pause it resumes.
- Visual viewport stayed `[640,360,1]`. `adb logcat` showed 0 FATAL.
- Settings before and after: `wm size` physical, density 320, `font_scale` 1.0, `navigation_mode` 2. I did not change any of them.

**`svr_api36_pixel7`** (`-gpu host`, 1080×2400 @ 420, landscape, gesture navigation):

- **Before:** 915 × 412, title with no prompt. After Start, play.
- **Live `wm size 945x1680`:** `html` 640 × 360. `#safe-layer` inset is `28.19 29.71 32 36.19` (l + r = 65.9). `.rotate-prompt` shows (`display: flex`) with the underlying overlay "Paused" (the run paused). It stayed that way over 6 consecutive polls. Screenshot: full-screen prompt, text centred.
- **`wm size reset`:** back to 915 × 412 on the first poll, prompt hidden, **Pause menu shown (no auto-resume)**, visual viewport scale 1.
- **Extra, playable live shrink (`wm size 1000x1800`, 686 × 381 dp):** plays with no prompt, and the visual viewport scale is **1** after the relayout. Reset returned to 915 × 412.
- 0 `FATAL EXCEPTION`.
- Settings restored: `wm size` physical, density 420, font 1.0, `accelerometer_rotation` 1. `user_rotation` was `null` before and read `0` afterwards. I did not set it; it is the equivalent default (same as validation round 4's note on `svr_api30_mid`).
- All emulators stopped, adb forwards removed, adb server killed. No `emulator.exe`/qemu process left. No command was denied.

---

## 3. Findings

### Required fixes
None.

### LOW (carry forward; not blocking)

**L1. WebView page zoom-out is worked around, not prevented.**
- **Where:** `index.html:5` (`width=device-width, initial-scale=1.0`, no `minimum-scale`) together with the hidden, still-laid-out `#app-root`. Affects the Android M2.10a prompt.
- **Measured on device (this round, fixed build):** after a live shrink into tooSmall, the page stays zoomed out for as long as the prompt shows: `visualViewport.scale = 0.868`, `innerWidth × innerHeight = 737 × 415` against a 640 × 360 layout viewport. The prompt `<p>` is 16 px CSS, so it renders at about 13.9 dp. That is still at least the 12 sp floor (M2.6), and the prompt covers the whole screen.
- **Why it does not block:** the zoom returns to 1.0 on restore and after a playable shrink, as soon as the relayout removes the overflow. The layout decision no longer depends on it (F2 fix).
- **Why it is still a defect:**
  - Under a larger system font the prompt text is still scaled down by about 13%.
  - Any future code that reads visual-viewport values (`innerWidth`, `visualViewport`, `clientX` against screen size) would be wrong again in exactly this state.
- **Do not fix it in `index.html`.** `minimum-scale=1` or `user-scalable=no` there would change mobile-browser behaviour for the website. Its fixed 800 × 600 `#app-root` relies on zoom-out on narrow phones, and `user-scalable=no` harms web accessibility. That would need the website gates.
- **Suggested Android-only fix (either works):**
  - (a) In the Android bootstrap (`src/platform/android/`), rewrite the viewport meta at startup to add `minimum-scale=1` only when `html.platform-android` is set.
  - (b) When `classifyWindow` returns tooSmall, stop the hidden layers from contributing overflow (for example `display: none` or zero size on `#app-root` while the prompt shows).
- **Acceptance:** on `svr_api36_pixel7`, a live `wm size 945x1680` keeps `visualViewport.scale === 1` while the prompt shows. Add a device-matrix row for this.
- **Owner:** junior-developer in a later round, or with UX round 2 fixes. It must not touch `index.html` or `src/style.css`.

**L2. Game Over and Game Complete are tested with injected markup, not the real screens** (`tests/mobile-e2e/menu-insets.spec.ts:553-591`).
- The injected structure matches `ScreenController.renderGameOver`/`renderVictory` today (`src/ui/ScreenController.ts:187-232`): same tags, classes, order, "New best!" placement and Play again button. The layout under test is CSS only, and injecting while PAUSED does not trigger a re-render (the view key is unchanged). So the current result is valid.
- **Risk:** the copy will drift silently when those renderers change.
- **Suggested fix:** add a jsdom vitest case that renders the real `ScreenController` for `GAME_OVER` (with `copy` set) and `VICTORY`, and asserts the same tag/class sequence the injector writes. Alternatively, add an e2e-only (`e2e=1`-gated, like `__vvsTest`) hook that sets the end state, and drop the injection.
- **Owner:** junior-tester (step 9).

**L3. The A13 menu-fit test does not use the exact bound from the spec** (`menu-insets.spec.ts:641-646`).
- §6.5 A13 specifies 640 × 363.5 with `0,0,24,48` (safe height exactly 291.5) and a 0.01 px tolerance.
- The suite uses 640 × 360 with `0,0,30,38.4` (safe height 291.6) and a 0.5 tolerance. Playwright viewports are whole pixels, so 363.5 cannot be set.
- **Suggested:** add or replace with 640 × 360 and `?insets=0,0,30,38.5&cutout=0,0`. That gives `minH = 28 + 32 + 300 = 360`, which is playable exactly on the floor with a safe height of exactly 291.5. Use 0.01 tolerance for the inside-`#safe-layer` asserts as A13 states.
- The current margin is about 7.5 dp per side, so this is a spec-fidelity item, not a risk.
- **Owner:** junior-tester (step 9).

**L4. `layout.test.ts` is missing the A13 worked-check rows 21-24** (architecture §6.2.1 A13 and §14 A13, item 1).
- No rows exist for `(0,0,24,48)` at 640 × 360 (tooSmall), 640 × 368 (playable, s ≈ 0.5075), 640 × 363.5 (s = 0.5 boundary) and 640 × 363 (tooSmall), in both swap settings.
- Playwright (f1)/(f2) exercise the behaviour, and `classifyWindow` did not change.
- **Owner:** junior-tester (step 9).

**L5. `manual-only-criteria.md` three-button row not updated as PRD v1.7 asked.**
- The row still reads "nav bar left or right of the window".
- PRD v1.7 follow-ups require "bar on the side (phone: M2.3b (b)) or at the bottom (landscape-by-nature device: M2.3c)", plus the M2.3c (f3)/(f4) device records.
- Also add a manual row: **real finger drag-scroll of an overflowing menu** (the `overflow-y: auto` / `touch-action: pan-y` fallback in `android.css:79-83`). The enlarged-font Playwright tests prove reachability through `scrollTop`/`scrollIntoViewIfNeeded`, not a touch drag, and the real AVD does not overflow even at font scale 2.0.
- **Owner:** junior-tester (step 9).

**L6. Prettier drift in new files** (`src/platform/android/screenFit.test.ts`, `src/platform/android/android.css`).
- `npm run format` flags them, and `screenFit.ts` was already flagged before this round. `format` is not in `deploy-pages.yml`.
- **Suggested:** run `npx prettier --write` on the Android platform files in one formatting-only commit.
- Coding-standards style: PASS with this note.

**L7. `screenFit.test.ts` leaves a stubbed `window.innerWidth`/`innerHeight` in place** (`screenFit.test.ts:410-421`).
- `afterEach` restores `getBoundingClientRect` but leaves `innerWidth = 642` / `innerHeight = 361` defined on `window`. vitest isolates per file, so there is no effect today.
- **Suggested:** delete both properties in `afterEach`, the same way `getBoundingClientRect` is handled.

### INFO (no action)

- **`android.css` overlay rules:**
  - The `.screen-overlay` rules (`justify-content: flex-start`, `overflow-y: auto`, auto margins on the first and last child) avoid `safe center` for the WebView 69 floor, and the comment says why.
  - The `touch-action: pan-y` exception is scoped to the overlay, which becomes the nearest scroll container only when content overflows. The html-level `touch-action: none` still blocks page pan, zoom and selection everywhere else.
  - Targets stay at least 48 dp. Text stays at least 12 px: the heading is 30 px in the `max-height: 420px` block.
  - The media query also applies at 915 × 412 (pixel7, height 412). There the title measured 66.3–342.0 inside [28.2, 380]. That is acceptable.
- **`readLayoutViewport()`** has an intent comment that records the measured cause. It keeps fractional dp, which also slightly changes the `viewportKey` string (for example `915.047…x412.190…`). That is harmless because it only has to be stable per size. No other `src/` code reads `innerWidth`/`innerHeight`/`visualViewport`.
- **Step-9 test additions:**
  - `cutout-insets.spec.ts` rules 1-2: the positive "playfield uses a band" case fails if the playfield is fitted inside the full insets.
  - The `too-small-window.spec.ts` M2.10a additions (no game time passes, no auto-resume, screens return as they were) follow the PRD wording rather than the implementation. They are deterministic across the ×3 runs.
  - The `slide-switch.spec.ts` change is a comment only.
  - The `playwright.mobile.config.ts` `testIgnore` extension is correct: `menu-insets` sets its own viewport.
- **Spec docs:** PRD v1.7 M2.3c and architecture v1.7 A13 agree with each other and with the code. The arithmetic checks out: `minH(0,0,24,48) = 22 + 41.5 + 300 = 363.5`, and the smallest safe height is `300 − 2 − 6.5 = 291.5`. No owner decision is reopened, and neither the website PRD nor the shared rules change.
- **Mobile pitfalls checklist:**
  - No per-platform game logic.
  - No frame-count timing introduced.
  - No new listeners.
  - Back behaviour verified on device.
  - Canvas DPR unchanged at 2.625 on the pixel7.
  - No hand edits under `android/`.

## 4. Routing

**PASS.** Step 9 (mobile-junior-tester) may start and should take L2-L5 (and L7 if convenient). L1 and L6 go to mobile-junior-developer as carry-forwards for the next code round. L1 must stay Android-only and must not change `index.html` or `src/style.css`. Record L1's device acceptance check in `docs/mobile/tests/device-matrix.md` when it is fixed.
