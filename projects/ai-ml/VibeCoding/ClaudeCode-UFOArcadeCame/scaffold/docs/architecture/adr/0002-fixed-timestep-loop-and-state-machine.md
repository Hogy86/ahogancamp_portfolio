# ADR 2: Fixed-timestep game loop, explicit screen/pause state machine, and deterministic system ordering

## Status: Accepted

**Date:** 2026-07-06
**Author:** solution-architect subagent
**Sources:** `docs/PRD.md` F1-F8, F10, NFR-2, NFR-3; `docs/ux/design-review-round1.md`
(UX-B1, UX-B3, UX-B5, UX-B7); `docs/ux/design-review-round2.md` (NB2).

## Context

The game needs (a) a rendering/simulation loop that hits 60 FPS with a 30 FPS
floor (NFR-2) and ≤100 ms input latency (NFR-3), and (b) a control structure that
makes several UX-mandated correctness bars *impossible to get wrong by accident*:

- Esc means different things on different screens — pause in active play, resume
  in pause, **silent no-op** on title/Game Over/Victory (F6 AC1, AC3, AC8 / UX-B1).
- Pause must freeze **everything** including power-up and i-frame **timers**, and
  resume with remaining durations exactly intact — a stated 100% correctness bar
  (F6 AC3, AC7; P2 / UX-B5).
- The **two** Game Over triggers (lives=0, formation-reached-row) must resolve to
  **one** deterministic outcome even if both become true in the same tick — no
  flicker, no double screen (F8 AC8 / UX-B3).
- Victory is only reachable by clearing level 10 and can never co-occur with a
  loss (F8 AC8).

A naive variable-timestep loop with ad-hoc `if (paused)` checks scattered across
subsystems and wall-clock timers would make all four of these fragile.

## Decision

**1. Fixed-timestep loop.** Drive the loop with `requestAnimationFrame`, but
advance simulation in fixed `dt` steps via an accumulator: each animation frame,
add elapsed time to an accumulator and run `update(FIXED_DT)` as many whole steps
as have accumulated, then `render()` once. Simulation is therefore deterministic
and frame-rate-independent; rendering can vary without corrupting physics
(protecting NFR-2's floor behavior). Input is sampled at the top of each step so
latency stays within one step (well under NFR-3's 100 ms).

**2. Explicit finite state machine for screens.** A single `GameStateMachine` owns
the current state ∈ {TITLE, PLAYING, PAUSED, GAMEOVER, VICTORY} and the legal
transitions between them. **Input is dispatched by state**, so Esc's meaning is
defined per state in exactly one place:

| State | Esc | Enter / Up / Down | Arrows / Space |
|---|---|---|---|
| TITLE | no-op (start via defined key) or menu | menu nav / start | — |
| PLAYING | → PAUSED (freeze) | — | move / throw |
| PAUSED | → PLAYING (resume) | menu nav / confirm option | — (frozen) |
| GAMEOVER | **silent no-op** | restart / to-title | — |
| VICTORY | **silent no-op** | restart / to-title | — |

Because "no-op on non-play screens" is a property of the dispatch table rather
than scattered guards, F6 AC8 / UX-B1 is satisfied by construction — there is no
code path that can open a pause overlay outside PLAYING.

**3. Simulation ticks only in PLAYING.** The loop calls the systems' `update()`
**only when state == PLAYING**. PAUSED renders the frozen frame plus the overlay
but runs no `update()`. This is what makes pause-correctness (F6 AC3/AC7) trivial
and drift-free: see decision 5.

**4. Deterministic ordered systems, single terminal evaluation.** `update(dt)`
runs the systems in a fixed order every tick:
`Input → Movement → Formation → EnemyFire → Projectile → Collision → PowerUp →
Lives → WinLoss → HUDModel`. All state that feeds terminal conditions (lives after
damage, formation lowest-row after movement) is finalized *before* `WinLossSystem`
runs. `WinLossSystem` evaluates terminal conditions **exactly once per tick** and
produces **at most one** outcome, with both loss triggers collapsing to a single
`GAMEOVER` transition (F8 AC8 / UX-B3). Victory is checked only on formation-clear,
which by definition means no enemy remains to reach the player's row, so
Victory/loss can't co-occur.

**5. Timers as remaining-duration, decremented only in-sim.** Every timed effect
(the three temporary power-ups' 8 s windows F7 AC4-6, post-hit i-frames 1.5 s
F8 AC9, throw pacing 250 ms F2 AC2, formation warning F3 AC6) is stored as a
**remaining-duration counter decremented by `FIXED_DT` inside `update()`** — never
compared against wall-clock `Date.now()`. Since `update()` does not run in PAUSED,
paused time cannot elapse against any timer, so F6 AC7's "no power-up time lost or
gained by pausing" holds automatically with no special pause-handling code per
timer.

## Alternatives Considered (and why rejected)

**A. Variable-timestep loop (advance by real elapsed dt each frame).**
Rejected. Frame hitches would produce large physics steps (tunneling collisions,
inconsistent enemy speed), and it makes deterministic tests of movement/collision
harder for test-writer. Fixed-timestep is the standard fix and directly supports
NFR-2's "physics stays correct even if render frame-rate dips."

**B. Wall-clock (`Date.now()` / `performance.now()`) timers for power-ups/i-frames.**
Rejected. Wall-clock timers keep counting while the game is paused, so a player who
pauses for 30 s with a 5×-hit power-up active would return to an expired buff —
directly violating F6 AC7 and the P2 100% bar (UX-B5). Storing remaining-duration
and only decrementing in-sim makes the correct behavior the *only* behavior.

**C. Scattered `if (paused) return;` guards in each subsystem.**
Rejected. It is error-prone (miss one system and a stray entity keeps moving under
pause, breaking F6 AC1/AC3) and un-auditable. Gating the entire `update()` call in
one place (decision 3) makes "pause freezes everything" a single, testable
invariant.

**D. Event-driven / independent per-trigger end-state handlers.**
Rejected for the terminal conditions. If lives=0 and formation-reached-row each
fired their own handler asynchronously, both could enqueue an end screen in the
same tick and race — exactly the flicker/double-screen UX-B3 forbids (F8 AC8). A
single ordered per-tick `WinLossSystem` producing one outcome forecloses the race
structurally.

**E. Implicit "current screen" via which DOM overlay is visible.**
Rejected. Deriving state from DOM visibility spreads the state across the view and
makes illegal transitions (e.g. pausing a Game Over screen) easy to introduce. An
explicit enum + transition table is the single source of truth for what input does
where (UX-B1).

## Consequences

- **Positive:** the four correctness-critical UX bars (per-screen Esc, pause
  freezes all + timers, single deterministic Game Over, no timer drift) are
  satisfied *by construction* rather than by careful discipline, which is exactly
  what a reviewer/test can assert against.
- **Testability:** deterministic fixed steps + a single terminal evaluation give
  test-writer clean seams — force both loss conditions in one tick and assert
  exactly one screen (F8 AC8); pause mid-timer and assert remaining duration is
  unchanged after N frames (F6 AC7); assert monotonic level params drive
  consistent speeds. These are named in solution-architecture.md §Risks (R3, R4).
- **Constraint on implementers:** all timed effects MUST use the remaining-duration
  pattern and all simulation MUST live inside a system called from `update()` —
  nothing timed or moving may run on its own `setTimeout`/`setInterval` or read
  wall-clock time, or the pause guarantees break. Called out for code-review.
- **NB2 (UX round 2) note:** HUD countdown display is intentionally power-up-only,
  not shown for the brief i-frame window; the i-frame's *character-level* visible
  distinction (F8 AC9) still applies. This is a rendering/HUD scoping detail, not a
  loop change, recorded so it isn't re-litigated.
