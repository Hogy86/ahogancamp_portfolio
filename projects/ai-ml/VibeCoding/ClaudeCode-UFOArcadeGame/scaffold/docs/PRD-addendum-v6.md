# Product Requirements Document — Addendum v6 (boss health)

**Product:** Shield vs Robots (website and Android app; one shared codebase)
**Revises:** `docs/PRD-addendum-v2.md` F12 AC2 (boss hit points). That text is kept as
history; for boss health, this file is the live criterion.
**Date:** 2026-10-06
**Author:** main session, at the owner's request
**Status:** DECIDED by the owner. This addendum brings the spec in line with code that is
already merged; it changes no code.

## Why this addendum exists

The fix "Fix level 5/10 bosses dying in one hit" (commit `2a4a9b0`, merged to master by
PR #10 and into the Android branch on 2026-10-05) changed three boss rules, but no PRD text
was updated with it. UAT round 4 (`docs/mobile/tests/uat-results-round4.md`) found the
mismatch: F12 AC2 still said both bosses are 5× as tough and that hit-power multipliers
shorten the fight.

Owner decision, 2026-10-06, in the project thread, verbatim: "Fix the game spec to match,
then push to the branch." The spec is therefore changed to match the code, not the reverse.

## F12 AC2 (r2) — Boss hit points

Supersedes F12 AC2 in addendum v2, including its parenthetical about hit power.

1. **Boss hit points are N× the highest regular-enemy HP tier present in that level's
   `hpMix`, where N is the level number.**
   - Level 5: toughest regular tier is 3-hit → 5 × 3 = **15**.
   - Level 10: toughest regular tier is 4-hit → 10 × 4 = **40** (was 20 in v2).
2. **The boss always takes N times as many shield hits as that level's toughest regular
   enemy would take at the player's current hit power.** A hit-power multiplier (the
   temporary 5× Hit Power effect, the permanent multiplier, or both together) speeds up the
   boss fight by the same proportion as it speeds up regular enemies; it can never destroy
   the boss in one hit.
   - Rule: let `P` be the current hit power, rounded to a whole number and at least 1; let
     `T` be the toughest regular tier; let `k = ceil(T / P)` be the hits the toughest
     regular enemy needs. Each shield contact removes `T / k` from the boss, so the boss
     falls after exactly `N × k` hits.
   - Level 5 examples (T = 3): P = 1 → 15 hits; P = 2 → 10 hits; P ≥ 3 → 5 hits.
   - Level 10 examples (T = 4): P = 1 → 40 hits; P = 2 → 20 hits; P = 3 → 20 hits;
     P ≥ 4 → 10 hits.
   - This replaces the v2 statement that "a 5× Hit Power or permanent multiplier reduces
     the number of throws needed accordingly". Under v2 a large multiplier ended the fight
     on the first hit, which is the defect the fix removed.
3. Regular enemies are unchanged: each contact removes the full hit power (F7 AC9).

## F12 / F17 — Boss damage marks

4. The boss shows **0 to 4 crack lines, by the share of its health lost**: the number of
   cracks is the lost fraction × 4, rounded up. No crack is drawn outside the boss's body.
   Regular enemies still show one crack per hit taken. There is no health bar.

## Not changed

Everything else in F12 stands: bosses on levels 5 and 10 only, appearing after the
formation is cleared; the "BOSS INCOMING" warning and its timing; 5× linear size; the boss
colour; scoring; and the level table apart from the level-10 boss value above.

## Traceability

| Criterion | Code | Tests | Evidence |
|---|---|---|---|
| AC2 item 1 | `src/config/levelConfig.ts` (`bossHp: 15`, `bossHp: 40`, boss-HP self-check) | `src/config/levelConfig.test.ts` | — |
| AC2 item 2 | `src/systems/CollisionSystem.ts` (`damageForHit`) | `src/systems/CollisionSystem.test.ts` | UAT round 4: level-5 fights took 5 or 10 hits at the multipliers in play, on both emulators |
| Item 4 | `src/render/shapes.ts` (`MAX_BOSS_CRACKS`) | — (no automated test of the crack count) | UAT round 4: crack count matched after every hit |

## Known gaps

- The level-10 boss (40 health) and the 15-hit level-5 case at hit power 1 have not been
  seen in play on the emulator; the UAT bot reached level 7. They are covered by unit tests
  only.
- The boss crack count has no automated test.
- The website pipeline's own gates were not re-run for this fix by this thread; it reached
  master through PR #10 in another thread.
