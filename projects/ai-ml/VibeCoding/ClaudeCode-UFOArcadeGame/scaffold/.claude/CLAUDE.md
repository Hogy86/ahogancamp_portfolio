# Project Orchestration

This file governs how the main Claude Code session runs the subagents in
`.claude/agents/` for this game. Two teams share one codebase: the website
team and the Android team (every file prefixed `mobile-`). The owner talks
to the main session only; the main session sizes each change, calls one
subagent at a time, and enforces the gates. Subagents hand off through the
docs they write.

This file holds only what applies to **every** change. The full pipelines
live in two skills, loaded only for a large change or a new project:
`website-full-pipeline` and `mobile-full-pipeline` (moved there on
2026-10-10 to keep every agent's context small).

## Sizing a change (owner rule, 2026-10-05, both teams)

Before any work starts, whether on a new project or a change to an existing
one, the main session sizes the effort as small, medium, or large. It tells
the owner the size and the team it will use, and records both in the commit
message.

| Size | Team |
|---|---|
| Small | That team's core team of 3 |
| Medium | The full team if the change needs a distinct piece of work (a change, design, or review of its own) from at least 5 of that team's roles; otherwise the core team of 3 |
| Large, or a new project | The full team: load that team's full-pipeline skill and run every step |

Example of a medium change that uses the full team: a security fix that
forces UI rework needs distinct work from the security reviewer, developer,
tester, UX designer, and solution architect. That's 5 roles, so it runs the
full pipeline.

- When the count is unclear, list the roles and what each would do, then
  count. When unsure between two sizes, pick the larger one.
- **Installing tools:** the IT analyst (`it-analyst` or
  `mobile-it-analyst`) still handles tool installs with the core team,
  because it sets up the machine rather than working on the change.
- **Re-sizing mid-change:** if the core-team reviewer reports that a change
  touches security-sensitive areas (dependencies or plugins, manifest or
  permissions, build or deploy config, stored data or its schema, network
  calls, WebView settings, files that could hold secrets) or needs a new or
  changed architecture decision (ADR), the main session re-sizes the change
  by this rule before continuing.
- A shared change under `src/` affects both versions. Count the roles on the
  team that owns the change, and see "Shared (web + Android) changes".

## Core teams

| Team | Builder | Reviewer (read-only) | Tester |
|---|---|---|---|
| Website | `code-implementer` | `code-reviewer` | `test-validator` |
| Android | `mobile-junior-developer` | `mobile-lead-developer` | `mobile-lead-tester` |

- **Builder:** code, plus new or updated tests for the criteria the change
  touches.
- **Reviewer:** one independent review of code, tests, UX, security, and IP
  (the Android reviewer covers web and app).
- **Tester:** the full test suites and the UAT scenarios the change affects;
  for Android also the emulator device matrix and screenshots.

The flow is builder, then reviewer (loop until PASS), then tester (a FAIL
goes back to the builder, then the reviewer). The main session does the
product manager's job: it asks the owner questions with a recommendation
for each, writes the change spec (`docs/PRD-addendum-vN.md`), and updates
`docs/spec/INDEX.md`. No other agent runs except the IT analyst for tool
installs. The GitHub Pages workflow deploys the website.

## Launching agents (model and folder)

- Each agent's model is the `model:` line in its own file. Launch it by name
  when the agents are registered (a session started in this `scaffold`
  folder).
- **A session started at the repo root (every cloud session) does not
  register these agents.** Then launch a general-purpose agent, give it the
  role file's text as its instructions, and **pass that file's `model:`
  explicitly**. Without it the agent runs on the session's model; that's how
  the v7 builder ran on opus instead of sonnet.
- Tell every agent the working folder:
  `projects/ai-ml/VibeCoding/ClaudeCode-UFOArcadeGame/scaffold`.
- Never downgrade a reviewer (`code-reviewer`, `security-compliance-reviewer`,
  `mobile-lead-developer`, `mobile-security-compliance-reviewer`) below
  sonnet, even under a cost ceiling.
- The model table and its rationale are in the full-pipeline skills.

## Hand-off template

The main session records the starting commit before the builder begins,
and passes each later agent exactly this:

```
Folder:      projects/ai-ml/VibeCoding/ClaudeCode-UFOArcadeGame/scaffold
Branch:      <branch>
Commits:     <start-sha>..HEAD      (the agent runs git diff on this itself)
Changed:     <file paths>
Criteria:    <IDs, e.g. F23 AC4, M8.2>
Spec:        docs/PRD-addendum-vN.md, plus the sections docs/spec/INDEX.md lists for those IDs
Round:       <N>; for N > 1, the previous findings doc
```

Reviewers and testers never get the builder's explanation of its work; they
work from the diff, the files, and the spec. A reviewer starts from the diff
and opens the code it calls or could break, not the whole repo.

## Gate rules, every change

- A gate (reviewer, tester, UAT) must report PASS before the next step.
  A FAIL goes back to the builder with the findings doc as input.
- Only findings marked **required** block a gate. **Suggested** findings
  are logged and ride the next change to the same files; they never start a
  review round on their own.
- If the same gate fails 3 rounds in a row, stop looping and put the
  remaining findings to the owner with a recommendation (fix, accept, or
  defer).

## Shared (web + Android) changes

The one-codebase rule needs every shared change checked for BOTH versions;
it does not need two separate review chains. For a change under `src/`:
- `mobile-lead-developer` reviews it once, against both the website and
  Android expectations, and runs the website checks too. The website
  `code-reviewer` is not called a second time on the same diff.
- `mobile-lead-tester`'s run includes the website test suite, which covers
  the website test gate. The website `test-writer` and `test-validator` are
  not called separately.
- The website `ui-ux-designer` runs only if the change alters what a desktop
  browser player sees (owner rule: that design check passes before it
  ships).

## Keeping runs lean

Tokens are the pipeline's real limit, so every agent follows these rules:
- **Use the quiet scripts.** `npm run check:quiet` (typecheck, lint, unit
  tests), `npm run check:quiet:full` (adds the web build) and
  `npm run e2e:quiet` (Android web build plus phone-emulation tests) print
  one line per step and only the failure lines. Full output goes to
  `logs/<step>.log`; open a log only for a failure you are fixing. Never
  stream a full test run or Gradle build into the conversation.
- **Batch your work.** Read the files you need together, make all the edits
  for a criterion, then run the checks once. Every extra call re-reads the
  whole context.
- **Read sections, not whole docs.** Start at `docs/spec/INDEX.md`, then
  grep the IDs a change touches and read those sections.
- **Re-reviews are deltas.** Round 2 and later read the previous findings
  doc and the diff since that round, confirm each required finding is
  fixed, and check the new diff for regressions.
- **Builds run once per change by whoever needs them.** The builder runs
  the full checks before hand-off; the reviewer re-runs `check:quiet` and
  re-runs the Android debug build only when native config, Gradle, or
  Capacitor files changed.

## One codebase (owner decision)

- Game rules and logic exist once in `src/`. Only touch input, screen
  fitting, back button, and lifecycle code may be platform-specific.
- A change to game rules or design updates the shared criteria (a new
  addendum) and `docs/mobile/PRD-mobile.md` where mobile behaviour changes,
  and must pass the code review, test, and UX gates for both versions before
  either ships. One combined review covers both.
- `.github/workflows/deploy-pages.yml` is the single CI check for both
  versions; a change that breaks either blocks the website deploy.
- Never hand-edit the web assets copied into `android/`; rebuild and
  `npx cap sync android`.

## Other rules

- **Traceability:** docs under `docs/` are never overwritten; reviews and
  reports are versioned (`-round1`, `-v2`). Details: the
  `traceability-conventions` skill.
- **Tool requests:** an agent that needs a tool installed logs it in
  `docs/mobile/tooling-requests.md` and stops; the main session calls the IT
  analyst (process in `mobile-it-analyst.md`).
- **Where it runs:** emulator steps (device matrix, UAT) need the Android
  SDK, so they run on the owner's Windows PC; everything else can run in a
  cloud session.
- **Scope (owner, 2026-10-05):** the Android work stops at a build that
  works in the emulator; no Play Store release.
