// Implements PRD §F18 (level-start "LEVEL [N]" 3-second freeze/fade).

import type { World } from '../core/types';

/** F18 AC4/AC6: decrements the level-intro countdown toward 0, remaining-duration style
 * (ADR-0002 decision 5). GameLoop reads `levelIntroRemaining > 0` right after this call to
 * gate the rest of stepSimulation (F18 AC2/AC5/AC8) - this system only ever ticks the timer,
 * it does not itself gate anything. */
export function updateLevelIntro(world: World, dt: number): void {
  world.levelIntroRemaining = Math.max(0, world.levelIntroRemaining - dt);
}
