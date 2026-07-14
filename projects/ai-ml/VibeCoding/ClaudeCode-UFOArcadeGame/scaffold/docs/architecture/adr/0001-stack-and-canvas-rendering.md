# ADR 1: Tool stack (TypeScript + Vite, no framework, no backend) and Canvas 2D rendering

## Status: Accepted

**Date:** 2026-07-06
**Author:** solution-architect subagent
**Sources:** `docs/PRD.md` NFR-1..NFR-7, NFR-9(b), NFR-10, F3, F4; evaluated
against the `tool-stack-decision-criteria` skill.

## Context

The PRD requires a single-player, browser-based 2D arcade shooter that is **fully
client-side with no backend, no account, and no install** (NFR-6, NFR-7), loads to
first input in **≤3 s** (NFR-1), sustains **60 FPS** with a **≥30 FPS floor** at a
full 54-enemy formation (NFR-2), and works on the **latest 2 versions** of the
major desktop browsers (NFR-4). It is a **v1, demo-scale, 10-level, single-session**
product with no persistence, no networked play, and no third-party integrations
(Out of Scope §). Two coupled decisions must be made together: (a) the overall tool
stack, and (b) how the playfield is drawn (canvas vs. DOM/CSS sprites), because the
rendering choice is the dominant driver of the 60-FPS NFR.

## Decision

Build the game as a **single-page application in TypeScript**, bundled with
**Vite**, with **no runtime UI framework and no backend/database**, rendering the
playfield to a single **HTML5 Canvas 2D** context. The persistent HUD and the
non-play screen overlays (title, pause, Game Over, Victory) are rendered as **DOM
elements layered over the canvas** — this hybrid split is deliberate (see
Consequences).

Rationale mapped to the `tool-stack-decision-criteria` skill is tabulated in
`solution-architecture.md` §Tool Stack. In brief: it maximizes team familiarity
(standard web tech, no engine ramp-up), matches the fixed/tiny scaling profile
(one tab, ≤54 enemies, no server to scale), uses only permissive licenses
(TypeScript Apache-2.0, Vite MIT — no GPL/AGPL), runs anywhere static files can be
served including offline/air-gapped (NFR-6/7), needs no exotic ecosystem
integrations (no auth/payments), has the lowest possible operational cost (no
managed services), and rests on long-lived, actively-maintained standards.

## Alternatives Considered (and why rejected)

**A. Heavy 2D game engine (Phaser 3, PixiJS, or similar).**
Rejected. These would comfortably hit the perf target, but they are
over-engineering for a demo-scale, 10-level Space-Invaders clone: they add a large
runtime dependency (hurting NFR-1 load budget and bundle size), impose an
engine-specific programming model that raises the maintenance ramp-up
(criterion 1, team familiarity), and bring a scene/asset/state framework the PRD
doesn't need. PixiJS is a WebGL renderer whose power is wasted on ≤54 flat vector
sprites. The whole game's simulation fits in a few hundred lines of plain systems;
an engine's abstractions would obscure the traceability this pipeline values more
than they'd save.

**B. A UI framework (React / Vue / Svelte) driving the whole app.**
Rejected for the *game field*. A 60-FPS game loop mutates dozens of entities every
frame; a virtual-DOM/reactive framework's diffing model is the wrong tool for
that hot path and would add latency and GC pressure against NFR-2/NFR-3, plus a
runtime dependency against NFR-1. The menus/HUD *could* use a framework, but they
are simple enough that adding one just for them is unjustified weight for a v1.
Plain DOM for the HUD/overlays keeps the dependency count at zero.

**C. DOM/CSS-positioned sprites for the playfield (no canvas).**
Rejected — this is the key rendering call. Representing every enemy, projectile,
and power-up as a positioned DOM node means the browser must reflow/repaint dozens
of nodes every frame. At level 10 (54 enemies + a stream of projectiles and
per-hit feedback) this risks layout thrash and breaching the 30 FPS floor (NFR-2),
and gives far less control over per-frame draw cost. Canvas 2D immediate-mode
drawing renders the entire scene in one pass with no per-entity DOM cost, is the
industry-standard approach for this class of game, and leaves ample headroom in
the 16.6 ms budget for the required non-color-only damage/invulnerability/warning
effects (NFR-9a). Canvas is therefore chosen for the field. (DOM is retained only
for the HUD/overlays, where crisp text, guaranteed contrast per NFR-9(b), and
keyboard-navigable menus per F6 AC10 are easier and more accessible in DOM than
hand-drawn on canvas.)

**D. WebGL directly (raw or via a thin wrapper).**
Rejected. WebGL's throughput is unnecessary for ≤54 flat 2D shapes; it adds
shader/context complexity and a steeper maintenance burden (criterion 1) for zero
benefit at this scale, and slightly widens the browser-compat surface vs. the
rock-stable Canvas 2D (criterion 7).

**E. Any backend / database / server-rendered approach.**
Rejected outright — it directly violates NFR-6 (no install/account) and NFR-7
(fully client-side, no server dependency), and would add operational cost
(criterion 6) and a data-protection surface (criterion 3/hosting) for a product
that collects no data and needs no server. Session-only score (F10) and
best-effort instrumentation (NFR-8) are satisfiable entirely client-side
(ADR-0005), so no backend is warranted.

## Consequences

- **Positive:** zero runtime third-party dependencies in the shipped bundle
  (smallest attack surface and load footprint — good for NFR-1 and the security
  pre-check); trivially deployable as static files anywhere including offline;
  full control of the render loop for NFR-2/NFR-3; permissive licensing throughout.
- **Hybrid canvas+DOM boundary:** the code must maintain a clean split — game
  entities render to canvas, HUD/overlays are DOM synced from a HUD view-model
  each tick. This is a deliberate seam (accessibility/contrast for HUD, raw perf
  for the field), documented so code-implementer doesn't blur it.
- **No engine "batteries":** collision, pooling, scene management, and input are
  hand-rolled. That's a modest amount of code but keeps everything legible and
  traceable; ADR-0002 defines the loop/state structure that organizes it.
- **Perf must be verified, not assumed:** the level-10 frame budget (Risk R1) is
  called out for profiling during code-review/test even though headroom is
  expected.
