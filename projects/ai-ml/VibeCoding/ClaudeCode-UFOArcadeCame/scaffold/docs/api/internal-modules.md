# Internal Module Reference

**API reference for core simulation and configuration modules. This is for contributors who want to extend the game (add new power-ups, levels 11+, custom enemy types, etc.).**

All examples use TypeScript. The game has no HTTP API; this document covers the internal module interfaces that define how the simulation works.

**Sources:**
- `docs/PRD.md` (F1–F10: features and acceptance criteria)
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
  throwCooldownRemaining: number;     // Seconds until next throw allowed (F2 AC2)
  postHitInvulnRemaining: number;     // Seconds of post-hit invulnerability (F8 AC9)
}
```

The player entity (Vanguard). Position is updated by MovementSystem; cooldown and invulnerability are decremented by PowerUpSystem and WinLossSystem respectively.

**Example usage:**
```typescript
// Check if the player can throw
const canThrow = world.player.throwCooldownRemaining <= 0;

// After throwing, set cooldown
world.player.throwCooldownRemaining = THROW_INTERVAL_SECONDS;

// Check if invulnerable
const isInvulnerable = world.player.postHitInvulnRemaining > 0;
```

**Traces:** PRD §F1 (movement), §F2 (throw cooldown), §F8 AC9 (i-frames).

---

### Enemy

```typescript
export interface Enemy {
  id: number;
  col: number;                 // Grid column index (fixed, 0-based)
  row: number;                 // Grid row index (fixed, 0-based)
  x: number;                   // Pixel position (derived from col/row + formation offset)
  y: number;                   // Pixel position
  width: number;               // 36 px (ENEMY_WIDTH)
  height: number;              // 28 px (ENEMY_HEIGHT)
  hitsToKill: number;          // HP: 1–4 for regular, up to 12 for bosses (level 10)
  hitsTaken: number;           // Damage counter: when hitsTaken >= hitsToKill, enemy dies
  isBoss: boolean;             // True if this enemy is the formation's boss
  alive: boolean;              // False after being destroyed; removed from array on next tick
}
```

A single enemy robot. HP (`hitsToKill`) is set at spawn per the LevelConfig hpMix; damage is tracked by `hitsTaken`. Destroyed enemies are marked `alive: false` and filtered out of the array at the end of the tick.

**Example usage:**
```typescript
// On shield hit: apply damage
const currentHp = enemy.hitsToKill - enemy.hitsTaken;
const damageDealt = Math.floor(hitPower * world.permanentMultiplier * tempMultiplier);
enemy.hitsTaken += damageDealt;
if (enemy.hitsTaken >= enemy.hitsToKill) {
  enemy.alive = false;
  // Trigger power-up drop, award score, etc.
}

// Rendering: pick a distinct sprite per remaining-hit count
const remainingHits = enemy.hitsToKill - enemy.hitsTaken;
// Render different shape/animation per remainingHits (non-color-only per NFR-9a)
```

**Traces:** PRD §F3, §F4 (enemy HP and damage visibility), §F4 AC6 (non-color-only damage state).

---

### PowerUpType & PowerUpDrop

```typescript
export type PowerUpType = 'HIT_POWER' | 'SPEED' | 'SHIELD' | 'PERMANENT_MULTIPLIER';

export interface PowerUpDrop {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;            // 12 px (POWERUP_RADIUS)
  active: boolean;           // False if caught or fell off-screen; removed from array
}
```

A falling power-up. Type determines the effect (see PowerUpSystem below). Falls downward at a constant speed; caught on collision with the player.

**Example usage:**
```typescript
// Spawn a new drop
const newDrop: PowerUpDrop = {
  id: world.nextEntityId++,
  type: 'HIT_POWER',
  x: enemy.x + enemy.width / 2,
  y: enemy.y + enemy.height / 2,
  radius: POWERUP_RADIUS,
  active: true,
};
world.powerUps.push(newDrop);

// Check collision with player
const distX = drop.x - player.x;
const distY = drop.y - player.y;
const distance = Math.sqrt(distX ** 2 + distY ** 2);
if (distance < drop.radius + /* player collision radius */) {
  drop.active = false;
  // Apply effect based on drop.type
}
```

**Traces:** PRD §F7 (power-up types and effects).

---

### ActiveEffects

```typescript
export interface ActiveEffects {
  hitPowerRemaining: number;      // Seconds: when > 0, shield hits deal 5× damage
  speedRemaining: number;         // Seconds: when > 0, player moves 3× faster
  shieldRemaining: number;        // Seconds: when > 0, player is invulnerable
}
```

Remaining-duration counters for temporary effects. Only decremented while `world.state === 'PLAYING'` (ADR-0002), so pause does not leak wall-clock time.

**Example usage:**
```typescript
// In PowerUpSystem, on HIT_POWER catch:
world.effects.hitPowerRemaining = POWERUP_DURATION_SECONDS;

// In collision check, check current hit power:
let hitPower = 1;
if (world.permanentMultiplier > 0) hitPower *= world.permanentMultiplier;
if (world.effects.hitPowerRemaining > 0) hitPower *= HIT_POWER_MULTIPLIER; // 5x
// Apply hitPower to damage calculation
```

**Traces:** PRD §F7 AC4–AC6 (temporary effect timers), §F7 AC8 (same-type refresh), ADR-0002 (timer semantics).

---

### LevelConfig

```typescript
export interface LevelConfig {
  level: number;
  rows: number;                         // Formation rows (4–6)
  cols: number;                         // Formation columns (6–9)
  hpMix: Partial<Record<HitsToKill, number>>;  // Fractional weights for 1–4 hit enemies
  bossHp: number | null;                // Boss HP (null for level 1; up to 12 for level 10)
  formationSpeedMultiplier: number;     // Relative to BASE_FORMATION_SPEED
  fireRateMultiplier: number;           // Relative to BASE_ENEMY_FIRE_INTERVAL_SECONDS
  guaranteedPowerUpDrops: number;       // Always 1 in v1
}
```

One immutable row from the F4 10-level progression table. Loaded from `src/config/levelConfig.ts` and read by systems; systems never branch on `level` directly (ADR-0003).

**Example usage:**
```typescript
import { getLevelConfig } from '../config/levelConfig';

const config = getLevelConfig(world.level); // levels 1–10
const formationSize = config.rows * config.cols; // e.g., 4×6 = 24 enemies
const speed = BASE_FORMATION_SPEED * config.formationSpeedMultiplier;

// Assign HP from hpMix
const regularEnemies = formationSize - (config.bossHp ? 1 : 0);
let remainingEnemies = regularEnemies;
const hpAssignments: number[] = [];
for (const [hp, weight] of Object.entries(config.hpMix)) {
  const count = Math.round(regularEnemies * (weight ?? 0));
  hpAssignments.push(...Array(count).fill(Number(hp)));
}
```

**Traces:** PRD §F4 (10-level progression, owner-approved), ADR-0003 (data-driven design).

---

## Configuration Constants (`src/config/constants.ts`)

### Gameplay Balance

```typescript
export const FIXED_DT = 1 / 60;                    // 60 Hz simulation tick
export const PLAYER_BASE_SPEED = 260;              // px/s horizontal movement
export const THROW_INTERVAL_SECONDS = 0.25;       // 250 ms min between throws (F2 AC2)
export const SHIELD_SPEED = 480;                  // px/s upward
export const STARTING_LIVES = 3;                  // PRD F8 AC1
export const POST_HIT_INVULN_SECONDS = 1.5;       // Tunable default (F8 AC9)
export const POWERUP_DURATION_SECONDS = 8;        // F7 AC4–AC6
export const PERMANENT_MULTIPLIER_PER_CATCH = 1.8; // F7 AC7
export const HIT_POWER_MULTIPLIER = 5;            // F7 AC4
export const SPEED_MULTIPLIER = 3;                // F7 AC5
export const EXTRA_DROP_CHANCE = 0.1;             // 10% extra-drop rate (F7 AC1)
export const BASE_FORMATION_SPEED = 30;           // px/s, multiplied per level
export const BASE_ENEMY_FIRE_INTERVAL_SECONDS = 3.2; // Level 1 base cadence
```

All hardcoded values are defined here, not scattered in source. Tunable defaults (like EXTRA_DROP_CHANCE) are explicitly noted in comments.

**To tune difficulty:** adjust BASE_FORMATION_SPEED or BASE_ENEMY_FIRE_INTERVAL_SECONDS, or modify the LevelConfig table in `levelConfig.ts`. Changes to LevelConfig are validated against monotonicity (F4 AC5) at module load time.

**Traces:** PRD §F2 AC2 (250 ms throw interval), §F7 (power-up durations), §F8 AC9 (i-frame duration), §NFR-2 (60 FPS).

---

### Dimension & Layout

```typescript
export const PLAYFIELD_WIDTH = 800;
export const PLAYFIELD_HEIGHT = 600;
export const PLAYER_Y = PLAYFIELD_HEIGHT - 48;
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 28;
export const ENEMY_WIDTH = 36;
export const ENEMY_HEIGHT = 28;
export const ENEMY_H_SPACING = 20;      // Horizontal gap between enemies in formation
export const ENEMY_V_SPACING = 18;      // Vertical gap
export const FORMATION_TOP_MARGIN = 70; // Top margin for formation spawn
export const FORMATION_STEP_DOWN = 24;  // Pixels to step down on screen edge
export const SHIELD_RADIUS = 8;         // Collision radius
export const ENEMY_LASER_RADIUS = 6;
export const POWERUP_RADIUS = 12;
```

**Traces:** Architecture §Component responsibilities (CanvasRenderer, collision system).

---

### Formation Warning & Special Flags

```typescript
export const FORMATION_WARNING_ENABLED = true;    // F3 AC6 flag (Q7 pending)
export const FORMATION_WARNING_ROW_MARGIN_PX = ENEMY_HEIGHT + FORMATION_STEP_DOWN;
// Triggers warning when formation's lowest enemy is this many pixels above player
```

The formation-approach warning (F3 AC6) is gated by a single config flag, so it can be disabled without touching the underlying loss rule.

**Traces:** PRD §F3 AC6, Open Question Q7 (flag allows owner to veto without code change).

---

## Systems

### MovementSystem (`src/systems/MovementSystem.ts`)

```typescript
export function updateMovement(world: World, snapshot: InputSnapshot, dt: number): void
```

**Purpose:** updates the player's position based on held movement keys.

**Input snapshot fields (relevant):**
```typescript
moveLeft: boolean;
moveRight: boolean;
```

**Behavior:**
- If moveLeft, add `-PLAYER_BASE_SPEED * dt` to player.x (clamped to playfield left edge).
- If moveRight, add `+PLAYER_BASE_SPEED * dt` to player.x (clamped to playfield right edge).
- If both keys held, cancel (no net movement — PRD F1 AC5).

**Example:**
```typescript
// To add a faster movement mode (e.g., a sprint ability)
const speedMultiplier = world.effects.speedRemaining > 0 ? SPEED_MULTIPLIER : 1;
const adjustedSpeed = PLAYER_BASE_SPEED * speedMultiplier;
if (moveLeft) world.player.x = Math.max(0, world.player.x - adjustedSpeed * dt);
```

**Traces:** PRD §F1, §F7 AC5 (3× Speed interaction).

---

### FormationSystem (`src/systems/FormationSystem.ts`)

```typescript
export function updateFormation(world: World, dt: number): void
```

**Purpose:** advances the enemy formation left/right, steps it down on screen edge, and detects if the formation has reached the player's row.

**Behavior:**
1. Calculate formation bounds from alive enemies.
2. Move formation offset by `BASE_FORMATION_SPEED * config.formationSpeedMultiplier * dt * formation.direction`.
3. If any enemy's right edge exceeds PLAYFIELD_WIDTH, step down and reverse direction.
4. Similarly for left edge.
5. Check if the lowest alive enemy's y-position ≥ PLAYER_Y; if so, set `world.gameOverReason = 'FORMATION_REACHED_ROW'` and transition to GAMEOVER (handled by WinLossSystem).
6. Check if lowestY is one row above the player; if so, set `world.formationWarningActive = true` (if FORMATION_WARNING_ENABLED).

**Example (to add formation pulsing or animation):**
```typescript
// Add a breathing/pulsing offset animation
const pulsePhase = (Date.now() % 1000) / 1000; // 1-second cycle (NOT RECOMMENDED — breaks determinism)
// BETTER: use a counter in World
world.visualPhaseCounter = (world.visualPhaseCounter ?? 0) + dt;
const pulseAmount = Math.sin(world.visualPhaseCounter * Math.PI * 2) * 2; // ±2 pixels
formation.offsetY += pulseAmount;
```

**Traces:** PRD §F3 (formation movement, screen-edge step, formation-reached-row loss), §F3 AC6 (formation-approach warning), ADR-0002 (deterministic system order).

---

### EnemyFireSystem (`src/systems/EnemyFireSystem.ts`)

```typescript
export function updateEnemyFire(world: World, dt: number): void
```

**Purpose:** decrements the enemy fire cooldown and spawns enemy lasers at the appropriate rate.

**Behavior:**
1. Decrement `world.enemyFireCooldownRemaining` by dt.
2. If it reaches 0, fire one laser from a random alive enemy.
3. Reset cooldown to `BASE_ENEMY_FIRE_INTERVAL_SECONDS / config.fireRateMultiplier`.

**Fire-rate multiplier:** the multiplier makes the interval shorter (more frequent fire). Example: level 1 base = 3.2 s; level 10 multiplier = 5.0×, so level 10 fire interval = 3.2 / 5.0 = 0.64 s (much faster).

**Example (to add variable fire patterns):**
```typescript
// Instead of random enemy, always fire from the boss (if alive)
const boss = world.enemies.find((e) => e.alive && e.isBoss);
if (boss && world.enemyFireCooldownRemaining <= 0) {
  spawnLaser(world, boss.x + boss.width / 2, boss.y + boss.height);
  world.enemyFireCooldownRemaining = /*new interval*/;
}
```

**Traces:** PRD §F5 (enemy fire cadence per level), §F4 (fireRateMultiplier escalation).

---

### PowerUpSystem (`src/systems/PowerUpSystem.ts`)

```typescript
export function updatePowerUps(world: World, dt: number): void
```

**Purpose:** advances falling power-ups and decrements active effect timers.

**Behavior:**
1. For each active power-up, add `POWERUP_FALL_SPEED * dt` to y-position.
2. If y - radius > PLAYFIELD_HEIGHT, despawn (no effect applied).
3. Decrement all timers in `world.effects` and `world.player.postHitInvulnRemaining` by dt (clamped to 0).

**Note:** collision detection and effect activation happen in CollisionSystem; this system only maintains the timer counters.

**Example:**
```typescript
// Manually apply a power-up effect (for testing or cheat codes)
world.effects.hitPowerRemaining = POWERUP_DURATION_SECONDS;

// Or, apply the permanent multiplier on catch
world.permanentMultiplier *= PERMANENT_MULTIPLIER_PER_CATCH;
```

**Traces:** PRD §F7 (power-up timers and effects), ADR-0002 (remaining-duration pattern, no wall-clock timers).

---

### CollisionSystem (`src/systems/CollisionSystem.ts`)

```typescript
export function updateCollisions(world: World): void
```

**Purpose:** detects and resolves collisions: shield–enemy, enemy-laser–player, and player–power-up.

**Sub-functions (typical):**

#### Shield–Enemy Collision
```typescript
function checkShieldEnemyCollisions(world: World): void
```
- For each shield and each alive enemy, check if distance < shield.radius + enemyCollisionRadius.
- On hit: increment enemy.hitsTaken by the current hit power (permanent × temporary multiplier).
- If hitsTaken >= hitsToKill, set enemy.alive = false.
- On enemy death, emit 'powerUpCaught' instrumentation and roll for a power-up drop:
  - Guaranteed drop (if not yet dropped this level, per levelRuntimeState).
  - Extra drop at EXTRA_DROP_CHANCE probability.
- Award score: `SCORE_PER_KILL_BASE + SCORE_PER_KILL_PER_LEVEL * (world.level - 1)`.
- Remove shield from active list.

#### Enemy-Laser–Player Collision
```typescript
function checkEnemyLaserPlayerCollisions(world: World): void
```
- For each laser and the player, check distance < laser.radius + playerCollisionRadius.
- If player is invulnerable (postHitInvulnRemaining > 0 or shieldRemaining > 0), do nothing.
- Otherwise: decrement lives, set postHitInvulnRemaining = POST_HIT_INVULN_SECONDS, emit 'laserHit' instrumentation, despawn laser.

#### Player–Power-Up Collision
```typescript
function checkPlayerPowerUpCollisions(world: World): void
```
- For each power-up and the player, check distance < powerup.radius + playerCollisionRadius.
- On catch, activate the effect based on powerup.type:
  - HIT_POWER: set hitPowerRemaining = POWERUP_DURATION_SECONDS (refresh if already active).
  - SPEED: set speedRemaining = POWERUP_DURATION_SECONDS (refresh).
  - SHIELD: set shieldRemaining = POWERUP_DURATION_SECONDS (refresh).
  - PERMANENT_MULTIPLIER: multiply permanentMultiplier *= PERMANENT_MULTIPLIER_PER_CATCH.
- Award score: SCORE_POWERUP_BONUS (250).
- Emit 'powerUpCaught' instrumentation.
- Despawn power-up.

**Example (to add a new power-up type):**
```typescript
// 1. Add to PowerUpType union in types.ts: 'FIRE_RATE'
// 2. Add collision handler:
if (powerUp.type === 'FIRE_RATE') {
  world.effects.fireRateRemaining = POWERUP_DURATION_SECONDS;
}
// 3. In EnemyFireSystem, check world.effects.fireRateRemaining and adjust cooldown.
```

**Traces:** PRD §F2 (shield hits), §F7 (power-up catch and effects), §F8 AC2 (laser hit = -1 life).

---

### WinLossSystem (`src/systems/WinLossSystem.ts`)

```typescript
export function updateWinLoss(world: World): void
```

**Purpose:** evaluates terminal conditions and transitions to GAMEOVER or VICTORY.

**Behavior (runs once per tick, after all other systems):**
1. Check if all enemies are dead (enemy.alive === false for all):
   - If yes and world.level === 10, transition to VICTORY.
   - If yes and world.level < 10, advance to next level (FormationSystem will detect this).
2. Check if lives ≤ 0:
   - Set gameOverReason = 'LIVES_DEPLETED' and transition to GAMEOVER.
3. Check if gameOverReason is already set (from FormationSystem):
   - Transition to GAMEOVER with the recorded reason.

**Critical:** This system runs LAST (ADR-0002 decision 4) so both loss conditions are finalized before the check. If both conditions are true in the same frame (F8 AC8), the system resolves to a single deterministic GAMEOVER with a unified message.

**Example:**
```typescript
// Hypothetically, if two end-conditions were checked in the wrong order:
// Tick 1: laser hits, lives go 0, system transitions to GAMEOVER ('LIVES_DEPLETED')
// Tick 1 (same frame, later): formation reaches row, system detects and tries to transition to GAMEOVER again
// BUG: the message flickers or shows both reasons.
//
// With the correct order, WinLossSystem checks both before deciding, producing one outcome.
```

**Traces:** PRD §F8 (lives and end states), §F8 AC8 (single deterministic outcome on simultaneous loss), §F5 AC1 (level clear → advance).

---

## Configuration: Level Config (`src/config/levelConfig.ts`)

```typescript
export const LEVEL_CONFIGS: readonly LevelConfig[] = [
  // Level 1
  { level: 1, rows: 4, cols: 6, hpMix: { 1: 1.0 }, bossHp: null, ... },
  // Level 2
  { level: 2, rows: 4, cols: 6, hpMix: { 1: 1.0 }, bossHp: 2, ... },
  // ... levels 3–10
];

export function getLevelConfig(level: number): LevelConfig {
  // Returns LEVEL_CONFIGS[level - 1], throws if out of range.
}
```

**Usage example (spawning a level):**
```typescript
const config = getLevelConfig(world.level);
const bossIndex = config.rows * config.cols - 1; // Last enemy is the boss
const enemies: Enemy[] = [];
let hpIndex = 0;

for (let row = 0; row < config.rows; row++) {
  for (let col = 0; col < config.cols; col++) {
    const index = row * config.cols + col;
    const isBoss = config.bossHp && index === bossIndex;
    const hp = isBoss
      ? config.bossHp
      : assignHpFromMix(config.hpMix, index, config.rows * config.cols - 1);

    enemies.push({
      id: world.nextEntityId++,
      col,
      row,
      x: FORMATION_TOP_MARGIN + col * (ENEMY_WIDTH + ENEMY_H_SPACING),
      y: FORMATION_TOP_MARGIN + row * (ENEMY_HEIGHT + ENEMY_V_SPACING),
      width: ENEMY_WIDTH,
      height: ENEMY_HEIGHT,
      hitsToKill: hp,
      hitsTaken: 0,
      isBoss,
      alive: true,
    });
  }
}

world.enemies = enemies;
```

**Monotonicity validation:** The module exports an `assertMonotonicEscalation()` function that runs at module load, ensuring F4 AC5 (no level is easier than the prior) is never violated. Test-writer adds a unit test to re-verify this.

**Traces:** PRD §F4 (owner-approved 10-level progression), ADR-0003 (data-driven design, no per-level branching).

---

## Rendering & Visibility

### CanvasRenderer (`src/render/CanvasRenderer.ts`)

```typescript
export class CanvasRenderer {
  constructor(canvas: HTMLCanvasElement) { ... }
  render(world: World): void { ... }
}
```

**Purpose:** draws the game field to the canvas each frame, including all entities and state-dependent visuals.

**Typical implementation:**
1. Clear the canvas (fillRect with background color).
2. For each enemy, draw its sprite. If enemy.hitsTaken > 0, vary the sprite (shape/crack pattern/outline) to show damage (NFR-9a, F4 AC6).
3. For each shield projectile, draw a small circle or kite shape.
4. For each enemy laser, draw a small circle or blast shape.
5. For each power-up, draw the icon corresponding to its type.
6. If world.effects.shieldRemaining > 0 or world.player.postHitInvulnRemaining > 0, draw the player with an aura/blink overlay (NFR-9a, F8 AC9).
7. If world.formationWarningActive, draw a pulsing border and/or warning text at the screen edges (F3 AC6, NFR-9a).

**Example (drawing a state-dependent enemy sprite):**
```typescript
function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, damageVisibility: boolean) {
  const remainingHits = enemy.hitsToKill - enemy.hitsTaken;

  ctx.fillStyle = remainingHits === enemy.hitsToKill ? '#4a9eff' : '#ff6b6b'; // Different color for damage
  ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

  // Non-color-only state: draw cracks or a damage outline
  if (remainingHits < enemy.hitsToKill) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(enemy.x + 2, enemy.y + 2, enemy.width - 4, enemy.height - 4);
  }
}
```

**Traces:** PRD §F4 AC6 (non-color-only damage visibility), §F7 AC6 & §F8 AC9 (invulnerability visibility), §F3 AC6 (formation-approach warning), NFR-9(a).

---

### Shape Draw Functions (`src/render/shapes.ts`)

```typescript
export function drawShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color?: string): void
export function drawVanguard(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, invulnerable?: boolean): void
export function drawSentinel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, damage?: number, maxDamage?: number): void
export function drawBossSentinel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, damage?: number, maxDamage?: number): void
export function drawPowerUpIcon(ctx: CanvasRenderingContext2D, x: number, y: number, type: PowerUpType, radius: number): void
export function drawEnemyLaser(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void
```

**All sprites are drawn procedurally as vector shapes (ADR-0004), not raster images.** The exact designs are auditable and can be tweaked by changing the draw code without re-authoring art.

**Example: shield shape (teal kite/diamond, not a red-white-blue star):**
```typescript
function drawShield(ctx, x, y, radius, color = '#20c997') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - radius);         // Top point
  ctx.lineTo(x + radius, y);         // Right point
  ctx.lineTo(x, y + radius);         // Bottom point
  ctx.lineTo(x - radius, y);         // Left point
  ctx.closePath();
  ctx.fill();
  // Optional: draw a border or inner detail
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
}
```

**Anti-motif compliance (F9 AC4 / NFR-10):**
- **Shield:** a plain teal diamond/kite — NOT a red-white-blue concentric-star disc.
- **Vanguard:** a rounded helmet + triangular torso with a simple chevron chest emblem — NOT a specific licensed hero likeness.
- **Sentinels:** blocky rectangles with a circular sensor — NOT a trademarked robot model.
- **No wordmarks or third-party fonts anywhere.**

**Traces:** PRD §F9 AC4 (hard IP constraint, original designs), NFR-10, ADR-0004 (procedural art strategy).

---

## Instrumentation (`src/instrumentation/Instrumentation.ts`)

```typescript
export function emit(eventType: string, data?: Record<string, any>): void
```

**Purpose:** fire-and-forget telemetry to track market goals (NFR-8). Events are stored in browser localStorage under a single namespaced key (`vvs:metrics`) as anonymous integer counters.

**Typical events:**
- `sessionStart` — run begins.
- `levelReached` — player reached a level (data: { level }).
- `runRestart` — player selected Restart Game.
- `powerUpCaught` — player caught a power-up (data: { type }).
- `enemyDestroyed` — enemy killed (data: { level }).

**Example usage (called from various systems):**
```typescript
// In GameStateMachine, on run start
emit('sessionStart');

// In WinLossSystem, on level clear
emit('levelReached', { level: world.level });

// In CollisionSystem, on power-up catch
emit('powerUpCaught', { type: powerUp.type });
```

**Traces:** PRD §NFR-8 (instrumentation hooks for market goals B1–B4 / P1–P5), architecture §Data Flow (localStorage is write-only, never sent to a server).

---

## World Factory (`src/core/world.ts`)

```typescript
export function createNewRunWorld(): World
```

**Purpose:** factory function that initializes a fresh World object for a new run (level 1, 3 lives, 0 score, empty enemies, etc.).

**Returns:**
```typescript
{
  state: 'TITLE',
  level: 1,
  score: 0,
  lives: STARTING_LIVES,
  gameOverReason: null,
  player: { x: ..., y: PLAYER_Y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, ... },
  enemies: [],  // Populated on level start by FormationSystem
  shields: [],
  enemyLasers: [],
  powerUps: [],
  effects: { hitPowerRemaining: 0, speedRemaining: 0, shieldRemaining: 0 },
  permanentMultiplier: 1,
  formation: { direction: 1, offsetX: 0, offsetY: 0, ... },
  ...
}
```

**Traces:** PRD §F1–F10 (initializes all fields required for a full game).

---

## Extending the Game

### To add a new power-up type:

1. Add variant to `PowerUpType` in `types.ts`.
2. Add timer field to `ActiveEffects` if temporary, or handle in permanentMultiplier if permanent.
3. Add draw function in `shapes.ts` (e.g., `drawPowerUpIcon(..., type, ...)`).
4. Add collision-dispatch case in `CollisionSystem.ts` to apply the effect.
5. Optionally add a visual effect in `CanvasRenderer.ts` to show it's active (e.g., a UI badge or player aura).
6. Update `README.md` § Configuration with the new power-up.
7. Add unit tests.

### To add levels 11+:

1. Add row(s) to `LEVEL_CONFIGS` in `levelConfig.ts` following the monotonicity pattern (F4 AC5).
2. Update `MAX_LEVEL` in `constants.ts`.
3. Adjust `BASE_FORMATION_SPEED` / `BASE_ENEMY_FIRE_INTERVAL_SECONDS` if needed to maintain pacing.
4. Test with `npm run test` to verify monotonicity assertion.

### To add a custom enemy type:

1. Extend `Enemy` interface in `types.ts` (e.g., add an `enemyType: 'regular' | 'special'` field).
2. Update the spawn logic in `world.ts` or wherever enemies are created.
3. Add a new draw function in `shapes.ts` or a conditional in the existing one.
4. Update collision logic in `CollisionSystem.ts` if the new enemy has special behavior (e.g., split on hit, fire multiple lasers).
5. Update tests.

---

**Last updated:** 2026-07-06  
**For questions or issues:** see `docs/README.md` for the full project context and links to architecture docs.
