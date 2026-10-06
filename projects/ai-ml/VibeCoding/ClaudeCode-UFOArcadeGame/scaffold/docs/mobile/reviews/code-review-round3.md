# Mobile Code Review, Round 3

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-27
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `e8960b1`. That is the tracked modifications plus these untracked paths: `android/`, `capacitor.config.ts`, `playwright.mobile.config.ts`, `public/`, `scripts/`, `src/core/KeyboardInputSource.ts`, `src/persistence/`, `src/platform/`, `tests/`, and the repo-root `.github/workflows/deploy-pages.yml`.
**Reviewed against:**
- `mobile-architecture.md` v1.3 and M-ADR-0001..0012
- `PRD-mobile.md` v1.4
- `PRD-addendum-v3.md` and `PRD-addendum-v4.md`
- `review-v1b.md`, including Addendum 1
- `tooling-setup-log.md` (round-3 section)
- `code-review-round1.md` and `code-review-round2.md`

**Skills applied:** coding-standards, mobile-touch-and-layout

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: FAIL

Round 3 fixed both round-2 blockers, and I confirmed them myself on `svr_api36_pixel7` (`-gpu host -no-window`, WebView 133) with a debug APK built from a freshly refreshed mirror:
- **Cold start:** the title shows with no Privacy panel.
- **Controls:** ◀ held for 2 s moves the player (screen x ≈ 1103 → 617). THROW spawns a shield and the button switches to the dashed "…" not-ready state. PAUSE opens the pause menu. Quit returns to the launcher.
- **Privacy:** Settings → Privacy opens an opaque panel with Close at the top right. The hardware back key returns to Settings.
- **logcat:** no `net::ERR_*`, `FATAL EXCEPTION`, `AndroidRuntime` or `ClassNotFound` lines.

Also closed:
- ESLint now covers `src/platform/android/**` and keeps the correct bans.
- The test hook's snapshot is a deep-frozen clone.
- Manifest-checker fixtures are nearly complete.
- CI concurrency matches §10.3.
- The Java threading and NPE fixes are in.
- L7 signing-path base is fixed.

It still fails on four items:
- **H1:** the Addendum 1 C3(d) test reads a file outside the project tree. `npm run test` therefore **fails in the build mirror**, and Addendum 1 item 4 ("inline string fixtures only") is still not met. Per item 5, the workflow change cannot merge.
- **H2:** three §7.3.1 evidence rows bound to step 7 by §14 item 6 are still missing or were run on the wrong image.
- **M1:** round 3 edited the shared `src/style.css`, which §6.5 forbids. The change also made every menu button transparent, so the menu underneath shows through Help and Settings buttons on the device.
- **M2:** round-2 H1's required regression test does not exist. The code fix itself is correct.

`mobile-junior-tester` must not start.

## Verification results

| Check | Result |
|---|---|
| `npm run typecheck` | PASS (exit 0) |
| `npm run lint` | PASS (exit 0). `eslint --debug` now lints 13 files under `src/platform/android/`. |
| ESLint rule probes (`--stdin`, no file edits) | Android file: `import.meta`, `innerHTML` and `new Function` are all errors. `src/main.ts`: `navigator.userAgent` and `new Function` are errors, `import.meta` is allowed. `src/core`: `userAgent` is an error. **PASS** |
| `npm run test` (repo) | PASS: 28 files, 414 tests |
| `npm run test` (mirror) | **FAIL:** `check-no-secrets.test.mjs` test (i) ENOENT on `C:\Users\aaron\Cursor-UFOArcadeGame\UFO_Arcade_Game\.env.example` (H1). The other 31 tests in that file pass. |
| `npm run build` (web) | PASS |
| Web `.menu-item` computed style (Playwright, pause menu) | Web still renders `<li>`. Background, color, font and appearance are unchanged, and the selected highlight is kept. **No web visual impact** from the `style.css` edit, but see M1. |
| `npm run check:secrets` (real tree) | PASS, exit 0. The S6 exemption notice for the Cursor `.env.example` is printed. |
| `npm run build:android` + `npm run test:e2e:mobile` | PASS, 36/36. This includes the new behavioral specs: hit-testing, hold-to-move, THROW, PAUSE, and Privacy hidden on cold load. |
| Ad-hoc Playwright probes | Start → Help → Esc → How to play → Got it leaves state `TITLE` (H1 code fix correct). Esc from Privacy returns to Settings and focuses "Privacy policy". Privacy Close is at x 545-624 by default and x 16-95 when swapped; the panel background is `rgb(5,5,10)`. In the swapped layout, `elementFromPoint` hits all four controls. |
| Mirror refresh (recorded robocopy command, run through PowerShell) | Exit 3 (success). **No `.csv`, `.env` or `.env.*` file anywhere in the mirror.** `src/`, `android/app/src/` and `tests/` are byte-identical to the repo. The repo itself still holds `terraform-deploy_accessKeys.csv` (round-1 I2, outside this change). |
| Mirror: `build:android`, `cap sync`, `check-capacitor-config.mjs` | PASS |
| Mirror: `gradlew assembleDebug` / `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true` | First attempt failed with "Unable to delete directory": stale mirror `android/app/build` directories had the ReadOnly attribute (I4, environmental). After clearing the mirror's generated build dirs: BUILD SUCCESSFUL / BUILD SUCCESSFUL. |
| `gradlew bundleRelease` with no signing properties | Refuses correctly ("Refusing to build.") |
| `check-android-manifest.mjs --variant debug` / `--variant release` (real APKs, aapt2 36.0.0) | PASSED / PASSED. Real aapt2 36 prints `=true`/`=false`, which matches the new fixture. |
| `check-android-manifest.mjs --variant relase` | `--variant must be "debug" or "release"`, exit 2. PASS |
| Unsigned release APK `.map` count | 0 |
| `privacy.html` static check (§10.1: no `<script`, no `href="http`) | **1 match:** the literal text `<script>` inside the HTML comment at `public/privacy.html:10` (L1) |
| Emulator API 36 (see Verdict) | PASS for C1, C2 and round-2 M1/M3. It also shows the M1 bleed-through and the L2 glyph mismatch. |

---

## HIGH (must fix)

### H1. Addendum 1 C3(d) test reads a file outside the project, so the suite fails in the build mirror (review-v1b Addendum 1 items 4 and 5; round-2 C3(d))

**Where:** `scripts/check-no-secrets.test.mjs:19-34`. Test (i) does `readFileSync(path.resolve(thisDir, '../../../Cursor-UFOArcadeGame/UFO_Arcade_Game/.env.example'))`.

**Why it matters:**
- Addendum 1 item 4 is binding: "unit-tested with **inline string fixtures only**". Round 2 asked for the Cursor file's text to be inlined verbatim. Reading it from a sibling project's directory is neither.
- It couples this project's unit suite to another project's working copy. In the mirror, which is the only place Android Gradle builds run, the path resolves to `C:\Users\aaron\Cursor-UFOArcadeGame\...` and the test fails with ENOENT. `npm run test` is red there.
- Per Addendum 1 item 5, the `deploy-pages.yml` change is not merged until items 1-4 are implemented.

**Required fix:**
- Replace the file read with a template literal containing the exact current text of `projects/ai-ml/VibeCoding/Cursor-UFOArcadeGame/UFO_Arcade_Game/.env.example`: all 22 lines, comments included, byte-for-byte except line endings.
- Assert `scanEnvTemplate(text)` returns `[]`.
- Remove the `readFileSync`, `fileURLToPath` and `path` imports if nothing else uses them.
- Confirm `npx vitest run scripts/check-no-secrets.test.mjs` passes both in the repo and in the refreshed mirror.
- The real file stays covered in CI by `npm run check:secrets` on the real tree, so nothing is lost.

### H2. §7.3.1 evidence is still incomplete (round-2 H5; §14 item 6; M-ADR-0010)

**Where:** `docs/mobile/tooling-setup-log.md:398-430` (round-3 section).

**Missing or invalid rows:**
1. **"API 36, forced errorPath" is not done.** Lines 424-430 install the `minWebViewVersion: 999` build on **`svr_api24_small`**. That image's WebView (53) is already below the real value of 80, so this proves nothing the existing API 24 row doesn't. The §7.3.1 row is specifically **API 36** (WebView 133) with the 999 build, to prove the error path triggers on a modern WebView.
2. **The mid-image row has no privacy overlay.** Lines 416-423 record only that the API 30 title renders. §7.3.1 requires "Title renders **and the privacy overlay works**" on the mid image.
3. **API 36 "Swap controls" is not shown to work.** Line 407 says only "`Settings` screen confirmed correct". The row requires Swap controls to work. Record that toggling it moves ◀ ▶ to the right and THROW/PAUSE to the left in PLAYING, and that it persists across a relaunch.
4. **logcat per row:** the API 36 bullets don't state the `net::ERR_*` / blocked-load result explicitly. Add one line per image. For API 36 I saw a clean logcat in my own run.

**Required fix:** run rows 1-3 from a refreshed mirror and append the results, with the per-image logcat line, to the tooling log. Keep the repo's `capacitor.config.ts` at `80`.

---

## MEDIUM (must fix)

### M1. The shared `src/style.css` was edited, and transparent menu buttons now show the menu beneath (§6.5 "`src/style.css` is not edited", UX N1 / carry-forward 4, §13 row 4; M3.8)

**Where:** `src/style.css:181-195`. It adds `appearance: none; -webkit-appearance: none; background: transparent; color: inherit; font-family: inherit;` to the shared `.menu-item` rule.

**Problems:**
- **Spec breach.** §6.5 and §13 row 4 make an untouched `src/style.css` a lead-developer diff check. Two comments are now false as well: `src/platform/android/android.css:2-3` ("src/style.css is never edited") and `src/platform/android/screenFit.ts:3-4`. Web impact is nil today, because web still uses `<li>` and I verified the computed styles are unchanged. Even so, the rule belongs in `android.css`.
- **On-device regression (API 36 screenshots).** With `background: transparent`, a shell overlay's buttons no longer cover the title menu beneath them:
  - "Got it" in Help is drawn over the title's "How to play" text.
  - Settings "Close" is drawn over "Settings".
  - "Swap controls: Off" is drawn over "Start".

  The text overlaps inside the primary buttons. The same happens for the selected pause item, whose background is `rgba(…, 0.12)`.

**Required fix:**
- Revert the `src/style.css` hunk so the file matches HEAD.
- In `android.css`, add `html.platform-android .menu-item { appearance: none; -webkit-appearance: none; background: #0b0b14; color: #e8e8f0; font-family: inherit; }`. Any opaque dark fill works. Also add `html.platform-android .menu-item.selected { background: #2a2515; }` or another opaque equivalent of the gold wash.
- Also make the Help and Settings panels themselves opaque, for example `#shell-overlay-root > .screen-overlay { background: #05050a; }`, so no title text shows through them at all.
- Screenshot Help, Settings and Pause on API 36 afterwards.

### M2. No regression test for round-2 H1 (the stale "Help opened from Start" flag) (M8.2, §8.6)

The fix in `AndroidPlatform.ts:112-127, 175-183` and `overlays.ts:153-157` is correct: my Playwright probe of Start → Help → Esc → How to play → Got it ends in `TITLE`. But round 2 required a test for this exact sequence, and none exists. `grep` finds `help-dismiss` only in the `startRun` helper of `controls-behavior.spec.ts`.

**Required fix:** add an e2e test in `tests/mobile-e2e/`:
- Clear `localStorage` first.
- Run Start → Help, close it with `Escape` (and a second variant closing via a shell `overlay-close`, if reachable), then `[data-action="help"]` → `[data-action="help-dismiss"]`.
- Assert `__vvsTest.snapshot().state === 'TITLE'`.
- Also assert the positive path: Start (first launch) → Got it gives `PLAYING`.

---

## LOW (should fix)

- **L1.** `public/privacy.html:10`: the comment contains the literal `<script>`. The §10.1 static check ("`dist-android/privacy.html` contains no `<script`") will match it. Reword to "no script elements".
- **L2.** Glyph copy doesn't match the buttons. The buttons now show `<`, `>`, `THROW` and `II`, but the Help text (`overlays.ts:51`) and `controlHint` (`AndroidPlatform.ts:64`) still say `◀ ▶ … ⏸`. On API 36, those glyphs render in `<p>` text (⏸ as a colour emoji), which also contradicts the log's claim at `tooling-setup-log.md:434-437` that they render as nothing. Make the copy match the buttons, or use the same glyph source for both. mobile-ui-ux-designer rules on the final glyph set at round 2 UX.
- **L3.** `scripts/check-no-secrets.mjs:26`: `Object.freeze(new Set([...]))` does not make the Set immutable (`.add()` still works), so the "frozen" test at `check-no-secrets.test.mjs:120-123` is weaker than it looks. Use a frozen array with `.includes()`, or wrap the Set in a read-only accessor, and test that mutation throws or has no effect.
- **L4.** `scripts/check-android-manifest.test.mjs:302-312`: the `--variant` test re-implements the check inside the test, the same tautology as round-2 C3(e). Export a `validateArgs(args)` that `main()` uses, and test that `'relase'` is rejected. I verified the CLI returns exit 2.
- **L5.** R5 fixture (e), a `FILE_PROVIDER_PATHS` meta-data child, has no **bundletool XML** form. The XML block at `check-android-manifest.test.mjs:224-261` covers grant-uri and (b), (c), (d), (f), (g) only. Add one fixture with `<meta-data android:name="android.support.FILE_PROVIDER_PATHS" …/>` under the allowlisted provider.
- **L6.** Stale comments (coding-standards "docs"):
  - `GameStateMachine.ts:54-56` says `setGameServices` is "Never called by the web build", but `main.ts:39` calls it for both platforms.
  - `GameShell.ts:6-7` says the file never touches a browser API, but `parseWebInsets` reads `window.location`.
  - `android.css` and `screenFit.ts` headers (see M1).
- **L7.** `tooling-setup-log.md:378-385`: the mirror paragraph says "verified the real Cursor `.env.example` still lands in the mirror". It can't: the mirror copies only `scaffold/`, and that file lives in a sibling project. Correct the sentence. The rest of the paragraph, including the exclusions and the "no .csv/.env" confirmation, is accurate; I re-verified it.

## INFO

- **I1.** The ESLint override `src/**/*.test.ts` turns `no-restricted-properties` off for tests, so tests can read `.innerHTML`. Tests don't ship, so this is acceptable. Noted so it isn't widened to non-test globs.
- **I2.** M5 pre-API-30 insets: the API 30 check is in the new dispatch regime, and the API 24 image can't run the app (WebView 53 < 80). The API 24-29 range with WebView ≥ 80 is therefore unverified. Carry it to the step-10 device matrix (for example an API 28 or 29 image with an updated WebView).
- **I3.** The e2e suite still has no swap-layout behavior test. §10.1 lists swap. My probe shows swapped hit-testing works. This is for mobile-junior-tester at step 9.
- **I4.** Mirror builds can fail with "Unable to delete directory … ReadOnly" on stale `android/app/build` output. Add to the documented refresh: clear the mirror's generated `android/build`, `android/app/build` and `android/capacitor-cordova-android-plugins/build` (or `attrib -R /S /D`) before Gradle.
- **I5.** The repo copy of `terraform-deploy_accessKeys.csv` (round-1 I2) is still in the OneDrive `scaffold/`. It is excluded from the mirror and not in scope here, but it still needs the website security reviewer.

---

## Round-2 findings status

| # | Finding | Status | Notes |
|---|---|---|---|
| C1 | `#overlay-root` covers the touch controls | **Closed** | `#overlay-root { pointer-events: none }`, `> .screen-overlay { auto }`, `.touch-layer { z-index: 21 }` placed later in DOM order. Behavioral e2e passes at 4 viewports × 2 inset modes. Verified on the API 36 device. |
| C2 | Privacy overlay always shown | **Closed** | `.privacy-overlay.hidden { display: none }`. The e2e asserts computed `display: none` on cold load. The device shows a clean cold start. |
| C3 | Addendum 1 deviations (a)-(f) | **Partially closed** | (a) CRLF, (b) comment strip, (c) quoted values, (e) `classifyTrackedPath` plus exported set, and (f) injectable reader are all fixed and tested. **(d) is open:** it reads the file from disk instead of inlining it and fails in the mirror (H1). Frozen-Set weakness in L3. |
| H1 | Stale `helpOpenedFromStart` | **Code closed, test open** | The reason-based `onHelpDismissed` is correct (probe verified). The required test is missing (M2). |
| H2 | ESLint skips Android; override gaps | **Closed** | `'/android/'` is anchored. `main.ts` keeps the sink and platform bans. Android keeps the `import.meta` ban. Verified by stdin probes. |
| H3 | Mutable test-hook snapshot | **Closed** | `deepFreeze(structuredClone(world))`, gated on `?e2e=1 && !isNativePlatform()`. |
| H4 | Manifest fixtures incomplete; real config test | **Closed (one fixture short)** | (b), (c), (d), (f), (g) in both forms, the real aapt2-36 boolean form, `activity-alias`, and the real `capacitor.config.ts` §9.2 test are all present. Bundletool (e) is missing (L5). |
| H5 | §7.3.1 evidence | **Partially closed** | API 36 core flow, privacy and Quit recorded. API 30 title and insets recorded. The API 36 forced-errorPath row, mid-image privacy row and Swap confirmation are still missing (H2). |
| M1 | Privacy Close side, opacity, compact, focus | **Closed** | Close at top right by default and top left when swapped. Background `#05050a`. Width about 79 px, height 48. Focus returns to "Privacy policy". Device verified. |
| M2 | CI concurrency | **Closed** | Workflow-level `${{ github.workflow }}-${{ github.ref }}`. `deploy` keeps `group: pages`. |
| M3 | Touch button glyphs | **Closed** | ASCII glyphs visible on the device. Not-ready shows `...` plus a dashed border. Copy mismatch in L2. |
| M4 | `activity-alias`; `--variant` validation | **Closed** | Both implemented. CLI exit 2 verified. Test tautology in L4. |
| M5 | GameShell threading and MainActivity NPE | **Closed** | `volatile` fields, `runOnUiThread` fallback, null-checked `PluginHandle`. Pre-API-30 coverage gap in I2. |
| L1 | Template `ic_launcher_background.xml` | **Closed** | The drawable is removed. The colour resource is `#05050a`. |
| L2 | `webQuitApp` in core | **Closed** | Moved to `WebPlatform`. Core default is a no-op returning `'blocked'`. Stale comment in L6. |
| L3 | `privacy.html` wording | **Closed** | "anonymous gameplay counters kept only on this device". New comment issue in L1. |
| L4 | `setVisible` every frame | **Closed** | Called only on a transition. |
| L5 | `parseWebInsets` NaN | **Closed** | `toFiniteOrZero` |
| L6 | Test probe rAF forever | **Closed** | Log capped at 500. Stops on `visibilitychange` hidden. |
| I1 | Credentials in the mirror | **Closed** | The recorded command has `/XF *.csv .env .env.*`. I re-ran it: no `.csv` or `.env*` in the mirror. Wording issue in L7. |
| R1-L7 (round 1, not re-verified in round 2) | `storeFile` base mismatch | **Closed** | `app/build.gradle:57` now guards `file(storeFile)`, the same resolver used for signing at `:84`. |

## Conformance summary

| Area | Result |
|---|---|
| One codebase (no per-platform game logic) | PASS. Transitions are shared GameCommands. No platform branch in core, systems or persistence. Web quit now lives in `WebPlatform`. |
| Elapsed-time movement and timers | PASS (fixed step; 30-120 Hz and suspend-gap tests) |
| Touch handlers vs scroll, zoom and select | PASS. `touch-action: none`, contextmenu prevented, pointer capture. Input now reaches the controls (device verified). |
| Background pause, listeners, audio | PASS (pause, `visibilitychange`, focus, loop suspend, keep-awake transitions, pointers cleared) |
| Back button | PASS. State table, overlay stack, Privacy → Settings on the device, Esc parity. Regression test missing (M2). |
| DPR canvas, cutouts, gesture bar | PASS (inset `#safe-layer`, DPR backing store capped at 3.2 and re-applied on re-layout, cutout mode) |
| Hand edits to generated `android/` files | PASS. `assets/public` comes only from `cap sync`. The mirror's `android/app/src` is identical to the repo. |
| Shared-file web impact (`src/style.css`, `index.html`, `ScreenController`) | No web visual change (computed styles verified). The `style.css` edit breaks §6.5 (M1). |
| Security binding constraints §14.1 | L2, L4a, L4b, L4c, L5 and N1/R5 PASS. N2/L3 PASS. **N3 / Addendum 1: item 4 not met (H1).** |
| coding-standards | Style PASS. Error handling PASS. Docs: several stale comments (L6, L7). |
| Website build and tests | PASS in the repo (typecheck, lint, 414 tests, build). The CI deploy change must not merge until H1 is fixed (Addendum 1 item 5). |

## Routing

- **Back to mobile-junior-developer:** H1, H2, M1, M2, L1-L7.
- **To the main session:**
  - I4 (mirror refresh step) goes to mobile-it-analyst, to add to the documented refresh.
  - I5 goes to the website security reviewer.
  - I2 and I3 are carry-forwards for steps 9 and 10.
  - L2's final glyph set goes to mobile-ui-ux-designer at round 2 UX.
- **Re-review:** round 4, after the fixes. It needs the test suite green in both the repo and a freshly refreshed mirror, plus the three §7.3.1 rows from H2.
