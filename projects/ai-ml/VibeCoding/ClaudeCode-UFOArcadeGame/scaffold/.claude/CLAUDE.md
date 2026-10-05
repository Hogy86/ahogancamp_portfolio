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

---

# Mobile Pipeline (Android)

A second team in `.claude/agents/` (every file prefixed `mobile-`)
builds the Android app of this same game, wrapped with Capacitor. The
website pipeline above is unchanged; use this pipeline for any work on
the Android app. The same orchestration rules apply: the owner talks
to the main session, the main session calls one subagent at a time,
subagents hand off through the docs they write, and reviewers see only
files and specs.

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

- The website gate rules above apply here too: a `[GATE]` must report
  PASS before the next step; a FAIL routes back to the owning writer
  with the findings doc as input; mobile-product-manager raises it
  with the owner only if it changes scope, cost, or risk.
- `mobile-junior-developer` ↔ `mobile-lead-developer` (steps 7-8) loop
  until PASS. A FAIL at step 10 or 11 routes back to step 7, then
  through step 8 again, then re-runs only the gate that failed (see
  "Change lanes").
- Only findings marked **required** block a gate. **Suggested**
  findings are logged and batched into the next change that touches
  the same files; they never start a review round on their own.
- If the same gate fails 3 rounds in a row, stop looping and have
  mobile-product-manager put the remaining findings to the owner with
  a recommendation (fix, accept, or defer).

## Change lanes (after the first full run)

The full pipeline runs once. After that, the main session sizes every
change and runs only the gates the change can affect. It writes the
lane and the gates it chose into the commit message.

| Lane | Typical change | Gates |
|---|---|---|
| Small | art or icon, text, spacing, one-file bug fix, test-only change | step 8 (one review); step 10 on the affected devices only; step 11 only if something visible changed |
| Medium | new UI element, input or layout logic, several files | steps 8, 9 (new criteria only), 10, 11; step 14 for the affected scenarios only |
| Large | new dependency or Capacitor plugin, AndroidManifest, permissions, storage schema, network, build config | all gates from step 7, including step 12 |

- Step 12 (security) runs only for Large changes, or when a change
  touches anything on the trigger list in
  mobile-security-compliance-reviewer. Art, names, and text that could
  look like third-party IP go to it as a single question, not a full
  pass.
- When unsure between two lanes, pick the larger one.

## Shared (web + Android) changes

The one-codebase rule needs every shared change checked for BOTH
versions; it does not need two separate review chains. For a change
under `src/`:
- `mobile-lead-developer` reviews it once, against both the website
  and Android expectations, and runs the website checks too. The
  website `code-reviewer` is not called a second time on the same diff.
- `mobile-lead-tester`'s run includes the website test suite, which
  covers the website test gate.
- The website `ui-ux-designer` runs only if the change alters what a
  desktop browser player sees.

## Keeping runs lean

Tokens are the pipeline's real limit (runs have repeatedly stopped on
usage limits), so every mobile agent follows these rules:
- **Logs go to files, not context.** Redirect build, test, and
  emulator output to a log under `docs/mobile/tests/` (or a temp
  file), then read only the summary and the failures. Never stream a
  full test run or Gradle build into the conversation.
- **Read sections, not whole docs.** docs/mobile/PRD-mobile.md is
  large. Find the acceptance criteria and decisions a change touches
  (grep for their IDs or headings) and read those sections. Read a
  whole doc only on an agent's first run.
- **Re-reviews are deltas.** Round 2 and later read the previous
  findings doc and the diff since that round, confirm each required
  finding is fixed, and check the diff for regressions. They do not
  re-review unchanged code.
- **Hand-offs carry paths and IDs.** The main session passes changed
  file paths, the commit range, and the criterion IDs in play, so the
  next agent knows where to look without re-deriving it. Reviewers
  still never get the writer's explanation of its own work.
- **Builds run once per change by whoever needs them.** The junior
  developer runs the full checks before hand-off and saves the log; the
  lead developer re-runs typecheck, lint, and the affected tests, and
  re-runs the Android debug build only when native config, Gradle, or
  Capacitor files changed.

## Tool requests

Any mobile subagent that needs a tool installed (Android SDK packages,
an emulator image, a JDK version, etc.) appends a line to
`docs/mobile/tooling-requests.md` — what, why, and which agent — and
stops. The main session then calls `mobile-it-analyst`, and re-runs the
requesting agent once the request is marked done. mobile-it-analyst
escalates anything needing the owner's account, password, payment, or
a large download through mobile-product-manager.

## One codebase (owner decision)

The website and the Android app are built from the same `src/`, and
this is not negotiable without the owner:

- Game rules and logic exist once. Only touch input, screen fitting,
  back button, and lifecycle code may be platform-specific.
- Any change to game rules or design — whether it starts from the
  website pipeline or this one — updates the shared acceptance criteria
  in docs/PRD.md (or its addenda) AND docs/mobile/PRD-mobile.md where
  mobile behavior changes, and must pass the code review, test, and UX
  gates for BOTH the website and the Android app before either ships.
  One combined review can cover both; see "Shared (web + Android)
  changes".
- `.github/workflows/deploy-pages.yml` is the single CI check for both
  versions. Once the Android project exists, the Android debug build
  and the phone-emulation tests are added to it, so a change that
  breaks either version blocks the website deploy until fixed.
- Never hand-edit the web assets copied into `android/`; rebuild and
  `npx cap sync android`.

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
