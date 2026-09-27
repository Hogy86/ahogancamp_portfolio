# ADR M-0007: Android targets, manifest hardening, and the plugin allowlist

## Status: Proposed. The applicationId is a placeholder until OQ-M11 is confirmed.

## Context
- M1.1 / OQ-M6 (a): minimum = the Capacitor default (API 24). M1.2: target = Play's
  requirement at submission (API 36 since 31 Aug 2026). M1.4: old-WebView message.
- M2.1a: landscape from process start. M2.10: Android 16 large-screen overrides (declare
  the game category). M5.3: predictive back.
- M11.1 offline, M11.2 no permissions (remove INTERNET if possible), M11.3/M11.5 no data or
  SDKs. M9 icon/splash. OQ-M11 app ID is permanent after the first upload.

## Decision
- **SDK levels:** `minSdkVersion 24`, `compileSdkVersion 36`, `targetSdkVersion 36` in
  `android/variables.gradle`. `android.minWebViewVersion: 80` (the es2020 bundle needs it)
  with `server.errorPath: 'webview-update.html'` (static, no JS).
  - *Verification note:* this session had no web access. API 36 follows Play's published
    yearly rule (new apps/updates target the previous year's API level from 31 August),
    which gives 36 from 31 Aug 2026 and matches M1.2. The release engineer re-verifies at
    step 15.
- **Identity:** `io.github.hogy86.vanguardvssentinels` (placeholder, OQ-M11 (a) default).
  Label "Vanguard vs. Sentinels".
- **Manifest:**
  - INTERNET removed (`tools:node="remove"`). The only merged permission allowed is
    AndroidX's signature-level `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`, enforced in CI.
  - `appCategory="game"`, `allowBackup="false"` + data-extraction rules excluding all,
    `usesCleartextTraffic="false"`, `enableOnBackInvokedCallback="true"`.
  - Activity `screenOrientation="sensorLandscape"`, and
    `configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|screenLayout|density|uiMode|navigation|locale"`
    so fold/resize never recreates the activity and loses the run (M2.9).
  - `uses-feature touchscreen required="false"` (Chromebooks, M1.3).
  - Theme `windowLayoutInDisplayCutoutMode="always"`. Android 12+ splash theme on `#05050a`.
- **MainActivity:** registers GameShell. Forwards `onWindowFocusChanged`. Sets WebView
  `textZoom` (capped at 130%), `setLongClickable(false)`, `setHapticFeedbackEnabled(false)`,
  `OVER_SCROLL_NEVER`.
- **Plugin allowlist (closed):** `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`
  (dev), `@capacitor/app`, `@capacitor/splash-screen`, first-party GameShell. Anything else
  needs a new ADR + security re-review. Named exclusions: `@capacitor/preferences` (owner
  exception only, M-ADR-0006), status-bar, haptics, network, device, Firebase, any
  ads/billing/analytics/crash SDK, Cordova plugins.
- **WebView config:** `androidScheme https`, `hostname localhost`, `allowMixedContent false`,
  `loggingBehavior 'debug'`, web-contents debugging left at the Capacitor default
  (debuggable builds only).

## Alternatives Considered (and why rejected)
- **minSdk 29 or 33 (smaller matrix).** Rejected by the owner decision OQ-M6 (a).
- **targetSdk 35.** Rejected. Play no longer accepts it for new apps after 31 Aug 2026
  (M1.2).
- **Keeping INTERNET "just in case".** Rejected. Nothing needs it, and removing it turns
  M11.1 into an OS-enforced guarantee and makes the Data safety answer easy to verify.
- **`screenOrientation="landscape"` (one direction).** Rejected. M2.1 requires both
  landscape directions.
- **Locking orientation from JS after launch** (e.g. the Screen Orientation API/plugin).
  Rejected by UX F1 / M2.1a: the splash and title would render before the lock.
- **Omitting `appCategory="game"`.** Rejected. Android 16 would override the orientation
  lock on large screens (M2.10 note).
- **Adding the Capacitor Assets icon generator.** Rejected. It is an extra tool for a
  one-time asset. Icons are authored as Android resources from the store-assets-spec art.

## Consequences
- The CI permission check makes any future plugin that adds a permission fail the build,
  which forces a review.
- The app ID must be confirmed (OQ-M11) before step 15. Afterwards it can never change.
- A yearly targetSdk bump is expected (risk MR10).
- Traces to: M1.1-M1.5, M2.1, M2.1a, M2.9, M2.10, M3.7, M5.3, M7.6, M9.1-M9.4, M11.1-M11.5,
  OQ-M6, OQ-M11; `mobile-architecture.md` §2.1, §7.

## Amendment note (2026-09-25)
The Decision text above is kept as the historical record. Later decisions changed or
extended it as follows; where they differ, the later text wins.
- **INTERNET removal** is now a hypothesis verified on emulator images at step 7, with a
  pre-designed fallback (keep INTERNET + android-only CSP) that needs a security re-review:
  **M-ADR-0010**; mobile-architecture.md §7.3 Amendment A2 and §7.3.1. Amendment A8 adds a
  signed-AAB cold-start smoke at step 15 (§10.3 step-15 item 5; review-v1b N4).
- **Manifest hardening:** the template FileProvider and `file_paths.xml` are removed;
  MainActivity is the only exported component (ProfileInstallReceiver tolerated under
  `DUMP`); the checks now cover the whole manifest (rules R1-R7) on debug, unsigned release
  and the signed AAB: **M-ADR-0012**; §7.3 Amendment A6. **Amendment A8** (review-v1b N1)
  allows exactly one provider, the non-exported `androidx.startup.InitializationProvider`
  without `grantUriPermissions`; §7.3 A6/A8 and §10.3 R5.
- **Plugin allowlist:** `@capacitor/browser` and `@capacitor/app-launcher` are named
  exclusions (in-app privacy policy needs no plugin): **M-ADR-0009**; §2.1 Amendment A1.
- **WebView config:** "web-contents debugging left at the Capacitor default" and
  `allowMixedContent false` are now enforced by the CI config guard, which also pins
  `androidScheme`/`hostname` in the generated config and rejects `server.url`,
  `server.cleartext` and `server.allowNavigation`: **M-ADR-0012** decision 6 (L3) and
  **Amendment A8** (review-v1b N2, N5); §7.2 and §14.1 rows L3 and N2.
- **Signing:** no signing values in `capacitor.config.ts` (`buildOptions`): **M-ADR-0011**.
- **Identity:** the label and applicationId are subject to owner question OQ-S1
  (review-v1 M5); see mobile-architecture.md §7.1 note. Not decided in any ADR.

## Amendment note (2026-09-27, Amendment A10)
The Decision text above is still kept as the historical record. mobile-architecture.md
v1.4, Amendment A10, changes two of its bullets; where they differ, A10 wins.

- **Theme cutout mode (replaces "Theme `windowLayoutInDisplayCutoutMode="always"`").**
  Trigger: `docs/mobile/tests/validation-report-round2.md` F1. On a real API 28 image the
  app crashed at launch with `UnsupportedOperationException: Unknown
  windowLayoutInDisplayCutoutMode: 3`, because `always` (value 3) exists only from API 30.
  The value is now set per API level, on all three app styles (`AppTheme`,
  `AppTheme.NoActionBar`, `AppTheme.NoActionBarLaunch`):
  - `res/values/styles.xml` (API 24-27): attribute **absent**
  - `res/values-v28/styles.xml` (API 28-29): `shortEdges`
  - `res/values-v30/styles.xml` (API 30+): `always`

  **Parity rule** (from `docs/mobile/reviews/code-review-round7.md` L3): the three files
  keep the same styles, parents and items apart from the cutout item, every edit lands in
  all three in one commit, and both `values-v28/` and `values-v30/` must exist.
  **Guard:** `scripts/check-android-styles.mjs` with its tests, run in CI by the `build`
  job's `npm run test`. It is complete once it also checks the positive v28/v30 values and
  parity (round-7 L3), fails closed (L1) and matches attribute variants (L2). The
  edge-to-edge intent, minSdk 24 and targetSdk 36 are unchanged. See
  mobile-architecture.md §6.6 A10.

  *Alternatives considered for the fix:* (a) keeping `always` unconditionally was rejected
  because it crashes API 28-29 at launch (F1); (b) raising minSdk to 30 was rejected
  because it reverses owner decision OQ-M6 (a) (M1.1); (c) setting the mode at run time
  from MainActivity by API level was rejected because the splash theme is applied before
  any app code runs, and a code path adds risk that resource qualifiers avoid. This last
  option is also what core-splashscreen's own version-qualified overrides do.
- **Identity (replaces the "Identity" bullet and the 2026-09-25 "Identity" note).** The
  owner decided OQ-S1 on 2026-09-25 as option (b), rename (`docs/mobile/PRD-mobile.md`
  v1.3 §7; `docs/PRD-addendum-v4.md` F22). The applicationId and namespace are
  `io.github.hogy86.shieldvsrobots`, and the label is "Shield vs Robots". The ID is still
  an OQ-M11 placeholder until the owner confirms it before step 15, and it is permanent
  after the first upload. Internal `vvs` identifiers and the `vvs:*` storage keys do not
  change (F22 AC12-AC13). See mobile-architecture.md §7.1 A10 and §7.2.
- Closes `docs/mobile/reviews/code-review-round7.md` M1 (the §6.6 change had been made in
  place with no amendment).
