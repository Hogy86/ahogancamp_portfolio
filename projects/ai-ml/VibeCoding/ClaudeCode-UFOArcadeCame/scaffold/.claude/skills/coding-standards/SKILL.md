---
name: coding-standards
description: Style, error handling, and logging conventions applied consistently by code-implementer and checked by code-reviewer.
---

# Coding Standards

Inherits invoking subagent's model. Both code-implementer and
code-reviewer load this so they're working against the same bar.

## Style
- Follow the idiomatic style/linter for the chosen language (document
  the specific linter/formatter in solution-architecture.md).
- Functions do one thing; prefer small, named functions over long
  inline logic.
- No dead code, no commented-out blocks left in place.

## Error handling
- Never swallow exceptions silently — log or propagate with context.
- User-facing errors are actionable and don't leak internals (see
  security-compliance-checklist).
- Fail fast on invalid input at trust boundaries.

## Logging
- Structured logs (not free-text string concatenation).
- Include correlation/request IDs where the data-storage-architect's
  logging schema defines them.
- No PII/secrets in log lines.

## Documentation in code
- Public functions/endpoints have a docstring/comment describing intent,
  not just restating the function name.
- Non-obvious decisions get a one-line "why" comment.

## What code-reviewer checks against this skill
- Conformance to the above, PASS/FAIL per category.
- Any deviation must be justified in the code review findings, not
  silently waved through.
