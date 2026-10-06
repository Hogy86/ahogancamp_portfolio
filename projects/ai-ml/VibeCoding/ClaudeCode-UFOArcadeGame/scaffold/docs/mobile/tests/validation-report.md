# Mobile Test Validation Report — Round 1

**Stage:** Mobile Pipeline Step 10 — mobile-lead-tester (independent verification)
**Date:** 2026-09-27
**Verdict:** **FAIL**

**One-line reason:** `npm run check:secrets` (the CI `build` job's step 2, run before
`npm ci`, per `.github/workflows/deploy-pages.yml:53` and
`docs/mobile/architecture/mobile-architecture.md` §10.3) fails on the real, currently
committed tree — a real regression in `android/app/src/main/AndroidManifest.xml`'s
sibling `android/app/build.gradle` (committed at `bcccb4a`), not a test-file problem.
This blocks the website deploy too, per the one-codebase CI-gating rule in
`.claude/CLAUDE.md`. Everything else checked — the shared unit suite, the mobile
Playwright suite, both Android Gradle builds, both manifest checks, the signing
refusal, and the interactive device-matrix pass on three real AVDs — passed. This is a
single, precisely-located, easily fixable finding; see F1 below for everything
mobile-junior-developer needs to fix it without re-running anything.

---

## Scope and inputs read

- `docs/mobile/PRD-mobile.md` v1.4 (all sections, M1-M12, §0 parity rules, §3 platform
  mapping, §7 gate rules)
- `docs/mobile/tests/manual-only-criteria.md` (mobile-junior-tester, step 9)
- `docs/mobile/architecture/mobile-architecture.md` v1.3, §10 (CI), §10.1-10.3
  (phone-emulation suite minimums, the 40/40 slide test, CI hardening/manifest gate)
- `docs/mobile/reviews/code-review-round4.md` and `-round5.md` (carry-forwards routed to
  this step: L3 flex-gap on WebView 80-83, L4 Help/Settings/Pause screenshots on API 36,
  I1/I2 pre-API-30 insets)
- `docs/PRD-addendum-v3.md` (F20 saved best score), `docs/PRD-addendum-v4.md` (F21/F22
  rename + Restart Level score reset)
- Test files under review: `src/**/*.test.ts`, `scripts/*.test.mjs`,
  `tests/mobile-e2e/*.spec.ts` (including this step's uncommitted additions:
  `rename-audit.spec.ts`, `slide-switch.spec.ts`, `swap-layout-behavior.spec.ts`, and the
  modified `help-flow.spec.ts`)
- `docs/mobile/tooling-setup-log.md` (environment, AVDs, mirror-refresh procedure)

---

## Part 1 — Test quality review (test-strategy)

I read every new/changed test file (not just their names) and checked each against its
cited acceptance criterion, asking "would this test actually fail if the behavior broke?"

| File | Verdict | Why |
|---|---|---|
| `tests/mobile-e2e/rename-audit.spec.ts` | **Sound, not tautological** | Statically scans the *built* `dist-android` output and `android/.../strings.xml` (not source) for case-insensitive "Vanguard"/"Sentinel"/"Shield Invaders", and separately asserts `app_name` is the exact string "Shield vs Robots". Maps directly to M9.1/F22 AC5/AC13. Correctly scoped to the built artifact per its own comment (F22 AC12 allows old names as internal identifiers like `drawVanguard`, so scanning source would produce false positives; scanning `dist-android` is the right check). |
| `tests/mobile-e2e/swap-layout-behavior.spec.ts` | **Sound, not tautological** | Closes a real, previously-identified gap (round-4/5 carry-forward I2/I3: swap-controls geometry was tested but never behavior). Asserts the mirrored THROW/movement-zone geometry AND that holding the mirrored ◀ still moves the player left (not just "some button at some new position works") AND that the setting persists across a real reload. Uses a real CDP touch pipeline, not synthetic events. This is exactly the kind of test that would catch "swap toggles the CSS but the input zones didn't move" or "swap resets on reload." |
| `tests/mobile-e2e/slide-switch.spec.ts` | **Sound, rigorous** | Implements the PRD's own explicit 40/40 scripted-swipe test (M3.3a) with a carefully justified in-page-timestamp measurement design (the file's header documents two earlier, rejected designs that were vulnerable to CDP round-trip variance, and explains why the final design is immune to it). This is evidence of real engineering rigor, not a check-the-box test. |
| `tests/mobile-e2e/help-flow.spec.ts` (diff) | **Sound** | The round-5 changes are two genuine hardening fixes (L1: a wording correction so the file's own comment doesn't misdescribe which test covers what; S1: `expect.poll` instead of a single immediate read, closing a documented flakiness risk) — not new test logic, so no new tautology risk. |
| `docs/mobile/tests/manual-only-criteria.md` | **Sound and honest** | Cross-checked several entries against the actual test files and found them accurate — most notably the M5 entry, which documents a *deliberately removed* flaky back-gesture test with a specific, verifiable root cause (an unawaited race in `@capacitor/core`'s web-only `loadPluginImplementation`) rather than either leaving a flaky test in or silently dropping coverage. That is the correct call per the project's "no retries" testing rule, and I confirmed the state-machine logic it defers to (`GameStateMachine.test.ts`'s `handleBack()` table) is in fact exhaustively unit-tested. |

**Coverage re-derivation:** I spot-checked the manual-only doc's "Test map" table against
the acceptance criteria in `PRD-mobile.md` M1-M12 and found no orphan tests (every new
test file traces to a stated AC) and no obviously uncovered P0 criterion that the doc
doesn't already explain as manual-only with a specific, non-generic reason. I did not
re-derive all ~200 unit tests line-by-line (that was mobile-junior-tester's job at step
9, and the project's prior three code-review rounds already scrutinized `src/` test
quality); I focused on this step's actual deliverable, the new/changed test files, and on
independently running everything.

**Verdict on test quality: PASS.** No tautological or trivial tests found in this round's
additions.

---

## Part 2 — Full suite run (verbatim in `docs/mobile/tests/raw-output-round1.log`)

| Check | Result |
|---|---|
| `npm run typecheck` (repo) | PASS |
| `npm run lint` (repo) | PASS |
| `npm run test` (repo, vitest) | **PASS — 28 files, 418 tests** |
| `npm run build` (website) | PASS |
| `npm run check:secrets` (repo) | **FAIL — see F1** |
| `npm run build:android` (repo) | PASS |
| `npx playwright test -c playwright.mobile.config.ts` (mobile e2e, 4 viewports × touch emulation) | **PASS — 64/64** |
| Mirror refresh (`C:\Users\aaron\dev-build\shield-vs-robots`, robocopy per the documented procedure) | Completed, no `.csv`/`.env*` in the mirror |
| Mirror `npm ci` | PASS |
| Mirror `npm run build:android && npx cap sync android && check-capacitor-config` | PASS |
| Mirror `gradlew assembleDebug --no-daemon` | **BUILD SUCCESSFUL** (153 tasks) |
| `check-android-manifest.mjs --variant debug` (real APK, `AAPT2_PATH` set) | PASS |
| Mirror `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true --no-daemon` | **BUILD SUCCESSFUL** (203 tasks) |
| `check-android-manifest.mjs --variant release` (real APK) | PASS |
| Mirror `gradlew bundleRelease --no-daemon` (no signing.properties) | **Refused as designed** (exit 1, correct fail-closed behavior) |

A website test regression is a FAIL at this gate per my instructions — the website suite
(unit tests + build) itself is fully green; the failure is in a repo-wide CI guard
(`check:secrets`), which is a real, separate FAIL, detailed below.

---

## Failures — full diagnostic detail

### F1 (BLOCKING). `npm run check:secrets` fails on the real committed tree.

- **Command:** `node scripts/check-no-secrets.mjs` (also `npm run check:secrets`)
- **Exit code:** 1
- **Exact output:**
  ```
  check-no-secrets: S1 template exemption, content scanned clean: projects/ai-ml/VibeCoding/Cursor-UFOArcadeGame/UFO_Arcade_Game/.env.example
  check-no-secrets: found tracked secret-shaped content:
    S4: projects/ai-ml/VibeCoding/ClaudeCode-UFOArcadeGame/scaffold/android/app/build.gradle:95 (debug key referenced for release signing)
  ```
- **File:line:** `projects/ai-ml/VibeCoding/ClaudeCode-UFOArcadeGame/scaffold/android/app/build.gradle:95`
  (repo-relative from the git top-level; within `scaffold/`, that is `android/app/build.gradle:95`)
- **Committed at:** commit `bcccb4a` ("Add Android app (Capacitor) and shared game
  changes") — not part of this step's own uncommitted diff (`git status` shows only
  `tooling-setup-log.md`, `help-flow.spec.ts` modified, and three new
  `tests/mobile-e2e/*.spec.ts` files as uncommitted). This is a pre-existing regression
  in already-committed code that was never re-verified against `check:secrets` after it
  was written — the last recorded `npm run check:secrets` PASS in
  `tooling-setup-log.md:315` ("now passes on the real tree") is dated 2026-09-26, and the
  `android/app/build.gradle` file was committed the next day (`bcccb4a`, timestamp
  2026-09-27 04:57:46, per `git blame`).
- **Root cause:** `scripts/check-no-secrets.mjs`'s rule **S4** ("debug key referenced for
  release signing") matches any line in `android/app/build.gradle` against the regex
  `/signingConfigs\.debug/`. Line 95 is not code that references the debug signing
  config — it is a **comment** that documents the opposite:
  ```gradle
  93:        release {
  94:            minifyEnabled false
  95:            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
  ```
  Correction — the actual matching line (confirmed by `grep -n "signingConfigs.debug"
  android/app/build.gradle`) is:
  ```
  95:            // The release build type never references signingConfigs.debug, anywhere
  ```
  i.e. the comment that explains the **fix** for this exact rule contains the literal
  string the rule scans for, so the scanner flags its own explanatory comment as a
  violation. This is the identical failure mode already found and fixed once this
  pipeline run in `public/privacy.html` (round-5 finding L1: "the fix comment itself
  contained the literal text the check greps for") — the same class of bug has now
  recurred in a different file that nobody re-ran the check against.
- **Confirmed not a secret:** I read the surrounding 30 lines of `build.gradle`
  end-to-end. There is no debug keystore path, no hardcoded password, and no actual
  `signingConfig signingConfigs.debug` assignment anywhere in the file — the release
  `buildTypes` block only ever assigns `signingConfig signingConfigs.release`, and only
  when a validated, safely-located `signing.properties` was loaded. This is a **false
  positive**, but it is a real, reproducible CI-breaking failure, not a flaky or
  environment-specific one — I ran it twice (once standalone, once as part of `npm run
  build && npm run check:secrets`) with identical output both times.
- **Why this blocks the gate:** `check-no-secrets.mjs` is step 2 of the CI `build` job
  (`.github/workflows/deploy-pages.yml:53`, confirmed by reading the workflow file),
  which runs **before** `npm ci`/lint/test/build. A failure here means the `build` job
  never reaches its own lint/test/build steps in CI, which — per the one-codebase
  gating rule in `.claude/CLAUDE.md` ("a change that breaks either version blocks the
  website deploy") — blocks the **website** deploy as well as the Android build, even
  though neither the website nor the Android app's actual behavior is broken.
- **Suggested fix (for mobile-junior-developer, not applied by me — I do not modify
  code):** reword the comment at `build.gradle:95-97` so it describes the rule without
  reproducing the literal banned substring, the same way `public/privacy.html`'s
  comment was reworded in round 5 (e.g. "The release build type never signs with the
  debug key" instead of naming `signingConfigs.debug` verbatim), OR narrow rule S4 in
  `scripts/check-no-secrets.mjs` to ignore matches on a `//`-comment-only line (the way
  `public/privacy.html`'s own L1 fix took the wording-change route rather than changing
  the checker — recommend the same here for consistency, since changing the checker
  risks weakening a real secret-detection rule). Either fix should be covered by a new
  regression test in `scripts/check-no-secrets.test.mjs` (a fixture asserting that a
  `build.gradle`-shaped comment describing the rule, without an actual
  `signingConfigs.debug` reference, passes) so this exact class of bug cannot recur a
  third time undetected.
- **Acceptance criterion this maps to:** `docs/mobile/architecture/mobile-architecture.md`
  §7.5.3 / §10.3 ("`check-no-secrets.mjs`... Fails with the offending file... if any of
  rules S1-S6 match" — the rule is meant to catch real secrets/misconfiguration, not its
  own documentation) and the CI gate contract in §10 item 4 ("A break in either version
  blocks the website deploy").

**No other failures were found.** Every other command in Part 2's table passed with the
exact evidence in `raw-output-round1.log`.

---

## Part 3 — Device matrix (Android emulator)

Full detail, per-device results, known gaps, and the plain-language closed-test checklist
are in `docs/mobile/tests/device-matrix.md`. Summary:

- **svr_api36_pixel7** (API 36, real WebView 133, `-gpu host`): full functional pass —
  cold start, rename, Help, Settings (Privacy reachable in ≤2 taps), gameplay HUD/controls,
  pause menu, back-mapping (pause→resume, play→pause, Restart-Game-confirm→cancel), both
  landscape directions (confirmed via `dumpsys window displays` rotation flip), Home/resume
  lifecycle (M4.1-M4.3), Quit (M6.1), relaunch-after-Quit (M7.4). All PASS, screenshots
  captured — this closes carry-forward **L4** (Help/Settings/Pause screenshots on API 36).
- **svr_api30_mid** (API 30, real WebView 83.0.4103.106 — inside the round-4 finding **L3**'s
  flagged 80-83 range): full functional pass, no touching/clipped menu buttons observed on
  the title, pause, or Restart-Game-confirm screens — **L3 does not visibly reproduce** on
  this real device for those screens. The Privacy overlay header specifically was not
  cleanly re-confirmed this round (my own tap-coordinate misses); flagged as an open
  sub-item in `device-matrix.md`, not silently closed.
- **svr_api24_small** (API 24, real WebView 53 — below `minWebViewVersion: 80`): confirms
  **M1.4** (readable "please update WebView" message, no blank/black screen, no crash).
  Because this AVD's real WebView cannot run the app past that fallback, the **low-end
  performance/legibility profile itself (M2.6, M2.7, M3.1, M10.1, M10.3, M10.4) could not
  be verified by real interactive play this round** — flagged, with a tooling request
  filed for an image that can actually run the game at the low-end reference spec.
- **Tablet and foldable rows: blocked**, no AVD available — tooling request filed, not
  installed by me per this step's instructions.
- **3-button navigation mode and real edge-swipe gesture risk (M2.3a): not independently
  drilled** this round (adb key-event injection is nav-mode-agnostic) — flagged as a gap,
  not claimed as covered.

See `docs/mobile/tooling-requests.md` for the three specific tooling requests (tablet AVD,
foldable AVD, an API 28/29 image with real WebView ≥ 80) filed instead of installing them
myself.

---

## Verdict

**FAIL.** The one blocking finding (F1) is a real, precisely-located, previously-seen-and-
fixed-elsewhere class of bug in already-committed code, not a test-writer defect and not
this step's own deliverable — but per my instructions, a website/CI regression found during
this pass is a FAIL here regardless of source. Route F1 back to mobile-junior-developer
(step 7) with this report and `raw-output-round1.log`; mobile-lead-developer (step 8)
should re-gate before this step re-runs. Everything else — test quality, the shared unit
suite, the mobile Playwright suite, both Android Gradle builds, both manifest checks, the
signing-refusal contract, and the interactive device-matrix pass — is genuinely green and
does not need to be re-run once F1 is fixed; only `npm run check:secrets` (and, out of
caution, the two Gradle builds, since they touch the same file) need re-verification.

mobile-ui-ux-designer's round 2 should **not** start until this is re-run to PASS.
