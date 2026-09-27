// Implements docs/mobile/PRD-mobile.md M3.13 ("Swap controls" left-handed option)
// and closes carry-forward I3 (code-review-round4 I2 / code-review-round5 I3):
// controls-layout.spec.ts only ever measured the DEFAULT layout's geometry, and
// controls-behavior.spec.ts only ever pressed the DEFAULT layout's controls. Neither
// proved the SWAPPED layout (movement on the right, THROW on the left, M7.3 setting)
// actually moves/throws/pauses once toggled - only that its geometry mirrors (which
// controls-layout.spec.ts's insets/geometry assertions do not vary by layout at all).
//
// This spec, modelled on controls-behavior.spec.ts's real-touch-pipeline pattern
// (CDP Input.dispatchTouchEvent - a real touch, not a synthetic/untrusted DOM event):
// - turns "Swap controls" on from Settings,
// - reloads (M7.3/M7.4: the setting must persist and still apply on a fresh load),
// - asserts the movement zone now sits on the opposite side of the screen from THROW,
// - asserts holding ◀/▶ at their NEW (mirrored) location still moves the player, and
//   tapping THROW/PAUSE at their new locations still throws/pauses (M3.13's own text:
//   "a setting... mirrors the layout", i.e. behavior is unchanged, only position is).

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
    };
  }
}

const CONTROL_SELECTORS = {
  left: '.touch-button--left',
  right: '.touch-button--right',
  throw: '.touch-button--throw',
  pause: '.touch-button--pause',
} as const;

async function snapshot(page: Page) {
  return page.evaluate(() => window.__vvsTest!.snapshot());
}

async function waitForLevelIntroToClear(page: Page): Promise<void> {
  await expect
    .poll(async () => (await snapshot(page)).levelIntroRemaining, 'levelIntroRemaining')
    .toBe(0);
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

async function startRun(page: Page): Promise<void> {
  await page.locator('[data-action="start"]').click();
  // M8.1: Help only auto-opens on tapping Start the FIRST time (helpSeen false);
  // this file starts a run twice per test (a throwaway default-layout baseline,
  // then the real swapped-layout run) once helpSeen has already been saved by the
  // first run, so Start goes straight to PLAYING the second time - no "Got it" to
  // click.
  const helpDismiss = page.locator('[data-action="help-dismiss"]');
  const helpAppeared = await helpDismiss
    .waitFor({ state: 'visible', timeout: 2000 })
    .then(() => true)
    .catch(() => false);
  if (helpAppeared) {
    await helpDismiss.click();
  }
  await expect(page.locator(CONTROL_SELECTORS.throw)).toBeVisible();
  await waitForLevelIntroToClear(page);
}

test.describe('Swap controls (M3.13) - real behavior in the mirrored layout', () => {
  test('turning on Swap controls mirrors the columns and every control still works at its new position', async ({
    page,
  }) => {
    await page.goto('/?e2e=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Baseline (default layout): THROW sits to the right of the movement zone.
    // M3.9: touch controls only render during active play (the F18 intro/boss
    // warning) - hidden on the title screen - so the baseline can only be read
    // from an actual run, not straight off the fresh page load.
    await startRun(page);
    const defaultLeftBox = await page.locator(CONTROL_SELECTORS.left).boundingBox();
    const defaultThrowBox = await page.locator(CONTROL_SELECTORS.throw).boundingBox();
    if (!defaultLeftBox || !defaultThrowBox) throw new Error('controls not visible during the baseline run');
    expect(defaultThrowBox.x, 'default layout: THROW starts right of the movement zone').toBeGreaterThan(
      defaultLeftBox.x,
    );

    // Drop this baseline run (a plain reload, like closing and reopening the app,
    // not a game-rule action) before touching Settings - M3.13 is reached from the
    // title, not the pause menu.
    await page.reload();
    await expect(page.locator('[data-action="start"]')).toBeVisible();

    await page.locator('[data-action="settings"]').click();
    await expect(page.locator('[data-action="settings-swap"]')).toHaveText('Swap controls: Off');
    await page.locator('[data-action="settings-swap"]').click();
    await expect(page.locator('[data-action="settings-swap"]')).toHaveText('Swap controls: On');
    await page.getByRole('dialog', { name: 'Settings' }).locator('[data-action="overlay-close"]').click();

    // M7.3/M7.4: the setting is saved and must still apply after a full reload, not
    // just for the rest of this in-memory session.
    await page.reload();
    await expect(page.locator('[data-action="start"]')).toBeVisible();
    await page.locator('[data-action="settings"]').click();
    await expect(page.locator('[data-action="settings-swap"]')).toHaveText('Swap controls: On');
    await page.getByRole('dialog', { name: 'Settings' }).locator('[data-action="overlay-close"]').click();

    await startRun(page);

    // Geometry actually mirrored: THROW is now LEFT of the movement zone (the
    // opposite of the default-layout assertion above), not merely "some other spot".
    const swappedLeftBox = await page.locator(CONTROL_SELECTORS.left).boundingBox();
    const swappedThrowBox = await page.locator(CONTROL_SELECTORS.throw).boundingBox();
    if (!swappedLeftBox || !swappedThrowBox) throw new Error('controls not visible after enabling swap');
    expect(swappedThrowBox.x, 'swapped layout: THROW moves to the LEFT of the movement zone').toBeLessThan(
      swappedLeftBox.x,
    );

    // Every control still resolves to itself at its NEW location, not to whatever
    // used to be there (mirrors code-review-round2 C1's elementFromPoint check).
    const client = await page.context().newCDPSession(page);
    for (const [name, selector] of Object.entries(CONTROL_SELECTORS)) {
      const { x, y } = await centerOf(page, selector);
      const isControl = await page.evaluate(
        ([px, py, sel]) => !!document.elementFromPoint(px, py)?.closest(sel as string),
        [x, y, selector] as const,
      );
      expect(isControl, `${name} centre (swapped layout) did not resolve inside ${selector}`).toBe(true);
    }

    // Behavior, not just geometry: holding the (now right-hand) ◀ still moves the
    // player LEFT - the mirrored position must not have swapped MEANING.
    const before = await snapshot(page);
    const leftCenter = await centerOf(page, CONTROL_SELECTORS.left);
    await touchDown(client, leftCenter.x, leftCenter.y);
    await page.waitForTimeout(300);
    const duringLeft = await snapshot(page);
    await touchUp(client);
    expect(duringLeft.player.x, 'holding ◀ in the swapped layout did not move the player left').toBeLessThan(
      before.player.x,
    );

    await page.waitForTimeout(50);
    const beforeRight = await snapshot(page);
    const rightCenter = await centerOf(page, CONTROL_SELECTORS.right);
    await touchDown(client, rightCenter.x, rightCenter.y);
    await page.waitForTimeout(300);
    const duringRight = await snapshot(page);
    await touchUp(client);
    expect(duringRight.player.x, 'holding ▶ in the swapped layout did not move the player right').toBeGreaterThan(
      beforeRight.player.x,
    );

    // THROW (now on the left-hand column) still spawns a shield.
    expect((await snapshot(page)).shields.length).toBe(0);
    const throwCenter = await centerOf(page, CONTROL_SELECTORS.throw);
    await tap(client, throwCenter.x, throwCenter.y);
    await expect
      .poll(async () => (await snapshot(page)).shields.length, 'shields.length after tapping the swapped THROW')
      .toBe(1);

    // PAUSE (now on the left-hand column, above THROW) still pauses.
    expect((await snapshot(page)).state).toBe('PLAYING');
    const pauseCenter = await centerOf(page, CONTROL_SELECTORS.pause);
    await tap(client, pauseCenter.x, pauseCenter.y);
    await expect
      .poll(async () => (await snapshot(page)).state, 'state after tapping the swapped PAUSE')
      .toBe('PAUSED');
  });
});
