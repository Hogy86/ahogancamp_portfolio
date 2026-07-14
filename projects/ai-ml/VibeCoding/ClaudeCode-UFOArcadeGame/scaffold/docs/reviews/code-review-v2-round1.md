# Code Review — v2 (F11-F19), Round 1

**Reviewer:** code-reviewer (independent gate, pipeline step 8)
**Date:** 2026-07-07
**Scope:** `scaffold/src/**` diff vs. HEAD; verified against `docs/PRD-addendum-v2.md`, the approved plan, `docs/security/security-review-v2.md`, and the `coding-standards` skill.

## Verdict: PASS

The implementation faithfully realizes F11-F19. All five binding security constraints hold in the new/changed code, the IP/original-art constraint is upheld, dead code is genuinely removed, and application code builds/lints/format-checks cleanly. Findings below are non-blocking (one should-fix on an ambiguous AC clause, plus observations/playtest flags). test-writer may proceed.

## Verification performed (read-only)
- `npx vite build` — clean (27 modules, app code compiles).
- `npx eslint src --ext .ts` — clean (exit 0).
- `npx prettier --check src` — production source clean; only 7 stale `*.test.ts` files flagged (test-writer's next step).
- `npm run typecheck` / `npm run build` / `npm run test` are expected-fail on the 39 known-stale v1 tests (they still reference `THROW_INTERVAL_SECONDS`, `hitPowerRemaining/speedRemaining/shieldRemaining`, `anyKeyPressed` absence, etc.). Confirmed via grep that every remaining reference to removed symbols is in `*.test.ts` only — not production code.

## Correctness against the ACs (confirmed)
- **F11** — `ActiveEffect` single slot; `applyPowerUp` unconditionally overwrites the slot for any temporary type and leaves `PERMANENT_MULTIPLIER` on its own path; HUD renders exactly one slot. Permanent multiplier composes with 5× Hit Power via `currentHitPower`. AC1-AC7 satisfied.
- **F12** — Boss only on 5/10 (`bossHp` 15/20 + load-time `assertBossHpFormula`); boss spawns only after formation clears, gated behind the `bossPhase 'NONE'→'WARNING'→'ACTIVE'` machine; warning ~1.75s, non-freezing; 5× size; boss-unique darkest color + lighter outline. The state machine correctly prevents WinLoss from re-arming the warning each tick.
- **F15** — `outcomeForZone` matches the authoritative corrected table exactly: bottom/top-center STOP; bottom-left → down-left; bottom-right → down-right; left/right-center → pure horizontal; top-left → up-left; top-right → up-right. `classifyZone` maps contact position to zone consistently (corner = outer 30%). Debounce via `lastHitEnemyId` enforces one-hit-per-contact; shield only deflects off enemies.
- **F16** — One-in-flight gate replaces the cooldown; 6s lifetime safety valve; any-edge despawn, no wall reflection; catch grants +1 life only on actual overlap collision; shield never harms player; inert to lasers/power-ups/edges.
- **F17** — Humanoid 4-region Sentinels, white→gray→dark toughness, red eyes/lasers, contrast-adaptive crack overlay, brighter boss eyes for on-body contrast.
- **F18** — 3s intro gated by one early-return; set at fresh-start call sites only (`createNewRunWorld`, WinLoss advance) and explicitly `= 0` on Restart Level — correctly call-site-specific, not a blanket flag.
- **F19** — Trigger is level-10 boss defeat; 5s sim-time celebration; fireworks deterministic (no wall clock); auto-return to TITLE; VICTORY score shown.

## Judgment calls scrutinized (both sound)
- **(a) catch gated on `vy > 0`**: the only way a shield acquires downward velocity is a bottom-corner bounce; side hits (vy=0) travel horizontally and never descend to the player row. `vy > 0` captures exactly the legitimate return path without excluding any valid catch.
- **(b) `anyKeyPressed`/`victoryHeld`**: Esc is guarded first so it can never hold/advance (F6 AC8 preserved). First qualifying press sets `victoryHeld`, second advances; edge-triggered logic prevents double-firing. Semantics match spec.

## Security (all 5 constraints upheld)
No wall-clock timers in `BossWarningSystem`/`VictoryCelebrationSystem`/`LevelIntroSystem` or any sim/system code. All new DOM text goes through `textContent`/`createElement` — zero `innerHTML`. Canvas text is `fillText`, not DOM. No `eval`/`new Function`. Lockfile untouched.

## IP / original-art (F9 AC4 / NFR-10) — CLEAR
`drawVanguard`, `drawShield`, `drawSentinel` all remain original stylized geometric art — no star/concentric-ring motif, no trademarked silhouette, no wordmarks/fonts/rasters.

## Findings

1. **[SHOULD-FIX — F16 AC8]** An in-flight shield is not cleared when the regular formation clears into the boss phase (`WinLossSystem.ts` WARNING transition and `world.ts` `enterBossPhase` both leave `world.shields` untouched). A shield still bouncing when the last regular enemy dies persists through the ~1.75s warning and into the boss fight, blocking re-throw via the one-in-flight gate until it despawns. Low gameplay impact; the AC is ambiguous on this exact case, but the fix is a one-line addition (`world.shields = []`) — apply it before proceeding.
2. **[OBSERVATION]** Fireworks render a static frame while `victoryHeld` is true (celebration counter frozen). Acceptable per AC — fireworks remain displayed.
3. **[OBSERVATION]** Firework bursts span ~0-4.6s of the 5s window, leaving a brief gap before auto-return. Cosmetic, within NFR-2/AC4.
4. **[PLAYTEST — defer to UAT]** N4 (4-region legibility at level-10's 54-enemy density) and N5 (bounce/catch frequency) are explicitly playtest criteria, not code ACs.

## Coding-standards conformance
PASS — small named functions, intent comments with "why", no commented-out blocks, no dead code in production, proper error handling, no swallowed exceptions, no PII/secrets in new instrumentation events.

**Summary:** PASS. F11-F19 correctly implemented and match the authoritative F15 geometry table; both flagged judgment calls are sound; security and IP constraints hold; app code is build/lint/format clean. One non-blocking should-fix (finding 1) to apply before test-writer starts.
