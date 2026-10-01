# UAT Plan — Shield vs Robots (Android)

**Stage:** Mobile Pipeline Step 14 — mobile-product-manager (writes AND runs UAT)
**Date:** 2026-09-30
**Results:** `docs/mobile/tests/uat-results.md` (raw evidence: `uat-raw-output.log`, screenshots `screenshots/*_uat.png`)

## Sources

- `docs/mobile/PRD-mobile.md` v1.7 — M0-M12, including M2.3b, M2.3c and M2.10a
- `docs/PRD-addendum-v3.md` — F20 saved best score
- `docs/PRD-addendum-v4.md` — F21 Restart Level rollback, F22 rename
- `docs/mobile/tests/manual-only-criteria.md` — criteria that only a device run can check
- `docs/mobile/tests/device-matrix.md` — AVD profiles, fold procedure, known gaps handed to UAT
- `docs/mobile/reviews/code-review-round15.md` / `-round16.md` §6 — carried step-10 rows
  (low-end AVD at `font_scale 2.0`, in play with a power-up effect active, THROW and WAIT)

## How the scenarios are run

- A debug build is installed with `adb` on Android emulators. Every action is a real touch on
  the on-screen buttons (`adb shell input`, or kernel touch events for two-finger cases).
  The Android Back key is sent with `KEYCODE_BACK` (the same event the three-button bar's Back
  button sends).
- What the player sees is read back from the app's WebView over DevTools (read-only: text on
  screen, element positions, canvas pixels) and from screenshots. No app code, test or game
  state is changed. Stored values are edited only in UAT-27 (bad saved data), which is the
  test input itself.
- Devices: `svr_api36_lowend_640x360` (640 × 360 dp reference phone) and `svr_api36_pixel7`
  (`-gpu host`, camera cutout) run everything; `svr_api36_tablet` and `svr_api36_fold` are
  spot checks.

## Out of scope for UAT (not failures)

- Permanent Multiplier / power-up icon artwork (addendum v5, new icons requested by the owner).
- `[DEVELOPER NAME]` / `[CONTACT EMAIL]` placeholders on the privacy page (OQ-M11).
- The owner's hero-name decision (OQ-S1a follow-up / OQ-M15).
- Store-listing criteria M12, M9.5, M11.6 and Play Console items (M1.2, M10.5, M10.7, M3.11
  pre-launch report): steps 15-16.
- M1.4 (old WebView message): verified at step 10 on API 24 and API 28 images; no change since.

## Scenarios

Each scenario: **Given** context, **When** the player acts, **Then** the expected result.
"L" = low-end AVD, "P" = Pixel 7 AVD, "T" = tablet, "F" = fold.

### A. First launch, name and help

| ID | Scenario | Criteria | Device |
|---|---|---|---|
| UAT-01 | Given a fresh install, when I tap the icon, then within 5 s (low-end) / 3 s (mid-range) I see a landscape title "Shield vs Robots", "Best: 0", and Start / How to play / Settings / Quit, with no white flash. | M10.3, M9.4, M7.1, F20 AC1, F22 AC1/AC3 | L, P |
| UAT-02 | Given the phone is held upright (portrait), when I open the app, then the splash and title are landscape and tapping Start causes no rotation. | M2.1, M2.1a | P |
| UAT-03 | Given the app is installed, when I look at the launcher, then the label is exactly "Shield vs Robots" (not cut off on the reference phone) and the icon is the plain blue shield, recognizable under the launcher's mask. | M9.1, M9.2, M9.3 | L, P |
| UAT-04 | Given my first launch, when I tap Start, then one help screen explains the buttons and names ShieldMan; "Got it" starts the "LEVEL 1" countdown. On later Starts it does not appear. | M8.1, M7.3, F22 AC6 | L |
| UAT-05 | Given the title, when I tap "How to play", then the help opens; Back or "Got it" returns to the title. It is not on the pause menu. | M8.2, M5 | L, P |
| UAT-06 | Given a new run, when play starts, then a one-line touch hint is shown above the hero, clear of the buttons; after my first throw it fades. | M8.3, F9 AC2 | L |
| UAT-07 | Given any screen I can reach, when I read every word, then I never see "Vanguard", "Sentinel" or "Shield Invaders"; the game-over and warning text say "robots". | F22 AC4/AC5, M9.1 | L, P + APK scan |

### B. Touch controls

| ID | Scenario | Criteria | Device |
|---|---|---|---|
| UAT-08 | Given play, when I hold ◀ then ▶, then ShieldMan moves left then right and stops the moment I let go. | M3.3, F1 | L |
| UAT-09 | Given I am holding ◀, when I slide to ▶ without lifting, then he switches direction; sliding off the buttons stops him. | M3.3a | L |
| UAT-10 | Given play, when I hold ◀ and ▶ together, then he does not move; lifting one finger moves him the other way. | M3.4 | L |
| UAT-11 | Given play, when I tap THROW, then a shield flies; until it returns the button reads WAIT, is dimmed with a dashed outline, and tapping it does nothing. | M3.5, F16 AC3 | L |
| UAT-12 | Given I am holding a move button, when I tap THROW with another finger, then both work. | M3.6 | L |
| UAT-13 | Given play, when I measure the buttons, then ◀ ▶ THROW are ≥ 56 dp on the reference phone and ≥ 64 dp elsewhere, PAUSE ≥ 48 dp, neighbours ≥ 8 dp apart, PAUSE ≥ 24 dp from THROW, none over the playfield. | M3.1, M3.2, M2.4, M2.12 | L, P, T |
| UAT-14 | Given any menu, when I tap an option, then it works first time; every option is ≥ 48 dp tall and neighbouring options are ≥ 8 dp apart. | M3.8, M3.1 | L, P, T |
| UAT-15 | Given each game state, then ◀ ▶ THROW show only in the countdown and in play; hidden on title, pause, Game Over. | M3.9 | L |
| UAT-16 | Given Settings, when I turn on "Swap controls", then movement is on the right and THROW on the left and they work there; the choice is remembered after closing the app. | M3.13, M7.3 | L |
| UAT-17 | Given gesture navigation, when I press, hold and slide 20 times on the button nearest each side edge, then the game never pauses or leaves; a deliberate swipe from the bare edge pauses. | M2.3a, M5.2 | L |
| UAT-18 | Given play, when I long-press or double-tap buttons and playfield, then nothing zooms, scrolls or selects. | M3.7 | L, P |

### C. Screen fitting

| ID | Scenario | Criteria | Device |
|---|---|---|---|
| UAT-19 | Given the 640 × 360 dp phone, when I visit title, help, settings, privacy, play, pause, restart prompt and Game Over, then every word and button is inside the safe area, the playfield is ≥ 0.5×, nothing is cut off and no menu needs scrolling. | M2.3, M2.3a, M2.3b, M2.3c rule 3, M2.6, M2.12, M2.13 | L |
| UAT-20 | Given a phone with a camera cutout, when I play in both sideways directions, then score, lives, level, power and all buttons stay clear of the cutout and edges; portrait never appears. | M2.1, M2.3, M2.3a | P |
| UAT-21 | Given the largest system text size on the reference phone, when I open every menu and play with a power-up timer running, then nothing overflows or overlaps and THROW / WAIT fit their button. *(carried step-10 rows)* | M2.11, M11.4a (5) | L |
| UAT-22 | Given title or play, then the status and navigation bars are hidden. | M2.5 | P |
| UAT-23 | Given I am playing, when the window shrinks below the minimum, then the game pauses and shows only "Make the window larger to play."; enlarging returns to the pause menu with nothing changed. | M2.10a (b), M2.9 | P |
| UAT-24 | Given the fold AVD's 412 × 309 dp window, when I open the app, then within 5 s I see only the message; taps do nothing; Back leaves; it also fits at the largest text size. | M2.10a (a), (d), M5 | F |
| UAT-25 | Given three-button navigation on the 640 × 360 landscape AVD (bar at the bottom), then the message shows (documented limit); on the tablet with a bottom bar the game plays with buttons above the bar. | M2.3c (f3), (f4) | L, T |
| UAT-26 | Given a 10-inch tablet, when I play, then the picture is sharp, centred, controls ≥ 64 dp, and the tablet never shows a squashed or portrait playfield. | M2.8, M2.13, M1.3, M2.10 | T |

### D. Saved best score, Restart Level, settings

| ID | Scenario | Criteria | Device |
|---|---|---|---|
| UAT-27 | Given damaged saved data ("abc", "-5", "1.5", "1e400", "null", empty, broken settings), when I open the app, then it shows "Best: 0", default settings, and no error. | M7.5, F20 AC9 | P |
| UAT-28 | Given Best 0, when a run ends with points, then Game Over shows "Final Score", "Best: N" and "New best!"; the title then shows the same Best. A 0-point run shows no "New best!". | M7.1, F20 AC1-AC3 | L |
| UAT-29 | Given a saved best, when a later run ends lower, then no "New best!" and Best is unchanged. | F20 AC3, AC5 | L |
| UAT-30 | Given level 1 with points earned, when I pause and choose Restart Level, then the score returns to the level-start value (0), lives are kept, the saved best does not change. Twice in a row gives the same result. | F21 AC1-AC3, AC6, AC7a; M7.2 | L |
| UAT-31 | Given the Restart Game prompt, when I Cancel (button or Back), nothing changes; when I Confirm, the best is saved first and the score is 0. | F6 AC11, F20 AC4(c), M7.2 | L |
| UAT-32 | Given a run above my best, when I leave the app (Home), then the best is saved at once, even if the run is later lost. | M7.2, F20 AC4(e), F21 AC7(b)/(d) | P |
| UAT-33 | Given a best and "Swap controls" on, when a new build is installed over the app, or the phone restarts, then both are kept. After "Clear storage" the app behaves like a first launch. | M7.4, F22 AC13 | L |
| UAT-34 | Given play, then "Best" is not shown in the play HUD. | F20 AC14 | L |

### E. Leaving and coming back

| ID | Scenario | Criteria | Device |
|---|---|---|---|
| UAT-35 | Given I am playing, when I press Home, open Recents, turn the screen off, pull down notifications, a system dialog appears, or a call comes in, then on return the pause menu is showing and play never restarts by itself. | M4.1, M4.3 | P, T |
| UAT-36 | Given I leave mid-run with a power-up timer running, when I return after 5 s and after 10+ minutes, then score, lives and the timer are exactly as I left them. | M4.2, F6 AC7 | P |
| UAT-37 | Given the title, Settings or Game Over, when I leave and return, then I am on the same screen. | M4.4 | P |
| UAT-38 | Given a 15 s screen timeout, then the screen stays on while I play without touching it, and turns off normally on the pause menu. | M4.5 | P |
| UAT-39 | Given a run in the background, when Android kills the app, then reopening shows the title with best and settings intact, no crash. | M4.6 | P |
| UAT-40 | Given the app is in the background, then it draws no frames and holds no wake lock. | M10.6 | P |

### F. Back and Quit

| ID | Scenario | Criteria | Device |
|---|---|---|---|
| UAT-41 | Back does: countdown / play → pause; pause → resume; restart prompt → cancel; help / settings → close; privacy → Settings; Game Over → title; title → leave the app; "make the window larger" → leave the app. In both navigation modes. | M5 table, M5.1, M5.3 | P (3-button), L (gesture) |
| UAT-42 | Given play, when I press Back five times fast, then the game only pauses/resumes and never closes. | M5.2 | P |
| UAT-43 | Given the pause menu or the title, when I tap Quit, then the app closes with no web "close this tab" text; next launch is the title; the best is kept. | M6.1-M6.3 | L, P |

### G. Privacy, offline, permissions

| ID | Scenario | Criteria | Device |
|---|---|---|---|
| UAT-44 | Given airplane mode, when I go title → Settings → Privacy policy (2 taps), then the policy opens inside the app, matches `public/privacy.html`, scrolls by finger, and Close / Back return to Settings. No network request. Not reachable from the pause menu. | M11.4a, M11.1 | L |
| UAT-45 | Given airplane mode, then the app launches and plays. The installed app asks for no permission and has no INTERNET permission. | M11.1, M11.2, M1.5 | L + APK |

### H. Performance and stability

| ID | Scenario | Criteria | Device |
|---|---|---|---|
| UAT-46 | Given 15 minutes of continuous play with restarts on the low-end profile, then no crash, no freeze, memory steady. | M10.4 | L |
| UAT-47 | Given play, then ≥ 30 FPS on low-end and ≥ 55 FPS on mid-range, no freeze > 250 ms, at level-10 load. | M10.1, M3.6 | L, P |
| UAT-48 | Given the whole UAT session, then `adb logcat` shows 0 `FATAL EXCEPTION` on every device. | MG1, M10.4 | all |

### I. Shared game on the phone

| ID | Scenario | Criteria | Device |
|---|---|---|---|
| UAT-49 | Given a full run, when I play levels 1-10, then levels, bosses, power-ups, shield catch, countdowns and Game Complete match the website; Back during Game Complete does nothing. | M0.4, M5 (Game Complete row), M4.4 (Game Complete), F21 AC1 on level ≥ 2, AC5 | L or P |

## Traceability

- Every scenario cites at least one acceptance criterion (no orphans).
- Mobile criteria with no scenario here are listed under "Out of scope for UAT" with the step
  that owns them, or are covered only by automated tests per the "Test map" in
  `manual-only-criteria.md` (M0.1-M0.3, M3.12, M10.2 timestep math).
- Edge / failure cases: UAT-17, 23, 24, 25, 27, 29, 31, 39, 42.

## Pass rule

UAT is **PASS** only if no scenario is FAIL. A scenario that could not be exercised on an
emulator is recorded as **NOT RUN** with the reason and where it will be covered; it does not
count as PASS.
