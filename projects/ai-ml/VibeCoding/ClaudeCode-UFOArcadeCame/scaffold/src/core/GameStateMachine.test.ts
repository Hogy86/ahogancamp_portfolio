// Tests PRD §F6 (pause menu / Esc semantics per screen) AC1-AC6, AC8, AC9, AC10, AC11.
// F6 AC7 (timers paused/resumed without drift) is tested at the GameLoop-integration
// level in GameLoop.test.ts, since it depends on the loop only ticking simulation
// while state == PLAYING.

import { describe, expect, it } from 'vitest';
import { dispatchStateInput, PAUSE_MENU_OPTIONS, startNewRun } from './GameStateMachine';
import { createNewRunWorld, resetForLevel } from './world';
import { makeInput } from '../test-utils/worldFactory';
import type { World } from './types';

function playingWorld(): World {
  const world = createNewRunWorld();
  resetForLevel(world, world.level);
  world.state = 'PLAYING';
  return world;
}

describe('GameStateMachine - Esc dispatch per screen (F6 AC1, AC8)', () => {
  it('F6 AC1: Esc during PLAYING transitions to PAUSED', () => {
    const world = playingWorld();
    dispatchStateInput(world, makeInput({ escPressed: true }));
    expect(world.state).toBe('PAUSED');
  });

  it('F6 AC8: Esc on TITLE is a silent no-op (no state change, no error)', () => {
    const world = createNewRunWorld();
    world.state = 'TITLE';
    expect(() => dispatchStateInput(world, makeInput({ escPressed: true }))).not.toThrow();
    expect(world.state).toBe('TITLE');
  });

  it('F6 AC8: Esc on GAMEOVER is a silent no-op', () => {
    const world = playingWorld();
    world.state = 'GAMEOVER';
    expect(() => dispatchStateInput(world, makeInput({ escPressed: true }))).not.toThrow();
    expect(world.state).toBe('GAMEOVER');
  });

  it('F6 AC8: Esc on VICTORY is a silent no-op', () => {
    const world = playingWorld();
    world.state = 'VICTORY';
    expect(() => dispatchStateInput(world, makeInput({ escPressed: true }))).not.toThrow();
    expect(world.state).toBe('VICTORY');
  });
});

describe('GameStateMachine - pause resume (F6 AC3)', () => {
  it('F6 AC3: pressing Esc again while PAUSED resumes to PLAYING', () => {
    const world = playingWorld();
    dispatchStateInput(world, makeInput({ escPressed: true }));
    expect(world.state).toBe('PAUSED');
    dispatchStateInput(world, makeInput({ escPressed: true }));
    expect(world.state).toBe('PLAYING');
  });

  it('F6 AC3/AC2: selecting Resume from the pause menu (Enter on index 0) resumes to PLAYING', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 0; // 'Resume'
    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));
    expect(world.state).toBe('PLAYING');
  });
});

describe('GameStateMachine - pause menu options and navigation (F6 AC2, AC10)', () => {
  it('F6 AC2: exposes exactly the four required labeled options in order', () => {
    expect(PAUSE_MENU_OPTIONS).toEqual(['Resume', 'Restart Level', 'Restart Game', 'Quit']);
  });

  it('F6 AC10: Down arrow moves the selection forward through the options, wrapping around', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 0;
    dispatchStateInput(world, makeInput({ menuDownPressed: true }));
    expect(world.pauseMenuSelectedIndex).toBe(1);
    dispatchStateInput(world, makeInput({ menuDownPressed: true }));
    dispatchStateInput(world, makeInput({ menuDownPressed: true }));
    expect(world.pauseMenuSelectedIndex).toBe(3);
    dispatchStateInput(world, makeInput({ menuDownPressed: true })); // wraps
    expect(world.pauseMenuSelectedIndex).toBe(0);
  });

  it('F6 AC10: Up arrow moves the selection backward, wrapping around', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 0;
    dispatchStateInput(world, makeInput({ menuUpPressed: true })); // wraps to last
    expect(world.pauseMenuSelectedIndex).toBe(3);
  });
});

describe('GameStateMachine - Restart Level (F6 AC4)', () => {
  it('F6 AC4: selecting Restart Level resets the current level and resumes PLAYING without reload', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 1; // 'Restart Level'
    world.score = 999; // score must survive a level restart (only level-scoped state resets)
    world.enemies.forEach((e) => (e.alive = false));

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.state).toBe('PLAYING');
    expect(world.score).toBe(999);
    expect(world.enemies.every((e) => e.alive)).toBe(true);
  });
});

describe('GameStateMachine - Restart Game confirmation guard (F6 AC5, AC11)', () => {
  it('F6 AC11: selecting Restart Game does not immediately reset - it requires confirmation first', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 2; // 'Restart Game'
    world.score = 500;

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.restartGameConfirmPending).toBe(true);
    expect(world.state).toBe('PAUSED'); // not yet reset
    expect(world.score).toBe(500);
  });

  it('F6 AC11/AC5: confirming (Enter) while the Restart Game guard is pending performs the full reset', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.score = 500;
    world.permanentMultiplier = 3.24;
    world.restartGameConfirmPending = true;

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.restartGameConfirmPending).toBe(false);
    expect(world.state).toBe('PLAYING');
    expect(world.score).toBe(0);
    expect(world.permanentMultiplier).toBe(1);
    expect(world.level).toBe(1);
  });

  it('F6 AC11: cancelling (Esc) while the Restart Game guard is pending returns to the pause menu without resetting', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.score = 500;
    world.restartGameConfirmPending = true;

    dispatchStateInput(world, makeInput({ escPressed: true }));

    expect(world.restartGameConfirmPending).toBe(false);
    expect(world.state).toBe('PAUSED'); // still paused, not resumed and not reset
    expect(world.score).toBe(500);
  });
});

describe('GameStateMachine - Quit (F6 AC6, AC9)', () => {
  it('F6 AC6/AC9: selecting Quit falls back to TITLE with the blocked-close message flagged when window.close() is blocked', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 3; // 'Quit'

    // jsdom's window.close() does not actually close the tab (analogous to a
    // browser blocking script-initiated close on a tab it did not open) - this
    // exercises the exact "blocked" branch specified by F6 AC6/AC9.
    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.state).toBe('TITLE');
    expect(world.quitBlockedMessageActive).toBe(true);
  });
});

describe('GameStateMachine - fresh run from end screens (F8 AC7)', () => {
  it('F8 AC7: confirming on GAMEOVER starts a fresh run without a page reload', () => {
    const world = playingWorld();
    world.state = 'GAMEOVER';
    world.score = 777;

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.state).toBe('PLAYING');
    expect(world.score).toBe(0);
  });

  it('F8 AC7: confirming on VICTORY starts a fresh run without a page reload', () => {
    const world = playingWorld();
    world.state = 'VICTORY';
    world.score = 9999;

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.state).toBe('PLAYING');
    expect(world.score).toBe(0);
  });
});

describe('startNewRun', () => {
  it('produces a PLAYING world starting at level 1 with default lives/score', () => {
    const world = startNewRun();
    expect(world.state).toBe('PLAYING');
    expect(world.level).toBe(1);
    expect(world.score).toBe(0);
  });
});
