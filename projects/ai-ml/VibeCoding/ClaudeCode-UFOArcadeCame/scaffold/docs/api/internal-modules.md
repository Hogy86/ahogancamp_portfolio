# Internal Module Reference

**API reference for core simulation and configuration modules. This is for contributors who want to extend the game (add new power-ups, levels 11+, custom enemy types, etc.).**

All examples use TypeScript. The game has no HTTP API; this document covers the internal module interfaces that define how the simulation works. **Updated for v2 (F11–F19): single active-power-up slot, boss encounters, shield bounces, level intros, Game Complete celebration.**

**Sources:**
- `docs/PRD.md` (F1–F10: v1 features and acceptance criteria)
- `docs/PRD-addendum-v2.md` (F11–F19: v2 feature additions)
- `docs/architecture/solution-architecture.md` (component design)
- `ADR-0002` (system order and determinism)
- `ADR-0003` (data-driven level config)

---

## Core Types (`src/core/types.ts`)

### GameState

```typescript
export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';
```

The five game screens. Only PLAYING ticks the simulation; other states handle input but do not update entities.

**Traces:** PRD §F6, F8; ADR-0002 (state machine design).

---

### GameOverReason

```typescript
export type GameOverReason = 'LIVES_DEPLETED' | 'FORMATION_REACHED_ROW' | null;
```

If the game transitions to GAMEOVER state, this field records which loss condition triggered it (or null if still in play). Both conditions map to a single GAMEOVER screen per PRD F8 AC8 (deterministic single outcome).

**Traces:** PRD §F8 AC8 (single deterministic outcome).

---

### Player

```typescript
export interface Player {
  x: number;                          // Left edge position (pixels)
  y: number;                          // Top edge position
  width: number;                      // 40 px (PLAYER_WIDTH)
  height: number;                     // 28 px (PLAYER_HEIGHT)
  postHitInvulnRemaining: number;     // Seconds of post-hit invulnerability (F8 AC9)
}
```

The player entity (Vanguard). Position is updated by MovementSystem; invulnerability is decremented by PowerUpSystem and checked in WinLossSystem respectively.

**Note (v2):** In v1, `throwCooldownRemaining` gated the shield throw on a 250 ms interval. **In v2 (F16 AC3), this field is removed.** The throw is now gated by the one-shield-in-flight rule: if `world.shields.length > 0`, no new shield can be spawned. This change removes the hardcoded throw-rate constant and makes the mechanic data-driven by shield lifecycle.

**Example usage:**
```typescript
// Check if the player can throw (v2)
const canThrow = world.shields.length === 0; // No shield in flight

// Check if invulnerable (unchanged)
const isInvulnerable = world.player.postHitInvulnRemaining > 0;
```

**Traces:** PRD §F1 (movement), §F16 AC3 (one-in-flight gate, replacing throw cooldown), §F8 AC9 (i-frames).

---

### Enemy

```typescript
export interface Enemy {
  id: number;
  col: number;                 // Grid column index (fixed, 0-based)
  row: number;                 // Grid row index (fixed, 0-based)
  x: number;                   // Pixel position (derived from col/row + formation offset)
  y: number;                   // Pixel position
  width: number;               // 36 px (ENEMY_WIDTH); bosses: 5× (180 px, F12 AC5)
  height: number;              // 28 px (ENEMY_HEIGHT); bosses: 5× (140 px)
  hitsToKill: number;          // HP: 1–4 for regular; 15 for level-5 boss, 20 for level-10 boss (F12 AC2)
  hitsTaken: number;           // Damage counter: when hitsTaken >= hitsToKill, enemy dies
  isBoss: boolean;             // True if this enemy is the post-clear boss (levels 5, 10 only)
  alive: boolean;              // False after being destroyed; removed from array on next tick
}
```

A single enemy robot. HP (`hitsToKill`) is set at spawn per the LevelConfig hpMix (regular enemies) or the bossHp formula (bosses). Damage is tracked by `hitsTaken`. Destroyed enemies are marked `alive: false` and filtered out of the array at the end of the tick.

**v2 addition (F12):** Bosses are now a separate phase appearing **after** the regular formation is cleared on levels 5 and 10. The boss is spawned by the WinLossSystem's level-advance logic and always has `isBoss: true`. It is the sole enemy during the boss phase (formation.enemies contains only the boss).

**Example usage:**
```typescript
// On shield hit: apply damage (unchanged from v1)
const currentHp = enemy.hitsToKill - enemy.hitsTaken;
const damageDealt = Math.floor(hitPower * world.permanentMultiplier);
// Note: world.effects (v2) replaces v1's three independent timers
if (world.effects.type === 'HIT_POWER' && world.effects.remaining > 0) {
  damageDealt *= 5; // 5× Hit Power temporary multiplier
}
enemy.hitsTaken += damageDealt;
if (enemy.hitsTaken >= enemy.hitsToKill) {
  enemy.alive = false;
  // Trigger power-up drop, award score, etc.
  // If this was the level-10 boss, the game enters VICTORY state
}

// Rendering: pick a distinct sprite per remaining-hit count (non-color-only per NFR-9a)
const remainingHits = enemy.hitsToKill - enemy.hitsTaken;
// Render different shape/color per remaining hits and isBoss flag
// Boss is 5× larger and darker color than regular enemies (F12 AC5-AC6, F17 AC5)
```

**Traces:** PRD §F3, §F4 (enemy HP and damage visibility), §F12 (boss mechanics), §F4 AC6 / §F17 AC6-AC9 (non-color-only damage state).

---

### ShieldProjectile

```typescript
export interface ShieldProjectile {
  id: number;
  x: number;                   // Center x (pixels)
  y: number;                   // Center y
  radius: number;              // 8 px (SHIELD_RADIUS)
  active: boolean;             // True while in flight; false once despawned
  vx: number;                  // Velocity x component, px/s (v2: F15)
  vy: number;                  // Velocity y component, px/s
  lifetimeRemaining: number;   // Seconds until auto-despawn (F16 Item E safety valve)
  lastHitEnemyId: number | null;  // Debounce: id of enemy most recently hit while overlapping (v2: F15 AC2)
  trail: Array<{ x: number; y: number }>; // Recent positions for rendering (v2: F15 AC9)
}
```

The thrown shield projectile **with full bounce mechanics (v2 F15/F16).** In v1, shields traveled straight up and were consumed on first contact. **In v2, shields bounce off enemy hitboxes at deterministic angles (F15), may damage multiple enemies, can return to the player for a +1 life catch (F16), and are gated one-at-a-time (F16 AC3).**

**Velocity & Bounce Geometry (F15):**
- `vx` and `vy` define the shield's velocity in pixels/second. Magnitude is always `SHIELD_SPEED` (480 px/s); a bounce changes direction only, never speed (F15 AC6).
- On contact with an enemy, the zone is classified (8 zones: 4 corners, 2 sides, 2 centers) and the bounce direction is applied as an absolute screen direction per the zone table in PRD §F15 AC3-AC5.
- Center-face hits (top or bottom) **stop** the shield (removes from play, no bounce).
- Corner hits bounce diagonally (e.g., bottom-left → down-left).
- Side hits bounce purely horizontal (left → due left, right → due right).

**Debounce (F15 AC2):**
- `lastHitEnemyId` prevents the shield from applying damage to the same enemy multiple times during a continuous overlap. It is cleared as soon as the shield separates (no longer overlapping), enabling a later, genuinely new contact to damage that same enemy again.

**Lifetime Safety Valve (F16 Item E):**
- `lifetimeRemaining` counts down each frame; when it reaches 0, the shield is auto-despawned, even if still bouncing. This prevents a player from being permanently locked out of throwing if a shield ricochets indefinitely. Default is 6 seconds (`SHIELD_MAX_LIFETIME_SECONDS`).

**Trail (F15 AC9):**
- `trail` is a rendering-only list of recent positions (up to `SHIELD_TRAIL_LENGTH` entries, default 8). The CanvasRenderer draws fading line segments or dots along the trail to help the player perceive the shield's path and anticipate bounces. The trail is **never consulted for collision detection**.

**Lifecycle (F16 AC4):**
A shield is removed from play (no longer in flight) in exactly these cases:
- It **exits the playfield** on any edge (top, left, right, bottom).
- It makes a **direct center-face hit** (stops, F15 AC3).
- The **player catches** it (collision with player body, F16 AC2 — grants +1 life).
- **Max lifetime** expires (auto-despawn per F16 Item E).

**Example usage:**
```typescript
// Spawn a shield upward (v1-like, but with velocity components)
world.shields.push({
  id: world.nextEntityId++,
  x: world.player.x + world.player.width / 2,
  y: world.player.y,
  radius: SHIELD_RADIUS,
  active: true,
  vx: 0,
  vy: -SHIELD_SPEED,  // Upward
  lifetimeRemaining: SHIELD_MAX_LIFETIME_SECONDS,
  lastHitEnemyId: null,
  trail: [],
});

// In a collision handler, classify the bounce zone and apply new velocity
// (This is done in CollisionSystem.ts; see function signature below.)

// Check if the shield left play
if (shield.y - shield.radius > PLAYFIELD_HEIGHT || /* other exit conditions */) {
  shield.active = false;
}
```

**Traces:** PRD §F2 (base shield projectile), §F15 (bounce geometry and zones), §F16 (lifecycle, one-in-flight rule, catch mechanic), §F14 (circular, blue color).

---

### PowerUpType & ActiveEffect

```typescript
export type PowerUpType = 'HIT_POWER' | 'SPEED' | 'SHIELD' | 'PERMANENT_MULTIPLIER';

export type TemporaryEffectType = Exclude<PowerUpType, 'PERMANENT_MULTIPLIER'>;

export interface ActiveEffect {
  type: TemporaryEffectType | null;
  remaining: number;  // Seconds until the active effect expires
}
```

**v2 (F11): Single active-effect slot.** In v1, three independent timers (`hitPowerRemaining`, `speedRemaining`, `shieldRemaining`) could run simultaneously. **In v2, `world.effects` is a single object** holding at most one temporary effect at any time. The **Permanent Multiplier is exempt** — it is never stored here (see `world.permanentMultiplier` below).

**Semantics (F11 AC1-AC4):**
- At most one of {HIT_POWER, SPEED, SHIELD} is active.
- Catching a temporary power-up while none is active: activates it for 8 seconds.
- Catching a temporary power-up while a **different-type** is active: the old effect is discarded (remaining time is lost) and the new one activates for 8 seconds.
- Catching a temporary power-up of the **same type** as the current active effect: the timer resets to 8 seconds (not cumulative).
- All three temporary types are visually distinguishable while falling (non-color-only per F11 AC8) so the player can identify an incoming drop.

**Example usage:**
```typescript
// In CollisionSystem, on temporary power-up catch
if (powerUp.type === 'HIT_POWER' || powerUp.type === 'SPEED' || powerUp.type === 'SHIELD') {
  world.effects.type = powerUp.type;
  world.effects.remaining = POWERUP_DURATION_SECONDS; // Full fresh 8 seconds, always
  powerUp.active = false;
} else if (powerUp.type === 'PERMANENT_MULTIPLIER') {
  // Permanent multiplier: no slot involvement
  world.permanentMultiplier *= PERMANENT_MULTIPLIER_PER_CATCH;
  powerUp.active = false;
}

// In movement, check active speed boost
let speedMultiplier = 1;
if (world.effects.type === 'SPEED' && world.effects.remaining > 0) {
  speedMultiplier = SPEED_MULTIPLIER; // 3×
}
const adjustedSpeed = PLAYER_BASE_SPEED * speedMultiplier;
```

**Traces:** PRD §F7 AC4–AC6 (temporary effect types), §F11 (single active-effect slot, mutual exclusion), §F7 AC7 (permanent multiplier, independent), §F7 AC8 (v1 same-type refresh is now F11 AC4).

---

### PowerUpDrop

```typescript
export interface PowerUpDrop {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;            // 12 px (POWERUP_RADIUS)
  active: boolean;           // False if caught or fell off-screen; removed from array
}
```

A falling power-up. Type determines the effect (see ActiveEffect / permanentMultiplier). Falls downward at a constant speed; caught on collision with the player.

**Traces:** PRD §F7 (power-up types and effects), §F11 (four types, three temporary sharing one slot).

---

### BossPhase

```typescript
export type BossPhase = 'NONE' | 'WARNING' | 'ACTIVE';
```

**(v2 F12)** Tracks the current boss sub-state on levels with a boss (5 and 10 only):
- **NONE**: No boss phase (levels 1-4, 6-9, or not yet triggered on a boss level).
- **WARNING**: The ~1.75-second "BOSS INCOMING" telegraph is playing; the boss has not yet spawned; the player retains full move/throw control.
- **ACTIVE**: The boss has spawned and is interactive (moving, firing, taking damage).

Set by WinLossSystem when the last regular enemy on a boss level is destroyed; transitioned from WARNING to ACTIVE by BossWarningSystem when the warning expires.

**Traces:** PRD §F12 AC10-AC11 (boss-incoming warning), §F12 AC3 (boss spawn timing).

---

### World

```typescript
export interface World {
  state: GameState;
  level: number;
  score: number;
  lives: number;
  gameOverReason: GameOverReason;

  player: Player;
  enemies: Enemy[];
  shields: ShieldProjectile[];
  enemyLasers: EnemyLaser[];
  powerUps: PowerUpDrop[];

  effects: ActiveEffect;  // v2: single active-effect slot (F11)
  permanentMultiplier: number;

  formation: Formation;
  enemyFireCooldownRemaining: number;
  formationWarningActive: boolean;

  levelIntroRemaining: number;    // v2 (F18): 3-second level-start freeze countdown
  bossPhase: BossPhase;           // v2 (F12): boss encounter state (NONE/WARNING/ACTIVE)
  bossWarningRemaining: number;   // v2 (F12): seconds until boss spawns (0 = inactive)

  victoryCelebrationRemaining: number;  // v2 (F19): 5-second celebration countdown (0 = inactive)
  victoryHeld: boolean;                 // v2 (F19): true after player presses a key to hold the score screen

  lifeCatchFlashRemaining: number;  // v2 (F16 AC9): "+1 LIFE" catch-confirmation cue duration

  nextEntityId: number;
  pauseMenuSelectedIndex: number;
  restartGameConfirmPending: boolean;
  quitBlockedMessageActive: boolean;
}
```

The single source of truth mutated by systems each tick. **v2 additions (F11–F19):**

- **`effects: ActiveEffect`** — the single active-temporary-power-up slot, replacing v1's three independent timers.
- **`levelIntroRemaining`** — counts down the 3-second "LEVEL [N]" freeze/fade at fresh level starts (F18). Set explicitly by level-start call sites (not inside resetForLevel, to allow Restart Level to skip it per F18 AC9).
- **`bossPhase`** — tracks boss encounter state on levels 5 and 10 (F12).
- **`bossWarningRemaining`** — counts down the ~1.75-second "BOSS INCOMING" warning cue (F12 AC10-11).
- **`victoryCelebrationRemaining`** — counts down the 5-second "Game Complete" celebration after defeating the level-10 boss (F19).
- **`victoryHeld`** — true after the player presses a qualifying key during the celebration to hold the score screen (F19 AC9). When true, the countdown pauses.
- **`lifeCatchFlashRemaining`** — counts down the "+1 LIFE" visual cue when the player catches a returning shield (F16 AC9).

**Traces:** PRD §F1–F10 (v1 fields); PRD §F11–F19 (v2 additions).

---

## Configuration Constants (`src/config/constants.ts`)

### Gameplay Balance

```typescript
export const FIXED_DT = 1 / 60;                        // 60 Hz simulation tick
export const PLAYER_BASE_SPEED = 260;                  // px/s horizontal movement
export const SHIELD_SPEED = 480;                       // px/s (F15 AC6: constant magnitude)
export const SHIELD_MAX_LIFETIME_SECONDS = 6;          // Safety-valve timeout (F16 Item E)
export const SHIELD_CORNER_ZONE_FRACTION = 0.3;        // Outer fraction for corner classification (F15 AC7)
export const SHIELD_TRAIL_LENGTH = 8;                  // Recent positions for trail rendering (F15 AC9)
export const BOSS_SIZE_MULTIPLIER = 5;                 // Linear dimensions (F12 AC5)
export const BOSS_FORMATION_SPEED_MULTIPLIER = 1.2;    // Boss speed (F12)
export const BOSS_WARNING_SECONDS = 1.75;              // "BOSS INCOMING" telegraph duration (F12 AC10-11)
export const LEVEL_INTRO_SECONDS = 3;                  // "LEVEL [N]" freeze/fade duration (F18)
export const VICTORY_CELEBRATION_SECONDS = 5;          // "Game Complete" duration (F19)
export const STARTING_LIVES = 3;                       // PRD F8 AC1
export const POST_HIT_INVULN_SECONDS = 1.5;            // Tunable default (F8 AC9)
export const POWERUP_DURATION_SECONDS = 8;             // Temporary effect duration (F7 AC4–AC6)
export const PERMANENT_MULTIPLIER_PER_CATCH = 1.8;     // Stacking factor (F7 AC7)
export const HIT_POWER_MULTIPLIER = 5;                 // 5× damage (F7 AC4)
export const SPEED_MULTIPLIER = 3;                     // 3× speed (F7 AC5)
export const EXTRA_DROP_CHANCE = 0.1;                  // 10% extra-drop rate
export const BASE_FORMATION_SPEED = 30;                // px/s, multiplied per level
export const BASE_ENEMY_FIRE_INTERVAL_SECONDS = 3.2;   // Level-1 base cadence
```

All hardcoded values are defined here, not scattered in source.

**v2 changes:** The old **`THROW_INTERVAL_SECONDS = 0.25`** constant is **removed** per F16 AC3 (the throw is now gated by the one-shield-in-flight rule, not a cooldown). This affects F5 AC2's bound; see the PRD addendum's "Reconciliation with F5 AC2" section for the re-derived bound (~42% instead of 25%).

**Traces:** PRD §F2, §F7, §F8 AC9, §F12, §F15, §F16, §F18, §F19; NFR-2 (60 FPS).

---

### Art & Color Constants

```typescript
export const VANGUARD_BLUE = '#2f6fed';                // Humanoid avatar blue (F13 AC3)
export const VANGUARD_WHITE = '#f4f6fb';               // Humanoid avatar white (F13 AC2)
export const ENEMY_TOUGHNESS_COLORS: Record<HitsToKill, string> = {
  1: '#f4f6fb',  // White (weakest)
  2: '#c3c6cf',  // Light gray
  3: '#787c86',  // Medium gray
  4: '#3c3f46',  // Dark gray (toughest regular)
};
export const BOSS_COLOR = '#242428';                   // Darkest (F12 AC6, F17 AC5)
export const BOSS_OUTLINE_COLOR = '#8a8a94';           // Contrast floor
export const ENEMY_EYE_COLOR = '#ff5a5a';              // Red eyes/lasers (F17 AC2-AC4)
export const LEVEL_INTRO_TEXT_COLOR = '#ffd873';       // Amber/gold level-intro text (F18)
export const FIREWORK_COLORS = ['#ff5a5a', '#ffd873', '#6be675', '#5fb8ff', '#c77dff', '#ff9f4d']; // Celebration (F19 AC4)
```

**Traces:** PRD §F13 (Vanguard redesign), §F14 (shield color), §F17 (Sentinel toughness scale), §F12 (boss color).

---

## Systems

### MovementSystem (`src/systems/MovementSystem.ts`)

```typescript
export function updateMovement(world: World, snapshot: InputSnapshot, dt: number): void
```

**Purpose:** updates the player's position based on held movement keys.

**Gating:** if `world.levelIntroRemaining > 0` (level intro freeze), movement is skipped entirely (F18 AC2).

**Behavior:**
- If moveLeft, add `-PLAYER_BASE_SPEED * speedMultiplier * dt` to player.x (clamped to playfield left edge).
- If moveRight, add `+PLAYER_BASE_SPEED * speedMultiplier * dt` to player.x (clamped to playfield right edge).
- If both keys held, cancel (no net movement — PRD F1 AC5).
- `speedMultiplier = 1` if no active speed effect, or `SPEED_MULTIPLIER` (3) if `world.effects.type === 'SPEED' && world.effects.remaining > 0`.

**Example:**
```typescript
const isSpedUp = world.effects.type === 'SPEED' && world.effects.remaining > 0;
const speedMultiplier = isSpedUp ? SPEED_MULTIPLIER : 1;
const adjustedSpeed = PLAYER_BASE_SPEED * speedMultiplier;
```

**Traces:** PRD §F1, §F7 AC5 (3× Speed interaction), §F18 AC2 (level-intro freeze).

---

### FormationSystem (`src/systems/FormationSystem.ts`)

```typescript
export function updateFormation(world: World, dt: number): void
```

**Purpose:** advances the enemy formation left/right, steps it down on screen edge, detects approach warning, and checks if formation has reached the player's row.

**Gating:** if `world.levelIntroRemaining > 0` (level intro freeze) or `world.bossPhase !== 'NONE'` (boss phase active), formation movement is skipped (F18 AC2, F12 AC11).

**Behavior (during active play):**
1. Calculate formation bounds from alive enemies.
2. Move formation offset by `BASE_FORMATION_SPEED * config.formationSpeedMultiplier * dt * formation.direction`.
3. If any enemy's right edge exceeds PLAYFIELD_WIDTH, step down and reverse direction.
4. Similarly for left edge.
5. Check if the lowest alive enemy's y-position ≥ PLAYER_Y; if so, set `world.gameOverReason = 'FORMATION_REACHED_ROW'` (handled by WinLossSystem next tick).
6. Check if lowestY is one row above the player (within `FORMATION_WARNING_ROW_MARGIN_PX`); if so, set `world.formationWarningActive = true` (if FORMATION_WARNING_ENABLED).

**Traces:** PRD §F3 (formation movement), §F12 AC11 (boss phase does not freeze formation), §F18 AC2 (level intro freezes all).

---

### LevelIntroSystem (`src/systems/LevelIntroSystem.ts`)

**Purpose (v2 F18):** decrements the level-start countdown timer.

```typescript
export function updateLevelIntro(world: World, dt: number): void
```

**Behavior:**
- If `world.levelIntroRemaining > 0`, decrement it by dt (clamped to 0).
- GameLoop reads this counter and gates all input/simulation systems when > 0.
- When it reaches 0, normal gameplay is live.

**Note:** This system only ticks the timer. The actual freeze gate is in GameLoop, which checks `levelIntroRemaining > 0` before calling the rest of the simulation systems.

**Traces:** PRD §F18 AC4, AC6 (freeze, text fade, timer decrement); ADR-0002 (system order).

---

### BossWarningSystem (`src/systems/BossWarningSystem.ts`)

**Purpose (v2 F12 AC10-11):** counts down the ~1.75-second "BOSS INCOMING" telegraph and spawns the boss when it expires.

```typescript
export function updateBossWarning(world: World, dt: number): void
```

**Behavior:**
- If `world.bossPhase !== 'WARNING'`, return (no-op).
- Decrement `world.bossWarningRemaining` by dt (clamped to 0).
- When it reaches 0, call `enterBossPhase(world)` to spawn the boss and set `world.bossPhase = 'ACTIVE'`.

**Note:** Unlike LevelIntroSystem, BossWarningSystem **does not freeze movement or firing** — the player retains full control during the warning (F12 AC11). The warning is purely cosmetic.

**Traces:** PRD §F12 AC10-11 (boss-incoming telegraph, non-freezing).

---

### ProjectileSystem (`src/systems/ProjectileSystem.ts`)

```typescript
export function updateProjectiles(world: World, dt: number): void
```

**Purpose (v2 F15/F16):** advances shield positions and checks lifetime/bounds for despawn.

**Gating:** if `world.levelIntroRemaining > 0` (level intro freeze), no projectile movement (F18 AC2).

**Behavior:**
1. For each active shield:
   - Add `(shield.vx * dt, shield.vy * dt)` to its (x, y) position.
   - Append the current position to `shield.trail` (cap at `SHIELD_TRAIL_LENGTH`).
   - Decrement `shield.lifetimeRemaining` by dt.
   - Check if shield exits the playfield (x/y bounds); if so, mark `shield.active = false`.
   - Check if lifetime expires (≤ 0); if so, mark `shield.active = false`.
2. Remove inactive shields from `world.shields` at the end.

**Note:** Bounce direction is set by CollisionSystem when it detects a shield-enemy impact; this system only applies velocity.

**Example:**
```typescript
// Spawn a bounced shield (collision handler would do this)
shield.vx = -SHIELD_SPEED / Math.sqrt(2); // 45° down-left
shield.vy = SHIELD_SPEED / Math.sqrt(2);
```

**Traces:** PRD §F15 (bounce velocity), §F16 AC4 (despawn conditions).

---

### CollisionSystem (`src/systems/CollisionSystem.ts`)

```typescript
export function updateCollisions(world: World): void
```

**Purpose (v2 F15/F16):** detects and resolves all collisions: shield–enemy (with bounce classification), enemy-laser–player, player–power-up, and (new) player–shield catch.

**Sub-functions:**

#### Shield–Enemy Collision (F15/F16)

```typescript
function checkShieldEnemyCollisions(world: World): void
```

- For each shield and each alive enemy, check if distance < shield.radius + enemyCollisionRadius.
- On contact:
  1. Apply damage: `enemy.hitsTaken += Math.floor(hitPower * world.permanentMultiplier)` with temporary multiplier if active.
  2. **Classify the impact zone** on the enemy's rectangular hitbox into one of 8 zones (4 corners, 2 sides, 2 centers) per the zone table in PRD §F15 AC3-AC5. Corner zones are the outer `SHIELD_CORNER_ZONE_FRACTION` (30%) of each face; center zones are the middle.
  3. **Apply bounce direction** based on the zone (absolute screen directions, never relative to incoming direction):
     - **Top-center or bottom-center**: shield stops (no bounce, active = false).
     - **Bottom-left**: bounce down-left (vx = -SHIELD_SPEED / √2, vy = SHIELD_SPEED / √2).
     - **Bottom-right**: bounce down-right.
     - **Top-left**: bounce up-left.
     - **Top-right**: bounce up-right.
     - **Left-center**: bounce due left (vx = -SHIELD_SPEED, vy = 0).
     - **Right-center**: bounce due right (vx = SHIELD_SPEED, vy = 0).
  4. **Debounce:** Update `shield.lastHitEnemyId` to the enemy's id to prevent multi-hit while still overlapping. Clear it when the shield separates.
  5. If enemy dies (`hitsTaken >= hitsToKill`), set `alive = false`, emit 'enemyDestroyed' instrumentation, and roll for a power-up drop.
- Do not proceed with any other collision until the shield separates.

**Example:**
```typescript
function classifyZone(shieldX: number, shieldY: number, enemyRect: { x, y, width, height }): ZoneName {
  const relX = (shieldX - (enemyRect.x + enemyRect.width / 2)) / (enemyRect.width / 2);
  const relY = (shieldY - (enemyRect.y + enemyRect.height / 2)) / (enemyRect.height / 2);
  const cornerThreshold = SHIELD_CORNER_ZONE_FRACTION; // 0.3

  const isCorner = Math.abs(relX) > (1 - cornerThreshold) && Math.abs(relY) > (1 - cornerThreshold);
  if (isCorner) return classifyCornerZone(relX, relY);
  
  const isVerticalCenter = Math.abs(relX) <= (1 - cornerThreshold);
  if (isVerticalCenter) return relY > 0 ? 'BOTTOM_CENTER' : 'TOP_CENTER';
  
  return relX > 0 ? 'RIGHT_CENTER' : 'LEFT_CENTER';
}
```

**Traces:** PRD §F15 AC1-8 (zone classification, bounce geometry), §F16 AC1 (one hit per contact), §F16 AC2 (debounce).

#### Enemy-Laser–Player Collision

```typescript
function checkEnemyLaserPlayerCollisions(world: World): void
```

- For each laser and the player, check distance < laser.radius + playerCollisionRadius.
- If hit:
  - If player is invulnerable (postHitInvulnRemaining > 0 or shield effect active), do nothing.
  - Otherwise: decrement `world.lives`, set `postHitInvulnRemaining = POST_HIT_INVULN_SECONDS`, emit 'laserHit' instrumentation, despawn laser.

**Traces:** PRD §F8 AC2 (laser hit = -1 life), §F8 AC9 (post-hit i-frames), §F7 AC6 (Indestructible Shield invulnerability).

#### Player–Shield Catch (v2 F16 AC2)

```typescript
function checkPlayerShieldCatch(world: World): void
```

- For each in-flight shield (active === true), check if it overlaps the player (distance < shield.radius + playerCollisionRadius).
- On catch:
  - Set `shield.active = false` (remove from play).
  - Increment `world.lives += 1`.
  - Start the "+1 LIFE" catch-confirmation cue: `world.lifeCatchFlashRemaining = LIFE_CATCH_FLASH_SECONDS`.
  - Emit 'shieldCaught' instrumentation.

**Traces:** PRD §F16 AC2 (catch grants +1 life), §F16 AC9 (catch-confirmation cue).

#### Player–Power-Up Collision (F11 update)

```typescript
function checkPlayerPowerUpCollisions(world: World): void
```

- For each power-up and the player, check distance < powerup.radius + playerCollisionRadius.
- On catch:
  - Despawn power-up.
  - If temporary (HIT_POWER, SPEED, SHIELD):
    - Set `world.effects.type = powerUp.type`, `world.effects.remaining = POWERUP_DURATION_SECONDS`.
    - **This replaces the old effect immediately if one was active** (F11 AC1-4).
  - If permanent multiplier:
    - Multiply `world.permanentMultiplier *= PERMANENT_MULTIPLIER_PER_CATCH` (never affected by the effects slot).
  - Award score: `SCORE_POWERUP_BONUS` (250).
  - Emit 'powerUpCaught' instrumentation.

**v2 change from v1:** In v1, each power-up type had its own timer field and could be active simultaneously. **In v2, all three temporary types share the single `world.effects` slot.** Catching any temporary power-up overwrites the slot with a full fresh duration.

**Traces:** PRD §F7 (power-up catch and effects), §F11 AC1-4 (single-slot semantics).

---

### PowerUpSystem (`src/systems/PowerUpSystem.ts`)

```typescript
export function updatePowerUps(world: World, dt: number): void
```

**Purpose (v2 F11):** advances falling power-ups, decrements the single active-effect timer, and decrements the post-hit invulnerability timer.

**Behavior:**
1. For each active power-up, add `POWERUP_FALL_SPEED * dt` to y-position.
2. If y - radius > PLAYFIELD_HEIGHT, despawn (no effect applied).
3. If `world.effects.type !== null`, decrement `world.effects.remaining` by dt (clamped to 0). When it reaches 0, set `world.effects.type = null`.
4. Decrement `world.player.postHitInvulnRemaining` by dt (clamped to 0).
5. (NEW in v2) If catching a shield during level-intro or boss-warning, it is safe because neither freezes collision checks; they only freeze movement/firing/advance. This is a no-issue case per F18/F12 AC11.

**Example (old v1 code that needs updating):**
```typescript
// WRONG (v1 style - three timers):
world.effects.hitPowerRemaining -= dt;
world.effects.speedRemaining -= dt;
world.effects.shieldRemaining -= dt;

// RIGHT (v2 style - single slot):
if (world.effects.type !== null) {
  world.effects.remaining -= dt;
  if (world.effects.remaining <= 0) {
    world.effects.type = null;
  }
}
```

**Traces:** PRD §F7 (power-up timers and effects), §F11 AC1-4 (single active-effect slot), ADR-0002 (remaining-duration pattern).

---

### VictoryCelebrationSystem (`src/systems/VictoryCelebrationSystem.ts`)

**Purpose (v2 F19):** counts down the 5-second "Game Complete" celebration and handles the hold mechanic.

```typescript
export function updateVictoryCelebration(world: World, dt: number): void
```

**Behavior:**
- If `world.state !== 'VICTORY'`, return (no-op).
- If `world.victoryHeld === true` (player is holding the score screen), do nothing — the countdown is paused.
- Otherwise, decrement `world.victoryCelebrationRemaining` by dt (clamped to 0).
- When it reaches 0, call `Object.assign(world, createNewRunWorld())` to reset to the title screen.

**Input handling (GameStateMachine):**
- While in VICTORY state, any key press (except Esc) sets `world.victoryHeld = true`, pausing the countdown.
- A second qualifying key press (not Esc) transitions directly to the TITLE state.
- Esc is always a no-op (F19 AC9, preserving F6 AC8 precedent).

**Traces:** PRD §F19 AC5-6, AC9 (celebration countdown, hold mechanic, Esc no-op).

---

### WinLossSystem (`src/systems/WinLossSystem.ts`)

```typescript
export function updateWinLoss(world: World): void
```

**Purpose (v2 F12 integration):** evaluates terminal conditions and transitions to GAMEOVER or VICTORY, including boss-phase progression.

**Behavior (runs once per tick, after all other systems):**

1. **Check if all regular enemies are dead** (on non-boss levels or before boss spawns):
   - If yes and world.level < 10: advance to next level (F5 AC1). **Important:** if the current level is 5 or 10, don't advance immediately — instead, set `world.bossPhase = 'WARNING'`, `world.bossWarningRemaining = BOSS_WARNING_SECONDS`, and let BossWarningSystem handle the transition to ACTIVE.
   - If yes and world.level === 10 **and bossPhase === 'ACTIVE'** (boss is dead): transition to VICTORY and start the celebration with `world.victoryCelebrationRemaining = VICTORY_CELEBRATION_SECONDS` (F19 AC1).

2. **Check if boss is dead** (during boss phase):
   - If `world.bossPhase === 'ACTIVE'` and no boss enemy is alive: if level 5, advance to level 6; if level 10, trigger VICTORY (F12 AC7).

3. **Check if lives ≤ 0**:
   - Set `gameOverReason = 'LIVES_DEPLETED'` and transition to GAMEOVER.

4. **Check if gameOverReason is already set** (from FormationSystem):
   - Transition to GAMEOVER with the recorded reason.

**Critical:** This system runs LAST (ADR-0002 decision 4) so both loss conditions are finalized before the check. If both conditions are true in the same frame (F8 AC8), the system resolves to a single deterministic GAMEOVER with a unified message.

**v2 addition:** Boss-phase progression logic per F12 AC7 (defeat level-5 boss → level 6; defeat level-10 boss → VICTORY).

**Example:**
```typescript
// Check if formation (non-boss) is cleared
const allRegularDead = world.enemies.every(e => !e.alive || e.isBoss);
if (allRegularDead && !world.enemies.some(e => e.alive && e.isBoss)) {
  if (world.level === 5 || world.level === 10) {
    // Trigger boss phase
    world.bossPhase = 'WARNING';
    world.bossWarningRemaining = BOSS_WARNING_SECONDS;
  } else if (world.level < 10) {
    // Advance normally
    world.level += 1;
    world.levelIntroRemaining = LEVEL_INTRO_SECONDS;
    resetForLevel(world, false); // false = not Restart Level, so include intro
  }
}
```

**Traces:** PRD §F8 (lives and end states), §F12 (boss-phase progression), §F18 (level intro on advance), §F19 (VICTORY to celebration), §F8 AC8 (single deterministic outcome).

---

## Configuration: Level Config (`src/config/levelConfig.ts`)

```typescript
export const LEVEL_CONFIGS: readonly LevelConfig[] = [
  // Level 1
  { level: 1, rows: 4, cols: 6, hpMix: { 1: 1.0 }, bossHp: null, formationSpeedMultiplier: 1.0, fireRateMultiplier: 1.0, guaranteedPowerUpDrops: 1 },
  // Level 2
  { level: 2, rows: 4, cols: 6, hpMix: { 1: 1.0 }, bossHp: null, formationSpeedMultiplier: 1.1, fireRateMultiplier: 1.1, guaranteedPowerUpDrops: 1 },
  // ...
  // Level 5
  { level: 5, rows: 5, cols: 7, hpMix: { 1: 0.4, 2: 0.3, 3: 0.3 }, bossHp: 15, formationSpeedMultiplier: 1.5, fireRateMultiplier: 1.8, guaranteedPowerUpDrops: 1 },
  // ...
  // Level 10
  { level: 10, rows: 6, cols: 8, hpMix: { 1: 0.2, 2: 0.2, 3: 0.3, 4: 0.3 }, bossHp: 20, formationSpeedMultiplier: 2.0, fireRateMultiplier: 2.5, guaranteedPowerUpDrops: 1 },
];

export function getLevelConfig(level: number): LevelConfig {
  // Returns LEVEL_CONFIGS[level - 1], throws if out of range.
}
```

**v2 change from v1 (F12):** The `bossHp` field is now **null on levels without a boss (1-4, 6-9)** and **5× the toughest regular tier on boss levels (5, 10):** level 5 = 15 (5 × 3), level 10 = 20 (5 × 4). In v1, `bossHp` was baked on every level 2-10; the new model reflects bosses appearing only after formation clear on levels 5 and 10 per F12.

**Monotonicity validation:** The module exports an `assertMonotonicEscalation()` function that runs at module load, ensuring F4 AC5 (no level is easier than the prior) is never violated. Bosses must be accounted for in the monotonicity check: a boss-level difficulty should exceed the prior non-boss level's hardest enemy.

**Usage example:**
```typescript
const config = getLevelConfig(world.level);
const bossExists = config.bossHp !== null;
if (bossExists) {
  // After formation clears, boss will spawn with config.bossHp hits
}
```

**Traces:** PRD §F4 (owner-approved 10-level progression), §F12 AC2 (boss HP = 5× toughest regular), ADR-0003 (data-driven design, no per-level branching).

---

## Rendering & Visibility

### CanvasRenderer (`src/render/CanvasRenderer.ts`)

```typescript
export class CanvasRenderer {
  constructor(canvas: HTMLCanvasElement) { ... }
  render(world: World): void { ... }
}
```

**Purpose:** draws the game field to the canvas each frame, including all entities and v2-specific visuals.

**v2 additions:**
- **Shield trails (F15 AC9):** For each in-flight shield, render `shield.trail` as a short fading line or series of dots tracing the recent path.
- **Boss-incoming warning (F12 AC10-11):** When `world.bossPhase === 'WARNING'`, draw a screen-edge flash and/or "BOSS INCOMING" text at the top or center, distinct from the formation-approach danger pulse (different color family, solid flash not pulsing).
- **Level-intro text (F18 AC3):** When `world.levelIntroRemaining > 0`, draw "LEVEL [N]" text fading out as the countdown completes. Ensure the color (`LEVEL_INTRO_TEXT_COLOR`, amber/gold) contrasts clearly against both the black background and the white 1-hit enemies.
- **Game Complete celebration (F19 AC4):** When `world.state === 'VICTORY'` and the game is still in the celebration countdown, draw "Game Complete" text and multi-colored firework particle bursts animating around it (6 bursts spaced 0.8s apart, 12 particles per burst, 6 distinct colors per `FIREWORK_COLORS`).

**Standard rendering (unchanged):**
1. Clear the canvas (fillRect with background color, black).
2. For each enemy, draw its sprite. If `enemy.hitsTaken > 0`, vary the sprite (shape/crack pattern/outline) to show damage (NFR-9a, F4 AC6). If `enemy.isBoss`, use a 5× larger sprite in boss color.
3. For each shield projectile, draw a circle in avatar blue (F14), plus the trail if applicable (F15 AC9).
4. For each enemy laser, draw a small circle in red.
5. For each power-up, draw the icon corresponding to its type — **ensure all four are visually distinguishable (non-color-only per F11 AC8)** so players can identify incoming drops.
6. Draw the player (Vanguard) with humanoid silhouette in blue and white (F13). If `world.effects.type === 'SHIELD'` or `world.player.postHitInvulnRemaining > 0`, add an aura/blink overlay (NFR-9a, F8 AC9).
7. If `world.formationWarningActive`, draw a pulsing red border and/or warning text at the screen edges (F3 AC6, NFR-9a, distinct from boss-incoming cue).

**Traces:** PRD §F4 AC6 (non-color-only damage visibility), §F7 AC6 & §F8 AC9 (invulnerability visibility), §F3 AC6 (formation-approach warning), §F12 AC10 (boss-incoming warning, distinct cue), §F13, §F14, §F17 (avatar/enemy/shield designs), §F15 AC9 (shield trail), §F18 AC3 (level-intro text), §F19 AC4 (celebration fireworks); NFR-9(a).

---

### Shape Draw Functions (`src/render/shapes.ts`)

```typescript
export function drawVanguard(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, invulnerable?: boolean): void
export function drawShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color?: string): void
export function drawSentinel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, hitsToKill: number, hitsTaken: number): void
export function drawBossSentinel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, hitsTaken: number): void
export function drawPowerUpIcon(ctx: CanvasRenderingContext2D, x: number, y: number, type: PowerUpType, radius: number): void
export function drawEnemyLaser(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void
export function drawLevelIntroText(ctx: CanvasRenderingContext2D, text: string, canvasWidth: number, canvasHeight: number, alphaFade: number): void
export function drawBossWarningText(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, alphaFade: number): void
export function drawCelebrationFirework(ctx: CanvasRenderingContext2D, particles: Particle[]): void
```

**All sprites are drawn procedurally as vector shapes (ADR-0004), not raster images.**

**v2 designs (F13, F14, F17):**
- **Vanguard (F13):** A clearly humanoid figure with head, arms, torso, and legs in an artful combination of blue (`VANGUARD_BLUE`) and white (`VANGUARD_WHITE`). No licensed likeness.
- **Shield (F14):** A circle (not the v1 kite) filled with the exact same blue as Vanguard, with an optional thin outline for separability at close range (F14 AC5).
- **Sentinels (F17):** Humanoid figures (head, arms, torso, legs) with red eyes (`ENEMY_EYE_COLOR`). Body color encodes toughness: white (1-hit) through progressively darker grays (2-4 hits). Non-color-only damage-state changes (crack overlay, shape variation) remain legible by contrast (F17 AC6, AC9).
- **Boss (F17 AC5):** The darkest body color (darker than any 4-hit regular enemy) with an outline or rim light to maintain contrast against the black background. Red eyes and laser accents maintain legibility on the dark body (not just against background).

**Anti-motif compliance (F9 AC4 / NFR-10):**
- **Shield:** a plain blue circle — NOT a red-white-blue concentric-star disc.
- **Vanguard:** humanoid hero in blue and white — NOT a specific licensed character.
- **Sentinels:** humanoid robots with red eyes — NOT trademarked designs.
- **No wordmarks or third-party fonts anywhere.**

**Example (v2 Vanguard, 4-part humanoid):**
```typescript
function drawVanguard(ctx, x, y, width, height, invulnerable) {
  const headRadius = width * 0.2;
  const torsoWidth = width * 0.6;
  const armLength = width * 0.3;
  const legLength = height * 0.35;

  // Head (top)
  ctx.fillStyle = invulnerable ? '#8be4ff' : VANGUARD_BLUE;
  ctx.beginPath();
  ctx.arc(x + width / 2, y + headRadius, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Torso
  ctx.fillStyle = VANGUARD_WHITE;
  ctx.fillRect(x + (width - torsoWidth) / 2, y + headRadius * 2, torsoWidth, height * 0.35);

  // Arms
  ctx.fillStyle = invulnerable ? '#8be4ff' : VANGUARD_BLUE;
  ctx.fillRect(x - armLength / 2, y + headRadius * 2.5, armLength, width * 0.15);
  ctx.fillRect(x + width + armLength / 2 - width * 0.15, y + headRadius * 2.5, armLength, width * 0.15);

  // Legs
  ctx.fillRect(x + (width - torsoWidth) / 2, y + headRadius * 2 + height * 0.35, torsoWidth / 2 - 2, legLength);
  ctx.fillRect(x + (width + torsoWidth) / 2 + 2, y + headRadius * 2 + height * 0.35, torsoWidth / 2 - 2, legLength);
}
```

**Traces:** PRD §F9 AC4 (hard IP constraint, original designs), §F13 (Vanguard redesign), §F14 (shield shape), §F17 (Sentinel redesign), NFR-10, ADR-0004 (procedural art strategy).

---

## Extending the Game

### To add a new temporary power-up type (F11 constraint):

1. **Cannot add a new temporary type without changing the single-slot architecture (F11 AC1).** The slot holds at most one temporary effect. New temporary types would require either:
   - Expanding the `ActiveEffect` interface to hold multiple effects (reverting to v1-like parallel timers), or
   - Defining a priority order so new types replace lower-priority ones on catch.
   - Neither is recommended without owner sign-off.

2. If you must add a new temporary type, update:
   - `TemporaryEffectType` union in `types.ts`.
   - `ActiveEffect` logic in `CollisionSystem.ts`.
   - Display in `HUDView.ts` to show the new effect type in the single-effect indicator.

### To add a new permanent power-up type:

1. Add variant to `PowerUpType` in `types.ts` (but NOT to `TemporaryEffectType`).
2. Add draw function in `shapes.ts` for the falling icon — **ensure it is visually distinguishable from the other three permanent and temporary types (non-color-only per F11 AC8)**.
3. Add collision-dispatch case in `CollisionSystem.ts` to apply the effect (e.g., mutate `world.permanentMultiplier` or add a new permanent-counter field to World).
4. Optionally add a visual indicator in `HUDView.ts` to show the effect is active.
5. Add unit tests.

**Example (new "Fire Rate" permanent multiplier):**
```typescript
// types.ts
export type PowerUpType = 'HIT_POWER' | 'SPEED' | 'SHIELD' | 'PERMANENT_MULTIPLIER' | 'FIRE_RATE_MULTIPLIER';

// world.ts
export interface World {
  // ...
  permanentFireRateMultiplier: number; // New: starts at 1, multiplied on catch
}

// CollisionSystem.ts
} else if (powerUp.type === 'FIRE_RATE_MULTIPLIER') {
  world.permanentFireRateMultiplier *= FIRE_RATE_MULTIPLIER_PER_CATCH; // e.g., 1.5
  powerUp.active = false;
}

// EnemyFireSystem.ts
const adjusted = BASE_ENEMY_FIRE_INTERVAL_SECONDS / (config.fireRateMultiplier * world.permanentFireRateMultiplier);
world.enemyFireCooldownRemaining = adjusted;
```

### To add levels 11+:

1. Add row(s) to `LEVEL_CONFIGS` in `levelConfig.ts` following the monotonicity pattern (F4 AC5). Set `bossHp: null` for non-boss levels, or null/custom HP for boss levels if desired (F12 restricts bosses to 5 and 10 by default, but the mechanics generalize).
2. Update `MAX_LEVEL` in `constants.ts`.
3. Adjust `BASE_FORMATION_SPEED` / `BASE_ENEMY_FIRE_INTERVAL_SECONDS` if needed to maintain pacing.
4. Test with `npm run test` to verify monotonicity assertion.

### To add a custom enemy type:

1. Extend `Enemy` interface in `types.ts` (e.g., add an `enemyType: 'regular' | 'elite' | 'special'` field).
2. Update the spawn logic in `world.ts` or wherever enemies are created.
3. Add a new draw function in `shapes.ts` or a conditional in the existing one.
4. Update collision logic in `CollisionSystem.ts` if the new enemy has special bounce behavior (e.g., shields bounce at reduced angle, or no bounce).
5. Update tests.

---

**Last updated:** 2026-07-08 (v2)  
**For questions or issues:** see `docs/README.md` for the full project context and links to architecture docs.
