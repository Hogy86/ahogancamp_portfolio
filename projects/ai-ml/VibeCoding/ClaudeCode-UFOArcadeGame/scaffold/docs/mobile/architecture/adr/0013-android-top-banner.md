# ADR M-0013: Android top banner — the two top warnings as one DOM row under the HUD, behind one shared renderer flag

## Status: Proposed

As built on `claude/project-thread-rm5222` (commits `49b4713`, `e7e207f`) and passed by
`docs/mobile/reviews/code-review-round20.md`. Still to pass: mobile design review round 10,
security pass 2 (the test-hook rule below), UAT round 3, and the website gates for the four
shared files.

Amends **M-ADR-0002** (platform boundary: two additions to `PlatformContext`) and
**M-ADR-0004** (Decision 3 and its A12 note: "`CanvasRenderer` is not edited", and the
source of `TEXT_TOP_LOGICAL`). Full specification: `mobile-architecture.md` §6.5 A14,
§14.1 A14 and §16 A14.

## Context
- **The failure.** UAT round 2 **F4** (`docs/mobile/tests/uat-results-round2.md`, UAT-19):
  on the 640 × 360 dp reference phone the canvas text "WARNING: ROBOTS APPROACHING" read
  "WARNING: ROBOTS APPROACHI". Its last letters sat under the "Level" HUD box. A power-up
  timer box moves "Level" about 70 dp further left and would cover about half the words.
  The Pixel 7 had 2-7 dp to spare and would fail the same way with a timer box.
- **Also too small.** The words are drawn at 16 px (boss: 20 px) on the 800 × 600 canvas.
  At s ≈ 0.505 that is 8-10 dp, below the 12 sp floor in PRD-mobile M2.6.
- **Why it matters.** The robots warning comes just before an instant loss. PRD F3 AC6 and
  NFR-9(a) make the words part of the warning, next to the red border, so the cue is not
  colour alone. "BOSS INCOMING" (F12 AC10-11) is drawn at the same place and has the same
  problem.
- **What A12 missed.** `mobile-architecture.md` §6.5 A12 listed this canvas text in its
  inventory but checked only its top edge against the top inset. It did not check its
  width against the HUD row or its size against M2.6.
- **Why no HUD row has room.** On Android the HUD is DOM at a 12 dp floor inside a 404 dp
  wide playfield. Its height and width change with the score digits, the power-up pill and
  the system font size (up to 130 %), and it can wrap to two rows. The canvas cannot know
  where the HUD ends.
- **Constraints.** One codebase: game rules exist once and game logic never branches on
  platform (`.claude/CLAUDE.md`, M-ADR-0002). The website must look and behave as before
  (C3). `window.__vvsTest` has no setters (§14.1 L4a, security review-v1 L4).

## Decision
1. **On Android the words are one DOM element, `#top-banner`,** built by
   `src/platform/android/topBanner.ts` and appended to `#app-root` (the scaled root). The
   website keeps the canvas text. The canvas **borders** (pulsing red, solid amber) are
   still drawn by the shared renderer on both platforms.
2. **One shared seam.** `CanvasRenderer` gets a private flag `topBannerTextOnCanvas`,
   **default `true`**, and a setter `setTopBannerTextOnCanvas(enabled)`. The flag guards
   only the two text draws. `PlatformContext` gets the matching method
   `setTopBannerTextOnCanvas(enabled: boolean)`, wired in `src/main.ts`. `AndroidPlatform`
   calls it once with `false` during `init()`. `WebPlatform` never calls it.
3. **Supporting shared changes** (no behavior change on the website):
   - `PlatformContext.dom.hudRoot` is added, so Android anchors the banner to the real HUD
     element instead of looking it up (code-review-round20 L6).
   - The two strings move to `src/config/constants.ts` as `FORMATION_WARNING_TEXT` and
     `BOSS_WARNING_TEXT`. The canvas and the banner read the same constants, so the words
     exist once.
4. **When it shows.** `topBannerFor(world)` in `AndroidPlatform.ts` returns `'boss'`,
   `'robots'` or `null`, from the same world fields and the same states the renderer
   uses: state `PLAYING` or `PAUSED`; `bossWarningRemaining > 0` → boss; otherwise
   `formationWarningActive` → robots. Boss wins. One element serves both, so the two can
   never show at once. `onFrame` calls `topBanner.sync(...)` after the renderer has drawn
   the same frame.
5. **Layout contract** (binding; details in §6.5 A14):
   - directly below the HUD: `top = hudRoot.offsetTop + hudRoot.offsetHeight + 2` logical
     px, re-read each frame while showing, so a wrapped HUD pushes the banner down;
   - horizontally centred on the playfield, one line, inside the canvas rect and inside
     the full edge insets;
   - `pointer-events: none`, and it overlaps no touch control;
   - font `max(15px, 12px / s)`: the same 12 dp floor rule as the HUD panels;
   - `role="status"`, text set with `textContent`, written only when the kind changes.
6. **Test hook.** The Playwright suite forces the banner with a boot-time query,
   `?e2e=1&banner=robots|boss`, read once inside the existing `__vvsTest` gate. The hook
   object still has **no setters**. The rule is restated in §14.1 A14: a presentation-only
   boot-time query inside the same gate is allowed; a setter is not.
7. **`TEXT_TOP_LOGICAL` stays 4.** No formula, floor or worked row changes. What the
   constant bounds is restated in §6.5 A14.

## Why this respects the one-codebase rule
- **No game rule is branched or copied.** When a warning is active is still decided once,
  by the shared systems, and stored in `World` (`formationWarningActive`,
  `bossWarningRemaining`). The Android code only reads those fields.
- **It is screen fitting.** Where already-decided text is placed so that it fits a small
  screen is one of the four areas that may be platform-specific (PRD-mobile §0 rule 2).
- **The renderer does not know the platform.** It holds a boolean about its own output,
  set through `PlatformContext`, the same way `setRenderScale` is. There is no
  `if (android)` and no `import.meta` outside `src/main.ts`.
- **The website is unchanged.** The flag defaults to `true` and nothing on the website
  sets it. Draw order, positions, fonts, colours and strings are the same. The web bundle
  contains no `top-banner` code (code-review-round20, "Website unchanged").
- **The words exist once** (decision 3).

## Alternatives Considered (and why rejected)
- **Keep the canvas text and enlarge it on Android.** Rejected. At 12 dp the robots
  warning is about 200 dp wide and still sits in the HUD row, so it still runs under the
  Level box. It would also need a platform-dependent font size inside the shared renderer,
  which is a larger seam than one on/off flag.
- **Move the canvas text lower on both platforms** (shared change). Rejected. The website
  has no problem to fix, so its look would change for no web requirement. The Android HUD
  height is not fixed (font floor, 130 % text zoom, wrapping), so no fixed canvas y is
  safe, and the canvas cannot measure the DOM HUD without coupling the two.
- **Reserve the centre of the HUD row** (suggested in the UAT route note). Rejected. At
  the 12 dp floor in a 404 dp playfield there is no row with room for 27 characters
  beside a six-digit score, the Level box and a power-up pill.
- **Put the words in a HUD panel through the shared `HUDView`.** Rejected. It changes the
  website's HUD, and a HUD that wraps is exactly the case that needs the words to move
  out of the row.
- **Put the banner in the unscaled `#safe-layer`.** Rejected. It would need its own
  playfield-rect arithmetic and a second way to follow the HUD's height. Inside
  `#app-root` it uses the HUD's own layout box and the same font-floor rule.
- **Drop the words on Android and keep only the border.** Rejected. PRD F3 AC6 and
  NFR-9(a) name the text as part of the cue, and "BOSS INCOMING" is what tells the amber
  border apart from the red one for a player who cannot rely on colour.
- **A platform check inside `CanvasRenderer`.** Rejected by M-ADR-0002: only
  `src/main.ts` knows the platform.
- **Two elements, one per warning.** Rejected. One element cannot overlap itself, and the
  boss-wins rule becomes a single branch.
- **A test-hook setter (`__vvsTest.showTopBanner`)**, as first built (code-review-round20
  L2, option (a): amend L4a to allow presentation-only setters). Rejected. "The hook
  object has no setters" is a rule security pass 2 can check by reading one frozen object.
  A boot-time query keeps that rule whole and cannot be called again later in the session.
- **Raising `TEXT_TOP_LOGICAL` to the HUD's top edge** now that Android draws no text at
  logical y 4. Rejected here. It would change the M2.10a / M2.3b / M2.3c floor and every
  A12 and A13 worked row, and it would make the layout's safety depend on the flag being
  off. It is a PRD-level change for mobile-product-manager, not part of this fix.

## Consequences
- **Four shared files changed**: `src/config/constants.ts`,
  `src/render/CanvasRenderer.ts`, `src/platform/Platform.ts`, `src/main.ts`. Under the
  one-codebase rule the website's code review, test and UX gates must pass too before
  either version ships (code-review-round20 L8).
- **One presentation condition is written twice**: the renderer's guards and
  `topBannerFor`. They read the same world fields but could drift if the renderer's gate
  changes. New risk **MR23**, covered by unit tests on both sides and a change-control
  line (§12).
- **`TEXT_TOP_LOGICAL = 4` is now conservative on Android** by at least 7 logical px
  (3.5 dp at the floor). It still exactly bounds what the shared renderer draws when the
  flag is on, which is the default.
- **Cost per frame:** one layout read (`offsetTop + offsetHeight`) while a banner shows,
  none while hidden; DOM writes only on a change.
- **Screen readers:** the words were invisible to TalkBack as canvas pixels. They are now
  text with `role="status"`. That it is announced once per change, and not repeated, is
  true by construction (the text is written only on a kind change) but has **not** been
  checked with TalkBack on a device. It goes on the step-10 / closed-test list.
- **While paused** the dimmed banner can sit partly behind the "PAUSED" heading on a
  640 × 360 window, like the dimmed HUD (code-review-round20 L9). Design review round 10
  judges it.
- **Test-only code ships in the Android bundle** (`forcedTopBanner` and the query read)
  but cannot run in the installed app: the gate returns before the query is read when
  `Capacitor.isNativePlatform()` is true, and the app has no deep-link intent filter
  through which a URL could be supplied (§10.3 R5).

## Traces to
PRD-mobile M2.3, M2.3b rule 2, M2.6, M2.11, M3.11; PRD F3 AC6, F12 AC10-11, NFR-9(a);
`docs/mobile/tests/uat-results-round2.md` **F4** (UAT-19);
`docs/mobile/reviews/code-review-round20.md` **L2**, **L6**, **L7**, **L8**, L9; security
review-v1 L4 (§14.1 L4a); `.claude/CLAUDE.md` §One codebase; M-ADR-0002, M-ADR-0004;
`mobile-architecture.md` §6.5 A14, §10.1 A14, §12 MR21/MR23, §14.1 A14, §16 A14.
