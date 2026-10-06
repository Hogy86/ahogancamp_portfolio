# Mobile Code Review, Round 9

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-28
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `4138829`, plus untracked files.
- **Modified:**
  - `src/platform/android/{AndroidPlatform.ts, GameShell.ts, android.css, backButton.ts, layout.ts, layout.test.ts, lifecycle.ts, overlays.ts, screenFit.ts}`
  - `android/app/src/main/java/io/github/hogy86/shieldvsrobots/GameShellPlugin.java`
  - `android/app/src/main/res/values{,-v28}/styles.xml` (comments only)
  - `scripts/{check-android-styles.mjs, check-android-styles.test.mjs, check-no-secrets.test.mjs}`
  - `tests/mobile-e2e/{rename-audit.spec.ts, swap-layout-behavior.spec.ts}`
  - `package.json`, `playwright.mobile.config.ts`
  - repo-root `.github/workflows/deploy-pages.yml`
  - docs
- **New:** `tests/mobile-e2e/{cutout-insets.spec.ts, too-small-window.spec.ts}` and screenshots under `docs/mobile/tests/screenshots/`.
- **Unchanged:** every shared file (`src/core`, `src/systems`, `src/ui`, `src/render`, `src/config`, `src/main.ts`, `src/style.css`). All 9 changed `src` files are under `src/platform/android/`.

**Scope:**
1. The fixes for `code-review-round8.md`: R1, L1-L3, S1-S3, and the E1 evidence naming.
2. PRD-mobile v1.6 **M2.3b**, per `mobile-architecture.md` v1.6 **Amendment A12**:
   - §6.1 A12: native cutout fields and normalization
   - §6.2 A12: sizing and placement
   - §6.2.1 A12: classification, worked-check table, keyboard gate
   - §6.3, §6.4, §6.5 A12
   - §10.1 A12 tests
   - §16 A12 handoff
3. The 2026-09-28 tooling-log evidence, including the robocopy destination-quoting incident.

**Reviewed against:**
- `mobile-architecture.md` v1.6 (§6.1-§6.5 with A11/A12, §8.3, §10.1, §12 MR20-MR22, §16)
- M-ADR-0004 and M-ADR-0005
- `PRD-mobile.md` v1.6: M2.3, M2.3a, M2.3b (a)-(e), M2.10a, M2.12, M2.13, M4, M5
- `code-review-round8.md`

**Skills applied:** coding-standards, mobile-touch-and-layout

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: FAIL

**The product code is correct and ready.** I found no defect in the A12 implementation or in any round-8 fix:
- Every build and test passes.
- An independent run of the **full** §10.1 A12 invariant grid (2,465,792 cases) against the real `layout.ts` found **zero** violations.
- All four AVDs behave as specified:
  - The low-end 640 × 360 reference AVD plays, with its text and controls inside the real insets.
  - On the fold, the accessibility tree under the prompt now has no buttons.

**The gate still fails on two small required items.** Neither changes product code:
- **R1 (MEDIUM, test conformance).** The binding §10.1 A12 invariant grid was cut down to a "representative" sample and **dropped one whole required assertion category** (control rects inside the full insets, and not overlapping the playfield's x range). The reason given, "CI runtime", is not true: the full grid runs in about 1.5 s. The reduction was not recorded as a deviation.
- **R2 (LOW, process safety).** The documented mirror-refresh command is **still unsafe**. The destination path is still unquoted, and there is still no post-refresh parity check. That is the command that silently wrote a full copy of the tree into the git working directory. The junior diagnosed this correctly but left it as a "documented gap".

This is the round-8 R1 pattern again: a silent deviation from binding spec text. Both fixes are small. mobile-junior-tester must not start until the round-10 review reports PASS.

## Verification results

| Check | Result |
|---|---|
| `npm run check:secrets` | PASS, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| `npm run test` | **PASS: 29 files, 509 tests** (453 in round 8) |
| `npm run build` (web) plus the CI purity grep on `dist/assets/*.js` | PASS. No `@capacitor` or `registerPlugin` found. |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| `npm run build:android` | PASS |
| `npm run check:android-styles` (repo) | PASS, exit 0 |
| Round-8 L2 reproduction on a scratch copy of the real `res/`: `<item name="android:windowBackground" tools:targetApi="s">@null</item>` added to `values-v30` only | **FAILED, exit 1** (3 parity findings). L2 closed. |
| Styles guard run from the wrong cwd | Exit 2 with an actionable message (fails closed) |
| **Full §10.1 A12 invariant grid**, independent. Scratch harness (session scratchpad only) bundles the real `layout.ts` with esbuild. | **2,465,792 cases, 1,840,348 playable, 0 violations, 1.5 s.** Grid: W 560-1400 and H 280-820 in 20 dp steps; l, r ∈ {0, 24, 30, 48}; t ∈ {0, 24, 28.2, 36}; b ∈ {0, 24, 32, 40}; cT ∈ {0, t}; cB ∈ {0, b}; both swaps. Asserted: s ≥ 0.5; no art under a cutout; text inside the full insets; playfield inside the side insets; every control rect inside the full insets and not overlapping the playfield's x range; ◀-▶ gap ≥ 8; PAUSE-THROW gap ≥ 24; `classifyWindow` agrees with `belowFloor` **and** with the spec's closed-form `minW`/`minH`. |
| Playwright `--repeat-each=3`, nothing else running, every spec except `cutout-insets.spec.ts` (cwd = scaffold) | **225 passed, 0 failed** (3.9 min) |
| Playwright `--repeat-each=3`, `cutout-insets.spec.ts` only (cwd = session scratchpad, see L1) | **48 passed, 0 failed.** Total 273/273, which matches the junior's figure. The 5 in-repo `m2_3b_c_*.png` files are byte-identical before and after (sha1 checked). No listeners were left on 4173-4175, 4181, 4182 or 9333. |
| Mirror refresh (PowerShell script in the scratchpad, **both paths quoted**): stale-node check (0 found), three `Remove-Item` clears, `robocopy /MIR /XD … /XF …` | robocopy exit 1 |
| Post-refresh `diff -rq` / `cmp` (repo vs. mirror) | Identical: `src`, `tests`, `scripts`, `public`, `android/app/src`, `android/app/build.gradle`, `package.json`, `package-lock.json`, `capacitor.config.ts`, `vite.config.ts`, `playwright.mobile.config.ts` |
| Mirror hygiene (`*.csv`, `.env*`, `*.tfstate*`, `terraform.tfvars`, `*.jks`, `*.keystore`, `signing.properties`) outside `node_modules` | None found |
| Stray copies from the robocopy incident | **None remain.** No `*Usersaaron*`, `*dev-build*` or `*shield-vs-robots*` directory anywhere under the repo. `git status` shows only the reviewed files. None in `C:\Users\aaron` or at the repo root. |
| Mirror `npm ci`, `build:android`, `npx cap sync android`, `check-capacitor-config.mjs`, `check:android-styles` | All PASS (plugins: app 8.1.1, splash-screen 8.0.2). `res/` identical to the repo after sync. The synced bundle `AndroidPlatform-CkwCoiWy.js` has the same hash as the repo build and contains `--vvs-cutout-top`. |
| Mirror `gradlew assembleDebug --no-daemon` (JDK 21.0.12) | **BUILD SUCCESSFUL**, 153 tasks |
| Mirror `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true --no-daemon` | **BUILD SUCCESSFUL**, 203 tasks |
| Mirror `gradlew bundleRelease --no-daemon` (`CI` unset) | **Refused as designed** ("Release signing not configured… Refusing to build."). No `.aab` anywhere. |
| `AAPT2_PATH=…\build-tools\36.0.0\aapt2.exe`, `check-android-manifest.mjs --variant debug` | PASSED |
| Same with `--variant release` on `app-release-unsigned.apk` | PASSED |
| Negative control: `--variant release` on `app-debug.apk` | FAILED as expected (`R2: android:debuggable="true"`), exit 1 |
| `aapt2 dump resources`, cutout mode (attr `0x01010586`) | All three app styles: base has none, v28 = 1, v30 = 3 |
| **`svr_api36_lowend_640x360`** (-gpu host, gesture nav): install, cold launch | `Status: ok`. Title shows with **no prompt**. |
| Low-end: live values over WebView DevTools (CDP) | Edges **l 30, r 30, t 24, b 32**; `--vvs-cutout-top/bottom` **0px / 0px**; `--pf-scale` **0.505**; `#app-root` top **26.7725**. That top equals the §6.2 A12 formula exactly (topMin 21.98, botMin 25.435). |
| Low-end: Start → PLAYING | HUD content-box tops **36.82-84.94 ≥ 24**. `#control-text` content-box bottom **320.73 ≤ 328**. Canvas text top 26.77 + 4·0.505 = 28.79 ≥ 24. Controls: ◀ [30, 272, 86, 328], ▶ [94, 272, 150, 328], THROW [554, 272, 610, 328], PAUSE [558, 40, 606, 88]. All are inside [30, 610] × [24, 328], and none shares x with the playfield (150-554). Canvas bottom 329.77 is 1.77 dp into the bottom band, which M2.3b rule 1 allows for art. |
| Low-end: hold ▶ 900 ms, tap THROW, PAUSE, Resume, Home, relaunch | The player moved right and a shield was thrown. The pause menu sits inside the insets (Quit bottom 323 dp). After background and relaunch the pause menu shows (the resume/reclassify path). FATAL = 0. |
| **`svr_api36_fold`** (-gpu host): install, cold launch | `Status: ok`. A full-bleed "Make the window larger to play." shows. The window is 1082 × 811 px = 412 × 309 dp, **from a pre-existing `wm size` override; see L4**. |
| Fold: `uiautomator dump` while the prompt shows | The tree is WebView → View → View → one `TextView` "Make the window larger to play.". **0 `android.widget.Button` nodes**, and no Start, How to play, Settings or Quit. **Round-8 R1 is closed on device.** |
| Fold: CDP | `#app-root` and `#safe-layer` computed `visibility: hidden`; edges 29.71, 29.71, 24, 32; cutouts 0. |
| Fold: 5 taps (centre and four corners) | The post-tap screenshot is **byte-identical** to the pre-tap one |
| Fold: Back | The launcher becomes `topResumedActivity`. The process (pid 2889) stays alive. FATAL = 0. |
| **`svr_api36_pixel7`** (-gpu host, gesture nav; landscape via `user_rotation 1`) | `Status: ok`. Title, no prompt. Edges **l 51.81, r 29.71, t 28.19, b 32**; cutouts 0/0; **s = 0.6005** (= §6.2.1 A12 row 10). HUD tops ≥ 37.4. Hint bottom 377.38 ≤ 380. THROW right edge 885.29 = 915 − r. |
| Pixel 7: Start, hold ▶, THROW | Normal play: the player moved, a shield hit (Score 100), and a power-up dropped. FATAL = 0. |
| **`svr_api29_webview`** | The M1.4 fallback "Please update Android System WebView from the Play Store." shows. `MainActivity` is resumed. FATAL = 0, "has died" = 0. |
| Cleanup | `accelerometer_rotation` was set back to 1 and `user_rotation` deleted on the Pixel 7. `wm size` was unchanged on the low-end, Pixel 7 and API 29 AVDs. Port forwards were removed. Each AVD was stopped with `adb emu kill` and verified (`adb devices` empty, no emulator or qemu process). No java or node process and no listener remain. The `adb.exe` server (pid 178172) was **already running before this review** and was left as found. Scratch files are only in the session scratchpad. `git status` is the same as at the start. |

No command was denied.

---

## Prior findings status (code-review-round8)

| # | Status | Evidence |
|---|---|---|
| R1 | **Closed** | `screenFit.ts:162-177` hides `#app-root` and `#safe-layer` in the prompt branch and restores them before `computeLayout` in the playable branch. Nothing in `src` sets `visibility: visible`. The header comments in `overlays.ts:8-18` and `android.css:71-75` and `:112-116` are corrected. Tests: `too-small-window.spec.ts:56-58` and `:146-159`. On the fold device, 0 button nodes. |
| L1 | **Closed** | The `check-android-styles.mjs` comment now attributes the failure to jsdom's global `URL`. The header's `checkParity` name is fixed. |
| L2 | **Closed** | `STYLE_TAG_RE` + `parseAttrs` + attribute-tolerant `ITEM_RE`; XML comments are stripped. There are 2 fixtures, and my real-tree reproduction fails as it should. |
| L3 | **Closed** | `lifecycle.ts:47` calls `host.reclassifyWindow()` before `loop.resume()`. This is `ScreenFit.reclassify()` → `relayout(false)`. See I2. |
| S1 | **Closed** | MR20 keyboard tests at `too-small-window.spec.ts:173-201` and `:273-307` |
| S2 | **Closed** | The 5-tap check also compares Help/Settings state and layer visibility (`:77-101`) |
| S3 | **Closed** | `testIgnore` in 3 projects, so the spec runs once, under 640×360 |
| E1 naming | **Closed** | `m2_10a_pixel7_640x360_real_insets_prompt.png` exists; the log is reworded |
| E1 (a)-(c) | Resolved upstream by PRD v1.6 M2.3b and arch A12; the low-end AVD was added | This review confirms on the new low-end AVD that the reference profile plays |

---

## REQUIRED (must fix before PASS; owner mobile-junior-developer)

- **R1 (MEDIUM). The §10.1 A12 invariant grid is cut down, drops a required assertion category, and justifies it with a false premise.**
  - **Where:** `src/platform/android/layout.test.ts:279-346`; tooling log A12 entry ("a representative classifyWindow/computeLayout invariant grid").
  - **The spec (binding, §10.1 A12 "Unit"):**
    - Grid: W 560-1400 and H 280-820 in 20 dp steps; l, r ∈ {0, 24, 30, 48}; t ∈ {0, 24, 28.2, 36}; b ∈ {0, 24, 32, 40}; cT ∈ {0, t}; cB ∈ {0, b}; both swaps.
    - For every playable result, assert:
      1. s ≥ 0.5;
      2. no art under a cutout;
      3. text inside the full insets;
      4. **"every control rect is inside the full insets and does not overlap the playfield's x range"**;
      5. `classifyWindow` agrees with `belowFloor`.
  - **What the code does:**
    - It uses 11 hand-picked widths, 9 heights and 12 inset tuples: 2,376 cases instead of 2,465,792.
    - Several of the heights (351.5, 352, 412) are not on the 20 dp lattice.
    - Assertion 4 is **missing entirely**.
    - The comment gives "CI runtime" as the reason.
  - **Why this is not acceptable:**
    - **The premise is false.** I ran the exact spec grid, with every assertion including 4 and two extra ones, against the real `layout.ts`: 1.5 s.
    - **The missing assertion is the one that guards M2.3b rule 3 and M2.4** (controls never in a band and never over the playfield). A12 moved the playfield into the bands, so this is the regression the grid exists to catch.
    - **The deviation was not recorded as one** (§16 A12: "Record any deviation from this spec… for the architect").
    - The code passes today, so this is about regression cover, not about a current bug.
  - **Fix:**
    1. Replace the reduced grid with the spec grid.
    2. Build the lattices with loops: `for (let w = 560; w <= 1400; w += 20)` and `for (let h = 280; h <= 820; h += 20)`.
    3. Use the spec's value sets, with cT ∈ {0, t}, cB ∈ {0, b}, and both swaps.
    4. **Collect violations into an array and assert once**, for example `expect(violations.slice(0, 20)).toEqual([])`. Do not call `expect` per case: millions of `expect` calls are what would actually be slow.
    5. Add assertion 4:
       - Convert the `#safe-layer`-relative controls to viewport coordinates: ◀, ▶ and THROW at `(l + xBtn, t + controlRowY, B, B)`; PAUSE at `(l + pauseButtonX, t + 16, 48, 48)`.
       - Check each is inside `[l, W − r] × [t, H − b]`, with no x-overlap with `[playfieldX, playfieldX + playfieldWidth]`.
    6. Keep the `classifyWindow === 'tooSmall' ⇔ belowFloor` check for every case.
    7. Keep the existing hand-picked rows (351.5, 352, 412…) as a separate boundary test if wanted.
  - **Also (LOW, same file):**
    - §10.1 A12 asks for "every row of the §6.2.1 A12 worked-check table in both swap settings". The numeric results are asserted only unswapped, and not for every row: row 1 pfY ≈ 26.77, row 3 s ≈ 0.5058 and pfY ≈ 28.65, and row 16 are only classified.
    - Add the numeric `s`/`pfY` expectations for rows 1-7, 10 and 14, in both swap settings. pfY is swap-invariant, so this is a loop.

- **R2 (LOW). The documented mirror-refresh command is still unsafe after the incident it caused.**
  - **Where:** `docs/mobile/tooling-setup-log.md:384-389`, the canonical refresh block that every later round cites: "followed the documented procedure". The A12 entry at `:1400-1408` flags the problem but leaves it open.
  - **What is wrong:**
    - The destination `C:\Users\aaron\dev-build\shield-vs-robots` is still **unquoted**. There is still **no mandatory parity step**.
    - Run from the Bash tool (the pipeline's normal shell), backslash removal turns the destination into `C:Usersaarondev-buildshield-vs-robots`. That is a drive-relative path, so robocopy copied the whole tree into the git working directory. It reported success, and the real mirror stayed stale.
    - The first APK built that round came from pre-A12 code. It was caught only because the junior happened to diff.
  - **Current state:** I found no stray copy in the repo or elsewhere, so the clean-up was done. But the next agent to follow the documented block will reproduce the incident.
  - **Fix (append a dated correction; don't rewrite history):**
    1. **Pick one supported shell and state it.** Recommended: a PowerShell block, run via `powershell.exe -NoProfile -File <script>`, with both paths in single quotes. This review used exactly that and it worked first time.
    2. If a Bash form is kept, it must quote both paths and set `MSYS_NO_PATHCONV=1`.
    3. **Add a mandatory post-refresh parity check** that fails loudly. For example, `diff -rq` of `src tests scripts public android/app/src` plus `cmp` of `package*.json`, `capacitor.config.ts`, `vite.config.ts`, `playwright.mobile.config.ts` and `android/app/build.gradle`. State that robocopy's exit code is **not** evidence.
    4. **Add a guard line:** after the refresh, `git status --porcelain` must show nothing new outside the reviewed files.
  - **Owner:** mobile-junior-developer drafts it (it discovered the incident). mobile-it-analyst may own the procedure going forward.

---

## LOW (not blocking; fix with R1/R2)

- **L1. `tests/mobile-e2e/cutout-insets.spec.ts:256` writes screenshots into the repo on every run.**
  - `page.screenshot({ path: 'docs/mobile/tests/screenshots/m2_3b_c_….png' })` is relative to cwd. So every local run, every CI run and every `--repeat-each` repeat overwrites the committed step-7 evidence. With `fullyParallel` and `--repeat-each=3`, three workers write the same file at once.
  - §10.1 A12 (c) says "Attach one screenshot per case to the **test output**".
  - I had to run this spec with the scratchpad as cwd to stay read-only.
  - **Fix:** `await testInfo.attach(label, { body: await page.screenshot(), contentType: 'image/png' })`. Keep the device screenshots as step-10 evidence.
- **L2. Playwright coverage is short of §10.1 A12 in three places.**
  - **(a)** (c) runs 5 cases. The spec says "for every (a) and (b) case", which is 8: the three swapped reference cases are missing. Text positions don't depend on swap, but the control-inside-insets check in (c) should run in the mirrored layout too.
  - **(b)** (b) does not apply "the same checks" as (a): the ▶ width, PAUSE ≥ 48, and the ◀-▶ ≥ 8 gap are missing (`:196-199`). Factor the (a) checks into one helper and call it from both.
  - **(c)** The Esc/Esc/Enter keyboard test (`too-small-window.spec.ts:299-302`) compares enemies and score but not "timers" as §10.1 asks. Compare the whole snapshot minus any fields that are legitimately wall-clock.
  - Also: the M2.10a (c) v1.6 boundary test exists twice, at `cutout-insets.spec.ts:283-292` and `too-small-window.spec.ts:235-249`. Keep one.
- **L3. The tooling log A12 entry is inaccurate in two places.**
  - `:1370` refers to "the round-9 note on `slide-switch.spec.ts`". There is no round 9 yet; it means this same batch's round-7 entry.
  - The fold cleanup claim is wrong; see L4.
- **L4. `svr_api36_fold` was left with a `wm size` override, although the log says it was reset.**
  - On boot today the fold reports `Physical size: 1080x2340` **and `Override size: 1082x811`**. That is the override the junior set for the R1 evidence (`:1270`). The round-7 entry says "Cleanup: `wm size reset` … confirmed back to `Physical size: 1080x2340`", and the A12 fold run does not mention a reset.
  - The fold's "412 × 309 dp" window is therefore currently an **override, not the AVD's own state**. The M2.10a (a) evidence depends on it.
  - I tested in the state I found and **left it unchanged**; it was not my change to restore.
  - **Fix:**
    - **mobile-lead-tester and mobile-it-analyst:** decide whether `wm size 1082x811` is the documented fold-profile procedure in `device-matrix.md`, with its own set/reset steps, or whether it should be reset.
    - **Junior:** correct the log's cleanup claim.

## Suggested (optional)

- **S1.** `layout.ts:190-192` computes `topMin`/`botMin` with the chosen `scale` even when `belowFloor` is true. The result is never applied, because `screenFit` returns before `computeLayout` in that case. A one-line comment would stop a future reader assuming the feasibility proof covers it.
- **S2.** On the fold, a cold launch straight into the prompt leaves `#app-root` un-laid-out (CDP shows the canvas at [0, 0, 800, 600]). This is harmless because the layer is hidden, and the first playable re-layout positions it. Worth a comment next to the prompt branch in `relayout`.

## INFO

- **I1. The A12 implementation matches the spec line by line.**
  - **Native** (`GameShellPlugin.java:64-81, 139-151`): `cutoutTop`/`cutoutBottom` = `cutout.top/bottom / density`, through the same `toEdgeInsets`, so the `getRootWindowInsets()` fallback reports them too. The `(0, …, 0)` placeholder is consistent. There is no new method, permission, I/O or logging. For security pass 2: the only native change is two numeric fields in an app-internal payload.
  - **`GameShell.ts`:** optional payload fields. The `?cutout=` fallback defaults to `0,0`, a malformed value parses to 0, and both fields are always emitted.
  - **`layout.ts`:**
    - `normalizeInsets` applies the three §6.1 A12 rules in order: missing or non-finite cutout → normalized edge; negative → 0; edges raised to cutouts.
    - `LayoutInsets` makes the cutout fields required at every call site.
    - The constants cite their sources, per §6.5 A12.
    - `topRes`/`botRes`/`availH` and `topMin`/`botMin`/`pfY` are exactly the §6.2 A12 formulas.
    - `classifyWindow` is still "portrait, then `belowFloor`"; my grid confirms it equals the closed-form `minW`/`minH`.
  - **`screenFit.ts`:** normalizes at `init` and on every `edgeInsetsChanged`. `#safe-layer` and the prompt padding use the full edges, and it sets `--vvs-cutout-*`. On device, `#app-root` top matched the formula to 4 decimals on the low-end AVD, and s matched row 10 on the Pixel 7.
- **I2. The keyboard gate (§6.2.1 A12 behavior 4) is correct.**
  - `overlays.ts:147-151` checks the prompt first in a document capture listener, which runs before the shared `KeyboardInputSource`'s window bubble listener.
  - It applies `preventDefault` + `stopPropagation` to every `keydown` and does not block `keyup`, so a held key cannot stick.
  - On entering a prompt it blurs a focused element in `#app-root` or `#safe-layer`. An iframe's focus shows as the iframe element, so the privacy frame is covered.
  - The `onFrame` re-pause guard is kept as defense in depth.
  - Web is unaffected: the listener is only in `AndroidOverlays`.
  - L3 edge case: `reclassify()` → `relayout(false)` records the new viewport key, so a `resize` arriving after `resume` will not pause for the size change. This is harmless, because the app was already paused on background (§8.1) and a prompt entry still pauses through `lastWindowClass`.
- **I3. One codebase:** no shared file changed; the MR21 check is not triggered. No game logic is branched, and no frame-count timing was added.
- **I4. Back order** (`backButton.ts`): the pure `resolveBackTarget` is shared by the listener and the e2e hook, with the prompt first. On the fold, Back leaves the app with the process alive.
- **I5. Measured insets on the new low-end AVD are t = 24, b = 32, l = r = 30, no cutout.** That is exactly the M2.3b (a) model's (30, 30, 24, 32) row. The it-analyst's `dumpsys`-based note ("0 dp top") in the tooling log does not match what GameShell reports, because the top system-gesture band counts. Step 10 should record the GameShell values.
- **I6. Coding standards, per category:**
  - Style: PASS
  - Error handling: PASS (normalization fails safe; the styles guard fails closed)
  - Logging: n/a (nothing is logged)
  - Code documentation: PASS (the round-8 stale comments are fixed; the new functions carry intent and "why" comments)
  - Dead code: none
  - Test conformance to the binding §10.1: **FAIL** (R1, L1, L2)
- **I7. mobile-touch-and-layout**, checked on the real low-end 640 × 360 AVD and the Pixel 7:
  - ◀ ▶ THROW are 56 dp on the low-end and 64 dp on the Pixel 7; PAUSE is 48; the ◀-▶ gap is 8.
  - Every control is inside the full insets and away from the side back-gesture edges.
  - Scaling is uniform, and the letterbox is `#05050a`.
  - HUD and hint text are inside the full insets; only art enters the bands.
  - Pause on background, and resume into the pause menu.
  - Back is never swallowed.
  - Nothing interactive or readable is under a cutout or the gesture bar.
- **I8. No generated `android/` file was hand-edited.** The Java plugin is first-party source (§1); the `styles.xml` changes are comments only; `res/` is byte-identical after `cap sync`.

## Next step

1. Return to **mobile-junior-developer** (step 7) with this document for R1 and R2, and L1-L3 alongside.
2. Route **L4** to mobile-lead-tester and mobile-it-analyst, to decide the fold-profile procedure.
3. Run a round-10 review with narrow scope: `layout.test.ts`, the Playwright spec changes, and the tooling-log procedure block. No new device run is needed unless product code changes. Re-run `npm run test` and Playwright `--repeat-each=3`, and do one mirror refresh **with the new documented command and parity step**.
