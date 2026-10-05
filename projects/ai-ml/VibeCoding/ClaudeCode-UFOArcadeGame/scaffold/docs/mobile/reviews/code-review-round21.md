# Mobile code review — round 21 (lean delta)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Verdict: PASS** (LOW findings only). mobile-junior-tester may start; L1 must be closed at step 9.

- **Date:** 2026-10-05. **Reviewer:** mobile-lead-developer. **Branch:** claude/project-thread-rm5222.
- **Scope A:** uncommitted diff vs HEAD 5d42f3b — `src/render/shapes.ts`, `src/render/powerUpGlyphs.test.ts` (Speed glyph: rabbit to double arrow, owner decision 2026-10-05).
- **Scope B:** `git diff 49b4713..5d42f3b -- src tests playwright.mobile.config.ts` (round-20 follow-ups, amendment A14).
- **Judged against:** `docs/PRD-addendum-v5.md` F23 AC1-AC3, AC6-AC8; the review brief; `docs/PRD-addendum-v5-r6.md` (appeared during this review); `docs/mobile/architecture/amendment-A14.md`; coding-standards; mobile-touch-and-layout.

## Verification (all run this round)

| Command | Result |
|---|---|
| `npm run check:secrets` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test` | 34 files, 642 tests passed |
| `npm run build` (website) | exit 0; `dist/` has both warning strings and no `top-banner` |
| `npm run build:android` | exit 0 |
| `npm run check:android-styles` | exit 0 |
| Playwright mobile, `--repeat-each=3 --workers=4 --retries=0` | 765 passed, 36 skipped, 0 failed, 0 flaky (10.0 min). The 36 skips are the A13 window case, which runs in the 640x360 project only |
| `scripts\refresh-android-mirror.ps1` | exit 0; parity check passed (142 files + 6 named) |
| Mirror: `build:android`, `npx cap sync android`, `gradlew.bat assembleDebug --no-daemon` | all exit 0; BUILD SUCCESSFUL, `app-debug.apk` 3.96 MB |

No emulator was started. No command was denied. The Playwright web server stopped on its own; nothing is listening on port 4174.

## Scope A — Speed glyph

`drawDoubleArrowGlyph` (`src/render/shapes.ts` ~370-386) meets the brief and r6 AC4.2 by its coordinates:
- One `stroke()`, no fill, 2px amber, set by `drawPowerUp` before the switch.
- Shaft from (-0.45r, 0) to (+0.45r, 0); open chevrons with tips at the shaft ends and wing ends at (±0.18r, ±0.30r).
- Mirror-symmetric on both axes; nothing crosses at the centre; no vertical segment, so no "+"; every point within ±0.45r.
- Ring, disc, fist, circle and X draw calls are untouched; no hitbox or game-rule file is in the diff (AC2, AC8).
- No rabbit drawing code remains in `src/`; the only hit is the history comment at `shapes.ts:311`. The rabbit-only test helpers are deleted.
- The 8x and 13dp grayscale renders show a clear "<-->", distinct from the fist, circle and X.

**Mutation check** (scratch copy outside the repo, `powerUpGlyphs.test.ts`, baseline 71/71):

| Mutant | Result |
|---|---|
| "+" (shaft plus vertical bar) | killed (12 fails) |
| Vertical bar added to the arrow | killed |
| One head removed | killed (10 fails) |
| Shaft shortened to ±0.3r | killed |
| Whole glyph shrunk to ±0.3r | killed |
| X through the centre plus shaft | killed (also by AC7) |
| Wings crossing the shaft | killed |
| Heads pointing inward | killed |
| Shaft off-centre | killed |
| Asymmetric heads | killed |
| Fill added | killed |
| lineWidth 3 | killed |
| Flat heads (0.16r tall) | killed |
| Closed (triangle) heads | killed |
| **Heads reaching across the centre (wing ends at x = ∓0.18r)** | **survived, 71/71 pass (L1)** |

**AC7 source search:** still meaningful. An X added in a second function fails it (count 6, not 4). The new arrow code does not match the pattern. Known limit, unchanged: it only finds an X whose x and y are the same expression.

## Scope B — round-20 follow-ups (A14)

- **§14.1 rule 1a — met.** `forcedTopBanner` is assigned at one place, `AndroidPlatform.ts:311`, inside `installE2eTestHook` after the `e2e=1 && !Capacitor.isNativePlatform()` return. It is read once, checked against `'robots' | 'boss'`, and only read by `topBannerFor`. The frozen hook has `snapshot`, `playerXLog` and `resolveBack` only; `showTopBanner` is gone from `src/` and `tests/`.
- **`role="status"`:** set once in the constructor; text is written only on a kind change, with `textContent`.
- **`hudRoot`:** in `PlatformContext.dom`, passed from `main.ts`; the `querySelector` fallback is gone.
- **`CanvasRenderer`:** boss font, outline and stroke state are now inside the flag; the border is drawn before it and is unaffected. Default stays `true`; `WebPlatform` never calls the setter.
- **`layout.ts` comment:** matches A14 item 6; `TEXT_TOP_LOGICAL` is still 4.
- **Test strength:** 3 renderer mutants (flag ignored for robots, for boss, default flipped) and 3 `topBannerFor` mutants (PAUSED dropped, robots before boss, only TITLE hidden) were all killed.
- **E2E spec:** now measures the font at factor 1 with no override (round-20 L1), and checks the top inset, centring, `pointer-events` and the hit test.

## Mobile pitfalls

| Pitfall | Result |
|---|---|
| Game logic branched or duplicated per platform | None. One `drawPowerUp`; the banner is presentation only |
| Frame-count timing | None added |
| Touch defaults (scroll, zoom, select) | Unchanged; banner is `pointer-events: none`, asserted |
| Background listeners, timers, audio | None added |
| Back button | Unchanged |
| DPR and insets | Unchanged; banner top ≥ inset, asserted |
| Hand edits under `android/` | None (`git diff HEAD -- android` is empty) |

## Coding standards

Style: PASS with L3 and L5. Error handling: PASS (no new paths). Logging: n/a. Documentation in code: PASS with L2.

## Findings (all LOW)

**Required at step 9 (mobile-junior-tester):**
- **L1 — `powerUpGlyphs.test.ts:338-358` and `:540-547`: an X-like arrow passes.**
  - Swapping the wing-end x sign (`moveTo(-side * 0.18 * r, …)` and `lineTo(-side * 0.18 * r, …)`) makes each head reach across the centre, so the left wings cross the right wings at (0, ±0.21r). All 71 tests pass.
  - The comment at `:541-542` ("no interior crossing exists (checked above)") is not true for wing against wing.
  - Fix: (a) a pairwise check over all 5 segments, allowing a meeting only at a shared endpoint; (b) left wing ends x < 0, right wing ends x > 0; (c) each wing ≥ 0.25r from (0, 0); (d) exactly 1 horizontal, 0 vertical and 4 diagonal segments. These are r6 gaps G1-G4. Then correct the comment.
- **L4 — A14 §10.1 test list not fully covered.**
  - `tests/mobile-e2e/robot-warning.spec.ts` has no `role` assertion and no "still shown after pause" assertion. It lacks the inset rows (30,30,28.2,32), (29.7,29.7,28.2,32), (0,48,24,0) and the 640x368 (0,0,24,48) window.
  - `topBanner.test.ts` does not assert `data-kind`, "no DOM write when the kind is unchanged", or `top` following the HUD height.
  - `CanvasRenderer.test.ts` asserts the border only with the flag off, not in the two default cases.
  - No automated check that `dist/` has no `top-banner` (checked by hand this round: none).

**Suggested (mobile-junior-developer, next touch):**
- **L2 — r6 AC10 citations.** `shapes.ts:311` and the `drawDoubleArrowGlyph` doc comment cite "F23 r2 AC4.2"; r6 says to cite "F23 r6 AC4.2" and the 2026-10-05 decision (Q-v5-2). Same for the test file header (lines 1-3) and the AC4.2 `describe` title (`:514`). `docs/mobile/tests/manual-only-criteria.md:176` still lists the rabbit's AC4.2(d).
- **L3 — dead test fields.** `SubPath.src` and `closeSrc` (`powerUpGlyphs.test.ts:112-115`, populated at `:123-163`) were read only by the deleted rabbit test. Remove them.
- **L5 — formatting.** `AndroidPlatform.ts:184-187` fails `prettier --check`; `new TopBanner(ctx.dom.appRoot, ctx.dom.hudRoot)` now fits on one line. New in 5d42f3b. CI does not run `format`.

## Notes for the pipeline

- `shapes.ts` is shared, so the website code-reviewer, test and UX gates must also pass before either version ships.
- AC6(b) (reads as an arrow at phone size) is a design-gate judgment, not decided here.
- `docs/PRD-addendum-v5-r6.md` and other docs changed in the working tree during this review; they were written by other agents, not by this review.
