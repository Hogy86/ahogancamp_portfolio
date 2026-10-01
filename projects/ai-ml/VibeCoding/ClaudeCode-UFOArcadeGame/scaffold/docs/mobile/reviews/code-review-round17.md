# Code Review Round 17: Mobile Pipeline Step 8

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Verdict: PASS (step-8 code gate).** All findings are Low. mobile-junior-tester may start step 9 for the F23 change.

- **Reviewer:** mobile-lead-developer
- **Date:** 2026-09-30
- **Branch / base:** `claude/project-thread-rm5222`, uncommitted diff vs HEAD `451dfa9`, plus untracked `src/render/powerUpGlyphs.test.ts`
- **Scope:**
  1. Shared power-up glyph change, `docs/PRD-addendum-v5.md` r3 F23 (`src/render/shapes.ts`, new `src/render/powerUpGlyphs.test.ts`).
  2. code-review-round16 L1 (`scripts/check-no-secrets.mjs` and its test), L3 (`tests/mobile-e2e/text-scale-fit.spec.ts`), L4 (`android.css`, `glyphs.ts` comments), L5 (`playwright.mobile.config.ts`, `.github/workflows/deploy-pages.yml`).
  3. The `expect.poll` change in `tests/mobile-e2e/cutout-insets.spec.ts`.
- **Specs used:** `docs/PRD-addendum-v5.md` F23 AC1-AC10; `code-review-round16.md`; `docs/mobile/security/review-v1b.md` L5 and `review-v2.md` (L5 row, V2-I1, V2-M3); the coding-standards and mobile-touch-and-layout skills.
- **Not re-read this round:** `mobile-architecture.md`, its ADRs and `PRD-mobile.md`. The diff touches no architecture, lifecycle, input or layout code.

## 1. Summary

- **F23 glyphs: conform to AC1-AC4, AC8 and AC10.**
  - Only the `HIT_POWER`, `SPEED` and `SHIELD` branches of `drawPowerUp` changed, plus two new private helpers (`drawFistGlyph`, `drawRabbitGlyph`).
  - The ring and disc code is untouched. The `PERMANENT_MULTIPLIER` geometry is unchanged (a = 0.35r); only its comment changed, and it cites the owner's risk acceptance as AC10 requires.
  - All four branches cite "PRD addendum v5 F23" and their AC4 item.
  - The capital X is the owner-accepted risk recorded in the addendum; it is not a finding.
- **The glyph tests discriminate.** I ran 27 mutations of `shapes.ts` in a scratch copy; every invalid glyph failed at least one test and both valid variants passed (§3).
- **Draw code is simple and cheap per frame.**
  - Fist: one path of 4 beziers, 4 quadratics and 2 lines, one `fill()`.
  - Rabbit: one path of 8 quadratics and 8 lines, one `fill()`.
  - Circle: one arc. No gradients, shadows, text or state beyond the existing save/restore.
  - The single caller is `CanvasRenderer.drawPowerUps` (`CanvasRenderer.ts:204`), and only a few tokens are on screen at once.
- **Nothing else shared changed.**
  - Under `src/`, outside `src/platform/android/`, the only changed file is `src/render/shapes.ts`.
  - The website CSS bundle keeps its hash (`index-Bee-yMjM.css`); the website JS hash changed, as expected.
  - The web bundle contains no `platform-android` or `touch-glyph`.
- **Round-16 L1: fixed.** `CSS_SK_SELECTOR` and its `.replace` are deleted; only the digit-free `sk-` rule remains. A new test proves `#sk-proj-…` and `.sk-proj-…` keys with digits fail S7. The whole-repo scan is clean.
- **Round-16 L3: fixed.** The injected style now scales the `<text>` element itself, and the test asserts the computed font-size is `13 × factor`, so the 1.3x case can no longer be vacuous. It also checks the label's height and top/bottom against the SVG box.
- **Round-16 L4: fixed.** Comments now say 52 px padding box, 40 px content box, about 15% tighter for THROW and about 7% for WAIT.
- **Round-16 L5: fixed.**
  - The config has `trace: 'retain-on-failure'` and `screenshot: 'only-on-failure'`, with no retries.
  - The workflow uploads `test-results/` with `if: failure()`, `if-no-files-found: ignore` and 7-day retention. The path matches Playwright's default output directory.
- **Tag-vs-SHA pin on the new step: acceptable.**
  - `actions/upload-artifact@v4` is a first-party action.
  - review-v1b L5 and the review-v2 L5 row require SHA pins for third-party actions only.
  - review-v2 V2-I1 records first-party tag pins as consistent with L5, with SHA pinning as optional hardening.
  - The same action is already tag-pinned at `deploy-pages.yml:157`.
- **`cutout-insets.spec.ts` poll: correct.** `ScreenFit.init` awaits `GameShell.getEdgeInsets()` before its first `relayout` (`screenFit.ts:121-130`), and the rotate prompt is already hidden before that. A single read after `toBeHidden()` can therefore see the pre-fit canvas. Polling fixes the test and hides no product defect: the game has not started at that point.

## 2. Verification (run by me)

| Check | Result |
|---|---|
| `npm run check:secrets` | Clean (the one S1 template exemption notice, scanned clean) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test` | 32 files, **624/624 passed** (559 in round 16; +64 glyph cases, +1 secret-scan case) |
| `npm run build` (website) | OK: `index-D9pPgMam.js`, `index-Bee-yMjM.css` |
| `npm run build:android` | OK: `index-0UeFeQD-.js`, `AndroidPlatform-DH7ZWKKU.js`, `AndroidPlatform-LwNXZPit.css` |
| Playwright `--repeat-each=3 --workers=4` | **609/609 passed** in 9.2 min. No flakes. |
| `powershell.exe -NoProfile -File scripts\refresh-android-mirror.ps1` | robocopy exit 3 (informational). **Parity check passed**: 135 files plus 6 named files. |
| Mirror: `build:android`, `npx cap sync android`, `gradlew.bat assembleDebug --no-daemon` (JDK 21.0.12, SDK `C:\Users\aaron\Android\sdk`) | **BUILD SUCCESSFUL** in 27 s. `app-debug.apk` is 3,963,269 bytes. The synced `index-0UeFeQD-.js` contains the new glyph code. |
| Glyph mutation runs (scratch copy of `src/`) | See §3 |
| `npx prettier --check` on the 9 changed code files | 7 clean. `cutout-insets.spec.ts` and `playwright.mobile.config.ts` warn, and so do their HEAD versions (L4). |
| Cleanup | No listener on 4174-4177, no `java.exe` running. The scratch `node_modules` junction was removed as a link only; the project `node_modules` is intact. |
| `git status --porcelain` before vs after | My runs added nothing. New untracked entries appeared from other agents during the review: UAT screenshots, `docs/mobile/tests/uat-plan.md`, `docs/reviews/code-review-v3-round1.md`. |
| Denied commands | None |
| Emulators | None started |

**Not done:**
- Only one Playwright run (3 repeats each), at 4 workers, because UAT emulators were sharing the machine.
- The F23 AC7 source search for other X-drawing code was not run. It belongs to the tester, security and design gates.

## 3. Glyph test mutation results

Each mutation was applied to a scratch copy of `shapes.ts` and `powerUpGlyphs.test.ts` was run (64 cases baseline, all passing).

| Mutation | Failed cases |
|---|---|
| Fist: 2 knuckles | 4 |
| Fist: 5 knuckles | 4 |
| Fist: knuckles too tall | 4 |
| Fist: flat top, no knuckles | 4 |
| Fist: forearm stub at the bottom | 2 |
| Fist: self-crossing outline | 6 |
| Fist: stroked instead of filled | 4 |
| Fist: second `fill()` | 4 |
| Fist: new color | 2 |
| Fist: shifted 0.2r off-centre | 4 |
| Fist: 4 knuckles plus a tiny extra bump | 2 |
| Rabbit: one ear | 8 |
| Rabbit: front ear folded forward and down | 10 |
| Rabbit: stubby ears | 4 |
| Rabbit: eye cut-out (second subpath) | 6 |
| Rabbit: upright, narrow body | 4 |
| Shield: radius 0.45r | 2 |
| Shield: radius 0.2r | 2 |
| Shield: filled dot | 6 |
| Shield: half arc | 2 |
| Shield: fixed 4 px radius (not scaled) | 1 (fails at r = 20 only, which is why the second radius matters) |
| X turned into "+" | 4 |
| X: a = 0.5r | 4 |
| X: lineWidth 3 | 2 |
| Ring: lineWidth 3 | 2 |
| Fist and rabbit swapped | 10 |
| Fist: 3 knuckles (valid under AC4.1) | 0, as it should be |
| Rabbit mirrored, head on the left (valid under AC4.2) | 0, as it should be |

## 4. Findings

### L1 (Low, suggested): the sibling cutout test still reads the canvas once

- **Where:** `tests/mobile-e2e/cutout-insets.spec.ts:382` ("with measured gesture insets the playfield really uses a gesture band").
- **Problem:** it has the same `toBeHidden()` then single `boundingBox()` pattern that was just fixed at `:397`. It will not flake, because a pre-fit canvas (y = 0, height 360) also satisfies all three assertions. That means the test can pass without the inset layout having run.
- **Fix:** poll here too, or first wait for a post-fit signal, then read.
- **Owner:** junior developer or junior tester.

### L2 (Low, suggested): knuckle test ignores bumps under 0.02r

- **Where:** `src/render/powerUpGlyphs.test.ts`, AC4.1 knuckle case (`topBumps(pts).filter((b) => b.prominence >= 0.02)`).
- **Problem:** AC4.1(b) says 3 or 4 bumps, each 0.04r-0.15r. A bump below 0.02r is dropped before the count rather than failing. At r = 12 that is under a quarter of a pixel, so it cannot be seen.
- **Fix:** add a one-line comment saying the 0.02r floor is flattening noise, or drop the filter.

### L3 (Low, suggested): fist allocates its knuckle table on every call

- **Where:** `src/render/shapes.ts`, `drawFistGlyph` (the inline array of four `[x0, x1]` pairs in the `for…of`).
- **Problem:** one small array is created per fist token per frame. The cost is negligible, but it is the only per-frame allocation in the glyph code.
- **Fix:** hoist it to a module-level `const`.
- **Note:** the mobile-touch-and-layout skill prefers pre-rendered sprites. The renderer draws every shape as vector paths today, and this change does not make that worse. Step 10's low-end profile run is the place to confirm smoothness.

### L4 (Low, pre-existing): two test-side files are not prettier-formatted

- **Where:** `tests/mobile-e2e/cutout-insets.spec.ts` and `playwright.mobile.config.ts`.
- **Problem:** both fail `prettier --check`, at HEAD as well as now. The new lines themselves are formatted. `npm run lint` only covers `src`, so nothing catches this.
- **Fix:** run prettier on both in a later round.

### L5 (Low, optional hardening): first-party actions pinned by tag

- **Where:** `deploy-pages.yml:189` (and `:157`, plus `checkout`, `setup-node`, `deploy-pages`).
- **Status:** allowed by L5 as written and already recorded as V2-I1. No action required this round.

### Note for step 11 and the security pass (not a code finding)

- I viewed `f23_tokens_magnified_8x.png` and `f23_tokens_2x_gray.png`.
- At 8x: the fist shows four knuckles and a thumb; the rabbit is a whole crouched body with two upright ears; circle and X are clear.
- In the small grayscale render, the fist and rabbit are both small filled blobs. The rabbit's ears still show, but the margin is thin.
- AC6(b) (named without color at 24px), AC4.2(d) (rabbit IP check) and Q-v5-1 (circle inside ring) are rulings for mobile-ui-ux-designer and mobile-security-compliance-reviewer.

## 5. Standards conformance

- **coding-standards**
  - Style: PASS. Two small named helpers, no dead code, the old glyph code is removed.
  - Error handling: N/A (pure draw code).
  - Logging: N/A.
  - Code documentation: PASS. Both helpers have intent docstrings, each branch cites its AC, and the secret-scan comment says why there is no CSS exception.
- **mobile-touch-and-layout**
  - Touch, screen fitting, lifecycle and back: untouched.
  - Timing: no frame-count logic added.
  - Performance: see L3.
- **Platform pitfalls**
  - No game logic duplicated or branched per platform. The glyph change is in shared `src/render/` and both builds draw the same `drawPowerUp`.
  - No hand edits under `android/`. The mirror sync regenerated the assets.
  - Canvas DPR and insets handling unchanged.

## 6. Routing

- **Step 9 (mobile-junior-tester) may start.** L1 and L2 can be done there.
- **mobile-junior-developer:** L3 and L4 (suggested, non-blocking).
- **Website pipeline:** F23 is a shared change and `deploy-pages.yml` is shared CI, so both still need the website code-reviewer, test and UX gates before either version ships.
- **mobile-ui-ux-designer / mobile-security-compliance-reviewer:** the AC6(b), AC4.2(d) and Q-v5-1 rulings above, plus the AC7 source search.
