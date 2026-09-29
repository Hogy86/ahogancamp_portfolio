# Product Requirements Document — Mobile Addendum (Android)

**Product:** Vanguard vs. Sentinels: Shield Invaders (Android app)
**Product name (renamed 2026-09-25, owner decision OQ-S1 (b)):** **Shield vs Robots** (Android app). The hero keeps the name "Vanguard"; the enemies are "robots" (no longer "Sentinels"). The line above is kept as the original record.
**Hero name (renamed 2026-09-25, v1.4, owner decision OQ-S1a):** the hero is **"ShieldMan"** (no longer "Vanguard"). Earlier lines that say "Vanguard" are kept as the original record.
**Stage:** Mobile Pipeline Step 2 — mobile-product-manager
**Date:** 2026-09-25
**Author:** mobile-product-manager subagent
**Status:** **Draft v1 — OQ-M1..OQ-M10 DECIDED by owner 2026-09-25 (all recommendations accepted); OQ-M11..OQ-M14 PENDING**
*(Status updated 2026-09-25, v1.3: OQ-S1, OQ-A1 and Q-v3-1 also DECIDED by the owner; OQ-M11..OQ-M14 still PENDING.)*
*(Status updated 2026-09-25, v1.4: OQ-S1a (hero name "ShieldMan") DECIDED by the owner; a name/trademark check on "ShieldMan" is recommended before step 15; OQ-M11..OQ-M14 still PENDING.)*
*(Status updated 2026-09-27, v1.5: PM clarification M2.10a (too-small window, any shape) added; no owner decision reopened or needed; OQ-M11..OQ-M14 still PENDING.)*
*(Status updated 2026-09-28, v1.6: PM decision M2.3b (the playfield may extend under the top/bottom system-gesture bands; text and controls may not) so the 640 × 360 dp reference phone plays with real Android insets; no owner decision reopened or needed; OQ-M11..OQ-M14 still PENDING.)*
(see §Pending Owner Decisions, OQ-M1..OQ-M14). Every pending decision has a
default already written into the acceptance criteria below so downstream
steps (ui-ux-designer round 1, solution-architect) can start. Any owner answer
that differs from a default is applied by amending this file with a dated
note (never silent rewrite), per traceability-conventions.

**Amendment 2026-09-25 (Draft v1.1).** Amended after the mobile UX round-1
gate (`docs/mobile/ux/design-review-round1.md`, verdict FAIL) and the shared
PRD addendum v3 (`docs/PRD-addendum-v3.md`). Original AC text is kept; every
change is an added, dated **"Amended 2026-09-25"** block beside the AC it
changes. See §9 Amendment log for the full list. No owner decision
(OQ-M1..OQ-M10) is reopened; owner question Q-v3-1 (Restart Level score) is
still pending with the owner and is **not** decided here.

**Amendment 2026-09-25 (Draft v1.2).** Amended after the mobile security
pass-1 gate (`docs/mobile/security/review-v1.md`, verdict FAIL). Adds
acceptance criterion **M11.4a** (in-app privacy policy, finding H1) and a
"Privacy policy overlay" row to the M5 back table, and records three
questions now with the owner in §7: **OQ-S1** (finding M5, the "Sentinels"
name), **OQ-A1** (storage-plugin contingency, M-ADR-0006) and **Q-v3-1**
(still pending). None of the three is decided here. Original text is kept;
see §9 Amendment log.

**Amendment 2026-09-25 (Draft v1.3) — owner decisions.** The owner (Aaron)
answered the three v1.2 questions on 2026-09-25, in his words: *"Run all recommendations except for the name change - suggest changing it to 'shield vs robots'."*
Recorded in §7: **Q-v3-1 = (b)** (Restart Level resets the score to its
level-start value), **OQ-A1 = (a)** (Android-only `@capacitor/preferences`
adapter pre-approved, used only if the saved-data emulator checks fail),
**OQ-S1 = (b)** (rename; new product name **"Shield vs Robots"**, hero
keeps "Vanguard", enemies are "robots"; application ID placeholder
becomes `io.github.hogy86.shieldvsrobots`). The rename and the Restart Level
rule are **shared game changes**; their shared acceptance criteria are
being written by the website product-manager in `docs/PRD-addendum-v4.md`
(in progress in parallel; cross-referenced here, not written here). Mobile
ACs that name the title/label or depend on these rules (M7.2, M7.4, M9.1,
new M9.6, M12.1, M12.3, new M12.6) carry dated "Amended 2026-09-25 (v1.3)"
blocks; original text is kept. OQ-M11..OQ-M14 remain pending (OQ-M11's
option (a) app ID text updated only). See §9.

**Amendment 2026-09-25 (Draft v1.4) — owner decision OQ-S1a (hero name).**
The owner (Aaron), right after the OQ-S1 decision, instructed: *'change Vanguard name to "ShieldMan"'* (2026-09-25, given right after the "Shield vs Robots" decision).
Recorded in §7 as **OQ-S1a**: the hero is renamed from **"Vanguard"** to
**"ShieldMan"** (one word, capital S and M) everywhere a player can see it.
**Reading rule from v1.4 on:** wherever an original or v1.1-v1.3 line of
this document names the hero "Vanguard", read "ShieldMan"; ACs that name
the hero (M2.4, M3.3/M3.3a, M9.1, M9.6, M12.1, M12.3, M12.6) and the §7 notes
that quote the name (OQ-M3, OQ-S1) carry dated "Amended 2026-09-25 (v1.4)"
blocks; original text is kept. The product name "Shield vs Robots", the
enemy name "robots" and the app ID placeholder
`io.github.hogy86.shieldvsrobots` are unchanged. This is a **shared game
change** (hero name, `docs/PRD.md` NFR-10 names): the shared AC belongs in
the shared PRD (`docs/PRD-addendum-v4.md` or a later addendum, website
product-manager) and both pipelines' gates re-run per §0 rule 3. **Risk
note (PM):** a shield-throwing hero called "ShieldMan" is close to Archie
Comics' "The Shield" (a patriotic shield-emblem superhero) and to Captain
America (the shield-throwing hero this game was re-themed away from); a
name and trademark check on "ShieldMan" is recommended before step 15
(mobile-marketing-analyst is running it). See §7 OQ-S1a and §9.

**Amendment 2026-09-27 (Draft v1.5) — too-small window (spec gap, PM
decision).** Step 7/8 and step 10 found a case this document did not cover
(`docs/mobile/tooling-setup-log.md` 2026-09-27 fold-AVD entry;
`docs/mobile/tests/validation-report-round2.md` svr_api36_fold row;
`docs/mobile/reviews/code-review-round7.md` I6): a **landscape-shaped**
window smaller than the layout needs (e.g. the 412 × 309 dp window on the
fold emulator, or a small split-screen/free-form window). M2.10 covers only
portrait-shaped windows, and M2.12 + M2.13 need about **624 dp** of width
(224 dp of control columns + a 400 dp playfield), so no layout can meet the
spec below that. Added **M2.10a**: any window, of any shape, that cannot
fit the M2.12 columns plus a ≥ 0.5× playfield keeps the game paused and
shows "Make the window larger to play." M2.13 and the M5 back table get
dated clarifying notes. **Not owner-level:** it adds no feature, cost or
risk, changes no game rule, and follows owner decision OQ-M7 (a) ("scale
cleanly, no tablet-specific layout") and the existing M2.10 pattern rather
than adding a small-window layout. It is Android screen-fitting only (§0
rule 2), not a shared game change. Original text is kept; see §9.

**Amendment 2026-09-28 (Draft v1.6) — real Android insets on the 640 × 360
dp reference phone (code-review round 8 E1, PM decision).** The round-8 code
review measured real insets on an Android 16 emulator with gesture
navigation: about 28 dp at the top (the swipe-down band exists even with the
status bar hidden), 32 dp at the bottom (the home-gesture band) and about
30 dp on each side (the back gesture). The v1.5 floor subtracted every edge
inset from the playfield height. A 640 × 360 dp window therefore needs
t + b ≤ 60 dp, and the real value is about 60. A phone with a slightly taller
status bar would show "Make the window larger to play." on every screen, on
the very phone class that M2.6 and M2.12 name as the design target.
Decision, new **M2.3b**: the **playfield** (non-interactive game art) may
extend under the top and bottom **system-gesture bands**. HUD text, touch
controls and menu buttons still may not, and nothing extends under a display
cutout. The 0.5× floor (M2.13), control sizes (M3.1, M3.2), text sizes (M2.6,
M2.11) and the side-inset rule (M2.3a) are unchanged. M2.10a and M2.12 get
dated notes. **Not owner-level:** it changes no game rule, cost or scope, and
keeps OQ-M7 (a) (no new layout). It is Android screen fitting only (§0
rule 2). Original text is kept; see §9.

**What this document is — and is not.** The game itself (levels, enemies,
shield bounce, power-ups, lives, score, pause options, bosses, countdown,
Game Complete) is already fully defined by `docs/PRD.md` (F1-F10, NFR-1..10)
and `docs/PRD-addendum-v2.md` (F11-F19). This addendum does **not** re-plan
the game. It defines **only what changes on an Android phone or tablet**:
touch input, screen fitting, the Android back button/gesture, app lifecycle
(backgrounding), on-device persistence, first-launch help, app icon/splash,
performance on low-end devices, and Google Play store/policy requirements.

**Sources (upstream):**
- `docs/PRD.md` — v1 game spec (F1-F10, NFR-1..NFR-10, use cases UC1-UC7, goals B1-B4/P1-P5)
- `docs/PRD-addendum-v2.md` — v2 game spec (F11-F19)
- `docs/mobile/market/play-store-research.md` — comparable apps, complaint patterns (§1), price model (§2), name check (§3), IP scan (§4)
- `docs/mobile/market/listing-draft.md` — draft title, descriptions, keywords, screenshot storyline
- `docs/market/voice-of-customer.md`, `docs/market/market-goals-and-use-cases.md` — segments A-D, UC1-UC7
- Current shared code, read to ground screen-fitting requirements in what exists:
  `src/config/constants.ts` (fixed 800×600 playfield, `PLAYER_Y = 552`),
  `src/style.css` (fixed-pixel `#app-root` 800×600, 15 px HUD text),
  `src/core/InputManager.ts` (keyboard-only intents), `src/ui/ScreenController.ts`
  (Quit fallback text "Run ended — you may now close this tab."),
  `src/instrumentation/Instrumentation.ts` (on-device localStorage counters only)
- `.claude/CLAUDE.md` §"Mobile Pipeline" / §"One codebase (owner decision)"
- `docs/PRD-addendum-v3.md` — F20 saved best score (shared rule behind M7.1/M7.2); Q-v3-1 (pending)
- `docs/mobile/ux/design-review-round1.md` — round-1 UX gate findings F1-F4, N2 (drove the 2026-09-25 amendments)
- `docs/mobile/security/review-v1.md` — mobile security pass 1 (FAIL): H1 (in-app privacy policy → M11.4a, M5 row), M5 (→ OQ-S1); plugin allowlist note (→ OQ-A1) *(added 2026-09-25, v1.2)*
- `docs/mobile/architecture/adr/0006-on-device-persistence.md` — Part 2 storage contingency (→ OQ-A1) *(added 2026-09-25, v1.2)*
- `docs/PRD-addendum-v4.md` — shared game changes from the 2026-09-25 owner decisions: rename to "Shield vs Robots" / enemies "robots" (OQ-S1 (b)) and Restart Level score reset (Q-v3-1 (b)); owned and being written by the website product-manager in parallel *(added 2026-09-25, v1.3)*
- Owner instruction 2026-09-25, relayed verbatim by the main session: *'change Vanguard name to "ShieldMan"'* (2026-09-25, given right after the "Shield vs Robots" decision) → §7 OQ-S1a *(added 2026-09-25, v1.4)*
- `docs/mobile/market/play-store-research.md` §3-§4 — name/trademark check on "ShieldMan" being run by mobile-marketing-analyst (result pending; → OQ-S1a) *(added 2026-09-25, v1.4)*
- `docs/mobile/tooling-setup-log.md` (2026-09-27 step-7 entry, "Fold-AVD window-size question"), `docs/mobile/tests/validation-report-round2.md` (svr_api36_fold row, known gaps), `docs/mobile/reviews/code-review-round7.md` I6 — too-small landscape window has no defined behavior (→ M2.10a) *(added 2026-09-27, v1.5)*
- `docs/mobile/reviews/code-review-round8.md` E1: real gesture-navigation insets measured on `svr_api36_pixel7` (t ≈ 28.2, b = 32, sides ≈ 29.7 dp) make the 640 × 360 dp reference window miss the v1.5 floor (→ M2.3b, M2.10a and M2.12 v1.6 notes) *(added 2026-09-28, v1.6)*

---

## 0. Shared game rules — one game, two front doors (binding)

1. **Game rules are shared with the website and exist once, in `src/`.** Every
   acceptance criterion in `docs/PRD.md` and `docs/PRD-addendum-v2.md` applies
   to the Android app unchanged, except where §3 below gives an explicit
   *platform mapping* (e.g. "Esc" → pause button / back gesture). A mapping
   changes *how the player triggers* a rule, never *what the rule does*.
2. **Only these areas may have Android-specific code:** touch input, screen
   fitting (scaling, safe areas, orientation), back button/gesture, app
   lifecycle (background/foreground, process death), and Android packaging
   (icon, splash, manifest). This is the owner's one-codebase decision in
   `.claude/CLAUDE.md`.
3. **Any change to game rules or design** — whether it starts in the website
   pipeline or this one — must (a) update the shared acceptance criteria in
   `docs/PRD.md` or a PRD addendum, (b) update this document where mobile
   behavior changes, and (c) pass the code-review, test, and UX gates for
   **both** the website and the Android app before either ships. OQ-M8 (saved
   best score) is the first such case and is flagged accordingly.
4. `.github/workflows/deploy-pages.yml` remains the single CI check. Once the
   Android project exists, the Android debug build and the phone-emulation
   tests are added to it, so a change that breaks either version blocks the
   website deploy.
5. The Play Store version only changes when a new release ships (pipeline
   steps 15-17), so it may lag the website. That lag is expected; it is not a
   parity violation.

**Acceptance criteria (parity):**
- **M0.1** The Android build is produced from the same `src/` as the website
  (Capacitor wraps the Vite `dist/` output; web assets inside `android/` are
  never hand-edited — only regenerated by `npx cap sync android`).
- **M0.2** The full shared unit-test suite (`npm run test`) passes on the
  commit the Android build is made from, with no Android-only skips of
  game-rule tests.
- **M0.3** No game-rule constant (anything in `src/config/constants.ts` or
  `src/config/levelConfig.ts` that feeds F1-F19 behavior) has a different value
  on Android than on the web build. (Screen-fitting/scale values are not
  game-rule constants.)
- **M0.4** A reviewer can play levels 1-10 on the Android emulator and observe
  the same level table (F4), boss phases (F12), power-ups (F7/F11), shield
  bounce/catch (F15/F16), countdown (F18) and Game Complete (F19) as on the
  website.

---

## 1. Summary

The Android app is the existing browser game, wrapped with **Capacitor** (a
tool that packages a web app inside a native Android app shell; the game runs
in the phone's built-in web engine, the **WebView**), distributed on Google
Play. It is played in **landscape** with **on-screen touch buttons**, fits any
modern phone or tablet screen (including notches/camera cutouts, gesture
navigation bars, and foldables), pauses itself whenever the player leaves the
app, treats the Android back gesture as "pause", remembers the player's best
score and control setting, shows a one-time "how to play" overlay, and runs
smoothly on a low-end phone. It is **free, with no ads and no in-app
purchases** (PM default, pending OQ-M1), works fully offline, requests no
permissions, and collects no data.

The market research shows every comparable app is free, and that they lose
players on two execution failures, not features: **ad fatigue** and
**touch-target / HUD-fit problems** (a too-small pause button, a score cut off
by the screen edge, a fire button that lags under load)
(`play-store-research.md` §1 patterns 2-4). This addendum makes those two
failure modes first-class, testable requirements (§M2, §M3, §M10, §M11).

---

## 2. Target users, goals, use cases (mobile deltas only)

### Target users
Segments A-D from `docs/PRD.md` §Target Users are unchanged. Mobile shifts
emphasis:
- **Segment D (time-boxed casual)** is the dominant phone player: sessions
  are interrupted by calls, notifications, and app switches — so lifecycle
  pause (M4) is the mobile version of UC2's "pause that actually pauses."
- **Segment A (nostalgic replayer)** judges the app on "does it feel good to
  play on my phone" (`play-store-research.md` §1 pattern 5) — so touch
  controls (M3) carry the whole first impression.
- **Segment C (skill-chaser)** on a phone expects a remembered best score
  (pending OQ-M8).

### Goals & success metrics (mobile)
Web goals B1-B4 / P1-P5 still apply as design intent. Because the app sends
no telemetry (M11), mobile success is measured from Google Play Console and
the closed test, not in-app analytics:

| # | Metric | Target | How measured |
|---|---|---|---|
| MG1 | User-perceived crash rate | < 1.09% of daily users (Play's "bad behavior" threshold) — and **zero** reproducible crashes in the closed test | Play Console → Android vitals; closed-test reports |
| MG2 | User-perceived ANR ("App Not Responding" freeze) rate | < 0.47% of daily users (Play threshold) | Android vitals |
| MG3 | Cold start to interactive title screen | ≤ 5 s on the low-end reference device; ≤ 3 s on mid-range | M10.3 test; Android vitals startup |
| MG4 | First throw without instructions (P1, mobile) | ≥ 80% of closed-test testers throw within 10 s of the level-1 countdown ending, without asking how | Closed-test checklist question |
| MG5 | Controls satisfaction | ≥ 80% of closed-test testers answer "controls felt responsive / buttons easy to hit" | Closed-test checklist |
| MG6 | No HUD/controls cut off | 0 reports of cut-off score/lives/pause/buttons across the device matrix and closed test | UAT + closed test |
| MG7 | Closed test gate | ≥ 12 opted-in testers for 14 continuous days (Google's requirement for new personal accounts) | Play Console |

### Use cases (mobile mapping)

| Web UC | Mobile realization | Mobile feature(s) |
|---|---|---|
| UC1 Pick up and play within seconds | Tap Start, read one-time help, move with ◀ ▶, throw with THROW button | M3, M8 |
| UC2 Pause and resume exactly | Pause button, back gesture, and **automatic pause on leaving the app** | M3, M4, M5 |
| UC3/UC5 Escalation to a finite end | Unchanged (shared rules); must stay legible on a small screen | M0, M2 |
| UC4 Catch power-ups | Unchanged; power-up icons must stay distinguishable at phone scale (F11 AC8) | M2 |
| UC6 Instantly recognize the premise | Icon + first screenshot + title screen convey it | M9, M12 |
| UC7 Restart without reload | Pause menu buttons are tappable | M3 |
| **UC-M1 (new)** Survive real-phone interruptions (call, notification, app switch, screen off) without losing the run | Auto-pause + exact resume | M4 |
| **UC-M2 (new)** Come back tomorrow and see my best | Saved best score (pending OQ-M8) | M7 |

---

## 3. Platform mapping of shared acceptance criteria

These are the only places where a shared AC is triggered differently on
Android. The *rule* is unchanged in every row.

| Shared AC | Web trigger | Android trigger |
|---|---|---|
| F1 AC1-AC3, AC5 (move, clamp, stop, opposing cancel) | Hold ← / → | Hold ◀ / ▶ touch buttons; holding both = cancel (M3.4) |
| F1 AC4 / NFR-3 (≤100 ms input latency) | Key press | Touch-down on a control (M3.6) |
| F2 AC1 / F16 AC3 (throw; one shield in flight) | Space | THROW touch button; tap while a shield is in flight does nothing (M3.5) |
| F6 AC1-AC3 (pause / resume) | Esc | PAUSE button, Android back gesture/button (M5), or leaving the app (M4) |
| F6 AC6, AC9 (Quit → close tab, else fallback text) | Tries `window.close()`, shows "you may now close this tab" | **Quit closes the app** (M6.1); the tab-close fallback text is not shown on Android |
| F6 AC8 (Esc is a silent no-op off active play) | Esc | Back gesture follows the explicit back map in M5 instead |
| F6 AC10 (keyboard menu navigation) | ↑ ↓ Enter | Tap the option directly (M3.8); keyboard nav still works if a hardware keyboard is attached |
| F6 AC11 (Restart Game confirmation) | Keyboard confirm | Tap Confirm / Cancel; back = Cancel (M5) |
| F9 AC2 (one line of control text) | "← → move · Space throw · Esc pause" | Touch wording + the first-launch help overlay (M8) |
| F9 AC3 / NFR-1 (≤3 s to first input) | Page load | App cold start to title (M10.3); level-1 intro timing per F18 reconciliation unchanged |
| F19 AC9 ("any key" holds Game Complete; Esc exempt) | Any key except Esc | **Tap anywhere** holds; a second tap advances; back gesture exempt (no-op), mirroring the Esc exemption (M5) |
| NFR-2 (frame rate) | Mid-range laptop | Low-end + mid-range Android references (M10) |
| NFR-4 (browsers) | Latest 2 desktop browsers | Android version range (M1, OQ-M6) |
| NFR-5 (keyboard only) | Keyboard | Touch is the primary input on Android (M3) |
| NFR-6 (no install / no account) | URL | One store install, no account, no login (M11) |
| NFR-7 (no backend) | Client-side | Fully offline, no network requests (M11.1) |
| NFR-8 (instrumentation) | localStorage counters | Same counters stay **on device only**; never transmitted (M11.3) |
| F10 AC6 (score is session-only) | Session-only | **Pending OQ-M8** — default adds a saved best score on *both* platforms via a shared PRD amendment |

*Amended 2026-09-25 (v3 F20):* the F10 AC6 row above is resolved. OQ-M8 (a)
was decided and the shared amendment exists: `docs/PRD-addendum-v3.md` F20
supersedes F10 AC6 on both platforms. Android trigger for F20 AC4(e) ("page
hidden") = app goes to the background (M7.2). All other F20 ACs apply
unchanged (M7.1-M7.6).

---

## 4. Features (mobile)

Priority: **P0** = release-blocking; **P1** = required for v1 unless the owner
descopes; **P2** = nice-to-have, may slip. Every AC is testable on the
emulator unless marked *(device/closed test)*.

### M1 — Android platform baseline
Traces to: NFR-4, NFR-6; OQ-M6, OQ-M7. **P0.**

- **M1.1** Minimum supported Android version = the Capacitor default in use
  when the project is created (**API 24 / Android 7.0** as of Capacitor 8 —
  solution-architect to verify). *(PM default, pending OQ-M6.)* "API level"
  is Android's version number for developers; API 24 = Android 7.0.
- **M1.2** Target API level = the level Google Play requires for new apps at
  submission time (**API 36 / Android 16** since 31 Aug 2026 — release
  engineer re-verifies at step 15). Google Play rejects uploads below it.
- **M1.3** The app installs and runs on phones **and** tablets, including
  foldables and Chromebooks that can run Play apps. *(PM default, pending
  OQ-M7.)*
- **M1.4** If the device's WebView is too old to run the game's JavaScript,
  the app shows a readable message ("Please update Android System WebView
  from the Play Store") instead of a black or white screen. *(P1)*
- **M1.5** No Google account, sign-in, or network connection is needed at
  any point to play.

### M2 — Orientation and screen fitting
Traces to: `play-store-research.md` §1 pattern 3 (cut-off score, touch-target
ratio); NFR-9(b); F12 AC5; F11 AC8; OQ-M2, OQ-M4, OQ-M7. **P0.**

Background for the owner: the game's playfield is a fixed **800 × 600 (4:3,
landscape-shaped)** area. Modern phones in landscape are much wider (about
20:9), so the playfield is scaled to fit the screen height, leaving empty
columns on the left and right — those columns are where the touch buttons go.
A **display cutout** is the camera notch/hole in the screen; the **gesture
bar/gesture zones** are the screen edges Android reserves for "swipe to go
back/home." Apps that target Android 15+ are drawn **edge-to-edge** (under
those areas) by default, so the app itself must keep important things out of
them.

- **M2.1 Orientation.** The app runs in **landscape only** and allows both
  landscape directions (turning the phone 180° flips the view; it never
  switches to portrait during play). *(PM default, pending OQ-M4.)*

  **Amended 2026-09-25 (UX round 1 F1) — M2.1a Landscape from launch, on
  every screen.** The landscape lock applies from the moment the app process
  starts, not from when play begins: the splash screen, title, "How to play"
  overlay, Settings, pause menu, Restart Game prompt, Game Over and Game
  Complete are all landscape. There is never a rotation or re-layout at the
  Start tap or at any other screen change; the only rotation ever shown is
  the 180° flip between the two landscape directions. Test: on a phone
  emulator with auto-rotate on and the device held in portrait, cold-start
  the app → the splash and title are drawn in landscape (screenshot); tap
  Start → the help overlay and level-1 intro appear with no rotation
  animation and no visible reflow. Exception: where Android itself overrides
  the app's orientation (large-screen/multi-window rules, M2.10), M2.10's
  "stay paused / rotate your device" behavior applies instead.
- **M2.2 Aspect-preserving scale.** The 800 × 600 playfield is scaled
  uniformly (no stretching; circles stay circles, F14 AC1) to the largest
  size that still leaves room for the controls per M2.4. Unused space is
  filled with the game's background color, not white or black bars of a
  different color.
- **M2.3 Nothing important in unsafe areas.** On every device in the device
  matrix, no HUD text (score, lives, level, permanent multiplier, active
  power-up indicator), no touch control, and no menu button lies under a
  display cutout, the status bar area, or a system gesture zone. Background
  art may extend under them.

  **Amended 2026-09-25 (UX round 1 F3) — M2.3a Edge insets are subtracted
  before controls are placed.** For each screen edge (left, right, top,
  bottom), the *edge inset* is the larger of that edge's display-cutout
  inset and its system-gesture inset, as reported by Android **at run
  time** for the current device, orientation and navigation mode (not a
  hard-coded constant). Every touch control's full touchable area (not just
  its drawn art) lies inside the screen minus these insets. For layout
  budgeting and review, the nominal inset is **24 dp per side edge** on the
  640 × 360 dp profile; if a device reports a larger inset, the playfield
  shrinks further (M2.12) — controls never shrink below their M3.1 minimums
  and never move into the inset. Player-facing test (gesture navigation on,
  both landscape directions, default and "Swap controls" layouts): press,
  hold and slide within the control nearest each side edge 20 times each →
  **0** back gestures, pauses, or home gestures are triggered, and the
  game does not interrupt itself. Deliberate edge swipes that start on the
  screen edge outside the controls still perform back (→ pause, M5).

  **Amended 2026-09-28 (v1.6, code-review-round8 E1) — M2.3b The playfield
  may extend under the top and bottom system-gesture bands.** Background for
  the owner: during full-screen play, Android still reserves an invisible
  band along the top edge (swipe down to show the status bar) and along the
  bottom edge (swipe up to go home). Android draws nothing there during play,
  and the game never needs a touch on the playfield. So drawing game art in
  those bands is safe, while text and buttons must stay out of them.
  1. *Playfield.* The scaled playfield (canvas art: robots, ShieldMan,
     shields, power-ups, lasers, background) counts as "background art" under
     M2.3. Its rectangle may lie under the **top and bottom system-gesture
     insets** and the hidden status-bar area. It may **not** lie under a
     display cutout on any edge, never lies in the left or right insets, and
     never overlaps a control column (M2.3a, M2.4, M2.12). For the vertical
     fit, only the top and bottom **display-cutout** insets limit the
     playfield's height.
  2. *Text.* All text drawn over the playfield (the HUD's score, lives,
     level, permanent multiplier and active power-up indicator, and any
     on-playfield hint text) lies fully inside the window minus the **full**
     M2.3a edge insets (the larger of cutout and system gesture) on all four
     edges. HUD panel backgrounds may extend into a band; the text may not.
     The playfield may sit off-centre vertically to achieve this.
  3. *Controls and menus: unchanged.* Every touch control's full touchable
     area and every menu button stays inside the full edge insets on all four
     edges (M2.3, M2.3a, M3.2). Menus, dialogs and the M2.10/M2.10a prompts
     stay inside the insets as today.
  4. *Not changed.* The 0.5× floor (M2.13); M3.1 sizes and gaps; M3.2 PAUSE
     rules; M2.6 and M2.11 text rules; M2.3a's side-edge rule and its 20-press
     test; M2.2 uniform scaling. No control shrinks and no new layout is added
     (OQ-M7 (a)). No game rule changes (§0 rule 2).
  Acceptance (the unit and Playwright tests use the insets fallback; (e) is
  on an emulator; the architecture doc states the exact formula):
  (a) **The reference phone plays.** Take a 16:9, 640 × 360 dp landscape
  window with gesture navigation, no display cutout, default back-gesture
  sensitivity and a 24-28 dp status bar, modelled as insets l = r = 30,
  t = 24 to 28.2, b = 32 dp, cutout 0 on every edge. On it the game is
  playable on every screen: no M2.10a prompt; playfield ≥ 0.5×
  (≥ 400 × 300 dp); ◀ ▶ THROW ≥ 56 dp; PAUSE ≥ 48 dp; ≥ 8 dp between
  adjacent targets; and a run can be started and played. The test table
  includes at least (l, r, t, b) = (30, 30, 24, 32), (30, 30, 28.2, 32) and
  the round-8 measured (29.7, 29.7, 28.2, 32), each in both control layouts
  (M3.13).
  (b) **Three-button navigation also plays** on the same window, with at
  least (0, 48, 24, 0) and (48, 0, 24, 0).
  (c) **Text and controls stay out of the bands.** For each case in (a) and
  (b), element bounds (and one screenshot per case on the emulator) show:
  every HUD/hint text box has top ≥ t and bottom ≤ H − b; every control is
  inside the full insets; the playfield rectangle may extend into [0, t) and
  (H − b, H].
  (d) **No art under a cutout.** With a 30 dp top display cutout (fixture;
  the top edge inset is then ≥ 30), the playfield's top edge is at ≥ 30 dp.
  The same applies to the bottom edge.
  (e) **Device evidence.** Use the representative 640 × 360 dp AVD that the
  lead tester adds to `docs/mobile/tests/device-matrix.md` (16:9, no
  cutout, gesture navigation, API 34+; code-review-round8 E1 (c)). Cold
  launch shows the title with no prompt. Start, then play for 30 s; the run
  plays normally. Record the reported insets and the resulting scale next to
  the screenshot. The `svr_api36_pixel7` `wm size` run is **not** this
  profile.
  *Known limit (accepted; recorded in architecture MR4).* Width is not
  relaxed: the side columns still need l + r ≤ 64 dp on a 640 dp wide window.
  Default gesture navigation (≈ 30 dp per side) and three-button navigation
  fit. A 640 dp wide phone with a side camera cutout, or with the back-gesture
  sensitivity set above default, still gets the M2.10a prompt. The closed
  test (step 16) asks testers to report any "Make the window larger to play."
  seen on a phone in full screen. If real devices show it, the options go to
  the owner then (§7 v1.6 note); the floor is not changed ad hoc.
- **M2.4 Controls never cover the playfield.** Touch controls sit outside the
  scaled playfield (in the side columns) on every screen ≥ 16:10. On screens
  squarer than that (e.g. 4:3 tablets), the playfield is scaled down until the
  controls fit beside it; controls must **never** overlap Vanguard's row or
  the area where falling power-ups and returning shields are caught.

  **Amended 2026-09-25 (UX round 1 F2).** The side margin is **not** split
  evenly. See M2.12 for the required column arithmetic.

  **Amended 2026-09-25 (v1.4, owner decision OQ-S1a).** The hero is named
  "ShieldMan": controls must never overlap **ShieldMan's** row or the area
  where falling power-ups and returning shields are caught. The rule itself
  is unchanged.
- **M2.5 Immersive play.** During the title screen and play, the status bar
  and navigation bar are hidden (Android "immersive" full-screen). A swipe
  from the edge temporarily reveals them without leaving the app; they
  re-hide automatically.
- **M2.6 Minimum legible size.** On the **smallest supported screen profile —
  640 × 360 dp in landscape** ("dp" = density-independent pixels, Android's
  physical-size unit; 48 dp ≈ 9 mm), all HUD and menu text renders at
  ≥ 12 sp equivalent (≈ 12 dp), even though the playfield itself is scaled
  down to ~0.6×. (The current web HUD is 15 px on a 600 px playfield, which
  would shrink to ~9 dp — too small — so HUD text must not simply scale with
  the playfield.)
  *Amended 2026-09-25 (UX round 1 F2):* with the M2.12 column budget the
  playfield on this profile is ≈ 0.52×, not ~0.6×; the ≥ 12 sp rule is
  unchanged and applies at the actual scale.
- **M2.7 Small-scale game legibility.** On the 640 × 360 dp profile, the four
  falling power-up types remain distinguishable by shape (F11 AC8), a 1-hit
  vs. 4-hit enemy remains distinguishable (F17 AC3), and the shield trail
  (F15 AC9) is visible — verified by the UX reviewer on a screenshot at that
  size.
- **M2.8 Tablets.** On a 10" tablet the game fills the screen per M2.2 with
  controls per M2.4; no text is pixelated or blurred (the canvas renders at the
  device's real pixel density).
- **M2.9 Foldables and window resizes.** Folding/unfolding, entering/leaving
  split-screen, or resizing the app window during play **pauses the game**
  (same as M4.1), re-lays-out within 1 s, and loses no run state.
- **M2.10 Portrait-shaped window.** If Android forces the app into a
  portrait-shaped window (e.g. split-screen on a tablet, or Android 16's
  large-screen rules), the game stays paused and shows "Rotate your device or
  enlarge the window to play." It never renders a squashed or cut-off
  playfield. (Architect note: declare the app as a game category so Android
  16 large-screen orientation overrides are handled as intended — verify.)

  **Amended 2026-09-27 (v1.5, spec gap) — M2.10a Too-small window, any
  shape.** M2.10 is extended to windows that are landscape-shaped but too
  small to play.
  - *Definition.* A window is **too small to play** when the layout cannot
    satisfy all of these at once, using the edge insets Android reports at
    run time (M2.3a): both M2.12 side columns at their minimum widths, every
    control at its M3.1 size with its M3.2 spacing, **and** a playfield of
    ≥ 0.5× (≥ 400 × 300 dp, M2.13). With the nominal 24 dp side insets and no
    top/bottom inset this means a window **narrower than 624 dp or shorter
    than 300 dp**. The check depends only on the window's size, not its
    shape. It runs whenever the layout is recalculated: launch, resize,
    fold/unfold, entering or leaving split-screen or a free-form window, and
    rotation. `docs/mobile/architecture/mobile-architecture.md` states the
    exact formula, as M2.12 (a) requires for the column arithmetic.
  - *Precedence.* A portrait-shaped window keeps M2.10's behavior and text
    ("Rotate your device or enlarge the window to play."). M2.10a applies to
    every other window that is too small to play.
  - *Behavior.* (1) If a run is active (play, level intro, boss warning), it
    is paused exactly as in M4.1, and no game time passes while the prompt
    shows (M4.2). (2) The whole window shows only the game background and
    the centered message **"Make the window larger to play."** It meets M2.6
    (≥ 12 sp) and M2.11 (largest system font: wraps, never clips) and sits
    inside the edge insets. (3) While the prompt shows, no playfield, HUD,
    menu or touch control is drawn or responds to taps. The app never draws
    a playfield below 0.5×, never squashes or crops it, and never lets
    controls overlap it. (4) When the window becomes large enough, the
    layout is redone within 1 s (M2.9) and the screen that was underneath
    returns. A run comes back on the **pause menu** and never resumes by
    itself (M4.3). The title, Settings, Help, Game Over and Game Complete
    screens come back as they were (M4.4). (5) Back while the prompt shows
    works like the M5 "Rotate your device" row: it leaves the app, and the
    run stays paused in the background (M4.1, M4.6).
  - *Acceptance tests (emulator).*
    (a) `svr_api36_fold` (412 × 309 dp window): cold launch → within 5 s the
    screen shows only "Make the window larger to play." with no part of the
    title menu, HUD or controls visible. Take a screenshot. Tap anywhere 5
    times → nothing changes. Press Back → the app goes to the background,
    with no crash in `adb logcat`.
    (b) On a profile at or above the floor (e.g. `svr_api36_pixel7`), during
    active play, shrink the app window below the floor (split-screen or
    free-form resize; or `adb shell wm size` / `wm density` to give a
    landscape window under 624 dp wide) → within 1 s the prompt shows and
    the run is paused. Wait 10 s, then restore the window → within 1 s the
    pause menu shows; after Resume, score, lives, level, remaining enemies,
    enemy positions and power-up timers match the pre-shrink values
    (as in the M4.2 check).
    (c) Boundary: a 640 × 360 dp landscape window plays normally with no
    prompt (M2.12 layout). A 600 × 360 dp landscape window shows the prompt.
    (d) The same as (a) on the title screen with the largest system font
    (M2.11): the message wraps and is not clipped.
  - *Not changed.* 640 × 360 dp stays the smallest profile the game is
    designed and tuned for (M2.6, M2.12). M2.10a defines only what happens
    below the floor. No small-window or band layout is added (OQ-M7 (a)).
    Web behavior does not change. M2.9 fold/unfold still needs a device or
    emulator whose window actually resizes. The fixed-size fold AVD can
    only exercise M2.10a (see the validation report's known gaps).

  **Amended 2026-09-28 (v1.6, M2.3b; code-review-round8 E1).**
  (1) *Definition.* "Too small to play" is now judged with M2.3b. The
  playfield's height is limited only by the top and bottom **display-cutout**
  insets, and the HUD/hint text must still fit inside the full top and bottom
  edge insets (M2.3b rule 2). The width test is unchanged: both columns at
  their minimum widths inside the full side insets, plus a ≥ 400 dp
  playfield. The "narrower than 624 dp or shorter than 300 dp" example (24 dp
  side insets, no top/bottom inset) still holds.
  `docs/mobile/architecture/mobile-architecture.md` restates the exact
  formula.
  (2) *Test (c) boundary* is judged with real-inset values and on the M2.3b
  (e) AVD. A 640 × 360 dp window with insets (l 30, r 30, t 28.2, b 32) plays
  with no prompt. A 600 × 360 dp window with the same insets shows the
  prompt. The `svr_api36_pixel7` `wm size` 640 × 360 run keeps a scaled
  36 dp left camera cutout (l + r ≈ 66 > 64). Its prompt is therefore the
  expected result under the M2.3b known limit, not an M2.10a (c) failure, and
  it is recorded that way.
  (3) The rest of M2.10a (behavior 1-5, tests (a), (b), (d), message text) is
  unchanged.
- **M2.11 System font size.** With the Android system font size set to its
  largest value, HUD, menus and help text do not overflow, clip, or overlap
  controls.
- **M2.12 Control-column budget (added 2026-09-25, UX round 1 F2/F3).**
  Each side column is sized to its own contents, and the playfield may sit
  off-center between them and be scaled below "fills the screen height" when
  that is needed to fit the controls. (This is within M2.2 as written —
  "largest size that still leaves room for the controls" — it only removes
  the implicit 50/50 split.) Required minimum widths, per side:
  - **Movement column** = edge inset (M2.3a) + ◀ + gap + ▶, with ◀ and ▶
    **side by side** (◀ physically left of ▶; not stacked). On the
    640 × 360 dp profile: 24 + 56 + 8 + 56 = **≥ 144 dp**.
  - **THROW column** = edge inset + THROW (PAUSE sits above THROW in the same
    or opposite column per the UX spec, ≥ 24 dp from THROW, M3.2). On the
    640 × 360 dp profile: 24 + 56 = **≥ 80 dp**.
  - Resulting playfield on 640 × 360 dp: ≤ 640 − 224 = **416 dp wide ×
    312 dp tall (≈ 0.52×)**. The playfield must be **≥ 0.5× (400 × 300 dp)**
    on this profile.
  - "Swap controls" (M3.13) mirrors the columns; the same arithmetic holds.
  Acceptance: (a) `docs/mobile/architecture/mobile-architecture.md` states
  the exact column widths, edge insets, playfield scale and playfield
  position for the 640 × 360 dp profile and shows the sums close (no
  overlap, no target below its M3.1 size); (b) on that emulator profile, a
  screenshot in each landscape direction and in both control layouts shows
  ◀, ▶, THROW ≥ 56 dp, PAUSE ≥ 48 dp touchable, ≥ 8 dp between adjacent
  targets, no control over the playfield, and no control inside the
  reported edge insets — this check is listed in
  `docs/mobile/tests/device-matrix.md`; (c) HUD/menu text still meets M2.6
  and game art still meets M2.7 **at the resulting scale** (≈ 0.52×, not the
  ~0.6× originally estimated in M2.6).

  **Amended 2026-09-28 (v1.6, M2.3b; code-review-round8 E1).** The 24 dp side
  insets and "≈ 0.52×" above are planning numbers. With real
  gesture-navigation insets (≈ 30 dp per side) the 640 × 360 dp playfield is
  about **404 × 303 dp (≈ 0.505×)**, still ≥ 0.5×. The minimum column widths
  and the ≥ 0.5× floor are unchanged. Acceptance (a) now also asks the
  architecture doc to show the arithmetic with the measured code-review-round8
  E1 insets and with three-button navigation, on **both** axes (vertical per
  M2.3b). (b) is run on the M2.3b (e) representative AVD. (c): M2.6 text and
  M2.7 art are judged **at the actual scale on that AVD** (≈ 0.505×), and the
  round-2 UX review checks them there.
- **M2.13 Playfield scale floor on every screen (added 2026-09-25, UX round
  1 N2).** On every device in the matrix the playfield is rendered at
  **≥ 0.5×** (≥ 400 × 300 dp) and at the device's real pixel density (M2.8),
  using the same side-column layout as phones. Near-square screens (4:3
  tablets, foldable inner screens) accept a smaller *share* of the screen
  height for the playfield — this is expected, not a defect. No
  letterboxed-band or tablet-specific control layout is added, keeping owner
  decision OQ-M7 (a) ("scale cleanly, no tablet-specific layout"); a band
  layout is a candidate for a later version if closed-test tablet feedback
  asks for it. The architecture doc states the resulting playfield scale
  for each device-matrix profile.

  **Amended 2026-09-27 (v1.5).** "On every device in the matrix" means
  every window **at or above** the M2.10a floor. A window below it (e.g. the
  `svr_api36_fold` AVD's 412 × 309 dp window) is not an M2.13 failure. Its
  expected result is the M2.10a prompt, and the device matrix records it
  that way.

### M3 — Touch controls
Traces to: F1, F2, F6, F16 AC3, NFR-3, NFR-5 mapping; `play-store-research.md`
§1 patterns 3 (pause-button size, fire-button lag); OQ-M2, OQ-M5, OQ-M10.
**P0.**

Default scheme *(pending OQ-M5)*: fixed on-screen buttons — **◀ and ▶**
(movement, left thumb), **THROW** (right thumb), and **PAUSE** (small, top of a
side column). Exact placement, shape and art are owned by mobile-ui-ux-designer.

- **M3.1 Sizes.** Every touch target is ≥ 48 × 48 dp (Android's accessibility
  minimum, which Play's pre-launch report checks). ◀, ▶ and THROW are
  ≥ 64 × 64 dp on every device in the matrix *except* the 640 × 360 dp
  profile, where they may drop to ≥ 56 dp. Adjacent targets are ≥ 8 dp apart.
- **M3.2 Pause button.** PAUSE is ≥ 48 × 48 dp of touchable area even if drawn
  smaller, sits clear of cutouts and gesture zones (M2.3), and is far enough
  from THROW that it is not hit accidentally (≥ 24 dp gap).
- **M3.3 Movement.** Holding ◀ moves Vanguard left at the current movement
  speed (base, or 3× under the Speed power-up — F7 AC5); releasing stops it
  (F1 AC3). Sliding a finger from ◀ onto ▶ without lifting switches direction.

  **Amended 2026-09-25 (UX round 1 F4) — M3.3a Slide-to-switch behavior.**
  The player-facing behavior of one finger on the movement controls is
  defined by where that finger **currently** is, not by which button it
  first touched:
  1. **Switch.** A finger that touches ◀ and slides across the gap onto ▶
     without lifting makes Vanguard move right within ≤ 100 ms (NFR-3) of the
     finger entering ▶'s touch area; ▶ → ◀ is symmetric.
  2. **No drop.** While the finger crosses the ≥ 8 dp gap between ◀ and ▶,
     Vanguard keeps moving in the direction of the button the finger just
     left (no stop-start stutter), and the finger is still recognised when it
     reaches the other button — the player never has to lift and re-press.
  3. **No stick.** Once the finger is on ▶, Vanguard never keeps moving
     left (and vice versa), regardless of which button received the original
     touch.
  4. **Slide off / release.** Lifting the finger stops movement (F1 AC3).
     Sliding the finger off the movement controls in any other direction
     (outward, up, down, or onto the playfield) stops movement as if released;
     sliding back onto ◀ or ▶ without lifting resumes movement in that
     button's direction. A finger that first touches down in the gap causes
     no movement until it reaches ◀ or ▶.
  5. **Other controls unaffected.** A touch that began on THROW or PAUSE
     never moves Vanguard, even if it slides onto ◀/▶. A second finger
     tapping THROW during a slide (M3.6) does not interrupt the slide; a
     second finger holding the other movement button gives opposing cancel
     (M3.4).
  6. **Same in both layouts** ("Swap controls", M3.13) and both landscape
     directions.
  Test: on the emulator, 20 scripted continuous swipes ◀→▶ and 20 ▶→◀ at
  a realistic thumb speed (e.g. 150-300 ms per crossing), with Vanguard's x
  position recorded per frame → in 40/40 swipes direction switches within
  ≤ 100 ms of entering the new button, 0 frames of zero velocity during the
  gap crossing, and 0 frames moving the old direction after entering the new
  button; plus a manual check of rules 4-5.
  *How* this is achieved (e.g. continuous per-frame hit-testing of the live
  touch position vs. per-button events) is **not** decided here — it is
  owned by mobile-solution-architect and must be recorded in
  `docs/mobile/architecture/mobile-architecture.md` (or an ADR), which the
  UX round-1 re-review checks against M3.3a.

  **Amended 2026-09-25 (v1.4, owner decision OQ-S1a).** The hero is named
  "ShieldMan". In M3.3 and in M3.3a rules 1-5 and its test, every
  "Vanguard" reads **"ShieldMan"** (e.g. "Holding ◀ moves ShieldMan left";
  "ShieldMan's x position recorded per frame"). No behavior, threshold or
  test count changes.
- **M3.4 Opposing cancel.** Holding ◀ and ▶ at once results in no movement
  (F1 AC5).
- **M3.5 Throw.** Tapping THROW throws a shield (F2 AC1). While a shield is in
  flight, tapping does nothing and queues nothing (F16 AC3), and the THROW
  button shows a visible "not ready" state (dimmed **and** a shape/icon change —
  not color alone, NFR-9) until the shield leaves play.
- **M3.6 Multi-touch and latency.** Holding a movement button while tapping
  THROW works every time (at least 2 simultaneous touches). Touch-down to
  visible movement or shield spawn is ≤ 100 ms (NFR-3), measured by an
  instrumented test (touch event timestamp → first frame showing the change).
  No perceptible added lag when level 10's full formation plus boss lasers are
  on screen (`play-store-research.md` pattern 3, "fire button lags").
- **M3.7 No stray gestures.** Touching or dragging on the controls never
  scrolls, zooms, selects text, shows a copy/paste menu, or triggers a
  long-press vibration/menu. Double-tap never zooms.
- **M3.8 Menus are tappable.** Every menu option (title Start/Help/Settings,
  pause Resume/Restart Level/Restart Game/Quit, Restart Game Confirm/Cancel,
  Game Over options) is a ≥ 48 dp tap target and activates on tap; the pause
  menu's selection highlight (F6 AC10) is shown on the tapped option.
- **M3.9 Visibility.** ◀ ▶ THROW are shown only during active play, the F18
  level intro (visible but inert, matching the F18 freeze), and the F12 boss
  warning (active, F12 AC11). They are hidden on title, pause, Game Over and
  Game Complete screens.
- **M3.10 Hardware keyboard / gamepad.** If a hardware keyboard is attached
  (e.g. Chromebook), the web keyboard controls still work because they are
  shared code; this is not release-gated. Gamepads remain out of scope.
- **M3.11 Accessibility labels.** Each control has a spoken label for
  TalkBack (Android's screen reader) — "Move left", "Move right", "Throw
  shield", "Pause" — so Play's pre-launch accessibility report shows no
  missing-label warnings. (Full screen-reader playability is not a goal.)
- **M3.12 Website unaffected.** *(PM default, pending OQ-M10.)* Touch controls
  appear **only** in the Android app. The website is unchanged (keyboard only,
  NFR-5) — on a desktop browser no touch buttons, safe-area padding, or help
  overlay appear, and the web UX/test gates still pass.
- **M3.13 Left-handed option (settings).** A setting "Swap controls" mirrors
  the layout (movement on the right, THROW on the left). *(P1)*

### M4 — Pause, resume, and app lifecycle
Traces to: UC2, UC-M1, F6 AC1-AC3/AC7, F18 AC6, F19 AC6; goal P2;
`listing-draft.md` §3 "never lost mid-level" claim; OQ-M9. **P0.**

- **M4.1 Auto-pause on leaving.** If the app loses the foreground during
  active play, the level intro, or the boss warning — Home, Recents/app
  switch, screen off/lock, an incoming call screen, pulling down the
  notification shade, a system dialog — the game is paused exactly as if
  PAUSE had been pressed (F6 AC1), and the pause menu is showing when the
  player returns.
- **M4.2 No time passes while away.** After returning from any duration in
  the background (tested at 5 s and 10 min), enemy positions, remaining
  enemies, lasers, the shield in flight, power-up timers (F6 AC7), the intro
  timer (F18 AC6), boss-warning timer and score are exactly as when the app
  was left. The game loop must not "catch up" simulated time on return.
- **M4.3 Explicit resume.** Returning to the app **never** auto-resumes play;
  the player must tap Resume (F6 AC3). (Hands are not on the controls when
  the app reopens.)
- **M4.4 Non-play screens.** Leaving and returning on the title, Game Over,
  or pause screens returns to the same screen. Leaving during Game Complete
  holds the celebration (as with F19 AC9's hold) — it does not auto-return to
  the title while the player is away.
- **M4.5 Screen stays awake during play.** The screen does not dim or lock
  from inactivity during active play, the intro, or the boss phase. On title,
  pause, and end screens the phone's normal screen timeout applies.
- **M4.6 Process death (Android closes the app in the background to save
  memory).** *(PM default, pending OQ-M9.)* The in-progress run is **not**
  saved; the app reopens on the title screen, with best score and settings
  intact (M7). No crash, blank screen, or corrupted state results.
- **M4.7 No audio concerns.** The game has no sound (PRD Q6), so it never
  interrupts or ducks the player's music or calls. If sound is ever added,
  audio-focus requirements must be added here first.

### M5 — Android back button / back gesture
Traces to: F6 AC1/AC3/AC8/AC11, F19 AC9 (Esc exemption), UC2. **P0.**

"Back" means the back gesture (swipe in from the left or right screen edge)
or the on-screen/hardware back button — both behave identically.

| Where the player is | Back does | Traces to |
|---|---|---|
| Active play, F18 level intro, F12 boss warning | Pause (opens pause menu) | F6 AC1; protects against accidental edge swipes |
| Pause menu | Resume (same as tapping Resume / pressing Esc again) | F6 AC3 |
| Restart Game confirmation prompt | Cancel the prompt, return to pause menu (no reset) | F6 AC11 |
| Help overlay / Settings screen | Close it, return to where it was opened | M7, M8 |
| Game Over screen | Go to title screen | F8 AC4/AC7 |
| Game Complete celebration | Silent no-op (celebration still auto-returns after 5 s) | F19 AC9 Esc exemption, by continuation |
| Title screen | Leave the app (Android's normal behavior at an app's root) | Android convention |
| "Rotate your device" pause (M2.10) | Leave the app | Android convention |
| Privacy policy overlay *(row added 2026-09-25, v1.2)* | Close it, return to where it was opened (Settings or title); never leaves the app | M11.4a; `docs/mobile/security/review-v1.md` H1 |

*Amended 2026-09-25 (security review v1, H1):* the "Privacy policy overlay"
row above was added for M11.4a. M5.1 (both navigation modes) and M5.2 apply
to it like every other row.

*Amended 2026-09-27 (v1.5):* the "Rotate your device" pause row also covers
the M2.10a "Make the window larger to play" prompt. Back leaves the app,
and a paused run stays paused in the background.

- **M5.1** Each row above is verified on the emulator using both
  gesture navigation and 3-button navigation.
- **M5.2** Back is never swallowed silently except in the Game Complete row;
  it never exits the app directly from active play (an accidental swipe must
  cost at most a pause).
- **M5.3** Works with Android's **predictive back** system (Android 13+/16
  shows a preview of where back goes; apps targeting API 36 get it by
  default): no crash, no double-handling, and the actions above still occur.
  (Architect: handle via the Capacitor App plugin back listener / an
  `OnBackPressedCallback`, not the deprecated `onBackPressed`.)

### M6 — Quit on Android
Traces to: F6 AC6/AC9. **P0.**

- **M6.1** Pause → Quit ends the run and closes the app (it leaves the
  screen and the next launch starts on the title screen). The web-only text
  "Run ended — you may now close this tab." is never shown on Android.
- **M6.2** The title screen offers the same Quit action (closes the app).
- **M6.3** Quit does not need a confirmation prompt (it behaves the same as
  on the web, where Quit is unconfirmed); the best score is saved first (M7.2).

### M7 — Saved best score and settings (on-device)
Traces to: F10 (score), segment C "screenshot a high score", UC-M2; OQ-M8.
**P1** (best score pending OQ-M8; settings are touch-input settings and
therefore Android-only per §0 rule 2).
*Amended 2026-09-25 (v3 F20):* OQ-M8 (a) is decided and the shared
amendment exists — M7.1/M7.2 now implement `docs/PRD-addendum-v3.md` **F20**
(shared rule, one implementation in `src/`, F20 AC15) and are no longer
"pending". Traces to: F20 AC1-AC15.

- **M7.1 Best score** *(PM default, pending OQ-M8 — requires a shared PRD
  amendment, see OQ-M8)*: the title screen and the Game Over / Game Complete
  screens show "Best: N", the highest final score of any run on this device.
  A new best is marked "New best!" on the end screen.

  **Amended 2026-09-25 (v3 F20).** The "pending OQ-M8" label above is
  replaced by: *implements `docs/PRD-addendum-v3.md` F20 AC1-AC3, AC13-AC14.*
  "New best!" wording adopted from F20 AC3: if the run's final score is
  **strictly greater** than the best saved before the run ended, the end
  screen shows "New best!" and "Best: N" shows the new value (equal to the
  final score). If the final score is equal to or lower than the previous
  best, no marker is shown and Best is unchanged. A final score of 0 never
  shows the marker. On a first launch with no saved value the title shows
  "Best: 0". Best is not shown in the in-play HUD (F20 AC14).
- **M7.2** The best score is updated when a run ends by Game Over, Game
  Complete, Restart Game, or Quit, and also whenever the app goes to the
  background with a current score higher than the saved best (so process
  death, M4.6, cannot lose a new best).

  **Amended 2026-09-25 (v3 F20).** Aligned to F20 AC4-AC5, AC8: after each
  save event the saved best = max(previous best, current score), and no
  event ever lowers it. "Restart Game" means Restart Game **confirmed**
  (F6 AC11), saved before the score resets; cancelling saves nothing. Game
  Complete saves when the sequence begins; Quit saves before the app closes
  (M6.3). The "app goes to the background" trigger is Android's counterpart
  of F20 AC4(e) ("page hidden"). **Restart Level** triggers no save by
  itself and keeps the run's score under current behavior — this is subject
  to owner question **Q-v3-1** (`docs/PRD-addendum-v3.md`), which is still
  **pending**; if the owner changes Restart Level scoring, the change is
  made in the shared PRD and mirrored here with a dated note.

  **Amended 2026-09-25 (v1.3, owner decision Q-v3-1 (b)).** Restart Level
  now **resets the run's score to the value it had when that level started**
  (the points earned in the abandoned attempt are discarded). The rule is
  shared and is specified in `docs/PRD-addendum-v4.md` (amending `docs/PRD.md`
  F6 AC4 / F10 AC4); it is implemented once in `src/`, with no Android-only
  code. On Android, testable as: (1) note the score shown at the level-N
  countdown; score some points; pause (⏸ or back gesture, M5) → Restart
  Level; the HUD score equals the noted value. (2) Restart Level still
  triggers no save by itself and never lowers the saved best (F20 AC5/AC8).
  (3) Repeating Restart Level any number of times never raises the score
  above the level-start value. Where this block and addendum v4 differ,
  addendum v4 wins and this block is corrected with a dated note.
- **M7.3 Settings saved:** "Swap controls" (M3.13) and "first-launch help
  already seen" (M8.1).
- **M7.4 Persistence.** Best score and settings survive: closing the app,
  process death, device reboot, and an app update installed from Play (tested
  by installing build N, setting values, then installing build N+1 over it).
  They are erased only by uninstall or Android "Clear storage" — after which
  the app behaves like a first launch with no error.

  **Amended 2026-09-25 (v1.3, owner decision OQ-A1 (a)).** If any of the
  five saved-data emulator checks in
  `docs/mobile/architecture/adr/0006-on-device-persistence.md` Part 2 fails
  with the shared localStorage implementation, mobile-junior-developer may
  add the official **`@capacitor/preferences`** plugin as an **Android-only
  storage adapter** without a further owner decision. Conditions: (a) it is
  used only if a check fails, and the failing check is recorded in the
  step-7/8 review docs; (b) the "Best: N" and settings rules stay written
  once in `src/` (only where the value is stored differs); (c) data never
  leaves the device, so M7.6 / M11.3 and the Data safety answer are
  unchanged; (d) the website keeps localStorage; (e) all five checks pass
  after the switch; (f) security pass 2 re-checks the plugin against the
  allowlist. If all five checks pass with localStorage, no plugin is added.
- **M7.5 Corrupt data.** If stored values are missing or malformed, the app
  falls back to defaults (best = 0, no swap, help not seen) and does not
  crash — same fail-closed rule the security review applied to the existing
  instrumentation storage.
- **M7.6** Nothing stored leaves the device (M11.3). No cloud save, no
  Google Play Games sign-in.

### M8 — First-launch help and control hints
Traces to: F9 AC2/AC3, UC1, goal P1, MG4. **P0.**

- **M8.1** On the very first launch, after tapping Start and before the
  level-1 countdown, a one-screen help overlay shows the actual on-screen
  controls with labels: "◀ ▶ Move · THROW (one shield at a time — catch it
  on the rebound for +1 life) · ⏸ Pause". One tap on "Got it" dismisses it
  and starts the level-1 intro (F18). It does not appear again automatically.
- **M8.2** The help overlay can be reopened any time from a "How to play"
  button on the title screen. It is **not** added to the pause menu, so F6
  AC2's four pause options stay exactly as specified. The title screen also
  has a "Settings" button (M7.3).
- **M8.3** F9 AC2 on Android: the one-line control text during play uses
  touch wording (e.g. "◀ ▶ move · THROW · ⏸ pause"), is legible per M2.6, and
  follows F9 AC2's show-until-first-throw-then-fade rule. It never overlaps
  the controls.
- **M8.4** A first-time tester can make their first throw within 10 s of the
  level-1 countdown ending without outside help (P1, MG4) *(closed test)*.

### M9 — App name, icon, and splash screen
Traces to: UC6; F9 AC4 / NFR-10 (original art); `play-store-research.md` §3
(name), §4 (IP). **P0.**

- **M9.1** Store title: "Vanguard vs. Sentinels" (22 chars, `listing-draft.md`
  §1). The launcher label under the icon is "Vanguard vs. Sentinels" (Android
  may wrap it to two lines); it is never shortened to "Vanguard" alone
  (collides with The Vanguard Group finance apps).

  **Amended 2026-09-25 (v1.3, owner decision OQ-S1 (b)).** Store title:
  **"Shield vs Robots"** (16 characters, within Play's 30-character limit).
  The launcher label under the icon (Android `app_name`) is exactly
  "Shield vs Robots" and fits on one line on the 640 × 360 dp reference
  phone's default launcher, or wraps without truncation. The label is never
  "Vanguard" alone and contains no "Sentinel(s)". The in-game title screen
  shows the same name, per the shared rule in `docs/PRD-addendum-v4.md`.
  Test: install the debug build → launcher label reads "Shield vs Robots";
  a search of the Android resources, bundled web assets and listing text for
  "Sentinel" returns no player-visible hit.

  **Amended 2026-09-25 (v1.4, owner decision OQ-S1a).** The hero is named
  **"ShieldMan"**. Store title and launcher label stay exactly "Shield vs
  Robots" (the label is never "ShieldMan" alone and never adds the hero's
  name). The v1.3 rule "never 'Vanguard' alone" is superseded as moot: no
  player-visible text names "Vanguard" any more. Wherever the app shows the
  hero's name, it is spelled exactly "ShieldMan" (one word, capital S and M),
  per the shared hero-name AC in the shared PRD (website product-manager).
  Test: a search of the Android resources, bundled web assets and listing
  text for "Vanguard" returns no player-visible hit; every player-visible
  hero name reads "ShieldMan".
- **M9.2** The app icon is an **adaptive icon** (Android's icon format with
  separate foreground and background layers so launchers can crop it into
  circles, squircles, etc.) plus a **monochrome layer** for Android 13+
  themed icons. The subject stays fully visible under every launcher mask and
  is recognizable at 48 dp.
- **M9.3** The icon and splash art are original and obey F9 AC4 / NFR-10: no
  red-white-blue star or concentric-ring shield, no licensed likeness; the
  shield is the plain avatar-blue circle (F14).
- **M9.4** The splash screen uses Android 12+'s standard splash (icon on a
  solid background matching the game background `#05050a`). From tapping the
  icon to the title screen there is no white flash and no blank screen longer
  than 500 ms between the splash and the first rendered game frame.
- **M9.5** The 512 × 512 store icon and the 1024 × 500 feature graphic
  (required by Play) are produced from the same artwork (spec owned by
  mobile-ui-ux-designer in `docs/mobile/ux/store-assets-spec.md`).
- **M9.6 Marvel-avoidance constraints** *(added 2026-09-25, v1.3 — the
  OQ-S1 (a) constraints are kept as binding criteria even though the owner
  chose to rename)*. In the app, icon, splash, store assets, screenshots and
  listing text:
  1. The word "Shield" is never styled like Marvel's S.H.I.E.L.D.: no
     periods or dots between letters, no acronym treatment implying an
     agency, no eagle emblem, no agency/badge-style logotype.
  2. No red/white/blue shield, no star on or around the shield, no
     concentric-ring shield (the shield stays the plain avatar-blue circle,
     M9.3 / F14); no red/white/blue colour scheme or star motifs in the
     listing graphics.
  3. No X-Men imagery or iconography: no "X" emblem, no "mutant" wording,
     and enemy art is never a giant purple/magenta humanoid robot.
  4. mobile-ui-ux-designer checks 1-3 in round 2; mobile-security-compliance-
     reviewer verifies them in pass 2 (review-v2). Any hit is a FAIL.

  **Amended 2026-09-25 (v1.4, owner decision OQ-S1a) — "ShieldMan"
  constraints.** Because a shield-throwing "ShieldMan" sits close to Archie
  Comics' "The Shield" and to Captain America, the following are added to
  1-3 and checked the same way (item 4):
  5. The hero is always "ShieldMan" — never "The Shield", "Shield Man" as two
     words, "Captain …", or any rank/patriotic title.
  6. ShieldMan's art never shows a shield-shaped chest emblem, a
     stars-and-stripes or red/white/blue costume, a winged or "A"-marked
     helmet, or a star on the shield (the shield stays the plain avatar-blue
     circle, M9.3 / F14).
  7. The "ShieldMan" wordmark (if any) is not styled after any existing comic
     logotype.
  8. Before step 15, `docs/mobile/market/play-store-research.md` records a
     name and trademark check on "ShieldMan" (and the pairing with "Shield vs
     Robots") by mobile-marketing-analyst. If it finds a conflict, the PM
     raises it with the owner (Job 0) before any upload; the release engineer
     does not upload until this check is recorded.

### M10 — Performance and stability on low-end devices
Traces to: NFR-1, NFR-2, NFR-3; F12 AC5, F15 AC9, F19 (NFR notes v2);
`play-store-research.md` §1 pattern 4 (crashes); MG1-MG3. **P0.**

Reference profiles (lead tester pins exact emulator images/devices in
`docs/mobile/tests/device-matrix.md`):
- **Low-end:** 2 GB RAM, 4 slow cores, 720p-class screen (640 × 360 dp
  landscape), Android 10-12, e.g. a Galaxy A0x / Moto E-class phone; emulated
  as an AVD with 2 GB RAM, 2 vCPUs.
- **Mid-range:** 4-6 GB RAM, 1080p-class screen, Android 14-16.

- **M10.1 Frame rate.** On the low-end profile, level 10 with its full
  54-enemy formation, max enemy fire, a bouncing shield with trail, a falling
  power-up, and later the 5× boss sustains ≥ 30 FPS with no single freeze
  > 250 ms over a full level; on mid-range, ≥ 55 FPS average. (NFR-2 floor on
  phone hardware.)
- **M10.2 Game speed is frame-rate independent.** On a 90/120 Hz phone and
  on a device dropping to 30 FPS, the game plays at the same real-time speed
  (the fixed-timestep loop, ADR-0002, is preserved; no double-speed on high
  refresh screens).
- **M10.3 Cold start.** Tap icon → interactive title screen ≤ 5 s on
  low-end, ≤ 3 s on mid-range (Android vitals flags ≥ 5 s cold starts).
- **M10.4 Endurance.** A 15-minute continuous session (a full 10-level run
  plus restarts) on the low-end profile completes with no crash, no ANR, and
  no steady frame-rate decline (no memory leak).
- **M10.5 Size.** The download size reported by Play Console for the AAB
  (Android App Bundle — the file format uploaded to Google Play, from which
  Play builds a per-device install) is ≤ 15 MB.
- **M10.6 Background cost.** While in the background the app runs no game
  loop and holds no wake lock.
- **M10.7 Play pre-launch report** (Google's automatic test run on real
  devices after upload) shows zero crashes and zero ANRs. *(closed test)*

### M11 — Offline, permissions, privacy, and Play policy
Traces to: NFR-6, NFR-7, NFR-8, F9 AC4/NFR-10; `play-store-research.md` §2
(price model); OQ-M1, OQ-M13. **P0.**

- **M11.1 Offline.** With airplane mode on from install onward, the app
  launches and a full run can be played; the app makes **no** network
  requests at any time (verified by network inspection during a full run).
- **M11.2 Permissions.** The app requests no runtime ("dangerous")
  permissions and the installed manifest contains no permission beyond what
  the security reviewer approves (the default `INTERNET` permission should be
  removed if nothing needs it — solution-architect / security reviewer
  decide).
- **M11.3 No data collection.** The existing instrumentation counters
  (NFR-8), best score and settings stay on the device and are never
  transmitted. The Play **Data safety** form (a required Play Console
  questionnaire that becomes the "Data safety" section on the store page)
  is answered "No data collected, no data shared," and the security reviewer
  confirms that answer against the final app (step 12).
- **M11.4 Privacy policy.** A privacy policy page (Play requires one) is
  published at the website's `public/privacy.html`
  (https://hogy86.github.io/ahogancamp_portfolio/privacy.html once deployed —
  technical writer confirms the final URL) stating that the app collects and
  shares no data, and is linked in the Play listing.

  **Amended 2026-09-25 (security review v1, H1) — M11.4a In-app privacy
  policy. P0.** Google Play's User Data policy requires the privacy policy to
  be available **inside the app** as well as in the Play Console field, even
  for an app that collects no data. Acceptance:
  1. A "Privacy policy" item is reachable from the title screen in **≤ 2
     taps** (e.g. title → Settings → Privacy policy). It is not reachable
     during a run (not from the pause menu), so opening it never interrupts
     or reloads a game in progress; F6 AC2's four pause options are
     unchanged.
  2. It shows the **same text as the hosted policy** (M11.4). The app shows a
     copy bundled with the app; security pass 2 (step 12) checks that the
     bundled copy matches the text at the hosted URL. Until
     mobile-technical-writer delivers the final `public/privacy.html` (step
     13), a placeholder is acceptable for steps 7-11 only.
  3. It works in **airplane mode** from install onward; opening it makes
     **no network request** (M11.1) and does not open an external browser or
     another app. It adds no permission (M11.2) and no Capacitor plugin
     beyond the approved list. *How* it is shown (e.g. an overlay inside the
     game's WebView) is owned by mobile-solution-architect.
  4. **Back** (gesture or button) or a visible Close control returns to where
     it was opened (M5 table), in both gesture and 3-button navigation.
  5. The text is legible per M2.6 and M2.11 (≥ 12 sp; no clipping at the
     largest system font size) and scrolls if longer than the screen; the
     menu item and the Close control are ≥ 48 dp tap targets (M3.8).
  Test: on the emulator with airplane mode on, from a cold start reach the
  Privacy policy in ≤ 2 taps → the text shown matches `public/privacy.html`;
  network inspection shows 0 requests; back returns to the screen it was
  opened from. mobile-ui-ux-designer confirms placement at round 2.
- **M11.5 Monetization.** *(PM default, pending OQ-M1.)* **Free, no ads, no
  in-app purchases.** No ad SDK, billing library, analytics SDK or Firebase is
  included. Play Console "Contains ads" = No.
- **M11.6 Content rating and audience.** *(PM default, pending OQ-M13.)* The
  IARC content-rating questionnaire (Play's required age-rating survey) is
  answered truthfully: cartoon/fantasy violence against robots, no blood, no
  user interaction, no purchases. Target audience declared as **13 and
  over** (keeps the app out of Google's Families program requirements).
- **M11.7 No licensed IP anywhere** in the app, icon, screenshots, or listing
  (F9 AC4 / NFR-10; `play-store-research.md` §4).

### M12 — Store listing (requirements on the draft)
Traces to: `listing-draft.md`; `play-store-research.md` §2-§4; OQ-M1, OQ-M3,
OQ-M9. **P1.**

- **M12.1** Title, short description and keywords as in `listing-draft.md`
  §1, §2, §4, subject to OQ-M1 ("free, no ads" claims are only true if OQ-M1
  confirms free/no ads/no IAP).

  **Amended 2026-09-25 (v1.3, OQ-S1 (b)).** The title is "Shield vs Robots"
  (M9.1), not the `listing-draft.md` §1 title. Short description, full
  description and keywords contain no "Sentinel(s)" and refer to the
  enemies as "robots". mobile-marketing-analyst updates `listing-draft.md`
  and re-runs the Play name/IP check (`play-store-research.md` §3-§4) for
  the new title before step 15.

  **Amended 2026-09-25 (v1.4, OQ-S1a).** Wherever the short description,
  full description or keywords name the hero, the name is "ShieldMan"; no
  listing text contains "Vanguard". mobile-marketing-analyst updates
  `listing-draft.md` and records the "ShieldMan" name/trademark check in
  `play-store-research.md` §3-§4 before step 15 (M9.6 item 8).
- **M12.2 Copy correction (required).** The draft's "pick up exactly where
  you left off if you need to pause and step away — your progress is never
  lost mid-level" overpromises: under M4.6 a run is lost if Android closes
  the app in the background. Replace with wording that is true, e.g. "Leave
  the app mid-level and it pauses automatically — tap Resume and carry on."
  *(unless OQ-M9 chooses full run save)*. Also "No install beyond the app
  itself" → "No account, no login."
- **M12.3 Disclaimer.** *(PM default, pending OQ-M3.)* Keep only the
  positive sentence "Vanguard and the Sentinel robots are original characters
  created for this game." Remove the "not affiliated with … any comic book
  publisher, film studio …" sentence.

  **Amended 2026-09-25 (v1.3, OQ-S1 (b)).** Following the rename, the kept
  sentence reads: "Vanguard and the robots are original characters created
  for this game." OQ-M3 (b)'s intent (a positive originality line, no
  "not affiliated with …" sentence) is unchanged.

  **Amended 2026-09-25 (v1.4, OQ-S1a).** The kept sentence now reads:
  "ShieldMan and the robots are original characters created for this game."
- **M12.4 Screenshots** follow `listing-draft.md` §5's storyline, are
  captured from the real Android build (not the website, not mock-ups), show
  the touch controls, and depict only features that exist. At least 2 phone
  screenshots (Play minimum); tablet screenshots optional (per OQ-M7).
- **M12.5** Play Console category: Game → Arcade. Contact email: owner's
  choice (OQ-M11).
- **M12.6 Listing name and art constraints** *(added 2026-09-25, v1.3)*.
  Every listing element (title, descriptions, icon, feature graphic,
  screenshots) uses "Shield vs Robots" / "robots" and meets M9.6.
  Screenshots are captured from a build that already contains the
  `docs/PRD-addendum-v4.md` rename, so no "Sentinel" text appears in them.

  **Amended 2026-09-25 (v1.4, OQ-S1a).** Listing elements that name the hero
  use "ShieldMan" and meet M9.6 items 5-7; screenshots are captured from a
  build that already contains the hero rename, so no "Vanguard" text appears
  in them.

---

## 5. Release gates specific to this addendum

(Pipeline order and gate rules are in `.claude/CLAUDE.md` §Mobile Pipeline;
listed here only for traceability.)
- UAT (step 14) exercises every P0/P1 AC above on the emulator per
  `docs/mobile/tests/uat-plan.md`; `(device/closed test)` ACs are verified in
  step 16.
- Closed test (step 16): ≥ 12 opted-in testers for 14 continuous days, the
  checklist from `device-matrix.md`, MG1-MG6 evaluated in
  `docs/mobile/tests/closed-test-results.md`.
- Production (step 17) only on the owner's explicit "go."

---

## 6. Out of scope (mobile v1)

- Any change to game rules, levels, balance, or art beyond what §3 maps (all
  such changes go through the shared PRD per §0).
- Ads of any kind, in-app purchases, subscriptions, paid download (pending
  OQ-M1).
- Portrait gameplay (pending OQ-M4).
- Sound, music, and haptics/vibration (PRD Q6 — still optional for both
  platforms; haptics would need a shared decision).
- Online leaderboards, Google Play Games achievements/sign-in, cloud save.
- Saving an in-progress run across process death (pending OQ-M9).
- Gamepad support; release-gated hardware-keyboard support.
- iOS / App Store.
- Touch controls on the website (pending OQ-M10).
- Full TalkBack (screen-reader) playability.
- Localization — English only for v1.
- In-app update prompts, in-app review prompts, push notifications.

---

## 7. Pending Owner Decisions (Job 0)

> **Owner decision log — 2026-09-25.** The owner (Aaron) accepted the PM
> recommendation for every question raised so far ("all recommended"):
> OQ-M1 (a), OQ-M2 (a), OQ-M3 (b), OQ-M4 (a), OQ-M5 (a), OQ-M6 (a),
> OQ-M7 (a), OQ-M8 (a), OQ-M9 (a), OQ-M10 (a). The defaults already written
> into the acceptance criteria therefore stand as decided. OQ-M8 (a) still
> requires the shared PRD amendment (docs/PRD-addendum-v3.md) before M7.1/M7.2
> are implemented. OQ-M11..OQ-M14 remain pending (needed before steps 12/15).
>
> **Added 2026-09-25 (v1.2).** Three further questions are now with the
> owner and are **not decided** here: **OQ-S1** (the "Sentinels" name,
> security review v1 finding M5), **OQ-A1** (pre-approve an Android-only
> storage-plugin contingency, M-ADR-0006 Part 2), and **Q-v3-1** (Restart
> Level score, `docs/PRD-addendum-v3.md`, still pending). See the entries at
> the end of this section.
>
> **Owner decision log — 2026-09-25 (v1.3).** The owner answered, in his
> words: *"Run all recommendations except for the name change - suggest changing it to 'shield vs robots'."* Therefore: **Q-v3-1 = (b)** (recommended),
> **OQ-A1 = (a)** (recommended), **OQ-S1 = (b)** (not the PM recommendation;
> owner chose to rename, new name "Shield vs Robots"). OQ-M11..OQ-M14
> remain pending; only OQ-M11's option (a) app ID text is updated to match
> the new name.
>
> **Owner decision log — 2026-09-25 (v1.4).** Right after the OQ-S1
> decision the owner instructed: *'change Vanguard name to "ShieldMan"'* (2026-09-25, given right after the "Shield vs Robots" decision).
> Recorded as **OQ-S1a = rename the hero to "ShieldMan"** (see entry after
> OQ-S1). OQ-M11..OQ-M14 remain pending.
>
> **Note — 2026-09-27 (v1.5).** M2.10a (too-small window, any shape) was
> decided by the PM as a clarification within OQ-M7 (a) and the existing
> M2.10 pattern. It is **not** an owner question: it adds no scope, cost or
> risk and changes no game rule. It would become an owner question only if
> someone proposed a new small-window or band layout instead. OQ-M11..OQ-M14
> remain pending.
>
> **Note — 2026-09-28 (v1.6).** M2.3b (the playfield may extend under the
> top and bottom system-gesture bands; text and controls may not) was
> decided by the PM to resolve `docs/mobile/reviews/code-review-round8.md`
> E1. It is **not** an owner question: it adds no feature, cost or scope,
> changes no game rule, keeps every touch-target and text rule, and keeps
> OQ-M7 (a) (no new layout). Alternatives considered and rejected: lowering
> the 0.5× floor to about 0.48× (weakens M2.13/M2.7 art legibility, which the
> UX gate set) and shrinking ◀ ▶ THROW toward 48 dp (breaks M3.1's 56 dp
> minimum on this profile). The remaining width limit (a side cutout, or
> back-gesture sensitivity above default, on a 640 dp wide phone) is
> recorded in M2.3b. It becomes an owner question only if closed-test
> testers actually hit it; the options would then be an Android
> back-gesture exclusion area over the controls or a smaller-control layout.
> OQ-M11..OQ-M14 remain pending.

Each item: the issue, which doc/subagent it affects, options with
consequences, the PM recommendation, and the **default already applied** in
this draft. Items marked **[before step 3/4]** block design or architecture
work if changed later; **[before step 15]** must be answered before the first
upload.

### OQ-M1 — v1 monetization [before step 4] (flagged by marketing analyst)
**DECIDED 2026-09-25: owner accepted the recommendation.**
Affects: M11.5, M12.1, solution-architect (SDKs), security reviewer (Data
safety), release engineer.
- **(a) Free, no ads, no in-app purchases** — no ad/billing code; simplest
  Play review; "no ads" becomes a selling point. No revenue.
- (b) Free with opt-in rewarded ads (watch an ad for a bonus) — some revenue
  only at scale; adds an ad SDK, Data safety disclosures, ad-ID permission,
  Families/ads policy review; weeks more work.
- (c) Paid ($0.99-$2.99) — every comparable is free, so installs likely near
  zero, and the closed test needs 12 testers to own it; also requires a
  Payments profile and public business address.
- **Recommendation: (a)** — every competitor loses ratings to ads, a small
  first release would earn almost nothing from them, and it keeps the
  privacy/policy surface at zero. **Default applied: (a).** Revisit rewarded
  ads for a later version once install numbers exist.

### OQ-M2 — How much design/architecture effort to spend on touch targets and HUD safe-area fitting [before step 3] (flagged by marketing analyst)
**DECIDED 2026-09-25: owner accepted the recommendation.**
Affects: M2, M3, mobile-ui-ux-designer round 1, lead tester device matrix.
- **(a) First-class** — concrete size/placement ACs (M2.3-M2.7, M3.1-M3.2),
  UX gate checks screenshots on the smallest phone, a notched phone, a
  tablet and a foldable; device matrix covers all four. ~1-2 extra
  design/test rounds.
- (b) Standard — rely on Capacitor defaults plus one phone emulator; faster,
  but this is exactly where competitors get "score cut off / pause button
  too small" reviews, and Android 15+ edge-to-edge makes cutout overlap
  likely without explicit work.
- (c) Minimal — ship at desktop layout scaled down; HUD text ≈ 9 dp on small
  phones — below legible size.
- **Recommendation: (a)** — this is the #2 complaint category in the genre
  and the fixed 800×600 layout guarantees problems if left to defaults.
  **Default applied: (a).**

### OQ-M3 — Keep the "not affiliated with any comic publisher / film studio" disclaimer in the store description? [before step 3] (flagged by marketing analyst)
**DECIDED 2026-09-25: owner accepted the recommendation.**
Affects: M12.3, store listing, security/compliance reviewer.
- (a) Keep the full disclaimer as drafted — reassures some readers, but a
  disclaimer gives no legal protection and actively invites the comparison
  the re-theme was meant to avoid.
- **(b) Keep only "Vanguard and the Sentinel robots are original characters
  created for this game."** — states originality positively without pointing
  at anyone else.
- (c) Remove both sentences — cleanest, but loses a cheap trust line.
- **Recommendation: (b)** — it affirms originality without naming (even
  generically) the franchise category the product is trying not to evoke.
  **Default applied: (b).**
  *Note 2026-09-25 (v1.3):* decision (b) is unchanged; its sentence now
  reads "Vanguard and the robots are original characters created for this
  game" because of OQ-S1 (b) (see M12.3).
  *Note 2026-09-25 (v1.4):* it now reads "ShieldMan and the robots are
  original characters created for this game" because of OQ-S1a (see M12.3).

### OQ-M4 — Screen orientation [before step 3]
**DECIDED 2026-09-25: owner accepted the recommendation.**
Affects: M2.1, all layout work, store screenshots.
- **(a) Landscape only** — matches the existing 800×600 playfield; side
  columns hold the controls; no rule changes.
- (b) Portrait only — a tall playfield is a different game shape (formation
  width, step-down distance, timing), i.e. a shared-rules change that must
  pass both web and mobile gates; weeks of rework and rebalancing.
- (c) Both — the cost of (b) plus switching logic; doubles layout testing.
- **Recommendation: (a)** — zero game-rule change and the natural fit for
  the existing design. **Default applied: (a).**

### OQ-M5 — Touch control scheme [before step 3]
**DECIDED 2026-09-25: owner accepted the recommendation.**
Affects: M3, mobile-ui-ux-designer, junior developer.
- **(a) On-screen buttons: ◀ ▶ (left thumb), THROW (right thumb), PAUSE** —
  maps 1:1 to the tested keyboard rules (constant speed, 3× Speed power-up,
  opposing-key cancel).
- (b) Drag to steer (Vanguard follows the thumb, capped at current speed) +
  tap to throw — can feel more precise for aiming bounces, but "follow the
  finger" subtly changes F1's movement rule and needs a shared-rules
  decision and more tuning.
- (c) Both, with a setting — best player choice, roughly double the design,
  code and test effort.
- **Recommendation: (a)** — lowest risk of changing game behavior between web
  and phone; drag mode can be added later if closed-test feedback asks for
  it. **Default applied: (a).**

### OQ-M6 — Minimum Android version [before step 4]
**DECIDED 2026-09-25: owner accepted the recommendation.**
Affects: M1.1, architect, device matrix.
- **(a) Capacitor default (Android 7.0 / API 24)** — reaches ~99% of active
  devices at no extra cost.
- (b) Android 10 (API 29) — smaller test matrix, drops a few % of older
  budget phones (some of the exact low-end players we target).
- (c) Android 13+ — very small matrix, excludes a meaningful share of
  budget devices.
- **Recommendation: (a)** — widest reach for free; the low-end test profile
  already covers the risky end. **Default applied: (a).**

### OQ-M7 — Tablets, foldables, Chromebooks [before step 3]
**DECIDED 2026-09-25: owner accepted the recommendation.**
Affects: M1.3, M2.8-M2.10, M12.4, device matrix.
- **(a) Allow all; phones are the design target, larger screens must scale
  cleanly (no tablet-specific layout)** — one extra tablet + one foldable in
  the test matrix.
- (b) Phones only (block tablets in Play Console device catalog) — less
  testing, but Android 16 still forces resizable windows on large screens,
  and tablet owners are a natural audience for a landscape game.
- (c) Full tablet optimization (custom layout, tablet screenshots) — more
  design work for a small share of installs.
- **Recommendation: (a)** — landscape scaling makes tablets nearly free, and
  Android 16 requires window-resize handling anyway. **Default applied: (a).**

### OQ-M8 — Saved best score (a shared game change) [before step 4]
**DECIDED 2026-09-25: owner accepted the recommendation.**
Affects: M7.1-M7.2, **`docs/PRD.md` F10 AC6 and §Out of Scope** (score is
session-only), website pipeline (product-manager, gates), both CI paths.
- **(a) Add a local "Best: N" on both website and Android** — one shared PRD
  amendment (a PRD addendum v3 by the website product-manager); both sets of
  gates re-run; small code change; data never leaves the device.
- (b) Android only — cheaper now, but it is not one of the allowed
  platform-specific areas, so it breaks the one-codebase rule and needs your
  explicit exception.
- (c) No saved score on either — no rules change; phone players lose the
  "beat my best" hook segment C asked for.
- **Recommendation: (a)** — it is cheap, serves segment C's stated
  motivation on both platforms, and keeps the one-codebase rule intact.
  **Default applied: (a)**, conditional — M7.1/M7.2 are not implemented until
  the shared PRD amendment exists.

### OQ-M9 — What happens to a run if Android closes the app in the background [before step 4]
**DECIDED 2026-09-25: owner accepted the recommendation.**
Affects: M4.6, M12.2 (store copy), architect.
Plain terms: when you switch away, Android may silently shut the app to free
memory; when you return, it restarts.
- **(a) Run is lost; app reopens on the title screen; best score/settings
  kept** — matches PRD's "no save-and-continue" scope; store copy must be
  softened (M12.2).
- (b) Save a snapshot of the run on backgrounding and restore it — true
  "never lose progress," but it is save-and-continue, a shared-rules scope
  addition, with serialization of all game state; adds real complexity and
  test surface.
- **Recommendation: (a)** — auto-pause covers the common short interruption,
  and (b) is a large feature better judged after the closed test.
  **Default applied: (a)**, with the listing copy corrected.

### OQ-M10 — Should the website also get touch controls? [before step 4]
**DECIDED 2026-09-25: owner accepted the recommendation.**
Affects: M3.12, website PRD NFR-5, website pipeline, CI.
Because touch code will live in the shared `src/`, it could be turned on for
phone browsers too.
- **(a) Android app only for v1** — website stays keyboard-only, no web
  re-scoping.
- (b) Also enable on phone browsers — more players on the website, but
  browsers can't lock orientation or hide the address bar reliably; needs a
  web PRD change, a mobile-browser test matrix and both gates.
- **Recommendation: (a)** — ship the store app first, then decide on the
  web with closed-test learnings in hand. **Default applied: (a).**

### OQ-M11 — Google Play developer account, app ID, and public developer name [before step 15]
Affects: release engineer, M12.5; requires the owner's Google account and a
payment.
- A **Google Play developer account** costs a one-time US$25 and requires
  identity verification. A *personal* account must run the 14-day /
  12-tester closed test before going public; an *organization* account
  needs a D-U-N-S business number but skips that test.
- The **application ID** (e.g. `com.hogancamp.vanguardvssentinels`) is the
  app's permanent identity on Play — it can **never** change after the
  first upload.
- Options: **(a) personal account + `io.github.hogy86.shieldvsrobots`
  (tied to the GitHub Pages domain you already control)** *(ID updated
  2026-09-25, v1.3, per OQ-S1 (b); was `io.github.hogy86.vanguardvssentinels`)*;
  (b) personal account + `com.<your-domain>.shieldvsrobots` if you own a
  domain;
  (c) organization account (needs a registered business).
- **Recommendation: (a)** — no business registration needed, and the ID is
  tied to a domain you already control. **Default applied:** placeholder
  `io.github.hogy86.vanguardvssentinels` → **`io.github.hogy86.shieldvsrobots`**
  *(updated 2026-09-25, v1.3, OQ-S1 (b); nothing has been uploaded, so the
  old ID was never used)* — **must be confirmed before step 15**; also tell us the public developer name and the contact email to
  show on the listing.
  **Status (2026-09-25, v1.3): still PENDING** — the account type, public
  developer name and contact email are undecided, and the app ID is final
  only when the owner confirms it here.

### OQ-M12 — App signing key [before step 15]
Affects: release engineer, security reviewer. Plain terms: every Android
app is digitally signed; if the key is lost, you can never update the app.
- **(a) Play App Signing (Google stores the real signing key; you keep only
  an "upload key" on your PC)** — if the upload key is lost, Google can reset
  it; this is Google's default and required for AAB uploads.
- (b) Manage your own signing key — full control, but losing it means the
  app can never be updated again.
- **Recommendation: (a)** — it is the standard and removes the single
  worst-case failure. **Default applied: (a).** You will need to choose where
  to back up the upload key file and its password (e.g. your password
  manager); nobody but you should hold them.

### OQ-M13 — Target age group and content rating [before step 12]
Affects: M11.6, security reviewer (Play policy), release engineer.
- **(a) Declare "13 and over"** — standard requirements; the app has no ads
  or data collection anyway.
- (b) Include under-13s — puts the app in Google's Families policy (extra
  review, teacher-approved rules, stricter listing); the game would likely
  pass (no ads, no data), but review takes longer and any future ads option
  becomes much harder.
- **Recommendation: (a)** — the listing and art are aimed at teens/adults and
  it keeps future options open. **Default applied: (a).** The IARC rating
  itself is computed by Google from the questionnaire (expected roughly
  "Everyone 10+ / PEGI 7" for fantasy violence against robots).

### OQ-M14 — Where will the 12+ closed-test testers come from? [recruit before step 15; used in step 16]
Affects: step 16 timeline. Plain terms: **closed testing** is a private
Play track where only invited people can install the app; Google requires
12+ testers to stay opted in for 14 continuous days before a new personal
account can publish.
- **(a) A Google Group you create and invite 15-20 friends/family/colleagues
  to** — one link to share; people can be added/removed without touching the
  Play Console list; the 3-8 spare testers cover drop-outs so the 14-day
  clock doesn't restart.
- (b) An email list entered in Play Console — fine for exactly-known
  testers; harder to manage drop-outs.
- (c) Paid tester services — fast but costs money and gives low-quality
  feedback.
- **Recommendation: (a)** — easiest to manage and the buffer protects the
  14-day timeline. **Default applied: (a)**; start recruiting now, since
  testers need an Android phone and a Google account, and anyone who opts
  out resets the risk to the timeline.

### OQ-S1 — "Sentinels" name vs. Marvel's X-Men Sentinels [decision record needed for security re-review 1b; final before step 15] *(added 2026-09-25, v1.2)*
**Status: PENDING — the owner is being asked now. No default applied; M9.1
and the listing are unchanged until the owner answers.**

**DECIDED 2026-09-25 (v1.3): option (b), rename — owner overrode the PM
recommendation (a).** Owner's words: *"Run all recommendations except for the name change - suggest changing it to 'shield vs robots'."* Decision record:
- New product name **"Shield vs Robots"** — store title and Android app
  label (M9.1, M12.1, M12.6).
- The hero keeps the name **"Vanguard"**; the enemies are called
  **"robots"** instead of "Sentinels" everywhere a player can see it.
  *Superseded in part 2026-09-25 (v1.4): the hero is now "ShieldMan", see
  OQ-S1a below.*
- Application ID placeholder becomes **`io.github.hogy86.shieldvsrobots`**
  (OQ-M11 option (a) updated; OQ-M11 itself stays pending).
- The OQ-S1 (a) Marvel-avoidance constraints are **kept anyway** as binding
  criteria (M9.6), plus: no S.H.I.E.L.D.-style styling of "Shield".
- This is a shared game change (NFR-10 names, in-game title/text). The
  shared ACs are in `docs/PRD-addendum-v4.md` (website product-manager,
  in progress); web and Android code-review, test and UX gates re-run per
  §0 rule 3. The consequence noted in option (b) — about one extra pass
  through both pipelines' gates — is accepted.
- Security review v1 finding M5 is resolved by the rename, subject to
  verification in security pass 2.

Raised by: `docs/mobile/security/review-v1.md` finding M5 (MEDIUM).
Affects: M9.1 (app label/store title), M9.3/M11.7 (art, IP), M12 (listing,
screenshots), `docs/PRD.md` NFR-10 (enemy names are a shared game rule),
mobile-marketing-analyst (IP scan, `play-store-research.md` §4),
mobile-ui-ux-designer (art), security pass 2, and, if renamed, the
placeholder app ID in OQ-M11.
Plain terms: in Marvel's X-Men comics and films, the "Sentinels" are
well-known giant robot villains. The game began as a Captain America theme
and still has a shield-throwing hero, so the name plus the hero is the kind
of "close to a famous brand" combination NFR-10 tries to avoid. Google Play
does not check for this itself, but a rights-holder complaint can get an app
removed or put a strike on the developer account. The store title can be
changed after launch; the **app ID** (the app's permanent Play identity,
OQ-M11) cannot.
- **(a) Keep the name, with binding art and listing constraints
  (recommended).** Binding if chosen: enemy art is never a giant
  purple/magenta humanoid robot; the listing and screenshots never use
  "mutant", X-Men-style imagery or iconography, red/white/blue, or star
  motifs; mobile-marketing-analyst adds a Marvel-catalog check to
  `play-store-research.md` §4; security pass 2 verifies all of this.
  Consequences: no cost or schedule change now; a low-to-moderate residual
  risk of a complaint remains.
- **(b) Rename the enemies before the first Play upload.** Consequences:
  removes the risk, but it is a shared game-rule change (`docs/PRD.md`
  NFR-10 names), so the website and Android review/test/UX gates must re-run
  per §0 rule 3; the listing, app label, in-game/screenshot text and store
  assets change; and the placeholder app ID
  (`io.github.hogy86.vanguardvssentinels`) should change before the first
  upload because it can never change afterwards. Adds roughly one extra pass
  through both pipelines' gates.
- **Recommendation: (a)** — the exposure is a free, no-ads app with original
  art, and the binding constraints remove the visual cues that would make the
  comparison obvious; (b) costs a re-run of both pipelines' gates for a risk
  the constraints already reduce.

### OQ-S1a — Hero name "Vanguard" → "ShieldMan" [shared game change; name/trademark check before step 15] *(added 2026-09-25, v1.4)*
**DECIDED 2026-09-25 (v1.4) by the owner (direct instruction, not a PM
option).** Owner's words, relayed verbatim by the main session: *'change Vanguard name to "ShieldMan"'* (2026-09-25, given right after the "Shield vs Robots" decision).
Decision record:
- The hero is renamed from **"Vanguard"** to **"ShieldMan"** (one word,
  capital S and M) everywhere a player can see it: in-game text, help,
  store listing, screenshots, disclaimer sentence.
- This amends OQ-S1 (b)'s bullet "The hero keeps the name 'Vanguard'". The
  product name "Shield vs Robots", the enemy name "robots" and the app ID
  placeholder `io.github.hogy86.shieldvsrobots` are **unchanged**.
- ACs amended (dated v1.4 blocks, original text kept): M2.4, M3.3/M3.3a,
  M9.1, M9.6 (new items 5-8), M12.1, M12.3, M12.6; §7 OQ-M3 note.
- **Shared game change.** The hero's name is part of the shared game
  (`docs/PRD.md` NFR-10 names, in-game text), so the shared AC must be
  added to the shared PRD (`docs/PRD-addendum-v4.md` or a later addendum)
  by the website product-manager, and the web and Android code-review, test
  and UX gates re-run per §0 rule 3. This document does not write the
  shared AC.
- Upside noted: "ShieldMan" removes the collision between "Vanguard" and
  The Vanguard Group finance apps (M9.1's original note).

**Risk note and recommendation (PM).** Plain terms: a **trademark** is a
name or logo a company legally owns for a type of product; using a name
close to one in the same field (comics, games, toys) can draw a complaint
that gets an app removed from Google Play or puts a strike on the developer
account. "ShieldMan" for a shield-throwing hero is close to two existing
characters: **Archie Comics' "The Shield"** (a patriotic superhero named
after his shield-shaped costume, published since 1940) and **Captain
America** (Marvel's shield-throwing hero, the theme this game was
deliberately moved away from, NFR-10). The store title "Shield vs Robots"
now pairs with a hero named "ShieldMan", which strengthens the "Shield"
association. Options while the check runs:
- **(a) Keep "ShieldMan", conditional on a clean name/trademark check
  before step 15 (recommended).** mobile-marketing-analyst is running the
  check now (Play Store search, USPTO/EUIPO trademark search for comics,
  games and toys, and a comics-character search) and records it in
  `docs/mobile/market/play-store-research.md` §3-§4; M9.6 items 5-8 keep
  the art and styling away from both characters. Consequences: no schedule
  change now; the release engineer does not upload until the check is
  recorded; if the check finds a conflict, this comes back to you before
  any upload.
- (b) Keep "ShieldMan" and skip the check. Consequences: saves a small
  amount of time; leaves an unmeasured risk on the name that ships with the
  first public release (the hero name can be changed later, but changing it
  after launch means another pass through both pipelines' gates and new
  store assets).
- (c) Choose a less "Shield"-anchored hero name now. Consequences: another
  shared rename and gate re-run now, before any code has shipped; only worth
  it if you are not attached to "ShieldMan".
- **Recommendation: (a)** — it respects your choice, costs nothing unless
  the check finds something, and the check completes before the only
  irreversible step (the first upload). **Default applied: (a)**; the
  owner's choice of name is recorded as decided, and the check is a
  release precondition (M9.6 item 8), not a reopening of the decision.

### OQ-A1 — Pre-approve an Android-only storage plugin, used only if saved-data tests fail [before step 7] *(added 2026-09-25, v1.2)*
**Status: PENDING — the owner is being asked now. Not decided here.**

**DECIDED 2026-09-25 (v1.3): option (a), pre-approve (PM recommendation
accepted).** Owner's words: *"Run all recommendations except for the name change - suggest changing it to 'shield vs robots'."* The Android-only
`@capacitor/preferences` storage adapter may be added at step 7 **only** if
an M-ADR-0006 Part 2 emulator check fails; conditions are in M7.4's v1.3
block. This is a narrow, conditional exception to the one-codebase rule
for storage location only; the shared rules stay in `src/` once.

Raised by: `docs/mobile/architecture/adr/0006-on-device-persistence.md`
Part 2; noted in `docs/mobile/security/review-v1.md` checklist ("Plugins
allowed").
Affects: M7.1-M7.5 (saved best score and settings), mobile-junior-developer
(step 7), mobile-lead-developer, security pass 2 (plugin allowlist), and the
one-codebase rule in `.claude/CLAUDE.md`.
Plain terms: the plan is to save the best score and settings with the same
browser storage the website uses (**localStorage**), so one implementation
serves both. There is a small chance Android's web engine loses a save if
Android kills the app right after writing it. At step 7 the developer runs
five emulator checks (install an update over the app, reboot, background then
force-kill, Quit and relaunch, Clear storage). If any fail, the fix is an
official Capacitor plugin (**`@capacitor/preferences`**, which saves to
Android's own settings storage) used as an Android-only storage adapter. The
shared "Best: N" rule stays written once; only where the value is kept
differs. Storage is not one of the areas the one-codebase rule lets differ by
platform, so this needs your exception.
- **(a) Pre-approve the contingency (recommended).** Used **only** if the
  M-ADR-0006 emulator checks fail; otherwise nothing changes. Consequences:
  no pause at step 7 if the checks fail; one official Capacitor plugin is
  added to the approved list (security re-checks it in pass 2); data still
  never leaves the device, so the Data safety answer (M11.3) is unchanged.
- (b) Decide only if the checks actually fail. Consequences: nothing approved
  in advance, but step 7 stops and waits for you if they fail, delaying the
  build by however long the decision takes.
- (c) Refuse the exception. Consequences: if the checks fail, M7.4 ("best
  score survives process death") cannot be met as written; the choices then
  become accepting that a new best can occasionally be lost (an AC change you
  would approve) or a different, likely larger, engineering fix.
- **Recommendation: (a)** — it is narrow, conditional and well understood,
  keeps the schedule predictable, and the most likely outcome is that it is
  never used.

### Q-v3-1 — Restart Level score and the saved best (shared PRD question) *(recorded 2026-09-25, v1.2)*
**Status: STILL PENDING with the owner. Not decided here.** The question,
options and recommendation live in `docs/PRD-addendum-v3.md` §Open Questions
v3 (owned by the website product-manager; it is a shared game rule, so both
pipelines are affected). In short: Restart Level keeps the score from the
abandoned attempt, so a player could inflate the saved best by repeating a
level. Mobile impact: M7.2 is written against today's behavior (Restart Level
keeps the score and triggers no save). If the owner changes the rule, the
change is made in the shared PRD first and mirrored in M7.2 with a dated
note; web and Android gates both re-run per §0 rule 3.

**DECIDED 2026-09-25 (v1.3): option (b) — Restart Level rolls the score
back to what it was when the level started (PM recommendation accepted).**
Owner's words: *"Run all recommendations except for the name change - suggest changing it to 'shield vs robots'."* The shared rule is written by the website
product-manager in `docs/PRD-addendum-v4.md` (amending `docs/PRD.md` F6 AC4
/ F10 AC4 and superseding the "current behavior kept" note in
`docs/PRD-addendum-v3.md` F20 AC4); the Android mirror is M7.2's v1.3
block. Both platforms' gates re-run per §0 rule 3.

---

## 8. Traceability check

- Every mobile feature M1-M12 cites the shared PRD AC(s), use case, market
  finding, or owner question that motivates it.
- Every shared AC whose trigger differs on Android is listed once in §3; all
  other shared ACs apply unchanged (M0.4).
- The agent-mandated mobile behaviors are each covered: touch controls (M3),
  screen fitting incl. cutouts, gesture bar, tablets, foldables (M2),
  pause/resume on backgrounding (M4), back button/gesture (M5), saved high
  score and settings (M7), first-launch help (M8), icon/splash (M9), low-end
  performance (M10).
- The one shared game change identified (saved best score, OQ-M8) is routed
  to the shared PRD, not decided here.
- *(Added 2026-09-25, v1.3.)* The two further shared game changes decided
  by the owner — rename to "Shield vs Robots" / "robots" (OQ-S1 (b)) and
  Restart Level score reset (Q-v3-1 (b)) — are routed to
  `docs/PRD-addendum-v4.md` (website product-manager); this document only
  mirrors their Android-visible effects (M7.2, M9.1, M9.6, M12.1, M12.3,
  M12.6).
- *(Added 2026-09-25, v1.4.)* The hero rename "Vanguard" → "ShieldMan"
  (OQ-S1a, owner instruction) is a shared game change routed to the shared
  PRD (website product-manager); this document mirrors its Android-visible
  effects (M2.4, M3.3/M3.3a, M9.1, M9.6, M12.1, M12.3, M12.6).
- *(Added 2026-09-27, v1.5.)* M2.10a traces to the step-7/8/10 evidence
  (`docs/mobile/tooling-setup-log.md` 2026-09-27 fold-AVD entry,
  `docs/mobile/tests/validation-report-round2.md`,
  `docs/mobile/reviews/code-review-round7.md` I6) and to OQ-M7 (a). It is
  Android screen fitting (§0 rule 2), not a shared game change, so the
  shared PRD is not amended.
- *(Added 2026-09-28, v1.6.)* M2.3b traces to
  `docs/mobile/reviews/code-review-round8.md` E1 (measured insets), to M2.3's
  existing "background art may extend under them" clause, and to OQ-M7 (a).
  It is Android screen fitting (§0 rule 2), not a shared game change, so the
  shared PRD is not amended.
- Market complaint patterns → requirements: ads → M11.5/OQ-M1; touch targets
  and cut-off HUD → M2.3-M2.7, M3.1-M3.2/OQ-M2; fire-button lag → M3.6,
  M10.1; crashes → M10.4, M10.7, MG1.

---

## 9. Amendment log

| Date | Trigger | ACs changed | Summary |
|---|---|---|---|
| 2026-09-25 | UX round 1 F1 (`docs/mobile/ux/design-review-round1.md`) | M2.1 (+M2.1a) | Landscape lock applies from process start on every screen (splash included); no rotation at Start. |
| 2026-09-25 | UX round 1 F2 | M2.4 note, M2.6 note, new M2.12 | Uneven side columns; 640×360 dp budget: movement ≥ 144 dp, THROW ≥ 80 dp, playfield ≈ 416×312 dp (≥ 0.5× floor); architecture doc must show the arithmetic; device-matrix screenshot check. |
| 2026-09-25 | UX round 1 F3 | M2.3 (+M2.3a), M2.12 | Controls sit inside max(cutout, gesture) insets queried at run time; 24 dp nominal for budgeting; 0 accidental system gestures in 20 edge presses per side. |
| 2026-09-25 | UX round 1 F4 | M3.3 (+M3.3a) | Slide ◀↔▶ switches direction within ≤ 100 ms, no drop across the gap, no stick; implementation model left to mobile-solution-architect. |
| 2026-09-25 | UX round 1 N2 (non-blocking) | new M2.13 | Playfield ≥ 0.5× on every device; same side-column layout on tablets/foldables (no band layout, per OQ-M7 (a)). |
| 2026-09-25 | `docs/PRD-addendum-v3.md` follow-ups | §3 F10 AC6 row, M7 heading, M7.1, M7.2 | M7.1/M7.2 now implement F20 (no longer "pending OQ-M8"); "New best!" = strictly greater (F20 AC3); save events aligned to F20 AC4. Q-v3-1 (Restart Level score) left pending with the owner. |
| 2026-09-25 (v1.2) | Security review v1 H1 (`docs/mobile/security/review-v1.md`) | new M11.4a; M5 back table (+ "Privacy policy overlay" row) | In-app privacy policy reachable from title in ≤ 2 taps, same text as hosted policy (bundled copy), works offline with no network request, new plugin or external browser; back returns to opener; not reachable during a run. Mechanism left to mobile-solution-architect. |
| 2026-09-25 (v1.2) | Security review v1 M5 | §7 new OQ-S1 | "Sentinels" vs. Marvel X-Men Sentinels raised with the owner: (a) keep with binding art/listing constraints (recommended) or (b) rename before first upload. **Pending, not decided.** |
| 2026-09-25 (v1.2) | M-ADR-0006 Part 2; security review v1 plugin note | §7 new OQ-A1 | Pre-approval of an Android-only `@capacitor/preferences` storage adapter, used only if the saved-data emulator checks fail, raised with the owner; recommendation: pre-approve. **Pending, not decided.** |
| 2026-09-25 (v1.2) | Owner status check | §7 new Q-v3-1 entry | Q-v3-1 (`docs/PRD-addendum-v3.md`) recorded as still pending; M7.2 unchanged. |
| 2026-09-25 (v1.3) | Owner decision Q-v3-1 = (b) ("Run all recommendations except for the name change …") | §7 Q-v3-1; M7.2 (+v1.3 block) | Restart Level resets the score to its level-start value; no save by itself; never lowers best. Shared rule in `docs/PRD-addendum-v4.md` (website PM). |
| 2026-09-25 (v1.3) | Owner decision OQ-A1 = (a) | §7 OQ-A1; M7.4 (+v1.3 block) | Android-only `@capacitor/preferences` adapter pre-approved, used only if an M-ADR-0006 Part 2 emulator check fails; conditions (a)-(f); security pass 2 re-checks. |
| 2026-09-25 (v1.3) | Owner decision OQ-S1 = (b), rename (owner overrode PM recommendation (a)) | header; Sources; §7 OQ-S1, OQ-M3 note, OQ-M11 option (a)/placeholder; M9.1 (+v1.3 block); new M9.6; M12.1, M12.3 (+v1.3 blocks); new M12.6; §8 | Product name "Shield vs Robots" (store title + launcher label); hero stays "Vanguard"; enemies "robots"; app ID placeholder `io.github.hogy86.shieldvsrobots`; OQ-S1 (a) Marvel-avoidance constraints kept as M9.6 plus no S.H.I.E.L.D.-style "Shield". Shared rename ACs in `docs/PRD-addendum-v4.md`. OQ-M11 still pending. |
| 2026-09-25 (v1.4) | Owner decision OQ-S1a: *'change Vanguard name to "ShieldMan"'* (2026-09-25, given right after the "Shield vs Robots" decision) | header (+hero line, status, v1.4 block); Sources; §7 log, OQ-M3 note, new OQ-S1a; M2.4, M3.3/M3.3a, M9.1, M12.1, M12.3, M12.6 (+v1.4 blocks); M9.6 (+items 5-8); §8 | Hero renamed "Vanguard" → "ShieldMan" in all player-visible text; product name, "robots" and app ID placeholder unchanged. Risk note: close to Archie Comics' "The Shield" and Captain America — name/trademark check on "ShieldMan" recommended and made a precondition for step 15 (M9.6 item 8; mobile-marketing-analyst running it). Shared hero-name AC to be added to the shared PRD by the website product-manager; both pipelines' gates re-run. |
| 2026-09-27 (v1.5) | Spec gap: `docs/mobile/tooling-setup-log.md` 2026-09-27 fold-AVD entry; `docs/mobile/tests/validation-report-round2.md` svr_api36_fold row; `docs/mobile/reviews/code-review-round7.md` I6 | header (status, v1.5 block); Sources; new M2.10a (under M2.10); M2.13 (+v1.5 note); M5 back table (+v1.5 note); §7 note; §8 | Any window that can't fit the M2.12 columns + a ≥ 0.5× playfield (≈ < 624 × 300 dp at nominal insets), of any shape, pauses the game and shows only "Make the window larger to play." Portrait-shaped windows keep M2.10's text. Enlarging it re-lays out within 1 s to the prior screen (a run returns on the pause menu, never auto-resumes). Back leaves the app. Emulator tests (a)-(d), including the fold AVD at 412 × 309 dp and the 640/600 dp boundary. PM decision within OQ-M7 (a), not owner-level. Android-only, no shared PRD change. |
| 2026-09-28 (v1.6) | `docs/mobile/reviews/code-review-round8.md` **E1** (real gesture-nav insets on `svr_api36_pixel7`: t ≈ 28.2, b = 32, sides ≈ 29.7 dp; 640 × 360 dp window misses the v1.5 floor) | header (status, v1.6 block); Sources; new **M2.3b** (under M2.3a); M2.10a (+v1.6 note: definition, test (c)); M2.12 (+v1.6 note); §7 note; §8 | The **playfield** (non-interactive game art) may extend under the top and bottom **system-gesture** bands and the hidden status-bar area; its height is limited only by top/bottom **display-cutout** insets. HUD/hint **text**, touch controls and menu buttons stay inside the full `max(cutout, gesture)` insets on all four edges. Floor (0.5×), control sizes, text sizes and side-inset rule unchanged. Testable: a 16:9 640 × 360 dp phone with gesture navigation and a 24-28 dp status bar (insets 30, 30, 24-28.2, 32) plays at ≈ 0.505× with no prompt; three-button navigation plays; text/controls out of the bands; no art under a cutout; device evidence on a representative AVD. Known limit: width not relaxed (l + r ≤ 64 dp at 640 dp wide); side cutout or above-default back sensitivity still prompts — watched in the closed test. Rejected: lower floor (0.48×), smaller controls. PM decision within OQ-M7 (a), not owner-level. Android-only, no shared PRD change. |

Not changed (v1.3): OQ-M11..OQ-M14 remain pending (only OQ-M11's option (a)
app ID text was updated); no original AC text was deleted — every v1.3
change is an added, dated block.

Not changed (v1.4): no original or v1.1-v1.3 text was deleted; "Vanguard"
in earlier lines (header, OQ-M5 option (b), OQ-M11 example ID, OQ-S1 record)
is kept as the historical record and read as "ShieldMan" per the v1.4 header
reading rule. OQ-M11..OQ-M14 remain pending.

Not changed (v1.5): no original or v1.1-v1.4 text was deleted, and no owner
decision was reopened or needed. M2.10's own text and trigger are unchanged.
Follow-ups (each by the agent that owns the doc): mobile-solution-architect adds the M2.10a floor formula
to `docs/mobile/architecture/mobile-architecture.md`. mobile-junior-developer
implements it (step 7 → 8). mobile-lead-tester adds tests (a)-(d) and
changes the `svr_api36_fold` expected result in
`docs/mobile/tests/device-matrix.md` (step 10). mobile-ui-ux-designer checks
the prompt screen in round 2 (step 11).

Not changed (v1.6): no original or v1.1-v1.5 text was deleted, and no owner
decision was reopened or needed. The 0.5× floor (M2.13), every touch-target
rule (M3.1, M3.2), every text rule (M2.6, M2.11), M2.3a's side-edge rule and
its 20-press test, the M2.10a prompt behavior and text, and OQ-M7 (a) (no new
layout) are unchanged. No game rule changes, so the shared PRD is not amended
and the website is unaffected (§0 rule 2).
Follow-ups (each by the agent that owns the doc):
- **mobile-solution-architect** amends
  `docs/mobile/architecture/mobile-architecture.md`: §6.1 (GameShell must
  give JS the top/bottom **display-cutout** insets separately from the
  combined `max(cutout, gesture)` edge insets); §6.2 `computeLayout`
  (playfield height limited by top/bottom cutout insets only; vertical
  placement keeps HUD/hint text inside the full top/bottom insets, M2.3b
  rule 2); §6.2.1 (restated `minH` formula, nominal values and worked-check
  rows with the M2.3b (a)/(b)/(d) insets); §6.3 and §6.4 (re-worked with the
  code-review-round8 E1 measured insets, both axes, headroom stated per
  axis); §6.5 (HUD text placement); §10.1 (tests for M2.3b (a)-(d)); §12 MR4
  (the M2.3b known width limit); a new amendment entry.
- **mobile-junior-developer** implements it (step 7 → 8).
- **mobile-lead-tester** adds the representative 640 × 360 dp AVD to
  `docs/mobile/tests/device-matrix.md` (M2.3b (e); code-review-round8 E1 (c))
  and re-judges M2.10a (c) and M2.12 on it (step 10).
- **mobile-ui-ux-designer** checks M2.7 art and M2.6 text at the real
  ≈ 0.505× scale and the HUD position near the top band (step 11).
- **mobile-security-compliance-reviewer** sees the GameShell inset-field
  change in pass 2 (no new permission or plugin expected).
- **mobile-product-manager** adds "report any 'Make the window larger to
  play.' shown on a phone in full screen" to the closed-test checklist
  (step 16).

Not changed: owner decisions OQ-M1..OQ-M10 (final). v1.2 changes no
existing AC text and decides no owner question; the architecture docs are
not edited by this amendment (M11.4a's mechanism is for
mobile-solution-architect). N1 and N3 from the UX
review are implementation/asset notes and need no PRD change (N3 is already
covered by M12.2).
