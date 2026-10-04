# Design Review Round 6 (mobile-ui-ux-designer, step 11)

**Result: FAIL** (one Medium finding: the rabbit token, AC6(b)). Menu spacing and title fit: PASS. Everything else is unchanged from rounds 4 and 5.

**Inputs:** PRD-addendum-v5 F23 r3/r4, PRD-mobile M3.1 and M9.6 (with C7), round 5, validation-report-round6, device-matrix, and the `_r6.png` screenshots plus `f23_tokens_*.png`. The old-icon file `m2_7_lowend_mixed_robots_powerups_L3_round6_b2.png` was ignored.

## (1) Token legibility (F23 AC6(b))

Scale note: in play on the 640x360 dp low-end profile the whole token is about 26 px across in a 1280x720 capture, i.e. about 13 dp. On the Pixel 7 it is about 34 px in a 2000 px capture, which is also about 13 dp. The glyph inside is only 8-10 px of that. The spec's 24 px sheet is therefore a larger-than-real test. In play, what remains is silhouette only.

| Token | Color | Grayscale 24 px (`f23_tokens_24px_gray`, `_2x_gray`) | In play, low-end and Pixel 7 | Verdict |
|---|---|---|---|---|
| Circle (shield) | clear small ring inside the ring | clear | clear, a hollow dot | PASS |
| X | clear | clear | clear (two strokes, no center shape) | PASS |
| Fist | square block, flat top, knuckle bumps, thumb nub at left | a squarish blob with a notch; nameable as fist | a solid square with a nub; knuckle ticks about 1 px | PASS (marginal) |
| Rabbit | wide body, two thin ears, tail | a wide blob with a faint tick; ears are barely visible | body is a lumpy wedge; the ears are 1 px specks and vanish on the low-end 2x capture | FAIL |

Fist and rabbit are told apart by aspect (square vs wide), but "rabbit" cannot be named without the ears, and the ears are the only rabbit-specific feature. The 8x closeups look fine, which is exactly why they are not the evidence that matters.

**Required change (rabbit only, `drawPowerUp`, shared art, both gates):**
1. Make the ears about 1.5-2x thicker and taller: each ear at least 2 px wide at r = 12 and rising to about 0.45r above the back line, so they stay 2 px wide after downscale to 13 dp.
2. Split the two ears with a visible gap of at least 2 px.
3. Shorten and round the body, and tilt or raise the head slightly so the silhouette is not a plain horizontal wedge. A ratio of about 1.5:1 width to height works.
4. Keep the glyph inside the +-0.45r bound that `powerUpGlyphs.test.ts` already asserts. Update the ear-geometry assertions to match, and recapture `m2_7_{lowend,pixel7}_powerup_rabbit_r6`.
5. Evidence I will accept next round is a capture at in-play size with no magnification (a 1:1 crop is fine), in color and in grayscale. Magnified sheets alone are not enough.

Optional, Low: make the fist knuckle ticks one pixel taller. This is not required.

The X and circle are owner and security decisions already made, and I judged only their legibility. Both read clearly, and nothing here reopens C7.

## (2) Menu spacing and title fit (M3.1)

- **8 dp gaps: PASS.** Title, Pause and Settings on low-end show 16 px (8 dp) between rows at 2x. Every button is about 96 px (48 dp) tall. Nothing is clipped.
- **Confirm/Cancel: PASS.** The gap is 16 px (8 dp) at both font scales, and the two buttons are side by side with a clear break. The warning text wraps to two lines, with the box border and text readable.
- **Font scale 2.0: PASS.** The pause menu, settings, confirm and title all fit on the low-end window with no scroll. The "PAUSED" heading sits close to the dimmed formation, but it is legible and not interactive.
- **Title, line height 1.2: PASS.** The 0.4 dp of spare room at font 2.0 (title 24.4-327.6 dp inside the 24-328 band) is not clipped in the capture. Risk: that margin is effectively zero, so any change to font metrics, padding or the OEM font would push the last button off the screen. The 2.5 dp at the A13 bound (code-review-round18 L5) is acceptable. Keep `text-scale-fit.spec.ts` as a guard and do not trade away more title height.

## (3) Other things a player could trip on

- **[Low] Settings, font 2.0:** "Swap controls: Off" is wider (about 488 px) than "Privacy policy" and "Close" (about 440 px). The sizes are inconsistent but nothing is misaligned and the targets are bigger. Optional fix: use one fixed width for the settings buttons.
- **[Low] In-play token size:** a 13 dp token is small to catch or to read on the move. This is the spec's size (24 px) and I am not raising it, but it is why finding (1) matters. If the rabbit fix is rejected, scaling the token glyph (not the ring) up is the fallback.
- **Long-press (O5):** no context menu or selection is visible in `lowend_O5_longpress_menu_button_r6.png`. PASS.
- No new clipping, cutout or back-button issues are visible in these captures.

## Gate

FAIL on item (1) only. Route to mobile-junior-developer for the rabbit drawing change, then code review (both website and Android), tests and a recapture, then a short round 7 that only checks the rabbit crop at in-play size. Items (2) and (3) need no further work.
