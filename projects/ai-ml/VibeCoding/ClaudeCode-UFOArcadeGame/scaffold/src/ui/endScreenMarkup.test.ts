// code-review-round13 L2: the Playwright menu-fit test (tests/mobile-e2e/menu-insets.spec.ts)
// cannot reach Game Over / Game Complete quickly, so it injects a copy of their markup.
// This test renders the REAL ScreenController (Android build: PlatformCopy set) and asserts
// it writes exactly the tag/class/attribute/text sequence that injector uses, so the copy
// cannot drift silently when ScreenController's renderers change.

import { describe, expect, it } from 'vitest';
import { ScreenController } from './ScreenController';
import { makePlayingWorld } from '../test-utils/worldFactory';
import {
  END_SCREEN_WORLD,
  GAME_COMPLETE_MARKUP,
  GAME_OVER_MARKUP,
  type EndScreenMarkup,
} from '../test-utils/endScreenMarkup';
import type { PlatformCopy } from '../platform/Platform';
import type { World } from '../core/types';

const ANDROID_COPY: PlatformCopy = {
  controlHint: 'hint',
  titleStartLabel: 'Start',
  titleExtraActions: ['help', 'settings', 'quit'],
  menuHint: null,
  confirmHint: null,
  gameOverActionLabel: 'Play again',
};

function endWorld(state: 'GAMEOVER' | 'VICTORY'): World {
  const world = makePlayingWorld();
  world.level = END_SCREEN_WORLD.level; // set directly: 12 is past the level-config table
  world.state = state;
  world.score = END_SCREEN_WORLD.score;
  world.bestScore = END_SCREEN_WORLD.bestScore;
  world.newBestThisRun = END_SCREEN_WORLD.newBestThisRun;
  return world;
}

function renderReal(state: 'GAMEOVER' | 'VICTORY'): HTMLElement {
  const root = document.createElement('div');
  new ScreenController(root, ANDROID_COPY).render(endWorld(state));
  expect(root.childElementCount, 'exactly one overlay').toBe(1);
  return root.firstElementChild as HTMLElement;
}

function describeOverlay(overlay: HTMLElement): EndScreenMarkup {
  return {
    overlayClass: overlay.className,
    role: overlay.getAttribute('role') ?? '',
    children: Array.from(overlay.children).map((el) => {
      const action = (el as HTMLElement).dataset.action;
      return {
        tag: el.tagName.toLowerCase(),
        className: el.className,
        text: el.textContent ?? '',
        ...(action ? { action } : {}),
      };
    }),
  };
}

describe('end-screen markup used by the Playwright menu-fit test matches the real ScreenController', () => {
  it('Game Over (Android copy): same overlay class/role and child tag/class/action/text sequence', () => {
    expect(describeOverlay(renderReal('GAMEOVER'))).toEqual(GAME_OVER_MARKUP);
  });

  it('Game Complete: same overlay class/role and child tag/class/text sequence', () => {
    expect(describeOverlay(renderReal('VICTORY'))).toEqual(GAME_COMPLETE_MARKUP);
  });
});
