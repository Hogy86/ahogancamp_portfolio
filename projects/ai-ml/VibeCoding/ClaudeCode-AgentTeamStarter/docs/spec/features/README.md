# Feature files

One file per feature ID (for example `F3.md`), holding that feature's
**current** text, so an agent doesn't have to follow a feature through
several change specs.

- Whoever writes a change spec creates or updates the feature files it
  touches, and the feature's line in `docs/spec/INDEX.md`, in the same
  commit.
- Keep every criterion ID exactly as it is, with a source line under each
  criterion (`Source: changes/v3-boss-speed.md AC2`).
- The PRD and change specs stay unchanged as the record. If a feature file
  and its source disagree, the source wins and the file gets fixed.
- The reviewer compares a new or changed feature file against its sources.
