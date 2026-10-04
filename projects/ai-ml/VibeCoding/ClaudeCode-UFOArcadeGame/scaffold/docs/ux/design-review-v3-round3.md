# UX Design Review v3 round 3: F23 r5 fist and rabbit (website, late review)

**Result: PASS** (conditional on the two limits under "Limits of this review". No required changes.)

Reviewer: ui-ux-designer. Scope: fist and rabbit only, as asked. Builds on `docs/ux/design-review-v3-round1.md` and `docs/ux/design-review-v3-round2.md` (the round 2 pass test and its five required changes). Spec: `docs/PRD-addendum-v5.md` F23 r5 AC3(d), AC4.1, AC4.2, AC6(b).

Evidence viewed: `docs/mobile/tests/screenshots/f23_tokens_24px_gray_r5.png` (first, cold), `f23_tokens_24px_r5.png`, `f23_tokens_magnified_8x_r5.png`. Static renders only, no live falling motion.

## Cold read (written down before I read any icon names)

From `f23_tokens_24px_gray_r5.png`, 1:1, in order left to right:

1. A wide rounded block with a bumpy top edge and a small lump on its left side. A closed hand or a boxing glove.
2. A small animal on four legs with a gap under its belly and two ears standing up at the right end. A rabbit or hare, facing right. Second guess: squirrel.
3. A plain ring.
4. A cross of two diagonal strokes. An "X" or "close" mark.

## Pass test (round 2)

"A reviewer who is not told the type names it 'rabbit' or 'bunny' from the 24 px grayscale crop alone."

**Met.** My unprimed word for token 2 was "rabbit or hare". That is a clear change from round 2, when the same test produced "castle", "dog or cat" and "bird". The squirrel second guess is a mild caveat, not a failure: the ears are the tallest, clearly separate features and they sit on the head end. The 8x render confirms why it reads: a round head at one end, two rounded ears leaning back with a visible gap, a high rump with a small tail bump at the other end, and one notch under the belly between front and hind legs. These are the round 2 required changes 1 to 4, and all are visible.

Checks from AC6(b):
- Every type nameable without colour: yes. Compare the gray crop with the colour crop: nothing relied on hue.
- Rabbit does not read as a "V", castle, crown or cat: yes. It reads as an animal with ears on the head. The tower-on-a-wall effect is gone because the ears are no longer over the middle of the back.
- Fist reads as a fist, not a blob, cloud or paw: yes (see below).
- Circle does not read as a second ring: unchanged from round 1 (clear dark gap). The X still reads as a multiplier or close mark. Round 1 advisories stand and do not block.

## Fist: clear and distinct

Yes. In the 8x render it is a wide block with four rounded knuckle bumps on top and a thumb lump on the left, flat base, no forearm. At 24 px gray the knuckle bumps are faint but the block-with-bumpy-top-and-side-lump silhouette is still what I read as a fist or glove. It is bigger than in round 1 and clearly the widest, squarest, flattest-bottomed shape of the four. It is distinct from the rabbit by silhouette alone: block with top bumps versus animal profile with two tall ears and a belly notch. F11 AC8 "distinct by more than colour" is met. Advisory only: at 24 px the four knuckles can blur into a scalloped top edge. That still reads as a fist, so no change is required.

## Do the larger glyphs crowd the ring?

No. In the 8x render the ring is about 208 px across (centre line radius about 104 px, inner edge about 95 px, roughly 8.6 px per game pixel at r = 12). My estimates from pixel positions:
- Fist: its widest corner points sit about 70 px from centre, leaving a dark gap of about 25 px, or about 2.9 game px.
- Rabbit: the nearest points are the right foot (about 77 px from centre) and the ear tips (about 69 px). The closest gap is about 18 px, or about 2 game px, at the lower-right foot.

Both sit at or above the AC3(d)(iii) floor of 2.0 px. The rabbit is the tighter one, and the glyph sits slightly right of centre (about 0.06r). Neither touches the ring, and in the 24 px colour crop a dark band is visible all the way around both glyphs. The rabbit's foot is the point to watch: if the implementer changes the rabbit any further, keep that foot at least 2 px from the ring. The unit tests in `src/render/powerUpGlyphs.test.ts` should enforce this; I did not re-run them.

## Limits of this review

1. My gap numbers are eyeballed from a raster, not measured. The AC3(d)(iii) formula test is the authority for the 2.0 px floor.
2. I did not review the in-play 13 dp captures or the emulator capture (AC6(b) files 1, 2 and 5). Those belong to the mobile design review (round 8). If that review fails the rabbit at 13 dp, the PRD r5 rule is: no further redraw, and the "<-->" fallback goes to the owner through product-manager. This website PASS does not override that.

## Other findings

None new. Circle (does not say "shield") and X (can read as "close") advisories from round 1 remain non-blocking.

## Gate

Website UX gate for F23 r5 fist and rabbit: **PASS**. No change is needed from code-implementer. Remaining dependency before shipping: mobile design review round 8 (13 dp and emulator evidence) and the r5 IP eye-check by security review (AC4.2(d)). On IP, the silhouette shows a whole-body side view, ears leaning back and no accessories or cut-outs, so I see nothing that looks like the Playboy, Energizer or Duracell rabbits, but the security reviewer owns that call.
