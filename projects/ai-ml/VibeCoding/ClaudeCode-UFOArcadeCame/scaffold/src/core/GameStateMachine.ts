// Implements PRD §F6 (pause menu + Esc semantics per screen), §F6 AC8 (silent no-op
// off active play), §F8 AC7 (fresh run from end screens without reload), §F18 AC9 (v2:
// Restart Level skips the level-intro countdown), §F19 AC9 (v2: VICTORY/"Game Complete" is
// mostly non-interactive, but any non-Esc key press holds the celebration once, and a
// second such press advances to TITLE - Esc remains a silent no-op throughout, continuing
// F6 AC8's precedent for the screen F19 replaces). ADR-0002 decision 2: input is dispatched
// by state so Esc's meaning is defined in exactly one place - this module IS that dispatch
// table.

import type { InputSnapshot } from './InputManager';
import { createNewRunWorld, resetForLevel } from './world';
import type { World } from './types';
import { emit } from '../instrumentation/Instrumentation';
import { resetGuaranteedDrops } from '../systems/levelRuntimeState';

/** Pause menu options in display order (F6 AC2). Index is what pauseMenuSelectedIndex tracks. */
export const PAUSE_MENU_OPTIONS = ['Resume', 'Restart Level', 'Restart Game', 'Quit'] as const;
export type PauseMenuOption = (typeof PAUSE_MENU_OPTIONS)[number];

/** Attempts to close the tab; returns whether the fallback (blocked close) path should show. */
function attemptQuit(): boolean {
  // Browsers generally block window.close() on tabs the script did not open
  // (F6 AC6, owner-confirmed). We attempt it and treat "still here after the call"
  // as the blocked case, matching the specified fallback behavior.
  window.close();
  return true;
}

/** Starts a brand-new run from the title screen (F9 AC3's "first controllable input"). */
export function startNewRun(): World {
  const world = createNewRunWorld();
  world.state = 'PLAYING';
  resetGuaranteedDrops(world.level);
  emit('sessionStart');
  return world;
}

/**
 * Central per-screen input dispatch (ADR-0002 §Decision 2 table). Mutates `world`
 * in place and returns nothing; called once per tick regardless of state so that
 * "no-op on non-play screens" (F6 AC8 / UX-B1) is a property of this single
 * function rather than scattered guards.
 */
export function dispatchStateInput(world: World, input: InputSnapshot): void {
  switch (world.state) {
    case 'TITLE': {
      if (input.menuConfirmPressed) {
        Object.assign(world, startNewRun());
      }
      // Esc is a silent no-op on TITLE (F6 AC8).
      return;
    }

    case 'PLAYING': {
      if (input.escPressed) {
        world.state = 'PAUSED';
        world.pauseMenuSelectedIndex = 0;
      }
      return;
    }

    case 'PAUSED': {
      if (world.restartGameConfirmPending) {
        // F6 AC11: Restart Game requires a confirmation guard. Enter confirms the
        // destructive action; Esc cancels back to the pause menu (does NOT resume
        // play directly, so the confirm prompt can't be silently bypassed/orphaned).
        if (input.menuConfirmPressed) {
          performRestartGame(world);
          world.restartGameConfirmPending = false;
        } else if (input.escPressed) {
          world.restartGameConfirmPending = false;
        }
        return;
      }
      if (input.escPressed) {
        world.state = 'PLAYING'; // Esc again resumes (F6 AC3).
        return;
      }
      if (input.menuUpPressed) {
        world.pauseMenuSelectedIndex =
          (world.pauseMenuSelectedIndex + PAUSE_MENU_OPTIONS.length - 1) %
          PAUSE_MENU_OPTIONS.length;
      }
      if (input.menuDownPressed) {
        world.pauseMenuSelectedIndex =
          (world.pauseMenuSelectedIndex + 1) % PAUSE_MENU_OPTIONS.length;
      }
      if (input.menuConfirmPressed) {
        applyPauseMenuSelection(world);
      }
      return;
    }

    case 'GAMEOVER': {
      // Esc is a silent no-op on this end screen (F6 AC8 / UX-B1).
      if (input.menuConfirmPressed) {
        Object.assign(world, startNewRun());
      }
      return;
    }

    case 'VICTORY': {
      // F19 AC9: Esc is exempt from the celebration-hold gesture - a silent no-op
      // throughout, continuing F6 AC8's precedent for the screen F19 replaces.
      if (input.escPressed) return;
      if (!input.anyKeyPressed) return;

      if (!world.victoryHeld) {
        // First qualifying (non-Esc) key press pauses the countdown (F19 AC9).
        world.victoryHeld = true;
        return;
      }
      // Second qualifying key press advances straight to TITLE (F19 AC5/AC8).
      Object.assign(world, createNewRunWorld());
      return;
    }
  }
}

function performRestartGame(world: World): void {
  const fresh = createNewRunWorld();
  fresh.state = 'PLAYING';
  Object.assign(world, fresh);
  resetGuaranteedDrops(world.level);
  emit('runRestart', { scope: 'game' });
}

function applyPauseMenuSelection(world: World): void {
  const selected = PAUSE_MENU_OPTIONS[world.pauseMenuSelectedIndex];
  switch (selected) {
    case 'Resume':
      world.state = 'PLAYING';
      return;
    case 'Restart Level':
      resetForLevel(world, world.level);
      // F18 AC9 (round-1 B2, owner-approved): Restart Level is the sole exception that
      // skips the "LEVEL [N]" countdown - play begins immediately.
      world.levelIntroRemaining = 0;
      resetGuaranteedDrops(world.level);
      world.state = 'PLAYING';
      emit('runRestart', { scope: 'level', level: world.level });
      return;
    case 'Restart Game':
      // F6 AC11: destructive action requires confirmation before executing.
      world.restartGameConfirmPending = true;
      return;
    case 'Quit': {
      const blocked = attemptQuit();
      if (blocked) {
        world.state = 'TITLE';
        world.quitBlockedMessageActive = true; // F6 AC9: explicit fallback text.
      }
      return;
    }
  }
}
