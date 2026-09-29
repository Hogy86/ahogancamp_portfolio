// Implements docs/mobile/architecture/mobile-architecture.md §6.2.1/§8.1/§8.3/§10.1
// (Amendments A11, A12) and docs/mobile/PRD-mobile.md v1.5/v1.6 M2.10a: the
// too-small-window prompt, its precedence against the portrait prompt, the
// pause-on-entry and no-hidden-resume guards, and the back-order rule. The real AVD
// acceptance tests M2.10a (a)-(d) (fold AVD, a real window shrink/restore, the
// largest system font) run on the emulator at step 10
// (docs/mobile/tests/device-matrix.md); this suite covers everything
// software-testable outside a real device. [A12] Also the M2.10a (c) v1.6
// measured-inset boundary and the I3 keyboard-under-the-prompt gate
// (§6.2.1 A12 behavior 4; §12 MR20).

import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __vvsTest?: {
      snapshot: () => {
        state: string;
        score: number;
        lives: number;
        level: number;
        enemies: unknown[];
        effects: unknown;
      };
      resolveBack: () => 'leaveApp' | 'closeOverlay' | 'gameCommand';
    };
  }
}

const ROTATE_PROMPT_SELECTOR = '.rotate-prompt';
const PORTRAIT_TEXT = 'Rotate your device or enlarge the window to play.';
const TOO_SMALL_TEXT = 'Make the window larger to play.';

async function snapshot(page: Page) {
  return page.evaluate(() => window.__vvsTest!.snapshot());
}

async function promptText(page: Page): Promise<string | null> {
  return page.locator(`${ROTATE_PROMPT_SELECTOR} p`).textContent();
}

test.describe('M2.10a too-small window (§6.2.1, Amendment A11)', () => {
  test('a 600x360 window with planning insets shows only "Make the window larger to play."; taps do nothing', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 600, height: 360 });
    await page.goto('/?insets=24,24,0,24&e2e=1');

    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeVisible();
    expect(await promptText(page)).toBe(TOO_SMALL_TEXT);

    // §6.2.1 behavior 2/code-review-round8 R1: `#app-root` and the contents of
    // `#safe-layer` (menus, shell overlays, touch controls) are `visibility: hidden`
    // while the prompt shows - not just visually covered - so a hidden control cannot
    // "respond" to an accessibility-service click that bypasses hit-testing.
    expect(await page.locator('#app-root').evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');
    expect(await page.locator('#safe-layer').evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');
    await expect(page.getByRole('button', { name: 'Start' })).not.toBeVisible();

    // §6.2.1 behavior 3: the prompt (opaque, full-viewport, highest z-index in
    // android.css) takes every pointer event - sampled at the corners and center, not
    // just one point.
    for (const [x, y] of [
      [5, 5],
      [595, 5],
      [5, 355],
      [595, 355],
      [300, 180],
    ]) {
      const hitsPrompt = await page.evaluate(
        ([px, py]) => !!document.elementFromPoint(px, py)?.closest('.rotate-prompt'),
        [x, y] as const,
      );
      expect(hitsPrompt, `(${x}, ${y}) did not resolve inside the prompt`).toBe(true);
    }

    // S2 (round8): also capture whether any shell overlay is open and #app-root's/
    // #safe-layer's visibility, so "5 taps change nothing" covers more than `state`.
    const captureExtra = () =>
      page.evaluate(() => ({
        helpHidden: document.querySelector('[aria-label="How to play"]')?.classList.contains('hidden') ?? true,
        settingsHidden: document.querySelector('[aria-label="Settings"]')?.classList.contains('hidden') ?? true,
        appRootVisibility: getComputedStyle(document.getElementById('app-root')!).visibility,
        safeLayerVisibility: getComputedStyle(document.getElementById('safe-layer')!).visibility,
      }));

    const before = await snapshot(page);
    const beforeExtra = await captureExtra();
    for (const [x, y] of [
      [5, 5],
      [595, 5],
      [5, 355],
      [595, 355],
      [300, 180],
    ]) {
      await page.mouse.click(x, y);
    }
    const after = await snapshot(page);
    const afterExtra = await captureExtra();
    expect(after.state, '5 taps must change nothing (M2.10a (a))').toBe(before.state);
    expect(afterExtra, '5 taps must not open a shell overlay or change hidden-layer visibility').toEqual(beforeExtra);
  });

  test('a portrait-shaped window shows the rotate text, never the too-small text, even though it is also too small', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/?e2e=1');

    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeVisible();
    expect(await promptText(page)).toBe(PORTRAIT_TEXT);
  });

  test('640x360 plays with no prompt; 600x360 shows the prompt (M2.10a (c) boundary)', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/?insets=24,24,0,24&e2e=1');
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeHidden();

    await page.setViewportSize({ width: 600, height: 360 });
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeVisible();
    expect(await promptText(page)).toBe(TOO_SMALL_TEXT);
  });

  test('shrinking below the floor during play pauses and shows the prompt; restoring returns the pause menu with run state intact', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/?insets=24,24,0,24&e2e=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // First run on a fresh profile: Start opens Help ("Got it" is what starts PLAYING).
    await page.locator('[data-action="start"]').click();
    await page.locator('[data-action="help-dismiss"]').click();
    await expect(page.locator('.touch-button--throw')).toBeVisible();

    const before = await snapshot(page);
    expect(before.state).toBe('PLAYING');

    // M2.9/§6.2.1 behavior 1: a viewport size change that drops the window below the
    // floor pauses immediately and shows the prompt.
    await page.setViewportSize({ width: 600, height: 360 });
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeVisible();
    expect(await promptText(page)).toBe(TOO_SMALL_TEXT);
    await expect.poll(async () => (await snapshot(page)).state, 'state after shrinking').toBe('PAUSED');
    // code-review-round8 R1: hidden while the prompt shows.
    expect(await page.locator('#app-root').evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');
    expect(await page.locator('#safe-layer').evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');

    // §6.2.1 behavior 5: restoring returns to the PAUSED pause menu (never auto-resumes),
    // with every gameplay field exactly as it was before the shrink.
    await page.setViewportSize({ width: 640, height: 360 });
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeHidden();
    await expect.poll(async () => (await snapshot(page)).state, 'state after restoring').toBe('PAUSED');
    // code-review-round8 R1: restored to visible, and the pause menu is actually
    // visible to the player again, not just present in `state`.
    expect(await page.locator('#app-root').evaluate((el) => getComputedStyle(el).visibility)).toBe('visible');
    expect(await page.locator('#safe-layer').evaluate((el) => getComputedStyle(el).visibility)).toBe('visible');
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

    const after = await snapshot(page);
    expect(after.score).toBe(before.score);
    expect(after.lives).toBe(before.lives);
    expect(after.level).toBe(before.level);
    expect(after.enemies).toEqual(before.enemies);
    expect(after.effects).toEqual(before.effects);
  });

  // S1 (round8): §12 MR20 names "Playwright checks (§10.1)" as the mitigation for a
  // hardware keyboard resuming the hidden pause menu while the too-small prompt shows,
  // but no spec exercised the keyboard path before this - only device-matrix `keyevent`
  // runs did. This is regression cover for AndroidPlatform.onFrame's MR20 re-pause guard.
  test('a hardware Escape cannot resume play while the too-small prompt hides the pause menu (§12 MR20)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/?insets=24,24,0,24&e2e=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.locator('[data-action="start"]').click();
    await page.locator('[data-action="help-dismiss"]').click();
    await expect(page.locator('.touch-button--throw')).toBeVisible();
    expect((await snapshot(page)).state).toBe('PLAYING');

    await page.setViewportSize({ width: 600, height: 360 });
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeVisible();
    await expect.poll(async () => (await snapshot(page)).state).toBe('PAUSED');
    const beforeEnemies = (await snapshot(page)).enemies;

    // MR20: Esc would resume PAUSED -> PLAYING (F6 AC3) if it reached the hidden pause
    // menu's keyboard handler - the guard must re-pause every frame the prompt shows.
    await page.keyboard.press('Escape');
    // Two animation frames, so onFrame's re-pause guard has run at least once even if
    // the resume itself landed on the very next frame.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const after = await snapshot(page);
    expect(after.state, 'MR20 guard must keep the window in PAUSED, not resume to PLAYING').toBe('PAUSED');
    expect(after.enemies).toEqual(beforeEnemies);
  });

  test('the back handler leaves the app before it would close a hidden Settings overlay (§8.3 Amendment A11)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    // Planning insets so 600x360 is actually below the floor (minW 624) - at the
    // default zero insets, 600 alone is still >= minW (576) and stays 'playable'.
    await page.goto('/?insets=24,24,0,24&e2e=1');

    await page.locator('[data-action="settings"]').click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();

    await page.setViewportSize({ width: 600, height: 360 });
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeVisible();

    const decision = await page.evaluate(() => window.__vvsTest!.resolveBack());
    expect(decision, 'RotatePrompt must win over the hidden Settings overlay').toBe('leaveApp');
  });

  test('without a prompt showing, back still resolves to closing an open overlay (unchanged ordering)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/?e2e=1');

    await page.locator('[data-action="settings"]').click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();

    const decision = await page.evaluate(() => window.__vvsTest!.resolveBack());
    expect(decision).toBe('closeOverlay');
  });
});

test.describe('M2.10a (c) v1.6: the measured-inset boundary (§6.2.1 Amendment A12)', () => {
  test('640x360 plays with no prompt; 600x360 shows the prompt, with measured gesture insets (30,30,28.2,32)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/?insets=30,30,28.2,32&e2e=1');
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeHidden();

    await page.setViewportSize({ width: 600, height: 360 });
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeVisible();
    expect(await promptText(page)).toBe(TOO_SMALL_TEXT);
  });

  // The A11 test at 600x360 with the planning insets stays (above, in this file).
});

test.describe('Keyboard under the prompt (code-review-round8 I3; §12 MR20 regression cover)', () => {
  async function waitTwoFrames(page: Page): Promise<void> {
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }

  test('a hardware Enter on TITLE under the too-small prompt does nothing - state stays TITLE, Help is not shown', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 600, height: 360 });
    await page.goto('/?insets=24,24,0,24&e2e=1');
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeVisible();

    await page.keyboard.press('Enter');
    await waitTwoFrames(page);

    expect((await snapshot(page)).state).toBe('TITLE');
    const helpHidden = await page.evaluate(
      () => document.querySelector('[aria-label="How to play"]')?.classList.contains('hidden') ?? true,
    );
    expect(helpHidden, 'Help must not have opened').toBe(true);
  });

  test('Escape/Escape/Enter under the too-small prompt cannot resume a hidden pause menu; restoring shows it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/?insets=24,24,0,24&e2e=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.locator('[data-action="start"]').click();
    await page.locator('[data-action="help-dismiss"]').click();
    await expect(page.locator('.touch-button--throw')).toBeVisible();
    expect((await snapshot(page)).state).toBe('PLAYING');

    await page.setViewportSize({ width: 600, height: 360 });
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeVisible();
    await expect.poll(async () => (await snapshot(page)).state).toBe('PAUSED');
    const before = await snapshot(page);

    // Escape (would close a VISIBLE pause menu's confirm/close a shell overlay) then
    // Enter (would resume PAUSED -> PLAYING, F6 AC3) - none of this may reach the
    // hidden pause menu while the prompt shows (§6.2.1 A12 behavior 4).
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Enter');
    await waitTwoFrames(page);

    const after = await snapshot(page);
    expect(after.state, 'the keyboard gate must keep the window PAUSED, not resume it').toBe('PAUSED');
    // L2 (c) (code-review-round9.md): §10.1 A12 says compare the whole snapshot, not
    // just enemies/score - PAUSED freezes every field this hook returns, including the
    // countdown timers (levelIntroRemaining, enemyFireCooldownRemaining,
    // bossWarningRemaining, etc.), so a full deep-equal is the actual guard against a
    // timer that keeps ticking under a hidden pause menu. `snapshot()` is deep-frozen,
    // structuredClone'd game state (AndroidPlatform.ts's installE2eTestHook), not
    // wall-clock/random data, so there is no field here that legitimately varies run to
    // run - if one is ever added, this comparison must start excluding it explicitly.
    expect(after).toEqual(before);

    await page.setViewportSize({ width: 640, height: 360 });
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  });

  test('with Settings open underneath, Escape under the prompt leaves it open; it is visible again after the restore', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/?insets=24,24,0,24&e2e=1');

    await page.locator('[data-action="settings"]').click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();

    await page.setViewportSize({ width: 600, height: 360 });
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeVisible();

    // Pre-A12: this Escape would have reached AndroidOverlays' un-gated listener
    // (`this.stack.length === 0` was false, since Settings was still pushed) and
    // closed the HIDDEN Settings overlay via `closeTopOverlay()` - exactly the I3 gap.
    await page.keyboard.press('Escape');
    await waitTwoFrames(page);

    await page.setViewportSize({ width: 640, height: 360 });
    await expect(page.locator(ROTATE_PROMPT_SELECTOR)).toBeHidden();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  });
});
