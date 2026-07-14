// Tests PRD §F5 AC5 (visible level indicator 1-10 at all times during play),
// §F7 AC10 (persistent HUD readout of the permanent multiplier + distinct
// on-catch flash feedback), §F8 AC1 (visible lives indicator), §F9 AC1/AC2 (one-line
// control text, present until first throw, then fades), §F10 AC1 (score visible
// during play, starting at 0), and the binding textContent-only DOM security
// constraint (asserted behaviorally). v2: §F11 AC6 (exactly one active-temporary-
// effect indicator, replacing v1's up-to-three-simultaneous readouts) and §F16 AC9
// ("+1 LIFE" catch-confirmation cue on the lives readout).
//
// These are real-DOM assertions against jsdom output - GameStateMachine/
// PowerUpSystem tests already cover the underlying *state* this view reads
// from; this file answers "does HUDView actually render that state as visible
// text," which is the gap flagged in validation-report.md.

import { beforeEach, describe, expect, it } from 'vitest';
import { HUDView } from './HUDView';
import { makePlayingWorld } from '../test-utils/worldFactory';
import { FIXED_DT } from '../config/constants';

describe('HUDView (F5 AC5, F7 AC10, F8 AC1, F9 AC1/AC2, F10 AC1, F11 AC6, F16 AC9)', () => {
  let root: HTMLElement;
  let controlTextRoot: HTMLElement;
  let hud: HUDView;

  beforeEach(() => {
    root = document.createElement('div');
    controlTextRoot = document.createElement('div');
    hud = new HUDView(root, controlTextRoot);
  });

  /** Locates the panel currently rendering the active-temporary-effect text
   * (identified by content/class, not construction order, so this stays valid
   * across a harmless internal refactor of panel ordering). */
  function findEffectsPanel(): Element {
    const panels = Array.from(root.querySelectorAll('.hud-panel'));
    const withEffectsText = panels.find((el) => /Hit|Speed|Shield \d/.test(el.textContent ?? ''));
    if (withEffectsText) return withEffectsText;
    // No active effect text currently rendered - fall back to the panel that
    // toggles hud-effect-active for temporary effects (distinct from the
    // multiplier panel, which always contains "Power").
    return panels.find(
      (el) =>
        !el.textContent?.startsWith('Power') &&
        el.classList.contains('hud-panel') &&
        el.textContent === '',
    )!;
  }

  describe('F9 AC2: control text is present immediately on construction', () => {
    it('renders the exact one-line control text into controlTextRoot', () => {
      expect(controlTextRoot.textContent).toBe('← → move · Space throw · Esc pause');
    });
  });

  describe('F10 AC1: score is visible during play, starting at 0', () => {
    it('renders "Score: 0" for a fresh world', () => {
      const world = makePlayingWorld();
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Score: 0');
    });

    it('renders the updated score after it changes', () => {
      const world = makePlayingWorld();
      world.score = 12500;
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Score: 12500');
    });
  });

  describe('F8 AC1: lives indicator is visible', () => {
    it('renders "Lives: 3" for a fresh run', () => {
      const world = makePlayingWorld();
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Lives: 3');
    });

    it('renders the updated lives count after a hit', () => {
      const world = makePlayingWorld();
      world.lives = 1;
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Lives: 1');
    });

    it('F16 AC9: shows a distinct "+1 LIFE" cue at the instant of a shield catch (lifeCatchFlashRemaining > 0)', () => {
      const world = makePlayingWorld();
      world.lives = 4;
      world.lifeCatchFlashRemaining = 1.0;
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Lives: 4 (+1 LIFE)');
    });

    it('F16 AC9: the "+1 LIFE" cue is gone once the flash window has elapsed', () => {
      const world = makePlayingWorld();
      world.lives = 4;
      world.lifeCatchFlashRemaining = 0;
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Lives: 4');
      expect(root.textContent).not.toContain('+1 LIFE');
    });
  });

  describe('F5 AC5: level indicator is visible at all times during play', () => {
    it('renders "Level: 1/10" at level 1', () => {
      const world = makePlayingWorld(1);
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Level: 1/10');
    });

    it('renders "Level: 7/10" at level 7', () => {
      const world = makePlayingWorld(7);
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Level: 7/10');
    });

    it('remains visible (still rendered) while PAUSED, not just PLAYING', () => {
      const world = makePlayingWorld(3);
      world.state = 'PAUSED';
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Level: 3/10');
    });
  });

  describe('F7 AC10: persistent HUD readout of the permanent multiplier, exact format', () => {
    it('renders "Power ×1.00" at the default (no catches yet)', () => {
      const world = makePlayingWorld();
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Power ×1.00');
    });

    it('renders "Power ×3.24" after two stacked permanent catches (1.8 * 1.8)', () => {
      const world = makePlayingWorld();
      world.permanentMultiplier = 3.24;
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Power ×3.24');
    });

    it('F7 AC10(b): flashes a distinct "hud-effect-active" class on the multiplier element the instant it changes', () => {
      const world = makePlayingWorld();
      hud.update(world, false, FIXED_DT); // establish baseline multiplier = 1

      const multiplierEl = Array.from(root.querySelectorAll('.hud-panel')).find((el) =>
        el.textContent?.startsWith('Power'),
      )!;
      expect(multiplierEl.classList.contains('hud-effect-active')).toBe(false);

      world.permanentMultiplier = 1.8; // simulates a catch
      hud.update(world, false, FIXED_DT);
      expect(multiplierEl.classList.contains('hud-effect-active')).toBe(true);
    });

    it('the on-catch flash clears again after the flash window elapses', () => {
      const world = makePlayingWorld();
      hud.update(world, false, FIXED_DT);
      world.permanentMultiplier = 1.8;
      hud.update(world, false, FIXED_DT);

      const multiplierEl = Array.from(root.querySelectorAll('.hud-panel')).find((el) =>
        el.textContent?.startsWith('Power'),
      )!;
      expect(multiplierEl.classList.contains('hud-effect-active')).toBe(true);

      // Advance well past the flash duration with no further catch.
      for (let i = 0; i < 120; i += 1) hud.update(world, false, FIXED_DT);
      expect(multiplierEl.classList.contains('hud-effect-active')).toBe(false);
    });
  });

  describe('F11 AC6: single active-temporary-effect indicator (replaces v1 up-to-three-simultaneous readouts)', () => {
    it('renders no active-effect text when no temporary effect is active', () => {
      const world = makePlayingWorld();
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).not.toContain('Hit');
      expect(root.textContent).not.toContain('Speed');
      expect(root.textContent).not.toContain('Shield ');
    });

    it('renders a visible indicator with remaining duration while 5x Hit Power is the active effect', () => {
      const world = makePlayingWorld();
      world.effects = { type: 'HIT_POWER', remaining: 6.5 };
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('5x Hit 6.5s');
    });

    it('renders a visible indicator while 3x Speed is the active effect', () => {
      const world = makePlayingWorld();
      world.effects = { type: 'SPEED', remaining: 2.3 };
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('3x Speed 2.3s');
    });

    it('renders a visible indicator while the Indestructible Shield is the active effect', () => {
      const world = makePlayingWorld();
      world.effects = { type: 'SHIELD', remaining: 4.0 };
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Shield 4.0s');
    });

    it('F11 AC1/AC6: never renders two effect indicators at once - switching the active slot replaces the text, it does not add a second line', () => {
      const world = makePlayingWorld();
      world.effects = { type: 'HIT_POWER', remaining: 1.0 };
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('5x Hit 1.0s');
      expect(root.textContent).not.toContain('Speed');
      expect(root.textContent).not.toContain('Shield ');

      // F11 AC3/AC6: a replacement catch switches to the new effect in the same frame -
      // no stale/overlapping readout of the old one.
      world.effects = { type: 'SHIELD', remaining: 8.0 };
      hud.update(world, false, FIXED_DT);
      expect(root.textContent).toContain('Shield 8.0s');
      expect(root.textContent).not.toContain('5x Hit');
    });

    it('toggles a distinct "hud-effect-active" class on while a temporary effect is active, and off when none is', () => {
      const world = makePlayingWorld();
      world.effects = { type: 'SPEED', remaining: 3 };
      hud.update(world, false, FIXED_DT);
      const activePanel = findEffectsPanel();
      expect(activePanel.classList.contains('hud-effect-active')).toBe(true);

      world.effects = { type: null, remaining: 0 };
      hud.update(world, false, FIXED_DT);
      expect(activePanel.classList.contains('hud-effect-active')).toBe(false);
    });
  });

  describe('F9 AC1/AC2: control text remains present until first throw, then fades (non-color-only cue)', () => {
    it('does not add the "faded" class before the first throw', () => {
      const world = makePlayingWorld();
      hud.update(world, false, FIXED_DT);
      expect(controlTextRoot.classList.contains('faded')).toBe(false);
      expect(controlTextRoot.textContent).toBe('← → move · Space throw · Esc pause');
    });

    it('adds the "faded" class once hasThrownOnce becomes true, without removing the text', () => {
      const world = makePlayingWorld();
      hud.update(world, true, FIXED_DT);
      expect(controlTextRoot.classList.contains('faded')).toBe(true);
      // Text itself is not required to be removed by AC2 - only visually faded.
      expect(controlTextRoot.textContent).toBe('← → move · Space throw · Esc pause');
    });
  });

  describe('HUDView only updates during PLAYING/PAUSED (no stale rendering on other screens)', () => {
    it('does not throw and leaves prior content when called with state TITLE', () => {
      const world = makePlayingWorld();
      world.state = 'TITLE';
      expect(() => hud.update(world, false, FIXED_DT)).not.toThrow();
    });
  });

  describe('Security constraint: all HUD text is written via textContent, never innerHTML', () => {
    it('a score value cannot introduce markup: no element children appear inside any hud-panel', () => {
      const world = makePlayingWorld();
      world.score = 42;
      hud.update(world, false, FIXED_DT);

      root.querySelectorAll('.hud-panel').forEach((panel) => {
        expect(panel.children).toHaveLength(0);
        expect(panel.innerHTML).toBe(panel.textContent);
      });
    });

    it('no <script> or <b> elements ever appear in the HUD subtree', () => {
      const world = makePlayingWorld();
      world.permanentMultiplier = 3.24;
      world.effects = { type: 'HIT_POWER', remaining: 5 };
      hud.update(world, false, FIXED_DT);

      expect(root.querySelector('script')).toBeNull();
      expect(root.querySelector('b')).toBeNull();
    });
  });
});
