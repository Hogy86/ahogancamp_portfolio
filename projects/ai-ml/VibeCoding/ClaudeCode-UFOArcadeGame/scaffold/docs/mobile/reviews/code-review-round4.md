# Mobile Code Review, Round 4

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-27
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `e8960b1`. That is the tracked modifications plus the untracked `android/`, `capacitor.config.ts`, `playwright.mobile.config.ts`, `public/`, `scripts/`, `src/core/KeyboardInputSource.ts`, `src/persistence/`, `src/platform/` and `tests/`, and the repo-root `.github/workflows/deploy-pages.yml`.
**Reviewed against:**
- `mobile-architecture.md` v1.3 and M-ADR-0001..0012
- `PRD-mobile.md` v1.4
- `PRD-addendum-v3.md` and `PRD-addendum-v4.md`
- `review-v1b.md`, including Addendum 1
- `tooling-setup-log.md` (round-4 section)
- `code-review-round1.md`, `code-review-round2.md` and `code-review-round3.md`

**Skills applied:** coding-standards, mobile-touch-and-layout

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: FAIL

All four round-3 blockers are closed:
- **H1:** the Cursor `.env.example` fixture is now inlined. I checked it line-by-line against the real file. The suite passes in the refreshed mirror.
- **H2:** the three missing §7.3.1 rows are now recorded in the round-4 section of the tooling log.
- **M1:** `src/style.css` matches HEAD, and the menu fix moved to `android.css`. My probe confirms opaque menus and panels.
- **M2:** the regression test exists.

The unrelated round-4 change is correct. Replacing the `inset` shorthand in `android.css` fixes a real bug on WebView 83, and the built CSS contains no `inset` anywhere. The robocopy `/XD build .gradle` change is also safe (see "Changes not tied to a finding").

The round fails on one new item:
- **M1:** the cold-load Privacy spec, which gates CI, has a race. It failed in 2 of my 4 full suite runs. `deploy-pages.yml` runs `test:e2e:mobile` with no retries, and `deploy` needs `mobile-e2e`. The website deploy would therefore be blocked about half the time, which breaks the one-codebase CI rule.

The fix is one line. Everything else is LOW and can carry forward.

**Not independently verified this round:** the Android Gradle builds from the mirror, meaning `assembleDebug`, the unsigned CI `assembleRelease`, the `bundleRelease` refusal, and `check-android-manifest` on real APKs. The permission classifier blocked the command in the reviewer session. The junior developer's log (`tooling-setup-log.md:552-559`) records BUILD SUCCESSFUL for both builds and PASSED for both manifest checks. Round 5 PASS needs these re-run by the reviewer, or run by the main session with the output attached.

`mobile-junior-tester` must not start.

## Verification results

| Check | Result |
|---|---|
| `npm run typecheck` | PASS (exit 0) |
| `npm run lint` | PASS (exit 0) |
| `npm run test` (repo) | PASS: 28 files, 418 tests |
| `npm run build` (web) | PASS |
| `src/style.css` vs HEAD | No diff (round-3 M1 revert confirmed) |
| `npm run build:android`: grep of the built CSS | No `inset` in any `dist-android/assets/*.css`. `#shell-overlay-root` and `.touch-layer` compile to `top:0;left:0;width:100%;height:100%`. |
| `npm run test:e2e:mobile`, 4 full runs | 44 passed / 44 passed / 43 + 1 failed / 43 + 1 failed. Each failure was `controls-behavior.spec.ts:177` `computedDisplays.length > 0`, received 0, at the 640x360 viewport (M1 below). 4 tests are always skipped (L2). |
| Playwright probe of Android bundle computed styles (800x360) | Title, Settings and Pause `.menu-item`: `rgb(11,11,20)`, `appearance: none`. Selected pause item: `rgb(42,37,21)`. Help and Settings panels: `rgb(5,5,10)`. `#shell-overlay-root` is 800x360. **Round-3 M1 closed.** |
| Mirror refresh, run exactly as documented (Remove-Item clears, then robocopy through PowerShell) | Exit 3 (success). **No `.csv`, `.env` or `.env.*` anywhere in the mirror** outside `node_modules`. The only `build`/`.gradle` directory left is the mirror's own `android\.gradle`, which is expected because `/XD` keeps excluded destination directories. |
| Mirror parity | `src`, `tests`, `scripts`, `public`, `android/app/src`, `android/app/build.gradle`, `package.json`, `package-lock.json` and `capacitor.config.ts` are byte-identical to the repo. `minWebViewVersion: 80` in both. |
| `npm run test` (mirror, after `npm ci`) | PASS: 28 files, 418 tests (round-3 H1 closed) |
| Mirror `build:android`, `cap sync`, `gradlew assembleDebug`, unsigned `assembleRelease`, `bundleRelease` refusal, manifest check | **Not run by the reviewer:** permission denied in this session (see Verdict). Junior log: PASS. |
| `grep -c "<script" public/privacy.html` | **1** (L1: the round-3 L1 fix brought the match back) |
| Dependency on newer Chromium in `dist-android` (target es2020) | No `??=`, `\|\|=`, `&&=`, `replaceAll`, `.at(` or `Object.hasOwn`. `structuredClone` appears once, only on the `?e2e=1 && !isNativePlatform()` test-hook path, so it is never reached on a device. Flex `gap` appears 3 times (L3). |

---

## MEDIUM (must fix)

### M1. The cold-load Privacy e2e spec races the lazy Android platform mount, so the CI job that gates the website deploy fails intermittently (one-codebase CI rule; §10.1; coding-standards)

**Where:** `tests/mobile-e2e/controls-behavior.spec.ts:165-178`.

```ts
await page.goto('/?e2e=1');
const computedDisplays = await page.evaluate(() =>
  Array.from(document.querySelectorAll('#shell-overlay-root > *')).map(...));
expect(computedDisplays.length).toBeGreaterThan(0);
```

**Problem:**
- `page.goto` resolves on `load`, but the shell overlays are mounted by the dynamically imported `AndroidPlatform` chunk. The `evaluate` sometimes runs before they exist.
- I saw `length` 0 at 640x360 in 2 of 4 full runs.
- `.github/workflows/deploy-pages.yml:158-183` runs this suite with no `retries`, and `deploy` has `needs: [build, android-build, mobile-e2e]`. A flaky gate blocks the website deploy for reasons unrelated to any change, and trains people to re-run failures instead of reading them.

**Required fix:**
- Before the `evaluate`, wait for the mount, for example:
  ```ts
  await expect(page.locator('#shell-overlay-root > *').first()).toBeAttached();
  ```
  Alternatively, wrap the whole check in `expect.poll(...)`.
- Keep the `length > 0` assertion.
- Check the other specs for the same "evaluate right after goto" pattern and add the same wait where needed. `help-flow.spec.ts` is safe, because every evaluate follows an auto-waiting locator action.
- Evidence: run `npx playwright test -c playwright.mobile.config.ts --repeat-each=5` and record 0 failures in the tooling log.
- Do **not** fix this by adding `retries`.

---

## LOW (carry forward; fix when convenient, not blocking)

- **L1. `public/privacy.html:17-20`: the round-3 L1 fix reintroduced the match.** The new comment explaining the rule contains the literal `"<script"` at line 19, so `grep -c "<script"` still returns 1. Reword it, for example: "the §10.1 static check greps for the opening script tag text anywhere in this file". Confirm with `grep -c "<script" public/privacy.html` = 0. mobile-technical-writer owns this file at step 13 and must keep it that way.
- **L2. `tests/mobile-e2e/help-flow.spec.ts:55-77` is a permanently skipped test.** Help has no `overlay-close` control, so the `test.skip()` branch always runs. That produces the 4 skips per run, one per viewport, and the test is dead code. Delete it and note in the file header that Escape is Help's only non-"Got it" dismissal. Suggested, not required: at lines 52 and 88, use `await expect.poll(() => snapshotState(page)).toBe(...)` instead of a single immediate read, so a future async transition can't make these tests flaky too.
- **L3. Flex `gap` needs Chromium 84, but the minimum WebView is 80.**
  - Where: shared `src/style.css:140` (`.screen-overlay`, 12px) and `:178` (menu list, 8px), and `android.css:241` (`.privacy-header`, 12px).
  - Effect on WebView 80-83: the 48px menu buttons stack with no space between them, and the privacy header loses its spacing. The app still works, as the API 30 / WebView 83 evidence shows, but adjacent touch targets touching is a mobile-touch-and-layout concern.
  - Owner: mobile-ui-ux-designer at round 2 UX, plus the step-10 device matrix.
  - Possible fix, in `android.css` only: `html.platform-android .menu-list > * + * { margin-top: 8px }`, with `gap: 0` in the same scoped rule so newer WebViews don't get double spacing.
- **L4. `tooling-setup-log.md:497-498` points to the wrong document.** It says "See `docs/mobile/reviews/code-review-round4.md` for the device screenshots". This review contains no screenshots, and the reviewer doesn't produce evidence for the writer. Also, round-3 M1 asked for Help, Settings and Pause screenshots on API 36 after the fix. The round-4 log records re-checking the cold title and controls on API 36, but not those three screens. Record them in the tooling log; step 10 or UX round 2 may pick this up. My computed-style probe already confirms the CSS result, so this item is evidence only.
- **L5. Latent risk in the robocopy `/XD build`.** The pattern excludes every directory named `build` anywhere in `scaffold/`. Today the only ones are `android/build` and `android/app/build`; I confirmed that with `find`. A future source directory named `build`, such as `scripts/build/`, would be silently left out of the mirror. Add one sentence to the tooling log saying so, so whoever adds such a directory knows to change the pattern.

## INFO

- **I1 (carried).** API 24-29 with WebView ≥ 80 has not been checked for insets. This goes to the step-10 device matrix.
- **I2 (carried).** There is no e2e behavior test for the swapped layout. Round 4 did record API 36 on-device swap evidence. This goes to mobile-junior-tester at step 9.
- **I3 (carried).** `terraform-deploy_accessKeys.csv` is still in the OneDrive repo copy. It is confirmed absent from the mirror. This goes to the website security reviewer.
- **I4.** Stale `vite preview` processes left running from the mirror (ports 4181/4182, from an earlier session) locked `node_modules\@esbuild\win32-x64\esbuild.exe`, so `npm ci` failed in the mirror. The reviewer stopped them. Suggested addition to the documented refresh, alongside the build-dir clears: stop any node process whose command line references `dev-build\shield-vs-robots` before `npm ci`. Session hygiene: after a run, shut down any preview servers the session started.

---

## Changes not tied to a finding

| Change | Assessment |
|---|---|
| `android.css:90-115, 121-137`: `inset: 0` replaced by `top/left/width/height` (the "code-review-round4" marker) | **Correct and needed.** `inset` requires Chromium 87, and the minimum WebView is 80. The comment explains why the `right`/`bottom` longhand was not used: the minifier re-collapses it into `inset`. I confirmed that in the built CSS. On the Android layout, `width/height: 100%` of `#safe-layer` gives the same box as `inset: 0`, because `#safe-layer` is a positioned, fixed containing block with no padding. `#safe-layer` and `.privacy-overlay` don't use the shorthand. The API 36 cold title and controls were re-verified in the junior log, and my probe shows `#shell-overlay-root` is 800x360. |
| Robocopy `/XD` changed from `"android\build" "android\app\build" "android\.gradle"` to `build .gradle` (`tooling-setup-log.md:370-432`) | **Correct.** The round-3 multi-segment patterns matched nothing. In the repo, `find` shows the only `build`/`.gradle` directories outside `node_modules` are `android/.gradle`, `android/app/build` and `android/build`, all generated Gradle output, so no needed source is skipped. `android/gradle/` (the wrapper) is named `gradle`, not `.gradle`, so it is still copied. Mirror parity is byte-identical for every source path I checked. The pre-refresh `Remove-Item` clears are needed because `/MIR` doesn't purge destination directories that `/XD` excludes, and they cover `capacitor-cordova-android-plugins\build`. Latent-risk note in L5. |
| `check-no-secrets.mjs:23-31`: Set changed to a frozen array | Round-3 L3 fix. Correct. The test asserts `push` throws `TypeError` in strict ESM. |

## Round-3 findings status

| # | Finding | Status | Notes |
|---|---|---|---|
| H1 | C3(d) test read a file outside the project; mirror suite red | **Closed** | `check-no-secrets.test.mjs:16-44` is an inline template literal, identical to the real Cursor `.env.example`, all 22 lines. No `readFileSync`, `path` or `fileURLToPath` imports. Mirror: 418/418. |
| H2 | §7.3.1 rows missing | **Closed** | Log `:508-517`: API 36 forced errorPath with the 999 build in the mirror only; repo keeps `80`, confirmed. Log `:518-524`: API 30 privacy overlay with logcat line. Log `:545-551`: API 36 swap works and persists after a cold relaunch. |
| M1 | `src/style.css` edited; transparent menu buttons | **Closed** | `style.css` has no diff against HEAD. `android.css:42-64` adds opaque `.menu-item`, `.selected` and shell-overlay panel rules. Verified by computed-style probe. Screenshot evidence gap in L4. |
| M2 | No regression test for the stale Help flag | **Closed** | `help-flow.spec.ts:25-53` (negative path) and `:79-89` (positive path). Passes at all 4 viewports. The dead skip variant is L2. |
| L1 | `<script>` literal in the privacy.html comment | **Open (regressed)** | Line 10 is fixed, but the new comment at line 19 contains `"<script"` (L1 above). |
| L2 | Glyph copy mismatch | **Closed** | `overlays.ts:55` and `AndroidPlatform.ts:66` use `< > … THROW … II`, matching `TouchControls.ts:81-124`. The final glyph set is still for UX round 2. |
| L3 | Frozen Set not immutable | **Closed** | Frozen array with `.includes()`. Mutation-throws test at `check-no-secrets.test.mjs:140-147`. |
| L4 | `--variant` test tautology | **Closed** | `validateArgs` is exported and used by `main()` (`check-android-manifest.mjs:290-305`). Tested with `relase`, valid variants, and a missing apk. |
| L5 | Bundletool XML fixture (e) missing | **Closed** | `check-android-manifest.test.mjs:229-235` |
| L6 | Stale comments | **Closed** | `GameStateMachine.ts:52-57`, `GameShell.ts:7`, and the `android.css`/`screenFit.ts` headers are now accurate, because `style.css` really is unedited again. |
| L7 | Mirror `.env.example` wording | **Closed** | `tooling-setup-log.md:423-430` |
| I1 | ESLint test override | Unchanged (acceptable) | — |
| I2 | Pre-API-30 insets gap | Carried | INFO I1 |
| I3 | No swap e2e test | Carried | INFO I2. On-device swap evidence is now recorded. |
| I4 | Mirror ReadOnly build dirs | **Closed** | Clear step plus the corrected `/XD` are documented and worked in my refresh. Related new process-lock note in INFO I4. |
| I5 | Repo `.csv` credentials | Carried | INFO I3 |

## Conformance summary

| Area | Result |
|---|---|
| One codebase (no per-platform game logic) | PASS. Round-4 changes are only Android CSS, scripts, tests and docs. `src/style.css` is untouched. |
| Elapsed-time movement and timers | PASS (unchanged since round 3) |
| Touch handlers vs scroll, zoom and select | PASS (unchanged) |
| Background pause, listeners, audio | PASS (unchanged) |
| Back button | PASS. Esc and back parity. Help-flag regression test now present. |
| DPR canvas, cutouts, gesture bar | PASS. The `inset` fix restores a full-size shell overlay on WebView 80-86. Flex-gap spacing on 80-83 is L3. |
| Hand edits to generated `android/` files | PASS. Mirror `android/app/src` is identical to the repo. `assets/public` comes only from `cap sync`. |
| Shared-file web impact | PASS. `style.css` is at HEAD, and `android.css` is only in the Android chunk. |
| Security §14.1 / Addendum 1 | PASS. Item 4 is met (inline fixtures only). Item 5: the workflow change can merge once M1 is fixed. No `.csv` or `.env*` in the mirror. |
| coding-standards | Style PASS. Error handling PASS. Docs: L1 and L4. Tests: one flaky spec (M1) and one dead test (L2). |
| Website build and tests | PASS: typecheck, lint, 418 unit tests and build in both the repo and the mirror. **The mobile e2e CI gate is flaky (M1).** |

## Routing

- **Back to mobile-junior-developer:** M1 (required). L1, L2 and L5 are optional this round and cheap.
- **To the main session:**
  - Give the round-5 reviewer permission for the mirror Gradle commands (`build:android`, `cap sync`, `gradlew assembleDebug`/`assembleRelease`/`bundleRelease`, manifest check), or run them and attach the output.
  - Route INFO I4 (stop stale mirror preview servers before `npm ci`) to mobile-it-analyst for the documented refresh.
- **Carry-forwards:**
  - L3 to mobile-ui-ux-designer (round 2) and the step-10 device matrix.
  - L4 screenshots to step 10 or UX round 2.
  - INFO I1 to step 10.
  - INFO I2 to step 9.
  - INFO I3 to the website security reviewer.
- **Re-review:** round 5 is scoped to M1 plus reviewer-run Android builds. PASS needs:
  - `--repeat-each=5` of the mobile e2e suite with 0 failures.
  - Mirror `npm run test` green.
  - Reviewer-verified `assembleDebug` and unsigned `assembleRelease`, the `bundleRelease` refusal, and manifest checks.
