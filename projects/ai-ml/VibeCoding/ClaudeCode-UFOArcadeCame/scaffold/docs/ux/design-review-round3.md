# UX Design Review — Round 3 (Post-Implementation Gate)

**Reviewer:** ui-ux-designer subagent
**Stage:** Pipeline step 11 — round-2 [GATE] in the pipeline sequence
(independent review of the *built implementation* before the final security
pass, step 12). Filed as round**3** because `docs/ux/design-review-round2.md`
already exists (a PRD-only re-review pass, verdict PASS, dated against the
PRD text alone) — per traceability-conventions, prior round files are never
overwritten, so this implementation-level review is filed as the next
sequential round number.
**Input reviewed:** Actual source only — `src/ui/ScreenController.ts`,
`src/ui/HUDView.ts`, `src/render/shapes.ts`, `src/render/CanvasRenderer.ts`,
`src/style.css`, `src/core/GameStateMachine.ts`, `src/core/GameLoop.ts`,
`src/core/world.ts`, `src/core/InputManager.ts`, `src/systems/WinLossSystem.ts`,
`src/systems/FormationSystem.ts`, `src/systems/CollisionSystem.ts`,
`src/config/constants.ts`, `src/ui/dom.ts`, `index.html` — cross-referenced
directly against `docs/PRD.md` (F1-F10, NFR-1..10). This review does not
consult `docs/ux/design-review-round1.md`, `docs/ux/design-review-round2.md`,
or any other agent's summary — it independently re-derives conformance from
the built code and the PRD text only, per gate-independence rules. (Round 1
and round 2, read afterward only to write this header for traceability
purposes, were both PRD-text-only reviews; neither inspected actual
implementation code, which is what makes this round the first genuine
implementation-vs-spec check.)

---

## Verdict: **PASS**

The implementation is unusually well-traced: nearly every function carries a
comment citing the exact PRD clause it implements, and spot-checking those
citations against the actual logic (not just the comments) confirms the
behavior matches in every case I traced through. I found no blocking gaps.
Two non-blocking findings below are worth fixing before final ship, and a
third is worth a deliberate accept/reject decision since it's a real (if
minor) accessibility inconsistency introduced during implementation rather
than a spec gap.

---

## F6 — Pause menu / Esc semantics — verified against code

- **Esc on non-play screens (F6 AC8):** `GameStateMachine.dispatchStateInput`
  has explicit `TITLE`/`GAMEOVER`/`VICTORY` branches that only react to
  `menuConfirmPressed`; there is no `escPressed` handling in those branches,
  so Esc is a true silent no-op there, not just "unhandled by omission." This
  is structurally guaranteed (one dispatch function, one switch, no other
  code path reads `escPressed` outside the `PLAYING`/`PAUSED` cases) rather
  than merely coincidental.
- **Resume via Esc-again (F6 AC3) and via menu (AC2):** Both paths set
  `world.state = 'PLAYING'` and neither touches enemy positions, projectiles,
  or `effects.*Remaining` timers, which are only mutated by the simulation
  systems — and those systems are gated by `if (this.world.state ===
  'PLAYING')` in `GameLoop.tick`. Since the accumulator only advances
  simulation time while `PLAYING`, pausing genuinely freezes all motion and
  all timers (F6 AC1, AC7) — this isn't just "the pause screen is drawn," the
  fixed-timestep loop literally stops stepping. Verified correct by reading
  the loop, not just the state machine.
- **Restart Level vs Restart Game (F6 AC4/AC5):** `resetForLevel` (world.ts)
  explicitly does not touch `score`, `lives`, or `permanentMultiplier`;
  `performRestartGame` calls `createNewRunWorld()` wholesale, which resets all
  three. The AC4/AC5 distinction is real in the code, not just in comments.
- **Restart Game confirmation guard (F6 AC11):** `restartGameConfirmPending`
  correctly gates a second Enter/Esc decision before `performRestartGame`
  runs, and `ScreenController.renderPause` renders a visually distinct
  `.confirm-box` (red border, dark red background) with explicit text listing
  what will be lost ("discard all progress, score, and your permanent power
  multiplier"). This exceeds the AC11 minimum (a bare confirm/cancel) by
  naming the specific stakes.
- **Quit fallback text (F6 AC9):** `attemptQuit()` calls `window.close()`
  then unconditionally returns `true` (treats the call as blocked whenever
  execution continues past it — correct, since a successful close ends
  execution anyway, so there is no path where the fallback wrongly displays).
  `quitBlockedMessageActive` is set and rendered as literal text "Run ended —
  you may now close this tab." on the title screen — matches AC9 verbatim
  intent. It is also correctly reset to `false` by `createNewRunWorld()`, so
  starting a fresh run after seeing that message does not leave a stale
  "Run ended" banner showing during actual new play — confirmed by reading
  `startNewRun()`, which calls `createNewRunWorld()`.
- **Keyboard navigation (F6 AC10):** `InputManager` produces edge-triggered
  `menuUpPressed`/`menuDownPressed`/`menuConfirmPressed` from ArrowUp/
  ArrowDown/Enter, and `GameStateMachine`'s `PAUSED` branch wires them to
  `pauseMenuSelectedIndex` with wraparound (`% PAUSE_MENU_OPTIONS.length`).
  Selection is visibly highlighted via `.menu-item.selected`, which changes
  border style/width/background **and** prepends a `▸` glyph
  (`::before { content: '\25B8 ' }`) — genuinely non-color-only, not just a
  color swap. This satisfies both AC10's keyboard requirement and NFR-9(a)'s
  non-color-only requirement for menu selection.

**F6 verdict: matches PRD as built.** No gaps found in the actual dispatch
logic, which is the part most likely to drift from intent during
implementation.

---

## F7 — Permanent multiplier HUD + active-effect indicators — verified against code

- **Persistent readout (F7 AC10a):** `HUDView` renders `Power ×${world.
  permanentMultiplier.toFixed(2)}` every frame while `PLAYING`/`PAUSED`. This
  is a real, always-on readout, confirmed by reading the `update()` method
  body, not just its comment.
- **On-catch feedback (F7 AC10b):** `HUDView` tracks `lastMultiplier` and
  triggers a 0.6s flash (`hud-effect-active` class → `color: #ffd873;
  font-weight: 600`) whenever `world.permanentMultiplier` changes value. This
  is a real edge-detection diff against the previous frame's value, not a
  cosmetic label — it will genuinely pulse once per catch. One caveat: the
  flash is color/weight-only (no shape/size/icon change) — see N1 below.
- **Active-temporary-effect visibility (F7 AC11):** `HUDView.effectsEl`
  builds a string like `"5x Hit 4.2s | 3x Speed 1.1s"` from
  `world.effects.*Remaining`, showing remaining duration to one decimal —
  this exceeds the AC11 minimum ("where practical, its remaining duration")
  and does so as visible text, so it's legible without relying on color at
  all.
- **Indestructible Shield visibility (F7 AC6) and post-hit i-frames (F8
  AC9):** Both invulnerability sources are rendered through the same
  `drawVanguard(..., invulnerable, blinkOn)` path in `CanvasRenderer.
  drawPlayer`, which computes `invulnerable` as
  `postHitInvulnRemaining > 0 || effects.shieldRemaining > 0` — i.e. the code
  genuinely treats both sources identically for visibility purposes, which
  is exactly what AC9's "same visibility intent as F7 AC6" requires. The
  visual itself is a dashed elliptical aura ring (a **shape**, drawn via
  `ctx.ellipse` + `setLineDash`) that blinks on/off at 10Hz, plus a body-color
  shift only during the "off" phase of the blink — so the invulnerability
  signal survives grayscale/colorblind simulation (aura ring presence/
  absence + blink cadence), not just a hue change. Confirmed by reading the
  drawing code itself, not the comment.

**F7 verdict: matches PRD as built**, including the harder-to-fake parts
(edge-detected catch feedback, shared invulnerability-visibility code path).

---

## F4 AC6 / F3 AC6 — damage state and formation warning — verified against code

- **Enemy damage state (F4 AC6):** `drawSentinel` computes `damageFraction =
  hitsTaken / hitsToKill` and (a) shifts body color toward red via
  `shadeTowardRed`, **and** (b) draws one crack-line shape per hit taken via
  a `for (let i = 0; i < hitsTaken; i += 1)` loop that adds a new stroked
  polyline at each iteration. This is a genuine shape accumulation, not a
  static decoration — a 3-hit enemy that has taken 2 hits will visibly show
  two crack lines, distinguishable from a 1-hit-taken enemy even with color
  removed. Confirmed non-color-only, matches AC6/NFR-9(a).
- **Boss distinction:** an extra "crown" polyline is drawn only when
  `isBoss`, again a shape addition independent of the color difference
  (`#b25fe0` vs `#e0955f`), so a boss reads as visually distinct even for a
  colorblind player.
- **Formation warning (F3 AC6):** `FormationSystem.updateFormation` sets
  `world.formationWarningActive` based on `lowestY >= PLAYER_Y -
  FORMATION_WARNING_ROW_MARGIN_PX`, and `CanvasRenderer.drawFormationWarning`
  renders both a pulsing border (`strokeRect`, alternating between two red
  shades on a ~10-frame cadence) **and** literal text ("WARNING: SENTINELS
  APPROACHING") drawn via `ctx.fillText`. This is genuinely two independent
  channels (pulsing shape + text), not color alone. `FORMATION_WARNING_ENABLED`
  is a single named constant, correctly matching the PRD's framing that Q7
  is still open for owner sign-off and the warning is a toggleable design
  decision, not baked into the loss rule itself (F3 AC5 is untouched by the
  flag — confirmed in `WinLossSystem`, which uses `PLAYER_Y` directly with no
  dependency on the warning flag).

**Verdict: matches PRD as built**, and the non-color-only requirement is
substantively implemented (shape/text changes), not a color-only signal with
a comment merely claiming otherwise — this was the specific risk this round
was asked to check for, and it holds up under direct code inspection of
`shapes.ts` and `CanvasRenderer.ts`.

---

## F9 AC2/AC3 — control-text line — verified against code

- `HUDView`'s constructor sets the control text unconditionally at
  construction time: `setText(this.controlTextEl, '← → move · Space throw ·
  Esc pause')` — present from first paint, not conditionally rendered. It is
  positioned via CSS as a fixed bottom-center band with its own backing
  panel (`background: rgba(5,5,12,0.72)`, bordered), so it has guaranteed
  contrast against the canvas per NFR-9(b) — confirmed this isn't just
  floating text over a variable background.
- It persists until `hasThrownOnce` becomes true (tracked in `main.ts` via
  `if (currentWorld.shields.length > 0) hasThrownOnce = true`), at which
  point `HUDView` adds the `.faded` class, a CSS `opacity` transition to 0
  over 0.6s — matches AC2's "present at least until the player's first
  shield throw ... may then fade." This is a correct, verifiable
  implementation of the exact mechanism the PRD mandated to replace the
  earlier-flagged untestable "self-evident" fallback.
- Informational note, not a defect: the title screen (`ScreenController.
  renderTitle`) shows a *longer* control string — "← → move · Space throw ·
  Esc pause · Up/Down + Enter to navigate menus" — which differs from the
  in-play HUD's shorter string. This is not an AC violation (AC2 only
  mandates the in-play line's minimal content is present at least until
  first throw; the title screen is pre-game), and the fuller string on the
  title screen arguably helps first-time legibility since it also covers
  menu navigation before the player has ever paused. Flagging only so it's a
  documented, deliberate inconsistency for docs-writer's benefit later.

**Verdict: matches PRD as built**, and the control-text approach genuinely
satisfies "no tutorial needed" — a first-time player has the two things they
need (what the keys do, and that pausing exists) visible before any input,
with zero required reading beyond one short line, consistent with UC1/P1.

---

## Non-blocking findings

`[Flow/Screen] — [Heuristic violated] — [Specific issue] — [Suggested fix]`

### N1 — [HUD / F7 AC10(b)] — Accessibility baseline (non-color-only) — Permanent-multiplier catch-feedback flash is color/weight-only
**Issue:** `HUDView.update` flashes the multiplier readout via the
`hud-effect-active` CSS class, which only changes `color` (to `#ffd873`) and
`font-weight` (to 600). Unlike every other invulnerability/damage/warning
signal in this codebase (F4 AC6, F7 AC6, F8 AC9, F3 AC6 all deliberately pair
a color change with a shape/text/animation change), this specific
catch-feedback flash has no non-color channel — a colorblind player relying
on luminance-only perception would likely still notice the weight change
(bolding provides some redundancy), but it is weaker than the pattern
established everywhere else in this build.
**Fix:** Add a size pulse (e.g. a brief `transform: scale(1.08)` transition)
or a temporary border-flash on `.hud-effect-active` in `src/style.css` so the
on-catch signal is consistent with the non-color-only pattern already used
for every other state signal in this build. Low cost — one CSS addition
alongside the existing class; no state-machine change needed.

### N2 — [HUD / accessibility] — Visibility of system status — `#hud-root` has `aria-live="polite"` but HUD text is rewritten every frame regardless of change
**Issue:** `index.html` marks `#hud-root` with `aria-live="polite"`, a
reasonable intent (announce HUD changes to screen readers). However,
`HUDView.update()` calls `setText(...)` on score/lives/level/multiplier/
effects **unconditionally every frame** (60 times/second while playing), not
only when a value actually changes. Because `setText` sets `textContent`
every tick, a screen reader observing this live region would either be
flooded with mutation churn even when nothing displayed actually changed, or
some browser/AT combinations may effectively suppress it — either way the
live-region intent is undermined by the always-write pattern. This is an
implementation-introduced issue: the PRD's NFR-9 scope is about visual
non-color-only signals, not full assistive-technology support, but the
markup already opts into `aria-live` and currently defeats its own purpose.
**Fix:** Either (a) in `src/ui/HUDView.ts`, only call `setText` when the new
string differs from the last-rendered string (cheap diff, also slightly more
efficient), or (b) if screen-reader support for the HUD isn't actually in
scope for v1, remove `aria-live="polite"` from `#hud-root` in `index.html` so
the markup doesn't imply a capability that isn't really delivered. Either is
acceptable; leaving today's contradictory half-state is the only bad option.

### N3 — [Overlay screens / accessibility] — Visibility of system status — `#overlay-root` (Pause/Game Over/Victory/Title) has no `aria-live` region at all
**Issue:** Unlike `#hud-root`, `#overlay-root` (where Pause, Game Over,
Victory, and Title screens render, per `ScreenController`) has no
`aria-live` or `role` attribute in `index.html`. A screen-reader user who
presses Esc to pause, or who reaches Game Over/Victory, gets no automatic
announcement that the screen changed. This is a smaller-scope, genre-typical
gap (the PRD's NFR-9 scope is specifically "no color-alone" rather than full
screen-reader support), so this is non-blocking, but is worth an explicit
accept/defer decision rather than silence, consistent with this project's
own pattern of recording such decisions (e.g. the sound and
formation-warning open questions).
**Fix (non-blocking, recommended):** Add `aria-live="assertive"` (or `role=
"alert"` on the overlay's `h1`) to `#overlay-root` in `index.html` so
state-changing screens (Pause/Game Over/Victory) are announced, or
explicitly note in NFR-9/scope that full screen-reader support is out of
scope for v1 so this isn't mistaken for an oversight later.

---

## Cross-cutting observation

This implementation is a rare case where the traceability comments at the
top of each file turned out to be **accurate**, not aspirational — I traced
the actual logic behind F6 AC8/AC9/AC10/AC11, F7 AC6/AC10/AC11, F4 AC6, F3
AC6, and F9 AC2/AC3 line-by-line rather than trusting the comments, and in
every case the runtime behavior matched what the comment claimed. The
specific risk this round was asked to check — non-color-only signals
claimed in comments but actually color-only in the rendering code — did not
materialize; `shapes.ts` and `CanvasRenderer.ts` genuinely draw distinct
shapes/text/animation for every state the PRD requires it for. The three
findings above (N1-N3) are all accessibility-adjacent polish items
introduced during implementation (a catch-flash effect that's color-only,
and two `aria-live` gaps that are inconsistent with each other), none of
which regress any flow reviewed at the PRD stage, and none of which rise to
blocking severity given the PRD's own NFR-9 scope is explicitly about
non-color-only visual signals rather than full assistive-technology support.

---

## Gate disposition

**Verdict: PASS.** No blocking findings. Proceed to step 12
(security-compliance-reviewer pass 2). N1-N3 are recommended fixes
(non-blocking) that code-implementer/code-reviewer can pick up in the same
pass as any security-review-v2 remediation, since none require new
architecture or state-machine changes — they are CSS/markup-level additions
only, confined to `src/style.css`, `src/ui/HUDView.ts`, and `index.html`.
