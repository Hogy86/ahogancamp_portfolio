# Validation report, round 8 (mobile lead tester, core team)

**Verdict: PASS**

Change under test: the uncommitted working tree against HEAD 0234811 (addendum v7, F24-F27). Code review: `docs/mobile/reviews/code-review-round22.md` (PASS).

**Environment limit, stated plainly:** this cloud container has no Android SDK or emulator. The emulator device matrix was NOT run. It is replaced by the Playwright phone-emulation projects in `playwright.mobile.config.ts` (Chromium touch/mobile emulation at 640x360, 800x360, 915x412, 1280x800). That is not a WebView, gesture-navigation, cutout or fold check. Playwright 1.63 could not find its pinned browser, so the run used a temporary config outside the repo (imports the repo config, sets `executablePath` to `/opt/pw-browsers/chromium`); it was deleted afterwards. `playwright install` was not run. Logs: `/tmp/claude-0/test-*.log`.

## Results

| Step | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test` (unit, includes shared game tests = website test gate) | 37 files, 680 tests passed |
| `npm run build` (website) | exit 0 |
| `npm run build:android` | exit 0 |
| `npm run check:secrets` | exit 0 |
| `npm run check:android-styles` | exit 0 |
| Playwright mobile, full suite, `--retries=0`, 4 projects | 325 passed, 30 skipped, 0 failed (6.4 min) |
| Isolated `--repeat-each=5` re-runs | not needed, no failure |

The 30 skipped are by design: `too-small-window`, `cutout-insets`, `menu-insets` run only in the 640x360 project (config `testIgnore`), and the 640x360-only cases in `power-up-guide.spec.ts` (`test.skip` on other projects). No ERR_CONNECTION_REFUSED or timeout flake recurred this round (it did in rounds 6 and 7).

## Failures

None.

## Screenshots (`docs/mobile/tests/screenshots/`, suffix `_v7`)

Phone-emulation captures (Chromium, DPR 2, touch), not device captures.

- `android_640x360_title_v7.png`, `android_640x360_help_v7.png` (smallest phone and the 640x360 window are the same profile)
- `android_800x360_title_v7.png`, `android_800x360_help_v7.png`
- `android_pixel7_title_v7.png`, `android_pixel7_help_v7.png` (915x412, Pixel 7 landscape size)
- `web_800x600_title_v7.png` (website build, `vite preview`, 800x600)

Visual judgement (each one opened and looked at):
- Title, all three Android sizes: four icons (fist, double arrow, circle, X) in yellow rings, each labelled Power / Speed / Shield / Multiplier, on one row; Start, How to play, Settings, Quit fully visible above them; developer line (name and the developer email) readable below, lower contrast than the labels but legible. Nothing clipped or overlapping. At 640x360 the stack uses about 2/3 of the height.
- Help overlay, all three Android sizes: title, three control lines, then four rows of icon + bold label + one sentence, sentences in one aligned column; "Got it" fully visible with space below. At 640x360 the THROW line is close to the side edges (about 33 px of 1280 each side) but not clipped. No scrolling needed.
- Website 800x600: four icons with labels and the contact line sit under the keyboard hint line, no overlap, no scroll. Faint items at the top corners and a partly cut-off strip at the very bottom edge of the frame belong to the existing website page, not this change; worth a glance in the website design gate.
- Sentences match the code values the spec names (5x, 3x, 8 s; reviewed in round 22).

## Criteria coverage

| Criterion | Evidence |
|---|---|
| F24 AC1-AC3 (four icons, labels in order, aria-hidden canvases) | `ScreenController.test.ts`, `powerUpGuide.test.ts`; `power-up-guide.spec.ts` (label text, 4 `canvas[aria-hidden]`, painted pixels); screenshots |
| F24 AC4 (fits, buttons tappable; 800x600 web, 640x360 Android) | `power-up-guide.spec.ts` fit and tappable checks incl. 640x360 inset cases; `android_640x360_title_v7.png`, `web_800x600_title_v7.png` |
| F25 AC1-AC3 (help rows icon + label + sentence, existing lines and "Got it") | `overlays.test.ts`, `power-up-guide.spec.ts` Help block; `android_*_help_v7.png` |
| F25 AC4 (website has no help screen) | Website screenshot and unit tests show no help screen added |
| F26 AC1 (privacy page) | `public/privacy.html`: both placeholders gone, name and developer email present (grep check, value not recorded here) |
| F26 AC2-AC3 (title line, textContent, single source) | `src/config/contact.ts` used by title and tests; `.developer-contact` assertion in `power-up-guide.spec.ts`; screenshots |
| F26 AC4 (owner privacy rule) | No email in this report or the UAT entries; it appears only in UI screenshots (allowed) |
| F27 L1, L3 (glyph test, dead fields) | `powerUpGlyphs.test.ts` passes in the 680 unit tests (mutation check was the reviewer's, round 22) |
| F27 L4 (robot-warning cases, topBanner, border, no `top-banner` in dist) | `robot-warning.spec.ts` in the Playwright run, `topBanner.test.ts`, `CanvasRenderer.test.ts`, `webBundle.test.ts` all pass |

## Not covered (carried forward, no emulator)

Real WebView rendering, gesture and 3-button navigation, cutout phones, tablet, fold, font scale on a device, frame rate, real back-swipe. Last emulator checks: round 7 / UAT round 6. Nothing in this diff touches native config, Gradle or Capacitor files. Recommend one emulator look at the Android title and help screens on the owner's machine (release itself is out of scope).

## Cleanup

Temporary config, symlink and result folders deleted; preview servers stopped. No source or test file edited. Nothing committed.
