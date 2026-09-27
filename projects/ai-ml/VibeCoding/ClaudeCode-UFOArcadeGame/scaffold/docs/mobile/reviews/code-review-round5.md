# Mobile Code Review, Round 5

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-27
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `e8960b1`. The round-5 delta is every file with an mtime later than `code-review-round4.md` (04:35:34), found with `find -newer` and `-mmin`:
- `tests/mobile-e2e/controls-behavior.spec.ts`
- `tests/mobile-e2e/controls-layout.spec.ts`
- `tests/mobile-e2e/help-flow.spec.ts`
- `public/privacy.html`
- `docs/mobile/tooling-setup-log.md`

No file under `src/`, `scripts/` or `android/`, and not `.github/workflows/deploy-pages.yml`, changed after round 4.

**Scope:** per `code-review-round4.md` "Re-review": round-4 M1, the touched LOWs (L1, L2, L5) and INFO I4, regressions in the round-5 diff, and the Android Gradle checks run by the reviewer.
**Reviewed against:** `mobile-architecture.md` v1.3 (§3 A9, §7.5, §10.1, §14.1, MR18), `PRD-mobile.md` v1.4, `review-v1b.md` Addendum 1, `code-review-round4.md`, and the round-5 section of `tooling-setup-log.md`.
**Skills applied:** coding-standards, mobile-touch-and-layout

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: PASS

- **Round-4 M1 (the flaky e2e test that gates CI) is closed.** I ran the mobile e2e suite with `--repeat-each=5` twice, once with `CI=true`: **440 passed, 0 failed, 0 skipped**. No `retries` setting was added anywhere.
- **L1, L2, L5 and I4 are closed.**
- **Every Android Gradle check ran from a freshly refreshed mirror, and all passed:**
  - `assembleDebug`
  - unsigned CI `assembleRelease`
  - the `bundleRelease` refusal
  - `check-android-manifest` on both APKs
  - a negative control that the manifest check should fail, and does
- **No command was denied by permissions**, so the verdict has no conditions.
- The round-5 diff introduced no regressions.
- The new findings are LOW or INFO and do not block.

`mobile-junior-tester` may start step 9.

## Verification results

| Check | Result |
|---|---|
| `npm run typecheck` (repo) | PASS (exit 0) |
| `npm run lint` (repo) | PASS (exit 0) |
| `npm run test` (repo) | PASS: 28 files, 418 tests |
| `npm run build` (web, repo) | PASS |
| `npm run build:android` (repo) | PASS |
| `npx playwright test -c playwright.mobile.config.ts --repeat-each=5` | **220 passed, 0 failed, 0 skipped** (1.8 min) |
| Same command again with `CI=true` (`reuseExistingServer: false`, as CI runs it) | **220 passed, 0 failed, 0 skipped** (1.7 min) |
| Ports 4173, 4174, 4181 and 4182 after the runs | Nothing listening. Playwright stopped its own `vite preview`. |
| `retries` in `playwright.mobile.config.ts` or `deploy-pages.yml` | None (grep) |
| Stale mirror node processes, checked with the documented I4 one-liner before refreshing | None found |
| Mirror refresh, run exactly as documented (three `Remove-Item` clears, then `robocopy /MIR /XD node_modules .git build .gradle /XF terraform-deploy_accessKeys.csv *.csv .env .env.*`) | Exit 1 (files copied, 0 failed, 0 mismatched) |
| `.csv`, `.env` or `.env.*` in the mirror outside `node_modules` | **None** |
| `build` or `.gradle` directories in the mirror after the refresh | Only the mirror's own `android/.gradle`, which is expected |
| Mirror parity (`diff -rq`) | Identical to the repo: `src`, `tests`, `scripts`, `public`, `android/app/src`, `android/app/build.gradle`, `package.json`, `package-lock.json`, `capacitor.config.ts`, `playwright.mobile.config.ts`, `vite.config.ts` |
| `npm ci`, then `npm run test` (mirror) | PASS: 28 files, 418 tests |
| `npm run build:android` (mirror) | PASS |
| `npx cap sync android` (mirror) | PASS: 2 plugins (`@capacitor/app@8.1.1`, `@capacitor/splash-screen@8.0.2`) |
| `assets/public` vs `dist-android` | Identical apart from the `cordova.js` and `cordova_plugins.js` that Capacitor generates, so assets come only from `cap sync` |
| `gradlew assembleDebug --no-daemon` (JDK 21.0.12, mirror) | **BUILD SUCCESSFUL**, 153 tasks → `app-debug.apk` |
| `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true --no-daemon` | **BUILD SUCCESSFUL**, 203 tasks → `app-release-unsigned.apk` |
| `gradlew bundleRelease --no-daemon` with no signing properties | **Refused as designed** (exit 1): "Release signing not configured or unsafe location (no signing.properties path was provided) - see docs/mobile/architecture/mobile-architecture.md §7.5. Refusing to build." No `.aab` produced. |
| `check-android-manifest.mjs --variant debug --apk app-debug.apk` | **PASSED** (needed `AAPT2_PATH=…/build-tools/36.0.0/aapt2.exe`; see L2 below) |
| `check-android-manifest.mjs --variant release --apk app-release-unsigned.apk` | **PASSED** |
| Negative control: `--variant release` against `app-debug.apk` | **FAILED as expected**: `R2: android:debuggable="true" on a release build`, exit 1. The check really catches a bad manifest. |
| `grep -c "<script" public/privacy.html` | **0** |
| `public/privacy.html` §8.7 rules | No `<script`, no `on*=` attributes, no `href=`, `src=`, `@import` or `url(`. Clean. |
| Leftover processes (java, node, emulator) and ports after Gradle | None. Every Gradle run used `--no-daemon`, and no AVD was started. |

---

## Round-4 findings status

| # | Finding | Status | Evidence |
|---|---|---|---|
| M1 | Cold-load Privacy spec races the lazy `AndroidPlatform` mount | **Closed** | See "M1 detail" below |
| L1 | `<script` literal in the privacy.html comment | **Closed** | `privacy.html:17-21` rewords the note without the tag text. Grep count is 0. The §8.7 content rules still hold. |
| L2 | Permanently skipped Help `overlay-close` test | **Closed** | The dead variant is removed, and the header note (`help-flow.spec.ts:10-14`) says Escape is Help's only dismissal other than "Got it". 0 skips across 440 runs. The optional `expect.poll` suggestion at `:58` and `:70` was not taken; see S1. |
| L3 | Flex `gap` needs Chromium 84, but the minimum WebView is 80 | Carried (not in scope) | Goes to UX round 2 and the step-10 device matrix |
| L4 | Log points to a nonexistent screenshot document | Carried (not in scope) | Goes to step 10 or UX round 2 |
| L5 | Latent risk in robocopy `/XD build` | **Closed** | `tooling-setup-log.md:399-405` |
| I1-I3 | Pre-API-30 insets; no swap e2e test; repo `.csv` | Carried | I1 to step 10, I2 to step 9, I3 to the website security reviewer |
| I4 | Stale mirror preview servers lock `esbuild.exe` | **Closed** | `tooling-setup-log.md:372-384` adds the "stop mirror node processes" step and its PowerShell one-liner before the robocopy. I ran it this round and it found nothing to stop. |

**M1 detail:**
- `controls-behavior.spec.ts:172` now waits with `await expect(page.locator('#shell-overlay-root > *').first()).toBeAttached();` before the `evaluate`, and the `length > 0` assertion is kept (`:183`).
- The developer audited the other specs as asked, and found and fixed the same bug class in `controls-layout.spec.ts:63-68`. `.count()` doesn't auto-wait, and `ScreenController` is mounted by the same lazy `bootstrap()`. The fix waits with `toBeAttached()` before counting. I agree with this finding and fix.
- I re-audited all 11 `page.goto` call sites myself:
  - Every other `evaluate` runs after an auto-waiting locator action (`startRun`, `.click()`, `toBeVisible`), with one exception: `help-flow.spec.ts:36/63` `localStorage.clear()`, which doesn't depend on the DOM.
  - `smoke.spec.ts` uses only auto-retrying assertions.
- **Evidence:** the two `--repeat-each=5` runs in the table above.

## Changes not tied to a finding

None. The whole round-5 diff maps to M1, L1, L2, L5 or I4.

---

## LOW (carry forward; not blocking)

- **L1. Wording slip in `tests/mobile-e2e/help-flow.spec.ts:11-12`.**
  - The header note says Escape "is Help's only non-"Got it" dismissal, and **the test above** already covers it". This sits in the file header, so no test is above it.
  - Fix: change it to "the first test below (`Start -> Help -> Escape -> …`)".
  - Owner: mobile-junior-tester at step 9, when these specs are extended.
- **L2. `scripts/check-android-manifest.mjs:46-49`: an `aapt2` that isn't on PATH crashes with a raw stack trace, and the local procedure never says to set `AAPT2_PATH`** (coding-standards: errors must be actionable).
  - I followed the documented procedure. Both manifest checks died with an unhandled `Error: spawnSync aapt2 ENOENT` and a Node stack dump, and nothing in `tooling-setup-log.md` says to set `AAPT2_PATH`. CI is fine, because `deploy-pages.yml:131-134` exports it.
  - The failure is fail-closed (exit 1), so this is not a security gap. It is a usability and standards gap that will hit mobile-lead-tester and mobile-release-engineer.
  - **Fix, part 1:** in `loadXmltreeText`, catch `err.code === 'ENOENT'`, then print `check-android-manifest: aapt2 not found (tried "<path>"); set AAPT2_PATH to <ANDROID_HOME>/build-tools/36.0.0/aapt2(.exe)`, and exit 2.
  - **Fix, part 2:** add a unit test with a bogus `AAPT2_PATH`.
  - **Fix, part 3:** add `AAPT2_PATH=C:\Users\aaron\Android\sdk\build-tools\36.0.0\aapt2.exe` to the documented local manifest-check step.
  - This was already in the code at round 4. It is reported now because round 5 was the first time the reviewer ran the step.
- **L3. Stale line reference in `tooling-setup-log.md:647`.** It cites the round-4 log as `:552-559`. Because of the round-5 insertions above it, those entries are now at about `:571-578`. Cite the section heading instead of line numbers.

## Suggested (optional)

- **S1 (carried from round-4 L2).** At `help-flow.spec.ts:58` and `:70`, use `await expect.poll(() => snapshotState(page)).toBe('TITLE' | 'PLAYING')` instead of reading the state once, immediately. It passed 440 out of 440 today, but a future async state transition would turn these into flaky gate tests like round-4 M1.

## INFO

- **I1 (new). The mirror refresh copies gitignored Terraform state and provider binaries.**
  - `infra/aws/.terraform/` (704 MB of provider binaries), `terraform.tfstate` and `terraform.tfvars` all land in `C:\Users\aaron\dev-build\shield-vs-robots`. They are ignored by `infra/aws/.gitignore`, but robocopy doesn't read `.gitignore`.
  - A grep of both files finds no secret, password, private key, access key or token names. The state has 7 `sensitive_attributes` blocks. None of it is signing material, so the A9 rule "signing material never enters the mirror" is not broken, and there are still no `.csv` or `.env*` files.
  - Still, the Android build doesn't need any of it, and it's 99% of the refresh size.
  - Recommendation to mobile-it-analyst, with a mention to mobile-security-compliance-reviewer at pass 2: add `.terraform` to `/XD` and `*.tfstate *.tfstate.* terraform.tfvars` to `/XF`, or exclude `infra` altogether.
- **I2 (carried as round-4 I1).** Insets on API 24-29 with WebView ≥ 80: goes to the step-10 device matrix.
- **I3 (carried as round-4 I2).** No e2e behavior test for the swapped layout: goes to mobile-junior-tester at step 9.
- **I4 (carried as round-4 I3).** `terraform-deploy_accessKeys.csv` is in the OneDrive repo copy. It is confirmed absent from the mirror again. Goes to the website security reviewer.

## Conformance summary

| Area | Result |
|---|---|
| One codebase (no per-platform game logic) | PASS. Round 5 touched only tests, the privacy comment and docs. `src/` is unchanged since before round 4. |
| Elapsed-time movement and timers | PASS (unchanged) |
| Touch handlers vs scroll, zoom and select | PASS (unchanged) |
| Background pause, listeners, audio | PASS (unchanged) |
| Back button | PASS (unchanged). The Help-flag regression test is intact. |
| DPR canvas, cutouts, gesture bar | PASS (unchanged). Flex gap is carried as L3 from round 4. |
| Hand edits to generated `android/` files | PASS. `android/app/src` matches the mirror exactly, and `assets/public` comes only from `cap sync`. |
| Release signing contract (§7.5) | PASS. `bundleRelease` refuses with no signing properties, the unsigned CI release builds only with `CI=true` plus the flag, and no signing material is in the mirror. |
| Manifest guard (§10.1) | PASS on both real APKs, and the negative control fails correctly. Usability gap is L2. |
| Security §14.1 / Addendum 1 | PASS. No `.csv` or `.env*` in the mirror; the Terraform copy is I1. The workflow change can merge now that the e2e gate is deterministic. |
| coding-standards | Style PASS. Error handling: L2 (the aapt2 ENOENT message isn't actionable; pre-existing, not a regression). Docs: L1 and L3. Tests PASS: deterministic, and no dead tests. |
| Website build and tests | PASS: typecheck, lint, 418 unit tests and web build in the repo; 418 unit tests in the mirror; mobile e2e 440 out of 440. |

## Commands denied by permissions

None. Every command in the round-4 re-review scope was run by the reviewer:
- repo `typecheck`, `lint`, `test`, `build` and `build:android`
- Playwright `--repeat-each=5`, twice
- the documented mirror refresh
- mirror `npm ci` and `test`, `build:android` and `cap sync android`
- `gradlew assembleDebug`, `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true` and `gradlew bundleRelease`
- `check-android-manifest` on both APKs, plus the negative control

## Session hygiene

- Playwright's `vite preview` servers (port 4174) were stopped by Playwright, and nothing was listening afterwards.
- Every Gradle run used `--no-daemon`, and no java, node or emulator processes were left running.
- No AVD was started.

## Routing

- **Gate:** PASS, so go to step 9, mobile-junior-tester. Its inputs are:
  - carried I3 (the swap-layout e2e test)
  - L1 (header wording) and S1 (`expect.poll`), for when it extends `help-flow.spec.ts`
- **mobile-junior-developer (next time it is in the code, not blocking):** L2, the aapt2 ENOENT message plus its test.
- **mobile-it-analyst:** L2 part 3 (document `AAPT2_PATH` in the local manifest-check step), L3 (the stale line reference), and I1 (exclude `infra/.terraform`, `tfstate` and `tfvars` from the mirror).
- **mobile-security-compliance-reviewer (pass 2):** note I1.
- **Carry-forwards:**
  - L3 and L4 from round 4 to UX round 2 and the step-10 device matrix
  - I2 to step 10
  - I4 to the website security reviewer
