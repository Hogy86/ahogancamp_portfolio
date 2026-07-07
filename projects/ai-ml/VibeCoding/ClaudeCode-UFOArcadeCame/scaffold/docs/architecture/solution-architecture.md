# Solution Architecture — Vanguard vs. Sentinels: Shield Invaders

**Stage:** 4 — Solution Architect
**Date:** 2026-07-06
**Author:** solution-architect subagent
**Status:** v1 — for security-compliance-reviewer pass 1 (pipeline step 6)

**Sources (upstream):**
- `docs/PRD.md` (v1, features F1-F10, NFR-1..NFR-10) — the authoritative spec every decision below traces to.
- `docs/ux/design-review-round1.md` (round-1 findings UX-B1..UX-B7, UX-N1..UX-N4) — motivates the state-machine and HUD design.
- `docs/ux/design-review-round2.md` (PASS, non-blocking NB1-NB4) — NB2/NB3 edge cases are folded into component responsibilities below.
- ADRs `docs/architecture/adr/0001..0005-*.md` (every decision with a real tradeoff is recorded there and linked inline).

**Pre-checked against `security-compliance-checklist` skill** — see §Security & Compliance Pre-Check before this goes to review.

---

## Overview & Component Diagram

The product is a **single-page, fully client-side browser game**. There is no
backend, no database, no network dependency at play time (NFR-6, NFR-7). It ships
as static assets (one HTML entry, a bundled JS module, a CSS file, and a small set
of drawn/vector assets) served from any static host or the deployment container
(deployment-engineer, step 16).

At runtime the app is a single browser tab running one **fixed-timestep game loop**
driving a **canvas 2D renderer**, coordinated by an explicit **screen/pause state
machine**. All game behavior is data-driven from a static level-config table.

```
                         ┌──────────────────────────────────────────────┐
                         │                Browser tab (client)           │
                         │                                               │
   Keyboard  ─────────►  │  InputManager  ──► (intent: move/throw/menu)  │
   (arrows,              │      │                                        │
    space, esc,          │      ▼                                        │
    up/down,            │  GameStateMachine ◄──► ScreenController        │
    enter)              │  (TITLE│PLAYING│PAUSED│GAMEOVER│VICTORY)       │
                         │      │                                        │
                         │      ▼   (only ticks in PLAYING)              │
                         │  ┌────────────── GameLoop (fixed step) ──────┐│
                         │  │ update():  systems in fixed order         ││
                         │  │   InputSystem → MovementSystem →          ││
                         │  │   FormationSystem → EnemyFireSystem →     ││
                         │  │   ProjectileSystem → CollisionSystem →    ││
                         │  │   PowerUpSystem → LivesSystem →           ││
                         │  │   WinLossSystem → HUDModelSystem          ││
                         │  │ render(): CanvasRenderer draws frame       ││
                         │  └───────────────────────────────────────────┘│
                         │      │                │                        │
                         │      ▼                ▼                        │
                         │  World/Entities   LevelConfig (static table)   │
                         │  (player, enemies,   F4 10-level data          │
                         │   projectiles,                                 │
                         │   powerups, timers)                            │
                         │      │                                         │
                         │      ▼                                         │
                         │  Instrumentation ──► console + localStorage    │
                         │  (NFR-8 event counters, best-effort)           │
                         │      │                                         │
                         │      ▼                                         │
                         │  CanvasRenderer + HUD overlay (DOM)  ──► Screen │
                         └──────────────────────────────────────────────┘
```

### Component responsibilities

| Component | Responsibility | Traces to |
|---|---|---|
| **InputManager** | Reads keyboard events, maintains a held-key set, translates raw keys into semantic intents (moveLeft/moveRight/throw/pause/menuUp/menuDown/menuConfirm). Resolves Left+Right → cancel (F1 AC5). Debounces edge-triggered actions (Esc, Enter). | F1, F2, F6, NFR-3, NFR-5 |
| **GameStateMachine** | Owns the current screen state and legal transitions across TITLE, PLAYING, PAUSED, GAMEOVER, VICTORY. Routes input by state so Esc means different things per screen (pause in PLAYING; resume in PAUSED; no-op on TITLE/GAMEOVER/VICTORY). See ADR-0002. | F6, F8, UX-B1, UX-B3 |
| **GameLoop** | Fixed-timestep accumulator loop on `requestAnimationFrame`; calls `update(dt)` a deterministic number of times then `render()`. Only advances simulation while state == PLAYING. See ADR-0002. | NFR-2, NFR-3 |
| **World / Entities** | Plain data holding player, enemy formation, projectiles, power-ups, active timers, lives, score, current level. Single source of truth the systems mutate. | F1-F8, F10 |
| **Systems** (movement, formation, enemy-fire, projectile, collision, power-up, lives, win/loss, HUD-model) | Each system is a pure-ish function `update(world, dt)` run in a fixed order every tick. Deterministic ordering is what makes the two Game Over triggers resolve without a race (F8 AC8). See ADR-0002. | F1-F8, F10 |
| **LevelConfig** | Static, immutable data table encoding the F4 10-level progression (formation size, HP mix, boss HP, speed multiplier, fire-rate multiplier, guaranteed drops). Consumed, never branched-on-per-level. See ADR-0003. | F4, F5, NFR-tuning |
| **PowerUpSystem** | Manages the 4 power-up types, catch detection, timer lifecycle (pause/resume with game — F6 AC7), stacking rules (permanent multiplicative stack; temporary same-type refresh — F7 AC7/AC8), and composition of permanent × temporary hit power (F7 AC9). Feeds HUD model. | F7 |
| **CanvasRenderer** | Draws the playfield, entities, damage/invulnerability/warning states, and per-frame visual feedback to a single `<canvas>`. All sprites are procedurally drawn vector shapes (ADR-0004). | F3, F4 AC6, F7 AC6, F8 AC9, F3 AC6, NFR-2, NFR-9(a) |
| **HUD overlay (DOM)** | Renders persistent HUD (score, lives, level, permanent-multiplier readout, active-temporary-effect indicators, control-text line) as DOM elements layered over the canvas in a reserved band with a backing panel for guaranteed contrast (NFR-9(b)). See ADR-0001 for why HUD is DOM while the game field is canvas. | F5 AC5, F7 AC10/AC11, F8 AC1, F9 AC2, F10, NFR-9(b) |
| **ScreenController** | Renders the non-play screens (title, pause overlay, Game Over, Victory) as DOM overlays with keyboard-navigable menus (F6 AC10). | F6, F8, F9, UX-B1, UX-B2, UX-N1, UX-N3 |
| **Instrumentation** | Lightweight best-effort event counters written to `console` and `localStorage` (NFR-8). Fire-and-forget; never blocks the loop; wrapped so a storage failure cannot break gameplay. See ADR-0005. | NFR-8 |

---

## Tool Stack (with rationale, link ADRs)

**Chosen stack: TypeScript + HTML5 Canvas 2D, built with Vite, zero runtime
framework, zero backend.** Full justification and rejected alternatives are in
**ADR-0001 (stack & rendering)**. Summary against the
`tool-stack-decision-criteria` skill:

| Criterion | Assessment for this stack |
|---|---|
| **1. Team familiarity** | TypeScript/HTML/Canvas are the lingua franca of browser dev; no game-engine ramp-up. A maintainer can read the whole codebase without learning a proprietary engine or ECS framework. |
| **2. Scaling needs** | "Scale" here is per-tab render performance, not server load — there is no backend to scale (NFR-7). The load profile is fixed forever: one player, ≤54 enemies + a few dozen projectiles/frame (F4 level 10). Canvas 2D handles this at 60 FPS with wide headroom (NFR-2). No 12-24-month growth vector exists because the product is explicitly capped at 10 levels, single-session, no accounts, no persistence (Out of Scope §). |
| **3. Licensing** | TypeScript (Apache-2.0) and Vite (MIT) are permissive, distribution-safe. No GPL/AGPL in the runtime path. No third-party game engine, so no engine license to audit. Matches NFR-10's clean-IP posture at the tooling level too. |
| **4. Hosting constraints** | Output is static files (HTML/JS/CSS/assets). Runs from any static host, a CDN, a file:// open, or the deployment container — including fully offline/air-gapped, satisfying NFR-6/NFR-7 (single URL, no login, no server dependency). |
| **5. Ecosystem maturity** | The product needs **no** payments, auth, or third-party integrations (no backend, no accounts — NFR-6). The only "integration" is the browser's own Canvas/RAF/localStorage APIs, all baseline in the latest-2-versions target (NFR-4). Nothing exotic required, so ecosystem depth is a non-issue. |
| **6. Operational cost** | Zero managed-service cost (no backend, no DB). Only cost is serving static files. Lowest possible operational burden — appropriate for a v1 demo. |
| **7. Long-term support** | TypeScript and Vite are actively maintained, industry-standard, with realistic lifespans well beyond this project. Canvas 2D is a stable, ~15-year-old web standard that will not be deprecated. No bet on a niche/abandonable dependency. |

**Explicitly rejected** (detail in ADR-0001): a heavy game engine
(Phaser/PixiJS), a UI framework (React/Vue/Svelte), a DOM/CSS-sprite renderer,
and any backend/database. Each is either over-engineering for a demo-scale
single-page game or actively works against the 60-FPS / no-backend NFRs.

**Build/dev dependencies (dev-time only, not shipped to the player):** Vite
(bundler/dev server), TypeScript compiler, a lint/format toolchain, and a test
runner (Vitest) to support the later test-writer/test-validator steps. These are
pinned in `package.json` (security pre-check item) and do not appear in the
runtime bundle.

---

## Data Flow

There is **no persistent user data and no network data flow at play time.** The
only data that crosses a boundary is (a) keyboard input in, and (b) best-effort
instrumentation counters out to the browser's own `console`/`localStorage`. Data
classification: **none of it is PII or sensitive** (no accounts, no identifiers,
no user-entered text — NFR-6). See §Security & Compliance Pre-Check.

**Per-frame runtime flow (state == PLAYING):**
1. `InputManager` snapshots the held-key set and edge events for this tick.
2. `GameLoop` runs `update(dt)` for each fixed step: systems execute in the fixed
   order listed above, mutating the single `World` object.
3. `WinLossSystem` evaluates terminal conditions **once per tick, after** lives
   and formation position are finalized, so the two Game Over triggers (lives=0,
   formation-reached-row) are resolved deterministically to a single outcome
   (F8 AC8) — see ADR-0002.
4. `HUDModelSystem` computes the HUD view-model (score, lives, level, current
   permanent multiplier, active temporary timers).
5. `render()` draws the canvas frame; the DOM HUD/overlay is updated from the
   HUD view-model.
6. `Instrumentation` emits any events triggered this tick (level reached, power-up
   caught, etc.), fire-and-forget.

**Config load flow (once, at startup):** `LevelConfig` is a static in-bundle
constant — no fetch, no I/O. Level start reads its row from the table (ADR-0003).

**Instrumentation persistence flow:** counters are read/incremented/written to
`localStorage` under a single namespaced key, wrapped in try/catch so a
quota/permission failure degrades to console-only and never affects gameplay
(ADR-0005).

---

## Integration Points

- **Browser platform APIs only:** `requestAnimationFrame` (loop), Canvas 2D
  context (render), `KeyboardEvent` (input), `localStorage` (instrumentation),
  `performance.now()` (timing). All are baseline in the NFR-4 target matrix
  (latest 2 of Chrome/Firefox/Edge/Safari desktop). No polyfills required.
- **No external integrations.** No auth provider, no payment provider, no
  analytics SaaS, no CDN-loaded runtime dependency, no fonts/assets fetched from
  third parties at play time (this also keeps the offline/air-gapped guarantee and
  avoids third-party wordmark/asset exposure per NFR-10). Any web font used must be
  self-hosted in the bundle or fall back to a system font stack.
- **Deployment integration (step 16):** the built static bundle is the only
  artifact handed to deployment-engineer; the container just serves it.

---

## Deployment Shape

- **Artifact:** a static bundle (`index.html` + hashed JS/CSS + drawn-asset files
  if any). Produced by `vite build`.
- **Serving:** any static file server. In the pipeline, deployment-engineer (step
  16) wraps it in a container that serves the static files (e.g. an nginx or
  equivalent static server). No application server, no database container, no
  environment-specific runtime config is required to play.
- **Runtime footprint:** one browser tab, one canvas, one RAF loop. No server-side
  process handles gameplay.
- **Config:** none required at deploy time for gameplay. Instrumentation is
  on-by-default and self-contained (localStorage); it needs no server endpoint.
- **Security posture of the shape:** container serves read-only static assets, can
  run as a non-root user with a read-only filesystem, holds no secrets and no
  credentials (there is nothing to authenticate against). See §Security &
  Compliance Pre-Check and the notes handed to deployment-engineer.

---

## Non-Functional Requirements (perf, scale, availability)

| NFR | How the architecture satisfies it |
|---|---|
| **NFR-1 — Load ≤3s to first input** | Small static bundle, no runtime framework, no network fetches at startup, no blocking asset pipeline (vector sprites are drawn in code, ADR-0004). Vite tree-shakes/minifies. First controllable input is available as soon as the module parses and the title screen mounts. |
| **NFR-2 — 60 FPS sustained, ≥30 FPS floor at full formation** | Fixed-timestep loop decouples simulation from render (ADR-0002); canvas 2D immediate-mode draw of ≤54 enemies + projectiles is well within a 16.6 ms budget (ADR-0001). No DOM reflow per entity per frame (the reason DOM sprites were rejected). |
| **NFR-3 — ≤100 ms input latency** | Input is sampled at the top of every tick and acted on the same frame; no input queue latency, no debounce on movement (debounce is edge-actions only). Held-key model gives immediate, continuous movement response (F1 AC1/AC4). |
| **NFR-4 — Latest-2-version browser compat** | Uses only baseline Canvas/RAF/localStorage/KeyboardEvent APIs; TypeScript compiled to a widely-supported target; no bleeding-edge/experimental APIs. |
| **NFR-5 — Desktop keyboard only** | InputManager handles arrows/space/Esc for play and Up/Down/Enter for menus (F6 AC10); no mouse or touch path is required for any flow (ScreenController menus are keyboard-navigable). |
| **NFR-6 / NFR-7 — No install/account, fully client-side** | Static SPA, no backend, no login, single URL; a full run is playable with the network fully offline after load. |
| **NFR-8 — Instrumentation hooks** | `Instrumentation` component emits the four required event classes (session start, level reached, run restart, power-up caught) to console + localStorage counters, best-effort (ADR-0005). |
| **NFR-9 — Accessibility baseline** | (a) Non-color-only signals are a rendering contract: enemy damage state (F4 AC6), both invulnerability sources (F7 AC6, F8 AC9), the formation warning (F3 AC6), and pause-menu selection (F6 AC10) each combine shape/animation/text with color in CanvasRenderer/ScreenController. (b) HUD lives in a reserved DOM band with a backing panel/outline for guaranteed contrast over the dynamic canvas background (ADR-0001 is *why* the HUD is DOM). |
| **NFR-10 — Original/clean-IP assets** | All sprites are procedurally drawn original vector shapes with an explicit anti-motif rule (no red-white-blue concentric-star shield, no trademarked robot silhouette), and no third-party wordmarks/logos/fonts are loaded (ADR-0004). |

**Availability:** not applicable in the server sense — there is no server whose
uptime affects play. Availability == the static host serving the bundle, which
deployment-engineer owns.

---

## Risks & Mitigations

| # | Risk | Impact | Mitigation | Owner of follow-up |
|---|---|---|---|---|
| R1 | Frame-rate dips at level 10 (54 enemies + projectiles + per-hit feedback) breach the 30 FPS floor (NFR-2). | Feel/perf regression, fails NFR-2. | Fixed-timestep decouples sim from render so slow frames don't corrupt physics; object pooling for projectiles/power-ups to avoid GC spikes; profile at level 10 during code-review/test. | code-implementer, test-validator |
| R2 | Non-color-only state signals (NFR-9a) implemented as color-only by an implementer taking a shortcut. | Accessibility AC failure (F4 AC6, F7 AC6, F8 AC9, F3 AC6). | Made an explicit rendering contract in §Component responsibilities and per-AC in this doc; ui-ux-designer round-2 gate re-checks. | code-implementer, ui-ux-designer |
| R3 | Timer drift on pause/resume causes power-up or i-frame durations to be lost/gained (F6 AC7, P2's 100% bar). | Correctness AC failure. | Timers are stored as remaining-duration and only decremented while state==PLAYING; the loop simply does not tick simulation in PAUSED, so no wall-clock timer can drift (ADR-0002). | code-implementer |
| R4 | The two Game Over triggers produce two competing screens (UX-B3 / F8 AC8) via race. | Legibility AC failure. | Single per-tick `WinLossSystem` evaluated after all state updates, producing exactly one terminal outcome; both loss triggers map to one "Game Over" (ADR-0002). | code-implementer, test-writer |
| R5 | Level-config drift: an implementer hardcodes a level's numbers instead of reading the table, breaking monotonicity (F4 AC5). | Difficulty-curve AC failure. | Data-driven `LevelConfig` table is the single source; a monotonicity assertion/test over the table is specified for test-writer (ADR-0003). | code-implementer, test-writer |
| R6 | Vector shield/robot art inadvertently reads as a trademarked motif (NFR-10 / F9 AC4). | Legal/IP constraint failure — highest-cost. | Explicit anti-motif design rules in ADR-0004 (no concentric-star red-white-blue shield; no trademarked robot silhouette); security-compliance-reviewer and ui-ux-designer both re-check. | code-implementer, security-compliance-reviewer, ui-ux-designer |
| R7 | `localStorage` unavailable (private mode/quota) throws and breaks the loop (NFR-8). | Gameplay outage from a non-essential feature. | Instrumentation is best-effort, wrapped in try/catch, degrades to console-only; gameplay never depends on it (ADR-0005). | code-implementer |
| R8 | Q7 formation-approach warning (F3 AC6) is later vetoed by the owner. | Rework. | Warning is isolated behind a single config flag in `LevelConfig`/FormationSystem so it can be disabled without touching the loss rule (F3 AC5) — per UX round-2 NB4. | product-manager (owner sign-off) |

---

## Security & Compliance Pre-Check

Run against the `security-compliance-checklist` skill as a pre-check before
security-compliance-reviewer pass 1 (step 6). This surfaces the checklist items
and their disposition for a fully client-side, no-backend, no-data product.

**Application security**
- *Input validation at trust boundaries:* the only runtime input is keyboard
  events; InputManager whitelists the specific keys it acts on and ignores the
  rest — no free-text, no eval, no injection surface.
- *AuthN/AuthZ:* **N/A** — no accounts, no server, nothing to authenticate
  (NFR-6). No client-trusted auth decision exists to get wrong.
- *Secrets:* **none exist** — no API keys, no tokens, no credentials anywhere in
  source, config, or the shipped bundle (there is no server to hold secrets for).
- *Dependency pinning:* dev/build dependencies (Vite, TypeScript, Vitest,
  lint/format) are pinned in `package.json`/lockfile; no runtime third-party
  dependency ships to the player. Keep the lockfile committed and CVE-scanned.
- *Error messages:* the game surfaces player-facing states only; no stack traces,
  paths, or version strings are shown to the player. Instrumentation failures are
  swallowed (ADR-0005).

**Data protection**
- *PII/sensitive fields:* **none collected.** No name, email, IP-derived, or
  behavioral-identifier data is stored. Instrumentation counters are anonymous
  aggregate integers (e.g. "levelReached_5: 3") in the local browser only.
- *Encryption in transit/at rest:* no sensitive data in transit (no network at
  play time); localStorage counters are non-sensitive so at-rest encryption is
  N/A. Serving over TLS is a deployment concern handled by deployment-engineer.
- *Retention / least privilege:* localStorage is per-origin, per-browser, under
  the user's own control; no server-side store to govern.

**Compliance (GDPR/CCPA lens)**
- No personal data is collected or transmitted, so no lawful-basis/consent,
  right-to-deletion, or data-residency obligations are triggered by the
  architecture. If a future version adds any identifier or server telemetry, that
  becomes a new review trigger — flagged here so it isn't missed later.

**Infrastructure / deployment (for deployment-engineer, step 16)**
- No hardcoded credentials/keys in the artifact (there are none to hardcode).
- Container should run as **non-root**, serve **read-only** static assets, and
  needs **no** secrets, database, or outbound network — enforce these in the
  Dockerfile/compose.
- Any CA/TLS material is sourced per the deployment stage's documented process,
  not vendored into this app bundle.

**Pre-check disposition:** no CRITICAL/HIGH items identified at the architecture
level; the dominant residual risk that security-compliance-reviewer should weigh
is **R6 (IP/motif compliance, NFR-10/F9 AC4)**, which is a compliance rather than
an application-security item and is also gated by ui-ux-designer round 2.

---

## Handoff Notes (for code-implementer & security-compliance-reviewer)

- Build to the ADRs: **ADR-0001** (stack + canvas rendering), **ADR-0002**
  (fixed-timestep loop + state machine + deterministic system ordering),
  **ADR-0003** (data-driven level config), **ADR-0004** (procedural vector
  assets + anti-motif rules), **ADR-0005** (instrumentation mechanism).
- Every source file must carry a traceability header comment naming the PRD
  section(s) and ADR(s) it implements (per `traceability-conventions`), e.g.
  `// Implements PRD §F7 (power-ups), ADR-0002 (timer/pause semantics)`.
- Determinism-sensitive ACs (F8 AC8 single-outcome, F6 AC7 no-timer-drift,
  F4 AC5 monotonicity) are called out in §Risks with the responsible test — these
  are the ACs most likely to regress silently, so test-writer should target them.
- Tunable defaults from the PRD (250 ms throw interval F2 AC2, 1.5 s i-frames
  F8 AC9, 8 s power-up durations F7, 10% extra-drop F7 AC1, base speeds/fire
  intervals for the F4 multipliers) live as named constants alongside
  `LevelConfig`, not scattered magic numbers.
