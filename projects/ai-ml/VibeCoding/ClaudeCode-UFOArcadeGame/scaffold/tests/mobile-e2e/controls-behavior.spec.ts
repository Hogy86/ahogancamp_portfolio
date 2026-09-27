// Implements code-review-round2.md C1/C2 required fixes and I3: `controls-layout.spec.ts`
// only measured element RECTANGLES, which passed even while the controls were fully
// covered by `#overlay-root` (C1) and the Privacy overlay was permanently on screen
// (C2). These tests assert actual BEHAVIOR instead:
// - `elementFromPoint` at each control's centre resolves to that control, not
//   `#overlay-root` sitting on top of it (C1), at every device-matrix viewport, with
//   and without insets.
// - Holding ◀ for 500ms via a real touch event actually moves the player
//   (`world.player.x` changes), using the read-only `__vvsTest` hook (§10 item 3).
// - Tapping THROW actually spawns a shield (`world.shields.length === 1`).
// - Tapping PAUSE actually pauses (`world.state === 'PAUSED'`).
// - Every `#shell-overlay-root` child has computed `display: none` on cold load (C2),
// and the full Title -> Settings -> Privacy -> Close -> Settings path works.

import { test, expect, type Page, type CDPSession } from '@playwright/test';

declare global {
  interface Window {
    __vvsTest?: {
      snapshot: () => {
        state: string;
        player: { x: number };
        shields: unknown[];
        levelIntroRemaining: number;
      };
      playerXLog: () => number[];
    };
  }
}

const CONTROL_SELECTORS = {
  left: '.touch-button--left',
  right: '.touch-button--right',
  throw: '.touch-button--throw',
  pause: '.touch-button--pause',
} as const;

async function startRun(page: Page): Promise<void> {
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="help-dismiss"]').click();
  await expect(page.locator(CONTROL_SELECTORS.throw)).toBeVisible();
}

/** F18: nobody moves or fires during the ~3s level-intro countdown (GameLoop's
 * `levelIntroRemaining` gate) - waiting for it to clear is required before any move/
 * throw assertion, or the test would fail for the WRONG reason (the intro gate, not a
 * real input bug). */
async function waitForLevelIntroToClear(page: Page): Promise<void> {
  await expect
    .poll(async () => (await snapshot(page)).levelIntroRemaining, 'levelIntroRemaining')
    .toBe(0);
}

async function snapshot(page: Page) {
  return page.evaluate(() => window.__vvsTest!.snapshot());
}

async function centerOf(page: Page, selector: string): Promise<{ x: number; y: number }> {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`${selector} has no bounding box`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** A real touch, not a synthetic/untrusted DOM event - CDP `Input.dispatchTouchEvent`
 * drives Chromium's actual touch input pipeline, which is what `setPointerCapture`/
 * pointer-event listeners in `TouchControls.ts` respond to. */
async function touchDown(client: CDPSession, x: number, y: number): Promise<void> {
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  });
}

async function touchUp(client: CDPSession): Promise<void> {
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function tap(client: CDPSession, x: number, y: number): Promise<void> {
  await touchDown(client, x, y);
  await touchUp(client);
}

for (const insetsQuery of ['', 'insets=24,24,0,24']) {
  const label = insetsQuery || 'no insets';

  test(`elementFromPoint hits every control, not #overlay-root (${label})`, async ({ page }) => {
    const query = insetsQuery ? `?${insetsQuery}&e2e=1` : '?e2e=1';
    await page.goto(`/${query}`);
    await startRun(page);

    for (const [name, selector] of Object.entries(CONTROL_SELECTORS)) {
      const { x, y } = await centerOf(page, selector);
      const hitId = await page.evaluate(
        ([px, py]) => {
          const el = document.elementFromPoint(px, py);
          return el ? el.id || el.className : null;
        },
        [x, y] as const,
      );
      // code-review-round2 C1: this used to resolve to `overlay-root` (empty but
      // still on top and `pointer-events: auto`) at every control's centre.
      expect(hitId, `${name} centre resolved to "${hitId}", not the control`).not.toBe('overlay-root');
      const isControl = await page.evaluate(
        ([px, py, sel]) => {
          const el = document.elementFromPoint(px, py);
          return !!el?.closest(sel as string);
        },
        [x, y, selector] as const,
      );
      expect(isControl, `${name} centre did not resolve inside ${selector}`).toBe(true);
    }
  });
}

test('holding the LEFT control for 500ms moves the player (C1)', async ({ page }) => {
  await page.goto('/?e2e=1');
  await startRun(page);
  await waitForLevelIntroToClear(page);

  const before = await snapshot(page);
  const { x, y } = await centerOf(page, CONTROL_SELECTORS.left);

  const client = await page.context().newCDPSession(page);
  await touchDown(client, x, y);
  await page.waitForTimeout(500);
  const during = await snapshot(page);
  await touchUp(client);

  // code-review-round2 C1: "A CDP touch hold on ◀ for 500ms: player x stays 380 ->
  // 380" was the exact reproduction of the bug this test guards against.
  expect(during.player.x, 'player.x did not change while holding the left control').not.toBe(before.player.x);
  expect(during.player.x).toBeLessThan(before.player.x);
});

test('tapping THROW spawns a shield (C1)', async ({ page }) => {
  await page.goto('/?e2e=1');
  await startRun(page);
  await waitForLevelIntroToClear(page);

  expect((await snapshot(page)).shields.length).toBe(0);

  const { x, y } = await centerOf(page, CONTROL_SELECTORS.throw);
  const client = await page.context().newCDPSession(page);
  await tap(client, x, y);

  await expect
    .poll(async () => (await snapshot(page)).shields.length, 'shields.length after tapping THROW')
    .toBe(1);
});

test('tapping PAUSE pauses the game (C1)', async ({ page }) => {
  await page.goto('/?e2e=1');
  await startRun(page);
  await waitForLevelIntroToClear(page);

  expect((await snapshot(page)).state).toBe('PLAYING');

  const { x, y } = await centerOf(page, CONTROL_SELECTORS.pause);
  const client = await page.context().newCDPSession(page);
  await tap(client, x, y);

  await expect.poll(async () => (await snapshot(page)).state, 'state after tapping PAUSE').toBe('PAUSED');
});

test('the Privacy overlay is hidden on cold load, and the full open/close path works (C2)', async ({ page }) => {
  await page.goto('/?e2e=1');

  // code-review-round4 M1: `page.goto` resolves on `load`, but the shell overlays
  // are mounted by the dynamically imported `AndroidPlatform` chunk, which can still
  // be loading when `load` fires. Wait for the mount before reading computed styles,
  // or this races and intermittently sees zero children.
  await expect(page.locator('#shell-overlay-root > *').first()).toBeAttached();

  // C2: every #shell-overlay-root child must have computed display:none on cold
  // load. The round-2 bug (`.privacy-overlay` and `.hidden` at equal specificity)
  // left the Privacy panel's COMPUTED display as `flex`, dimming every screen from
  // launch, even though it also carried the `.hidden` class.
  const computedDisplays = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#shell-overlay-root > *')).map(
      (el) => getComputedStyle(el).display,
    ),
  );
  expect(computedDisplays.length).toBeGreaterThan(0);
  for (const display of computedDisplays) expect(display).toBe('none');

  // Title -> Settings -> Privacy policy (<= 2 taps, §8.7/M11.4a).
  await page.locator('[data-action="settings"]').click();
  await expect(page.locator('[data-action="privacy"]')).toBeVisible();
  await page.locator('[data-action="privacy"]').click();

  const privacyOverlay = page.locator('.privacy-overlay');
  await expect(privacyOverlay).toBeVisible();
  expect(await privacyOverlay.evaluate((el) => getComputedStyle(el).display)).toBe('flex');

  // The privacy content itself scrolls (§8.7: "text scrolls") - a same-origin iframe
  // with the bundled policy.
  const frame = page.frameLocator('.privacy-frame');
  await expect(frame.locator('body')).toBeVisible();

  // Close returns to Settings (§8.3 rule 1: closes the topmost overlay only).
  await page.locator('.privacy-overlay [data-action="overlay-close"]').click();
  await expect(privacyOverlay).toBeHidden();
  await expect(page.locator('[data-action="privacy"]')).toBeVisible();

  // Closing Settings itself returns to the title (§8.3 rule 1 again, one level up).
  await page.getByRole('dialog', { name: 'Settings' }).locator('[data-action="overlay-close"]').click();
  await expect(page.getByRole('dialog', { name: 'Title screen' })).toBeVisible();
});
