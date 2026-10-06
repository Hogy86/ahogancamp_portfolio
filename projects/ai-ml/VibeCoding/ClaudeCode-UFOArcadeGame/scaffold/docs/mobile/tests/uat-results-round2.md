# UAT Results, Round 2 — Shield vs Robots (Android)

## Verdict: **FAIL**

**Stage:** Mobile Pipeline Step 14 — mobile-product-manager (re-run after the round-1 FAIL)
**Date run:** 2026-10-04
**Plan:** `docs/mobile/tests/uat-plan.md` (unchanged). **Round 1:** `docs/mobile/tests/uat-results.md` (kept, not overwritten).
**Evidence:** raw log `docs/mobile/tests/uat-raw-output-round2.log`; screenshots `docs/mobile/tests/screenshots/*_uat2.png`.

**One-line reason:** one new failure on the 640 × 360 dp reference phone: the on-screen text
"WARNING: ROBOTS APPROACHING" is partly hidden behind the "Level" box (F4 below). Everything
that failed in round 1 now passes, and every other scenario re-run this round passed.
mobile-release-engineer must not upload a build on this result.

**Also blocking step 15, separately from UAT:** the step-11 design gate on disk
(`docs/mobile/ux/design-review-round9.md`, not yet committed) is FAIL for the rabbit icon on
the low-end profile and needs an owner decision (Q2 below).

**Counts (49 scenarios):** 31 PASS re-run this round, 12 PASS carried (round 1), 1 FAIL (UAT-19),
3 PARTIAL (UAT-17, 35, 49), 2 NOT CONFIRMED (UAT-47; UAT-49 levels 7-10 is counted under
PARTIAL). Crashes: **0** `FATAL EXCEPTION`, 0 ANR on both devices.

---

## What was tested

| | |
|---|---|
| Source | One committed build: HEAD `cc18275` on `claude/project-thread-rm5222` (code identical to `5488b15`). Tracked files clean; the only untracked file at build time was `docs/mobile/ux/design-review-round9.md`. |
| Build | `scripts/refresh-android-mirror.ps1` (parity passed: 138 files + 6 named), `npm run build:android`, `npx cap sync android`, `gradlew assembleDebug` — BUILD SUCCESSFUL. |
| APK | `app-debug.apk`, 3,963,529 bytes, **SHA-256 `8f70653f63a286657076a352ce0c3e81f23381e5014f5b1dd8791f00fbc049fb`**. A copy was taken before testing and that copy was installed on both devices, so the build could not change mid-run. |
| Devices | `svr_api36_lowend_640x360` (640 × 360 dp, Android 16, WebView 133) and `svr_api36_pixel7` (915 × 412 dp, camera cutout), one at a time, `-gpu host -no-window -no-audio -no-snapshot`. Tablet and fold were **not** started this round (carried). |
| Method | Scripted scenarios: real touches through `adb shell input`, Back as `KEYCODE_BACK`. Screen text and element positions read over WebView DevTools (read-only). |
| Method change from the plan | The long-play bot pressed the same on-screen buttons, but its touches were injected through WebView DevTools (`Input.dispatchTouchEvent`) because `adb` input is too slow to dodge. It reads the canvas and changes no game state. This is why it got further than round 1. Control scenarios (UAT-08 to 18) used real `adb` touches. |

Code changed since the round-1 build (`451dfa9`): `android.css` (menu gaps), `AndroidPlatform.ts`
(long-press), `TouchControls.ts`, `glyphs.ts`, `shapes.ts` (power-up icons). Carried rows are
in areas this diff does not touch.

---

## Round-1 findings: status

| Round-1 item | Round 2 result | Evidence |
|---|---|---|
| F1 Confirm/Cancel touch (0 dp) | **PASS** | Gap 8 dp on lowend and pixel7, at text size 1.0 and 2.0. `lowend_confirm_uat2.png`, `lowend_font2_confirm_uat2.png`, `pixel7_confirm_uat2.png` |
| F2 menu rows 6 dp apart | **PASS** | Title, Settings and pause menu: 8 dp between every pair of buttons, all 48 dp tall or more, on both devices at 1.0 and 2.0. Nothing scrolls. Title at 2.0 on lowend spans 24.4-327.6 inside the 24-328 band (0.4 dp spare). |
| F3 fold prompt over 5 s | **Carried** | Ruled emulator warm-up in validation round 6 (settled 1.7-1.8 s). Fold not re-run. The same warm-up curve showed on pixel7 this round: 5987, 5040, 4428, 3287 ms straight after boot, then 1649-1857 ms settled. |
| O5 long-press | **PASS** | 1.8 s holds on THROW, the playfield and the "PAUSED" heading: the event was cancelled every time, no pop-up, no selection, zoom 1. `lowend_longpress_playfield_uat2.png` |

---

## Failure (routed, not patched)

### F4 — "WARNING: ROBOTS APPROACHING" is cut off by the Level box on the reference phone — **FAIL**
- **Scenario:** UAT-19 ("nothing is cut off" on the 640 × 360 dp phone). Criteria: M2.3 / M2.6 /
  M2.3b rule 2 (text over the playfield), and shared F3 AC6 / NFR-9(a) (the danger warning must
  not rely on colour alone; the text is the non-colour cue next to the red border).
- **How to see it:** start a run and let the robots come down to one row above ShieldMan.
- **Evidence:** `lowendwarn_warning_2_uat2.png`: the text reads "WARNING: ROBOTS APPROACHI" and
  the last letters sit under the "Level: 1/10" box. Measured: the text is centred on the
  playfield (about 287-417 dp); the Level box starts at 402.9 dp. This is the best case (score 0,
  no power-up running). A power-up timer box moves "Level" about 70 dp further left
  (see `lowend_powerup_8_uat2.png`, Level at 335 dp), which would cover about half the warning.
- **Pixel 7:** fits with no power-up running (`pixel7warn_warning_2_uat2.png`, text ends 582 dp,
  Level starts 589.5 dp). With a five-digit score the gap is about 2 dp
  (`pixel7_bot_L5_5_uat2.png`). With a power-up timer box it would be covered too (calculated,
  not captured).
- **Also:** the warning is drawn at 16 px on the canvas, so on the reference phone it is about
  8 dp tall, below the 12 sp floor M2.6 sets for HUD text. `mobile-architecture.md` (text
  inventory, N1 decision) lists this text but only checked its top edge, not its width or size.
- **Why it matters:** this warning comes just before an instant loss. The red border still
  flashes, so the player is warned; the words are not fully readable.
- **Why round 1 missed it:** the round-1 bot never let the formation get that low.
- **Route:** mobile-junior-developer → mobile-lead-developer, with mobile-ui-ux-designer for the
  placement. If the fix is Android-only layout (for example reserving the centre of the HUD row),
  it stays in this pipeline. If the fix changes `CanvasRenderer` (shared), it must pass the
  website gates too. mobile-junior-tester should add a check that the warning text box does not
  intersect any HUD box at 640 × 360 with a power-up timer showing. Not an owner decision.

---

## Not confirmed on emulators

Per the uat-smoke-test-design skill a scenario that was not really executed is not PASS. Each
item says whether it blocks this gate.

| # | Item | What was done this round | Blocks UAT? | Where it goes and why |
|---|---|---|---|---|
| N1 | **Frame rate, M10.1** (UAT-47) | Level 1 only, no bot: lowend 55.8 fps, pixel7 57.1 fps, longest gap 50 ms on both (`-gpu host`). Level-10 load not reached. | **No — deferred, owner answer pending** | An emulator draws with the PC's graphics card, so no emulator number proves or clears a real phone. The owner was asked in round 1 (Q1) whether a real phone is available and has not answered; recorded as **pending**, not asked again. Backstop: Play pre-launch report and the closed test (step 16). |
| N2 | **Levels 7-10, level-10 boss, Game Complete** (UAT-49) | Bot reached **level 6** on lowend (passing the level-5 boss) and level 5 on pixel7. Restart Level rollback confirmed on **level 3** (6400 both times). Levels 7-10, Back during Game Complete and returning to Game Complete (M4.4) were not reached. | **No — deferred** | The rules for levels 7-10 are shared code covered by the unit suite (657 tests) and the website UAT; levels 1-6 behaved as specified here. Closed-test checklist gets "did anyone finish level 10?". If a human tester or a better bot is available before step 15, run it then. |
| N3 | **Real edge back-swipe** (UAT-17 second half, M2.3a, M5.3) | Not re-run. | **No — deferred** | The emulator ignores injected touches for the back gesture (round 1). Only a finger on a real phone can test it: closed-test checklist item 6. |
| N4 | **Incoming call screen** (part of UAT-35) | Not re-run. Home, Recents, screen off and notification shade all re-run and PASS. | **No — deferred** | The emulator shows no call screen. The app pauses on the same "app hidden" signal for every source tested. Closed-test checklist item 7. |
| N5 | **Real fold / split-screen resize, portrait-shaped window** (M2.9, M2.10) | Not re-run. | **No — deferred** | The fold AVD does not resize. Play pre-launch report and closed test. |
| N6 | **Second landscape direction with the cutout** (UAT-20) | Tried with `user_rotation`; the emulator stayed in the same direction, so only one direction was re-measured. | **No — carried** | Round 1 measured both directions; the layout code is unchanged. |

---

## Results by scenario

"L" = lowend, "P" = pixel7. "carried (round 1)" = not re-run; the round-1 PASS stands.

### A. First launch, name and help
| ID | Result | Evidence |
|---|---|---|
| UAT-01 | PASS | L: first launch after clear 3047 ms, then 1625-1755 ms. P: settled 1649-1857 ms (≤ 3 s); 5987-3287 ms in the first four starts after boot (emulator warm-up, see F3). Title "Shield vs Robots", "Best: 0", four buttons. `lowend_title_uat2.png`, `pixel7_title_uat2.png` |
| UAT-02 | carried (round 1) | |
| UAT-03 | PASS (label), icon carried (round 1) | APK label `Shield vs Robots`. |
| UAT-04 | PASS (note O6) | Fresh install: Start → help naming ShieldMan → "Got it" → Level 1. Later Starts go straight to the countdown. `lowend_help_uat2.png` |
| UAT-05 | PASS | L, P: opens from the title; Back closes; "Got it" returns to the title. Pause menu is exactly Resume / Restart Level / Restart Game / Quit. |
| UAT-06 | PASS | Hint shown at y 262-281 dp above the hero; faded (opacity 0) after the first throw. |
| UAT-07 | PASS | 0 hits for "Vanguard", "Sentinel", "Shield Invaders", "S.H.I.E.L.D" in the APK's web files or on any screen visited. |

### B. Touch controls
| ID | Result | Evidence |
|---|---|---|
| UAT-08 | PASS | L and P: hero x 400 → 183 (hold ◀ 0.8 s) → 183 after release → 408 / 395 (hold ▶) → unchanged after release. |
| UAT-09 | PASS | L: 560 → 387 while on ◀ → 512 after sliding to ▶; slide off upward 417 → 417. P: 707 → 547 → 642; 534 → 534. |
| UAT-10 | carried (round 1) | Needs two real fingers; not re-run. |
| UAT-11 | PASS | Label WAIT, dimmed (0.45), dashed outline; a second tap launched nothing; back to THROW on return. |
| UAT-12 | carried (round 1) | Two-finger case. (The bot's injected two-point touches threw while moving throughout.) |
| UAT-13 | **PASS** (was PARTIAL) | L: ◀ 30-86, ▶ 94-150, THROW 554-610 (56 dp), 8 dp gap, PAUSE 48 dp and 184 dp from THROW, playfield 150-554. P: 64 dp, 8 dp gap, playfield 264-745 between 187.8 and 821.3. Tablet carried. `lowend_play_uat2.png`, `pixel7_play_uat2.png` |
| UAT-14 | **PASS** (was FAIL) | See F1/F2 above. Every option worked on the first tap. Tablet: carried from validation round 6 (12 dp rows, 8 dp Confirm/Cancel). |
| UAT-15 | PASS | Controls hidden on title, pause, Game Over; shown in countdown and play. |
| UAT-16 | PASS | L, P: swapped THROW to the left, ◀ ▶ to the right; both work there; still On after closing the app. `lowend_swapped_uat2.png` |
| UAT-17 | PARTIAL (N3) | carried (round 1) |
| UAT-18 | PASS | See O5 above. |

### C. Screen fitting
| ID | Result | Evidence |
|---|---|---|
| UAT-19 | **FAIL — F4** | Safe area 30-610 × 24-328, playfield 0.505×. Title, help, settings, privacy, pause, prompt, Game Over and the normal play screen all fit and none scroll. The approach warning is cut off (F4). |
| UAT-20 | PASS one direction; other carried (N6) | P: cutout inset 51.8 dp; controls, HUD and menus start at or after it. |
| UAT-21 | PASS for menus, THROW/WAIT and HUD; "power-up timer running at 2.0" carried (round 1) | L at 2.0: title 24.4-327.6, help, settings, pause 37.6-314.4, prompt 86.1-255.9, privacy header all inside 24-328; THROW 560-604 and WAIT 566-598 inside the 554-610 button. P same. `lowend_font2_*_uat2.png` |
| UAT-22 | PASS | Status and navigation bars `visible=false` on L and P. |
| UAT-23, 24, 25, 26 | carried (round 1; UAT-24 timing per validation round 6) | Tablet and fold not started this round. |

### D. Saved best score, Restart Level, settings
| ID | Result | Evidence |
|---|---|---|
| UAT-27 | carried (round 1) | |
| UAT-28 | PASS | L: "Final Score: 8650 / Best: 8650 / New best!", later 35050 with "New best!"; title then "Best: 35050". 0-point run: no marker. |
| UAT-29 | PASS | L: "Final Score: 8200 / Best: 8650", no marker. |
| UAT-30 | PASS, **now also on level 3** | L level 1: 950 → 0 and 1050 → 0, lives kept, saved best unchanged. P level 3: 7400 → 6400 and 8300 → 6400 (the level-start score), lives kept, saved best unchanged at 850. The permanent multiplier is kept (F21 AC6; open question Q-v4-1 in addendum v4 still stands). `pixel7_L3_restartlevel_before_uat2.png`, `_after_uat2.png` |
| UAT-31 | PASS | L, P: Cancel and Back close the prompt with score unchanged; Confirm saved the best first (750 / 1050) and reset to 0, 3 lives, ×1.00. |
| UAT-32 | PASS | P: run at 850 with no saved best → Home → saved best 850 at once. |
| UAT-33 | PASS (update); reboot and clear carried (round 1) | L: new APK installed over the old one: Best 2800 and settings kept. |
| UAT-34 | PASS | Play HUD shows Score, Lives, Level, Power and the active effect only. |

### E. Leaving and coming back
| ID | Result | Evidence |
|---|---|---|
| UAT-35 | PASS for Home, Recents, screen off, notification shade on L and P (call: N4; system dialog and tablet carried) | Pause menu on return every time; still paused 4 s later. |
| UAT-36 | PASS for about 5 s away; 10+ minutes carried (round 1) | Timer polled every 150 ms: "3x Speed 6.9s" before screen-off and after 5.5 s off; "3x Speed 7.6s" across Home (P); "1.2s" across Home (L). Score and lives identical. |
| UAT-37, 38 | carried (round 1) | |
| UAT-39 | PASS | P: process killed in the background → relaunch on the title, Best 850, settings kept, 0 crashes. |
| UAT-40 | PASS | L, P: 0 animation frames in 3 s in the background; no wake lock held by the app. |

### F. Back and Quit
| ID | Result | Evidence |
|---|---|---|
| UAT-41 | PASS in gesture mode on L and P (three-button mode carried; Game Complete row N2) | Play → pause; pause → resume; prompt → cancel; help and Settings → close; privacy → Settings; Game Over → title; title → leaves the app. |
| UAT-42 | PASS | L, P: five fast Backs → app stayed in front on the pause menu. |
| UAT-43 | PASS | L, P: Quit from pause and from the title returned to the launcher; next launch on the title with Best kept. |

### G. Privacy, offline, permissions
| ID | Result | Evidence |
|---|---|---|
| UAT-44 | PASS | Airplane mode, 2 taps, only request `https://localhost/privacy.html` (the bundled file). Bundled SHA-256 `3e8ca762…c3b662` equals `public/privacy.html`. Scrolls by finger; Close (48 dp) and Back return to Settings; not on the pause menu. `lowend_privacy_uat2.png`, `lowend_privacy_scrolled_uat2.png` |
| UAT-45 | PASS | Cold start and play in airplane mode on L and P. No INTERNET permission; only AndroidX's internal `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. |

### H. Performance and stability
| ID | Result | Evidence |
|---|---|---|
| UAT-46 | PASS | L: 15.2 minutes of continuous bot play, levels 1-6, 2 Game Overs with "Play again", same process id throughout, memory 115-118 MB with no upward trend, 0 crashes. P: 14 minutes, 133 MB steady. |
| UAT-47 | **NOT CONFIRMED — N1** | Level 1 only. |
| UAT-48 | PASS | 0 `FATAL EXCEPTION`, 0 ANR on L and P. Tablet and fold not run. |

### I. Shared game on the phone
| ID | Result | Evidence |
|---|---|---|
| UAT-49 | PARTIAL — levels 1-6 PASS, 7-10 N2 | Formation grows per level, level-5 boss passed, countdown at each level, +1 life on a shield catch, all four power-ups caught with the right HUD readout ("5x Hit", "3x Speed", "Shield", Power ×1.80 stacking to ×18.90). `lowend15_bot_level6_uat2.png`, `pixel7_bot_L5_5_uat2.png` |

---

## The new power-up icons, as a player sees them

- **Low-end phone (tokens about 26 px across):** the circle and the X are clear. The fist reads as
  a small block with knuckles (`lowend_powerup_6_uat2.png`). The rabbit reads as a small squiggle
  or animal; I would not have named it a rabbit unprompted (`lowend_powerup_8_uat2.png`). All
  four can be told apart, and the HUD names the effect the moment it is caught.
- **Pixel 7:** all four are clear.
- This matches the step-11 reviewer's round-9 finding. M2.7 ("distinguishable by shape") holds;
  "reads as a rabbit" (F23 AC6(b)) is the design gate's call, not a UAT scenario → Q2.
- The circle inside the ring looks a little like a target (`pixel7a_powerup_4_uat2.png`). The
  security review already ruled it acceptable (addendum 4); no action.
- The help screen does not mention power-ups, so no help text needed updating.

## Questions for the owner

**Q1 (asked in round 1, still pending — not asked again).** Is a real Android phone available
for the frame-rate check? Standing recommendation: (a) plug one in before the first upload;
otherwise (b) rely on Google's pre-launch report and the closed test.

**Q2 — The rabbit icon is not readable on small, low-resolution phones (step-11 gate FAIL;
affects `docs/PRD-addendum-v5.md` F23, the website and the app).** The Speed power-up icon was
redrawn twice. On a typical phone it reads as a rabbit. On the smallest phone class it is about
15 pixels wide and reads as a squiggle.
- **A (recommended): replace the rabbit with the "<-->" arrow** you offered as the alternative
  on 2026-09-30. Cost: a small code change, then the review, test and design steps again for
  the website and the app (about one more loop). Risk: lowest; a symbol survives at that size.
- **B: keep the rabbit and make the power-up token bigger on small screens.** Cost: more work
  than A, because it changes how easy power-ups are to catch, so the game-feel has to be
  re-checked on both versions. Risk: medium.
- **C: keep the rabbit as it is and accept that some players on small phones will not recognise
  it.** Cost: none; recorded as an accepted risk like the X. Risk: a cosmetic complaint; the
  effect is still named in the HUD when caught.
- **Recommendation: A.** F4 has to go back to the developer anyway, so A adds little time.

## Observations (not failures)

- **O6 — first-launch help.** If a new player opens "How to play" from the title and taps
  "Got it" before their first Start, the help is not shown again at Start. The player has seen
  it once, so M8.1 is met. (The two "STEP ERROR UAT-04" lines in the raw log are my script
  expecting it a second time.)
- **O7 — control hint over robots.** If a player has never thrown, the one-line hint stays on
  screen and the lowest robots pass behind it (`lowendwarn_warning_2_uat2.png`). Only seen
  because the test deliberately never threw.
- **O8 — privacy page placeholders.** `[DEVELOPER NAME]` and `[CONTACT EMAIL]` are still in the
  bundled `privacy.html` (2 lines). Known pending item (OQ-M11); must be filled before step 15.
- **O2 (round 1, label shortened on the Pixel 7 drawer) and O3** still apply.

## Emulator and machine state after the run

Both emulators stopped (`adb emu kill`), `adb` server stopped, Gradle daemon stopped. Settings
changed during the run and restored, verified on each device: font scale 1.0, airplane mode
off, auto-rotate on and user rotation 0 (pixel7), navigation mode 2, screen timeout unchanged.
The app and its test data (best score) remain installed; app data was cleared twice on each
device as part of the test. No app code or test was changed. Nothing committed or pushed. No
account, key or Play Console was touched. No command was denied.

## Next steps

1. F4 → mobile-junior-developer, then steps 8-11 as the gate rules require.
2. Owner answers Q2 (and Q1 when he can). If A or B, the icon change rides the same loop.
3. UAT round 3 on the new committed build: UAT-19 with the warning showing (with and without a
   power-up timer, both devices), the icons, and a short regression pass.

## Sources

`docs/mobile/PRD-mobile.md` v1.9 (M2-M11); `docs/PRD-addendum-v5.md` r5 (F23);
`docs/PRD-addendum-v4.md` (F21, F22); `docs/PRD.md` (F3 AC6, NFR-9); `docs/mobile/tests/uat-plan.md`;
`docs/mobile/tests/uat-results.md`; `docs/mobile/tests/validation-report-round6.md`, `-round7.md`;
`docs/mobile/tests/device-matrix.md`; `docs/mobile/ux/design-review-round9.md`;
`docs/mobile/architecture/mobile-architecture.md` (text inventory).
