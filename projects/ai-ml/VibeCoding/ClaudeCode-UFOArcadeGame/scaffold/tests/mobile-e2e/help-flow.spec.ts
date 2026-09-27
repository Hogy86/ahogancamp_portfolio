// Implements code-review-round2.md H1 (regression, required at round 3 M2): the
// "stale helpOpenedFromStart flag" bug. `AndroidPlatform.ts` tracks whether Help was
// opened via the title's Start tap (in which case "Got it" must start a run, M8.1) or
// via the title's own "Help" menu row (in which case "Got it" must NOT start a run -
// it just closes back to the title, since the player didn't ask to start). The bug:
// Start -> Help -> close (not "Got it") left the flag set, so a LATER Help opened from
// the menu row and dismissed with "Got it" incorrectly started a run underneath the
// player. Fixed in AndroidPlatform.ts/overlays.ts; this file is the missing test.
//
// code-review-round4 L2: Help has no dedicated `overlay-close` control (only
// Settings/Privacy do) - Escape is Help's only non-"Got it" dismissal, and the test
// above already covers it. A second variant that clicked `overlay-close` when present
// and called `test.skip()` otherwise always skipped for Help, so it was dead code and
// has been removed rather than kept as a permanent skip.

import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __vvsTest?: {
      snapshot: () => { state: string };
    };
  }
}

async function snapshotState(page: Page): Promise<string> {
  return page.evaluate(() => window.__vvsTest!.snapshot().state);
}

test.describe('Help dismissal does not incorrectly start a run (code-review-round2 H1)', () => {
  test('Start -> Help -> Escape -> menu Help -> Got it leaves the title on TITLE', async ({ page }) => {
    await page.goto('/?e2e=1');
    // First launch: helpSeen is false, so nothing has been persisted yet, but clear
    // explicitly per the review's required steps so this test never depends on
    // whatever ran before it.
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Start (first launch, helpSeen false) opens Help with helpOpenedFromStart = true.
    await page.locator('[data-action="start"]').click();
    await expect(page.locator('[data-action="help-dismiss"]')).toBeVisible();

    // Close via Escape (closeTopOverlay -> onHelpDismissed('closed')), NOT "Got it".
    // This must clear helpOpenedFromStart without starting a run.
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-action="help-dismiss"]')).toBeHidden();
    expect(await snapshotState(page)).toBe('TITLE');

    // Reopen Help from the title's own "Help" menu row (helpOpenedFromStart must stay
    // false - explicitly reset by the 'help' click handler regardless of the flag's
    // prior value), then dismiss with "Got it" this time.
    await page.locator('[data-action="help"]').click();
    await expect(page.locator('[data-action="help-dismiss"]')).toBeVisible();
    await page.locator('[data-action="help-dismiss"]').click();

    // The bug: this used to start a run (state -> PLAYING) because the stale flag
    // from the first Start tap was still true. The fix keeps the title up.
    expect(await snapshotState(page)).toBe('TITLE');
  });

  test('positive path: Start (first launch) -> Got it gives PLAYING', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.locator('[data-action="start"]').click();
    await expect(page.locator('[data-action="help-dismiss"]')).toBeVisible();
    await page.locator('[data-action="help-dismiss"]').click();

    expect(await snapshotState(page)).toBe('PLAYING');
  });
});
