// Implements docs/mobile/architecture/mobile-architecture.md §5.2/§5.3 (M-ADR-0003):
// the on-screen left/right arrows, THROW and PAUSE controls. PRD-mobile M3.1-M3.11.
// - Movement: one DOM element (#move-zone) covering ◀, the gap, and ▶; pointer capture
//   keeps a finger tracked wherever it slides (§5.2).
// - Throw: a latch cleared only once at least one simulation step has run this frame,
//   so a tap shorter than one frame still reaches exactly one step (§5.3, F16 AC3).
// - Stray gestures (M3.7): handled by android.css (touch-action: none etc.) and
//   the document-level `contextmenu` preventDefault in AndroidPlatform.

import { createElement } from '../../ui/dom';
import type { InputSource } from '../../core/InputManager';
import { classifyMovePointer, type MoveDirection, type MoveZoneRects } from './moveZone';
import { CONTROL_GAP_DP, type Layout } from './layout';
import { createArrowGlyph, createPauseGlyph, createWordGlyph, setWordGlyph } from './glyphs';

export class TouchInputSource implements InputSource {
  // §5.1 step 4 / L2: this reports left/right INDEPENDENTLY - InputManager is the only
  // place the opposing-cancel is applied (once, across every source). Collapsing both
  // to 'none' here would double-apply the cancel and is not what §5.2 step 4 specifies.
  private left = false;
  private right = false;
  private readonly throwPointers = new Set<number>();
  private throwLatch = false;

  sample(): { left: boolean; right: boolean; throwHeld: boolean } {
    return {
      left: this.left,
      right: this.right,
      throwHeld: this.throwPointers.size > 0 || this.throwLatch,
    };
  }

  /** §5.3: the latch clears only once this frame actually advanced the simulation,
   * so a tap shorter than one rendered frame still reaches exactly one fixed step. */
  consumeEdges(simStepsRun: number): void {
    if (simStepsRun > 0) this.throwLatch = false;
  }

  setDirections(left: boolean, right: boolean): void {
    this.left = left;
    this.right = right;
  }

  addThrowPointer(id: number): void {
    this.throwPointers.add(id);
    this.throwLatch = true;
  }

  removeThrowPointer(id: number): void {
    this.throwPointers.delete(id);
  }

  /** M8: forcibly drops every tracked THROW pointer and the latch - used when the
   * touch layer hides or the app leaves the foreground, so a `pointerup` lost during
   * that transition can never leave THROW stuck held. */
  clearThrow(): void {
    this.throwPointers.clear();
    this.throwLatch = false;
  }

  get isThrowReady(): boolean {
    return this.throwPointers.size === 0 && !this.throwLatch;
  }
}

interface TrackedMovePointer {
  lastDir: MoveDirection | null;
}

// M3: the buttons carry `aria-label`s already, but a sighted player needs a visible
// glyph to tell left from right from THROW from PAUSE - empty bordered squares (round-2
// M3) don't. The glyph lives in a separate `aria-hidden` span so screen readers keep
// using the button's `aria-label`, not this decorative content, as the accessible name.
//
// code-review-round3 (real-device evidence, svr_api36_pixel7, `-gpu host`): the
// pictographic Unicode glyphs tried first rendered as nothing on this AVD's WebView, so
// text glyphs were switched to ASCII; design-review-round3 F2 then found bare ASCII
// punctuation (`<`, `>`, `II`) unreadable as icons. The arrows and pause bars are now
// inline SVG shapes (glyphs.ts, no font involved); THROW keeps its word, drawn as fixed-width SVG text, and the
// recharging state is the word WAIT (`...` was ambiguous).
const THROW_GLYPH_READY = 'THROW';
const THROW_GLYPH_NOT_READY = 'WAIT'; // shield is out, recharging - a different glyph, not just a dimmer one (NFR-9)

function appendGlyph(button: HTMLElement, glyph: SVGSVGElement): HTMLElement {
  const span = createElement('span', 'touch-glyph');
  span.append(glyph);
  span.setAttribute('aria-hidden', 'true');
  button.append(span);
  return span;
}

export class TouchControls {
  readonly input = new TouchInputSource();
  readonly root: HTMLElement;
  private readonly moveZone: HTMLElement;
  private readonly leftButton: HTMLElement;
  private readonly rightButton: HTMLElement;
  private readonly throwButton: HTMLButtonElement;
  private readonly throwWord: SVGSVGElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly movePointers = new Map<number, TrackedMovePointer>();

  constructor(
    private readonly onPauseTap: () => void,
    private readonly getShieldInFlight: () => boolean,
  ) {
    this.root = createElement('div', 'touch-layer');

    this.moveZone = createElement('div', 'move-zone');
    this.moveZone.setAttribute('aria-hidden', 'true'); // decorative container; buttons carry labels
    this.leftButton = createElement('button', 'touch-button touch-button--left');
    this.leftButton.setAttribute('aria-label', 'Move left');
    appendGlyph(this.leftButton, createArrowGlyph('left'));
    this.rightButton = createElement('button', 'touch-button touch-button--right');
    this.rightButton.setAttribute('aria-label', 'Move right');
    appendGlyph(this.rightButton, createArrowGlyph('right'));
    this.moveZone.append(this.leftButton, this.rightButton);

    this.throwButton = createElement(
      'button',
      'touch-button touch-button--throw',
    ) as HTMLButtonElement;
    this.throwButton.setAttribute('aria-label', 'Throw shield');
    this.throwWord = createWordGlyph(THROW_GLYPH_READY);
    appendGlyph(this.throwButton, this.throwWord);

    this.pauseButton = createElement(
      'button',
      'touch-button touch-button--pause',
    ) as HTMLButtonElement;
    this.pauseButton.setAttribute('aria-label', 'Pause');
    appendGlyph(this.pauseButton, createPauseGlyph());

    this.root.append(this.moveZone, this.throwButton, this.pauseButton);

    this.wireMoveZone();
    this.wireThrow();
    this.wirePause();
  }

  /** Applies computed absolute pixel positions (M2.4/M2.12, C1/C2) - called by
   * screenFit on every layout pass (resize, insets change, swap toggle). Every
   * coordinate `layout` returns is already `#safe-layer`-relative (insets consumed
   * exactly once, by `#safe-layer` itself) and already mirrored for swap, so this
   * method sets `left`/`top` directly instead of relying on side-dependent CSS. */
  applyLayout(layout: Layout): void {
    this.root.style.setProperty('--vvs-button-size', `${layout.buttonSize}px`);

    this.moveZone.style.left = `${layout.leftButtonX}px`;
    this.moveZone.style.top = `${layout.controlRowY}px`;
    this.moveZone.style.width = `${2 * layout.buttonSize + CONTROL_GAP_DP}px`;
    this.moveZone.style.height = `${layout.buttonSize}px`;

    this.throwButton.style.left = `${layout.throwButtonX}px`;
    this.throwButton.style.top = `${layout.controlRowY}px`;

    this.pauseButton.style.left = `${layout.pauseButtonX}px`;
    this.pauseButton.style.top = `${layout.pauseButtonY}px`;
  }

  /** M3.9: visible only during active play, the F18 intro (visible but inert), and the
   * F12 boss warning; hidden on title/pause/end screens. M8: hiding also clears every
   * tracked pointer/latch (`clearAllPointers`) so a THROW/move pointer lost while the
   * layer was hidden (e.g. the pause menu opened mid-touch) can never stick. */
  setVisible(visible: boolean): void {
    this.root.classList.toggle('touch-layer--hidden', !visible);
    if (!visible) this.clearAllPointers();
  }

  /** M8: called on hide (above) and on lifecycle leave (background/interruption) so a
   * `pointerup`/`lostpointercapture` missed while the app was backgrounded never leaves
   * THROW latched or a move direction stuck. */
  clearAllPointers(): void {
    this.movePointers.clear();
    this.recomputeSharedDirection();
    this.input.clearThrow();
  }

  /** M3.5: dimmed + icon/shape change (not color alone, NFR-9) while a shield is in flight. */
  syncNotReadyState(): void {
    const notReady = this.getShieldInFlight();
    this.throwButton.classList.toggle('not-ready', notReady);
    setWordGlyph(this.throwWord, notReady ? THROW_GLYPH_NOT_READY : THROW_GLYPH_READY);
  }

  private currentRects(): MoveZoneRects {
    const left = this.leftButton.getBoundingClientRect();
    const right = this.rightButton.getBoundingClientRect();
    return {
      left: { left: left.left, right: left.right, top: left.top, bottom: left.bottom },
      right: { left: right.left, right: right.right, top: right.top, bottom: right.bottom },
      gap: {
        left: left.right,
        right: right.left,
        top: Math.min(left.top, right.top),
        bottom: Math.max(left.bottom, right.bottom),
      },
    };
  }

  private reclassify(pointerId: number, x: number, y: number, isFreshTouch: boolean): void {
    const tracked = this.movePointers.get(pointerId);
    if (!tracked) return;
    const result = classifyMovePointer({ x, y }, this.currentRects(), tracked.lastDir, {
      isFreshTouch,
    });
    // `lastDir` alone is enough to drive the shared direction below: classifyMovePointer
    // sets it to the live direction on ◀/▶, leaves it unchanged (carrying the direction
    // forward) in the gap, and clears it to null everywhere else (§5.2).
    tracked.lastDir = result.lastDir;
    this.recomputeSharedDirection();
  }

  /** §5.1/§5.2 step 4 (L2): two fingers on ◀ and ▶ must cancel via InputManager's
   * merge, not by overwriting each other here - so this reports the union of tracked
   * directions independently ("left" if any tracked pointer is currently on ◀, "right"
   * if any is on ▶) and lets InputManager apply the single opposing-cancel. */
  private recomputeSharedDirection(): void {
    let anyLeft = false;
    let anyRight = false;
    for (const tracked of this.movePointers.values()) {
      if (tracked.lastDir === 'left') anyLeft = true;
      if (tracked.lastDir === 'right') anyRight = true;
    }
    this.input.setDirections(anyLeft, anyRight);
  }

  private wireMoveZone(): void {
    this.moveZone.addEventListener('pointerdown', (event: PointerEvent) => {
      this.moveZone.setPointerCapture(event.pointerId);
      this.movePointers.set(event.pointerId, { lastDir: null });
      this.reclassify(event.pointerId, event.clientX, event.clientY, true);
    });
    this.moveZone.addEventListener('pointermove', (event: PointerEvent) => {
      if (!this.movePointers.has(event.pointerId)) return;
      this.reclassify(event.pointerId, event.clientX, event.clientY, false);
    });
    const release = (event: PointerEvent): void => {
      this.movePointers.delete(event.pointerId);
      this.recomputeSharedDirection();
    };
    this.moveZone.addEventListener('pointerup', release);
    this.moveZone.addEventListener('pointercancel', release);
    this.moveZone.addEventListener('lostpointercapture', release);
  }

  /** M8: THROW captures its pointer (like `#move-zone` does) so a finger sliding off
   * the button's shrinking hit-box still delivers `pointerup` here rather than
   * silently going nowhere, and `lostpointercapture` is handled explicitly (capture
   * can be lost without an intervening `pointerup`, e.g. another element stealing it)
   * so the latch/pointer set can never stick THROW held. */
  private wireThrow(): void {
    this.throwButton.addEventListener('pointerdown', (event: PointerEvent) => {
      this.throwButton.setPointerCapture(event.pointerId);
      this.input.addThrowPointer(event.pointerId);
    });
    const release = (event: PointerEvent): void => this.input.removeThrowPointer(event.pointerId);
    this.throwButton.addEventListener('pointerup', release);
    this.throwButton.addEventListener('pointercancel', release);
    this.throwButton.addEventListener('lostpointercapture', release);
  }

  private wirePause(): void {
    this.pauseButton.addEventListener('click', () => this.onPauseTap());
  }
}
