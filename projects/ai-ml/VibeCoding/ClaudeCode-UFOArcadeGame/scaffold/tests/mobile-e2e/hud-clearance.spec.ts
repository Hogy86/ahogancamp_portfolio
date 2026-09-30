// Implements design-review-round4.md N1 and PRD-mobile M2.4: at level start no visible HUD
// panel may overlap the first formation row (the enlarged 12 sp Android panels used to
// cover the top robots and a thrown shield). Enemy positions come from the read-only
// `__vvsTest.snapshot()` and are mapped through the canvas's on-screen box, so the check
// holds at every playfield scale. Runs on every device-matrix project, with and without
// real insets (30,30,24,32).

import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __vvsTest?: {
      snapshot: () => {
        state: string;
        enemies: {
          row: number;
          alive: boolean;
          x: number;
          y: number;
          width: number;
          height: number;
        }[];
      };
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

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function intersects(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

for (const insets of ['', 'insets=30,30,24,32&']) {
  test(`no HUD panel overlaps the first formation row across its whole width at level start (${insets || 'no insets'})`, async ({
    page,
  }) => {
    await page.goto(`/?${insets}e2e=1`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await startRun(page);

    const canvas = await page.locator('#game-canvas').boundingBox();
    expect(canvas).not.toBeNull();
    const scale = canvas!.height / PLAYFIELD_HEIGHT;

    const firstRow = (await snapshot(page)).enemies.filter((e) => e.alive && e.row === 0);
    expect(firstRow.length, 'the first row has robots').toBeGreaterThan(0);
    const top = Math.min(...firstRow.map((e) => e.y));
    const bottom = Math.max(...firstRow.map((e) => e.y + e.height));
    // The formation drifts sideways under the HUD, so the row is the full playfield width
    // (level 1 starts narrow and centred, which would hide an overlap that appears later).
    const rowBox: Box = {
      x: canvas!.x,
      y: canvas!.y + top * scale,
      width: canvas!.width,
      height: (bottom - top) * scale,
    };

    const panels = await page.locator('.hud-panel').evaluateAll((els) =>
      els
        .filter((el) => getComputedStyle(el).display !== 'none')
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }),
    );
    expect(panels.length).toBeGreaterThan(0);
    for (const panel of panels) {
      expect(
        intersects(panel, rowBox),
        `HUD panel ${JSON.stringify(panel)} vs first row ${JSON.stringify(rowBox)}`,
      ).toBe(false);
    }
  });
}
