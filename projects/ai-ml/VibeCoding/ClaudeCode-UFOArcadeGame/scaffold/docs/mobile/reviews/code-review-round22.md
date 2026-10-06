# Mobile code review — round 22 (core-team review, web + Android)

**Verdict: PASS** (suggested findings only). mobile-lead-tester may start.

- **Date:** 2026-10-06. **Reviewer:** mobile-lead-developer (core-team reviewer, one combined web + Android review).
- **Scope:** uncommitted working tree vs HEAD 0234811 (master): `public/privacy.html`, `src/config/contact.ts`, `src/ui/powerUpGuide.ts` (+test), `src/ui/ScreenController.ts` (+test), `src/platform/android/overlays.ts` (+test), `android.css`, `style.css`, `powerUpGlyphs.test.ts`, `CanvasRenderer.test.ts`, `topBanner.test.ts`, `webBundle.test.ts`, `tests/mobile-e2e/robot-warning.spec.ts`, `tests/mobile-e2e/power-up-guide.spec.ts`.
- **Judged against:** `docs/PRD-addendum-v7.md` F24-F27; `code-review-round21.md` L1, L3, L4; coding-standards; mobile-touch-and-layout; ux-heuristics; security-compliance-checklist.

## Verification (all run this round)

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run check:secrets` | exit 0 |
| `npm run test` | 37 files, 680 tests passed |
| `npm run build` / `npm run build:android` | both exit 0 |
| `npm run check:android-styles` | exit 0 |
| Playwright mobile, full suite, `--workers=4 --retries=0` (temp config outside the repo, local Chromium) | 325 passed, 30 skipped, 0 failed (4.9 min). Skips are the fixed-viewport cases, which run in the 640x360 project only |
| Website title at 800x600 (`vite preview` of `dist/`, one-off probe) | no overlap, no scroll; guide row y 378-402, contact line y 414-430; all four icons painted |
| `prettier --check` on the changed files | 3 files fail, see S2 |

No Android SDK here, so no Gradle build; none was needed (`git diff HEAD -- android` is empty; no native, Gradle or Capacitor change). The temp config and probe were deleted afterwards.

## Round-21 findings

- **L1 — closed.** Mutation run in the working tree: wing-end x sign swapped in `drawDoubleArrowGlyph` (`moveTo`/`lineTo(-side * 0.18 * r, ...)`). Suite went red: 4 failed at both radii (pairwise "meet only at a shared endpoint" check and "left wing ends x < 0, right x > 0"). `src/render/shapes.ts` restored with `git checkout`. The 1/0/4 segment-kind test and the ≥ 0.25r wing-end test are present. The wrong comment is corrected (`powerUpGlyphs.test.ts:562-564`).
- **L3 — closed.** `SubPath.src` and `closeSrc` are gone; no references remain.
- **L4 — closed.** `robot-warning.spec.ts` asserts `role="status"` and `data-kind`, has the three inset rows and the 640x368 (0,0,24,48) window, and a "still shown after pausing" test per banner. `topBanner.test.ts` covers `data-kind`, no DOM write while unchanged (MutationObserver) and `top` following the HUD. `CanvasRenderer.test.ts` asserts the border in both default cases. `webBundle.test.ts` builds web and Android in memory and checks `top-banner` is absent from web and present in Android (positive control).

## F24-F27

- **F24:** one shared `createPowerUpGuide` used by `ScreenController` for both versions; icons are `drawPowerUp` on DPR-sized canvases, `aria-hidden`; labels are text in the PRD order. The unit test proves the icon makes exactly `drawPowerUp`'s calls. AC4 fit is covered on Android by `power-up-guide.spec.ts` and `menu-insets.spec.ts` (48 dp targets, text ≥ 12 px, inside insets, no scroll); website fit checked by hand (above).
- **F25:** the four sentences match the code. Power: `HIT_POWER_MULTIPLIER` 5 applied to hit power (`CollisionSystem.ts:63`) for `POWERUP_DURATION_SECONDS` 8 (`:352`). Speed: `SPEED_MULTIPLIER` 3 on player speed (`MovementSystem.ts:12`), 8 s. Shield: `effects.type === 'SHIELD'` makes enemy lasers harmless (`CollisionSystem.ts:300,319`), 8 s. Multiplier: `permanentMultiplier *= 1.8` (`:356`) feeds hit power and is reset only at run start (`world.ts:161`). The sentences are built from the constants, so they cannot drift. Control lines and "Got it" kept and asserted.
- **F26:** name and the developer email defined once in `src/config/contact.ts`; the title line is set via `createElement` (textContent). Repo search: the developer email appears in source only in `src/config/contact.ts` and `public/privacy.html`; tests import the constant. Other hits are the gitignored build outputs `dist/` and `dist-android/` (expected). Not in docs or logs.
- **F27:** see round-21 findings above.

## Mobile pitfalls

| Pitfall | Result |
|---|---|
| Game logic branched or duplicated per platform | None. One guide module; the Android help list reuses its entries |
| Frame-count timing | None added |
| Touch defaults | Unchanged; title buttons keep 48 dp (asserted) |
| Background listeners, timers, audio | None added. Canvases are built only when the title view key changes |
| Back button | Unchanged |
| DPR and insets | Icon backing store sized by DPR (capped 3x); guide and help inside insets (asserted) |
| Hand edits under `android/` | None |

## Security, IP

Security: no trigger from the security reviewer's list. The developer email is an owner-approved public contact, shown as plain text (no `mailto:`, no `innerHTML`); no new permission, storage or network use. IP: generic labels and glyphs; nothing resembles an existing character.

## Coding standards

Style: PASS with S2. Error handling: PASS (missing 2D context returns a blank decorative canvas, by design). Logging: n/a. Documentation in code: PASS.

## Findings

**Required:** none.

**Suggested (mobile-junior-developer, next touch):**
- **S1 — LOW, UX consistency — `src/ui/HUDView.ts:14,109` vs `src/ui/powerUpGuide.ts:31-51`.** The guide calls the fist "Power" and the X "Multiplier", but the HUD shows the X's permanent multiplier as "Power ×1.80" and the fist's effect as "5x Hit". A player who catches the Multiplier sees "Power" go up. The labels are owner-set (F24 AC2), so this is for the website ui-ux-designer gate or the owner to decide; the likely fix is renaming the HUD readout (e.g. "Multiplier ×1.80"), which is outside this change.
- **S2 — LOW, formatting — `tests/mobile-e2e/power-up-guide.spec.ts:78-83` and `tests/mobile-e2e/robot-warning.spec.ts:191-193`** fail `prettier --check` (lint covers `src/` only). `public/privacy.html` also fails, but it already did at HEAD.
- **S3 — LOW, test robustness — `src/platform/webBundle.test.ts:17`** resolves `vite.config.ts` from `process.cwd()`, so the test breaks if vitest is started from another directory. Resolve it from `import.meta.url` instead.
- **S4 — LOW, test strength — `src/render/CanvasRenderer.test.ts:90`** accepts either pulse colour for the robots border. Pin the pulse phase in the world fixture and assert one colour.

## Notes for the pipeline

- The change alters what a desktop browser player sees (title guide and contact line), so per PRD v7 the website `ui-ux-designer` design gate must pass before merge.
- No website e2e suite exists; F24 AC4 at 800x600 was checked by hand this round only.
