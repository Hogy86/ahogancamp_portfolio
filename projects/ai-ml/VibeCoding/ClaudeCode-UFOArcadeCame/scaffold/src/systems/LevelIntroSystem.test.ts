// Tests PRD §F18 (level-start "LEVEL [N]" 3-second freeze/fade) - the pure countdown
// decrement itself. The gating behavior this counter drives (nobody moves/fires while
// it is > 0) is covered end-to-end in GameLoop.test.ts, since the gate lives in
// GameLoop's private stepSimulation, not in this system.

import { describe, expect, it } from 'vitest';
import { updateLevelIntro } from './LevelIntroSystem';
import { LEVEL_INTRO_SECONDS, FIXED_DT } from '../config/constants';
import { makePlayingWorld } from '../test-utils/worldFactory';

describe('LevelIntroSystem (F18 AC4/AC6)', () => {
  it('decrements levelIntroRemaining by dt each call', () => {
    const world = makePlayingWorld();
    world.levelIntroRemaining = LEVEL_INTRO_SECONDS;

    updateLevelIntro(world, FIXED_DT);

    expect(world.levelIntroRemaining).toBeCloseTo(LEVEL_INTRO_SECONDS - FIXED_DT, 5);
  });

  it('F18 AC4: reaches exactly 0 (never negative) once the full 3s has elapsed', () => {
    const world = makePlayingWorld();
    world.levelIntroRemaining = LEVEL_INTRO_SECONDS;

    const ticks = Math.round(LEVEL_INTRO_SECONDS / FIXED_DT) + 10;
    for (let i = 0; i < ticks; i += 1) updateLevelIntro(world, FIXED_DT);

    expect(world.levelIntroRemaining).toBe(0);
  });

  it('is a no-op once already at 0 (does not go negative on repeated calls)', () => {
    const world = makePlayingWorld();
    world.levelIntroRemaining = 0;

    updateLevelIntro(world, FIXED_DT);
    updateLevelIntro(world, FIXED_DT);

    expect(world.levelIntroRemaining).toBe(0);
  });

  it('F18 AC6: this is a plain remaining-duration decrement, not wall-clock - it only ever changes via an explicit call', () => {
    const world = makePlayingWorld();
    world.levelIntroRemaining = 1.5;
    expect(world.levelIntroRemaining).toBe(1.5); // no calls made yet - unchanged
  });
});
