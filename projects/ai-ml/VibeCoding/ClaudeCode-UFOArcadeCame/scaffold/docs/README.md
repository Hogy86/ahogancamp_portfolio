# Vanguard vs. Sentinels: Shield Invaders

**A browser-based arcade shooter where you play as Vanguard, a humanoid shield-throwing hero, defending against waves of Sentinel robots across 10 increasingly difficult levels, including bosses on levels 5 and 10.**

This is a fully client-side, single-session game with no backend, no account required, and instant load. Pick up and play within seconds using only arrow keys, space, and Esc.

**Sources:**
- `docs/PRD.md` — the complete product requirements and feature specification.
- `docs/PRD-addendum-v2.md` — v2 feature additions (F11–F19: boss encounters, shield bounces, single power-up slot, level intros, Game Complete celebration).
- `docs/architecture/solution-architecture.md` — technical stack, component design, and non-functional requirements.
- `docs/api/internal-modules.md` — internal module interfaces for extending the game (adding new power-ups, levels 11+, custom enemies).

---

## What This Game Is

Vanguard vs. Sentinels remixes the classic Space Invaders formula with an original premise: you are **Vanguard**, an original shield-throwing hero with a humanoid silhouette, fighting formations of **Sentinel** robots that descend and fire lasers back at you. The game is finite (10 levels), with escalating difficulty, catchable power-ups, a visible score, and a 3-lives fail model. Boss enemies appear on levels 5 and 10 after the regular formation is cleared. You can pause, restart any level, or exit cleanly at any time without reloading the page.

**Gameplay loop:**
1. **Arrow keys** move left and right.
2. **Space bar** throws a circular blue shield upward (one shield in flight at a time; the next throw is gated by the current shield leaving play).
3. **Esc** pauses the game.
4. Clear all enemies in a formation to advance to the next level.
5. On levels 5 and 10, after the formation clears, a brief "BOSS INCOMING" warning precedes a single, tougher boss enemy that must be defeated to level up (or win if level 10).
6. Catch falling power-ups for temporary or permanent boosts.
7. Reach level 10 and defeat the final boss to win; lose all 3 lives or let the formation reach the bottom to lose.

**Difficulty escalates across 10 levels:**
- Enemy HP mix shifts from all 1-hit (level 1) to up to 4-hit enemies (level 10).
- Formation size grows, formation speed multiplier increases, and enemy fire rate ramps up per level.
- Boss enemies appear on levels 5 and 10, with 5× the hit points of the toughest regular enemy on that level, and 5× the size. They are rendered in a boss-unique dark color for clear visual distinction.

**Shield mechanics (v2):**
- The shield now **bounces off enemies** at different angles depending on where it hits: direct center-face hits stop the shield, corner hits bounce diagonally away from the enemy's center, and side hits bounce horizontally. Each contact applies exactly one hit of damage.
- **One shield may be in flight at a time** — pressing space while a shield is already traveling has no effect; the next throw is gated by the current shield leaving play (via screen exit, a center-face hit that stops it, a direct catch, or a max-lifetime safety timeout of 6 seconds).
- **Catching a bouncing shield that returns to you grants +1 life** — enabling a skill-based reward loop where understanding the bounce geometry pays off. The shield never harms the player under any circumstance.
- A short **visual trail** renders on in-flight shields so you can perceive their path and anticipate bounces, making the deterministic bounce geometry visible and learnable.

**Power-up mechanics (v2):**
- **Only one temporary power-up is active at a time** (mutual exclusion). The three temporary effects (5× Hit Power, 3× Speed, Indestructible Shield) share a single active slot; catching any temporary power-up while another is active **immediately cancels the current one** and activates the new one with a full fresh 8-second timer (not cumulative).
- The **Permanent Hit-Power Multiplier** is exempt from this rule — it has no timer, never blocks or is blocked by temporary effects, and continues to stack multiplicatively across the run.
- The active-temporary-effect indicator shows exactly the one active effect and its remaining duration; it switches instantly when a new power-up is caught.
- All four power-up types are visually distinguishable while falling (non-color-only design, each has a distinct icon/shape) so you can identify an incoming drop and choose whether to catch or dodge it.

**Level intro and end-sequence mechanics (v2):**
- Every **fresh level start** (new run or level advance, including boss-to-next-level transitions) opens with a **3-second "LEVEL [N]" freeze/fade** before gameplay is live. During this time, the player and formation are visible but frozen — nobody moves, no firing, and input is wired but not live. The text fades out as the countdown completes. **Restart Level is the sole exception** — it skips the intro and drops straight into play for faster retry learning.
- Defeating the **level-10 boss** triggers a **5-second "Game Complete" celebration** instead of a static victory screen. Multi-colored firework explosions animate around the "Game Complete" text on the black background. After 5 seconds, the game automatically returns to the main menu. Pressing any key (except Esc) during the celebration **holds** the screen so you can read/screenshot your final score; a second press advances to the title screen. (Esc remains a silent no-op, preserving the pause-screen convention.)

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
| **Esc** | Pause / Resume (or no-op during Game Complete) |
| **Up / Down** | Navigate pause menu (when paused) |
| **Enter** | Confirm pause menu selection |
| **Any other key** (during Game Complete celebration) | Hold the score screen (press again to advance to title) |

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
- **Catching a bouncing shield that returns to you grants +1 life** — a skill-based reward for mastering the bounce mechanic.
- You lose if lives reach 0 OR the enemy formation reaches the bottom of the screen.
- Clearing all 10 levels (including defeating the level-10 boss) triggers a **Game Complete celebration** (5 seconds with fireworks) and then returns to the title screen. The run is deliberate — not an abrupt cutoff.

### Power-Ups
- A random enemy per level drops a power-up at the moment it dies. You must catch it (collide with it) to activate.
- Uncaught power-ups fall off the bottom of the screen with no effect.
- **Temporary effects** (5× Hit Power, 3× Speed, Indestructible Shield) last exactly 8 seconds and are paused while the game is paused.
- **Temporary effects are mutually exclusive** — at most one is active. Catching a temporary power-up while another is already active immediately deactivates the current one and activates the new one with a full 8-second timer (not cumulative).
- **Permanent Multiplier** stacks multiplicatively — catch two, and your base damage becomes ×3.24 (×1.8 × 1.8). The permanent multiplier is never affected by the temporary-effect slot and has no timer.

### Shield Mechanics
- The shield bounces off enemies at different angles based on impact zone (corner, side, or direct center-face). Each enemy contact deals one hit of damage; the shield may damage multiple enemies over its bounce path.
- A **direct center-face hit** (top or bottom) stops the shield (removes it from play), enabling you to control the shield's lifespan.
- **Corner hits** bounce the shield diagonally away from that corner (e.g., bottom-left corner → bounces down-left).
- **Side hits** bounce the shield purely horizontal (left side → bounces due left, right side → bounces due right).
- A short **visual trail** on in-flight shields helps you track their path and anticipate bounces, making the geometry learnable.
- The shield never leaves play on its own (no screen-edge bounces); it only exits on screen-edge crossing, a stopping impact, a catch, or max-lifetime timeout (6 seconds). This ensures you are never permanently locked out of throwing.

### Pause & Menu
Press **Esc** to pause. The pause menu offers:
- **Resume** — continue where you left off (exact state is frozen, including power-up timers and formation position).
- **Restart Level** — restart the current level from its beginning (skipping the 3-second intro for fast retry).
- **Restart Game** — go back to level 1 fresh (resets permanent multiplier and score).
- **Quit** — attempt to close the tab; if blocked, a fallback screen confirms the run has ended.

All selections are keyboard-navigable (Up/Down arrow, Enter) and do not require a mouse.

---

## Configuration & Tuning

Game balance constants (player speed, shield speed, power-up durations, level progression) are defined in `src/config/constants.ts`:

| Constant | Value | Meaning |
|---|---|---|
| `PLAYER_BASE_SPEED` | 260 px/s | Player horizontal speed (before the 3× speed-up power-up). |
| `SHIELD_SPEED` | 480 px/s | Shield projectile travel speed (constant magnitude; bounces change direction only, F15 AC6). |
| `SHIELD_MAX_LIFETIME_SECONDS` | 6 s | Safety-valve timeout after which a bouncing shield auto-despawns (F16 Item E), so the one-in-flight rule never permanently locks out the next throw. |
| `SHIELD_CORNER_ZONE_FRACTION` | 0.3 | Outer fraction of each enemy face that counts as a "corner" zone; the middle is "center"/"side" (F15 AC7). |
| `SHIELD_TRAIL_LENGTH` | 8 | Number of recent positions retained for the rendering-only trail (F15 AC9). |
| `BOSS_SIZE_MULTIPLIER` | 5 | Boss linear dimensions are 5× a regular enemy (F12 AC5). |
| `BOSS_FORMATION_SPEED_MULTIPLIER` | 1.2 | Boss uses a fixed speed multiplier instead of the aliveCount formula, so it feels "big and tanky" (F12). |
| `BOSS_WARNING_SECONDS` | 1.75 s | Duration of the lightweight "BOSS INCOMING" telegraph before the boss spawns (F12 AC10-11). |
| `LEVEL_INTRO_SECONDS` | 3 s | Duration of the level-start "LEVEL [N]" freeze/fade intro (F18). |
| `LEVEL_INTRO_TEXT_COLOR` | #ffd873 | Amber/gold color for the level-intro and boss-warning text (F18 AC3, F12 AC10). |
| `VICTORY_CELEBRATION_SECONDS` | 5 s | Duration of the "Game Complete" celebration before auto-return to title (F19). |
| `FIREWORK_BURST_COUNT` | 6 | Number of firework bursts during the celebration (F19 AC4). |
| `FIREWORK_PARTICLES_PER_BURST` | 12 | Particles per burst (F19 AC4). |
| `VANGUARD_BLUE` | #2f6fed | The exact blue shared by the Vanguard avatar and shield projectile (F13 AC3, F14 AC2). |
| `VANGUARD_WHITE` | #f4f6fb | The white component of Vanguard's blue-and-white humanoid design (F13 AC2). |
| `ENEMY_TOUGHNESS_COLORS` | 1: #f4f6fb, 2: #c3c6cf, 3: #787c86, 4: #3c3f46 | Enemy base colors encoding toughness: white (1-hit, weakest) through dark gray (4-hit, toughest), F17 AC3. |
| `BOSS_COLOR` | #242428 | Boss color — darkest tier, darker than any regular enemy, with clear contrast floor (F12 AC6, F17 AC5). |
| `BOSS_OUTLINE_COLOR` | #8a8a94 | Boss outline to maintain contrast against background (F17 AC5). |
| `ENEMY_EYE_COLOR` | #ff5a5a | Red eyes and lasers on Sentinels (F17 AC2-AC4). |
| `LIFE_CATCH_FLASH_SECONDS` | 1.0 s | Duration of the "+1 LIFE" catch-confirmation cue when you catch a returning shield (F16 AC9). |
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

The **10-level progression table** (enemy HP mix, formation size, boss HP, speed and fire-rate multipliers, guaranteed power-up drops) is in `src/config/levelConfig.ts` and is the single source of truth for difficulty parameters (see ADR-0003).

---

## Architecture & Design

This is a **fixed-timestep, deterministic game loop** driving all gameplay:

1. **InputManager** snapshots held keys each frame.
2. **GameLoop** accumulates real time and steps the simulation a fixed number of times per animation frame (60 Hz), decoupled from the render rate.
3. **GameStateMachine** manages screen states (TITLE, PLAYING, PAUSED, GAMEOVER, VICTORY) and routes input accordingly.
4. **Systems** (Movement, Formation, EnemyFire, Projectile, Collision, PowerUp, LevelIntro, BossWarning, VictoryCelebration, Lives, WinLoss, HUDModel) execute in a deterministic order each tick, mutating a single **World** object.
5. **CanvasRenderer** draws the game field (entities, damage/invulnerability states, shield trails, boss-incoming warnings, level-intro text, celebration fireworks) to a single HTML5 `<canvas>`.
6. **HUDView & ScreenController** manage DOM overlays for the score, lives, level indicator, permanent-multiplier display, active-temporary-effect timers, control hints, and the pause/Game Over/Game Complete screens.

**Key design principles:**
- **No framework:** pure TypeScript + Canvas 2D + minimal DOM. No React, Vue, Phaser, or PixiJS — keeps the bundle small and 60 FPS achievable on modest hardware.
- **Data-driven levels:** the 10-level table is read, never branched-on in code (no hardcoded level-specific logic).
- **Deterministic system order:** ensures simultaneous end conditions (lives=0 and formation reaches bottom in the same frame) resolve to a single, consistent outcome.
- **Pause-safe timers:** all effect durations use a "remaining time" pattern and only decrement during PLAYING state, so pause cannot leak wall-clock time.
- **Procedural art:** all sprites (shield, Vanguard, Sentinels, power-ups, lasers) are drawn as vector shapes in code, not raster images — keeps the asset load near-zero, makes the IP constraint (no trademark-adjacent motifs) auditable, and enables state variations (damage flashes, invulnerability glows, shield trails) as draw parameters.
- **Bounce geometry legibility:** the short visual trail on in-flight shields makes the deterministic 8-zone bounce model visible and learnable, supporting skill-based gameplay.

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
│   │   ├── ProjectileSystem.ts     # Shield projectile updates + bounces (F15).
│   │   ├── CollisionSystem.ts      # Collision detection, shield bounces + zone classification (F15), shield-enemy damage, catch detection (F16).
│   │   ├── PowerUpSystem.ts        # Power-up effects and the single active-effect slot (F11).
│   │   ├── LevelIntroSystem.ts     # Level-start "LEVEL [N]" 3-second freeze countdown (F18).
│   │   ├── BossWarningSystem.ts    # Boss-incoming ~1.75s telegraph (F12 AC10-11).
│   │   ├── VictoryCelebrationSystem.ts # 5-second fireworks celebration + auto-return to title (F19).
│   │   ├── WinLossSystem.ts        # Terminal condition checks (F8, boss-phase transitions).
│   │   └── levelRuntimeState.ts    # Guaranteed power-up drop tracking per level.
│   ├── config/
│   │   ├── constants.ts           # Tunable balance constants (F11-F19 additions).
│   │   └── levelConfig.ts         # 10-level progression table (ADR-0003, F4, F12 with boss HP).
│   ├── render/
│   │   ├── CanvasRenderer.ts      # Canvas 2D rendering (game field, shield trails, fireworks).
│   │   └── shapes.ts              # Procedural draw functions: humanoid Vanguard/Sentinels (F13, F17), circular shield (F14), boss variant.
│   ├── ui/
│   │   ├── HUDView.ts             # Score, lives, level, power-up displays.
│   │   ├── ScreenController.ts    # Title, pause, Game Over, Game Complete screens.
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
    ├── PRD.md               # Product requirements (v1 features F1-F10).
    ├── PRD-addendum-v2.md   # v2 feature additions (F11-F19).
    ├── architecture/        # Architecture docs and ADRs.
    ├── api/                 # Module interface reference for contributors.
    └── ...                  # Other docs (reviews, plans, results).
```

---

## Next Steps for Developers

### Adding a New Power-Up Type

1. Add a new `PowerUpType` variant in `src/core/types.ts`.
2. If temporary (timed), ensure it is distinct from the three existing temporary types (HIT_POWER, SPEED, SHIELD); the `ActiveEffect` slot holds only one temporary effect at a time (F11).
3. Add a draw function for it in `src/render/shapes.ts`.
4. Update collision detection in `src/systems/CollisionSystem.ts` to handle the new effect.
5. If temporary, the effect is automatically managed by the `world.effects.remaining` timer; catch the power-up and set `world.effects.type` and `world.effects.remaining = POWERUP_DURATION_SECONDS`. If permanent, mutate `world.permanentMultiplier`.
6. Ensure the new power-up type is visually distinguishable while falling (non-color-only per NFR-9) so players can identify incoming drops.
7. Update the power-up drop selector in `src/systems/CollisionSystem.ts` to include the new type.
8. Add test coverage in `src/__tests__/` for the new behavior.

See `docs/api/internal-modules.md` for function signatures.

### Adding Levels 11+

1. Add rows to the `LEVEL_CONFIGS` array in `src/config/levelConfig.ts`.
2. Update `MAX_LEVEL` in `src/config/constants.ts`.
3. Set `bossHp` per level: null for non-boss levels, or 5× the toughest regular-enemy tier for boss levels (if you want boss encounters; F12 limits them to levels 5 and 10 by default, but the mechanics support any level).
4. Adjust `BASE_FORMATION_SPEED`, `BASE_ENEMY_FIRE_INTERVAL_SECONDS`, and other multiplier-base values if the difficulty curve feels off.
5. Re-run tests to verify monotonicity (see ADR-0003).

### Adding a New Enemy Type

1. Extend the `Enemy` interface in `src/core/types.ts` with any new fields (e.g., `enemyType: 'regular' | 'special'`).
2. Update the spawn logic in `src/core/world.ts` to create the new variant.
3. Add a new draw function in `src/render/shapes.ts` or a conditional in the existing one.
4. Update collision logic in `src/systems/CollisionSystem.ts` if the new enemy has special behavior (e.g., split on hit, fire multiple lasers, immune to bounces).
5. Update tests.

---

## Deployment

The built output (`dist/` directory) is a static bundle: one HTML entry, a minified JS module, CSS, and no external asset fetches at runtime.

**Deploy to any static host:**
- A CDN (Netlify, Vercel, AWS CloudFront, etc.)
- A static server (nginx serving `dist/`)
- The provided Docker container (see `deployment-engineer` notes) — best for local dev/preview
- **AWS (S3 + CloudFront), no server to run or pay for:** `infra/aws/` has a ready-to-apply Terraform module (`terraform apply` + `./deploy.sh`), and [`docs/deployment/aws-console-walkthrough.md`](deployment/aws-console-walkthrough.md) walks through building the same thing by hand in the AWS Console if you want to see what's being created first. Costs roughly $0/month without a custom domain.

**Browser requirements:** modern desktop browsers (Chrome, Firefox, Edge, Safari) of the latest 2 versions. Mobile browsers and gamepad input are not supported.

**No backend required:** the game runs entirely client-side. There is no server to configure, no database to provision, and no login wall. A player at any URL can open the game and play a full run offline (after initial load).

---

## Troubleshooting

### Game loads but is blank

1. Open the browser console (F12) and check for errors.
2. Ensure the canvas element has a rendering context: `document.getElementById('game-canvas')?.getContext('2d')` should not return null.
3. Check that `src/main.ts` completed its bootstrap: look for console output or a missing `#app-root` div.

### Shield bounces are unpredictable

The shield uses a deterministic 8-zone impact classification (corners, sides, center faces). Each zone has a fixed bounce direction (absolute to the screen, not relative to incoming direction). The short visual trail on in-flight shields helps you perceive their path. If the trail is disabled or hard to see, check `SHIELD_TRAIL_LENGTH` in constants.ts and ensure rendering of the trail in CanvasRenderer.ts is not commented out.

### Performance drops at level 10

The game is tuned to maintain 60 FPS on mid-range hardware with all 48-54 enemies + projectiles + bouncing shields active. If you see frame drops:
1. Check that the browser is not throttled (developer tools > Performance > CPU throttling).
2. Profile with the Chrome DevTools Profiler to see which system is slow.
3. Consider reducing `EXTRA_DROP_CHANCE` or `BASE_ENEMY_FIRE_INTERVAL_SECONDS` to lower the entity count.

### Power-ups not appearing or single-slot replacement feels harsh

Check that:
1. `FORMATION_WARNING_ENABLED` is set correctly (it should not block power-ups).
2. At least one enemy has died per level (guaranteed drop is only on first death per level, see `src/systems/levelRuntimeState.ts`).
3. The power-up fell off-screen (power-ups fall at `POWERUP_FALL_SPEED` and are despawned if they reach the bottom).
4. Verify that all four power-up types are visually distinguishable while falling (non-color-only, per F11 AC8) — if you cannot tell power-ups apart in-flight, you cannot anticipate the replacement, making F11's mutual-exclusion rule feel unfair.

---

## Links to Key Documents

- **Features & Acceptance Criteria (v1):** `docs/PRD.md` — F1–F10 base features.
- **Features & Acceptance Criteria (v2):** `docs/PRD-addendum-v2.md` — F11–F19 additions (single power-up slot, bosses, shield bounces, level intros, Game Complete).
- **Architecture & Component Design:** `docs/architecture/solution-architecture.md`.
- **Architecture Decision Records:** `docs/architecture/adr/` — detailed rationales for stack, loop design, level config, art, and instrumentation.
- **API Reference:** `docs/api/internal-modules.md` — module signatures for extending the game, including new ActiveEffect slot (F11), ShieldProjectile bounce fields (F15), World boss fields (F12), and new systems (LevelIntroSystem, BossWarningSystem, VictoryCelebrationSystem).
- **Glossary:** `docs/GLOSSARY.md` — terminology used across the codebase and docs (includes new v2 terms).
- **Security Review:** `docs/security/security-review-v2.md` — final pass-2 review (v1 is PASS).
- **Tests & Validation:** `docs/tests/validation-report.md` — test coverage and results.

---

**Version:** 2.0.0 (v2 feature update)  
**Date:** 2026-07-08  
**Status:** shipped (v2 — includes boss encounters, shield bounces, single-power-up slot, level intros, Game Complete celebration)
