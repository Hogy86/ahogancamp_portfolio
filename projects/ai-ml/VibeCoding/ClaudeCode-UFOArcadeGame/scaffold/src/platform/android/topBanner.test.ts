// Tests code-review-round20 L4: which Android DOM banner the world calls for (same gates as
// the canvas words on web), and the DOM element's text and status role. PRD addendum v7
// F27 AC2 (code-review-round21 L4): `data-kind`, no DOM write while the kind is unchanged,
// and `top` following the HUD's height.

import { describe, expect, it } from 'vitest';
import { topBannerFor } from './AndroidPlatform';
import { TopBanner } from './topBanner';
import { BOSS_WARNING_TEXT, FORMATION_WARNING_TEXT } from '../../config/constants';
import type { World } from '../../core/types';

function world(patch: Partial<World>): World {
  return {
    state: 'PLAYING',
    bossWarningRemaining: 0,
    formationWarningActive: false,
    ...patch,
  } as World;
}

describe('topBannerFor', () => {
  it('is hidden with no warning active', () => {
    expect(topBannerFor(world({}))).toBeNull();
  });

  it('shows robots for the formation warning and boss for the boss warning', () => {
    expect(topBannerFor(world({ formationWarningActive: true }))).toBe('robots');
    expect(topBannerFor(world({ bossWarningRemaining: 2 }))).toBe('boss');
  });

  it('shows in PAUSED too, like the dimmed HUD', () => {
    expect(topBannerFor(world({ state: 'PAUSED', formationWarningActive: true }))).toBe('robots');
    expect(topBannerFor(world({ state: 'PAUSED', bossWarningRemaining: 1 }))).toBe('boss');
  });

  it('is hidden outside PLAYING and PAUSED even if a warning flag is set', () => {
    for (const state of ['TITLE', 'GAMEOVER', 'VICTORY']) {
      const w = world({
        state: state as World['state'],
        formationWarningActive: true,
        bossWarningRemaining: 1,
      });
      expect(topBannerFor(w), state).toBeNull();
    }
  });

  it('lets the boss banner win when both warnings are active', () => {
    expect(topBannerFor(world({ formationWarningActive: true, bossWarningRemaining: 1 }))).toBe(
      'boss',
    );
  });
});

describe('TopBanner element', () => {
  it('is a hidden status region that carries the right text per kind', () => {
    const root = document.createElement('div');
    const hud = document.createElement('div');
    root.append(hud);
    document.body.append(root);
    const banner = new TopBanner(root, hud);
    const el = root.querySelector<HTMLElement>('#top-banner')!;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.hidden).toBe(true);
    banner.sync('robots');
    expect(el.hidden).toBe(false);
    expect(el.textContent).toBe(FORMATION_WARNING_TEXT);
    banner.sync('boss');
    expect(el.textContent).toBe(BOSS_WARNING_TEXT);
    banner.sync(null);
    expect(el.hidden).toBe(true);
    expect(el.textContent).toBe('');
  });
});

/** A banner in a fresh root whose HUD reports the given offsetTop/offsetHeight (jsdom does
 * no layout, so the HUD box is stubbed; `hudBox` can be changed between syncs). */
function makeBanner(hudBox = { top: 0, height: 0 }) {
  const root = document.createElement('div');
  const hud = document.createElement('div');
  Object.defineProperty(hud, 'offsetTop', { get: () => hudBox.top });
  Object.defineProperty(hud, 'offsetHeight', { get: () => hudBox.height });
  root.append(hud);
  document.body.append(root);
  const banner = new TopBanner(root, hud);
  const el = root.querySelector<HTMLElement>('#top-banner')!;
  return { banner, el, hudBox };
}

describe('TopBanner element (F27 AC2)', () => {
  it('sets data-kind to the kind shown, and clears it when hidden', () => {
    const { banner, el } = makeBanner();
    banner.sync('robots');
    expect(el.dataset.kind).toBe('robots');
    banner.sync('boss');
    expect(el.dataset.kind).toBe('boss');
    banner.sync(null);
    expect(el.dataset.kind).toBe('');
  });

  it('writes nothing to the DOM when the kind and HUD height are unchanged', () => {
    const { banner, el } = makeBanner({ top: 0, height: 40 });
    banner.sync('robots');
    const observer = new MutationObserver(() => undefined);
    observer.observe(el, { attributes: true, childList: true, characterData: true, subtree: true });
    banner.sync('robots');
    banner.sync('robots');
    expect(observer.takeRecords()).toHaveLength(0);
    banner.sync(null);
    observer.takeRecords();
    banner.sync(null);
    expect(observer.takeRecords()).toHaveLength(0);
    observer.disconnect();
  });

  it('places its top just below the HUD and follows the HUD when it grows', () => {
    const { banner, el, hudBox } = makeBanner({ top: 0, height: 40 });
    banner.sync('robots');
    expect(el.style.top).toBe('42px');
    hudBox.height = 70; // a wrapped HUD row at a large font
    banner.sync('robots');
    expect(el.style.top).toBe('72px');
    hudBox.top = 5;
    banner.sync('boss');
    expect(el.style.top).toBe('77px');
  });
});
