// Implements docs/mobile/architecture/mobile-architecture.md §8.6/§8.7 (M8, M11.4a).
// Android-only shell overlays: Help (first-launch + reopenable), Settings (Swap
// controls + Privacy policy entry), Privacy (bundled sandboxed iframe), and
// RotatePrompt (M2.10). None of these are a game state or a PlatformCopy string -
// the game state stays TITLE throughout (Amendment A1). Built with src/ui/dom.ts
// helpers (`textContent` only) - binding constraint L4b: no innerHTML anywhere here.

import { setText, createElement } from '../../ui/dom';
import { loadSettings, saveSettings, type AndroidSettings } from './settings';

export type ShellOverlayKind = 'help' | 'settings' | 'privacy';

export class AndroidOverlays {
  private readonly stack: ShellOverlayKind[] = [];
  private settings: AndroidSettings;
  private readonly rotatePrompt: HTMLElement;
  private readonly helpOverlay: HTMLElement;
  private readonly settingsOverlay: HTMLElement;
  private readonly swapItem: HTMLElement;
  private readonly privacyMenuItem: HTMLElement;
  private readonly privacyOverlay: HTMLElement;
  private privacyFrame: HTMLIFrameElement | null = null;

  constructor(
    private readonly root: HTMLElement,
    // code-review-round2 H1: the reason Help closed matters to the caller (only "Got
    // it" should start a run when Help was opened from the title's Start tap) - passing
    // it here, rather than making the caller guess from its own stale flag, is what
    // lets AndroidPlatform reset that flag on every OTHER way Help can close (back,
    // Esc, a tap outside via `overlay-close`).
    private readonly onHelpDismissed: (reason: 'confirm' | 'closed') => void,
    private readonly onSwapControlsChanged: (swap: boolean) => void,
  ) {
    this.settings = loadSettings();

    this.rotatePrompt = createElement('div', 'screen-overlay rotate-prompt');
    this.rotatePrompt.append(
      createElement('p', undefined, 'Rotate your device or enlarge the window to play.'),
    );

    this.helpOverlay = createElement('div', 'screen-overlay');
    this.helpOverlay.setAttribute('role', 'dialog');
    this.helpOverlay.setAttribute('aria-label', 'How to play');
    const gotIt = createElement('button', 'menu-item', 'Got it');
    gotIt.dataset.action = 'help-dismiss';
    this.helpOverlay.append(
      createElement('h1', undefined, 'How to play'),
      createElement(
        'p',
        undefined,
        // code-review-round3 L2: copy matches the actual on-screen button glyphs
        // (TouchControls.ts: '<', '>', 'THROW', 'II'), not the pictographic Unicode
        // set those buttons were changed away from (round 3, same review) because it
        // rendered as nothing on this WebView.
        '< > Move · THROW (one shield at a time — catch it on the rebound for +1 life) · II Pause',
      ),
      gotIt,
    );

    this.settingsOverlay = createElement('div', 'screen-overlay');
    this.settingsOverlay.setAttribute('role', 'dialog');
    this.settingsOverlay.setAttribute('aria-label', 'Settings');
    this.swapItem = createElement('button', 'menu-item');
    this.swapItem.dataset.action = 'settings-swap';
    this.privacyMenuItem = createElement('button', 'menu-item', 'Privacy policy');
    this.privacyMenuItem.dataset.action = 'privacy';
    const settingsClose = createElement('button', 'menu-item', 'Close');
    settingsClose.dataset.action = 'overlay-close';
    this.settingsOverlay.append(
      createElement('h1', undefined, 'Settings'),
      this.swapItem,
      this.privacyMenuItem,
      settingsClose,
    );
    this.renderSwapItem();

    // §8.7: the Close button is at the TOP, on the THROW-side edge, inside the insets.
    // code-review-round2 M1: `h1 { flex: 1 }` consumes all the header row's leftover
    // space, so `justify-content` on `.privacy-header` never gets a chance to act -
    // the DOM order alone decides which side Close lands on. Appending Close AFTER the
    // heading puts it last in source order, which is the row's trailing (right) edge
    // by default - the THROW-side edge, since THROW sits on the right when controls are
    // not swapped (layout.ts). `.shell-overlays--swapped`'s `row-reverse` then mirrors
    // it to the left, matching THROW's swapped position.
    this.privacyOverlay = createElement('div', 'screen-overlay privacy-overlay');
    this.privacyOverlay.setAttribute('role', 'dialog');
    this.privacyOverlay.setAttribute('aria-modal', 'true');
    this.privacyOverlay.setAttribute('aria-labelledby', 'privacy-heading');
    const privacyClose = createElement('button', 'menu-item privacy-close', 'Close');
    privacyClose.dataset.action = 'overlay-close';
    const privacyHeading = createElement('h1', undefined, 'Privacy policy');
    privacyHeading.id = 'privacy-heading';
    const privacyHeader = createElement('div', 'privacy-header');
    privacyHeader.append(privacyHeading, privacyClose);
    this.privacyOverlay.append(privacyHeader);

    this.root.append(this.rotatePrompt, this.helpOverlay, this.settingsOverlay, this.privacyOverlay);
    this.hideAll();
    this.rotatePrompt.classList.add('hidden');
    this.renderSwapSide();

    this.root.addEventListener('click', (event) => this.handleClick(event));
    // M9: Esc on a hardware keyboard closes the topmost shell overlay, the same as
    // back (§8.3/§8.7); while any shell overlay is open, no whitelisted game key may
    // reach KeyboardInputSource - otherwise a hardware Enter would start a run
    // underneath an open Help/Settings/Privacy overlay (dispatchStateInput's TITLE
    // case has no idea an overlay is covering the screen). Capture-phase on
    // `document` runs before KeyboardInputSource's window (bubble-phase-relative)
    // listener, regardless of construction order.
    document.addEventListener(
      'keydown',
      (event) => {
        if (this.stack.length === 0) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          this.closeTopOverlay();
        }
        event.stopPropagation();
      },
      true,
    );
  }

  get helpSeen(): boolean {
    return this.settings.helpSeen;
  }

  get swapControls(): boolean {
    return this.settings.swapControls;
  }

  setRotatePromptVisible(visible: boolean): void {
    this.rotatePrompt.classList.toggle('hidden', !visible);
  }

  isRotatePromptShowing(): boolean {
    return !this.rotatePrompt.classList.contains('hidden');
  }

  showHelp(): void {
    this.push('help');
  }

  showSettings(): void {
    this.push('settings');
  }

  /** §8.3 rule 1: closes the topmost overlay, returning to where it was opened.
   * Returns false (does nothing) if no overlay is open. */
  closeTopOverlay(): boolean {
    const top = this.stack.pop();
    if (!top) return false;
    this.renderStack();
    // §8.3 A1: closing Privacy returns focus to the "Privacy policy" item it was
    // opened from, rather than leaving focus on the (now hidden) Close button.
    if (top === 'privacy') this.privacyMenuItem.focus();
    // H1: Help closing via back/Esc/overlay-close is NOT "Got it" - tell the caller so
    // it can clear any "started from the title's Start tap" bookkeeping. Without this,
    // Start → Help → close (not "Got it") → reopen Help → "Got it" would incorrectly
    // start a run, since the caller's flag would still read true from the first open.
    if (top === 'help') this.onHelpDismissed('closed');
    return true;
  }

  private push(kind: ShellOverlayKind): void {
    this.stack.push(kind);
    this.renderStack();
  }

  private hideAll(): void {
    this.helpOverlay.classList.add('hidden');
    this.settingsOverlay.classList.add('hidden');
    this.privacyOverlay.classList.add('hidden');
  }

  private renderSwapItem(): void {
    setText(this.swapItem, `Swap controls: ${this.settings.swapControls ? 'On' : 'Off'}`);
  }

  /** §8.7: the privacy panel's Close button stays on the THROW-side edge, mirroring
   * with "Swap controls" like every other touch control (C2). */
  private renderSwapSide(): void {
    this.root.classList.toggle('shell-overlays--swapped', this.settings.swapControls);
  }

  private renderStack(): void {
    this.hideAll();
    // Privacy content (the iframe) is created on open and removed on close (§8.7) -
    // nothing loads at startup, so M10.3 cold start is unaffected.
    if (!this.stack.includes('privacy') && this.privacyFrame) {
      this.privacyFrame.remove();
      this.privacyFrame = null;
    }
    const top = this.stack[this.stack.length - 1];
    if (top === 'help') this.helpOverlay.classList.remove('hidden');
    if (top === 'settings') this.settingsOverlay.classList.remove('hidden');
    if (top === 'privacy') {
      this.privacyOverlay.classList.remove('hidden');
      if (!this.privacyFrame) {
        this.privacyFrame = createElement('iframe') as HTMLIFrameElement;
        this.privacyFrame.src = '/privacy.html';
        this.privacyFrame.setAttribute('sandbox', ''); // empty: no scripts, no same-origin bridge access
        this.privacyFrame.setAttribute('referrerpolicy', 'no-referrer');
        this.privacyFrame.title = 'Privacy policy';
        this.privacyFrame.className = 'privacy-frame';
        this.privacyOverlay.append(this.privacyFrame);
      }
    }
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    const action = target?.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (!action) return;

    if (action === 'help-dismiss') {
      this.settings = { ...this.settings, helpSeen: true };
      saveSettings(this.settings);
      this.stack.pop();
      this.renderStack();
      this.onHelpDismissed('confirm');
      return;
    }
    if (action === 'settings-swap') {
      this.settings = { ...this.settings, swapControls: !this.settings.swapControls };
      saveSettings(this.settings);
      this.renderSwapItem();
      this.renderSwapSide();
      this.onSwapControlsChanged(this.settings.swapControls);
      return;
    }
    if (action === 'privacy') {
      this.push('privacy');
      return;
    }
    if (action === 'overlay-close') {
      this.closeTopOverlay();
    }
  }
}
