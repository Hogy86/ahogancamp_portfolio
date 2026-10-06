# ADR M-12: CI least privilege, dependency audit, and the release-manifest gate

## Status: Accepted (2026-09-25, architecture v1.1). Amended 2026-09-25 by Amendment A8 (see the note at the end).

Amends M-ADR-0007 (manifest hardening: FileProvider removed, exported components) and
M-ADR-0008 (CI jobs). Closes security findings **M3**, **M4** and **L1** in
`docs/mobile/security/review-v1.md`. Folds in L3 and L5 as binding step-7 constraints.

## Context

- `.github/workflows/deploy-pages.yml` grants `contents: read`, `pages: write` and
  `id-token: write` at **workflow** level. The new `android-build` and `mobile-e2e` jobs
  (M-ADR-0008) would inherit those grants while running a much larger third-party
  toolchain: Capacitor, AGP/Gradle plugins and the Playwright browser download. A
  compromised dependency could publish to Pages (M3).
- v1 checked permissions only on `app-debug.apk`. The release variant's merged manifest can
  differ (debuggable handling, placeholders, release-only dependencies), and the shipped AAB
  was never checked (M4).
- The Capacitor template ships an unused `FileProvider` with broad path grants (L1).
- The workflow's `concurrency: { group: pages, cancel-in-progress: true }` is workflow-wide.
  If the recommended `pull_request` trigger is adopted, a PR run would cancel an in-flight
  master deploy.

## Decision

1. **Permissions.**
   - Top-level `permissions: { contents: read }`.
   - Only the `deploy` job has `permissions: { pages: write, id-token: write }`.
     Job-level permissions replace the top-level ones.
   - `build`, `android-build` and `mobile-e2e` have no write scopes.
   - `actions/checkout` in every non-deploy job uses `persist-credentials: false`.
2. **Triggers.**
   - If a PR trigger is added, it is `pull_request` and **never** `pull_request_target`.
   - `deploy` has `if: github.event_name != 'pull_request'`.
   - Workflow concurrency becomes `group: ${{ github.workflow }}-${{ github.ref }}`,
     `cancel-in-progress: true`.
   - The `deploy` job keeps its own `concurrency: { group: pages, cancel-in-progress: true }`,
     so master deploy behavior is unchanged.
3. **Dependency audit.** The `build` job runs `npm audit --omit=dev --audit-level=high`
   right after `npm ci`. Capacitor adds the first runtime dependencies.
4. **One manifest checker, three uses.**
   - `scripts/check-android-manifest.mjs` replaces v1's `check-android-permissions.mjs` and
     takes `--variant debug|release`.
   - Input is either `--apk <file>` (uses `aapt2 dump xmltree --file AndroidManifest.xml`)
     or `--manifest-xml <file>` (output of `bundletool dump manifest`).
   - Rules:
     - **R1** Permissions ⊆ `{ <applicationId>.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION }`.
       INTERNET is allowed only with `--allow-internet`, used only under the M-ADR-0010
       fallback. No `uses-permission-sdk-23`.
     - **R2** (release) `android:debuggable` is absent or false.
     - **R3** `android:usesCleartextTraffic="false"` is present, and there is no
       `networkSecurityConfig`.
     - **R4** `android:allowBackup="false"` is present.
     - **R5** Exported components:
       - Exactly one exported activity, MainActivity, with MAIN/LAUNCHER.
       - Any other `exported="true"` component must be on a named allowlist and guarded by
         a system permission. The only planned entry is
         `androidx.profileinstaller.ProfileInstallReceiver` with `android.permission.DUMP`,
         if AndroidX merges it.
       - No `<provider>` of any kind. *(Superseded by Amendment A8; see the note at the end.)*
       - No intent filter with a `<data android:scheme>` (no deep links or custom schemes).
     - **R6** (release) `android:testOnly` is absent or false.
     - **R7** `minSdkVersion == 24` and `targetSdkVersion == 36`. These values come from
       `variables.gradle` and are updated together with it.
   - Uses:
     - (a) CI `android-build`: debug APK, `--variant debug` (R2 and R6 skipped).
     - (b) CI `android-build`: `./gradlew assembleRelease -PvvsCiUnsignedRelease=true`, then
       `--variant release --apk app-release-unsigned.apk`.
     - (c) **Step 15 (release engineer):** `bundletool dump manifest --bundle <signed>.aab`,
       then `--variant release --manifest-xml`. The output and the AAB's SHA-256 are
       recorded in `docs/mobile/release/submission-checklist.md`. A failure stops the
       upload.
5. **FileProvider removed (L1).** Delete the template `<provider
   android:name="androidx.core.content.FileProvider">` and `res/xml/file_paths.xml`. R5
   keeps it out.
6. **Config guard (L3).** After `cap sync`, `scripts/check-capacitor-config.mjs` fails if
   the generated `android/app/src/main/assets/capacitor.config.json` or
   `capacitor.config.ts` has a `server.url` or `server.cleartext: true`. The runbook requires
   a fresh `npm run android:sync` right before `bundleRelease`.
7. **Pinning (L5).**
   - Third-party actions (`gradle/actions/setup-gradle`, `actions/setup-java`) are pinned to
     full commit SHAs, with the tag in a trailing comment.
   - Gradle wrapper validation stays on (the setup-gradle default; never set
     `validate-wrappers: false`).
   - `jsdom` is pinned exactly in `package.json`.

## Alternatives Considered (and why rejected)

| Alternative | Why rejected |
|---|---|
| Keep workflow-level permissions (status quo) | Every job, including the ones running Gradle/Maven and npm toolchains, could publish to Pages. |
| Split Android jobs into a separate workflow | Violates the owner decision that `deploy-pages.yml` is the single check guarding both versions (C4). |
| Check the release manifest only in CI (unsigned) | CI never sees the actual shipped AAB. Step 15 must check the real artifact. CI is kept as an early warning. |
| Check only at step 15 | A release-only manifest regression would surface weeks after the change. The CI unsigned check catches it on the commit that caused it. |
| Download bundletool in CI for an unsigned `bundleRelease` | Adds a third-party binary download to CI. The unsigned release APK comes from the same merged manifest and is checked with `aapt2`, which the SDK already has. bundletool is used only on the owner's machine at step 15. |
| `pull_request_target` for PRs | Runs with a write token and secrets on untrusted PR code. Never. |

## Consequences

- Only the deploy job can publish to Pages, and it runs only third-party code from
  `actions/deploy-pages`.
- A high-severity runtime advisory in the dependency tree blocks the deploy until it is
  resolved or explicitly assessed.
- The shipped AAB's manifest is verified against the same rules as CI, and the evidence is
  kept in the submission checklist.

## Sources

PRD-mobile M11.2, M1.1, M1.2; review-v1 M3, M4, L1, L3, L5; M-ADR-0007; M-ADR-0008;
M-ADR-0011 (unsigned-release flag); C4; the current repo-root
`.github/workflows/deploy-pages.yml` (lines 24-33).

## Amendment note (2026-09-25, Amendment A8; `docs/mobile/security/review-v1b.md`)
The Decision text above is kept as the historical record. mobile-architecture.md
Amendment A8 changes it as follows; where they differ, A8 wins.
- **Decision 4, R5 provider clause (review-v1b N1, MEDIUM).** "No `<provider>` of any kind"
  would fail every Capacitor build: AndroidX (via AppCompat → emoji2, lifecycle-process,
  profileinstaller) merges `androidx.startup.InitializationProvider` with
  `exported="false"`. Replaced by: every `<provider>` fails **except**
  `androidx.startup.InitializationProvider` with `android:exported="false"` and no
  `android:grantUriPermissions="true"`. Any exported provider, any provider whose class is
  `androidx.core.content.FileProvider` or a subclass, any provider with a
  `<grant-uri-permission>`, and any provider with a `FILE_PROVIDER_PATHS` meta-data entry
  always fails. The allowlist is named in the checker source; any other provider needs a
  security review; `InitializationProvider` is never removed with `tools:node="remove"`.
  Decision 5 (FileProvider removed, L1 closed) is unchanged. See §7.3 A6/A8 and §10.3 R5
  (with implementation notes and fixture tests).
- **Decision 6, config guard (review-v1b N2, N5).** Also fails on
  `webContentsDebuggingEnabled: true`, `allowMixedContent: true`, an `androidScheme` other
  than `'https'`, a `hostname` other than `'localhost'`, and any `server.allowNavigation`,
  in both `capacitor.config.ts` and the generated `capacitor.config.json`. See §14.1 row N2.
- **Decision 4 use (c), step 15 (review-v1b N4).** After the manifest check, the signed AAB
  is installed with bundletool (`build-apks --connected-device`, `install-apks`) on the
  API 36 image and a WebView ≥ 80 image, cold-started with no INTERNET, and must show the
  title and open the privacy overlay. The result is recorded in `submission-checklist.md`
  next to the manifest output. See §10.3 step-15 list, item 5.
- **Secret-check scope (review-v1b N3; affects the `build` job step defined with
  M-ADR-0011).** `check-no-secrets.mjs` now scans the whole git repository, not only
  `scaffold/`. See §14.1 row N3.
