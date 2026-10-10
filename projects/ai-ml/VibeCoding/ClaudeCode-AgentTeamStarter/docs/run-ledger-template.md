# Run ledger: <change>

Copy this file to `docs/run-ledger-<change>.md` when the owner asks for a
ledger. It shows where tokens go, so the next run can be compared.

How to read the token columns: "processed" counts every token read on every
call, including the cached part of the context re-read each turn. Cache
reads cost far less than fresh input, so "fresh input + output" is the
better guide to cost and "processed" to usage-limit pressure.

| # | Agent (model it actually ran on) | Role | Calls | Peak context | Processed (cache reads / fresh input / output) | Findings it caught in the previous step |
|---|---|---|---|---|---|---|
| 0 | main session | spec, hand-offs, orchestration | | | | n/a |
| 1 | | builder | | | | n/a |
| 2 | | reviewer | | | | |
| 3 | | tester | | | | |

**Total:**

## Checks

- Did every agent run on the model in its file? (If not, why.)
- Which step used the most tokens, and what was in its context?
- Anything to change in `lean-runs` or a pack next time?
