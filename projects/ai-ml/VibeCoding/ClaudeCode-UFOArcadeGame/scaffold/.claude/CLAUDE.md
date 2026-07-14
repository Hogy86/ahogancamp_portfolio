# Project Orchestration

This file governs how the main Claude Code session sequences the
subagents in `.claude/agents/` for this project. The owner interacts
with the **main session only** — the main session delegates to
subagents per the pipeline below and enforces the gates.

## Pipeline

```
1.  marketing-analyst            → docs/market/voice-of-customer.md
                                    docs/market/market-goals-and-use-cases.md
2.  product-manager               → docs/PRD.md
                                    [asks owner clarifying questions as needed - Job 0]
3.  ui-ux-designer (round 1)      → docs/ux/design-review-round1.md          [GATE]
4.  solution-architect             → docs/architecture/solution-architecture.md
                                    docs/architecture/adr/000N-*.md
5.  data-storage-architect*        → docs/data/data-model-and-flows.md
6.  security-compliance-reviewer   → docs/security/security-review-v1.md    [GATE]
    (pass 1: architecture + data model)
7.  code-implementer               → application code
8.  code-reviewer                  → docs/reviews/code-review-round{N}.md   [GATE, loop]
9.  test-writer                    → tests
10. test-validator                 → docs/tests/validation-report.md        [GATE]
                                    docs/tests/raw-output-round{N}.log
                                    (full diagnostic detail per failure,
                                    not just pass/fail counts)
11. ui-ux-designer (round 2)       → docs/ux/design-review-round{N}.md      [GATE]
12. security-compliance-reviewer   → docs/security/security-review-v2.md    [GATE]
    (pass 2: final code + data flows)
13. docs-writer                    → docs/README.md, docs/GLOSSARY.md,
                                    docs/api/*
14. product-manager                → docs/tests/uat-plan.md
                                    docs/tests/uat-results.md               [GATE]
    (writes AND runs UAT)
15. it-analyst*                    → docs/deployment/tooling-setup-log.md
16. deployment-engineer            → Dockerfile, docker-compose.yml,
                                    docs/deployment/deployment-notes.md
17. product-manager                → docs/tests/smoke-test-plan.md
                                    docs/tests/smoke-test-results.md        [GATE]
    (writes AND runs smoke tests against the deployed container)

* optional roles — skip if not relevant to this project; see
  "Optional roles" below.
```

## Gate rules

- A step marked `[GATE]` must report **PASS** before the next step
  begins.
- A **FAIL** at any gate routes back to the relevant upstream subagent
  with the findings doc as input, and product-manager surfaces the
  issue to the owner (per its Job 0) if it changes scope, risk, or
  direction — not every FAIL needs owner input, but ambiguous or
  costly ones do.
- `code-implementer` ↔ `code-reviewer` (steps 7-8) loop until PASS —
  don't advance to `test-writer` on a FAIL.
- Reviewer/validator subagents (`code-reviewer`, `test-validator`,
  `security-compliance-reviewer`, `ui-ux-designer`) are invoked with
  **only file paths and spec documents** — never the writer subagent's
  own explanation of its work. This is what keeps the review
  independent.
- `deployment-engineer` (step 16) cannot start until step 14's UAT
  report is PASS.
- The project is not considered complete until step 17's smoke test
  report is PASS.

## Optional roles

- **`data-storage-architect`** (step 5): include only if the product
  has meaningful logging, product-data-feed, or usage-analytics needs.
  If skipped, security-compliance-reviewer's pass 1 (step 6) reviews
  architecture only.
- **`it-analyst`** (step 15): include only if the deployment
  environment needs infra tooling installed beyond what
  `deployment-engineer` assumes is already present. If skipped, go
  directly from step 14 to step 16.

## Model policy

- Each subagent's model is set in its own frontmatter (`model:` field)
  — see the table below for the rationale behind each assignment.
- Default: subagents use their frontmatter model. Do not override
  per-project unless there's a specific cost or quality reason.
- To impose a session-wide cost ceiling (e.g. for a low-stakes/throwaway
  run), set `CLAUDE_CODE_SUBAGENT_MODEL` before starting the session —
  this overrides all individual frontmatter settings, so use
  deliberately:
  ```bash
  export CLAUDE_CODE_SUBAGENT_MODEL="sonnet"
  ```
- **Never downgrade `security-compliance-reviewer` or `code-reviewer`
  below `sonnet`**, even under a cost ceiling — these are the
  independence gates the whole pipeline depends on for catching real
  issues.

| Subagent | Model | Rationale |
|---|---|---|
| marketing-analyst | sonnet | Research synthesis, not high-stakes judgment |
| product-manager | opus | Ambiguity resolution + owner-facing judgment calls cascade downstream |
| ui-ux-designer | sonnet | Heuristic-driven critique, well-scoped by skill |
| solution-architect | opus | Architecture/stack tradeoffs reward stronger reasoning |
| data-storage-architect | sonnet | Structured schema design given standards |
| security-compliance-reviewer | opus | Highest cost-of-error role in the pipeline |
| code-implementer | sonnet | Handles most implementation at a fraction of the cost |
| code-reviewer | opus | Independent reviewer should reason harder than the implementer |
| test-writer | sonnet | Structured translation of acceptance criteria into tests |
| test-validator | sonnet | Structured verification of test quality/coverage |
| docs-writer | haiku | Templated generation from already-decided content |
| it-analyst | haiku | Mostly running commands and logging output |
| deployment-engineer | sonnet | Real reasoning needed for env-specific Docker/cert config |

## Traceability

Every doc produced by this pipeline lives under `docs/` and is never
overwritten — reviews and reports are versioned (`-round1`, `-v1`, `-v2`,
etc.) so the full history is auditable. See the
`traceability-conventions` skill for the exact linking rules.

## Owner interaction

The owner talks to the main session, not to individual subagents
directly. `product-manager` is the one subagent explicitly responsible
for surfacing decisions, ambiguities, and gate failures to the owner
with recommended options — see its Job 0. If the main session is
unsure whether something needs owner input, default to asking via
product-manager rather than guessing.
