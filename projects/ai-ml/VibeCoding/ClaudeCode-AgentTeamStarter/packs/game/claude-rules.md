### Game pack rules

**One codebase.** Game rules and logic exist once in `src/`. Only touch
input, screen fitting, back button and lifecycle code may be
platform-specific. A change to game rules updates the shared criteria and,
when Android behaviour changes, `docs/mobile/PRD-mobile.md`, and must pass
the review, test and UX gates for both versions before either ships. One
combined review covers both. Never hand-edit the web assets copied into
`android/`; rebuild and run `npx cap sync android`. One CI workflow guards
both versions.

**Shared (web + Android) changes.** For a change under `src/` when the
Android module is installed:
- `mobile-lead-developer` reviews it once, against both the website and
  Android expectations, and runs the website checks too. The website
  `code-reviewer` is not called a second time on the same diff.
- `mobile-lead-tester`'s run includes the website test suite, which covers
  the website test gate.
- The website `ui-ux-designer` runs only if the change alters what a
  desktop browser player sees.

**Where it runs.** Emulator steps (device matrix, acceptance tests on the
phone) need the Android SDK, so they run on the owner's PC. Everything else
can run in a cloud session.
