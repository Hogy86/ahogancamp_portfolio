**Result: PASS (Speed token, "<-->" double arrow, on harness renders). Round 9's FAIL on AC6(b) is CLOSED for the glyph; one emulator confirmation is carried to UAT.**

# Design Review Round 10 (mobile-ui-ux-designer, step 11): Speed icon "<-->"

Scope: Speed token only. Circle, X, fist, menus, back button and cutouts are unchanged from rounds 6, 8 and 9. This follows round 9 recommendation A, which the owner chose on 2026-10-05.

**Inputs:** `docs/mobile/tests/screenshots/f23_tokens_{13dp_at_2x_gray,13dp_at_2x,24px,24px_gray,magnified_8x}_r6.png` and design-review-round9. These are harness renders of the shared drawPowerUp code, not emulator captures.

## Step 1. Blind read of the 1:1 grayscale low-end render (written before reading any docs)

| Token | What I saw |
|---|---|
| 1 | Ring with a filled, rounded, flat-based blob with bumps on top. A fist or glove. |
| 2 | Ring with a thin horizontal line with an arrowhead at each end. A left-right double arrow. |
| 3 | Ring containing a smaller open ring. |
| 4 | Ring containing an X. |

My first word for token 2 was "left-right arrow", with no effort. The 24 px color and gray renders say the same. The 8x view shows clean, symmetric heads and a 2 px shaft that stays attached to both heads.

## Step 2. Rulings

| Question | Ruling |
|---|---|
| Readable as a left-right double arrow at in-play size (24 px) | **PASS.** Instant. |
| Same at the low-end size (13 dp at 2x) | **PASS.** The heads are small but still clearly arrowheads. This is the size where the rabbit failed. |
| Distinct from X, circle and fist | **PASS.** A horizontal line with end chevrons shares no silhouette with the diagonal cross, the ring-in-ring, or the filled block. It is distinct in grayscale, so F11 AC8 (not color-only) holds. |
| Does it suggest "speed / move faster", or at least not mislead | **PASS with a caveat.** A double arrow says "horizontal movement / reach". It does not say "fast" the way a rabbit or a lightning bolt would. The HUD pill names the effect after the catch. A first-time player may think "move sideways" or even "reverse controls". This is mild: a pickup that is not read as a threat is the safer failure. Not a blocker. |
| Visual weight next to the filled fist (2 px stroke fixed by spec) | **PASS.** The arrow is clearly lighter than the filled fist but matches the X and circle, which use the same stroke. The fist is the outlier, and it already was. Nothing needs to change. |

## Findings

1. [Speed token / all sizes] — Match with real world — the arrow means "horizontal movement", not "faster" — no code change. Keep the HUD pill text naming the effect. The first-launch "how to play" screen could list the four tokens with names (optional, non-blocking, to mobile-product-manager).
2. [Speed token / UAT] — Verification — these are harness renders; the emulator draw path (device pixel ratio, ring compositing) has not been seen. Required: the UAT emulator captures on low-end and pixel7, suffix `_r6`, show the arrow still reading as a double arrow. If it does not, reopen this round.
3. [Both platforms] — One codebase — the glyph is shared, so the website renders it too. Website gates must see it before either ships (CLAUDE.md "One codebase" rule). Not my gate to close.

## Carried items, not mine to close

- IP check of the new glyph (trivial for a generic arrow) by mobile-security-compliance-reviewer.
- `powerUpGlyphs.test.ts` and `shapes.ts` are modified and uncommitted; mobile-lead-tester must run the suite against the final code.

## Gate

PASS for the Speed icon design. Round 9's FAIL is closed for AC6(b), conditional on finding 2 at UAT. Route onward to step 12.
