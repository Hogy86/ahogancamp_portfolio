// Implements PRD §F19 (post-level-10-boss "Game Complete" celebration + auto-return to TITLE).

import { createNewRunWorld } from '../core/world';
import type { World } from '../core/types';

/**
 * Counts down `victoryCelebrationRemaining` while the game is in the VICTORY state; at 0,
 * resets to a fresh TITLE world (F19 AC5/AC8). F19 AC9: while `victoryHeld` is true (the
 * player made one qualifying key press - see GameStateMachine's VICTORY case) the countdown
 * is paused entirely, not just slowed, until a second qualifying press advances the screen
 * directly (also in GameStateMachine) - so this function simply does nothing in that case,
 * the same "hold" contract remaining-duration counters use elsewhere (ADR-0002 decision 5).
 */
export function updateVictoryCelebration(world: World, dt: number): void {
  if (world.victoryHeld) return;

  world.victoryCelebrationRemaining = Math.max(0, world.victoryCelebrationRemaining - dt);
  if (world.victoryCelebrationRemaining === 0) {
    Object.assign(world, createNewRunWorld());
  }
}
