# Design Review Round 7 (mobile-ui-ux-designer, step 11): rabbit token only

**Result: FAIL** (rabbit, F23 AC6(b), still not nameable at in-play size). Fist, circle and X are not re-judged; round 6 stands for them. Menu spacing and title fit stay PASS from round 6.

**Inputs:** design-review-round6 (finding 1 and its required change), PRD-addendum-v5 F23 AC4.2 and AC6(b), and these harness renders in `docs/mobile/tests/screenshots/`: `f23_tokens_magnified_8x`, `f23_tokens_2x`, `f23_tokens_2x_gray`, `f23_tokens_24px`, `f23_tokens_24px_gray`, `f23_tokens_13px`, `f23_tokens_13px_gray`, `f23_tokens_13dp_at_2x`, `f23_tokens_13dp_at_2x_gray`. Limit: these are harness renders of the shared `drawPowerUp`, not emulator captures. They are good enough for this ruling, because the fault is in the shape, not in the device.

## What changed since round 6

The ears are now two clearly separated, thicker upright bars with a visible gap, and a small round head bump sits at lower left. Items 1 and 2 of round 6's required change were done. The ears now survive at small size as two vertical ticks.

## Would a player who is not told the name call it a rabbit?

| Size | Evidence | Reads as rabbit? |
|---|---|---|
| 8x closeup | Two tall ears on a lumpy body, a round blob at the left, a stepped base. | No, not even here. It reads as a castle, a bell tower or a small animal on a plinth. The body has no head-to-ear connection, so the ears look like two posts. |
| 2x (about 48 px token) and 24 px | A wide blob with two upright ticks on top, and a small bump at the left. | No. A player would say "a cat" or "a little building". "Rabbit" is only reached if told. |
| 13 px and 13 dp at 2x (real in-play size, about 26 px token) | Glyph about 10 px wide. Two vertical ticks above a wide base. In grayscale the same. | No. It reads as the letters "ıl" or "ᴨ" over a base, i.e. a mark, not an animal. |

Ruling: **FAIL at 24 px and FAIL at the real in-play size.** No animal body, no head, no hop posture survives. Only the ears survive, and ears alone do not say "rabbit" (they also say "cat", "fox", "castle" or "pause").

## Is it distinguishable from the fist?

**Yes, marginally.** The fist is a squat flat-topped block with a left nub, no tall features. The rabbit has two tall ticks. At 13 dp the two tokens differ in profile. That meets F11 AC8 (distinct shapes, not color-only). So the token is findable as "the one with two spikes", which has value. But AC6(b) asks for more than distinct: the reviewer must record that the rabbit reads as a rabbit, and it does not. The distinction is also thin. At 13 dp, the fist's knuckle ticks and the rabbit's ear ticks are the same size class, so a hurried player could swap them. This is a catch-rate risk (goal P4), not just cosmetic.

## Can another redraw fix it at this size?

**No, not inside the current bound.** The reason is geometry, not drawing skill:

- The glyph is limited to +-0.45r. At r = 12 that is a box at most about 10.8 px wide and tall in game units, and about 10-11 px physical at 13 dp on a 2x phone. A side-view rabbit needs a head, a long-eared silhouette, a rump, and ideally a leg or tail break. Even good pixel-art rabbit icons need about 16 px to read. The current art spends the whole box and still has no head.
- Making ears bigger just makes the body smaller. Round 6 already pushed this once, and the result got ears but lost the animal.
- F23 AC4.2 also forbids helpful devices: no eye cut-out (AC3(c)), no accessories, and no head-only profile (IP, Playboy). A few of the usual cues that would carry the read at 10 px are off the table.

A third redraw at the same size would be the same trade again. I do not recommend one.

## Required change: pick a size fix, not another redraw

The practical options, in the order I recommend:

1. **(a) Draw the glyph larger inside the ring (recommended, needs no owner reversal).** Raise the glyph bound for the rabbit (and, for consistency, the fist) from +-0.45r to about +-0.65r. The ring's inner edge is at about 0.92r (ring centre line at r, 2 px stroke), so +-0.65r still leaves a visible dark gap of about 2.5 px at r = 12, and about 3 px at 13 dp at 2x. This gives the rabbit a box of about 15-16 px at the real in-play size, about 45% more linear room. Then redraw the rabbit with a clear head, a longer back and 4-leg stance, with ears rising from the head end. This is the "scale the glyph, not the ring" fallback I named in round 6. It changes F23 AC3(d) (the bound) and AC4.2(a) (box 0.6r-0.9r becomes about 0.9r-1.3r wide), so it is a new F23 revision (r5) through both pipelines. It does not need owner approval, since the owner chose a rabbit and the rabbit stays. Do tell him it is a small change.
2. **(a2) Enlarge the whole token (alternative to (a), or in addition).** POWERUP_RADIUS 12 to 16 would give the glyph about 33% more room at the existing 0.45r bound, and a 13 dp token becomes about 17 dp. It also helps the catch rate in play. But it changes the hitbox and the gameplay feel, which F23 puts out of scope and which touches F7 catch rules. That is a bigger decision and affects the website too. Prefer (a) unless the owner wants bigger tokens anyway.
3. **(b) Fall back to "<-->" (the double arrow, r2 AC4.2).** That is the owner's other option, and it is robust at 13 dp. It requires the owner's approval, since he chose the rabbit, and should only be asked of him if (a) also fails its recapture. Please do not ask him yet.

If the owner would rather not see another round at all, (b) is the lowest-risk path for legibility. But (a) has a real chance, so try it first.

## Evidence I will accept in round 8

1. A 1:1, unmagnified crop at the in-play size, in color and grayscale, of all four tokens side by side, at 13 dp on a 2x profile (about 26 px token) and at 24 px. Harness renders are acceptable for the shape check, plus one emulator capture (`m2_7_{lowend,pixel7}_powerup_rabbit`) taken from the new build.
2. The test: ask whether a person shown only that crop, unprimed, would write "rabbit" or "bunny". If I cannot, it is a FAIL again, and the next step is (b), not a fifth redraw.
3. The updated `powerUpGlyphs.test.ts` bound and bounding-box assertions, matching the new F23 revision. The IP checks (AC4.2(d)) still hold: whole body, no head-only profile, no bow tie, no eye cut-out, amber only.

## Other items

- The 13 px and 13 dp harness sheets show the ring at about 2 px of 26 px, and the glyph about 10 px. The ring is not the problem. Do not thicken it.
- No other new findings. Long-press, spacing, cutout and back-button results from round 6 are unchanged.

## Gate

FAIL on the rabbit only. Route: PRD revision (F23 r5, glyph bound and AC4.2 box) via mobile-product-manager, then mobile-junior-developer redraw at the larger bound, code review (both gates), tests, recapture, then a short round 8 that checks only the rabbit crop. If round 8 fails again, ask the owner to approve the "<-->" fallback.
