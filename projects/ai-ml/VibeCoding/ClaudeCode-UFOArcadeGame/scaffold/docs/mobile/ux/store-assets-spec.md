# Store Assets Spec — Vanguard vs. Sentinels (Android)

**Author:** mobile-ui-ux-designer subagent
**Stage:** Mobile Pipeline Step 3 (companion to `design-review-round1.md`)
**Date:** 2026-09-25
**Grounds for every asset below:** `docs/mobile/market/listing-draft.md` §5
(screenshot storyline), `docs/mobile/PRD-mobile.md` M9 (icon/splash) and M12.4
(screenshot requirements), `docs/PRD.md`/`docs/PRD-addendum-v2.md` F13/F14
(Vanguard: humanoid, blue-and-white, plain avatar-blue circular shield — no
red-white-blue star, no concentric-ring shield), F17 (enemy tiers/boss color),
NFR-10 (no licensed likeness anywhere in these assets).

This spec defines composition and constraints only; it does not produce the
artwork itself.

---

## 1. Adaptive app icon

Android adaptive icons are two independent layers (plus an optional
monochrome layer) that the launcher composites and crops (circle, squircle,
rounded square, etc. depending on the device/launcher).

- **Canvas:** 108×108 dp per layer; only the inner **66×66 dp safe zone**
  (centered) is guaranteed visible under every mask shape — nothing
  load-bearing outside it.
- **Foreground layer:** Vanguard's shield alone (the plain avatar-blue
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
- **Constraint check against F13/F14/NFR-10:** shield is a plain circle, no
  concentric rings, no star, no color outside the established Vanguard blue —
  verify against the exact hex before export.

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
  Left-to-center: a cropped in-game action moment (Vanguard mid-throw, shield
  bouncing off a Sentinel row, formation partially visible) — real render,
  not concept art, to stay consistent with M12.4's "captured from the real
  Android build" rule for screenshots (same standard applies here for
  consistency, even though Play doesn't mandate it for the feature graphic).
  Right side or bottom band: the title lockup "VANGUARD VS. SENTINELS" in a
  clean sans-serif matching the in-game HUD font stack (system-ui, per
  `src/style.css`'s `system-ui-fallback` — no licensed/hosted webfont, per
  ADR-0004), set against the `#05050a` background color for continuity with
  icon/splash.
- **Do not** include store badges, "Free," "No Ads," or any call-to-action
  text baked into the image — Play overlays its own install UI over parts of
  this graphic on some surfaces, and text near those regions gets obscured.
- No licensed IP, no red-white-blue star motif, no concentric-ring shield
  (NFR-10 / F9 AC4) — the feature graphic is the single most-viewed asset on
  the listing page, so this constraint matters most here.

## 4. Screenshots (phone — required; tablet — optional per OQ-M7 (a))

Captured from the real Android build (M12.4) in **landscape orientation**
(the game's only supported orientation — Play displays landscape screenshots
correctly; do not letterbox or rotate them to portrait canvas). Minimum 2
required by Play; produce all 6 from `listing-draft.md` §5's storyline since
the draft's ordering rationale (leads with action, saves the boss for slot 3)
is specifically tuned to Play's "most users don't scroll past screenshot 3"
behavior.

For each shot below: **device** = capture on the mid-range reference profile
(`docs/mobile/tests/device-matrix.md`, once written) at native resolution,
not a stretched emulator window, so touch buttons render at real scale — a
screenshot with tiny or clipped touch controls would visually contradict this
review's own F2/F3 findings before a real player ever sees the app.

1. **Core gameplay, mid-action.** Vanguard mid-throw, shield bouncing off a
   Sentinel row, ◀▶/THROW touch controls visible in-frame (this is the one
   screenshot where showing the touch controls matters most — it's the first
   thing a Play browser sees and M12.4 requires touch controls to be shown).
   Caption: "Every throw bounces."
2. **Difficulty escalation.** A dense, high-level formation (darker-gray
   tougher Sentinels per F17), HUD clearly showing a high level number (e.g.
   "LEVEL 7"), legible at Play's thumbnail size. Caption: "10 levels. Every
   one harder."
3. **Boss fight.** The 5×-scale boss (F12/F17) filling most of the frame,
   Vanguard visible at normal scale for size contrast. Caption: "Boss fight
   every 5 levels."
4. **Power-up catch moment.** A falling power-up icon mid-catch, HUD showing
   the active-effect indicator and permanent-multiplier readout (F7 AC10/11).
   Caption: "Catch it. Use it."
5. **Pause menu.** The pause overlay (Resume / Restart Level / Restart Game /
   Quit) with the PAUSE button visible in the corner it's actually rendered
   in. Caption: **"Leave the app mid-level and it pauses automatically — tap
   Resume and carry on."** (Corrected per PRD M12.2 — do not use the original
   draft's "your progress is never lost mid-level" wording; a process-death
   background kill does lose the run per M4.6, and this caption is exactly
   the kind of body-copy claim that must not silently drift back to the
   overpromise the PRD already flagged and fixed.)
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

- No third-party IP: no Marvel/Captain America/Ultron/Avengers terms or
  visual motifs, no red-white-blue concentric-star shield, no licensed
  likeness anywhere (NFR-10, F9 AC4, `play-store-research.md` §4).
- Color palette drawn only from the confirmed game palette: Vanguard blue
  `#2f6fed`, Vanguard white `#f4f6fb`, background `#05050a`, enemy
  toughness grays, boss `#242428`/`#8a8a94`, accent amber `#ffd873` — no new
  brand colors invented for store assets alone.
- No screenshot or graphic may depict a feature not yet implemented in the
  build it's captured from (M12.4) — re-capture screenshots after any UI
  change that affects HUD layout, control placement, or wording (including
  after this review's F2/F3 fixes land, since those directly change where the
  on-screen controls sit).
