---
name: project-setup
description: First step of every new project made from this template - interview the owner, propose the agent team (pack, modules, core and full team, what to reuse, borrow with changes or build), get the owner's approval, then build and install it. Use when .claude/team.json does not exist, when the owner says "set up this project", or when a project needs a different pack.
---

# Project setup: define and build the agent team

The team is the project's first decision. Claude proposes it and the owner
approves it. Don't start the product spec, architecture or code until the
team is installed.

Keep this run lean too: read pack **manifests**, not agent files, until the
owner has approved. Reading 25 agent files to make a proposal is about 15k
tokens the owner doesn't need to pay for.

## 1. Read (only these)

- `CLAUDE.md` and `packs/README.md`.
- `npm run pack:list`: one line per pack, from the manifests.
- `packs/<id>/pack.json` for the one or two packs that might fit.

## 2. Ask the owner (one message, at most 5 questions)

Each question gets your recommended answer, so the owner can reply "all
yes". Ask only what changes the team:

1. What is it, and who is it for? (one or two sentences)
2. Where does it run? (browser, phone, desktop, a server, a notebook, the cloud)
3. What data does it keep? (none, on the device, a local database, a hosted database; any personal data?)
4. Does it need accounts, payments, or a store or public release?
5. Anything to avoid? (names, brands or IP; tools; costs)

Skip a question the owner's first message already answers.

## 3. Propose the team

Pick the pack and modules that fit. If none fits, propose a new pack. Then
choose a source for every role, in this order (cheapest first):

1. **Reuse as is** from a ready pack.
2. **Reuse and add checklists** (`addSkills`): domain knowledge goes in a
   skill, not in the agent.
3. **Reuse with changes** (`overlay`): a short file holding only what is
   different for this project type.
4. **New agent** from `packs/_agent-template.md`, or a copy of the closest
   agent (`basedOn`). Only when no role is close.

Rules for the team:
- **Core team (the minimal set) is always 3:** a builder (sonnet), a
  reviewer (opus, read-only) and a tester (sonnet). It handles every change
  after the first version.
- **Full team (the full set)** plans and builds the first version and
  handles large changes. Include a role only if it does a distinct piece of
  work for this project; drop the rest (for example no marketing analyst
  for a personal tool).
- Specialist depth comes from checklist skills the reviewer loads, not from
  extra review agents on every change.
- Models: opus for judgment and independent review, sonnet for building and
  testing, haiku for templated or command-running work. Never haiku for a
  reviewer.

Write `docs/team-proposal.md` (keep it under about 60 lines):

```
# Team proposal: <project>
Pack: <id> (<ready | planned | new>), modules: <...>
Why this pack: <one or two sentences>

## Core team (every change)
| Role | Agent | Model | Source | Changes for this project |

## Full team (first version and large changes)
| Step | Agent | Model | Source | Changes for this project |

## To build before work starts
- <overlays, new agents, new skills; one line each>

## Quiet check commands
- <script>: <command>
```

Then ask the owner **one** question: approve the team, or say what to
change. Recommend approving, and say in a sentence what it will cost to
build (for example "3 short overlays and 1 new agent").

## 4. After approval: build and install

1. Write what's missing in `packs/<id>/`: `pack.json` entries, overlays,
   new agents (from the template, under 6 KB, `lean-runs` first in
   `skills:`), and new skills. A planned pack becomes `"status": "ready"`
   once nothing is left to build; bump its `version`.
2. `npm run agents:check`. Fix every FAIL before going on.
3. `npm run pack:install -- <id> --modules <a,b>`. This copies the agents
   and skills into `.claude/`, writes `.claude/team.json`, and adds the
   quiet check scripts to `package.json`.
4. Run `npm run agents:check` again (it now checks the installed team too).
5. Fill in the "This project" section of `CLAUDE.md`: name, one-line
   summary, pack and modules, the core team per module, the quiet check
   commands, the store release or deploy scope, and anything to avoid.
6. Put the project name in `docs/spec/INDEX.md` and add the team decision
   to `docs/decisions.md` (D1: team approved, date, link to the proposal).
7. Commit as "Set up the agent team: <pack>" and open a PR for the owner.

## 5. Tell the owner what's next

In two lines: the team is installed, and the next step is to say "run the
full pipeline" in a new message so the full team plans and builds the
first version.

## Changing the team later

- A project that outgrows its pack (for example a game that adds online
  accounts) runs this skill again: propose the added roles, approve,
  install.
- When a project improves one of its agents, also copy the improvement
  into the template's pack so the next project starts with it.
