// Test-only helper: builds a minimal, deterministic World for unit tests without
// depending on module-scoped level-runtime state or the full GameLoop wiring.
// Not shipped to the player (test-only file under src/test-utils).

import { createNewRunWorld, resetForLevel } from '../core/world';
import type { InputSnapshot } from '../core/InputManager';
import type { World } from '../core/types';

/**
 * Returns a World in PLAYING state at the given level (default 1), fully reset.
 *
 * v2 (F18): `createNewRunWorld` sets `levelIntroRemaining = LEVEL_INTRO_SECONDS`
 * (every fresh level start gets the 3s countdown), and `resetForLevel` deliberately
 * does NOT touch it (Restart Level vs. level-advance need different countdown
 * behavior - see world.ts). Most system-level unit tests exercise a system in
 * isolation (calling e.g. `updateMovement`/`updateFormation` directly, not through
 * GameLoop's `levelIntroRemaining` gate), so defaulting to an already-live (0)
 * intro here keeps existing/unrelated tests from silently depending on an intro
 * countdown they never intended to test. Tests that specifically exercise F18's
 * intro-gating behavior set `world.levelIntroRemaining` explicitly (or use
 * `createNewRunWorld()` directly, which is the real "fresh start" entry point).
 */
export function makePlayingWorld(level = 1): World {
  const world = createNewRunWorld();
  resetForLevel(world, level);
  world.state = 'PLAYING';
  world.levelIntroRemaining = 0;
  return world;
}

/** Default all-false input snapshot; override individual intents per test. */
export function makeInput(overrides: Partial<InputSnapshot> = {}): InputSnapshot {
  return {
    moveLeft: false,
    moveRight: false,
    throwHeld: false,
    escPressed: false,
    menuUpPressed: false,
    menuDownPressed: false,
    menuConfirmPressed: false,
    anyKeyPressed: false,
    ...overrides,
  };
}
