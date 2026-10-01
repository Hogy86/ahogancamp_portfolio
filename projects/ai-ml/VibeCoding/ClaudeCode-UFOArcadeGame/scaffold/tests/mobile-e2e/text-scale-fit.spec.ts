// Implements code-review-round15.md M1 and M2 (PRD-mobile M2.11: at the largest system
// font, HUD and controls do not overflow, clip or overlap controls). The WebView's text
// zoom is capped at 130% (architecture §7.3), which is approximated here by multiplying
// the font size of the HUD panels / touch buttons with an injected stylesheet.
//
// M1: the five HUD panels get the longest realistic strings (test-only DOM text, no game
// state change); every visible panel must lie inside the canvas's x-range and intersect
// no touch button or other panel, at the default font and at 1.3x.
// M2: the THROW and WAIT labels must fit inside the THROW button's border box at the
// default font and at 1.3x.

import { test, expect, type Page } from '@playwright/test';

const HUD_TEXT = [
  'Score: 99999',
  'Lives: 4 (+1 LIFE)',
  'Level: 10/10',
  'Power ×9.99',
  '3x Speed 8.0s',
];

const FONT_SCALES = [1, 1.3];
const INSET_QUERIES = ['', 'insets=30,30,24,32&'];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function intersects(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function startRun(page: Page): Promise<void> {
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="help-dismiss"]').click();
  await expect(page.locator('.touch-button--throw')).toBeVisible();
}

/** Multiplies the on-screen font size of the HUD panels and touch buttons by `factor`,
 * on top of the Android floor rule (the same expression android.css uses). */
async function applyFontScale(page: Page, factor: number): Promise<void> {
  await page.addStyleTag({
    content: `
      html.platform-android .hud-panel {
        font-size: calc(max(15px, calc(12px / var(--pf-scale, 1))) * ${factor}) !important;
      }
      html.platform-android .touch-button { font-size: ${20 * factor}px !important; }
      /* The THROW/WAIT <text> carries its own font-size attribute (13), which beats the
         inherited button size, so scale the element itself (code-review-round16 L3). */
      html.platform-android .touch-glyph-word text { font-size: ${13 * factor}px !important; }
    `,
  });
}

for (const insets of INSET_QUERIES) {
  for (const factor of FONT_SCALES) {
    test(`HUD panels stay inside the playfield and clear of the controls with the longest strings (font x${factor}, ${insets || 'no insets'})`, async ({
      page,
    }) => {
      await page.goto(`/?${insets}e2e=1`);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await startRun(page);
      await applyFontScale(page, factor);

      // Set the text and measure in one evaluate so a HUD refresh cannot interleave.
      const { panels, canvas, buttons } = await page.evaluate((texts) => {
        const els = Array.from(document.querySelectorAll<HTMLElement>('.hud-panel'));
        els.forEach((el, i) => {
          el.textContent = texts[i] ?? '';
        });
        const box = (el: Element): Box => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        };
        return {
          panels: els.filter((el) => getComputedStyle(el).display !== 'none').map(box),
          canvas: box(document.querySelector('#game-canvas')!),
          buttons: Array.from(document.querySelectorAll('.touch-button')).map(box),
        };
      }, HUD_TEXT);

      expect(panels).toHaveLength(HUD_TEXT.length);
      panels.forEach((panel, i) => {
        for (const other of panels.slice(i + 1)) {
          expect(
            intersects(panel, other),
            `HUD panels overlap each other: ${JSON.stringify(panel)} vs ${JSON.stringify(other)}`,
          ).toBe(false);
        }
      });
      for (const panel of panels) {
        expect(panel.x, `panel ${JSON.stringify(panel)} left of canvas`).toBeGreaterThanOrEqual(
          canvas.x - 0.5,
        );
        expect(
          panel.x + panel.width,
          `panel ${JSON.stringify(panel)} right of canvas ${JSON.stringify(canvas)}`,
        ).toBeLessThanOrEqual(canvas.x + canvas.width + 0.5);
        for (const button of buttons) {
          expect(
            intersects(panel, button),
            `HUD panel ${JSON.stringify(panel)} vs button ${JSON.stringify(button)}`,
          ).toBe(false);
        }
      }
    });
  }
}

for (const insets of INSET_QUERIES) {
  for (const factor of FONT_SCALES) {
    test(`THROW and WAIT labels fit inside the THROW button (font x${factor}, ${insets || 'no insets'})`, async ({
      page,
    }) => {
      await page.goto(`/?${insets}e2e=1`);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await startRun(page);
      await applyFontScale(page, factor);

      await page.waitForFunction(
        () =>
          (
            window as unknown as {
              __vvsTest: { snapshot: () => { levelIntroRemaining: number } };
            }
          ).__vvsTest.snapshot().levelIntroRemaining === 0,
      );
      const throwButton = page.locator('.touch-button--throw');
      const label = throwButton.locator('text');
      const svg = throwButton.locator('.touch-glyph-word');

      const assertFits = async (word: string): Promise<void> => {
        await expect(label).toHaveText(word);
        const button = (await throwButton.boundingBox())!;
        const text = (await label.boundingBox())!;
        const box = (await svg.boundingBox())!;
        // Guard against a vacuous x1.3 case: the label really is scaled.
        const fontSize = await label.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        expect(fontSize, `${word} computed font-size`).toBeCloseTo(13 * factor, 1);
        const border = 2;
        expect(text.x, `${word} left edge`).toBeGreaterThanOrEqual(button.x + border);
        expect(text.x + text.width, `${word} right edge`).toBeLessThanOrEqual(
          button.x + button.width - border,
        );
        // The SVG clips overflow, so vertical overflow would be silent.
        expect(text.height, `${word} height vs svg`).toBeLessThanOrEqual(box.height);
        expect(text.y, `${word} top edge`).toBeGreaterThanOrEqual(box.y - 0.5);
        expect(text.y + text.height, `${word} bottom edge`).toBeLessThanOrEqual(
          box.y + box.height + 0.5,
        );
      };

      await assertFits('THROW');

      const box = (await throwButton.boundingBox())!;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await expect(throwButton).toHaveClass(/not-ready/);
      await assertFits('WAIT');
    });
  }
}
