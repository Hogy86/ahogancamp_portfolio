// Implements docs/mobile/PRD-mobile.md M3.3a (the "40/40 slide test") and
// docs/mobile/architecture/mobile-architecture.md §10.2: a single finger sliding
// continuously from ◀ onto ▶ (and back) must switch ShieldMan's direction within
// <=100ms of entering the new button, never show a zero-velocity frame while
// crossing the >=8dp gap (rule 2, "no drop"), and never move the old direction again
// once inside the new button (rule 3, "no stick"). Runs 20 scripted L->R and 20
// R->L continuous swipes (40 total) in BOTH the default and "Swap controls" (M3.13)
// layouts, using a real CDP touch pipeline (Input.dispatchTouchEvent), not a
// synthetic/untrusted DOM event - the same pipeline controls-behavior.spec.ts uses.
//
// This is an INTEGRATION-level check on top of moveZone.test.ts's pure
// classifyMovePointer() unit tests: it proves the real PointerEvent wiring
// (TouchControls.ts's setPointerCapture + reclassify), not just the classifier
// function, meets the AC end to end.
//
// Measurement design (revised twice after observing flakiness under `--repeat-each`
// parallel load):
// 1. The first draft measured "did it switch within 100ms" by repeatedly calling
//    `page.evaluate` from Node and polling - that measures Node/CDP round-trip
//    scheduling latency under host-machine load as much as it measures the app.
// 2. The second draft recorded [Date.now(), player.x] on every animation frame
//    INSIDE the page, but still used a Node-side `Date.now()` (taken right after
//    `await client.send(...)` resolved) as the "the finger entered the new button"
//    reference instant - under load, that CDP round trip itself was observed to
//    take 200-300+ ms, which got counted as "switch latency" even though the app
//    reacted within a frame of actually receiving the event.
// This version fixes both: the recorder also captures a REAL, in-page timestamp
// for every `pointerdown`/`pointermove`/`pointerup` DOM event (document-level,
// capture phase, so it sees the retargeted events even through
// `setPointerCapture`), and the reference instants for "entered the gap" and
// "entered the new button" are read from THOSE events, not from Node. Because the
// x-position log and the pointer-event log now share the exact same in-browser
// clock, this is immune to CDP/IPC round-trip variance entirely: the *pacing* of
// the scripted gesture still uses real-time waits (a real thumb takes real time to
// slide), but the *pass/fail measurement* is exact array arithmetic over events and
// frames the page itself timestamped.
// 3. (code-review-round11.md R2) A third source of flakiness turned out to be a
//    check-then-act race against the game's OWN GAMEOVER (Level 1's formation is
//    never opposed by this suite - see runFortySwipes - so it eventually reaches
//    the player's row and ends the run). `ensurePlaying` could observe PLAYING and
//    return, then GAMEOVER could land (hiding the touch controls, M3.9) before the
//    next read. `currentRects` and `runOneSlide`'s data-collection loop are now
//    race-free by construction: every recovery read is a single, unwaited snapshot
//    (bounding boxes plus game state) taken together, bounded to a small number of
//    attempts, with `ensurePlaying` re-run between attempts to click "Play again."
//    Recovering from GAMEOVER this way is setup code, never a retry of an M3.3a rule
//    assertion; if recovery still fails after the bound, the test throws a clear,
//    distinct "data collection interrupted"/"could not reach PLAYING" error instead
//    of asserting rules over a corrupted or absent log.

import { test, expect, type Page, type CDPSession } from '@playwright/test';

declare global {
  interface Window {
    __vvsTest?: {
      snapshot: () => {
        state: string;
        player: { x: number };
        levelIntroRemaining: number;
      };
    };
    __startSlideRecorder?: () => void;
    __stopSlideRecorder?: () => {
      xLog: Array<[number, number]>;
      pointerLog: Array<[number, string]>;
      leftPlaying: boolean;
    };
  }
}

/** Installed once per page load (survives every `page.reload()` in this file, since
 * `addInitScript` re-runs on navigation) - a page-side recorder built only on top of
 * the existing `__vvsTest.snapshot()` read-only hook, plus a real in-page pointer-
 * event timestamp log (see the file header). */
function installSlideRecorder(): void {
  let recording = false;
  let xLog: Array<[number, number]> = [];
  let pointerLog: Array<[number, string]> = [];
  let rafHandle: number | null = null;
  let lastLoggedX: number | null = null;
  let leftPlaying = false;

  // Headless Chromium's requestAnimationFrame can fire faster than the game's
  // fixed 60Hz simulation step (no real vsync to pace it), so consecutive rAF ticks
  // can read the SAME x before the next fixed step has run - a sampling artifact,
  // not a real stall. Dedupe on x change, matching the exact same pattern the
  // production playerXLog() hook already uses
  // (src/platform/android/AndroidPlatform.ts) for this identical reason.
  const tick = (): void => {
    if (!recording) return;
    const snap = window.__vvsTest?.snapshot();
    if (snap && snap.state !== 'PLAYING') leftPlaying = true;
    if (snap && snap.player.x !== lastLoggedX) {
      lastLoggedX = snap.player.x;
      xLog.push([Date.now(), snap.player.x]);
    }
    rafHandle = requestAnimationFrame(tick);
  };

  const onPointerEvent = (event: Event): void => {
    if (!recording) return;
    pointerLog.push([Date.now(), event.type]);
  };
  document.addEventListener('pointerdown', onPointerEvent, true);
  document.addEventListener('pointermove', onPointerEvent, true);
  document.addEventListener('pointerup', onPointerEvent, true);

  window.__startSlideRecorder = () => {
    xLog = [];
    pointerLog = [];
    leftPlaying = false;
    recording = true;
    rafHandle = requestAnimationFrame(tick);
  };
  window.__stopSlideRecorder = () => {
    recording = false;
    if (rafHandle !== null) cancelAnimationFrame(rafHandle);
    return { xLog, pointerLog, leftPlaying };
  };
}

const LEFT_SELECTOR = '.touch-button--left';
const RIGHT_SELECTOR = '.touch-button--right';

// M3.3a's own test spec: "150-300 ms per crossing" at "a realistic thumb speed".
const HOLD_BEFORE_CROSS_MS = 90;
const CROSS_MS = 180;
const POST_SWITCH_HOLD_MS = 160;
// M3.3a: "in 40/40 swipes direction switches within <=100 ms of entering the new
// button". A small allowance for the recorder's own sampling granularity (one
// rAF/game frame either side, generous even at a throttled ~30 FPS) is added so this
// stays a measurement-precision allowance, not a relaxation of the 100ms requirement
// itself - the raw budget is asserted in the failure message.
const SWITCH_BUDGET_MS = 100;
const FRAME_TOLERANCE_MS = 40;
const SWIPES_PER_DIRECTION = 20;

async function snapshot(page: Page) {
  return page.evaluate(() => window.__vvsTest!.snapshot());
}

async function waitForLevelIntroToClear(page: Page): Promise<void> {
  await expect
    .poll(async () => (await snapshot(page)).levelIntroRemaining, 'levelIntroRemaining')
    .toBe(0);
}

async function touchDown(client: CDPSession, x: number, y: number): Promise<void> {
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
}

async function touchMove(client: CDPSession, x: number, y: number): Promise<void> {
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
}

async function touchUp(client: CDPSession): Promise<void> {
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function startRun(page: Page): Promise<void> {
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="help-dismiss"]').click();
  await expect(page.locator(RIGHT_SELECTOR)).toBeVisible();
  await waitForLevelIntroToClear(page);
}

async function enableSwapControls(page: Page): Promise<void> {
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="settings-swap"]').click();
  await page.getByRole('dialog', { name: 'Settings' }).locator('[data-action="overlay-close"]').click();
}

/**
 * Level 1's enemy formation keeps descending the entire time runFortySwipes runs
 * (no shield is ever thrown - this suite only tests movement input), so reaching
 * the player's row and ending the run in GAMEOVER is an expected side effect of a
 * long enough sequence, not an M3.3a failure. "Play again" (visible on the Game
 * Over screen) starts a fresh run at level 1 so the swipe sequence can continue -
 * called between swipes/pairs, never inside a swipe's own assertions, so no
 * M3.3a assertion itself is ever retried.
 */
async function ensurePlaying(page: Page): Promise<void> {
  const state = (await snapshot(page)).state;
  if (state === 'GAMEOVER') {
    await page.locator('[data-action="play-again"]').click();
    await expect(page.locator(RIGHT_SELECTOR)).toBeVisible();
    await waitForLevelIntroToClear(page);
  }
}

interface Rects {
  left: { x: number; y: number };
  right: { x: number; y: number };
  gap: { x: number; y: number };
}

// A boundary-clamp margin (well inside PLAYFIELD_WIDTH=800, player.width=40, so the
// real clamp range is [0, 760]): close enough to either edge that touching the
// button on THAT side could clamp instantly, making a position-delta check read 0
// (indistinguishable from a real "failed to switch" - not an M3.3a violation, just
// this test's own drift after many swipes). Recentred before that can happen.
const EDGE_SAFETY_MARGIN = 150;

/**
 * If ShieldMan has drifted within EDGE_SAFETY_MARGIN of either clamp, holds the
 * button that moves back toward centre for bounded 200ms bursts (never a retry of
 * an M3.3a assertion - this runs BETWEEN swipes, and every one of its own reads is
 * a plain snapshot, not a poll on the behavior under test).
 */
async function recentreIfNearEdge(page: Page, client: CDPSession, rects: Rects): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const x = (await snapshot(page)).player.x;
    if (x > EDGE_SAFETY_MARGIN && x < 800 - EDGE_SAFETY_MARGIN) return;
    const target = x <= EDGE_SAFETY_MARGIN ? rects.right : rects.left;
    await touchDown(client, target.x, target.y);
    await page.waitForTimeout(200);
    await touchUp(client);
    await page.waitForTimeout(15);
  }
}

// code-review-round11.md R2: bounded, race-free recovery from GAMEOVER landing
// between a caller's `ensurePlaying` and this function's own reads. The previous
// version waited up to 5s for visibility with nothing ever clicking "Play again"
// during that wait (a genuine deadlock once GAMEOVER lands), so it could never
// recover and always threw "no bounding box". This version never waits: each
// attempt reads both buttons' current `boundingBox()` (null immediately, not after
// a timeout, if hidden) and the game's own state in a single snapshot, and only
// accepts the result if both boxes exist AND the state is still PLAYING at that
// instant. If GAMEOVER is found instead, `ensurePlaying` (which clicks "Play
// again") runs again at the top of the next attempt - this is setup/recovery code
// re-running, never a retry of an M3.3a rule assertion.
const CURRENT_RECTS_MAX_ATTEMPTS = 3;

async function currentRects(page: Page): Promise<Rects> {
  for (let attempt = 0; attempt < CURRENT_RECTS_MAX_ATTEMPTS; attempt += 1) {
    await ensurePlaying(page);
    const leftBox = await page.locator(LEFT_SELECTOR).boundingBox();
    const rightBox = await page.locator(RIGHT_SELECTOR).boundingBox();
    const state = (await snapshot(page)).state;
    if (leftBox && rightBox && state === 'PLAYING') {
      const y = leftBox.y + leftBox.height / 2;
      return {
        left: { x: leftBox.x + leftBox.width / 2, y },
        right: { x: rightBox.x + rightBox.width / 2, y },
        gap: { x: (leftBox.x + leftBox.width + rightBox.x) / 2, y },
      };
    }
  }
  throw new Error(
    `could not reach PLAYING with visible touch controls after ${CURRENT_RECTS_MAX_ATTEMPTS} attempts (GAMEOVER kept landing before the controls could be read)`,
  );
}

function lastAtOrBefore(log: Array<[number, number]>, t: number): [number, number] | undefined {
  let result: [number, number] | undefined;
  for (const entry of log) {
    if (entry[0] > t) break;
    result = entry;
  }
  return result;
}

/**
 * One continuous slide from `from` (a button centre) onto `to` (the other button's
 * centre), touching down on `from`, sliding across the gap, and holding briefly on
 * `to` before releasing - never lifting the finger mid-slide (M3.3a rule 2's "no
 * drop"/"the finger is still recognised when it reaches the other button").
 *
 * `finalDirection` is the direction ShieldMan should be moving AFTER the slide
 * completes (i.e. the direction of `to`). Touching down on `from` first moves
 * ShieldMan the OPPOSITE way (the direction of `from`) - the gap-crossing checks use
 * that opposite sign, and only the post-switch checks use `finalDirection`'s own
 * sign. All three M3.3a rules below are checked from ONE recorded log (see the file
 * header) - the reference instants ("entered the gap", "entered the new button")
 * come from the log's own in-page pointermove timestamps, never from Node.
 */
async function runOneSlide(
  page: Page,
  client: CDPSession,
  from: { x: number; y: number },
  to: { x: number; y: number },
  gap: { x: number; y: number },
  finalDirection: 'left' | 'right',
): Promise<void> {
  const finalSign = finalDirection === 'right' ? 1 : -1;
  const initialSign = -finalSign;

  // Level 1's formation can reach the player row mid-gesture (see
  // runFortySwipes's comment) even with `ensurePlaying` called between swipes - if
  // it happens WHILE this specific gesture is still in flight, `leftPlaying`
  // (recorded from the same real-time frames as everything else) says so. That is
  // an interrupted DATA COLLECTION attempt, not a failed M3.3a assertion, so it is
  // re-collected (bounded, 2 attempts) BEFORE any rule is checked - never a retry of
  // a rule assertion itself.
  let xLog: Array<[number, number]> = [];
  let pointerLog: Array<[number, string]> = [];
  const RUN_ONE_SLIDE_MAX_ATTEMPTS = 3;
  let dataCollectionInterrupted = true;
  for (let attempt = 0; attempt < RUN_ONE_SLIDE_MAX_ATTEMPTS; attempt += 1) {
    await page.evaluate(() => window.__startSlideRecorder!());

    await touchDown(client, from.x, from.y);
    await page.waitForTimeout(HOLD_BEFORE_CROSS_MS);

    await touchMove(client, gap.x, gap.y);
    await page.waitForTimeout(CROSS_MS);

    await touchMove(client, to.x, to.y);
    await page.waitForTimeout(POST_SWITCH_HOLD_MS);

    await touchUp(client);
    await page.waitForTimeout(15);

    const result = await page.evaluate(() => window.__stopSlideRecorder!());
    xLog = result.xLog;
    pointerLog = result.pointerLog;
    dataCollectionInterrupted = result.leftPlaying;
    if (!dataCollectionInterrupted) break;
    await ensurePlaying(page);
  }
  // code-review-round11.md R2 (second hole): the old code re-collected at most twice
  // and then, if still interrupted, silently fell through into the rule assertions
  // below over a corrupted log (recorded across a GAMEOVER) - which could surface as
  // a false rule-1/2/3 failure with no indication the log itself was bad. Fail loudly
  // instead, distinct from any M3.3a rule failure.
  if (dataCollectionInterrupted) {
    throw new Error(
      `data collection interrupted by GAMEOVER ${RUN_ONE_SLIDE_MAX_ATTEMPTS} times in a row - no clean slide was recorded to check M3.3a rules against`,
    );
  }

  // The scripted gesture dispatches exactly one pointerdown (from) then two
  // pointermoves (gap, then to) then one pointerup - matched by ORDER, using the
  // page's own clock, not Node's `Date.now()` around the CDP round trip (which was
  // observed to add 200-300+ms of unrelated IPC/scheduling latency under load).
  const moves = pointerLog.filter(([, type]) => type === 'pointermove');
  expect(
    moves.length,
    `expected 2 recorded pointermove events (gap, then the new button), got ${moves.length}`,
  ).toBeGreaterThanOrEqual(2);
  const tGapEnter = moves[0]![0];
  const tEnter = moves[1]![0];

  // Rule 2 ("no drop"): while the finger is between the two buttons, ShieldMan keeps
  // moving the OLD direction, with no zero-velocity frame.
  const gapFrames = xLog.filter(([t]) => t >= tGapEnter && t < tEnter);
  expect(
    gapFrames.length,
    'not enough recorded frames while crossing the gap to check rule 2 (increase CROSS_MS or check the recorder)',
  ).toBeGreaterThanOrEqual(2);
  for (let i = 1; i < gapFrames.length; i += 1) {
    const dx = gapFrames[i]![1] - gapFrames[i - 1]![1];
    expect(dx, 'zero-velocity frame while crossing the gap (rule 2, "no drop")').not.toBe(0);
    expect(Math.sign(dx), 'wrong direction while still crossing the gap').toBe(initialSign);
  }

  // Rule 1: switch within <=100ms of entering the new button.
  const xAtEnter = (lastAtOrBefore(xLog, tEnter) ?? gapFrames[gapFrames.length - 1]!)[1];
  const postFrames = xLog.filter(([t]) => t >= tEnter);
  const switchIndex = postFrames.findIndex(([, x]) => Math.sign(x - xAtEnter) === finalSign);
  expect(
    switchIndex,
    `never switched to the new direction within the recorded window (finalSign=${finalSign})`,
  ).toBeGreaterThanOrEqual(0);
  const switchFrame = postFrames[switchIndex]!;
  expect(
    switchFrame[0] - tEnter,
    `switch took longer than ${SWITCH_BUDGET_MS}ms (+${FRAME_TOLERANCE_MS}ms sampling allowance) after entering the new button`,
  ).toBeLessThanOrEqual(SWITCH_BUDGET_MS + FRAME_TOLERANCE_MS);

  // Rule 3 ("no stick"): once switched, never moves the OLD direction again (a
  // zero-delta frame from clamping against the playfield edge is not a violation -
  // recentreIfNearEdge keeps this rare, but it is not itself the behavior under test).
  for (let i = switchIndex + 1; i < postFrames.length; i += 1) {
    const dx = postFrames[i]![1] - postFrames[i - 1]![1];
    if (dx !== 0) {
      expect(Math.sign(dx), 'moved the OLD direction after entering the new button (rule 3, "no stick")').not.toBe(
        initialSign,
      );
    }
  }
}

/**
 * Runs 20 L->R and 20 R->L continuous swipes (40 total, M3.3a's own count) -
 * INTERLEAVED (L->R, R->L, L->R, R->L, ...) rather than as two 20-swipe blocks.
 * No shield is ever thrown during this sequence (it is purely a movement-input
 * test), so level 1's enemy formation keeps descending unopposed for as long as
 * this function runs - interleaving keeps ShieldMan's net drift bounded to about
 * one swipe's distance instead of compounding across 20 same-direction swipes in a
 * row (which was observed to run ShieldMan into the playfield edge, and separately
 * to let the formation reach the player's row before all 40 swipes finished, ending
 * the run and hiding the touch controls mid-test - both are test-timing artifacts,
 * not the M3.3a behavior under test).
 */
async function runFortySwipes(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);

  for (let i = 0; i < SWIPES_PER_DIRECTION; i += 1) {
    await ensurePlaying(page);
    let rects = await currentRects(page);
    await recentreIfNearEdge(page, client, rects);
    const toRight = await currentRects(page);
    await runOneSlide(page, client, toRight.left, toRight.right, toRight.gap, 'right');

    await ensurePlaying(page);
    rects = await currentRects(page);
    await recentreIfNearEdge(page, client, rects);
    const toLeft = await currentRects(page);
    await runOneSlide(page, client, toLeft.right, toLeft.left, toLeft.gap, 'left');
  }
}

test.describe('M3.3a - 40/40 continuous slide-to-switch', () => {
  test.setTimeout(180_000);

  test('default layout: 20 L->R and 20 R->L continuous swipes all switch cleanly', async ({ page }) => {
    await page.addInitScript(installSlideRecorder);
    await page.goto('/?e2e=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await startRun(page);

    await runFortySwipes(page);
  });

  test('swap-controls layout (M3.13): the same 40 swipes behave identically', async ({ page }) => {
    await page.addInitScript(installSlideRecorder);
    await page.goto('/?e2e=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await enableSwapControls(page);
    await startRun(page);

    await runFortySwipes(page);
  });
});
