# Mobile Code Review, Round 2

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-26
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `e8960b1`. That is the tracked modifications plus these untracked paths: `android/`, `capacitor.config.ts`, `playwright.mobile.config.ts`, `public/`, `scripts/`, `src/core/KeyboardInputSource.ts`, `src/persistence/`, `src/platform/`, `tests/`, and the repo-root `.github/workflows/deploy-pages.yml`.
**Reviewed against:**
- `mobile-architecture.md` v1.3 (including §3 A9, §7.5.3 A9, §10.3, §14, §14.1) and M-ADR-0001..0012
- `PRD-mobile.md` v1.4
- `PRD-addendum-v3.md` and `PRD-addendum-v4.md`
- `review-v1b.md`, including Addendum 1
- `tooling-setup-log.md`
- `code-review-round1.md`

**Skills applied:** coding-standards, mobile-touch-and-layout

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: FAIL

A lot of round-1 work landed correctly:
- `#safe-layer` is now a sibling of `#app-root`.
- The layout arithmetic matches §6.3 in both layouts, and the menus are 48 px.
- The manifest checker parses a real tree.
- The icons and splash are real.
- The action SHAs are genuine.
- The unit tests requested in H6 exist.

The Android app is still not playable by touch, though:

1. **Touch controls don't respond.** The empty `#overlay-root` (z-index 21, full-size, `pointer-events: auto`) sits on top of the whole touch layer. ◀, ▶, THROW and PAUSE receive no input at all. I reproduced this in Playwright (`elementFromPoint` returns `overlay-root` at every control's centre) and on the API 36 emulator with `-gpu host`: holding ◀ for 2 s did not move the player, and THROW and PAUSE did nothing.
2. **The Privacy panel is always on screen.** It shows on every screen, including title, Help, gameplay and pause, from cold launch onward, and dims the game. This is the "unresolved emulator observation" in the tooling log. It is **an app bug, not the environment**: a CSS specificity/order error. It reproduces in desktop Chromium and on the emulator with real GPU (`-gpu host`).

In addition, C3 is not implemented exactly as Addendum 1 requires. The S6 scanner has fail-open gaps, including CRLF files, and the required boundary tests are tautological. The Android platform directory is also silently excluded from ESLint.

`mobile-junior-tester` must not start.

## Verification results

| Check | Result |
|---|---|
| `npm run typecheck` | PASS (exit 0) |
| `npm run lint` | PASS (exit 0). But **0 of the files in `src/platform/android/**` are linted** (see H2). With `--no-ignore` they lint clean today. |
| `npm run test` | PASS: 28 files, 385 tests |
| `npm run build` (web), and with `VITE_BASE_PATH=/ahogancamp_portfolio/` | PASS / PASS |
| Web-bundle purity (`@capacitor` or `registerPlugin` in `dist/assets/*.js`) | PASS (no match) |
| F22 banned strings in `dist/*.html` and `dist/assets/*.js` | PASS. Only the source map contains old names, in comments and internal identifiers, which AC12 allows. |
| `npm run check:secrets` (real tree) | PASS, exit 0. Logs "S1 template exemption, content scanned clean: …/Cursor-UFOArcadeGame/UFO_Arcade_Game/.env.example". The implementation deviates from Addendum 1 (C3 below). |
| `check-no-secrets.mjs` outside a git repo (mirror) | Fails closed (git error, exit 1). Correct. |
| `npm run build:android` + `npm run test:e2e:mobile` | 12/12 pass. Touch emulation is really on now (`maxTouchPoints` 1, DPR 2). But the suite only measures boxes, which is why it missed C1 and C2. |
| Mirror `C:\Users\aaron\dev-build\shield-vs-robots` | Refreshed with `robocopy /MIR` (the exclusions in the log), then `npm ci`. `src/` and `android/app/src/main/java` are byte-identical to the repo. |
| Mirror: `build:android`, `cap sync`, `check-capacitor-config.mjs` | PASS |
| Mirror: `gradlew assembleDebug` / `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true` | BUILD SUCCESSFUL / BUILD SUCCESSFUL |
| `check-android-manifest.mjs --variant debug` / `--variant release` (real APKs, aapt2 36.0.0) | PASSED / PASSED |
| Merged release manifest (R5 evidence) | Only `InitializationProvider` (`exported=false`), `ProfileInstallReceiver` (`exported=true`, `permission=android.permission.DUMP`), MainActivity MAIN/LAUNCHER, and permission `io.github.hogy86.shieldvsrobots.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. The unsigned release APK contains 0 `.map` files. |
| Ad-hoc R5 fixtures (a)-(g) in bundletool XML form | All behave correctly. But they are not in the committed tests (H4). |
| Action SHAs (`git ls-remote`) | `setup-java@cf277c60…` is `v4.9.1`. `setup-gradle@ed408507…` is the peeled commit of `v4.4.3`. Both are correct. |
| Emulator API 36 (`svr_api36_pixel7`, `-gpu host`, WebView 133) | Cold start shows the Privacy panel over the title (C2). Start, Help and "Got it" start the run. ◀ (held 2 s), THROW and PAUSE have **no effect** (C1). Back pauses correctly. `edgeInsetsChanged` is delivered (logcat `{"left":51.8,"right":29.7,"top":28.2,"bottom":32}`), so the M2 probe view works on API 36. |

---

## CRITICAL (must fix)

### C1. All touch controls are covered by `#overlay-root` and never receive input (M3.1-M3.6, M3.9; §5.2, §5.3, §6.5)

**Where:**
- `src/platform/android/android.css:43-45`: `#overlay-root { z-index: 21; }`
- `src/style.css:119-126`: `#overlay-root` is `position: absolute; width/height: 100%`
- `android.css:61-65`: `.touch-layer` has no z-index
- `screenFit.ts:56-58`: `#overlay-root`, then `#shell-overlay-root`, then the touch layer are appended to `#safe-layer`

`#overlay-root` stays in the DOM (empty) during PLAYING. It is stacked above the touch layer and intercepts every pointer.

**Evidence:**
- Playwright at 915×412, with and without insets: `document.elementFromPoint(centre)` is `overlay-root` for ◀, ▶, THROW and PAUSE.
- A CDP touch hold on ◀ for 500 ms: player x stays 380 → 380.
- A THROW tap leaves `shields.length` at 0.
- Emulator: identical, and PAUSE does not pause.

**Required fix:**
- Give `#overlay-root` `pointer-events: none` under `html.platform-android`.
- Give `#overlay-root > .screen-overlay` `pointer-events: auto`, so title, pause and end-screen menus stay tappable. Alternatively, toggle `#overlay-root` hidden while it has no children.
- Give `.touch-layer` an explicit z-index. Only the controls are `pointer-events: auto`, so a higher z-index does not block anything.
- Add Playwright assertions that prove input, not just geometry:
  - `elementFromPoint(centre)` is the control itself (or inside it) for every control, at every viewport, with and without insets.
  - Holding ◀ for 500 ms decreases `player.x`.
  - Tapping THROW produces `shields.length === 1`.
  - Tapping PAUSE gives `state === 'PAUSED'`.

### C2. The Privacy overlay is always displayed (M11.4a, §8.7; the unresolved step-7 emulator observation)

**Where:**
- `android.css:117-120`: `.rotate-prompt.hidden, .hidden { display: none; }`
- `android.css:125-133`: `.privacy-overlay { display: flex; … }`

Both selectors have the same specificity, and `.privacy-overlay` comes later, so it wins. Computed style of `screen-overlay privacy-overlay hidden` is `display: flex`.

The result:
- The heading "Privacy policy" and a dead "Close" button are drawn over every screen from cold start, and everything underneath is dimmed.
- The panel inherits `pointer-events: none`, so its Close button looks tappable but does nothing.

I reproduced this in Chromium and on API 36 with `-gpu host`. The tooling-log hypothesis ("software-rendering symptom") is wrong. This is also why the privacy flow was never really checked in round 1 or 2.

**Required fix:**
- Make hidden win regardless of order, for example `.privacy-overlay.hidden { display: none; }`, or scope the rule as `.privacy-overlay:not(.hidden)`.
- Add a Playwright test: on cold load, every `#shell-overlay-root > *` has computed `display: none`. Then run Title → Settings → Privacy policy, the Close button, and back through the §10.1 privacy list.

### C3. Addendum 1 (C3 rule) is not implemented exactly: S6 fails open, and the required tests are missing or tautological (review-v1b Addendum 1 items 2 and 4; §7.5.3 A9)

**Where:** `scripts/check-no-secrets.mjs` and `scripts/check-no-secrets.test.mjs`.

**(a) CRLF files bypass rules (b) and (c) entirely.** At `check-no-secrets.mjs:93` and `:75`, lines are split on `\n` only. `.` in `S6_KEY_VALUE_LINE` (`(.*)$`) does not match `\r`, so every CRLF line fails the regex and is skipped. `scanEnvTemplate('DB_PASSWORD=hunter2\r')` returns `[]`. This repo's working copies are CRLF on the owner's machine (git reports autocrlf conversion), and a template committed with CRLF bytes also bypasses S6 in CI.

**Fix:** split on `/\r?\n/`, or strip `\r` first.

**(b) Comment stripping is narrower than specified.** `:107` uses `/^\s*#\s?/`, which strips only one space after `#`. So `#  API_KEY=abc` (two spaces), `#\t\tX_TOKEN=…`, and indented `  API_KEY=abc` (no `#`) all pass. The rule says "after stripping one leading `#` and whitespace".

**Fix:** `line.replace(/^\s*#?\s*/, '')`, meaning leading whitespace, at most one `#`, then all whitespace.

**(c) Rule (c) skips quoted values.** `:121` checks only `value === unquoted`, so `FOO="<40-char token>"` passes, and test `:65-67` asserts that bypass as intended. Addendum item 2(c) reads "a trimmed unquoted value", the same trim-and-unquote processing as (b). Quoting a secret must not defeat the scan, since the check "fails closed on content".

**Fix:** apply (c) to `unquoted` whether or not quotes were present. Replace the test at `:65-67` with one asserting that the quoted 40-char value fails with S6c. I verified the real Cursor file still passes: its values are short and its paths are under 32 characters.

**(d) Test (i) is not "the current Cursor file".** `test.mjs:10-21` is a paraphrase with different keys and values.

**Fix:** inline the actual file text verbatim (22 lines, no secrets) as the fixture.

**(e) The basename-boundary tests are tautological.** `test.mjs:75-99` re-declares its own `EXEMPT` set and tests that set. They never exercise the script's `S1_TEMPLATE_BASENAMES` or S1's `pathPattern`, and never show that `.env`, `.env.local`, `.env.example.bak`, `foo/.env.production` and `x.pem` "still fail S1".

**Fix:**
- Export a pure classifier, for example `classifyTrackedPath(relPath)`, returning `'s1-fail' | 's6-scan' | 'line-rules' | 'none'`.
- Have `main()` use it.
- Test the listed paths through it.
- Export `S1_TEMPLATE_BASENAMES` (frozen) and assert it has exactly the three names.

**(f) Minor.** The unreadable-file message should follow the documented shape, for example `S6: <path> (unreadable: …)`, which is fine as is. Keep it, and add a test that an unreadable exempt file fails. Injecting a reader function into `main` makes this testable.

Per Addendum 1 item 5, the `deploy-pages.yml` change **must not be merged** until (a)-(e) are fixed.

---

## HIGH (must fix)

### H1. H2 regression path: a stale `helpOpenedFromStart` starts a run from "How to play" (M8.2, §8.6)

**Where:** `AndroidPlatform.ts:106` and `:110-115`. The flag is set on the Start tap and cleared only in the "Got it" callback.

**Repro (Playwright, confirmed):** Start (first launch) → Help → close with back or Esc → "How to play" → "Got it" → `state === 'PLAYING'`.

**Fix:**
- Set `helpOpenedFromStart = false` in the `action === 'help'` branch (`:163`).
- Clear it whenever Help closes other than through "Got it". For example, have `AndroidOverlays.closeTopOverlay()` report which overlay closed, or pass the reason into `showHelp(reason)` and hand it back to `onHelpDismissed(reason)`.
- Add a unit or e2e test for this exact sequence.

### H2. ESLint skips all of `src/platform/android/**`, so the H7 gate does not cover the Android code (§4, §14.1 L4b)

**Where:** `.eslintrc.cjs:95`, `ignorePatterns: [..., 'android', ...]`. This unanchored pattern ignores every directory named `android`, including `src/platform/android/`. `eslint --debug` lints 53 files, 0 of them under `platform/android`. `eslint src/platform/android/AndroidPlatform.ts` prints "File ignored because of a matching ignore pattern".

**Also:**
- `.eslintrc.cjs:105-111` turns **all** of `no-restricted-syntax` off for `src/main.ts`, so `new Function(...)` and `navigator.userAgent` pass there (verified).
- The Android override at `:122-140` re-declares the rule without the `import.meta` ban, so once H2 is fixed, Android files could use `import.meta` (the spec allows it only in `src/main.ts`).

**Fix:**
- Anchor the pattern to the root: `'/android/'`.
- In the `main.ts` override, re-declare `no-restricted-syntax` keeping the `Function` and `userAgent`/`getPlatform` selectors, and drop only the `MetaProperty` one.
- In the Android override, keep the `MetaProperty` ban and drop only the `userAgent`/`getPlatform` selectors.
- Confirm `npm run lint` lists the Android files (for example, with a deliberate throwaway violation that you revert).

### H3. The e2e test hook exposes live, mutable world objects (§10 item 3, §14.1 L4a)

**Where:** `AndroidPlatform.ts:206`, `snapshot: () => Object.freeze({ ...ctx.getWorld() })`. This is a shallow copy. `player`, `shields`, `enemies` and so on are live references. Verified: `__vvsTest.snapshot().player.x = 5` moved the real player to x 5. L4a requires a read-only snapshot of copies only.

**Fix:** return `structuredClone(world)` (or a JSON round-trip) and deep-freeze it. The gate on `?e2e=1 && !isNativePlatform()` is correct. Keep it.

### H4. The manifest-checker fixture set is still incomplete (§10.3 R5 implementation notes; round-1 H5)

**Where:** `scripts/check-android-manifest.test.mjs`. The committed tests cover (a), (e) in aapt2 form only, R1, the MainActivity and DUMP guard, the one bundletool pass case, and R2/R6.

**Missing:**
- R5 (b) template FileProvider
- (c) `exported="true"`
- (d) `grantUriPermissions="true"`
- (f) no `exported` attribute
- (g) unknown provider
- (a)-(g) in **bundletool XML form** (the spec says "both forms")

**Also:**
- The aapt2 fixtures use `(type 0x12)` booleans, while real aapt2 36 prints `=true` / `=false`. Add at least one fixture in the real form, taken from the mirror build's `aapt2 dump xmltree`.
- The §9.2 test asserting that `capacitor.config.ts` itself pins `androidScheme: 'https'` and `hostname: 'localhost'` is still missing. The fixture tests use strings, not the real file. Add a test that reads the real `capacitor.config.ts` through `checkSourceTsText` and asserts both values are present.

I ran (a)-(g) ad hoc, and the checker logic is correct. Only the tests are missing.

### H5. The §7.3.1 no-INTERNET evidence is still incomplete (round-1 H9; §14 item 6)

**Where:** `tooling-setup-log.md` (round-2 section). It states that the mid image (API 30) row and the forced-`errorPath` row were not run, and the API 36 privacy-overlay and Settings/Swap rows were never valid, because of C2.

§14 item 6 binds these rows to step 7, attached to the step-8 review, so they cannot be deferred to step 9 or 10.

**Fix:** after C1 and C2 are fixed, rebuild from a refreshed mirror and record:
- API 36: title, Start, move, throw, pause, Settings → Swap, Settings → Privacy (scrolls, Close and back return to Settings)
- API 36 with the uncommitted `minWebViewVersion: 999` build: `webview-update.html` renders
- `svr_api30_mid` (confirm its WebView ≥ 80): title and privacy overlay
- API 24: `webview-update.html` (already done)

Include `logcat` checks per row.

---

## MEDIUM (must fix)

**M1. Privacy panel Close is on the wrong side, and the panel is not opaque (§8.7, round-1 M9).**
- **Where:** `overlays.ts:78-79` and `android.css:135-145`.
- The header has `h1 { flex: 1 }`, so `justify-content` has no effect. Close renders first, which puts it on the **left** in the default layout (measured x 40-260 at 640×360), and `row-reverse` moves it to the right when swapped. That is the reverse of "THROW-side edge".
- §8.7 also requires background `#05050a`; the panel uses the translucent `.screen-overlay` wash.
- **Fix:** append Close after the heading (or use `order`), and set `.privacy-overlay { background: #05050a; }`. Make Close a compact ≥ 48 dp button. It currently inherits the 220 px-wide `.menu-item`.
- Back from Privacy should also return focus to the "Privacy policy" item (§8.3 A1). Call `.focus()` on close.

**M2. CI concurrency does not match §10.3 (round-1 H4c).**
- **Where:** `deploy-pages.yml:30-35` and `:183-185`.
- The spec says the `deploy` job keeps `concurrency: { group: pages, cancel-in-progress: true }` **unchanged**, and the workflow level becomes `group: ${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true`.
- The implementation puts the workflow/ref group on `deploy` and has no workflow-level block.
- **Fix:** implement it as specified. If you believe the design is wrong, raise it with the architect rather than substituting it in a comment.

**M3. The touch buttons have no visible glyphs (M3.5, M3.9; PRD M3 default scheme "◀ and ▶ … THROW … PAUSE"; §5.3 "icon swap").**
- **Where:** `TouchControls.ts:87-97`. The buttons are empty bordered squares (see the emulator screenshots).
- The player cannot tell ◀ from ▶ from THROW, and the "not ready" state has no icon to swap.
- **Fix:** give each button a visible glyph (`◀`, `▶`, a shield or "THROW" label, `⏸`) via `textContent`, with `aria-hidden` on the glyph span so `aria-label` stays authoritative. Give not-ready a different glyph as well as the dashed border.

**M4. Manifest checker gaps (R5 "any exported component").**
- `check-android-manifest.mjs:224` checks `receiver`, `service` and `activity`, but not `activity-alias`. An exported `activity-alias` passed my fixture.
- `--variant` is not validated, so a typo such as `relase` silently skips R2 and R6 (verified).
- **Fix:** add `activity-alias` (and `provider` exported via the same path), and reject any variant other than `debug` or `release` with exit 2.

**M5. `GameShellPlugin.getEdgeInsets` threading, and a possible NPE in `MainActivity`.**
- `GameShellPlugin.java:100-104` reads `getRootWindowInsets(decorView)` on the plugin thread, and `lastInsets` is written on the UI thread with no synchronization.
- `MainActivity.java:168`: `getBridge().getPlugin("GameShell")` can be null, and `.getInstance()` then NPEs before the null check.
- **Fix:** resolve the fallback via `getActivity().runOnUiThread(...)` (resolve inside it), mark `lastInsets` and `hasDispatchedInsets` `volatile`, and null-check the `PluginHandle`.
- Also verify on `svr_api24_small` or `svr_api30_mid` that the 0×0 probe receives `edgeInsetsChanged`. Before API 30, a sibling consuming insets stops dispatch; I only confirmed API 36.

## LOW (should fix)

- **L1.** `android/app/src/main/res/drawable/ic_launcher_background.xml` is still the Capacitor template (green grid) and is now unused. Delete it.
- **L2.** `webQuitApp` (`window.close()`) still lives in `src/core/GameStateMachine.ts`. The duplication is gone, but round-1 L1 asked to move the web default out of core. This is acceptable if the architect agrees; otherwise move it to `WebPlatform` and have core's default be a no-op.
- **L3.** `public/privacy.html:41-44`: "gameplay counters used to show your own play statistics". `vvs:metrics` counters are never shown to the player. Say "anonymous gameplay counters kept only on this device" (mobile-technical-writer finalizes at step 13).
- **L4.** `AndroidPlatform.onFrame` calls `setVisible(false)` and therefore `clearAllPointers()` every non-PLAYING frame. Only act on a visibility transition. Behavior is correct, but the work is wasted.
- **L5.** `GameShell.ts` `parseWebInsets` produces `NaN` for malformed `?insets=` values. Coerce with `Number.isFinite(...) ? v : 0` (web fallback only).
- **L6.** The test-only probe uses `requestAnimationFrame` forever (`AndroidPlatform.ts` `recordFrame`). Stop it on loop suspend, or cap the log length.

## INFO

- **I1.** The build mirror contains `terraform-deploy_accessKeys.csv` (copied by an earlier refresh; I excluded it from mine). The mirror should never hold credentials. Add `/XF terraform-deploy_accessKeys.csv` (or a general `*.csv`/`.env*` exclude) to the documented refresh command, and delete the copy in the mirror. The original in OneDrive (round-1 I2) still needs the website security reviewer.
- **I2.** `docs/mobile/tooling-requests.md` does not exist. That is fine if no requests are outstanding. The API 30 AVD was installed.
- **I3.** The e2e geometry spec (`controls-layout.spec.ts`) passed while the controls were unusable and the Privacy panel covered the game. Every C1 and C2 test above must assert behavior (hit-testing, state changes, computed `display`), not just rects.

---

## Round-1 findings status

| # | Finding | Status | Notes |
|---|---|---|---|
| C1 | Controls, menus and overlays inside the scaled playfield | **Partially closed** | `#safe-layer` is a `<body>` child; controls are outside `#app-root` and not in the insets; menus are 48 px. **New blocking regression:** controls are covered by `#overlay-root` (C1 round 2). |
| C2 | Swap does nothing; doubled inset; swapped placement | **Closed** | Swapped layout measured: ◀ 496-552, ▶ 560-616, THROW 24-80, PAUSE 28-76, playfield 80-496 (§6.3 numbers). `layout.test.ts` covers both layouts. |
| C3 | Secret check fails CI | **Open (reworked)** | Addendum 1 implemented with deviations (C3 round 2 (a)-(e)). The real tree passes. |
| H1 | Tap-anywhere on VICTORY | **Closed** | `AndroidPlatform.ts` click handler calls `victoryTap` first. Back is a no-op. |
| H2 | How to play → Got it starts a run | **Partially closed** | Direct path fixed. The stale-flag path is still open (H1 round 2). |
| H3 | Manifest checker tree, exact matches, XML, comments | **Closed** (logic) | Verified against real APKs and ad-hoc (a)-(g). `activity-alias` and variant validation gaps (M4). |
| H4 | CI pins, aapt2, concurrency | **Partially closed** | SHAs verified; aapt2 is pinned via sdkmanager. Concurrency does not match the spec (M2). |
| H5 | Checker fixture tests | **Partially closed** | Config checker: done. Manifest: fixtures (b), (c), (d), (f), (g), the bundletool form, and the real-config §9.2 test are missing (H4). Secret-check tests are deficient (C3). |
| H6 | Required unit tests | **Closed** | layout, moveZone, settings (incl. `__proto__`), bestScore/safeStorage fail-closed and write-throw, GameLoop 30/60/90/120 Hz and 10-minute suspend gap, `handleBack`/`pauseForInterruption` tables. |
| H7 | ESLint boundary and sink rules | **Partially closed** | The rules exist and work in `src/core`, `src/ui` and `src/platform/web`. But the Android directory is ignored, and the `main.ts`/Android overrides drop bans (H2 round 2). |
| H8 | Icon and splash template | **Closed** | `#05050a` background, `#2f6fed` vector shield, monochrome layer, regenerated mipmaps, `Theme.SplashScreen`. Template `splash.png` removed. Leftover template `drawable/ic_launcher_background.xml` (L1). |
| H9 | §7.3.1 evidence incomplete | **Open** | Mid, forced-errorPath and privacy rows are not recorded (H5 round 2). |
| M1 | SystemBars insets and cutout mode | **Closed** | `SystemBars.insetsHandling: 'disable'`; `windowLayoutInDisplayCutoutMode=always` on all three themes. |
| M2 | Decor-view insets listener | **Closed** (API 36 verified) | Zero-size probe child; `getRootWindowInsets` fallback. Threading and pre-API-30 check in M5 round 2. |
| M3 | Backing store on re-layout | **Closed** | `onScaleChange` → `setRenderScale` on every re-layout; no `=== 1` short-circuit. |
| M4 | Playwright touch emulation off | **Closed** | `maxTouchPoints` 1, DPR 2. |
| M5 | `__vvsTest` hook | **Partially closed** | Gated correctly, but the snapshot is mutable (H3 round 2). |
| M6 | Boot failures | **Closed** | `.catch`/`.finally` start the loop; the pre-bootstrap failure is logged with context. The limitation is documented. |
| M7 | Resize pause via `pauseForInterruption` | **Closed** | |
| M8 | THROW pointer stick | **Closed** | Capture, `lostpointercapture`, and a clear on hide and on background. |
| M9 | Privacy overlay spec gaps; Esc; Enter under overlay | **Partially closed** | Esc closes the top overlay and keys are swallowed while an overlay is open. `pan-y` is on the panel. Close is on the wrong side and the panel is not opaque (M1 round 2). The overlay is always visible (C2 round 2). |
| M10 | `privacy.html` placeholder | **Mostly closed** | URL correct, contact TBD, metrics mentioned. The wording about showing statistics is inaccurate (L3 round 2). |
| L1 | Dead code | **Mostly closed** | `startNewRun`, `showQuitBlockedFallback` and the template tests are removed. `webQuitApp` is still in core (L2 round 2). |
| L2 | Direction union comment | **Closed** | |
| L3 | `selectPauseOption` range check | **Closed** | |
| L4 | Confirm hint; `<button>` menu items | **Closed** | |
| L5 | `data_extraction_rules` domains | **Closed** | |
| L6 | "Shield Invaders" in `dist/index.html` | **Closed** | |
| L7 | `storeFile` base mismatch | **Not re-verified this round** | No Gradle signing change in the diff. Re-check in round 3. |
| L8 | `.ts` quoted keys | **Closed** | |
| L9 | Duplicate `platform-android` class | **Open (trivial)** | `AndroidPlatform.ts` adds the class and `screenFit.ts` no longer does, so this is effectively closed. No action needed. |

## Conformance summary

| Area | Result |
|---|---|
| One codebase (no per-platform game logic) | PASS. All transitions are shared GameCommands. F20, F21 and F22 are implemented once. No platform branch in core, systems or persistence. |
| Elapsed-time movement and timers | PASS (fixed step; suspend/resume resets; 30-120 Hz test) |
| Touch handlers vs scroll, zoom and select | CSS and native flags PASS. **Input is blocked entirely (C1).** |
| Background pause, listeners, audio | PASS (pause, `visibilitychange`, focus loss, loop suspend, keep-awake cleared, pointers cleared) |
| Back button | PASS for the state table and overlay stack. H1 stale-flag path. |
| DPR canvas, cutouts, gesture bar | PASS (inset layer, DPR backing store capped at 3.2, cutout mode) |
| Hand edits under generated `android/` paths | PASS (`assets/public` only via `cap sync`; mirror verified identical) |
| Security binding constraints §14.1 | L2 PASS. L3/N2 PASS (tests partial, H4). L4a FAIL (H3). L4b FAIL as a gate (H2). L4c PASS. L5 PASS. N1/R5 logic PASS, tests partial. **N3 / Addendum 1 FAIL (C3).** |
| coding-standards | Style PASS. Error handling PASS. Docs PASS, with two comments that contradict the spec (privacy header "THROW-side", concurrency rationale). |
| Website build and tests | PASS locally. The CI deploy must not merge until C3 is fixed (Addendum 1 item 5). |

## Routing

- **Back to mobile-junior-developer:** C1, C2, C3, H1-H5, M1-M5, L1-L6 (L2 needs architect agreement if kept).
- **To the main session:** C2 resolves the "unresolved emulator observation" in `tooling-setup-log.md`: it is an app CSS bug. The M2 concurrency deviation goes to the architect only if the developer wants to keep it. I1 (credentials file in the mirror) goes to mobile-it-analyst.
- **Re-review:** round 3, after the fixes, with API 36 plus mid-image emulator evidence built from a freshly refreshed mirror (§3 A9).
