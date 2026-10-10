# Portfolio repo: pointer for Claude sessions

This repo holds several projects. Keep this file short: every session that
starts here loads it.

## Shield vs Robots (the shield game: website and Android app)

- Lives in `projects/ai-ml/VibeCoding/ClaudeCode-UFOArcadeGame/scaffold`.
  Run every command for it from that folder.
- Before any work on it, read `scaffold/.claude/CLAUDE.md` (sizing, core
  teams, hand-off template) and `scaffold/docs/spec/INDEX.md` (the spec map).
- Its role agents are in `scaffold/.claude/agents/`. A session started here
  at the repo root does not register them, so launch a general-purpose agent
  with the role file as its instructions and **pass that file's `model:`
  explicitly**. Otherwise it runs on this session's model.
