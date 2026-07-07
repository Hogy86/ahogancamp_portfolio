// Implements PRD §F1 AC5 (opposing keys cancel), §F2 (throw), §F6 AC1/AC8/AC10
// (Esc/menu nav), NFR-3 (input latency), NFR-5 (keyboard only).
// ADR-0001 §Component responsibilities: InputManager whitelists specific keys and
// ignores everything else - no free-text, no injection surface.

/** Semantic intents the rest of the game reacts to - never raw key codes past this layer. */
export interface InputSnapshot {
  moveLeft: boolean;
  moveRight: boolean;
  throwHeld: boolean;
  /** Edge-triggered (fires once per physical press), not held state. */
  escPressed: boolean;
  menuUpPressed: boolean;
  menuDownPressed: boolean;
  menuConfirmPressed: boolean;
}

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
export class InputManager {
  private readonly held = new Set<string>();
  private escEdge = false;
  private upEdge = false;
  private downEdge = false;
  private confirmEdge = false;

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
    if (event.key === 'Escape') this.escEdge = true;
    if (event.key === 'ArrowUp') this.upEdge = true;
    if (event.key === 'ArrowDown') this.downEdge = true;
    if (event.key === 'Enter') this.confirmEdge = true;
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (!WHITELISTED_KEYS.has(event.key)) return;
    this.held.delete(event.key);
  };

  /** Produces this tick's intent snapshot. Call once per fixed step. */
  snapshot(): InputSnapshot {
    const left = this.held.has('ArrowLeft');
    const right = this.held.has('ArrowRight');
    return {
      // F1 AC5: simultaneous opposing keys cancel to no net movement.
      moveLeft: left && !right,
      moveRight: right && !left,
      throwHeld: this.held.has(' ') || this.held.has('Spacebar'),
      escPressed: this.escEdge,
      menuUpPressed: this.upEdge,
      menuDownPressed: this.downEdge,
      menuConfirmPressed: this.confirmEdge,
    };
  }

  /** Clears edge-triggered flags after systems have consumed this tick's snapshot. */
  consumeEdges(): void {
    this.escEdge = false;
    this.upEdge = false;
    this.downEdge = false;
    this.confirmEdge = false;
  }
}
