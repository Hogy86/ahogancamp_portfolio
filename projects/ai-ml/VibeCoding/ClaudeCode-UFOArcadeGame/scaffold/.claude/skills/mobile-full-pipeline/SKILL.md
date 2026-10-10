---
name: mobile-full-pipeline
description: The mobile (Android) team's full 14-step pipeline, parked release steps, scope, gate rules, model table and where each step runs. Load only when an Android change is sized large (or is a new project) under CLAUDE.md "Sizing a change"; small and medium changes use the mobile core team in CLAUDE.md instead.
---

# Mobile full pipeline

Moved out of `.claude/CLAUDE.md` on 2026-10-10 (token-tuning PR) so it is
read only when a change actually runs all 12 `mobile-` roles. The text
below is unchanged from that file. The global rules that apply to every
change (sizing, core teams, shared changes, keeping runs lean, one
codebase, launching agents with the right model) stay in CLAUDE.md.

## Pipeline

```
1.  mobile-marketing-analyst          → docs/mobile/market/play-store-research.md
                                        docs/mobile/market/listing-draft.md
2.  mobile-product-manager            → docs/mobile/PRD-mobile.md
                                        [asks owner as needed - Job 0]
3.  mobile-ui-ux-designer (round 1)   → docs/mobile/ux/design-review-round1.md   [GATE]
                                        docs/mobile/ux/store-assets-spec.md
4.  mobile-solution-architect         → docs/mobile/architecture/mobile-architecture.md
                                        docs/mobile/architecture/adr/000N-*.md
5.  mobile-security-compliance-reviewer → docs/mobile/security/review-v1.md    [GATE]
    (pass 1: architecture)
6.  mobile-it-analyst                 → docs/mobile/tooling-setup-log.md
    (initial setup; also on request at any step - see below)
7.  mobile-junior-developer           → application code
8.  mobile-lead-developer             → docs/mobile/reviews/code-review-round{N}.md [GATE, loop]
9.  mobile-junior-tester              → tests
                                        docs/mobile/tests/manual-only-criteria.md
10. mobile-lead-tester                → docs/mobile/tests/validation-report.md  [GATE]
                                        docs/mobile/tests/raw-output-round{N}.log
                                        docs/mobile/tests/device-matrix.md
11. mobile-ui-ux-designer (round 2)   → docs/mobile/ux/design-review-round{N}.md [GATE]
12. mobile-security-compliance-reviewer → docs/mobile/security/review-v2.md    [GATE]
    (pass 2: final app; Large changes only after the first run)
13. mobile-technical-writer           → docs/mobile/README-mobile.md
14. mobile-product-manager            → docs/mobile/tests/uat-plan.md
                                        docs/mobile/tests/uat-results.md       [GATE]
    (writes AND runs UAT on the emulator - the pipeline ends here)

Parked (owner decision 2026-10-05: stop at a build that works in the
emulator; no Play Store release). Do not run these unless the owner
reopens the release:
15. mobile-release-engineer           → signed .aab on the closed testing track
16. mobile-product-manager            → closed test (12 testers, 14 days)
17. mobile-release-engineer           → production release
```

## Scope (owner decision, 2026-10-05)

Done means: the debug build installs and plays on the emulator device
matrix and UAT passes. Out of scope until the owner says otherwise:
developer account, upload key and signing, Data safety and content
rating answers, store listing and graphics, closed test, production.
Agents skip any process step that only serves those.

## Mobile gate rules

- The gate rules in CLAUDE.md ("Gate rules, every change") and the
  website-full-pipeline skill apply here too: a `[GATE]` must report
  PASS before the next step; a FAIL routes back to the owning writer
  with the findings doc as input; mobile-product-manager raises it
  with the owner only if it changes scope, cost, or risk.
- `mobile-junior-developer` ↔ `mobile-lead-developer` (steps 7-8) loop
  until PASS. A FAIL at step 10 or 11 routes back to step 7, then
  through step 8 again, then re-runs only the gate that failed.
- Only findings marked **required** block a gate. **Suggested**
  findings are logged and batched into the next change that touches
  the same files; they never start a review round on their own.
- If the same gate fails 3 rounds in a row, stop looping and put the
  remaining findings to the owner (via mobile-product-manager in a
  full run, or directly with the core team) with
  a recommendation (fix, accept, or defer).

## Model policy (mobile)

Same policy as the website team. Never downgrade
`mobile-security-compliance-reviewer` or `mobile-lead-developer` below
`sonnet`.

| Subagent | Model | Rationale |
|---|---|---|
| mobile-marketing-analyst | sonnet | Research synthesis |
| mobile-product-manager | opus | Owner-facing judgment calls cascade downstream |
| mobile-ui-ux-designer | sonnet | Heuristic-driven critique, scoped by skills |
| mobile-solution-architect | opus | Platform-boundary and lifecycle tradeoffs |
| mobile-security-compliance-reviewer | opus | Highest cost-of-error: Play rejection, leaked key |
| mobile-junior-developer | sonnet | Most implementation at a fraction of the cost |
| mobile-lead-developer | opus | Independent reviewer reasons harder than the implementer |
| mobile-junior-tester | sonnet | Acceptance criteria → tests |
| mobile-lead-tester | sonnet | Structured verification + device matrix |
| mobile-technical-writer | haiku | Templated generation from decided content |
| mobile-it-analyst | haiku | Running installers and logging output |
| mobile-release-engineer | sonnet | Parked while release is out of scope |

## Where it runs

Everything in this pipeline runs on the owner's Windows desktop (or a
cloud session for steps that need no emulator). Steps 6, 10, and 14
need the Android SDK and emulator, so run them on the owner's machine.
