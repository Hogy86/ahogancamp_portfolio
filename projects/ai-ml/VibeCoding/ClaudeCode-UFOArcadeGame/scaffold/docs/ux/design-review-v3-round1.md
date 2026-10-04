# UX Design Review v3 round 1: F23 power-up glyphs (website, late review)

**Result: FAIL** (one glyph, the rabbit, fails AC6(b) "can be named at 24 px without color". The other three pass.)

Reviewer: ui-ux-designer. Scope: legibility only. The X and circle shapes are owner decisions (PRD-addendum-v5 r3) and are not challenged. Spec: `docs/PRD-addendum-v5.md` F23 AC4, AC6(b).

Evidence viewed (renders of the shared `drawPowerUp`, in `docs/mobile/tests/screenshots/`): `f23_tokens_24px.png`, `f23_tokens_24px_gray.png`, `f23_tokens_2x.png`, `f23_tokens_2x_gray.png`, `f23_tokens_magnified_8x.png`. Limit: I judged from these renders, not from live play, so falling motion is not assessed.

Note on color: every token is the same amber on the same dark disc, so color never separates the four. Grayscale therefore changes little. Amber to gray lowers the glyph-to-disc contrast a bit, but I saw no case where a glyph that was readable in color became unreadable in gray. Conclusions below hold for both.

## Per-glyph ruling

| Glyph (type) | Tell apart from the other three? | Nameable at 24 px (color / gray)? | Guess the effect? | Verdict |
|---|---|---|---|---|
| Fist (Hit Power) | Yes. Wide flat-bottomed block with a bumpy top edge. | Yes / yes. At 1x it reads as a fist or glove. At 8x the four knuckles and thumb are clear. | Yes. Fist means punch, strength. | PASS |
| Rabbit (Speed) | Yes, by silhouette (spiky, left-heavy, not a block). | **No / no.** At 24 px it is a lumpy blob with two 1 px ticks on one side. It reads as a bird, mouse, duck or ink blot, not reliably a rabbit. | Only if the player already sees a rabbit. Rabbit means fast is a good metaphor, but it is lost when the shape is not recognized. | **FAIL** |
| Circle (Shield) | Yes. The only unfilled round shape. | Yes (as a circle) / yes. Reads as a ring, "O", or target, which AC6(b) lists as a risk. | Weak. A small circle inside a ring does not say "shield" to a first-time player. | PASS on legibility. Note below. |
| X (Multiplier) | Yes. The only crossing strokes. | Yes / yes. Reads as an X or times sign. | Good: it matches the "×" in the HUD readout "Power ×N". | PASS |

All four can be told apart from one another by silhouette alone in color and grayscale, so F11 AC8 "distinct by more than color" is met. The failure is the rabbit's identity, not its distinctness.

## Finding 1 (FAIL): rabbit not recognizable at 24 px

[Power-up token, Speed, 24 px and 2x] — Match between system and real world / recognition over recall — The 8x render shows the problem. The ears are very thin tapered spikes (about 0.1r wide at the base, roughly 1 px at r = 12) that lean back. The body is a long horizontal lump with a flat base and no legs, tail or head shape. Only the ear spikes say "rabbit", and at 24 px they shrink to hairlines that anti-alias into the disc. The 24 px and gray renders show a blob with two small spikes. A new player cannot name it, and the Speed-to-rabbit link is lost.

Required change to the drawing (stay inside the AC3(d) +/-0.45r bound and AC4.2 ranges; all values at r = 12):
1. Thicken and lengthen the ears. Each ear at least 0.2r (about 2.5 px) wide at its base and tapering no thinner than about 0.1r at the tip. Raise ear height so the two ears are the tallest feature by a clear margin (prominence 0.3r or more, up from the AC4.2(b) floor of 0.2r). Keep them upright, with the gap between them at least 0.1r so they stay two ears and do not fuse at 24 px.
2. Give the head a distinct shape. Add a clear neck notch between head and body, or make the head a rounder lump that is visibly separate from the haunch. The current head is only a bump at the end of the body.
3. Give the body a rabbit profile. Make it a rounded haunch (high rump, lower shoulders) with a small tail bump at the rear. Cut one visible gap between the front and hind legs on the underside, at least 0.12r wide and 0.12r deep, so it reads as a crouched or hopping animal rather than a loaf. This is an outline notch, not an interior cut-out, so AC3(c) (no holes) still holds.
4. Re-render the same five captures after the change and re-review. Pass test: a reviewer who is not told the type names it "rabbit" or "bunny" from `f23_tokens_24px_gray.png` alone.

If the shape cannot be made to read inside the 24 px budget, the fallback is already in the PRD (r2 AC4.2, the "<-->" double arrow), but that reverses an owner choice and needs his approval via product-manager. Try the drawing fix first.

## Finding 2 (advisory, not blocking): circle does not say "shield"

[Power-up token, Shield] — Match between system and real world — A hollow circle in a ring is clear as a shape and not mistaken for the ring (the gap holds). It does not convey "protection". First-time players will learn it by catching it, and the HUD or on-catch feedback (F7 AC10) names the effect, so this is acceptable. No drawing change requested. The shape is the owner's decision and review-v2 addendum 4 binds its limits.

## Finding 3 (advisory, not blocking): X can read as "close" or "bad"

[Power-up token, Multiplier] — Consistency with platform conventions / error prevention — An X is the common symbol for cancel, close or "wrong". A falling X could make some players avoid a beneficial permanent power-up. The "×" in the HUD readout helps after the first catch. No drawing change requested (owner-accepted risk and shape). Suggest UAT confirm that first-time players still catch the X token. If they avoid it, tell product-manager.

## Accessibility notes

- Not color-only (NFR-9(a)): met in principle. Silhouettes differ, with the rabbit caveat above.
- Contrast: amber `#ffd873` on the dark disc is high contrast. The grayscale render keeps it.
- Fist and circle and X need no change. The fist is wide and flat-bottomed, which keeps it from reading as a cloud or paw at 24 px.
- Gap: `f23_tokens_2x*.png` was viewed at 2x but not at a real small-screen viewport. Round 2 of the Android review owns the phone-scale captures.

## Required before this gate can PASS

1. code-implementer redraws the rabbit branch per Finding 1 (tuned inside AC4.2; no PRD revision needed per AC5, "a designer may tune proportions inside the AC4 ranges").
2. New captures (24 px color, 24 px gray, 2x, 2x gray, 8x) and the AC4.2 / AC1(a) / AC3(d) unit tests re-run.
3. ui-ux-designer re-reviews the new captures (v3 round 2).
