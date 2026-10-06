// Implements design-review-round3.md B1/F1/F10 and PRD-mobile M2.4 ("nothing covers
// ShieldMan's row"): the gameplay hint (`#control-text`) must never overlap the row
// ShieldMan moves along, and the HUD/hint must not bleed through the menus. Runs on every
// device-matrix project; the ShieldMan row is read from the live world (`snapshot()`) and
// mapped through the canvas's on-screen box, so it holds at every playfield scale.

import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __vvsTest?: {
      snapshot: () => { state: string; player: { x: number; y: number; width: number; height: number } };
    };
  }
}

const PLAYFIELD_HEIGHT = 600;

async function snapshot(page: Page) {
  return page.evaluate(() => window.__vvsTest!.snapshot());
}

async function startRun(page: Page): Promise<void> {
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="help-dismiss"]').click();
  await expect.poll(async () => (await snapshot(page)).state).toBe('PLAYING');
}

async function heroRowTop(page: Page): Promise<number> {
  const canvas = await page.locator('#game-canvas').boundingBox();
  expect(canvas).not.toBeNull();
  const scale = canvas!.height / PLAYFIELD_HEIGHT;
  return canvas!.y + (await snapshot(page)).player.y * scale;
}

const INSET_CASES = ['', 'insets=30,30,24,32&'];

for (const insets of INSET_CASES) {
  test.describe(`hint and HUD placement (${insets || 'no insets'})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/?${insets}e2e=1`);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
    });

    test('the hint is visible while playing and never overlaps ShieldMan\'s row', async ({ page }) => {
      await startRun(page);
      const hint = page.locator('#control-text');
      await expect(hint).toBeVisible();
      await expect(hint).toContainText('THROW');

      const hintBox = await hint.boundingBox();
      expect(hintBox).not.toBeNull();
      const heroTop = await heroRowTop(page);
      expect(hintBox!.y + hintBox!.height, 'hint bottom above the hero row top').toBeLessThanOrEqual(heroTop);
    });

    test('the hint is hidden on the title and on the pause menu', async ({ page }) => {
      await expect(page.locator('#control-text')).toBeHidden();
      await startRun(page);
      await page.locator('.touch-button--pause').click();
      await expect.poll(async () => (await snapshot(page)).state).toBe('PAUSED');
      await expect(page.locator('#control-text')).toBeHidden();
      await expect(page.locator('#hud-root')).toBeVisible();
    });

    test('the HUD is hidden on the title and the empty power-up panel never shows', async ({ page }) => {
      await expect(page.locator('#hud-root')).toBeHidden();
      await startRun(page);
      await expect(page.locator('#hud-root')).toBeVisible();
      const visiblePanels = await page
        .locator('.hud-panel')
        .evaluateAll((els) => els.filter((el) => getComputedStyle(el).display !== 'none').length);
      expect(visiblePanels, 'score, lives, level, power - not the empty effects panel').toBe(4);
    });
  });
}
