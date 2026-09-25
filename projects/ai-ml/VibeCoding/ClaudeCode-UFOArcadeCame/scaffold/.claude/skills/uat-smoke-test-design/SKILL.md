---
name: uat-smoke-test-design
description: What makes a good UAT scenario vs. a good smoke test. Use by product-manager for both UAT and smoke-test stages.
---

# UAT & Smoke Test Design

Inherits invoking subagent's model.

## UAT scenarios
- Written from the end user's perspective, in plain language (not
  developer/technical framing).
- Each scenario traces to a specific PRD acceptance criterion — no
  orphan scenarios, no uncovered criteria.
- Cover the primary happy path per major use case, plus at least one
  realistic failure/edge case per use case.
- A scenario is written as: Given [context], When [user action], Then
  [expected outcome] — and must be actually executed, not just described.

## Smoke tests
- Fast (seconds, not minutes) and infra-focused: is the thing actually
  up and minimally usable?
- Typical checks: health endpoint responds, core user flow completes
  end-to-end once, no TLS/cert errors, no 5xx on primary routes.
- Binary pass/fail — smoke tests are not the place for nuanced
  assertions; that's what UAT and the earlier test suite are for.
- Run against the actual deployed container, not a local dev build.

## Gate discipline
- UAT PASS is required before deployment-engineer builds the final
  container for production use.
- Smoke test PASS is required before the pipeline is considered
  complete — a failure here means back to deployment-engineer (infra
  issue) or further back (functional issue), not a silent re-mark.
