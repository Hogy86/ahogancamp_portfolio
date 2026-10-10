---
name: lean-runs
description: Token rules every agent in every pack follows - quiet check commands, batched work, reading the spec by section, delta re-reviews, and never printing large output or data. Loaded by every agent file (the agents:check script enforces it).
---

# Lean runs

Every call re-reads the whole conversation so far, so anything that enters
your context is paid for again on every later call. A 5k-token log read on
call 10 of 60 costs about 250k tokens by the end of the run. These rules
keep the context small. They never remove a review, a test run or a real
check; those are what catch the bugs.

## Commands and logs

- **Run checks through the quiet runner.** Use the project's quiet commands
  (listed in CLAUDE.md "This project", for example `npm run check:quiet`).
  They print one PASS/FAIL line per step and only the failure lines. The
  full output is in `logs/<step>.log`; open a log only for a failure you are
  fixing, and then read the lines around the failure, not the whole file.
- **Never stream a full test run, build, install or deploy log** into the
  conversation. If a command has no quiet form, run it through
  `node scripts/quiet-check.mjs "<label>=<command>"`.
- **Missing tool?** Log it in the tooling-requests file your role names
  (`docs/tooling-requests.md` if it names none) and stop. Don't
  spend calls working around it.

## Working in batches

- Read the files you need together, make all the edits for one criterion,
  then run the checks once. Avoid edit, run, edit, run on each line.
- When fixing findings, read only the findings doc and the files it names.
  Fix every required finding in one pass.

## Reading the spec

- Start at `docs/spec/INDEX.md`. Open only the feature files and change
  spec for the IDs you were given, and use `grep -n "<ID>"` to jump to the
  lines instead of reading whole documents.
- Use the paths, branch, commit range and IDs in your hand-off. Don't search
  the repo for things the hand-off already names.

## Data, notebooks and large files

- **Never print a whole table, data frame, query result or data file.**
  Print the column names and types, the row count, and 5 sample rows. Write
  anything bigger to a file under `logs/` and summarize it.
- Save notebooks without their outputs, and read a notebook's code cells,
  not its stored outputs.
- Don't open images, binaries, lockfiles or generated files unless the task
  is about that file.

## Reviews

- A reviewer starts from `git diff <range>`, then opens the code the diff
  calls or could break. Never the whole repo.
- Round 2 and later are deltas: read the previous findings doc and the diff
  since that round, confirm each required finding is fixed, check the new
  diff for regressions. Don't re-review unchanged code.
- Only **required** findings block a gate. **Suggested** findings are
  logged and ride the next change to the same files.

## Reports

- Keep reports to findings and results. Don't restate what the code or the
  spec says; downstream agents read your report on every call too.
