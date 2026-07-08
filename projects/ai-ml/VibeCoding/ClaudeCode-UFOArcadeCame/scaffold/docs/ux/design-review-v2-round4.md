# UX Design Review — v2 Addendum, Round 4 (post-implementation, independent code audit)

**Reviewer:** ui-ux-designer (independent, code-only review)
**Scope:** `docs/PRD-addendum-v2.md` (F11-F19, FINAL) verified against the actual
built implementation — not the spec text, not any implementer summary.
**Inputs read:** `docs/PRD-addendum-v2.md`; `src/render/shapes.ts`;
`src/render/CanvasRenderer.ts`; `src/ui/ScreenController.ts`;
`src/ui/HUDView.ts`; `src/core/GameStateMachine.ts`; `src/core/InputManager.ts`;
`src/systems/BossWarningSystem.ts`; `src/core/GameLoop.ts`;
`src/systems/CollisionSystem.ts`; `src/config/constants.ts`;
`src/config/levelConfig.ts`; `src/core/world.ts`; `src/style.css`; `index.html`;
`src/systems/VictoryCelebrationSystem.ts`.
**Continuity:** this round verifies the implementation of the flows validated
on paper in `design-review-v2-round1.md` (B1-B8, N1-N5) and
`design-review-v2-round2.md` (C1, C2) — it does not re-litigate the spec text,
only whether the code actually delivers what those rounds signed off on.

## Verdict: **FAIL**

Three blocking findings. Two are genuine "spec said X, code does Y" gaps in
areas the addendum explicitly called out as resolved (F19 AC4's fireworks,
F18 AC3's text-vs-enemy contrast); one is a code-level accessibility
regression introduced by combining an old rendering structure with F17's new,
much darker color values. Three of the six requested focus areas pass cleanly
with code-level confirmation (not just intent).

---

## Blocking findings

### FAIL-1 (severe): F19's "Game Complete" fireworks are visually suppressed by the DOM overlay's own background — the celebration the code draws is not the celebration the player sees

- **Where:** `src/ui/ScreenController.ts:126-136` (`renderVictory`) creates its
  overlay via `createElement('div', 'screen-overlay')` — the same CSS class
  used for Title/Pause/GameOver. `src/style.css:128-141` defines
  `.screen-overlay` with `background: rgba(2, 2, 8, 0.86)` and
  `position: absolute; top:0; left:0; width:100%; height:100%`, inside
  `#overlay-root` which is `z-index: 20` (`src/style.css:119-126`). The
  playfield `#game-canvas` (where `CanvasRenderer.drawVictoryFireworks` draws,
  `src/render/CanvasRenderer.ts:60-63, 184-187`) has no explicit `z-index`
  (`src/style.css:39-47`), so per normal CSS stacking rules it paints below
  both `#hud-root` (`z-index:10`) and `#overlay-root` (`z-index:20`).
- **What actually happens:** during the VICTORY state, an 86%-opaque
  near-black (`rgb(2,2,8)`) layer sits directly on top of the entire canvas,
  including the firework particles. Standard alpha compositing
  (`result = overlay*0.86 + canvas*0.14`) means a fully-saturated firework
  pixel like `#ff5a5a` (255,90,90) composites to roughly `rgb(37,14,19)` —
  a barely-perceptible dark smudge, not a "firework explosion." Every other
  firework color in `FIREWORK_COLORS` (`src/config/constants.ts:72-79`)
  suffers the same ~86% suppression.
- **Spec requirement violated:** F19 AC4 — *"No enemies are present during
  the sequence; in their place, firework explosions of different colors
  animate around the 'Game Complete' text to emphasize it (multiple distinct
  colors, not a single color)."* The fireworks are coded correctly in
  isolation (`drawFireworks` genuinely cycles through 6 distinct colors,
  bursts on a deterministic schedule) — the bug is purely in the DOM/canvas
  layering, not the drawing logic itself. F19 AC3 ("the background does not
  change... remains the same black playfield background") is also
  effectively violated in spirit: the DOM overlay *adds* a new
  near-opaque wash that the addendum explicitly said would not happen ("no
  new scene/background swap").
- **Why this slipped through:** `.screen-overlay`'s near-opaque background
  is the *correct* design for Title/Pause/GameOver, where it exists solely to
  guarantee text legibility over whatever is on the canvas behind it (there is
  no requirement that canvas content stay visible on those screens). F19 is
  the one screen where the canvas content behind the overlay is itself a
  first-class requirement (AC4), and reusing the same class without
  accounting for that breaks it. This is exactly the kind of collision
  `code-reviewer` should have caught by rendering (or at minimum tracing) the
  actual composited screen, not just confirming `drawFireworks()` exists and
  cycles colors.
- **Suggested fix:** give the VICTORY overlay a distinct, much-lower-opacity
  (or no) background — e.g. a class with `background: transparent` (or a
  thin `rgba(2,2,8,0.15)` at most) plus a text-shadow/backing-panel scoped
  tightly to just the `h1`/`p` elements (matching the existing `.hud-panel`
  pattern already used elsewhere for text-over-canvas legibility) instead of
  a full-viewport wash. Re-verify AC7's score-legibility requirement still
  holds once the background is lightened.

### FAIL-2: F18 AC3's "LEVEL [N]" text color fails to clear a meaningful contrast margin against the white 1-hit enemy body color, contrary to the code's own stated intent

- **Where:** `src/config/constants.ts:59-62` — `LEVEL_INTRO_TEXT_COLOR =
  '#ffd873'`, with the comment *"near-white/accent color chosen to contrast
  against both the black background and the white 1-hit enemies (F17)."*
  `src/config/constants.ts:89-94` — 1-hit enemy body color
  `ENEMY_TOUGHNESS_COLORS[1] = '#f4f6fb'` (also `VANGUARD_WHITE`, reused
  identically for the Vanguard's white regions, `src/config/constants.ts:85`).
- **What actually happens:** computing WCAG relative luminance for both
  colors: `#ffd873` → L ≈ 0.716; `#f4f6fb` → L ≈ 0.921. Contrast ratio
  `(0.921+0.05)/(0.716+0.05) ≈ 1.27:1`. WCAG's floor for large text/graphical
  objects is 3:1; this is nowhere close. The two colors differ mainly in hue
  (warm amber vs. neutral white), not luminance — exactly the signal that is
  weakest for players with any color-vision deficiency and for low-quality
  displays, and precisely the failure mode "clearly contrasts... so the text
  does not blend into a white enemy" (F18 AC3) was written to prevent. The
  code's own comment asserts this is resolved; the actual hex values show it
  is not.
- **Mitigating factor found in code (not a fix, a caveat):** tracing
  `FORMATION_TOP_MARGIN`/`ENEMY_HEIGHT`/`ENEMY_V_SPACING`
  (`src/config/constants.ts:19,136-141`) against `levelConfig.ts`'s row
  counts, the white-1-hit-heavy levels (1-3) only ever place enemies well
  above the text's vertical center (`PLAYFIELD_HEIGHT/2 = 300`), so today's
  specific row/column tuning mostly avoids direct pixel-on-pixel occlusion
  between the text and a literal white enemy (levels 4-5 graze the edge by a
  few px; boss-tier-heavy levels 8-9 sit directly under the text but with
  darker enemies, where contrast is fine). This is a coincidence of the
  current balance table, not a designed guarantee — any future `rows`/`hpMix`
  rebalance (which `test-validator`'s own N5 flag already anticipates
  happening for bounce-tuning reasons) could reintroduce direct occlusion
  with no code change needed to trigger it. The AC is about the color
  property itself ("distinct from the white 1-hit enemies"), not about
  today's specific formation geometry, and the color property fails.
- **Suggested fix:** either pick a `LEVEL_INTRO_TEXT_COLOR` with materially
  lower luminance (e.g. a deep blue/orange with L well below 0.4, giving a
  real ≥3:1 margin against `#f4f6fb`), or add a persistent dark
  stroke/shadow behind the fill text (the same non-color-only technique
  already used for the invulnerability aura and damage cracks elsewhere in
  this codebase) so legibility does not depend on hue alone.

### FAIL-3: Boss (and darkest-tier) Sentinel arms/legs have no contrast treatment and are effectively invisible against the black playfield — a regression against F17 AC1/AC5 introduced by combining the pre-existing "outline only torso+head" draw structure with the new near-black toughness scale

- **Where:** `src/render/shapes.ts:195-216` — legs (`fillRect`, `fillStyle =
  bodyColor`, no stroke at all) and arms (`strokeStyle = bodyColor`, i.e. the
  line color IS the body color, no separate outline) get no contrast
  treatment. Only the torso (`strokeRect` with `outlineColor`,
  `shapes.ts:200-205`) and head (`arc` stroked with `outlineColor`,
  `shapes.ts:218-228`) get a lighter border. `outlineColor` is
  `BOSS_OUTLINE_COLOR = '#8a8a94'` for the boss and `'#2a2a3a'` for every
  regular tier (`shapes.ts:187`).
- **What actually happens, quantified:** `BOSS_COLOR = '#242428'`
  (`constants.ts:97`) against the canvas background `#05050a`
  (`style.css:20,45`) computes to a WCAG contrast ratio of **~1.3:1** — as
  low as two near-identical dark grays. The boss's torso/head are rescued by
  `BOSS_OUTLINE_COLOR` (`#8a8a94`, contrast ~6.2:1 against black — fine), but
  its **arms and legs have zero outline and render at the same ~1.3:1
  near-invisible ratio**, at 5× the boss's normal thickness/length
  (`BOSS_SIZE_MULTIPLIER = 5`, `constants.ts:45`, scales
  `lineWidth = Math.max(3, width * 0.1)` and the leg `fillRect`s
  proportionally). In practice: the level-5/10 boss is likely to visually
  read as a floating torso+head with two limbs that disappear into the black
  background — directly contradicting F17 AC5 ("never so dark it blends into
  the background") and F17 AC1 ("four distinguishable humanoid regions... a
  viewer can point to each") specifically for the single most important
  enemy encounter in the game.
- **Why this is a regression, not a pre-existing v1 issue:** the
  torso/head-only outline structure in `drawSentinel` is carried over
  unchanged from before F17; it wasn't a contrast problem under v1's
  brighter base colors (orange `#e0955f`/purple boss `#b25fe0`, per this
  file's own "Supersedes/amends" comment header), where even an unoutlined
  fill had reasonable contrast against black. F17's white→dark-gray toughness
  scale (culminating in a near-black boss) is new in v2 and is what exposes
  the old "only 2 of 4 regions get an outline" structure as an actual
  accessibility failure. This is exactly the "regression introduced by
  redrawn art" this round was asked to check for (secondary check: tier-4
  regular enemies, `#3c3f46`, fare slightly better on raw fill contrast
  (~2:1) but still fall short of a 3:1 floor and get the same
  near-invisible `'#2a2a3a'` outline, which is barely distinguishable from
  the tier-4 fill itself).
- **Suggested fix:** apply the same lighter contrast-floor stroke used on
  torso/head to arms and legs as well — for the boss, stroke the leg
  rectangles and give the arm line a lighter outline pass (e.g. draw the
  `bodyColor` line, then a thinner `BOSS_OUTLINE_COLOR` line on top, or
  simplest: apply `strokeRect`/an outer stroke to the leg rects using
  `outlineColor`, matching the torso treatment). For regular tiers, consider
  raising `'#2a2a3a'` to something with a real contrast floor against black
  for tier-4 specifically, not just for the boss.

---

## Focus areas that PASS with code-level confirmation

**1. Boss-incoming cue vs. v1 formation danger-pulse (F12 AC10, round-2 C2)
— PASS.** Verified actual draw calls, not just comments:
`drawFormationWarning` (`CanvasRenderer.ts:66-81`) alternates
`'#ff5a5a'`/`'#ffb3b3'` (both red family) based on a `% 20 < 10` toggle —
a genuine pulse. `drawBossWarning` (`CanvasRenderer.ts:88-100`) draws a
single, non-toggled `LEVEL_INTRO_TEXT_COLOR` (`#ffd873`, amber) stroke every
frame it's active — genuinely solid, never pulses, and a different hue
family from the danger red. Text also differs ("WARNING: SENTINELS
APPROACHING" vs. "BOSS INCOMING"). The two cues are also confirmed
code-level mutually exclusive in time (`world.formationWarningActive` only
true while the formation is alive; `world.bossWarningRemaining` only set once
the formation is cleared, per `BossWarningSystem.ts`). This is a real,
verified distinction, not just distinguishable-on-paper.

**1b. Boss-incoming cue is genuinely non-freezing, and genuinely mechanically
distinct from F18's 3-second intro — PASS.** `GameLoop.stepSimulation`
(`GameLoop.ts:106-119`) shows `updateLevelIntro` gates with an early
`return` that blocks every system below it (movement, formation, fire,
projectiles, collisions) whenever `levelIntroRemaining > 0`.
`updateBossWarning` (`BossWarningSystem.ts`) is called *after* that gate and
is a pure decrementing counter with no gating effect on anything below it —
`updateMovement`/`updateProjectiles`/etc. all run unconditionally regardless
of `bossWarningRemaining`. Traced directly in code: the player can move and
throw during the boss cue; they cannot during the level intro. These are two
structurally different mechanisms, exactly as the addendum requires (not
merely "a shorter timer with the same freeze flag").

**3. "+1 LIFE" catch-confirmation cue (F16 AC9) — PASS.**
`CollisionSystem.ts:274-278` (`resolveShieldCatches`) genuinely sets
`world.lifeCatchFlashRemaining = LIFE_CATCH_FLASH_SECONDS` (1.0s) on an
actual catch, wired through to `HUDView.ts:84-90`, which swaps the lives
text to `Lives: N (+1 LIFE)` and toggles a `hud-effect-active` class. That
class (`style.css:84-97`) applies a color change, bold weight, AND a 0.6s
scale-pulse keyframe animation — a real, noticeable, non-color-only cue, not
a silent counter tick or a one-frame flash easy to miss.

**4. Shield trail (F15 AC9) — PASS.** `drawShieldTrail`
(`CanvasRenderer.ts:142-151`) draws trail points *underneath* the main
shield, at 60% of its radius and a max 30% alpha (vs. the main shield's full
opacity + white outline stroke, `shapes.ts:105-121`). Genuinely visually
distinct from the solid, outlined main shield by both size and transparency,
and trivially distinct in hue/shape from the red diamond enemy laser
(`drawEnemyLaser`, `shapes.ts:142-159`). Confirmed non-gameplay-affecting
(trail array is rendering-only, never read by `CollisionSystem`).

**5. Contrast-adaptive damage overlay (F17 AC9) — PASS, genuinely
adaptive, not a no-op.** `shapes.ts:189-193`: `isDarkBody = isBoss ||
hitsToKill >= 3`, producing `damageOverlayColor = '#eef0f6'` (light) for
dark bodies and `'#1a1a1a'` (dark) for light bodies. Computed WCAG contrast
of the overlay against each tier's actual base fill: tier 1 (`#f4f6fb`) vs.
dark overlay ≈ high contrast; tier 2 (`#c3c6cf`) vs. dark overlay ≈ good;
tier 3 (`#787c86`) vs. light overlay ≈ good; tier 4 (`#3c3f46`)/boss
(`#242428`) vs. light overlay ≈ good. This is a real conditional producing
materially different, well-separated colors per tier — the concern in the
focus-area prompt (a conditional that evaluates to the same effective color
either way) does not apply here; this AC is correctly implemented.

**F19 AC9 / Esc exemption (round-2 C1) — PASS, traced at the input-edge
level, not just the dispatch branch.** `InputManager.ts` implements
`anyKeyEdge`/`escEdge` as true edge-triggers: both only fire on the
transition from not-held to held (`alreadyHeld` guard,
`InputManager.ts:63-66`) and both are cleared every tick via
`consumeEdges()`. `GameStateMachine.ts:102-116` checks `input.escPressed`
and returns immediately *before* touching `anyKeyPressed` or
`victoryHeld` — confirmed Escape can never hold or advance the Game
Complete screen under any input sequence. Verified the two-press
hold-then-advance gesture is genuinely edge-triggered (not level-triggered):
holding a single key down does not repeatedly toggle `victoryHeld` because
`anyKeyEdge` only fires once per physical press/release cycle, so a player
cannot accidentally skip the hold by keeping a key held down across frames.

---

## Non-blocking observation

**Boss-incoming cue reuses the exact same color as the F18 level-intro text
(`LEVEL_INTRO_TEXT_COLOR`, `#ffd873`) for both.** This is not a spec
violation — F12 AC10/round-2 C2 only required distinctness from F3 AC6's red
danger pulse, which is satisfied — but it's worth flagging that a player
could plausibly associate "amber flash" with "a level-related announcement"
generically rather than reliably distinguishing "LEVEL N is starting" from
"the boss is coming" by color alone. The distinguishing signals that do
exist (different text, border-stroke vs. full centered text, 1.75s vs 3s,
non-freezing vs. freezing) are almost certainly sufficient given how
differently the two moments play out, but if `product-manager`/owner wants a
fully distinct visual language for the two cues, this is where to look.

---

## Summary for routing

This is a **FAIL** gate. FAIL-1 (fireworks suppressed) is the most severe —
it defeats a specific, owner-requested acceptance criterion (F19 AC4) end to
end despite the drawing logic itself being correct; it is a pure
CSS-layering bug and should be a fast fix. FAIL-2 and FAIL-3 are both real
WCAG-quantifiable contrast gaps that the code's own comments claim are
resolved but the actual hex values do not achieve — both are actionable
without re-deriving the problem (exact colors, exact computed ratios, and
exact file:line locations are given above). None of the three findings
implicate solution-architect-level rework; all are contained to
`src/style.css`, `src/config/constants.ts`, and `src/render/shapes.ts`.
Route back to `code-implementer` with this document; re-review does not need
to restart from round 1 — only FAIL-1 through FAIL-3 need to be re-verified,
plus a spot-check that the fix to FAIL-1 doesn't regress AC7's score
legibility on the Game Complete screen.
