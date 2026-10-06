# Mobile Test Validation Report — Round 3

**Stage:** Mobile Pipeline Step 10 — mobile-lead-tester (independent verification)
**Date:** 2026-09-27
**Verdict:** **PASS**

**One-line reason:** `code-review-round7`'s fix for `validation-report-round2` **F1**
(API 28 crash on launch, `UnsupportedOperationException: Unknown
windowLayoutInDisplayCutoutMode: 3`) is confirmed fixed and reproducibly closed on the
same real API 28 device that found it (`svr_api29_webview`, WebView 69.0.3497.100): two
clean cold launches, `Status: ok`, process alive, **0 `FATAL EXCEPTION`**, and the
M1.4 fallback text renders — the exact behavior that device row exists to verify. No
regression was found on any of `svr_api24_small` (API 24), `svr_api30_mid` (API 30,
WebView 83), `svr_api36_pixel7` (API 36, `-gpu host`), `svr_api36_tablet` (API 36), or
`svr_api36_fold` (API 36, both device states). The full shared/mobile suite, both
Android Gradle builds, both manifest checks, and the mirror parity/build all re-verify
green. Round-2's carry-forward **L3** (Privacy overlay header spacing on WebView 80-83)
is now closed with a clean screenshot. Two pre-existing, non-blocking gaps remain,
carried forward exactly as instructed rather than invented around: the fold AVD's
window-resize fidelity limit (product-manager/architect decision pending) and the
pre-API-30-with-WebView-≥80 scenario (blocked on the owner's Play Store sign-in, to be
covered by the Play pre-launch report and closed test).

---

## Scope and inputs read

- `docs/mobile/PRD-mobile.md` v1.4 (all sections, M1-M12, §0 parity rules, §3 platform
  mapping, §7 gate rules)
- `docs/mobile/tests/manual-only-criteria.md` (unchanged since round 1; re-checked, still
  accurate — no new manual-only criteria introduced by this round's fix)
- `docs/mobile/reviews/code-review-round7.md` (**PASS** — closes `validation-report-round2`
  F1; routes MEDIUM **M1** [architecture-doc amendment process] to
  mobile-solution-architect, not this step; carries LOW L1/L2/L3 and INFO I1-I9 forward)
- `docs/mobile/tooling-requests.md` (unchanged this round — all six AVDs from the prior
  request already exist: `svr_api24_small`, `svr_api29_webview`, `svr_api30_mid`,
  `svr_api36_fold`, `svr_api36_pixel7`, `svr_api36_tablet`)
- `docs/mobile/tests/validation-report.md` / `validation-report-round2.md` and
  `raw-output-round1.log` / `raw-output-round2.log` (prior rounds' own output, re-verified
  rather than re-derived from scratch per the task's routing — only F1 re-verification
  plus a spot-check of the rows F1 could plausibly regress)
- `docs/mobile/tests/device-matrix.md` (round 1 and round 2 content; extended with a new
  dated round-3 section below rather than overwritten)
- `docs/mobile/tooling-setup-log.md`'s 2026-09-27 step-7 entry (the junior developer's own
  fix description, root-cause analysis, and self-reported verification — read for context,
  not accepted as a substitute for this step's independent re-verification)
- Test files: `scripts/check-android-styles.mjs` and
  `scripts/check-android-styles.test.mjs` (new since round 2; reviewed for test quality —
  see Part 1)
- `android/app/src/main/res/values/styles.xml`, `values-v28/styles.xml`,
  `values-v30/styles.xml` (read to confirm the fix's shape); compiled APK via
  `aapt2 dump resources` (read to independently confirm the compiled values, not just the
  source XML)

---

## Part 1 — Test quality review (test-strategy)

The only test files that changed since round 2 are `scripts/check-android-styles.mjs`
(implementation) and `scripts/check-android-styles.test.mjs` (12 fixture tests + 2
assertions against the real `android/` tree), added as part of the step-7 F1 fix.
Re-derived independently (not accepted on the implementer's or `code-review-round7`'s
say-so):

- **Not tautological.** `findUnsafeCutoutModeAlways()` asserts an observable output (an
  array of human-readable failure strings) against constructed fixture input, not an
  internal implementation detail. I hand-verified the core claim by re-reading
  `check-android-styles.mjs:23` (`CUTOUT_ITEM_RE`) against the fixture inputs in
  `check-android-styles.test.mjs:26-40`: the regex only matches the exact unqualified
  `<item name="android:windowLayoutInDisplayCutoutMode">` form, and the fixtures both
  positive- and negative-test around that exact boundary (unqualified `values/` flags,
  `values-v30/` with `always` does not flag, `values-land`/`values-v28-land` are correctly
  ignored by `extractValuesVersion`).
- **Fails when the acceptance criterion is violated.** I did not just trust
  `code-review-round7`'s own negative-control claim; I independently re-ran the real-tree
  regression test against a manually reverted copy of `values/styles.xml` (re-adding the
  unqualified `<item name="android:windowLayoutInDisplayCutoutMode">always</item>` the
  step-7 fix removed) in a scratch copy outside the tracked tree, and confirmed
  `findUnsafeCutoutModeAlways()` reports it — this is the same test `code-review-round7`'s
  own guard-negative-control row exercised, re-confirmed here rather than re-typed from
  their report.
- **Discriminating real-tree assertions, not vacuous ones.** The two real-tree tests
  (`check-android-styles.test.mjs:98-129`) read the actual `android/app/src/main/res/`
  folders and assert (a) no unqualified-or-<v30 folder sets `always`, and (b)
  `values-v30/styles.xml` positively does still set `always` — this second assertion is
  the one that would catch a regression where `values-v30/` is accidentally deleted
  (leaving API 30+ silently falling back to the platform default), which a purely
  negative check would miss. I confirmed this by temporarily renaming
  `values-v30/styles.xml` in a scratch copy: the "exists and does use always" assertion
  failed as expected.
- **Test names describe behavior, not `test1`/`test2`.** Confirmed by inspection — every
  `it(...)` string states the specific input shape and expected outcome (e.g. "flags a
  values-v28 (or any < v30) folder that sets 'always'").
- **Maps to a stated acceptance criterion.** `docs/mobile/PRD-mobile.md` M1.4 (WebView
  fallback must render, not crash) and the "no crash on launch" baseline implied across
  M1-M2, per `validation-report-round2.md`'s own mapping — unchanged and still accurate.

No test files elsewhere in the repo changed since round 2 (`git status` shows only
documentation-file and `scripts/check-android-styles.*` changes plus the untracked
round-3 screenshots this step itself produced). Round 1's test-quality verdict (**PASS**,
no tautological or trivial tests in the step-9 additions) stands unchanged for everything
else. **Part 1 verdict: PASS — the new tests are discriminating, not tautological.**

---

## Part 2 — Full suite run (verbatim in `docs/mobile/tests/raw-output-round3.log`)

| Check | Result |
|---|---|
| `npm run check:secrets` (real tracked tree) | PASS — "no tracked secret-shaped content found" |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| `npm run test` (vitest) | **PASS — 29 files, 432 tests** (matches `code-review-round7`'s own count; includes the 12 new `check-android-styles` tests) |
| `npm run build` (website) | PASS |
| `npm run build:android` | PASS |
| `npx playwright test -c playwright.mobile.config.ts` (mobile e2e, no `--repeat-each`) | **PASS — 64/64**, 1.5 min. Ports 4173/4174/4181/4182 confirmed with no LISTENers afterward (only benign `TIME_WAIT` connection remnants) |
| Mirror stale-process check (`C:\Users\aaron\dev-build\shield-vs-robots`) | None found |
| Mirror `Remove-Item` clears (`android/build`, `android/app/build`, `android/capacitor-cordova-android-plugins/build`) | Completed, no errors (all silently no-op — nothing stale existed this round) |
| Mirror refresh (robocopy `/MIR`, documented exclusions) | Ran; exit code not captured verbatim due to a background/console redirection quirk in this sandboxed session — **compensated with the stronger check below** |
| Mirror parity (`diff -rq` on `src`, `tests`, `scripts`, `public`, `android/app/src`, `package.json`, `package-lock.json`, `capacitor.config.ts`, `vite.config.ts`, `playwright.mobile.config.ts`, `android/app/build.gradle`) | **Identical, 0 differences**, confirming the refresh landed correctly regardless of the uncaptured exit code |
| Mirror hygiene (`*.csv`/`.env*`/`*.tfstate*`/`terraform.tfvars`/`*.jks`/`*.keystore`/`signing.properties` outside `node_modules`) | None found |
| Mirror `npm ci` | PASS (335 packages, matches round 2) |
| Mirror `npm run build:android && npx cap sync android && node scripts/check-capacitor-config.mjs` | PASS — 2 plugins (`@capacitor/app@8.1.1`, `@capacitor/splash-screen@8.0.2`) |
| Mirror `node scripts/check-android-styles.mjs` | PASS — "no unqualified windowLayoutInDisplayCutoutMode=\"always\" found" |
| Mirror `res/` after `cap sync`, compared with the repo source | Identical |
| Mirror `gradlew assembleDebug --no-daemon` (JDK 21.0.12) | **BUILD SUCCESSFUL**, 153 tasks (matches round 2's task count) |
| Mirror `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true --no-daemon` | **BUILD SUCCESSFUL**, 203 tasks (matches round 2) |
| Mirror `gradlew bundleRelease --no-daemon` (`CI` unset, no `signing.properties`) | **Refused as designed**, exit 1, "Refusing to build." No `.aab` anywhere under `android/` |
| `AAPT2_PATH=…\build-tools\36.0.0\aapt2.exe` `check-android-manifest.mjs --variant debug` (real debug APK) | PASSED, exit 0 |
| Same, `--variant release` (real `app-release-unsigned.apk`) | PASSED, exit 0 |
| Negative control: `--variant release` on the debug APK | **FAILED as expected** (`R2: android:debuggable="true"`), exit 1 |
| `aapt2 dump resources app-debug.apk`, every `0x01010586` (`windowLayoutInDisplayCutoutMode`) entry | App styles: **v28=1** (`shortEdges`), **v30=3** (`always`), **no `=3` anywhere below v30** — independently re-confirmed, not taken from `code-review-round7`'s table |
| Session hygiene (leftover node/java/emulator/qemu/gradle processes; ports 4173/4174/4181/4182) | None found after the full suite run |

Website suite (unit tests, typecheck, lint, build) is fully green — **no regression
there**, so this round is not a website FAIL either.

---

## Part 3 — F1 re-verification (the primary purpose of this round)

### F1 disposition: **CLOSED, reproducibly, on the same device that found it**

- **Device:** `svr_api29_webview` (a real API 28 `google_apis` x86_64 image, WebView
  **69.0.3497.100** — confirmed via `dumpsys package com.google.android.webview` before
  testing, matching round 2's exact device).
- **Procedure (identical to round 2's F1 discovery, for a fair comparison):**
  `am force-stop` + `logcat -c` + `am start -W`, run twice from a clean state.
- **Result, both times:**
  ```
  Status: ok
  Activity: io.github.hogy86.shieldvsrobots/.MainActivity
  Complete
  ```
  `adb shell pidof` showed the process alive after each launch (pids 3928 and 4354).
  `adb logcat -d | grep -c "FATAL EXCEPTION"` returned **0** both times (previously: a
  crash, every time, both round-2 attempts).
- **The exact behavior this device row exists to verify now renders:** a screenshot
  (`docs/mobile/tests/screenshots/api28_webview69_round3_fixed.png`) shows M1.4's fallback
  text, "Please update Android System WebView from the Play Store." — unreachable before
  this fix because the crash happened in `PhoneWindow.generateLayout` before
  Capacitor/WebView ever initialized.
- **Root-cause fix, independently re-confirmed in the compiled APK** (not just the source
  XML, and not taken from the junior developer's or `code-review-round7`'s own
  self-report): `aapt2 dump resources app-debug.apk` shows, for every one of the three
  app styles (`AppTheme`, `AppTheme.NoActionBar`, `AppTheme.NoActionBarLaunch`):
  - `(v28)` resolved value of `0x01010586` (`windowLayoutInDisplayCutoutMode`) = **1**
    (`shortEdges`)
  - `(v30)` resolved value = **3** (`always`)
  - **No `=3` anywhere below v30**, anywhere in the dump (including the
    `androidx.core:core-splashscreen` library's own theme resources, which independently
    corroborate the same API-28/29-vs-30 boundary).
- **`code-review-round7`'s I1 re-confirmed, not a regression:** `adb shell dumpsys window`
  on this same API 28 device still labels the window's `layoutInDisplayCutoutMode` as
  `always` in its own output. This is **not** evidence of a live regression — I
  independently checked (same conclusion `code-review-round7` reached): nothing in the
  app's Java/Kotlin, Capacitor core/app/splash-screen sources, or GameShell sets this
  attribute at runtime; the compiled resource value is 1, and this API 28 image's
  `PhoneWindow` throws outright on value 3 (that is F1's own root cause) — so the app
  could not be running at all if the effective value were actually 3. The `dumpsys` label
  is API 28's own display quirk for this attribute, unrelated to the fix. **Whoever reads
  this device row next should not read that label as a reopening of F1.**
- **`code-review-round7`'s I4 re-confirmed, not a new defect:** the fallback screenshot
  shows the same pure-black rectangles over the `#05050a` background reported in round 2
  — a WebView 69/SwiftShader compositing artifact on this specific old-WebView
  combination, not caused by this change. The fallback text itself is fully legible.

### Regression spot-check across every other AVD (per the task's own routing: "a
spot-check that the fix doesn't regress the already-passing rows")

| Device | API / WebView | Result |
|---|---|---|
| `svr_api24_small` | API 24, real WebView 53.0.2785.124 | Cold launch, process alive, **0 FATAL EXCEPTION** — unchanged from rounds 1/2 (this API predates the attribute entirely, so it was never affected either way; screenshot: `api24_small_round3_regression_check.png`) |
| `svr_api30_mid` | API 30, real WebView 83.0.4103.106 | Cold launch, process alive, **0 FATAL EXCEPTION**, full functional pass (see Part 4) — confirms `always` still applies correctly via `values-v30/` with no letterboxing regression |
| `svr_api36_pixel7` | API 36, `-gpu host` | Full functional pass (see Part 4), **0 FATAL EXCEPTION** for the entire session |
| `svr_api36_tablet` | API 36 | Full functional pass (see Part 4), **0 FATAL EXCEPTION** |
| `svr_api36_fold` | API 36, both `OPENED`/`CLOSED` device states | No crash in either state, **0 FATAL EXCEPTION** (see Part 4 for the known AVD-fidelity gap, unchanged from round 2) |

**No new failures were found this round.**

---

## Part 4 — Device matrix (Android emulator) — full detail in `device-matrix.md`

Summary (full per-device tables in the new "Round 3" section of
`docs/mobile/tests/device-matrix.md`):

- **`svr_api29_webview` (API 28, WebView 69):** F1 closed — see Part 3.
- **`svr_api24_small` (API 24, WebView 53):** no regression — see Part 3.
- **`svr_api36_pixel7` (API 36, `-gpu host`):** full functional pass — cold start, Help
  overlay, Settings (Swap controls/Privacy policy), Start → gameplay (HUD/controls
  unclipped), THROW (spawns a shield, score updates), PAUSE, Home-during-PAUSED →
  relaunch (still PAUSED, state preserved), back-mapping (PAUSED→Resume,
  PLAYING→pause, Restart-Game-confirm→Cancel with no reset), 180° landscape flip (clean
  re-render, no reflow glitch), Quit (returns to launcher), relaunch after Quit (fresh
  title, Best score persisted at 100). **0 FATAL EXCEPTION** for the whole session. Also
  re-confirms `code-review-round7`'s **I5** (a faint outlined box below the Quit button on
  the API 36 title screen) reproduces identically this round — flagged again below for
  mobile-ui-ux-designer round 2, per the task's instruction.
- **`svr_api30_mid` (API 30, WebView 83, the L3-flagged range):** full functional pass,
  cold start, Settings, and — closing round-2's open carry-forward — a clean, unambiguous
  screenshot of the **Privacy policy overlay's header** shows clear spacing between the
  "Privacy policy" title and the Close button. **L3 is now closed**: the flex-gap
  regression `code-review-round4` predicted does not reproduce anywhere on this real
  WebView-83 device, including the one sub-case round 2 could not get a clean screenshot
  of.
- **`svr_api36_tablet` (API 36, Pixel Tablet profile):** full functional pass — cold start
  (centered at its own aspect, not stretched), first-launch Help overlay, gameplay
  HUD/controls unclipped, Home-during-PLAYING → relaunch (paused, score 100 preserved),
  back-mapping (PAUSED→Resume, PLAYING→pause). **0 FATAL EXCEPTION**. No I5 box observed
  on this form factor (consistent with round 2, where it was also API-36-phone-specific).
- **`svr_api36_fold` (API 36, resizable/foldable device-state profile):** boots and runs
  without crashing in both `OPENED` and `CLOSED` states; window frame identical in both
  (`Rect(0, 765 - 1080, 1575)`, a 412×309 dp landscape box letterboxed into the physical
  display) — **exactly reproduces round 2's finding**, confirming this is a stable AVD
  fidelity limit, not a regression or a flaky result. Recorded again as a known gap, not a
  finding against this fix.

---

## Carry-forwards picked up this round

- **`validation-report-round2` F1:** **CLOSED**, see Part 3.
- **`code-review-round7` L3 (`check-android-styles.mjs`'s three `styles.xml` copies can
  silently drift with no cross-file check):** not in this step's scope to fix (I do not
  modify code); confirmed still open by inspection, and still correctly described as LOW
  by the reviewer — not a live defect today.
- **`code-review-round7` I1 (API 28 `dumpsys` mislabels the mode as "always"):**
  re-confirmed as a non-issue, not a regression — see Part 3.
- **`code-review-round7` I5 (faint box below Quit on the API 36 title screen):**
  re-confirmed reproducing this round on `svr_api36_pixel7`; screenshot
  `api36_pixel7_round3_title.png` (and again after relaunch,
  `api36_pixel7_round3_after_relaunch.png`) — **passed to mobile-ui-ux-designer round 2**
  to judge whether it is intended (e.g. a secondary link) or overlapping UI, per the
  reviewer's original routing.
- **round-1/round-2 carry-forward, Privacy overlay header spacing on WebView 80-83 (L3):**
  **CLOSED this round** — see Part 4, `svr_api30_mid`.
- **round-2 known gap, fold-AVD window-resize fidelity:** unchanged, reproduced
  identically — see Part 4, `svr_api36_fold`. This is a tooling/AVD limitation, not
  something a code change in this repo can fix; the task's own instructions list this as
  a known gap the product manager is deciding, not a blocker for this gate.
- **round-2 known gap, pre-API-30-with-WebView-≥80:** unchanged — `svr_api29_webview`'s
  real WebView (69) is still below the app's own `minWebViewVersion` (80), so even with
  F1 fixed, this AVD can only ever confirm the M1.4 fallback path, not the "insets on
  pre-API-30 with a modern WebView" scenario. Per the task's own instructions, this
  remains blocked on the owner's Google/Play Store sign-in and is covered instead by the
  Play pre-launch report and the closed test — **not a blocker for this gate.**
- **round-1/round-2 known gap, 3-button navigation / real edge-swipe drill:** still not
  independently drilled this round, per the task's own instructions ("if you can't drill
  them" — I could not, for the same reasons rounds 1-2 recorded: `adb shell input keyevent
  KEYCODE_BACK` exercises the same back-handling logic regardless of navigation mode, but
  a literal screen-edge swipe gesture was not attempted). Recommend UAT (step 14) drill
  this with `adb shell input swipe` from the literal edge pixel in gesture mode, and a
  `navigation_mode 0` pass for 3-button, exactly as rounds 1-2 recommended.

---

## Verdict

**PASS.**

- **Tests:** the new `check-android-styles` tests are discriminating, not tautological
  (Part 1). No test file elsewhere regressed.
- **F1 is closed**, reproducibly, on the same real device and WebView version that found
  it, with no regression on any other device in the matrix (Part 3).
- **The full shared/mobile suite passes**, both Android Gradle builds succeed, both
  manifest checks pass (including the negative control), the signing-refusal contract
  still holds, and the mirror is byte-identical to source (Part 2).
- **The device matrix passes** for every row this round touched, including the two newly
  closed items (L3 privacy-header spacing, and F1 itself) (Part 4).
- **The website suite is unaffected** — this round is not a website FAIL either.
- Two pre-existing gaps remain open, both correctly out of this gate's scope per the
  task's own framing: the fold-AVD window-resize fidelity limit (a product/architecture
  decision, not a code defect) and the pre-API-30-with-WebView-≥80 scenario (blocked on
  the owner's Play Store account, covered by the Play pre-launch report and closed test).

**mobile-ui-ux-designer's round 2 may now proceed**, with `code-review-round7`'s I5
(faint box below Quit on the API 36 title screen) and the round-2 M2.7/M2.6 legibility
screenshots as its inputs alongside this round's fresh screenshots.
