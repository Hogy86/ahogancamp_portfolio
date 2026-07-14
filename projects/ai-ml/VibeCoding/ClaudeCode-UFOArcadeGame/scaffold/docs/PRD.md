# Product Requirements Document — Vanguard vs. Sentinels: Shield Invaders

**Stage:** 2 — Product Manager (PRD)
**Date:** 2026-07-06
**Author:** product-manager subagent
**Status:** v1 — revised after ui-ux-designer round-1 FAIL
(`docs/ux/design-review-round1.md`, 2026-07-06). All six open questions (Q1-Q6)
are resolved with the owner; see §Open Questions for the recorded decisions and
audit history. All seven blocking UX findings (B1-B7) and the four non-blocking
recommendations (N1-N4) are now closed via new/amended acceptance criteria —
see §UX Round-1 Resolution Log for the traceability from each finding to the AC
that closes it. Ready for ui-ux-designer round-2 re-review (pipeline step 3).

**Sources (upstream):**
- `docs/market/voice-of-customer.md` (player segments A-D, competitive gaps)
- `docs/market/market-goals-and-use-cases.md` (goals B1-B4, P1-P5; use cases UC1-UC7)
- Owner product brief (authoritative functional spec, quoted inline where load-bearing)
- Owner decisions on Q1-Q6 (2026-07-06), recorded in §Open Questions
- `docs/ux/design-review-round1.md` (round-1 findings B1-B7, N1-N4), closed per §UX Round-1 Resolution Log

**Theme note (owner decision Q4):** The product uses **fully original, generic
characters** to eliminate IP exposure — the hero is **Vanguard** (an original
shield-throwing soldier/hero) and the enemies are **Sentinel** robots. There is
no Marvel licensing, and no Marvel names, likenesses, or trademark-adjacent
visual motifs are used. Earlier drafts referenced a licensed superhero-vs-robot
theme; that framing has been dropped by owner decision.

**Terminology:** "player" is used throughout instead of "user"; "run" = one
full playthrough attempt from level 1; "level" = one formation-clear stage
(max 10); "Vanguard" = the player character; "Sentinel" = an enemy robot.

---

## Summary

A browser-based, single-player 2D arcade shooter reskinning the classic Space
Invaders formula with an original **Vanguard vs. Sentinels** theme. The player
controls Vanguard — a shield-throwing hero — at the bottom of the screen, moving
left/right and throwing an infinite supply of shields upward at formations of
Sentinel robots that advance and fire lasers back. The game is finite (10
levels), with an escalating difficulty curve, catchable power-up drops, a simple
on-screen score, a 3-lives fail model, and a pause menu that respects short,
interruptible sessions. It runs entirely client-side in the browser with no
install, no account, and near-instant load.

The product's differentiator is not the shooter loop itself (which is
commoditized — see voice-of-customer §3) but the combination of an instantly
legible original hero premise (UC6), a felt difficulty curve to a finite endgame
(UC3, UC5), and a catchable power-up layer (UC4) that gives returning-genre
players a reason to pick this over the dozen identical clones — while the fully
original characters keep the project free of licensed-IP exposure.

---

## Target Users (from market/voice-of-customer.md)

Four player segments, all served by a single-session, keyboard-only browser build:

| Segment | Who | Primary need this PRD must satisfy |
|---|---|---|
| **A — Nostalgic arcade replayer** | Played Space Invaders/Galaga historically; casual "kill 5 minutes" impulse | Familiar formation-shooter rhythm intact + visible novelty (theme, power-ups, escalation) |
| **B — Superhero/action casual fan** | Drawn by the shield-throwing-hero premise, not genre loyalty; casual habits | Instant legibility, no manual; the shield-throw *is* the hook; satisfying power fantasy |
| **C — Skill-chaser / completionist** | Plays to beat games; keyboard-precise; wants a finish line | A visible finite ceiling (10 levels) and a legible escalating curve worth mastering |
| **D — Time-boxed casual** | Has 3-10 minutes; values instant load + instant restart above all | Sub-3s load, one-line controls, a pause that actually pauses and a fast restart |

*(Segment B was described in the market doc as a casual fan drawn by a superhero
premise; with the generic re-theme, the underlying pain — no free, instant,
browser-native "be a shield-throwing hero for two minutes" experience — is served
by the original Vanguard premise rather than a licensed character. The segment's
need is unchanged; only the framing that draws them shifts from a licensed hook
to an original one.)*

---

## Goals & Success Metrics (from market/market-goals-and-use-cases.md)

These are the market-doc metrics the features below are designed to move.
Instrumentation mechanism (console/localStorage counters vs. none) is deferred
to solution-architect / data-storage-architect per the market doc; the PRD only
requires that the listed events be *observable*.

**Business:** B1 replay rate ≥30%; B2 level-1 completion ≥60%; B3 sessions
reaching level 5+ ≥15%; B4 page-load-to-first-input ≤3s.

**Player:** P1 load-to-first-throw ≤10s no external instructions; P2 100% of
pause events resume/exit without lost in-level progress; P3 ≥80% of playtesters
correctly rank-order 3 levels by difficulty; P4 ≥50% of dropped power-ups
caught; P5 ≥90% of level-10 finishers report a deliberate ending.

*(Note: "B1-B4" here are the business **goals** from the market doc. The UX
review's blocking findings are also labelled "B1-B7" — those are a separate
namespace. This PRD keeps the market-goal labels for goals and refers to UX
findings only as "UX-B1..UX-B7" inside the §UX Round-1 Resolution Log to avoid
collision.)*

---

## Use Cases (prioritized)

Carried forward from market-goals-and-use-cases.md §2, with PRD feature mapping:

| Rank | Use Case | Segments | Realized by Feature(s) |
|---|---|---|---|
| UC1 | Pick up and play within seconds using only arrow keys + space, no tutorial | A,B,C,D | F1, F2, F9 |
| UC2 | Pause mid-session via Esc and resume exactly, or exit cleanly | D + all | F6 |
| UC3 | Experience visibly escalating challenge across levels | C,A | F4, F5 |
| UC4 | Catch a falling power-up for a temporary or permanent advantage | A,C,B | F7 |
| UC5 | Reach a definitive final level (10) with a clear end state | C,A | F5, F8 |
| UC6 | Instantly recognize the shield-hero vs. robots premise without narrative setup | B,A | F9 |
| UC7 | Restart a level or the whole game from pause without page reload | D,C | F6 |

---

## Features

### F1 — Player movement (Vanguard)
Traces to: UC1, goals P1, B4. Brief: "Arrow keys move the player left/right."

- Description: The player character (Vanguard) occupies the bottom of the
  playfield and moves horizontally only. Left arrow moves left, right arrow moves
  right. Movement is bounded by the left and right edges of the playfield.

**Acceptance Criteria:**
1. Pressing and holding the Left arrow moves the player left at a constant base
   speed; pressing and holding Right moves right at the same base speed.
2. The player cannot move past the left or right playfield boundary (position is
   clamped; no wrap-around, no leaving the visible area).
3. When no movement key is held, the player is stationary (no drift/inertia
   beyond at most one frame of deceleration).
4. Input-to-visible-movement latency is ≤100 ms at the target frame rate (see
   NFR-2).
5. Simultaneous opposing keys (Left+Right held) result in no net horizontal
   movement (they cancel), not undefined behavior.

### F2 — Shield throw (attack)
Traces to: UC1, UC6, goal P1. Brief: "space bar throws the shield"; "Player has
infinite shields (no ammo limit / no cooldown implied beyond throw animation
pacing)."

- Description: Pressing space throws a shield projectile that travels upward from
  the player's position and damages the first Sentinel it collides with. The
  player has unlimited shields; the only limiter on throw frequency is the throw
  animation/pacing, not an ammo count or explicit cooldown.

**Acceptance Criteria:**
1. Pressing space spawns a shield projectile at the player's current position
   that travels straight up at a constant speed.
2. There is no ammo counter and no hard cooldown UI; the player may throw
   repeatedly, gated only by the throw animation pacing interval — **minimum 250 ms
   between throws** (owner-confirmed) so a single hold/mash does not spawn one
   projectile per frame.
3. A shield that collides with an enemy applies exactly one hit of damage to that
   enemy (damage amount = current hit power, see F7) and is then removed from play.
4. A shield that reaches the top of the playfield without hitting anything is
   removed from play (no infinite accumulation of live projectiles).
5. A shield collides with and is consumed by at most one enemy per throw (unless a
   hit-power/multiplier power-up explicitly changes this — see F7 AC).

### F3 — Enemy formation & movement (Sentinel robots)
Traces to: UC1, UC3, goal P3. Brief: "Enemies move in formation patterns, like
classic Space Invaders."

- Description: Sentinel robots are arranged in a grid formation that moves as a
  block horizontally, steps down and reverses direction on reaching a screen edge
  (classic Space Invaders behavior), and advances toward the player over time.

**Acceptance Criteria:**
1. Enemies spawn in a rectangular grid formation at level start (rows × columns
   per the level table in F4).
2. The formation moves horizontally as a unit; on any enemy reaching a screen
   edge, the whole formation steps down by one row-height and reverses horizontal
   direction.
3. Formation horizontal speed increases as fewer enemies remain alive within the
   same level (classic "speed-up as you clear them" behavior): speed scales
   inversely with remaining enemy count so the last enemy moves noticeably faster
   than a full formation.
4. Destroyed enemies leave gaps; the formation does not re-flow to fill them
   (positions are fixed within the formation).
5. When the formation's lowest living enemy reaches the player's row, the
   game-over condition triggers (see F8; precedence with the lives=0 condition is
   defined in F8 AC8).
6. **(Closes UX-B7 — warning before instant loss.)** Before the terminal
   "formation reached the player's row" loss (AC5), the game displays a visible
   **danger/approach warning state** once the formation's lowest living enemy
   crosses a defined warning threshold (one row above the player's row). The
   warning is conveyed by a non-color-only signal (e.g. a pulsing edge/border plus
   a shape or text cue, consistent with NFR-9) so first-time players (segments
   B/D) get at least one clear beat of notice before the instant loss, while the
   loss rule itself (AC5) is unchanged. **PM default, pending owner sign-off — Q7:**
   a warning state is added rather than relying on genre familiarity alone; see
   Open Questions Q7 for the rationale and the owner's veto path if strict
   genre-purity (no warning) is preferred.

### F4 — Difficulty: enemy hit points per level
Traces to: UC3, UC5, goals P3, B3. Brief specifies levels 1-3 exactly; the
levels 4-10 curve below was proposed by the PM and **approved as-is by the owner
(Q1)**.

- Description: Enemy toughness (hit points) scales across levels. Levels 1-3 are
  fixed by the brief. Levels 4-10 follow the owner-approved progression below.

Brief-mandated (fixed, not negotiable):
- **Level 1:** every enemy dies in one hit.
- **Level 2:** only the boss requires two hits; all other enemies one-hit.
- **Level 3:** half the enemies are one-hit, half are two-hit.

**Owner-approved full 10-level progression table (Q1):**

| Level | Formation (rows × cols) | Regular-enemy HP mix | Boss HP | Formation speed multiplier | Enemy fire-rate multiplier | Guaranteed power-up drops |
|---|---|---|---|---|---|---|
| 1 | 4 × 6 (24) | all 1-hit | (no boss) | 1.0× | 1.0× (base, slow) | 1 |
| 2 | 4 × 6 (24) | all 1-hit | 2 | 1.1× | 1.3× | 1 |
| 3 | 4 × 7 (28) | 50% 1-hit / 50% 2-hit | 3 | 1.2× | 1.6× | 1 |
| 4 | 5 × 7 (35) | 40% 1-hit / 60% 2-hit | 4 | 1.35× | 2.0× | 1 |
| 5 | 5 × 7 (35) | 25% 1-hit / 50% 2-hit / 25% 3-hit | 5 | 1.5× | 2.4× | 1 |
| 6 | 5 × 8 (40) | 50% 2-hit / 50% 3-hit | 6 | 1.65× | 2.8× | 1 |
| 7 | 5 × 8 (40) | 40% 2-hit / 60% 3-hit | 7 | 1.8× | 3.3× | 1 |
| 8 | 6 × 8 (48) | 25% 2-hit / 50% 3-hit / 25% 4-hit | 8 | 2.0× | 3.8× | 1 |
| 9 | 6 × 8 (48) | 50% 3-hit / 50% 4-hit | 9 | 2.2× | 4.4× | 1 |
| 10 | 6 × 9 (54) | 40% 3-hit / 60% 4-hit + tougher boss | 12 | 2.5× | 5.0× | 1 |

Design rationale: HP, formation size, formation speed, and enemy fire rate all
rise monotonically so the curve is *felt* (satisfying P3/B3 and UC3), while no
single level more than roughly doubles the prior level's pressure, so the ramp
reads as escalation rather than a difficulty wall. Multipliers are relative to
level 1's base values (which solution-architect/code-implementer will tune to
concrete pixel-speeds and millisecond fire intervals). "Fire-rate multiplier"
means enemies fire this many times as often as the level-1 baseline — this is the
mechanism for the brief's "enemy shooting cadence ... ramps up as levels
progress."

**Acceptance Criteria:**
1. Level 1: 100% of enemies are destroyed by a single shield hit at base hit power.
2. Level 2: exactly one enemy (the boss) requires 2 hits; every other enemy
   requires 1 hit.
3. Level 3: 50% (±1 enemy for odd counts) of enemies require 2 hits; the rest
   require 1 hit.
4. Levels 4-10: enemy HP distribution, formation size, formation speed multiplier,
   and enemy fire-rate multiplier match the owner-approved progression table above.
5. Each level's difficulty parameters are strictly ≥ the prior level's on HP mix,
   formation size, speed, and fire rate (monotonic escalation — no level is easier
   than the one before it).
6. An enemy requiring N hits visibly reflects damage state between hits (e.g. a
   damage/shape/animation change, not color alone per NFR-9) so the player can tell
   a 2-hit enemy took one hit — required for the escalation to be legible (P3).

### F5 — Level progression & enemy fire cadence
Traces to: UC3, UC5, goals P3, P5, B3. Brief: "Difficulty scales across levels,
capped at 10 levels total"; "Enemy shooting cadence starts much slower than the
player's throwing cadence and ramps up as levels progress"; "Max 10 levels for
this v1."

- Description: The game is exactly 10 levels. Clearing all enemies in a formation
  advances to the next level. Enemy fire rate starts far below the player's
  effective throw rate and increases each level per F4's fire-rate multiplier.

**Acceptance Criteria:**
1. A level is cleared when all enemies in its formation are destroyed; clearing a
   level advances to the next level (up to 10).
2. At level 1, the aggregate enemy fire cadence is much slower than the player's
   max throw cadence: total enemy shots-per-second at level 1 ≤ 25% of the
   player's max throw rate, so a new player is not overwhelmed (P1/B2).
3. Enemy fire cadence increases each level per F4's fire-rate multiplier and never
   decreases between consecutive levels.
4. There is no level 11; clearing level 10 triggers the win/end state (F8), not a
   loop or an infinite wave.
5. A visible level indicator shows the current level (1-10) at all times during
   play (supports UC3/UC5 legibility and P3).

### F6 — Pause menu (Esc)
Traces to: UC2, UC7, goals P2, B4. Brief: "Esc pauses the game with options:
restart level, restart game, quit (close tab)."

- Description: Pressing Esc during play freezes all game state and shows a pause
  overlay with three options plus an explicit resume: Resume, Restart Level,
  Restart Game, Quit. Resuming continues exactly where the player left off within
  the level.

**Acceptance Criteria:**
1. Pressing Esc during active play immediately freezes all motion (player, enemies,
   projectiles, power-ups, timers) and displays the pause overlay.
2. The pause overlay presents exactly these labeled options: **Resume**, **Restart
   Level**, **Restart Game**, **Quit**. (Owner-confirmed: an explicit Resume option
   is included alongside the brief's three options, plus resume via pressing Esc
   again, so pausing to step away and coming back has an obvious exit — satisfying
   P2/UC2.)
3. Selecting **Resume** (or pressing Esc again) continues the level from the exact
   frozen state with no loss of in-level progress (enemy positions, remaining
   enemies, active power-up timers, score) — this is a correctness bar for P2 (100%).
4. Selecting **Restart Level** restarts the current level from its start state
   without reloading the page.
5. Selecting **Restart Game** returns to level 1 fresh (all permanent power-up
   stacking and score reset) without reloading the page.
6. Selecting **Quit** attempts to close the tab; where the browser blocks
   programmatic tab-close, it instead returns to a start/title screen and clearly
   ends the run. (Owner-confirmed: browsers generally do not allow `window.close()`
   on tabs the script did not open, so a title-screen fallback is the specified
   behavior.)
7. Active power-up timers (F7) are paused while the game is paused and resume with
   the remaining duration intact — no power-up time is lost or gained by pausing.
8. **(Closes UX-B1 — Esc on non-play screens.)** On any screen that is NOT active
   play — specifically the title/start screen, the Game Over screen (F8 AC4), and
   the Victory screen (F8 AC6) — pressing Esc is a **silent no-op**: it does not
   open the pause overlay, does not throw an error, and produces no partial overlay
   or visible glitch. (The pause overlay is only ever reachable from active play,
   per AC1.)
9. **(Closes UX-B2 — Quit fallback must explain the blocked tab-close.)** When
   `window.close()` is blocked and the title-screen fallback (AC6) is used, the
   fallback screen must display **explicit visible text** communicating that the
   run has ended and the tab could not be closed automatically — e.g. "Run ended —
   you may now close this tab." — so a player who clicked Quit is not left with a
   bare screen indistinguishable from first load and does not read Quit as broken.
10. **(Closes UX-N1 — pause-menu keyboard navigation.)** The four pause-menu
   options are fully keyboard-operable with no mouse required: the player can move
   the selection with Up/Down arrow keys and confirm with Enter (mouse/click may
   also be supported but is not required), consistent with NFR-5's keyboard-only
   framing. The currently selected option is visibly highlighted (non-color-only
   per NFR-9).
11. **(Closes UX-N3 — guard on the destructive Restart Game.)** Because Restart
   Game (AC5) discards a whole run's progress including any stacked permanent
   multiplier, selecting it presents a lightweight confirmation step (a
   confirm/cancel prompt, or a visually distinct warning-colored treatment plus a
   second confirm) before the reset executes; Restart Level (AC4), being far less
   costly, does not require confirmation.

### F7 — Power-ups (catchable drops)
Traces to: UC4, goal P4. Brief specifies four power-ups, catch-to-activate, and
at least one drop per level.

- Description: On enemy death, a random enemy per level drops a power-up that falls
  toward the player. The player must catch it (collide with it) to activate; an
  uncaught power-up falls off-screen with no effect. Four power-up types exist.

Power-up types (from brief, verbatim intent):
- **5× Hit Power** — hit power ×5 for 8 seconds (temporary).
- **3× Speed** — player movement speed ×3 for 8 seconds (temporary).
- **Indestructible Shield** — player is invulnerable for 8 seconds (temporary).
- **Permanent Hit-Power Multiplier** — current hit power ×1.8, stacks, permanent
  for the rest of the run.

**Acceptance Criteria:**
1. In every level, at least one power-up is guaranteed to drop, from a randomly
   selected enemy at the moment it dies. (Owner-confirmed: additional random drops
   beyond the guaranteed one are allowed at a low probability to keep the catch
   mechanic frequent enough to hit P4's ≥50% caught — starting default extra-drop
   chance 10% per enemy death, capped so drops don't flood the screen. **(UX-N4)**
   This 10% figure is a **tunable balance default** to be validated against the P4
   ≥50%-caught target during playtesting; adjusting it within a reasonable range to
   hit P4 is routine tuning and does NOT by itself constitute an AC violation
   requiring a PRD amendment. The acceptance-gated requirement is "≥1 guaranteed
   drop per level" plus "the caught-rate target P4 is met," not the specific 10%.)
2. A dropped power-up falls downward from the enemy's death position at a constant
   speed.
3. A power-up activates its effect only when the player collides with (catches) it;
   an uncaught power-up that reaches the bottom of the playfield is removed with no
   effect applied.
4. **5× Hit Power:** while active, each shield hit applies 5× the current hit power;
   effect lasts exactly 8 seconds (paused during pause per F6 AC7), then reverts.
5. **3× Speed:** while active, player horizontal movement speed is 3× base for
   exactly 8 seconds, then reverts.
6. **Indestructible Shield:** while active, enemy lasers passing through the player
   deal no damage / cost no life for exactly 8 seconds, then reverts; the player is
   visibly distinguished as invulnerable during this window (non-color-only per
   NFR-9).
7. **Permanent Hit-Power Multiplier:** on catch, current hit power is multiplied by
   1.8 permanently for the rest of the run; multiple catches stack multiplicatively
   (e.g. two catches = base ×1.8×1.8 = ×3.24); reset only on Restart Game or a new run.
8. Temporary effects of the same type refresh rather than stack duration:
   catching a second temporary power-up of the same type while one is active resets
   its timer to a full 8 seconds rather than running two overlapping instances
   (owner-confirmed).
9. Interaction rule: the temporary 5× Hit Power multiplies whatever the current
   (possibly permanently-boosted) hit power is, so temporary and permanent
   multipliers compose (permanent ×1.8 stacks × temporary ×5 = ×9 that hit's damage).
10. **(Closes UX-B4 — permanent-multiplier visibility.)** The player's current
   permanent hit-power state is shown on-screen so the effect is legible and
   attributable rather than requiring the player to remember every past catch
   across a 10-level run. At minimum: (a) a persistent HUD readout of the current
   permanent multiplier (e.g. "Power ×3.24" or an equivalent stack-count icon), and
   (b) a distinct catch-moment feedback (a brief on-catch confirmation, e.g. the
   readout flashing/incrementing) so each permanent catch is a perceptible event
   (also supports P4 catch-rate perceptibility). The HUD readout follows the HUD
   legibility requirement in NFR-9.
11. **(Closes UX-B5, part — active-temporary-effect visibility.)** While any
   temporary power-up (5× Hit Power, 3× Speed, Indestructible Shield) is active, a
   visible indicator communicates that it is active and, where practical, its
   remaining duration, so the player can recognize their current buffed state
   (recognition over recall). This complements the specific invulnerability-
   visibility requirement in AC6.

### F8 — Player lives, damage, and end states
Traces to: UC5, goals P5, B2. The brief did not specify lives or a fail condition;
the model below was proposed by the PM and **approved as-is by the owner (Q3)**.

- Description: Defines what happens when an enemy laser hits the player, how a run
  ends in failure, and how a run ends in victory (clearing level 10).

**Owner-approved lives & fail model (Q3):**
- Player starts a run with **3 lives**.
- Being hit by an enemy laser (while not invulnerable per F7) costs **1 life** and
  briefly respawns the player with short invulnerability to avoid instant
  multi-hit death.
- The run ends in **Game Over** when either (a) lives reach 0, or (b) the enemy
  formation's lowest living enemy reaches the player's row (classic "invaders
  reached the bottom" loss — F3 AC5).
- Clearing level 10 ends the run in **Victory** with a deliberate end/win screen
  (satisfying P5's "deliberate conclusion, not a cutoff").

**Acceptance Criteria:**
1. The player starts each run with 3 lives, shown on a visible lives indicator
   (HUD legibility per NFR-9).
2. An enemy laser hitting a non-invulnerable player reduces lives by exactly 1.
3. When the player has invulnerability active (F7 Indestructible Shield or
   post-hit respawn i-frames), an enemy laser deals no life loss.
4. Reaching 0 lives ends the run in a Game Over state with a clear message and an
   option to restart (Restart Game / return to title, consistent with F6).
5. The formation reaching the player's row ends the run in Game Over regardless of
   remaining lives (F3 AC5).
6. Clearing level 10 ends the run in a distinct Victory/win state — visibly
   different from Game Over — that reads as a deliberate conclusion (P5).
7. On Game Over or Victory, the player can start a fresh run without reloading the
   page.
8. **(Closes UX-B3 — simultaneous end conditions precedence.)** If both terminal
   conditions become true in the same frame/tick — lives reaching 0 (AC4) and the
   formation reaching the player's row (AC5) — the game resolves to a **single,
   deterministic Game Over** with **one unified Game Over message**; it must not
   flicker between, queue, or display two competing end-state variants. (The chosen
   precedence is: both map to the same "Game Over" outcome, so the practical rule is
   "show exactly one Game Over screen." Victory is only reachable by clearing level
   10 and cannot co-occur with a loss condition, since clearing the formation means
   no enemy remains to reach the player's row.)
9. **(Closes UX-B5 — post-hit invulnerability duration + visibility.)** After a
   life is lost (AC2), the player is granted a **post-hit invulnerability window of
   1.5 seconds (tunable default)** during which enemy lasers deal no life loss
   (consistent with AC3), and the player is **visibly distinguished as invulnerable**
   for the full window (e.g. a blink/flash or aura, non-color-only per NFR-9) — with
   the same visibility intent as the Indestructible Shield power-up (F7 AC6), so the
   two invulnerability sources are legible in a consistent way. The 1.5 s value is a
   tunable default subject to playtesting, not a locked constant.

### F9 — Theme, presentation & first-run legibility
Traces to: UC1, UC6, goals P1, B4. Owner decision Q4: fully original, generic
theme (Vanguard vs. Sentinels) — no licensed IP.

- Description: The **Vanguard vs. Sentinels** premise is communicated visually with
  zero narrative setup, and controls are legible within seconds. Vanguard is an
  original shield-throwing hero (a soldier/hero archetype) and the enemies are
  original Sentinel robots. All art is fully original with no references to any
  licensed characters.

**Acceptance Criteria:**
1. The player character reads as **Vanguard**, an original shield-throwing hero,
   and the enemies read as **Sentinel** robots, communicated purely visually with
   no required reading (UC6, segment B).
2. **(Amended to close UX-B6 — remove the untestable "self-evident" fallback.)**
   The controls are conveyed by a **single always-present line of on-screen text**
   at the start of play (e.g. "← → move · Space throw · Esc pause"). The prior
   "or self-evident with no text" alternative is removed, because "self-evident"
   is not testable and the one-line text is cheap, minimalist, and guarantees the
   P1 legibility bar is verifiable. The line must be legible per NFR-9 and must be
   present at least until the player's first shield throw (it may then fade so it
   does not clutter the playfield).
3. From page load, the player can make their first shield throw within 10 seconds
   without consulting any external instructions (P1) and reach first controllable
   input within 3 seconds on a typical broadband connection (B4). Because AC2 now
   guarantees the one-line control text is present, this metric is verifiable in
   usability testing (a first-time player has the controls on-screen and needs no
   external manual).
4. **IP/legal constraint (hard requirement, decided — Q4):** all shields, robots,
   character art, names, and logos must be **fully original designs** with **no
   licensed (Marvel or other) names, likenesses, or trademark-adjacent visual
   motifs**. Specifically: the hero is named Vanguard and the enemies are Sentinels;
   the shield must be a **distinct original design** and must NOT use a
   red-white-blue concentric-star motif or any callback strong enough to read as a
   specific trademarked hero's shield; enemy robots must not replicate any
   trademarked robot character's model or silhouette. No third-party wordmarks,
   logos, or character likenesses may appear anywhere in the product. This is a
   binding constraint on all downstream asset work (not contingent on any pending
   decision).

### F10 — On-screen score (session score)
Traces to: UC3, UC5, goals P5, B3; serves segment C's "screenshot a high score"
motivation. Owner decision Q2: add a simple on-screen session score (approved).

- Description: A running numeric score is displayed on-screen during play. Points
  are awarded per enemy destroyed (scaled by current level) and as a bonus for
  catching power-ups. The score is session-only — there is no leaderboard, no
  cross-session persistence, and no online high-score table (leaderboards remain
  out of scope).

**Acceptance Criteria:**
1. A numeric score is visible on-screen at all times during active play, starting
   at 0 at the beginning of each run (HUD legibility per NFR-9).
2. Destroying an enemy increases the score; the points awarded per kill scale with
   the current level (higher levels award more per kill), so score reflects progress
   depth (supports B3/UC5 "reached level N" signal).
3. Catching a power-up (F7) awards a bonus point amount added to the score.
4. The score resets to 0 on Restart Game and on starting any fresh run; it is
   preserved across level transitions within a single run.
5. The score is displayed on the Game Over and Victory end screens (F8) so the
   player sees their final run total (supports P5's deliberate-conclusion feel).
6. The score is **session-only**: it is not written to a leaderboard and is not
   required to persist beyond the current run/tab (no backend, consistent with
   NFR-7).

---

## Non-Functional Requirements

| # | Requirement | Target | Traces to |
|---|---|---|---|
| NFR-1 | Load time — page load to first controllable input | ≤3 s on typical broadband | B4, segment D |
| NFR-2 | Frame rate | Sustained 60 FPS on a mid-range laptop; never drop below 30 FPS during a full formation | UC1 feel, P1 |
| NFR-3 | Input latency | ≤100 ms key-press to on-screen response (movement and throw) | F1 AC4, UC1 |
| NFR-4 | Browser compatibility | Latest 2 versions of Chrome, Firefox, Edge, Safari (desktop) | Reach across segments A-D |
| NFR-5 | Platform / controls | Desktop keyboard only (arrow keys, space, Esc, plus Up/Down + Enter for menu navigation per F6 AC10); no mobile/touch, no gamepad required for v1 | Brief; F6 AC10; out-of-scope in market doc §3 |
| NFR-6 | No install / no account | Runs from a single URL with no login wall, no account creation, no download | Segments B, D; B4 |
| NFR-7 | Offline of backend | Fully client-side; no server dependency required to play a full run | Market doc §1 "no backend by default" |
| NFR-8 | Instrumentation hooks | Emit the events needed to observe the market goals B1-B4/P1-P5 (session start, level reached, run restart, power-up caught) via lightweight client-side counters (console/localStorage) | Market doc §1 measurement note; mechanism deferred to architecture stage |
| NFR-9 | Accessibility (baseline) — game & HUD legibility | (a) No essential info conveyed by color alone — enemy damage state (F4 AC6), invulnerability states (F7 AC6, F8 AC9), the formation danger warning (F3 AC6), and pause-menu selection (F6 AC10) all use shape/animation/text in addition to color. (b) **(Closes UX-N2.)** All persistent HUD elements — score (F10), lives (F8 AC1), level indicator (F5 AC5), and permanent-multiplier readout (F7 AC10) — must maintain sufficient contrast against the game background at all times, including over dynamic/moving background art (e.g. via a backing panel, outline, or reserved HUD band) so no HUD text becomes situationally unreadable. | F4 AC6, F5 AC5, F6 AC10, F7 AC6/AC10, F8 AC1/AC9, F10; P3; UX-N2 |
| NFR-10 | Asset/IP constraint (decided) | All art, names, and logos fully original per F9 AC4 — no licensed (Marvel or other) names, likenesses, or trademark-adjacent motifs; Vanguard/Sentinels original designs only. **Hard requirement, not contingent.** | F9, Q4 |

---

## Out of Scope (v1)

- Leaderboards, score-sharing, or online/cross-session high-score tables — note the
  in-run score in F10 is session-only and explicitly does NOT include these (market
  doc §3; owner decision Q2).
- Portal submission/distribution packaging (market doc §3).
- Mobile / touch controls and gamepad support (brief specifies keyboard; market
  doc §3).
- Multiplayer or any networked play.
- Persisting progress across browser sessions / save-and-continue-later (a run is
  a single session; pause/resume is within-session only per F6/P2).
- Levels beyond 10; endless/wave modes.
- Multiple playable characters or enemy factions beyond the Vanguard-vs-Sentinels
  premise.
- Any use of licensed IP (Marvel or other), names, likenesses, or trademarked
  motifs (owner decision Q4 — this is explicitly excluded).
- Sound design is **not explicitly required by the brief**; treated as an optional
  nice-to-have, not a v1 acceptance-gated feature (owner decision Q6).

---

## Open Questions

**Q1-Q6 RESOLVED with the owner (2026-07-06). Q7 is a new PM default arising from
the UX round-1 review, applied so as not to block architecture, and flagged for
owner sign-off (does not block ui-ux-designer round-2 re-review).** Per
traceability-conventions, the audit history of what was proposed and why is
preserved rather than deleted.

| # | Question | PM recommendation (as proposed) | Resolution / Status |
|---|---|---|---|
| Q1 | Exact difficulty progression for levels 4-10 (HP mix, formation size, speed, fire rate) | The 10-level table in **F4** — monotonic escalation, no level more than ~2× the prior's pressure | **RESOLVED — Approved as-is.** F4 table kept exactly as proposed. |
| Q2 | Is there a score/points system, or purely level-clear? | Add a simple session-only score (points per kill scaled by level; bonus for power-ups caught; on-screen; no leaderboard) | **RESOLVED — Approved.** Added as confirmed feature **F10**; leaderboards remain out of scope. |
| Q3 | Player lives & game-over/fail condition (brief silent) | 3 lives; laser hit = -1 life with brief i-frames; Game Over at 0 lives OR formation reaches player row; Victory on clearing level 10 (F8) | **RESOLVED — Approved as-is.** F8 confirmed exactly as proposed. |
| Q4 | IP & character-likeness risk (fan project using licensed superhero/robot IP) | Treat art/names/logos as original stylized designs inspired by the theme; escalate to a generic re-theme if publicly distributed | **RESOLVED — Owner chose option (b): full generic re-theme.** Hero → **Vanguard** (original shield-hero); enemies → **Sentinel** robots. No licensed names, likenesses, or trademark-adjacent motifs; distinct original shield design required (no red-white-blue star callback). Reflected throughout the PRD; NFR-10 & F9 AC4 are now hard requirements, not contingent. |
| Q5 | Throw pacing, resume-option explicitness, tab-close fallback, same-type power-up refresh (smaller mechanics) | Defaults: F2 AC2 (250 ms min throw interval), F6 AC2 (explicit Resume option), F6 AC6 (title-screen fallback), F7 AC8 (same-type refresh resets timer) | **RESOLVED — No objection; all accepted as confirmed.** Corresponding ACs updated to owner-confirmed language. |
| Q6 | Is sound/music expected for v1? (brief silent) | Optional nice-to-have, not acceptance-gated; note browser autoplay requires a user gesture | **RESOLVED — No objection; kept optional, not acceptance-gated.** |
| Q7 | **(New, from UX round-1 finding UX-B7.)** Should the "formation reached the player's row" instant loss have a warning state, or rely on genre familiarity (classic Space Invaders gives no warning)? | **PM default: add a one-row-early danger/approach warning (F3 AC6).** Rationale: segment A (nostalgic) already expects instant loss and is unharmed by a warning, but segments B/D (casual/first-time) have no genre mental model and a no-warning instant loss is a first-time-player trap that works against B2 (level-1 completion ≥60%) and the "session-respecting" positioning. The warning is low-cost and reversible in design. **Owner veto path:** if the owner prefers strict genre-purity (no warning), F3 AC6 is removed and the rationale recorded as "no warning, by design, matches genre convention" — either way the decision is now on record (which is the minimum UX-B7 required). Not blocking; architecture can proceed on the default. | **OPEN — PM default applied (warning added); flagged for owner sign-off.** |

---

## UX Round-1 Resolution Log

Maps each finding in `docs/ux/design-review-round1.md` to the PRD change that
closes it (per traceability-conventions — the round-1 file itself is retained
unchanged as the audit trail; this log is how round-2 verifies closure). "UX-Bn"
/ "UX-Nn" labels disambiguate from the market-goal "Bn" labels.

| Finding | Type | Closed by | How resolved |
|---|---|---|---|
| UX-B1 | Blocking | **F6 AC8** | Esc is a silent no-op on title/Game Over/Victory screens; no partial overlay, no error. |
| UX-B2 | Blocking | **F6 AC9** | Blocked-tab-close fallback must show explicit text ("Run ended — you may now close this tab") so Quit doesn't read as broken. |
| UX-B3 | Blocking | **F8 AC8** | Simultaneous lives=0 and formation-reaches-row resolve to a single deterministic Game Over with one unified message; no flicker between variants. |
| UX-B4 | Blocking | **F7 AC10** | Permanent hit-power multiplier now has a persistent HUD readout + distinct on-catch feedback; legible/attributable in the moment. |
| UX-B5 | Blocking | **F8 AC9** (+ F7 AC11) | Post-hit i-frames given a concrete tunable duration (1.5 s) and a visible-distinction requirement matching F7 AC6's precedent; temporary-effect visibility generalized in F7 AC11. |
| UX-B6 | Blocking | **F9 AC2/AC3 (amended)** | Removed the untestable "self-evident" fallback; mandated a single always-present one-line control text, making the P1 10-second bar verifiable. |
| UX-B7 | Blocking | **F3 AC6** + **Q7** | Added a one-row-early danger/approach warning as a PM default; decision recorded and flagged for owner sign-off (Q7), satisfying UX-B7's "decision on record, not silence" minimum. |
| UX-N1 | Non-blocking | **F6 AC10** | Pause menu is keyboard-navigable (Up/Down + Enter), selection visibly highlighted. |
| UX-N2 | Non-blocking | **NFR-9(b)** | HUD contrast requirement added for score/lives/level/multiplier over dynamic backgrounds. |
| UX-N3 | Non-blocking | **F6 AC11** | Confirmation guard added on the destructive Restart Game (not on Restart Level). |
| UX-N4 | Non-blocking | **F7 AC1 (note)** | Clarified the 10% extra-drop rate is a tunable default validated against P4, not a locked AC. |

---

## Traceability check

Every feature (F1-F10) cites the use case(s) (UC1-UC7) and goal(s) (B1-B4/P1-P5)
it realizes, and every use case is covered by at least one feature (see Use Cases
table). Brief-mandated specifics (movement/throw controls, infinite shields,
Esc-pause options, formation movement, levels 1-3 HP rules, the four power-ups,
catch-to-activate, ≥1 drop/level, 10-level cap) are each rendered as at least one
testable acceptance criterion. Owner decisions Q1-Q6 are resolved and reflected
inline; Q7 (UX-B7 warning state) is a PM default applied and flagged for owner
sign-off without blocking architecture. All seven blocking UX round-1 findings
(UX-B1..UX-B7) and the four non-blocking recommendations (UX-N1..UX-N4) are
closed with new/amended acceptance criteria, traced in §UX Round-1 Resolution
Log; the round-1 review file is retained unchanged as the audit record per
traceability-conventions.
