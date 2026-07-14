# API Documentation

**Internal module reference for extending Vanguard vs. Sentinels: Shield Invaders.**

Since this is a fully client-side game with no HTTP backend, "API" here refers to the internal TypeScript module interfaces that define how the simulation works. This documentation is for contributors who want to:

- Add new power-up types
- Extend the game to 11+ levels
- Introduce new enemy variants or mechanics
- Modify gameplay balance (timings, speeds, HP curves)

---

## Quick Navigation

### [`internal-modules.md`](./internal-modules.md)
Complete reference for all public types, functions, and configuration constants. Organized by module with:
- Function signatures
- Type definitions
- Real usage examples
- Traceability links back to PRD features and ADRs

**Key sections:**
- Core Types (GameState, Player, Enemy, PowerUpDrop, LevelConfig, World)
- Configuration Constants (FIXED_DT, player speeds, power-up durations, level-progression base values)
- Systems (Movement, Formation, EnemyFire, Projectile, Collision, PowerUp, WinLoss)
- Rendering (CanvasRenderer, procedural sprite-draw functions)
- Instrumentation (event tracking)
- World Factory (game state initialization)
- Extending the Game (step-by-step guides for new power-ups, levels, enemies)

---

## Example: Adding a New Power-Up

Here's how you'd add a "Shield Refresh" power-up that grants an extra life:

### 1. Update types.ts
```typescript
export type PowerUpType = 'HIT_POWER' | 'SPEED' | 'SHIELD' | 'PERMANENT_MULTIPLIER' | 'EXTRA_LIFE';
```

### 2. Update shapcs.ts
```typescript
export function drawPowerUpIcon(ctx, x, y, type, radius) {
  // ... existing cases ...
  if (type === 'EXTRA_LIFE') {
    ctx.fillStyle = '#ff0000'; // Red for extra life
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    // Draw a "+1" or heart symbol inside
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+1', x, y + 4);
  }
}
```

### 3. Update CollisionSystem.ts
In the `checkPlayerPowerUpCollisions()` function:
```typescript
if (powerUp.type === 'EXTRA_LIFE') {
  world.lives += 1;
  emit('extraLifeGained', { level: world.level });
}
```

### 4. Add to spawn chances (CollisionSystem.ts)
When rolling for a power-up type on enemy death:
```typescript
const powerUpTypes: PowerUpType[] = ['HIT_POWER', 'SPEED', 'SHIELD', 'PERMANENT_MULTIPLIER', 'EXTRA_LIFE'];
const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
```

### 5. Test it
```bash
npm run test
```

Check that the new power-up doesn't break existing tests and the game still runs.

---

## Example: Adding a Custom Enemy

Let's add a "Shielded Sentinel" that splits into two smaller enemies when destroyed:

### 1. Extend the Enemy type (types.ts)
```typescript
export interface Enemy {
  // ... existing fields ...
  variantType?: 'regular' | 'shielded'; // NEW
}
```

### 2. Update spawn logic (world.ts or FormationSystem.ts)
```typescript
// When spawning enemies for a level, randomly assign a few as 'shielded'
for (let i = 0; i < enemies.length; i++) {
  if (Math.random() < 0.2) { // 20% chance
    enemies[i].variantType = 'shielded';
    enemies[i].hitsToKill += 1; // Shielded enemies are tougher
  }
}
```

### 3. Add rendering (shapes.ts)
```typescript
function drawSentinelVariant(ctx, x, y, width, height, variantType, damage) {
  if (variantType === 'shielded') {
    // Draw a protective ring/shield effect around the regular enemy
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, width / 2 + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Then draw the regular enemy inside
  drawSentinel(ctx, x, y, width, height, damage);
}
```

### 4. Handle special behavior on death (CollisionSystem.ts)
```typescript
if (enemy.alive === false && enemy.variantType === 'shielded') {
  // Spawn two smaller enemies where the shielded one died
  for (let i = 0; i < 2; i++) {
    const newEnemy: Enemy = {
      id: world.nextEntityId++,
      x: enemy.x + (i === 0 ? -20 : +20),
      y: enemy.y,
      // ... other fields ...
      variantType: 'regular',
      hitsToKill: 1, // Smaller variants are weaker
      alive: true,
    };
    world.enemies.push(newEnemy);
  }
}
```

### 5. Test it
```bash
npm run test
npm run dev
```

Play the game and check that shielded enemies appear, are visibly different, and split when destroyed.

---

## Tuning Difficulty

To adjust how hard the game is without changing the code structure:

### Easy adjustments (constants.ts):
- `PLAYER_BASE_SPEED` — make the player faster to dodge lasers
- `THROW_INTERVAL_SECONDS` — reduce to allow faster throws
- `POST_HIT_INVULN_SECONDS` — increase for longer mercy i-frames
- `BASE_FORMATION_SPEED` — decrease to slow down the formation
- `BASE_ENEMY_FIRE_INTERVAL_SECONDS` — increase to slow enemy fire rate
- `EXTRA_DROP_CHANCE` — increase to make power-ups more frequent

### Medium adjustments (levelConfig.ts):
- Modify the `hpMix` distribution for each level (e.g., more 1-hit enemies at level 5)
- Adjust `formationSpeedMultiplier` or `fireRateMultiplier` per level
- Change `rows` or `cols` to make formations smaller or larger

### Hard adjustments:
- Add new power-up types with custom effects
- Introduce enemy variants with special behaviors
- Modify the system update order (only if you understand ADR-0002 determinism)

---

## Testing & Validation

All changes should pass the test suite:
```bash
npm run test
```

Before committing, also:
1. **Type-check:** `npm run typecheck` (ensures no TypeScript errors)
2. **Lint:** `npm run lint` (code style)
3. **Play-test:** `npm run dev` and manually test your new feature

The test suite includes:
- Unit tests for collision logic, power-up effects, and level config monotonicity
- Integration tests for full game flow (level transitions, end states)
- Input/output validation tests for instrumentation and HUD updates

See `docs/tests/validation-report.md` for the full test report.

---

## Architecture Reference

For deeper context on why the code is organized this way:

- **Fixed-timestep game loop:** `docs/architecture/adr/0002-loop-state-determinism.md`
- **Data-driven level config:** `docs/architecture/adr/0003-data-driven-levels.md`
- **Procedural vector art:** `docs/architecture/adr/0004-procedural-vector-assets.md`
- **Instrumentation mechanism:** `docs/architecture/adr/0005-instrumentation.md`

---

## Traceability

Every module, function, and constant in this project is traceable back to a PRD requirement or an architectural decision. For example:

- The `LevelConfig` type is defined per **PRD §F4** (owner-approved 10-level progression) and justified in **ADR-0003** (data-driven design, no per-level branching).
- The `GameLoop` fixed-timestep accumulator is specified in **ADR-0002** (ensures deterministic behavior for simultaneous end conditions).
- The `drawSentinel` procedural draw function is constrained by **PRD §F9 AC4 / NFR-10** (no trademark-adjacent motifs, fully original designs).

See `docs/GLOSSARY.md` for a complete terminology reference.

---

**Next step:** dive into [`internal-modules.md`](./internal-modules.md) to start exploring the APIs.
