---
name: android-signing-and-release
description: Conventions for Android versioning, upload-key handling, building the signed app bundle, and moving through Google Play testing tracks to production. Use by mobile-release-engineer.
---

# Android Signing and Release

Inherits invoking subagent's model.

## Versioning
- `versionCode` is an integer that must increase with every upload —
  never reuse one, even for a rejected build.
- `versionName` is the player-facing version; keep it aligned with the
  website's `package.json` version where practical so both versions of
  the game are easy to match up.
- Record versionCode, versionName, and the git commit in the release
  notes for every upload.

## Upload key
- The upload key (keystore) is created once, on the owner's machine,
  and stored **outside the repo**. The owner chooses and keeps the
  password — never generate, store, log, or print it.
- Signing config reads from a local `keystore.properties` (or
  environment variables) that is listed in `.gitignore`. Verify with
  `git check-ignore` before every release.
- The owner keeps a backup of the keystore and password in a separate,
  safe place (e.g. a password manager). Enroll in Play App Signing so
  Google holds the app signing key and a lost upload key can be reset
  through Play Console support.

## Build
- Always: `npm run build` → `npx cap sync android` → Gradle release
  bundle (`bundleRelease`). Never build Android from stale web assets.
- Verify the signed .aab (or a universal APK built from it) installs
  and runs on the emulator before uploading.

## Play tracks
- Internal testing: fastest check that an upload works (optional).
- Closed testing: required for new personal accounts before production
  (confirm current tester count and duration in Play Console Help).
- Production: only after the closed test passes and the owner
  explicitly approves. Prefer a staged rollout (e.g. 20% → 100%) and
  watch Play Console crash/ANR reports between stages.

## What only the owner does
- Pays for and verifies the Play developer account.
- Creates the keystore password and keeps the backup.
- Confirms Data safety, content rating, and target audience answers.
- Presses the button that publishes to production.
