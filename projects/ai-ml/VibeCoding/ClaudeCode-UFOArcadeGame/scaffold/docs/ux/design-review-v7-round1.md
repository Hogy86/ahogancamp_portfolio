# UX Design Review v7 round 1: power-up guide and contact line (website, late review)

**Result: PASS.** No required changes. Four suggested findings.

Reviewer: ui-ux-designer. Spec: `docs/PRD-addendum-v7.md` F24 to F26. Builds on `docs/ux/design-review-v3-round3.md` (fist and double arrow validated as distinct glyphs; ring and gap rules) and does not restart it. Code read: `src/ui/powerUpGuide.ts`, `src/ui/ScreenController.ts`, `src/style.css`, `src/platform/android/android.css`, `src/render/shapes.ts`, `src/ui/HUDView.ts`. Evidence: `web_800x600_title_v7.png` (the website), plus the `android_*_v7.png` title and help shots (640x360, 800x360, Pixel 7) for consistency. Static renders only.

## Round 1 flows, rechecked

- Title screen to start (Enter, hint line): unchanged. The guide and contact line sit below the keyboard hint, so "Press Enter to start" stays the visible primary action. No new friction.
- Keyboard: the guide is a non-interactive list and adds no tab stops. Focus order is unchanged.
- Fit at 800x600: title, best score, start line, hint, guide and contact line stack in one centred column with large empty space around them. No overlap, no scroll, no wrapping. F24 AC4 met on the website by this screenshot.
- Android 640x360, 800x360 and Pixel 7: Start and the three buttons stay fully visible, the guide is one row, and the help overlay shows the four rows plus "Got it" with no scroll. Consistent with the website guide (same icons, same order, same label wording).

## F24 / F25 / F26 checks

- AC1 and AC2: four icons, one text label each, order Power, Speed, Shield, Multiplier. Met.
- AC3: icons are `aria-hidden` canvases; labels are real text in a `ul` with `aria-label="Power-ups"`. Met. Canvas colours match the falling token (same `drawPowerUp`).
- Contrast: label text `#c8c8e0` and contact text `#9a9ab8` on the near-black overlay are well above 4.5:1. Meets the baseline. Meaning is carried by the label, not by colour.
- F26 AC2: one small line "Developer: <name> · <the developer email>", 13px, one line, no wrap at 800x600. It is plain text and not a link, which matches the spec ("shown"). (Per the owner rule this doc does not repeat the address.)

## Double-arrow (speed) icon

Question: does it read clearly as a distinct icon at token size and in the guide?

Cold read at 24px (title guide, 4x upscale of the 800x600 crop and the Pixel 7 render): fist is a filled yellow knuckled lump, speed is a ring with a thin horizontal line and two small chevrons ("left-right arrow"), shield is a ring with a small ring inside, multiplier is a ring with a diagonal cross. The arrow is clearly different from the other three: it is the only one with a horizontal stroke and the only one that is not centred on a single dot or cross. It does not read as the X, which was the earlier risk (L1 in the v6 history). In the guide the label "Speed" sits beside it, so the pairing is unambiguous.

Caveats, none blocking:
- The glyph is small. The span is only +-0.45r (about 11 px wide inside a 24 px token, about 6 px at the 13 dp in-play size) and the chevron heads are about 0.27r. At 24px the heads are readable but light compared with the filled fist. On a 1x display the arrow looks a little weaker than its neighbours. See S2.
- A left-right arrow says "sideways" or "swap" rather than "fast". Combined with the label it is fine, and the game is horizontal, so it is accurate for what the power-up does. Label dependence is acceptable because every instance of the guide has the label.
- The icon is not different in colour from the others (all one yellow), so the guide relies on shape alone, which is what F11 AC8 asks for.

Verdict on the icon: reads as a distinct double-headed arrow at 24px and 20px. The in-play 13 dp reading remains owned by the mobile review (as in v3 round 3); I did not see a 13 dp capture this round.

## Ruling on code review round 22 S1 ("Power"/"Multiplier" vs HUD "5x Hit" and "Power ×N")

**Ruled a real inconsistency, kept as suggested (not required), to be fixed at the next touch of `HUDView.ts`.**

- Why it is real: the guide, which a player reads first, teaches Power = fist (temporary, 5x hit) and Multiplier = X (permanent). The HUD then labels the permanent multiplier "Power ×1.80" and the fist effect "5x Hit". After catching an X, the player sees "Power" rise, and may think the fist did it. Same word, two meanings: a consistency and match-with-real-world violation.
- Why not required: the guide labels are owner-set (F24 AC2); the HUD readout is outside this diff and was already shipped; the guide sentences ("hits get stronger for the rest of the game") are correct. The harm is mild confusion, not a blocked task.
- Recommended fix: rename the HUD's permanent readout to "Multiplier ×1.80" (check it still fits the HUD width and the Android top-banner offset), and change the fist's effect text from "5x Hit" to "Power ×5" or "Power 8.0s" so it uses the guide word. "3x Speed" and "Shield" already match. Update `HUDView` tests and any e2e that read the old text. If the owner prefers the HUD wording, the other option is to rename the guide labels, but that overrides an owner decision, so the HUD change is the smaller step.

## Findings

[Title screen: guide and contact line] - Consistency (S1) - HUD says "Power ×N" for the X's permanent multiplier and "5x Hit" for the fist, while the guide says "Multiplier" and "Power" - Rename HUD text as in the ruling above. Suggested.

[Speed icon at 24 px / 13 dp] - Recognition (S2) - Arrow span and chevron heads are small and light next to the filled fist - If the owner wants more punch, widen the span to about +-0.55r and thicken heads slightly in `drawDoubleArrowGlyph`, keeping the 2 px ring gap and the L1 geometry tests. Suggested; not needed to pass.

[Title screen, website] - Minimalist design (S3) - The guide has no heading or hint tying it to the game, so a first-time player may not know the icons are things that fall - Optional lead-in such as "Catch these:" inside the `aria-label` and as a small visible word. Suggested.

[Title screen: contact line] - Flexibility (S4) - The contact line is plain text, so a user cannot click or tap to email - If the owner wants it actionable, make it a `mailto:` link built from the same source constant, with focus style. Only if the owner asks; the spec says show, and `textContent`-only rules apply. Suggested.

## Gate

Website UX gate for PRD v7 F24 to F26: **PASS**. No change is needed from the builder to ship. Remaining items are suggested and batch into the next change that touches `HUDView.ts` or `powerUpGuide.ts`.
