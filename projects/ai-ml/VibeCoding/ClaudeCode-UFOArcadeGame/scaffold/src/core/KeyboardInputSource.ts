// Implements PRD §F1 AC5 (opposing keys cancel), §F2 (throw), §F6 AC1/AC8/AC10
// (Esc/menu nav), §F19 AC9 (v2: "any key" celebration-hold gesture), NFR-3 (input
// latency), NFR-5 (keyboard only). docs/mobile/architecture/mobile-architecture.md
// M-ADR-0003 (§5.1): this is today's keyboard logic, moved unchanged into its own
// `InputSource` so `InputManager` can merge it with `TouchInputSource` on Android.
// The keyboard's edge-triggered menu intents (escPressed, menu*Pressed, anyKeyPressed)
// are exposed only by this class - touch never fakes key presses (§5.1).

import type { InputSource } from './InputManager';

const WHITELISTED_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  ' ',
  'Spacebar',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'Enter',
]);

/**
 * Tracks held-key state and edge-triggered actions for a single tick. Call
 * `consumeEdges()` once per tick after reading edge-triggered fields so a single
 * physical key press cannot be double-counted across ticks.
 */
export class KeyboardInputSource implements InputSource {
  private readonly held = new Set<string>();
  private escEdge = false;
  private upEdge = false;
  private downEdge = false;
  private confirmEdge = false;
  private anyKeyEdge = false;

  constructor(private readonly target: Window = window) {
    this.target.addEventListener('keydown', this.handleKeyDown);
    this.target.addEventListener('keyup', this.handleKeyUp);
  }

  dispose(): void {
    this.target.removeEventListener('keydown', this.handleKeyDown);
    this.target.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!WHITELISTED_KEYS.has(event.key)) return;
    // Prevent page scroll on arrow/space while the game owns keyboard focus.
    event.preventDefault();

    const alreadyHeld = this.held.has(event.key);
    this.held.add(event.key);

    if (alreadyHeld) return; // edge triggers only fire on the initial press
    this.anyKeyEdge = true;
    if (event.key === 'Escape') this.escEdge = true;
    if (event.key === 'ArrowUp') this.upEdge = true;
    if (event.key === 'ArrowDown') this.downEdge = true;
    if (event.key === 'Enter') this.confirmEdge = true;
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (!WHITELISTED_KEYS.has(event.key)) return;
    this.held.delete(event.key);
  };

  /** `InputSource.sample()`: movement/throw only. Menu edges are read via the
   * getters below, never merged with any other InputSource (§5.1). */
  sample(): { left: boolean; right: boolean; throwHeld: boolean } {
    return {
      left: this.held.has('ArrowLeft'),
      right: this.held.has('ArrowRight'),
      throwHeld: this.held.has(' ') || this.held.has('Spacebar'),
    };
  }

  get escPressed(): boolean {
    return this.escEdge;
  }
  get menuUpPressed(): boolean {
    return this.upEdge;
  }
  get menuDownPressed(): boolean {
    return this.downEdge;
  }
  get menuConfirmPressed(): boolean {
    return this.confirmEdge;
  }
  get anyKeyPressed(): boolean {
    return this.anyKeyEdge;
  }

  /** Clears edge-triggered flags after systems have consumed this tick's snapshot.
   * `_simStepsRun` is accepted (not used) only so this satisfies `InputSource`'s
   * shared signature alongside TouchInputSource, which does use it (§5.3). */
  consumeEdges(_simStepsRun?: number): void {
    this.escEdge = false;
    this.upEdge = false;
    this.downEdge = false;
    this.confirmEdge = false;
    this.anyKeyEdge = false;
  }
}
