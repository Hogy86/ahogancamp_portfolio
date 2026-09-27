// Tests PRD §F6 (pause menu / Esc semantics per screen) AC1-AC6, AC8, AC9, AC10, AC11.
// F6 AC7 (timers paused/resumed without drift) is tested at the GameLoop-integration
// level in GameLoop.test.ts, since it depends on the loop only ticking simulation
// while state == PLAYING. v2: §F19 AC9 (the VICTORY/"Game Complete" screen is mostly
// non-interactive - Esc is a silent no-op throughout per F6 AC8's continuation; any
// other key press holds the celebration once, a second such press advances to TITLE).

import { describe, expect, it } from 'vitest';
import { dispatchStateInput, handleBack, PAUSE_MENU_OPTIONS, pauseForInterruption, startRun } from './GameStateMachine';
import { createNewRunWorld, resetForLevel } from './world';
import { bestScore } from '../persistence/bestScore';
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

describe('GameStateMachine - Restart Level (F6 AC4, F18 AC9)', () => {
  it('F6 AC4: selecting Restart Level resets the current level and resumes PLAYING without reload', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 1; // 'Restart Level'
    world.enemies.forEach((e) => (e.alive = false));

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.state).toBe('PLAYING');
    expect(world.enemies.every((e) => e.alive)).toBe(true);
  });

  it('F21 AC1/AC2 (docs/PRD-addendum-v4.md): Restart Level rolls the score back to the level-start value', () => {
    const world = playingWorld();
    world.levelStartScore = 200; // as if this level was entered with a running score of 200
    world.score = 650; // points earned in the attempt being abandoned
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 1; // 'Restart Level'

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.score).toBe(200);
  });

  it('F21 AC2: Restart Level on level 1 of a fresh run sets the score to 0', () => {
    const world = playingWorld();
    world.score = 300;
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 1;

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.levelStartScore).toBe(0);
    expect(world.score).toBe(0);
  });

  it('F21 AC3: repeating Restart Level always returns to the same level-start score, never re-recording it', () => {
    const world = playingWorld();
    world.levelStartScore = 400;
    world.score = 900;
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 1;

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));
    expect(world.score).toBe(400);

    world.score = 777; // earn different points this attempt
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 1;
    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.score).toBe(400);
    expect(world.levelStartScore).toBe(400);
  });

  it('F18 AC9 (round-1 B2): Restart Level skips the 3s level-intro countdown entirely - play begins immediately', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 1; // 'Restart Level'
    world.levelIntroRemaining = 0; // simulate mid-play (intro already elapsed before pausing)

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.levelIntroRemaining).toBe(0);
  });

  it('F18 AC9: Restart Level skips the countdown even if it happened to still be armed at the moment of restarting', () => {
    const world = playingWorld();
    world.levelIntroRemaining = 3; // e.g. player paused during the fresh-start intro itself
    world.state = 'PAUSED';
    world.pauseMenuSelectedIndex = 1;

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.levelIntroRemaining).toBe(0);
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

describe('GameStateMachine - fresh run from Game Over (F8 AC7)', () => {
  it('F8 AC7: confirming on GAMEOVER starts a fresh run without a page reload', () => {
    const world = playingWorld();
    world.state = 'GAMEOVER';
    world.score = 777;

    dispatchStateInput(world, makeInput({ menuConfirmPressed: true }));

    expect(world.state).toBe('PLAYING');
    expect(world.score).toBe(0);
  });
});

describe('GameStateMachine - VICTORY / "Game Complete" input handling (F19 AC9, F6 AC8 continuation)', () => {
  function victoryWorld(): World {
    const world = playingWorld();
    world.state = 'VICTORY';
    world.score = 9999;
    world.victoryCelebrationRemaining = 5;
    world.victoryHeld = false;
    return world;
  }

  it('F19 AC9 / F6 AC8: Esc is a silent no-op on VICTORY - it never holds or advances', () => {
    const world = victoryWorld();

    dispatchStateInput(world, makeInput({ escPressed: true, anyKeyPressed: true }));

    expect(world.state).toBe('VICTORY');
    expect(world.victoryHeld).toBe(false);
  });

  it('F19 AC9: a second Esc press still does not hold/advance, even after other Esc presses', () => {
    const world = victoryWorld();
    dispatchStateInput(world, makeInput({ escPressed: true, anyKeyPressed: true }));
    dispatchStateInput(world, makeInput({ escPressed: true, anyKeyPressed: true }));

    expect(world.state).toBe('VICTORY');
    expect(world.victoryHeld).toBe(false);
  });

  it('F19 AC9: no key press at all leaves the celebration running untouched', () => {
    const world = victoryWorld();
    dispatchStateInput(world, makeInput());
    expect(world.state).toBe('VICTORY');
    expect(world.victoryHeld).toBe(false);
  });

  it('F19 AC9: the first qualifying (non-Esc) key press holds the celebration - pauses, does not advance', () => {
    const world = victoryWorld();

    dispatchStateInput(world, makeInput({ anyKeyPressed: true }));

    expect(world.state).toBe('VICTORY');
    expect(world.victoryHeld).toBe(true);
    expect(world.score).toBe(9999); // still showing the same celebration/score
  });

  it('F19 AC9: a second qualifying key press (after the first already holds) advances straight to TITLE', () => {
    const world = victoryWorld();
    dispatchStateInput(world, makeInput({ anyKeyPressed: true })); // holds
    expect(world.victoryHeld).toBe(true);

    dispatchStateInput(world, makeInput({ anyKeyPressed: true })); // advances

    expect(world.state).toBe('TITLE');
  });

  it('F19 AC8: advancing off VICTORY resets run state for a clean subsequent run (level 1, 3 lives, score 0, multiplier reset)', () => {
    const world = victoryWorld();
    world.permanentMultiplier = 3.24;
    dispatchStateInput(world, makeInput({ anyKeyPressed: true })); // holds
    dispatchStateInput(world, makeInput({ anyKeyPressed: true })); // advances to TITLE

    expect(world.state).toBe('TITLE');
    expect(world.level).toBe(1);
    expect(world.score).toBe(0);
    expect(world.permanentMultiplier).toBe(1);
  });
});

describe('startRun', () => {
  it('produces a PLAYING world starting at level 1 with default lives/score', () => {
    const world = startRun();
    expect(world.state).toBe('PLAYING');
    expect(world.level).toBe(1);
    expect(world.score).toBe(0);
  });
});

// docs/mobile/architecture/mobile-architecture.md §8.3 (H6, M5): the shared
// `handleBack()` resolution table every Android back-button/gesture press consumes.
describe('GameStateMachine - handleBack() state table (§8.3, M5, H6)', () => {
  it('PLAYING -> pause(), handled', () => {
    const world = playingWorld();
    expect(handleBack(world)).toBe('handled');
    expect(world.state).toBe('PAUSED');
  });

  it('PAUSED with confirm pending -> cancelRestartGame(), handled (stays PAUSED)', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.restartGameConfirmPending = true;
    expect(handleBack(world)).toBe('handled');
    expect(world.state).toBe('PAUSED');
    expect(world.restartGameConfirmPending).toBe(false);
  });

  it('PAUSED (no confirm pending) -> resume(), handled', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    expect(handleBack(world)).toBe('handled');
    expect(world.state).toBe('PLAYING');
  });

  it('GAMEOVER -> returnToTitle(), handled', () => {
    const world = playingWorld();
    world.state = 'GAMEOVER';
    expect(handleBack(world)).toBe('handled');
    expect(world.state).toBe('TITLE');
  });

  it('VICTORY -> silent no-op, handled (F19 AC9 Esc exemption, by continuation)', () => {
    const world = playingWorld();
    world.state = 'VICTORY';
    world.victoryHeld = false;
    expect(handleBack(world)).toBe('handled');
    expect(world.state).toBe('VICTORY');
    expect(world.victoryHeld).toBe(false);
  });

  it('TITLE -> leaveApp', () => {
    const world = playingWorld();
    world.state = 'TITLE';
    expect(handleBack(world)).toBe('leaveApp');
    expect(world.state).toBe('TITLE');
  });
});

// docs/mobile/architecture/mobile-architecture.md §8.1 (H6, M4.1, M7): the shared
// "leaving the foreground" interruption command every Android lifecycle/resize pause
// goes through.
describe('GameStateMachine - pauseForInterruption() state table (§8.1, H6)', () => {
  it('PLAYING -> PAUSED, and commits the best score to the persisted store', () => {
    const world = playingWorld();
    world.score = 42;
    pauseForInterruption(world);
    expect(world.state).toBe('PAUSED');
    expect(bestScore.get()).toBeGreaterThanOrEqual(42);
  });

  it('PAUSED stays PAUSED, and still commits the best score (mid-run interruption)', () => {
    const world = playingWorld();
    world.state = 'PAUSED';
    world.score = 7;
    pauseForInterruption(world);
    expect(world.state).toBe('PAUSED');
    expect(bestScore.get()).toBeGreaterThanOrEqual(7);
  });

  it('VICTORY holds the celebration (victoryHeld = true) and does not change state', () => {
    const world = playingWorld();
    world.state = 'VICTORY';
    world.victoryHeld = false;
    pauseForInterruption(world);
    expect(world.state).toBe('VICTORY');
    expect(world.victoryHeld).toBe(true);
  });

  it('TITLE is untouched', () => {
    const world = playingWorld();
    world.state = 'TITLE';
    pauseForInterruption(world);
    expect(world.state).toBe('TITLE');
  });

  it('GAMEOVER is untouched', () => {
    const world = playingWorld();
    world.state = 'GAMEOVER';
    pauseForInterruption(world);
    expect(world.state).toBe('GAMEOVER');
  });
});
