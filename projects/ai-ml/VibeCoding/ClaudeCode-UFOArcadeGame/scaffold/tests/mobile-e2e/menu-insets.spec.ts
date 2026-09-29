// Implements docs/mobile/PRD-mobile.md v1.7 M2.3b rule 3 and M2.3c (f1)/(f2), and
// validation-report-round4.md F1 / test gap T2: every menu screen (title, Help,
// Settings, Privacy policy, pause menu, Restart Game confirmation, Game Over, Game
// Complete) lies fully inside the full edge insets on a short window - the 640 x 360
// dp reference phone with real and planning insets, the smallest playable safe height
// (about 291.5 dp), and the M2.3c three-button-bar window - with 48 dp targets and
// text of at least 12 px. A second group inflates the fonts (Chromium cannot set the
// Android system font scale) and checks the screen then scrolls inside the insets
// instead of spilling into a gesture band. Runs at the 640x360 project only: each
// test sets its own viewport and insets, like too-small-window.spec.ts.

import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __vvsTest?: {
      snapshot: () => { state: string };
      resolveBack: () => 'leaveApp' | 'closeOverlay' | 'gameCommand';
    };
  }
}

const TOLERANCE = 0.5;
const TOO_SMALL_TEXT = 'Make the window larger to play.';

interface Insets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Viewport {
  width: number;
  height: number;
}

function parseInsets(query: string): Insets {
  const [left, right, top, bottom] = query.split(',').map(Number);
  return { left, right, top, bottom };
}

/** Every visible descendant of `overlay` (plus the overlay itself), measured in the
 * page, so a heading, a paragraph and a button are all checked the same way. */
async function measureScreen(page: Page, overlaySelector: string) {
  return page.locator(overlaySelector).evaluate((overlay) => {
    const elements = [overlay, ...Array.from(overlay.querySelectorAll('*'))];
    return {
      scrollable: overlay.scrollHeight > overlay.clientHeight + 0.5,
      items: elements
        .filter((el) => {
          const cs = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return cs.display !== 'none' && cs.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })
        .map((el) => {
          const rect = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return {
            name: `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ').join('.') : ''} "${(el.textContent ?? '').trim().slice(0, 24)}"`,
            isButton: el.classList.contains('menu-item'),
            hasOwnText: Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== ''),
            fontPx: parseFloat(cs.fontSize),
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          };
        }),
    };
  });
}

/** PRD M2.3 / M2.3b rule 3 / M2.6 / M3.x: the whole screen inside the full insets, no
 * scrolling needed at the default font, 48 dp targets, text >= 12 px. */
async function expectScreenInsideInsets(
  page: Page,
  screen: string,
  overlaySelector: string,
  viewport: Viewport,
  insets: Insets,
): Promise<void> {
  const { scrollable, items } = await measureScreen(page, overlaySelector);
  expect(items.length, `${screen}: nothing visible to measure`).toBeGreaterThan(1);
  expect(scrollable, `${screen}: needs scrolling at the default font`).toBe(false);
  for (const item of items) {
    const where = `${screen} / ${item.name}`;
    expect(item.left, `${where}: left edge inside the left inset`).toBeGreaterThanOrEqual(insets.left - TOLERANCE);
    expect(item.top, `${where}: top edge inside the top inset`).toBeGreaterThanOrEqual(insets.top - TOLERANCE);
    expect(item.right, `${where}: right edge inside the right inset`).toBeLessThanOrEqual(
      viewport.width - insets.right + TOLERANCE,
    );
    expect(item.bottom, `${where}: bottom edge inside the bottom inset`).toBeLessThanOrEqual(
      viewport.height - insets.bottom + TOLERANCE,
    );
    if (item.isButton) {
      expect(item.height, `${where}: touch target height`).toBeGreaterThanOrEqual(48 - 0.01);
      expect(item.width, `${where}: touch target width`).toBeGreaterThanOrEqual(48 - 0.01);
    }
    if (item.hasOwnText) expect(item.fontPx, `${where}: text size`).toBeGreaterThanOrEqual(12);
  }
}

const TITLE = '[role="dialog"][aria-label="Title screen"]';
const HELP = '[role="dialog"][aria-label="How to play"]';
const SETTINGS = '[role="dialog"][aria-label="Settings"]';
const PRIVACY = '[role="dialog"][aria-labelledby="privacy-heading"]';
const PAUSED = '[role="dialog"][aria-label="Paused"]';

/** Game Over and Game Complete cannot be reached quickly and repeatably from a
 * browser (a run needs about a minute to end and no test hook can set the state),
 * so they are put on screen by writing the exact element structure and classes
 * `ScreenController.renderGameOver`/`renderVictory` produce (src/ui/ScreenController.ts)
 * into `#overlay-root`. The layout under test is pure CSS, which is the same for the
 * real and the injected element. */
async function showEndScreen(page: Page, kind: 'gameOver' | 'victory'): Promise<string> {
  await page.evaluate((which) => {
    const root = document.getElementById('overlay-root')!;
    root.replaceChildren();
    const overlay = document.createElement('div');
    overlay.className = which === 'victory' ? 'screen-overlay screen-overlay--transparent-bg' : 'screen-overlay';
    overlay.setAttribute('role', 'alert');
    overlay.dataset.testEndScreen = which;
    const add = (tag: string, text: string, cls?: string, action?: string): void => {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (action) el.dataset.action = action;
      el.textContent = text;
      overlay.append(el);
    };
    if (which === 'gameOver') {
      add('h1', 'GAME OVER');
      add('p', 'Final Score: 12345');
      add('p', 'Best: 12345', 'best-score');
      add('p', 'New best!', 'new-best');
      add('p', 'Reached Level 12');
      add('button', 'Play again', 'menu-item', 'play-again');
    } else {
      add('h1', 'GAME COMPLETE');
      add('p', 'The robot forces have been defeated.');
      add('p', 'Final Score: 123456');
      add('p', 'Best: 123456', 'best-score');
      add('p', 'New best!', 'new-best');
    }
    root.append(overlay);
  }, kind);
  return `[data-test-end-screen="${kind}"]`;
}

async function toggleSwapFromTitle(page: Page): Promise<void> {
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="settings-swap"]').click();
  await page.locator(SETTINGS).locator('[data-action="overlay-close"]').click();
}

/** Walks every menu screen in one session: title, first-launch Help, Settings,
 * Privacy, pause menu, Restart Game confirmation, then Game Over and Game Complete. */
async function walkEveryMenuScreen(page: Page, viewport: Viewport, insets: Insets, swap: boolean): Promise<void> {
  await expect(page.locator('.rotate-prompt')).toBeHidden();
  if (swap) await toggleSwapFromTitle(page);

  await expectScreenInsideInsets(page, 'Title', TITLE, viewport, insets);

  await page.locator('[data-action="settings"]').click();
  await expectScreenInsideInsets(page, 'Settings', SETTINGS, viewport, insets);
  await page.locator('[data-action="privacy"]').click();
  await expect(page.locator(PRIVACY)).toBeVisible();
  await expectScreenInsideInsets(page, 'Privacy policy', PRIVACY, viewport, insets);
  await page.locator(PRIVACY).locator('[data-action="overlay-close"]').click();
  await page.locator(SETTINGS).locator('[data-action="overlay-close"]').click();

  // First launch: Start opens Help, whose "Got it" starts the run.
  await page.locator('[data-action="start"]').click();
  await expect(page.locator(HELP)).toBeVisible();
  await expectScreenInsideInsets(page, 'Help', HELP, viewport, insets);
  await page.locator('[data-action="help-dismiss"]').click();
  await expect(page.locator('.touch-button--pause')).toBeVisible();

  await page.locator('.touch-button--pause').click();
  await expect(page.locator(PAUSED)).toBeVisible();
  await expectScreenInsideInsets(page, 'Pause menu', PAUSED, viewport, insets);

  await page.locator('[data-action="pause-option:2"]').click(); // Restart Game
  await expect(page.locator(`${PAUSED} .confirm-box`)).toBeVisible();
  await expectScreenInsideInsets(page, 'Restart Game confirmation', PAUSED, viewport, insets);

  await expectScreenInsideInsets(page, 'Game Over', await showEndScreen(page, 'gameOver'), viewport, insets);
  await expectScreenInsideInsets(page, 'Game Complete', await showEndScreen(page, 'victory'), viewport, insets);
}

const MENU_CASES: Array<{ label: string; viewport: Viewport; insets: string }> = [
  { label: 'real insets 30,30,24,32 (M2.3b (a) model)', viewport: { width: 640, height: 360 }, insets: '30,30,24,32' },
  { label: 'measured gesture insets 30,30,28.2,32', viewport: { width: 640, height: 360 }, insets: '30,30,28.2,32' },
  { label: 'round-8 measured insets 29.7,29.7,28.2,32', viewport: { width: 640, height: 360 }, insets: '29.7,29.7,28.2,32' },
  { label: 'planning insets 24,24,0,24', viewport: { width: 640, height: 360 }, insets: '24,24,0,24' },
  { label: 'three-button bar on the right 0,48,24,0', viewport: { width: 640, height: 360 }, insets: '0,48,24,0' },
  { label: 'three-button bar on the left 48,0,24,0', viewport: { width: 640, height: 360 }, insets: '48,0,24,0' },
  {
    label: 'smallest playable safe height (291.6 dp) 0,0,30,38.4',
    viewport: { width: 640, height: 360 },
    insets: '0,0,30,38.4',
  },
  { label: 'M2.3c (f2) 640x368 with a bottom bar 0,0,24,48', viewport: { width: 640, height: 368 }, insets: '0,0,24,48' },
];

test.describe('M2.3b rule 3 / M2.3c: every menu screen fits inside the full insets (F1, T2)', () => {
  for (const { label, viewport, insets } of MENU_CASES) {
    for (const swap of [false, true]) {
      test(`${label}${swap ? ', controls swapped' : ''}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(`/?insets=${insets}&e2e=1`);
        await walkEveryMenuScreen(page, viewport, parseInsets(insets), swap);
      });
    }
  }
});

test.describe('M2.3c (f1)/(f2): the bottom-bar window', () => {
  const INSETS = '0,0,24,48';

  test('(f1) 640x360 with insets 0,0,24,48 shows only the too-small prompt, on every screen', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto(`/?insets=${INSETS}&e2e=1`);
    await expect(page.locator('.rotate-prompt')).toBeVisible();
    await expect(page.locator('.rotate-prompt p')).toHaveText(TOO_SMALL_TEXT);
    await expect(page.locator(TITLE)).toBeHidden();
    // Back leaves the app rather than acting on the hidden menu (M2.10a behavior 4).
    expect(await page.evaluate(() => window.__vvsTest!.resolveBack())).toBe('leaveApp');
  });

  test('(f1) a run in a playable 640x368 window pauses when it shrinks to 640x360, and the prompt shows', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 368 });
    await page.goto(`/?insets=${INSETS}&e2e=1`);
    await page.locator('[data-action="start"]').click();
    await page.locator('[data-action="help-dismiss"]').click();
    await expect(page.locator('.touch-button--pause')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__vvsTest!.snapshot().state)).toBe('PLAYING');

    await page.setViewportSize({ width: 640, height: 360 });
    await expect(page.locator('.rotate-prompt')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__vvsTest!.snapshot().state)).toBe('PAUSED');
  });

  for (const swap of [false, true]) {
    test(`(f2) 640x368 plays: playfield >= 0.5x, control sizes, HUD/hint text inside the bands${swap ? ', swapped' : ''}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 640, height: 368 });
      await page.goto(`/?insets=${INSETS}&e2e=1`);
      await expect(page.locator('.rotate-prompt')).toBeHidden();
      if (swap) await toggleSwapFromTitle(page);
      await page.locator('[data-action="start"]').click();
      await page.locator('[data-action="help-dismiss"]').click();
      await expect(page.locator('.touch-button--throw')).toBeVisible();

      const canvas = (await page.locator('#game-canvas').boundingBox())!;
      expect(canvas.width, 'playfield width >= 0.5x').toBeGreaterThanOrEqual(400 - 0.01);
      expect(canvas.height, 'playfield height >= 0.5x').toBeGreaterThanOrEqual(300 - 0.01);

      const names = { left: '.touch-button--left', right: '.touch-button--right', throw: '.touch-button--throw', pause: '.touch-button--pause' };
      const boxes: Record<string, { x: number; y: number; width: number; height: number }> = {};
      for (const [name, selector] of Object.entries(names)) boxes[name] = (await page.locator(selector).boundingBox())!;
      for (const name of ['left', 'right', 'throw'] as const) {
        expect(boxes[name].width, `${name} width`).toBeGreaterThanOrEqual(56);
        expect(boxes[name].height, `${name} height`).toBeGreaterThanOrEqual(56);
      }
      expect(boxes.pause.width).toBeGreaterThanOrEqual(48);
      expect(boxes.pause.height).toBeGreaterThanOrEqual(48);
      expect(boxes.right.x - (boxes.left.x + boxes.left.width), 'gap between ◀ and ▶').toBeGreaterThanOrEqual(8 - 0.01);
      for (const [name, box] of Object.entries(boxes)) {
        expect(box.y, `${name} top inside the top band`).toBeGreaterThanOrEqual(24 - TOLERANCE);
        expect(box.y + box.height, `${name} bottom above the 48 dp bar`).toBeLessThanOrEqual(368 - 48 + TOLERANCE);
      }

      const textBoxes = await page.locator('.hud-panel, #control-text').evaluateAll((els) =>
        els
          .filter((el) => getComputedStyle(el).display !== 'none')
          .map((el) => {
            const rect = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return {
              top: rect.top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop),
              bottom: rect.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom),
            };
          }),
      );
      expect(textBoxes.length).toBeGreaterThan(0);
      for (const t of textBoxes) {
        expect(t.top, 'HUD/hint text top >= 24').toBeGreaterThanOrEqual(24 - 0.01);
        expect(t.bottom, 'HUD/hint text bottom <= H - 48').toBeLessThanOrEqual(368 - 48 + 0.01);
      }
    });
  }
});

// M2.11 (largest system font). Chromium has no Android font scale, so the same effect
// is created by doubling every menu font size; the screen must then scroll INSIDE the
// insets - its own box stays in the safe area and every element is reachable - rather
// than run under a gesture band.
test.describe('M2.11 / M2.3b rule 3: enlarged fonts scroll inside the insets (F1, T2)', () => {
  const VIEWPORT: Viewport = { width: 640, height: 360 };
  const INSETS = parseInsets('30,30,24,32');

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto('/?insets=30,30,24,32&e2e=1');
    await page.addStyleTag({
      content: `html.platform-android .screen-overlay h1 { font-size: 60px !important; }
        html.platform-android .screen-overlay p { font-size: 32px !important; }
        html.platform-android .menu-item { font-size: 36px !important; }`,
    });
  });

  async function expectReachableInsideInsets(
    page: Page,
    screen: string,
    overlaySelector: string,
    last: string,
    mustScroll: boolean,
  ): Promise<void> {
    const overlay = page.locator(overlaySelector);
    const box = (await overlay.boundingBox())!;
    expect(box.x, `${screen}: box left`).toBeGreaterThanOrEqual(INSETS.left - TOLERANCE);
    expect(box.y, `${screen}: box top`).toBeGreaterThanOrEqual(INSETS.top - TOLERANCE);
    expect(box.x + box.width, `${screen}: box right`).toBeLessThanOrEqual(VIEWPORT.width - INSETS.right + TOLERANCE);
    expect(box.y + box.height, `${screen}: box bottom`).toBeLessThanOrEqual(VIEWPORT.height - INSETS.bottom + TOLERANCE);
    if (mustScroll) {
      expect(
        await overlay.evaluate((el) => el.scrollHeight > el.clientHeight + 0.5),
        `${screen}: the enlarged content should need scrolling here`,
      ).toBe(true);
    }
    // The heading is reachable at the top, the last control after scrolling down; both
    // then lie inside the overlay box (and therefore the insets).
    await overlay.evaluate((el) => (el.scrollTop = 0));
    const heading = (await overlay.locator('h1').first().boundingBox())!;
    expect(heading.y, `${screen}: heading top reachable`).toBeGreaterThanOrEqual(box.y - TOLERANCE);
    await overlay.evaluate((el) => (el.scrollTop = el.scrollHeight));
    const lastBox = (await overlay.locator(last).boundingBox())!;
    expect(lastBox.y + lastBox.height, `${screen}: last control reachable`).toBeLessThanOrEqual(box.y + box.height + TOLERANCE);
    expect(lastBox.y, `${screen}: last control top inside the box`).toBeGreaterThanOrEqual(box.y - TOLERANCE);
  }

  test('title scrolls inside the insets', async ({ page }) => {
    await expectReachableInsideInsets(page, 'Title', TITLE, '[data-action="quit"]', true);
  });

  test('Settings scrolls inside the insets', async ({ page }) => {
    await page.locator('[data-action="settings"]').click();
    await expectReachableInsideInsets(page, 'Settings', SETTINGS, '[data-action="overlay-close"]', false);
  });

  test('Help scrolls inside the insets', async ({ page }) => {
    await page.locator('[data-action="help"]').click();
    await expectReachableInsideInsets(page, 'Help', HELP, '[data-action="help-dismiss"]', false);
  });

  test('a control scrolled into view in the enlarged title can still be tapped', async ({ page }) => {
    const settings = page.locator(`${TITLE} [data-action="settings"]`);
    await settings.scrollIntoViewIfNeeded();
    await settings.click();
    await expect(page.locator(SETTINGS)).toBeVisible();
  });
});
