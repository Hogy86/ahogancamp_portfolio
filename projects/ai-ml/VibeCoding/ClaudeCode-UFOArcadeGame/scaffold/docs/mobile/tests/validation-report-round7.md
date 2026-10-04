# Validation report, round 7 (mobile test-validator)

**Verdict: PASS** (with two non-reproducing infrastructure failures in the first full Playwright run, see Part 2)

HEAD 5488b15, working tree clean, delta on the round 6 PASS (57f159e). Raw output: `docs/mobile/tests/raw-output-round7.log`.

## Part 1 - Changed tests
- `src/render/powerUpGlyphs.test.ts` (geometry on a recording canvas stub, r=12 and r=20): one test per numbered r5 rule. Spot-check mutants in a scratch copy of `shapes.ts`, all killed:
  - FIST_SCALE 1.4 to 1.0: 4 failures (box size, knuckle height).
  - fist valleyY -0.2r to -0.33r (knuckles flattened): 4 failures (knuckle test, AC6(a) HIT_POWER signature).
  - rabbit rear ear tip lowered to -0.30r: 18 failures (ear count, height, gap, lean).
  - rabbit hind foot raised to 0.42r: 2 failures ("two feet on one line").
  - rabbit tail bump flattened: 2 failures (tail bump rule).
  Not tautological: they assert recorded geometry against the PRD numbers. How it looks in pixels still needs the screenshots (manual-only AC6(b)).
- `tests/mobile-e2e/context-menu.spec.ts`: dispatches a real cancelable `contextmenu` on a menu button, touch controls, the playfield point, the bare canvas and body, and asserts `defaultPrevented`. It would fail for the canvas and body cases if the document listener were removed. It tests the handler, not Android's long-press timing; the device check covers that. Closes round 6 L2.
- `slide-switch.spec.ts`: re-collection only when in-page gap dwell is under 120 ms or GAMEOVER, capped at 4 of 40, counted and logged. A real stall in the gap still fails (it needs 2 moving frames in a gap that lasted 120 ms or more). The cap was reviewed by reading and not mutated. Observed 0-1 of 40 in every full-suite run. Closes round 6 L1.

## Part 2 - Runs
| Step | Result |
|---|---|
| check:secrets, typecheck, lint, build, build:android | all exit 0 |
| Unit tests | 32 files, 657 tests passed |
| Playwright mobile, `--repeat-each=3 --retries=0` | 657 runs (219 tests x 3): **655 passed, 2 failed**, 10.7 min |
| Isolated re-run of the two failing specs, `--repeat-each=10` | 300 of 300 passed (3.9 min) |

(My earlier progress note said about 1935 runs. That was a bad extrapolation from the global test numbering. The total is 657.)

Failure 1 (infrastructure, recurred): `[640x360] menu-insets.spec.ts:220:7 ... smallest playable safe height (291.6 dp) 0,0,30,38.4`:
`Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4174/?insets=0,0,30,38.4&e2e=1`
The preview server refused one navigation. Same signature as round 6 (a different parameter row), so the ERR_CONNECTION_REFUSED infrastructure failure **did recur**, in two rounds running, at about 1 in 650 runs.

Failure 2 (new, infrastructure): `[1280x800] swap-layout-behavior.spec.ts:89:3 ... turning on Swap controls mirrors the columns and every control still works at its new position`:
`Test timeout of 30000ms exceeded.` / `Tearing down "context" exceeded the test timeout of 30000ms.` / `Error: End of central directory record signature not found. Either not a zip file, or file is truncated.` (the trace zip was truncated). Artifacts: `test-results\swap-layout-behavior-Swap--d0ae3-l-works-at-its-new-position-1280x800\` (screenshot, error-context). No assertion failed. The test and the code it drives are unchanged by the delta, and it passed 10 of 10 in isolation. Not a product defect.

Ruling: the strict reading ("one clean 657/657 run") was not met. I rule PASS because both failures are connection or timeout errors with no assertion failure, both specs pass 300/300 in isolation, and nothing in the delta touches them. Recommendation for mobile-junior-tester (non-blocking): make the preview server more robust (readiness URL on the webServer, or fewer workers), because this one CI check also gates the website deploy. If the owner wants a strict clean run, re-run with `--workers=4`.

Website/shared tests: the unit suite (which holds the shared game tests) passed 657/657; build and typecheck pass.

## Part 3 - Device checks (lowend, pixel7; details in `device-matrix.md`, Round 7)
- Four tokens captured in real play at 1:1 on both profiles, with 1:1 crops in color and grayscale (`m2_7_{lowend,pixel7}_powerup_{fist,rabbit,circle,X}_r5.png`, `*_crop_r5.png`, `*_crop_gray_r5.png`).
- Honest reading: on pixel7 the fist and rabbit are recognisable as a fist and a rabbit. On lowend the fist is a toothed block with a thumb notch, and the rabbit is a blob about 15 px wide with two thin back-leaning ears. All four are distinguishable from each other in color and grayscale. Whether that is legible enough (AC6(b)) is for UX round 2.
- Catch hitbox: fist (Hit) and X (Power x1.80) caught in real play on both profiles; the diff changes drawing only. Rabbit and circle catches were not separately confirmed (no HUD readout).
- Long-press on bare bands and edges: `contextmenu` fired and was prevented every time it fired, with no popup (`lowend_longpress_band_r5.png`, `pixel7_longpress_band_r5.png`). The left control column on lowend produced no event at all.
- 0 FATAL EXCEPTION on both devices.
- Not covered (carried forward): frame rate N1, levels 2-10, real back-swipe, incoming call, real fold, other AVDs (no WebView-sensitive change in the diff).

Cleanup: both emulators, the adb server and the Gradle daemon were stopped. No device settings were changed. Nothing committed. No commands were denied.
