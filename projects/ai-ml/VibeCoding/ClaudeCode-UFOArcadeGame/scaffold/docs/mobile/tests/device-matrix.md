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

---

# Round 2 — 2026-09-27 (mobile-lead-tester, after F1 round-1 fix + code-review-round6 PASS)

**Build tested:** debug APK built from the mirror `C:\Users\aaron\dev-build\shield-vs-robots`
at the same commit `b3d53a7` (clean working tree, no test-writer changes since round 1).
**Environment:** JAVA_HOME/ANDROID_HOME/AAPT2_PATH per the tooling log, matching round 1.
**New AVDs this round** (installed by mobile-it-analyst per `docs/mobile/tooling-requests.md`):
`svr_api36_tablet` (`-gpu host -no-window`), `svr_api36_fold` (`-gpu host -no-window`),
`svr_api29_webview` (`-gpu swiftshader_indirect -no-window`, actually an **API 28**
`google_apis` x86_64 image with real WebView 69 — the AVD name is a holdover from the
original request, which asked for WebView ≥ 80; that request could not be satisfied without
the owner's Play Store sign-in, per it-analyst's completion note. See "Known gaps" below).
**Screenshots:** `docs/mobile/tests/screenshots/`, filenames prefixed `api36_tablet_`,
`api36_fold_`, `api28_webview69_`.

## Coverage vs. the required matrix — round 2 rows only

| Required row | Status | Notes |
|---|---|---|
| Tablet | **DONE** | `svr_api36_tablet` (Pixel Tablet profile, 2560×1600, WebView 133): full functional pass. See detail table below. Closes the tablet row and closes carry-forward L4 for this form factor. |
| Foldable (folded and unfolded) | **PARTIAL — AVD fidelity gap, not an app bug** | `svr_api36_fold` boots and the app runs without crashing in both `CLOSED` and `OPENED` device states, but the app's window frame (`Rect(0, 765 - 1080, 1575)`, a 412×309 dp landscape box letterboxed into a 1080×2340 portrait physical display) is **identical between the two device states** — this AVD does not actually resize the app's window when its posture changes, so the M2.9 "re-lays-out ≤1s" behavior has nothing to react to and cannot be meaningfully exercised here. Separately, 412×309 dp is below the app's own documented minimum reference profile (640×360 dp); the DOM (confirmed via the WebView devtools socket) contains the expected title-screen markup, but only a small icon is visible on the actual composited screencap. See "Known gaps" below. |
| Pre-API-30 WebView ≥ 80 (round-1 tooling-request item 3 / carry-forward I2) | **BLOCKED — real crash found, not the WebView-version gap the request was about** | `svr_api29_webview` is an API 28 image with real WebView 69 (< 80), so it was always going to show the M1.4 fallback rather than close the ≥80 insets gap. Instead, it surfaced a **new, unrelated, blocking crash-on-launch** — see F1 in `validation-report-round2.md`. The original ≥80-WebView gap is therefore still open **and** now additionally blocked by this crash on any API 28/29 device tested so far. |

## Functional pass detail (svr_api36_tablet, API 36, WebView 133.0.6943.137)

| Check | Result | Evidence |
|---|---|---|
| Cold start → title | PASS, unclipped, centered at its own aspect (not stretched to the ultra-wide tablet screen) | `screenshots/api36_tablet_title2.png` |
| M8.1/M8.2 Help overlay | PASS | `screenshots/api36_tablet_help.png` |
| Gameplay HUD/controls | PASS, nothing clipped | `screenshots/api36_tablet_playing.png` |
| M4.1/M4.2/M4.3: Home during PLAYING, relaunch | PASS — resumed on PAUSED, score (100) preserved | `screenshots/api36_tablet_resume.png` |
| M5: Back from PAUSED → Resume | PASS | `screenshots/api36_tablet_back_from_pause.png` |
| M5: Back from active PLAYING → pause | PASS | `screenshots/api36_tablet_back_from_play.png` |
| `adb logcat` throughout | PASS | No `FATAL EXCEPTION`, no `AndroidRuntime` crash, no `net::ERR_*` |

## Functional pass detail (svr_api36_fold, API 36, resizable/foldable device-state profile)

| Check | Result | Evidence |
|---|---|---|
| Boot + install | PASS | — |
| `cmd device_state print-states` | 3 states available: CLOSED(1), HALF_OPENED(2), OPENED(3), all `app_accessible=true` | raw-output-round2.log |
| Cold start in OPENED (default) | App runs, no crash; window frame `Rect(0, 765 - 1080, 1575)` (412×309 dp landscape box letterboxed into the 1080×2340 portrait physical display) | `screenshots/api36_fold_opened_title_with_immersive_hint.png`, `_letterboxed.png` |
| DOM check via WebView devtools socket | `innerWidth=412 innerHeight=309`; `document.body` contains the expected `#app-root`/`#hud-root`/`#game-canvas`/title-screen markup — the app is running, not stuck | `screenshots/api36_fold_opened_cdp_dom_capture.png`, raw-output-round2.log |
| Switch to CLOSED via `cmd device_state state 1` | App stays alive (same pid), window frame **unchanged** (`Rect(0, 765 - 1080, 1575)`, identical to OPENED) | `screenshots/api36_fold_closed_title.png` (pixel-identical layout to the OPENED screenshot) |
| `adb logcat` throughout both states | PASS | No `FATAL EXCEPTION`/`AndroidRuntime`, no `net::ERR_*` |

**Disposition:** this AVD does not simulate a real foldable's window-resize-on-fold
behavior — it changes an internal posture/sensor value only, while the app's actual window
bounds stay fixed. M2.9 cannot be verified against this specific AVD as a result. This is
recorded as a known gap (below), not a code-review finding, since there is no evidence the
app itself would fail to re-layout if the OS actually resized its window (the app's normal
resize handling is already unit- and e2e-tested via `layout.test.ts` and
`controls-layout.spec.ts` at multiple viewport sizes, including narrow ones).

## Crash detail (svr_api29_webview, API 28, real WebView 69.0.3497.100)

See **F1** in `docs/mobile/tests/validation-report-round2.md` for the full stack trace,
root-cause analysis, and suggested fix. Summary: `am start` crashes the activity
immediately and reproducibly (two clean attempts, identical stack both times) with
`UnsupportedOperationException: Unknown windowLayoutInDisplayCutoutMode: 3`, thrown from
`PhoneWindow.generateLayout` before Capacitor/WebView ever initialize. Root cause is three
unqualified `android:windowLayoutInDisplayCutoutMode="always"` items in
`android/app/src/main/res/values/styles.xml` (lines 13, 20, 31) with no
API-version-qualified override, unlike the `androidx.core:core-splashscreen` library's own
theme resources, which do version-gate the identical attribute below API 30.
Screenshots: `screenshots/api28_webview69_crash_launch1.png`, `_launch2.png` (both show the
OS launcher home screen because the activity crashed and finished).

## Known gaps (round 2, not silently dropped)

1. **`svr_api36_fold` does not resize the app's window between fold states** on this
   specific "resizable" AVD device-state configuration — a real Z Fold-class device does
   give the unfolded app a full-size landscape window; this AVD gives the same
   412×309 dp letterboxed window in both `CLOSED` and `OPENED`. M2.9's fold/unfold
   re-layout behavior cannot be exercised on this AVD as configured. Recommend covering
   this via the Play pre-launch report (which runs on real device farms including
   foldables) and/or real hardware at UAT/closed test, per the task's own guidance not to
   block on this.
2. **The 412×309 dp viewport this AVD provides is below the app's documented minimum
   reference profile (640×360 dp)** regardless of fold state — this is a property of the
   AVD's chosen window size, not of a real folded/unfolded physical display, so it is not
   treated as a new minimum-profile regression; it simply means this AVD cannot be used
   to validate the low-end reference profile either (the same limitation `svr_api24_small`
   already had for a different reason in round 1).
3. **`svr_api29_webview`'s real WebView (69) is still below the app's `minWebViewVersion`
   (80)**, so even once F1 (the crash) is fixed, this AVD will only ever be able to confirm
   the M1.4 fallback path, not the "pre-API-30 insets with WebView ≥ 80" scenario the
   original tooling request (item 3) was about. Per the task instructions, a
   pre-API-30-with-WebView≥80 device cannot be reached on emulators without the owner's
   Google/Play Store sign-in — **recorded here as a known gap to be covered by the Play
   pre-launch report and the closed test, not a blocker for this gate.**
4. **Carried from round 1, still open:** the Privacy overlay header spacing check on real
   WebView 80-83 (`svr_api30_mid`) was not re-attempted this round (see
   validation-report-round2.md's carry-forwards section); 3-button navigation mode was
   still not independently drilled with a real edge-swipe.

---

## Plain-language checklist addendum for closed-test testers (round 2)

*(Add this item to the round-1 checklist above if any closed-test tester is on a tablet or
foldable device.)*

13. **Tablets and foldables:** If you're using a tablet or a foldable phone, did the game
    center itself nicely in the middle of the screen with readable text and buttons — not
    stretched, squashed, or cut off? If you have a foldable phone, did folding or unfolding
    it while playing keep your progress (score, lives, level) without the game
    freezing or losing your place?

---

# Round 3 — 2026-09-27 (mobile-lead-tester, after code-review-round7 PASS: fix for validation-report-round2 F1)

**Build tested:** debug APK built from the mirror `C:\Users\aaron\dev-build\shield-vs-robots`
at the same working tree reviewed by `code-review-round7` (HEAD `0ae4130` plus the
uncommitted step-7 F1 fix and step-6 architecture-doc edit; `git status` confirmed clean
apart from those pre-existing uncommitted doc changes, which this step did not touch).
**Environment:** JAVA_HOME/ANDROID_HOME/AAPT2_PATH per the tooling log, matching rounds 1-2.
**AVDs used this round (all six from the prior tooling request, no new request needed):**
`svr_api29_webview` (API 28, `-gpu swiftshader_indirect -no-window`), `svr_api24_small`
(API 24, `-gpu swiftshader_indirect -no-window`), `svr_api30_mid` (API 30,
`-gpu swiftshader_indirect -no-window`), `svr_api36_pixel7` (API 36, `-gpu host -no-window`,
per this round's instructions), `svr_api36_tablet` (API 36, `-gpu host -no-window`),
`svr_api36_fold` (API 36, `-gpu host -no-window`).
**Screenshots:** `docs/mobile/tests/screenshots/`, filenames suffixed `_round3_*`.

## Coverage vs. the required matrix — round 3

| Required row | Status | Notes |
|---|---|---|
| Small, low-end phone | **DONE (unchanged)** | `svr_api24_small` re-verified: cold launch, process alive, 0 FATAL EXCEPTION. Still only reachable up to the M1.4 fallback screen on this AVD's real WebView 53 — same known gap as rounds 1-2, not reopened or worsened by this round's fix. |
| Tall phone with a camera cutout | **DONE** | `svr_api36_pixel7` full functional pass, see detail table below. |
| Tablet | **DONE** | `svr_api36_tablet` full functional pass, see detail table below. |
| Foldable (folded and unfolded) | **PARTIAL — same AVD fidelity gap as round 2, reproduced identically, not worsened** | See detail table below. |
| Both landscape orientations | **DONE** | 180° flip re-verified on `svr_api36_pixel7` via `adb emu rotate`: `ROTATION_90` → `ROTATION_270`, clean re-render, no reflow glitch, no clipping. |
| Gesture navigation | **DONE (same proxy as rounds 1-2)** | All back-mapping checks driven via `adb shell input keyevent KEYCODE_BACK`, which dispatches identically regardless of navigation mode. |
| 3-button navigation | **NOT INDEPENDENTLY DRILLED, per this round's own instructions** ("if you can't drill them") | Same limitation as rounds 1-2: a real edge-swipe drill (`adb shell input swipe` from the literal edge pixel, `navigation_mode 0`) was not attempted this round. Recommend UAT (step 14). |
| Play a full round | **PARTIAL (unchanged scope for this round — F1 re-verification was the priority)** | Movement, THROW, PAUSE, Resume, Restart-Game-confirm/Cancel all exercised on `svr_api36_pixel7`; Home/Restart Level tested on `svr_api36_tablet`. A full 10-level round remains UAT/closed-test territory, unchanged from rounds 1-2. |
| Background and resume | **DONE** | `svr_api36_pixel7` (Home during PAUSED → still PAUSED, score/lives/formation unchanged) and `svr_api36_tablet` (Home during PLAYING → resumed on PAUSED, score preserved). |
| Press back | **DONE** | Back-mapping table below (pixel7): PAUSED→Resume, PLAYING→pause, Restart-Game-confirm→Cancel (no reset). Tablet: PAUSED→Resume, PLAYING→pause. |
| Nothing clipped | **DONE** | No clipped HUD, controls, or menu text observed on `svr_api36_pixel7`, `svr_api30_mid`, or `svr_api36_tablet` at any screen captured this round (title, help, settings, playing, pause, privacy, restart-confirm, post-relaunch). |
| Smoothness | **NOT MEASURED (unchanged — real frame-rate/timing needs UAT/closed-test tooling)** | Same disposition as rounds 1-2; play felt smooth on `-gpu host` (pixel7, tablet, fold) and adequate on `-gpu swiftshader_indirect` (api24/api28/api30). |

## Functional pass detail (svr_api29_webview, API 28, real WebView 69.0.3497.100) — F1 re-verification

| Check | Result | Evidence |
|---|---|---|
| Cold launch x2, clean state (`am force-stop` + `logcat -c` between) | **Both: `Status: ok`, pid alive, 0 FATAL EXCEPTION** (previously: crash both times, round 2) | raw-output-round3.log |
| M1.4 fallback text renders | PASS | `screenshots/api28_webview69_round3_fixed.png` — "Please update Android System WebView from the Play Store." |
| `dumpsys window` cutout-mode label | Shows `always` (code-review-round7 I1's known false-positive label; effective compiled value is 1/`shortEdges`, confirmed via `aapt2 dump resources`) | Not a regression — see validation-report-round3.md Part 3 |
| `mCurrentFocus` | `io.github.hogy86.shieldvsrobots/.MainActivity` | raw-output-round3.log |

## Functional pass detail (svr_api24_small, API 24, real WebView 53.0.2785.124) — regression spot-check

| Check | Result | Evidence |
|---|---|---|
| Cold launch, clean state | `Status: ok`, pid alive, 0 FATAL EXCEPTION | `screenshots/api24_small_round3_regression_check.png` |

## Functional pass detail (svr_api30_mid, API 30, real WebView 83.0.4103.106) — regression spot-check + L3 closure

| Check | Result | Evidence |
|---|---|---|
| Cold start → title | PASS, unclipped | `screenshots/api30_mid_round3_title.png` |
| Settings screen | PASS, clear spacing on every button | `screenshots/api30_mid_round3_settings.png` |
| **Privacy policy overlay header (L3, open since round 2)** | **PASS — CLOSED.** Clear, unambiguous spacing between the "Privacy policy" title and the Close button on this real WebView-83 device | `screenshots/api30_mid_round3_privacy.png` |
| `adb logcat` throughout | 0 FATAL EXCEPTION, 0 `net::ERR_*` | raw-output-round3.log |

**L3 disposition: CLOSED.** The flex-`gap` regression `code-review-round4` predicted for
Chromium < 84 does not reproduce anywhere on this real WebView-83 device, including the
Privacy overlay header sub-case round 2 could not get a clean screenshot of.

## Functional pass detail (svr_api36_pixel7, API 36, real WebView 133.0.6943.137, `-gpu host`)

| Check | Result | Evidence |
|---|---|---|
| Cold start → title, unclipped | PASS | `screenshots/api36_pixel7_round3_title.png` |
| **I5 (code-review-round7): faint outlined box below Quit** | **Reproduces identically this round** — passed to mobile-ui-ux-designer round 2 | Same screenshot; also visible in `_after_relaunch.png` |
| M8.1/M8.2 Help overlay | PASS, correct control text, "Got it" → TITLE | `screenshots/api36_pixel7_round3_help.png` |
| M7.3/M8.2 Settings screen | PASS, "Swap controls: Off"/"Privacy policy"/"Close" | `screenshots/api36_pixel7_round3_settings.png` |
| Start → gameplay (HUD, controls, formation) | PASS, nothing clipped | `screenshots/api36_pixel7_round3_playing.png` |
| THROW (spawns a shield, score updates) | PASS, Score: 100 | `screenshots/api36_pixel7_round3_throw.png`, `_pause.png` |
| PAUSE → pause menu | PASS, Resume/Restart Level/Restart Game/Quit all present | `screenshots/api36_pixel7_round3_pause.png` |
| M4.1/M4.2/M4.3: Home during PAUSED, relaunch | PASS, still PAUSED, formation/score/lives unchanged | `screenshots/api36_pixel7_round3_resume_after_home.png` |
| M5: Back from PAUSED → Resume | PASS | `screenshots/api36_pixel7_round3_back_from_pause.png` |
| M5: Back from active PLAYING → pause | PASS | `screenshots/api36_pixel7_round3_back_from_play.png` |
| M5: Back from "Restart Game" confirmation → Cancel, no reset | PASS (reached via a testing-harness mis-tap on Restart Game, same class of miss round 2 had on the tablet — not an app defect) | `screenshots/api36_pixel7_round3_quit_check.png`, `_back_from_confirm.png` |
| M2.1/M2.1a: 180° landscape flip | PASS, `ROTATION_90`->`ROTATION_270` via `adb emu rotate`, clean re-render | `screenshots/api36_pixel7_round3_rotated_check1.png` |
| M6.1: Quit | PASS, `topResumedActivity` returned to the Nexus launcher | raw-output-round3.log |
| M6.1/M6.2/M6.3: Relaunch after Quit | PASS, fresh title, Best: 100 persisted (score saved before quit) | `screenshots/api36_pixel7_round3_after_relaunch.png` |
| `adb logcat` for the entire session | 0 FATAL EXCEPTION, 0 `net::ERR_*` | raw-output-round3.log |

## Functional pass detail (svr_api36_tablet, API 36, real WebView 133.0.6943.137)

| Check | Result | Evidence |
|---|---|---|
| Cold start → title, centered at its own aspect (not stretched) | PASS | `screenshots/api36_tablet_round3_title.png` |
| M8.1/M8.2 first-launch Help overlay | PASS | `screenshots/api36_tablet_round3_playing.png` |
| Gameplay HUD/controls | PASS, nothing clipped, generous unused side margins | `screenshots/api36_tablet_round3_playing2.png` |
| M4.1/M4.2/M4.3: Home during PLAYING, relaunch | PASS — resumed on PAUSED, score (100) preserved | `screenshots/api36_tablet_round3_resume.png` |
| M5: Back from PAUSED → Resume | PASS | `screenshots/api36_tablet_round3_back_from_pause.png` |
| M5: Back from active PLAYING → pause | PASS | `screenshots/api36_tablet_round3_back_from_play.png` |
| `adb logcat` throughout | 0 FATAL EXCEPTION, 0 `net::ERR_*` | raw-output-round3.log |
| I5 faint box | **Not observed on this form factor** — consistent with round 2, where it was also API-36-phone-specific | — |

## Functional pass detail (svr_api36_fold, API 36, resizable/foldable device-state profile)

| Check | Result | Evidence |
|---|---|---|
| Boot + install | PASS | — |
| `cmd device_state print-states` | Same 3 states as round 2: CLOSED(1), HALF_OPENED(2), OPENED(3), all `app_accessible=true` | raw-output-round3.log |
| Cold start in OPENED (default) | App runs, no crash; window frame `Rect(0, 765 - 1080, 1575)` — **identical to round 2's own reading** | `screenshots/api36_fold_round3_opened.png` |
| Switch to CLOSED via `cmd device_state state 1` | App stays alive (same pid, 2273), window frame **unchanged**, identical to OPENED | `screenshots/api36_fold_round3_closed.png` |
| `adb logcat` throughout both states | 0 FATAL EXCEPTION | raw-output-round3.log |

**Disposition: unchanged from round 2.** This AVD reproducibly does not simulate a real
foldable's window-resize-on-fold behavior — confirming round 2's finding was a stable AVD
fidelity limit, not a one-off flake. M2.9 still cannot be meaningfully exercised on this
specific AVD. Not a code-review finding; the app's normal resize handling is unit/e2e
tested at multiple viewport sizes independent of this AVD's limitation.

## Known gaps (round 3, not silently dropped)

1. **`svr_api36_fold` still does not resize the app's window between fold states** — same
   gap as round 2, reproduced identically this round, confirming it is a stable AVD
   limitation rather than a flake. Per this round's own instructions, this is being
   decided by the product manager/architect and does not block this gate.
2. **`svr_api29_webview`'s real WebView (69) is still below `minWebViewVersion` (80)** —
   F1 is fixed, but this AVD still can only confirm the M1.4 fallback path, not the
   "pre-API-30 insets with a modern WebView" scenario. Per this round's own instructions,
   this remains blocked on the owner's Google/Play Store sign-in and is covered instead by
   the Play pre-launch report and the closed test — not a blocker for this gate.
3. **3-button navigation / real edge-swipe drill still not independently exercised** —
   same carry-forward as rounds 1-2; recommend UAT (step 14) perform the drill with a real
   `adb shell input swipe` from the literal edge pixel in `navigation_mode 0`.
4. **Closed this round:** the Privacy overlay header spacing check on real WebView 80-83
   (L3, open since round 1/round 2) — see the `svr_api30_mid` section above.

---

## Plain-language checklist addendum for closed-test testers (round 3)

*(No new tester-facing behavior changed this round — the fix is a launch-crash repair on
an old Android version, invisible to a tester whose phone never showed the crash. No new
checklist item is needed. If any closed-test tester reports the app failing to open at
all on an older Android phone, that would be the one signal to watch for — everything
tested this round says it should not happen anymore.)*
