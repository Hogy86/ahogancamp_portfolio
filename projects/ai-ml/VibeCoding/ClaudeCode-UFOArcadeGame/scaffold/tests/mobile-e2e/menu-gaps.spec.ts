// Implements docs/mobile/PRD-mobile.md M3.1 (>= 8 dp between adjacent touch targets) for
// every menu button group, after UAT findings F1 (Restart Game Confirm/Cancel touched)
// and F2 (menu rows 6 dp apart on phone-height windows). Runs at all four device-matrix
// projects; the fit of each menu inside the safe area is asserted in menu-insets.spec.ts.

import { test, expect, type Page } from '@playwright/test';
import { GAME_COMPLETE_MARKUP, GAME_OVER_MARKUP } from '../../src/test-utils/endScreenMarkup';

const MIN_GAP = 8;
const MIN_TARGET = 48; // M3.8: menu targets are at least 48 dp tall
const TOLERANCE = 0.01;

const TITLE = '[role="dialog"][aria-label="Title screen"]';
const HELP = '[role="dialog"][aria-label="How to play"]';
const SETTINGS = '[role="dialog"][aria-label="Settings"]';
const PAUSED = '[role="dialog"][aria-label="Paused"]';

/** Smallest gap between any two visible `.menu-item` buttons inside `overlaySelector`
 * (Infinity when fewer than two). The gap between two boxes is the larger of their
 * horizontal and vertical separations; overlapping boxes give a negative number. */
async function smallestButtonGap(
  page: Page,
  overlaySelector: string,
): Promise<{ gap: number; count: number }> {
  return page.locator(overlaySelector).evaluate((overlay) => {
    const rects = Array.from(overlay.querySelectorAll('.menu-item'))
      .filter((el) => getComputedStyle(el).display !== 'none')
      .map((el) => el.getBoundingClientRect());
    let gap = Infinity;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const dx = Math.max(b.left - a.right, a.left - b.right);
        const dy = Math.max(b.top - a.bottom, a.top - b.bottom);
        gap = Math.min(gap, Math.max(dx, dy));
      }
    }
    return { gap, count: rects.length };
  });
}

/** Heights and tops of the visible `.menu-item` buttons inside `overlaySelector`. */
async function buttonBoxes(
  page: Page,
  overlaySelector: string,
): Promise<{ top: number; height: number }[]> {
  return page.locator(overlaySelector).evaluate((overlay) =>
    Array.from(overlay.querySelectorAll('.menu-item'))
      .filter((el) => getComputedStyle(el).display !== 'none')
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, height: r.height };
      }),
  );
}

async function expectGaps(
  page: Page,
  screen: string,
  selector: string,
  minButtons: number,
  checkHeight = false,
): Promise<void> {
  const { gap, count } = await smallestButtonGap(page, selector);
  if (checkHeight) {
    // Only meaningful at the default font: enlarged-font overflow can flex-shrink buttons.
    for (const [i, box] of (await buttonBoxes(page, selector)).entries()) {
      expect(box.height, `${screen}: button ${i} height`).toBeGreaterThanOrEqual(
        MIN_TARGET - TOLERANCE,
      );
    }
  }
  expect(count, `${screen}: button count`).toBeGreaterThanOrEqual(minButtons);
  expect(gap, `${screen}: smallest gap between adjacent buttons`).toBeGreaterThanOrEqual(
    MIN_GAP - TOLERANCE,
  );
}

/** Same injection as menu-insets.spec.ts: the end screens cannot be reached quickly, so
 * the markup `ScreenController` produces is written into #overlay-root. */
async function showEndScreen(page: Page, kind: 'gameOver' | 'victory'): Promise<string> {
  const markup = kind === 'victory' ? GAME_COMPLETE_MARKUP : GAME_OVER_MARKUP;
  await page.evaluate(
    ({ which, spec }) => {
      const root = document.getElementById('overlay-root')!;
      root.replaceChildren();
      const overlay = document.createElement('div');
      overlay.className = spec.overlayClass;
      overlay.setAttribute('role', spec.role);
      overlay.dataset.testEndScreen = which;
      for (const node of spec.children) {
        const el = document.createElement(node.tag);
        if (node.className) el.className = node.className;
        if (node.action) el.dataset.action = node.action;
        el.textContent = node.text;
        overlay.append(el);
      }
      root.append(overlay);
    },
    { which: kind, spec: markup },
  );
  return `[data-test-end-screen="${kind}"]`;
}

type ConfirmLayout = 'side-by-side' | 'stacked';

async function walkEveryMenu(
  page: Page,
  confirmLayout: ConfirmLayout,
  checkHeight: boolean,
): Promise<void> {
  await expectGaps(page, 'Title', TITLE, 4, checkHeight);

  await page.locator('[data-action="settings"]').click();
  await expectGaps(page, 'Settings', SETTINGS, 3, checkHeight);
  await page.locator(SETTINGS).locator('[data-action="overlay-close"]').click();

  await page.locator('[data-action="start"]').click();
  await expectGaps(page, 'Help', HELP, 1, checkHeight);
  await page.locator('[data-action="help-dismiss"]').click();

  await page.locator('.touch-button--pause').click();
  await expectGaps(page, 'Pause menu', PAUSED, 4, checkHeight);

  await page.locator('[data-action="pause-option:2"]').click(); // Restart Game
  await expect(page.locator(`${PAUSED} .confirm-box`)).toBeVisible();
  // Confirm and Cancel really are in the layout under test (a stacked case that never
  // wraps, or a side-by-side case that wrapped, would not exercise the right rule).
  const confirmTops = (await buttonBoxes(page, `${PAUSED} .confirm-box`)).map((b) => b.top);
  expect(confirmTops, 'Confirm and Cancel buttons').toHaveLength(2);
  if (confirmLayout === 'stacked') {
    expect(confirmTops[0], 'Confirm/Cancel wrapped onto separate rows').not.toBe(confirmTops[1]);
  } else {
    expect(confirmTops[0], 'Confirm/Cancel on one row').toBe(confirmTops[1]);
  }
  await expectGaps(page, `Restart Game confirmation (${confirmLayout})`, PAUSED, 2, checkHeight);

  // Game Over has one button and Game Complete none, so these only guard against a
  // second button being added without a gap.
  await expectGaps(page, 'Game Over', await showEndScreen(page, 'gameOver'), 1);
  await expectGaps(page, 'Game Complete', await showEndScreen(page, 'victory'), 0);
}

const ENLARGED_FONTS = `html.platform-android .screen-overlay h1 { font-size: 60px !important; }
  html.platform-android .screen-overlay p { font-size: 32px !important; }
  html.platform-android .menu-item { font-size: 36px !important; }`;

test.describe('M3.1/M3.8: menu buttons are >= 8 dp apart and >= 48 dp tall (UAT F1, F2)', () => {
  test('every menu, default font: side-by-side Confirm/Cancel, all targets >= 48 dp', async ({
    page,
  }) => {
    await page.goto('/?e2e=1');
    await walkEveryMenu(page, 'side-by-side', true);
  });

  test('every menu, enlarged fonts: side-by-side Confirm/Cancel', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.addStyleTag({ content: ENLARGED_FONTS });
    await walkEveryMenu(page, 'side-by-side', false);
  });

  test('every menu, enlarged fonts in a narrow box: stacked Confirm/Cancel keep >= 8 dp', async ({
    page,
  }) => {
    await page.goto('/?e2e=1');
    // 300 px cannot hold two 36 px-font buttons on one row, so Confirm/Cancel must wrap.
    await page.addStyleTag({
      content: `${ENLARGED_FONTS}
.confirm-box { max-width: 300px !important; }`,
    });
    await walkEveryMenu(page, 'stacked', false);
  });
});
