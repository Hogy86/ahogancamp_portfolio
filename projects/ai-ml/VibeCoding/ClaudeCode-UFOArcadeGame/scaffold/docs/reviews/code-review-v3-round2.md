# Code Review v3, Round 2: Shared F23 r5 fist and rabbit glyphs

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Result: PASS**

Reviewer: code-reviewer (independent). Date: 2026-10-01. Base: HEAD bfc1178 plus uncommitted changes.
Spec: docs/PRD-addendum-v5.md F23 r5 (AC3(d), AC4.1, AC4.2, AC6, AC7, AC8), ADR-0004.
Scope (website-affecting only): src/render/shapes.ts, src/render/powerUpGlyphs.test.ts, scripts/render-powerup-tokens.mjs (new). The Android files and the mobile e2e specs in the same diff were not reviewed.

## Verification run
- `npm run typecheck`: pass.
- `npm run lint`: pass (exit 0). It covers `src` only, so not the new script (see L1).
- `prettier --check` on the three files in scope: pass.
- `npm test`: 32 files, 657 tests pass. powerUpGlyphs.test.ts has 97 tests, all pass. shapes.test.ts and PowerUpSystem.test.ts pass without edits (AC8).
- `npm run build`: pass.
- Independent measurement: I bundled `src/render/shapes.ts` in memory and ran the real `drawPowerUp` against my own recording stub, flattening each curve to 400 steps (the test file uses 16). Results are the same at r = 12 and r = 20:

| Glyph | Width | Height | Box centre (x, y) | Largest recorded coordinate | Largest distance from centre | Gap to ring at r = 12 |
|---|---|---|---|---|---|---|
| Fist | 1.123r | 0.966r | -0.029r, 0.049r | 0.616r | 0.713r | 2.45 px |
| Rabbit | 1.266r | 1.051r | 0.017r, -0.025r | 0.650r | 0.721r | 2.35 px |

- Not run: the render script, Playwright's mobile suite and the Android emulators. I did not look at the rendered tokens this round.

## Spec conformance (F23 r5)
| AC | Status | Evidence |
|---|---|---|
| AC3(d), stroked glyphs | Met | Circle and X are still asserted within ±0.45r (test lines 515-525). |
| AC3(d)(i) ±0.65r box | Met | Fist 0.616r, rabbit exactly 0.650r (the muzzle). Test lines 529-535. |
| AC3(d)(ii) 0.75r distance | Met | Fist 0.713r, rabbit 0.721r. Test lines 536-540, at both radii. |
| AC3(d)(iii) 2.0 px gap | Met | 2.45 px and 2.35 px; no optional stroke is used, so s = 0. Test lines 541-547. |
| AC4.1(a)-(d) fist | Met | Box within 1.0r-1.3r by 0.8r-1.2r and centred within ±0.1r. Four knuckles, about 0.15r high and 0.22r apart. One test per item (lines 553-584). |
| AC4.2(a) rabbit box | Met | W 1.266r, H 1.051r, W ≥ H, centred. Test lines 592-600. |
| AC4.2(b)1-7 ears | Met (tested) | One test per numbered item (lines 603-664), each asserting the range as written. |
| AC4.2(c)1-6 body | Met (tested) | One test per numbered item (lines 668-758). |
| AC4.2(d) IP | Not for this gate | The code has one filled outline, no cut-out and no accessories. The by-eye check belongs to the design and security reviews. |
| AC6(a) | Met | The signature test uses the r5 thresholds (knuckles 0.06r-0.22r, ears ≥ 0.3r rooted in the head half), lines 375-406 and 788-793. |
| AC6(b) | Not for this gate | The script produces files 1-4 with the spec's names. File 5 (emulator capture) and the naming test belong to the UX reviews. |
| AC7 | Met | A source-search test now exists (lines 799-835): diagonal vertices occur only in shapes.ts, four of them. |
| AC8 | Met | The diff to shapes.ts touches only `drawFistGlyph`, `drawRabbitGlyph`, the `FIST_KNUCKLES` comment, the new `FIST_SCALE` and two comments. The SHIELD branch (0.34r arc), the X branch (a = 0.35r), the ring and the disc are unchanged. No file under src/config, src/systems or src/core is in the diff, so `POWERUP_RADIUS` and the catch hitbox are untouched. |
| AC10 | Met | The branch comments still cite "PRD addendum v5 F23 AC4.x"; the test header cites r5. |
| ADR-0004 | Met | Still procedural canvas paths; no bitmap asset added to the build. |

Round 1's L1 (AC1(d) tolerance) and L2 (AC7 not tested) are both fixed.

## Findings (ranked by severity)

No Critical, High or Medium findings.

**L1 (Low, suggested): scripts/render-powerup-tokens.mjs:6, `esbuild` is not a declared dependency.** The script imports `esbuild`, but package.json does not list it; it resolves only because vite pulls it in. A vite upgrade could break the evidence script without warning. Fix: add `esbuild` to devDependencies at the installed version, and add an npm script (for example `"render:tokens"`) so the command is documented.

**L2 (Low, suggested): scripts/render-powerup-tokens.mjs:64, a dead lint directive.** The `eslint-disable-next-line no-undef` comment has no effect because `npm run lint` does not cover `scripts/`. Running eslint on the file by hand reports two errors under the `src` rules: `import.meta` (line 12) and `process` (line 14). Fix: remove the directive, or add a Node override for `scripts/*.mjs` to the eslint config and lint the folder.

**L3 (Low, suggested): scripts/render-powerup-tokens.mjs:16-17, duplicated values.** `POWERUP_RADIUS = 12` and the background colour are copied by hand, so the evidence could drift from the game if either changes. Fix: export them through the bundle entry, or add a comment naming the source constant.

**L4 (Low, suggested): powerUpGlyphs.test.ts:645 and 687, loose "drawn by a curve" checks.** AC4.2(b)6 and (c)2 are asserted as "some curve call ends within 0.15r (or 0.2r) of the tip or rump". A pointed tip made by a `lineTo` next to a curve would still pass. The current glyph is correct, since each tip sits inside its own bezier. Fix: assert that the outline segment holding the tip comes from a curve op.

**L5 (Low, suggested): shapes.ts:372 and 376, the doc comment gives two angles.** It says the ears "lean back about 16 degrees" and were "rotated 18 degrees about its base". Both may be true (measured lean against generation angle), but it reads as a contradiction. Fix: say "rotated 18 degrees, which measures as about 16 degrees by the AC4.2(b)5 method".

**I1 (Info): the rabbit's muzzle sits exactly on the ±0.65r limit** (shapes.ts:389-390). It passes only through the test's 1e-9 tolerance. Any later nudge to the nose needs the bound re-checked.

**I2 (Info): the test file is slow.** It takes 4.6 s, of which 3.3 s is the two SPEED "+" checks (the horizontal-by-vertical pair loop). Acceptable; note it if CI time matters.

## Coding standards
- Style: PASS. Lint and Prettier are clean on `src`. The old rabbit path is fully replaced, with no commented-out code. `FIST_SCALE` is a named constant, not a magic number.
- Error handling: PASS. Pure draw calls. The script closes the browser in a `finally` block.
- Logging: N/A. The script's one `console.log` per file is tool output.
- In-code documentation: PASS, with L5. Both helpers and both constants have intent comments, and every path line names the body part it draws.

## Gate
PASS. test-writer (step 9) may start. L1-L5 are optional. Still required before either version ships: the AC6(b) unmagnified naming test (website v3 round 3, mobile round 8), the new IP check of the redrawn rabbit and fist (AC4.2(d), addendum 4 §1.3), and the Android-side gates.

## Reviewer side effects
- `npm run build` regenerated the gitignored `dist/`.
- No files were written or edited; the measurement ran in memory. No emulators or Playwright runs were started.
