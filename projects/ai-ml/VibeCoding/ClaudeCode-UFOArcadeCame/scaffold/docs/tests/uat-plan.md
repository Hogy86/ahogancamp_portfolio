# UAT Plan — Vanguard vs. Sentinels: Shield Invaders

**Stage:** 14 — Product Manager (UAT plan)
**Date:** 2026-07-06
**Author:** product-manager subagent
**Status:** v1 — plan only (execution performed separately by the main session using a real browser; results recorded in `docs/tests/uat-results.md`)

**Sources (upstream):**
- `docs/PRD.md` — acceptance criteria (F1–F10, NFR-1..NFR-10); the single source of truth for every pass/fail criterion below.
- `docs/README.md` — how to build and run the game.
- `src/config/constants.ts` — concrete tuned values quoted where a tester needs a number to observe (durations, speeds, score amounts). Referenced for observability only; the PRD AC is the gate.
- `src/ui/HUDView.ts`, `src/ui/ScreenController.ts` — exact on-screen strings quoted below so scenarios are literal-checkable.

---

## How to run these scenarios

This is an **interactive HTML5-canvas game**; UAT must be executed by a human or a browser-automation agent driving a real browser — it cannot be validated with `curl`/`Bash` against the dev server (those exercise no game logic).

**Environment setup (once):**
1. From the project root, run `npm install`.
2. Run `npm run dev`.
3. Open the printed URL in a supported desktop browser (Chrome/Firefox/Edge/Safari, latest 2 versions). The default is typically `http://localhost:5173`.
4. Click once inside the game canvas/window so it has keyboard focus.

**Controls (all keyboard):** `←`/`→` move · `Space` throw shield · `Esc` pause · `↑`/`↓` navigate menus · `Enter` confirm/start.

**Scope note (v1 demo-scale):** Level progression and difficulty escalation are **spot-checked** (levels 1 → 2, plus a visual read of a mid/late level where practical), not exhaustively verified level-by-level for all 10 levels. Power-up type on any given drop is **random** (the code selects uniformly from the 4 types on drop; there is no cheat/force flag), so power-up scenarios instruct the tester to catch whatever drops and verify the matching indicator, replaying to obtain a specific type when a scenario names one.

**On-screen reference strings (literal, from source — used as pass anchors):**
- Title screen: heading `VANGUARD vs. SENTINELS`, subtitle `Shield Invaders`, `Press Enter to start`, and a control line `← → move · Space throw · Esc pause · Up/Down + Enter to navigate menus`.
- In-play HUD: `Score: <n>`, `Lives: <n>`, `Level: <n>/10`, `Power ×<n.nn>`, and the in-play control line `← → move · Space throw · Esc pause`.
- Active-effect HUD (top-right effects readout) shows e.g. `5x Hit 7.4s`, `3x Speed 6.1s`, `Shield 5.0s` while a temporary effect runs.
- Pause overlay: heading `PAUSED`, menu items in order `Resume`, `Restart Level`, `Restart Game`, `Quit`.
- Restart-Game confirm box: `Restart Game will discard all progress, score, and your permanent power multiplier.` / `Press Enter to confirm, or Esc to cancel.`
- Game Over: `GAME OVER`, `Final Score: <n>`, `Reached Level <n>`, `Press Enter to start a new run`.
- Victory: `VICTORY`, `The Sentinel formations have been cleared.`, `Final Score: <n>`, `Press Enter to start a new run`.
- Quit fallback (on title after blocked tab-close): `Run ended — you may now close this tab.`

---

## Traceability summary

| Scenario | Title | Primary PRD AC(s) |
|---|---|---|
| U1 | First-run legibility & first throw | F9 AC2, F9 AC3; P1; F2 AC1 |
| U2 | Core loop: move, throw, kill, score | F1 AC1–2, F2 AC1/AC3, F4 AC1, F10 AC1–2 |
| U3 | Formation movement, edge reversal, speed-up | F3 AC2, F3 AC3, F3 AC4 |
| U4 | Power-up catch applies effect | F7 AC2, F7 AC3, F7 AC5/AC6, F7 AC11 |
| U5 | Uncaught power-up has no effect | F7 AC3 |
| U6 | Pause overlay, keyboard nav, Resume | F6 AC1, F6 AC2, F6 AC3, F6 AC10 |
| U7 | Restart Level from pause | F6 AC4 |
| U8 | Restart Game confirm guard | F6 AC11, F6 AC5 |
| U9 | Quit path (tab-close or fallback text) | F6 AC6, F6 AC9 |
| U10 | Lives/damage + post-hit invulnerability | F8 AC1, F8 AC2, F8 AC9 |
| U11 | Game Over screen & restart | F8 AC4, F8 AC7, F10 AC5 |
| U12 | Level 1 → Level 2 progression & escalation | F5 AC1, F5 AC5, F4 AC2, F4 AC5 |
| U13 | Permanent multiplier HUD readout persists | F7 AC7, F7 AC10, F10 (score preserved) |
| U14 | Esc is a no-op on the title screen | F6 AC8 |
| U15 | (Spot-check) Danger warning before formation-reach loss | F3 AC6 |

Every PRD acceptance criterion that is observable in a running game session is covered by at least one scenario above; purely internal/timing ACs (e.g. exact ms latency NFR-3) are noted where a tester can only approximate them.

---

## U1 — First-run legibility & first throw (golden path start)

**Traces to:** F9 AC2, F9 AC3, P1; F2 AC1.

**Preconditions:** Dev server running; fresh browser tab; game just loaded; canvas has focus. Start a stopwatch at the moment the tab finishes loading.

**Steps:**
1. Observe the initial screen.
2. Press `Enter` to start.
3. Read the on-screen control text at the start of play (before throwing).
4. Press `→` once and confirm Vanguard moves.
5. Press `Space` once to throw a shield.
6. Stop the stopwatch at the moment the first shield leaves Vanguard.

**Expected result (PASS if all):**
- Title screen shows `VANGUARD vs. SENTINELS` / `Shield Invaders` / `Press Enter to start` and the control line, with no external instructions needed (F9 AC1/AC3).
- On starting play, a single always-present control line `← → move · Space throw · Esc pause` is visible **before** the first throw (F9 AC2).
- A first-time player, with only the on-screen text, makes their first shield throw in **≤10 seconds** from load (P1 / F9 AC3), and reaches controllable input within a few seconds (≤3 s target, NFR-1 — approximate visual check).
- Pressing `Space` spawns a shield that travels straight up (F2 AC1).

**FAIL if:** control text absent before first throw; first throw takes >10 s using only on-screen info; or the control line is illegible.

---

## U2 — Core loop: move, throw, kill an enemy, score updates (golden path)

**Traces to:** F1 AC1–2, F2 AC1/AC3, F4 AC1 (level-1 one-hit kills), F10 AC1–2.

**Preconditions:** Level 1 in progress (HUD shows `Level: 1/10`); note the current `Score:` value (should be `0` at run start).

**Steps:**
1. Hold `→`, then `←`, confirming Vanguard moves right then left at a steady speed.
2. Move Vanguard until it is horizontally aligned under any Sentinel in the formation.
3. Press `Space` to throw a shield up into that Sentinel.
4. Observe the targeted enemy and the `Score:` HUD value.

**Expected result (PASS if all):**
- Holding a direction moves Vanguard smoothly and constantly in that direction (F1 AC1).
- The thrown shield collides with the first Sentinel in its path (F2 AC1/AC3).
- On level 1, that Sentinel is **destroyed by the single hit** (F4 AC1) and is removed from the formation.
- The `Score:` value **increases** after the kill (F10 AC2) and was `0` at run start (F10 AC1). At level 1 the per-kill award is 100 points (constants: base 100 + 25×level offset), so score jumps by a fixed positive amount per level-1 kill.

**FAIL if:** movement is stuck/inertial, a level-1 enemy survives one clean hit, or the score does not increase on a kill.

---

## U3 — Formation movement: edge reversal, step-down, speed-up as enemies thin

**Traces to:** F3 AC2, F3 AC3, F3 AC4.

**Preconditions:** Level 1 in progress with a full or near-full formation.

**Steps:**
1. Without throwing, watch the whole formation move horizontally as one block for several seconds.
2. Watch until the formation's leading edge reaches a screen edge.
3. Now clear most of the formation, leaving only 1–2 Sentinels alive, and watch the last one(s) move.
4. Kill several enemies in scattered positions and note the gaps left behind.

**Expected result (PASS if all):**
- The formation moves as a unit horizontally (F3 AC2).
- On reaching a screen edge, the whole formation **steps down by one row-height and reverses direction** (F3 AC2).
- The last surviving Sentinel(s) move **noticeably faster** than the full formation did — speed scales up as fewer remain (F3 AC3).
- Destroyed enemies leave **gaps that are not re-filled**; surviving enemies keep their original grid positions (F3 AC4).

**FAIL if:** the formation drifts through/past an edge without reversing, never steps down, does not speed up as it thins, or re-flows to close gaps.

---

## U4 — Power-up catch applies its effect (golden path for UC4)

**Traces to:** F7 AC2, F7 AC3, and one of F7 AC5 (3× Speed) / F7 AC6 (Indestructible Shield); F7 AC11 (active-effect visibility).

**Preconditions:** Level 1 in progress. (At least one power-up is guaranteed to drop per level — F7 AC1.)

**Steps:**
1. Kill Sentinels until a power-up drop appears (a falling pickup descending from a killed enemy's position).
2. Move Vanguard under the falling power-up and collide with it to catch it.
3. Immediately observe the top-right effects HUD readout and Vanguard's behavior.
4. If the caught type is **3× Speed**: hold `→`/`←` and compare movement speed to normal. If it is **Indestructible Shield**: position under an enemy laser and let it hit Vanguard. If it is **5× Hit Power** or **Permanent Multiplier**, this scenario still passes on the catch+indicator check; note the type and re-run to obtain an easily-verifiable temporary type (Speed or Shield) for the effect-magnitude check.

**Expected result (PASS if all):**
- The power-up falls downward at a constant speed from the enemy's death position (F7 AC2).
- Catching it (collision) activates the effect (F7 AC3), and the effects HUD shows the active indicator with a counting-down timer, e.g. `3x Speed 7.8s` or `Shield 7.9s` (F7 AC11).
- **If 3× Speed:** Vanguard visibly moves ~3× faster while active, reverting after ~8 seconds (F7 AC5, `POWERUP_DURATION_SECONDS = 8`).
- **If Indestructible Shield:** an enemy laser passing through Vanguard costs **no life** during the window, Vanguard is visibly distinguished as invulnerable, and normal vulnerability returns after ~8 seconds (F7 AC6).

**FAIL if:** catching a power-up applies no effect, no active-effect indicator appears, or the effect magnitude/duration is clearly wrong (e.g. Speed feels unchanged, or Shield still costs a life).

---

## U5 — Uncaught power-up has no effect (edge case for UC4)

**Traces to:** F7 AC3.

**Preconditions:** Level 1 in progress; note current `Lives:`, `Score:`, `Power ×`, and any active-effect readout (should be empty).

**Steps:**
1. Trigger a power-up drop (kill enemies until one falls).
2. Deliberately **do not** catch it — move Vanguard away and let the power-up fall past the bottom of the playfield.
3. Observe the HUD after it exits the bottom.

**Expected result (PASS):**
- The uncaught power-up is removed when it reaches the bottom, and **no effect is applied**: no active-effect indicator appears, `Power ×` is unchanged, no speed/invuln change, and no life change from the pickup itself (F7 AC3).

**FAIL if:** any effect activates without the player catching the power-up.

---

## U6 — Pause overlay: freeze, all 4 options, keyboard nav, Resume (UC2/P2)

**Traces to:** F6 AC1, F6 AC2, F6 AC3, F6 AC10.

**Preconditions:** Level in active play; note enemy positions, remaining enemy count, `Score:`, and `Lives:`.

**Steps:**
1. Press `Esc` during active play.
2. Observe the overlay and the menu.
3. Press `↓` and `↑` a few times and watch the selection highlight move.
4. With `Resume` selected, press `Enter` (then in a second pass, instead press `Esc` again).
5. After resuming, compare enemy positions, count, score, and lives to the pre-pause state.

**Expected result (PASS if all):**
- Pressing `Esc` **immediately freezes** all motion (player, enemies, projectiles, power-ups, timers) and shows the `PAUSED` overlay (F6 AC1).
- The overlay presents exactly four labeled options in order: `Resume`, `Restart Level`, `Restart Game`, `Quit` (F6 AC2).
- `↑`/`↓` move a **visibly highlighted** selection (non-color-only highlight) and the menu is fully keyboard-operable (F6 AC10).
- Selecting `Resume` **or** pressing `Esc` again continues from the **exact frozen state** — same enemy positions, same remaining count, same score, same lives, and any active power-up timer resumes with time intact (F6 AC3; F6 AC7).

**FAIL if:** motion continues during pause, any of the four options is missing/mislabeled/out of order, the selection can't be moved by keyboard or isn't visibly highlighted, or resuming loses in-level progress.

---

## U7 — Restart Level from pause (UC7)

**Traces to:** F6 AC4.

**Preconditions:** A level in progress with **partial progress** — kill several enemies and, if easy, take one life so `Lives:` < 3; note the current `Level:` and `Score:`.

**Steps:**
1. Press `Esc` to pause.
2. Navigate to `Restart Level` and press `Enter`.
3. Observe the formation and HUD.

**Expected result (PASS if all):**
- The **current level** restarts from its start state — the full formation for that level respawns — **without a page reload** (F6 AC4). The `Level:` value is unchanged (still the same level number).
- Selecting Restart Level requires **no confirmation prompt** (only Restart Game does — F6 AC11).

**FAIL if:** Restart Level reloads the page, advances/decrements the level, or shows a confirmation prompt.

---

## U8 — Restart Game confirmation guard (UX-N3 → F6 AC11)

**Traces to:** F6 AC11, F6 AC5.

**Preconditions:** A run with some progress — advance past level 1 and/or catch a permanent multiplier so `Power ×` > 1.00 and `Score:` > 0; note `Level:`, `Score:`, `Power ×`.

**Steps:**
1. Press `Esc` to pause.
2. Navigate to `Restart Game` and press `Enter`.
3. Observe the confirmation step.
4. First pass: press `Esc` to **cancel**; confirm you're back at the pause menu with the run intact.
5. Second pass: reopen pause → `Restart Game` → `Enter`, then press `Enter` again to **confirm**.

**Expected result (PASS if all):**
- Selecting `Restart Game` shows a **confirmation step** with text `Restart Game will discard all progress, score, and your permanent power multiplier.` and `Press Enter to confirm, or Esc to cancel.` before any reset happens (F6 AC11).
- **Cancel (Esc):** no reset — level, score, and `Power ×` are unchanged; back at pause menu.
- **Confirm (Enter):** the run resets to **level 1 fresh** — `Level: 1/10`, `Score: 0`, `Power ×1.00`, `Lives: 3` — **without a page reload** (F6 AC5).

**FAIL if:** Restart Game resets with no confirmation, the confirm text is missing, cancel still resets, or confirm reloads the page / doesn't fully reset.

---

## U9 — Quit path: tab-close attempt or fallback title message (UC2)

**Traces to:** F6 AC6, F6 AC9.

**Preconditions:** A level in active play. Note: whether `window.close()` succeeds depends on the browser/how the tab was opened; **either outcome is acceptable** per F6 AC6.

**Steps:**
1. Press `Esc` to pause.
2. Navigate to `Quit` and press `Enter`.
3. Observe what happens.

**Expected result (PASS if either branch holds):**
- **Branch A — close allowed:** the tab attempts to close (F6 AC6). (If it closes, reopen the URL to continue other scenarios.)
- **Branch B — close blocked (typical):** the game returns to the **title screen** and shows the explicit fallback text `Run ended — you may now close this tab.` in a highlighted color, clearly ending the run and distinguishing it from a bare first-load screen (F6 AC6, F6 AC9).

**FAIL if:** Quit does nothing, throws a visible error, or (Branch B) returns to a bare title with no run-ended message.

---

## U10 — Lives/damage: laser hit costs a life + brief invulnerability (UC5)

**Traces to:** F8 AC1, F8 AC2, F8 AC9.

**Preconditions:** Fresh run at level 1; HUD shows `Lives: 3`; **no** Indestructible Shield active.

**Steps:**
1. Position Vanguard directly beneath a Sentinel and let an enemy laser strike Vanguard (avoid throwing so as not to clear the shooters immediately).
2. Watch the `Lives:` HUD value and Vanguard's appearance at the moment of the hit and for ~1.5 s after.
3. During that ~1.5 s window, deliberately let another laser strike Vanguard.

**Expected result (PASS if all):**
- `Lives:` starts at `3` (F8 AC1) and drops by **exactly 1** on the first laser hit (F8 AC2), updating the HUD readout.
- Immediately after the hit, Vanguard is **visibly distinguished as invulnerable** (blink/flash/aura, not color-only) for a post-hit window (~1.5 s, `POST_HIT_INVULN_SECONDS`) (F8 AC9).
- A second laser striking **within** that invulnerability window causes **no further life loss** (F8 AC9 / F8 AC3).

**FAIL if:** a hit removes more than one life, the HUD lives count doesn't update, there's no visible invulnerability cue, or a hit during i-frames still costs a life.

---

## U11 — Game Over screen appears with correct messaging and restart (UC5/P5)

**Traces to:** F8 AC4, F8 AC7, F10 AC5.

**Preconditions:** A run in progress; note the `Level:` reached and current `Score:`.

**Steps:**
1. Deplete all lives — repeatedly let enemy lasers hit Vanguard (waiting out each i-frame window) until `Lives:` reaches 0. (Alternatively, let the formation reach the player's row — see U15.)
2. Observe the resulting screen.
3. Press `Enter`.

**Expected result (PASS if all):**
- Reaching 0 lives ends the run in a **Game Over** screen showing `GAME OVER`, `Final Score: <n>` (matching the score just before death), `Reached Level <n>`, and `Press Enter to start a new run` (F8 AC4; F10 AC5).
- Exactly **one** Game Over screen is shown — no flicker between competing end states (F8 AC8).
- Pressing `Enter` starts a **fresh run without a page reload** — back to `Level: 1/10`, `Lives: 3`, `Score: 0` (F8 AC7).

**FAIL if:** Game Over doesn't appear at 0 lives, the final score/level readout is wrong or missing, or there's no keyboard way to start a new run without reloading.

---

## U12 — Level progression: clear level 1, advance to a harder level 2 (UC3/UC5)

**Traces to:** F5 AC1, F5 AC5, F4 AC2, F4 AC5.

**Preconditions:** Level 1 in progress; HUD shows `Level: 1/10`.

**Steps:**
1. Destroy **every** Sentinel in the level-1 formation.
2. Observe the level indicator and the newly spawned formation.
3. On level 2, throw shields at individual enemies and identify which enemy takes **two** hits to destroy (the boss).
4. Compare the level-2 formation/pressure to level 1 (formation size, enemy toughness, fire rate) at a glance.

**Expected result (PASS if all):**
- Clearing all level-1 enemies **advances to level 2** and the indicator reads `Level: 2/10` (F5 AC1, F5 AC5).
- Level 2 is **visibly different/harder** per F4: exactly one enemy (the boss) requires **2 hits** while all others still die in one (F4 AC2), and the overall difficulty (fire rate / formation) is ≥ level 1 (F4 AC5, monotonic).
- (Spot-check only — no need to verify all 10 levels individually.)

**FAIL if:** clearing level 1 doesn't advance, the level indicator doesn't update, or level 2 shows no increase in difficulty (e.g. no 2-hit boss).

---

## U13 — Permanent hit-power multiplier: HUD readout appears and persists (UC4)

**Traces to:** F7 AC7, F7 AC10, F10 (score preserved across levels).

**Preconditions:** A run in progress; HUD `Power ×` reads `Power ×1.00`. Because power-up type is random, be prepared to replay drops until a **Permanent Multiplier** drops.

**Steps:**
1. Catch power-ups until you catch a **Permanent Hit-Power Multiplier** (the one with no countdown timer that changes `Power ×`).
2. Observe the `Power ×` HUD readout at the moment of catch and immediately after.
3. Continue playing; clear the current level to advance a level.
4. Re-check the `Power ×` readout after the level transition.
5. (If practical) catch a second permanent multiplier and re-check.

**Expected result (PASS if all):**
- On catching the permanent multiplier, `Power ×` updates from `1.00` to `1.80` (`PERMANENT_MULTIPLIER_PER_CATCH = 1.8`) with a **distinct on-catch flash/feedback** on the readout (F7 AC10a/b).
- The `Power ×N.NN` readout **persists** on the HUD and carries across the level transition (F7 AC7 — permanent for the rest of the run).
- A second catch stacks multiplicatively to `Power ×3.24` (1.8 × 1.8) (F7 AC7).
- Score is preserved across the level transition (not reset) (F10 AC4).

**FAIL if:** catching a permanent multiplier shows no HUD readout, the readout doesn't persist across levels, or stacking doesn't multiply (e.g. adds instead).

---

## U14 — Esc is a silent no-op on the title screen (UX-B1 → F6 AC8)

**Traces to:** F6 AC8.

**Preconditions:** On the **title screen** (`VANGUARD vs. SENTINELS`), before pressing Enter to start — i.e., not in active play.

**Steps:**
1. On the title screen, press `Esc` several times.
2. Observe the screen and check the browser console for errors.

**Expected result (PASS):**
- Pressing `Esc` does **nothing**: no pause overlay opens, no partial overlay or glitch appears, and no error is thrown (F6 AC8). The title screen remains fully intact and `Press Enter to start` still works afterward.

**FAIL if:** Esc opens a pause overlay on the title screen, produces a partial overlay/visual glitch, or throws a console error.

*(Optional extension — same AC: repeat this Esc-no-op check on the Game Over and Victory screens; per F6 AC8 those must also be silent no-ops.)*

---

## U15 — (Spot-check) Danger warning before formation-reach loss (Q7 default → F3 AC6)

**Traces to:** F3 AC6, F8 AC5.

**Preconditions:** Level 1 in progress. Note: `FORMATION_WARNING_ENABLED = true` in the current build. This is a PM-default pending owner sign-off (PRD Q7); flag any failure to the owner rather than silently patching.

**Steps:**
1. Deliberately **avoid** killing the enemies and let the formation advance downward step by step toward Vanguard's row.
2. Watch closely as the formation's lowest living enemy crosses to one row above Vanguard's row.
3. Continue letting the formation reach Vanguard's row.

**Expected result (PASS if all):**
- When the formation's lowest enemy crosses the warning threshold (one row above the player row), a **visible non-color-only danger/approach warning** appears (e.g. pulsing edge/border plus a shape or text cue) — at least one clear beat of notice (F3 AC6).
- When the formation then reaches Vanguard's row, the run ends in **Game Over** regardless of remaining lives (F8 AC5), showing the single unified `GAME OVER` screen (F8 AC8).

**FAIL if:** the formation reaches the player row with no prior warning cue while the warning flag is enabled, the warning relies on color alone, or the formation-reach loss does not produce a Game Over.

---

## Overall UAT gate

**UAT PASSES** only if every scenario U1–U15 records PASS (U9 passes on either its Branch A or Branch B). Any FAIL is documented in `docs/tests/uat-results.md` with the exact observed behavior, tied back to the named PRD AC, and — per product-manager Job 0 — surfaced to the owner with options if it changes scope/risk/direction, then routed to the relevant upstream subagent. Deployment (pipeline step 16) cannot begin until this gate is PASS.
