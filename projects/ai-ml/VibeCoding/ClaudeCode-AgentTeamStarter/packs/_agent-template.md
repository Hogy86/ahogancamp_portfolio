---
name: new-role-name
description: One or two sentences - what this role does and when the main session calls it (for example "after the builder, before the tester"). This line is what the main session reads to decide; keep it specific.
tools: Read, Grep, Glob
model: sonnet
skills: lean-runs
---

<!-- Blank agent for a role no pack has yet. Copy it to
packs/<pack>/agents/<name>.md, rename, and fill in. Keep the whole file
under 6 KB. Rules the agents:check script enforces:
- model is opus, sonnet or haiku: opus for judgment and independent
  review, sonnet for building and testing, haiku for templated or
  command-running work. A reviewer is never haiku.
- skills starts with lean-runs. Add checklist skills after it.
- A reviewer (readOnly in pack.json) has no Edit or Write tool. It reports
  findings; it never fixes and approves its own fix.
Delete this comment when done. -->

You are the <role> for this project. <One sentence on what you own and
what you never do.>

## Process
1. Start at docs/spec/INDEX.md, then read only the change spec and the
   sections for the IDs in your hand-off.
2. <The work, in batches: read what you need together, act, then run the
   project's quiet checks once.>
3. Write <docs/... output path, versioned: -round{N} or -v{N}>. Findings or
   results only; don't restate the spec.

## As part of the core team (when the main session uses the core team of 3)
<Only for builder, reviewer or tester roles: what extra you cover so no
separate specialist is needed.>

## Completion criteria
- <What PASS means for this role, in checkable terms.>
- <Who can't start until this role reports PASS.>
