# Code Review Round 20 — Android top banner (UAT round 2 F4)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: **PASS** (LOW findings only)

**Stage:** Mobile Pipeline step 8 — mobile-lead-developer. **Date:** 2026-10-04.
**Reviewed:** uncommitted diff vs HEAD `783b6de` on `claude/project-thread-rm5222`, plus untracked
`src/platform/android/topBanner.ts` and `tests/mobile-e2e/robot-warning.spec.ts`.
**Input:** `docs/mobile/tests/uat-results-round2.md` F4; PRD-mobile M2.3, M2.3b rule 2, M2.6, M2.11;
PRD F3 AC6, NFR-9(a), F12 AC10-11; `mobile-architecture.md` §6.5 A12, §14.1 L4a; skills
coding-standards and mobile-touch-and-layout.

mobile-junior-tester may start. L1 and L4 go to the tester; L2 and L8 need a doc owner.

## What changed
On Android the words "WARNING: ROBOTS APPROACHING" and "BOSS INCOMING" are no longer drawn on the
canvas. One DOM element `#top-banner` sits directly below the HUD. The canvas borders are still
drawn. The website still draws the words on the canvas.

## Verification (all run this round)
| Command | Result |
|---|---|
| `npm run check:secrets` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test` | 657 passed, 32 files |
| `npm run build` | exit 0 |
| `npm run build:android` | exit 0 |
| `npm run check:android-styles` | exit 0 |
| Playwright mobile, `--repeat-each=3 --workers=4 --retries=0` | **753 passed**, 0 failed (8.9 min) |
| `scripts\refresh-android-mirror.ps1` | parity passed (140 files + 6 named) |
| Mirror: `build:android`, `npx cap sync android`, `gradlew.bat assembleDebug --no-daemon` | BUILD SUCCESSFUL |

- Debug APK: 3,964,097 bytes, SHA-256 `6bbda829…b2dfe7`.
- `npm run format` (not a required check) fails on 4 files this diff does not touch; the changed
  files pass Prettier.
- No emulator was started. No command was denied. The two preview servers I started were stopped
  and ports 4174/4175 are free. `git status` shows only the reviewed files plus one untracked
  file I did not create (`docs/reviews/code-review-v4-round1.md`, appeared during the run).

## Checks requested
| Check | Result | Evidence |
|---|---|---|
| Shows exactly when the canvas words did | PASS (by reading) | `topBannerFor` (`AndroidPlatform.ts:52-57`) uses the same gates as `CanvasRenderer.render` and `drawFormationWarning`/`drawBossWarning`: PLAYING or PAUSED, `bossWarningRemaining > 0`, `formationWarningActive`. `onFrame` runs after `renderer.render` in the same frame. No automated test covers it (L4). |
| PAUSED included | PASS | Probe: banner stays `display:block` with the same text after pausing, dimmed behind the pause overlay like the HUD. |
| Never overlaps the HUD | PASS | Probe on 9 windows × 2 fonts × 2 kinds: 3.3-9.3 dp gap below the lowest HUD panel. HUD text included "Score: 999999" and "Power ×18.90". |
| Inside playfield and insets | PASS | Left/right inside the canvas and top ≥ top inset in every case, including (30,30,24,32), (29.7,29.7,28.2,32) and (0,48,24,0). |
| A13 bound | PASS | 640×360 with (0,0,30,38.5), scale 0.5: banner 257-455 × 70-87.4 dp at default font, 228.7-483.3 × 78.5-100.2 at 1.3×. 640×364 with (0,0,24,48) is the same. |
| Enlarged font (1.3×) | PASS | Widest banner 255 dp in a 400 dp playfield; a wrapped HUD pushes it down, never under it. |
| Text size (M2.6) | PASS | 12.0 dp font on the phone windows (e.g. 23.76 logical px at 0.505×); box 17.4-18 dp tall. |
| Covers gameplay harmfully | PASS | Banner bottom is at most logical y 144. When the warning fires the lowest robot is at y ≥ 500, so with 6 rows the top row is at about y 242 or lower. The boss banner only shows after the formation is cleared. |
| Intercepts touches | PASS | `pointer-events: none`; `elementFromPoint` at the banner centre returns `#safe-layer`. It overlaps no touch control. |
| Accessibility | Not harmful | The words were invisible to a screen reader before; now they are readable but not announced (L7). The border remains the non-colour cue (NFR-9(a)). |
| Per-frame cost | PASS | `sync` writes the DOM only on a kind change or HUD-height change. One `offsetTop + offsetHeight` read per frame while showing, read before write, no loop. Nothing is read while hidden. |
| Website unchanged | PASS | The flag defaults to `true` and `WebPlatform` never calls the setter. Draw order and strings are identical. `dist/` contains both strings and no `top-banner`. |
| Hook gating | PASS | `showTopBanner` is inside `installE2eTestHook`, behind `?e2e=1` and `!Capacitor.isNativePlatform()`; the object is frozen. See L2. |
| One codebase | PASS | No game rule is branched. The shared constants only move two existing strings. |
| Lifecycle, back, timing, DPR, `android/` | PASS | No new listener or timer; nothing under `android/` edited by hand. |
| Playwright config | PASS | Host pinned to 127.0.0.1 and the readiness check is a URL. 753/753 with it. |

## Does the new spec discriminate?
I mutated copies of `dist-android` in the scratchpad and ran `robot-warning.spec.ts` (32 tests)
against each.

| Mutant | Result | Meaning |
|---|---|---|
| Gap below HUD −40 px (banner in the HUD row) | 19 failed | Catches F4. The 13 passes are wide windows where the banner fits between the two HUD groups. |
| `top` fixed at 47 px | 6 failed | Catches a banner that does not follow a wrapped HUD. |
| `transform` removed (not centred) | 5 failed | Catches overflow past the right edge. |
| `font-size: 8px` | **32 passed** | L1: the font check cannot fail. |
| `left: 0` (banner at the left edge) | 32 passed | Nothing asserts centring. |
| `pointer-events` removed | 32 passed | Not asserted. |
| `white-space: nowrap` removed | 32 passed | Layout still valid; acceptable. |

## menu-gaps.spec.ts:163 at 800x360
- Not reproduced: 3/3 in the full run, then 60/60 in a stress run of the whole file at 800x360
  (180/180 across its three tests, `--workers=6`).
- No race found by reading. Every measurement is a synchronous `evaluate` after synchronous DOM
  writes. There are no web fonts. `.menu-item` has `min-width: 220px`, so two buttons cannot
  share a 300 px box and the stacked layout is deterministic.
- Unconfirmed candidate: a refused connection on `page.goto` (reported against the test's
  first line), which the 127.0.0.1 pin addresses. I do not know whether the earlier failure
  predates that pin.
- If it recurs, `trace: 'retain-on-failure'` keeps the trace; attach the assertion text then.

## Findings (all LOW)
**L1 — `tests/mobile-e2e/robot-warning.spec.ts:54-59,111-116` — font-floor check is vacuous.**
The injected `!important` rule sets `#top-banner`'s font size itself, at factor 1 too, so
`fontPx >= hudPx` passes even with the banner's own rule deleted. Required (tester): at factor 1
do not override `#top-banner`, and assert `fontPx × scale ≥ 12 − tolerance` in dp. Re-run the
8 px mutant to confirm it fails.

**L2 — `AndroidPlatform.ts:326-328` — the hook now has a setter.** Architecture §14.1 L4a(1)
and security review-v1 L4 say `__vvsTest` exposes a read-only snapshot "with no setters".
Why I am not failing it: it changes presentation only, never the world; the gate and the
absence in native (L4a (2), (3)) are unchanged. Required follow-up, one of:
(a) mobile-solution-architect amends L4a to allow presentation-only setters and security pass 2
confirms; or (b) replace the setter with a boot-time query value read once inside the same gate.
Also fix the stale "read-only" doc comment at `:298` and the A11 comment at `:321-323`, which now
sits above `showTopBanner` instead of `resolveBack`.

**L3 — `android.css:468-472,490` — stale comments.** "robotWarning.ts sets `top`" should be
`topBanner.ts`. The block describes only the robots warning. "keeps its … dark outline" is
wrong: there is no outline, the dark background does that job.

**L4 — no test of the trigger mapping or the web default.** Nothing tests `topBannerFor`
(hidden outside PLAYING/PAUSED, boss wins, shown in PAUSED) or that `CanvasRenderer` still
draws both strings by default and skips them when disabled. Suggested (tester): export
`topBannerFor` or test through `onFrame` with jsdom; add a `CanvasRenderer` test with a mocked
2D context.

**L5 — `robot-warning.spec.ts` — smaller gaps.**
- `:75-76`: the comment says forcing the other kind swaps the element, but the test never does.
- `:94,100`: `scrollWidth <= clientWidth` is always true for a nowrap shrink-to-fit box.
- No assertion for the banner top ≥ top inset and bottom inside the canvas (M2.3b test (c)),
  for `pointer-events`, or for the A13 window.
- HUD fixture uses "Power ×9.99"; UAT observed ×18.90.

**L6 — `AndroidPlatform.ts:185` — silent fallback.** `?? ctx.dom.appRoot` would place the banner
at logical y 602 if `#hud-root` were missing. It is unreachable today (`main.ts` requires the
element). Suggested: add `hudRoot` to `PlatformContext.dom`, or throw.

**L7 — `topBanner.ts:26-29` — not announced.** Suggested: `role="status"` so TalkBack announces
the warning once per change. Check it does not repeat.

**L8 — documents now out of date (not code).** §6.5 A12 still lists both warnings as canvas
text and says `CanvasRenderer` is not edited; the `TEXT_TOP_LOGICAL` comment in `layout.ts:113-116`
cites the canvas text. The value 4 stays a safe bound (Android HUD text starts lower). Route to
mobile-solution-architect. `constants.ts`, `CanvasRenderer.ts`, `Platform.ts` and `main.ts` are
shared, so the website gates must also pass before either version ships.

**L9 — cosmetic.** While paused on a 640×360 window the dimmed banner sits partly behind the
"PAUSED" heading (banner 68.7-86.1 dp, heading 46-82 dp). Same treatment as the dimmed HUD; for
design review round 10 to judge.

## Coding standards
| Category | Result |
|---|---|
| Style | PASS — lint and Prettier clean on changed files; small single-purpose functions; no dead code. |
| Error handling | PASS — see L6. |
| Logging | PASS — none added. |
| Documentation in code | PASS with L2, L3 — intent comments present; three are stale. |

## Next steps
1. mobile-junior-tester: L1 (required), L4, L5.
2. mobile-solution-architect and security pass 2: L2, L8.
3. mobile-junior-developer, with the next change: L3, L6, L7.
4. Website pipeline gates for the four shared files.
