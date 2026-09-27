// Implements code-review-round1.md C1 required fix 4: a Playwright assertion at every
// §10.1 device-matrix viewport (parametrized via playwright.mobile.config.ts's
// `projects`), with and without `?insets=24,24,0,24` (the planning insets §6.3
// worked). Asserts ◀/▶/THROW/PAUSE meet their minimum touch-target size, no control
// rect intersects `#app-root` (C1's core bug - controls scaled/clipped inside the
// playfield), no control lies inside the insets, and every menu item is >= 48px tall
// (M3.8).

import { test, expect, type Page } from '@playwright/test';

const CONTROL_SELECTORS = {
  left: '.touch-button--left',
  right: '.touch-button--right',
  throw: '.touch-button--throw',
  pause: '.touch-button--pause',
} as const;

/** §6.2/§6.4: only the 640x360 profile falls back to B=56; every wider/taller
 * profile in the device matrix uses the default B=64. */
function minMoveThrowSize(viewportWidth: number, viewportHeight: number): number {
  return viewportWidth === 640 && viewportHeight === 360 ? 56 : 64;
}

async function startRun(page: Page): Promise<void> {
  await page.locator('[data-action="start"]').click();
  // First launch: Start opens Help - "Got it" (help-dismiss) is what actually starts
  // the run (H2's fixed behavior, since it was opened from Start).
  await page.locator('[data-action="help-dismiss"]').click();
  // Touch controls only become visible once `world.state === 'PLAYING'` is observed
  // on a rendered frame (AndroidPlatform.onFrame).
  await expect(page.locator(CONTROL_SELECTORS.throw)).toBeVisible();
}

function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

for (const insetsQuery of ['', 'insets=24,24,0,24']) {
  const label = insetsQuery || 'no insets';

  test(`touch controls and menu items meet C1/M3.8 geometry (${label})`, async ({ page }) => {
    const query = insetsQuery ? `?${insetsQuery}&e2e=1` : '?e2e=1';
    await page.goto(`/${query}`);

    const viewport = page.viewportSize();
    if (!viewport) throw new Error('no viewport configured for this project');
    const minMoveThrow = minMoveThrowSize(viewport.width, viewport.height);

    // §6.3 planning insets, or 0 if the query string above did not set any (GameShell's
    // web fallback default, src/platform/android/GameShell.ts).
    const insets = insetsQuery
      ? { left: 24, right: 24, top: 0, bottom: 24 }
      : { left: 0, right: 0, top: 0, bottom: 0 };

    // Menu items (title screen) are already visible before starting a run. Scoped to
    // the title dialog specifically - `.menu-item` also matches the Help/Settings/
    // Privacy shell overlays' buttons, which exist in the DOM but are hidden
    // (`display: none`) until opened, and `boundingBox()` returns null for those.
    const menuItems = page.getByRole('dialog', { name: 'Title screen' }).locator('.menu-item');
    // code-review-round4 M1: `.count()` does not auto-wait, and `ScreenController`
    // (like the shell overlays) is only mounted once `bootstrap()` runs after
    // `loadPlatform()`'s dynamic import resolves, which can still be pending when
    // `page.goto` resolves on `load`. Wait for the first item to attach first.
    await expect(menuItems.first()).toBeAttached();
    const menuCount = await menuItems.count();
    expect(menuCount).toBeGreaterThan(0);
    for (let i = 0; i < menuCount; i += 1) {
      const box = await menuItems.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }

    await startRun(page);

    const appRootBox = await page.locator('#app-root').boundingBox();
    expect(appRootBox).not.toBeNull();

    for (const [name, selector] of Object.entries(CONTROL_SELECTORS)) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${name} control has no bounding box`).not.toBeNull();
      const minSize = name === 'pause' ? 48 : minMoveThrow;
      expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(minSize);
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(minSize);

      // C1: no control may lie inside the scaled/clipped playfield rectangle.
      expect(rectsIntersect(box!, appRootBox!), `${name} intersects #app-root`).toBe(false);

      // No control may lie INSIDE the insets (i.e. its rect must lie fully within the
      // inset-safe rectangle of the viewport).
      const safeLeft = insets.left;
      const safeTop = insets.top;
      const safeRight = viewport.width - insets.right;
      const safeBottom = viewport.height - insets.bottom;
      expect(box!.x, `${name} left edge inside the left inset`).toBeGreaterThanOrEqual(safeLeft - 0.5);
      expect(box!.y, `${name} top edge inside the top inset`).toBeGreaterThanOrEqual(safeTop - 0.5);
      expect(box!.x + box!.width, `${name} right edge inside the right inset`).toBeLessThanOrEqual(safeRight + 0.5);
      expect(box!.y + box!.height, `${name} bottom edge inside the bottom inset`).toBeLessThanOrEqual(safeBottom + 0.5);
    }
  });
}
