// Implements PRD addendum v7 F24 AC1/AC4, F25 AC1/AC3 and F26 AC2 on the Android build:
// the title's power-up guide and developer line fit with Start and the menu buttons fully
// visible and tappable, and the "How to play" rows fit with "Got it" reachable, without
// scrolling, on every device-matrix window and on the smallest playable 640x360 safe area.
// The icons are real canvases drawn by drawPowerUp, so each must have painted pixels.
// Every-element-inside-the-insets checks for many more inset sets are in menu-insets.spec.ts.

import { test, expect, type Page } from '@playwright/test';
import { DEVELOPER_EMAIL, DEVELOPER_NAME } from '../../src/config/contact';

const TITLE = '[role="dialog"][aria-label="Title screen"]';
const HELP = '[role="dialog"][aria-label="How to play"]';
const LABELS = ['Power', 'Speed', 'Shield', 'Multiplier'];
const TOLERANCE = 0.5;

const CASES = [
  { label: 'no insets', query: '', viewport: null },
  {
    // A13: the smallest playable safe height (291.5 dp) on the 640x360 phone.
    label: 'A13 640x360 insets 0,0,30,38.5',
    query: 'insets=0,0,30,38.5&cutout=0,0&',
    viewport: { width: 640, height: 360 },
  },
];

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Layout facts for one overlay: is it scrolling, its box, every button's box and whether
 * a tap at its centre reaches it, and the boxes of the non-button rows. */
async function measure(page: Page, overlaySelector: string) {
  return page.locator(overlaySelector).evaluate((overlay) => {
    const rect = (el: Element): Rect => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    };
    const buttons = Array.from(overlay.querySelectorAll<HTMLElement>('.menu-item')).map((b) => {
      const r = b.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { name: b.textContent ?? '', box: rect(b), tappable: !!hit && b.contains(hit) };
    });
    const rows = Array.from(
      overlay.querySelectorAll('.power-up-guide, .developer-contact, .power-up-help'),
    ).map(rect);
    return {
      scrollable: overlay.scrollHeight > overlay.clientHeight + 0.5,
      box: rect(overlay),
      buttons,
      rows,
    };
  });
}

const overlaps = (a: Rect, b: Rect): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** Every icon canvas in `selector` has at least one painted pixel. */
async function iconsArePainted(page: Page, selector: string): Promise<boolean[]> {
  return page.locator(selector).evaluateAll((canvases) =>
    (canvases as HTMLCanvasElement[]).map((c) => {
      const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) return true;
      return false;
    }),
  );
}

async function expectFitsWithButtonsTappable(page: Page, screen: string, selector: string) {
  const m = await measure(page, selector);
  expect(m.scrollable, `${screen}: needs scrolling`).toBe(false);
  expect(m.buttons.length).toBeGreaterThan(0);
  for (const b of m.buttons) {
    const where = `${screen} / ${b.name}`;
    expect(b.box.top, `${where}: top inside the screen`).toBeGreaterThanOrEqual(m.box.top - TOLERANCE);
    expect(b.box.bottom, `${where}: bottom inside the screen`).toBeLessThanOrEqual(m.box.bottom + TOLERANCE);
    expect(b.box.left, `${where}: left inside the screen`).toBeGreaterThanOrEqual(m.box.left - TOLERANCE);
    expect(b.box.right, `${where}: right inside the screen`).toBeLessThanOrEqual(m.box.right + TOLERANCE);
    expect(b.tappable, `${where}: a tap at its centre reaches it`).toBe(true);
    for (const row of m.rows) expect(overlaps(b.box, row), `${where}: overlaps a guide row`).toBe(false);
  }
  for (const row of m.rows) {
    expect(row.top, `${screen}: guide row top inside`).toBeGreaterThanOrEqual(m.box.top - TOLERANCE);
    expect(row.bottom, `${screen}: guide row bottom inside`).toBeLessThanOrEqual(m.box.bottom + TOLERANCE);
  }
}

for (const { label, query, viewport } of CASES) {
  test.describe(`F24/F25/F26 power-up guide (${label})`, () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(viewport !== null && testInfo.project.name !== '640x360', 'a 640x360-only case');
      if (viewport) await page.setViewportSize(viewport);
      await page.goto(`/?${query}e2e=1`);
      await expect(page.locator('.rotate-prompt')).toBeHidden();
    });

    test('title: four painted icons with labels, the developer line, Start and menu tappable', async ({
      page,
    }) => {
      const title = page.locator(TITLE);
      await expect(title.locator('.power-up-guide li')).toHaveText(LABELS);
      await expect(title.locator('.power-up-guide canvas[aria-hidden="true"]')).toHaveCount(4);
      expect(await iconsArePainted(page, `${TITLE} .power-up-guide canvas`)).toEqual([
        true,
        true,
        true,
        true,
      ]);
      await expect(title.locator('.developer-contact')).toHaveText(
        `Developer: ${DEVELOPER_NAME} · ${DEVELOPER_EMAIL}`,
      );
      for (const action of ['start', 'help', 'settings', 'quit']) {
        await expect(title.locator(`[data-action="${action}"]`)).toBeVisible();
      }
      await expectFitsWithButtonsTappable(page, 'Title', TITLE);
    });

    test('How to play: four painted rows with sentences, "Got it" tappable', async ({ page }) => {
      await page.locator('[data-action="help"]').click();
      const help = page.locator(HELP);
      await expect(help).toBeVisible();
      await expect(help.locator('.power-up-help__label')).toHaveText(LABELS);
      await expect(help.locator('.power-up-help__sentence')).toHaveCount(4);
      expect(await iconsArePainted(page, `${HELP} .power-up-help canvas`)).toEqual([
        true,
        true,
        true,
        true,
      ]);
      await expectFitsWithButtonsTappable(page, 'Help', HELP);
    });
  });
}
