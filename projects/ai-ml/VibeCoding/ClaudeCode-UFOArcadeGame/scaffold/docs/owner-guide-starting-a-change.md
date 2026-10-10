# Owner guide: starting a change

What you (the owner) do differently after the token-tuning change of
2026-10-10, so every new piece of work picks up the lean setup. The rules
Claude follows are in `.claude/CLAUDE.md`; this page is only your side.

## 1. One change, one new conversation

- **In the Claude project:** post each new change as a **new message in the
  project chat**, not as a reply in an old thread. Each new message starts a
  new thread with a fresh session, so it doesn't carry an earlier task's
  context on every call.
- Reply **inside that change's thread** for follow-ups about the same change
  (feedback, "fix this too", approvals).
- **On your Windows PC:** type `/clear` (or close and reopen Claude Code)
  before starting the next change.

## 2. What to put in the first message

A good opening message has four things. Claude fills in the rest.

```
What:   <the change, in your words>
Where:  website, Android app, or both
Size:   small / medium / large, or "you size it"
Track:  "keep a token ledger" (only if you want one)
```

Example: "Make the boss flash red when hit. Both. You size it."

Claude should reply with the size and the team (core team of 3 or the full
team) before starting. If it doesn't, ask: "What size and team?"

## 3. Running on your PC instead of the cloud

Emulator work (the Android device matrix and UAT) has to run on your PC.
When you start Claude Code there:

1. Open a terminal **in the scaffold folder**
   (`...\projects\ai-ml\VibeCoding\ClaudeCode-UFOArcadeGame\scaffold`),
   not the repo root. From there, Claude Code registers the role agents by
   name and uses the model each one specifies.
2. Run `git pull` first so you have the latest rules.
3. Start `claude`.

Cloud sessions start at the repo root. The root `CLAUDE.md` there tells
them where the game lives and to pass each agent's model explicitly, so you
don't need to do anything for those.

## 4. When you make a decision

- Answer Claude's questions in the thread. Claude records each decision in
  the change spec (`docs/PRD-addendum-vN.md`) and adds a line to
  `docs/spec/INDEX.md`.
- When you review the PR, check that the index line says what you decided.
  The index is your one-page view of the whole product.

## 5. After a merge

- Pull `master` on your PC before the next local session.
- If something looks wrong in the spec, say so in a new message. Claude
  fixes it in a new addendum; the old ones are never rewritten.

## Things to avoid

- **Don't paste long logs or whole files** into a message. Attach the file
  or name its path; the agents read only the parts they need.
- **Don't set `CLAUDE_CODE_SUBAGENT_MODEL`.** It forces one model on every
  agent, including the reviewers that must stay on a stronger model.
- **Don't continue a new change in an old thread** just because it's open.
