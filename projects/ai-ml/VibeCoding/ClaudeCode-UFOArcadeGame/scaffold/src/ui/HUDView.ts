// Implements PRD §F5 AC5 (level indicator), §F7 AC10/AC11 (permanent multiplier
// readout), §F11 AC6 (v2: single active-temporary-effect indicator, replaces v1's up-to-
// three simultaneous readouts), §F8 AC1 (lives), §F16 AC9 (v2: "+1 LIFE" catch-confirmation
// cue), §F10 (score), §F9 AC2 (control-text line), NFR-9(b) (HUD contrast via backing panel
// band). All text is written via textContent only (security binding constraint #2 - see
// ui/dom.ts).

import { clearChildren, createElement, setText } from './dom';
import type { TemporaryEffectType, World } from '../core/types';

/** F11 AC6: human-readable label per temporary effect type for the single-slot readout. */
const TEMPORARY_EFFECT_LABELS: Record<TemporaryEffectType, string> = {
  HIT_POWER: '5x Hit',
  SPEED: '3x Speed',
  SHIELD: 'Shield',
};

export class HUDView {
  private readonly scoreEl: HTMLElement;
  private readonly livesEl: HTMLElement;
  private readonly levelEl: HTMLElement;
  private readonly multiplierEl: HTMLElement;
  private readonly effectsEl: HTMLElement;
  private readonly controlTextEl: HTMLElement;

  private lastMultiplier = 1;
  private multiplierFlashRemaining = 0;
  private controlTextFaded = false;

  // Last-rendered strings for each live-updated node, so update() only
  // touches the DOM (and thus only "speaks" to the #hud-root aria-live
  // region) when the displayed value actually changes, not every frame.
  private lastScoreText = '';
  private lastLivesText = '';
  private lastLevelText = '';
  private lastMultiplierText = '';
  private lastEffectsText = '';

  constructor(root: HTMLElement, controlTextRoot: HTMLElement) {
    clearChildren(root);

    this.scoreEl = createElement('div', 'hud-panel');
    this.livesEl = createElement('div', 'hud-panel');
    this.levelEl = createElement('div', 'hud-panel');
    this.multiplierEl = createElement('div', 'hud-panel');
    this.effectsEl = createElement('div', 'hud-panel');

    const leftGroup = createElement('div');
    leftGroup.append(this.scoreEl, this.livesEl);
    const rightGroup = createElement('div');
    rightGroup.append(this.levelEl, this.multiplierEl, this.effectsEl);

    root.append(leftGroup, rightGroup);

    this.controlTextEl = controlTextRoot;
    setText(this.controlTextEl, '← → move · Space throw · Esc pause');
  }

  /**
   * Only writes textContent when the new string differs from what's already
   * rendered. #hud-root is aria-live="polite" (index.html); rewriting
   * textContent unconditionally every frame (60/sec) would flood that live
   * region with churn even when nothing displayed actually changed, which
   * defeats its purpose for screen-reader users. Diffing here keeps DOM
   * writes to real changes only, and is a minor perf/cleanliness win too.
   */
  private setTextIfChanged(element: HTMLElement, next: string, lastRendered: string): string {
    if (next !== lastRendered) setText(element, next);
    return next;
  }

  /** F9 AC2: control text is present at least until the first throw, then may fade. */
  update(world: World, hasThrownOnce: boolean, dt: number): void {
    if (world.state !== 'PLAYING' && world.state !== 'PAUSED') return;

    this.lastScoreText = this.setTextIfChanged(
      this.scoreEl,
      `Score: ${world.score}`,
      this.lastScoreText,
    );
    // F16 AC9: a distinct, perceptible "+1 LIFE" cue at the instant of a shield catch,
    // consistent with the existing multiplier catch-flash pattern (hud-effect-active pulse
    // + a text change) rather than a silent one-frame tick of the lives counter.
    const livesFlashing = world.lifeCatchFlashRemaining > 0;
    this.lastLivesText = this.setTextIfChanged(
      this.livesEl,
      livesFlashing ? `Lives: ${world.lives} (+1 LIFE)` : `Lives: ${world.lives}`,
      this.lastLivesText,
    );
    this.livesEl.classList.toggle('hud-effect-active', livesFlashing);
    this.lastLevelText = this.setTextIfChanged(
      this.levelEl,
      `Level: ${world.level}/10`,
      this.lastLevelText,
    );

    if (world.permanentMultiplier !== this.lastMultiplier) {
      // F7 AC10(b): distinct on-catch feedback - flash the readout briefly.
      this.multiplierFlashRemaining = 0.6;
      this.lastMultiplier = world.permanentMultiplier;
    }
    this.multiplierFlashRemaining = Math.max(0, this.multiplierFlashRemaining - dt);
    this.multiplierEl.classList.toggle('hud-effect-active', this.multiplierFlashRemaining > 0);
    this.lastMultiplierText = this.setTextIfChanged(
      this.multiplierEl,
      `Power ×${world.permanentMultiplier.toFixed(2)}`,
      this.lastMultiplierText,
    );

    // F11 AC6: exactly one active-effect slot - switches to the new effect's type and full
    // duration in the same frame a replacement catch lands (no stale/overlapping readouts).
    const activeEffectText =
      world.effects.type !== null
        ? `${TEMPORARY_EFFECT_LABELS[world.effects.type]} ${world.effects.remaining.toFixed(1)}s`
        : '';
    this.lastEffectsText = this.setTextIfChanged(
      this.effectsEl,
      activeEffectText,
      this.lastEffectsText,
    );
    this.effectsEl.classList.toggle('hud-effect-active', world.effects.type !== null);

    if (hasThrownOnce && !this.controlTextFaded) {
      this.controlTextFaded = true;
      this.controlTextEl.classList.add('faded');
    }
  }
}
