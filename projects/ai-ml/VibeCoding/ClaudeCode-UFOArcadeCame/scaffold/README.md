# Multi-Agent Product Pipeline Scaffold

Drop the `.claude/` folder into the root of your repo. `docs/` is
pre-created as the output location every subagent writes to — safe to
commit so the whole pipeline's audit trail lives in version control.

## What's in here

```
.claude/
  CLAUDE.md          ← orchestration rules, pipeline order, gates, model policy
  agents/            ← 13 subagent definitions (.md, YAML frontmatter + system prompt)
  skills/            ← 12 skill definitions (SKILL.md per folder)
docs/                ← empty output folders; subagents populate these as they run
```

See `.claude/CLAUDE.md` for the full pipeline, gate rules, and the
model assigned to each subagent.

## Quick start

1. Copy `.claude/` and `docs/` into your project root.
2. Open Claude Code in that project directory.
3. Run `/agents` to confirm all 13 subagents are detected.
4. Kick off the pipeline by describing your product idea in plain
   language to the main session — do not invoke individual subagents
   yourself at first; let the main session read `CLAUDE.md` and
   delegate in order.
5. Respond to `product-manager` when it asks clarifying questions —
   it will present options and a recommendation, not just raw
   questions.

Full interaction guidance is in the chat response this scaffold was
delivered with.
