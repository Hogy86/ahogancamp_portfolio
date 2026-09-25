# Product Requirements Document — Addendum v2

**Product:** Vanguard vs. Sentinels: Shield Invaders
**Stage:** 2 — Product Manager (PRD addendum, follow-up feature request)
**Date:** 2026-07-07
**Author:** product-manager subagent
**Status:** v2 — FINAL / fully decided. All six original open items (A-F) were
resolved by the owner (see §Open Questions v2). Item C (shield bounce geometry)
was corrected from this document's first draft after the owner reviewed an
implementation plan — the F15 zone table in this document reflects the final,
authoritative geometry. Implementation may proceed on the ACs as written.

**Round-1 UX review resolution (2026-07-07):** `ui-ux-designer`'s round-1 review
of this addendum (`docs/ux/design-review-v2-round1.md`) returned FAIL with eight
blocking findings (B1-B8) and five non-blocking (N1-N5). This document has been
updated to resolve all of them (see the new §Round-1 UX review resolutions
table). Two were genuine feel/design tradeoffs and carry **explicit owner
sign-off**: **B2** (skip the countdown on Restart Level only) and **B3** (add a
lightweight boss-incoming warning cue). The remaining six (B1, B4-B8) were
spec-completeness gaps resolved with product-manager defaults and reflected as
new/amended acceptance criteria below. Status remains **v2 — FINAL**.

**Sources (upstream):**
- `docs/PRD.md` (v1 spec — features F1-F10, NFR-1..NFR-10, this addendum
  continues its F-numbering at F11 and amends specific v1 ACs where noted)
- Owner follow-up feature request (2026-07-07), 9 changes, quoted inline
  where load-bearing (this is the authoritative functional spec for v2)
- `docs/ux/design-review-v2-round1.md` (round-1 UX review of this addendum —
  the source of the B1-B8 / N1-N5 fixes folded in below)
- Owner sign-off (2026-07-07) on round-1 B2 (Restart Level countdown skip) and
  B3 (boss-incoming warning cue)
- Existing v1 implementation, read to ground each addendum item in what
  actually exists rather than the PRD text alone:
  - `src/config/levelConfig.ts` (current per-level HP/boss table)
  - `src/config/constants.ts` (current tunable constants)
  - `src/core/types.ts`, `src/core/world.ts` (current World/entity model,
    current boss spawn)
  - `src/core/GameStateMachine.ts` (state machine + per-screen input dispatch)
  - `src/render/shapes.ts` (current Vanguard/Sentinel/shield art)
  - `src/systems/CollisionSystem.ts`, `src/systems/ProjectileSystem.ts`
    (current shield/laser/collision behavior)
  - `src/systems/PowerUpSystem.ts` (current temporary-effect timer model)

**How this addendum relates to v1:** This is additive/amending, not a
rewrite. Where a v2 feature changes the behavior of an existing v1 AC, the
affected v1 AC is called out explicitly under a **"Supersedes / amends"**
line so the traceability chain stays intact and `code-reviewer` /
`test-validator` know which v1 tests must change. Nothing in v1 is silently
overwritten (per traceability-conventions).

**Terminology (carried from v1):** "player" = the human; "Vanguard" = the
player character; "Sentinel" = an enemy robot; "run" = one full playthrough
from level 1; "level" = one formation-clear stage (max 10). New in v2:
**"boss phase"** = the post-formation-clear single-boss encounter on levels
5 and 10 — it is part of that level, **not** a new level.

---

## Summary of the 9 requested changes → feature mapping

| # | Owner request (short) | Feature | Amends v1 |
|---|---|---|---|
| 1 | Only one temporary power-up active at a time; new catch replaces old with full fresh timer (permanent multiplier exempt) | **F11** | F7 AC4-AC6, AC8 |
| 2 | Boss every 5 levels (5, 10), appears after formation cleared, 5× stronger/larger, boss-unique color | **F12** | F3, F4 (boss column), F5 AC1 |
| 3 | Player avatar humanoid (head/arms/torso/legs), blue & white | **F13** | F9 AC1 (art), shapes.ts |
| 4 | Weapon/shield circular, same blue as avatar | **F14** | F9 AC4 (shield shape), shapes.ts |
| 5 | Shield bounces off enemies per corner/side/direct geometry | **F15** | F2 AC3-AC5 |
| 6 | Shield never hurts player; caught return = extra life; one shield in flight at a time; only enemies deflect it | **F16** | F2 AC1-AC2, AC4; F5 AC2 (metric re-derived) |
| 7 | Enemy avatars humanoid; white + red eyes + red lasers; darker gray = tougher; boss darkest but contrasting | **F17** | F4 AC6 (art), F9 AC1, shapes.ts |
| 8 | 3-second "LEVEL [N]" countdown at each level start; nobody moves/fires; text fades | **F18** | F5 AC1, F6 (pause + Restart Level), NFR-1, F9 AC3 (metric reconciled) |
| 9 | "Game Complete" for 5s with fireworks after final boss, then auto-return to main menu | **F19** | F8 AC6 (Victory), F6 AC8 (Esc no-op on the replaced screen) |

---

## Features (v2)

### F11 — Single active temporary power-up (mutual exclusion)
Traces to: UC4, goal P4. Owner request 1 (verbatim): *"Not including the
permanent power-up multiplier, there can only be one active power up (5x hit
power, 3x speed, indestructible shield) in use at a time. If one is in use
and another is caught, only the new power-up is active with the full time
limit of the new one. Even if the new one caught is of the same type, the old
time limit is removed and the new time limit starts. The time limit is not
cumulative."*

- Description: The three **temporary** power-ups (5× Hit Power, 3× Speed,
  Indestructible Shield) are now **mutually exclusive** — at most one is
  active at any instant. Catching any temporary power-up while another
  temporary effect is active **cancels the current one immediately** and
  starts the newly-caught effect at a full fresh duration, whether or not it
  is the same type. The **Permanent Hit-Power Multiplier is exempt**: it is
  not a timed effect, never blocks or is blocked by the temporary effects,
  and continues to stack per F7 AC7.

**Supersedes / amends:** In v1, `src/systems/PowerUpSystem.ts` tracks three
independent timers (`hitPowerRemaining`, `speedRemaining`, `shieldRemaining`)
that can run **simultaneously**, and F7 AC8 says a same-type catch "refreshes"
its own timer. F11 replaces that model: the World holds **one** active-temporary
slot (type + remaining time), not three parallel timers. F7 AC4, AC5, AC6 still
define what each effect does and its 8-second base duration; F7 AC8 (same-type
refresh) is **superseded** by F11 AC3 (any catch replaces the active slot). F7
AC9 (temporary × permanent hit-power composition) is unchanged — the permanent
multiplier still composes with an active 5× Hit Power.

**Acceptance Criteria:**
1. At most one of {5× Hit Power, 3× Speed, Indestructible Shield} is active at
   any given time; it is never possible for two temporary effects to be active
   in the same frame.
2. Catching a temporary power-up while **no** temporary effect is active
   activates it for a full 8-second duration (per F7 AC4-AC6).
3. Catching a temporary power-up while a **different-type** temporary effect
   is active immediately deactivates the current effect (its remaining time is
   discarded) and activates the newly-caught effect for a full 8-second
   duration.
4. Catching a temporary power-up of the **same type** as the currently-active
   effect discards the old remaining time and restarts that effect at a full
   8-second duration (net: the timer is reset to 8 s, never summed —
   confirming the owner's "not cumulative" rule). This is behaviorally the
   same net result as v1's F7 AC8 refresh for the same-type case; F11 only
   additionally handles the cross-type replacement case.
5. The **Permanent Hit-Power Multiplier** (F7 AC7) is unaffected by this rule:
   catching it never cancels an active temporary effect, and having a
   temporary effect active never blocks or alters a permanent-multiplier
   catch. The permanent multiplier has no timer and cannot occupy the single
   temporary slot.
6. The active-temporary-effect indicator (F7 AC11) shows exactly the one
   active effect and its remaining duration; on replacement it switches to the
   new effect's type and full duration in the same frame the new power-up is
   caught (no stale/overlapping indicators).
7. Pausing (F6 AC7) still preserves the single active effect's remaining
   duration exactly; replacement semantics are unchanged by a pause.
8. **(Round-1 B7 — error prevention under F11's mutual-exclusion rule.)** The
   four power-up types (5× Hit Power, 3× Speed, Indestructible Shield, and the
   Permanent Hit-Power Multiplier) are **visually distinguishable from one
   another while still falling**, before the catch collision — each has a
   distinct icon/shape, differentiated by more than color alone (non-color-only
   per NFR-9). Because F11 AC3 now makes catching a *different-type* temporary
   power-up an active **downgrade** (it cancels the current effect's remaining
   time — the first time a catch can hurt the player), the player must be able
   to identify an incoming drop's type in time to choose whether to catch or
   dodge it, rather than being blindsided by an involuntary replacement. (In v1
   any catch was a net gain, so this distinction was low-stakes; under F11 it is
   an error-prevention requirement.)

### F12 — Boss encounters on levels 5 and 10 (post-clear boss phase)
Traces to: UC3, UC5, goals P3, P5, B3. Owner request 2 (verbatim): *"Every 5
levels (i.e. level 5, level 10) should contain a boss enemy that is 5x stronger
than the strongest enemy on the same level. This boss should appear only after
all of the other enemies are destroyed on that level, but the boss appearance
should not be considered a different level. It should also be 5x larger than
the other enemies (of the same shape) and should be a different color than the
other enemies unique to bosses."*

- Description: On levels **5 and 10 only**, after the entire regular formation
  is cleared, a **single boss Sentinel** appears and must be destroyed to
  complete the level. The boss is not a new level — the level indicator stays
  on 5 (resp. 10) throughout the boss phase. The boss is **5× the hit points**
  of the toughest regular enemy on that level, **5× the linear size** of a
  regular enemy of the same humanoid shape (F17), and rendered in a
  **boss-unique color** distinct from the regular enemies (see F17 AC5 for the
  exact color treatment). Defeating the level-5 boss advances to level 6;
  defeating the level-10 boss triggers the end sequence (F19).

- **Boss-incoming warning (owner decision, round-1 B3):** To avoid the boss
  materializing on the exact frame the last regular enemy dies — which reads as
  an ambush and undercuts UC3's "visibly escalating challenge" and P3's
  difficulty-legibility — the boss phase opens with a **brief, lightweight
  warning cue** that is deliberately **distinct from and much shorter than
  F18's 3-second level intro**. After the last regular enemy is destroyed, a
  short (~1.75-second) signal plays — a **screen-edge flash and a brief "BOSS
  INCOMING" text** — after which the boss spawns and becomes active. This is
  intentionally **not** a full game-freezing 3-second countdown: it is a
  lightweight telegraph so the boss spawn and the level-start intro never read
  as the same mechanic.

**Supersedes / amends — IMPORTANT (Item A, RESOLVED — confirmed by owner):**
The v1 `levelConfig.ts` has a `bossHp` value baked into **every** level 2-10
(2, 3, 4, 5, 6, 7, 8, 9, 12), and `world.ts` `spawnFormation` embeds that boss
as a single tougher enemy **inside** the starting formation (center of the
bottom row). That does **not** match the new request (a boss only on 5 and 10,
appearing only **after** the formation is cleared). **Resolution:** the new
post-clear boss mechanic **replaces** the old embedded-boss concept entirely:
- Levels **1, 2, 3, 4, 6, 7, 8, 9** have a formation of **only regular
  enemies** drawn from that level's `hpMix` — **no embedded boss at all**.
- Levels **5 and 10** have a regular-only formation **plus** a new post-clear
  boss phase per this feature.
This changes v1's **F4 "Boss HP" column** (the 2-12 values) — those values are
retired except as an input to the "toughest regular enemy" formula in AC2
below. It also amends F3 (a boss phase has a single non-formation enemy) and
F5 AC1 (a level with a boss is cleared only after the boss is destroyed, not
when the formation is empty).

**Acceptance Criteria:**
1. A boss phase occurs on **level 5 and level 10 only**; levels 1-4 and 6-9
   have no boss at any point.
2. The boss's hit points equal **5× the highest regular-enemy HP tier present
   in that level's `hpMix`** (Item B, RESOLVED). Level 5's toughest regular
   tier is 3-hit → **boss = 15 hits**; level 10's toughest regular tier is
   4-hit → **boss = 20 hits**. (Hit power still composes per F7 AC9, so a 5×
   Hit Power or permanent multiplier reduces the number of throws needed
   accordingly — "5× stronger" means 5× the toughest regular enemy's raw hit
   count, not 5× throw count.)
3. The boss appears **only after every regular enemy on that level is
   destroyed** — it is never present in the starting formation and never
   spawns while any regular enemy is still alive. When the last regular enemy
   dies, the boss-incoming warning cue (AC10) plays **before** the boss
   spawns/activates.
4. During the boss phase the **level indicator still reads the same level**
   (5 or 10); the boss phase does not increment the level, does not show a new
   "LEVEL [N]" countdown (F18 applies to level starts only, not the boss
   phase), and does not reset score, lives, or the permanent multiplier.
5. The boss is drawn at **5× the linear dimensions** of a regular enemy of the
   same humanoid shape (F17) — i.e. ~5× width and ~5× height — while remaining
   fully within the playfield and not overlapping the HUD band or reaching the
   player's row at spawn.
6. The boss is rendered in a **boss-unique color** not used by any regular
   enemy, and remains clearly contrasted against the black background per F17
   AC5 (the darkest tier, but never so dark it blends into the background).
7. The boss fires enemy lasers (red, per F17) and moves; defeating it clears
   the level. Defeating the **level-5** boss advances to level 6 (with its F18
   countdown); defeating the **level-10** boss triggers the end sequence (F19),
   not a plain Victory screen.
8. The boss obeys the same terminal-loss rule as the formation (F3 AC5 / F8
   AC5): if the boss descends to the player's row, the run ends in Game Over.
9. The guaranteed power-up drop budget for the level (F7 AC1) is satisfied by
   the regular formation phase; the boss's death **may** additionally drop a
   power-up but is not required to (tunable, does not affect the "≥1 guaranteed
   drop per level" gate).
10. **(Round-1 B3 — owner-approved boss-incoming warning.)** After the last
    regular enemy on a boss level (5 or 10) is destroyed, and **before** the
    boss spawns / becomes active, a **brief boss-incoming warning cue** plays
    for approximately **1.75 seconds** (target range 1.5-2s): a **screen-edge
    flash and/or a brief "BOSS INCOMING" text** shown in a color that clearly
    contrasts with the black background (NFR-9). **(Round-2 C2 —
    semantic-distinctness from the danger-warning cue.)** This boss-incoming
    cue must be **visually distinct from v1's formation-approach danger-warning
    edge cue (F3 AC6)** so a player who has learned levels 1-4's pulsing
    "you-are-about-to-lose" border does not misread the positive boss-escalation
    signal as another loss warning: the boss cue uses a **distinct
    color/treatment** from F3 AC6's danger pulse — e.g. a different hue family
    and a **solid celebratory flash** rather than F3 AC6's pulsing red-danger
    border. (The two cues are already temporally mutually exclusive — F3 AC6
    requires a living, advancing formation while this cue only fires after the
    formation is fully cleared — so they never co-occur; this differentiation is
    about learned meaning, not simultaneous display.) The boss does not spawn,
    move, or fire until this cue completes. This gives the player a fair beat to
    register "level cleared → boss incoming" rather than being blindsided.
11. **(Round-1 B3.)** The boss-incoming cue is **lightweight and visually
    distinct from the F18 "LEVEL [N]" intro** so the two mechanics never read
    as the same thing: it is shorter (~1.75s vs. 3s), it does **not** re-freeze
    the whole game as a level-start intro does, it shows **no** "LEVEL [N]"
    text, and it does **not** increment the level indicator (which stays on 5
    or 10 per AC4). It is a telegraph, not a level start. **(Round-2 obs.)**
    **The player retains full control during the cue** — they may **move and
    throw** the shield throughout the ~1.75s window (the cue is a cosmetic
    warning only, not a freeze; there are simply no regular enemies left for a
    thrown shield to hit yet, and the boss is not yet active). This is
    explicitly **unlike F18's level-start intro, which freezes all player and
    enemy action** — the boss-incoming cue freezes nothing.

### F13 — Player avatar: humanoid Vanguard redesign
Traces to: UC6, goal P1; F9 AC1. Owner request 3 (verbatim): *"The user avatar
should be more humanoid shape with a head, arms, torso, and legs. It should be
an artful combination of blue and white colors."*

- Description: Vanguard is redrawn as a clearly **humanoid** figure with four
  readable body regions — **head, arms, torso, legs** — in an **artful
  combination of blue and white**. This refines F9's "original shield-throwing
  hero" into a specific silhouette and palette.

**Supersedes / amends:** `src/render/shapes.ts` `drawVanguard` currently draws
a triangular torso + helmet-head with a chevron emblem (no distinct arms or
legs). F13 replaces that silhouette. F9 AC4 / NFR-10 (no licensed motifs — no
red-white-blue concentric-star shield callback, original design only) remains a
hard binding constraint on this redesign.

**Acceptance Criteria:**
1. The player avatar visibly renders four distinguishable humanoid regions:
   **head, arms, torso, and legs** (a viewer can point to each).
2. The avatar's palette is a deliberate combination of **blue and white** —
   both colors are clearly present and used as an intentional design (not a
   single flat fill).
3. The exact blue used on the avatar is defined as a **named constant** so the
   shield (F14) can reuse the identical value.
4. The invulnerability visual distinction (F7 AC6 / F8 AC9 — non-color-only
   aura/blink) is preserved on the new humanoid silhouette.
5. The redesign remains fully original per F9 AC4 / NFR-10: no licensed
   likeness, no trademark-adjacent motif, and the blue-and-white palette must
   not be arranged into a red-white-blue star/shield callback.

### F14 — Weapon/shield: circular, avatar-blue
Traces to: UC1, UC6; F2, F9 AC4. Owner request 4 (verbatim): *"The user weapon
(or shield) should be circular and use the same color blue that is on the
user's avatar."*

- Description: The thrown shield projectile is redrawn as a **circle**, filled
  with the **exact same blue** used on the Vanguard avatar (F13 AC3).

**Supersedes / amends:** `src/render/shapes.ts` `drawShield` currently draws a
teal (`#7de0c0`) angular **kite**. F14 replaces the kite with a circle in the
avatar blue. This does not weaken F9 AC4 / NFR-10 — a plain circle is an
original, generic form and explicitly **not** a red-white-blue concentric-star
disc (a plain single-color circle with no concentric rings/stars satisfies the
anti-motif rule; the reviewer should confirm the final art has no star or
concentric-ring detailing).

**Acceptance Criteria:**
1. The shield projectile renders as a **circle** (not the v1 kite shape).
2. The shield's fill uses the **same blue constant** as the Vanguard avatar
   (F13 AC3) — the values are literally identical, not merely similar.
3. The shield remains an original, generic design with **no** concentric
   rings, stars, or any red-white-blue callback (F9 AC4 / NFR-10 upheld). A
   single-color blue disc is acceptable; concentric-star detailing is not.
4. The circular shield's collision radius continues to drive the bounce
   geometry (F15) and catch detection (F16) consistently with how it is drawn
   (drawn radius ≈ collision radius, so bounces read as fair).
5. **(Round-1 N2 — close-range separability at the catch moment.)** The shield
   carries a **thin outline/stroke** — a shape-level distinction, **not** a
   fill-color change, so AC2's identical-blue-fill requirement is upheld — so
   that when a bounced shield closes in on the player for a catch (F16), the
   incoming projectile stays visually separable from the same-blue Vanguard
   avatar (F13 AC3) at close range. Low cost; complements F15 AC9's trail in
   making the catch trackable.

### F15 — Shield bounce geometry (deflection off enemies)
Traces to: UC1, UC4; F2. Owner request 5 (verbatim, geometry rules): *"The user
shield should bounce between enemies … the shield hitting an enemy directly
should make the enemy take the expected damage, and the shield does not bounce
anywhere. Hitting a corner of an enemy will make it bounce at 90 degrees towards
the direction of the side it hit … If the shield hits an enemy directly on the
side and not a corner, it should bounce at 45 degrees halfway between up and the
direction of the side it hit … Hitting an enemy on the top corners with the
shield should act like hitting it on the side and bounce at 45 degree angles
appropriately."*

- Description: A thrown shield now **deflects off Sentinels** instead of being
  consumed on first contact. Every contact still applies exactly one hit of
  damage (current hit power, F7 AC9) to the enemy it touches; whether the
  shield then stops or bounces — and in which direction — is determined by
  **which zone of the enemy's rectangular hitbox** it contacted, per the
  deterministic zone table below.

**Supersedes / amends:** In v1 `CollisionSystem.ts` `resolveShieldHits`, a
shield is deactivated on first enemy contact (`shield.active = false`) and F2
AC3/AC5 say the shield is "removed from play" after one hit. F15 replaces the
"always consumed on hit" behavior with the zone-based bounce/stop model. F2 AC3
(exactly one hit of damage per contact) is **retained** and generalized: each
distinct enemy contact deals one hit; F2 AC4 (despawn at top of screen) is
folded into F16's expanded lifecycle. The shield may now damage **multiple**
enemies across its bounce path (one hit per enemy contact), which supersedes F2
AC5's "at most one enemy per throw."

**Item C — RESOLVED (owner's final correction, authoritative).** Each enemy
hitbox perimeter is divided into **8 zones**, with an absolute-direction
outcome per zone. Directions are absolute screen directions (up = toward the
top of the screen, the direction a freshly-thrown shield travels). After
reviewing an initial implementation plan, the owner corrected the exact
bounce directions from the first draft of this addendum — the table below is
final:

| Contact zone | Outcome | Resulting shield direction |
|---|---|---|
| **Bottom-center** (flat bottom face) | damage + **STOP** (no longer in play, F16) | — (removed) |
| **Top-center** (flat top face) | damage + **STOP** (no longer in play) | — (removed) |
| **Left-center** (flat left face) | damage + bounce **due left** (horizontal) | left |
| **Right-center** (flat right face) | damage + bounce **due right** (horizontal) | right |
| **Bottom-left corner** | damage + bounce **45° down-left** | down-left |
| **Bottom-right corner** | damage + bounce **45° down-right** | down-right |
| **Top-left corner** | damage + bounce **45° up-left** | up-left |
| **Top-right corner** | damage + bounce **45° up-right** | up-right |

Rationale for the final geometry:
- **Top-center and bottom-center both STOP:** the owner's general rule is
  "hitting an enemy *directly* … does not bounce anywhere." Treating **any**
  center-face direct hit (top or bottom) as a stop is the simplest consistent
  reading.
- **Corners bounce diagonally away from the enemy's center through that
  corner; sides bounce purely horizontal (perpendicular to the face hit).**
  This is the owner's corrected model: a bottom-left corner deflects the
  shield down-and-left (continuing past that corner), a top-right corner
  deflects up-and-right, and so on for all four corners — while a side hit
  reflects straight out horizontally, matching the original "hits another
  enemy in the same row" scenario exactly (a horizontally-deflected shield
  travels down a row at that height). The **bottom corners** are what give the
  shield its return-to-player path for the extra-life catch (F16), not the top
  corners as an earlier draft of this addendum proposed.

**On the "another enemy on the same row" sentence** (owner: *"if there is
another enemy on the same row the shield should hit that enemy and bounce back
down towards the user"*): **RESOLVED.** Under the final zone table, a side hit
(left-center/right-center) bounces **purely horizontal**, so a shield
deflected off the side of one enemy travels exactly along that row's height
and will strike a neighboring enemy in the same row — a direct, literal
realization of this sentence, not an illustrative approximation. That second
contact then resolves by its own zone as usual (e.g. a side hit on the second
enemy continues horizontally; a corner hit sends it diagonally).

**Acceptance Criteria:**
1. Every shield-vs-enemy contact applies exactly **one hit** of damage (current
   hit power per F7 AC9) to the contacted enemy, whether the shield then stops
   or bounces.
2. A shield may damage **multiple different enemies** over its lifetime (one
   hit per distinct enemy contact) as it bounces; it deals **at most one hit
   per contact event** (no multi-hit on a single continuous overlap — the
   shield must separate from an enemy before it can damage it again).
3. **Direct center-face hit** (bottom-center or top-center zone): the enemy
   takes damage and the shield **stops / is removed from play** (F16) — it does
   not bounce.
4. **Corner hit** (any of the four corner zones): the enemy takes damage and
   the shield bounces at **45° diagonally, away from the enemy's center through
   that corner** — bottom-left → down-left, bottom-right → down-right,
   top-left → up-left, top-right → up-right.
5. **Side hit** (left-center or right-center zone, not a corner): the enemy
   takes damage and the shield bounces **purely horizontal** (left side → due
   left, right side → due right).
6. Bounce directions are **absolute** (relative to the screen, not to the
   shield's incoming direction) and are applied at the shield's current speed
   magnitude (the shield does not speed up or slow down on a bounce).
7. The zone outcomes are **deterministic**: the same contact zone always
   produces the same outcome, and the zone is classified consistently (the
   contact-classification boundaries — what counts as "corner" vs "side" vs
   "center" — are defined once, e.g. corner zones are the outer N% of each
   edge, and documented in the implementation so tests can assert each zone).
8. The shield **only** deflects off enemy hitboxes — never off screen edges,
   the player, lasers, power-ups, or other shields (reinforced by F16 AC6-AC7).
9. **(Round-1 B4 — bounce-path legibility.)** The in-flight shield renders a
   **short visual trail / afterimage** tracing its recent path, so the player
   can perceive where it just travelled and anticipate its next bounce off a
   fast-moving, small enemy hitbox. The trail is brief (a few recent positions
   / a short fading streak), does not obscure enemies or the HUD, and is a
   rendering aid only — it does **not** change the shield's collision radius
   (F14 AC4) or bounce geometry (AC1-AC8). This is what lets the F16
   catch-for-a-life reward loop read as **skill-based** (a trackable
   projectile) rather than **luck-based**; without it the deterministic zone
   table is invisible to the player in the moment.

### F16 — Shield lifecycle: no self-harm, catch = extra life, one-in-flight
Traces to: UC1, UC4; F2, F8. Owner request 6 (verbatim): *"The user's shield
should not hurt the user, but if the shield bounces back towards the user and
the user catches it, it becomes an extra life for the user. No other shields can
be thrown until the previous shield is no longer in play. The shield is no
longer in play when it exits the screen, when it hits an enemy directly on the
bottom, or when the shield is caught by the user. The shield cannot bounce on
the edge of the screen or on any other object other than the enemy avatars. It
should not be disrupted by a power-up or an enemy laser."*

- Description: Defines the full lifecycle of a thrown shield now that it
  bounces. The shield never damages the player. If a **bouncing** shield
  returns to the player and the player **catches** it (collides with it), the
  player gains **+1 life**. Only **one shield may be in flight at a time** — the
  player cannot throw again until the current shield leaves play. The shield
  leaves play when it (a) exits the screen, (b) makes a **direct center-face
  hit** that stops it (F15 AC3), (c) is caught by the player, or (d) reaches the
  **max-lifetime safety-valve** timeout and auto-despawns (Item E) — the full,
  authoritative list is F16 AC4. The shield is
  inert to everything except enemy hitboxes: screen edges, power-ups, enemy
  lasers, and the player's own body do not deflect or destroy it (the player
  catching it is a capture, not a deflection).

**Supersedes / amends:**
- F2 AC1 (spawn on space) is retained but re-gated: F16 AC3 replaces the F2 AC2
  **250 ms cooldown** as the throw gate (Item E, RESOLVED). In v1
  `ProjectileSystem.ts` `updateThrow` gates on `throwCooldownRemaining`
  (`THROW_INTERVAL_SECONDS = 0.25`); under F16 the gate becomes "is there a
  shield currently in flight?".
- **F5 AC2 (level-1 enemy fire cadence ≤ a fraction of the player's max throw
  rate)** is amended by this same cooldown deletion: deleting the 250 ms cooldown
  removes the fixed constant F5 AC2's “max throw rate” was calibrated against, so
  the original 25% bound no longer maps to any real quantity. Re-derived and
  re-bounded in the dedicated **“Reconciliation with F5 AC2”** note below (modeled
  on F18's NFR-1 / F9 AC3 reconciliation).
- F2 AC4 (despawn at top of screen) is generalized here to "exits the screen on
  **any** edge," because a bounced shield can now leave via the sides or bottom,
  not only the top.
- F8 (lives) gains a **new way to gain a life** (catch), which v1 did not have
  — lives were only ever lost. F8 AC1's "starts with 3 lives" is unchanged; F16
  AC2 adds an increase path.

**Reconciliation with F5 AC2 (throw-rate recalibration — this addendum explicitly
re-derives and amends the numeric bound, it does not silently break it):** v1 F5
AC2 required *“total enemy shots-per-second at level 1 ≤ 25% of the player's max
throw rate, so a new player is not overwhelmed.”* That **25%** was calibrated
against v1's throw mechanic, where “max throw rate” was a single fixed constant:
the reciprocal of the F2 AC2 **250 ms cooldown** = **4 throws/s**. Level-1
aggregate enemy fire is `1 / BASE_ENEMY_FIRE_INTERVAL_SECONDS` = `1/3.2` =
**0.3125 shots/s** (unchanged in v2) — ~**7.8%** of that 4/s ceiling, comfortably
inside 25%.

F16 AC3 **deletes the 250 ms cooldown entirely** and replaces it with the
one-shield-in-flight gate. There is no longer any fixed “max throw rate” constant:
the player can only throw again once the current shield leaves play (F16 AC4), so
the realistic sustainable throw rate is now governed by how long a shield takes to
travel and exit the screen, not by a cooldown. Re-derived from the **actual v2
constants** (verified against `src/config/constants.ts` and
`src/systems/ProjectileSystem.ts`): a shield spawns at `PLAYER_Y = 552` with
`vy = −SHIELD_SPEED = −480 px/s` and `SHIELD_RADIUS = 8`, so an unobstructed
straight-up throw travels `552 + 8 = 560 px` to clear the top edge in
`560 / 480 = 1.1667 s`, giving a sustainable max throw rate of **~0.857 throws/s**
(the frame-stepped measurement in `EnemyFireSystem.test.ts` lands at
`240/281 ≈ 0.854/s`). The unchanged **0.3125 shots/s** of level-1 enemy fire is
therefore **~36.5%** of the new max throw rate
(`0.3125 / 0.857 = 36.5%`; `0.3125 / 0.854 = 36.6%` frame-stepped) — the same
absolute enemy fire, but a much larger fraction of a **4.67×-slower** throw ceiling.

The original 25% bound is therefore **meaningless against the new mechanic** (it was
calibrated to a constant that no longer exists) and the actual ratio (~36.5%) now
**exceeds** it. Rather than silently keep a broken number — or quietly widen it to a
loose round value in a test-file comment, which is what test-writer initially did
(a `<= 50%` bound recorded only in `EnemyFireSystem.test.ts`'s header, never routed
through this addendum) — F5 AC2 is hereby re-derived and amended in the PRD chain:

> **Amended F5 AC2 bound (v2):** at level 1, the aggregate enemy fire cadence
> (shots/s) is **≤ 42% of the player's re-derived max throw rate** (the reciprocal
> of one unobstructed throw-to-screen-exit cycle under the F16 one-in-flight gate),
> so a new player is not overwhelmed (P1/B2). The qualitative intent of v1's F5 AC2
> is unchanged; only the numeric ceiling is recalibrated to the mechanic that
> actually gates throwing in v2.

**Rationale for 42% specifically (numeric, not a round guess):** the real measured
ratio is ~36.5–36.6%; **42%** sits ~15% above it (`0.42 / 0.366 = 1.15`). That
margin is large enough to absorb the ~1-point frame-stepping discretization jitter
between the analytical (36.5%) and simulated (36.6%) measurements plus modest future
tuning, yet **tight enough that the AC still functions as a real ceiling**: a
regression that pushed level-1 aggregate fire above ~1.15× its current value would
fail the test. This preserves v1's qualitative guarantee with a bound that still
**discriminates** — unlike the loose **50%** test-writer picked, which has ~37%
headroom above the measured value, would tolerate the level-1 fire rate climbing to
~1.37× current before catching an overwhelm-the-new-player regression, and leaves
the AC nearly trivially satisfied. `EnemyFireSystem.test.ts`'s assertion is updated
from `<= 0.5` to `<= 0.42` to match this amended bound.

**Traceability:** this is the **same class of reconciliation as F18's
“Reconciliation with NFR-1 / F9 AC3”** note — a v2 feature (here F16's cooldown
deletion) invalidates the calibration basis of a previously-approved v1 numeric
metric, so the metric is explicitly re-derived and amended **in the PRD chain**
rather than left to a test-file comment. It is a spec-completeness / traceability
fix (same tier as the F18/NFR-1 reconciliation and the round-1 B1-B8 defaults), not
a product-direction change, and per this project's gate rules does not require owner
sign-off beyond this record. Flagged by `test-validator`'s v2 validation
(`docs/tests/validation-report-v2.md`, §“F5 AC2 recalibration”).

**Acceptance Criteria:**
1. The thrown shield **never** reduces the player's lives or otherwise
   harms the player under any circumstances (a shield passing over or through
   the player's body has no negative effect).
2. If a shield that is **in flight** collides with the player (the player
   actively catches it, the same collision model as catching a falling
   power-up — the shield overlaps the player's body), the shield is removed
   from play and the player's lives increase by **+1** (Item D, RESOLVED). This
   requires an **actual catch collision**; a shield merely stopping or exiting
   near the player does **not** grant a life. There is no upper cap specified on
   lives from catches.
3. **At most one shield may be in play at any time** (Item E, RESOLVED).
   Pressing throw while a shield is already in flight does nothing — no new
   shield spawns and no throw is queued. The player may throw again only once
   the current shield has left play (per AC4). This **replaces** the F2 AC2
   250 ms cooldown as the sole throw-gating mechanism. (A max-lifetime safety
   valve auto-despawns a still-bouncing shield per Item E, so the player can
   never be permanently locked out of throwing.)
4. A shield leaves play (becomes "no longer in play," re-enabling the next
   throw per AC3) in exactly these cases, and no others:
   (a) it **exits the visible playfield** on any edge (top, left, right, or
   bottom);
   (b) it makes a **direct center-face hit** on an enemy that stops it (F15
   AC3 — bottom-center or top-center);
   (c) it is **caught by the player** (AC2);
   (d) it reaches the **max-lifetime safety-valve** timeout (Item E) and
   auto-despawns.
5. The shield **does not bounce off the screen edges** — reaching any edge
   removes it from play (AC4a), it never reflects off a wall.
6. The shield **does not interact** with power-ups, enemy lasers, other
   shields, or any object other than enemy hitboxes and (for the catch) the
   player: it is not deflected, consumed, blocked, or disrupted by them, and it
   does not damage or block enemy lasers (a laser and the shield pass through
   each other).
7. Being under an active power-up effect (including Indestructible Shield, F7
   AC6) does not alter the thrown shield's flight, bounce behavior, or
   lifecycle (the power-up affects the player/hit-power, not the projectile's
   physics).
8. If the shield is in play when the level ends (formation cleared → boss phase
   or level advance) or the run ends, it is cleared as part of the normal
   level/run reset (consistent with `resetForLevel` clearing `world.shields`),
   and the next throwable state is restored on the next playable level.
9. **(Round-1 B5 — catch-moment feedback, consistent with F7 AC10b.)** At the
   instant the player catches an in-flight shield (AC2), a **distinct
   catch-confirmation cue** fires — a visual flash and/or a brief on-screen text
   such as **"+1 LIFE"** at the catch location — so the life gain is a
   **perceptible, attributable event** tied to the catch action, not just a
   silent one-frame tick of the lives counter (F8 AC1). This mirrors the
   precedent set by F7 AC10b for the permanent-multiplier catch ("a distinct
   catch-moment feedback … so each permanent catch is a perceptible event"),
   keeping catch events legible and attributable across the product.

**UX note (Item E, flagged):** Because the one-shield-in-flight rule (AC3) can
leave a player **unable to attack for several seconds** if their shield
ricochets around the formation, this is a meaningful feel change from v1's
rapid-fire 250 ms throwing. This is the owner's explicit design and is written
as the default; §Open Questions v2 Item E records the tradeoff and the
owner-added max-lifetime safety valve.

### F17 — Enemy avatars: humanoid, white→gray toughness scale, red eyes/lasers
Traces to: UC3, UC6, goal P3; F3, F4 AC6, F9 AC1. Owner request 7 (verbatim):
*"The enemy avatars should be more humanoid shape with a head, arms, torso, and
legs. They should start as a white color with red eyes and shoot red lasers.
The harder the enemy is to destroy, the darker gray the color should be for the
enemy. The bosses should be the darkest colors, but they should still have a
clear contrast between the background black and the boss enemy."*

- Description: Sentinels are redrawn as **humanoid** figures (head, arms, torso,
  legs) with **red eyes**, firing **red lasers**. An enemy's body color encodes
  its toughness on a **white→gray→dark-gray** scale: a 1-hit enemy is white and
  each higher HP tier is a darker gray. Bosses (F12) are the **darkest** tier —
  darker than any regular enemy — while still clearly contrasting against the
  black background.

**Supersedes / amends:** `src/render/shapes.ts` `drawSentinel` currently draws a
blocky robot (orange `#e0955f` base, purple `#b25fe0` boss) that shades **toward
red** as it takes damage. F17 changes both the **silhouette** (blocky → humanoid)
and the **color semantics**: base color now encodes **max toughness
(hitsToKill)**, not damage-taken, and the scale is **white→gray→dark**, not
orange→red. The existing **damage-state visual** requirement (F4 AC6 —
non-color-only change per hit taken, e.g. the crack overlay) is retained and
must remain distinguishable from the toughness-color scale (see AC6/AC9). Enemy
lasers are already red (`#ff5a5a`) in v1 `shapes.ts` `drawEnemyLaser`, so AC4 is
largely already met and just confirmed here.

**Acceptance Criteria:**
1. Each enemy visibly renders four distinguishable humanoid regions: **head,
   arms, torso, and legs**.
2. Every enemy has visible **red eyes**.
3. A **1-hit** (weakest) regular enemy's body base color is **white**; each
   successively tougher regular HP tier (2-hit, 3-hit, 4-hit) is a
   **progressively darker gray**, so a player can rank two regular enemies by
   toughness from their base color alone (supports P3 legibility).
4. Enemies fire **red** lasers (already the case in v1 — confirmed, not
   regressed).
5. The **boss** (F12) uses the **darkest** body color of all — darker than any
   regular enemy — yet retains **clear contrast against the black background**
   (e.g. via a lighter outline, rim light, or minimum-lightness floor) so it is
   never lost against the background. This is the "boss-unique color" of F12
   AC6. **(Round-1 N3:)** The boss's **red eyes (AC2) and red laser/detail
   accents (AC4) likewise maintain a minimum contrast floor against the boss's
   own near-black body color** (not only against the background) — e.g. via a
   lighter rim or a brighter red on the darkest bodies — so the red details do
   not disappear against a near-black body.
6. The **damage-state** indicator (F4 AC6) — the visible per-hit-taken change
   (e.g. cracks/shape change, non-color-only per NFR-9) — is **retained** and
   remains legible **on top of** the toughness base color, and is visually
   distinct from the toughness-color scale (a player can tell "a tough
   [dark-gray] enemy that has taken 1 hit" apart from "a weaker enemy," using
   the non-color damage cue, not color alone).
7. The redesign remains fully original per F9 AC4 / NFR-10 (no licensed robot
   likeness/silhouette).
8. The white 1-hit enemies and the near-black boss both meet NFR-9(b) HUD/game
   legibility against the background (white enemies are already high-contrast;
   the boss's contrast floor per AC5 guarantees the dark end).
9. **(Round-1 B6 — damage-overlay legibility across the toughness scale.)** The
   damage-state overlay of AC6 is rendered **contrast-adaptively against that
   specific enemy's base body color** — **lighter** overlay strokes on **dark**
   bodies (the darkest regular tiers and the boss), **darker** strokes on
   **light** bodies (white / light-gray tiers) — maintaining a minimum legible
   contrast against the body it sits on, **rather than a single fixed overlay
   color** that reads on white enemies but silently vanishes against a
   near-black 4-hit enemy or the boss. This guarantees "can the player tell
   this tough enemy just took a hit" holds at the darkest tiers, precisely
   where it matters most for P3 legibility — the failure mode created by
   combining F17's darker toughness scale with F4 AC6's pre-existing crack cue.

### F18 — Level-start "LEVEL [N]" countdown (3-second freeze)
Traces to: UC1, UC3, UC5, goal P1; F5. Owner request 8 (verbatim): *"The start
of each level should have a 3 second timer before enemies start firing or the
user is allowed to use a weapon. During these 3 seconds, words in clear
contrast color to the background and to the enemies should appear saying 'LEVEL
[N]' where [N] is the level that is starting. The words should fade after 3
seconds which is when the enemies and user are allowed to start interacting with
lasers and shields. The user and enemies are visible, but nobody is allowed to
move until the 3 seconds are complete."*

- Description: A **fresh** level start (levels 1-10, on a new-run start or a
  level advance — including a boss-phase-to-next-level transition) opens with a
  **3-second countdown intro**. During the intro, the player and the full enemy
  formation are **visible but frozen** — nobody moves, no enemy fires, and the
  player cannot move or throw. Large text reading **"LEVEL [N]"** (N = the
  starting level) is shown in a color that clearly contrasts with **both** the
  black background **and** the enemies, and **fades out** as the 3 seconds
  elapse. When the countdown completes, normal interaction (movement, throwing,
  enemy fire, formation movement) begins. **Restart Level (F6) is the one
  exception** — it skips the countdown and drops straight into play (owner
  decision, round-1 B2; see AC9).

**Supersedes / amends:** v1 has no level-intro state — on entering a level
(`resetForLevel` / level advance) play begins immediately. F18 adds an intro
phase before active play for each fresh level start. This amends F5 AC1
(clearing a level "advances to the next level" — that advance now lands in the
3-second intro, then active play). It also interacts with **F6 (pause)**: the
intro timer must freeze on pause like every other timer (F6 AC7); and with
**F6 Restart Level**, which per AC9 now bypasses the intro. Recommended
implementation is a new pre-play sub-state or a `levelIntroRemaining` counter on
the World that gates all input/simulation systems (mirrors how
`postHitInvulnRemaining` is a decrementing counter); the exact mechanism is
deferred to solution-architect.

**Reconciliation with NFR-1 / F9 AC3 (round-1 B1 — this addendum explicitly
amends the *interpretation* of both named metrics, it does not silently break
them):** v1 NFR-1 ("page load to first controllable input ≤3s on typical
broadband") and F9 AC3 ("reach first controllable input within 3 seconds") were
written before any level-intro existed. Under F18, level 1 of a new run opens
with the 3-second intro, so the player's first *live* throw/move now occurs at
roughly **(page-load time) + 3s**, not ≤3s. This is a **deliberate,
owner-requested v2 change** to the feel of a fresh start, not a regression. To
keep the metrics meaningful rather than quietly violated, **NFR-1 and F9 AC3 are
hereby measured up to the point the 3-second intro *begins*** — i.e. the game
must still finish loading and present the frozen, fully-rendered level-1
formation with input **wired and ready to go live** within the ≤3s budget; the
intro then *holds* that ready input for its 3 seconds, at the end of which it
becomes live (input is "live" = end of intro). The metrics' **spirit** — fast,
no-friction loading with no external tutorial or setup step — is fully
preserved; only the literal first-throw timing shifts by the intentional intro.
This collision is named here (and in F18's "Amends v1" entry in the summary
table) so it is **traced, not ignored** — closing the untraced-collision gap
round-1 B1 flagged.

**Acceptance Criteria:**
1. Every **fresh** level start — a **new-run start** or a **level advance**
   (including a boss-phase-to-next-level transition, e.g. defeating the level-5
   boss into level 6) — begins with a **3-second intro** before any gameplay
   motion. **Restart Level is the sole exception and skips this intro** (AC9).
2. During the intro, the player and all enemies are **rendered/visible** but
   **frozen**: the player cannot move or throw, enemies do not move or fire, no
   enemy laser is spawned, and the formation does not advance.
3. During the intro, **"LEVEL [N]"** text is displayed, where **[N]** is the
   level about to start (e.g. "LEVEL 5"), in a color that clearly contrasts
   with the black background **and** with the enemies (per NFR-9(b)); a
   near-white or accent color that is distinct from the white 1-hit enemies
   (F17) so the text does not blend into a white enemy.
4. The "LEVEL [N]" text **fades out** over/by the end of the 3 seconds; the
   moment it finishes fading is the moment gameplay interaction is enabled.
5. When the 3 seconds complete, **all** gameplay begins: the player may move and
   throw, and enemies may move and fire — none of these are possible one frame
   before completion.
6. The intro timer is **paused with the game** (F6 AC7): pausing during the
   intro freezes the remaining intro time and resumes it intact, losing/gaining
   no intro time.
7. The **boss phase** (F12) does **not** trigger a new "LEVEL [N]" countdown —
   it is part of the same level, and F18 applies to level starts only (F12
   AC4). *(A lightweight boss-incoming warning cue **is** now specified, but it
   lives in F12 AC10-AC11, not here: it is a short ~1.75s telegraph — a
   screen-edge flash / "BOSS INCOMING" text — deliberately **not** a 3-second
   "LEVEL [N]"-style frozen countdown, so the boss phase still does not trigger
   F18's level-start intro.)*
8. The intro applies before the enemy fire-cadence clock (F5) starts — the
   first enemy shot of a level cannot occur until after the 3-second intro
   (on level starts that play the intro).
9. **(Round-1 B2 — Restart Level countdown skip, owner-approved.)** When the
   player restarts the **current** level via **Restart Level (F6)**, the
   3-second "LEVEL [N]" intro is **skipped entirely** — play begins
   immediately, with **no freeze and no "LEVEL [N]" text**. This carve-out
   applies **only** to Restart Level; **fresh level starts (new run, level
   advance) and boss-phase-to-next-level transitions still get the full
   3-second intro per AC1.** Rationale (per owner sign-off): segments A
   (nostalgic replayer) and D (time-boxed casual) value **instant restart**
   during retry-heavy learning of the F15/F16 bounce-and-catch mechanic, and
   the intro's purpose — announcing *which* level you are entering — adds no
   value when you are re-entering the same level you were just on. (Contrast:
   fresh starts and boss-to-next-level advances *do* benefit from the "which
   level am I on now" announcement, so they keep the countdown.)

### F19 — "Game Complete" celebration + auto-return to main menu
Traces to: UC5, goal P5; F8. Owner request 9 (verbatim): *"After the last boss
has completed, the screen should show the words 'Game Complete' for 5 seconds
without changing the background. Instead of enemies, there should be firework
explosions of different colors around the words emphasizing it. After the 5
seconds, the game should revert back to the main menu screen to start a new game
or quit."*

- Description: Defeating the **level-10 boss** (F12) triggers a **5-second
  celebration** end sequence instead of the v1 static Victory screen. The
  words **"Game Complete"** are shown on the **same (unchanged) black
  background**, with **multi-colored firework explosions** animating around the
  text where the enemies used to be. After 5 seconds, the game **automatically
  returns to the main menu / title screen** (from which the player can start a
  new game or quit). Pressing any key during the celebration **optionally holds
  the screen** so a player can read/screenshot their score (owner's
  "screenshot a high score" goal, P/F10) — see AC9; input is never *required*.

**Supersedes / amends:** v1 F8 AC6 defines a **Victory** state reached by
"clearing level 10," and v1 `GameStateMachine.ts` leaves the VICTORY screen only
on a menu-confirm press (`Object.assign(world, startNewRun())`). F19 changes
the **trigger** (clearing level 10 now means defeating the level-10 **boss**,
F12 AC7, not clearing the level-10 formation) and the **behavior** (a 5-second
timed celebration that **auto-returns to TITLE**, rather than a static screen
waiting for input). F8 AC6's "distinct, deliberate conclusion" intent (P5) is
retained and strengthened. F8 AC7 (start a fresh run without page reload) is
satisfied by landing on the title screen after the celebration.

This feature also touches **v1 F6 AC8** (round-2 C1). F6 AC8 specifies that on
any screen that is NOT active play — explicitly including the **Victory screen
(F8 AC6)** — pressing **Esc** is a silent no-op. Because F19 replaces that
Victory screen with the Game Complete sequence, and F19 AC9 introduces an
"any key holds the screen" mechanism, F6 AC8's Esc rule must be reconciled
against it. **Resolution: Esc is EXEMPT from F19 AC9's hold mechanism — Esc
remains a silent no-op throughout the Game Complete sequence, preserving F6
AC8's existing precedent exactly (this is a continuation of F6 AC8, not a new
exception to it).** AC9's "any key" hold behavior applies to any **other** key
(Enter, Space, arrows, etc.); Esc alone is carved out. See F19 AC9.

**Acceptance Criteria:**
1. Defeating the **level-10 boss** (F12 AC7) — and only that — triggers the
   Game Complete sequence (a level-10 loss still routes to Game Over per F8).
2. The sequence displays the words **"Game Complete"** for **5 seconds**.
3. The **background does not change** during the sequence — it remains the same
   black playfield background used during play (no new scene/background swap).
4. **No enemies** are present during the sequence; in their place, **firework
   explosions of different colors** animate around the "Game Complete" text to
   emphasize it (multiple distinct colors, not a single color).
5. After the 5 seconds elapse, the game **automatically returns to the main
   menu / title screen** with **no input required** — from which the player can
   start a new game or quit (F6 / F8 AC7 behavior on the title screen). (The
   optional key-hold path of AC9 does not change this no-input default.)
6. The 5-second celebration timer is a **simulation-time counter**. The **only**
   thing that pauses it is the optional AC9 key-hold; absent any key press the
   celebration is not otherwise interruptible and simply runs to completion,
   then reliably reaches the title screen (exact mechanism deferred to
   solution-architect, but the reliable-return guarantee is a hard requirement).
7. The final run **score** (F10 AC5) is shown as part of the Game Complete
   sequence so the player sees their total before returning to the menu
   (preserves the v1 Victory-screen score-display behavior; P5).
8. Returning to the title screen resets run state so a subsequent new run
   starts clean (level 1, 3 lives, score 0, permanent multiplier reset) — same
   guarantees as F6 Restart Game / a fresh run.
9. **(Round-1 B8 — optional linger for the "screenshot a high score" goal;
   also the single explicit answer to round-1 N1 "what if a key is pressed.")**
   The 5-second auto-return (AC5) is the default and requires **no** input.
   Additionally, and purely optionally: **pressing any key — with the single
   exception of Esc (see below) — during the celebration holds the screen** — it
   **pauses** the 5-second countdown and keeps "Game Complete", the fireworks,
   and the final score (AC7) displayed — until a **second such key press**
   advances to the title screen. If the player presses nothing further, the
   screen simply stays held (the player is never forced off it). This does
   **not** violate AC5's "auto-return, no input required" default, because it
   only *adds* an optional path and never *requires* input for the normal flow.
   This is the **single, explicit, defined behavior for any key press during
   the celebration** (resolving round-1 N1's previously-undefined case): the
   first qualifying key press holds/pauses, a subsequent qualifying key press
   advances, and no key press leaks into or pre-triggers the title screen's own
   state.
   **Esc exemption (round-2 C1):** **Esc is EXEMPT from this hold mechanism.**
   Pressing **Esc** at any point during the Game Complete sequence is a
   **silent no-op** — it does not hold, pause, advance, or otherwise affect the
   sequence. This preserves **v1 F6 AC8** (Esc is a silent no-op on every
   non-active-play screen, explicitly including the Victory screen that F19
   replaces) **exactly and by continuation — it is not a new exception to F6
   AC8 but a direct preservation of it** for the screen that supersedes the
   Victory screen. Every **other** key (Enter, Space, arrows, letter keys,
   etc.) participates in the "any key" hold behavior above; Esc alone does not.
   It reconciles AC4's celebratory fireworks with AC7's score-legibility
   purpose for segment C's screenshot motivation.

---

## Cross-cutting NFR notes (v2)

- **NFR-9 (accessibility / legibility)** governs new v2 UI: the "LEVEL [N]"
  intro text (F18 AC3), the "Game Complete" text and fireworks (F19), the
  "BOSS INCOMING" cue (F12 AC10), the white-1-hit-enemy vs. dark-boss contrast
  (F17 AC5/AC8/AC9), the falling power-up type icons (F11 AC8), and the
  single-active-effect indicator (F11 AC6) must all meet the contrast /
  non-color-only bar. No new NFRs are introduced; v2 rides on NFR-1..NFR-10.
- **NFR-1 / F9 AC3 (time-to-first-input)** are **reinterpreted, not removed**,
  by F18 — measured to the *start* of the level-1 intro; see F18's
  "Reconciliation with NFR-1 / F9 AC3" note (round-1 B1).
- **NFR-2 (frame rate)** applies to the F19 fireworks, the F15 shield trail, and
  the larger boss sprite (F12 AC5) — the celebration animation, the trail, and
  the 5×-scale boss must not drop sustained frame rate below the NFR-2 floor.
- **NFR-10 / F9 AC4 (original art, no licensed motifs)** remains a **hard
  binding constraint** on the F13 (player), F14 (shield), and F17 (enemy)
  redesigns — the reviewer must re-confirm the humanoid redesigns and the blue
  circular shield introduce no trademark-adjacent likeness or the
  red-white-blue star/shield callback.

**Playtest / test-validator notes (round-1 N4, N5 — NOT acceptance criteria;
flagged for verification at implementation/playtest time rather than encoded as
hard ACs):**
- **N4 (rendering density):** F13 AC1 / F17 AC1's "four distinguishable regions
  per figure" must be verified at **max formation density** (level 10's 54-enemy
  formation plus the player, lasers, and a possibly-bouncing shield all on
  screen at once), not only on an isolated sprite reviewed at rest.
  `code-reviewer` / `test-validator` should check region legibility **at scale**,
  not via a single-sprite screenshot. This is a review/playtest criterion, not a
  spec change.
- **N5 (bounce-exposure balance):** the F15 zone table makes a straight-up throw
  from directly beneath an enemy a **STOP** (bottom-center), so bounces require
  deliberate horizontal offset/aim. During playtest, verify the corner/side zone
  widths (F15 AC7's "outer N%") are tuned generously enough that bounces — and
  thus the F16 catch mechanic — are a **reasonably common** outcome in organic
  play, not a rarity (which would compound the discoverability of the
  catch-for-a-life hook). This is a balance-tuning flag, not a spec change.

---

## Out of Scope (v2 — unchanged from v1 unless noted)

All v1 out-of-scope items still hold. Additionally, unless the owner requests
them:
- A full 3-second, game-freezing **"LEVEL [N]"-style countdown** before the
  boss phase (F18 remains a level-start-only feature). *Note: a **lightweight**
  ~1.75s boss-incoming warning cue **is now in scope** as of round-1 B3 — see
  F12 AC10-AC11; only a full frozen level-intro-style countdown for the boss is
  excluded.*
- Sound effects for bounces, catches, the countdown, the boss cue, or the
  fireworks (sound remains an optional nice-to-have per v1 owner decision Q6).
- A cap on lives gained via shield catches (F16 AC2 — no cap specified; flag if
  wanted).
- Any change to the shield's bounce that reflects off screen edges or non-enemy
  objects (explicitly excluded by F16 AC5-AC6).

---

## Open Questions v2 (Items A-F) — for owner decision

All six original items have been **resolved by the owner** (2026-07-07).
Presented in the Job-0 format (issue → decision → consequence) for the audit
trail.

| # | Item | Final decision | Status |
|---|---|---|---|
| A | Boss model replaces v1 embedded-boss | New post-clear boss on levels 5 & 10 only; levels 1-4/6-9 have **no** boss; retires v1 F4 "Boss HP" column | **RESOLVED — confirmed as proposed** |
| B | "5× stronger" formula | 5× the toughest regular HP tier in the level's hpMix → **L5 boss = 15**, **L10 boss = 20** | **RESOLVED — confirmed as proposed** |
| C | Shield bounce geometry edge cases | Top-center and bottom-center direct hits both **STOP**; **corners bounce 45° diagonally away from the enemy's center** (bottom corners → down-diagonal, top corners → up-diagonal); **sides bounce purely horizontal** — this is a correction from this addendum's first draft (which had bottom corners bouncing horizontal and top corners bouncing down-diagonal) | **RESOLVED — corrected geometry, see F15** |
| D | Extra-life catch condition | Life granted **only** on an actual catch-collision with an in-flight shield (not automatic on stop-near-player) | **RESOLVED — confirmed as proposed** |
| E | One-shield-in-flight vs. 250 ms cooldown | One-in-flight **replaces** the 250 ms cooldown as the sole throw gate, **plus a max-lifetime safety valve** (a still-bouncing shield eventually auto-despawns) — the safety valve is an owner-requested addition beyond this addendum's original proposal | **RESOLVED — confirmed + safety valve added** |
| F | Boss size / countdown layout | Boss = 5× linear size, spawns clear of HUD/player row; no full countdown for the boss phase | **RESOLVED — confirmed as proposed** |

---

## Round-1 UX review resolutions (B1-B8, N1-N5)

Source: `docs/ux/design-review-v2-round1.md` (verdict FAIL). This section
records how each finding was resolved. **B2 and B3 carry explicit owner
sign-off** (genuine feel/design tradeoffs); the rest (B1, B4-B8) were
product-manager spec-completeness defaults reflected as new/amended ACs — no
scope/risk/direction change requiring owner input.

| # | Finding (short) | Resolution | Where |
|---|---|---|---|
| **B1** | 3s level-1 intro collides with NFR-1/F9 AC3 ("≤3s to first input") — untraced | Metrics **reinterpreted** to be measured up to the *start* of the intro (input "live" = end of intro); explicitly named as an intentional owner-requested v2 change so the collision is traced, not ignored | F18 "Reconciliation" note; summary-table F18 "Amends v1" cell; NFR notes |
| **B2** | No skip for the countdown on repeated Restart Level — hurts instant-restart segments | **OWNER SIGN-OFF:** skip the countdown on **Restart Level only**; fresh starts + boss-to-next-level still get the full 3s | F18 AC1 + new **AC9**; description |
| **B3** | Boss appears with zero warning ("noted, not assumed") — undercuts UC3 escalation | **OWNER SIGN-OFF:** add a lightweight **~1.75s "BOSS INCOMING" cue** (screen-edge flash + text) before boss activates — distinct from F18's 3s intro | F12 new **AC10-AC11** + description; F18 AC7 updated; Out-of-Scope updated |
| **B4** | Bounce trajectory not trackable in real time — catch reads as luck not skill | Added a **short visual trail/afterimage** on the in-flight shield | F15 new **AC9** |
| **B5** | Catch-for-a-life has no catch-moment feedback (inconsistent with F7 AC10b) | Added a **distinct catch-confirmation cue** ("+1 LIFE" flash/text) | F16 new **AC9** |
| **B6** | Damage overlay may vanish on darkest bodies/boss | Overlay made **contrast-adaptive** to each enemy's base color | F17 new **AC9** |
| **B7** | Power-up types indistinguishable while falling — now a real downgrade risk under F11 | Added **distinct, non-color-only icon/shape per type while falling** | F11 new **AC8** |
| **B8** | Rigid 5s Game Complete timer conflicts with F10's "screenshot a high score" goal | Added an **optional, additive key-press hold** (pause countdown until a second key press) — no-input default unchanged | F19 new **AC9**; AC5/AC6 updated |
| **N1** | Undefined key-press behavior during celebration | **Resolved by B8's fix** — AC9 is the single explicit answer (first press holds, second advances, no leak to title state) | F19 AC9 |
| **N2** | Shield & avatar share identical blue → close-range catch legibility | Folded in: **thin outline/stroke** on the shield (shape-level, keeps identical fill) | F14 new **AC5** |
| **N3** | Red eyes/lasers contrast on darkest bodies not covered | Folded in: extended AC5's contrast floor to cover **red accents vs. the boss's own body**, not just background | F17 AC5 |
| **N4** | Four regions per figure untested at 54-enemy density | Left as a **test/playtest criterion** (per reviewer's own recommendation), not a hard AC | NFR notes (Playtest/test-validator notes) |
| **N5** | STOP outcomes may dominate → bounces/catch rare in organic play | Left as a **balance-tuning playtest flag**, not a spec change | NFR notes (Playtest/test-validator notes) |

### Round-2 UX review resolutions (`docs/ux/design-review-v2-round2.md`)

Round 2 confirmed all eight round-1 blocking findings (B1-B8) genuinely
resolved and found **one new blocking item (C1)** plus two non-blocking notes
and an optional note (C2). All are now resolved below.

| # | Finding (short) | Resolution | Where |
|---|---|---|---|
| **C1** (blocking) | F19 AC9's "any key holds the screen" not reconciled against v1 F6 AC8 (Esc = silent no-op on the Victory screen F19 replaces) — untraced collision | **Esc carved out as EXEMPT** from AC9's hold mechanism — Esc stays a silent no-op through Game Complete, **preserving F6 AC8 by continuation (not a new exception)**; all other keys participate in the hold. F6 AC8 named in F19's "Supersedes/amends" + summary-table cell | F19 AC9 (Esc exemption); F19 "Supersedes/amends"; summary-table row 9 |
| **C2** (non-blocking, optional) | Boss-incoming edge cue visually resembles F3 AC6's formation-danger edge pulse (opposite valence) | Boss cue specified to use a **distinct color/treatment** (different hue family + solid flash vs. F3 AC6's pulsing danger border) | F12 AC10 |
| obs. 1 (non-blocking) | F16 prose lists 3 shield exit conditions; AC4 has 4 (incl. max-lifetime valve) | Prose synced to AC4's four conditions (a-d) | F16 description |
| obs. 2 (non-blocking) | F12 AC11 didn't state whether player can throw during the ~1.75s boss cue | Clarified: player **retains full move + throw control** during the cue (cosmetic warning, not a freeze; unlike F18) | F12 AC11 |

---

## Traceability check (v2)

Each v2 feature (F11-F19) cites the v1 use case(s)/goal(s) it serves and names
the specific v1 AC(s) it supersedes or amends, so `code-reviewer` and
`test-validator` can locate exactly which v1 tests change. The 9 owner requests
map 1:1 to F11-F19 (see the summary table). All six original ambiguities (A-F)
are resolved with a default written into a concrete AC **and** surfaced in
§Open Questions v2 for owner sign-off — none are silently guessed. The eight
round-1 UX blocking findings (B1-B8) and five non-blocking (N1-N5) are each
resolved and traced in §Round-1 UX review resolutions, with B2/B3 carrying
explicit owner sign-off and the rest reflected as new/amended ACs. Grounding
references to the actual v1 source files are recorded inline in each feature's
"Supersedes / amends" note so the addendum reflects the code that exists, not
only the v1 PRD text.
