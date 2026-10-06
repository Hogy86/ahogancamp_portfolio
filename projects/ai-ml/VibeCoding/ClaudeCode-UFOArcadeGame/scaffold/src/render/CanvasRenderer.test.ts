// Tests code-review-v4-round1.md S1 / mobile code-review-round20 L4: the canvas draws the
// formation warning and BOSS INCOMING words by default (website unchanged), and skips only
// the words (never the border) after setTopBannerTextOnCanvas(false) (Android uses a DOM
// banner). jsdom has no real 2D canvas, so a recording context logs each call with the
// style in force at that moment. PRD addendum v7 F27 AC2 (code-review-round21 L4): the
// border is also asserted in both default (words-on-canvas) cases.

import { describe, expect, it } from 'vitest';
import { CanvasRenderer } from './CanvasRenderer';
import {
  BOSS_WARNING_TEXT,
  FORMATION_WARNING_TEXT,
  LEVEL_INTRO_TEXT_COLOR,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
} from '../config/constants';
import { createNewRunWorld } from '../core/world';
import type { World } from '../core/types';

interface Call {
  name: string;
  args: unknown[];
  font: string;
  fillStyle: unknown;
  strokeStyle: unknown;
}

function makeRenderer(): { renderer: CanvasRenderer; calls: Call[] } {
  const calls: Call[] = [];
  const state: Record<string, unknown> = { font: '', fillStyle: '', strokeStyle: '' };
  const ctx: unknown = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop in state) return state[prop];
        return (...args: unknown[]) => {
          calls.push({
            name: prop,
            args,
            font: String(state.font),
            fillStyle: state.fillStyle,
            strokeStyle: state.strokeStyle,
          });
          return ctx; // gradients etc. chain harmlessly
        };
      },
      set(_t, prop: string, value) {
        state[prop] = value;
        return true;
      },
    },
  );
  const canvas = document.createElement('canvas');
  canvas.getContext = (() => ctx) as unknown as HTMLCanvasElement['getContext'];
  return { renderer: new CanvasRenderer(canvas), calls };
}

function playingWorld(patch: Partial<World>): World {
  const world = createNewRunWorld();
  world.state = 'PLAYING';
  world.formationWarningActive = false;
  world.bossWarningRemaining = 0;
  return Object.assign(world, patch);
}

const texts = (calls: Call[], name: string): Call[] =>
  calls.filter((c) => c.name === name && typeof c.args[0] === 'string');
const BORDER = [3, 3, PLAYFIELD_WIDTH - 6, PLAYFIELD_HEIGHT - 6];
const borderCalls = (calls: Call[]): Call[] =>
  calls.filter((c) => c.name === 'strokeRect' && String(c.args) === String(BORDER));

describe('shared warning copy (F22 AC4, F3 AC6, F12 AC10-11)', () => {
  it('keeps the exact player-facing strings', () => {
    expect(FORMATION_WARNING_TEXT).toBe('WARNING: ROBOTS APPROACHING');
    expect(BOSS_WARNING_TEXT).toBe('BOSS INCOMING');
  });
});

describe('CanvasRenderer top-centre warning words', () => {
  it('draws the formation warning in bold 16px red at top centre by default', () => {
    const { renderer, calls } = makeRenderer();
    renderer.render(playingWorld({ formationWarningActive: true }));
    const fills = texts(calls, 'fillText').filter((c) => c.args[0] === FORMATION_WARNING_TEXT);
    expect(fills).toHaveLength(1);
    expect(fills[0]!.args).toEqual([FORMATION_WARNING_TEXT, PLAYFIELD_WIDTH / 2, 24]);
    expect(fills[0]!.font).toBe('bold 16px system-ui, sans-serif');
    expect(fills[0]!.fillStyle).toBe('#ff5a5a');
    const border = borderCalls(calls);
    expect(border).toHaveLength(1);
    expect(['#ff5a5a', '#ffb3b3']).toContain(border[0]!.strokeStyle);
  });

  it('draws the boss warning as stroke then fill in bold 20px amber by default', () => {
    const { renderer, calls } = makeRenderer();
    renderer.render(playingWorld({ bossWarningRemaining: 1 }));
    const textCalls = calls.filter((c) => c.args[0] === BOSS_WARNING_TEXT);
    expect(textCalls.map((c) => c.name)).toEqual(['strokeText', 'fillText']);
    for (const c of textCalls) {
      expect(c.args).toEqual([BOSS_WARNING_TEXT, PLAYFIELD_WIDTH / 2, 24]);
      expect(c.font).toBe('bold 20px system-ui, sans-serif');
    }
    expect(textCalls[1]!.fillStyle).toBe(LEVEL_INTRO_TEXT_COLOR);
    const border = borderCalls(calls);
    expect(border).toHaveLength(1);
    expect(border[0]!.strokeStyle).toBe(LEVEL_INTRO_TEXT_COLOR);
  });

  it('after setTopBannerTextOnCanvas(false) draws no warning words but keeps both borders', () => {
    for (const patch of [{ formationWarningActive: true }, { bossWarningRemaining: 1 }]) {
      const { renderer, calls } = makeRenderer();
      renderer.setTopBannerTextOnCanvas(false);
      renderer.render(playingWorld(patch));
      const words = calls.filter(
        (c) => c.args[0] === FORMATION_WARNING_TEXT || c.args[0] === BOSS_WARNING_TEXT,
      );
      expect(words).toEqual([]);
      expect(calls.some((c) => c.name === 'strokeRect' && String(c.args) === String(BORDER))).toBe(
        true,
      );
    }
  });

  it('draws neither words nor warning border when no warning is active', () => {
    const { renderer, calls } = makeRenderer();
    renderer.render(playingWorld({}));
    expect(texts(calls, 'fillText').filter((c) => c.args[0] === FORMATION_WARNING_TEXT)).toEqual(
      [],
    );
    expect(calls.some((c) => c.name === 'strokeRect' && String(c.args) === String(BORDER))).toBe(
      false,
    );
  });
});
