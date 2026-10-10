# Spec index: Shield vs Robots (website + Android)

Read this first. It is the map of the whole spec, so an agent can open only
the sections a change touches instead of whole PRDs (about 400 KB in all).
Created 2026-10-10 (token-tuning PR). The PRD and addenda it points to are
the record and are never rewritten; this file only says where things are.

## How the pieces fit together

- **One game, two front doors.** Game rules live once in `src/` and apply to
  the website and the Android app alike (owner decision; see CLAUDE.md
  "One codebase" and `docs/mobile/PRD-mobile.md` §0).
- **F features** are shared game rules: F1-F10 in `docs/PRD.md`, F11 onward
  in the addenda below. Each addendum changes or adds F features and says
  which earlier text it amends.
- **M features** are Android-only behaviour (touch, screen fitting, back
  button, lifecycle, packaging) in `docs/mobile/PRD-mobile.md` §4. An M
  feature never changes what a game rule does, only how the player triggers
  it; `docs/mobile/PRD-mobile.md` §3 maps each shared rule to Android.
- **Later beats earlier.** For any ID, the newest file in its row below is
  the current text; older files are history. Inside `PRD-mobile.md`,
  dated "Amended" blocks sit next to the criterion they change.
- **Scope today** (owner, 2026-10-05): stop at a build that works in the
  Android emulator; no Play Store release. Store-only criteria are closed
  as "not applicable" in `docs/mobile/PRD-mobile-amendment-v2.0.md` §1.
- **Names** (F22, owner): the game is "Shield vs Robots", the hero is
  "ShieldMan", the enemies are "robots". Older text that says Vanguard or
  Sentinels is kept as the record; F22 says which internal identifiers keep
  their old names.

## How to use it

1. Find the IDs your change touches in the tables below.
2. Open the file and section in the "Defined in" column, then each file in
   "Also covered in". Those files amend, map or only mention the ID; the
   bold one rewrites it. Addenda are listed oldest first, then the mobile
   files. Use `grep -n "F23" <file>` to jump to
   the lines instead of reading the whole file.
3. If `docs/spec/features/<ID>.md` exists, it is the consolidated current
   text for that ID; read it instead of steps 1-2 (see
   `docs/spec/features/README.md`).
4. Owner decisions are listed under "Decisions" below.

## Shared features (website and Android)

| ID | Feature | Defined in | Also covered in (bold = rewrites it) |
|---|---|---|---|
| F1 | Player movement | PRD.md §F1 | v2; v3; v4; PRD-mobile |
| F2 | Shield throw | PRD.md §F2 | v2; PRD-mobile |
| F3 | Enemy formation and movement | PRD.md §F3 | v2; v4; PRD-mobile |
| F4 | Enemy hit points per level | PRD.md §F4 | v2; PRD-mobile |
| F5 | Level progression, enemy fire cadence | PRD.md §F5 | v2 |
| F6 | Pause menu | PRD.md §F6 | v2; v3; **v4**; PRD-mobile |
| F7 | Power-ups (drops; guide in F24, F25) | PRD.md §F7 | v2; v4; v5; v6; PRD-mobile |
| F8 | Lives, damage, end states | PRD.md §F8 | v2; v3; v4; PRD-mobile |
| F9 | Theme and first-run legibility | PRD.md §F9 | v2; v4; v5; PRD-mobile |
| F10 | On-screen score | PRD.md §F10 | v2; **v3**; v4; PRD-mobile |
| F11 | Single active temporary power-up | v2 §F11 | v5; PRD-mobile |
| F12 | Bosses on levels 5 and 10 | v2 §F12 | v4; **v6**; PRD-mobile |
| F13 | Humanoid hero | v2 §F13 | v4 |
| F14 | Circular avatar-blue shield | v2 §F14 | v4; v5; PRD-mobile |
| F15 | Shield bounce geometry | v2 §F15 | PRD-mobile |
| F16 | Shield lifecycle, catch = extra life | v2 §F16 | v4; PRD-mobile |
| F17 | Enemy look and toughness colours | v2 §F17 | v4; v6; PRD-mobile |
| F18 | "LEVEL N" countdown | v2 §F18 | v4; PRD-mobile |
| F19 | Game Complete celebration | v2 §F19 | v3; v4; PRD-mobile |
| F20 | Saved best score | v3 §F20 | v4; PRD-mobile |
| F21 | Restart Level rolls back the score | v4 §F21 | — |
| F22 | Rename: Shield vs Robots, ShieldMan, robots | v4 §F22 | v5; mobile amendment v2.0 |
| F23 | Power-up glyphs | v5 §F23 (r1-r5) | **v5-r6**; mobile amendment v2.0; PRD-mobile |
| F24 | Power-up guide on the title screen | v7 §F24 | PRD-mobile |
| F25 | Power-up explanations on the Android help screen | v7 §F25 | — |
| F26 | Developer contact details | v7 §F26 | mobile amendment v2.0 |
| F27 | Test gaps from code review round 21 | v7 §F27 | PRD-mobile |

File names: "v2" means `docs/PRD-addendum-v2.md`, and so on; "v5-r6" is
`docs/PRD-addendum-v5-r6.md`; "PRD-mobile" is `docs/mobile/PRD-mobile.md`.

## Android features (`docs/mobile/PRD-mobile.md` §4)

| ID | Feature | Also covered in |
|---|---|---|
| M1 | Android platform baseline | v5; mobile amendment v2.0 |
| M2 | Orientation and screen fitting (the largest section, about 380 lines; M2.3b, M2.3c, M2.10a are PM decisions in its status notes) | v3; v5; v5-r6; mobile amendment v2.0 |
| M3 | Touch controls | v5 |
| M4 | Pause, resume, lifecycle | v3; v4 |
| M5 | Back button and gesture | v4 |
| M6 | Quit on Android | v3 |
| M7 | Saved best score and settings | v3; v4 |
| M8 | First-launch help and control hints (v7 F25 adds the power-up explanations) | v3; v4; mobile amendment v2.0 |
| M9 | App name, icon, splash | v3; v4; v5; mobile amendment v2.0 |
| M10 | Performance on low-end devices (frame rate is now measured on the emulator only: mobile amendment v2.0 §1.3) | mobile amendment v2.0 |
| M11 | Offline, permissions, privacy (v7 F26 adds the contact line on the privacy page) | v3; v4; mobile amendment v2.0 |
| M12 | Store listing (parked: no store release, mobile amendment v2.0 §1) | v4; mobile amendment v2.0 |

## Decisions

- **Website open questions and answers:** each addendum's "Open Questions"
  section (v2 items A-F; Q-v3-1; Q-v4-1, Q-v4-2; Q-v5-*).
- **Android owner decisions:** `PRD-mobile.md` §7 (OQ-M1 to OQ-M14,
  OQ-S1, OQ-S1a, OQ-A1) and the status lines at the top of that file.
- **Scope change to emulator only:** `docs/mobile/PRD-mobile-amendment-v2.0.md` §1.
- **Per-change decisions after v5:** at the top of each addendum (v6, v7).

## Architecture and other references

- Website: `docs/architecture/solution-architecture.md`, ADRs in `docs/architecture/adr/`.
- Android: `docs/mobile/architecture/mobile-architecture.md`, ADRs 0001-0013
  in `docs/mobile/architecture/adr/`, amendment A14 beside it.
- Terms: `docs/GLOSSARY.md`.
- Latest test and UAT reports: `docs/mobile/tests/` (newest round number wins).

## Keeping this file current

Whoever writes a change spec (the main session acting as product manager
with the core team, or `mobile-product-manager` in a full run) also
updates this index in the same commit: a new row for a new ID, and the
addendum added to "Changed later in" for any ID it amends.
