# Design Review Round 8 (mobile-ui-ux-designer, step 11): fist and rabbit only

**Result: PASS on the harness renders, CONDITIONAL on the emulator capture (file 5).** The condition is open. The gate is not fully closed until the capture is taken at the next validation run and I confirm it. Circle and X are not re-judged; round 6 stands. Menu spacing, title fit, long-press, back-button and cutout results from round 6 are unchanged.

**Inputs:** design-review-round7 (evidence list and required change (a)), PRD-addendum-v5 F23 r5 AC3(d), AC4.1, AC4.2 and AC6(b). Renders in `docs/mobile/tests/screenshots/`: `f23_tokens_13dp_at_2x_gray_r5`, `f23_tokens_13dp_at_2x_r5`, `f23_tokens_24px_r5`, `f23_tokens_24px_gray_r5`, `f23_tokens_magnified_8x_r5`. Limit: these are harness renders of the shared `drawPowerUp`, not emulator captures.

## Step 1. Blind read (before reading anything that names the icons)

I opened the 1:1 grayscale in-play crop first, with no names. What I wrote down:

1. A round token with a solid, squarish blob with small bumps on top and a nub on the left. A fist.
2. A round token with a busy solid animal shape: a rounded body, a lump at the left, and two upright ears leaning back. A small animal. My first word was "bunny", with "cat" as the second guess.
3. A ring inside the ring. A circle.
4. A thin X. An X, a close or multiply mark.

Judgement: the second token is not a clean, instant "rabbit" at this size, but it is clearly an animal with long ears, and the long, leaning-back ears are what tip it to bunny. That meets the AC6(b) pass test ("would write rabbit or bunny") for me, with less margin than I would like. Color and 24 px renders gave the same read.

## Step 2. Rulings against the three questions

| Question | Evidence | Ruling |
|---|---|---|
| Does the second token read as a rabbit or bunny at in-play size? | 13 dp at 2x (colour and gray): body, head lump, two ears with a visible gap, underside notch. 24 px, colour and gray: same. 8x: a side-view crouching rabbit facing left, rounded ears leaning back, rump, tail bump, one belly notch, no head-only profile, no bow tie, no eye cut-out. | **PASS.** Round 7's failure (two posts on a plinth, "castle", "ıl") is gone. The silhouette is now an animal. |
| Is the enlarged fist still clear and distinct from the rabbit? | Fist: squat block, four rounded knuckles on top, thumb nub at left, flat bottom. Rabbit: no flat top, ears rising, notch below. At 1:1 gray the two outlines differ in profile and in texture (flat block versus ears and legs). | **PASS.** F11 AC8 (non-colour-only) holds. The round 7 swap risk (knuckle ticks versus ear ticks of the same size) is much smaller, because the fist's bumps are now short and rounded and the rabbit's ears are tall and separated. |
| Do the larger filled glyphs crowd the ring? | A dark gap is visible all the way round both filled glyphs at 13 dp, at 24 px and at 8x. Closest approach is at the fist's lower right corner and the rabbit's rump and ear tip, still a clear dark band, about 2 px or more at in-play size. The ring is not touched or merged. | **PASS.** Not crowded. Do not thicken the ring and do not enlarge the glyphs further. |

## Residual risks (not blocking, record for the emulator capture)

1. **Cat / camel misread.** The ears root toward the middle of the back, and the head lump is small, so some players could say "cat" or "squirrel" first. At 8x the ears sit right of the head bump, not directly on it. If the emulator capture reads as a cat to me, I will FAIL it, and the next step is the "<-->" fallback with owner approval, not another redraw (F23 r5 rule, round 7 ruling).
2. **Fist reads as a "cloud" or "paw"?** At 1:1 gray the fist's top bumps are subtle. It reads as a fist because of the thumb nub and flat base. Not a blocker. Watch it on a low-end phone with a smaller dp scale.
3. **Ear gap at 13 dp.** The gap between the two ears is about 1 px at in-play size. It holds in the renders. If the emulator build antialiases it shut, the ears will merge into one wide block and the read will fail.

## Conditions that remain open (required for a full PASS)

1. **Emulator capture owed:** `m2_7_lowend_powerup_rabbit_r5.png` (or `m2_7_pixel7_powerup_rabbit_r5.png`), native resolution, rabbit token on screen during play, from the build that contains F23 r5, taken at the next validation run (F23 AC6(b) file 5). I will re-read it unprimed and confirm "rabbit or bunny" on the real device.
2. `powerUpGlyphs.test.ts` assertions for AC3(d), AC4.1 and AC4.2 pass in that validation run (lead tester to confirm; I did not re-run them).
3. IP check by mobile-security-compliance-reviewer of the redrawn fist and rabbit against AC4.2(d) and addendum 4 section 1.3. My eye check: whole body, side view, not upright, no accessories, no eye cut-out, amber only, ears lean back (not flat), not a leaping pose. That is a UX view, not the security ruling.

## Gate

PASS on the renders for the rabbit and the fist, with the emulator capture as a stated condition. Route: proceed to the next validation run, take the capture, send it back for a short confirmation. If the capture fails, request owner approval for the "<-->" fallback (PRD-addendum-v5 AC5).
