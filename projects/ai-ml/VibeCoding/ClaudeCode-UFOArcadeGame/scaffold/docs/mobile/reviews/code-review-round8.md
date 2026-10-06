# Mobile Code Review, Round 8

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-28
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `4138829`, plus untracked files.
- **Modified:**
  - `src/platform/android/{AndroidPlatform.ts, android.css, backButton.ts, layout.ts, layout.test.ts, overlays.ts, screenFit.ts}`
  - `scripts/{check-android-styles.mjs, check-android-styles.test.mjs, check-no-secrets.test.mjs}`
  - `tests/mobile-e2e/{rename-audit.spec.ts, swap-layout-behavior.spec.ts}`
  - `android/app/src/main/res/values{,-v28}/styles.xml` (comments only)
  - `package.json`
  - repo-root `.github/workflows/deploy-pages.yml`
  - `docs/mobile/tooling-setup-log.md`
- **New:** `tests/mobile-e2e/too-small-window.spec.ts`, plus 16 screenshots under `docs/mobile/tests/screenshots/`.
- **Unchanged:** `src/style.css`, every shared game file (`src/core`, `src/systems`, `src/ui`, `src/main.ts`) and every native Java file.

**Scope:**
- PRD-mobile v1.5 **M2.10a**, implemented per `mobile-architecture.md` v1.5 **Amendment A11** (§6.2.1, §8.1, §8.3 A11, §10.1 A11, §16 A11 handoff)
- code-review-round6 **L1, S1, S2**
- code-review-round7 **L1, L2, L3, S1, S2**

**Reviewed against:**
- `mobile-architecture.md` v1.5: §6.1-§6.6, §6.2.1, §8.1, §8.3 (with A11), §10, §10.1, §12 MR4/MR20, §16
- M-ADR-0004 and M-ADR-0005
- `PRD-mobile.md` v1.5: M2.3a, M2.10, M2.10a, M2.12, M2.13, M3.11, M4, M5
- `code-review-round6.md` and `code-review-round7.md`

**Skills applied:** coding-standards, mobile-touch-and-layout

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: FAIL

There is **one required fix (R1, MEDIUM)**. Otherwise the change is solid:
- The classification is correct and derived from `computeLayout(...).belowFloor`, as §6.2.1 prefers.
- The back order is correct.
- Pause on entering a prompt and the re-pause guard both work, including on a real device.
- Every round-6 and round-7 item is addressed.
- Every build and test passes.

R1 is a small change, but it is a deviation from binding spec text:
- §6.2.1 behavior 2 requires `#app-root`, `#touch-layer` and the contents of `#safe-layer` to be set to `visibility: hidden` while a prompt shows.
- The implementation never hides them. It relies on an opaque cover instead.
- The code comment that justifies this is now factually wrong.
- On the real fold AVD, the hidden title menu (Start, How to play, Settings, Quit) is still exposed to accessibility services as focusable, clickable buttons under the prompt.

There is also **one spec escalation (E1)**, routed to mobile-solution-architect and mobile-product-manager. It is not a code defect and does not by itself fail this gate. It must be resolved before step 10 can pass M2.10a (c) or M2.12 on a realistic device.

mobile-junior-tester must not start until the round-9 review reports PASS.

## Verification results

| Check | Result |
|---|---|
| `npm run check:secrets` | PASS, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| `npm run test` | **PASS: 29 files, 453 tests** (432 in round 7) |
| `npm run build` (web) plus the CI purity grep on `dist/assets/*.js` | PASS. No `@capacitor` or `registerPlugin` found. |
| `npm audit --omit=dev --audit-level=high` (as CI runs it) | 0 vulnerabilities |
| `npm run build:android` | PASS |
| `npm run check:android-styles` (repo) | PASS, exit 0 |
| `npx playwright test -c playwright.mobile.config.ts --repeat-each=3`, nothing else running | **264 passed, 0 failed, 0 skipped** (4.0 min). No listeners left afterwards. |
| Styles guard, run from the wrong cwd | **Fails closed**: exit 2 with an actionable message (round-7 L1 closed) |
| Styles guard with the `tools:targetApi="o_mr1"` `always` item in `values/` | FAILED, exit 1 (round-7 L2 closed) |
| Styles guard with plain-item drift in `values/` only | FAILED, exit 1: 6 parity findings (round-7 L3 closed) |
| Styles guard with `values-v28/` deleted | FAILED, exit 1 |
| Styles guard with drift in `values-v30/` only, where the item has an extra attribute (`tools:targetApi="s"`) | **Passes, exit 0 (missed)**; see L2 below |
| `import.meta.url` probe under vitest + jsdom (scratch config, outside the repo) | `fileURLToPath(new URL('..', import.meta.url))` throws `ERR_INVALID_URL_SCHEME`, so the junior's diagnosis is correct. The root cause is jsdom's global `URL`; `import.meta.url` itself is a valid `file:` URL. `new (require('node:url').URL)(…)` and `path.dirname(fileURLToPath(import.meta.url))` both work. See L1. |
| Mirror refresh as documented: stop mirror node processes (none), three `Remove-Item` clears, `robocopy /MIR /XD … /XF …` | robocopy exit 3 (copied/extra, 0 failed) |
| Mirror parity | Identical: `src`, `tests`, `scripts`, `public`, `android/app/src`, `android/app/build.gradle`, `package*.json`, `capacitor.config.ts`, `vite.config.ts`, `playwright.mobile.config.ts` |
| Mirror hygiene (`*.csv`, `.env*`, `*.tfstate*`, `terraform.tfvars`, `*.jks`, `*.keystore`, `signing.properties`) outside `node_modules` | None found |
| Mirror `npm ci`, `build:android`, `npx cap sync android`, `check-capacitor-config.mjs`, `npm run check:android-styles` | All PASS (2 plugins: app 8.1.1, splash-screen 8.0.2). `res/` identical to the repo after sync. |
| Mirror `gradlew assembleDebug --no-daemon` (JDK 21.0.12) | **BUILD SUCCESSFUL**, 153 tasks |
| Mirror `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true --no-daemon` | **BUILD SUCCESSFUL**, 203 tasks |
| Mirror `gradlew bundleRelease --no-daemon` (`CI` unset) | **Refused as designed**, exit 1 ("Release signing not configured… Refusing to build."). No `.aab` anywhere. |
| `AAPT2_PATH=…\36.0.0\aapt2.exe check-android-manifest.mjs --variant debug` | PASSED |
| Same with `--variant release` on `app-release-unsigned.apk` | PASSED |
| Negative control: `--variant release` on `app-debug.apk` | FAILED as expected (`R2: android:debuggable="true"`), exit 1 |
| `aapt2 dump resources`, cutout mode | App styles: v28 = 1 and v30 = 3 in all three. None in base. No `=3` below v30. |
| **`svr_api36_fold`** (`-gpu host`, headless): install, force-stop, `am start -W` | `Status: ok`. The window is 412 × 309 dp. The screen shows only "Make the window larger to play." on `#05050a`, full-bleed inside the app window. |
| Fold: 5 taps (centre and four corners of the window) | The post-tap screenshot is **byte-identical** to the pre-tap one |
| Fold: `uiautomator dump` while the prompt shows | **Start, How to play, Settings and Quit are present as `android.widget.Button` nodes, `clickable=true focusable=true`, with on-screen bounds under the prompt.** This is the evidence for R1. |
| Fold: Back | The launcher becomes `topResumedActivity`. The app process (pid 4328) stays alive. FATAL = 0. |
| **`svr_api36_pixel7`** (`-gpu host`, gesture nav `navigation_mode=2`): install, cold launch | `Status: ok` (2.8 s). The title renders full-bleed at 915 × 412. |
| Pixel7: real insets, read live from `#safe-layer` over WebView DevTools (debug build) | Native window: **l 51.8, r 29.7, t 28.2, b 32** dp |
| Pixel7: Start, hold ▶ for 800 ms, THROW ×2 | A run starts (the Help dialog had been dismissed on this image earlier). The player moves right. THROW's right edge is at 885.3 = 915 − r, so it is inside the inset. No prompt. FATAL = 0. |
| Pixel7: `wm size 945x1680`, giving a real **640 × 360 dp** window | Insets **l 36.2, r 29.7, t 28.2, b 32**. So minW = 641.9 > 640 and minH = 360.19 > 360, and the **too-small prompt shows**. See E1. |
| Pixel7, during play: `wm size 1082x1575` (window 636 wide), then hardware Esc ×2 (`keyevent 111`), then `wm size reset` | The prompt shows, the pause menu stays PAUSED under it after both Esc presses (MR20 guard holds), and the restore shows the pause menu. FATAL = 0. |
| Cleanup | `wm size` is back to 1080x2400, density 420, `font_scale` 1.0. Port forward removed. Both AVDs stopped with `adb emu kill`, then `adb kill-server`. There are no emulator, qemu, adb, java or node processes. No listeners on 4173-4175, 4181, 4182 or 9333. The scratch probe files are in the session scratchpad only. |

No command was denied.

---

## Prior findings status

| # | Source | Status | Evidence |
|---|---|---|---|
| L1 | round 6 (`check-no-secrets.test.mjs` cwd) | **Closed** (fix items 2 and 3) | `existsSync` assertion at `:243-244` and the comment corrected. Item 1 (resolve from `import.meta.url`) was not done; failing closed covers the risk. Same jsdom caveat as round-7 L1 below. |
| S1 | round 6 | **Closed** | `startRun(page, expectHelp)` asserts visible or hidden; the callers pass `true` and then `false` |
| S2 | round 6 | **Closed** | The comment in `rename-audit.spec.ts:27-33` is corrected |
| L1 | round 7 (fail-open) | **Closed**, with an accepted deviation | `run()` returns code 2 for a missing res dir or no `values/`; reproduced. Item 4 (`import.meta.url`) was not adopted. The technical reason is real (jsdom's global `URL`), but the comment misstates it; see L1 below. |
| L2 | round 7 (regex) | **Closed** for the unsafe-value check | `CUTOUT_ITEM_RE:49-50`; the fixture and my reproduction both fail as they should. The parity parser still uses the strict form; see L2 below. |
| L3 | round 7 (parity) | **Closed** | `checkStylesParity` is in `run()` and has a real-tree test; drift and v28-deletion reproductions fail |
| S1 | round 7 | **Closed** | `check:android-styles` npm script and a CI step after `check-capacitor-config.mjs` (`deploy-pages.yml:128-131`). It can no longer pass vacuously. |
| S2 | round 7 | **Closed** | Both XML comments now cite `validation-report-round2 F1` |

---

## REQUIRED (must fix before PASS; owner mobile-junior-developer)

- **R1 (MEDIUM). §6.2.1 behavior 2 is not implemented: the layers under the prompt are never hidden.**
  - **Where:**
    - `src/platform/android/screenFit.ts:140-145` (prompt branch and restore branch)
    - `src/platform/android/overlays.ts:8-11` (header comment)
    - `src/platform/android/android.css:72-73, 111` (stale comments)
  - **The spec (binding):** "While it shows, `#app-root` (canvas + HUD), `#touch-layer` and the contents of `#safe-layer` (menus and shell overlays) are hidden (`visibility: hidden`), **not destroyed**…" PRD M2.10a (3) adds: "no playfield, HUD, menu or touch control is drawn **or responds**".
  - **What the code does:**
    - It shows an opaque `z-index: 40` cover on `<body>` and leaves everything underneath visible and live.
    - `overlays.ts:8-11` justifies this: "RotatePrompt's `.screen-overlay` class … blocks taps and visually hides everything else … without a separate visibility toggle". That is no longer true, because this same change removed `.screen-overlay` from RotatePrompt (`overlays.ts:52`).
    - The deviation is not recorded in the tooling log, so it was waved through silently.
  - **Why it matters:**
    - An opaque cover blocks pointer hit-testing, but not accessibility. On `svr_api36_fold`, `uiautomator dump` shows the title menu's **Start, How to play, Settings, Quit** as `clickable=true, focusable=true` buttons under "Make the window larger to play.".
    - A screen-reader or accessibility-service activation dispatches `click()` on the node and bypasses hit-testing. So the hidden menus "respond", which breaks M2.10a (3) and §6.2.1 behavior 3 ("Hidden controls receive no events").
    - For example, Start or Quit could be activated under the prompt. The re-pause guard only catches `PLAYING`, and Quit exits.
    - Play's pre-launch crawler and TalkBack (M3.11) both use this tree.
  - **Fix:**
    1. In `ScreenFit.relayout()`'s prompt branch (`screenFit.ts:140`), set `this.appRoot.style.visibility = 'hidden'` and `this.safeLayer.style.visibility = 'hidden'`. `#safe-layer` contains `#overlay-root`, `#shell-overlay-root` and the touch layer.
    2. In the playable branch (just after `:145`, before `computeLayout` is applied), set both back to `''`, so the restore happens in the same re-layout (behavior 5).
    3. Do not remove or re-create anything: the pause menu and shell overlays must come back exactly as they were. Before relying on the parent's `visibility`, confirm that no descendant sets `visibility: visible` (none does today).
    4. Rewrite the `overlays.ts:8-11` header comment to describe the real mechanism: a `<body>`-level fixed cover plus `visibility: hidden` on `#app-root` and `#safe-layer`.
    5. Fix the two `android.css` comments at `:72-73` and `:111`, which still list RotatePrompt as a child of `#shell-overlay-root`.
  - **Tests to add (`too-small-window.spec.ts`):**
    - In the 600 × 360 test, assert `getComputedStyle(#app-root).visibility === 'hidden'` and the same for `#safe-layer`, the pause menu, and an open Settings dialog.
    - Also assert, for example, that `page.getByRole('button', { name: 'Start' })` is **not visible** or not in the accessibility tree while the prompt shows.
    - In the shrink/restore test, assert both return to `visible` and that the pause menu is visible after restoring.
  - **Device check for the round-9 evidence:** re-run `uiautomator dump` on `svr_api36_fold` and record that no Start/Quit button nodes appear. Record it in the tooling log.

---

## ESCALATION (routed; not a code defect; must be resolved before step 10 can pass M2.10a (c) or M2.12 on a realistic device)

- **E1. The §6.3 planning insets under-estimate real Android insets. On a real 640 × 360 dp gesture-nav window the app shows the too-small prompt on both axes. The junior's "expected, not a defect" label understates this.**
  - **Owner:** mobile-solution-architect, with mobile-product-manager per MR4.
  - **Measured on `svr_api36_pixel7` with gesture navigation**, read from the live `#safe-layer` position, which carries the GameShell values unmodified:

    | Window | l | r | t | b | minW = l+r+576 | minH = t+b+300 | Result |
    |---|---|---|---|---|---|---|---|
    | 915 × 412 (native) | 51.8 (cutout) | 29.7 (back gesture) | 28.2 (top gesture band) | 32 (home gesture) | 657.5 | 360.2 | playable |
    | 640 × 360 (`wm size 945x1680`) | 36.2 (scaled cutout) | 29.7 | 28.2 | 32 | **641.9** | **360.19** | **tooSmall** on both axes |

  - **Is it the implementation?** No:
    - GameShell reports `max(displayCutout, systemGestures)` per edge, exactly as §6.1 and M2.3a require.
    - `classifyWindow` applies the binding §6.2.1 formula.
    - The Playwright boundary test uses the spec's own planning insets and passes.
    - The code is doing what the spec says.
  - **Is it a spec problem? Yes:**
    - §6.3 and §6.2.1 plan with **t = 0, b = 24**. On a real device t ≈ 28 (the systemGestures top band exists even with bars hidden) and b = 32.
    - The height budget at 640 × 360 is therefore `t + b ≤ 60`, not the 24 the table assumes. The real value is **60.19**, which misses by 0.19 dp.
    - The width budget is `l + r ≤ 64`. Back-gesture insets alone are about 29.7 per side, which leaves about 4.6 dp for any cutout.
  - **Could real 640 × 360 phones (the M2.12 low-end reference) be unplayable?**
    - This Pixel 7 run is not a representative 640 × 360 phone: it keeps a scaled camera cutout.
    - A typical 16:9 low-end phone has no cutout. With gesture nav it would give about l = r = 29.7 (minW ≈ 635, fits) and t = its status-bar height, typically 24 dp (minH ≈ 356, fits by about 4 dp). So it is **probably** playable, but by a margin of a few dp.
    - Any of these makes it unplayable on **every screen, all the time**:
      - a status bar ≥ 28.1 dp
      - a larger back-gesture sensitivity setting
      - any side cutout
      - an OEM with a taller gesture band
    - That is the worst possible result for the reference device. MR4 predicted this and says "If real devices hit this, the fix goes through mobile-product-manager … not an ad hoc floor change". So the right action is to route it, not to record it as expected.
  - **Asks:**
    - **(a) Architect:** amend §6.3, §6.2.1's nominal values and the worked-check table with measured insets (t ≈ 24-28, b ≈ 32, sides ≈ 30 with gesture nav; t ≈ 24, b = 0, one side 48 with 3-button nav). Re-state the headroom for both axes, not only "32 dp per side edge".
    - **(b) PM and architect:** decide whether the top systemGestures band must count against the **non-interactive** playfield height. M2.3 currently forbids HUD text there, and the HUD sits inside the playfield. Or decide on another OQ-M7-compatible remedy.
    - **(c) Lead tester:** add a representative 640 × 360 AVD to `device-matrix.md` (16:9, no cutout, gesture nav, API 34+) so M2.10a (c) and M2.12 are judged on a realistic profile. The Pixel 7 + `wm size` run is not that profile.
  - **Evidence naming (junior):** `docs/mobile/tests/screenshots/m2_10a_pixel7_640x360_boundary_plays.png` shows the prompt, **not** play. Rename it, for example to `…_640x360_real_insets_prompt.png`, and correct the tooling-log reference, so step 10 doesn't read it as an M2.10a (c) pass.

---

## LOW (not blocking; fix with R1; owner mobile-junior-developer)

- **L1. `scripts/check-android-styles.mjs:31-39`: the comment explaining why round-7 L1 item 4 was not adopted is inaccurate.**
  - The comment says "`import.meta.url` is not a `file:` URL in every environment".
  - In fact, under vitest + jsdom, `import.meta.url` **is** a `file:` URL. What fails is the **global** `URL`, which is jsdom's: `new URL('..', import.meta.url)` gives an object that Node's `fileURLToPath` rejects with `ERR_INVALID_URL_SCHEME`. The tooling log states this correctly; the code comment doesn't.
  - I accept the deviation, because the fail-closed exit 2 covers the risk L1 was raised for. But the comment must say what is true.
  - **Fix (either):**
    - reword the comment to match the tooling log, or
    - adopt one of the forms I confirmed working under this vitest config: `path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'android', 'app', 'src', 'main', 'res')`, or `new NodeURL(…)` with `import { URL as NodeURL } from 'node:url'`. Either makes the default cwd-independent.
  - Also: the header comment at `:20` names `checkParity`, but the function is `checkStylesParity`.
- **L2. `check-android-styles.mjs:54-55`: the parity parser still uses the strict regexes that round-7 L2 fixed for the unsafe-value check.**
  - `STYLE_RE` needs `name` before `parent`, double quotes only.
  - `ITEM_RE` needs `<item name="…">` with no other attribute.
  - Any item with an extra attribute (the same Android Studio `tools:targetApi` quick-fix form L2 was about) is silently dropped from the comparison. Reproduced: adding `<item name="android:windowBackground" tools:targetApi="s">@null</item>` to `values-v30` only passes with exit 0.
  - **Fix:**
    - Use an attribute-tolerant item pattern in `parseStyles`, for example `/<item\b[^>]*?\bname\s*=\s*["']([^"']+)["'][^>]*>\s*([^<]*?)\s*<\/item>/g`, and the equivalent tolerance for `<style>` attributes in any order.
    - Strip XML comments (`<!--…-->`) before parsing.
    - Add one fixture for this case.
- **L3. §6.2.1 "Where it runs … and on app `resume`" is not implemented.**
  - `lifecycle.ts:42-45` resumes the loop but does not re-classify.
  - In practice a size or insets change while backgrounded also fires `resize` or `edgeInsetsChanged` on return, so I found no failing case.
  - **Fix (either):**
    - have `ScreenFit` expose `relayout(false)` (or a `reclassify()`) and call it from the resume handler, or
    - record in the tooling log, for the architect, why `resize` and `edgeInsetsChanged` are sufficient.

## Suggested (optional)

- **S1. Add an MR20 Playwright check.**
  - §12 MR20 names "Playwright checks (§10.1)" as the mitigation, but no spec exercises the keyboard path.
  - Start a run at 640 × 360, shrink to 600 × 360, press `Escape` (resume from PAUSED), wait 2 frames, and assert `snapshot().state === 'PAUSED'` and that the enemy positions are unchanged.
  - I confirmed the guard on the real Pixel 7 with `keyevent 111`, so this would be regression cover only.
- **S2. Strengthen the "5 taps change nothing" assertion** (`too-small-window.spec.ts:66-77`). Today it compares only `state`. On TITLE, also compare that no shell overlay opened and the Help dialog is hidden. Once R1 is in, also compare that the menu's `visibility` is unchanged.
- **S3. Reduce test duplication.** The `too-small-window` tests set their own viewport, so they run identically in all 4 viewport projects (24 runs × 3 repeats). Consider `test.describe.configure` or a project filter so they run once.

## INFO

- **I1. RotatePrompt on `<body>` outside `#safe-layer` is accepted.**
  - §6.2.1 behavior 2 asks for a "full-viewport layer … covers the window", with the message "centred inside the edge insets". A child of the inset `#safe-layer` cannot cover the inset bands.
  - The fixed, full-viewport, `box-sizing: border-box` box with inset padding (`screenFit.ts:129-132`, `android.css:222-235`) satisfies both parts. The fold screenshot shows it full-bleed.
  - This contradicts only §6.5's older sentence, which lists "rotate screens" among the `#safe-layer` contents. §6.2.1 (A11) is the newer and more specific text.
  - **For mobile-solution-architect:** add a one-line A11 note to §6.5 (the junior already flagged this in the tooling log).
  - One-codebase and style rules:
    - `src/style.css` is untouched.
    - The new rules are in `android.css`, which only the Android module imports.
    - The web bundle purity check passes.
    - `.rotate-prompt` is not scoped under `html.platform-android`. This matches the existing unscoped `#safe-layer` and `.touch-layer` rules and cannot reach the web build. It is acceptable, but scoping it would be tidier.
- **I2. Moving the `#safe-layer` inset positioning to run unconditionally (`screenFit.ts:120-123`) is correct.** It also fixes a real latent zero-size-box bug on a cold launch into a prompt.
- **I3. Spec gaps for mobile-solution-architect, not code findings:**
  - `onFrame` runs after the frame's simulation steps (`main.ts:63-69`). A keyboard resume under the prompt therefore lets one frame of play elapse before the re-pause. That is at most ≈ 16 ms normally, and up to the 0.25 s clamp on a stalled frame.
  - Keyboard `Enter` on TITLE under the prompt starts a run, which is immediately paused, so the player returns to a pause menu instead of the title. Behavior 4 only covers `PLAYING`, and `visibility: hidden` does not stop the shared window-level keyboard handler.
  - Both require a hardware keyboard on a too-small window. Consider gating shared input while a prompt shows, through an Android-only `input` source flag, if the architect wants to close them.
- **I4. Back order is correct.** `resolveBackTarget` is pure, shared by the listener and the e2e hook, and checks the prompt first (§8.3 A11). The Playwright test with Settings open underneath returns `leaveApp`. On the fold AVD, Back backgrounds the app with the process alive.
- **I5. Classification is correct.**
  - `classifyWindow` tests `W ≤ H` first, then `computeLayout(...).belowFloor`, so it cannot disagree with the layout.
  - The grid test (11 × 9 × 4 × 2) and every §6.2.1 worked-check row pass.
  - Swap-invariance is asserted.
- **I6. Pause on entering a prompt is correct.** `lastWindowClass` makes an insets-only drop below the floor pause (§6.5 A11), and staying in a prompt doesn't pause repeatedly. The initial `'playable'` assumption is safe, because launch state is TITLE and `pauseForInterruption` is a no-op there.
- **I7. `docs/mobile/tests/manual-only-criteria.md:70,166` still names `needsRotatePrompt()`.** It was correctly left for the step-9/10 owners and correctly flagged.
- **I8. Coding standards, per category:**
  - Style: PASS
  - Error handling: PASS (`run()` fails closed; non-ENOENT errors propagate)
  - Logging: n/a
  - Code documentation: **FAIL in part**. The stale and inaccurate comments are in R1 (`overlays.ts:8-11`, `android.css:72-73, 111`) and L1 (`check-android-styles.mjs:20, 31-39`).
  - Dead code: none (`needsRotatePrompt` was removed, not left behind)
- **I9. mobile-touch-and-layout:**
  - The controls stay inside the real insets on the Pixel 7 (THROW's right edge is at 885.3 of 915 − 29.7).
  - Uniform scale; no stretching.
  - Pause on resize and prompt; resume goes into a paused state.
  - Back is never swallowed.
  - The only gap is R1's accessibility exposure under the prompt.
- **I10. Mobile pitfalls:**
  - No game logic is duplicated or branched (no shared file changed).
  - No frame-count timing was added (the guard is a state check, not a timer).
  - `touch-action` is unchanged.
  - Lifecycle listeners are unchanged apart from L3.
  - Back edge cases are covered (I4).
  - No generated `android/` files were hand-edited: only the template-owned `res/values*/styles.xml` comments changed, and they survived `cap sync` byte-identical.

## Next step

1. Return to **mobile-junior-developer** (step 7) with this document for R1, and L1-L3 alongside it.
2. Route **E1** to mobile-solution-architect and mobile-product-manager in parallel. The code does not wait on E1, but step 10's M2.10a (c) and M2.12 verdicts do.
3. After the fixes, run a round-9 review with the same scope. For evidence, re-run the fold `uiautomator dump` and the Playwright suite ×3.
