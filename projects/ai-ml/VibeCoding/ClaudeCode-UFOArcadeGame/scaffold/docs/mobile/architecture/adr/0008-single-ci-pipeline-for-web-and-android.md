# ADR M-0008: One CI workflow guards both versions

## Status: Proposed

## Context
- Owner decision (CLAUDE.md §One codebase): `.github/workflows/deploy-pages.yml` is the
  single CI check. Once `android/` exists, the Android debug build and the phone-emulation
  tests are added to it, so a break in either version blocks the website deploy.
- C3: the website build/deploy must keep working unchanged. The existing `build` job runs
  on Node 20: `npm ci` → lint → test → build with `VITE_BASE_PATH` → upload-pages-artifact.
  `deploy` needs `build`.
- M0.2: the shared tests pass on the commit the Android build comes from. M3.3a: 40/40
  swipe test. M11.1/M11.2: no network, no permissions.

## Decision
1. **`build` job:** unchanged steps, plus one step after the build that fails if
   `dist/assets/*.js` contains `@capacitor` or `registerPlugin` (web bundle purity).
2. **New `android-build` job:** JDK 21 (temurin), Node 22, `gradle/actions/setup-gradle`,
   `npm ci`, `npm run build:android`, `npx cap sync android`,
   `./gradlew assembleDebug --no-daemon`, `node scripts/check-android-permissions.mjs`
   (aapt2 permission allowlist), and upload `app-debug.apk` as an artifact (7 days). No
   signing secrets in CI; release signing stays on the owner's machine (OQ-M12).
3. **New `mobile-e2e` job:** Node 22, `npm ci`, Playwright Chromium, `npm run build:android`,
   `npm run test:e2e:mobile`. That is mobile emulation with touch at
   640×360 / 800×360 / 915×412 / 1280×800, DPR 2, with GameShell's web fallback reading
   `?insets=` and the `?e2e=1` test hook (non-native only). It covers layout sums, insets,
   menus, visibility, throw latch, cancel, back mapping, help/settings, best-score
   validation, no-network, and the 40/40 slide test.
4. **`deploy` job:** `needs: [build, android-build, mobile-e2e]`.
5. Recommended (PM decision, not required): a `pull_request` trigger with `deploy` skipped
   on PRs.

## Alternatives Considered (and why rejected)
- **A separate `android.yml` workflow.** Rejected by the owner decision. A separate
  workflow would also not block the Pages deploy.
- **Running an Android emulator in CI (reactivecircus/android-emulator-runner) for every
  push.** Rejected for now. It takes minutes per run, is flaky on hosted runners, and the
  lifecycle/back/insets checks need gesture-mode and cutout images that the device matrix
  already runs locally in step 10. It can be added later without changing this structure.
- **Upgrading the existing web job to Node 22.** Rejected. It is an unnecessary change to
  the web path (C3). Only the new jobs need Node 22 for the Capacitor CLI.
- **Building a signed release AAB in CI.** Rejected. It would require upload-key secrets
  in GitHub, which is a security surface the owner hasn't approved (OQ-M12). Release builds
  are made in step 15 on the owner's machine.
- **Unit tests only (no phone emulation).** Rejected. The owner decision explicitly
  requires phone-emulation tests, and the M3.3a swipe test needs a real pointer pipeline.

## Consequences
- The website deploy now also waits for the Android build and the e2e jobs. That adds a few
  minutes, and an Android break blocks web publishing by design.
- `@playwright/test` becomes a pinned devDependency. The Chromium download is cached by
  Playwright's installer.
- The `?e2e=1` hook and GameShell's web fallback exist in the Android-mode bundle but are
  inert in the installed app (native platform). The security reviewer checks this.
- Traces to: C3, C4, M0.2, M3.3a, M11.1, M11.2, CLAUDE.md §One codebase; `mobile-architecture.md` §10.

## Amendment note (2026-09-25)
The Decision text above is kept as the historical record; where later text differs, it wins.
- Permissions, triggers, concurrency, `npm audit`, SHA pinning, and the manifest checker (R1-R7 on debug + unsigned release, replacing `check-android-permissions.mjs`): M-ADR-0012; mobile-architecture.md §10.3 (A4/A5).
- CI never signs; unsigned-release exception; `check-no-secrets.mjs` first in `build`: M-ADR-0011; §7.5 (A3).
- Amendment A8 (review-v1b): R5 allows only the non-exported `androidx.startup.InitializationProvider` (N1); the config guard also rejects `webContentsDebuggingEnabled`, `allowMixedContent`, a non-https scheme, a non-localhost hostname, and `server.allowNavigation` (N2, N5); the secret check scans the whole repository (N3). See §10.3 and §14.1.
- The privacy-overlay e2e coverage was added in §10.1 (A1, M-ADR-0009).
