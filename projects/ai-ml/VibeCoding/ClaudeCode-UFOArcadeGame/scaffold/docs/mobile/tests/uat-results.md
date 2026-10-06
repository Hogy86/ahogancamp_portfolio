# UAT Results — Shield vs Robots (Android)

## Verdict: **FAIL**

**Stage:** Mobile Pipeline Step 14 — mobile-product-manager
**Date run:** 2026-09-30
**Plan:** `docs/mobile/tests/uat-plan.md`
**Evidence:** screenshots `docs/mobile/tests/screenshots/*_uat.png`; raw log `docs/mobile/tests/uat-raw-output.log`

**One-line reason:** two measured breaches of M3.1 ("adjacent targets are ≥ 8 dp apart") in the
menus, one of them on the destructive Restart Game prompt, plus a missed launch-time bound on
the fold AVD. Separately, frame rate (M10.1) and anything past level 1 could not be confirmed
on emulators. mobile-release-engineer must not upload a build on this result.

**Counts (49 scenarios):** 41 PASS, 2 FAIL (UAT-14; UAT-24 on timing), 4 PARTIAL (UAT-13, 17, 30, 35),
2 NOT CONFIRMED / NOT RUN (UAT-47, 49). Crashes: **0** `FATAL EXCEPTION` on all four devices.

Everything else a player does — first launch, help, touch controls, pause, back, leaving and
returning, saved best score, Restart Level, settings, privacy page, offline, small and large
screens, largest text size — behaved as specified.

---

## What was tested

| | Build A | Build B |
|---|---|---|
| Source | HEAD `451dfa9` (mirror `src/` and `public/` identical to HEAD) | HEAD `451dfa9` + uncommitted working-tree changes made by another session at 15:06-15:10: comment-only edits in `android.css` / `glyphs.ts`, and new power-up glyph art in `src/render/shapes.ts` |
| APK | `app-debug.apk`, 3,962,993 bytes, built 15:03 | `app-debug.apk`, 3,963,269 bytes, rebuilt in the mirror by another session at 16:00 |
| Used on | `svr_api36_lowend_640x360`, `svr_api36_pixel7` — **all primary scenarios** | `svr_api36_tablet`, `svr_api36_fold` — spot checks only |

- Build B was picked up because the shared mirror was refreshed while UAT was running. It
  differs from A only in power-up icon drawing (out of scope for this UAT) and comments. The
  tablet/fold results (layout, lifecycle, prompt) do not depend on it. The UAT re-run should
  use one committed build.
- A first build from `eaa9de5` was used for the opening low-end scenarios (UAT-01, 04, 06, 08,
  09, 11, 28-31). HEAD moved to `451dfa9` (final `public/privacy.html`) mid-session; I rebuilt
  and installed A **over** it, which doubled as the update test (UAT-33). `src/` is identical
  between the two commits.
- Build: `scripts/refresh-android-mirror.ps1` (parity check passed), `npm run build:android`,
  `npx cap sync android`, `gradlew assembleDebug` — BUILD SUCCESSFUL.
- AVDs: lowend (1280 × 720 @ 320 dpi = 640 × 360 dp, `-gpu swiftshader_indirect`, and `-gpu
  host` for the frame-rate comparison), pixel7 (`-gpu host`, 915 × 412 dp), tablet (1280 × 800
  dp), fold (412 × 309 dp window, CLOSED state per the device-matrix fold procedure).
- Method: real touch input through `adb`; kernel multi-touch events for two-finger cases;
  screen state and element positions read over WebView DevTools. One play bot (reads the
  canvas, presses only the on-screen buttons) for long sessions.

---

## Failures (routed, not patched)

### F1 — Confirm and Cancel touch each other on the Restart Game prompt (M3.1, M3.8) — **FAIL**
- **Scenario:** UAT-14. **Devices:** all (measured on lowend and tablet).
- **Evidence:** lowend: Confirm x 100-320 dp, Cancel x 320-540 dp → **0 dp** gap
  (`lowend_09_confirm_uat.png`; same at font 2.0, `lowend_23_font2_confirm_uat.png`).
  Tablet: Confirm 420-640, Cancel 640-860 → **0 dp** (`tablet_05_confirm_uat.png`).
- **Expected:** ≥ 8 dp between adjacent touch targets (M3.1).
- **Why it matters:** Confirm discards the whole run, score and permanent multiplier; it sits
  flush against Cancel with no space between them.
- **Likely cause:** `.confirm-box` has no gap rule for its two Android-only buttons
  (`src/style.css:202`, `src/platform/android/android.css:197`).
- **Route:** mobile-junior-developer → mobile-lead-developer (step 7-8), then step 9 should
  add a gap assertion for this prompt to `controls-layout.spec.ts`.

### F2 — Menu rows are 6 dp apart on phone-height windows (M3.1) — **FAIL**
- **Scenario:** UAT-14. **Devices:** lowend and pixel7 (any window ≤ 420 dp tall).
- **Evidence (dp, top-bottom):** lowend pause menu 91.8-139.8 / 145.8-193.8 / 199.8-247.8 /
  253.8-301.8; lowend Settings 118.8-166.8 / 172.8-220.8 / 226.8-274.8; pixel7 title 132-180 /
  186-234 / 240-288 / 294-342. Gap **6 dp** every time. Tablet rows are 12 dp apart (PASS there).
- **Expected:** ≥ 8 dp (M3.1).
- **Cause:** deliberate: `android.css:181-195` sets `gap: 6px` under `max-height: 420px` so
  the title menu fits the 304 dp safe height (M2.3c rule 3). The two rules were never
  reconciled.
- **Route:** mobile-junior-developer + mobile-ui-ux-designer. At 8 dp the title column grows
  about 10 dp: it still fits at the default font on the reference phone (≈ 287 of 304 dp) and
  just fits at font 2.0 (≈ 302 of 304 dp), so a fix looks feasible; the designer should
  confirm. If it cannot fit, it comes back to me for a dated PRD decision — it is not relaxed
  silently.

### F3 — Fold AVD: prompt takes longer than 5 s to appear (M2.10a (a) timing) — **FAIL (low)**
- **Scenario:** UAT-24. **Evidence:** `am start -W` TotalTime 8181 ms (first launch after
  install), then 7073, 5556, 4417, 5181 ms on four cold starts with only this emulator
  running. Rounds 4-5 recorded 5.1-5.5 s first launch and 1.7-1.9 s afterwards.
- **Behavior is correct:** only "Make the window larger to play." shows, 5 taps change nothing,
  Back leaves with the process alive, the message fits at font 2.0, 0 crashes.
- **Route:** mobile-lead-tester to re-measure on a settled emulator and say whether this is the
  AVD or the app (the same APK cold-starts in 2.6-3.0 s on lowend and pixel7).

---

## Not confirmed on emulators (not PASS)

| # | Item | What was measured | Where it goes |
|---|---|---|---|
| N1 | **M10.1 frame rate** (UAT-47) | Level 1 only. lowend with software GPU: 28.9 fps, longest gap 100 ms. Same AVD with `-gpu host`: **55.4 fps**, longest gap 167 ms. pixel7 (`-gpu host`, alone): **49.7 fps** in play (60.0 on the title), longest gap 267 ms. Level-10 load never reached. The low-end ≥ 30 floor holds with a GPU; the mid-range ≥ 55 target and the ≤ 250 ms freeze limit were **not** met on the emulator. The emulator draws through a GL translation layer, so this neither proves nor clears a real phone. | Owner question Q1 below. |
| N2 | **Levels 2-10, bosses, Game Complete** (UAT-49; M0.4; Back during Game Complete; F21 on level ≥ 2 and in a boss phase) | The bot never cleared level 1 (best 2,650 points). Restart Level rollback was confirmed on level 1 only. | UAT re-run with a better bot or a human player; otherwise closed test. Unit tests cover the rules. |
| N3 | **Real edge back-swipe** (UAT-17 second half; M2.3a; M2.5 reveal swipe; M5.3 preview animation) | 40 presses/holds/slides on the edge-most controls caused 0 pauses and 0 exits, and every control starts at the 30 dp side inset. But this emulator classifies injected touches as stylus and Android ignores stylus for the back gesture (it did not fire in the system Settings app either), so "0 accidental backs" proves little. | Closed-test checklist item. |
| N4 | **Incoming call screen** (part of UAT-35) | The emulator showed no call screen, only a status-bar icon. | Closed test. |
| N5 | **M2.9 real fold/split-screen, M2.10 portrait-shaped window** | The fold AVD does not resize on unfold (known). The tablet stayed landscape under physical rotation (0 ↔ 180), so Android never produced a portrait-shaped window. | Play pre-launch report / closed test. |

---

## Results by scenario

### A. First launch, name and help
| ID | Result | Evidence |
|---|---|---|
| UAT-01 | PASS | lowend first launch after clear 4121 ms; settled cold starts 2866-3045 ms (≤ 5 s). pixel7 2580-3012 ms (≤ 3 s; one of four samples was 12 ms over); first launch after clear 5581 ms while a second emulator was under load. Title text exact, "Best: 0". `lowend_01_title_uat.png` |
| UAT-02 | PASS (note O1) | Phone held portrait, auto-rotate off: display went ROTATION_0 → ROTATION_90, title landscape, no rotation at Start. `pixel7_01_launch_frame2..6`, `pixel7_02_title_portrait_held` |
| UAT-03 | PASS (note O2) | `aapt2`: `application-label:'Shield vs Robots'`. Reference phone drawer shows the full label on one line (`lowend_29_app_drawer`). Adaptive icon with monochrome layer; plain blue circle (`pixel7_15_launcher_icon_crop`). |
| UAT-04 | PASS | Help shown once, names ShieldMan, "Got it" → "LEVEL 1" countdown; second Start goes straight to the countdown. `lowend_02_help`, `lowend_03_intro` |
| UAT-05 | PASS | Opens from the title; Back closes; pause menu has exactly Resume / Restart Level / Restart Game / Quit. |
| UAT-06 | PASS | "Left / right: move · THROW · Pause: top corner" at y 262-281 dp, above the hero; class `faded`, opacity 0 after the first throw. `lowend_04_playing` |
| UAT-07 | PASS | No "Vanguard" / "Sentinel" / "Shield Invaders" on any screen visited or in the APK's bundled JS/HTML/CSS; found "Shield vs Robots", "ShieldMan", "robot forces", "ROBOTS APPROACHING". |

### B. Touch controls
| ID | Result | Evidence |
|---|---|---|
| UAT-08 | PASS | Hero x 399 → 183 (hold ◀ 0.8 s) → 183 after release → 400 (hold ▶). |
| UAT-09 | PASS | One finger ◀ then slide to ▶: x 109 while on ◀, 335 after sliding to ▶. Slide off upward: 499 → 499. |
| UAT-10 | PASS | Both held: x 329 → 329; lift ▶: → 20 (moving left). |
| UAT-11 | PASS | `not-ready` class, label WAIT, dimmed + dashed; second tap ignored; back to THROW when the shield returns. `lowend_07_throw_wait` |
| UAT-12 | PASS | Pointer log: finger 1 down on the move zone, finger 2 down/up on THROW → THROW was `not-ready` at finger 2's lift while finger 1 was still held. |
| UAT-13 | **PARTIAL — see F2** | Controls PASS: lowend ◀ 30-86, ▶ 94-150 (8 dp gap), THROW 554-610, all 56 dp; PAUSE 48 dp, 184 dp from THROW; playfield 150-554, no overlap. pixel7 and tablet 64 dp, 8 dp gap. The ≥ 8 dp rule fails in menus (F1, F2). |
| UAT-14 | **FAIL — F1, F2** | Every option is 48 dp tall and activates on first tap; spacing fails as above. |
| UAT-15 | PASS | Touch layer hidden on title, pause, Game Over; visible in countdown and play. |
| UAT-16 | PASS | Swapped: THROW 30-86, ◀ 490-546, ▶ 554-610; hold mirrored ◀: x 399 → 243; throw works at the new place; kept after update, Quit and reboot. `lowend_15`, `lowend_16` |
| UAT-17 | PARTIAL (N3) | 40 actions, 0 unintended pauses/exits. Deliberate edge swipe could not be produced on the emulator. |
| UAT-18 | PASS (note O5) | After long-presses, double-taps and drags: zoom 1, no selection, no scroll, no menu (`lowend_30_longpress_throw`). |

### C. Screen fitting
| ID | Result | Evidence |
|---|---|---|
| UAT-19 | PASS | Insets t 24, r 30, b 32, l 30; playfield 404 × 303 dp (0.505×). HUD text 29.3-46.7; hint bottom 281.5; controls 30-610 × ≤ 328; title 37.8-314.3; pause 50.3-301.8; settings 77.3-274.8; prompt 102.3-239.8; Game Over 81.3-270.8. No menu scrolls (304/304). |
| UAT-20 | PASS | Rotation 90: insets l 51.8 (cutout), r 29.7; rotation 270: l 29.7, r 51.8; controls move inside each time; scale 0.601; portrait never shown. `pixel7_03`, `pixel7_04` |
| UAT-21 | PASS | Font 2.0: title 30-322, settings 72.3-279.8, help 68.3-283.8, pause 42.3-309.8, prompt 91.8-250.3, privacy header 36-84 — all inside 24-328, none scroll. In play with "Shield 6.7s" active the HUD wraps to two rows inside the insets; THROW label 36-80 and WAIT 566-598 sit inside their 56 dp buttons. `lowend_17`..`lowend_26`, especially `lowend_18_font2_play_effect_throw` and `lowend_22_font2_play_effect_wait` |
| UAT-22 | PASS | `statusBars visible=false`, `navigationBars visible=false` on title and in play. Reveal-by-swipe: N3. |
| UAT-23 | PASS | `wm size 1082x1575` during play: prompt + run paused; 10 s later `wm size reset`: pause menu, Score 450 / Lives 3 / Power ×1.80 unchanged, zoom 1. `pixel7_10`, `pixel7_11` |
| UAT-24 | **FAIL (timing only) — F3** | Behavior correct at 412 × 309 dp, font 1.0 and 2.0. `fold_01_prompt`, `fold_02_prompt_font2` |
| UAT-25 | PASS | lowend three-button: insets t 24, b 48 → prompt (expected, M2.3c f3), `lowend_27_3button_prompt`. Tablet three-button: insets t 24, b 56, plays, controls end at 744 of 800 dp, score 900 after 10 s, `tablet_04_3button_play`. |
| UAT-26 | PASS (M2.10: N5) | Scale 1.254, canvas backing 2007 px for 1003 dp (sharp), controls 64 dp, HUD inside. `tablet_01`, `tablet_02` |

### D. Saved best score, Restart Level, settings
| ID | Result | Evidence |
|---|---|---|
| UAT-27 | PASS | Every bad value → "Best: 0", default settings, help shown again, 0 crashes. `pixel7_12` |
| UAT-28 | PASS | Final Score 2450, "Best: 2450", "New best!"; title "Best: 2450". Score-0 run: no marker. `lowend_10`, `lowend_11`, `lowend_06` |
| UAT-29 | PASS | Final Score 450, "Best: 2450", no marker. `lowend_12` |
| UAT-30 | PASS on level 1 (N2 for later levels) | Score 450 → Restart Level → 0, Lives 3 kept; repeated at 550 → 0. Saved best unchanged. |
| UAT-31 | PASS | Back and Cancel: prompt closes, Score 550 and timer unchanged. Confirm: saved best became 550, score 0. |
| UAT-32 | PASS | pixel7: run at 1600 sent to background → saved best 1600; the run later ended at 1600 with "Best: 1600" and no "New best!" (accepted behavior, F21 AC7(d)). |
| UAT-33 | PASS | Update installed over the app (`lastUpdateTime` 14:51 → 15:03) and reboot: Best and Swap kept. After clear: Best 0, help shown. `lowend_15`, `lowend_28` |
| UAT-34 | PASS | Play HUD: Score, Lives, Level, Power, active effect only. |

### E. Leaving and coming back
| ID | Result | Evidence |
|---|---|---|
| UAT-35 | PASS for 5 of 6 sources (call: N4) | Home, Recents, screen off, notification shade, system dialog (Internet panel, `pixel7_07_system_panel`): pause menu on return, score/lives unchanged, never resumed by itself. Tablet Home: same. |
| UAT-36 | PASS | 5 s away: 5x Hit 5.3 s → 4.3 s (the 1 s is command delay before leaving). **13 minutes away: Score 1600, "3x Speed 6.1s" before and after, identical.** `pixel7_08` |
| UAT-37 | PASS | Title, Settings and Game Over each returned as left. Game Complete: N2. |
| UAT-38 | PASS | 15 s timeout: awake after 88 s of untouched play; asleep about 20 s after pausing. |
| UAT-39 | PASS | Background process killed: relaunch shows title, Best 1600, Swap setting kept, 0 crashes. `pixel7_13` |
| UAT-40 | PASS | In background: 0 animation frames in 2 s; no wake lock for the app's uid. |

### F. Back and Quit
| ID | Result | Evidence |
|---|---|---|
| UAT-41 | PASS (Game Complete row: N2) | All other rows correct in three-button mode on pixel7 and gesture mode on lowend, driven with the Back key; fold and lowend prompts: Back leaves the app. |
| UAT-42 | PASS | Five fast Backs: app stayed in front, ended on the pause menu. |
| UAT-43 | PASS | Quit from pause and title returned to the launcher; next launch on the title with Best kept; no "close this tab" text. |

### G. Privacy, offline, permissions
| ID | Result | Evidence |
|---|---|---|
| UAT-44 | PASS | Airplane mode on; 2 taps; only request `https://localhost/privacy.html` (the app's own bundled file). Bundled file SHA-256 `3e8ca762…c3b662` equals `public/privacy.html`. Scrolls by finger; Close (94 × 48 dp) and Back return to Settings. `lowend_14`, `lowend_26` |
| UAT-45 | PASS | Launch, 15-minute session and reboot all in airplane mode. APK declares only AndroidX's internal `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`; no INTERNET, no runtime permission. |

### H. Performance and stability
| ID | Result | Evidence |
|---|---|---|
| UAT-46 | PASS | 15 min, 9 Game Overs with automatic "Play again", same process id throughout, memory 100-115 MB (PSS) with no upward trend, 0 crashes, no ANR. Frame counts in the raw log are depressed by the bot's own canvas reads on the software GPU and are not used for M10.1. |
| UAT-47 | **NOT CONFIRMED — N1** | See N1. |
| UAT-48 | PASS | 0 `FATAL EXCEPTION` on lowend, pixel7, tablet, fold. |

### I. Shared game on the phone
| ID | Result | Evidence |
|---|---|---|
| UAT-49 | **NOT RUN beyond level 1 — N2** | Level 1 behaves as on the website (formation, shield bounce and catch, three temporary power-ups seen, permanent multiplier ×1.80 seen). |

---

## Question for the owner

**Q1 — How do we confirm the game runs smoothly on a real phone before release? (affects M10.1, step 15 timing)**
Plain terms: the PRD promises at least 30 frames per second on a cheap phone and 55 on a
mid-range one. An emulator (a phone simulated on the PC) cannot prove that either way: on it
the game ran at 55 fps on the small-phone profile with graphics acceleration, 29 fps without,
and 50 fps on the Pixel 7 profile.
- **(a) Plug in a real Android phone you or a friend already own (recommended).** We measure
  on it over USB before the first upload. Cost: none; about an hour; gives a real answer now.
  Needs a phone with "USB debugging" switched on (a developer setting).
- (b) Wait for Google's pre-launch report (Google's automatic test on real phones after the
  first upload) and the closed-test testers' "was it smooth?" answers. Cost: none; but a
  problem would only show after the first upload, and fixing it then repeats several steps.
- (c) Have the developers do a speed-up pass now without a real measurement. Cost: a few days
  of work and a repeat of the review and test steps, possibly for nothing.
- **Recommendation: (a)**, with (b) as the backstop either way. If no Android phone is
  available, choose (b).

## Observations (not failures)

- **O1 — launch from a portrait-held phone.** The very first frame of Android's launch
  animation shows the splash in portrait before the display turns (`pixel7_01_launch_frame1`).
  This is Android's own transition for any landscape-only app; the app's splash, title and
  every later screen are landscape and nothing rotates at Start. PM reading: M2.1a is met;
  I will add a dated clarifying note to the PRD with the F1/F2 follow-up.
- **O2 — label cut off on the Pixel 7 drawer.** "Shield vs Ro…" in the portrait app drawer
  (`pixel7_14`, `pixel7_15`). M9.1 names the 640 × 360 reference phone, where it fits, so this
  is not a failure, but most testers will see the shortened label.
- **O3 — a run is lost if the player changes the navigation mode (or another system setting
  that restarts the app's screen) while a run is paused.** The app reopens on the title with
  best and settings kept: the same outcome as the accepted process-death rule (M4.6). Rare.
- **O4 — screenshot note.** `lowend_05_throw_wait_uat.png` is a Game Over frame (the run had
  just ended); `lowend_07_throw_wait_uat.png` is the valid WAIT capture.
- **O5 — long-press on the playfield** raises a `contextmenu` event that the app does not
  cancel (it does cancel it on the buttons). Nothing appears on screen; a real phone may give
  a small vibration. Worth one line for the developer with F1/F2.

## Known pending items (as instructed, not UAT failures)

Power-up icon redraw (addendum v5 / owner's new icons); `[DEVELOPER NAME]` and `[CONTACT EMAIL]`
on the privacy page (still present at `public/privacy.html:112-113`); the owner's hero-name
decision.

## Emulator state after the run

All four emulators stopped; `adb` server stopped. Restored and verified on each: navigation
mode 2 (gesture), font scale 1.0, auto-rotate on, user rotation 0, screen timeout and
stay-awake back to their starting values, airplane mode off, `wm size` / density physical,
fold device state reset, `adb unroot`. Helper files removed from the devices. The app and its
test data (best score) remain installed. No app code or test was changed; nothing committed.

## Next steps

1. F1, F2 (and O5) → mobile-junior-developer, then steps 8-11 as the gate rules require.
2. F3 → mobile-lead-tester.
3. Owner answer on Q1 (frame-rate confirmation).
4. Re-run UAT on one committed build: UAT-13, 14, 24, 47, 49 in full, a regression pass on the
   rest.

---

## Round v7 (core-team tester, addendum v7 F24-F27, phone emulation only)

Run on 2026-10-06 against the uncommitted tree on HEAD 0234811. **No emulator was available** (cloud container, no Android SDK), so these are Playwright phone-emulation results (Chromium touch/mobile emulation at 640x360, 800x360, 915x412, 1280x800), not device results. Full report: `validation-report-round8.md`. Screenshots: `screenshots/*_v7.png`.

| Scenario | Round | Result | Notes |
|---|---|---|---|
| UAT-01 (title: Best, Start / How to play / Settings / Quit, now with the power-up guide and contact line) | v7 | PASS (emulation) | Four icons labelled, buttons fully visible, nothing clipped at 640x360, 800x360, 915x412. `android_*_title_v7.png` |
| UAT-05 (title, "How to play", Got it returns) | v7 | PASS (emulation) | Help shows four icon + label + sentence rows; Got it fully visible and reachable; `power-up-guide.spec.ts` passes in all projects. `android_*_help_v7.png` |
| UAT-19 (640x360: title and help inside the safe area, no scrolling) | v7 | PASS (emulation) | Title and help fit, inset cases in `power-up-guide.spec.ts` pass; other UAT-19 screens unchanged and not re-run on a device |
| UAT-44 (privacy policy matches `public/privacy.html`) | v7 | PARTIAL (static) | Placeholders `[DEVELOPER NAME]` and `[CONTACT EMAIL]` are gone; developer name and email present in `public/privacy.html`. In-app privacy screen in airplane mode not run on a device |
| Website title at 800x600 (shared change) | v7 | PASS (emulation) | Guide and contact line fit, no overlap. `web_800x600_title_v7.png` |

The earlier "known pending item" about the privacy placeholders is closed by this change (static check). A device re-run of the above is still advised on the owner's machine.
