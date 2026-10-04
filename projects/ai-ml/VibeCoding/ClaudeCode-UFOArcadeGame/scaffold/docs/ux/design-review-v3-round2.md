# UX Design Review v3 round 2: F23 rabbit glyph re-review (website, late review)

**Result: FAIL** (the rabbit still fails the pass test from round 1 and AC6(b). Fist, circle and X were passed in round 1 and are unchanged in the new captures.)

Reviewer: ui-ux-designer. Scope: rabbit icon only, as asked. Builds on `docs/ux/design-review-v3-round1.md` (Finding 1 and its pass test). Spec: `docs/PRD-addendum-v5.md` F23 AC4.2, AC6(b).

Evidence viewed: `docs/mobile/tests/screenshots/f23_tokens_24px.png`, `f23_tokens_24px_gray.png`, `f23_tokens_2x.png`, `f23_tokens_2x_gray.png`, `f23_tokens_magnified_8x.png`. Limit: static renders only, no live falling motion.

## Pass test (from round 1)

"A reviewer who is not told the type names it 'rabbit' or 'bunny' from `f23_tokens_24px_gray.png` alone."

**Result: not met.** Seen cold at 24 px gray, the second token is a small white cluster with two vertical spikes in the middle and a lump on the left. My honest first reads were "castle or crown", "a small dog or cat standing", and "a bird". I would not have said "rabbit" without being told. Fist, circle and X are each nameable at the same size, so the rabbit is the one that fails.

Distinct from the fist? **Yes.** The fist is a wide flat block, and the rabbit is a spiky, uneven silhouette. F11 AC8 "distinct by more than color" is still met. The failure is identity, not distinctness, the same as round 1.

## What improved since round 1

- The ears are thicker and taller. They are now clearly the tallest feature and no longer hairlines. The 8x render shows two upright ears with a clear gap.
- There is now a head bump on the left, a notch under the body, and a tail-side lump. At 8x these parts are visible.

## Why it still fails

[Power-up token, Speed, 24 px and 2x] — Match between system and real world / recognition over recall — Three problems, all visible in the 8x capture:

1. **The ears sit over the middle of the body, not over the head.** They rise from about the center of the silhouette. The head bump is a low lump to the left, well away from them. Ears at mid-back plus a small side lump reads as a standing dog or cat, or as two towers on a wall. A rabbit is recognized by ears attached to a head. This is the main cause.
2. **The ears are parallel, straight and blunt.** They look like two chimney stacks or castle turrets. Rabbit ears in side view lean back (up and back, per AC4.2(b)) and have a rounded tip. These are vertical and flat-topped.
3. **The body has no hop or crouch profile.** The underside is a nearly flat loaf with a single notch. There is no high rump sloping down to a lower head, so the whole thing reads as a block with spikes.

At 24 px the little head lump and the notch drop to 1-2 px and vanish, so only the "two spikes on a block" shape survives.

## Is drawing the glyph larger inside the ring needed?

**No, and it would not help.** In the 8x capture the ring is about 205 px across (r about 103 px) and the rabbit spans roughly 90 px wide by 85 px tall. That is about 0.85r wide and 0.8r tall, already near the top of the AC4.2(a) box (0.6r to 0.9r) and close to the AC3(d) +/-0.45r bound (0.9r total). There is almost no room to scale up. Enlarging a mis-composed shape also does not fix it. Fix the composition, not the size. Use the full allowed box (about 0.85r to 0.9r wide) and place the mass sensibly.

## Required change to the drawing (inside AC4.2 and AC3(d); a designer may tune proportions under AC5, no PRD revision)

Values at r = 12.

1. **Move the ears onto the head.** Put the head at one end (left, say) and attach both ears to the top of the head, at the head end of the box. Both ears must be in the head half, so the head, not the back, is the highest region. The body behind the head should be visibly lower than the ear tips.
2. **Make the head a round lump larger than now**, about 0.25r to 0.3r across, with a clear neck dip between head and shoulders so it reads as a separate head.
3. **Lean the ears back and round the tips.** Tilt each ear 15 to 25 degrees back (away from the nose), width at least 0.2r at the base, tip rounded not flat, gap between ears at least 0.1r (so they do not fuse at 24 px). Ear tips remain the two highest points, prominence at least 0.2r (AC4.2(b)).
4. **Give the body a hopping profile.** High rounded rump at the rear, sloping down to lower shoulders. Add a small round tail bump at the rear. Keep the underside gap between front and hind legs, at least 0.12r wide and 0.12r deep, as an outline notch (no interior hole, AC3(c)).
5. **Keep the width-to-height of the body at least 1.3 to 1** below the ear base (AC4.2(c)) and keep the shape whole body, no accessories (AC4.2(d), IP rule).
6. Re-render the same five captures and re-run the AC4.2, AC1(a) and AC3(d) tests. I will re-review (v3 round 3). Pass test is unchanged: name it "rabbit" or "bunny" from `f23_tokens_24px_gray.png` alone.

## Fallback (needs the owner)

If a second redraw still does not read at 24 px, stop iterating on the silhouette. The fallback already in the PRD is the double arrow "<-->" (r2 AC4.2). That reverses an owner choice, so it goes through product-manager for his approval. I recommend one more drawing attempt first, since the current version is close in parts (ears, thickness) and the problem is mostly placement.

## Other findings

None new. The advisory notes on the circle (does not say "shield") and the X (can read as "close") from round 1 stand, and are not blocking.

## Required before this gate can PASS

1. code-implementer redraws the rabbit branch of `drawPowerUp` in `src/render/shapes.ts` per the five points above.
2. New five captures and the unit tests re-run.
3. ui-ux-designer re-reviews (v3 round 3).
