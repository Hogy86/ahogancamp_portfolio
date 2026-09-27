# Mobile Code Review — Round 1

**Stage:** Mobile Pipeline Step 8 — mobile-lead-developer (independent review)
**Date:** 2026-09-26
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `e8960b1`. That is 20 modified tracked files plus these untracked paths: `android/`, `capacitor.config.ts`, `playwright.mobile.config.ts`, `public/`, `scripts/`, `src/core/KeyboardInputSource.ts`, `src/persistence/`, `src/platform/`, `tests/`, and the repo-root `.github/workflows/deploy-pages.yml`.
**Reviewed against:**
- `docs/mobile/architecture/mobile-architecture.md` v1.2 (§14, §14.1) and M-ADR-0001..0012
- `docs/mobile/PRD-mobile.md` v1.4
- `docs/PRD-addendum-v3.md` (F20) and `docs/PRD-addendum-v4.md` (F21, F22)
- `docs/mobile/security/review-v1b.md` (C2, C3, N1-N5)
- `docs/mobile/tooling-setup-log.md` (step-7 evidence)

**Skills applied:** coding-standards, mobile-touch-and-layout

> Transcription note: the reviewer is read-only by design, so the main session wrote this
> file verbatim from the reviewer's returned content.

## Verdict: FAIL

The shared refactor is well structured and the web build is intact:
- `InputSource`/`KeyboardInputSource` and the injected `InputManager` are clean.
- GameCommands, `suspend()`/`resume()`, F20, F21 and F22 are in place.
- The web bundle contains no Capacitor code.
- The signing contract fails closed as specified.

The Android layer does not meet its core layout requirements. The on-screen touch controls, all menus and all shell overlays render **inside the scaled playfield**:
- The controls are about 35 dp, and they cover the playfield and the HUD.
- The menu targets are 21-24 px.
- "Swap controls" does nothing.

I reproduced this in Playwright and on the API 36 emulator.

Separately, several binding security and CI constraints from §14.1 and review-v1b C2/C3 are missing or incomplete, and CI as written would fail. `mobile-junior-tester` must not start.

## Verification results

| Check | Result |
|---|---|
| `npm run typecheck` | PASS (exit 0) |
| `npm run lint` | PASS (exit 0, 0 warnings). But the required rules are missing; see H7. |
| `npm run test` | PASS: 20 files, 268 tests |
| `npm run build` (web) | PASS. `VITE_BASE_PATH=/ahogancamp_portfolio/` build also PASS. |
| Web-bundle purity (`@capacitor`/`registerPlugin` in `dist/assets/*.js`) | PASS: no match |
| Web source maps kept / `dist-android` has no `*.map` (L2) | PASS / PASS. The unsigned release APK also has no `.map`. |
| F22 banned-string scan of `dist/` | JS clean. `dist/index.html` still contains "Shield Invaders" inside an HTML comment (L6). |
| `npm run build:android` + `npx cap sync android` | PASS |
| `node scripts/check-capacitor-config.mjs` | PASS on the real config (it has no fixture tests; see H5) |
| `gradlew assembleDebug` inside the OneDrive repo | **FAIL (environmental):** `Cannot snapshot …assets/public/assets/AndroidPlatform-*.js: not a regular file`. OneDrive converts fresh outputs into cloud reparse points. See I1. |
| `gradlew assembleDebug` on an identical copy outside OneDrive | PASS (BUILD SUCCESSFUL) |
| `check-android-manifest.mjs --variant debug` (debug APK) | PASS |
| `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true` + checker `--variant release` | PASS / PASS |
| `gradlew bundleRelease` with no signing properties | Correctly refuses: "Release signing not configured … Refusing to build." |
| `-PvvsCiUnsignedRelease=true` without `CI=true` | Correctly refuses |
| Path guard: `signing.properties` inside a git top-level (fixture) | Correctly rejected |
| Merged manifest (N1 confirmation) | Providers: only `androidx.startup.InitializationProvider`, `exported=false`. Receiver: `androidx.profileinstaller.ProfileInstallReceiver`. Permissions: only `io.github.hogy86.shieldvsrobots.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. Matches A8 exactly. |
| `npm run check:secrets` | **FAIL:** S1 on `projects/ai-ml/VibeCoding/Cursor-UFOArcadeGame/UFO_Arcade_Game/.env.example`. The junior developer reported this and correctly did not self-exempt it. See C3. |
| `npm run test:e2e:mobile` | 4/4 pass. But touch emulation is not actually on (M4) and the suite is a single smoke test. |
| Emulator (API 36, `svr_api36_pixel7`, my debug build) | Title renders in landscape. Help overlay and level 1 render. **Controls mis-placed (C1).** Screenshots are in my scratchpad; the main session can re-capture with the same steps. |

---

## CRITICAL (must fix)

### C1. Touch controls, menus and shell overlays are inside the scaled playfield (M2.4, M3.1, M3.2, M3.8, M2.6; §6.5)

**Where:** `src/platform/android/screenFit.ts:139-144`, together with `src/platform/android/android.css:27-30`.

**Cause:** `this.overlayRoot.replaceWith(this.safeLayer)` puts `#safe-layer` where `#overlay-root` was, which is **inside `#app-root`**. `screenFit.ts:191` then gives `#app-root` a `transform: scale(s)`. A `position: fixed` element under a transformed ancestor is positioned and scaled relative to that ancestor. As a result the touch layer, the title/pause/Game Over menus, Help, Settings, Privacy and RotatePrompt are all scaled by `s` and clipped to the playfield rectangle.

§6.5 requires: "`#overlay-root` moves … out of `#app-root` into a full-viewport `#safe-layer` that is inset by the edge insets and **not scaled**."

**Measured (Playwright, 640×360, `?insets=24,24,0,24`, playfield x 144-560):**

| Control | Rect (x0, y0, x1, y1) | Size | Required |
|---|---|---|---|
| ◀ | 169, 158, 198, 187 | ≈ 29 dp | ≥ 56 dp |
| ▶ | 202, 158, 231, 187 | ≈ 29 dp | ≥ 56 dp |
| THROW | 506, 282, 535, 312 | ≈ 29 dp | ≥ 56 dp |
| PAUSE | 510, 20, 535, 45 | ≈ 25 dp | ≥ 48 dp |

- All four controls lie inside the playfield, and ◀ ▶ sit mid-height rather than bottom-aligned.
- Title menu items are 21-23 px tall, where M3.8 requires ≥ 48.

**On the emulator (Pixel 7, API 36):**
- ◀ ▶ float in the middle of the playfield.
- THROW sits inside the playfield.
- PAUSE overlaps the "Power ×1.00" HUD panel.
- The F9 control-text box covers ShieldMan's row.
- The Help overlay and title menu are boxed inside the playfield.

**Required fix:**
1. Create `#safe-layer` as a direct child of `<body>`, a sibling of `#app-root`, never a descendant of it. Move `#overlay-root` into it once.
2. Put the touch layer in a layer that is not inset by the edge insets. Either make it a separate full-viewport sibling, or position the controls in `#safe-layer`-relative coordinates. `computeLayout` already returns viewport coordinates (`moveOuterX = insets.left` and so on), so today the offset is counted twice (see C2).
3. Add `html.platform-android .menu-item { min-height: 48px; }` and make every menu or shell button ≥ 48 dp (M3.8).
4. Add a Playwright assertion at every §10.1 viewport, with and without `?insets=24,24,0,24`. Assert that ◀/▶/THROW ≥ 56 (64 where §6.4 says so), PAUSE ≥ 48, no control rect intersects the `#app-root` rect, no control lies inside the insets, and menu items are ≥ 48 px.

### C2. "Swap controls" has no visual effect, the inset offset is doubled, and swapped playfield placement is wrong (M3.13, M2.3a, M2.4, M2.12; §6.2)

**Where:**
- `android.css:77-104`: `.move-zone` always uses `left:`, and `.touch-button--throw`/`--pause` always use `right:`.
- `.touch-layer--swapped` (toggled at `TouchControls.ts:103`) has **no CSS rule**.
- `layout.ts:72`: `playfieldX = movCol + (availW − pfW)/2` is not mirrored when `swapControls` is true.
- The controls are offset by `--vvs-move-outer-x`/`--vvs-throw-outer-x` (the inset) inside `#safe-layer`, which is already inset by the same amount.

**Measured:** with swap On, the probe returns rects identical to swap Off (◀ still at x 169).

**Required fix:**
- Mirror in `computeLayout`: when swapped, `playfieldX = throwCol + (availW − pfW)/2`.
- Return absolute x for ◀, ▶, THROW and PAUSE (PAUSE centred in THROW's B-wide lane, top at `t + 16`). Have `applyLayout` set `left`/`top` for each control from those values, and drop the side-dependent `left:`/`right:` CSS.
- Bottom-align all three row buttons at `H − max(b, 16)`. Today THROW uses `bottom: 0` of the inset layer while ◀ ▶ use `controlRowY`.
- Add `layout.test.ts` (see H6) asserting the §6.3 table for both layouts: 24 / 56 / 8 / 56 / 416 / 56 / 24 = 640, s = 0.52, playfield x 144-560 default and 80-496 swapped.

### C3. CI `build` job fails on the secret check, which blocks the website deploy (C4, §14.1 N3)

**Where:** `scripts/check-no-secrets.mjs:21` (S1) run against `projects/ai-ml/VibeCoding/Cursor-UFOArcadeGame/UFO_Arcade_Game/.env.example`.

The junior developer handled this correctly: stopped, reported, and added no exclusion, as N3 requires. But with this workflow, every push to master fails `build`, and the website stops deploying.

**Required action (not a junior-developer code change):** the main session routes this to mobile-security-compliance-reviewer for a decision. The options are to rename or remove that file in the Cursor project, or to approve a documented, reviewed exclusion. The main session must not merge the workflow change until that decision is implemented.

---

## HIGH (must fix)

### H1. No touch path for Game Complete "tap anywhere" (F19 AC9 platform mapping, PRD-mobile §3; §5.4 `victoryTap`)

`victoryTap` is never called from `src/platform/android/**`. The delegated click in `AndroidPlatform.ts:122-147` handles only `data-action` targets.

**Required fix:** when `world.state === 'VICTORY'`, a tap anywhere on the game surface (not only on `data-action` items) calls `victoryTap(world)`. Back must stay a silent no-op; it already is.

### H2. "How to play" → "Got it" starts a run (M8.2, M5 Help row, §8.6)

**Where:** `overlays.ts:160-166`. `help-dismiss` always calls `onHelpDismissed()`, which is wired to `startRunFromTitle` in `AndroidPlatform.ts:101`. The probe confirmed this: after reopening Help from the title and tapping "Got it", the game is PLAYING.

**Required fix:** record whether Help was opened by the first-launch Start path, and call `startRun()` only in that case. "How to play" → "Got it" just closes the overlay and returns to the title.

### H3. The manifest checker misses A8/R5 defense-in-depth rules and has an unsafe R1 match (review-v1b C2 / N1; §10.3 R5)

**Where:** `scripts/check-android-manifest.mjs`.

**(a) Missing child checks (lines 47-69, 122-146).** The parser flattens elements with no parent/child tracking. So the required "`<grant-uri-permission>` child" and "`android.support.FILE_PROVIDER_PATHS` `<meta-data>`" checks do not exist. Fixture test: the real debug manifest with a `FILE_PROVIDER_PATHS` meta-data and a `<grant-uri-permission>` added under `androidx.startup.InitializationProvider` → **PASSED**. It must fail.

**(b) R1 suffix match (line 95).** `name.endsWith('DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION')` accepts any package's permission. A fixture with `com.evil.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` → **PASSED**. Match exactly `${package}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`, using the manifest `package` attribute.

**(c) `--manifest-xml` cannot parse real XML.** Step 15 feeds it real XML from `bundletool dump manifest`, but the code only parses aapt2 `E:`/`A:` text. A compliant bundletool-style XML → **FAILED** with R3/R4 "not explicitly false" and R7 "minSdkVersion is NaN". This fails closed, but it would block every release.

**(d) Exact class names.** MainActivity is matched with `endsWith('MainActivity')` (line 151) instead of the exact `${package}.MainActivity`. The MAIN/LAUNCHER filter and `ProfileInstallReceiver`'s `android:permission="android.permission.DUMP"` guard are not verified.

**Required fix:**
- Track element depth so each child is attributed to its `<provider>`/`<activity>`.
- Implement the grant-uri and FILE_PROVIDER_PATHS checks so they fire even on the allowlisted name.
- Use an exact permission and class match.
- Add a real XML parser path for `--manifest-xml`, with booleans read as `"true"`/`"false"`.
- Add comments on the two allowlist constants citing §10.3 and review-v1b N1 / review-v1 L1 (the R5 implementation notes require this).
- Add the fixture tests in H5.

### H4. CI is incomplete or would fail (§10.3, L5, M3)

**Where:** `.github/workflows/deploy-pages.yml`.

**(a) L5 (binding):** `actions/setup-java@v4` (line 102) and `gradle/actions/setup-gradle@v4` (line 113) must be pinned to full 40-hex commit SHAs, each with a `# v4.x.y` comment.

**(b) aapt2 not on PATH:** the manifest-check steps (lines 127-128, 136-137) call `aapt2` from PATH, which ubuntu-latest does not provide, so the job fails. Set `AAPT2_PATH` to `$ANDROID_HOME/build-tools/<installed version>/aapt2`, resolving the version deterministically (for example pin `build-tools;36.0.0` via `sdkmanager`, or select the highest installed version).

**(c) Missing deploy concurrency (M3, §10.3):** the old workflow-level `concurrency: { group: pages, cancel-in-progress: true }` must move onto the `deploy` job. It was dropped.

### H5. Required checker fixture tests are missing (§14.1 N2, §10.3 R5 notes, §9.2)

There are no tests for:
- `check-capacitor-config.mjs` ("Unit-test each rule with a failing fixture", rules 1-7 on both the `.ts` and the generated `.json`, including a missing scheme or hostname in the JSON)
- `check-android-manifest.mjs` fixtures (a)-(g) in both aapt2 and bundletool forms
- the §9.2 unit test asserting that `capacitor.config.ts` pins `androidScheme: 'https'` and `hostname: 'localhost'`

**Required fix:** refactor both scripts so their check functions are exported and the CLI `main()` is guarded. Add Vitest tests, and widen `vitest.config.ts` `include` to cover `scripts/**/*.test.mjs` or `tests/unit/**`. These tests run in CI's `npm run test`.

### H6. The unit tests the build order binds to the developer are missing (§14 items 1, 4; §8.2; §9.2)

None of these exist:
- `layout.test.ts` (the §6.3/§6.4 table, both layouts, belowFloor, rotate rule)
- `moveZone.test.ts` (M3.3a rules 1-4, fresh vs tracked slop)
- `settings.test.ts`, including `{"__proto__":{"swapControls":true},"v":1}` → defaults (L4c)
- `bestScore`/`safeStorage` fail-closed tests for `"abc"`, `"-5"`, `"1.5"`, `"{}"`, `"null"`, `"1e400"`, `""` (F20 AC9) and write-throw (AC10)
- the `GameLoop` 30/60/90/120 Hz → 600 ± 1 steps test and the suspend/resume 10-minute-gap → 0 extra steps test
- `handleBack` / `pauseForInterruption` state-table tests

**Required fix:** add them. The junior tester extends coverage at step 9, but these are named step-7 deliverables.

### H7. ESLint boundary and sink rules are missing (§4 enforcement, §14.1 L4b)

**Where:** `.eslintrc.cjs:32-52`. Missing:
- `no-restricted-syntax` on `MetaProperty` (`import.meta`) everywhere except `src/main.ts`
- a restriction so that outside `src/platform/`, only `src/platform/Platform.ts` may be imported, and only via `import type`. Today `src/platform/web/**` is importable from anywhere, and value imports of `Platform.ts` are not blocked.
- L4b: `no-restricted-properties`/`no-restricted-syntax` for `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`
- the ban on `navigator.userAgent` / `Capacitor.getPlatform()` outside `src/platform/android/**`

Today's code has no such sinks (I grepped), but the gate the spec requires does not exist.

### H8. App icon and splash are still the Capacitor template (M9.2, M9.3, M9.4, F22 AC8; §7.4; §14 item 3)

**Where:**
- `android/app/src/main/res/values/ic_launcher_background.xml` is `#FFFFFF`.
- `drawable-v24/ic_launcher_foreground.xml` and the `mipmap-*` PNGs are Capacitor's logo.
- `mipmap-anydpi-v26/ic_launcher.xml` has no `<monochrome>` layer.
- `drawable*/splash.png` are template art.
- `styles.xml` `AppTheme.NoActionBarLaunch` sets no `windowSplashScreenBackground #05050a` and no splash icon.

Shipping a third party's logo as the launcher icon is also an IP problem.

**Required fix:** implement §7.4 and store-assets-spec §1:
- a vector foreground (the plain `#2f6fed` shield circle), `#05050a` background and a `<monochrome>` layer
- legacy mipmaps from the same art
- a Theme.SplashScreen with `windowSplashScreenBackground=#05050a` and `windowSplashScreenAnimatedIcon` set to the foreground
- template `splash.png` files removed or replaced

### H9. The §7.3.1 no-INTERNET evidence is incomplete (M-ADR-0010; §14 item 6)

**Where:** `docs/mobile/tooling-setup-log.md:285-299`. Missing rows:
- **API 36, forced errorPath** (local uncommitted `minWebViewVersion: 999` build → `webview-update.html` renders)
- **Mid image with WebView ≥ 80.** This row is required because the API 24 WebView is 53 (< 80). Title plus the privacy overlay must work there.
- The API 36 row does not record Settings, Swap controls or **the privacy overlay** working, all of which the table requires, nor privacy scrolling (§8.7).
- The merged provider/receiver excerpt that §10.3 R5 asks to be attached. I have supplied it in the Verification table above.

**Required fix:**
- Request the mid image through `docs/mobile/tooling-requests.md`.
- Re-run all rows **after** C1/C2 are fixed, since the privacy overlay is currently rendered scaled inside the playfield.
- Record the results.

---

## MEDIUM (must fix)

**M1. Capacitor 8 inset handling not disabled; cutout mode not set (§6.6, MR2).**
- Neither `capacitor.config.ts` nor `styles.xml` sets `plugins.SystemBars.insetsHandling: 'disable'` (the Capacitor 8 option name, confirmed in `@capacitor/cli` declarations).
- `android:windowLayoutInDisplayCutoutMode="always"` is not set on the launch/app theme or in code. On API 28-34 devices the default mode letterboxes away from the cutout.
- **Fix:** add both settings. Show a cutout-emulator screenshot proving the WebView is full-bleed.

**M2. GameShell replaces the decor view's insets listener (§6.6, MR6).**
- **Where:** `GameShellPlugin.java:82`. `ViewCompat.setOnApplyWindowInsetsListener(decorView, …)` replaces any listener on the decor view. The comment at lines 79-81 claims a "zero-size child view", which does not match the code.
- **Fix:** add a zero-size child `View` to `android.R.id.content` and set the listener on it, returning insets unconsumed. Correct the comment.
- **Also:** `getEdgeInsets()` should compute from `ViewCompat.getRootWindowInsets(decorView)` when no dispatch has happened yet, instead of returning the initial zeros.

**M3. Renderer backing store not updated on re-layout (M2.8, M2.9).**
- **Where:** `main.ts:85-88`. `renderer.applyScale()` is called once, after `init()`. Fold, resize and insets changes never resize the canvas, and `CanvasRenderer.applyScale` returns early at exactly 1 (`CanvasRenderer.ts:65`), so a later change to k = 1 is ignored.
- **Fix:** pass an `onScaleChange` callback (for example via `PlatformContext`) that `ScreenFit.relayout` calls, and remove the `=== 1` short-circuit. Web never calls it, so web output stays identical.

**M4. The Playwright config disables touch emulation (§10 item 3).**
- **Where:** `playwright.mobile.config.ts:33-36`. Spreading `devices['Desktop Chrome']` at project level overrides the top-level `hasTouch: true, isMobile: true, deviceScaleFactor: 2` with false/false/1. The probe measured `navigator.maxTouchPoints === 0` and `devicePixelRatio === 1`.
- **Fix:** put `hasTouch`, `isMobile` and `deviceScaleFactor: 2` inside each project's `use`, after the spread, or drop the spread.

**M5. `window.__vvsTest` hook not implemented (§10 item 3, §10.2, L4a).**
- Nothing in `src/` creates it, so the 40/40 slide test cannot be written.
- **Fix:** implement it in `AndroidPlatform`. Gate it once at boot on `?e2e=1 && !Capacitor.isNativePlatform()`. Expose a frozen, read-only snapshot and a per-frame player-x log (copies only, no GameCommands). Verify `typeof window.__vvsTest === 'undefined'` on the emulator.

**M6. Unhandled boot failures leave the splash up forever (coding-standards: error handling; M9.4).**
- **Where:** `main.ts:85` `platform.init(ctx).then(…)` and `main.ts:91` `loadPlatform().then(bootstrap)` have no `.catch`. If `GameShell.getEdgeInsets()` rejects, or the Android chunk fails to load, `loop.start()` never runs and `SplashScreen.hide()` is never called.
- **Fix:** add a catch that logs with context, starts the loop with default layout values, and hides the splash.

**M7. Resize and rotate pause bypass the shared interruption command (§8.1).**
- **Where:** `AndroidPlatform.ts:112` wires `onPause: () => pause(...)`. §8.1 specifies `commands.pauseForInterruption()` for viewport size change. That call also holds VICTORY and commits the best score.
- **Fix:** wire `onPause` to `pauseForInterruption`.

**M8. THROW pointer can stick; move and throw pointers are not cleared on hide or background (M3.5, M3.6, M4.1).**
- **Where:** `TouchControls.ts:181-188`. THROW has no `lostpointercapture` handler and no explicit capture. Neither pointer map is cleared when the touch layer is hidden (pause, background). A lost `pointerup` leaves `throwHeld` true, which auto-rethrows every time the shield returns.
- **Fix:** call `setPointerCapture` on the THROW `pointerdown` and handle `lostpointercapture`. Clear `movePointers`, `throwPointers` and the latch in `setVisible(false)` and on lifecycle leave.

**M9. Privacy overlay spec gaps (§8.7, M11.4a item 5).**
- The Close button is not at the top on the THROW-side edge (it is appended after the `h1`).
- `touch-action: pan-y` is set only on the iframe, not on the panel, while `html`/`body` have `none`. Scrolling is unverified.
- Esc on a hardware keyboard does not close shell overlays.
- Hardware Enter on TITLE starts a run underneath an open Help or Settings overlay, via `dispatchStateInput`.
- **Fix:** apply §8.7 structure and CSS. Add an Esc handler that calls `closeTopOverlay()`. While a shell overlay is open, suppress TITLE `menuConfirmPressed` in platform code (for example, have the Android platform consume the keydown).

**M10. `public/privacy.html` placeholder is inaccurate (M11.4, §8.7).**
- Line 47 gives an invented hosted URL, `ahogancamp.com/shield-vs-robots/privacy.html`. M11.4 names `https://hogy86.github.io/ahogancamp_portfolio/privacy.html` (as plain text).
- Lines 42-44 say only "two values" are stored, omitting the `vvs:metrics` counters.
- The contact email is still an open owner item (OQ-M11).
- **Fix:** correct the URL and the data list; mark the contact as TBD unless the owner has decided.

---

## LOW (should fix)

- **L1. Dead or duplicated code.** `GameStateMachine.ts:39-49` `webQuitApp` duplicates `WebPlatform.services`; move the web default out of core. `startNewRun` alias (`:71`): remove it if nothing uses it. `PlatformCopy.showQuitBlockedFallback` is never read. Template leftovers under `android/app/src/{androidTest,test}/java/com/getcapacitor/myapp/`.
- **L2. Comment does not match code.** `TouchControls.ts:148-160` says InputManager applies the cancel, but the method collapses both directions to `'none'` itself. Return the union (`left`/`right` independently) per §5.2 step 4.
- **L3. `selectPauseOption` does not validate `index` (`GameStateMachine.ts:134`).** Clamp or ignore values outside `0..3`.
- **L4. Pause-screen confirm text on Android** (`ScreenController.ts:149`) still says "Press Enter to confirm, or Esc to cancel." Take it from `PlatformCopy`. Android menu items rendered as `<li>` should be `<button>` for accessibility.
- **L5. `data_extraction_rules.xml` excludes only `domain="root"`.** Add explicit excludes for `file`, `database`, `sharedpref` and `external` in both sections (review-v1b OQ-A1 note).
- **L6. `index.html:6` comment contains "Shield Invaders", and Vite keeps it in `dist/index.html`.** Reword it so the F22 AC5 scan stays clean.
- **L7. `app/build.gradle:51` guard uses a different base than the loader for relative paths.** The guard checks `new File(storeFile)`, relative to the process working directory, while signing uses `file(storeFile)`, relative to `app/`. Require an absolute `storeFile` or canonicalize the same way in both places.
- **L8. `check-capacitor-config.mjs` `.ts` text match** misses a quoted `'url':` key. Mention this limit in the header, or match quoted keys too.
- **L9. `AndroidPlatform.ts:91` and `screenFit.ts:137`** both add `platform-android`. Keep one.

## INFO

- **I1.** Gradle cannot build in place because the repo sits in OneDrive (outputs become reparse points) and some paths exceed Windows `MAX_PATH`, which also breaks `aapt2` on long paths. It works from a non-OneDrive copy. Recommend a documented build location outside OneDrive or Files-On-Demand "Always keep on this device" for `scaffold/`. I also recommend this for mobile-it-analyst / the release runbook, since §7.5 already keeps signing outside OneDrive.
- **I2.** An ignored `terraform-deploy_accessKeys.csv` sits in `scaffold/`, which is synced by OneDrive. It is not in scope for this change, but should be raised with the web security reviewer.
- **I3.** Commit ordering: `.gitignore` and `scripts/check-no-secrets.mjs` must be in the same commit as `android/` (A3 landing rule). Today they are all uncommitted together, which is compliant if committed together. `git status --ignored` shows every generated Android path as ignored.

## Conformance summary

| Area | Result |
|---|---|
| One codebase (no game logic per platform) | PASS. F20 `bestScore`, F21 rollback (`GameStateMachine.ts:269-277`, `WinLossSystem.ts:104`) and F22 strings are shared once. No platform branch in `src/core`, `src/systems` or `src/persistence`. |
| Elapsed-time movement / timers | PASS. Fixed-step accumulator kept. `suspend()`/`resume()` reset `lastTimestamp`/`accumulator`. The timing test is missing (H6). |
| Touch handlers vs scroll/zoom/select | PASS on CSS and native flags. FAIL on geometry and swap (C1, C2); THROW pointer robustness (M8). |
| Background pause / listeners | PASS: `pause`, `visibilitychange`, focus loss, keep-awake cleared, loop suspended. Resize path deviation (M7). |
| Back button | PASS for the M5 table and overlay stack. Gap: How-to-play Got it (H2). |
| DPR canvas / cutouts / gesture bar | FAIL (C1, M1, M3) |
| Generated files under `android/` | PASS. Nothing hand-edited under `assets/public`. `capacitor.build.gradle`/`capacitor.settings.gradle` are regenerated byte-identically by sync. |
| Security binding constraints (§14.1) | L2 PASS. L3/N2 script PASS, tests missing (H5). L4a missing (M5). L4b code PASS, lint rule missing (H7). L4c PASS, test missing. L5 jsdom PASS, action SHAs FAIL (H4a). N1/R5 partial (H3). N3 PASS. |
| coding-standards: style / error handling / docs | Style PASS with L1-L2. Error handling FAIL (M6). Docs PASS (traceability headers present), one misleading comment (M2). |
| Website build + tests | PASS locally. CI would FAIL (C3, H4b). |

## Routing

- **Back to mobile-junior-developer:** C1, C2, H1-H9, M1-M10, L1-L9.
- **To the main session and then mobile-security-compliance-reviewer:** C3 (the `.env.example` S1 hit, decision needed).
- **Re-review:** round 2, after these fixes. H3/H4/H5 need re-confirmation that R5 matches review-v1b N1 exactly.
