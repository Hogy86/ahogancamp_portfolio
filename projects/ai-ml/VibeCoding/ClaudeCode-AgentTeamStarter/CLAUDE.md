# Project orchestration

This file governs how the main Claude Code session runs the subagents in
`.claude/agents/`. It holds only what applies to **every** change; every
session loads it, so keep it short. The full pipelines live in skills that
load only for a large change. The token rules every agent follows are in
the `lean-runs` skill.

## Start here

- **No `.claude/team.json` yet?** The project has no team. Load the
  `project-setup` skill and do that first: Claude proposes the team, the
  owner approves it, then it is built and installed. Nothing else starts
  before that.
- Otherwise read "This project" below and `docs/spec/INDEX.md`, then size
  the change.

## This project

<!-- Filled in by the project-setup skill. -->
- **Name:** _not set up yet_
- **What it is:** _one line_
- **Pack:** _pack id and modules, from .claude/team.json_
- **Core team:** _builder, reviewer, tester per module_
- **Quiet checks:** _the check:quiet commands agents run_
- **Release scope:** _for example "website deploy; Android stops at the emulator, no store release"_
- **Avoid:** _names, brands or IP to stay clear of; anything else the owner ruled out_

<!-- pack-rules:start (written by npm run pack:install; edit packs/<id>/claude-rules.md instead) -->
<!-- pack-rules:end -->

## Sizing a change

Before any work starts, the main session sizes the change as small, medium
or large, tells the owner the size and the team, and records both in the
commit message.

| Size | Team |
|---|---|
| Small | The core team of 3 |
| Medium | The full team if at least 5 roles each need a distinct piece of work; otherwise the core team |
| Large, or the first version | The full team: load the module's full-pipeline skill and run every step |

- When unsure between two sizes, pick the larger one.
- The IT analyst still handles tool installs alongside the core team.
- **Re-sizing mid-change:** re-size if the reviewer reports the change touches
  security-sensitive areas (dependencies, permissions, build or deploy
  config, stored data or its schema, network calls, secrets) or needs a new
  architecture decision (ADR).

## Core team

The flow is builder, then reviewer (loop until PASS), then tester (a FAIL
goes back to the builder, then the reviewer).

- **Builder:** the code, plus new or updated tests for the criteria the
  change touches.
- **Reviewer (read-only):** one independent review of code, tests, UX,
  security and IP, using the checklists it loads.
- **Tester:** the test suites and the acceptance scenarios the change
  affects.

With the core team, the main session does the product manager's job: it
asks the owner questions with a recommendation for each, writes the change
spec in `docs/spec/changes/`, and updates `docs/spec/INDEX.md`.

## Launching agents (model and folder)

- Each agent's model is the `model:` line in its own file. Launch agents by
  name; they register because `.claude/` is at the repo root.
- If an agent isn't registered (for example the project sits in a
  subfolder of a bigger repo), launch a general-purpose agent with the role
  file as its instructions and **pass that file's `model:` explicitly**.
  Otherwise it runs on the session's model.
- Never downgrade a reviewer below sonnet. Don't set
  `CLAUDE_CODE_SUBAGENT_MODEL`; it forces one model on every agent.

## Hand-off template

Record the starting commit before the builder begins, and pass each later
agent exactly this:

```
Folder:      <repo-relative path, "." at the root>
Branch:      <branch>
Commits:     <start-sha>..HEAD      (the agent runs git diff on this itself)
Changed:     <file paths>
Criteria:    <IDs>
Spec:        docs/spec/changes/<file>, plus the sections docs/spec/INDEX.md lists for those IDs
Round:       <N>; for N > 1, the previous findings doc
```

Reviewers and testers never get the builder's explanation of its work.

## Gate rules, every change

- A gate (reviewer, tester, acceptance test) must report PASS before the
  next step. A FAIL goes back to the builder with the findings doc.
- Only **required** findings block a gate; **suggested** ones ride the next
  change to the same files.
- After 3 failed rounds on the same gate, stop and put the remaining
  findings to the owner with a recommendation (fix, accept, or defer).

## Main session: keeping runs lean

The agents follow `lean-runs`. The main session also:
- starts each change in a fresh session (a new message in the Claude
  project, or `/clear` locally);
- passes paths and IDs, not file contents, and never pastes logs into a
  hand-off;
- keeps a run ledger (`docs/run-ledger-template.md`) when the owner asks
  for one, so the next run can be compared.

## Other rules

- **Spec layout:** `docs/spec/INDEX.md` is the map, one line per feature.
  Each change has its own spec in `docs/spec/changes/`. Feature files in
  `docs/spec/features/` hold the current text of a feature; whoever writes
  a change spec updates them and the index line in the same commit.
- **Traceability:** docs are never overwritten; reviews and reports are
  versioned (`-round1`, `-v2`). Details: `traceability-conventions`.
- **Decisions:** each owner decision gets one line in `docs/decisions.md`.
- **Agent changes:** edit agents in `packs/`, then `npm run pack:install`
  and `npm run agents:check`. The check runs on every PR and blocks an
  agent that drops its model, `lean-runs`, or read-only reviewing.
