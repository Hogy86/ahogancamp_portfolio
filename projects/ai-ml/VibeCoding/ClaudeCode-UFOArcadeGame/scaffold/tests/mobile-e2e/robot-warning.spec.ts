// Implements UAT round 2 F4 (M2.3, M2.3b rule 2, M2.6; F3 AC6): the "WARNING: ROBOTS
// APPROACHING" and "BOSS INCOMING" banners must be fully visible, legible (>= 12 dp) and must
// not intersect any HUD panel, with a power-up timer pill, a six-digit score, and at 1.3x
// font, on every device-matrix window plus the A13 window (640x360, insets 0,0,30,38.5).
//
// The real trigger (formation one row above ShieldMan) takes minutes of play and the
// `?e2e=1` hook has no setters, so this test navigates with `&banner=robots|boss`, which
// only forces the Android DOM banner visible (no world change). It therefore proves the
// layout, not the trigger rule; the mapping is unit-tested in src/platform/android/topBanner.test.ts.
//
// PRD addendum v7 F27 AC2 (code-review-round21 L4, A14 §10.1): the banner's `role="status"`,
// "still shown after pause", the inset rows 30,30,28.2,32 / 29.7,29.7,28.2,32 / 0,48,24,0 and
// the 640x368 window with insets 0,0,24,48.

import { test, expect, type Page } from '@playwright/test';

const HUD_TEXT = [
  'Score: 999999',
  'Lives: 4 (+1 LIFE)',
  'Level: 10/10',
  'Power ×18.90',
  '3x Speed 8.0s',
];
const FONT_SCALES = [1, 1.3];
// `insets=left,right,top,bottom` (GameShell web fallback). `viewport` is set only for the
// A13 window, which runs in the 640x360 project only.
const CASES = [
  { label: 'no insets', query: '', top: 0, viewport: null },
  { label: 'insets 30,30,24,32', query: 'insets=30,30,24,32&', top: 24, viewport: null },
  { label: 'insets 30,30,28.2,32', query: 'insets=30,30,28.2,32&', top: 28.2, viewport: null },
  {
    label: 'insets 29.7,29.7,28.2,32',
    query: 'insets=29.7,29.7,28.2,32&',
    top: 28.2,
    viewport: null,
  },
  { label: 'insets 0,48,24,0', query: 'insets=0,48,24,0&', top: 24, viewport: null },
  {
    label: 'A13 window 640x360 insets 0,0,30,38.5',
    query: 'insets=0,0,30,38.5&cutout=0,0&',
    top: 30,
    viewport: { width: 640, height: 360 },
  },
  {
    label: 'M2.3c (f2) window 640x368 insets 0,0,24,48',
    query: 'insets=0,0,24,48&',
    top: 24,
    viewport: { width: 640, height: 368 },
  },
];

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

/** The `?e2e=1` read-only hook (AndroidPlatform.installE2eTestHook). */
type E2eWindow = { __vvsTest: { snapshot: () => { state: string } } };

const BANNERS = [
  { kind: 'robots', text: 'WARNING: ROBOTS APPROACHING' },
  { kind: 'boss', text: 'BOSS INCOMING' },
];

for (const { kind, text } of BANNERS) {
  for (const { label, query, top: insetTop, viewport } of CASES) {
    for (const factor of FONT_SCALES) {
      test(`the ${kind} banner is whole, legible and clear of every HUD panel (font x${factor}, ${label})`, async ({
        page,
      }, testInfo) => {
        test.skip(
          viewport !== null && testInfo.project.name !== '640x360',
          'the fixed-viewport windows run in the 640x360 project only',
        );
        if (viewport) await page.setViewportSize(viewport);
        await page.goto(`/?${query}e2e=1&banner=${kind}`);
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await startRun(page);
        if (factor !== 1) {
          // Simulates the system font-size setting. At factor 1 NOTHING is overridden, so
          // the banner's own CSS rule is what the font assertion below measures.
          await page.addStyleTag({
            content: `
          html.platform-android .hud-panel, html.platform-android #top-banner {
            font-size: calc(max(15px, calc(12px / var(--pf-scale, 1))) * ${factor}) !important;
          }`,
          });
        }
        // The HUD only rewrites a panel when its value changes, so these texts persist.
        await page.evaluate(
          ({ texts }) => {
            document.querySelectorAll<HTMLElement>('.hud-panel').forEach((el, i) => {
              el.textContent = texts[i] ?? '';
            });
          },
          { texts: HUD_TEXT },
        );
        const warning = page.locator('#top-banner');
        await expect(warning).toBeVisible();
        await expect(warning).toHaveText(text);
        await expect(warning).toHaveAttribute('role', 'status');
        await expect(warning).toHaveAttribute('data-kind', kind);
        await expect(page.locator('#top-banner')).toHaveCount(1);
        // Let the per-frame sync place the row under the (now tall) HUD.
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        );

        const m = await page.evaluate(() => {
          const box = (el: Element): Box => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          };
          const w = document.querySelector<HTMLElement>('#top-banner')!;
          const wr = w.getBoundingClientRect();
          const hit = document.elementFromPoint(wr.x + wr.width / 2, wr.y + wr.height / 2);
          return {
            warn: box(w),
            panels: Array.from(document.querySelectorAll('.hud-panel'))
              .filter((el) => getComputedStyle(el).display !== 'none')
              .map(box),
            canvas: box(document.querySelector('#game-canvas')!),
            fontPx: parseFloat(getComputedStyle(w).fontSize),
            scale: parseFloat(
              getComputedStyle(document.documentElement).getPropertyValue('--pf-scale'),
            ),
            pointerEvents: getComputedStyle(w).pointerEvents,
            hitIsBanner: !!hit && (hit === w || w.contains(hit)),
          };
        });
        const { warn, panels, canvas } = m;

        expect(panels).toHaveLength(HUD_TEXT.length);
        expect(warn.x, 'left edge inside the playfield').toBeGreaterThanOrEqual(canvas.x);
        expect(warn.x + warn.width, 'right edge inside the playfield').toBeLessThanOrEqual(
          canvas.x + canvas.width,
        );
        expect(warn.y, 'top at or below the top inset').toBeGreaterThanOrEqual(insetTop - 0.01);
        expect(warn.y + warn.height, 'bottom inside the canvas').toBeLessThanOrEqual(
          canvas.y + canvas.height + 0.01,
        );
        expect(
          Math.abs(warn.x + warn.width / 2 - (canvas.x + canvas.width / 2)),
          'horizontally centred on the playfield',
        ).toBeLessThan(1);
        expect(m.pointerEvents).toBe('none');
        expect(m.hitIsBanner, 'a touch at the banner centre reaches what is beneath').toBe(false);
        for (const panel of panels) {
          expect(
            intersects(warn, panel),
            `warning ${JSON.stringify(warn)} vs HUD ${JSON.stringify(panel)}`,
          ).toBe(false);
        }
        // M2.6: at least 12 dp on screen (logical font px x playfield scale), times the
        // simulated font factor, minus a small rounding tolerance.
        expect(m.scale).toBeGreaterThan(0);
        expect(m.fontPx * m.scale, 'banner font in dp').toBeGreaterThanOrEqual(12 * factor - 0.1);
        testInfo.annotations.push({
          type: 'clearance',
          description: `gap below lowest HUD panel: ${(warn.y - Math.max(...panels.map((p) => p.y + p.height))).toFixed(1)} css px`,
        });
      });
    }
  }
}

// topBannerFor keeps the banner in PAUSED, like the dimmed HUD (F27 AC2, A14 §10.1).
for (const { kind, text } of BANNERS) {
  test(`the ${kind} banner is still shown after pausing`, async ({ page }) => {
    await page.goto(`/?e2e=1&banner=${kind}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await startRun(page);
    const warning = page.locator('#top-banner');
    await expect(warning).toBeVisible();
    await page.locator('.touch-button--pause').click();
    await expect(page.locator('[role="dialog"][aria-label="Paused"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as E2eWindow).__vvsTest.snapshot().state)).toBe(
      'PAUSED',
    );
    await expect(warning).toBeVisible();
    await expect(warning).toHaveText(text);
    await expect(warning).toHaveAttribute('role', 'status');
  });
}
