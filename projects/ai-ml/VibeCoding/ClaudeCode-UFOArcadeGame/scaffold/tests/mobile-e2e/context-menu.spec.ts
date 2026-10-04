// Implements docs/mobile/PRD-mobile.md M3.7 (UAT O5, validation-report-round6 L2): a
// long-press anywhere on the game surface must not raise the WebView's context menu.
// On Android a long-press fires a `contextmenu` event; the app must cancel it. This
// dispatches a real, cancelable, bubbling `contextmenu` event on the playfield, a menu
// button, a touch control, the bare canvas and the body and asserts it was cancelled
// (defaultPrevented). The single listener lives on `document` (code-review-round18 L1).

import { test, expect, type Page } from '@playwright/test';

async function contextMenuPrevented(page: Page, selector: string): Promise<boolean> {
  return page.locator(selector).first().evaluate((el) => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, composed: true });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  });
}

/** A real long-press lands on whatever element is topmost at that point, so the playfield
 * case dispatches on `elementFromPoint` at the canvas centre (not on the bare <canvas>). */
async function contextMenuPreventedAtPlayfieldCentre(page: Page): Promise<{ target: string; prevented: boolean }> {
  return page.locator('#game-canvas').evaluate((canvas) => {
    const r = canvas.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) ?? canvas;
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, composed: true });
    el.dispatchEvent(event);
    return { target: `${el.tagName.toLowerCase()}#${el.id}.${el.className}`, prevented: event.defaultPrevented };
  });
}

test.describe('M3.7 - long-press must not raise a context menu', () => {
  test('contextmenu is cancelled on the playfield, a menu button and a touch control', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Menu button (title screen).
    await expect(page.locator('[data-action="start"]')).toBeVisible();
    expect(await contextMenuPrevented(page, '[data-action="start"]'), 'menu button').toBe(true);

    await page.locator('[data-action="start"]').click();
    await page.locator('[data-action="help-dismiss"]').click();
    await expect(page.locator('.touch-button--right')).toBeVisible();

    // Touch control and playfield (during play).
    expect(await contextMenuPrevented(page, '.touch-button--right'), 'touch control').toBe(true);
    expect(await contextMenuPrevented(page, '.touch-button--pause'), 'pause control').toBe(true);
    const playfield = await contextMenuPreventedAtPlayfieldCentre(page);
    expect(playfield.prevented, `playfield (topmost element at centre: ${playfield.target})`).toBe(true);

    // The bare canvas and the body are outside the click root; both must be covered too.
    expect(await contextMenuPrevented(page, '#game-canvas'), 'bare canvas').toBe(true);
    expect(await contextMenuPrevented(page, 'body'), 'body').toBe(true);
  });
});
