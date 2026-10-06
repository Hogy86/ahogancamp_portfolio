// Implements PRD §F6 (pause menu + Esc semantics per screen), §F6 AC8 (silent no-op
// off active play), §F8 AC7 (fresh run from end screens without reload), §F18 AC9 (v2:
// Restart Level skips the level-intro countdown), §F19 AC9 (v2: VICTORY/"Game Complete" is
// mostly non-interactive, but any non-Esc key press holds the celebration once, and a
// second such press advances to TITLE - Esc remains a silent no-op throughout, continuing
// F6 AC8's precedent for the screen F19 replaces). ADR-0002 decision 2: input is dispatched
// by state so Esc's meaning is defined in exactly one place - this module IS that dispatch
// table.
//
// docs/PRD-addendum-v3.md F20 / docs/PRD-addendum-v4.md F21: the save-best-score and
// Restart-Level-score-rollback rules are implemented once, here, at every event F20 AC4
// and F21 name (Game Over/Game Complete are WinLossSystem's call sites; Restart Game,
// Quit, and Restart Level are this module's).
//
// docs/mobile/architecture/mobile-architecture.md §5.4/§8: every state transition below is
// a named GameCommand, called by the keyboard dispatch table in this file AND by the
// Android touch/back/lifecycle layers (src/platform/android/*). There is exactly one
// implementation of every transition (M-ADR-0002).

import type { InputSnapshot } from './InputManager';
import { createNewRunWorld, resetForLevel } from './world';
import type { World } from './types';
import { emit } from '../instrumentation/Instrumentation';
import { resetGuaranteedDrops } from '../systems/levelRuntimeState';
import { bestScore } from '../persistence/bestScore';
import { RESTART_LEVEL_SCORE_POLICY } from '../config/constants';

/** Pause menu options in display order (F6 AC2). Index is what pauseMenuSelectedIndex tracks. */
export const PAUSE_MENU_OPTIONS = ['Resume', 'Restart Level', 'Restart Game', 'Quit'] as const;
export type PauseMenuOption = (typeof PAUSE_MENU_OPTIONS)[number];

/** Platform hook for the one service GameCommands needs from outside `src/core`
 * (Platform.ts `GameServices.quitApp`). */
export interface GameServices {
  quitApp(): 'closed' | 'blocked';
}

/** L2 (round 2): core has no platform-specific quit behavior of its own, and must
 * never touch `window` (a platform/browser API) directly - that's exactly why
 * `webQuitApp` lived here was wrong. This default always reports "blocked" without
 * doing anything, and is only observable if a platform's composition root somehow
 * skipped calling `setGameServices` (main.ts does this unconditionally for both
 * platforms, immediately in `bootstrap()`); it matters only to unit tests that
 * exercise `quit()` without going through main.ts. The real web behavior
 * (`window.close()`, F6 AC6) now lives in `src/platform/web/WebPlatform.ts`. */
const noopQuitApp: GameServices = {
  quitApp(): 'closed' | 'blocked' {
    return 'blocked';
  },
};

let services: GameServices = noopQuitApp;

/** Called once by a platform's composition root (src/main.ts) for BOTH platforms, to
 * inject that platform's `quitApp` (Android's `App.exitApp()` -> 'closed', M6.1; web's
 * `window.close()` -> 'closed' | 'blocked'). Web's injected implementation still
 * behaves exactly as `noopQuitApp` used to (delegates to `window.close()`, which itself
 * returns 'blocked' when the browser refuses), so this module's own behavior didn't
 * change - only who supplies the implementation. */
export function setGameServices(next: GameServices): void {
  services = next;
}

/** Starts a brand-new run from the title screen (F9 AC3's "first controllable input").
 * Also the keyboard/touch "Play again" action from Game Over (F8 AC7). */
export function startRun(): World {
  const world = createNewRunWorld();
  world.state = 'PLAYING';
  world.bestScore = bestScore.get();
  resetGuaranteedDrops(world.level);
  emit('sessionStart');
  return world;
}

/** PLAYING -> PAUSED, index 0 (F6 AC1). No-op off PLAYING. */
export function pause(world: World): void {
  if (world.state !== 'PLAYING') return;
  world.state = 'PAUSED';
  world.pauseMenuSelectedIndex = 0;
}

/** PAUSED -> PLAYING (F6 AC3). No-op while a confirm prompt is pending, or off PAUSED. */
export function resume(world: World): void {
  if (world.state !== 'PAUSED' || world.restartGameConfirmPending) return;
  world.state = 'PLAYING';
}

/** F6 AC11: Restart Game requires confirmation before it executes destructively. */
export function cancelRestartGame(world: World): void {
  world.restartGameConfirmPending = false;
}

export function confirmRestartGame(world: World): void {
  if (!world.restartGameConfirmPending) return;
  performRestartGame(world);
  world.restartGameConfirmPending = false;
}

/** GAMEOVER -> TITLE, and the VICTORY second-qualifying-tap -> TITLE transition (F19
 * AC5/AC8). Also the Android back-button "Go to title" row (M5). Refreshes the saved
 * best so the title screen shows the current device value, not a stale in-run one. */
export function returnToTitle(world: World): void {
  Object.assign(world, createNewRunWorld());
  world.bestScore = bestScore.get();
}

/** F19 AC9: first qualifying (non-Esc) tap/key holds the celebration; a second advances
 * to TITLE. Callers are responsible for excluding Esc/back before calling this (F6 AC8
 * continuation) - this function itself has no opinion on which physical input fired. */
export function victoryTap(world: World): void {
  if (world.state !== 'VICTORY') return;
  if (!world.victoryHeld) {
    world.victoryHeld = true;
    return;
  }
  returnToTitle(world);
}

/** Commits the best score (F20 AC4(d) / M6.3), then asks the platform to quit. On the
 * web this is `window.close()`; when it is blocked, falls back to TITLE with the
 * explicit fallback text (F6 AC9). On Android, `services.quitApp()` returns 'closed'
 * and the activity finishes - no fallback text is ever shown there (M6.1). */
export function quit(world: World): void {
  const result = bestScore.commit(world.score);
  world.bestScore = result.best;
  const outcome = services.quitApp();
  if (outcome === 'blocked') {
    world.state = 'TITLE';
    world.quitBlockedMessageActive = true;
  }
}

/** Sets the pause selection and immediately applies it - the touch/tap equivalent of
 * keyboard Up/Down-then-Enter (M3.8, mobile-architecture.md §5.4). No-op off PAUSED or
 * while a confirm prompt is pending (the confirm/cancel taps are separate actions). */
export function selectPauseOption(world: World, index: number): void {
  if (world.state !== 'PAUSED' || world.restartGameConfirmPending) return;
  // L3: a touch caller parses `index` out of a DOM `data-action` string
  // (`pause-option:<n>`) - an out-of-range value (a stale/tampered attribute, or a
  // future menu-length change) must not select a menu row that does not exist.
  if (!Number.isInteger(index) || index < 0 || index >= PAUSE_MENU_OPTIONS.length) return;
  world.pauseMenuSelectedIndex = index;
  applyPauseMenuSelection(world);
}

/** M5 back-button resolution table (docs/mobile/architecture/mobile-architecture.md §8.3),
 * for the rows this shared module owns (Android shell-overlay rows are handled by the
 * platform layer before this is ever called). Returns 'leaveApp' only from TITLE / the
 * RotatePrompt path (the latter is platform-only and never reaches here). */
export function handleBack(world: World): 'handled' | 'leaveApp' {
  switch (world.state) {
    case 'PLAYING':
      pause(world);
      return 'handled';
    case 'PAUSED':
      if (world.restartGameConfirmPending) {
        cancelRestartGame(world);
      } else {
        resume(world);
      }
      return 'handled';
    case 'GAMEOVER':
      returnToTitle(world);
      return 'handled';
    case 'VICTORY':
      // F19 AC9 Esc exemption, by continuation: back is a silent no-op here too.
      return 'handled';
    case 'TITLE':
      return 'leaveApp';
  }
}

/** Android lifecycle "leaving the foreground" handler (M4.1, §8.1). Shared and pure:
 * PLAYING (incl. the F18 intro / F12 boss warning) -> PAUSED; VICTORY holds the
 * celebration; TITLE/PAUSED/GAMEOVER are untouched. Always commits the best score
 * afterward if the (possibly just-updated) state is still an active run (F20 AC4(e)). */
export function pauseForInterruption(world: World): void {
  if (world.state === 'PLAYING') {
    pause(world);
  } else if (world.state === 'VICTORY') {
    world.victoryHeld = true;
  }
  bestScore.commitIfRunActive(world);
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
        Object.assign(world, startRun());
      }
      // Esc is a silent no-op on TITLE (F6 AC8).
      return;
    }

    case 'PLAYING': {
      if (input.escPressed) pause(world);
      return;
    }

    case 'PAUSED': {
      if (world.restartGameConfirmPending) {
        // F6 AC11: Restart Game requires a confirmation guard. Enter confirms the
        // destructive action; Esc cancels back to the pause menu (does NOT resume
        // play directly, so the confirm prompt can't be silently bypassed/orphaned).
        if (input.menuConfirmPressed) {
          confirmRestartGame(world);
        } else if (input.escPressed) {
          cancelRestartGame(world);
        }
        return;
      }
      if (input.escPressed) {
        resume(world); // Esc again resumes (F6 AC3).
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
        Object.assign(world, startRun());
      }
      return;
    }

    case 'VICTORY': {
      // F19 AC9: Esc is exempt from the celebration-hold gesture - a silent no-op
      // throughout, continuing F6 AC8's precedent for the screen F19 replaces.
      if (input.escPressed) return;
      if (!input.anyKeyPressed) return;
      victoryTap(world);
      return;
    }
  }
}

function performRestartGame(world: World): void {
  // F20 AC4(c): the current run's score is committed BEFORE it resets to 0. Cancelling
  // the confirmation prompt (cancelRestartGame) never reaches this function.
  const result = bestScore.commit(world.score);
  const fresh = createNewRunWorld();
  fresh.state = 'PLAYING';
  fresh.bestScore = result.best;
  Object.assign(world, fresh);
  resetGuaranteedDrops(world.level);
  emit('runRestart', { scope: 'game' });
}

function applyPauseMenuSelection(world: World): void {
  const selected = PAUSE_MENU_OPTIONS[world.pauseMenuSelectedIndex];
  switch (selected) {
    case 'Resume':
      resume(world);
      return;
    case 'Restart Level':
      resetForLevel(world, world.level);
      // F21 (docs/PRD-addendum-v4.md, owner decision Q-v3-1 (b)): the run's score rolls
      // back to its value when this level started, removing points earned in the
      // abandoned attempt. Restart Level triggers no best-score save of its own (F21
      // AC7(a)) and never re-records levelStartScore (F21 AC3).
      if (RESTART_LEVEL_SCORE_POLICY === 'rollback') {
        world.score = world.levelStartScore;
      }
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
    case 'Quit':
      quit(world);
      return;
  }
}
