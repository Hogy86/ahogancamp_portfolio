# Store Assets Spec — Shield vs Robots (Android)

**Author:** mobile-ui-ux-designer subagent
**Stage:** Mobile Pipeline Step 3 (companion to `design-review-round1.md`)
**Date:** 2026-09-25 (original); revised 2026-09-28 (see Revision history)
**Grounds for every asset below:** `docs/mobile/market/listing-draft-v2.md` §5
(screenshot storyline), `docs/mobile/PRD-mobile.md` v1.7 M9 (icon/splash,
including the Marvel-avoidance rules in M9.6) and M12.4 (screenshot
requirements), `docs/PRD.md`/`docs/PRD-addendum-v2.md` F13/F14 (ShieldMan:
humanoid, blue-and-white, plain avatar-blue circular shield — no
red-white-blue star, no concentric-ring shield), `docs/PRD-addendum-v4.md` F22
(rename), F17 (enemy tiers/boss color), NFR-10 (no licensed likeness anywhere
in these assets).

This spec defines composition and constraints only; it does not produce the
artwork itself.

## Revision history

| Date | Change | Source |
|---|---|---|
| 2026-09-25 | Original spec, written under the pre-rename product name "Vanguard vs. Sentinels", hero "Vanguard", enemies "Sentinels", grounded in `listing-draft.md` (v1). | Mobile Pipeline Step 3 |
| 2026-09-28 | Rename applied to all live text: product "Shield vs Robots", hero "ShieldMan", enemies "robots". Title lockup changed from "VANGUARD VS. SENTINELS" to "SHIELD VS ROBOTS". Listing reference moved from `listing-draft.md` (v1, kept unmodified as history) to `listing-draft-v2.md`. Palette label "Vanguard blue/white" renamed "ShieldMan blue/white"; hex values unchanged. Marvel-avoidance (M9.6) added to the grounding and the cross-cutting constraints. No composition, dimension, or layer decisions changed. | `docs/PRD-addendum-v4.md` F22; `docs/mobile/PRD-mobile.md` v1.7 |

Open item carried from the listing: OQ-M15 (owner decision on the hero name
"ShieldMan" and its Captain-America adjacency, `listing-draft-v2.md` §6). This
spec uses "ShieldMan" pending that decision. If the hero name changes, only
the hero-name occurrences below change; every dimension, layer, and
composition rule is unaffected.

---

## 1. Adaptive app icon

Android adaptive icons are two independent layers (plus an optional
monochrome layer) that the launcher composites and crops (circle, squircle,
rounded square, etc. depending on the device/launcher).

- **Canvas:** 108×108 dp per layer; only the inner **66×66 dp safe zone**
  (centered) is guaranteed visible under every mask shape — nothing
  load-bearing outside it.
- **Foreground layer:** ShieldMan's shield alone (the plain avatar-blue
  (`#2f6fed`) circle, per F14 AC2 — not the full character), centered in the
  66 dp safe zone, filling ~70% of it. A shield-only mark reads clearly at
  launcher size (48 dp) where a full humanoid figure would collapse into an
  unreadable blob — recognizability at 48 dp is a hard requirement (PRD
  M9.2).
- **Background layer:** solid `#05050a` (the game's own background color,
  matching the splash screen per M9.4) — flat color only, no gradient or
  texture that could interact unpredictably with mask cropping.
- **Monochrome layer (Android 13+ themed icons):** the same shield silhouette
  as the foreground, single-color, alpha-masked, so Android's Material You
  themed-icon tinting renders a legible shield in any system accent color.
- **Constraint check against F13/F14/NFR-10/M9.6:** shield is a plain circle,
  no concentric rings, no star, no color outside the established ShieldMan
  blue — verify against the exact hex before export. No text on the icon.

## 2. 512×512 Play Store listing icon

- Full 512×512 px, no transparency (Play flattens it onto its own background),
  PNG or 32-bit PNG without alpha.
- Composition: the same foreground shield mark and background color as the
  adaptive icon, but composited as a single flat square (not mask-dependent)
  since this is the icon shown in Play search/listing, not the launcher.
  Keep the shield centered with roughly the same padding ratio as the 66 dp
  adaptive safe zone (don't bleed it to the edges) so the two icons read as
  the same mark at different sizes.

## 3. 1024×500 feature graphic

Displayed at the top of the Play Store listing page; not shown on all
surfaces, but required for the listing.

- **Composition:** landscape, matching the game's own orientation.
  Left-to-center: a cropped in-game action moment (ShieldMan mid-throw, shield
  bouncing off a robot row, formation partially visible) — real render,
  not concept art, to stay consistent with M12.4's "captured from the real
  Android build" rule for screenshots (same standard applies here for
  consistency, even though Play doesn't mandate it for the feature graphic).
  Right side or bottom band: the title lockup "SHIELD VS ROBOTS" (matching
  the store title "Shield vs Robots"; never truncated to "SHIELD" alone, per
  `listing-draft-v2.md` §1) in a clean sans-serif matching the in-game HUD
  font stack (system-ui, per `src/style.css`'s `system-ui-fallback` — no
  licensed/hosted webfont, per ADR-0004), set against the `#05050a`
  background color for continuity with icon/splash. Do not style the lockup
  as "S.H.I.E.L.D." or add a "-Man" superhero-movie-style tagline
  (`listing-draft-v2.md` §4 exclusions).
- **Do not** include store badges, "Free," "No Ads," or any call-to-action
  text baked into the image — Play overlays its own install UI over parts of
  this graphic on some surfaces, and text near those regions gets obscured.
- No licensed IP, no red-white-blue star motif, no concentric-ring shield
  (NFR-10 / F9 AC4 / M9.6) — the feature graphic is the single most-viewed
  asset on the listing page, so this constraint matters most here.

## 4. Screenshots (phone — required; tablet — optional per OQ-M7 (a))

Captured from the real Android build (M12.4) in **landscape orientation**
(the game's only supported orientation — Play displays landscape screenshots
correctly; do not letterbox or rotate them to portrait canvas). Minimum 2
required by Play; produce all 6 from `listing-draft-v2.md` §5's storyline
since the draft's ordering rationale (leads with action, saves the boss for
slot 3) is specifically tuned to Play's "most users don't scroll past
screenshot 3" behavior.

For each shot below: **device** = capture on the mid-range reference profile
(`docs/mobile/tests/device-matrix.md`, once written) at native resolution,
not a stretched emulator window, so touch buttons render at real scale — a
screenshot with tiny or clipped touch controls would visually contradict this
review's own F2/F3 findings before a real player ever sees the app.

1. **Core gameplay, mid-action.** ShieldMan mid-throw, shield bouncing off a
   robot row, ◀▶/THROW touch controls visible in-frame (this is the one
   screenshot where showing the touch controls matters most — it's the first
   thing a Play browser sees and M12.4 requires touch controls to be shown).
   Caption: "Every throw bounces." Art note: ShieldMan's costume must not be
   posed or colored to evoke a patriotic/star-spangled look.
2. **Difficulty escalation.** A dense, high-level formation (darker-gray
   tougher robots per F17), HUD clearly showing a high level number (e.g.
   "LEVEL 7"), legible at Play's thumbnail size. Caption: "10 levels. Every
   one harder."
3. **Boss fight.** The 5×-scale boss (F12/F17) filling most of the frame,
   ShieldMan visible at normal scale for size contrast. Caption: "Boss fight
   every 5 levels."
4. **Power-up catch moment.** A falling power-up icon mid-catch, HUD showing
   the active-effect indicator and permanent-multiplier readout (F7 AC10/11).
   Caption: "Catch it. Use it."
5. **Pause menu.** The pause overlay (Resume / Restart Level / Restart Game /
   Quit) with the PAUSE button visible in the corner it's actually rendered
   in. Caption: **"Leave the app mid-level and it pauses automatically — tap
   Resume and carry on."** (Per PRD M12.2 — do not use the original v1
   draft's "your progress is never lost mid-level" wording; a process-death
   background kill does lose the run per M4.6, and this caption is exactly
   the kind of body-copy claim that must not silently drift back to the
   overpromise the PRD already flagged and fixed. `listing-draft-v2.md` §5
   uses the shorter "Pause anytime. Tap Resume and carry on."; either is
   acceptable, the longer form is the stricter of the two.)
6. **Victory / Game Complete.** The fireworks celebration screen with a
   visible final score (F10) and, once OQ-M8's shared PRD amendment lands, the
   "Best: N" / "New best!" readout (M7.1) if implemented by the time
   screenshots are captured — otherwise omit the best-score element rather
   than show a feature that doesn't exist yet in the build being screenshotted
   (M12.4: "depict only features that exist"). Caption: "Beat all 10. See it
   through."

### Tablet screenshots (optional, per OQ-M7 (a))
If produced: one gameplay shot (storyline slot 1 equivalent) captured on the
10" tablet reference profile, showing the game filling the larger screen per
M2.8 with controls per M2.4/N2 (this review's tablet-scale-floor
recommendation) — include only if the tablet layout has been verified against
N2 in `design-review-round1.md`; do not screenshot a tablet layout that hasn't
passed that check, since a screenshot showing clipped or oversized controls
would undercut the exact complaint pattern (`play-store-research.md` §1) this
whole spec exists to avoid.

---

## 5. Cross-cutting constraints (apply to every asset above)

- No third-party IP (PRD-mobile M9.6, NFR-10, F9 AC4,
  `play-store-research.md` §4 and §6): no Marvel, Captain America, Ultron,
  Avengers, X-Men or "Sentinels" terms or visual motifs, no "S.H.I.E.L.D."
  styling, no "patriot"/"captain"/"star-spangled"/"America(n)" wording, no
  red-white-blue concentric-star shield, no licensed likeness anywhere.
- Names in every asset are exactly: product "Shield vs Robots", hero
  "ShieldMan", enemies "robots" (plain noun). The old pre-rename names
  appear only in the Revision history above.
- Color palette drawn only from the confirmed game palette: ShieldMan blue
  `#2f6fed`, ShieldMan white `#f4f6fb`, background `#05050a`, enemy
  toughness grays, boss `#242428`/`#8a8a94`, accent amber `#ffd873` — no new
  brand colors invented for store assets alone.
- No screenshot or graphic may depict a feature not yet implemented in the
  build it's captured from (M12.4) — re-capture screenshots after any UI
  change that affects HUD layout, control placement, or wording (including
  the rename itself, since in-game text and title screen now read "Shield vs
  Robots", and after this review's F2/F3 fixes, which directly change where
  the on-screen controls sit).
