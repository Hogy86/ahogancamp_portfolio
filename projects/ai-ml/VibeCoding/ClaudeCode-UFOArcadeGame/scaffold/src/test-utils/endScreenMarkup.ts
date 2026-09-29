// Test-only (not imported by the game, so never bundled): the exact element structure
// `ScreenController.renderGameOver` / `renderVictory` write, for the Android (PlatformCopy
// present) build. Two consumers keep it honest:
//   - src/ui/endScreenMarkup.test.ts renders the REAL ScreenController and asserts it
//     produces exactly this tag/class/attribute/text sequence;
//   - tests/mobile-e2e/menu-insets.spec.ts injects exactly this sequence into #overlay-root
//     to fit-check the end screens in a browser (a run takes about a minute to end).
// If a renderer changes, the jsdom test fails and points here (code-review-round13 L2).

export interface EndScreenNode {
  tag: string;
  className: string;
  action?: string;
  text: string;
}

export interface EndScreenMarkup {
  overlayClass: string;
  role: string;
  children: EndScreenNode[];
}

const n = (tag: string, text: string, className = '', action?: string): EndScreenNode => ({
  tag,
  className,
  text,
  ...(action ? { action } : {}),
});

/** World used by both consumers: score 12345, best 12345, new best, level 12. */
export const END_SCREEN_WORLD = { score: 12345, bestScore: 12345, level: 12, newBestThisRun: true } as const;

export const GAME_OVER_MARKUP: EndScreenMarkup = {
  overlayClass: 'screen-overlay',
  role: 'alert',
  children: [
    n('h1', 'GAME OVER'),
    n('p', 'Final Score: 12345'),
    n('p', 'Best: 12345', 'best-score'),
    n('p', 'New best!', 'new-best'),
    n('p', 'Reached Level 12'),
    n('button', 'Play again', 'menu-item', 'play-again'),
  ],
};

export const GAME_COMPLETE_MARKUP: EndScreenMarkup = {
  overlayClass: 'screen-overlay screen-overlay--transparent-bg',
  role: 'alert',
  children: [
    n('h1', 'GAME COMPLETE'),
    n('p', 'The robot forces have been defeated.'),
    n('p', 'Final Score: 12345'),
    n('p', 'Best: 12345', 'best-score'),
    n('p', 'New best!', 'new-best'),
  ],
};
