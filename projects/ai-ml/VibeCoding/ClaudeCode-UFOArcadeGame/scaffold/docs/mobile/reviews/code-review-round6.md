# Mobile Code Review, Round 6

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-27
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `bcccb4a` (`git diff` plus untracked files):
- Modified: `android/app/build.gradle`, `scripts/check-android-manifest.mjs`, `scripts/check-android-manifest.test.mjs`, `scripts/check-no-secrets.test.mjs`, `tests/mobile-e2e/help-flow.spec.ts`, `docs/mobile/tooling-setup-log.md`
- Untracked:
  - step 9: `tests/mobile-e2e/rename-audit.spec.ts`, `slide-switch.spec.ts` and `swap-layout-behavior.spec.ts`
  - step 10: `docs/mobile/tests/*` and `docs/mobile/tooling-requests.md`
- `scripts/check-no-secrets.mjs`, `src/` and `.github/workflows/deploy-pages.yml` are unchanged against HEAD (`git diff --quiet`).

**Scope:**
- Step-10 validation failure F1 (`docs/mobile/tests/validation-report.md`).
- `code-review-round5.md` L2 in all three parts, plus the it-analyst items L3 and I1 recorded in the same diff.
- Test files under `tests/mobile-e2e`, checked for CI determinism.
- Step-10 docs, checked for accuracy only.

**Reviewed against:**
- `review-v1b.md` N3 and Addendum 1
- `mobile-architecture.md` v1.3 §7.5 (7.5.2 rule 4, 7.5.3), §10.3 and §14.1
- `code-review-round5.md`

**Skills applied:** coding-standards, mobile-touch-and-layout

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: PASS

- **F1 is closed.**
  - `build.gradle:95` now reads `// The release build type never signs with the debug key, anywhere`.
  - `npm run check:secrets` on the real tracked tree prints the S1 template-exemption notice, then `check-no-secrets: no tracked secret-shaped content found.` It exits 0.
- **The S4 rule was not weakened.**
  - `scripts/check-no-secrets.mjs` has no diff against HEAD.
  - S4 is still `filePattern: /(^|\/)android\/app\/build\.gradle$/` with `linePattern: /signingConfigs\.debug/`, applied to every line, comments included.
  - The fix changed the comment's wording, not the checker. That was the approach the validation report recommended.
- **The §7.5.2 rule-4 behavior is intact.**
  - The only `signingConfig` assignment in the file is `signingConfigs.release`, guarded by `vvsSigningPropertiesFile != null` (`build.gradle:98-100`).
  - The fail-closed `taskGraph.whenReady` block (`:105-121`) is unchanged.
  - `bundleRelease` still refuses to build (see the table).
- **The regression test does use the real file** under the standard invocations (`npm run test` locally, and `npm run test -- --run` in CI, whose `working-directory` is `scaffold/`). I proved that it catches the original bug:
  - With HEAD's pre-fix `build.gradle` fed through the same `processFiles`, it reports `S4: android/app/build.gradle:95 (debug key referenced for release signing)`.
  - With the current file, it reports no S4 failure.
  - It is not fail-closed on a missing file; see L1, which does not block.
- **Round-5 L2 is closed in all three parts.**
  1. A missing aapt2 now prints an actionable message and exits 2. I verified this live with a bogus path and with `AAPT2_PATH` unset.
  2. A unit test was added.
  3. The local procedure is documented in `tooling-setup-log.md`, and I followed it successfully.
- **Round-5 L3 and I1 are closed**, and the S1 carry-forward was applied (`help-flow.spec.ts` now uses `expect.poll`).
- **The e2e suite is deterministic:** `--repeat-each=3` gave 192 passed, 0 failed, 0 skipped.
- **The Android checks all passed from a freshly refreshed mirror:**
  - `assembleDebug`
  - the CI unsigned `assembleRelease`
  - the `bundleRelease` refusal
  - the manifest check on both APKs
  - a negative control, which failed as it should
  - the aapt2 ENOENT path
- **Nothing blocks.** New findings are one LOW, two suggestions and INFO items.

`mobile-lead-tester` may re-run step 10.

## Verification results

| Check | Result |
|---|---|
| `npm run check:secrets` (real tracked tree, whole repository) | **PASS**, exit 0. The only output is the `.env.example` S1 template-exemption notice, then "no tracked secret-shaped content found." |
| `git diff --quiet HEAD -- scripts/check-no-secrets.mjs` | Unchanged, so S4 is not weakened |
| `grep -c "signingConfigs.debug" android/app/build.gradle` (repo and mirror) | 0 |
| `npm run typecheck` | PASS (exit 0) |
| `npm run lint` | PASS (exit 0) |
| `npm run test` | **PASS: 28 files, 420 tests** (418 before, plus the S4 regression test and the aapt2-ENOENT test) |
| `npm run build` (web) | PASS |
| `npm run build:android` | PASS |
| `npx playwright test -c playwright.mobile.config.ts --repeat-each=3` | **192 passed, 0 failed, 0 skipped** (4.1 min). Includes the three new step-9 specs × 4 viewports × 3 repeats. |
| Ports 4173 and 4174 after the run | Nothing listening. Playwright stopped its own `vite preview`. |
| Negative control, done outside the project with a scratch script: `processFiles` fed HEAD's `build.gradle` | `S4: android/app/build.gradle:95 (...)`, so the test's logic really detects the bug |
| Negative control: `processFiles` with a root that doesn't exist | `[]`, having attempted 1 read, which threw and was silently skipped (see L1) |
| Same S4 test run through vitest with cwd = `ClaudeCode-UFOArcadeGame/` (`vitest run --root scaffold`) | **Passed without reading the file.** `…/ClaudeCode-UFOArcadeGame/android/app/build.gradle` doesn't exist (see L1). |
| Mirror refresh, exactly as documented: stop stale mirror node processes, then the three `Remove-Item` clears, then `robocopy /MIR /XD node_modules .git build .gradle .terraform /XF terraform-deploy_accessKeys.csv *.csv .env .env.* *.tfstate *.tfstate.* terraform.tfvars` | Exit 3 (files copied and extras removed; 0 failed, 0 mismatched) |
| Mirror hygiene: `*.csv`, `.env*`, `*.tfstate*`, `terraform.tfvars`, `.terraform`, `*.jks`, `*.keystore`, `signing.properties` outside `node_modules` | **None**. `infra/aws` in the mirror holds only `.tf`, `.sh`, `README` and `terraform.tfvars.example`. |
| Mirror parity (`diff -rq`) | Identical: `src`, `tests`, `scripts`, `public`, `android/app/src`, `android/app/build.gradle`, `package.json`, `package-lock.json`, `capacitor.config.ts`, `playwright.mobile.config.ts`, `vite.config.ts` |
| Mirror `npm ci`, `npm run build:android`, `npx cap sync android`, `check-capacitor-config.mjs` | All PASS (2 plugins: `@capacitor/app@8.1.1`, `@capacitor/splash-screen@8.0.2`) |
| Mirror `gradlew assembleDebug --no-daemon` (JDK 21.0.12) | **BUILD SUCCESSFUL**, 153 tasks |
| Mirror `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true --no-daemon` | **BUILD SUCCESSFUL**, 203 tasks |
| Mirror `gradlew bundleRelease --no-daemon` (`CI` unset, no signing properties) | **Refused as designed**, exit 1: "Release signing not configured or unsafe location (no signing.properties path was provided) - see … §7.5. Refusing to build." No `.aab` anywhere in the mirror. |
| `AAPT2_PATH=…\build-tools\36.0.0\aapt2.exe` `check-android-manifest.mjs --variant debug` | **PASSED**, exit 0 |
| Same, `--variant release` on `app-release-unsigned.apk` | **PASSED**, exit 0 |
| Negative control: `--variant release` on `app-debug.apk` | **FAILED as expected**: `R2: android:debuggable="true" on a release build`, exit 1 |
| L2: `AAPT2_PATH=C:/nope/aapt2.exe` | `check-android-manifest: aapt2 not found (tried "C:/nope/aapt2.exe"); set AAPT2_PATH to <ANDROID_HOME>/build-tools/36.0.0/aapt2(.exe)`, exit 2, no stack trace |
| L2: `AAPT2_PATH` unset, and aapt2 not on PATH | Same message with `tried "aapt2"`, exit 2 |
| Leftover java, node or emulator processes, and ports 4173, 4174, 4181, 4182 | None. Every Gradle run used `--no-daemon`, and no AVD was started. |

---

## Findings status

| # | Source | Status | Evidence |
|---|---|---|---|
| F1 | validation-report round 1 | **Closed** | `build.gradle:95` was reworded, and `check:secrets` passes on the real tree. The regression test is at `check-no-secrets.test.mjs:219-236`. |
| L2 (parts 1 and 2) | code-review-round5 | **Closed** | `check-android-manifest.mjs:41-71` adds `Aapt2NotFoundError`, which is thrown only when `code === 'ENOENT'`; every other error is re-thrown unchanged. `main()` at `:331-341` prints it and exits 2, and other errors still propagate. The test is at `check-android-manifest.test.mjs:332-352`. It restores `AAPT2_PATH` in `finally`, and its Windows-style bogus path is still missing on Linux CI, so the test is portable. |
| L2 (part 3) | code-review-round5 | **Closed** | `tooling-setup-log.md` has a new "Local manifest-check procedure with AAPT2_PATH" section. I followed it; `build-tools/36.0.0/aapt2.exe` exists. |
| L1 | code-review-round5 | **Closed** | `help-flow.spec.ts:10-17` |
| L3 | code-review-round5 | **Closed** | The log now cites the section heading instead of `:552-559` |
| S1 | code-review-round5 | **Taken** | `help-flow.spec.ts:50-53, :64, :76` use `expect.poll` with messages |
| I1 | code-review-round5 | **Closed** | The robocopy `/XD` and `/XF` exclusions were extended, and the mirror has no Terraform state (verified above) |

The `build.gradle` comment change is the one-line reword the validation report suggested. It changes no behavior, and the builds and refusal above confirm that.

---

## LOW (not blocking; fix the next time this file is touched)

- **L1. `scripts/check-no-secrets.test.mjs:220-236`: the S4 regression test passes without reading the file if it runs from any directory other than `scaffold/`** (a test that cannot fail).
  - `SCAFFOLD_ROOT = process.cwd()` (`:20`). If the file isn't found, `readFileSync` throws, and `processFiles`'s line-rules branch swallows the error by design (`check-no-secrets.mjs:216-218`, `catch { continue; }`). The result is zero failures, and the test passes.
  - Reproduced: running `vitest run --root scaffold scripts/check-no-secrets.test.mjs` from `ClaudeCode-UFOArcadeGame/` gives 1 passed, and no `build.gradle` exists at the path it resolved.
  - The comment at `:16-19` says the cwd is "vitest.config's root", but `vitest.config.ts` sets no `root`. The cwd works only because npm runs scripts from the `package.json` directory.
  - CI is not affected today: its `working-directory` is `scaffold/`, and `check:secrets` itself (CI step 2) remains the primary gate on the real tree.
  - **Fix:**
    1. Resolve the path from the test file itself: `const SCAFFOLD_ROOT = fileURLToPath(new URL('..', import.meta.url));`. Import `fileURLToPath` from `node:url`. This is fine under the lint config, since `eslint` runs only on `src`.
    2. Make the test fail if the file wasn't read. Either:
       - assert `existsSync(path.join(SCAFFOLD_ROOT, relPath))` first, or
       - count calls through the injected `readFile` and `expect(reads).toBe(1)`.
    3. Fix the comment.
  - **Owner:** mobile-junior-tester at step 9, or mobile-junior-developer the next time it is in `scripts/`.

## Suggested (optional)

- **S1. `tests/mobile-e2e/swap-layout-behavior.spec.ts:76-83`: `startRun` guesses whether Help will appear**, with a 2 s `waitFor(...).catch(() => false)`.
  - The test knows the answer: Help appears on the first run (after `localStorage.clear()`) and not on the second.
  - If Help takes longer than 2 s to appear under CI load, the first run moves on while the overlay is still up, and the next assertions fail for the wrong reason.
  - It passed 12 out of 12 today.
  - Pass an `expectHelp: boolean` parameter and assert that the dialog is either visible or hidden, instead of guessing.
- **S2. `tests/mobile-e2e/rename-audit.spec.ts:26-31`: the comment says "Playwright always runs from the repo root".**
  - The path actually resolves from `process.cwd()`, which is `scaffold/` in CI (`deploy-pages.yml` `mobile-e2e` job) and under `npm run test:e2e:mobile`. That is not the repo root, so the comment is wrong.
  - The same cwd dependence as L1 applies, but here a wrong cwd hits `test.skip`, which is visible in reports, rather than passing without checking.
  - CI builds `dist-android` before the suite, and `strings.xml` is committed, so neither skip fires in CI. I saw 0 skips.
  - Reword the comment to "from the `scaffold/` project root (the directory containing `package.json`)".

## CI determinism notes (step-9 specs, no finding)

- **`slide-switch.spec.ts`**
  - Time-based, but the pass/fail measurement uses only in-page timestamps (pointer events and rAF samples on the same clock). CDP round-trip time only affects how long the gesture takes, not the measurement.
  - Its only re-collection loop (`:278-298`) re-runs data collection when the run left PLAYING mid-gesture. It is limited to 2 attempts and happens before any assertion, so it does not retry an M3.3a rule. `retries` is still absent from the config and the workflow.
  - The 100 ms budget plus 40 ms `FRAME_TOLERANCE_MS` is disclosed in the failure message. I accept it as a measurement-precision allowance.
  - Every timed step measures elapsed time, not frame count. That matches the "delta, not per frame" rule.
- **`swap-layout-behavior.spec.ts`:** uses `expect.poll` for every asynchronous state change. The only fixed waits are the 300 ms button holds, and those check the sign of the movement, not a distance.
- **`rename-audit.spec.ts`:** a filesystem check only; nothing time-dependent.
- **Result:** 192/192 across 3 repeats × 4 viewports under `fullyParallel`.

## INFO

- **I1. `tooling-setup-log.md`, it-analyst entry, item 3:** the robocopy command in the round-3 section was edited in place rather than superseded by a new, dated command. The entry does record the change, so the history is still recoverable. For future corrections, add a new command block and leave the old text, per traceability-conventions ("never overwritten"). Also, "Added a new subsection below this entry" is really a subsection inside the entry. This is cosmetic.
- **I2. `docs/mobile/tests/validation-report.md` F1 accuracy:** the diagnosis first quotes the wrong line 95 (`proguardFiles …`), then corrects itself inline ("Correction — the actual matching line…"). The conclusion is correct and matches what I reproduced, but the leftover wrong snippet could mislead. mobile-lead-tester may want to drop it in its round-2 report. Everything else I checked in the report matches what I found: CI step 2 at `deploy-pages.yml:53`, the S4 regex, and the absence of any real debug-signing assignment.
- **I3.** The 420-test count is the round-5 count (418) plus exactly the two new tests; no test was removed.
- **Carry-forwards unchanged from round 5:** round-4 L3 and L4 go to UX round 2 and the device matrix, I2 goes to step 10, and I4 (the `terraform-deploy_accessKeys.csv` in the OneDrive copy) goes to the website security reviewer. mobile-security-compliance-reviewer pass 2 should note that round-5 I1 is now resolved.

## Conformance summary

| Area | Result |
|---|---|
| One codebase (no per-platform game logic) | PASS. No change under `src/`. |
| Elapsed-time movement and timers | PASS (unchanged; the new specs measure elapsed time) |
| Touch handlers vs scroll, zoom and select | PASS (unchanged) |
| Background pause, listeners, audio | PASS (unchanged) |
| Back button | PASS (unchanged). The Help-flag regression tests now poll. |
| DPR canvas, cutouts, gesture bar | PASS (unchanged) |
| Hand edits to generated `android/` files | PASS. The only `android/` edit is the source file `app/build.gradle` (a comment), not a generated asset. `android/app/src` is identical in the mirror, and assets come from `cap sync`. |
| Release signing contract (§7.5) | PASS. Rule 4 still holds (only `signingConfigs.release`, guarded), `bundleRelease` fails closed, and the unsigned CI release builds only with `CI=true` plus the flag. |
| CI secret check (§7.5.3, §10.3, N3, Addendum 1) | PASS. Whole-repository scan, rules S1-S6 unchanged, passes on the real tree. |
| Manifest guard (§10.1) | PASS on both real APKs, the negative control fails, and the missing-aapt2 case is now actionable (exit 2). |
| Security §14.1 | PASS. No signing, `.csv`, `.env*` or Terraform state material in the mirror. |
| coding-standards | Style PASS. Error handling PASS: L2 is fixed, and only ENOENT is converted; nothing else is swallowed. Docs: L1 comment inaccuracy, S2. Tests: PASS apart from L1 (not fail-closed when run from another directory). |
| Website build and tests | PASS: `check:secrets`, typecheck, lint, 420 unit tests, web build; mobile e2e 192/192 |

## Commands denied by permissions

None. The reviewer ran every requested command.

## Session hygiene

- Playwright stopped its own `vite preview`, and ports 4173, 4174, 4181 and 4182 were free afterwards.
- Every Gradle run used `--no-daemon`, and no java, node or emulator processes remained.
- No AVD was started.
- Negative-control scripts ran from the session scratchpad only; no project file was written.

## Routing

- **Gate: PASS.** Step 10, mobile-lead-tester, re-runs. Its own report says only `check:secrets` and the two Gradle builds need re-verification.
- **mobile-junior-tester or mobile-junior-developer (not blocking; next time in the file):** L1, plus S1 and S2 if it is in those specs.
- **mobile-it-analyst:** I1, a traceability note for future log corrections.
- **mobile-lead-tester:** I2, removing the stale snippet in the next report.
- **Carry-forwards:** as listed under INFO.
