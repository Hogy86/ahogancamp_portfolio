# ADR M-11: Release signing contract (secrets outside the repo and outside OneDrive; fail-closed)

## Status: Accepted (2026-09-25, architecture v1.1)

Amends M-ADR-0001 (project layout and ignore list) and M-ADR-0008 (CI). Closes security
finding **M2** in `docs/mobile/security/review-v1.md`.

## Context

- OQ-M12 (a) is decided: Play App Signing is used, and the owner keeps only an **upload
  key**. Architecture v1 said keys are "never in the repo", but it did not say how the
  committed, hand-edited `android/app/build.gradle` gets its release `signingConfig`.
- Common failures:
  - password literals in `build.gradle` or the committed `android/gradle.properties`
  - Capacitor's `android.buildOptions.keystore*` fields in `capacitor.config.ts`
  - a release build that quietly falls back to the debug key
- The repository lives at `C:\Users\aaron\OneDrive\Documents\GitHub\...`. `.gitignore`
  protects git only: **any file saved inside the repo is uploaded to OneDrive cloud
  storage**, ignored or not.
- `scaffold/.gitignore` has only 5 lines today. The Android ignore entries must exist
  before `npx cap add android` creates the native project.

## Decision

1. **Where secrets live.**
   - The upload keystore and a `signing.properties` file are both kept in
     `C:\Users\aaron\.android-signing\vvs\`. That folder is outside the repo and outside
     every OneDrive-synced folder: OneDrive Known Folder Move covers Desktop, Documents and
     Pictures, not the profile root. The release engineer confirms this in OneDrive
     settings.
   - The folder's NTFS ACL is restricted to the owner's account.
   - `signing.properties` keys: `storeFile` (absolute path), `storePassword`, `keyAlias`,
     `keyPassword`.
   - Backup: the owner's password manager (keystore as an attachment, plus both passwords),
     per OQ-M12 (a). Not OneDrive, Google Drive or email.
2. **How Gradle finds them.** The **path** to `signing.properties` comes from the env var
   `VVS_SIGNING_PROPERTIES`, or else the Gradle property `vvsSigningProperties` in the user
   file `%USERPROFILE%\.gradle\gradle.properties`. That file holds a path only, never a
   secret, and it must not be redirected into OneDrive through `GRADLE_USER_HOME`.
3. **Path guard (fail-closed).** `app/build.gradle` refuses the properties file or the
   `storeFile` if the canonical path meets any of these:
   - it is inside the `scaffold/` project root
   - it is under `%OneDrive%`, `%OneDriveConsumer%` or `%OneDriveCommercial%`
   - it contains a path segment starting with `OneDrive` (case-insensitive)
4. **Fail-closed release.** When a release packaging task (`bundleRelease`,
   `assembleRelease`, `packageRelease*`, `signReleaseBundle`) is in the task graph, the
   build stops with a clear `GradleException` if any of these holds:
   - no valid signing properties are found
   - any of the four keys is missing
   - the path guard trips
   The release build type **never** references `signingConfigs.debug`.
5. **One CI exception, still never the debug key.** If `CI == 'true'` **and**
   `-PvvsCiUnsignedRelease=true`, the release build type gets no signing config and produces
   an **unsigned** artifact. It exists only for the CI manifest check (M-ADR-0012). An
   unsigned artifact cannot be uploaded to Play.
6. **Forbidden places for signing values:**
   - `android/gradle.properties`
   - `android/app/build.gradle`
   - any `*.gradle`/`*.gradle.kts`
   - `capacitor.config.ts` (no `buildOptions.keystore*`)
   - `.env*`
   - GitHub Actions secrets: CI never signs
   - command-line arguments: `keytool` and Gradle read passwords from the file or a prompt,
     never from shell history
7. **Ignore list lands first.** The extended `scaffold/.gitignore` is committed **before
   or in the same commit as** `npx cap add android`. The lead developer checks commit
   order. The full list is in mobile-architecture.md §3.
8. **CI tracked-secret check.** `scripts/check-no-secrets.mjs` is the first step of the
   `build` job after checkout, and can be run locally. Rules are in §7.5.3.

## Alternatives Considered (and why rejected)

| Alternative | Why rejected |
|---|---|
| Keystore and properties inside `android/` but git-ignored | Still uploaded to OneDrive. `.gitignore` protects git only (review M2). |
| Passwords in environment variables set per session | Workable, but easy to leak into shell history and profile scripts. A single owner-only file is simpler to audit. It remains acceptable only as the path mechanism (`VVS_SIGNING_PROPERTIES`). |
| Sign in CI with GitHub Actions secrets | Puts the upload key on third-party runners and widens the blast radius of any CI compromise. Owner decision: releases are built and signed on the owner's machine (CLAUDE.md §Where it runs). |
| Capacitor `buildOptions` in `capacitor.config.ts` | That file is committed, so the values would be in the repo. |
| Fall back to the debug key when release properties are missing | Produces an artifact that looks shippable and cannot be updated on Play. Fail-closed is required. |
| Manage our own app-signing key (OQ-M12 b) | Rejected by the owner decision OQ-M12 (a). |

## Consequences

- A release built on any machine without the external file fails loudly. The release
  engineer's runbook (step 13/15) documents creating the folder, the key (`keytool`
  prompts for passwords) and the ACL.
- CI keeps building debug and unsigned-release artifacts only.
- The CI secret check blocks the website deploy if a key or a password literal is ever
  tracked (C4).

## Sources

PRD-mobile OQ-M12 (a), M1.2; review-v1 M2; M-ADR-0001; M-ADR-0008; `.claude/CLAUDE.md`
§Where it runs; mobile-architecture.md §3 and §7.5.

## Amendment note (2026-09-26, architecture v1.3, Amendment A9)

The Decision text above is kept as the historical record. Where it differs from this note,
this note and mobile-architecture.md §16 (A9) win.

- **Decision 8 (CI tracked-secret check) is amended** by `docs/mobile/security/review-v1b.md`
  **Addendum 1**. The trigger was `docs/mobile/reviews/code-review-round1.md` **C3**: the
  whole-repository S1 scan (A8, review-v1b N3) failed on a committed `.env.example`
  template in an unrelated sibling project. That file holds no secret values.
  - S1 no longer fails on tracked files whose basename is exactly `.env.example`,
    `.env.sample` or `.env.template` (named constant `S1_TEMPLATE_BASENAMES`,
    case-sensitive).
  - A new rule **S6** content-scans those files instead. S6 fails on secret-shaped content
    and on an unreadable file. Each exempt file that passes is logged in the output.
  - The exact patterns, tests and merge condition are in mobile-architecture.md §7.5.3 (A9
    block and S6 row). §14.1 row N3 references them.
  - Everything else is unchanged: every other S1 pattern, rules S2-S5, the
    whole-repository scope, decision 6 ("never in `.env*`") and the ignore list (decision
    7). No other exemption may be added without a security review.
  - Alternatives the security reviewer rejected:
    - an exact-path allowlist: it stops checking the file's contents and breaks on the
      next template in the portfolio repo
    - renaming or removing the sibling file: outside this app's scope, it needs the owner,
      and committed templates are good practice
- **Context addition** (`docs/mobile/reviews/code-review-round1.md` **I1**): Gradle cannot
  build inside the OneDrive-synced repo. OneDrive turns build outputs into reparse points,
  and some paths exceed `MAX_PATH`. So Android Gradle builds and emulator installs on the
  owner's machine run from a mirror outside OneDrive,
  `C:\Users\aaron\dev-build\shield-vs-robots`. Source edits stay in the repo
  (mobile-architecture.md §3 A9, §14).
  - Decisions 1-5 are unchanged. Signing material stays in
    `C:\Users\aaron\.android-signing\vvs\` and is never copied into the mirror.
  - When Gradle runs in the mirror, the decision-3 project-root guard applies to the mirror
    root.
