# Design Review Round 5: Ruling on V2-M3 (multiplier glyph)

**Result: FAIL (V2-M3, ruling (a): change the shared glyph).** Everything else is unchanged from round 4 (PASS).

**Author:** mobile-ui-ux-designer. **Date:** 2026-09-29.
**Inputs:** `docs/mobile/security/review-v2.md` V2-M3 and C7; `src/render/shapes.ts` `drawPowerUp` (ring at lines 290-296, `PERMANENT_MULTIPLIER` "x" at 332-339); PRD-mobile M9.6 item 3; round 3/4 (which checked only enemies and boss for X iconography).

## Finding
[Power-up token, PERMANENT_MULTIPLIER] - M9.6 item 3 / Match with real world (IP) - Two crossing diagonal strokes centered in a circle is the basic X-Men emblem construction. The ring is shared by all four tokens, so the "x" is the only thing that decides the read. The product was already renamed once for X-Men adjacency (Sentinels). Hairline weight and small size are not a defensible basis: the token is enlarged in screenshots, and Play reviewers and rights-holders judge the shape, not the pixel size. - Change the glyph.

## Alternatives considered
- (b) Rule "not an emblem as drawn" and keep it out of store art. Rejected. The token still ships in the app and in the website, so the risk stays live where a reviewer will see it. It also cripples the storyline: screenshot 4 exists to show power-ups, and the multiplier is the one with the permanent HUD readout (F7 AC10/11). Cost of (a) is one small shared draw branch plus re-capture; cost of (b) is a permanent asset restriction plus residual risk.
- "+" in the ring. Rejected: reads as a health/heal pickup, which misleads (Match with real world).
- Double chevron. Rejected: collides with the HIT_POWER chevron; tokens must stay distinguishable without color.
- Text "x2"/"xN" without the ring. Rejected as primary: N is not fixed (multiplier grows), a text glyph needs font metrics on the low-end profile, and the ring is shared across all four tokens (removing it for one breaks consistency). The HUD readout already carries the number.

## Ruling and required change (for mobile-junior-developer)
Replace only the `PERMANENT_MULTIPLIER` case in `src/render/shapes.ts` (the shared ring stays). Requirements:
1. No two strokes may cross; no diagonal-cross shape of any kind.
2. Recommended glyph: three ascending vertical bars (stair-step, left low to right high), strokes in the same `LEVEL_INTRO_TEXT_COLOR` amber and 2px weight, spanning about +/-0.4 x radius. It reads as "growing" and is distinct from the chevron (HIT_POWER), two horizontal speed lines (SPEED) and the kite (SHIELD). An equivalent non-crossing glyph is acceptable if it stays distinguishable from those three at 24px diameter.
3. Shared art change: it goes through the code review, test and UX gates for BOTH website and Android (CLAUDE.md, One codebase). Update any test or snapshot that asserts the old glyph, and note it in docs/PRD.md addendum (F7 power-up art) and PRD-mobile if the glyph is described.
4. Re-capture power-up screenshots (`m2_7_lowend_powerups_*`) for round 6 evidence. I will confirm distinguishability of all four tokens from those captures in the next review.

## Interim rule until the change lands
Store screenshot 4 and the feature graphic must not show the old "x" token. Capture them only after the new glyph ships (C7 is due before step 15 capture anyway).

## Also resolved
- V2-L6: `store-assets-spec.md` title lockup changed to title case "Shield vs Robots". The `listing-draft-v2.md` description body (line 79) is the marketing analyst's to change; noted, not edited here.

## Gate
Needs a code change: **yes** (small, one draw branch). C7 stays open until the change passes both gates and the round 6 power-up screenshots confirm.
