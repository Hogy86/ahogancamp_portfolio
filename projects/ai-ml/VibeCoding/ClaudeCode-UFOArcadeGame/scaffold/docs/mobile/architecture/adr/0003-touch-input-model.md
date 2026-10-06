# ADR M-0003: Touch input — merged input sources, continuous per-pointer tracking for movement, latched throw

## Status: Proposed

## Context
- OQ-M5 (a): fixed on-screen ◀ ▶ THROW PAUSE. M3.3a (from UX F4) defines six slide rules
  for one finger moving between ◀ and ▶ across an 8 dp gap, and leaves the mechanism to
  the architect. UX round-2 carry-forward 3 requires the chosen model to be recorded and
  checked against all six rules.
- M3.4 opposing cancel, M3.5 one shield in flight with no queuing, M3.6 multi-touch and
  ≤ 100 ms latency, M3.7 no stray gestures, M3.10 keyboard keeps working.
- The existing `InputManager` is keyboard-only and exposes held state (`throwHeld`). The
  loop samples it once per rAF. A touch tap can start and end between two frames.

## Decision
1. **Merged sources.** `InputManager` merges `InputSource`s (keyboard always, touch on
   Android). It ORs left/right/throw, then applies opposing-cancel once.
2. **Movement = one zone, continuous per-pointer tracking.** `#move-zone` covers ◀, the
   gap and ▶. Pointers that go down on it are captured (`setPointerCapture`) and tracked
   by live position. On every `pointermove`, a pure function
   `classifyMovePointer(pos, rects, lastDir)` returns:
   - ◀ rect → left
   - ▶ rect → right
   - gap → `lastDir` (or none if the pointer landed there)
   - anywhere else → none, and `lastDir` is cleared

   Up/cancel removes the pointer. A 12 dp vertical hysteresis applies only to pointers
   that are already tracked (named constant; UX may set it to 0).
3. **Throw = held + latch.** A `pointerdown` on THROW sets a latch. The latch clears only
   after a frame that ran at least one simulation step, so a sub-frame tap is seen exactly
   once and a tap during flight queues nothing.
4. **PAUSE and menus call shared GameCommands** on `click`. Menus use one delegated
   listener on a stable root, and ScreenController re-renders only when its view key
   changes, so taps land on stable elements.
5. `touch-action: none` and suppressed text selection/callout/context menu on
   `html.platform-android`. The native WebView has long-click and haptic feedback off.

M3.3a compliance: rule 1 (pointermove → next rAF, worst ≈ 50 ms), rule 2 (gap carries
`lastDir`, capture keeps events flowing), rule 3 (current position only), rule 4
(elsewhere → none, re-entry resumes, landing in the gap → none), rule 5 (only move-zone
pointers are tracked; second-finger cancel via the merge), rule 6 (rects from
`computeLayout`, independent of side). Evidence: the 40/40 CDP swipe test in CI
(`mobile-architecture.md` §10.2) and on the emulator in step 10, with results in the
validation report.

## Alternatives Considered (and why rejected)
- **Two independent buttons with their own `pointerdown/up` listeners.** Rejected. With
  implicit capture the finger sticks to the first button (breaks rule 3). Without capture,
  input drops in the gap (breaks rule 2). This is exactly UX F4's failure mode.
- **`touchstart/touchmove` Touch Events API.** Rejected in favor of Pointer Events. Pointer
  Events give one model for touch, mouse and pen (useful for Chromebook testing), have
  explicit capture semantics, and are fully supported by the minimum WebView 80.
- **Canvas hit-testing (controls drawn on the game canvas).** Rejected. Controls sit
  outside the playfield canvas, and canvas controls lack accessibility nodes for TalkBack
  and Play's scanner (M3.11).
- **Polling every tracked pointer against the rects inside the fixed step instead of on
  events.** Equivalent in behavior but harder to unit-test and tied to loop internals. The
  event-time pure classifier is kept.
- **Drag-to-steer or auto-fire.** Rejected upstream (OQ-M5; UX round 1). They would change
  F1/F16 rules.

## Consequences
- `GameLoop` must pass the steps-run count to `consumeEdges` (small shared change).
- ScreenController stops rebuilding every frame (shared change; also reduces DOM churn,
  M10.4).
- The keyboard path is unchanged in behavior. Its code moves into `KeyboardInputSource`.
- Traces to: M3.1-M3.11, M3.3a, UX F4, F1 AC3/AC5, F2 AC1, F16 AC3, NFR-3; `mobile-architecture.md` §5.
