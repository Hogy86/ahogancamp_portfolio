# ADR 3: Data-driven level configuration table

## Status: Accepted

**Date:** 2026-07-06
**Author:** solution-architect subagent
**Sources:** `docs/PRD.md` F4 (10-level table), F5, F7 AC1 (guaranteed drops),
NFR-tuning notes; `docs/ux/design-review-round2.md` (NB4, Q7 warning flag).

## Context

F4 defines a precise 10-level progression: for each level, a formation size
(rows × cols), a regular-enemy HP mix (percentages of 1/2/3/4-hit enemies), a boss
HP, a formation-speed multiplier, an enemy-fire-rate multiplier, and a guaranteed
power-up drop count. F4 AC5 additionally requires these to be **monotonically
non-decreasing** across levels (no level easier than the prior). The multipliers
are expressed relative to level-1 base values that code-implementer will tune to
concrete pixel speeds and millisecond intervals (F4 design rationale). Several
values are explicitly **tunable defaults** to be validated in playtesting
(F7 AC1's 10% extra-drop rate; base speeds/fire intervals), and one row-field
(the Q7 formation-approach warning, F3 AC6) may be toggled off by owner decision.
This is textbook structured, tabular input.

## Decision

Encode the entire F4 progression as a **single static, immutable, typed data
table** (an array of `LevelConfig` records indexed by level 1-10), consumed
uniformly by the systems. No system contains per-level `if (level === n)`
branching; each system reads the fields it needs from the current level's config
record:

- `FormationSystem` reads rows/cols and speed multiplier.
- `EnemyFireSystem` reads the fire-rate multiplier.
- Enemy spawning reads the HP mix and boss HP to assign per-enemy hit points.
- `PowerUpSystem` reads guaranteed-drop count and the (tunable) extra-drop chance.
- The Q7 formation-approach warning is a single boolean/threshold field so it can
  be disabled without touching loss logic (Risk R8 / UX round-2 NB4).

Tunable base constants the multipliers apply to (level-1 base formation speed,
base enemy-fire interval, throw pacing 250 ms, power-up durations 8 s, i-frame
1.5 s) live as **named constants co-located with the table**, not as inline magic
numbers, so tuning is a one-place edit.

A **monotonicity check over the table** (each level's HP-weight, formation size,
speed multiplier, and fire-rate multiplier ≥ the prior level's) is specified as a
unit test for test-writer, so F4 AC5 is verified against the data itself rather
than trusted.

## Alternatives Considered (and why rejected)

**A. Per-level hardcoded branching (`switch (level)` / per-level functions).**
Rejected. It scatters the progression across the codebase, makes the monotonicity
guarantee (F4 AC5) un-checkable in one place, and turns routine balance tuning
(NFR-tuning, F7 AC1's tunable 10%) into risky multi-site edits — the exact drift
risk R5 in solution-architecture.md. The PRD literally presents F4 as a table;
mirroring it as data preserves that traceability one-to-one.

**B. Procedural generation of level parameters from a formula.**
Rejected. F4's owner-approved values are not a clean formula (HP mixes shift in
irregular steps; formation grows on specific levels), and the owner approved the
*exact* table (Q1). A formula that merely approximates it would risk diverging from
approved values and breaking specific ACs (e.g. F4 AC2's "exactly one boss needs 2
hits at level 2"). The table is the source of truth; no generation layer is
warranted for 10 fixed rows.

**C. External JSON/remote config fetched at runtime.**
Rejected. It adds a network fetch (against NFR-1 load budget and the offline
guarantee NFR-7) and a parse/trust boundary for zero benefit — the config never
changes at runtime and there is no server (ADR-0001). An in-bundle typed constant
is loaded instantly, type-checked at build time, and cannot fail to fetch.

## Consequences

- **Positive:** the F4 table maps 1:1 to a code constant, so a reviewer can diff
  the two directly; balance tuning and the Q7 warning toggle are single-site edits;
  monotonicity (F4 AC5) is machine-verifiable.
- **Constraint:** systems must treat the config as read-only and derive all
  per-level behavior from it — an implementer must not reintroduce per-level
  branching (called out as Risk R5 for code-review).
- **Tuning is expected and non-breaking:** per F7 AC1's note (UX-N4), adjusting the
  tunable defaults to hit P4/P-metrics is routine and does not constitute an AC
  violation, as long as the locked ACs (≥1 guaranteed drop/level; monotonic curve;
  exact levels 1-3 rules) still hold.
