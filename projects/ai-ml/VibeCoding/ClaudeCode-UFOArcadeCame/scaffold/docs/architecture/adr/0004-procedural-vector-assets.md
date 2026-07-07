# ADR 4: Procedurally-drawn vector assets with explicit anti-motif IP rules

## Status: Accepted

**Date:** 2026-07-06
**Author:** solution-architect subagent
**Sources:** `docs/PRD.md` F9 (theme & first-run legibility), F9 AC4 / NFR-10
(hard IP constraint), F4 AC6 (damage-state legibility), F7 AC6 & F8 AC9
(invulnerability visibility), F3 AC6 (formation warning), NFR-1, NFR-9(a).

## Context

The game needs visual art for Vanguard (an original shield-throwing hero), Sentinel
robots (with a boss variant), the shield projectile, enemy lasers, power-up icons
(4 types), and the various state overlays. Two hard constraints shape this:

1. **NFR-10 / F9 AC4 (binding, non-contingent):** all art must be **fully original**
   with **no licensed names, likenesses, or trademark-adjacent motifs** — explicitly
   **no red-white-blue concentric-star shield**, no trademarked robot silhouette, no
   third-party wordmarks/logos.
2. No art-generation pipeline (no artist, no sprite-sheet tooling, no image-gen
   asset workflow) is assumed available for v1, and NFR-1 caps load time at ≤3 s.

Additionally, several states must be **non-color-only** (NFR-9a): enemy damage
between hits (F4 AC6), invulnerability from both sources (F7 AC6, F8 AC9), the
formation-approach warning (F3 AC6).

## Decision

Draw **all game-field art procedurally as vector shapes on the canvas** (paths,
polygons, arcs, gradients drawn with the Canvas 2D API) rather than shipping raster
sprite images or an external sprite sheet. Concretely:

- Vanguard, Sentinels, the boss, the shield, lasers, and the four power-up icons are
  each a small parameterized draw function composing simple geometric primitives.
- **State variation is a draw parameter, not a separate asset:** damage state
  (F4 AC6) changes shape/adds cracks/alters outline weight *and* color; both
  invulnerability sources (F7 AC6, F8 AC9) add a blink/aura outline overlay; the
  formation warning (F3 AC6) adds a pulsing border plus a shape/text cue — each
  combining a **non-color signal with color** so NFR-9(a) is met by construction.

**Explicit anti-motif design rules (binding on the draw functions):**
- The shield is a **distinct original design** — e.g. a plain angular/hex or kite
  form or a simple banded disc. It **must not** be a red-white-blue disc with
  concentric rings and a central star, nor any composition that reads as a specific
  trademarked hero's shield.
- Sentinel robots use **generic geometric robot forms** (blocky/angular bodies,
  simple optical sensor) and **must not** replicate any trademarked robot
  character's model, proportions, or silhouette.
- **No third-party wordmarks, logos, character names, or likenesses** appear
  anywhere. Any text uses a **self-hosted or system font stack** — no third-party
  hosted webfont is loaded (also preserves the offline guarantee, NFR-7).

## Alternatives Considered (and why rejected)

**A. Raster sprite images / a sprite sheet.**
Rejected for v1. It presupposes an art-production pipeline the project does not
have, adds binary assets to load (mild NFR-1 cost), and — most importantly —
raises IP risk: hand-drawn or sourced raster art is easier to accidentally make
"trademark-adjacent" and harder to audit than a handful of explicit geometric draw
functions whose exact shapes are visible in code. Procedural shapes make the
anti-motif rules (NFR-10) reviewable line-by-line. Can be revisited post-v1 if an
art pipeline exists.

**B. AI/image-generated sprites.**
Rejected. No such pipeline is assumed available, and generated art carries the
highest provenance/IP-ambiguity risk against a **hard** NFR-10 constraint — the
opposite of what a binding IP requirement wants. Explicitly out.

**C. Third-party icon libraries / free game-art packs.**
Rejected. Introduces external assets whose licenses and originality must be audited
(criterion 3 licensing, and NFR-10 originality), and risks motif collisions. Not
worth the audit burden for a handful of simple shapes that are cheaper to draw.

**D. Emoji / Unicode glyphs as sprites.**
Rejected. Rendering is font/platform-dependent (breaks visual consistency across
the NFR-4 browser matrix), gives no control over the required non-color state
variations (NFR-9a), and some glyphs could read as third-party-adjacent. Not
controllable enough.

## Consequences

- **Positive:** near-zero asset load (draw code only) helps NFR-1; the exact art is
  in source and auditable, so NFR-10/F9 AC4 compliance is reviewable by
  security-compliance-reviewer and ui-ux-designer directly against the draw
  functions (Risk R6); state variations reuse the same draw function with a
  parameter, keeping NFR-9(a) consistent.
- **Constraint / review hook:** the anti-motif rules above are binding acceptance
  input — code-implementer must follow them and both the security and UX gates
  re-verify the shield is not a trademarked-shield callback and robots are generic
  (Risk R6). This is the single highest-cost compliance item in the project.
- **Aesthetic ceiling:** procedural vector art is simpler-looking than bespoke
  sprites; acceptable and on-brand for a minimalist v1 arcade demo, and it does not
  compromise first-run legibility (F9 AC1) since the shapes are chosen to read
  clearly as hero/robots.
- **Fonts:** the one-line control text (F9 AC2) and HUD (NFR-9b) use the self-hosted
  or system font stack — no external font dependency.
