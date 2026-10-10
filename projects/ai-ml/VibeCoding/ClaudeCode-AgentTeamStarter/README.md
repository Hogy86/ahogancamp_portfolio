# Agent team starter

> **Moved.** The live template is now its own repo:
> [Hogy86/new-claude-project-template](https://github.com/Hogy86/new-claude-project-template).
> Make new projects from there, and make template changes there. This folder
> is the first version, kept as the record.

A starting point for new projects built by a team of Claude Code agents,
with the token-tuning lessons from the Shield vs Robots game already built
in. The first thing a new project does is choose its agent team: Claude
proposes it from the packs here, and you approve it.

## Starting a new project

1. **Make the repo.** On GitHub, open this template repo, click **Use this
   template**, then **Create a new repository**, and name it.
2. **Make the Claude project.** Create a new project in Claude and add the
   new repo to it.
3. **Ask for setup.** In the project chat, type:
   *"Set up this project: [one or two sentences about your idea]."*
4. **Answer a few questions.** Claude asks up to 5, each with a recommended
   answer. "All yes" is a fine reply.
5. **Approve the team.** Claude writes `docs/team-proposal.md`: which pack,
   the 3-agent core team for everyday changes, the full team for the first
   version, and what it reuses, changes or builds new. Approve it or say
   what to change.
6. **Merge the setup PR.** Claude builds anything missing, installs the
   team, and opens a PR.
7. **Build the first version.** In a new message, type: *"Run the full
   pipeline."*
8. **Every change after that:** post it as a new message. See
   `docs/owner-guide-starting-a-change.md`.

## What's in here

| Part | What it does | Changes per project? |
|---|---|---|
| `CLAUDE.md` | Sizing, core team, hand-off template, gate rules | Only the "This project" section |
| `.claude/skills/lean-runs` | The token rules every agent loads | No |
| `.claude/skills/project-setup` | Proposes, builds and installs the team | No |
| `scripts/quiet-check.mjs` | Runs checks, keeps full logs in `logs/`, prints only PASS/FAIL and failures | No |
| `scripts/check-agents.mjs` | Blocks any agent that loses the rules (runs on every PR) | No |
| `packs/` | The agent teams, one pack per kind of project | Yes: chosen, borrowed from, or added to |
| `docs/spec/` | Spec index, feature files, change specs | Filled in by the project |

## Packs

| Pack | Status | For |
|---|---|---|
| `game` | ready | Browser game, optional Android app |
| `local-app` | planned | Desktop or local app on SQLite or MySQL |
| `data-science` | planned | Analysis, statistics, machine learning |
| `saas-aws` | planned | Hosted web product with accounts on AWS |

A **planned** pack lists the agents it borrows from the game pack, what
changes each needs, and the few new agents and checklists it still needs.
Its first project builds those parts, and from then on the pack is ready.
How packs work: `packs/README.md`.

## Why the lessons can't get lost

- The token rules sit in `lean-runs` and `CLAUDE.md`, outside the packs.
  Swapping or adding agents doesn't touch them.
- Every agent file must load `lean-runs`, name its model, and keep
  reviewers read-only. `npm run agents:check` fails the PR otherwise.
- `.claude/` is at the repo root, so agents register by name and run on
  the model in their file (the biggest single saving from the game).

## Commands

```
npm run pack:list                                  list the packs
npm run pack:install -- game --modules web,android install a pack
npm run agents:check                               check every agent
npm run test:template                              test the scripts
```

## Status

Built in the portfolio repo at
`projects/ai-ml/VibeCoding/ClaudeCode-AgentTeamStarter` for review. To use
it, copy this folder's contents to the top level of a new repo and tick
**Template repository** in that repo's GitHub settings. The PR check in
`.github/workflows/agents-check.yml` runs only from there.
