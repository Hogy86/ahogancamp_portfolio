// Implements docs/mobile/architecture/mobile-architecture.md §6.1/§6.2/§6.2.1/§10.1
// Amendment A12 and docs/mobile/PRD-mobile.md v1.6 M2.3b (a)-(d): the playfield may
// extend into the top/bottom gesture bands, but text, controls and menus stay inside
// the full edge insets, and art never enters a real display-cutout. Runs at the
// 640x360 project only (each test sets its own viewport/insets via `?insets=`/
// `?cutout=`, same pattern as too-small-window.spec.ts).

import { test, expect, type Page, type CDPSession } from '@playwright/test';

declare global {
  interface Window {
    __vvsTest?: {
      snapshot: () => { state: string; player: { x: number }; shields: unknown[]; levelIntroRemaining: number };
    };
  }
}

const CONTROL_SELECTORS = {
  left: '.touch-button--left',
  right: '.touch-button--right',
  throw: '.touch-button--throw',
  pause: '.touch-button--pause',
} as const;

const ROTATE_PROMPT_SELECTOR = '.rotate-prompt';
const TOLERANCE = 0.01;

async function snapshot(page: Page) {
  return page.evaluate(() => window.__vvsTest!.snapshot());
}

async function startRun(page: Page): Promise<void> {
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="help-dismiss"]').click();
  await expect(page.locator(CONTROL_SELECTORS.throw)).toBeVisible();
}

async function waitForLevelIntroToClear(page: Page): Promise<void> {
  await expect.poll(async () => (await snapshot(page)).levelIntroRemaining, 'levelIntroRemaining').toBe(0);
}

async function centerOf(page: Page, selector: string): Promise<{ x: number; y: number }> {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`${selector} has no bounding box`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function touchDown(client: CDPSession, x: number, y: number): Promise<void> {
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
}
async function touchUp(client: CDPSession): Promise<void> {
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function tap(client: CDPSession, x: number, y: number): Promise<void> {
  await touchDown(client, x, y);
  await touchUp(client);
}

/** `#control-text`'s content-box bottom (§10.1 A12 (c)). */
async function contentBoxBottom(page: Page, selector: string): Promise<number> {
  return page.locator(selector).evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return rect.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom);
  });
}

interface Insets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function assertControlsInsideInsets(
  boxes: Record<string, { x: number; y: number; width: number; height: number }>,
  viewport: { width: number; height: number },
  insets: Insets,
): void {
  const safeLeft = insets.left;
  const safeTop = insets.top;
  const safeRight = viewport.width - insets.right;
  const safeBottom = viewport.height - insets.bottom;
  for (const [name, box] of Object.entries(boxes)) {
    expect(box.x, `${name} left edge inside the left inset`).toBeGreaterThanOrEqual(safeLeft - 0.5);
    expect(box.y, `${name} top edge inside the top inset`).toBeGreaterThanOrEqual(safeTop - 0.5);
    expect(box.x + box.width, `${name} right edge inside the right inset`).toBeLessThanOrEqual(safeRight + 0.5);
    expect(box.y + box.height, `${name} bottom edge inside the bottom inset`).toBeLessThanOrEqual(safeBottom + 0.5);
  }
}

async function controlBoxes(page: Page): Promise<Record<string, { x: number; y: number; width: number; height: number }>> {
  const boxes: Record<string, { x: number; y: number; width: number; height: number }> = {};
  for (const [name, selector] of Object.entries(CONTROL_SELECTORS)) {
    const box = await page.locator(selector).boundingBox();
    expect(box, `${name} has no bounding box`).not.toBeNull();
    boxes[name] = box!;
  }
  return boxes;
}

// L2 (b) (code-review-round9.md): (a) and (b) must apply the same control-size/gap
// checks - factored here once so neither can silently drift out of sync with the
// other again.
function assertControlSizes(boxes: Record<string, { x: number; y: number; width: number; height: number }>): void {
  expect(boxes.left.width).toBeGreaterThanOrEqual(56);
  expect(boxes.right.width).toBeGreaterThanOrEqual(56);
  expect(boxes.throw.width).toBeGreaterThanOrEqual(56);
  expect(boxes.pause.width).toBeGreaterThanOrEqual(48);
  expect(boxes.pause.height).toBeGreaterThanOrEqual(48);
  // Adjacent-target gap: ◀/▶ share the move-zone, ≥8px apart.
  const gap = boxes.right.x - (boxes.left.x + boxes.left.width);
  expect(gap).toBeGreaterThanOrEqual(8 - 0.5);
}

/** Toggles swap through Settings (no dedicated query flag exists), so the rest of the
 * test exercises the real control-mirroring path (layout.ts C2). Scoped to the
 * Settings dialog: `[data-action="overlay-close"]` also matches the Privacy panel's
 * Close button, which is not on screen here but still in the DOM. */
async function toggleSwap(page: Page): Promise<void> {
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="settings-swap"]').click();
  await page.getByRole('dialog', { name: 'Settings' }).locator('[data-action="overlay-close"]').click();
}

const REFERENCE_CASES: Array<[string, string, boolean]> = [
  ['insets=30,30,24,32 (M2.3b (a) model)', 'insets=30,30,24,32', false],
  ['insets=30,30,24,32 swapped', 'insets=30,30,24,32', true],
  ['insets=30,30,28.2,32 (measured gesture)', 'insets=30,30,28.2,32', false],
  ['insets=30,30,28.2,32 swapped', 'insets=30,30,28.2,32', true],
  ['insets=29.7,29.7,28.2,32 (round-8 measured)', 'insets=29.7,29.7,28.2,32', false],
  ['insets=29.7,29.7,28.2,32 swapped', 'insets=29.7,29.7,28.2,32', true],
];

test.describe('M2.3b (a): the reference phone plays', () => {
  for (const [label, insetsQuery, swap] of REFERENCE_CASES) {
    test(label, async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 360 });
      await page.goto(`/?${insetsQuery}&e2e=1`);
      if (swap) await toggleSwap(page);

      await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeHidden();

      await startRun(page);
      await waitForLevelIntroToClear(page);

      const before = await snapshot(page);
      // L1 (code-review-round10.md): always hold the physical ▶ control and assert x
      // *increases*, per §10.1 A12 (a) - swap mirrors which column the control sits
      // in, not which direction the button moves the player.
      const { x: mx, y: my } = await centerOf(page, CONTROL_SELECTORS.right);
      const client = await page.context().newCDPSession(page);
      await touchDown(client, mx, my);
      await page.waitForTimeout(500);
      const during = await snapshot(page);
      await touchUp(client);
      expect(during.player.x, "holding the right control did not increase player x").toBeGreaterThan(before.player.x);

      const { x: tx, y: ty } = await centerOf(page, CONTROL_SELECTORS.throw);
      await tap(client, tx, ty);
      await expect.poll(async () => (await snapshot(page)).shields.length, 'shields after THROW').toBe(1);

      const [insL, insR, insT, insB] = insetsQuery.replace('insets=', '').split(',').map(Number);
      // L1: `insets` is the physical device inset regardless of swap - swap mirrors
      // which control column hugs which edge, not the device's own left/right insets.
      const insets = { left: insL, right: insR, top: insT, bottom: insB };
      const boxes = await controlBoxes(page);
      assertControlSizes(boxes);
      assertControlsInsideInsets(boxes, { width: 640, height: 360 }, insets);

      const canvasBox = await page.locator('#game-canvas').boundingBox();
      expect(canvasBox).not.toBeNull();
      expect(canvasBox!.width).toBeGreaterThanOrEqual(400);
      expect(canvasBox!.height).toBeGreaterThanOrEqual(300);
    });
  }
});

const THREE_BUTTON_CASES: Array<[string, string]> = [
  ['insets=0,48,24,0 (three-button nav)', 'insets=0,48,24,0'],
  ['insets=48,0,24,0 (three-button nav, mirrored)', 'insets=48,0,24,0'],
];

test.describe('M2.3b (b): three-button navigation plays', () => {
  for (const [label, insetsQuery] of THREE_BUTTON_CASES) {
    test(label, async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 360 });
      await page.goto(`/?${insetsQuery}&e2e=1`);
      await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeHidden();

      await startRun(page);
      await waitForLevelIntroToClear(page);

      const before = await snapshot(page);
      const { x: mx, y: my } = await centerOf(page, CONTROL_SELECTORS.right);
      const client = await page.context().newCDPSession(page);
      await touchDown(client, mx, my);
      await page.waitForTimeout(500);
      const during = await snapshot(page);
      await touchUp(client);
      // L1 (code-review-round10.md): §10.1 A12 (a)/(b) say holding ▶ increases x.
      expect(during.player.x).toBeGreaterThan(before.player.x);

      const { x: tx, y: ty } = await centerOf(page, CONTROL_SELECTORS.throw);
      await tap(client, tx, ty);
      await expect.poll(async () => (await snapshot(page)).shields.length).toBe(1);

      const [insL, insR, insT, insB] = insetsQuery.replace('insets=', '').split(',').map(Number);
      const boxes = await controlBoxes(page);
      assertControlSizes(boxes);
      assertControlsInsideInsets(boxes, { width: 640, height: 360 }, { left: insL, right: insR, top: insT, bottom: insB });

      const canvasBox = await page.locator('#game-canvas').boundingBox();
      expect(canvasBox!.width).toBeGreaterThanOrEqual(400);
      expect(canvasBox!.height).toBeGreaterThanOrEqual(300);
    });
  }
});

test.describe('M2.3b (c): text and controls stay out of the bands', () => {
  // L2 (a) (code-review-round9.md): §10.1 A12 (c) says "for every (a) and (b) case" -
  // 8 total, not 5. The three reference-inset cases each get a swapped variant (the
  // text checks are swap-invariant, but the control-inside-insets check is not, since
  // it mirrors which edge each column hugs); the two three-button cases are already
  // distinct inset combinations, so they do not also get a `swap` toggle.
  const CASES: Array<[string, string, boolean]> = [
    ['insets=30,30,24,32', 'insets=30,30,24,32', false],
    ['insets=30,30,24,32 swapped', 'insets=30,30,24,32', true],
    ['insets=30,30,28.2,32', 'insets=30,30,28.2,32', false],
    ['insets=30,30,28.2,32 swapped', 'insets=30,30,28.2,32', true],
    ['insets=29.7,29.7,28.2,32', 'insets=29.7,29.7,28.2,32', false],
    ['insets=29.7,29.7,28.2,32 swapped', 'insets=29.7,29.7,28.2,32', true],
    ['insets=0,48,24,0 (three-button)', 'insets=0,48,24,0', false],
    ['insets=48,0,24,0 (three-button mirrored)', 'insets=48,0,24,0', false],
  ];

  for (const [label, insetsQuery, swap] of CASES) {
    test(label, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 640, height: 360 });
      await page.goto(`/?${insetsQuery}&e2e=1`);
      await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeHidden();
      if (swap) await toggleSwap(page);

      // Before the first throw, so `#control-text` is laid out with the hint copy
      // (§10.1 A12 (c)).
      await startRun(page);
      expect((await snapshot(page)).state).toBe('PLAYING');

      const [insL, insR, insT, insB] = insetsQuery.replace('insets=', '').split(',').map(Number);
      // L1: as above - the physical inset is unaffected by which control column swap
      // puts on which side.
      const insets = { left: insL, right: insR, top: insT, bottom: insB };

      const hudTops = await page.locator('.hud-panel').evaluateAll((els) =>
        els
          .filter((el) => getComputedStyle(el).display !== 'none')
          .map((el) => {
            const rect = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return rect.top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop);
          }),
      );
      for (const top of hudTops) {
        expect(top, '.hud-panel content-box top must be >= t').toBeGreaterThanOrEqual(insT - TOLERANCE);
      }

      const controlTextBottom = await contentBoxBottom(page, '#control-text');
      expect(controlTextBottom, '#control-text content-box bottom must be <= H - b').toBeLessThanOrEqual(
        360 - insB + TOLERANCE,
      );

      const canvasBox = await page.locator('#game-canvas').boundingBox();
      expect(canvasBox).not.toBeNull();
      const s = canvasBox!.height / 600;
      expect(canvasBox!.y + 4 * s, 'canvas warning text top must be >= t').toBeGreaterThanOrEqual(insT - TOLERANCE);

      const boxes = await controlBoxes(page);
      assertControlsInsideInsets(boxes, { width: 640, height: 360 }, insets);

      // L1 (code-review-round9.md): §10.1 A12 (c) says "attach one screenshot per case
      // to the test output" - not the repo. Writing into `docs/mobile/tests/
      // screenshots/` overwrote the committed step-7/step-10 evidence on every local
      // run, CI run and `--repeat-each` repeat (and raced across parallel workers).
      await testInfo.attach(`m2_3b_c_${insetsQuery.replace(/[.,=]/g, '_')}${swap ? '_swapped' : ''}`, {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    });
  }
});

test.describe('M2.3b (d): no art under a cutout', () => {
  test('a top cutout keeps the canvas top at or below the cutout inset', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/?insets=30,30,24,32&cutout=30,0&e2e=1');
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeHidden();

    const canvasBox = await page.locator('#game-canvas').boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.y).toBeGreaterThanOrEqual(30 - TOLERANCE);
  });

  test('a bottom cutout keeps the canvas bottom at or above the cutout inset', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/?insets=30,30,24,32&cutout=0,32&e2e=1');
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeHidden();

    const canvasBox = await page.locator('#game-canvas').boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.y + canvasBox!.height).toBeLessThanOrEqual(328 + TOLERANCE);
  });
});

// code-review-round9.md L2: the M2.10a (c) v1.6 boundary test existed here and in
// too-small-window.spec.ts:235-249. Kept only in too-small-window.spec.ts, alongside
// the rest of the M2.10a suite it belongs to.
