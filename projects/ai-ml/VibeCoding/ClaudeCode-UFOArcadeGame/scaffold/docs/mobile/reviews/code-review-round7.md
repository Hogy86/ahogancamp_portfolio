# Mobile Code Review, Round 7

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-27
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `b3d53a7`, plus untracked files:
- Modified: `android/app/src/main/res/values/styles.xml`, `docs/mobile/architecture/mobile-architecture.md` (§6.6), `docs/mobile/tooling-setup-log.md`
- New: `android/app/src/main/res/values-v28/styles.xml`, `android/app/src/main/res/values-v30/styles.xml`, `scripts/check-android-styles.mjs`, `scripts/check-android-styles.test.mjs`
- Step-10 artifacts, checked for context only: `docs/mobile/tests/device-matrix.md`, `validation-report-round2.md`, `screenshots/*`
- `src/`, `.github/workflows/deploy-pages.yml` and every other script are unchanged against HEAD.

**Scope:** the fix for `validation-report-round2.md` **F1** (API 28 crash on launch: `UnsupportedOperationException: Unknown windowLayoutInDisplayCutoutMode: 3`).
**Reviewed against:**
- `mobile-architecture.md` v1.3 §6.6 and §16
- M-ADR-0004 and M-ADR-0007
- `PRD-mobile.md` v1.4 M1 (M1.1 minSdk 24, M1.4 WebView fallback) and M2 (edge-to-edge and cutouts)
- `code-review-round6.md`
- `validation-report-round2.md` F1 and `raw-output-round2.log`

**Skills applied:** coding-standards, mobile-touch-and-layout

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: PASS

- **F1 is fixed.** I checked this on the real API 28 image (`svr_api29_webview`, WebView 69.0.3497.100):
  - Two clean cold launches each gave `Status: ok`, the process stayed alive, and there were **0 `FATAL EXCEPTION`** lines.
  - The M1.4 fallback text "Please update Android System WebView from the Play Store." renders. That is the behavior this device row exists to verify.
- **The resource-qualifier approach is correct for API 24-36.** I confirmed this in the compiled APK (`aapt2 dump resources`), not only in the source XML:

  | Style | Base (API 24-27) | `v28` (API 28-29) | `v30` (API 30-36) |
  |---|---|---|---|
  | `AppTheme` | no `0x01010586` | `=1` (`shortEdges`) | `=3` (`always`) |
  | `AppTheme.NoActionBar` | no `0x01010586` | `=1` | `=3` |
  | `AppTheme.NoActionBarLaunch` | no `0x01010586` | `=1` | `=3` |

  - Nothing else in the APK, including library styles, sets `3` below v30. `Base.Theme.SplashScreen` from core-splashscreen uses `=1` at v27/v29 and `=3` at v30.
  - This is correct because `LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS` (3) was added in **API 30**. API 28 and 29 know only 0, 1 and 2, and `PhoneWindow.generateLayout` throws on any other value.
  - Android picks the highest `vNN` that is ≤ the device API. So 24-27 use base, 28-29 use v28 and 30+ use v30. There are no gaps.
- **No other attribute in these styles is API-gated:**
  - `colorPrimary`, `colorPrimaryDark`, `colorAccent`, `windowActionBar` and `windowNoTitle` are AppCompat attributes.
  - `windowSplashScreen*` and `postSplashScreenTheme` are core-splashscreen attributes.
  - `android:background` exists from API 1.
  - The parents are explicit (`parent=`), so no dotted-name inheritance is affected. Capacitor's `capacitor_full_screen_style` inherits from `AppTheme.NoActionBar` and picks up the qualified values correctly.
- **The guard runs in CI**, indirectly: `vitest.config.ts` includes `scripts/**/*.{test,spec}.mjs`, and the `build` job runs `npm run test -- --run`, so the real-tree assertions in `check-android-styles.test.mjs:100-129` gate the deploy.
- **The tests are not tautological:**
  - The standalone checker, fed HEAD's pre-fix `values/styles.xml`, reports 3 failures and exits 1.
  - The real-tree tests **fail closed** when run from the wrong cwd (2 failures, `ENOENT`). They do not pass silently, which avoids round 6's L1 pattern.
- **`cap sync` leaves the edited `res/` alone:** `diff -rq` shows it identical after sync. These are template-owned sources, not generated copies.
- **No shared game logic changed**, so the one-codebase rule is untouched.
- **Nothing blocks.** There is one MEDIUM, which is a document-ownership issue routed to mobile-solution-architect, not a code defect. There are also three LOWs, two suggestions and INFO items.
- **mobile-junior-tester / mobile-lead-tester may proceed** (re-run step 10). M1 must be closed before step 12.

## Verification results

| Check | Result |
|---|---|
| `npm run check:secrets` | PASS, exit 0 (S1 template-exemption notice, then "no tracked secret-shaped content found") |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| `npm run test` | **PASS: 29 files, 432 tests** (420 in round 6, plus the 12 new `check-android-styles` tests) |
| `npm run build` (web) and CI web-bundle purity grep | PASS; grep found no `@capacitor`/`registerPlugin` |
| `npm run build:android` | PASS |
| `npx playwright test -c playwright.mobile.config.ts --repeat-each=2` | **128 passed, 0 failed, 0 skipped** (2.7 min). Ports 4173/4174 were free afterwards. |
| Guard negative control: HEAD's pre-fix `values/styles.xml` via `--res-dir <scratch>` | **FAILED as it should**: 3 findings, exit 1 |
| Guard real-tree tests run from the wrong cwd (`vitest run --root scaffold` from the parent directory) | **Fail closed**: 2 failed with `ENOENT` |
| Guard standalone run on a missing `--res-dir`, or from the wrong cwd | **Passes, exit 0 (fail-open)**; see L1 |
| Guard on `<item name="android:windowLayoutInDisplayCutoutMode" tools:targetApi="o_mr1">always</item>` in `values/` | **Passes, exit 0 (missed)**; see L2 |
| Mirror refresh, run as documented: stop mirror node processes (none found), three `Remove-Item` clears, then the documented `robocopy /MIR /XD … /XF …` | robocopy exit 1 (copied, 0 failed) |
| Mirror parity (`diff -rq`) | Identical: `src`, `tests`, `scripts`, `public`, `android/app/src`, `android/app/build.gradle`, `package*.json`, `capacitor.config.ts`, `vite.config.ts`, `playwright.mobile.config.ts` |
| Mirror hygiene outside `node_modules`: `*.csv`, `.env*`, `*.tfstate*`, `terraform.tfvars`, `.terraform`, `*.jks`, `*.keystore`, `signing.properties` | None found |
| Mirror `npm ci`, `build:android`, `npx cap sync android`, `check-capacitor-config.mjs` | All PASS (2 plugins: app 8.1.1, splash-screen 8.0.2) |
| Mirror `node scripts/check-android-styles.mjs` | PASS, exit 0 |
| Mirror `res/` after `cap sync` compared with the repo | Identical |
| Mirror `gradlew assembleDebug --no-daemon` (JDK 21.0.12) | **BUILD SUCCESSFUL**, 153 tasks |
| Mirror `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true --no-daemon` | **BUILD SUCCESSFUL**, 203 tasks |
| Mirror `gradlew bundleRelease --no-daemon` (`CI` unset) | **Refused as designed**, exit 1 ("Release signing not configured… Refusing to build."). No `.aab` anywhere. |
| `AAPT2_PATH=…\build-tools\36.0.0\aapt2.exe` `check-android-manifest.mjs --variant debug` | PASSED, exit 0 |
| Same, `--variant release` on `app-release-unsigned.apk` | PASSED, exit 0 |
| Negative control: `--variant release` on `app-debug.apk` | FAILED as expected (`R2: android:debuggable="true"`), exit 1 |
| `aapt2 dump resources app-debug.apk`, every `0x01010586` (`windowLayoutInDisplayCutoutMode`) entry | App styles: v28=1 and v30=3 in all three, none in base. Library: v27/v29=1, v30=3. **No `=3` below v30.** |
| **`svr_api29_webview` (API 28, WebView 69), `-no-window -gpu swiftshader_indirect`**: install, then `force-stop`, `logcat -c`, `am start -W` ×2 | Both `Status: ok`, pids 3705 and 4313 alive after 8 s, **FATAL=0**, no cutout-mode log line. `mCurrentFocus` = MainActivity. Capacitor `Starting BridgeActivity` logged. The screenshot shows the M1.4 fallback text. |
| **`svr_api36_pixel7` (API 36), `-no-window -gpu host`**: same ×2 | Both `Status: ok`, pids 4466 and 4601 alive, **FATAL=0**, `net::ERR_*`=0. Window `layoutInDisplayCutoutMode=always`. The screenshot shows the title full-bleed. |
| Cleanup | Both AVDs stopped with `adb emu kill`. The emulator's own `-kill … -sleep 20` watchdog exited by itself. `adb devices` is empty, `adb kill-server` was run, and there are no emulator, qemu or java processes. No listeners on 4173, 4174, 4181 or 4182. |

No command was denied.

---

## Findings status

| # | Source | Status | Evidence |
|---|---|---|---|
| F1 | validation-report-round2 | **Closed** | `values/styles.xml` no longer sets the attribute. `values-v28/styles.xml:21,28,35` set `shortEdges` and `values-v30/styles.xml:15,22,29` set `always`. The compiled APK confirms the values, and two clean API 28 launches had no FATAL. |
| L1 | code-review-round6 (`check-no-secrets.test.mjs` cwd) | Still open, not in scope this round | Unchanged. The new test file avoids the same bug, see above. |

---

## MEDIUM (routed to mobile-solution-architect; must close before step 12, does not block step 9/10)

- **M1. `docs/mobile/architecture/mobile-architecture.md` §6.6 (around lines 606-621) was rewritten in place by the implementer. There is no amendment ID, no §16 log row and no version bump, and M-ADR-0007 still contradicts it.**
  - The document belongs to mobile-solution-architect. Every earlier change went through a dated amendment (A1-A9) with a §16 row and a header version bump, and the traceability rule says spec documents are amended, never overwritten.
  - The header still reads v1.3 (line 4). §16 has no entry for this change.
  - `docs/mobile/architecture/adr/0007-android-targets-manifest-and-plugin-allowlist.md:32` still says the theme sets `windowLayoutInDisplayCutoutMode="always"` unconditionally.
  - There is also a markdown defect. The edit splits the bold phrase so that the line ends in `** ` and the next begins `Capacitor's own … must be disabled**`. An opening `**` followed by a line break does not open bold in CommonMark, so the binding "must be disabled" emphasis now shows literal asterisks.
  - **The technical content is correct**, and it matches the code and the device evidence. I accept the code's deviation from v1.3's "always" as justified by F1.
  - **Fix (owner: mobile-solution-architect):**
    1. Issue Amendment **A10** (v1.4), triggered by validation-report-round2 F1 and code-review-round7 M1. It should record:
       - `always` on API 30+ only
       - `shortEdges` on API 28-29
       - the attribute omitted below 28
       - the three-folder layout, with the parity rule from L3
       - `scripts/check-android-styles.mjs` as the guard
    2. Add the §16 row and bump the header.
    3. Append a dated amendment note to M-ADR-0007.
    4. Repair the bold markup (`**Capacitor's own edge-to-edge margin/inset handling must be disabled**` on one line).
  - The junior's in-place wording may be kept as the A10 text if the architect agrees, but it must be recorded as A10.
  - **Owner for process:** the main session routes this to mobile-solution-architect. mobile-junior-developer should not edit `mobile-architecture.md` or the ADRs again. Changes the implementer proposes to the spec go in `tooling-setup-log.md` or a handoff note for the architect.

## LOW (not blocking; fix the next time these files are touched; owner mobile-junior-developer)

- **L1. `scripts/check-android-styles.mjs:60-68, 90-101`: the standalone checker fails open.**
  - If `--res-dir` doesn't exist, or the script runs from any cwd other than `scaffold/`, `loadStylesFiles` returns `{}` on `ENOENT`.
  - `main()` then prints the success message and exits 0. Reproduced both ways.
  - The CI protection today comes from the vitest real-tree tests, which do fail closed, so this is LOW. The tooling log (`tooling-setup-log.md`, round-7 entry) still tells people to run the script by hand, and a false "no … found" there is misleading.
  - **Fix:**
    1. In `loadStylesFiles`, re-throw, or return a sentinel for, `ENOENT` on the **res dir itself**.
    2. In `main()`, print `check-android-styles: res dir not found (<abs path>); run from scaffold/ or pass --res-dir` and set `process.exitCode = 2`.
    3. Also fail with exit 2 if no `values` folder was found.
    4. Resolve `DEFAULT_RES_DIR` from the script's own location (`fileURLToPath(new URL('../android/app/src/main/res', import.meta.url))`) rather than from cwd.
    5. Add a fixture test for the missing-directory path. To keep it testable, export a small `run(resDir)` that returns `{ code, messages }`.
- **L2. `scripts/check-android-styles.mjs:23`: `CUTOUT_ITEM_RE` misses realistic spellings of the same bug.**
  - It requires exactly `<item` + whitespace + `name="android:windowLayoutInDisplayCutoutMode">`, so it misses:
    - **any extra attribute.** The common Android Studio quick-fix form is `<item name="android:windowLayoutInDisplayCutoutMode" tools:targetApi="o_mr1">always</item>`. I reproduced this: exit 0. `tools:targetApi` only silences lint and does **not** stop the value compiling in for API 28-29.
    - single-quoted attribute values.
    - whitespace around `=`.
  - **Fix:**
    1. Use `/<item\b[^>]*?\bname\s*=\s*["']android:windowLayoutInDisplayCutoutMode["'][^>]*>\s*([^<]+?)\s*<\/item>/g`.
    2. Add fixture tests for the `tools:targetApi` form and the single-quote form, each expecting 1 failure in `values/`.
- **L3. The three `styles.xml` copies can silently drift, and the guard doesn't check that they match.**
  - Since this change, the base `values/styles.xml` applies **only to API 24-27**, so almost every real device resolves `values-v28` or `values-v30` instead. A future edit made only to `values/styles.xml` would have no effect on most phones, with no warning. Examples: a splash background colour, a new `postSplashScreenTheme` or `android:windowBackground`.
  - The `values-v28/styles.xml:9-12` comment says "must be kept in sync", but nothing enforces it.
  - **Fix (either one):**
    - **(a)** In `check-android-styles.test.mjs`, add a real-tree test that parses the three files into `{ styleName: { parent, items } }`. It asserts:
      - the same style names and parents in all three
      - the same items apart from `android:windowLayoutInDisplayCutoutMode`
      - v28 = `shortEdges` and v30 = `always` for every style
    - **(b)** Refactor so the shared items live once in base-only parents (for example `Base.AppTheme…` in `values/`), and the v28/v30 files hold only the one cutout item on the leaf styles.

    (a) is the smaller change. The positive assertion on v28 also covers the silent "`values-v28` deleted, so API 28-29 fall back to the default letterboxed cutout mode" case, which the current guard does not catch.

## Suggested (optional)

- **S1. Make the guard a visible CI step.**
  - It runs today only through `npm run test -- --run` in the `build` job.
  - For clearer failure attribution, consider:
    - an npm script `"check:android-styles": "node scripts/check-android-styles.mjs"`
    - a `- run: npm run check:android-styles` step in `android-build`, after `npx cap sync android` (`deploy-pages.yml:124-126`), next to `check-capacitor-config.mjs`
  - Do this after L1, so the step cannot pass vacuously.
- **S2. The citation in the new XML comments is wrong.**
  - `values/styles.xml:7` and `values-v28/styles.xml:1` say "code-review-round2 (mobile) F1". The source is **validation-report-round2 F1**. `code-review-round2.md` is a different document with its own F1.
  - `check-android-styles.mjs` and the tooling log cite it correctly.
  - Change both comments to `validation-report-round2 F1`.

## INFO

- **I1. The API 28 `dumpsys` label is not evidence of mode 3.**
  - On the API 28 image, `dumpsys window` prints `layoutInDisplayCutoutMode=always` for the app window.
  - Nothing sets the mode at runtime. I searched the app Java, Capacitor core/app/splash-screen sources and GameShell, and found no `layoutInDisplayCutoutMode` setter.
  - The compiled v28 value is 1, and `PhoneWindow.generateLayout` on this image throws on 3 (the F1 trace). The app did not crash, so the effective value is 1 (`shortEdges`).
  - API 28's framework appears to label value 1 with the old pre-release name. Whoever re-runs step 10 should not read that label as a regression.
- **I2. API 29 itself was not launched**; no API 29 image exists. Correctness for 29 rests on:
  - `ALWAYS` being added in API 30
  - core-splashscreen's own v29 override using `shortEdges`
  - the v28 bucket covering 29 by resolution, confirmed in the APK dump

  The Play pre-launch report or the closed test should cover a real API 29 device.
- **I3. Cutout behavior on API 28-29 with WebView ≥ 80 is still unverified** (device-matrix round-2 known gap 3). `shortEdges` lets content extend into short-edge cutouts in both orientations, which on phones matches the full-bleed intent of `always`. GameShell's `max(cutout, gestures)` insets still keep controls clear (M2.3). Still, no pre-API-30 device with WebView ≥ 80 has shown this.
- **I4. Rendering artifacts on the API 28 fallback screen (for step 11 to note):** the screenshot has pure-black rectangles over the `#05050a` background. This looks like WebView 69 / SwiftShader compositing on an unsupported WebView, and the fallback text is fully legible. It is not a defect in this change.
- **I5. A faint outlined box shows just below the Quit button on the API 36 title screen.** It is in my screenshot of this build. I did not check whether it is new, and it is outside this change's scope. It is passed to mobile-ui-ux-designer round 2 to confirm it is intended (for example a secondary link), not overlapping UI.
- **I6. The fold-AVD issue in the junior's tooling-log entry is correctly reported, not fixed.** A landscape window under the 624 dp needed by M2.12 plus M2.13 has no defined behavior in the PRD. This is mobile-product-manager's to decide with the architect, not a code finding.
- **I7. Coding standards, per category:**
  - Style: PASS
  - Error handling: PASS with L1. The swallowed root `ENOENT` is the only deviation.
  - Logging: n/a (CLI output is actionable)
  - Code documentation: PASS; intent and "why" comments are present. S2 is a citation error only.
  - Dead code: none
- **I8. mobile-touch-and-layout:**
  - Edge-to-edge and cutout intent is kept on API 30+ and approximated with `shortEdges` on 28-29.
  - No changes to touch, timing, lifecycle or back handling.
- **I9. Mobile pitfalls:**
  - No per-platform game logic.
  - No edits to generated `android/` assets; `res/` survived `cap sync` unchanged.
  - No frame-count timing was introduced.
