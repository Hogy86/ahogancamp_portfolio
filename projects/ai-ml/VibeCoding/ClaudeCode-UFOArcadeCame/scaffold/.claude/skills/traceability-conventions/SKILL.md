---
name: traceability-conventions
description: Naming and linking rules so every doc, code file, and test can be traced back to the requirement that justifies it. Use across product-manager, solution-architect, and docs-writer.
---

# Traceability Conventions

Inherits invoking subagent's model.

## Linking rule
Every document produced in this pipeline includes a "Sources" section (or
inline references) pointing to the upstream docs that justify its
content:
- PRD sections reference the market docs use case that motivated them.
- Architecture/ADRs reference the PRD requirement driving the decision.
- Code file headers (comment block) reference the PRD section / ADR they
  implement, e.g. `# Implements PRD §3.2, ADR-0004`.
- Tests reference the acceptance criterion they validate.
- Final docs (README, glossary, API docs) reference the PRD/ADR/test
  that backs each claim.

## Naming conventions
- ADRs: `docs/architecture/adr/000N-short-title.md`, numbered
  sequentially, never renumbered after acceptance.
- Reviews: `docs/reviews/code-review-round{N}.md`,
  `docs/security/security-review-v{N}.md`,
  `docs/ux/design-review-round{N}.md` — never overwrite prior rounds.
- Every round/version file stays on disk permanently as the audit trail.

## Why this matters
This is what makes the whole pipeline auditable after the fact — anyone
(including the owner, months later) should be able to start at a line of
code and walk backward to the exact requirement and decision that put it
there.
