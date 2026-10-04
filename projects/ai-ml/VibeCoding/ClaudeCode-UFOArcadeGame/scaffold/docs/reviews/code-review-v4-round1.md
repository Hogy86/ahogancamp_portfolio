# Code Review v4 - Round 1 (website pipeline, step 8)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Result: PASS**

- Reviewed: uncommitted working tree vs HEAD 783b6de, website-affecting files only.
- Spec: docs/PRD.md F3 AC6 (line 186); docs/PRD-addendum-v2.md F12 AC10-11;
  docs/PRD-addendum-v4.md F22 AC4 (line 317); docs/architecture/solution-architecture.md.
- Out of scope (mobile reviewer): src/platform/android/*, tests/mobile-e2e/*,
  playwright.mobile.config.ts.

## Files reviewed
- src/config/constants.ts (FORMATION_WARNING_TEXT, BOSS_WARNING_TEXT)
- src/render/CanvasRenderer.ts (topBannerTextOnCanvas, setTopBannerTextOnCanvas, gated text)
- src/platform/Platform.ts (PlatformContext.setTopBannerTextOnCanvas)
- src/main.ts (context wiring, line 81)

## Verification run
| Check | Result |
|---|---|
| npm run typecheck | pass |
| npm run lint | pass, no findings |
| npm run test | pass, 32 files / 657 tests |
| npm run build | pass, one JS chunk (35.27 kB) |

Playwright mobile suite and emulators were not run, as instructed.

## Findings against the brief

1. **The flag is never switched off on web - confirmed.**
   - The only caller of `setTopBannerTextOnCanvas` is
     src/platform/android/AndroidPlatform.ts:182.
   - src/platform/web/WebPlatform.ts never references it.
   - src/main.ts:31-34 loads the Android platform only when
     `import.meta.env.MODE === 'android'`.
   - The field defaults to `true` (CanvasRenderer.ts:44).
   - The web bundle contains no `top-banner` or Capacitor strings.

2. **Drawn output is unchanged vs HEAD - confirmed by line comparison.**
   - Formation warning (CanvasRenderer.ts:107-127): border stroke, fill `#ff5a5a`,
     `bold 16px system-ui, sans-serif`, centred, at (PLAYFIELD_WIDTH / 2, 24).
     Same calls in the same order.
   - Boss warning (CanvasRenderer.ts:134-153): amber border, `bold 20px`, 4 px stroke in
     LEVEL_INTRO_TEXT_STROKE_COLOR, fill in LEVEL_INTRO_TEXT_COLOR, at
     (PLAYFIELD_WIDTH / 2, 24). Same calls in the same order.
   - Both strings are byte-identical to the HEAD literals: 'WARNING: ROBOTS APPROACHING'
     (F22 AC4) and 'BOSS INCOMING' (F12 AC10).
   - Borders are drawn outside the gate in both methods, so F3 AC6's non-colour-only cue
     and F12's solid flash hold on web.

3. **Tests pass, but none covers the canvas text - NOT confirmed as briefed.**
   - There is no CanvasRenderer test file. src/render holds only shapes.test.ts and
     powerUpGlyphs.test.ts.
   - No unit test asserts the warning `fillText`/`strokeText` calls, at HEAD or now.
   - This is a pre-existing gap, not a regression, but the claim "web is unchanged"
     currently rests on code reading alone. See S1.

4. **Add-on risk is nil for web.**
   - One private boolean, one setter, one context method; no new imports or dependencies
     in the web bundle.
   - No game-logic change, so the "one codebase" rule is respected: rules live once and
     only presentation is platform-specific.

## Coding standards
| Category | Result | Notes |
|---|---|---|
| Style | PASS | Small single-purpose setter; no dead or commented-out code; lint clean |
| Error handling | PASS | No new failure paths |
| Logging | PASS (n/a) | No logging added |
| Documentation in code | PASS | Constants, field, setter and interface method all carry intent/why comments |

## Required fixes
None.

## Suggested fixes (non-blocking)
- **S1 (test-writer, step 9).** Add src/render/CanvasRenderer.test.ts with a recording 2D
  context:
  - (a) By default, an active formation warning calls
    `fillText(FORMATION_WARNING_TEXT, PLAYFIELD_WIDTH / 2, 24)` with font
    `bold 16px system-ui, sans-serif` and fill `#ff5a5a`.
  - (b) By default, a boss warning calls `strokeText` then `fillText` with
    BOSS_WARNING_TEXT at the same point, in `bold 20px`.
  - (c) After `setTopBannerTextOnCanvas(false)`, neither text call happens but
    `strokeRect(3, 3, PLAYFIELD_WIDTH - 6, PLAYFIELD_HEIGHT - 6)` still does.
  - (d) Pin the two constants to their literal strings so a constant edit cannot silently
    change F22 AC4 copy.
- **S2. CanvasRenderer.ts:141-146.** In `drawBossWarning`, `font`, `textAlign`,
  `lineWidth = 4` and the stroke colour are set outside the `if`, so they are dead work
  when the flag is off. Moving them inside the gate would mirror `drawFormationWarning`.
  No effect on web.
- **S3. CanvasRenderer.ts:121-123.** The F22 AC4 rename comment now sits above a constant
  reference rather than the literal; it reads better beside FORMATION_WARNING_TEXT in
  constants.ts.
- **S4. docs/architecture/solution-architecture.md.** It does not mention the new
  PlatformContext method; a one-line note (or a pointer to the mobile architecture doc's
  M2.3b) would keep traceability.

## Gate
PASS - test-writer may proceed. S1 should be picked up there.
