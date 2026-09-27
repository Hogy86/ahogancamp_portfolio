# Mobile Test Validation Report — Round 2

**Stage:** Mobile Pipeline Step 10 — mobile-lead-tester (independent verification)
**Date:** 2026-09-27
**Verdict:** **FAIL**

**One-line reason:** Round 1's blocking finding (F1, `check:secrets`) is confirmed fixed
and re-verified clean on the real tracked tree, the mirror, both Gradle builds, and both
manifest checks — no re-open there. But this round's required device-matrix extension
(three new AVDs requested in `docs/mobile/tooling-requests.md` and installed by
mobile-it-analyst) surfaced a new, real, reproducible **crash on launch** on a real API 28
device with WebView 69 (`svr_api29_webview`): `UnsupportedOperationException: Unknown
windowLayoutInDisplayCutoutMode: 3`, thrown from native Android theme/window setup before
Capacitor/WebView ever initializes. This is a genuine app regression (API 28 is within the
app's own declared `minSdkVersion=24` support range), not a tooling artifact, and it means
M1.4's "please update WebView" fallback — the exact behavior this device row exists to
check — can never be reached on this real device. See **F1 (round 2)** below. Everything
else this round — the full shared/mobile suite, both Android Gradle builds, the manifest
checks, the tablet AVD's full functional pass, and the carry-forward closures — is green.

---

## Scope and inputs read

- `docs/mobile/PRD-mobile.md` v1.4 (all sections, M1-M12, §0 parity rules, §3 platform
  mapping, §7 gate rules)
- `docs/mobile/tests/manual-only-criteria.md` (unchanged since round 1; re-checked, still
  accurate)
- `docs/mobile/reviews/code-review-round6.md` (PASS — closes round-1 F1, plus L1/L2/L3/S1/I1
  carry-forwards; routes I2 to this step)
- `docs/mobile/tooling-requests.md` (the three-AVD request and mobile-it-analyst's
  COMPLETED entry: `svr_api36_tablet`, `svr_api36_fold`, `svr_api29_webview` — the last
  built from an API 28 `google_apis` image with real WebView 69, not the ≥80 image the
  request asked for; recorded as a still-open gap by it-analyst, carried forward here)
- `docs/mobile/tests/validation-report.md` and `raw-output-round1.log` (round 1, this
  step's own prior output — re-verified rather than re-derived from scratch, per
  code-review-round6's routing: "only `check:secrets` and the two Gradle builds need
  re-verification" for the F1 fix, plus this round's own new device-matrix scope)
- `docs/mobile/tests/device-matrix.md` (round 1's content, extended with a new dated
  round-2 section rather than overwritten)
- Test files unchanged since round 1 (`git status` shows a clean tree at `b3d53a7`; no
  test-writer changes to re-review this round)
- `android/app/src/main/res/values/styles.xml`, `android/variables.gradle`,
  `android/app/build/intermediates/.../merged.dir/values-v{27,29,30}/*.xml` (read while
  diagnosing F1 below)

---

## Part 1 — Test quality review (test-strategy)

No test files changed since round 1 (`git status` on `b3d53a7` is clean; code-review-round6
reviewed only `scripts/check-no-secrets.test.mjs`'s new S4 regression test, which is already
committed and unchanged). Round 1's test-quality verdict (**PASS**, no tautological or
trivial tests in the step-9 additions) stands unchanged. This round's own deliverable is
verification only — the device-matrix extension and re-verification of F1 — so no new
test-quality re-derivation was needed.

---

## Part 2 — Full suite run (verbatim in `docs/mobile/tests/raw-output-round2.log`)

| Check | Result |
|---|---|
| `npm run check:secrets` (real tracked tree) | **PASS** — `check-no-secrets: no tracked secret-shaped content found.` (F1 confirmed fixed) |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` (repo, vitest) | **PASS — 28 files, 420 tests** |
| `npm run build` (website) | PASS |
| `npm run build:android` (repo) | PASS |
| `npx playwright test -c playwright.mobile.config.ts` (mobile e2e, 4 viewports × touch emulation) | **PASS — 64/64** |
| Mirror refresh (`C:\Users\aaron\dev-build\shield-vs-robots`, robocopy per the documented procedure) | Exit 3 (files copied, extras removed, 0 failed/mismatched) |
| Mirror hygiene (`*.csv`/`.env*`/`*.tfstate*`/`.jks`/`.keystore`/`signing.properties` outside `node_modules`) | None found |
| Mirror parity (`diff -rq` on `src`, `android/app/build.gradle`) | Identical to source tree |
| Mirror `npm ci` | PASS (335 packages) |
| Mirror `npm run build:android && npx cap sync android && check-capacitor-config` | PASS |
| Mirror `gradlew assembleDebug --no-daemon` | **BUILD SUCCESSFUL** (153 tasks) |
| Mirror `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true --no-daemon` | **BUILD SUCCESSFUL** (203 tasks) |
| Mirror `gradlew bundleRelease --no-daemon` (no signing.properties) | **Refused as designed** (exit 1, "Refusing to build."), no `.aab` produced |
| `check-android-manifest.mjs --variant debug` (real APK, `AAPT2_PATH` set) | PASS |
| `check-android-manifest.mjs --variant release` (real APK) | PASS |
| Negative control: `--variant release` on the debug APK | **FAILED as expected** (`R2: android:debuggable="true" on a release build`) |
| Session hygiene (leftover node/java/emulator processes, ports 4173/4174/4181/4182) | None found after the suite run |

Website suite (unit tests, typecheck, lint, build) is fully green — no regression there.
`check:secrets` is confirmed fixed on the real tree, resolving round 1's F1.

---

## Failures — full diagnostic detail

### F1 (BLOCKING, round 2). App crashes on launch on a real API 28 device (`svr_api29_webview`, real WebView 69.0.3497.100)

- **Command:** `adb shell am start -n io.github.hogy86.shieldvsrobots/.MainActivity`, run
  twice from a clean state (`am force-stop` + `logcat -c` between attempts) to confirm
  reproducibility.
- **Result both times:** the activity crashes immediately; the process is not left
  running; the foreground task returns to the OS launcher home screen (screenshots:
  `docs/mobile/tests/screenshots/api28_webview69_crash_launch1.png` and `_launch2.png`).
- **Exact exception (identical both runs), from `adb logcat -d`:**
  ```
  FATAL EXCEPTION: main
  Process: io.github.hogy86.shieldvsrobots, PID: 3662 (first run) / 5178 (second run)
  java.lang.RuntimeException: Unable to start activity
    ComponentInfo{io.github.hogy86.shieldvsrobots/io.github.hogy86.shieldvsrobots.MainActivity}:
    java.lang.UnsupportedOperationException: Unknown windowLayoutInDisplayCutoutMode: 3
      at android.app.ActivityThread.performLaunchActivity(ActivityThread.java:2913)
      at android.app.ActivityThread.handleLaunchActivity(ActivityThread.java:3048)
      ... (full trace in raw-output-round2.log)
  Caused by: java.lang.UnsupportedOperationException: Unknown windowLayoutInDisplayCutoutMode: 3
      at com.android.internal.policy.PhoneWindow.generateLayout(PhoneWindow.java:2472)
      at com.android.internal.policy.PhoneWindow.installDecor(PhoneWindow.java:2672)
      at com.android.internal.policy.PhoneWindow.setContentView(PhoneWindow.java:441)
      at com.android.internal.policy.PhoneWindow.setContentView(PhoneWindow.java:432)
      at androidx.appcompat.app.AppCompatDelegateImpl.createSubDecor(AppCompatDelegateImpl.java:1060)
      at androidx.appcompat.app.AppCompatDelegateImpl.ensureSubDecor(AppCompatDelegateImpl.java:865)
      at androidx.appcompat.app.AppCompatDelegateImpl.setContentView(AppCompatDelegateImpl.java:748)
      at androidx.appcompat.app.AppCompatActivity.setContentView(AppCompatActivity.java:193)
      at com.getcapacitor.BridgeActivity.onCreate(BridgeActivity.java:30)
      at io.github.hogy86.shieldvsrobots.MainActivity.onCreate(MainActivity.java:23)
      ... 14 more
  ```
- **File:line:** `android/app/src/main/res/values/styles.xml:13`, `:20`, and `:31` —
  three unqualified `<item name="android:windowLayoutInDisplayCutoutMode">always</item>`
  entries, one each in `AppTheme`, `AppTheme.NoActionBar`, and
  `AppTheme.NoActionBarLaunch`. Confirmed by `grep -n "windowLayoutInDisplayCutoutMode"
  android/app/src/main/res/values/styles.xml`.
- **Root cause:** `LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS` (constant value `3`) is
  documented as added in API 28, and the file's own comment at `styles.xml:11-12` says
  "on API 28-34 the default cutout mode letterboxes the WebView away from the camera
  cutout" — i.e. the developer's intent was for `always` to apply safely from API 28
  upward. On this real `google_apis` API 28 x86_64 system image (installed by
  mobile-it-analyst per the round-1 tooling request), the framework's `PhoneWindow`
  does **not** recognize value `3` and throws instead of silently falling back, crashing
  the activity on its very first `setContentView` call — before Capacitor's bridge or the
  WebView initialize at all. Corroborating evidence: the **androidx.core:core-splashscreen**
  library ships its own version-qualified overrides for the exact same attribute
  (`android/app/build/intermediates/.../merged.dir/values-v27/values-v27.xml` and
  `values-v29/values-v29.xml` both set `shortEdges` instead of `always` for API 27-29,
  only using `always` in `values-v30/values-v30.xml`) — i.e. the library authors already
  knew this attribute value needed API gating below API 30 and shipped their own
  per-version resource folders to do it. Our own three styles never got the same
  treatment: `android/app/src/main/res/` has only a single unqualified `values/styles.xml`,
  no `values-v27`, `values-v29`, or `values-v30` siblings, so the literal string `always`
  is compiled in for every API level unconditionally, overriding whatever the library's
  own (correctly API-gated) parent theme would have supplied.
- **Why it wasn't caught before this round:** the only pre-round-2 AVDs were
  `svr_api36_pixel7` (API 36), `svr_api30_mid` (API 30), and `svr_api24_small` (API 24,
  WebView 53 — below `minWebViewVersion`, so it only ever exercises the WebView-fallback
  path, which never reaches this theme's `setContentView` line either, since... actually
  it does reach `setContentView` the same way, but API 24 predates the
  `windowLayoutInDisplayCutoutMode` attribute's existence entirely, so unrecognized-attribute
  handling on API 24 is a silent no-op rather than a thrown exception. Only a real API 28
  or 29 device exercises the code path where the attribute is known to exist but the
  specific enum value is rejected. That device didn't exist until this round's
  `svr_api29_webview` AVD.
- **Confirmed in scope, not an edge case:** `android/variables.gradle` sets
  `minSdkVersion = 24`, `compileSdkVersion = 36`, `targetSdkVersion = 36` — API 28 is
  squarely inside the app's own declared supported OS range. This is not a
  below-minimum-support device the way `svr_api24_small`'s WebView is; the OS version
  itself is fully in scope, only the specific system image's exact framework behavior
  around this one attribute is the trigger.
- **Impact:** total, unconditional crash-on-launch — 0% of the app is reachable on any
  real device whose framework behaves this way at this API level, which per the tooling
  log is apparently a real, currently-shipping `google_apis` system image characteristic,
  not a synthetic emulator-only quirk. Because the crash happens before Capacitor/WebView
  init, **M1.4's own fallback UI (the thing this device row exists to test) can never be
  reached or verified on this device** — the fallback logic is unreachable code on this
  configuration today.
- **Suggested fix (for mobile-junior-developer, not applied by me — I do not modify
  code):** add version-qualified resource overrides for the three styles, mirroring what
  `core-splashscreen` already does for its own theme — e.g. a
  `android/app/src/main/res/values-v28/styles.xml` (or `values-v27`/`values-v29`, matched
  to whichever API range is verified safe) that sets `shortEdges` instead of `always` for
  the affected range, keeping `always` only in the default `values/styles.xml` for API 30+
  where it's confirmed safe (as `svr_api30_mid`'s round-1 pass already showed no problem).
  Alternatively, guard the value at runtime in `MainActivity.onCreate` with a
  `Build.VERSION.SDK_INT` check before `super.onCreate()`/`setContentView` if a resource-only
  fix proves awkward with the existing splash-screen theme chain. Either fix should be
  covered by a new regression check — ideally an actual instrumented-launch smoke test on
  an API 28/29 image in CI, since this class of bug is invisible to unit tests, Playwright
  (which never touches the native Android theme/window layer), and to manifest-only static
  checks; short of that, a comment/test asserting every `values*/styles.xml` variant that
  sets this attribute is version-qualified would at least catch a regression to this same
  unconditional pattern.
- **Acceptance criterion this maps to:** `docs/mobile/PRD-mobile.md` M1.4 (the WebView
  update-fallback message must render, not crash, on an old/incompatible WebView) and the
  general "no crash" baseline implied throughout M1-M2 (a crash on launch fails every
  acceptance criterion on the affected device, not just M1.4 specifically) — plus
  `mobile-architecture.md`'s cutout-handling intent documented in the very comment this
  bug sits next to (`styles.xml:11-12`, "M1/§6.6").

**No other failures were found this round.** Every other command in Part 2's table passed
with the exact evidence in `raw-output-round2.log`.

---

## Part 3 — Device matrix extension (Android emulator)

Full detail is in the new "Round 2" section of `docs/mobile/tests/device-matrix.md`.
Summary:

- **svr_api36_tablet** (API 36, real WebView 133, Pixel Tablet profile, `-gpu host`): full
  functional pass — cold start, Help overlay, gameplay HUD/controls (nothing clipped,
  generous unused side margins rather than stretched content), background/resume
  (M4.1-M4.3, score preserved), back-mapping (PAUSED→resume, PLAYING→pause). No crash, no
  `net::ERR_*`. This closes the **tablet row** of the required device matrix and closes
  carry-forward **L4** (Help/Settings/Pause screenshots on API 36) for the tablet form
  factor.
- **svr_api36_fold** (API 36, resizable/foldable device-state profile): boots and runs
  without crashing in both the `OPENED` and `CLOSED` device states, but the AVD's window
  frame is **identical in both states** (`Rect(0, 765 - 1080, 1575)`, i.e. a 412×309 dp
  landscape-shaped window letterboxed into the middle of a 1080×2340 portrait physical
  display) — this AVD does not actually change the app's window bounds when its posture
  changes, so **M2.9's "fold/unfold pauses, re-lays-out ≤1s, loses no state" cannot be
  meaningfully exercised on this AVD**: there is nothing for the app to re-layout in
  response to, because the window never resizes. Separately, and regardless of fold state,
  the 412×309 dp effective viewport this AVD gives the app is **below the app's own
  documented minimum reference profile (640×360 dp)** — the DOM (confirmed via the WebView
  devtools socket) contains the expected title-screen markup, but only a small icon is
  visible on the actual composited screen; the rest of the title/menu content is not
  confirmed legible at this sub-minimum viewport. Both of these are recorded as **known
  gaps** below, not blocking findings — they reflect a genuine tooling/fidelity limit of
  this specific "resizable" AVD profile rather than a demonstrated app bug (a real
  Z Fold-class device does give the unfolded app a full-size landscape window, unlike this
  AVD).
- **svr_api29_webview** (API 28, real WebView 69.0.3497.100): **crashes on every launch**
  before reaching the WebView at all — see **F1** above. The row cannot be completed as a
  result; M1.4 could not be verified on this device.
- Previously-completed round-1 rows (small/low-end phone, tall phone, both landscape
  orientations, gesture navigation, background/resume, back, nothing-clipped on the two
  working profiles) are unchanged and still stand; see `device-matrix.md`'s original
  section for that detail. 3-button navigation mode was still not independently drilled
  this round (unchanged gap from round 1).

See `docs/mobile/tests/device-matrix.md`'s "Round 2 — 2026-09-27" section for the full
per-device tables, and its "Known gaps (round 2)" for the fold-AVD and sub-minimum-viewport
notes.

---

## Carry-forwards picked up this round

- **code-review-round6 I2** ("the F1 diagnosis in round 1's validation-report.md quotes
  the wrong line 95 first, then corrects itself inline — drop the stale snippet"): this
  round's report does not reproduce that error; F1 (round 1) is summarized cleanly above
  without the stale snippet, per the reviewer's suggestion. (This round's own F1 is an
  unrelated, new finding — see above.)
- **flex-gap on WebView 83 (Privacy header), round-1 device-matrix "Known gaps" #3:** not
  re-attempted this round. `svr_api30_mid` was not re-booted (round 1's device-matrix
  content for it is unchanged and still stands; code-review-round6 did not ask for a
  re-check of this specific sub-item, and this round's device time went to the three new
  AVDs plus F1 diagnosis). **Still open** — recommend a scripted re-check (e.g. via
  `controls-behavior.spec.ts`'s Privacy-overlay Playwright coverage, which already passed
  64/64 this round at the WebView-83-adjacent viewport sizes in the Playwright matrix) or
  a careful manual pass with `uiautomator dump` for exact tap coordinates, same
  recommendation as round 1.
- **Help/Settings/Pause screenshots on API 36:** closed for the **tablet** form factor
  this round (see Part 3). `svr_api36_pixel7`'s own Help/Settings/Pause screenshots were
  already closed in round 1 and are unchanged.

---

## Verdict

**FAIL.** F1 (round 2) is a new, real, reproducible, in-scope crash-on-launch finding
discovered only because this round's new `svr_api29_webview` AVD exists — exactly the
kind of device the round-1 tooling request was filed to cover. It must route back to
mobile-junior-developer (step 7) with this report and `raw-output-round2.log`;
mobile-lead-developer (step 8) should re-gate before this step re-runs a round 3. Every
other check this round — the full shared/mobile suite, both Android Gradle builds, both
manifest checks, the signing-refusal contract, round 1's F1 fix, and the tablet AVD's full
functional pass — is genuinely green and does not need to be re-run once F1 (round 2) is
fixed; only a fresh `am start` on `svr_api29_webview` (or an equivalent real API 28/29
device) needs re-verification, plus a spot-check that the fix doesn't regress the
already-passing `svr_api30_mid`/`svr_api36_pixel7`/`svr_api36_tablet` rows.

mobile-ui-ux-designer's round 2 should **not** start until this is re-run to PASS.
