// Implements PRD §F1 AC5 (opposing keys cancel), §F2 (throw), §F6 AC1/AC8/AC10
// (Esc/menu nav), §F19 AC9 (v2: "any key" celebration-hold gesture), NFR-3 (input
// latency), NFR-5 (keyboard only).
// docs/mobile/architecture/mobile-architecture.md M-ADR-0003 (§5.1): merges any number
// of `InputSource`s into one `InputSnapshot`. Movement is "any source left"/"any source
// right", with opposing-cancel applied exactly once, after the merge - so two fingers on
// opposite touch buttons cancel, and so does a finger plus a key. The keyboard-only edge
// intents (escPressed, menu*Pressed, anyKeyPressed) come only from KeyboardInputSource;
// touch never fakes key presses (touch menus/PAUSE/back/lifecycle call named GameCommands
// instead, per §5.4).

import { KeyboardInputSource } from './KeyboardInputSource';

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
  /** Edge-triggered: fires once on the initial press of ANY whitelisted key, including
   * Escape. F19 AC9's "any key holds the celebration screen" reads this rather than a
   * specific key; Esc's exemption from that gesture is applied at the point of use
   * (GameStateMachine), not here, since InputManager only reports intents. */
  anyKeyPressed: boolean;
}

/** M-ADR-0003 §5.1: the contract every input device (keyboard, Android touch zones)
 * implements so InputManager can merge them without knowing which platform it is on. */
export interface InputSource {
  sample(): { left: boolean; right: boolean; throwHeld: boolean };
  /** `simStepsRun` is the number of fixed steps GameLoop ran this frame - Android's
   * THROW latch (§5.3) only clears once at least one step has actually run, so a tap
   * shorter than one frame still reaches exactly one simulation step. Keyboard ignores it. */
  consumeEdges(simStepsRun: number): void;
}

/**
 * Merges one or more `InputSource`s into a single per-tick `InputSnapshot`. Always
 * owns exactly one `KeyboardInputSource` (so hardware keyboards/Chromebooks keep
 * working everywhere, M3.10); a platform's `init()` may register additional sources
 * (e.g. Android's touch move-zone/throw button) via `addSource`.
 */
export class InputManager {
  private readonly keyboard: KeyboardInputSource;
  private readonly extraSources: InputSource[] = [];

  constructor(target: Window = window) {
    this.keyboard = new KeyboardInputSource(target);
  }

  /** Registers an additional movement/throw source (Android's TouchInputSource).
   * Never called by the web build (M3.12). */
  addSource(source: InputSource): void {
    this.extraSources.push(source);
  }

  dispose(): void {
    this.keyboard.dispose();
  }

  /** Produces this tick's intent snapshot. Call once per fixed step. */
  snapshot(): InputSnapshot {
    let left = false;
    let right = false;
    let throwHeld = false;
    for (const source of [this.keyboard, ...this.extraSources]) {
      const sample = source.sample();
      left = left || sample.left;
      right = right || sample.right;
      throwHeld = throwHeld || sample.throwHeld;
    }

    return {
      // F1 AC5: simultaneous opposing intents (from any combination of sources)
      // cancel to no net movement, applied exactly once after the merge.
      moveLeft: left && !right,
      moveRight: right && !left,
      throwHeld,
      escPressed: this.keyboard.escPressed,
      menuUpPressed: this.keyboard.menuUpPressed,
      menuDownPressed: this.keyboard.menuDownPressed,
      menuConfirmPressed: this.keyboard.menuConfirmPressed,
      anyKeyPressed: this.keyboard.anyKeyPressed,
    };
  }

  /** Clears edge-triggered flags after systems have consumed this tick's snapshot.
   * `simStepsRun` defaults to 0 for callers (existing tests) that don't drive a real
   * GameLoop; it only matters to touch sources' throw-latch (§5.3). */
  consumeEdges(simStepsRun = 0): void {
    this.keyboard.consumeEdges(simStepsRun);
    for (const source of this.extraSources) source.consumeEdges(simStepsRun);
  }
}
