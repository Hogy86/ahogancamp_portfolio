# ADR M-0005: Lifecycle, back, quit, keep-awake, and elapsed-time timing

## Status: Proposed

## Context
- M4.1-M4.6: auto-pause on any loss of foreground (including the notification shade and
  system dialogs), no simulated time while away, explicit Resume, the Game Complete hold,
  and keep-awake only during play. Process death returns to the title.
- M5 back table + M5.3 predictive back. M6 Quit closes the app and saves the best first.
- M10.2: same real-time speed at 30/60/90/120 Hz. M10.6: no loop or wake lock in the
  background.
- F20 AC4(e): save the best when leaving mid-run (page hidden on web, background on
  Android).
- The existing `GameLoop` clamps a long gap to 0.25 s, then processes it. After returning
  from background that is up to 15 steps. They are harmless while PAUSED, but they would
  advance a VICTORY countdown.

## Decision
1. **Triggers (Android):**
   - `@capacitor/app` `pause`, and `visibilitychange → hidden` → `pauseForInterruption()`,
     `loop.suspend()`, keep-awake off.
   - GameShell `windowFocusChanged(false)` (shade, dialogs) → `pauseForInterruption()`.
   - `resize` (viewport size) → `pauseForInterruption()` + re-layout.
   - `resume` → `loop.resume()` only. The state stays PAUSED.
2. **`pauseForInterruption()` is shared and pure:** PLAYING → PAUSED, VICTORY → held,
   others unchanged, then `bestScore.commitIfRunActive`. The web calls only the best-score
   part on page-hidden (the website is unchanged, OQ-M10 (a)).
3. **Loop clock.** `suspend()` cancels rAF. `resume()` resets `lastTimestamp` and
   `accumulator` so no time is caught up. The fixed 1/60 s accumulator from W-ADR-0002 is
   kept as the frame-rate-independence mechanism.
4. **Back:** one `App` `backButton` listener (an `OnBackPressedCallback` inside the plugin,
   predictive-back compatible). Shell overlays close first. RotatePrompt →
   `minimizeApp()`. Otherwise shared `handleBack()` implements the M5 table and returns
   `'leaveApp'` on TITLE → `App.minimizeApp()`.
5. **Quit:** shared `quit()` commits the best, then `services.quitApp()` → `App.exitApp()`.
   The tab-close fallback never shows.
6. **Keep-awake:** GameShell sets/clears `FLAG_KEEP_SCREEN_ON` when
   `state === 'PLAYING'` changes. No `WAKE_LOCK` permission.
7. **Help/settings** are Android shell overlays on TITLE. Start runs help-then-`startRun()`
   on the first launch.

## Alternatives Considered (and why rejected)
- **`visibilitychange` only.** Rejected. It does not fire for the notification shade or
  system dialogs, which M4.1 lists.
- **Auto-resume on return.** Rejected by M4.3 / UX round 1 decision 4.
- **Deleting the 0.25 s clamp instead of resetting the clock.** Rejected. The clamp still
  protects against long hitches while in the foreground (spiral of death, W-ADR-0002).
- **A variable-timestep loop (dt = frame delta).** Rejected. It would change collision and
  bounce determinism that the web tests rely on (W-ADR-0002). The fixed step already
  provides frame-rate independence.
- **Saving run state on background (full resume after process death).** Rejected by
  OQ-M9 (a).
- **`exitApp()` for back on the title.** Rejected in favor of `minimizeApp()`, which
  matches Android 12+ root-activity back behavior (the task moves to background). `exitApp`
  is kept for an explicit Quit (M6.1).
- **Screen Wake Lock API from JS.** Rejected. Android System WebView does not support it.
  A native window flag needs no permission.
- **Letting the default `onBackPressed` exit the app from play.** Rejected by M5.2.

## Consequences
- A new shared `returnToTitle()` command exists that only Android back uses today. The web
  never calls it, so web behavior is unchanged.
- Timing tests at 8.33/11.11/16.67/33.3 ms frame intervals and a suspend/resume test run
  in Vitest for both platforms.
- The 90 Hz 3:2 frame-repeat judder is accepted for v1 (risk MR8).
- Traces to: M4.1-M4.7, M5, M5.3, M6.1-M6.3, M10.2, M10.6, F19 AC9, F20 AC4, W-ADR-0002;
  `mobile-architecture.md` §8.

## Amendment note (2026-09-27, architecture v1.5, Amendment A11)
Recorded by the main session because the architect could not list this directory. The Decision text above is kept as the historical record; where later text differs, it wins.
- PRD-mobile v1.5 M2.10a (too-small window, any shape) is specified in mobile-architecture.md §6.2.1 (A11): portrait windows keep M2.10's prompt; a landscape window with `W < l + r + 576` or `H < t + b + 300` (run-time insets) pauses and shows "Make the window larger to play." The playfield never renders below 0.5×; the old fixed `W < 640 || H < 360` rule is replaced.
- Back order (§8.3, A11): the too-small/rotate prompt is checked before any open overlay, so Back leaves the app while the prompt shows.

## Amendment note (2026-09-28, architecture v1.6, Amendment A12)
Written by mobile-solution-architect. The Decision text above is kept as the historical
record; where later text differs, it wins. Full specification: `mobile-architecture.md`
§6.2.1 A12 (behavior 4), §10.1 A12 and §12 MR20.

- **The floor changed; the lifecycle rules did not.** The too-small height test is now
  `H ≥ max(cT, t − 2) + max(cB, b − 6.5) + 300` (PRD-mobile v1.6 M2.3b; see M-ADR-0004's
  A12 note). The width test (`W ≥ l + r + 576`) is unchanged. So are pause on entering a
  prompt, restore to the pause menu, and back leaving the app with the prompt checked first.
- **Keyboard under a size or rotate prompt (code-review-round8 I3): decided to gate it,
  not accept it.** Before A12, a hardware Enter on a hidden title started a run that was
  then paused at once. Esc or Enter on a hidden pause menu let one frame of play pass
  (≈ 16 ms, up to 0.25 s on a stalled frame) before the `onFrame` guard re-paused it. Both
  break M2.10a behavior 3 ("no … menu … responds") and M4.2 (no game time passes while the
  prompt shows). Chromebooks with keyboards are an M1.3 target. The decision:
  - **Keydown is blocked while a prompt shows.** The Android-only capture-phase `document`
    `keydown` listener in `overlays.ts` (the one that already gates game keys under the
    shell overlays) checks the prompt **first**. While the prompt shows, it calls
    `preventDefault()` and `stopPropagation()` on every `keydown` and does nothing else.
    Esc does not close a hidden overlay, which matches the back order.
  - **Keyup passes**, so a key held before the prompt still releases normally and never
    sticks.
  - **Focus is cleared.** On entering a prompt, a focused element inside `#app-root` or
    `#safe-layer` (including the privacy iframe) is blurred.
  - **The `onFrame` re-pause guard stays** as defense in depth.
  - **No shared code changes**, and the web is unchanged.
- **Alternatives considered (and why rejected).**
  - **Accept and record.** Rejected. It leaves M2.10a behavior 3 and M4.2 broken on
    keyboard devices. It can also move a player from the title into a paused run they did
    not start.
  - **A hold flag in the shared `InputManager`.** Rejected. It is a shared-code change that
    would need the web gates. It also would not stop Android's own overlay Esc handler from
    closing a hidden overlay.
  - **`loop.suspend()` while a prompt shows.** Rejected. It competes with the lifecycle
    `resume()` for control of the loop, and key edges buffered during the prompt would
    fire after the restore.
- **Traces to:** PRD-mobile v1.6 M2.3b and the M2.10a v1.6 note; M2.10a behaviors 3-5;
  M4.2; M1.3; M3.10; code-review-round8 I3 and S1; MR20.
