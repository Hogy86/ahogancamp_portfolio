// Tests PRD addendum v7 F24 AC1-AC3 (title power-up guide: same drawPowerUp icons, labels in
// order, readable labels with decorative icons), F25 AC1 (the exact help sentences) and the
// F24 icon helper's devicePixelRatio sizing and missing-2D-context guard. jsdom has no real
// 2D canvas, so a recording context stands in for it.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  POWER_UP_GUIDE,
  createPowerUpGuide,
  createPowerUpHelpList,
  createPowerUpIcon,
} from './powerUpGuide';
import { drawPowerUp } from '../render/shapes';
import type { PowerUpType } from '../core/types';

/** A 2D-context stand-in that logs every method call with its arguments. */
function recordingContext(): { ctx: CanvasRenderingContext2D; calls: string[] } {
  const calls: string[] = [];
  const state: Record<string, unknown> = {};
  const ctx = new Proxy(state, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return (...args: unknown[]) => calls.push(`${prop}(${args.join(',')})`);
    },
    set(target, prop: string, value) {
      target[prop] = value;
      calls.push(`${prop}=${String(value)}`);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

/** Makes every canvas getContext('2d') return a fresh recording context, collected here. */
function stubCanvasContexts(): Array<{ canvas: HTMLCanvasElement; calls: string[] }> {
  const made: Array<{ canvas: HTMLCanvasElement; calls: string[] }> = [];
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    const { ctx, calls } = recordingContext();
    made.push({ canvas: this, calls });
    return ctx;
  } as unknown as HTMLCanvasElement['getContext']);
  return made;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('F24 AC2 / F25 AC1: the guide entries', () => {
  it('lists Power (fist), Speed (double arrow), Shield (circle), Multiplier (X) in that order', () => {
    expect(POWER_UP_GUIDE.map((e) => [e.label, e.type])).toEqual([
      ['Power', 'HIT_POWER'],
      ['Speed', 'SPEED'],
      ['Shield', 'SHIELD'],
      ['Multiplier', 'PERMANENT_MULTIPLIER'],
    ]);
  });

  it('gives each power-up the one simple sentence from F25 AC1', () => {
    expect(POWER_UP_GUIDE.map((e) => e.sentence)).toEqual([
      'Your shield hits 5 times as hard for 8 seconds.',
      'You move 3 times as fast for 8 seconds.',
      "Robot lasers can't hurt you for 8 seconds.",
      'Your hits get stronger for the rest of the game.',
    ]);
  });
});

describe('F24 AC1: createPowerUpIcon draws with the game’s own drawPowerUp', () => {
  it.each(['HIT_POWER', 'SPEED', 'SHIELD', 'PERMANENT_MULTIPLIER'] as PowerUpType[])(
    '%s: the icon makes exactly the calls drawPowerUp makes for a token of that size',
    (type) => {
      vi.stubGlobal('devicePixelRatio', 1);
      const made = stubCanvasContexts();
      createPowerUpIcon(type, 24);
      expect(made).toHaveLength(1);

      const expected = recordingContext();
      expected.ctx.scale(1, 1);
      drawPowerUp(expected.ctx, 12, 12, 11, type);
      expect(made[0]!.calls).toEqual(expected.calls);
    },
  );

  it('sizes the backing store by devicePixelRatio and keeps the CSS size', () => {
    vi.stubGlobal('devicePixelRatio', 2.5);
    const made = stubCanvasContexts();
    const canvas = createPowerUpIcon('SPEED', 20);
    expect(canvas.width).toBe(50);
    expect(canvas.height).toBe(50);
    expect(canvas.style.width).toBe('20px');
    expect(canvas.style.height).toBe('20px');
    expect(made[0]!.calls[0]).toBe('scale(2.5,2.5)');
  });

  it('caps the backing store at 3x', () => {
    vi.stubGlobal('devicePixelRatio', 4);
    stubCanvasContexts();
    expect(createPowerUpIcon('SHIELD', 24).width).toBe(72);
  });

  it('returns a blank, still decorative canvas when no 2D context is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const canvas = createPowerUpIcon('HIT_POWER', 24);
    expect(canvas.tagName).toBe('CANVAS');
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('F24 AC1-AC3: the title guide', () => {
  it('shows four decorative icons, each with its real-text label, in order', () => {
    const made = stubCanvasContexts();
    const guide = createPowerUpGuide();
    const items = Array.from(guide.querySelectorAll('li'));
    expect(items.map((li) => li.textContent)).toEqual(['Power', 'Speed', 'Shield', 'Multiplier']);
    items.forEach((li, i) => {
      const icon = li.querySelector('canvas')!;
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      expect(icon.dataset.type).toBe(POWER_UP_GUIDE[i]!.type);
    });
    expect(made).toHaveLength(4);
    // The readable text is the label alone; the icon adds none.
    expect(guide.getAttribute('aria-label')).toBe('Power-ups');
  });
});

describe('F25 AC1: the help list', () => {
  it('has a row per power-up with its icon, label and sentence', () => {
    stubCanvasContexts();
    const rows = Array.from(createPowerUpHelpList().querySelectorAll('li'));
    expect(rows).toHaveLength(4);
    rows.forEach((row, i) => {
      const entry = POWER_UP_GUIDE[i]!;
      expect(row.querySelector('canvas')!.getAttribute('aria-hidden')).toBe('true');
      expect(row.querySelector('.power-up-help__label')!.textContent).toBe(entry.label);
      expect(row.querySelector('.power-up-help__sentence')!.textContent).toBe(entry.sentence);
    });
  });
});
