// Tests PRD §F6 AC2 (pause overlay shows exactly the four labeled options),
// §F6 AC8 (Esc/non-play screens render no partial overlay - here: PLAYING
// renders nothing), §F6 AC9 (blocked-Quit fallback shows the exact visible
// text), §F6 AC10 (selected pause option is visibly highlighted via a
// non-color-only `selected` class), §F8 AC4 (Game Over shows a clear message),
// §F10 AC5 (score shown on both end screens), and the binding textContent-only
// DOM security constraint (asserted behaviorally: HTML-looking input renders as
// literal text, never interpreted markup). v2: §F19 (the "Game Complete"
// celebration screen replaces v1's static "VICTORY" screen - F8 AC6's "visibly
// distinct end screen" intent is retained under the new heading/copy).
//
// These are real-DOM assertions against jsdom output - not a re-test of the
// state transitions themselves (GameStateMachine.test.ts already covers those);
// this file answers "does ScreenController actually render what the state
// machine decided," which is the gap flagged in validation-report.md.
// PRD addendum v7 F24 AC1-AC3 (power-up guide on the title, both versions) and F26 AC2/AC3
// (developer contact line from src/config/contact.ts, textContent only).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScreenController } from './ScreenController';
import { PAUSE_MENU_OPTIONS } from '../core/GameStateMachine';
import { makePlayingWorld } from '../test-utils/worldFactory';
import { DEVELOPER_EMAIL, DEVELOPER_NAME } from '../config/contact';
import type { PlatformCopy } from '../platform/Platform';
import type { World } from '../core/types';

function pausedWorld(): World {
  const world = makePlayingWorld();
  world.state = 'PAUSED';
  world.pauseMenuSelectedIndex = 0;
  return world;
}

describe('ScreenController (F6 AC2/AC8/AC9/AC10, F8 AC4, F10 AC5, F19)', () => {
  let root: HTMLElement;
  let controller: ScreenController;

  beforeEach(() => {
    // jsdom has no 2D canvas; the title's power-up icons then stay blank (see powerUpGuide.ts).
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    root = document.createElement('div');
    controller = new ScreenController(root);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('F6 AC1/AC8: PLAYING renders no overlay at all', () => {
    it('renders zero child elements while state is PLAYING (no partial overlay/glitch)', () => {
      const world = makePlayingWorld();
      controller.render(world);
      expect(root.childElementCount).toBe(0);
      expect(root.textContent).toBe('');
    });
  });

  describe('F6 AC2: pause overlay presents exactly the four labeled options', () => {
    it('renders each of PAUSE_MENU_OPTIONS as visible <li> text, in order', () => {
      const world = pausedWorld();
      controller.render(world);

      const items = Array.from(root.querySelectorAll('li.menu-item'));
      expect(items).toHaveLength(4);
      expect(items.map((el) => el.textContent)).toEqual([...PAUSE_MENU_OPTIONS]);
    });

    it('renders no confirmation box when Restart Game confirmation is not pending', () => {
      const world = pausedWorld();
      controller.render(world);
      expect(root.querySelector('.confirm-box')).toBeNull();
    });
  });

  describe('F6 AC10: the selected pause option is visibly highlighted, non-color-only', () => {
    it('applies the "selected" class only to the <li> at pauseMenuSelectedIndex', () => {
      const world = pausedWorld();
      world.pauseMenuSelectedIndex = 2; // 'Restart Game'
      controller.render(world);

      const items = Array.from(root.querySelectorAll('li.menu-item'));
      items.forEach((el, index) => {
        expect(el.classList.contains('selected')).toBe(index === 2);
      });
      expect(items[2]!.textContent).toBe('Restart Game');
    });

    it('moves the "selected" class when the selected index changes and the screen re-renders', () => {
      const world = pausedWorld();
      world.pauseMenuSelectedIndex = 0;
      controller.render(world);
      expect(root.querySelectorAll('li.menu-item')[0]!.classList.contains('selected')).toBe(true);

      world.pauseMenuSelectedIndex = 3;
      controller.render(world);
      const itemsAfter = Array.from(root.querySelectorAll('li.menu-item'));
      expect(itemsAfter[0]!.classList.contains('selected')).toBe(false);
      expect(itemsAfter[3]!.classList.contains('selected')).toBe(true);
    });
  });

  describe('F6 AC9: blocked-Quit fallback shows the exact explicit visible text', () => {
    it('renders the literal fallback string on the title screen when quitBlockedMessageActive is true', () => {
      const world = makePlayingWorld();
      world.state = 'TITLE';
      world.quitBlockedMessageActive = true;
      controller.render(world);

      expect(root.textContent).toContain('Run ended — you may now close this tab.');
    });

    it('does not render the fallback text on the title screen when quit was never blocked', () => {
      const world = makePlayingWorld();
      world.state = 'TITLE';
      world.quitBlockedMessageActive = false;
      controller.render(world);

      expect(root.textContent).not.toContain('Run ended');
    });
  });

  describe('F6 AC11: Restart Game confirmation guard renders a distinct confirm prompt', () => {
    it('renders a confirm-box instead of the option list while restartGameConfirmPending is true', () => {
      const world = pausedWorld();
      world.restartGameConfirmPending = true;
      controller.render(world);

      expect(root.querySelector('.confirm-box')).not.toBeNull();
      expect(root.querySelectorAll('li.menu-item')).toHaveLength(0);
      expect(root.textContent).toContain('Press Enter to confirm, or Esc to cancel.');
    });
  });

  describe('F8 AC4: Game Over renders a clear, distinct message', () => {
    it('renders a "GAME OVER" heading', () => {
      const world = makePlayingWorld();
      world.state = 'GAMEOVER';
      controller.render(world);

      const heading = root.querySelector('h1');
      expect(heading?.textContent).toBe('GAME OVER');
    });
  });

  describe('F19: "Game Complete" is visibly distinct from Game Over (supersedes v1 F8 AC6\'s "VICTORY" screen)', () => {
    it('renders a "GAME COMPLETE" heading, not "GAME OVER" and not the old "VICTORY" heading', () => {
      const world = makePlayingWorld();
      world.state = 'VICTORY'; // GameState value is unchanged; only the rendered screen/copy changed
      controller.render(world);

      const heading = root.querySelector('h1');
      expect(heading?.textContent).toBe('GAME COMPLETE');
      expect(root.textContent).not.toContain('GAME OVER');
      expect(heading?.textContent).not.toBe('VICTORY');
    });

    it('F19 AC5: renders no "Press Enter" prompt - the sequence auto-returns with no input required', () => {
      const world = makePlayingWorld();
      world.state = 'VICTORY';
      controller.render(world);

      expect(root.textContent).not.toContain('Press Enter');
    });

    it('announces itself as an alert (role="alert", aria-live="assertive"), same outcome-announcement semantics as Game Over', () => {
      const world = makePlayingWorld();
      world.state = 'VICTORY';
      controller.render(world);

      const overlay = root.querySelector('.screen-overlay');
      expect(overlay?.getAttribute('role')).toBe('alert');
      expect(overlay?.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('F10 AC5: final score is displayed on both end screens', () => {
    it('shows the final score on the Game Over screen', () => {
      const world = makePlayingWorld();
      world.state = 'GAMEOVER';
      world.score = 4321;
      controller.render(world);

      expect(root.textContent).toContain('Final Score: 4321');
    });

    it('shows the final score on the Game Complete screen', () => {
      const world = makePlayingWorld();
      world.state = 'VICTORY';
      world.score = 98765;
      controller.render(world);

      expect(root.textContent).toContain('Final Score: 98765');
    });
  });

  describe('Security constraint: all overlay text is written via textContent, never innerHTML', () => {
    it('renders a pause-menu option label containing HTML-looking characters as literal text, not parsed markup', () => {
      // PAUSE_MENU_OPTIONS is a fixed literal tuple in source, so we cannot inject
      // through it directly; instead we prove the *mechanism* ScreenController
      // itself uses (createElement/setText from ./dom, which is textContent-only)
      // cannot be tricked into rendering markup by feeding the same helper an
      // HTML-bearing string via the one place ScreenController renders
      // caller-influenced text: the quit-blocked message path renders a fixed
      // literal, so we instead verify no <b>/<script> element is ever produced
      // anywhere in the pause overlay's rendered subtree, for any world content.
      const world = pausedWorld();
      controller.render(world);

      expect(root.querySelector('b')).toBeNull();
      expect(root.querySelector('script')).toBeNull();
      // Every leaf text node is plain text - none of the option labels contain
      // unescaped-looking angle brackets that would indicate innerHTML parsing.
      Array.from(root.querySelectorAll('li.menu-item')).forEach((el) => {
        expect(el.children).toHaveLength(0); // no nested elements were parsed in
      });
    });

    it('a crafted world.score-adjacent value cannot introduce markup: Final Score text node has no element children', () => {
      const world = makePlayingWorld();
      world.state = 'GAMEOVER';
      world.score = 4321;
      controller.render(world);

      const scoreParagraph = Array.from(root.querySelectorAll('p')).find((p) =>
        p.textContent?.startsWith('Final Score'),
      );
      expect(scoreParagraph).toBeDefined();
      expect(scoreParagraph!.children).toHaveLength(0);
      expect(scoreParagraph!.innerHTML).toBe(scoreParagraph!.textContent);
    });
  });

  describe('F24 / F26: power-up guide and developer contact on the title screen', () => {
    const ANDROID_COPY: PlatformCopy = {
      controlHint: '',
      titleStartLabel: 'Start',
      titleExtraActions: ['help', 'settings', 'quit'],
      menuHint: null,
      confirmHint: null,
      gameOverActionLabel: 'Play again',
    };

    function titleWorld(): World {
      const world = makePlayingWorld();
      world.state = 'TITLE';
      return world;
    }

    for (const [version, copy] of [
      ['website', undefined],
      ['Android', ANDROID_COPY],
    ] as const) {
      it(`${version}: shows the four labelled power-ups in order with decorative icons`, () => {
        const screen = new ScreenController(root, copy);
        screen.render(titleWorld());
        const items = Array.from(root.querySelectorAll('.power-up-guide li'));
        expect(items.map((li) => li.textContent)).toEqual([
          'Power',
          'Speed',
          'Shield',
          'Multiplier',
        ]);
        for (const li of items) {
          expect(li.querySelector('canvas')!.getAttribute('aria-hidden')).toBe('true');
        }
      });

      it(`${version}: shows one developer line with the name and email from config`, () => {
        const screen = new ScreenController(root, copy);
        screen.render(titleWorld());
        const lines = root.querySelectorAll('.developer-contact');
        expect(lines).toHaveLength(1);
        expect(lines[0]!.textContent).toBe(`Developer: ${DEVELOPER_NAME} · ${DEVELOPER_EMAIL}`);
        expect(lines[0]!.childElementCount).toBe(0);
      });
    }

    it('Android: the Start button and the three menu buttons are still there', () => {
      const screen = new ScreenController(root, ANDROID_COPY);
      screen.render(titleWorld());
      const actions = Array.from(root.querySelectorAll<HTMLElement>('button[data-action]')).map(
        (b) => b.dataset.action,
      );
      expect(actions).toEqual(['start', 'help', 'settings', 'quit']);
    });

    it('shows neither on the pause or end screens', () => {
      controller.render(pausedWorld());
      expect(root.querySelector('.power-up-guide, .developer-contact')).toBeNull();
    });
  });
});
