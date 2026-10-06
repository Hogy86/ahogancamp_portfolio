// Tests code-review-round20 L4: which Android DOM banner the world calls for (same gates as
// the canvas words on web), and the DOM element's text and status role.

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
