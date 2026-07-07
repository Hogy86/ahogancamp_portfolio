// Test-only helper: builds a minimal, deterministic World for unit tests without
// depending on module-scoped level-runtime state or the full GameLoop wiring.
// Not shipped to the player (test-only file under src/test-utils).

import { createNewRunWorld, resetForLevel } from '../core/world';
import type { InputSnapshot } from '../core/InputManager';
import type { World } from '../core/types';

/** Returns a World in PLAYING state at the given level (default 1), fully reset. */
export function makePlayingWorld(level = 1): World {
  const world = createNewRunWorld();
  resetForLevel(world, level);
  world.state = 'PLAYING';
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
    ...overrides,
  };
}
