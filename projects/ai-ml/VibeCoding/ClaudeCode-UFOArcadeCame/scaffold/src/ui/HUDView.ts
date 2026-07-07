// Implements PRD §F5 AC5 (level indicator), §F7 AC10/AC11 (permanent multiplier
// readout + active-effect indicators), §F8 AC1 (lives), §F10 (score), §F9 AC2
// (control-text line), NFR-9(b) (HUD contrast via backing panel band). All text is
// written via textContent only (security binding constraint #2 - see ui/dom.ts).

import { clearChildren, createElement, setText } from './dom';
import type { World } from '../core/types';

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
    this.lastLivesText = this.setTextIfChanged(
      this.livesEl,
      `Lives: ${world.lives}`,
      this.lastLivesText,
    );
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

    const activeEffects: string[] = [];
    if (world.effects.hitPowerRemaining > 0)
      activeEffects.push(`5x Hit ${world.effects.hitPowerRemaining.toFixed(1)}s`);
    if (world.effects.speedRemaining > 0)
      activeEffects.push(`3x Speed ${world.effects.speedRemaining.toFixed(1)}s`);
    if (world.effects.shieldRemaining > 0)
      activeEffects.push(`Shield ${world.effects.shieldRemaining.toFixed(1)}s`);
    this.lastEffectsText = this.setTextIfChanged(
      this.effectsEl,
      activeEffects.length > 0 ? activeEffects.join(' | ') : '',
      this.lastEffectsText,
    );
    this.effectsEl.classList.toggle('hud-effect-active', activeEffects.length > 0);

    if (hasThrownOnce && !this.controlTextFaded) {
      this.controlTextFaded = true;
      this.controlTextEl.classList.add('faded');
    }
  }
}
