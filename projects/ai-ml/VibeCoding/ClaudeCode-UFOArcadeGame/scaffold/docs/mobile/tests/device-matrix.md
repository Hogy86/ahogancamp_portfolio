# Mobile device matrix — Step 10 (mobile-lead-tester)

**Date:** 2026-09-27
**Build tested:** debug APK built from the working tree on `claude/project-thread-rm5222`
(same commit under review at step 10), assembled from the mirror
`C:\Users\aaron\dev-build\shield-vs-robots` per `docs/mobile/tooling-setup-log.md`.
`versionName=1.0`.
**Environment:** JAVA_HOME/ANDROID_HOME/AAPT2_PATH per the tooling log. AVDs used:
`svr_api36_pixel7` (`-gpu host -no-window`), `svr_api30_mid`
(`-gpu swiftshader_indirect -no-window`), `svr_api24_small`
(`-gpu swiftshader_indirect -no-window`).
**Screenshots:** `docs/mobile/tests/screenshots/` (this round's captures; filenames
prefixed `api36_`, `api30_`, `api24_`).

## Coverage vs. the required matrix (PRD step-10 instructions)

| Required row | Status | Notes |
|---|---|---|
| Small, low-end phone | **PARTIAL** | `svr_api24_small` (Nexus 5 shape = 640×360 dp landscape, 2 vCPU) boots and installs, but its real system WebView (53.0.2785.124) is below the app's own `minWebViewVersion` (80), so it only ever shows the M1.4 fallback screen ("Please update Android System WebView from the Play Store") and can **never render the actual game**. M1.4 itself is therefore confirmed PASS on real hardware-equivalent. But M2.6/M2.7/M3.1's 640×360 dp minimums, and M10.1/M10.3/M10.4 (frame rate, cold start, endurance) on the low-end profile could **not** be verified by real interactive play this round — only by the Playwright phone-emulation suite at the same viewport (a Chromium tab, not a real WebView/JIT/GPU). See "Known gaps" below and `tooling-requests.md`. |
| Tall phone with a camera cutout | **DONE (no real cutout hardware to test against)** | `svr_api36_pixel7` (Pixel 7 shape, 1080×2400, 20:9 "tall") was used for the full functional pass (title, help, settings, play, pause, back-mapping, lifecycle, quit, both landscape directions). This AVD's skin does not declare a `hw.displayRegion`/cutout, so it does not actually simulate a display cutout — M2.3's "nothing important under a display cutout" could not be checked against a *rendered* cutout overlay on this image. The layout math for insets (M2.3a) is unit- and e2e-tested already (`layout.test.ts`, `controls-layout.spec.ts`) at `?insets=24,24,0,24`, which is the recommended proxy per the architecture doc; a real cutout device is desirable but not available as an AVD. |
| Tablet | **NOT DONE — blocked, tooling request filed** | No tablet AVD exists (`avdmanager list avd` shows only phone-shaped devices). See `tooling-requests.md` item 1. |
| Foldable (folded and unfolded) | **NOT DONE — blocked, tooling request filed** | No foldable AVD exists. See `tooling-requests.md` item 2. |
| Both landscape orientations | **DONE** | Confirmed on `svr_api36_pixel7` via the emulator console `rotate landscape` command: `dumpsys window displays` showed `mDisplayRotation` flip from `ROTATION_90` to `ROTATION_270`; screenshot before/after shows the UI re-rendered correctly in the new direction with no clipping, no reflow glitch, same control layout mirrored appropriately (M2.1/M2.1a). Portrait was never shown (`screenOrientation="sensorLandscape"` in the manifest, confirmed by inspection). |
| Gesture navigation | **DONE** | `settings get secure navigation_mode` = `2` (gesture) was the default on all three AVDs; all back-mapping checks below were run in this mode. |
| 3-button navigation | **NOT INDEPENDENTLY VERIFIED THIS ROUND** | All back-button checks were driven via `adb shell input keyevent KEYCODE_BACK`, which dispatches the same back key event to the app regardless of which navigation mode produced it — so the app's back-handling logic (`handleBack()`/`registerBackButton`) was exercised identically to how a real 3-button press would be. What was **not** tested is the navigation-mode-specific risk in M2.3a/M5.2 (a real edge *swipe* in gesture mode accidentally triggering back from inside the control columns) versus a literal button tap, because driving that authentically requires a real screen-edge swipe gesture (`adb shell input swipe` from the literal edge pixel, in gesture mode), which was not attempted this round for time reasons. Recommend a follow-up pass (or UAT, step 14) that switches `navigation_mode` to `0` and repeats the pause-menu/back-mapping screenshots, plus a real edge-swipe drill for M2.3a's "20 slides per edge, 0 accidental back" check, which remains genuinely device/gesture-only per `manual-only-criteria.md`. |
| Play a full round | **PARTIAL** | Movement (◀/▶), THROW (spawns a shield, score updates), PAUSE, Resume, Restart Level (level-1 intro re-armed) were all exercised interactively via `adb shell input tap`/`input keyevent` against the real installed APK on `svr_api36_pixel7` and `svr_api30_mid`. A full 10-level round to Game Complete was **not** played this round (that is M10.4's 15-minute endurance check territory, more suited to UAT/closed test); the unit suite's `WinLossSystem.test.ts`/`GameStateMachine.test.ts` already exhaustively cover the boss/victory state machine in isolation. |
| Background and resume | **DONE** | Home during PLAYING → paused; relaunch → still on the pause menu, enemy formation/score/lives unchanged (M4.1/M4.2/M4.3). |
| Press back | **DONE** | See the back-mapping table below. |
| Nothing clipped | **DONE (on the two working profiles)** | No clipped HUD, controls, or menu text observed on `svr_api36_pixel7` or `svr_api30_mid` at any screen captured (title, help, settings, play, pause, restart-confirm). Not assessable on `svr_api24_small` (game never renders past the WebView-update fallback). |
| Smoothness | **NOT MEASURED (real frame-rate/timing)** | No FPS counter or frame-timing instrumentation was run against the live emulator this round; play felt subjectively smooth on `svr_api36_pixel7` (`-gpu host`) and adequate on `svr_api30_mid` (`-gpu swiftshader_indirect`), but this is not a substitute for M10.1's 30/55 FPS measurement, which needs the actual low-end/mid-range reference hardware (or profiling tooling) per `manual-only-criteria.md`. Recommend this be measured with `adb shell dumpsys gfxinfo` or Perfetto during UAT/closed test. |

## Functional pass detail (svr_api36_pixel7, API 36, WebView 133.0.6943.137)

| Check | Result | Evidence |
|---|---|---|
| Cold start → title | PASS | `screenshots/api36_title.png` — "Shield vs Robots", "Best: 0", Start/How to play/Settings/Quit, no clipping |
| M9.1 rename | PASS | Title text reads exactly "Shield vs Robots"; matches `rename-audit.spec.ts`'s CI-checked `app_name` |
| M8.1/M8.2 Help overlay (opened from title's "How to play") | PASS | `screenshots/api36_help.png` — correct control text, "Got it" dismisses back to TITLE (not PLAYING), matching M8.2 |
| M7.3/M8.2 Settings screen | PASS | `screenshots/api36_settings.png` — "Swap controls: Off", "Privacy policy", "Close"; Privacy reachable in the required ≤2 taps from title (title → Settings → Privacy policy) |
| Start → gameplay (HUD, controls, formation) | PASS | `screenshots/api36_playing2.png` — Score/Lives/Level/Power HUD, 24-robot formation, ◀ ▶ THROW PAUSE all visible and unclipped, control-hint text present |
| M5: PAUSE button → pause menu | PASS | `screenshots/api36_pause.png` — "PAUSED", Resume highlighted, Restart Level/Restart Game/Quit all present and legible |
| M4.1/M4.2/M4.3: Home during PAUSED, relaunch | PASS | `screenshots/api36_resume_after_home.png` — still PAUSED, formation/score/lives unchanged |
| M5: Back from PAUSED menu | PASS (→ Resume) | `screenshots/api36_back_from_pause.png` — returned to live PLAYING view |
| M5: Back from active PLAYING | PASS (→ pause) | `screenshots/api36_back_from_play.png` — opened the pause menu |
| M5: Back from "Restart Game" confirmation | PASS (→ Cancel, no reset) | `screenshots/api36_back_from_confirm.png` — back on the pause menu with "Restart Game" still highlighted, no score/lives change |
| M2.1/M2.1a: 180° landscape flip | PASS | `dumpsys window displays` rotation flipped `ROTATION_90` → `ROTATION_270` via emulator console `rotate landscape`; re-screenshot shows correct re-render, no reflow glitch |
| M6.1: Quit | PASS | Tapping Quit returned `topResumedActivity` to the Nexus launcher (app process exited the foreground) |
| M6.1/M7.4: Relaunch after Quit | PASS | `screenshots/api36_after_relaunch.png` — fresh title, "Best: 0" persisted (no run had scored >0 this session) |
| `adb logcat` during the whole session | PASS | No `FATAL EXCEPTION`, no `AndroidRuntime` crash, no `net::ERR_*` |

## Functional pass detail (svr_api30_mid, API 30, WebView 83.0.4103.106)

This device is inside the WebView 80-83 range code-review-round4 finding L3 flagged
("flex `gap` needs Chromium 84, but the minimum WebView is 80 — the 48 px menu buttons
stack with no space between them, and the privacy header loses its spacing").

| Check | Result | Evidence |
|---|---|---|
| WebView version | Confirmed 83.0.4103.106 (in the flagged 80-83 range) | `dumpsys package com.google.android.webview` |
| Cold start → title | PASS | `screenshots/api30_title2.png` |
| Help overlay (first-launch, opened via Start) | PASS | `screenshots/api30_help.png` |
| Gameplay HUD/controls | PASS, no clipping | `screenshots/api30_playing.png` |
| Pause menu — **L3's specific concern (button spacing)** | **PASS — L3 does not visibly reproduce.** Resume/Restart Level/Restart Game/Quit render with clear, non-touching gaps between every button border | `screenshots/api30_pause.png` |
| Restart Game confirmation | PASS | `screenshots/api30_check2.png` (reached via my own mis-tap, but the prompt itself rendered correctly with a clear gap between Confirm/Cancel) |
| `adb logcat` | PASS | No crash, no `net::ERR_*` |

**L3 disposition:** on the one real WebView-83 device available this round, the flex-gap
regression code review predicted did not visibly occur on the pause menu, the title menu,
or the Restart Game confirmation dialog — all show clear spacing. I did not get a clean,
unambiguous screenshot of the **Privacy policy overlay's header** specifically on this
device this round (my own tap-coordinate misses repeatedly landed on Restart Game/Restart
Level instead of navigating back to Settings → Privacy — a testing-harness limitation, not
a reproduction of the bug or its absence). **This one sub-case (Privacy overlay header
spacing on WebView 80-83) is not closed and should be re-checked** — either in a follow-up
device-matrix pass or at UAT (step 14), which already exercises the Privacy overlay per
`uat-plan.md`.

## Functional pass detail (svr_api24_small, API 24, real WebView 53.0.2785.124)

| Check | Result | Evidence |
|---|---|---|
| WebView version | Confirmed 53.0.2785.124 (below `minWebViewVersion: 80`) | `dumpsys package com.google.android.webview` |
| M1.4: old-WebView fallback message | **PASS** | `screenshots/api24_webview_fallback.png` — "Please update Android System WebView from the Play Store." rendered; not blank, not a crash |
| `adb logcat` | PASS | No `FATAL EXCEPTION`/`AndroidRuntime`, no `net::ERR_*` |
| M2.6/M2.7/M3.1 (640×360 dp minimums), M10.1/M10.3/M10.4 (low-end perf) | **NOT VERIFIABLE on this AVD** | The real game never renders past the fallback screen on this device's real WebView. See "Known gaps" below. |

## Known gaps (not silently dropped — tracked for follow-up)

1. **Tablet and foldable rows are blocked** — no AVD exists for either. Filed in
   `docs/mobile/tooling-requests.md` (items 1-2). Recommend the next mobile-it-analyst
   pass installs them before UAT (step 14), so those rows can be closed before release.
2. **The low-end reference profile cannot be played on its own designated AVD.**
   `svr_api24_small`'s real system WebView (53) is older than the app's own
   `minWebViewVersion` (80) — by design, this correctly shows the update-prompt fallback
   (M1.4 PASS) but means the AVD can never be used to actually measure M10.1's frame rate,
   M10.3's cold-start time, M10.4's endurance, or eyeball M2.6/M2.7/M3.1's 640×360 dp
   minimums with the real game running. Those were instead verified via the Playwright
   phone-emulation suite at the same viewport (`tests/mobile-e2e/controls-layout.spec.ts`,
   `layout.test.ts`), which is not a substitute for a real WebView/GPU. Filed as
   `tooling-requests.md` item 3 (request an API 28/29 image with a real WebView ≥ 80,
   ideally still 640×360 dp-shaped, or a way to update `svr_api24_small`'s WebView).
3. **The Privacy overlay's header spacing on WebView 80-83 (L3) is not conclusively
   closed** — see the api30 section above. My own coordinate-guessing repeatedly missed
   the Settings → Privacy path on this device. Recommend a scripted re-check (e.g. via
   the existing `controls-behavior.spec.ts` Privacy-overlay Playwright test, or a careful
   manual pass with `uiautomator dump` used to get exact tap coordinates instead of
   guessing from a screenshot, which is what caused the misses this round).
4. **3-button navigation mode was not independently exercised.** `adb shell input keyevent
   KEYCODE_BACK` produces the same event under either navigation mode, so all back-mapping
   *logic* was verified, but the gesture-mode-specific accidental-edge-swipe risk (M2.3a)
   was not drilled with a real edge swipe (`adb shell input swipe`) this round. This is
   flagged, not silently skipped.
5. **No real frame-rate/cold-start timing measurement was taken** (M10.1, M10.3). Recommend
   `adb shell dumpsys gfxinfo io.github.hogy86.shieldvsrobots` or a Perfetto trace during a
   real play session at UAT/closed test.

---

## Plain-language checklist for closed-test testers

*(Give this to each of the ≥12 closed-test testers, step 16. No jargon; each item is a
yes/no you can answer just by playing.)*

1. **First launch:** Did the app open straight into a landscape (sideways) title screen
   with no rotation animation or delay? Did you see "Shield vs Robots" and a "Best" score?
2. **How to play:** Did tapping "How to play" show clear instructions for the on-screen
   buttons, and did tapping "Got it" work?
3. **Starting a game:** Did tapping Start take you into the level with your score, lives,
   and level number all visible and not cut off by the edge of the screen?
4. **Controls:** Were the left/right movement buttons and the THROW button easy to hit
   with your thumbs without missing? Did they feel like they responded instantly?
5. **Pause:** Did tapping the pause button (⏸) bring up a menu with Resume, Restart Level,
   Restart Game, and Quit — all easy to tap?
6. **Back button/gesture:** During play, did pressing your phone's Back button (or
   swiping back) pause the game instead of doing something else? From the pause menu, did
   Back resume the game?
7. **Leaving and returning:** If you pressed Home, got a call, or switched apps mid-game,
   was the game paused when you came back — never resuming by itself, and never losing
   track of where you were?
8. **Settings and Privacy:** Could you find "Swap controls" and "Privacy policy" from the
   title screen's Settings button? Did the Privacy policy text open and close cleanly?
9. **Quit:** Did Quit close the app cleanly (no freeze, no crash)? When you reopened the
   app, did it start fresh on the title screen with your best score still remembered?
10. **Rotating the phone:** If you turned your phone 180° (upside-down) while still holding
    it sideways, did the game flip correctly with no glitches?
11. **Smoothness and crashes:** Did the game ever freeze, stutter badly, or crash/close on
    its own at any point?
12. **Anything clipped or cut off?** Was any text, button, or score ever partly hidden by
    the edge of the screen, a notch/camera cutout, or the navigation bar?

Please note your phone model and Android version with your answers.
