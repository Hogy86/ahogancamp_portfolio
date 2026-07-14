# Code Review — Round 2: Vanguard vs. Sentinels (pipeline step 8, GATE)

**Reviewer:** code-reviewer (independent gate)
**Date:** 2026-07-06
**Prior round:** `docs/reviews/code-review-round1.md` (FAIL — 3 REQUIRED fixes)

## VERDICT: PASS

All three REQUIRED findings from round 1 are independently verified as
resolved against the current code in `src/`. The full toolchain
(`typecheck`, `lint`, `build`, `format`) passes clean, and a targeted
regression check confirms the formatting/cleanup changes did not touch
game logic — the round-1 PASS items (security constraints, IP/asset
compliance, PRD acceptance criteria) remain intact. test-writer may
start.

---

## Round-1 REQUIRED fixes — re-verification

**[REQUIRED-1 / Style gate] Prettier `--check` — RESOLVED.**
`npm run format` (`prettier --check src`) now exits 0:
"All matched files use Prettier code style!" No formatting violations
remain in any of the 11 previously-flagged files.

**[REQUIRED-2 / magic number + dead const] `ENEMY_V_SPACING` — RESOLVED.**
`src/core/world.ts:7` now imports `ENEMY_V_SPACING`, and line 90 uses it
for the enemy row pitch:
`y: FORMATION_TOP_MARGIN + row * (ENEMY_HEIGHT + ENEMY_V_SPACING)`.
The hardcoded literal `18` is gone. The constant
(`constants.ts:64 = 18`) is no longer dead — value is unchanged, so
formation layout is behaviorally identical.

**[REQUIRED-3 / dead code] Unused `Vec2` / `LevelRuntimeState` — RESOLVED.**
Both interfaces have been removed from `src/core/types.ts`. A repo-wide
grep for `Vec2|LevelRuntimeState` across `src/` returns zero matches —
neither name is referenced or re-declared anywhere.

---

## Toolchain results (run, not assumed)

- `npm run typecheck` (`tsc --noEmit`): **PASS** (exit 0).
- `npm run lint` (`eslint src --ext .ts`): **PASS** (exit 0).
- `npm run build` (`tsc --noEmit && vite build`): **PASS** — 24 modules,
  22.48 kB JS bundle (7.37 kB gzip), CSS 2.01 kB.
- `npm run format` (`prettier --check src`): **PASS** (exit 0).

---

## Regression spot-check (no game logic touched)

`src/` is untracked in git (round-1 finding (d) still open — see
below), so a committed diff baseline does not exist; verification was
done directly against current source.

- **Security constraint (a) — localStorage fails closed:**
  `src/instrumentation/Instrumentation.ts:29-52` still wraps
  `JSON.parse` in a try/catch independent of the storage-access
  try/catch, validates the parsed shape via `isFiniteIntegerCounterMap`,
  and returns `{}` (fails closed) on any invalid shape. Intact.
- **Security constraints (b),(c),(e) — no dangerous APIs:** grep for
  `innerHTML|insertAdjacentHTML|outerHTML|document.write|eval(|new Function|setTimeout|setInterval|Date.now`
  across `src/` returns only comment matches in `src/ui/dom.ts`
  (describing the anti-pattern), zero real usages. Intact.
- **IP/asset compliance (F9 AC4 / NFR-10):** `src/render/shapes.ts`
  unchanged in substance — angular-kite shield (not a red-white-blue
  concentric-star disc), chevron chest emblem (not a star), generic
  blocky Sentinel with single circular sensor (not a trademarked robot
  silhouette), abstract power-up glyphs. Round-1 affirmative sign-off
  still holds.
- **PRD F4 level table:** `src/config/levelConfig.ts` matches the PRD
  §F4 table exactly (incl. level-10 boss HP=12); `assertMonotonicEscalation`
  monotonicity self-check present and unchanged.

---

## Carried-forward suggested (non-blocking) items

These do not block the gate; they are re-surfaced from round 1 for
test-writer / future cleanup awareness:

- **[SUGGESTED-1]** `guaranteedDropsRemaining` per-level bookkeeping
  lives as module-scoped state outside the `World` object (ADR-0002
  single-source-of-truth). Safe for v1; documented deviation.
- **[SUGGESTED-2]** `RenderCallback` interpolation `alpha` computed but
  unused by `main.ts`.
- **[SUGGESTED-3]** `EnemyFireSystem.pickShooter` docstring says
  "biased toward the frontmost row" but picks uniformly at random —
  comment/logic mismatch (not an AC violation).
- **[OPEN — infra, not code]** `scaffold/src/` remains untracked in
  git. Ensure `src/`, `package-lock.json`, and the rest of the scaffold
  are committed so the reviewed artifact and pinned lockfile are the
  ones that ship. This is a repo-hygiene item for the owner, not a code
  defect blocking this gate.

---

## To proceed

Gate is GREEN. All REQUIRED fixes verified, no regressions introduced.
test-writer (pipeline step 9) may begin.
