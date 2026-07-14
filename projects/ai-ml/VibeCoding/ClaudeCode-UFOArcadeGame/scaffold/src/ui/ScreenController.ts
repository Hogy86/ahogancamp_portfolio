// Implements PRD §F6 (pause overlay + options), §F6 AC9 (blocked-quit fallback
// text), §F6 AC10 (keyboard-navigable menu, visible non-color-only selection),
// §F6 AC11 (Restart Game confirmation guard), §F8 AC4 (Game Over screen), §F19
// (v2: "Game Complete" celebration screen replaces the v1 static Victory screen),
// §F9 AC1 (Vanguard vs Sentinels premise readable with no narrative).
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
import type { World } from '../core/types';

export class ScreenController {
  constructor(private readonly root: HTMLElement) {}

  render(world: World): void {
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

  private renderTitle(world: World): void {
    const overlay = createElement('div', 'screen-overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Title screen');
    overlay.append(
      createElement('h1', undefined, 'VANGUARD vs. SENTINELS'),
      createElement('p', undefined, 'Shield Invaders'),
    );

    if (world.quitBlockedMessageActive) {
      // F6 AC9: explicit visible text so Quit doesn't read as broken.
      const message = createElement('p', undefined, 'Run ended — you may now close this tab.');
      message.style.color = '#ffd873';
      overlay.append(message);
    }

    overlay.append(createElement('p', undefined, 'Press Enter to start'));
    overlay.append(
      createElement(
        'p',
        undefined,
        '← → move · Space throw · Esc pause · Up/Down + Enter to navigate menus',
      ),
    );
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
        createElement('p', undefined, 'Press Enter to confirm, or Esc to cancel.'),
      );
      overlay.append(confirmBox);
      this.root.append(overlay);
      return;
    }

    const list = createElement('ul', 'menu-list');
    PAUSE_MENU_OPTIONS.forEach((option, index) => {
      const item = createElement('li', 'menu-item', option);
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
      createElement('p', undefined, `Reached Level ${world.level}`),
      createElement('p', undefined, 'Press Enter to start a new run'),
    );
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
      createElement('p', undefined, 'The Sentinel forces have been defeated.'),
      createElement('p', undefined, `Final Score: ${world.score}`),
    );
    this.root.append(overlay);
  }
}
