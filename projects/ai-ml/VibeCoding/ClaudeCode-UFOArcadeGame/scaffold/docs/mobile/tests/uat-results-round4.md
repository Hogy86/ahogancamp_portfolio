# UAT Results, Round 4 — Shield vs Robots (Android)

## Verdict: **PASS** — the emulator app now includes the boss-health fix and it works

**Stage:** Mobile Pipeline step 14 — mobile-product-manager. A lean "delta" run: only what
changed since round 3 was re-tested; everything else is carried forward from round 3.
**Date run:** 2026-10-05 (20:37 to 00:15 UTC; the last Pixel 7 lines in the log are dated
2026-10-06 UTC).
**Why this round exists:** owner instruction of 2026-10-05, verbatim: *"Yes, the emulator
app should include the boss health fix as well."*
**Plan:** `docs/mobile/tests/uat-plan.md` (unchanged). **Earlier rounds:** `uat-results.md`
(FAIL), `uat-results-round2.md` (FAIL), `uat-results-round3.md` (PASS). All kept.
**Evidence:** raw log `docs/mobile/tests/uat-raw-output-round4.log` (`*.log` is git-ignored in
this repo, like the earlier raw logs); 42 screenshots in `docs/mobile/tests/screenshots/`
ending `_uat4.png`.

**One-line reason:** on both simulated phones the level-5 boss no longer dies in one hit. It
was fought and beaten five times in real play, and each time it took exactly the number of
hits the fix specifies (5, 5, 10, 5 and 5). Nothing in the smoke pass broke. 0 crashes.

**Not covered, stated up front:** the **level-10 boss was not reached** (highest level
reached: 7 on both phones), and the "15 hits with no power-ups" case was not seen. See
"Known limitations". One point needs the owner's attention (not blocking): see "Open points".

---

## 1. What was tested

| | |
|---|---|
| Source | One committed build: HEAD `c3b746b` on `claude/project-thread-rm5222`, working tree clean. Only change since the round-3 build (`cfd0ffd`): the merge of master's boss-health fix (commit `2a4a9b0`, "Fix level 5/10 bosses dying in one hit") and the removal of an email address from a doc. |
| Build | `scripts/refresh-android-mirror.ps1` (parity passed: 142 files + 6 named), then in `C:\Users\aaron\dev-build\shield-vs-robots`: `npm run build:android`, `npx cap sync android`, `android\gradlew.bat assembleDebug`. All exit 0, BUILD SUCCESSFUL. |
| APK | `C:\Users\aaron\dev-build\shield-vs-robots\android\app\build\outputs\apk\debug\app-debug.apk`, **3,963,909 bytes**, **SHA-256 `860e3aabf7bad17202c8b95358ea3384cd51867c7e7906aa678a7d18a58a047b`**. A copy with the same hash was installed on both devices. Debug build, debug key. |
| Is the fix in the app? | Yes. The script file inside the APK (`assets/public/assets/index-DNykIs1C.js`, SHA-256 `4dc74078…ea0d71`, identical to the synced copy) contains `bossHp:15` and `bossHp:40` (was 20), the new boss damage rule (`Math.ceil(s/n);return s/i`), the `1e-9` tolerance, and the new crack rule (`Math.ceil(o/Math.max(1,a)*…)`). 0 hits for "rabbit". Bundled `privacy.html` hash equals `public/privacy.html`. |
| Devices | `svr_api36_lowend_640x360` and `svr_api36_pixel7` (Android 16, WebView 133), one at a time, `-gpu host -no-window -no-audio -no-snapshot`. |
| Method | As round 3. Scripted steps use real touches (`adb shell input`) and the Back key. Screen text is read over WebView DevTools (read-only). The play bot reads the canvas and presses only the on-screen buttons; it changes no game state. In the installed app `window.__vvsTest` is `undefined`. |

Already passing on this commit before this run (reported by the main session, not re-run
here): 650 unit tests, 765 Playwright phone-emulation tests.

---

## 2. The boss-health fix in real play — **PASS**

### What the fix says should happen

Before: a caught power multiplier applied in full to the boss, so a strong hit killed it at
once. Now (read from `src/systems/CollisionSystem.ts`, `src/config/levelConfig.ts` and their
tests): the boss always takes **N times as many hits as the toughest ordinary robot on that
level needs at your current power** — N = 5 on level 5, 10 on level 10.

| Level-5 boss (15 health; toughest ordinary robot needs 3 hits at power 1) | Hits to beat the boss |
|---|---|
| "Power ×1.00", no "5x Hit" (hit power 1) | 15 |
| "Power ×1.80" (hit power rounds to 2) | 10 |
| Hit power 3 or more ("Power ×3.24" and up, or "5x Hit" running) | 5 |

There is **no health bar or number** on screen. The only health display is the crack lines
on the boss: 0 to 4 cracks, one more for each quarter of its health lost.

### What happened (five boss fights, all won, level 6 started every time)

Hits were counted from a scan-by-scan record of each fight (where the shield was, where the
boss was, how many cracks were drawn); the full tables are at the end of the raw log under
"BOSS FIGHTS".

| # | Phone | "Power" shown | Hits the rule says | Hits it took | Throws that missed | Cracks after each hit | Result |
|---|---|---|---|---|---|---|---|
| 1 | Low-end | ×18.90 | 5 | **5** | 1 | 1, 2, 3, 4, gone | Level 6 at 21:19:15 UTC |
| 2 | Low-end | ×1.80 | 10 | **10** | 0 | 1, 1, 2, 2, 2, 3, 3, 4, 4, gone | Level 6 at 21:29:37 |
| 3 | Low-end | ×10.50 | 5 | **5** | 1 | 1, 2, 3, 4, gone | Level 6 at 21:37:14 |
| 4 | Pixel 7 | ×3.24 | 5 | **5** | 2 | 1, 2, 3, 4, gone | Level 6 at 00:05:50 |
| 5 | Pixel 7 | ×5.83 | 5 | **5** | 0 | 1, 2, 3, 4, gone | Level 6 at 00:14:58 |

- **It no longer dies in one hit.** Fights 1 and 3 are the old failure case exactly (power
  18.9 and 10.5 against 15 health): before the fix the first hit would have ended them.
- **The count is exact,** and the crack count after every single hit matched the rule
  (`cracks = quarters of health lost, rounded up`) in all five fights.
- **"BOSS INCOMING" is still correct.** Shown on an empty field after the last robot, for
  1.7-1.8 s (rule: 1.75 s), then the boss appears. Readable amber text, 12.0 dp, 3.8 dp
  (low-end) / 3.9 dp (Pixel 7) under the score row, touching no score box, inside the
  playfield. `lowend_boss_banner_level5_uat4.png`, `pixel7_boss_banner_level5_uat4.png`.
- **The level indicator stays on 5** during the fight; beating the boss gives +200 points and
  starts level 6. `lowend_boss_level5_beaten_level6_uat4.png`,
  `pixel7_boss_level5_beaten_level6_uat4.png`.
- **Level-10 boss: not reached.** See limitation 1.

### How the boss draws (the drawing code changed) — PASS

Looked at on both phones, unscaled screenshots:
`{lowend,pixel7}_boss_level5_start_uat4.png` and `…_cracks1_uat4.png` to `…_cracks4_uat4.png`.

- Undamaged: head with two red eyes, arms, body, legs, dark with a lighter outline. About 5
  times the size of an ordinary robot (180 × 140 game units as measured). Clear on both.
- Damage: one, two, three, then four white zig-zag cracks. The first three sit on the body;
  the fourth crosses the top of the legs. **No crack is drawn outside the boss** (the old
  build drew one line per hit, running off below it).
- My judgment as a player: the cracks read as "it is getting hurt". With 10 or 15 hits needed,
  several hits in a row add no new crack (fight 2: hits 4 and 5 both show 2 cracks), so a
  player cannot tell exactly how close the boss is. Recorded as observation O10, not a failure.

---

## 3. Short smoke pass — **PASS** on both phones

| Check | Low-end 640 × 360 | Pixel 7 |
|---|---|---|
| Install over the existing app; best score survives (UAT-33) | "Best: 33350" and all saved data identical before and after | "Best: 750" and all saved data identical before and after |
| Launch (UAT-01) | Title, four buttons 48 dp tall, 8 dp apart. Cold starts 1623-2245 ms. `lowend_title_uat4.png` | Same. First starts after boot 5182 and 5263 ms, then 3362 and 2582 ms (same warm-up pattern as rounds 2-3). `pixel7_title_uat4.png` |
| Controls (UAT-08, 11, 13) | Hero 400 → 192 (hold ◀) → 192 → 404 (hold ▶) → 404. THROW → WAIT → THROW. `lowend_play_uat4.png` | 400 → 183 → 183 → 413 → 413. THROW → WAIT → THROW. `pixel7_play_uat4.png` |
| Pause / Back (UAT-41) | PAUSE button → menu (Resume / Restart Level / Restart Game / Quit); Back resumes; Back pauses; Resume resumes. `lowend_pause_uat4.png` | Same. `pixel7_pause_uat4.png` |
| Restart Level (UAT-30) | 1300 → 0, lives kept, Power ×1.80 kept, saved best unchanged | 850 → 0, lives kept, saved best unchanged. Also used 4 times by the bot on levels 6-7: score went back to its value at the start of that level (35725 → 26425), lives kept |
| Home and return (UAT-35/36) | Pause menu on return, same score and lives, still paused 3 s later | Same |
| Privacy page offline (UAT-44/45) | Airplane mode: opens in 2 taps, only request `https://localhost/privacy.html` (the bundled file), Back returns to Settings, then played offline. `lowend_privacy_uat4.png` | Same. `pixel7_privacy_uat4.png` |
| Permissions | None requested except AndroidX's internal one (no INTERNET) | Same |
| Each power-up icon caught, with the right readout (M2.7) | Fist → "5x Hit"; double arrow → "3x Speed"; circle → "Shield"; X → Power ×1.00 → ×1.80. All four seen and recognisable. `lowend_powerup_{fist,arrow,circle,X}_uat4.png`, `…_crop_uat4.png`, `lowend_powerups_strip_4x_uat4.png` | Same four, same readouts. `pixel7_powerup_*_uat4.png`, `pixel7_powerups_strip_4x_uat4.png` |
| Long play (UAT-46) | About 57 minutes of bot play, levels 1-7, same process id throughout, memory 117 → 129 MB | About 105 minutes, levels 1-7, same process id, memory up to 133 MB |
| Crashes (UAT-48) | **0** `FATAL EXCEPTION`, **0** ANR | **0** `FATAL EXCEPTION`, **0** ANR |

Best scores at the end: low-end 43925, Pixel 7 41675 (both set during this run).

---

## 4. Results by scenario

Re-run this round: UAT-01, 08, 11, 13, 30, 33 (update), 35/36 (Home only), 41 (pause and
Back in play), 44, 45, 46, 48, and UAT-49 for levels 1-7 including the level-5 boss. All PASS.

**Everything else: carried (round 3)** with the status it had there: UAT-02 to 07, 09, 10,
12, 14 to 29, 31, 32, 34, 37 to 40, 42, 43, and the parts of 17, 20, 21, 25, 35, 36, 41 not
re-run. That includes round 3's own "carried (round 1)" and "carried (round 2)" items, its
3 PARTIAL scenarios (UAT-17, 35, 49) and its 1 NOT CONFIRMED (UAT-47, frame rate). The warning
banner (round 3 section 1) and the Speed icon (round 3 section 2) were seen again in passing
and looked the same; they were not re-measured.

UAT-49 is now: **levels 1-7 PASS, 8-10 not reached** (round 3: levels 1-6).

---

## 5. Known limitations (none blocks this gate)

1. **Level-10 boss, levels 8-10 and Game Complete were not reached.** The bot got to level 7
   once on each phone. The level-10 change (boss health 20 → 40, i.e. 10× instead of 5×) is
   therefore **checked only by the unit tests and by its presence in the APK**, not by play.
2. **The 15-hit case (Power ×1.00) was not seen;** the bot always had at least one power
   multiplier by level 5. Seen: 10 hits at ×1.80 and 5 hits at ×3.24 and above.
3. **The bot was changed several times during the run** (each change is noted in brackets in
   the raw log). All were to the bot only: ignoring the red warning border, leading its
   throws, a faster scan on the larger Pixel 7 canvas, not walking under lasers, and using
   **Restart Level** from the pause menu when the robots warning shows on level 4 or later
   (on-screen buttons, something a player can do). The app was never touched.
4. **The bot's live hit counter under-counted in four of the five fights** (lines saying
   "MISMATCH" or "live count does not add up"). The counts in section 2 come from the full
   scan-by-scan record instead, where every throw is listed. Fight 5 matched live as well.
5. **The session was interrupted for about 45 minutes** (21:37-22:22 UTC) after the low-end
   bot runs. The emulator and app sat idle; the app was found on its Game Over screen, same
   process, no crash, and the run continued from there.
6. Carried from round 3, unchanged: frame rate is an emulator-only number; no real phone;
   three-button navigation on a 640 × 360 phone shows "Make the window larger to play.";
   privacy page placeholders; the arrow says "sideways" more than "fast"; paused-during-warning
   cosmetics (L9, O9); hint over robots (O7); first-launch help (O6); help does not explain
   the icons; second landscape direction not turned; debug build only.

**New observations (not failures):**
- **O10:** no boss health bar; cracks are the only cue and move in quarters (section 2).
- **O11:** a laser already falling when "BOSS INCOMING" appears can still cost a life (seen
  once on the Pixel 7: last life lost 0.5 s into the warning). This is the documented
  behaviour (the warning does not freeze the game, F12) and is not new in this build.

---

## 6. How to run the app yourself on the emulator

From PowerShell:

```powershell
# 1. Start the simulated phone (a window opens; wait for the Android home screen)
C:\Users\aaron\Android\sdk\emulator\emulator.exe -avd svr_api36_pixel7 -gpu host

# 2. In a second PowerShell window: install the app (-r replaces the older copy and keeps your best score)
C:\Users\aaron\Android\sdk\platform-tools\adb.exe install -r C:\Users\aaron\dev-build\shield-vs-robots\android\app\build\outputs\apk\debug\app-debug.apk

# 3. Open it (or click the "Shield vs Robots" icon in the phone's app list)
C:\Users\aaron\Android\sdk\platform-tools\adb.exe shell am start -n io.github.hogy86.shieldvsrobots/.MainActivity
```

- For the small phone use `-avd svr_api36_lowend_640x360` in step 1.
- **This build is already installed on both simulated phones** from this test, so step 2 is
  only needed after a new build.
- Play with the mouse: click and hold ◀ ▶, click THROW. Back is in the emulator's side
  toolbar. To see the boss, clear level 5's robots; "BOSS INCOMING" shows, then the boss.
- To stop: close the emulator window, or `C:\Users\aaron\Android\sdk\platform-tools\adb.exe emu kill`.
- If step 2 says "no devices", the phone has not finished starting; wait and try again.

---

## Open points for the owner (not blocking this gate)

**1. The written rules still say the level-10 boss is 5× as tough; the code now makes it 10×.**
Affects `docs/PRD-addendum-v2.md` (F12, owned by the website's product-manager) and the
project rule in `.claude/CLAUDE.md` "One codebase" (a rule change must update the shared
acceptance criteria and pass both teams' gates). The fix commit changed the level-10 boss
from 20 to 40 health and updated `docs/README.md`, but no PRD addendum records it. The
level-5 boss, the one tested here, still matches the written rule (5×). Options:
- (a) **Recommended:** have the website's product-manager add a short PRD addendum recording
  "level 5: 5×, level 10: 10×, and power-ups cannot shorten a boss fight below that". Small
  docs change; keeps the paper trail matching the game. No code change.
- (b) Put the level-10 boss back to 5× (20 health). A code change through both teams' review
  and test loops, and a new build.
- (c) Leave it. No work; the PRD and the game disagree about level 10.

Whether the website pipeline's own gates were run for this fix on master is for the main
session to confirm; this run did not check it.

**2. Privacy page placeholders** — unchanged from round 3 ("Open point" there, options (a)-(c)).

No decision was made on the owner's behalf in this round.

## Emulator and machine state after the run

Both emulators stopped (`adb emu kill`), `adb` server stopped, `gradlew --stop` run ("No
Gradle daemons are running"). Settings checked on each device at the end and at their
defaults: font scale 1.0, airplane mode off, gesture navigation, rotation unchanged (airplane
mode was the only setting changed, and was switched back in the same step). The app and its
saved data remain installed on both. No existing file was edited; only new files were added
(this document, the raw log, 42 screenshots). Nothing was committed or pushed; no account,
key or Play Console was touched. No command was denied.

## Next steps

1. Step 14 is PASS for `c3b746b`. Under OD-v2.0 this remains the end of the Mobile Pipeline;
   steps 15-17 do not run.
2. Main session: put open point 1 to the owner, and confirm the website gates for the boss fix.
3. If a play-through of the level-10 boss is wanted on Android, it needs a person on the
   emulator or a stronger bot; not done here.

## Sources

Owner instruction 2026-10-05 (quoted above); commit `2a4a9b0` and
`src/config/levelConfig.ts`, `src/systems/CollisionSystem.ts` (+ `CollisionSystem.test.ts`,
"boss toughness holds under any hit power (F12 AC2)"), `src/render/shapes.ts`;
`docs/PRD-addendum-v2.md` (F12, F17); `docs/mobile/PRD-mobile.md` v1.9 and
`docs/mobile/PRD-mobile-amendment-v2.0.md` (OD-v2.0); `docs/mobile/tests/uat-plan.md`;
`docs/mobile/tests/uat-results-round3.md` (everything carried);
`docs/mobile/tests/device-matrix.md`; `.claude/CLAUDE.md` ("One codebase").
