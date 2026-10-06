# Code Review v3, Round 1: Shared F23 power-up glyphs, secret-scan fix, CI artifact step

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Result: PASS**

Reviewer: code-reviewer (independent). Date: 2026-09-30. Base: HEAD 451dfa9 plus uncommitted changes.
Spec: docs/PRD-addendum-v5.md r3 (F23), docs/PRD.md and addenda v2-v4, docs/architecture/solution-architecture.md, ADR-0004.
Scope (website-affecting only): src/render/shapes.ts, src/render/powerUpGlyphs.test.ts (new), scripts/check-no-secrets.mjs and its test, and the repo-root .github/workflows/deploy-pages.yml.

## Verification run
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `prettier --check` on the four changed source and test files: pass.
- `npm test`: 32 files and 624 tests pass. powerUpGlyphs.test.ts has 64 tests and all pass. The existing shapes.test.ts and PowerUpSystem.test.ts pass without edits (AC8).
- `npm run build`: pass. `dist/assets/index-*.js` contains the new glyph code (the `bezierCurveTo` fist and the 0.34r circle).
- `npm run check:secrets` over the whole repository: clean.
- Render check: I ran the vite dev server and a scratch Playwright script that calls the real `drawPowerUp` at r = 12, at 1x, as a grayscale copy, and at 8x. It rendered the fist (4 knuckles, tucked thumb, flat base), the side-view rabbit (two ears on the right, four-leg stance), the small stroked circle with a wide gap to the ring, and the X. All four can be told apart in grayscale at 24px. The final call on the look (fist not a blob or paw, rabbit not a cat, circle not a target, and the AC4.2(d) IP check) belongs to ui-ux-designer and security-compliance-reviewer, not to this review.

## Spec conformance (F23 r3)
| AC | Status | Evidence |
|---|---|---|
| AC1(a)-(d) | Met | Fist and rabbit are each one closed simple outline. Shield is one full arc. The X is two segments crossing at (0,0). The "+" check passes. |
| AC2 | Met | Ring and disc code is unchanged. The test asserts the calls are identical for all four types. |
| AC3(a)-(d) | Met | Fist and rabbit use one `fill()` in `LEVEL_INTRO_TEXT_COLOR`. Circle and X are stroke-only at width 2. No new color, no holes. Every point, including control points, is within ±0.45r. The largest are ±0.44r (fist thumb control point, rabbit nose, rabbit tail). |
| AC4.1 | Met | Box about 0.8r × 0.59r. Four knuckle bumps, prominence about 0.11r, 0.16r apart. Width at +0.3r is at least 0.6 × width at 0. |
| AC4.2(a)-(c) | Met (tested) | (d) IP is checked by eye in later gates. The code has no eye cut-out or accessories. |
| AC4.3 | Met | `arc(0,0,0.34r)`. |
| AC4.4 | Met | Geometry is unchanged from HEAD. Only the comment changed. |
| AC6(a) | Met | Signature test per type. |
| AC8 | Met | Only the HIT_POWER, SPEED and SHIELD branches change. The X branch changes its comment only. No gameplay code touched. |
| AC10 | Met | Each branch cites "PRD addendum v5 F23 AC4.x". The X branch cites "review-v2 V2-M3 risk-accepted by owner 2026-09-30". |
| ADR-0004 | Met | Still procedural canvas vector art. No bitmap assets added. |

## Findings (ranked by severity)

No Critical, High or Medium findings.

**L1 (Low, suggested): powerUpGlyphs.test.ts:335-348, AC1(d) tolerance is tighter than the spec.** The addendum's Terminology defines "horizontal" and "vertical" as |dy| ≤ 0.02r and |dx| ≤ 0.02r. The test uses `< 1e-9`, so a nearly-horizontal line and a nearly-vertical line forming a "+" would slip through. The current glyphs are fine, since every straight line is exactly axis-aligned or clearly diagonal. Fix: use `Math.abs(a.y - b.y) <= 0.02` and `Math.abs(a.x - b.x) <= 0.02` (points are already in units of r).

**L2 (Low, suggested): powerUpGlyphs.test.ts:1, the header claims AC1-AC7, but AC7 is not tested.** AC7 asks for a source search showing no other draw code builds an X. My spot check (`grep` for the ±0.35r diagonal pattern in `src`) found only the PERMANENT_MULTIPLIER branch. Fix: either add the AC7 source-search test or change the header to "AC1-AC4, AC6(a)". test-writer can own this at step 9.

**L3 (Low, suggested): scripts/check-no-secrets.test.mjs:337, the test title is inaccurate.** It calls `#sk-container-id-1` a "digit-free CSS name", but it contains a digit. It passes only because `container-id-1` is shorter than the S7 `sk-` pattern's 20-character minimum. The behavior is right; the name is misleading. Fix: rename, for example "…digit-free CSS names like .sk-toggleable__content and short ids like #sk-container-id-1".

**I1 (Info): the secret-scan change is correct and tightens security.** Removing `CSS_SK_SELECTOR` closes the hole where `#sk-proj-<digits…>` or `.sk-<digits…>` was stripped before matching. The new test proves both now fail. The whole-repo scan is still clean, so the removal causes no new false positives.

**I2 (Info): the workflow artifact step is correct.** `with.path` is not affected by `defaults.run.working-directory`, so the path from the repo root is right. Playwright's default `outputDir` is `test-results/` next to `playwright.mobile.config.ts`, which matches that path. `if: failure()`, `if-no-files-found: ignore` and 7-day retention are appropriate. `actions/upload-artifact@v4` is tag-pinned, which matches the existing first-party action convention in this file (only third-party actions are SHA-pinned). Traces hold only the public game build, with no secrets or PII.

## Coding standards
- Style: PASS. Lint and Prettier are clean. The small named helpers `drawFistGlyph` and `drawRabbitGlyph` have one job each. The replaced glyph code and `CSS_SK_SELECTOR` are fully removed, with no commented-out leftovers.
- Error handling: N/A. These are pure draw calls, with no trust boundary.
- Logging: N/A.
- In-code documentation: PASS. The helpers have intent doc comments, and the non-obvious choices have "why" comments (bezier knuckles for legibility at 24px, no broader CSS exception).

## Gate
PASS. test-writer (step 9) may start. L1-L3 are optional. L1 and L2 fall naturally to test-writer. Also still required before either platform ships: the AC6(b) grayscale visual review, the AC4.2(d) and AC4.3/Q-v5-1 IP rulings, and the Android-side gates (not part of this review).

## Reviewer side effects
- `npm run build` regenerated the gitignored `dist/`.
- A capture script was briefly placed at `node_modules/.review-shot.mjs` and then deleted; the dev server was stopped.
- No tracked files were changed, and no emulators were started.
