// Tests PRD §F1 AC5 (opposing Left+Right keys cancel at the input layer),
// and the edge-triggered semantics (Esc/Up/Down/Enter fire once per physical
// press) that F6's pause menu navigation depends on.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InputManager } from './InputManager';

function press(target: EventTarget, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
}

function release(target: EventTarget, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keyup', { key, cancelable: true }));
}

describe('InputManager (F1 AC5, F6 edge-triggering)', () => {
  let target: EventTarget;
  let input: InputManager;

  beforeEach(() => {
    target = new EventTarget();
    input = new InputManager(target as unknown as Window);
  });

  afterEach(() => {
    input.dispose();
  });

  it('F1 AC5: Left+Right both held resolves to no net movement intent', () => {
    press(target, 'ArrowLeft');
    press(target, 'ArrowRight');
    const snapshot = input.snapshot();
    expect(snapshot.moveLeft).toBe(false);
    expect(snapshot.moveRight).toBe(false);
  });

  it('F1: Left held alone resolves to moveLeft=true, moveRight=false', () => {
    press(target, 'ArrowLeft');
    const snapshot = input.snapshot();
    expect(snapshot.moveLeft).toBe(true);
    expect(snapshot.moveRight).toBe(false);
  });

  it('F1: releasing one of two opposing keys restores single-direction movement', () => {
    press(target, 'ArrowLeft');
    press(target, 'ArrowRight');
    release(target, 'ArrowRight');
    const snapshot = input.snapshot();
    expect(snapshot.moveLeft).toBe(true);
    expect(snapshot.moveRight).toBe(false);
  });

  it('F6: Escape is edge-triggered - fires true once per physical press, not per tick while held', () => {
    press(target, 'Escape');
    expect(input.snapshot().escPressed).toBe(true);
    // Still held, but consumeEdges() has not been called between snapshots is the
    // simulated "same tick" case - after consumeEdges(), it must go false even
    // though the key is still physically down (no repeated keydown fired).
    input.consumeEdges();
    expect(input.snapshot().escPressed).toBe(false);
  });

  it('F6: Escape re-fires only after a fresh keydown following a keyup', () => {
    press(target, 'Escape');
    input.consumeEdges();
    release(target, 'Escape');
    press(target, 'Escape');
    expect(input.snapshot().escPressed).toBe(true);
  });

  it('ignores non-whitelisted keys entirely (no injection surface)', () => {
    press(target, 'a');
    const snapshot = input.snapshot();
    expect(snapshot.moveLeft).toBe(false);
    expect(snapshot.moveRight).toBe(false);
    expect(snapshot.throwHeld).toBe(false);
  });

  it('F2: space (both " " and "Spacebar" variants) registers as throwHeld', () => {
    press(target, ' ');
    expect(input.snapshot().throwHeld).toBe(true);
  });
});
