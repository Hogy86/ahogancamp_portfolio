# ADR M-0002: Platform boundary — one composition root, a `Platform` interface, lint-enforced

## Status: Proposed

## Context
- CLAUDE.md §One codebase and PRD-mobile §0 rule 2 allow Android-specific code only for
  touch input, screen fitting, back, lifecycle (and native packaging). Game rules must
  exist once (M0.3, M0.4).
- OQ-M10 (a) and M3.12: the website stays keyboard-only, with no touch buttons, help
  overlay, or safe-area changes.
- Today some platform behavior is hard-wired into shared code: `attemptQuit()` calls
  `window.close()` in `GameStateMachine.ts`, and ScreenController/HUDView hold
  keyboard-only strings. `GameLoop` creates its own `InputManager`.

## Decision
1. **Single composition root.** `src/main.ts` is the only file that reads
   `import.meta.env.MODE` and chooses `WebPlatform` or `AndroidPlatform`.
2. **`Platform` interface** (`src/platform/Platform.ts`, types only) carries:
   - `PlatformCopy`: control hint, title actions, quit fallback flag, labels
   - `services.quitApp()`
   - `init(ctx)`, which mounts touch, fit, back and lifecycle
   - `onFrame(world)`
   - `renderScale()`

   `PlatformContext` gives the platform the `InputManager` (to register sources), the
   pre-bound shared `GameCommands`, `loop.suspend/resume`, and the DOM roots.
3. **All state transitions are shared `GameCommands`** in `GameStateMachine.ts`
   (startRun, pause, resume, selectPauseOption, confirm/cancelRestartGame, quit,
   victoryTap, returnToTitle, handleBack, pauseForInterruption). The keyboard dispatch
   table calls them. Touch, back and lifecycle call them too. Platforms decide **when** a
   command fires, never **what** it does.
4. **Enforcement.** ESLint `no-restricted-imports`: `@capacitor/*` and
   `**/platform/android/**` are allowed only inside `src/platform/android/**` and
   `src/main.ts`. Outside `src/platform/`, only `import type` from `Platform.ts` is
   allowed. `no-restricted-syntax` bans `import.meta` outside `main.ts`. No UA sniffing.

## Alternatives Considered (and why rejected)
- **`if (isAndroid)` checks inside shared modules.** Rejected. The branching spreads, it
  is hard to review against the one-codebase rule, and it is easy to use by accident for a
  game rule.
- **A separate `src-android/` tree that imports shared modules.** Rejected. It invites
  copy-and-modify of UI and state code, which is exactly the duplication C1 forbids.
- **Dependency injection framework.** Rejected. It is overkill for one interface, and it
  adds a runtime dependency to the web bundle (W-ADR-0001).
- **Touch emitting fake keyboard events (synthetic Esc/Enter).** Rejected. The semantics
  are indirect and fragile. For example, back on Game Over must go to the title, but Esc
  is a no-op there (F6 AC8), so key faking can't express the M5 table without changing
  web behavior.

## Consequences
- The shared refactor (inject InputManager, extract commands, copy strings) must pass the
  existing web tests unchanged. That proves it changes no behavior (M0.2).
- Adding a platform later (e.g. web touch, if OQ-M10 is ever revisited) is a new
  `Platform` implementation, not edits across the core.
- Traces to: C1, C3, PRD-mobile §0, M3.12, M6.1, M8.3, OQ-M10 (a); `mobile-architecture.md` §4.

## Amendment note (2026-10-04, architecture v1.8, Amendment A14)
Written by mobile-solution-architect. The Decision text above is kept as the historical
record; where later text differs, it wins. On Android the two top warning words are a DOM
banner under the HUD, and the website keeps the canvas text, behind one `CanvasRenderer`
flag set through `PlatformContext` (default on). `TEXT_TOP_LOGICAL` stays 4. Full record:
M-ADR-0013 (`0013-android-top-banner.md`) and `docs/mobile/architecture/amendment-A14.md`.
