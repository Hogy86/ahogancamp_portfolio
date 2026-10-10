# Consolidated feature files

One file per feature ID (for example `F23.md`, `M2.md`), holding that
feature's **current** text in one place, so an agent doesn't have to follow
the amendments across several addenda.

These are built as needed, not all at once. Copying about 400 KB of spec
in one go would be a large, error-prone change. Instead, the first time a
change touches an ID that has no file here yet, its spec writer (the main
session acting as product manager, or `mobile-product-manager`) creates
it. The reviewer checks it as part of that change.

## Rules

- **Copy, don't rewrite.** Take the current text of each criterion from
  the newest file listed for that ID in `docs/spec/INDEX.md`. Keep every
  criterion ID and number exactly as it is.
- **Source line under each criterion:** `Source: PRD-addendum-v4.md §F21 AC3`.
- **Record, not replacement.** The PRD and addenda stay unchanged as the
  record. If this file and a source disagree, the source wins, and the
  file gets fixed.
- **Keep it current.** A later change that amends the ID updates this
  file in the same commit as its addendum.
- **Reviewer check.** On the change that creates or updates a file here,
  the reviewer compares it against its sources, criterion by criterion.

## Template

```
# F23 — Power-up glyphs (current text)

Consolidated 2026-MM-DD from: PRD-addendum-v5.md §F23, PRD-addendum-v5-r6.md, mobile amendment v2.0 §2.
Platform notes: <the PRD-mobile §3 mapping, if any>

## AC1 ...
Source: ...
```
