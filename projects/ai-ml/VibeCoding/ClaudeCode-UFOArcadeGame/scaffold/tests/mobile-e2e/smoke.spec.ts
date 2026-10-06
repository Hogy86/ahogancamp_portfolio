// Implements docs/mobile/architecture/mobile-architecture.md §10.1 (minimum coverage):
// a starter smoke spec proving the phone-emulation harness itself works end to end
// (AndroidPlatform loads under Chromium mobile emulation via GameShell's web fallback,
// the title renders, and no network request escapes same-origin, M11.1). The full
// device-matrix/layout/40-40-swipe/back-mapping/help/settings suite §10.1 requires is
// mobile-junior-tester's step-9 deliverable, not duplicated here.

import { test, expect } from '@playwright/test';

test('title screen renders under touch/mobile emulation with no network requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (req) => requests.push(req.url()));

  await page.goto('/?e2e=1');

  // Scoped to the title screen specifically: Help/Settings/Privacy also have an <h1>
  // (just not visible yet), since all shell overlays mount once at init (§8.6/§8.7).
  const titleScreen = page.getByRole('dialog', { name: 'Title screen' });
  await expect(titleScreen.locator('h1')).toHaveText('Shield vs Robots');
  await expect(page.locator('[data-action="start"]')).toBeVisible();

  const baseOrigin = new URL(page.url()).origin;
  const offOrigin = requests.filter((url) => !url.startsWith(baseOrigin) && !url.startsWith('data:'));
  expect(offOrigin, `unexpected off-origin requests: ${offOrigin.join(', ')}`).toHaveLength(0);
});
