// Implements PRD-mobile M2.3 / M2.3b / M2.6 for the canvas words that used to be drawn at
// the playfield's top centre: F3 AC6 "WARNING: ROBOTS APPROACHING" (UAT round 2 F4) and
// F12 AC10-11 "BOSS INCOMING". On the 640x360 phone that canvas text was 8-10 dp tall and
// ran under the Level box, and no single HUD row has room for it at the 12 sp floor. On
// Android the words are one DOM row placed directly BELOW the HUD, so they can never
// overlap a HUD panel whatever the score digits, power-up pill or font size make the HUD.
// The borders stay on the canvas (shared renderer), so the cues are still not colour-only.
// One element serves both, so the two can never be on screen at once (boss wins).

import { BOSS_WARNING_TEXT, FORMATION_WARNING_TEXT } from '../../config/constants';

/** Logical px between the HUD's bottom edge and the banner. */
const GAP_BELOW_HUD = 2;

export type TopBannerKind = 'robots' | 'boss' | null;

export class TopBanner {
  private readonly el: HTMLElement;
  private kind: TopBannerKind = null;
  private top = -1;

  constructor(
    appRoot: HTMLElement,
    private readonly hudRoot: HTMLElement,
  ) {
    this.el = document.createElement('div');
    this.el.id = 'top-banner';
    this.el.setAttribute('role', 'status');
    this.el.hidden = true;
    appRoot.appendChild(this.el);
  }

  /** Called every frame. The DOM is only written on a change of kind or when the HUD's
   * height changed (a wrapped HUD row at large font pushes the banner down with it). */
  sync(kind: TopBannerKind): void {
    if (kind !== this.kind) {
      // role="status" (set in the constructor) announces this text once per kind change;
      // it is only written here, never per frame, so it cannot repeat.
      this.kind = kind;
      this.el.hidden = kind === null;
      this.el.dataset.kind = kind ?? '';
      this.el.textContent =
        kind === 'boss' ? BOSS_WARNING_TEXT : kind === 'robots' ? FORMATION_WARNING_TEXT : '';
    }
    if (kind === null) return;
    const top = this.hudRoot.offsetTop + this.hudRoot.offsetHeight + GAP_BELOW_HUD;
    if (top !== this.top) {
      this.top = top;
      this.el.style.top = `${top}px`;
    }
  }
}
