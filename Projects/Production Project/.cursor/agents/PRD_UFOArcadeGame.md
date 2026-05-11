Product Requirements Document (PRD): Arcade UFO
Version: 1.0 (Draft) | Date: 2026-05-11
Owners: PM: TBD | Engineering Lead: TBD | Design Lead: TBD | QA Lead: TBD
Assumptions & Inputs
Project Repository Location (Local Development)
1.	DEVOPS-PATH-001 The system shall store all project code and related assets under the local Windows directory: C:\Users\aaron\OneDrive\Documents\GitHub\ahogancamp_portfolio\Projects\Production Project\UFO_Arcade_Game.
2.	DEVOPS-PATH-002 The system shall assume this directory is the repository root containing docker-compose.yml, .env, and the scripts\ folder referenced by the Windows shortcut and launcher scripts.
3.	DEVOPS-PATH-003 The system shall ensure all documentation and scripts use paths relative to the repository root (no hard-coded absolute paths) except where explicitly required for the Desktop shortcut “Start in” field.
Acceptance Criteria (Project Path)
•	AC-PATH-001 Given the repository exists at the specified directory, When the user runs scripts\launch-arcade-ufo.ps1 from the Desktop shortcut, Then docker compose commands execute successfully because the working directory is the repo root.
•	AC-PATH-002 (Negative) Given the launcher script is executed with a different working directory that does not contain docker-compose.yml, When it attempts to start the stack, Then it exits with a clear error stating that it must be run from the repository root (or via the Desktop shortcut configured with Start in).
•	Single-player only (local play on one machine; no multiplayer networking).
•	Pointer aiming is not required; primary input is keyboard only (WASD + Space). Optional mouse support may be added later as a non-goal for MVP.
•	Rendering approach option set: (A) Canvas 2D, (B) WebGL, (C) SVG. Chosen: HTML5 Canvas 2D for fastest iteration and broad compatibility; vector look achieved via procedural drawing (paths/shapes) and resolution-independent scaling.
•	Server approach option set: (A) Node.js + Express static server with HTTPS, (B) Nginx reverse proxy + static assets, (C) Caddy. Chosen: Nginx for TLS termination + static serving; simple, deterministic config in Docker and supports HTTP→HTTPS redirect easily.
•	Certificates: Use mkcert-style developer CA workflow for warning-free HTTPS on localhost where feasible; fallback to self-signed cert with documented browser warning behavior if mkcert is unavailable.
•	Persistence: Progression, best score, and local leaderboard stored in localStorage only; no external calls by default.
•	Target frame rate: 60 FPS with frame-rate independent simulation using requestAnimationFrame timestamp deltas.
2. Executive Summary
Arcade UFO is a browser-playable, top-down arcade shooter set in a dark outer-space arena. Players pilot a neon-outlined UFO, dodge enemy fire, collect temporary power-ups, and clear exactly 10 progressively harder levels. The game runs locally on localhost and ships as a Docker-containerized web app with an HTTPS dev setup using locally-trusted certificates where feasible. The PRD is implementation-ready for frontend, backend (static server), DevOps, QA, and design teams, with numbered requirements and acceptance criteria per major feature.
3. Goals & Non-Goals
3.1 Goals
•	GAM-GOAL-001 The system shall provide a responsive top-down shooter playable on modern desktop browsers via localhost.
•	GAM-GOAL-002 The system shall ship as a Dockerized application runnable with a single command (docker compose up) and accessible over HTTPS on localhost where feasible.
•	GAM-GOAL-003 The system shall include 10 levels with measurable difficulty progression and a deterministic pause/menu system that fully freezes gameplay state.
•	GAM-GOAL-004 The system shall implement enemy counterfire, power-ups with timers, scoring, and an endgame celebration upon clearing Level 10.
3.2 Non-Goals
•	GAM-NONGOAL-001 The system shall not include online multiplayer, matchmaking, or remote backend services in MVP.
•	GAM-NONGOAL-002 The system shall not include account login, cloud saves, or networked leaderboards by default.
•	GAM-NONGOAL-003 The system shall not include mobile touch controls in MVP (may be explored post-release).
•	GAM-NONGOAL-004 The system shall not require external CDNs or third-party calls to run locally (dependencies are bundled at build time).
4. Personas & Use Cases
4.1 Personas
•	Casual Player: Wants immediate fun, clear controls, readable visuals, short sessions (5–15 minutes), and easy restart.
•	Arcade Enthusiast: Seeks increasing challenge, score chasing, and distinct enemy patterns that reward learning.
•	Speedrunner: Wants fast menus, consistent physics/timing, predictable spawns (within fair randomness), and restart shortcuts with confirmation.
•	QA/Developer Tester: Needs deterministic toggles (pause, restart, level select in dev mode), logs, and reproducible behavior.
4.2 Key Use Cases
•	UC-001 Quick Play: Launch docker-compose, open https://localhost, press Start, complete Level 1.
•	UC-002 Pause & Resume: Pause mid-combat, verify all timers and projectiles freeze, resume without state drift.
•	UC-003 Power-up Mastery: Collect Wide Shot + Hit Power Multiplier simultaneously, confirm stacking rules and HUD timers.
•	UC-004 Score Chase: Play repeatedly to beat local best score; view local leaderboard.
•	UC-005 Completion: Beat Level 10, see Congratulations + fireworks, then replay or return to menu.
5. Gameplay Overview
Core loop: Start level → spawn enemies → player moves (WASD), shoots (Space), evades enemy projectiles → defeat enemies to score points and trigger power-up drops → clear all enemies/waves → advance to next level (1–10) → after Level 10, show endgame celebration.
5.1 Game States (High-Level)
•	STATE-001 Main Menu → Start Game → Level 1.
•	STATE-002 Playing (Level N) → Pause Toggle → Paused.
•	STATE-003 Paused → Resume → Playing; Quit/Restart → corresponding state transitions.
•	STATE-004 Level Complete → Continue → next level or Endgame (after Level 10).
•	STATE-005 Game Over → Restart Level / Main Menu.
•	STATE-006 Endgame Celebration → Replay (Level 1) / Main Menu.
6. Controls & Input Handling
6.1 Control Mapping (Default)
Action	Key(s)	Notes
Move Up	W	Simultaneous key presses supported (e.g., W+D for diagonal).
Move Down	S	Diagonal movement normalized (no speed advantage).
Move Left	A	Hold to continue moving.
Move Right	D	Hold to continue moving.
Fire / Shoot	Space	Hold-to-fire supported with weapon cooldown.
Pause Toggle	Esc and/or P	Esc is primary; P is secondary toggle.
Pause Menu Navigate	Up/Down Arrows or W/S	Key repeat enabled with debounce (see requirements).
Confirm / Select	Enter or Space	Space confirms in menu without firing while paused.
Back / Resume	Esc	Returns to previous menu or resumes.
Optional Hotkeys (Paused)	Q, R, 1	Q=Quit, R=Restart level, 1=Restart from Level 1 (with confirmation).
6.2 Functional Requirements
1.	GAM-CTRL-001 The system shall support player movement using W=up, A=left, S=down, D=right while in the Playing state.
2.	GAM-CTRL-002 The system shall support firing the player weapon using Space while in the Playing state.
3.	GAM-CTRL-003 The system shall support pausing via Esc and P keys to toggle between Playing and Paused states.
4.	GAM-CTRL-004 The system shall interpret simultaneous movement key presses (e.g., W+D) as diagonal movement with normalized speed so diagonal velocity magnitude equals cardinal velocity magnitude.
5.	GAM-CTRL-005 The system shall prevent browser-default behaviors that interfere with gameplay (e.g., page scroll on Space/Arrow keys) when the canvas has focus.
6.	GAM-CTRL-006 The system shall support pause menu navigation using Up/Down Arrow or W/S, confirmation using Enter or Space, and back/resume using Esc.
7.	GAM-CTRL-007 The system shall support optional pause hotkeys: Q (Quit), R (Restart Current Level), and 1 (Restart from Level 1), each gated by confirmation prompts.
8.	GAM-CTRL-008 The system shall implement key repeat behavior in pause menus with a debounce of 150ms initial delay and 75ms repeat interval to prevent overscroll.
9.	GAM-CTRL-009 The system shall not support key remapping in MVP; the controls are fixed and must be displayed in the Settings/Help screen.
10.	GAM-CTRL-010 The system shall provide an accessibility note in Settings describing keyboard-only support and recommending fullscreen/zoom for visibility.
6.3 Acceptance Criteria (Controls & Input)
•	AC-CTRL-001 Given the game is in Playing state, When the player holds W and D together, Then the UFO moves diagonally up-right at the same overall speed as holding only W.
•	AC-CTRL-002 Given the game is in Playing state, When the player holds Space, Then shots fire repeatedly according to the weapon cooldown and do not exceed the configured fire rate.
•	AC-CTRL-003 Given the game is in Playing state, When the player presses Esc, Then the game enters Paused state and no player shots are emitted while paused even if Space is held.
•	AC-CTRL-004 (Edge) Given the pause menu is open, When the player holds the Down Arrow, Then the selection advances at most once per repeat interval and never skips more than one option per tick.
•	AC-CTRL-005 (Negative) Given the canvas has focus, When the player presses Space or Arrow keys, Then the browser page shall not scroll.
7. Game Mechanics
7.1 Player UFO Properties
Baseline parameters (tunable via config): Move speed: 300 units/sec; Hitbox: circle radius 14 units; Lives: 3; Invulnerability: 1.25s after taking damage; Playfield: fixed aspect (16:9) scaled to viewport with letterboxing.
1.	GAM-PLY-001 The system shall render the player UFO as vector-style geometry with neon outlines and a readable silhouette on a dark starfield background.
2.	GAM-PLY-002 The system shall constrain the player UFO within the playfield bounds (no leaving the screen).
3.	GAM-PLY-003 The system shall track player lives (default 3) and decrement by 1 upon collision with an enemy projectile or enemy body.
4.	GAM-PLY-004 The system shall grant invulnerability frames (i-frames) for 1.25 seconds after the player is hit, during which further collisions do not decrement lives.
5.	GAM-PLY-005 The system shall provide immediate feedback on hit events (flash + sound cue if enabled) without excessive screen shake (accessibility).
Acceptance Criteria (Player)
•	AC-PLY-001 Given the player has 3 lives and no active Shields power-up, When an enemy projectile collides with the player hitbox, Then lives decrease to 2 and i-frames begin immediately.
•	AC-PLY-002 (Edge) Given i-frames are active, When additional enemy projectiles overlap the hitbox during the 1.25s window, Then lives do not change and the i-frame timer does not reset.
7.2 Weapon System
Baseline weapon: Single forward bolt; Damage: 1 per hit; Rate of fire: 6 shots/sec (cooldown 166ms); Projectile speed: 900 units/sec; Lifetime: 1.2s; Max concurrent player projectiles: 30 (older culled if exceeded).
1.	GAM-WPN-001 The system shall allow the player to fire using Space with a cooldown-based rate limiter (default 6 shots/sec).
2.	GAM-WPN-002 The system shall use continuous collision detection (ray/segment sweep) for fast projectiles to avoid tunneling at 60 FPS.
3.	GAM-WPN-003 The system shall destroy player projectiles upon leaving the playfield or upon colliding with an enemy shield/body.
4.	GAM-WPN-004 The system shall attribute score events to projectile hits and kills (see scoring section).
5.	GAM-WPN-005 The system shall support weapon modifications from power-ups (Wide Shot, Hit Power Multiplier) without breaking baseline behavior.
Acceptance Criteria (Weapon)
•	AC-WPN-001 Given the player holds Space, When 1 second elapses in Playing state, Then no more than 6 player projectiles are spawned (±1 due to frame scheduling) and the average rate converges to 6/sec.
•	AC-WPN-002 (Negative) Given the player projectile cap is 30, When the player holds Space continuously, Then the system never exceeds 30 active player projectiles and culls oldest projectiles deterministically.
7.3 Enemy Projectile System (Enemies Shoot Back)
Baseline enemy fire rate: fireRate(level) = 0.5 + (level−1)×0.25 shots/sec (applied as an average per active shooter enemy; per-type modifiers below). Enemy projectile speed baseline: 550 units/sec at Level 1, scaling +20 units/sec per level (cap 750).
Projectile Patterns
•	Aimed Shot: Enemy aims at the player’s current position with a 250ms telegraph (glow line + charge ring) before firing.
•	Spread Shot: Fires 3 projectiles in a 20° cone centered on the player direction; 350ms telegraph with three faint guide rays.
•	Spiral/Burst: Fires 6 projectiles over 600ms in a rotating pattern (used by mini-boss/boss or elite enemies); 500ms telegraph with rotating arc indicator.
1.	GAM-ENPRJ-001 The system shall allow enemies to emit projectiles according to fireRate(level) and per-archetype modifiers defined in this PRD.
2.	GAM-ENPRJ-002 The system shall telegraph all enemy shots prior to emission using a distinct visual cue with minimum telegraph duration of 250ms.
3.	GAM-ENPRJ-003 The system shall apply collision damage: enemy projectile collision with the player reduces lives by 1 unless Shields power-up is active or i-frames are active.
4.	GAM-ENPRJ-004 The system shall despawn enemy projectiles when leaving the playfield or after 2.0 seconds, whichever occurs first.
5.	GAM-ENPRJ-005 The system shall scale enemy projectile speed by level (Level 1 = 550 units/sec; +20 per level; cap 750) and shall document the effective speed in runtime debug overlay (dev mode).
Acceptance Criteria (Enemy Projectiles)
•	AC-ENPRJ-001 Given Level 3 is active, When an Aimed Shot enemy fires, Then a telegraph is visible for at least 250ms before the projectile spawns.
•	AC-ENPRJ-002 (Edge) Given an enemy is telegraphing a shot, When the player pauses the game, Then the telegraph timer freezes and the projectile does not spawn until the game is resumed.
7.4 Enemy Shields / Armor Model (Linear by Level)
Shield scaling requirement: Enemy shields scale linearly by level using hitsToBreak(level) = base + (level−1)×increment. Chosen values: base = 3 hits (Level 1), increment = 1 hit per level. This keeps early levels approachable and makes Level 10 meaningfully tankier without requiring excessive projectile spam.
Level	hitsToBreak(level)
1	3
2	4
3	5
4	6
5	7
6	8
7	9
8	10
9	11
10	12
Shield behavior: Shields are a separate layer that must be broken before enemy hull health can be damaged. Shields do not regenerate in-level (MVP) to keep combat readable.
1.	GAM-SHLD-001 The system shall assign each shielded enemy a shield counter equal to hitsToBreak(level) at spawn time.
2.	GAM-SHLD-002 The system shall decrement shield counter by 1 for each player projectile hit (or by damage amount if Hit Power Multiplier is active) until it reaches 0.
3.	GAM-SHLD-003 The system shall block hull damage while shield counter > 0.
4.	GAM-SHLD-004 The system shall play a distinct shield-break effect (neon shatter ring) when shield counter reaches 0.
5.	GAM-SHLD-005 The system shall not regenerate enemy shields during a level in MVP.
Acceptance Criteria (Enemy Shields)
•	AC-SHLD-001 Given Level 1 is active (hitsToBreak=3), When the player hits a shielded enemy three times with baseline damage, Then the shield breaks and subsequent hits reduce hull health.
•	AC-SHLD-002 (Edge) Given Hit Power Multiplier (5×) is active, When a projectile hits a shielded enemy, Then shield counter is reduced by 5 but not below 0, and shield break triggers immediately if the counter reaches 0.
7.5 Enemy Types (Archetypes)
Archetypes overview: Enemies spawn as vector ships with neon accents. All enemies may have shields depending on level rules (default: 60% of enemies shielded Levels 1–3, 75% Levels 4–7, 85% Levels 8–10). Hull health is separate from shields.
Type	Role	Movement	Hull HP	Fire Pattern	Fire Rate Modifier	Score (Kill)
Scout	Fast harasser	Swoops toward player then strafes	2	Aimed Shot	×1.1	150
Gunner	Baseline shooter	Patrols lanes; occasional side-step	3	Spread Shot (3)	×1.0	200
Tank	Durable threat	Slow drift; tries to body-block	6	Aimed Shot	×0.75	350
Elite (Rare)	Pattern spike	Orbit center; burst windows	4	Spiral/Burst	×1.25	500
1.	GAM-ENY-001 The system shall implement at least three distinct enemy archetypes (Scout, Gunner, Tank) with unique movement patterns and stats.
2.	GAM-ENY-002 The system shall support an optional Elite archetype for difficulty spikes from Level 6 onward.
3.	GAM-ENY-003 The system shall apply per-archetype fire rate modifiers to the level baseline fireRate(level).
4.	GAM-ENY-004 The system shall ensure enemy movement and firing are deterministic given the same random seed (dev mode) to support QA repro.
Acceptance Criteria (Enemy Types)
•	AC-ENY-001 Given a Scout and a Tank spawn together, When 10 seconds elapse, Then the Scout covers more distance than the Tank and exhibits a swoop-and-strafe pattern.
•	AC-ENY-002 (Edge) Given the same dev seed is set, When Level 4 starts twice, Then enemy spawn order and initial positions match between runs (excluding player-driven divergence).
7.6 Power-Ups (Required)
Duration: Each power-up lasts 10 seconds and is shown in the HUD with a countdown timer (mm:ss or ss.t). Pause behavior: All power-up timers freeze while paused. Active cap: Up to 2 power-ups active simultaneously with defined stacking and replacement rules below.
Power-Up Definitions
•	Wide Shot: Fires 5 shots in a 40° arc per trigger; each shot has baseline damage (1). Projectile spread: −20°, −10°, 0°, +10°, +20°.
•	Hit Power Multiplier: Multiplies player projectile damage by 5× (damage becomes 5).
•	Super Speed: Multiplies player movement speed by 2×.
•	Shields: Player becomes immune to hits (unlimited hits without breaking) for the duration; visualized as a glowing ring. Does not alter i-frame logic; it supersedes damage application.
Stacking & Replacement Rules
•	GAM-PWR-RULE-001 Up to 2 power-ups may be active at once.
•	GAM-PWR-RULE-002 Shields can stack with any other power-up and has priority; it is never replaced while active.
•	GAM-PWR-RULE-003 Wide Shot and Hit Power Multiplier can stack together.
•	GAM-PWR-RULE-004 Super Speed can stack with either Wide Shot or Hit Power Multiplier (subject to the 2-power-up cap).
•	GAM-PWR-RULE-005 Picking up an already-active power-up refreshes its timer to 10 seconds (no potency increase).
•	GAM-PWR-RULE-006 If a third power-up is collected while two are active, the system shall replace the oldest active power-up except Shields, which is never replaced while active. If Shields is active and one other is active, the non-Shields power-up is replaced.
Spawn Rules & Fairness
•	GAM-PWR-SPWN-001 The system shall roll a 12% drop chance on each enemy kill to spawn one power-up pickup at the enemy’s position.
•	GAM-PWR-SPWN-002 The system shall cap the number of concurrent pickups on the playfield to 2; additional drops are skipped until a pickup is collected or despawns.
•	GAM-PWR-SPWN-003 The system shall despawn uncollected pickups after 8 seconds (timer freezes while paused).
•	GAM-PWR-SPWN-004 The system shall ensure distribution fairness: no more than 2 identical power-ups may spawn consecutively unless the only remaining option is that type (due to constraints such as Shields priority).
•	GAM-PWR-SPWN-005 The system shall not spawn a pickup in an unreachable location; pickups must remain within playfield bounds and drift slowly (50 units/sec) toward center to reduce edge loss.
•	GAM-PWR-SPWN-006 The system shall freeze pickup motion and despawn timers while paused.
•	GAM-PWR-SPWN-007 The system shall handle end-of-level edge cases: if the last enemy dies and a pickup spawns simultaneously, the pickup may be collected during the Level Complete state for up to 3 seconds; otherwise it is discarded on transition to the next level.
Functional Requirements
1.	GAM-PWR-001 The system shall implement the four required power-ups: Wide Shot, Hit Power Multiplier (5×), Super Speed (2×), and Shields (invulnerable) with 10-second durations.
2.	GAM-PWR-002 The system shall display active power-ups in the HUD with distinct icons and countdown timers that update at least 10 times/sec.
3.	GAM-PWR-003 The system shall enforce stacking and replacement rules defined in GAM-PWR-RULE-001 through GAM-PWR-RULE-006.
4.	GAM-PWR-004 The system shall freeze all power-up timers while paused and resume them without time loss.
5.	GAM-PWR-005 The system shall log (locally) each power-up pickup event with timestamp and level when telemetry is enabled.
Acceptance Criteria (Power-Ups)
•	AC-PWR-001 Given no power-ups are active, When the player collects Wide Shot, Then the HUD shows Wide Shot with a 10.0s countdown and the weapon fires 5 projectiles per shot in the defined arc.
•	AC-PWR-002 Given Wide Shot is active, When the player collects Hit Power Multiplier, Then both are active simultaneously (2/2 cap) and each Wide Shot projectile deals 5 damage.
•	AC-PWR-003 Given Shields and Super Speed are active, When the player collects Wide Shot, Then Shields remains active and Super Speed is replaced (oldest non-Shields), and Wide Shot becomes active with 10.0s timer.
•	AC-PWR-004 (Edge) Given a power-up has 3.0s remaining, When the game is paused for 5 seconds, Then after resuming the power-up still has 3.0s remaining (timers fully frozen).
•	AC-PWR-005 (Negative) Given two power-ups are active, When the player collects a third while Shields is not active, Then only the oldest active power-up is replaced and the newer one remains unchanged.
7.7 Scoring, Combos, Multipliers, Leaderboard Policy
Scoring model (local-only): +10 per hit on hull, +5 per hit on shield, plus kill score per archetype (see table). Combo: Each kill within 3.0 seconds of the previous kill increases combo multiplier by +0.25 up to 3.0×; timer freezes while paused. Taking damage resets combo to 1.0×.
1.	GAM-SCORE-001 The system shall calculate score as the sum of hit points and kill awards multiplied by the current combo multiplier.
2.	GAM-SCORE-002 The system shall increase combo multiplier by +0.25 for each kill made within a 3.0s combo window, capped at 3.0×.
3.	GAM-SCORE-003 The system shall reset combo multiplier to 1.0× when the player takes damage (unless Shields is active, in which case combo does not reset).
4.	GAM-SCORE-004 The system shall store the top 10 local scores in localStorage with timestamp and achieved level, and shall provide a “Clear Scores” button in Settings with confirmation.
5.	GAM-SCORE-005 The system shall not transmit scores externally by default.
Acceptance Criteria (Scoring)
•	AC-SCORE-001 Given the player kills two enemies within 3.0s, When the second kill occurs, Then combo multiplier increases by +0.25 and subsequent scoring uses the new multiplier.
•	AC-SCORE-002 (Edge) Given the combo window has 0.2s remaining, When the game is paused for 10s and then resumed, Then the combo window still has 0.2s remaining and does not expire while paused.
8. Level Design (10-Level Progression Plan)
Definition of “harder” (measurable): Higher total enemies, higher average enemy speed, higher shield hits-to-break, higher enemy fire rate (per formula), higher projectile speed (scales by level), and more complex wave patterns (more simultaneous shooters and elite appearance).
8.1 Level Progression Table (Levels 1–10)
Level	Enemy Count	Enemy Speed (units/sec)	Shield hits-to-break	Enemy Fire Rate (shots/sec)
1	10	110	3	0.50
2	12	120	4	0.75
3	14	130	5	1.00
4	16	140	6	1.25
5	18	150	7	1.50
6	20	160	8	1.75
7	22	170	9	2.00
8	24	180	10	2.25
9	26	190	11	2.50
10	28	200	12	2.75
Per-archetype fire rate modifiers: Apply to the baseline fire rate in the table: Scout ×1.1, Gunner ×1.0, Tank ×0.75, Elite ×1.25. For example, at Level 6 (baseline 1.75), Scout fires at 1.93 shots/sec (rounded), Tank at 1.31 shots/sec.
8.2 Waves, Spawn Patterns, Boss Policy
•	Levels 1–2: Single wave; enemies spawn in two side arcs; max simultaneous enemies equals level enemy count.
•	Levels 3–5: Two waves (60% then 40% of enemies); second wave spawns when first wave count ≤ 3.
•	Levels 6–9: Three waves; introduce Elite enemies (max 1 Elite in Level 6–7, max 2 in Level 8–9). Elites always telegraph Spiral/Burst.
•	Level 10 (Boss Level): Optional boss enabled for this PRD: a Mothership spawns after clearing 20 of 28 enemies. Boss uses Spiral/Burst and periodic minion spawns (remaining 8 enemies).
8.3 Win & Failure Conditions
1.	GAM-LVL-001 The system shall contain exactly 10 playable levels and shall not generate infinite levels in MVP.
2.	GAM-LVL-002 The system shall start Level 1 with at least 10 enemies available to shoot (as specified in the progression table).
3.	GAM-LVL-003 The system shall mark a level as complete when all enemies (and boss, if present) are defeated.
4.	GAM-LVL-004 The system shall trigger Game Over when player lives reach 0.
5.	GAM-LVL-005 The system shall carry the player’s current score across levels during a run; on Restart from Level 1, score resets to 0.
Acceptance Criteria (Levels)
•	AC-LVL-001 Given the player defeats the final enemy in Level 4, When the last enemy is destroyed, Then the system shows a Level Complete overlay and advances to Level 5 upon confirmation.
•	AC-LVL-002 (Edge) Given the player has an active power-up and Level Complete triggers, When the player waits on the Level Complete screen for 5 seconds, Then the power-up timer does not decrease during that time (treated as paused/frozen state).
9. Art, Audio, and UI/UX Requirements
9.1 Visual Style (Vector Dark-Space)
1.	GAM-ART-001 The system shall render a dark outer-space backdrop with animated starfield (parallax) and high-contrast neon accents for all gameplay entities.
2.	GAM-ART-002 The system shall use vector-based graphics (procedural Canvas paths and strokes) that remain crisp under scaling and device pixel ratio changes.
3.	GAM-ART-003 The system shall ensure readability by maintaining minimum contrast ratio equivalent to WCAG AA for HUD text where applicable (target ≥ 4.5:1 for text).
9.2 HUD Requirements
1.	GAM-HUD-001 The system shall display Score, Lives, Level (1–10), Combo Multiplier, and Active Power-Ups with countdown timers.
2.	GAM-HUD-002 The system shall display a Pause indicator when in Paused state.
3.	GAM-HUD-003 The system shall provide a minimal debug overlay when ENV=dev (FPS, entity counts, current seed) toggleable via a dev-only key (e.g., F1).
9.3 Menus & Screens
1.	GAM-MENU-001 The system shall include: Main Menu, Settings/Help, Pause Menu, Level Complete overlay, Game Over screen, and Win screen.
2.	GAM-MENU-002 The Pause Menu shall include options: Resume, Quit to Main Menu, Restart Current Level, and Restart from Level 1.
3.	GAM-MENU-003 The system shall require confirmation prompts for Quit and both Restart actions to prevent accidental loss of progress.
4.	GAM-MENU-004 The system shall preserve user settings (SFX on/off, reduced motion) in localStorage.
9.5 Audio (Simple Synth SFX Only)
1.	GAM-AUD-001 The system shall include simple synth sound effects only (e.g., shoot, hit, shield break, power-up pickup, menu confirm/cancel) and shall not include a background music loop in MVP.
2.	GAM-AUD-002 The system shall provide a Settings toggle for SFX On/Off and persist it in localStorage.
3.	GAM-AUD-003 The system shall ensure SFX playback is rate-limited to avoid clipping (e.g., max 8 simultaneous voices) and shall prioritize critical cues (player hit > shield break > shoot).
9.4 Accessibility
1.	GAM-A11Y-001 The system shall provide a Reduced Motion toggle that reduces starfield speed, disables intense screen flashes, and switches fireworks to low-motion particle fades.
2.	GAM-A11Y-002 The system shall avoid conveying critical information by color alone (e.g., telegraphs also use shape/animation).
3.	GAM-A11Y-003 The system shall support browser zoom up to 200% without HUD overlap by using responsive layout anchors.
Acceptance Criteria (UI/UX & Accessibility)
•	AC-MENU-001 Given the game is paused, When the player selects Restart Current Level, Then a confirmation prompt appears requiring explicit confirm to proceed.
•	AC-A11Y-001 (Edge) Given Reduced Motion is enabled, When the player wins Level 10, Then the fireworks use low-motion effects and do not include rapid flashing.
10. Endgame Celebration (Level 10 Completion)
UX Flow: Upon defeating the final enemy/boss in Level 10, the game transitions to an Endgame Celebration state. The playfield fades to a darker vignette, the HUD collapses to a compact final score panel, and a centered headline displays “Congratulations”. Fireworks (vector particle effects) render above the starfield for 6 seconds, then the screen presents two primary actions: Replay (starts Level 1 immediately) and Main Menu. A Skip prompt is shown after 1 second (text: “Press Enter to skip”). Reduced Motion mode replaces fireworks with slower, low-flash bursts and fewer particles.
10.1 Functional Requirements
1.	GAM-WIN-001 The system shall display the text “Congratulations” after the player completes Level 10.
2.	GAM-WIN-002 The system shall play a fireworks animation/effect for 6 seconds (or until skipped) while preventing any gameplay input from affecting entities (Endgame state is non-interactive except skip/menu).
3.	GAM-WIN-003 The system shall provide a Skip option available after 1 second, triggered by Enter (or Space) to transition immediately to the end-state menu.
4.	GAM-WIN-004 The system shall present an end-state menu with options: Replay (Level 1) and Main Menu.
5.	GAM-WIN-005 The system shall respect Reduced Motion setting by lowering particle counts and eliminating rapid flashes during fireworks.
10.2 Acceptance Criteria (Endgame)
•	AC-WIN-001 Given the player defeats the final enemy in Level 10, When the final kill is registered, Then the Endgame Celebration state appears with “Congratulations” and fireworks begin within 500ms.
•	AC-WIN-002 Given fireworks are playing and 1 second has elapsed, When the player presses Enter, Then fireworks stop and the Replay/Main Menu choices appear immediately.
•	AC-WIN-003 (Edge) Given fireworks are playing, When the player presses Esc, Then the system shall not open the pause menu (pause disabled in Endgame state) and shall instead ignore the input or treat it as “back” only after the end-state menu appears.
11. Technical Requirements
11.1 Recommended Stack & Rationale
•	Frontend: TypeScript + Vite (or equivalent bundler) + HTML5 Canvas 2D.
•	Game Loop: requestAnimationFrame with fixed-timestep accumulator (e.g., 60Hz simulation) for deterministic physics and consistent pause behavior.
•	Backend: Static hosting only (no gameplay server). Assets served by Nginx in-container.
•	DevOps: Docker multi-stage build: Node build stage → Nginx runtime stage.
•	Rationale: Canvas 2D supports crisp vector-style rendering via procedural drawing; TypeScript improves maintainability; Nginx simplifies TLS termination and static delivery.
11.2 Localhost Hosting & Ports
1.	TECH-HOST-001 The system shall be accessible on localhost via HTTPS at https://localhost:${HTTPS_PORT} (default 443) when run with docker-compose.
2.	TECH-HOST-002 The system shall optionally expose HTTP at http://localhost:${HTTP_PORT} (default 80) for redirect to HTTPS.
3.	TECH-HOST-003 The container shall bind only to localhost by default (compose publishes ports to 127.0.0.1) to avoid unintended LAN exposure.
11.3 Performance Targets
1.	TECH-PERF-001 The system shall sustain 60 FPS on a mid-range laptop (2021+), measured with Level 10 active and maximum enemies/projectiles configured.
2.	TECH-PERF-002 The system shall keep main-thread frame time under 16.7ms for 95th percentile frames in Level 6 and under 20ms in Level 10.
3.	TECH-PERF-003 The system shall cap total active entities (enemies + projectiles + particles) and degrade gracefully by reducing non-critical particles (star density, fireworks particles) first.
4.	TECH-PERF-004 The system shall keep JS heap usage under 200MB after 20 minutes of play and avoid unbounded allocations (object pools recommended for projectiles/particles).
11.4 Browser Support Matrix
Browser	Minimum Version	Status
Chrome	Last 2 major	Supported
Edge	Last 2 major	Supported
Firefox	Last 2 major	Supported
Safari (macOS)	Current major	Best-effort (no mkcert auto-trust in some setups; document fallback)
11.5 Save/State (localStorage) & Reset Behavior
1.	TECH-SAVE-001 The system shall persist the following in localStorage: reduced motion setting, SFX on/off, top 10 scores, and last completed level (for display only; not used to continue a run).
2.	TECH-SAVE-002 The system shall keep an in-memory run state (current level, lives, score, active power-ups) that resets transient entities on Restart Current Level and on Quit to Main Menu; Restart Current Level preserves the current lives value.
3.	TECH-SAVE-003 The system shall reset progression to Level 1 and reset score to 0 on “Restart from Level 1”.
1.	TECH-SAVE-005 The system shall preserve the current lives count on “Restart Current Level”.
2.	TECH-SAVE-006 The system shall reset lives to 3 on “Restart from Level 1”.
4.	TECH-SAVE-004 The system shall clear transient entities (enemies, projectiles, pickups, particles) when restarting any level.
Acceptance Criteria (Save/State)
•	AC-SAVE-001 Given the player is on Level 5 with score 12,000, When the player selects Restart Current Level and confirms, Then Level 5 restarts with score preserved (12,000), lives preserved at the current value, and all power-ups cleared and transient entities removed.
•	AC-SAVE-002 Given the player is on Level 5 with score 12,000 and lives = 1, When the player selects Restart from Level 1 and confirms, Then the run restarts at Level 1 with score reset to 0 and lives reset to 3, and local leaderboard remains unchanged.
•	AC-SAVE-003 (Negative) Given the player quits to Main Menu, When the player returns to Start Game, Then the prior run state is not resumed and a new run starts at Level 1.
12. Docker & Local HTTPS Requirements
12.1 Dockerfile Requirements
1.	DEVOPS-DKR-001 The system shall provide a Dockerfile that builds the frontend assets in a Node build stage and serves the final static bundle from an Nginx runtime stage.
2.	DEVOPS-DKR-002 The Dockerfile shall set a non-root user in the runtime stage where feasible, or document why root is required.
3.	DEVOPS-DKR-003 The runtime image shall contain an Nginx config that supports HTTPS, HTTP→HTTPS redirect, and serving static files with correct cache headers (no-cache for index.html, long-cache for hashed assets).
12.2 docker-compose Requirements
1.	DEVOPS-CMP-001 The system shall include a docker-compose.yml that builds and runs the game container and publishes HTTPS and optional HTTP ports to 127.0.0.1 only.
2.	DEVOPS-CMP-002 The compose file shall mount a host folder containing TLS certificates into the container at /certs (read-only).
3.	DEVOPS-CMP-003 The compose file shall support environment variables via a .env file, including: HTTPS_PORT, HTTP_PORT, TLS_CERT_PATH, TLS_KEY_PATH, ENV (dev/prod), LOG_LEVEL.
4.	DEVOPS-CMP-004 The system shall provide a sample .env.example documenting defaults and required values.
12.3 Certificate Generation & Mounting (Localhost HTTPS)
Preferred approach (warning-free where feasible): Use a local developer CA workflow (e.g., mkcert) to create a locally-trusted certificate for localhost and 127.0.0.1, then mount the generated cert/key into the container and configure Nginx to use them. mkcert creates a local CA and installs it into the OS/browser trust store, enabling browsers to trust localhost certs without warnings on many setups.
1.	DEVOPS-TLS-001 The system shall document a certificate generation workflow that produces a certificate valid for localhost and 127.0.0.1 and installs a trusted local CA where feasible (recommended: mkcert).
2.	DEVOPS-TLS-002 The system shall require the following files to be present on the host for HTTPS mode: fullchain.pem (or cert.pem) and privkey.pem (or key.pem) and shall mount them into the container at /certs.
3.	DEVOPS-TLS-003 The system shall allow cert/key paths to be configured via env vars (TLS_CERT_PATH, TLS_KEY_PATH) and default to /certs/localhost.pem and /certs/localhost-key.pem.
4.	DEVOPS-TLS-004 The system shall provide a fallback self-signed certificate generation script for environments where mkcert is unavailable; the script shall clearly state that browsers may show warnings and how to proceed.
5.	DEVOPS-TLS-005 The system shall support running in HTTP-only mode (dev convenience) via ENV var TLS_MODE=http, and shall display a clear in-app banner “HTTP MODE” when not using HTTPS.
12.4 Server Configuration (TLS, Redirects, Headers)
1.	DEVOPS-NGX-001 The system shall configure Nginx to terminate TLS using TLS 1.2+ and the mounted certificate/key files.
2.	DEVOPS-NGX-002 The system shall redirect HTTP to HTTPS (301) when TLS_MODE=https and HTTP_PORT is exposed.
3.	DEVOPS-NGX-003 The system shall set security headers suitable for local hosting (e.g., X-Content-Type-Options: nosniff) while keeping a permissive policy for local static assets; no CORS is required unless future APIs are added.
4.	DEVOPS-NGX-004 The system shall serve index.html with Cache-Control: no-store and hashed assets with Cache-Control: public, max-age=31536000, immutable.
12.5 Troubleshooting (Common Localhost Cert Issues)
•	TLS-TRBL-001 Browser still warns: Ensure the local CA is installed/trusted (mkcert -install) and that the cert includes SANs for localhost and 127.0.0.1.
•	TLS-TRBL-002 Wrong hostname: Use https://localhost (not container name). Regenerate cert if accessing via a different hostname.
•	TLS-TRBL-003 Port conflicts: Change HTTPS_PORT/HTTP_PORT in .env and re-run docker compose up.
•	TLS-TRBL-004 Permissions: Cert/key files must be readable by the container; mount /certs as read-only and ensure file permissions allow read.
•	TLS-TRBL-005 Safari quirks: If warnings persist on Safari, document the fallback (accept warning) or use HTTP mode for local play.
12.6 Acceptance Criteria (Docker & HTTPS)
12.7 Windows Desktop Launch Icon (Optional Convenience)
Goal: Provide a one-click Windows Desktop icon that (1) starts the Docker Compose stack, (2) waits for the localhost web endpoint to become ready, and (3) opens the game URL in the user’s default browser using the correct scheme (https preferred) and port.
12.7.1 Functional Requirements
1.	DEVOPS-WIN-001 The system shall provide a Windows launcher script (scripts\launch-arcade-ufo.ps1) that runs docker compose up -d from the repository root (expected working directory is set by the Desktop shortcut “Start in” field; see DEVOPS-WIN-007) and returns a non-zero exit code on failure.
2.	DEVOPS-WIN-002 The launcher script shall determine the target URL using env vars consistent with docker-compose (.env): (a) TLS_MODE (https|http), (b) HTTPS_PORT, (c) HTTP_PORT, and shall build the URL as https://localhost:${HTTPS_PORT} when TLS_MODE=https, otherwise http://localhost:${HTTP_PORT}.
3.	DEVOPS-WIN-003 The launcher script shall wait for the target port to become reachable for up to 60 seconds before opening the browser, using Test-NetConnection -ComputerName localhost -Port <port> (or equivalent TCP readiness check).
4.	DEVOPS-WIN-004 The launcher script shall open the URL in the user’s default browser using Start-Process <url> and shall not require the user to copy/paste the URL.
5.	DEVOPS-WIN-005 The launcher script shall be idempotent: if the Compose stack is already running, it shall not error and shall still open the browser after readiness is confirmed.
6.	DEVOPS-WIN-006 The system shall provide a Windows shortcut definition for a Desktop icon named Arcade UFO (Local) whose Target is PowerShell and whose arguments run the launcher script with execution policy bypass (example: powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\launch-arcade-ufo.ps1).
7.	DEVOPS-WIN-007 The shortcut shall set Start in (working directory) to the repository root at C:\Users\aaron\OneDrive\Documents\GitHub\ahogancamp_portfolio\Projects\Production Project\UFO_Arcade_Game so relative paths (docker-compose.yml, .env, scripts\) resolve correctly.
8.	DEVOPS-WIN-008 The system shall document manual steps to create the shortcut (.lnk) in Windows (MVP) and may optionally include a helper script (scripts\create-desktop-shortcut.ps1) that generates the .lnk via WScript.Shell COM automation.
9.	DEVOPS-WIN-009 The launcher script shall provide clear console output for: Docker not installed, Docker Desktop not running, port in use, missing TLS certs, and readiness timeout; it shall suggest next actions (e.g., run docker compose logs, switch TLS_MODE=http).
12.7.2 Implementation Notes (Non-Executable Guidance)
•	Port readiness check: Use Test-NetConnection with the configured port; treat TcpTestSucceeded=true as ready.
•	Open browser: Use Start-Process with the URL string to invoke the default browser.
•	Compose orchestration: docker compose cannot launch host apps directly; use a host script to start Compose, wait for readiness, then open the browser.
•	Shortcut mechanics: A .lnk can call powershell.exe with script arguments; optional helper can create the shortcut via WScript.Shell CreateShortcut() (COM). 
12.7.4 Auto-Shutdown on Browser Close (Compose Down)
Design note: Reliably shutting down Docker when “the user is done” requires a lifecycle signal. For Windows MVP, the launcher script shall create a dedicated browser instance/window for Arcade UFO, capture its process handle, and run docker compose down after that browser process exits. This is best-effort; users who close a tab but keep the window open will keep the stack running until the window closes.
1.	DEVOPS-WIN-010 The launcher script shall open Arcade UFO in a dedicated browser window and capture the resulting process object (PID) so it can detect when the session ends.
2.	DEVOPS-WIN-011 When the dedicated browser process exits (user closes window or browser crashes), the launcher script shall execute docker compose down (or docker compose down --remove-orphans) to stop containers and release local resources.
3.	DEVOPS-WIN-012 The launcher script shall implement shutdown in a finally block (or equivalent) to ensure compose down runs even if errors occur after startup.
4.	DEVOPS-WIN-013 The launcher script shall allow opt-out via env var AUTO_DOWN_ON_BROWSER_CLOSE=false (default true) for developers who want containers to remain running.
5.	DEVOPS-WIN-014 The launcher script shall avoid killing unrelated browser instances; it shall only monitor and act on the process it started.
6.	DEVOPS-WIN-015 The system shall document browser-launch options: Option A (Recommended): Microsoft Edge “app mode” (dedicated window) if available; Option B: Chrome new window using a dedicated profile directory to ensure a distinct process.
7.	DEVOPS-WIN-016 The launcher script shall use PowerShell process APIs to wait for browser process termination (e.g., Wait-Process or polling HasExited) and shall not busy-wait (sleep ≥ 500ms).
12.7.3 Acceptance Criteria (Windows Launch Icon)
•	AC-WIN-007 Given AUTO_DOWN_ON_BROWSER_CLOSE=true and the launcher opened a dedicated browser window, When the user closes that window, Then the launcher runs docker compose down and containers are stopped within 15 seconds.
•	AC-WIN-008 (Edge) Given the browser process crashes unexpectedly, When the process exits, Then docker compose down is still executed (finally behavior) and does not hang.
•	AC-WIN-009 (Negative) Given the user has other browser windows open, When the Arcade UFO window closes, Then only the Docker Compose stack is stopped and no unrelated browser processes are terminated.
•	AC-WIN-001 Given Docker Desktop is running and the repository contains docker-compose.yml and .env, When the user double-clicks the “Arcade UFO (Local)” desktop shortcut, Then docker compose up -d runs successfully, the script waits until the configured port is reachable, and the default browser opens to the correct localhost URL.
•	AC-WIN-002 Given TLS_MODE=https and HTTPS_PORT=443, When the shortcut is run, Then the browser navigates to https://localhost:443 (or https://localhost if port elision is supported) and the game loads.
•	AC-WIN-003 (Edge) Given the Compose stack is already running, When the user runs the shortcut again, Then the script does not fail and still opens the browser after confirming readiness.
•	AC-WIN-004 (Negative) Given Docker Desktop is not running, When the user runs the shortcut, Then the script exits with a clear error message indicating Docker is unavailable and does not open a browser tab.
•	AC-WIN-005 (Negative) Given the configured HTTPS_PORT is already in use by another process, When the user runs the shortcut, Then the script reports the port conflict and suggests changing HTTPS_PORT/HTTP_PORT in .env, and does not loop indefinitely.
•	AC-WIN-006 (Edge) Given TLS certs are missing and TLS_MODE=https, When the user runs the shortcut, Then the script fails fast consistent with AC-TLS-002 and prints the same remediation steps (provide certs or switch TLS_MODE=http).
•	AC-TLS-001 Given valid localhost certs are present in the host cert folder and mounted into /certs, When the user runs docker compose up, Then the game loads at https://localhost without certificate warnings on browsers that trust the local CA.
•	AC-TLS-002 (Edge) Given the cert files are missing, When the container starts in TLS_MODE=https, Then the container fails fast with a clear log message indicating missing TLS_CERT_PATH/TLS_KEY_PATH.
•	AC-TLS-003 (Fallback) Given TLS_MODE=http, When the user opens http://localhost, Then the game loads successfully and shows an “HTTP MODE” banner.
13. Telemetry & Logging (Local)
Privacy note: Telemetry is local-only and off by default; no network transmission. Logs can be written to console and optionally to a local file in the container.
1.	TELEM-001 The system shall support a TELEMETRY_ENABLED flag (default false) to enable local event logging.
2.	TELEM-002 When enabled, the system shall log: game start/end, level start/complete, pause/resume, deaths, power-up pickups/expiry, and final win event.
3.	TELEM-003 The system shall not include any PII in logs; only timestamps and gameplay values.
14. Security & Privacy
1.	SEC-001 The system shall run fully locally and shall not make outbound network calls by default (no analytics beacons, no CDNs).
2.	SEC-002 The system shall pin dependency versions (package-lock.json/pnpm-lock.yaml) and recommend automated vulnerability scanning (e.g., npm audit in CI) as a build check.
3.	SEC-003 The system shall use least-privilege container settings where feasible (read-only cert mount, no privileged mode).
4.	SEC-004 The system shall not store sensitive information; only local game settings and scores are persisted.
15. Quality / QA Plan
15.1 Test Matrix
Area	Tests
Input	WASD diagonals; key rollover; Space hold; pause toggle (Esc/P); menu navigation repeat; hotkeys Q/R/1 with confirmations.
Pause	Freeze movement, AI, projectiles, spawn timers, telegraphs, power-up timers; resume continuity.
Combat	Collision accuracy; shield break; damage multipliers; enemy firing patterns and telegraphs.
Power-ups	Spawn rate caps; stacking/replacement; refresh timers; end-of-level pickup handling; pause freeze.
Progression	Level complete triggers; Level 1 enemy count ≥10; Level 10 win flow; restart semantics.
Rendering	Vector crispness under scaling; starfield performance; reduced motion.
Docker/HTTPS	Compose up; cert mount; HTTP redirect; failure on missing certs; HTTP-mode banner.
15.2 Pause Menu Epic — Requirements & Acceptance Criteria
1.	GAM-PAUSE-001 The system shall freeze all gameplay simulation when paused, including: player/enemy movement, enemy AI state, projectile motion, collision processing, spawn timers, telegraph timers, combo timers, and power-up timers.
2.	GAM-PAUSE-002 The system shall render a pause menu overlay with options: Resume, Quit to Main Menu, Restart Current Level, Restart from Level 1.
3.	GAM-PAUSE-003 The system shall support confirmation dialogs for Quit and Restart actions with default focus on “Cancel”.
4.	GAM-PAUSE-004 The system shall clear transient state on any restart (projectiles, pickups, particles) and shall reset timers to level start values; Restart Current Level shall preserve the current lives value, while Restart from Level 1 shall reset lives to 3.
Acceptance Criteria (Pause Menu)
•	AC-PAUSE-001 Given the player is mid-level with enemy projectiles in flight, When the player presses Esc to pause, Then all projectiles stop moving immediately and remain stationary until resume.
•	AC-PAUSE-002 Given a power-up timer shows 4.2s remaining, When the player pauses for 10 seconds, Then the timer remains at 4.2s upon resume.
•	AC-PAUSE-003 Given the game is paused and the player has lives = 2, When the player selects Restart Current Level and confirms, Then the level restarts, enemies respawn per level spec, lives remain at 2, and no prior projectiles/pickups persist.
•	AC-PAUSE-004 (Negative) Given the confirmation dialog is open, When the player presses Esc, Then the dialog closes without taking the destructive action and returns focus to the pause menu.
15.3 Performance Testing
1.	QA-PERF-001 QA shall run a stress scenario (Level 10, max enemies, sustained fire, max particles) for 5 minutes and verify FPS does not drop below 45 on target hardware.
2.	QA-PERF-002 QA shall verify no memory growth trend (<10% heap increase) over a 20-minute loop of Level 8 replay.
16. Milestones & Delivery Plan
Milestone	Scope	Exit Criteria
MVP (Week 1–2)	Core loop, Level 1–3, enemy fire + shields, pause menu, Docker run (HTTP), basic HUD	Playable on localhost; pause freezes; Level 3 completable
Alpha (Week 3)	Levels 1–10 table-driven, power-ups + timers, scoring + local leaderboard	All 10 levels playable; no critical bugs; core AC pass
Beta (Week 4)	HTTPS localhost workflow, polish VFX, reduced motion, performance pass	HTTPS works with mkcert where feasible; perf targets met
Release (Week 5)	Final tuning, documentation, regression suite	All acceptance criteria green; docker compose up documented
17. Risks & Mitigations
•	RISK-001 Local HTTPS certificate friction: Some environments/browsers may still warn. Mitigation: Provide mkcert workflow + fallback self-signed + HTTP mode banner; fail-fast logs when certs missing.
•	RISK-002 Input latency / key rollover differences: Mitigation: Use event-driven key state map; add QA tests for multi-key holds; debounce menu navigation.
•	RISK-003 Performance under projectile spam: Mitigation: Object pooling; cap entities; reduce non-critical particles first; optimize collision via spatial hashing grid.
•	RISK-004 Determinism for QA vs randomness for fun: Mitigation: Seeded RNG in dev mode; production uses entropy seed; log seed when telemetry enabled.
18. Open Questions
•	OQ-001 Confirm whether Level 10 boss is mandatory or optional. (Current PRD: included; confirm desired experience.)
•	OQ-003 Should we add a dev-only level select menu for QA beyond seed control?
•	OQ-004 Do we want to add optional mouse aiming support post-MVP?
Hard Constraints Compliance Checklist
•	✅ Runs locally on localhost and displays correctly in a modern browser (Sections 11–12).
•	✅ Fully Docker-containerized with Dockerfile, docker-compose, and env var requirements (Section 12).
•	✅ HTTPS on localhost with certificate generation + mounting workflow (mkcert/dev CA) and documented fallback behavior (Section 12.3–12.5).
•	✅ Controls: WASD movement and Space fires (Section 6).
•	✅ Pause toggle (Esc/P) freezes movement, enemy AI, projectiles, timers incl. power-up timers and shows pause menu with required options + confirmations (Sections 6, 9.3, 15.2).
•	✅ Top-down arcade shooter perspective with free 2D movement (Sections 2, 5).
•	✅ Vector-based graphics with dark-space starfield + neon accents (Section 9.1).
•	✅ Enemies shoot back with patterns, telegraphs, and collision damage rules (Section 7.3).
•	✅ Enemy shields scale linearly by level with explicit base/increment and Level 1–10 table (Section 7.4).
•	✅ Exactly 10 levels with measurable difficulty knobs and required computed fire-rate values (Section 8.1).
•	✅ Level 1 starts with ≥10 enemies (Section 8.1).
•	✅ Win celebration after Level 10 shows “Congratulations” with fireworks and clear end-state (Section 10).

