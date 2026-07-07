# Vanguard vs. Sentinels: Shield Invaders

**A browser-based arcade shooter where you play as Vanguard, a shield-throwing hero, defending against waves of Sentinel robots across 10 increasingly difficult levels.**

This is a fully client-side, single-session game with no backend, no account required, and instant load. Pick up and play within seconds using only arrow keys, space, and Esc.

**Sources:**
- `docs/PRD.md` — the complete product requirements and feature specification.
- `docs/architecture/solution-architecture.md` — technical stack, component design, and non-functional requirements.
- `docs/api/` — internal module interfaces for extending the game (adding new power-ups, levels 11+, custom enemies).

---

## What This Game Is

Vanguard vs. Sentinels remixes the classic Space Invaders formula with an original premise: you are **Vanguard**, an original shield-throwing hero, fighting formations of **Sentinel** robots that descend and fire lasers back at you. The game is finite (10 levels), with escalating difficulty, catchable power-ups, a visible score, and a 3-lives fail model. You can pause, restart any level, or exit cleanly at any time without reloading the page.

**Gameplay loop:**
1. **Arrow keys** move left and right.
2. **Space bar** throws a shield upward (unlimited throws, paced by a 250 ms animation interval).
3. **Esc** pauses the game.
4. Clear all enemies in a formation to advance to the next level.
5. Catch falling power-ups for temporary or permanent boosts.
6. Reach level 10 to win; lose all 3 lives or let the formation reach the bottom to lose.

**Difficulty escalates across 10 levels:**
- Enemy HP mix shifts from all 1-hit (level 1) to up to 4-hit enemies (level 10).
- Formation size grows, formation speed multiplier increases, and enemy fire rate ramps up per level.
- Boss enemies appear in levels 2–10 with higher HP than regular enemies.

**Four power-up types** drop from random enemies:
- **5× Hit Power** — your shields do 5× damage for 8 seconds.
- **3× Speed** — you move 3× faster for 8 seconds.
- **Indestructible Shield** — you are invulnerable for 8 seconds.
- **Permanent Hit-Power Multiplier** — your shields do ×1.8 damage permanently (stacks multiplicatively).

---

## Setup

### Prerequisites
- **Node.js** 18+ and **npm** (or equivalent package manager).
- A modern desktop browser (Chrome, Firefox, Edge, or Safari, latest 2 versions).

### Install Dependencies

```bash
npm install
```

This installs Vite (bundler), TypeScript, Vitest (test runner), and the dev-time linting/formatting tools. **No runtime framework or third-party game engine is used** — the game is pure TypeScript + HTML5 Canvas.

---

## Running It

### Development Mode (with hot reload)

```bash
npm run dev
```

Open your browser to the URL printed in the terminal (typically `http://localhost:5173`). Changes to source files reload automatically.

### Production Build

```bash
npm run build
```

This:
1. Runs TypeScript type-check (`tsc --noEmit`).
2. Bundles and minifies the app with Vite into the `dist/` directory.

The output is a set of static files ready to serve from any web server or static host.

### Preview the Production Build Locally

```bash
npm run preview
```

Serves the contents of `dist/` on a local URL to test the production bundle.

### Type-Check Only

```bash
npm run typecheck
```

Validates all TypeScript without emitting JavaScript.

### Lint and Format

```bash
npm run lint      # Check code style (ESLint).
npm run format    # Check formatting (Prettier).
```

### Run Tests

```bash
npm run test       # Run all tests once.
npm run test:watch # Run tests in watch mode (re-run on file change).
```

Tests are written with Vitest and placed alongside the source code with a `.test.ts` extension.

---

## Controls

| Key | Action |
|---|---|
| **Left Arrow** (`←`) | Move player left |
| **Right Arrow** (`→`) | Move player right |
| **Space** | Throw shield upward |
| **Esc** | Pause / Resume |
| **Up / Down** | Navigate pause menu (when paused) |
| **Enter** | Confirm pause menu selection |

**First time playing?** A one-line control hint appears on-screen at the start of each run so you do not need to remember these.

---

## Gameplay Overview

### Scoring
- **Enemy kills** award points scaled by the current level (higher levels give more points per kill).
- **Power-up catches** award a flat 250-point bonus.
- Score resets when you restart the game; it is preserved across level transitions within a single run.

### Lives & Game Over
- You start with **3 lives**.
- An enemy laser costs 1 life. After being hit, you gain 1.5 seconds of invulnerability (post-hit i-frames) so you do not instantly die from multi-hit.
- You lose if lives reach 0 OR the enemy formation reaches the bottom of the screen.
- Clearing all 10 levels triggers a **Victory** screen. The run is deliberate — not an abrupt cutoff.

### Power-Ups
- A random enemy per level drops a power-up at the moment it dies. You must catch it (collide with it) to activate.
- Uncaught power-ups fall off the bottom of the screen with no effect.
- **Temporary effects** (5× Hit Power, 3× Speed, Indestructible Shield) last exactly 8 seconds and are paused while the game is paused.
- **Permanent Multiplier** stacks multiplicatively — catch two, and your base damage becomes ×3.24 (×1.8 × 1.8).
- If you catch the same *type* of temporary effect while one is already active, the new one resets the timer to 8 seconds (it does not stack duration).

### Pause & Menu
Press **Esc** to pause. The pause menu offers:
- **Resume** — continue where you left off (exact state is frozen, including power-up timers and formation position).
- **Restart Level** — restart the current level from its beginning.
- **Restart Game** — go back to level 1 fresh (resets permanent multiplier and score).
- **Quit** — attempt to close the tab; if blocked, a fallback screen confirms the run has ended.

All selections are keyboard-navigable (Up/Down arrow, Enter) and do not require a mouse.

---

## Configuration & Tuning

Game balance constants (player speed, throw interval, power-up durations, level progression) are defined in `src/config/constants.ts`:

| Constant | Value | Meaning |
|---|---|---|
| `PLAYER_BASE_SPEED` | 260 px/s | Player horizontal speed (before the 3× speed-up power-up). |
| `THROW_INTERVAL_SECONDS` | 0.25 s | Minimum 250 ms between throws (F2 AC2). |
| `SHIELD_SPEED` | 480 px/s | Shield projectile vertical speed. |
| `STARTING_LIVES` | 3 | Lives at the start of each run. |
| `POST_HIT_INVULN_SECONDS` | 1.5 s | Duration of post-hit invulnerability i-frames (tunable default per PRD F8 AC9). |
| `POWERUP_DURATION_SECONDS` | 8 s | Duration of temporary power-up effects. |
| `PERMANENT_MULTIPLIER_PER_CATCH` | 1.8 | Permanent multiplier stacking factor. |
| `HIT_POWER_MULTIPLIER` | 5 | Temporary 5× Hit Power multiplier. |
| `SPEED_MULTIPLIER` | 3 | Temporary 3× Speed multiplier. |
| `EXTRA_DROP_CHANCE` | 0.1 | Probability (10%) of an extra power-up drop beyond the guaranteed one per level. |
| `BASE_FORMATION_SPEED` | 30 px/s | Level-1 formation speed; multiplied by the level-specific `formationSpeedMultiplier` in `levelConfig.ts`. |
| `BASE_ENEMY_FIRE_INTERVAL_SECONDS` | 3.2 s | Level-1 aggregate enemy fire interval; multiplied by `fireRateMultiplier` per level. |
| `FORMATION_WARNING_ENABLED` | true | Whether the one-row-early approach warning (F3 AC6) is visible. Can be disabled by setting to false. |

The **10-level progression table** (enemy HP mix, formation size, speed and fire-rate multipliers, guaranteed power-up drops) is in `src/config/levelConfig.ts` and is the single source of truth for difficulty parameters (see ADR-0003).

---

## Architecture & Design

This is a **fixed-timestep, deterministic game loop** driving all gameplay:

1. **InputManager** snapshots held keys each frame.
2. **GameLoop** accumulates real time and steps the simulation a fixed number of times per animation frame (60 Hz), decoupled from the render rate.
3. **GameStateMachine** manages screen states (TITLE, PLAYING, PAUSED, GAMEOVER, VICTORY) and routes input accordingly.
4. **Systems** (Movement, Formation, EnemyFire, Projectile, Collision, PowerUp, Lives, WinLoss, HUDModel) execute in a deterministic order each tick, mutating a single **World** object.
5. **CanvasRenderer** draws the game field (entities, damage/invulnerability states) to a single HTML5 `<canvas>`.
6. **HUDView & ScreenController** manage DOM overlays for the score, lives, level indicator, permanent-multiplier display, temporary-effect timers, control hints, and the pause/Game Over/Victory screens.

**Key design principles:**
- **No framework:** pure TypeScript + Canvas 2D + minimal DOM. No React, Vue, Phaser, or PixiJS — keeps the bundle small and 60 FPS achievable on modest hardware.
- **Data-driven levels:** the 10-level table is read, never branched-on in code (no hardcoded level-specific logic).
- **Deterministic system order:** ensures simultaneous end conditions (lives=0 and formation reaches bottom in the same frame) resolve to a single, consistent outcome.
- **Pause-safe timers:** all effect durations use a "remaining time" pattern and only decrement during PLAYING state, so pause cannot leak wall-clock time.
- **Procedural art:** all sprites (shield, Vanguard, Sentinels, power-ups, lasers) are drawn as vector shapes in code, not raster images — keeps the asset load near-zero, makes the IP constraint (no trademark-adjacent motifs) auditable, and enables state variations (damage flashes, invulnerability glows) as draw parameters.

For deeper details, see `docs/architecture/solution-architecture.md` and the ADRs under `docs/architecture/adr/`.

---

## Project Structure

```
scaffold/
├── src/
│   ├── main.ts              # Entry point, wires loop/renderer/HUD/screens.
│   ├── core/
│   │   ├── GameLoop.ts      # Fixed-timestep accumulator loop.
│   │   ├── GameStateMachine.ts  # Screen state machine (TITLE/PLAYING/PAUSED/GAMEOVER/VICTORY).
│   │   ├── types.ts         # Shared type definitions (World, Entity interfaces).
│   │   └── world.ts         # World factory (creates new run state).
│   ├── systems/
│   │   ├── MovementSystem.ts      # Player movement (F1).
│   │   ├── FormationSystem.ts      # Enemy formation movement (F3).
│   │   ├── EnemyFireSystem.ts      # Enemy laser firing (F5).
│   │   ├── ProjectileSystem.ts     # Shield projectile updates.
│   │   ├── CollisionSystem.ts      # Collision detection (shields/lasers/power-ups).
│   │   ├── PowerUpSystem.ts        # Power-up effects and timers (F7).
│   │   ├── WinLossSystem.ts        # Terminal condition checks (F8).
│   │   └── levelRuntimeState.ts    # Guaranteed power-up drop tracking per level.
│   ├── config/
│   │   ├── constants.ts           # Tunable balance constants.
│   │   └── levelConfig.ts         # 10-level progression table (ADR-0003, F4).
│   ├── render/
│   │   ├── CanvasRenderer.ts      # Canvas 2D rendering (game field).
│   │   └── shapes.ts              # Procedural draw functions for all sprites.
│   ├── ui/
│   │   ├── HUDView.ts             # Score, lives, level, power-up displays.
│   │   ├── ScreenController.ts    # Title, pause, Game Over, Victory screens.
│   │   └── dom.ts                 # DOM helper utilities.
│   ├── instrumentation/
│   │   └── Instrumentation.ts     # Event tracking (session start, level reached, etc., NFR-8).
│   └── style.css                  # Styles for HUD and screen overlays.
├── index.html               # Single entry point.
├── dist/                    # Build output (generated by `npm run build`).
├── package.json             # Dependencies and npm scripts.
├── tsconfig.json            # TypeScript configuration.
├── vite.config.ts           # Vite bundler configuration.
└── docs/                    # Documentation (this directory).
    ├── README.md            # This file.
    ├── GLOSSARY.md          # Game and code terminology.
    ├── PRD.md               # Product requirements (features, acceptance criteria).
    ├── architecture/        # Architecture docs and ADRs.
    ├── api/                 # Module interface reference for contributors.
    └── ...                  # Other docs (reviews, plans, results).
```

---

## Next Steps for Developers

### Adding a New Power-Up Type

1. Add a new `PowerUpType` variant in `src/core/types.ts`.
2. Add a draw function for it in `src/render/shapes.ts`.
3. Update collision detection in `src/systems/CollisionSystem.ts` to handle the new effect.
4. Add a new timer field to `src/core/types.ts` `ActiveEffects` if it's a temporary effect, or mutate `world.permanentMultiplier` if permanent.
5. Update the power-up drop selector in `src/systems/CollisionSystem.ts` to include the new type.
6. Add test coverage in `src/__tests__/` for the new behavior.

See `docs/api/internal-modules.md` for function signatures.

### Adding Levels 11+

1. Add rows to the `LEVEL_CONFIGS` array in `src/config/levelConfig.ts`.
2. Update `MAX_LEVEL` in `src/config/constants.ts`.
3. Adjust `BASE_FORMATION_SPEED`, `BASE_ENEMY_FIRE_INTERVAL_SECONDS`, and other multiplier-base values if the difficulty curve feels off.
4. Re-run tests to verify monotonicity (see ADR-0003).

### Adding a New Enemy Type

1. Extend the `Enemy` interface in `src/core/types.ts` with any new fields (e.g., `enemyType: 'regular' | 'special'`).
2. Add a constructor or factory function in `src/core/world.ts` to spawn the new variant.
3. Update `src/render/shapes.ts` to draw the new variant's sprite.
4. Update collision and fire logic in `src/systems/` if the new enemy has special behavior.

---

## Deployment

The built output (`dist/` directory) is a static bundle: one HTML entry, a minified JS module, CSS, and no external asset fetches at runtime.

**Deploy to any static host:**
- A CDN (Netlify, Vercel, AWS CloudFront, etc.)
- A static server (nginx serving `dist/`)
- The provided Docker container (see `deployment-engineer` notes)

**Browser requirements:** modern desktop browsers (Chrome, Firefox, Edge, Safari) of the latest 2 versions. Mobile browsers and gamepad input are not supported in v1.

**No backend required:** the game runs entirely client-side. There is no server to configure, no database to provision, and no login wall. A player at any URL can open the game and play a full run offline (after initial load).

---

## Troubleshooting

### Game loads but is blank

1. Open the browser console (F12) and check for errors.
2. Ensure the canvas element has a rendering context: `document.getElementById('game-canvas')?.getContext('2d')` should not return null.
3. Check that `src/main.ts` completed its bootstrap: look for console output or a missing `#app-root` div.

### Performance drops at level 10

The game is tuned to maintain 60 FPS on mid-range hardware with all 48-54 enemies + projectiles active. If you see frame drops:
1. Check that the browser is not throttled (developer tools > Performance > CPU throttling).
2. Profile with the Chrome DevTools Profiler to see which system is slow.
3. Consider reducing `EXTRA_DROP_CHANCE` or `BASE_ENEMY_FIRE_INTERVAL_SECONDS` to lower the entity count.

### Power-ups not appearing

Check that:
1. `FORMATION_WARNING_ENABLED` is set correctly (it should not block power-ups).
2. At least one enemy has died per level (guaranteed drop is only on first death per level, see `src/systems/levelRuntimeState.ts`).
3. The power-up fell off-screen (power-ups fall at `POWERUP_FALL_SPEED` and are despawned if they reach the bottom).

---

## Links to Key Documents

- **Features & Acceptance Criteria:** `docs/PRD.md` — the ground truth for what the game does.
- **Architecture & Component Design:** `docs/architecture/solution-architecture.md`.
- **Architecture Decision Records:** `docs/architecture/adr/` — detailed rationales for stack, loop design, level config, art, and instrumentation.
- **API Reference:** `docs/api/internal-modules.md` — module signatures for extending the game.
- **Glossary:** `docs/GLOSSARY.md` — terminology used across the codebase and docs.
- **Security Review:** `docs/security/security-review-v2.md` — final pass-2 review (v1 is PASS).
- **Tests & Validation:** `docs/tests/validation-report.md` — test coverage and results.

---

**Version:** 1.0.0 (demo)  
**Date:** 2026-07-06  
**Status:** shipped (v1)
