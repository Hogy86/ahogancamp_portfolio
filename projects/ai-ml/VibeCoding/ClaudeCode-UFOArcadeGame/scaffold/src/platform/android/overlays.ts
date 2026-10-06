// Implements docs/mobile/architecture/mobile-architecture.md §8.6/§8.7/§6.2.1 (M8,
// M11.4a, M2.10/M2.10a). Android-only shell overlays: Help (first-launch +
// reopenable), Settings (Swap controls + Privacy policy entry), Privacy (bundled
// sandboxed iframe), and RotatePrompt (M2.10/M2.10a, Amendment A11: one component,
// two possible messages - portrait or too-small). None of these are a game state or a
// PlatformCopy string - the game state stays TITLE throughout (Amendment A1). Built
// with src/ui/dom.ts helpers (`textContent` only) - binding constraint L4b: no
// innerHTML anywhere here. RotatePrompt is a fixed, full-viewport, opaque cover
// (`.rotate-prompt`, android.css) stacked above every other layer, which blocks
// pointer hit-testing on everything underneath - but that alone does not stop an
// accessibility service from dispatching `click()` on a hidden control, which
// bypasses hit-testing. §6.2.1 behaviors 2-3 also require `#app-root` and the
// contents of `#safe-layer` to be set to `visibility: hidden` while the prompt
// shows (code-review-round8 R1); `ScreenFit.relayout()` does that, not this module.
// Amendment A12 behavior 4 (code-review-round8 I3): while the prompt shows, this
// module's capture-phase `keydown` listener blocks EVERY key (not just Escape) before
// the shell-overlay-stack check runs, and blurs a focused hidden control on entry -
// see `setWindowPromptKind` and the listener installed in the constructor.

import { setText, createElement } from '../../ui/dom';
import { createPowerUpHelpList } from '../../ui/powerUpGuide';
import { loadSettings, saveSettings, type AndroidSettings } from './settings';

export type ShellOverlayKind = 'help' | 'settings' | 'privacy';

/** §6.2.1 precedence: a portrait-shaped window always keeps M2.10's text, even when
 * it is also too small; every other too-small window gets M2.10a's text. */
const PORTRAIT_PROMPT_TEXT = 'Rotate your device or enlarge the window to play.';
const TOO_SMALL_PROMPT_TEXT = 'Make the window larger to play.';

export class AndroidOverlays {
  private readonly stack: ShellOverlayKind[] = [];
  private settings: AndroidSettings;
  private readonly rotatePrompt: HTMLElement;
  private readonly rotatePromptText: HTMLElement;
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

    // Not `.screen-overlay` (that class is `position: absolute`, sized relative to its
    // PARENT - fine for Help/Settings/Privacy inside the already-inset `#safe-layer`,
    // but RotatePrompt needs `position: fixed` against the real viewport, see
    // `rotatePromptElement` and android.css's own `.rotate-prompt` rule below).
    this.rotatePromptText = createElement('p', undefined, PORTRAIT_PROMPT_TEXT);
    this.rotatePrompt = createElement('div', 'rotate-prompt');
    this.rotatePrompt.append(this.rotatePromptText);

    this.helpOverlay = createElement('div', 'screen-overlay');
    this.helpOverlay.setAttribute('role', 'dialog');
    this.helpOverlay.setAttribute('aria-label', 'How to play');
    const gotIt = createElement('button', 'menu-item', 'Got it');
    gotIt.dataset.action = 'help-dismiss';
    this.helpOverlay.append(
      createElement('h1', undefined, 'How to play'),
      // design-review-round3 F3: three short stacked lines (no separators, so no symbol
      // is ever orphaned from its word on wrap), naming the hero (F22 AC6) and using
      // the words the buttons actually show.
      createElement('p', undefined, 'Left and right buttons: move ShieldMan'),
      createElement(
        'p',
        undefined,
        'THROW: throw your shield. One at a time. Catch it on the rebound for +1 life.',
      ),
      createElement('p', undefined, 'Pause button: pause the game'),
      // PRD addendum v7 F25 AC1/AC3: the four power-ups, each with its icon, label and one
      // sentence, between the control lines and "Got it".
      createPowerUpHelpList(),
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

    // §6.2.1 A11: `rotatePrompt` is NOT appended to `this.root` (`#shell-overlay-root`,
    // confined inside the inset-safe `#safe-layer`) like the other three overlays -
    // ScreenFit appends it directly to `<body>` instead (see `rotatePromptElement`
    // below), so its background can cover the true full viewport, edge to edge, which
    // Help/Settings/Privacy deliberately do NOT do.
    this.root.append(this.helpOverlay, this.settingsOverlay, this.privacyOverlay);
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
        // §6.2.1 Amendment A12 behavior 4 (code-review-round8 I3): checked FIRST, and
        // wins over the shell-overlay-stack check below - a hidden Settings/Help/
        // Privacy overlay underneath the prompt must not respond either. EVERY key is
        // blocked (not just Escape): `preventDefault()` also stops a focused hidden
        // `<button>` from being activated by Enter/Space, and Esc must not close a
        // hidden overlay (same order as back, §8.3 A11). `keyup` is deliberately NOT
        // touched here, so a key already held before the prompt appeared still
        // releases normally and never sticks.
        if (this.isRotatePromptShowing()) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
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

  /** ScreenFit appends this directly to `<body>` (a sibling of `#safe-layer`, never a
   * descendant of it - §6.2.1 A11) so its background covers the full viewport, insets
   * included - unlike Help/Settings/Privacy, which stay inside the inset-safe area. */
  get rotatePromptElement(): HTMLElement {
    return this.rotatePrompt;
  }

  /** §6.2.1: `null` hides the prompt; `'portrait'`/`'tooSmall'` shows it with the
   * matching message (M2.10/M2.10a). */
  setWindowPromptKind(kind: 'portrait' | 'tooSmall' | null): void {
    const entering = kind !== null && this.isRotatePromptShowing() === false;
    if (kind)
      setText(
        this.rotatePromptText,
        kind === 'portrait' ? PORTRAIT_PROMPT_TEXT : TOO_SMALL_PROMPT_TEXT,
      );
    this.rotatePrompt.classList.toggle('hidden', kind === null);
    // §6.2.1 Amendment A12 behavior 4 (I3 "Focus"): on ENTERING a prompt, blur any
    // element focused inside the now-hidden `#app-root`/`#safe-layer` (including the
    // privacy iframe) - otherwise a focused hidden button could still be activated by
    // a held/repeated key even with every `keydown` blocked at the document level
    // (some UAs deliver a focused control's default action before the capture-phase
    // listener above, e.g. via accessibility-service key dispatch).
    if (entering) {
      const active = document.activeElement as HTMLElement | null;
      if (active?.closest('#app-root, #safe-layer')) active.blur();
    }
  }

  isRotatePromptShowing(): boolean {
    return !this.rotatePrompt.classList.contains('hidden');
  }

  /** §8.3 Amendment A11: a read-only check (unlike `closeTopOverlay`, which pops the
   * stack) so `backButton.ts`'s order-resolution can ask "is one open" without
   * closing it - needed because RotatePrompt must now be checked, and win, before
   * this question is even asked. */
  hasOpenOverlay(): boolean {
    return this.stack.length > 0;
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
    // design-review-round3 F4: while a shell overlay (opaque) is open, the title menu
    // underneath is hidden outright, so no part of it can show around the panel.
    document.documentElement.classList.toggle('vvs-shell-overlay-open', this.stack.length > 0);
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
