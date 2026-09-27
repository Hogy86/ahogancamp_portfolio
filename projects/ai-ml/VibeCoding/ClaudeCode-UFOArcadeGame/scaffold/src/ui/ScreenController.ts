// Implements PRD §F6 (pause overlay + options), §F6 AC9 (blocked-quit fallback
// text), §F6 AC10 (keyboard-navigable menu, visible non-color-only selection),
// §F6 AC11 (Restart Game confirmation guard), §F8 AC4 (Game Over screen), §F19
// (v2: "Game Complete" celebration screen replaces the v1 static Victory screen),
// §F9 AC1 (Shield vs Robots premise readable with no narrative, F22 rename).
// docs/PRD-addendum-v3.md F20 AC1-AC3/AC13-AC14: "Best: N" / "New best!" on the
// title and end screens, from PlatformCopy-independent shared World fields.
// docs/mobile/architecture/mobile-architecture.md §5.4: title/menu action text and
// items come from PlatformCopy on Android; on the web PlatformCopy is undefined and
// today's exact copy/behavior is unchanged (M3.12, OQ-M10 (a)). Renders only when its
// view key changes (state, selected index, confirm flag, score, best, new-best,
// quit-fallback) - required so a tap that starts on one element and ends on its
// per-frame replacement still produces a click (§5.4), and a minor perf win on web too.
// All text is written via textContent only (security binding constraint #2 -
// see ui/dom.ts). ADR-0002: this module only ever renders what GameStateMachine's
// dispatch table already decided - it has no independent state-transition logic.
//
// Accessibility (design-review-round3.md N3): #overlay-root itself has no
// aria-live/role in index.html, so each screen sets its own role/aria-live
// here on the overlay element it creates, matching the semantics of that
// screen: Game Over/Victory are outcome announcements (role="alert",
// aria-live="assertive" - fires immediately, no user action needed to reach
// them), while Title/Pause are navigable menus the player interacts with
// (role="dialog" - present but not force-interrupting). Attributes only;
// no change to the textContent-only DOM-writing contract.

import { clearChildren, createElement } from './dom';
import { PAUSE_MENU_OPTIONS } from '../core/GameStateMachine';
import type { PlatformCopy } from '../platform/Platform';
import type { World } from '../core/types';

export class ScreenController {
  private lastViewKey: string | null = null;

  constructor(
    private readonly root: HTMLElement,
    /** Undefined on the web build (today's exact copy/behavior, M3.12). Android
     * supplies its touch wording (mobile-architecture.md §5.4/§4). */
    private readonly copy?: PlatformCopy,
  ) {}

  render(world: World): void {
    const key = this.computeViewKey(world);
    if (key === this.lastViewKey) return;
    this.lastViewKey = key;

    clearChildren(this.root);

    switch (world.state) {
      case 'TITLE':
        this.renderTitle(world);
        return;
      case 'PAUSED':
        this.renderPause(world);
        return;
      case 'GAMEOVER':
        this.renderGameOver(world);
        return;
      case 'VICTORY':
        this.renderVictory(world);
        return;
      case 'PLAYING':
        return; // No overlay during active play.
    }
  }

  /** Only these fields ever change what this class draws (mobile-architecture.md §5.4). */
  private computeViewKey(world: World): string {
    return [
      world.state,
      world.pauseMenuSelectedIndex,
      world.restartGameConfirmPending,
      world.score,
      world.bestScore,
      world.newBestThisRun,
      world.quitBlockedMessageActive,
      world.level,
    ].join('|');
  }

  private appendBestLine(overlay: HTMLElement, world: World): void {
    // F20 AC1/AC2: "Best: N" on the title screen and both end screens.
    overlay.append(createElement('p', 'best-score', `Best: ${world.bestScore}`));
    if (world.newBestThisRun) {
      // F20 AC3/AC13: shown as text, not by color alone.
      overlay.append(createElement('p', 'new-best', 'New best!'));
    }
  }

  private renderTitle(world: World): void {
    const overlay = createElement('div', 'screen-overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Title screen');
    // F22 AC1/AC3 (docs/PRD-addendum-v4.md): renamed product, "Shield Invaders"
    // subtitle dropped (Q-v4-2 default).
    overlay.append(createElement('h1', undefined, 'Shield vs Robots'));
    this.appendBestLine(overlay, world);

    if (world.quitBlockedMessageActive) {
      // F6 AC9: explicit visible text so Quit doesn't read as broken.
      const message = createElement('p', undefined, 'Run ended — you may now close this tab.');
      message.style.color = '#ffd873';
      overlay.append(message);
    }

    if (this.copy) {
      // Android: a real tappable Start button plus title's extra actions (M8.2, M6.2).
      const start = createElement('button', 'menu-item', this.copy.titleStartLabel);
      start.dataset.action = 'start';
      overlay.append(start);
      const list = createElement('ul', 'menu-list');
      this.copy.titleExtraActions.forEach((action) => {
        const label = action === 'help' ? 'How to play' : action === 'settings' ? 'Settings' : 'Quit';
        // L4: a real, focusable `<button>` (not `<li>`) for accessibility.
        const item = createElement('button', 'menu-item', label);
        item.dataset.action = action;
        list.append(item);
      });
      overlay.append(list);
    } else {
      overlay.append(createElement('p', undefined, 'Press Enter to start'));
    }
    if (this.copy?.menuHint || !this.copy) {
      overlay.append(
        createElement(
          'p',
          undefined,
          this.copy?.menuHint ?? '← → move · Space throw · Esc pause · Up/Down + Enter to navigate menus',
        ),
      );
    }
    this.root.append(overlay);
  }

  private renderPause(world: World): void {
    const overlay = createElement('div', 'screen-overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Paused');
    overlay.append(createElement('h1', undefined, 'PAUSED'));

    if (world.restartGameConfirmPending) {
      // F6 AC11: destructive-action confirmation guard.
      const confirmBox = createElement('div', 'confirm-box');
      confirmBox.append(
        createElement(
          'p',
          undefined,
          'Restart Game will discard all progress, score, and your permanent power multiplier.',
        ),
      );
      // L4: the keyboard hint comes from PlatformCopy (web: the literal Enter/Esc
      // text; Android: null, since Android has real Confirm/Cancel buttons and no
      // keyboard-hint concept - same `this.copy?.x || !this.copy` pattern as menuHint.
      if (this.copy?.confirmHint || !this.copy) {
        confirmBox.append(
          createElement('p', undefined, this.copy?.confirmHint ?? 'Press Enter to confirm, or Esc to cancel.'),
        );
      }
      if (this.copy) {
        const confirmBtn = createElement('button', 'menu-item', 'Confirm');
        confirmBtn.dataset.action = 'confirm';
        const cancelBtn = createElement('button', 'menu-item', 'Cancel');
        cancelBtn.dataset.action = 'cancel';
        confirmBox.append(confirmBtn, cancelBtn);
      }
      overlay.append(confirmBox);
      this.root.append(overlay);
      return;
    }

    const list = createElement('ul', 'menu-list');
    PAUSE_MENU_OPTIONS.forEach((option, index) => {
      // L4: Android menu rows are real, focusable `<button>`s (matching Title/Game
      // Over's own menu-item buttons), not `<li>` - the web build has no PlatformCopy
      // and keeps its existing `<li>` rendering byte-identical (M3.12).
      const item = this.copy
        ? (createElement('button', 'menu-item', option) as HTMLButtonElement)
        : createElement('li', 'menu-item', option);
      item.dataset.action = `pause-option:${index}`;
      if (index === world.pauseMenuSelectedIndex) item.classList.add('selected');
      list.append(item);
    });
    overlay.append(list);
    this.root.append(overlay);
  }

  private renderGameOver(world: World): void {
    const overlay = createElement('div', 'screen-overlay');
    overlay.setAttribute('role', 'alert');
    overlay.setAttribute('aria-live', 'assertive');
    // F8 AC8: exactly one unified Game Over message regardless of which trigger fired.
    overlay.append(
      createElement('h1', undefined, 'GAME OVER'),
      createElement('p', undefined, `Final Score: ${world.score}`),
    );
    this.appendBestLine(overlay, world);
    overlay.append(createElement('p', undefined, `Reached Level ${world.level}`));
    if (this.copy) {
      const playAgain = createElement('button', 'menu-item', this.copy.gameOverActionLabel);
      playAgain.dataset.action = 'play-again';
      overlay.append(playAgain);
    } else {
      overlay.append(createElement('p', undefined, 'Press Enter to start a new run'));
    }
    this.root.append(overlay);
  }

  /** F19: the "Game Complete" celebration replaces v1's static Victory screen. The heading
   * and score are DOM-drawn text (this class's existing end-screen pattern); the fireworks
   * are canvas-drawn (CanvasRenderer.drawVictoryFireworks) since there are no entities left
   * to compose them around. No "Press Enter..." prompt - the sequence auto-returns to TITLE
   * with no input required (F19 AC5); GameStateMachine's VICTORY case separately supports an
   * optional key-press hold (F19 AC9), which needs no visible prompt to remain valid.
   *
   * design-review-v2-round4.md FAIL-1: unlike Title/Pause/GameOver, this is the one screen
   * where canvas content behind the overlay (the fireworks, F19 AC4) is itself a requirement,
   * so it cannot reuse the opaque `.screen-overlay` background - the
   * `screen-overlay--transparent-bg` modifier removes the wash while a text-shadow (in
   * style.css) keeps the heading/score legible against the animated fireworks behind them. */
  private renderVictory(world: World): void {
    const overlay = createElement('div', 'screen-overlay screen-overlay--transparent-bg');
    overlay.setAttribute('role', 'alert');
    overlay.setAttribute('aria-live', 'assertive');
    overlay.append(
      createElement('h1', undefined, 'GAME COMPLETE'),
      // F22 AC4 (docs/PRD-addendum-v4.md): "Sentinel" -> "robot" in all in-play/end-screen text.
      createElement('p', undefined, 'The robot forces have been defeated.'),
      createElement('p', undefined, `Final Score: ${world.score}`),
    );
    this.appendBestLine(overlay, world);
    this.root.append(overlay);
  }
}
