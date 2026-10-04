# Mobile Architecture — Amendment A14 (2026-10-04, v1.8): Android top banner

> Written by mobile-solution-architect. The architect had no edit tool, so the main session
> saved the amendment text here verbatim and added pointers to it in
> `mobile-architecture.md` (header, §6.5, §14.1, §16) instead of splicing every block into
> that 2,655-line file. Section references below are to `mobile-architecture.md`. Decision
> record: `adr/0013-android-top-banner.md`.

**Answers:** UAT round 2 **F4** (UAT-19: "WARNING: ROBOTS APPROACHING" cut off by the Level
box on 640 × 360 dp, about 8 dp tall); code-review-round20 **L2** (test-hook setter against
§14.1 L4a), L6, L7, **L8** (§6.5 A12 and the `TEXT_TOP_LOGICAL` comment out of date).
Criteria: PRD-mobile M2.3, M2.3b rule 2, M2.6, M2.11; PRD F3 AC6, F12 AC10-11, NFR-9(a).

**Summary:** on Android the two top warnings ("WARNING: ROBOTS APPROACHING" and "BOSS
INCOMING") are one DOM banner under the HUD; the website keeps the canvas text. One shared
renderer flag, set through `PlatformContext` and on by default, is the only seam. The §14.1
L4a test-hook rule is restated. **No formula changes; `TEXT_TOP_LOGICAL` stays 4.**

**Superseded by A14:** §6.5 A12's "`CanvasRenderer` is not edited" (it now has one flag;
`src/style.css` is still not edited), and A12's inventory row for the canvas warnings on
Android. §14 A12's "no shared file changes" described A12 only; A14 changes four shared
files, which go through the website gates. **Kept:** the layout formulas, the floor, all
worked rows, `TEXT_TOP_LOGICAL = 4`, `TEXT_BOTTOM_LOGICAL`, L4a rows (2)-(3) and the "no
setters" rule. The first build's `showTopBanner` setter is **rejected**.

---

## §1 component table — new row

| Component | File | Role | Traces to |
|---|---|---|---|
| `TopBanner` **[v1.8, A14]** | `src/platform/android/topBanner.ts` | One DOM row directly below the HUD that shows the formation warning or the boss warning on Android, in place of the canvas words. | M2.3, M2.3b, M2.6; F3 AC6, F12 AC10-11; UAT round 2 F4; M-ADR-0013 |

## §4 — `PlatformContext` members

> **Amendment A14 (2026-10-04, v1.8; UAT round 2 F4; M-ADR-0013):** `PlatformContext`
> gains two members. The interface block in §4 is the v1 sketch; `src/platform/Platform.ts`
> is the current contract.
> - `setTopBannerTextOnCanvas(enabled: boolean): void` forwards to
>   `CanvasRenderer.setTopBannerTextOnCanvas`. The renderer's flag defaults to `true`.
>   `AndroidPlatform.init()` calls it once with `false`; `WebPlatform` never calls it. It is
>   the same kind of seam as `setRenderScale`: the platform tells the shared renderer how to
>   present, and the renderer never learns which platform it is on.
> - `dom.hudRoot: HTMLElement` is the HUD container. Android anchors the banner to it.
>
> The rule in §4 is unchanged: game logic never branches on platform. The list of what
> differs per platform gains one item: **(f)** whether the two top warning words are drawn
> on the canvas or shown as a DOM row (§6.5 A14). No game-rule constant is read from
> `Platform` (M0.3 holds).

## §6.5 — Amendment A14 block

> **Amendment A14 (2026-10-04, v1.8; UAT round 2 F4; code-review-round20 L2, L6, L7, L8;
> PRD-mobile M2.3, M2.3b rule 2, M2.6, M2.11; PRD F3 AC6, F12 AC10-11, NFR-9(a);
> M-ADR-0013). On Android the two top warnings are a DOM banner under the HUD.**
>
> **1. What changed and why.** On the 640 × 360 dp reference phone the canvas words
> "WARNING: ROBOTS APPROACHING" ran under the "Level" HUD box and were about 8 dp tall
> (UAT round 2 F4). A12's inventory checked only the top edge of that text, not its
> width or size. On Android the words, and "BOSS INCOMING", are now one DOM element,
> `#top-banner` (`src/platform/android/topBanner.ts`). The website keeps the canvas text.
> The canvas borders (pulsing red, solid amber) are still drawn by the shared renderer on
> both platforms.
>
> **2. The one shared seam.**
> - `CanvasRenderer` has a private flag `topBannerTextOnCanvas`, **default `true`**, and a
>   setter `setTopBannerTextOnCanvas(enabled)`. The flag guards only the two text draws in
>   `drawFormationWarning` and `drawBossWarning`.
> - `PlatformContext.setTopBannerTextOnCanvas(enabled)` (§4 A14) forwards to it.
>   `AndroidPlatform.init()` calls it once with `false`. `WebPlatform` never calls it.
> - Supporting shared changes: `PlatformContext.dom.hudRoot`, and the two strings moved to
>   `src/config/constants.ts` (`FORMATION_WARNING_TEXT`, `BOSS_WARNING_TEXT`), read by both
>   the canvas and the banner.
> - Shared files touched: `constants.ts`, `CanvasRenderer.ts`, `Platform.ts`, `main.ts`.
>   The website gates must pass for them before either version ships (C1).
>
> **3. Why this respects the one-codebase rule (C1).**
> - No game rule is branched or copied. The shared systems still decide when a warning is
>   active and store it in `World` (`formationWarningActive`, `bossWarningRemaining`).
>   Android only reads those fields.
> - Placing already-decided text so it fits a small screen is screen fitting, one of the
>   four permitted platform areas (PRD-mobile §0 rule 2).
> - The renderer holds a boolean about its own output. It has no platform check.
> - The website is unchanged: default `true`, same draw order, positions, fonts, colours
>   and strings; the web bundle has no `top-banner` code (C3).
> - The words exist once, in `constants.ts`.
>
> **4. When the banner shows (binding).** `topBannerFor(world)` in `AndroidPlatform.ts`:
>
> | Condition, in this order | Result |
> |---|---|
> | state is not `PLAYING` and not `PAUSED` | hidden |
> | `bossWarningRemaining > 0` | "BOSS INCOMING" |
> | `formationWarningActive` | "WARNING: ROBOTS APPROACHING" |
> | otherwise | hidden |
>
> These are the states and fields the renderer's own guards use. Boss wins, and one element
> serves both, so the two never show together. `onFrame` syncs the banner after
> `renderer.render` in the same frame.
>
> **5. Layout contract (binding).**
>
> | Rule | Requirement |
> |---|---|
> | Parent | A child of `#app-root` (the scaled root), so it scales and moves with the playfield. Created only by `AndroidPlatform`. |
> | Below the HUD | `top = hudRoot.offsetTop + hudRoot.offsetHeight + 2` logical px. Read every frame while a banner shows, so a HUD that wraps (large font, long score, power-up pill) pushes the banner down. The banner never intersects a `.hud-panel`. |
> | Inside the playfield | Horizontally centred (`left: 50%`, `translateX(-50%)`), one line (`white-space: nowrap`). Its left and right edges are inside the canvas rect. |
> | Inside the insets | Its top is at or below the top edge inset, and its sides are inside the side insets. This follows from the two rows above: the HUD text is already inside the full insets (A12 rule 1) and the playfield never enters a side inset. The test still asserts it. |
> | Touch | `pointer-events: none`. It overlaps no touch control (the controls are in the side columns). |
> | Size | `font-size: max(15px, calc(12px / var(--pf-scale)))`: at least 12 dp on screen, the same floor rule as the HUD panels (M2.6). It must stay on one line inside the playfield at the 130 % `textZoom` cap (M2.11). |
> | Accessibility | `role="status"`. Text is set with `textContent` (§14.1 L4b) and written only when the kind changes, never per frame, so it is announced once per change. The canvas border stays as the second, non-colour cue (NFR-9(a)). |
> | Cost | DOM writes only on a kind change or a HUD-height change. One layout read per frame while showing, none while hidden. |
> | Prompt | Hidden with `#app-root` while the rotate / too-small prompt shows (§6.2.1 behavior 2). No extra code. |
>
> Measured in code-review-round20 at 640 × 360 (s ≈ 0.505): 12.0 dp font, box about 17-18
> dp tall, 3.3-9.3 dp below the lowest HUD panel, at most 255 dp wide at 1.3× in a 400 dp
> playfield, bottom at logical y ≤ 144. The formation's top row is at about logical y 242
> or lower when the robots warning fires, and the boss banner shows only after the
> formation is cleared, so the banner does not cover play.
>
> **6. What `TEXT_TOP_LOGICAL` now bounds.** The value stays **4**. No formula, floor,
> worked-check row or headroom figure in §6.2-§6.4 changes.
> - **With the flag on (the default, and the website):** it is still the exact top of the
>   canvas warning words' em box (baseline 24 − 20 px).
> - **On Android (flag off):** no text is drawn at logical y 4. The nearest text to the
>   playfield's top edge is the HUD panels' content box at logical y 15 (about 11 during
>   the `.hud-effect-active` pulse). The banner is always lower than the HUD. So 4 is a
>   conservative bound, by at least 7 logical px (3.5 dp at s = 0.5).
> - **Why it is not raised.** Raising it would change the M2.10a / M2.3b / M2.3c floor and
>   every A12 and A13 worked row, and it would make the layout's safety depend on the flag
>   being off. That is a PRD-level decision for mobile-product-manager, not part of this
>   fix. (Observation, not decided: raising it to 11 would put the 640 × 360 three-button
>   phone exactly on the M2.3c boundary, with zero margin.)
> - **Reading the older text.** Where §6.3 A12 and §10.1 A12 (c) say "canvas warning
>   em-box top (logical y 4)" and `canvasRect.top + 4·s ≥ t`, read "the `TEXT_TOP_LOGICAL`
>   bound". The numbers and the checks stand.
> - **Change control (A12 rule 2) still applies**, with two additions: (a) a change that
>   puts any Android text above the HUD's top edge, or moves the banner above the HUD,
>   must be checked against this constant; (b) a change to the renderer's warning guards
>   must be mirrored in `topBannerFor`, and the reverse (§12 MR23).
> - The comment on the constant in `layout.ts` is updated to say this.
>
> **7. Not changed by A14:** the layout algorithm, the classification and floor,
> `TEXT_BOTTOM_LOGICAL`, control placement, `#safe-layer`, the HUD's own CSS in
> `src/style.css`, the borders, the level-intro text, and every website behavior.

## §10.1 — tests added

**[v1.8, A14 / UAT round 2 F4] Added:**
- **Unit:**
  - `topBannerFor`: hidden in TITLE, GAMEOVER and VICTORY even with a warning field set;
    robots in PLAYING and in PAUSED; boss in PLAYING and in PAUSED; boss wins when both
    fields are set.
  - `CanvasRenderer` with a mocked 2D context: by default both strings are drawn at
    (400, 24) with their borders (the website's output); after
    `setTopBannerTextOnCanvas(false)` the borders are still drawn and neither string is.
  - `TopBanner.sync`: text, `hidden` and `data-kind` change only on a kind change; `top`
    follows the HUD's height.
- **Playwright** (`?e2e=1&banner=robots` and `&banner=boss`; the forced banner is for
  layout only, never for the trigger mapping). Windows and insets: 640 × 360 with
  (30,30,28.2,32), (29.7,29.7,28.2,32) and (0,48,24,0); 640 × 368 with (0,0,24,48); one
  window at the §6.5 A13 smallest safe height (291.5 dp); 915 × 412. Each at the default
  font and at 1.3×, with a HUD fixture holding a six-digit score, "Power ×18.90" and an
  active-effect pill. Assert, with 0.01 px tolerance:
  - the banner rect intersects no `.hud-panel` rect, and its top is at or below the lowest
    HUD panel's bottom;
  - its top ≥ t, and its left and right edges are inside the `#game-canvas` rect;
  - its font size × s ≥ 12 dp, measured **without** any test style overriding
    `#top-banner` at factor 1 (code-review-round20 L1);
  - `pointer-events` is `none`, and `elementFromPoint` at its centre is not the banner;
  - `role` is `status`, and the text equals the shared constant for that kind;
  - after pausing, it is still shown with the same text.
- **Static:** `dist/` (the website build) contains both warning strings and no
  `top-banner`.
- **Device (step 10 and UAT round 3):** UAT-19 on `svr_api36_lowend_640x360` and
  `svr_api36_pixel7` with the real robots warning showing, with and without a power-up
  timer. With TalkBack on (device or closed test), each warning is spoken once and not
  repeated; record it as not confirmed if no TalkBack run is possible.

## §11 — new traceability row

| Criterion | How it is met |
|---|---|
| **Top warnings readable on a phone [v1.8, A14]** (M2.3, M2.3b rule 2, M2.6; F3 AC6, F12 AC10-11) | On Android the two warnings are one DOM row directly below the HUD, at the 12 dp floor, inside the playfield and the insets, with `pointer-events: none` and `role="status"`. The website keeps the canvas text behind a renderer flag that defaults to on (§6.5 A14). |

## §12 — risks

- **MR21 (note added):** on Android the canvas words are replaced by the DOM banner; `TEXT_TOP_LOGICAL = 4` is kept as a conservative bound (§6.5 A14 item 6).

| ID | Risk | Mitigation | Owner |
|---|---|---|---|
| **MR23 [v1.8, A14]** | The Android banner's "when to show" condition (`topBannerFor`) drifts from the shared renderer's warning guards, so the words and the border disagree; or the flag call is lost and Android draws the small canvas words again | Both read the same `World` fields and states; unit tests on `topBannerFor` and on `CanvasRenderer` with the flag on and off (§10.1 A14); change-control line in §6.5 A14 item 6 (b); the Playwright banner checks fail if the banner is missing. The lead developer checks any diff to `drawFormationWarning`, `drawBossWarning` or `topBannerFor` against the §6.5 A14 item 4 table. | junior dev, lead dev, web pipeline |

## §14 — developer handoff note

**[A14, 2026-10-04; UAT round 2 F4; code-review-round20 L2, L8] Android top banner.** The
code is as built and passed code-review-round20; this note records what is binding and
what is left.
1. Keep the §6.5 A14 item 4 mapping and item 5 layout contract. Do not move the banner
   into the HUD row or into `#safe-layer`.
2. Keep the renderer flag's default `true` and never call
   `setTopBannerTextOnCanvas` from `WebPlatform`.
3. Update the comment on `TEXT_TOP_LOGICAL` in `layout.ts` to match §6.5 A14 item 6. The
   value stays 4.
4. The test hook follows §14.1 A14: no setter; `banner` is the only presentation query.
5. The four shared files (`constants.ts`, `CanvasRenderer.ts`, `Platform.ts`, `main.ts`)
   go through the website's code review, test and UX gates as well.
6. Tests per §10.1 A14.

## §14.1 — L4a restated

> **Amendment A14 (2026-10-04, v1.8; code-review-round20 L2; security review-v1 L4). L4a
> restated.** Rows (2) and (3) of L4a are unchanged. Row (1) is kept and made precise, and
> one rule is added.
>
> - **(1) The hook object, unchanged in intent.** `window.__vvsTest` is frozen and has
>   **no setters**: no member that changes the world, the presentation, storage, input or
>   layout, no GameCommands, and no references to live objects. Its members today are
>   `snapshot()` (a deep-frozen clone), `playerXLog()` (a copy) and `resolveBack()` (a pure
>   query, A11). A setter is not allowed, including a "presentation-only" one.
> - **(1a) New: presentation-only boot-time query.** A test may force a piece of Android
>   presentation through a URL query value, if all of these hold:
>   1. It is read **inside the same gate** as the hook (`?e2e=1` and
>      `!Capacitor.isNativePlatform()`), after the gate has passed, so it is never read in
>      the installed app.
>   2. It is read **once at boot** and never changed afterwards. Nothing on the hook or
>      anywhere else can set it later.
>   3. Its value is checked against a **closed list**; anything else is ignored.
>   4. It changes **presentation only**: never the `World`, storage, input, GameCommands or
>      the window classification.
>   5. It is listed here. Adding one is an amendment to this document and is re-checked in
>      security pass 2.
> - **Allowed list (complete):** `banner=robots|boss`. It makes `topBannerFor` return that
>   kind while the state is `PLAYING` or `PAUSED`, so the banner's layout can be measured
>   without minutes of play.
> - **Limits of what it proves.** A forced banner does not match the world, so it tests
>   layout only. The trigger mapping is tested by unit tests (§10.1 A14).
> - **Not part of this rule.** `?insets=` and `?cutout=` belong to GameShell's web
>   fallback (§10 item 3, §6.1 A12) and are specified there.
> - **As built.** The first build had a setter, `showTopBanner` (round-20 L2). It was
>   replaced by the query. Option (a) in L2, allowing presentation-only setters, is
>   rejected: "no setters" stays a rule that can be checked by reading one frozen object.
> - **Pass-2 checks.** The frozen object has only the three members above;
>   `forcedTopBanner` is assigned only inside `installE2eTestHook`, after the gate; on the
>   installed app `typeof window.__vvsTest === 'undefined'`; the manifest still has no
>   deep-link intent filter through which a URL could be supplied (§10.3 R5).

## §14 — security handoff

- **[v1.8, A14, 2026-10-04] Android top banner.** Presentation only: one DOM element built
  with `textContent`, showing one of two fixed strings from shared constants. No
  permission, plugin, native code, storage, network or logging change; the Data safety
  answer is unchanged. **One item for pass 2:** the restated test-hook rule in §14.1 A14
  (no setters; the boot-time `banner` query inside the existing gate). The query-reading
  code ships in the Android bundle but is unreachable in the installed app.

## Open items

- **TalkBack is unverified.** `role="status"` announcing once per change is true by
  construction only; it is on the step-10 / closed-test list.
- M-ADR-0013 amends M-ADR-0002 (two `PlatformContext` members) and M-ADR-0004 (Decision 3
  and its A12 note). Their Decision text stays as the historical record.
