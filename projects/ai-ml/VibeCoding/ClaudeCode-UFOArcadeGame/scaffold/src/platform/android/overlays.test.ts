// Tests PRD addendum v7 F25 AC1/AC3: the Android "How to play" overlay lists the four
// power-ups (icon, label, one sentence) and keeps its control lines and "Got it" button.
// The fit at 640x360 is checked in tests/mobile-e2e/menu-insets.spec.ts and
// power-up-guide.spec.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AndroidOverlays } from './overlays';

describe('How to play overlay (F25)', () => {
  let help: HTMLElement;

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const root = document.createElement('div');
    document.body.append(root);
    new AndroidOverlays(
      root,
      () => undefined,
      () => undefined,
    );
    help = root.querySelector<HTMLElement>('[role="dialog"][aria-label="How to play"]')!;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('lists the four power-ups with icon, label and the F25 sentence, in order', () => {
    const rows = Array.from(help.querySelectorAll('.power-up-help li'));
    expect(
      rows.map((row) => [
        row.querySelector('.power-up-help__label')!.textContent,
        row.querySelector('.power-up-help__sentence')!.textContent,
      ]),
    ).toEqual([
      ['Power', 'Your shield hits 5 times as hard for 8 seconds.'],
      ['Speed', 'You move 3 times as fast for 8 seconds.'],
      ['Shield', "Robot lasers can't hurt you for 8 seconds."],
      ['Multiplier', 'Your hits get stronger for the rest of the game.'],
    ]);
    for (const row of rows) {
      expect(row.querySelector('canvas')!.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('keeps the three control lines and ends with the "Got it" button', () => {
    const lines = Array.from(help.querySelectorAll(':scope > p')).map((p) => p.textContent);
    expect(lines).toEqual([
      'Left and right buttons: move ShieldMan',
      'THROW: throw your shield. One at a time. Catch it on the rebound for +1 life.',
      'Pause button: pause the game',
    ]);
    const last = help.lastElementChild as HTMLElement;
    expect(last.textContent).toBe('Got it');
    expect(last.dataset.action).toBe('help-dismiss');
    // The power-up list sits between the control lines and "Got it".
    expect(last.previousElementSibling!.classList.contains('power-up-help')).toBe(true);
  });
});
