# Manual-only criteria — mobile pipeline step 9

**Stage:** Mobile Pipeline Step 9 — mobile-junior-tester
**Date:** 2026-09-27
**Author:** mobile-junior-tester subagent
**Scope:** every acceptance criterion in `docs/mobile/PRD-mobile.md` (M1-M12) and
the mobile-relevant parts of `docs/PRD-addendum-v3.md` (F20) and
`docs/PRD-addendum-v4.md` (F21, F22) that **cannot** be verified by
`npm run test`, `npm run lint`, `npm run build`, `npm run build:android`, or
`npx playwright test -c playwright.mobile.config.ts` (the phone-emulation suite
in `tests/mobile-e2e/`), and why. Everything **not** listed here has a test
mapped to it in `src/**/*.test.ts`, `scripts/*.test.mjs`, or
`tests/mobile-e2e/*.spec.ts` — see the "Test map" table at the end of this
document.

**Why these can't be automated in this suite.** Chromium's touch/mobile
emulation (`hasTouch`, `isMobile`, CDP `Input.dispatchTouchEvent`) and
Capacitor's web fallback (`AndroidPlatform`'s `GameShell`/`App` web
implementations) let the phone-emulation suite exercise the game's own logic
under realistic touch input and simulated insets — but they run inside a
**desktop Chromium tab**, not a real Android WebView, OS, or device. Nothing
in this suite can:
- physically rotate a device, fold it, or drive its real OS gesture-navigation
  system (M2's landscape lock, gesture-zone avoidance, and fold transitions),
- send the OS-level lifecycle events a real Activity gets (Home, Recents,
  screen lock, an incoming call, the notification shade, a system dialog,
  process death) — `@capacitor/app`'s web fallback only reacts to the tab's
  own `visibilitychange`, which is a real but much narrower signal than the
  events M4 lists,
- reliably exercise the real Android back button/gesture wiring at all (see
  the M5 entry below — this was tried and found genuinely non-deterministic,
  not just "harder"), or either navigation mode, or Android 13+/16 predictive
  back's preview animation (M5.3),
- measure real frame rate, cold-start time, or battery/wake-lock behavior on
  reference low-end/mid-range hardware (M10),
- install a real signed build, update it, reboot the device, or clear its
  storage (M7.4),
- render Android system chrome (status/navigation bar, cutouts, the launcher's
  icon mask, TalkBack, system font scaling) at all, or
- run Google Play's own tooling (pre-launch report, Data safety review,
  closed-test opt-in).

These are covered instead by `docs/mobile/tests/device-matrix.md` (step 10,
mobile-lead-tester, emulator + real devices), `docs/mobile/tests/uat-plan.md` /
`uat-results.md` (step 14, on the emulator), the closed test
(`docs/mobile/tests/closed-test-results.md`, step 16, real testers on real
devices), and the mobile-ui-ux-designer/mobile-security-compliance-reviewer
visual/legal review rounds, as noted per item below.

---

## M1 — Android platform baseline

| AC | Why manual-only |
|---|---|
| M1.1 (min API 24 runs) | Requires actually running the app on an API-24 device/emulator image; CI only builds and statically checks the manifest's `minSdkVersion` (`scripts/check-android-manifest.mjs`), it never boots one. → device-matrix. |
| M1.2 (target API 36 accepted by Play) | Confirmed by Google Play's upload validation at step 15, not by this suite. |
| M1.3 (phones, tablets, foldables, Chromebooks install and run) | Needs a real/emulated install per form factor. The phone-emulation suite proves the *layout math* at those viewport sizes (`layout.test.ts`, `controls-layout.spec.ts`), not that the APK actually installs and runs on each. → device-matrix. |
| M1.4 (readable message on a too-old WebView) | Requires an actual outdated Android System WebView; Chromium (the only engine Playwright drives) cannot be downgraded to reproduce this. → device-matrix (pin an old WebView image). |
| M1.5 (no sign-in ever needed) | No sign-in code exists to test around; verified by code review (no auth/account code in `src/` or `android/`) and by M11.1's "no network request" e2e check, not a dedicated device test. |

## M2 — Orientation and screen fitting

| AC | Why manual-only |
|---|---|
| M2.1 / M2.1a (landscape lock from process start, both landscape directions, no rotation on any screen) | Requires the real Android `orientation` manifest attribute and OS-level sensor rotation; a desktop browser tab has no orientation lock to test. → device-matrix (physical rotation, both directions, on every listed screen). |
| M2.3a (0 accidental back/pause/home gestures from 20 real presses/holds/slides per edge, in real gesture-navigation mode) | The *inset numbers* are unit-tested (`layout.test.ts`) and *no control renders inside the inset rectangle* is e2e-tested (`controls-layout.spec.ts`), but "does a real edge swipe with real Android gesture navigation actually fire back/home" needs the real OS gesture recognizer, not Chromium's touch emulation. → device-matrix. |
| M2.5 (immersive mode: system bars hidden, edge-swipe reveal, auto re-hide) | Android chrome (status/nav bars) does not exist in a browser tab at all. → device-matrix. |
| M2.9 (fold/split-screen/window-resize pauses, re-lays-out ≤1s, loses no state) | The re-layout math and the pause-on-resize wiring (`screenFit.ts`'s `resize` listener → `pauseForInterruption`) are plausible to approximate with `page.setViewportSize()`, but a *genuine* fold/split-screen/freeform transition (and "loses no run state" across it) only exists on a foldable emulator or device. → device-matrix. |
| M2.10 (Android forces a portrait-shaped window; "Rotate your device" holds; never a squashed/cut-off playfield) | `needsRotatePrompt()`'s math is unit-tested (`layout.test.ts`), but Android 16's actual large-screen orientation override only fires on a real large-screen/foldable device or an emulator configured for it. → device-matrix. |
| M2.11 (system font size at its largest: no overflow/clip/overlap) | Requires the real Android Settings accessibility font-scale, which Chromium has no equivalent for. → device-matrix. |
| M2.7 (power-up/enemy/shield-trail distinguishability *at the 640×360 dp scale*) | This AC's acceptance test is explicitly "verified by the UX reviewer on a screenshot" — a human legibility judgment call, not a pass/fail assertion a test can make. → mobile-ui-ux-designer (round 2), device-matrix screenshot. |
| M2.6 legibility ("renders at ≥12 sp equivalent") *for the on-screen glyph rendering itself* | The button/HUD *sizes and positions* are geometry-tested (`controls-layout.spec.ts`, `layout.test.ts`); whether Android's real WebView font rasterizer actually renders that px size legibly (vs. e.g. hinting artifacts) is a visual check. → device-matrix screenshot, mobile-ui-ux-designer. |

## M3 — Touch controls

| AC | Why manual-only |
|---|---|
| M3.3a's own instruction "runs again on the emulator in step 10" | `tests/mobile-e2e/slide-switch.spec.ts` (this step) automates the exact 40/40 scripted-swipe test in Chromium's touch emulation and is the primary evidence; the architecture doc (§10.2) additionally requires the *same* spec be re-run on the real Android emulator at step 10, since Chromium's synthetic touch pipeline is a proxy for, not identical to, a real touchscreen digitizer's sampling. Not "manual" in the sense of a human doing it by hand, but not satisfied by this CI run alone either. |
| M3.6 ("no perceptible added lag" with level 10's full 54-enemy formation + boss lasers on screen) | Reaching level 10 legitimately takes a full run; there is no debug level-skip in the shared game code (adding one would be a game-rule change outside this pipeline's scope), so this is only practically reachable via a real playthrough or the low-end/mid-range performance profile in `docs/mobile/tests/device-matrix.md`. |
| M3.7 (no stray scroll/zoom/text-select/long-press context menu or vibration; double-tap never zooms) | android.css's `touch-action`/`user-select` rules and a `contextmenu` preventDefault are unit-invisible; whether Chrome-for-Android's real pinch-zoom/long-press-vibration gestures are actually suppressed can only be confirmed on a real touchscreen. → device-matrix. |
| M3.10 (hardware keyboard/Chromebook) | Needs a real Chromebook or an attached hardware keyboard on a device; explicitly not release-gated per the PRD. → device-matrix (optional row). |
| M3.11 (TalkBack labels; Play pre-launch accessibility report shows no missing-label warnings) | The Play pre-launch report only runs after an upload to Play Console; TalkBack itself only exists on a real/emulated Android accessibility service. → step 15 pre-launch report, device-matrix (manual TalkBack pass, optional). |

## M4 — Pause, resume, and app lifecycle

| AC | Why manual-only |
|---|---|
| M4.1 (auto-pause on Home, Recents/app-switch, screen off/lock, an incoming call screen, the notification shade, a system dialog) | `@capacitor/app`'s web fallback only maps `document.visibilitychange` to `pause`/`resume` — a real but much narrower signal than the six distinct OS interruption sources M4.1 lists (an incoming call screen or a system dialog do not necessarily hide the WebView the same way a tab-switch does). Only a real emulator/device can send the real `Activity.onPause()`/`onStop()` these events map to. → device-matrix (one row per interruption source). |
| M4.2 (no time passes while away, tested at 5s **and 10 min**) | The fixed-timestep suspend/resume *math* is unit-tested (`GameLoop.test.ts`, "a suspend/resume gap of 10 minutes adds zero extra steps"); that the real Android process is actually suspended (not just backgrounded-but-still-ticking) for a genuine 10 minutes is a device-level guarantee, not something this suite starts a real 10-minute wall-clock wait to prove. → device-matrix. |
| M4.3 (returning never auto-resumes) | Follows directly from M4.1 above being device-only: this is checked as part of the same device-matrix rows. |
| M4.4 (leaving/returning on title/Game Over/pause/Game Complete keeps the same screen) | Same dependency on real backgrounding as M4.1. → device-matrix. |
| M4.5 (screen stays awake during play; normal timeout elsewhere) | `GameShell.setKeepAwake()`'s *call site* (only toggled on a PLAYING/not-PLAYING transition) is code-reviewable, but whether the device's screen actually stays lit is only observable on a real/emulated device with a real display timeout. → device-matrix. |
| M4.6 (process death: run lost, best score/settings intact, no crash) | Requires the OS to actually kill the backgrounded process (e.g. via `adb shell am kill` or real low-memory pressure) and relaunch it. → device-matrix. |

## M5 — Android back button/gesture

| AC | Why manual-only |
|---|---|
| Every row of the M5 table | **Tried and reverted.** A first draft of this step added `tests/mobile-e2e/back-gesture.spec.ts`, driving `registerBackButton`'s real listener via `Capacitor.Plugins.App.notifyListeners('backButton', ...)` (the same proxy object `window.Capacitor.Plugins.App` the app itself uses). It worked in isolated manual probes but was **genuinely non-deterministic** under repeated runs (confirmed empirically: 6 back-to-back runs of the identical scripted sequence gave inconsistent results with no code change). The root cause, traced in `node_modules/@capacitor/core/dist/index.js`'s `registerPlugin`: on the **web fallback only** (never on a real native Capacitor runtime, which bypasses this path entirely via `pluginHeader`), `loadPluginImplementation()` guards its one-time factory call with `if (!jsImplementation && ...)`, but does not `await`-serialize concurrent callers. `AndroidPlatform.init()` calls `registerBackButton(...)` and `registerLifecycle(...)` back-to-back, each firing an unawaited `App.addListener(...)`; both can race past that guard **before either await resolves**, each invoking the `@capacitor/app` web factory (`new AppWeb()`) and producing **two separate plugin instances**, each with its own `listeners` map. Depending on which instance wins the shared cache slot, a later `notifyListeners('backButton', ...)` call (mine, or a real one on a real device this deep in a web-only path) can land on an instance that never received `backButton.ts`'s registration. Per the project's testing rules ("deterministic (no retries)"), a test that fails or passes depending on an unrelated bootstrap race is worse than no test, so it was removed. The *state-machine resolution table* itself (`handleBack()`) is exhaustively and deterministically unit-tested (`src/core/GameStateMachine.test.ts`, pure function, no Capacitor plugin involved) — that is this step's real coverage of the table's *logic*. The *wiring* (a real back press → `registerBackButton` → `handleBack`/`closeTopOverlay`) has no such race on a real device (native plugins skip `loadPluginImplementation` entirely), so it is verified there instead, in both navigation modes, including predictive back (M5.3). → device-matrix. |
| "Title screen → leave the app" / "Rotate-your-device prompt → leave the app" rows | These call `App.minimizeApp()`, which the web fallback (`AppWeb`) explicitly does not implement (`throw this.unimplemented(...)`) regardless of the race above — there is no web-safe way to assert "the app actually left the foreground" outside a real Capacitor runtime. → device-matrix. |

## M6 — Quit on Android

| AC | Why manual-only |
|---|---|
| M6.1/M6.2 (Quit/title Quit actually closes the app; next launch starts on title) | `App.exitApp()` is unimplemented on the web fallback for the same reason as `minimizeApp()` above; the pause-menu state transition and the best-score-save-before-quit are unit-tested (`GameStateMachine.test.ts`), but "the process actually terminates and relaunches clean" is device-only. → device-matrix. |

## M7 — Saved best score and settings

| AC | Why manual-only |
|---|---|
| M7.4 (survives an app **update** installed over the previous build, and a **device reboot**) | Requires actually building two versions, installing build N, setting values, installing build N+1 **over** it, and/or a real reboot — none of which a browser's `localStorage` persistence proves (that only covers "survives a reload/restart", which *is* e2e-tested, see `swap-layout-behavior.spec.ts`). → device-matrix. |
| OQ-A1 fallback (`@capacitor/preferences` swap, only if a saved-data check fails) | Contingent on a real device-only failure (above) actually occurring; not applicable unless/until that happens. |

## M8 — First-launch help

| AC | Why manual-only |
|---|---|
| M8.4 ("a first-time tester can make their first throw within 10s... without outside help", MG4) | This is a **human-behavior** metric (does a real person figure out the controls fast enough), not a property of the code — the PRD itself marks it *(closed test)*. → closed-test checklist (step 16). |

## M9 — App name, icon, and splash screen

| AC | Why manual-only |
|---|---|
| M9.1's "install the debug build → launcher label reads..." half | `tests/mobile-e2e/rename-audit.spec.ts` (this step) statically proves the built `dist-android` bundle and `android/app/src/main/res/values/strings.xml` contain no "Vanguard"/"Sentinel"/"Shield Invaders" text, and that `app_name` is exactly "Shield vs Robots" — but seeing the actual launcher label under a real/emulated home screen icon needs an install. → device-matrix. |
| M9.2 (adaptive icon stays recognizable under every launcher mask at 48dp) | Icon-mask cropping is a launcher-rendering concern with no headless-Chromium equivalent. → device-matrix / asset review. |
| M9.3, M9.6 (original art; no licensed likeness; Marvel/X-Men/Archie-avoidance constraints on the hero/shield/robots) | These are visual and legal judgment calls against real art/icon/splash/store assets, not something a text or pixel-diff assertion can adjudicate. → mobile-ui-ux-designer (round 2) and mobile-security-compliance-reviewer (pass 2), per M9.6 item 4. |
| M9.4 (splash → first frame, no white flash, ≤500ms) | Real cold-start frame timing on an actual device/emulator. → device-matrix (with M10.3). |
| M9.5 (512×512 icon / 1024×500 feature graphic delivered) | An asset-delivery checklist item owned by mobile-ui-ux-designer, not a code behavior. |

## M10 — Performance and stability on low-end devices

| AC | Why manual-only |
|---|---|
| M10.1 (≥30 FPS low-end / ≥55 FPS mid-range at full level-10 load) | Real frame-rate measurement on the pinned low-end/mid-range emulator images (`docs/mobile/tests/device-matrix.md`). Chromium's virtual clock and a desktop CI runner's GPU bear no relation to the reference hardware. |
| M10.2 (frame-rate independence at 90/120 Hz vs. a device dropping to 30 FPS) | The fixed-timestep *math* is unit-tested (`GameLoop.test.ts`); a *real* 90/120 Hz display and a *real* dropped-frame device are both hardware-dependent. → device-matrix. |
| M10.3 (cold start ≤5s low-end / ≤3s mid-range) | Real install-to-interactive timing on the reference devices. → device-matrix; Android vitals post-release. |
| M10.4 (15-minute continuous session, no crash/ANR/frame decline) | A genuine 15-minute play session on the low-end profile; not something this suite runs a real 15-minute loop for. → device-matrix. |
| M10.5 (AAB ≤15 MB) | Measured on the **signed release AAB** at step 15 (mobile-release-engineer), which does not exist yet at step 9 — only a debug APK does. |
| M10.6 (no game loop / wake lock while backgrounded) | The `onFrame`/`setKeepAwake` call-site logic is code-reviewable; confirming the render loop is *actually* stopped and no wake lock is *actually* held requires a real backgrounded process (adb battery/wake-lock inspection). → device-matrix. |
| M10.7 (Play pre-launch report: zero crashes/ANRs) | Only runs after a Play Console upload. → step 15/16. |

## M11 — Offline, permissions, privacy, and Play policy

| AC | Why manual-only |
|---|---|
| M11.1 network check, M11.4a's airplane-mode + ≤2-tap privacy-policy check | These ARE e2e-tested in Chromium (`controls-behavior.spec.ts`'s Privacy-overlay path; `smoke.spec.ts`'s network-request log), including "no request other than same-origin assets" — listed here only to note the one thing that *isn't* covered: literal airplane mode is a device radio state Chromium cannot toggle, so the e2e check instead asserts the stronger, always-true property (zero non-same-origin requests occur at all, with or without connectivity). |
| M11.3 Data safety form answer matches the final app | A Play Console questionnaire answer, cross-checked by mobile-security-compliance-reviewer at pass 2 against the code — not a runnable test. |
| M11.6 IARC content-rating questionnaire | A Play Console form, answered by product-manager/owner, not testable. |

## M12 — Store listing

| AC | Why manual-only |
|---|---|
| All of M12 (title/description/keywords/screenshots/category/contact email/listing art constraints) | Store listing text and imagery are Play Console content, produced and reviewed by mobile-marketing-analyst/mobile-ui-ux-designer/mobile-technical-writer, not code under test in this repository. M9.6's IP-avoidance items are re-checked against the actual listing assets the same way as M9.3/M9.6 above (human/legal review). |

---

## Test map (everything else — has an automated test)

| Area | Automated in |
|---|---|
| M0 parity (shared `src/`, no per-platform game-rule constants) | `src/**/*.test.ts` (shared suite, unchanged by this step), `scripts/check-capacitor-config.test.mjs` |
| M2.2/M2.3/M2.4/M2.6/M2.8/M2.12/M2.13 layout math and geometry | `src/platform/android/layout.test.ts`, `tests/mobile-e2e/controls-layout.spec.ts` |
| M2.10 rotate-prompt trigger math | `src/platform/android/layout.test.ts` |
| M3.1/M3.2/M3.8 (sizes, gaps, menu targets ≥48dp) | `tests/mobile-e2e/controls-layout.spec.ts` |
| M3.3/M3.3a (slide-to-switch: classifier + real touch pipeline, both layouts) | `src/platform/android/moveZone.test.ts`, `tests/mobile-e2e/slide-switch.spec.ts` |
| M3.4 (opposing cancel) | `src/core/InputManager.test.ts` |
| M3.5 (throw latch, not-ready state), M3.6 (real touch → move/throw, ≤100ms proxy) | `tests/mobile-e2e/controls-behavior.spec.ts` |
| M3.9 (control visibility per state) | `tests/mobile-e2e/controls-behavior.spec.ts`, `controls-layout.spec.ts` |
| M3.12 (website unaffected) | existing web suite (`src/ui/ScreenController.test.ts`, no PlatformCopy branch) |
| M3.13 (Swap controls: real behavior at the mirrored position, not just geometry, and persistence across reload) | `tests/mobile-e2e/swap-layout-behavior.spec.ts` |
| M4.2 (suspend/resume adds zero simulated time) | `src/core/GameLoop.test.ts` |
| M5 back-button/gesture state-machine resolution (software-testable part; see the M5 row above for the wiring/real-input part, which is device-matrix-only) | `src/core/GameStateMachine.test.ts` ("handleBack() state table") |
| M6.3 (Quit saves the best score first) | `src/core/GameStateMachine.test.ts` |
| M7.1-M7.6 (best score/settings: fail-closed parsing, commit rules, persistence-across-reload, corrupt-data fallback) | `src/persistence/bestScore.test.ts`, `src/platform/android/settings.test.ts`, `tests/mobile-e2e/controls-behavior.spec.ts` |
| M8.1-M8.3 (help overlay first-run, reopen, no stale-flag regression) | `tests/mobile-e2e/help-flow.spec.ts`, `smoke.spec.ts` |
| M9.1/F22 (rename: no old player-facing text anywhere, including canvas-drawn text like the danger warning - no dedicated `CanvasRenderer.test.ts` exists, so the built-bundle scan is this string's only coverage) | `tests/mobile-e2e/rename-audit.spec.ts` (scans the built `dist-android` JS, which embeds every `fillText` literal), `src/ui/ScreenController.test.ts` |
| M11.1/M11.2 (no network requests; manifest permission allowlist), M11.4a (privacy overlay flow, 2-tap, airplane-safe) | `tests/mobile-e2e/smoke.spec.ts`, `controls-behavior.spec.ts`, `scripts/check-android-manifest.test.mjs` |
| F20 (saved best score: fail-closed, commit rules, mid-run save) | `src/persistence/bestScore.test.ts` |
| F21 (Restart Level score rollback) | `src/core/GameStateMachine.test.ts`, `src/core/world.test.ts` |
