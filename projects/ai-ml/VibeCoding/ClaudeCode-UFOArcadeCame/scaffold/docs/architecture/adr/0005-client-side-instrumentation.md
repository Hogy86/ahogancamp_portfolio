# ADR 5: Client-side, best-effort instrumentation (console + localStorage counters)

## Status: Accepted

**Date:** 2026-07-06
**Author:** solution-architect subagent
**Sources:** `docs/PRD.md` NFR-8 (instrumentation hooks), NFR-6/NFR-7 (no
backend/account), F10 AC6 (session-only, no leaderboard), Out of Scope §
(no cross-session persistence, no networked telemetry); market-goal metrics
B1-B4 / P1-P5.

## Context

NFR-8 requires the game to **emit the events needed to observe the market goals**
(explicitly: session start, level reached, run restart, power-up caught) via
**lightweight client-side counters (console/localStorage)** — the mechanism was
deferred from the PRD to this stage. This must not introduce a backend (NFR-7), an
account (NFR-6), cross-session persistence of *player* data as a feature (Out of
Scope), or any PII/telemetry-over-network surface. The score itself is session-only
and must not persist as a leaderboard (F10 AC6).

## Decision

Implement a single small **`Instrumentation`** module exposing an `emit(event,
payload?)` call used at the four required moments (session start, level reached,
run restart, power-up caught) plus any others cheaply useful (e.g. Game
Over/Victory). Each emit does two best-effort things:

1. **`console.log`** a structured, namespaced line (e.g.
   `[vvs] levelReached { level: 5 }`) — always available, zero storage, useful for
   dev/playtest observation.
2. **Increment an anonymous aggregate counter in `localStorage`** under a single
   namespaced key (e.g. `vvs:metrics` → `{ sessionStart: 4, levelReached_5: 2,
   runRestart: 1, powerUpCaught: 37 }`). Counters are **anonymous integers only** —
   no identifiers, no timestamps tied to a person, no free text.

**Robustness (mandatory):** every `localStorage` access is wrapped in `try/catch`.
If storage is unavailable (private mode, quota, disabled), the module silently
degrades to **console-only** and gameplay is entirely unaffected (Risk R7). The
emit call is **fire-and-forget and must never throw into the game loop** and must
never block a frame.

**Boundaries this respects:**
- No network transmission — nothing is sent anywhere (NFR-6/NFR-7 preserved;
  no telemetry endpoint, no third-party analytics SDK).
- No PII — counters are aggregate anonymous integers, so no GDPR/CCPA
  lawful-basis/consent/deletion obligation is triggered (see
  solution-architecture.md §Security & Compliance Pre-Check).
- Not a leaderboard and not player-progress persistence — the localStorage
  counters are dev/measurement aggregates, distinct from the session-only score
  (F10 AC6), which is held in memory and reset per run.

## Alternatives Considered (and why rejected)

**A. A backend/analytics service (GA, a custom telemetry endpoint, etc.).**
Rejected. Directly violates NFR-6 (no account/third-party wall) and NFR-7 (fully
client-side, offline-capable), adds a network/PII/data-protection surface the
security pre-check would flag, and adds operational cost — all for a v1 demo whose
metrics only need to be *observable*, not centrally aggregated across players.

**B. In-memory only (console.log, no persistence at all).**
Rejected as the sole mechanism. Console-only loses the counts the moment the tab
closes, making even simple within-browser observation of the NFR-8 events (e.g.
"how many restarts this session") harder. localStorage counters cost nothing, stay
local and anonymous, and are the mechanism NFR-8 explicitly names — with console as
the always-on fallback. (Note: console-only *is* the graceful-degradation path when
storage is unavailable — see Robustness.)

**C. IndexedDB / a structured client DB.**
Rejected. Over-engineered for a handful of integer counters; adds async complexity
and API surface for no benefit over a single localStorage key. localStorage is the
right-sized tool NFR-8 points to.

**D. Persisting the session score / a local high-score across sessions.**
Rejected — explicitly out of scope (F10 AC6, Out of Scope §). The instrumentation
counters are deliberately *not* the score and are not surfaced to the player as a
high-score table, to avoid quietly building a feature the PRD excluded.

## Consequences

- **Positive:** NFR-8's named events are observable with zero backend, zero PII,
  and zero added runtime dependency; the offline/no-account guarantees stay intact;
  security pre-check has nothing to flag here beyond confirming the counters are
  anonymous.
- **Constraint:** all instrumentation must be best-effort and non-throwing (Risk
  R7) — code-review verifies no emit path can break the loop, and that no
  identifier/PII is written. If a future version ever adds network telemetry or any
  identifier, that is a new security-review trigger (flagged in the pre-check).
- **Measurement caveat:** counters are per-browser/per-origin and anonymous, so
  they inform the market goals directionally within a playtest, not as a
  cross-population analytics system — which is all NFR-8 asks for at v1.
