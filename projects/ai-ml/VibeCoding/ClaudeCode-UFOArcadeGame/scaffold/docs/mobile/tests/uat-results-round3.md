# UAT Results, Round 3 — Shield vs Robots (Android)

## Verdict: **PASS** — the app works on Android emulators

**Stage:** Mobile Pipeline step 14 — mobile-product-manager. Final gate of the Android work
(owner decision OD-v2.0, `docs/mobile/PRD-mobile-amendment-v2.0.md` §1).
**Date run:** 2026-10-05
**Plan:** `docs/mobile/tests/uat-plan.md` (unchanged). **Earlier rounds:** `uat-results.md`
(round 1, FAIL), `uat-results-round2.md` (round 2, FAIL). Both are kept.
**Evidence:** raw log `docs/mobile/tests/uat-raw-output-round3.log` (note: `*.log` is
git-ignored in this repo, like the earlier raw logs); screenshots in
`docs/mobile/tests/screenshots/` with the suffix `_uat3.png` or `_r6.png`.

**One-line reason:** no scenario failed. The round-2 failure (F4, warning text cut off) is
fixed on both test phones, the new Speed icon reads as a double arrow on both, and the
regression pass found nothing broken. What a PASS here does **not** prove is listed in
"What 'works in an emulator' covers" below; read that section before relying on this result.

**Counts (49 scenarios):** 35 PASS re-run this round, 9 PASS carried from an earlier round,
0 FAIL, 3 PARTIAL (UAT-17, 35, 49), 1 NOT CONFIRMED (UAT-47, frame rate), plus UAT-20 PASS in
one direction with the other carried. Crashes: **0** `FATAL EXCEPTION`, **0** ANR ("app not
responding") on both devices.

---

## What was tested

| | |
|---|---|
| Source | One committed build: HEAD `cfd0ffd` on `claude/project-thread-rm5222`, working tree clean at build time. |
| Build | `scripts/refresh-android-mirror.ps1` (parity passed: 142 files + 6 named), then in `C:\Users\aaron\dev-build\shield-vs-robots`: `npm run build:android`, `npx cap sync android`, `android\gradlew.bat assembleDebug` — all exit 0, BUILD SUCCESSFUL. |
| APK | `C:\Users\aaron\dev-build\shield-vs-robots\android\app\build\outputs\apk\debug\app-debug.apk`, **3,963,797 bytes**, **SHA-256 `c85ca08fb93923e2d069d3eb4ed4505d312857896685ba7d22e9491f558d109e`**. A copy was taken before testing and that copy was installed on both devices. Package `io.github.hogy86.shieldvsrobots`, version 1.0, label "Shield vs Robots", target API 36. |
| Devices | `svr_api36_lowend_640x360` (640 × 360 dp, Android 16, WebView 133) and `svr_api36_pixel7` (915 × 412 dp, camera cutout), one at a time, `-gpu host -no-window -no-audio -no-snapshot`. Tablet and fold were not started (carried). |
| Method | As rounds 1-2. Scripted scenarios use real touches (`adb shell input`) and the Back key. Screen text and element positions are read over WebView DevTools (read-only). The long-play bot reads the canvas and presses only the on-screen buttons, with touches injected through DevTools because `adb` input is too slow to dodge. It changes no game state. |
| In the installed app | `window.__vvsTest` is `undefined` (the test hook is not reachable), and the `banner=` test query was not used: every banner below was produced by the real game. |

Code changed since the round-2 build (`cc18275`): the Android top banner
(`topBanner.ts`, `AndroidPlatform.ts`, `android.css`, and the shared `CanvasRenderer.ts`,
`constants.ts`, `Platform.ts`, `main.ts`) and the Speed glyph (`shapes.ts`).

---

## 1. Round-2 failure F4 / UAT-19: the warning text — **PASS (closed)**

The words are now a banner directly under the score row (architecture amendment A14).
Each row below was captured with the **real** warning in play, not a forced one.

| Case | Low-end 640 × 360 | Pixel 7 |
|---|---|---|
| "WARNING: ROBOTS APPROACHING", no power-up running | Full text readable. Banner 250.5-453.5 × 50.5-67.9 dp; score row ends at 46.7 dp → **3.8 dp gap, touches no score box**; inside the playfield (150-554). Text 12.0 dp. `lowend_robots_banner_uat3.png` | Same result: banner 402.3-606.8 × 51.3-69.0 dp, 3.9 dp gap, 12.0 dp text. `pixel7_robots_banner_uat3.png` |
| Same, **with a power-up timer box** ("Shield 2.8s", which pushes "Level" left to 333 dp — the case that would have covered half the old text) | Full text readable, no overlap. `lowend_robots_banner_pill_uat3.png` | Full text readable, 3.4-3.9 dp gap ("Shield 7.7s"). `pixel7_robots_banner_pill_uat3.png` |
| Same, with a five-digit score ("Score: 18100", level 4) | No overlap. `lowend_robots_banner_level4_score18100_uat3.png` | Not captured in this state (calculated: same layout rule). |
| "BOSS INCOMING" at level 5 | Readable, amber, 301.2-402.8 × 50.5-67.9 dp, 3.8 dp gap ("Score: 27225", "Power ×10.50"). `lowend_boss_banner_level5_uat3.png` | Readable, 453.1-556.0 × 51.3-69.0 dp, 3.9 dp gap. `pixel7_boss_banner_level5_uat3.png` |
| Largest system text size (font scale 2.0) | Text grows to 15.6 dp, banner 221.4-482.6 dp wide inside the 404 dp playfield, 3.5 dp under the taller score row. `lowend_font2_robots_banner_uat3.png` | Not run with the warning (menus and play re-run at 2.0, see UAT-21). |
| Does it cover play? | No. The banner's bottom edge is at 81 of 600 playfield units (98 at font 2.0). When the warning fires the robots are at about 390-520. The boss banner shows on an empty field. | Same (bottom at 71). |
| Touch | The banner takes no touches (`pointer-events: none`); it is in the playfield, away from every button. | Same. |

**The banner while paused (code review round 20, L9).**
- Low-end: the dimmed banner (50.5-67.9 dp) sits behind the "PAUSED" heading (46-82 dp).
  "PAUSED" is bright white and fully readable; the banner is a faint ghost of text behind it
  (`lowend_robots_banner_paused_uat3.png`, `lowend_font2_robots_banner_paused_uat3.png`).
  **My judgment: a player would not mind.** It looks like the rest of the dimmed game behind
  the menu. It is not tidy, and it is recorded as a cosmetic limitation, not a failure.
- Pixel 7: no overlap at all; the banner is above the heading (heading starts at 74 dp).
  `pixel7_robots_banner_paused_uat3.png`.
- After Back, play resumes and the banner is still shown, on both devices.

**New cosmetic observation O9 (not a failure).** While the game is paused during a warning,
a thin strip of the red border stays at full brightness: the bottom edge on the low-end phone,
the top and bottom edges on the Pixel 7. The dimming layer covers the safe area and the
playfield border reaches about 2 dp past it. It is only visible when pausing during a robots
or boss warning. Visible in the three paused screenshots above. Left for a later tidy-up.

**Not confirmed:** TalkBack (screen reader) speaking the banner once. No TalkBack run was
possible; `role="status"` is present on the element (read from the running app).

---

## 2. The four power-up icons, as a player sees them (M2.7; F23 r6 AC6(b) file 6)

All captures are unscaled emulator screenshots taken during real play. Crops are 48 × 48 px
(low-end) and 72 × 72 px (Pixel 7), cut 1:1 from those screenshots, in color and grayscale.

| Icon | Low-end full frame | Low-end crops | Pixel 7 full frame | Pixel 7 crops |
|---|---|---|---|---|
| Fist (5× Hit) | `m2_7_lowend_powerup_fist_uat3.png` | `m2_7_lowend_powerup_fist_crop_r6.png`, `…_crop_gray_r6.png` | `m2_7_pixel7_powerup_fist_uat3.png` | `m2_7_pixel7_powerup_fist_crop_r6.png`, `…_crop_gray_r6.png` |
| **Arrow (3× Speed)** | `m2_7_lowend_powerup_arrow_r6.png` | `m2_7_lowend_powerup_arrow_crop_r6.png`, `…_crop_gray_r6.png` | `m2_7_pixel7_powerup_arrow_r6.png` | `m2_7_pixel7_powerup_arrow_crop_r6.png`, `…_crop_gray_r6.png` |
| Circle (Shield) | `m2_7_lowend_powerup_circle_uat3.png` | `m2_7_lowend_powerup_circle_crop_r6.png`, `…_crop_gray_r6.png` | `m2_7_pixel7_powerup_circle_uat3.png` | `m2_7_pixel7_powerup_circle_crop_r6.png`, `…_crop_gray_r6.png` |
| X (Multiplier) | `m2_7_lowend_powerup_X_uat3.png` | `m2_7_lowend_powerup_X_crop_r6.png`, `…_crop_gray_r6.png` | `m2_7_pixel7_powerup_X_uat3.png` | `m2_7_pixel7_powerup_X_crop_r6.png`, `…_crop_gray_r6.png` |

All four side by side at 1:1: `m2_7_lowend_powerups_strip_1to1_uat3.png`,
`m2_7_pixel7_powerups_strip_1to1_uat3.png`.

**File-name note.** The requested names `m2_7_{lowend,pixel7}_powerup_{fist,circle,X}_r6.png`
already exist in the repo (committed captures from 2026-09-30). I did not overwrite them; the
new full frames for those three use `_uat3.png`. The arrow full frames and all crops use the
`_r6` names. The old `m2_7_*_powerup_rabbit_r6.png` files are the superseded rabbit.

**Does the arrow read as a double arrow? Honest answer:**
- **Pixel 7 (token 44-45 px across): yes, at a glance.** A line with a clear arrowhead at
  each end, in color and in grayscale.
- **Low-end (token 29-30 px across; the glyph inside is about 12 px wide): yes.** At 1:1 I
  read "↔" without effort, in color and in grayscale. Both arrowheads can be seen. It is
  small: the heads are only about 4 px, so it is "a short line with pointed ends" rather
  than a crisp drawing. It does not read as an X, a "+", a plain dash or an "H". This is the
  profile where the rabbit failed; the arrow does not fail.
- The fist, the circle and the X still read correctly next to it, and no two can be confused
  (M2.7 holds, grayscale included). This meets the condition in
  `docs/mobile/ux/design-review-round10.md` (finding 2); that round does not need reopening.
- **What the arrow does not say:** "fast". It says "sideways" or "left-right". A first-time
  player learns what it does only from the "3x Speed" box after catching it. Same caveat as
  the design review; the owner chose this icon knowing the alternative.
- 0 hits for "rabbit" in the APK's web files.

**A caught arrow gives the Speed effect — confirmed.**
- Every time an arrow token was photographed falling to the hero, "3x Speed 8.0s" (or 7.9s)
  appeared in the score row within about a second: low-end 18:17:22 and 18:37:33 UTC
  (`lowend_arrow_before_speed_uat3.png`), Pixel 7 18:48:57, 18:49:44, 18:52:44
  (`pixel7_arrow_before_speed_uat3.png`).
- The effect is real: holding a move button for 0.32 s moved the hero at about **250-280
  units/s with no effect** and **735-855 units/s with "3x Speed" showing** (low-end 233/271
  vs 762/801; Pixel 7 271/278 vs 855/767/834). That is 3×.
- The other three were also seen with the right readout: "5x Hit", "Shield", Power ×1.80.

---

## 3. What "works in an emulator" covers, and what it does not

**It covers (run on two simulated phones, this round or carried):** install and update over
the previous build; first launch and help; all touch controls; pause, Back and Quit; saved
best score and settings; Restart Level and Restart Game; leaving and returning (Home, Recents,
screen off, notifications); the privacy page with no network; airplane-mode play; the largest
text size; the two warnings; all four power-ups; levels 1 to 6 including the level-5 boss;
15 minutes of continuous play per device with no crash and steady memory.

**It does not cover, and nothing here should be read as proving it:**

| Not covered | Why | Status |
|---|---|---|
| Any real phone | Scope decision OD-v2.0. No finger, no real screen, no real GPU. | Not tested on a real device |
| Frame rate on phone hardware (M10.1) | An emulator draws with the PC's graphics card. | Emulator-only number (below); not claimed as met |
| Real edge back-swipe (N3), incoming call (N4), real fold / split-screen (N5) | Emulators cannot produce them. | Not applicable: no store release; not tested on a real device |
| Levels 7-10, the level-10 boss, Game Complete, Back during Game Complete | The bot got to level 6. | Not reached (see limitations) |
| Google Play: store listing, Data safety form, content rating, AAB size, pre-launch report, closed test | No store release. | Not applicable (amendment v2.0 §1.2, §1.4) |
| TalkBack reading the banner | No TalkBack run. | Not confirmed |
| Two-finger cases (UAT-10, 12), tablet, fold, 10+ minutes in the background, bad saved data, screen timeout | Not re-run this round. | Carried (round 1) |

---

## 4. Known limitations (none blocks this gate)

1. **Frame rate is an emulator-only measurement.** Level 1, no bot: low-end 60.0 fps, Pixel 7
   60.2 fps, longest gap 17 ms (`-gpu host`). Level-10 load was not reached. This does not
   prove or clear any real phone (amendment v2.0 §1.3).
2. **Levels 7-10 were not reached.** Low-end: level 6 (past the level-5 boss), best 33350.
   Pixel 7: level 6. Their rules are shared code covered by the unit suite and the website
   UAT; they were not played on Android.
3. **Three-button navigation on a 640 × 360 landscape phone shows "Make the window larger to
   play."** instead of the game (the 48 dp bar at the bottom leaves too little height).
   Re-checked this round: message shown, Back leaves the app (`lowend_3button_uat3.png`).
   This is the documented limit M2.3c (f3). Gesture navigation on the same phone plays normally.
4. **Privacy page placeholders.** `[DEVELOPER NAME]` and `[CONTACT EMAIL]` are still shown in
   the in-app privacy page and on the website's `public/privacy.html` (2 lines). Not required
   to be filled now that there is no store release (amendment v2.0 §1.6); still open for the
   owner (see "Open point").
5. **The arrow means "sideways" more than "fast"** (section 2).
6. **Paused during a warning:** the dimmed banner sits behind "PAUSED" on the low-end phone
   (L9), and a thin strip of the red border stays bright (O9). Cosmetic.
7. **Control hint over robots (O7, round 2).** A player who never throws keeps the one-line
   hint on screen and the lowest robots pass behind it (`lowend_robots_banner_uat3.png`).
8. **First-launch help (O6, round 2).** Opening "How to play" from the title before the first
   Start counts as having seen it.
9. **The help screen does not explain the power-up icons.** The design reviewer suggested
   listing the four tokens there (optional).
10. **Second landscape direction with the cutout (N6).** As in round 2, the emulator would not
    turn to the other direction; one direction re-measured, the other carried (round 1).
11. **Debug build only.** The APK is a debug build signed with the standard debug key. No
    release build, signing key or AAB was made.

---

## 5. Results by scenario

"L" = low-end, "P" = Pixel 7. "carried (round N)" = not re-run; that round's PASS stands.

### A. First launch, name and help
| ID | Result | Evidence |
|---|---|---|
| UAT-01 | PASS | L: cold starts 1645-2097 ms (first start of the new build 1866 ms). P: 5972, 4526, 3558, 2617 ms in the four starts straight after boot, then 2604 ms (emulator warm-up curve, same as round 2; settled ≤ 3 s). Title "Shield vs Robots", "Best: 0", four buttons. `lowend_title_uat3.png`, `pixel7_title_uat3.png` |
| UAT-02 | carried (round 1) | |
| UAT-03 | PASS (label), icon carried (round 1) | APK label `Shield vs Robots`. |
| UAT-04 | PASS | Fresh install: first Start → help naming ShieldMan → "Got it" → Level 1. A later Start goes straight to the countdown. L and P. `lowend_firsthelp_uat3.png` |
| UAT-05 | PASS | L, P: opens from the title; Back closes; "Got it" returns to the title. Pause menu is exactly Resume / Restart Level / Restart Game / Quit. |
| UAT-06 | PASS | Hint above the hero; faded (opacity 0) after the first throw. |
| UAT-07 | PASS | 0 hits for "Vanguard", "Sentinel", "Shield Invaders", "S.H.I.E.L.D" in the APK's web files or on any screen visited. |

### B. Touch controls
| ID | Result | Evidence |
|---|---|---|
| UAT-08 | PASS | L: hero 400 → 196 (hold ◀ 0.8 s) → 196 after release → 408 (hold ▶) → 408. P: 400 → 187 → 187 → 400 → 400. |
| UAT-09 | PASS | L: 543 → 373 on ◀ → 482 after sliding to ▶; slide off upward 382 → 382 (stopped). P: 534 → 348 → 477; 370 → 370. |
| UAT-10 | carried (round 1) | Needs two real fingers. |
| UAT-11 | PASS | WAIT label, dimmed (0.45), dashed outline; a second tap launched nothing; THROW again on return. `lowend_wait_uat3.png` |
| UAT-12 | carried (round 1) | (The bot's two-point touches threw while moving throughout.) |
| UAT-13 | PASS | L: ◀ 30-86, ▶ 94-150, THROW 554-610 (56 dp), 8 dp gap, PAUSE 48 dp and 184 dp from THROW, playfield 150-554. P: 64 dp, 8 dp gap, PAUSE 224 dp from THROW, playfield 264.2-744.9 between 187.8 and 821.3. Tablet carried (round 1). `lowend_play_uat3.png`, `pixel7_play_uat3.png` |
| UAT-14 | PASS | Title, Settings, pause menu: 8 dp between every pair, all ≥ 48 dp tall, nothing scrolls, on L and P at text size 1.0 and 2.0. Confirm/Cancel 8 dp apart. `lowend_confirm_uat3.png`, `pixel7_confirm_uat3.png` |
| UAT-15 | PASS | Controls hidden on title, pause, Game Over; shown in countdown and play. |
| UAT-16 | PASS | L, P: swapped THROW to the left, ◀ ▶ to the right; both work there; still On after closing the app. `lowend_swapped_uat3.png` |
| UAT-17 | PARTIAL | First half carried (round 1: 40 actions, 0 unintended pauses). Deliberate edge swipe: not applicable, no store release; not tested on a real device (N3). |
| UAT-18 | PASS | 1.8 s holds on THROW, the playfield and the "PAUSED" heading, plus a double tap and a drag: every long-press event cancelled, no pop-up, no selection, no scroll, zoom 1, on L and P. `lowend_longpress_playfield_uat3.png`, `lowend_longpress_throw_uat3.png`, `lowend_longpress_menu_title_uat3.png`, `pixel7_longpress_playfield_uat3.png` |

### C. Screen fitting
| ID | Result | Evidence |
|---|---|---|
| UAT-19 | **PASS** (was FAIL, F4) | Section 1. Safe area 30-610 × 24-328, playfield 0.505×. Title, help, settings, privacy, play, pause, prompt and Game Over all fit and none scroll. |
| UAT-20 | PASS one direction; other carried (round 1) | P: cutout inset 51.8 dp; controls, HUD and menus start at or after it. Limitation 10. |
| UAT-21 | PASS for menus, THROW/WAIT, HUD and the warning banner; "power-up timer running at 2.0" carried (round 1) | L at 2.0: title 24.4-327.6 inside 24-328 (0.4 dp spare), help, settings, pause 37.6-314.4, prompt 86.1-255.9, privacy header; THROW 560-604 and WAIT 566-598 inside the 554-610 button; banner at 2.0 in section 1. P same. `lowend_font2_*_uat3.png`, `pixel7_font2_*_uat3.png` |
| UAT-22 | PASS | Status and navigation bars `visible=false` on L and P. |
| UAT-23 | carried (round 1) | |
| UAT-24 | carried (round 1; timing per validation round 6) | |
| UAT-25 | PASS on L (limitation 3); tablet carried (round 1) | |
| UAT-26 | carried (round 1) | |

### D. Saved best score, Restart Level, settings
| ID | Result | Evidence |
|---|---|---|
| UAT-27 | carried (round 1) | |
| UAT-28 | PASS | L: "Final Score: 2100 / Best: 2100 / New best!", later 9650 and 18450 with "New best!"; title then "Best: 33350". 0-point run: "Final Score: 0 / Best: 750", no marker. |
| UAT-29 | PASS | P: "Final Score: 11350 / Best: 24975", no marker; again 3400, 6025, 6275, 9600. |
| UAT-30 | PASS on level 1 (L and P); level ≥ 2 carried (round 2) | L: 950 → 0 and 1050 → 0, lives kept, saved best unchanged. P: 450 → 0 and 550 → 0. The permanent multiplier is kept (F21 AC6; Q-v4-1 in addendum v4 still stands). |
| UAT-31 | PASS | L, P: Cancel and Back close the prompt with score unchanged; Confirm saved the best first (750 / 650) and reset to 0, 3 lives, ×1.00. |
| UAT-32 | PASS | P: run at 750 with no saved best → Home → saved best 750 at once. |
| UAT-33 | PASS (update); reboot and clear carried (round 1) | L and P: this APK installed over the round-2 build: best (35050 / 27375) and settings identical before and after. |
| UAT-34 | PASS | Play HUD shows Score, Lives, Level, Power and the active effect only. |

### E. Leaving and coming back
| ID | Result | Evidence |
|---|---|---|
| UAT-35 | PARTIAL: PASS for Home, Recents, screen off and notification shade on L and P | Pause menu on return every time; still paused 4 s later. Call screen: not applicable, not tested on a real device (N4). System dialog and tablet carried (round 1). |
| UAT-36 | PASS for about 5 s away; 10+ minutes carried (round 1) | Timer polled every 150 ms: "5x Hit 6.9s" when the screen went off and 5.5 s later; "5x Hit 0.9s" across Home (P). Score and lives identical on L and P. |
| UAT-37, 38 | carried (round 1) | |
| UAT-39 | PASS | P: process killed in the background → relaunch on the title, Best 750, settings kept, 0 crashes. |
| UAT-40 | PASS | L, P: 0 animation frames in 3 s in the background; no wake lock held by the app. |

### F. Back and Quit
| ID | Result | Evidence |
|---|---|---|
| UAT-41 | PASS in gesture mode on L and P | Play → pause; pause → resume; prompt → cancel; help and Settings → close; privacy → Settings; Game Over → title; title → leaves the app; "Make the window larger" → leaves the app (L). Three-button mode on P carried (round 1). Game Complete row not reached. |
| UAT-42 | PASS | L, P: five fast Backs → app stayed in front on the pause menu. |
| UAT-43 | PASS | L, P: Quit from pause and from the title returned to the launcher; next launch on the title with Best kept. |

### G. Privacy, offline, permissions
| ID | Result | Evidence |
|---|---|---|
| UAT-44 | PASS | Airplane mode, 2 taps, only request `https://localhost/privacy.html` (the bundled file). Bundled SHA-256 `3e8ca762…c3b662` equals `public/privacy.html`. Scrolls by finger (before/after screenshots); Close (48 dp) and Back return to Settings; not on the pause menu. `lowend_privacy_uat3.png`, `lowend_privacy_scrolled_uat3.png`, `pixel7_privacy_uat3.png` |
| UAT-45 | PASS | Cold start and play in airplane mode on L and P. No INTERNET permission; only AndroidX's internal `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. |

### H. Performance and stability
| ID | Result | Evidence |
|---|---|---|
| UAT-46 | PASS | L: 15.2 minutes of continuous bot play, levels 1-6, 3 Game Overs with "Play again", same process id throughout, memory 124-127 MB (126.1 → 127.0 MB over the last 12 minutes). P: 14 + 14 + 7 minutes, same process id, 130-132 MB. 0 crashes. |
| UAT-47 | **NOT CONFIRMED** | Limitation 1. Emulator only, level 1 only. Not a failure under amendment v2.0 §1.3. |
| UAT-48 | PASS | 0 `FATAL EXCEPTION`, 0 ANR on L and P for the whole session. Tablet and fold not run. |

### I. Shared game on the phone
| ID | Result | Evidence |
|---|---|---|
| UAT-49 | PARTIAL — levels 1-6 PASS, 7-10 not reached | Countdown at each level, level-5 boss warned and beaten on L and P, +1 life on a shield catch, all four power-ups with the right readout, instant loss when the robots reach ShieldMan's row (lives were 6). `lowend_bot_level6_uat3.png`, `pixel7_bot_level6_uat3.png` |

**Script errors in the raw log (mine, not the app's):** three `STEP ERROR` lines. One step
expected the title while a run was in progress (low-end, UAT-08 repeat; UAT-08 had already
passed). On the Pixel 7 the standing hero lost its last life mid-script, so the Restart Level
and Restart Game steps found Game Over; both were re-run from a fresh start and passed.

---

## 6. How to run the app yourself on the emulator

In plain terms: start the simulated phone, copy the app onto it, open it. From PowerShell:

```powershell
# 1. Start the simulated phone (a window opens; wait until the Android home screen shows)
C:\Users\aaron\Android\sdk\emulator\emulator.exe -avd svr_api36_pixel7 -gpu host

# 2. In a second PowerShell window: install the app (-r replaces an older copy, keeping your best score)
C:\Users\aaron\Android\sdk\platform-tools\adb.exe install -r C:\Users\aaron\dev-build\shield-vs-robots\android\app\build\outputs\apk\debug\app-debug.apk

# 3. Open it (or click the "Shield vs Robots" icon in the phone's app list)
C:\Users\aaron\Android\sdk\platform-tools\adb.exe shell am start -n io.github.hogy86.shieldvsrobots/.MainActivity
```

- For the small phone use `-avd svr_api36_lowend_640x360` in step 1.
- The app is already installed on both simulated phones from this test, so step 2 is only
  needed after a new build. To rebuild, see `docs/mobile/README-mobile.md`.
- Play with the mouse: click and hold the ◀ ▶ buttons, click THROW. The phone's Back button
  is in the emulator's side toolbar. (A mouse is one finger, so you cannot move and throw at
  the same moment the way two thumbs can.)
- To stop: close the emulator window, or
  `C:\Users\aaron\Android\sdk\platform-tools\adb.exe emu kill`.
- If step 2 says "no devices", the phone has not finished starting; wait and try again.

---

## Open point for the owner (not blocking; raised before, no answer needed to finish)

**Privacy page placeholders** (affects `public/privacy.html`, shown on the website and in the
app under Settings → Privacy policy). Two lines still read `[DEVELOPER NAME]` and
`[CONTACT EMAIL]`. Options, as in amendment v2.0 §1.6:
- (a) Leave as is. No work. A reader sees bracketed placeholders.
- (b) **Recommended:** replace the two lines with a neutral sentence such as "This app is not
  published on an app store." Small docs change plus a short security re-check; nothing
  personal is published.
- (c) Fill in a real name and email. That publishes personal details on the website.

No other owner decision is pending. Nothing was decided on the owner's behalf in this round.

## Emulator and machine state after the run

Both emulators stopped (`adb emu kill`), `adb` server stopped, Gradle daemon stopped
(1 stopped). Settings changed during the run and restored, verified on each device at the end:
font scale 1.0, airplane mode off, navigation mode 2 (gesture), auto-rotate on and user
rotation 0, screen timeout unchanged. The app and its test data (best scores) remain
installed; app data was cleared once per device as part of the test. No existing file was
edited; nothing was committed or pushed; no account, key or Play Console was touched. No
command was denied.

## Next steps

1. Step 14 is PASS. Under OD-v2.0 this is the end of the Mobile Pipeline; steps 15-17 do not run.
2. The Speed glyph and the four shared banner files are shared code: the website's own gates
   (design review, UAT, deploy, smoke test) still apply before the website ships them
   (`.claude/CLAUDE.md` "One codebase").
3. Optional tidy-ups, each through the normal loop if wanted: O9 and L9 (pause during a
   warning), the help screen naming the four icons, the privacy placeholders.
4. If a store release is ever wanted, every item in amendment v2.0 §1.2 and §1.4 reopens and a
   real-phone check comes first.

## Sources

`docs/mobile/PRD-mobile.md` v1.9 (M2-M11) and `docs/mobile/PRD-mobile-amendment-v2.0.md`
(OD-v2.0, Q-v5-2); `docs/PRD-addendum-v5-r6.md` (F23 r6 AC4.2, AC6(b) file 6);
`docs/PRD-addendum-v4.md` (F21, F22); `docs/PRD.md` (F3 AC6, F12 AC10-11, NFR-9);
`docs/mobile/tests/uat-plan.md`; `docs/mobile/tests/uat-results.md`;
`docs/mobile/tests/uat-results-round2.md` (F4, N1-N6, O6-O8);
`docs/mobile/reviews/code-review-round20.md` (L9) and `-round21.md`;
`docs/mobile/architecture/amendment-A14.md` (§6.5 item 5, §10.1 device row);
`docs/mobile/ux/design-review-round10.md` (finding 2); `docs/mobile/tests/device-matrix.md`.
