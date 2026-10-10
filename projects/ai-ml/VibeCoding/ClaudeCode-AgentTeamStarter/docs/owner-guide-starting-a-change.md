# Owner guide: starting a change

Your side of every change after the first version. The rules Claude
follows are in `CLAUDE.md`.

## 1. One change, one new conversation

- **In a Claude project:** post each new change as a **new message in the
  project chat**, not a reply in an old thread. A new message starts a
  fresh session, so it doesn't carry an earlier task's context on every
  call.
- Reply **inside that change's thread** for follow-ups on the same change.
- **On your PC:** type `/clear` (or close and reopen Claude Code) before the
  next change, and start Claude Code in the repo's top folder.

## 2. What to put in the first message

```
What:   <the change, in your words>
Where:  <which part, if the project has several>
Size:   small / medium / large, or "you size it"
Track:  "keep a token ledger" (only if you want one)
```

Claude should reply with the size and the team before starting. If it
doesn't, ask: "What size and team?"

## 3. When you make a decision

Answer Claude's questions in the thread. Claude records each decision in
`docs/decisions.md` and the change spec, and updates `docs/spec/INDEX.md`.
When you review the PR, check the index line says what you decided.

## Things to avoid

- **Don't paste long logs or whole files** into a message. Attach the file
  or name its path.
- **Don't set `CLAUDE_CODE_SUBAGENT_MODEL`.** It forces one model on every
  agent, including the reviewers that must stay on a stronger model.
- **Don't continue a new change in an old thread** just because it's open.
