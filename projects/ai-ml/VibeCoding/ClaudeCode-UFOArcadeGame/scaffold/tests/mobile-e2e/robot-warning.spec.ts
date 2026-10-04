// Implements UAT round 2 F4 (M2.3, M2.3b rule 2, M2.6; F3 AC6): the "WARNING: ROBOTS
// APPROACHING" and "BOSS INCOMING" banners must be fully visible and must not intersect any HUD panel, with a
// power-up timer pill, a five-digit score, and at 1.3x font, on every device-matrix window.
//
// The real trigger (formation one row above ShieldMan) takes minutes of play and the
// read-only `?e2e=1` hook cannot reach it, so this test uses `__vvsTest.showTopBanner`,
// which only forces the Android DOM banner visible (no world change). It therefore proves the
// layout, not the trigger rule, which FormationSystem's own unit tests cover.

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

const BANNERS = [
  { kind: 'robots', text: 'WARNING: ROBOTS APPROACHING' },
  { kind: 'boss', text: 'BOSS INCOMING' },
];

for (const { kind, text } of BANNERS) {
  for (const insets of INSET_QUERIES) {
    for (const factor of FONT_SCALES) {
      test(`the ${kind} banner is whole and clear of every HUD panel (font x${factor}, ${insets || 'no insets'})`, async ({
        page,
      }) => {
        await page.goto(`/?${insets}e2e=1`);
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await startRun(page);
        await page.addStyleTag({
          content: `
          html.platform-android .hud-panel, html.platform-android #top-banner {
            font-size: calc(max(15px, calc(12px / var(--pf-scale, 1))) * ${factor}) !important;
          }`,
        });
        // The HUD only rewrites a panel when its value changes, so these texts persist.
        await page.evaluate(
          ({ texts, kind }) => {
            document.querySelectorAll<HTMLElement>('.hud-panel').forEach((el, i) => {
              el.textContent = texts[i] ?? '';
            });
            (
              window as unknown as { __vvsTest: { showTopBanner: (kind: string | null) => void } }
            ).__vvsTest.showTopBanner(kind);
          },
          { texts: HUD_TEXT, kind },
        );
        const warning = page.locator('#top-banner');
        await expect(warning).toBeVisible();
        await expect(warning).toHaveText(text);
        // Forcing the other kind swaps the one element, so both can never show together.
        await expect(page.locator('#top-banner')).toHaveCount(1);
        // Let the per-frame sync place the row under the (now tall) HUD.
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        );

        const { warn, panels, canvas, fits, fontPx } = await page.evaluate(() => {
          const box = (el: Element): Box => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          };
          const w = document.querySelector<HTMLElement>('#top-banner')!;
          return {
            warn: box(w),
            panels: Array.from(document.querySelectorAll('.hud-panel'))
              .filter((el) => getComputedStyle(el).display !== 'none')
              .map(box),
            canvas: box(document.querySelector('#game-canvas')!),
            fits: w.scrollWidth <= w.clientWidth,
            fontPx: parseFloat(getComputedStyle(w).fontSize),
          };
        });

        expect(panels).toHaveLength(HUD_TEXT.length);
        expect(fits, 'text not clipped inside its own box').toBe(true);
        expect(warn.x, 'left edge inside the playfield').toBeGreaterThanOrEqual(canvas.x);
        expect(warn.x + warn.width, 'right edge inside the playfield').toBeLessThanOrEqual(
          canvas.x + canvas.width,
        );
        for (const panel of panels) {
          expect(
            intersects(warn, panel),
            `warning ${JSON.stringify(warn)} vs HUD ${JSON.stringify(panel)}`,
          ).toBe(false);
        }
        // As legible as the HUD text: same font floor (the HUD uses the same expression).
        const hudPx = await page
          .locator('.hud-panel')
          .first()
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        expect(fontPx).toBeGreaterThanOrEqual(hudPx);
        test.info().annotations.push({
          type: 'clearance',
          description: `gap below lowest HUD panel: ${(warn.y - Math.max(...panels.map((p) => p.y + p.height))).toFixed(1)} css px`,
        });
      });
    }
  }
}
