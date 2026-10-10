# Agent packs

A pack is a ready-made agent team for one kind of project. Each pack has:

- `pack.json`: the manifest. It names the pack, says what kind of project
  it fits, lists its **core team** (builder, reviewer, tester: used for
  every change after launch) and its **full team** (used to plan and build
  the first version and for large changes), and lists its quiet check
  commands.
- `agents/`: agent files that belong to this pack.
- `skills/`: checklist and pipeline skills that belong to this pack.
- `overlays/`: short "changes for this project type" notes added to an
  agent borrowed from another pack.

The shared rules that every pack follows (`CLAUDE.md`, the `lean-runs`
skill, the quiet check runner, the agent check) live outside the packs, so
changing or adding a pack can't remove them.

## Packs today

| Pack | Status | Fits |
|---|---|---|
| `game` | ready | Browser game, optional Android app (the Shield vs Robots team) |
| `local-app` | planned | Desktop or local app on SQLite or MySQL |
| `data-science` | planned | Analysis, statistics, machine learning in Python |
| `saas-aws` | planned | Hosted web product with accounts on AWS |

`npm run pack:list` prints this from the manifests. **Planned** packs say
which agents they borrow and what they still need built; the
`project-setup` skill builds the missing parts the first time a project
uses the pack, then marks it ready.

## Reuse first

New packs borrow agents from existing packs wherever they can. It is
cheaper in time and tokens than writing agents from scratch, and borrowed
agents keep every improvement made to the original. In order of
preference:

1. **Borrow as is:** `"code-reviewer": { "from": "game", "role": "reviewer", "readOnly": true }`
2. **Borrow and add checklists:** `"addSkills": ["statistics-review-checklist"]`.
   The domain knowledge goes in a skill the agent loads, not in the agent.
3. **Borrow with changes:** `"overlay": "overlays/code-reviewer.md"`, a
   short file holding only what differs for this project type. The
   installer appends it to the borrowed agent under "Changes for this
   project type". Optional: `"model"`, `"description"`, `"as"` (install
   under a new name), `"source"` (borrow a differently named agent).
4. **New agent:** only when no existing role is close. Start from
   `_agent-template.md` (or copy the closest agent, noted as `basedOn`) and
   save it in this pack's `agents/`.

Skills are found the same way: the pack's own `skills/` first, then the
base skills in `.claude/skills/`, then the pack an agent was borrowed from,
then any other pack.

## Manifest fields

```
id, name, version, status ("ready" | "planned"), summary, fitsWhen[]
claudeRules      file with rules for every change in this kind of project;
                 pack:install copies it into CLAUDE.md
modules.<id>:
  default        true if installed unless the setup says otherwise
  requires[]     other modules it needs
  core           { builder, reviewer, tester }   the minimal set
  fullTeam[]     every role in the full pipeline  the full set
  pipelineSkill  the skill holding the full pipeline
  checks         { "<npm script>": "<command>" } quiet check commands
agents.<name>:
  role           planner | builder | reviewer | tester | specialist | support
  readOnly       true for reviewers: no Edit or Write tool
  reusable       hint that other packs can borrow it as is
  from, source, as, addSkills[], overlay, model, description   (borrowing)
  build, basedOn, plan, changes                                 (planned work)
skillsToBuild    { "<skill>": "what it must cover" }            (planned packs)
```

## Adding a pack

The `project-setup` skill does this when no pack fits: it proposes the
team, and after the owner approves it writes `packs/<id>/pack.json`, the
overlays and any new agents or skills, then runs `npm run agents:check`.
When a project later improves one of its agents, copy the improvement back
into the pack here so the next project starts with it.
