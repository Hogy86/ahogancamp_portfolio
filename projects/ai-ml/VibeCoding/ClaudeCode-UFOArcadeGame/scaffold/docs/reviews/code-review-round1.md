# Code Review — Round 1: Vanguard vs. Sentinels (pipeline step 8, GATE)

**Reviewer:** code-reviewer (independent gate)
**Date:** 2026-07-06

## VERDICT: FAIL

No CRITICAL/HIGH correctness or security defects were found — the implementation is genuinely solid and faithful to the spec — but the `format` gate the repo itself defines does not pass, and there is dead code / a magic-number violation that the coding-standards skill flags as required fixes. Per this pipeline's convention, a gate step must be clean before test-writer starts.

---

## Toolchain results (run, not assumed)
- `npm install` / `npm audit`: **0 vulnerabilities**.
- `npm run typecheck` (`tsc --noEmit`): **PASS** (exit 0).
- `npm run lint` (`eslint src`): **PASS** (exit 0).
- `npm run build` (`tsc && vite build`): **PASS** — 24 modules, 22.5 kB JS bundle.
- `npm run format` (`prettier --check src`): **FAIL** (exit 1) — 11 files have formatting violations.

---

## Required fixes (block PASS)

**[REQUIRED-1 / Style gate] Prettier `--check` fails on 11 files.**
`npm run format` exits non-zero. All violations are `printWidth: 100` overruns (long function signatures and single-line `if (...) continue;` statements) in: `src/config/levelConfig.ts`, `src/core/GameStateMachine.ts`, `src/core/world.ts`, `src/render/CanvasRenderer.ts`, `src/render/shapes.ts`, `src/style.css`, `src/systems/CollisionSystem.ts`, `src/systems/FormationSystem.ts`, `src/systems/MovementSystem.ts`, `src/ui/HUDView.ts`, `src/ui/ScreenController.ts`. Fix: run `npx prettier --write src`.

**[REQUIRED-2 / coding-standards: no dead code + no magic numbers] `ENEMY_V_SPACING` is dead and its value is hardcoded.**
`src/config/constants.ts:64` exports `ENEMY_V_SPACING = 18` but it is never imported. Instead `src/core/world.ts:83` hardcodes the literal `18` for the enemy row pitch (`FORMATION_TOP_MARGIN + row * (ENEMY_HEIGHT + 18)`). Fix: use `ENEMY_V_SPACING` at `world.ts:83`.

**[REQUIRED-3 / coding-standards: no dead code] Two unused type declarations.**
- `src/core/types.ts:11` `interface Vec2` — never referenced anywhere.
- `src/core/types.ts:156` `interface LevelRuntimeState` — never imported; actual per-level drop bookkeeping lives as module-scoped variables in `src/systems/levelRuntimeState.ts`, not this type. Either wire these in or delete them.

---

## Suggested (non-blocking) findings

- **[SUGGESTED-1]** `guaranteedDropsRemaining` lives as module-scoped mutable singleton state (`src/systems/levelRuntimeState.ts`), outside the `World` object ADR-0002 designates as the single source of truth. Safe for v1 (single game per tab), but a documented deviation worth folding into `World` later.
- **[SUGGESTED-2]** `RenderCallback` interpolation `alpha` is computed (`GameLoop.ts:77`) but ignored by the render callback in `main.ts`. Harmless; either use for render smoothing or drop the parameter.
- **[SUGGESTED-3]** `EnemyFireSystem.pickShooter` docstring (lines 8-9) says shots are "biased toward the frontmost row," but the implementation picks a uniformly random living enemy. Not an AC violation — fix the comment or the logic.

---

## Verification of the 5 binding security constraints (all PASS)

- **(a) localStorage read validates + fails closed with its own `JSON.parse` try/catch** — PASS (`Instrumentation.ts:29-52`).
- **(b) All DOM text via `textContent`/`createTextNode`, never `innerHTML`** — PASS (`src/ui/dom.ts` sole text path; zero `innerHTML`/`insertAdjacentHTML`/`outerHTML`/`document.write` hits in src/).
- **(c) Zero `setTimeout`/`setInterval`/`Date.now`/`performance.now`-as-timer in sim/system code** — PASS. All effect timers are remaining-duration counters decremented by `dt` inside `update()`, enforced additionally via an eslint `no-restricted-globals` rule.
- **(d) Lockfile exists and is pinned** — PASS. `package-lock.json` present, `lockfileVersion: 3`, all devDependencies pinned exact versions, `npm audit` 0 vulnerabilities. Note: `scaffold/` is currently untracked in git — ensure the lockfile is committed with the rest.
- **(e) No `eval`/`Function` constructor / inline-script injection blocking a strict CSP** — PASS.

---

## IP / asset compliance per ADR-0004 & F9 AC4 — PASS, affirmative sign-off

Inspected `src/render/shapes.ts` directly:
- **Shield** (`drawShield`): plain 4-point angular kite, teal fill. Not a red-white-blue disc, no concentric rings, no central star.
- **Vanguard**: triangular blue torso + plain chevron chest emblem (explicitly not a star). Generic hero silhouette.
- **Sentinels**: blocky rectangle body + single circular sensor + angular boss "crown." Generic geometric robot, not modeled on any trademarked robot silhouette.
- **Power-up icons/laser**: abstract geometric glyphs. No third-party marks. Fonts: system-ui stack only, no hosted webfonts, no wordmarks/logos.

**Affirmative verdict: shield/hero/enemy/power-up draw functions are reviewed against F9 AC4 / NFR-10 prohibitions and are clear.** This satisfies security-review-v1 MEDIUM #3's requirement for an explicit sign-off; ui-ux-designer round 2 remains the co-gate per Risk R6.

---

## PRD acceptance-criteria spot-checks (all correct)

- **F4** (10-level table + monotonicity): matches PRD table exactly incl. level-10 boss HP=12; `assertMonotonicEscalation` verifies size/speed/fire-rate/avg-HP non-decreasing.
- **F5 AC2** (fire cadence ≤25% of player rate at L1): computed 7.8% ≤ 25%. Monotonic across levels. MAX_LEVEL=10 → Victory, no level 11.
- **F6**: Esc dispatch table gives silent no-op on TITLE/GAMEOVER/VICTORY (AC8); Restart Game confirm guard (AC11); blocked-quit fallback text (AC9); timers pause without drift (AC7).
- **F7**: all 4 power-ups; same-type refresh not stack (AC8); permanent multiplicative stack (AC7); permanent×temporary composition (AC9); HUD readout + on-catch feedback (AC10/AC11).
- **F8**: dual Game Over triggers collapse to one outcome (AC8); 1.5s i-frames; non-color-only invulnerability visual.
- **F1/F2/F3**: opposing-key cancel, clamp/no-drift, 250ms throw gate, one-enemy-per-shield, formation block-move/step-down/reverse, inverse speed scaling, gaps not re-flowed, one-row-early warning behind toggle.

## `hitsToKill: HitsToKill (1-4) → number` widening — evaluated, reasonable

`types.ts:31` keeps the `HitsToKill = 1|2|3|4` union for the regular-enemy `hpMix` keys, and only widens `Enemy.hitsToKill`/`LevelConfig.bossHp` to `number` because the level-10 boss (12 HP) legitimately exceeds regular tiers. Narrowing preserved where it constrains real data; widening documented with a "why" comment. Correct, minimal decision — not a red flag.

---

## To reach PASS

Address REQUIRED-1 (prettier), REQUIRED-2 (`ENEMY_V_SPACING` magic number/dead const), and REQUIRED-3 (delete/wire the two dead types). None require design changes — all are mechanical. Re-run `npm run format` to green, then this gate passes and test-writer may start.
