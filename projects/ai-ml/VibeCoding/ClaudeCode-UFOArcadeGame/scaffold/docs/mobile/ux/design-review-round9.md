# Design Review Round 9 (mobile-ui-ux-designer, step 11): emulator captures for the rabbit and fist

**Result: FAIL on the low-end profile for the rabbit (AC6(b)). PASS on the pixel7 profile. Round 8 condition 1 is therefore NOT closed. Q-v5-2 (the "<-->" fallback) must now go to the owner.**

Circle and X are not re-judged beyond a glance; round 6 stands. Menu spacing, title fit, long-press, back-button and cutout results from rounds 6 and 8 are unchanged.

**Inputs:** design-review-round8 (the condition and the rule: if the real capture does not read as a rabbit, FAIL and go to the owner for "<-->", not another redraw), validation-report-round7 Part 3, PRD-addendum-v5 F23 r5 AC6(b). Files in `docs/mobile/tests/screenshots/`: `m2_7_{lowend,pixel7}_powerup_{rabbit,fist}_crop_gray_r5.png` and `_crop_r5.png`, and the full in-play `m2_7_{lowend,pixel7}_powerup_{fist,rabbit,circle,X}_r5.png`. I opened the four grayscale crops before reading anything that names the icons.

## Step 1. Blind read of the 1:1 grayscale crops (written before reading the docs)

The crops are tiny (about 40 px square on low-end, about 70 px square on pixel7). The glyph area is the inside of the ring.

| File | What I saw |
|---|---|
| lowend rabbit gray | A ring with a small white blob inside, wider than tall, with a notch or gap at the lower left and a few small ticks or spikes on the upper right. It looks like a squiggle, a small bird or a flame. I cannot count two ears. My first word was not "rabbit". |
| lowend fist gray | A ring with a chunky, squarish white block, flat base, a few small bumps along the top. It looks like a fist or a glove. |
| pixel7 rabbit gray | A ring with a rounded body low and to the left, a lump at the left, and two upright ears leaning to the right and back, with a notch underneath. An animal. My first word was "bunny". |
| pixel7 fist gray | A ring with a flat-bottomed block with vertical divisions along the top (four knuckles) and a small nub at the left. A fist. |

## Step 2. Colour crops and in-play screenshots

- **pixel7 in play (2000x900 screenshot, token about 35 px across):** the amber ring with the filled glyph reads as a small animal, bunny-like, without effort once I look at it. The fist token is a block with fingers. Both are distinct from each other, from the open circle (ring in ring) and from the thin X.
- **low-end in play (1280x720 screenshot, token about 26 px across):** the rabbit token is a dark amber blob with a tail of ticks on the right. It reads as a squiggle or flame. I do not see two separate ears. The fist token on the same profile is a tight yellow block that reads as a fist or a paw, mostly because of the flat base. The circle and X are clean on both profiles.
- The HUD pill (for example "5x Hit 7.6s" in the low-end rabbit capture) names the effect after the catch, so the player is told what they got. That limits the damage of a misread, but AC6(b) is about reading the token before the catch.

## Step 3. Rulings against the round 8 questions

| Question | Profile | Ruling |
|---|---|---|
| Does the rabbit read as a rabbit or bunny at in-play size? | pixel7 | **PASS.** Body, head lump and two ears are visible and the ears do not merge. "Bunny" was my first word. |
| Same | low-end 640x360 class | **FAIL.** The rabbit is about 15 px wide. The ears have merged into the body outline and into each other (round 8 residual risk 3 happened: the 1 px gap does not survive at this size). Unprimed, I would not write "rabbit" or "bunny". This does not meet AC6(b) here. |
| Do the ears merge? | pixel7 / low-end | pixel7: no. low-end: yes, effectively. |
| Is the rabbit distinct from the fist? | both | **PASS** on both. Fist is a flat-based block, rabbit is an uneven shape with a notch. On low-end the distinction is "block versus squiggle", not "fist versus rabbit", so it is distinct without being understood. F11 AC8 (non-colour-only) holds. |
| Is the fist still legible? | both | **PASS.** Reads as a fist on pixel7. On low-end it reads as a fist or glove, borderline but acceptable. Not a blocker. |

## Why this goes to the owner and not back for a redraw

Round 7 ruled, and round 8 repeated, that this glyph has had its redraws (castle posts, then this silhouette). A 15 px glyph does not have the pixels for two ears, a head and a body. Another redraw would be the same fight. Per the F23 r5 rule, the next step is the fallback decision, and PRD-addendum-v5 AC5 requires the owner's approval for it.

## Required before the gate closes

1. **Owner decision (Q-v5-2), relayed by mobile-product-manager.** Options, with my recommendation first:
   - **A (recommended): approve the "<-->" fallback glyph** for the rabbit token (same token, same colour, same ring). It is a symbol that survives at 15 px and is about speed/reach, not an animal. One codebase, so it applies to the website too; confirm that is acceptable to the website gates.
   - **B: enlarge the token on small-dp screens** (a floor, for example a minimum token diameter in dp, so the glyph has at least about 24 px inside the ring on the low-end profile). This reverses my round 8 "do not enlarge further" for the low-end only, and it changes hitbox and play feel. It needs a game-design call and both-platform gates. I would only choose it if the owner wants to keep the rabbit.
   - **C: accept the risk** (rabbit stays, may be misread on small low-density phones; the HUD pill names the effect on catch). This is a conscious owner decision under the same pattern as the C7 X risk and should be recorded the same way.
2. If A or B is chosen: new emulator captures on low-end and pixel7 (same file naming, suffix `_r6`), read unprimed by me, then a short round 10 confirmation.
3. If C is chosen: the owner's acceptance is recorded in PRD-addendum-v5 and docs/mobile/PRD-mobile.md, and I will mark the low-end rabbit as an owner-accepted FAIL on AC6(b). I will not re-open it.
4. Carried from round 8, still open and not mine to close: `powerUpGlyphs.test.ts` assertions passed in round 7 (validation-report-round7 says the suite passed 657 of 657, which covers this), and the IP check of the redrawn fist and rabbit by mobile-security-compliance-reviewer. If the glyph is replaced with "<-->", the IP check becomes trivial.

## Non-blocking notes

- The validation report's own statement ("rabbit is a blob about 15 px wide with two thin back-leaning ears") matches what I see, except that I cannot see two ears on the low-end capture.
- Pixel7 is the more typical phone class, so the shipped experience is acceptable for most players. The weak case is real, and the AC was written to cover it.

## Gate

FAIL for the rabbit on the low-end profile (AC6(b)). Route: mobile-product-manager to the owner with options A, B and C above; no code work until the owner answers. The gate does not close until that answer is recorded.
