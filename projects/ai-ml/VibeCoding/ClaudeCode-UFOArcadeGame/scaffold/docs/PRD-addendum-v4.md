# Product Requirements Document — Addendum v4

**Product:** Shield vs Robots (formerly "Vanguard vs. Sentinels: Shield
Invaders"; renamed by this addendum, F22)
**Stage:** 2 — Product Manager (PRD addendum, shared game change)
**Date:** 2026-09-25
**Author:** product-manager subagent
**Status:** v4 — DECIDED in scope. Both changes are owner decisions made on
2026-09-25:
1. **Q-v3-1 → option (b):** Restart Level rolls the score back to its value
   when the level started (F21).
2. **Rename:** the product becomes **"Shield vs Robots"**, the hero becomes
   **"ShieldMan"**, and the enemies are called **"robots"** in all
   player-facing text (F22). The hero rename came as a same-day owner update
   ("change Vanguard name to 'ShieldMan'").

Two small follow-up questions for the owner are in §Open Questions v4
(Q-v4-1, Q-v4-2). Neither one blocks this addendum. Defaults are applied, and
the ACs below hold whichever way the owner answers.

**What this addendum does.** It makes two shared game changes. Both apply to
the website **and** the Android app, which are built from one codebase
(`.claude/CLAUDE.md` §One codebase):
- **F21** amends `docs/PRD.md` **F6 AC4** and **F10 AC4**. It also amends the
  parts of `docs/PRD-addendum-v3.md` F20 AC4, §Out of Scope (v3) and §Open
  Questions v3 that were written "under current behavior, pending Q-v3-1".
- **F22** amends the names in `docs/PRD.md` (title, Theme note, Terminology,
  Summary, F9 AC1, F9 AC4, NFR-10, §Out of Scope (v1)). The player-facing
  names used in `docs/PRD-addendum-v2.md` and v3 are amended the same way. The
  IP rule is tightened: "Shield" is never styled as S.H.I.E.L.D., and no
  shield is a red/white/blue star design.

Nothing else in F1-F20 changes. `docs/PRD.md`, `docs/PRD-addendum-v2.md` and
`docs/PRD-addendum-v3.md` are **not edited**. Where this addendum differs from
them, this addendum wins. The old text is quoted next to the new text below.

The Android side of both decisions is being recorded at the same time by
mobile-product-manager in `docs/mobile/PRD-mobile.md` (not edited here). The
expected touch points are listed in §Cross-platform consistency.

**Sources (upstream):**
- Owner decisions, 2026-09-25: Q-v3-1 option (b); the product rename to
  "Shield vs Robots" with enemies called "robots"; the hero rename from
  "Vanguard" to "ShieldMan" (same-day update).
- `docs/PRD.md` — v1 spec. Amended here: F6 AC4, F10 AC4, F9 AC1/AC4,
  NFR-10, title/Theme note/Terminology/Summary, §Out of Scope (v1). Referenced:
  F6 AC5/AC11 (Restart Game), F7 AC7 (permanent multiplier), F3 AC6 (danger
  warning), F8 (end screens).
- `docs/PRD-addendum-v2.md` — F12 (boss phase is part of the level), F13/F14
  (hero and shield art), F17 (enemy art), F18 AC9 (Restart Level skips the
  intro), F19 (Game Complete).
- `docs/PRD-addendum-v3.md` — F20 (saved best), especially AC3 ("New best!"),
  AC4 (save events) and AC5 (never decreases), and §Open Questions v3 Q-v3-1
  (options, recommendation (b)).
- `docs/mobile/PRD-mobile.md` — §0 rule 3 (shared changes go through both
  pipelines), M7.2 (Android save events, written against Q-v3-1 "pending"),
  M9.1 (store title / launcher label), §7 OQ-S1 ("Sentinels" vs. Marvel's
  X-Men Sentinels, raised by `docs/mobile/security/review-v1.md` M5), OQ-M11
  (app ID placeholder).
- `docs/market/voice-of-customer.md` segment C ("screenshot a high score",
  beat-my-best). `docs/market/market-goals-and-use-cases.md` UC6 (instantly
  recognize the shield-hero vs. robots premise), UC7 (restart a level), goals
  P5, B3.
- Existing implementation, read to ground the ACs in what exists today:
  - `src/core/world.ts` `resetForLevel`: resets the playfield, shields,
    lasers, power-ups, active temporary effect and boss phase. It does **not**
    touch `world.score`, lives, or the permanent multiplier.
  - `src/ui/ScreenController.ts`: title `h1` "VANGUARD vs. SENTINELS",
    subtitle "Shield Invaders", Game Complete line "The Sentinel forces have
    been defeated."
  - `src/render/CanvasRenderer.ts`: danger warning "WARNING: SENTINELS
    APPROACHING".
  - `index.html`: `<title>Vanguard vs. Sentinels: Shield Invaders</title>`.
    There are no other meta tags today.
  - `src/config/constants.ts`: `INSTRUMENTATION_STORAGE_KEY = 'vvs:metrics'`.
    `vvs:best` / `vvs:settings` are specified in
    `docs/mobile/architecture/adr/0006-on-device-persistence.md`.
  - `docs/README.md`, `docs/GLOSSARY.md`, `package.json` `description`,
    `.github/workflows/deploy-pages.yml` workflow name.

**Terminology (carried from v1-v3):** "run", "best score", "final score",
"page hidden" as defined in v1 and v3. New or changed in v4:
- **"ShieldMan"**: the player character (was "Vanguard"). Written as one word
  with a capital S and a capital M. All-caps "SHIELDMAN" is allowed only where
  the surrounding text is all caps.
- **"robot" / "robots"**: an enemy, or the enemies (was "Sentinel(s)").
  Lower case in running text. "boss" is unchanged.
- **"level-start score"**: the run's score at the moment the current level was
  entered. It is 0 for level 1 of a run. For level N > 1 it is the score at the
  moment level N was entered, which includes every point from levels 1 to N-1
  (including a level-5 boss kill). It is recorded once per level entry.
- **"player-facing text"**: any text a player can see or hear. That covers
  on-screen DOM text, canvas-drawn text, `document.title`, `<meta>` content,
  `aria-label`s and other accessible names, image alt text, the Android
  launcher label, splash, and store listing, and the product-facing docs
  (`docs/README.md`, `docs/GLOSSARY.md`). Source-code identifiers, comments,
  file names, storage keys, npm package names, Docker service names, CI job
  names and past audit docs are **not** player-facing.

---

## Summary of the changes → feature mapping

| # | Owner decision (short) | Feature | Amends |
|---|---|---|---|
| 1 | Q-v3-1 (b): Restart Level resets the score to its level-start value | **F21** | `docs/PRD.md` **F6 AC4**, **F10 AC4**. `docs/PRD-addendum-v3.md` F20 AC4 closing paragraph, F20 "No change to F6 AC4" line, §Out of Scope (v3) last bullet, Q-v3-1 status. F20 AC5 (never decreases) is **unchanged** and governs the interaction. |
| 2 | Rename: product "Shield vs Robots", hero "ShieldMan", enemies "robots"; IP rule tightened | **F22** | `docs/PRD.md` title, Theme note, Terminology, Summary, F9 description, **F9 AC1**, **F9 AC4**, **NFR-10**, §Out of Scope (v1) bullet 7. Player-facing names in v2 F13/F14/F17 and v3. No game-rule, art-shape or storage change. |

---

## Amendments to `docs/PRD.md` and `docs/PRD-addendum-v3.md` (F21)

**F6 AC4, amended.** The v1 text is:

> 4. Selecting **Restart Level** restarts the current level from its start state
> without reloading the page.

It is replaced by:

> 4. **(v4, amended by F21.)** Selecting **Restart Level** restarts the current
> level from its start state without reloading the page. The run's **score
> returns to the level-start score** (F21), so points earned in the abandoned
> attempt are removed. Lives and the permanent hit-power multiplier are **not**
> changed by Restart Level (current behavior, F21 AC6). The intro is still
> skipped per v2 F18 AC9. No confirmation step is added (F6 AC11 unchanged).

**F10 AC4, amended.** The v1 text is:

> 4. The score resets to 0 on Restart Game and on starting any fresh run; it is
> preserved across level transitions within a single run.

It is replaced by:

> 4. **(v4, amended by F21.)** The score resets to 0 on Restart Game and on
> starting any fresh run. It is preserved across level transitions within a
> single run and across pause/Resume. On **Restart Level** it returns to the
> **level-start score** of the level being restarted (F21).

**v3 F20 AC4, closing paragraph, amended.** The v3 text is:

> **Restart Level** (F6 AC4) does not end the run and triggers no save by
> itself. The run's score carries on under current behavior (see Q-v3-1), and
> rules (a)-(e) still apply later in the same run.

It is replaced by:

> **Restart Level** (F6 AC4) does not end the run and triggers no save by
> itself. It rolls the run's score back to the level-start score (v4 F21).
> Rules (a)-(e) still apply later in the same run, using the rolled-back score.
> A best already saved earlier in the run (for example by (e)) is **not**
> lowered (AC5, v4 F21 AC7).

**v3 F20 "Supersedes / amends" line.** The v3 phrase *"**No change** to F6
AC4 (Restart Level)"* no longer holds. F6 AC4 is amended by v4 F21. The rest
of that line stands.

**v3 §Out of Scope (v3), last bullet, amended.** The v3 text is:

> Any change to how points are earned (F10 AC2-AC3 unchanged) or to Restart
> Level score behavior (see Q-v3-1).

It is replaced by:

> Any change to how points are earned (F10 AC2-AC3 unchanged). Restart Level
> score behavior **is** changed, by v4 F21 (owner decision Q-v3-1 (b)).

**v3 §Open Questions v3, Q-v3-1 status.** *"OPEN — owner decision needed.
Default applied: none (current behavior kept)."* becomes **"RESOLVED
2026-09-25 — owner chose (b). Implemented by `docs/PRD-addendum-v4.md` F21."**

---

## Features (v4)

### F21 — Restart Level rolls the score back to the level-start score
Traces to: UC7 (restart a level), UC3/UC5 and goals P5, B3 (as F10); segment
C beat-my-best motivation. Owner decision Q-v3-1 (b), 2026-09-25 (options and
reasoning in `docs/PRD-addendum-v3.md` §Q-v3-1).

- Description: When the player picks **Restart Level** from the pause menu,
  the score goes back to what it was when that level began. A player can no
  longer farm points by clearing most of a level, restarting and repeating.
  The saved best (F20) then reflects a real run. Everything else about Restart
  Level stays the same: same level, no intro (v2 F18 AC9), no confirmation,
  lives and permanent multiplier kept.

**Supersedes / amends:** `docs/PRD.md` F6 AC4 and F10 AC4, and the v3 text
listed in §Amendments above. **No change** to F6 AC5/AC11 (Restart Game), F6
AC3 (Resume keeps everything), F7 AC7 (permanent multiplier resets only on
Restart Game or a new run), v2 F12 AC4 (the boss phase keeps the score), v2
F18 AC9, v3 F20 AC1-AC3 and AC5-AC15, or NFR-8 instrumentation. Tests
affected: any test asserting that `resetForLevel` or Restart Level keeps
`world.score` (for example in `src/core/world.test.ts` and
`src/core/GameStateMachine.test.ts`).

**Acceptance Criteria (website and Android, one shared implementation):**

1. **Rollback.** After Restart Level, the score shown in the HUD on the first
   frame of the restarted level equals the level-start score. *Test:* start
   level N with score S, earn points (kills, power-up catch bonus) to reach
   S + k, pause, choose Restart Level. The HUD shows S.
2. **Level 1.** Restart Level on level 1 of a run sets the score to **0**.
3. **Repeatable.** Choosing Restart Level any number of times in a row on the
   same level always returns to the **same** level-start score. It is never
   re-recorded by a restart. *Test:* earn points, restart, earn different
   points, restart again. Both restarts give S.
4. **Level-start score is recorded at level entry.** It is recorded when the
   level is entered by a new run (0), by a level advance (including advancing
   from level 5 after its boss, v2 F12 AC7), or by Restart Game (0). It is
   recorded **before** the v2 F18 "LEVEL [N]" intro starts. No points can be
   earned during the intro, so the value is the same whether it is read before
   or after the intro. Pausing during the intro and choosing Restart Level gives
   the level-start score.
5. **Boss phase.** On levels 5 and 10, Restart Level during the boss-incoming
   warning or the boss phase restarts the whole level from its formation (as
   it does today). The score returns to the level-start score, removing both
   formation and boss points earned in the abandoned attempt.
6. **Only the score is rolled back.** Restart Level does **not** change lives
   (including lives gained by shield catches, v2 F16 AC2, and lives lost in the
   attempt) or the permanent hit-power multiplier (F7 AC7). The active
   temporary effect is cleared, as today. *(See Q-v4-1 for whether the owner
   wants the multiplier rolled back too. The default is no.)*
7. **Interaction with the saved best (F20). This is an accepted behavior, not
   a defect.**
   (a) Restart Level triggers **no** save and **never lowers** the saved best
   (F20 AC4, AC5).
   (b) A best saved **mid-level** can include points that a later Restart
   Level rolls back. The case: the page becomes hidden (website, F20 AC4(e)) or
   the app goes to the background (Android, `docs/mobile/PRD-mobile.md` M7.2)
   while the current score is above the saved best, so the best is saved. The
   player then returns and chooses Restart Level. The saved best **keeps**
   the higher, pre-rollback value. The owner accepts this: it takes a
   deliberate tab-switch or backgrounding at the right moment, it only affects
   that player's own device, and preventing it would mean saving only at run
   end, which risks losing a real best to a closed tab or Android process death
   (M4.6). Tests must **assert** this behavior: best stays at the pre-rollback
   value after Restart Level.
   (c) Every later save event in the run (F20 AC4 (a)-(e)) uses the current,
   rolled-back score: saved best = max(previous best, current score).
   (d) "New best!" (F20 AC3) is unchanged. It compares the final score with
   the best saved before the run ended, and that includes any mid-level save
   from (b). So after the (b) case the run may end without "New best!" even
   though it beat the best from earlier runs. This is expected.
8. **Nothing else in the run is rolled back or reset.** The level number, the
   run-level instrumentation counters (NFR-8) and the saved best stay as they
   are. Level advance, pause/Resume and the boss phase keep the score (F10 AC4,
   F6 AC3, v2 F12 AC4).
9. **Restart Game unchanged.** Confirmed Restart Game saves the best first
   (F20 AC4(c)) and then sets the score to 0. Cancelled Restart Game changes
   nothing.
10. **Legible.** The rolled-back score is visible in the HUD at once. No
    animation, message or confirmation is required. If ui-ux-designer or
    mobile-ui-ux-designer finds the drop confusing, a short non-blocking cue
    (for example the score panel flashing once) is allowed within this AC. It
    must not delay play.
11. **One implementation.** The level-start score and the rollback live
    **once** in shared `src/` (for example a `levelStartScore` field recorded
    in the level-entry path and applied by Restart Level). They are used
    unchanged by the website and the Android app. No platform-specific code is
    involved: Restart Level is reached through the same pause menu on both
    platforms (touch or back-button entry into the pause menu is already
    platform code under `docs/mobile/PRD-mobile.md` M4/M5 and does not change).

---

### F22 — Rename: "Shield vs Robots", hero "ShieldMan", enemies "robots"
Traces to: UC6 (instantly recognize the shield-hero vs. robots premise), goal
P1; NFR-10 / F9 AC4 (IP avoidance). Owner decisions 2026-09-25 (product and
enemy rename; hero rename). Also answers the IP concern raised in
`docs/mobile/security/review-v1.md` M5 / `docs/mobile/PRD-mobile.md` OQ-S1
(Marvel's X-Men "Sentinels") by removing that name from all player-facing
text.

- Description: Everything a player sees or hears uses the new names. The
  product is **"Shield vs Robots"**, the hero is **ShieldMan**, and the enemies
  are **robots**. Only names and wording change. No game rule, sprite shape,
  colour or storage changes. Internal code names and saved data keys stay the
  same, so players keep their saved best and settings.

**Supersedes / amends (quoted v1 text → v4 text):**

| Where | v1 text (quoted) | v4 text |
|---|---|---|
| `docs/PRD.md` title | "Vanguard vs. Sentinels: Shield Invaders" | "Shield vs Robots" |
| Theme note | "the hero is **Vanguard** (an original shield-throwing soldier/hero) and the enemies are **Sentinel** robots" | "the hero is **ShieldMan** (an original shield-throwing hero) and the enemies are **robots**" |
| Terminology | "\"Vanguard\" = the player character; \"Sentinel\" = an enemy robot." | "\"ShieldMan\" = the player character; \"robot\" = an enemy." |
| Summary | "an original **Vanguard vs. Sentinels** theme ... controls Vanguard ... formations of Sentinel robots" | "an original **Shield vs Robots** theme ... controls ShieldMan ... formations of robots" |
| F9 description | "The **Vanguard vs. Sentinels** premise ... Vanguard is an original shield-throwing hero ... the enemies are original Sentinel robots." | "The **Shield vs Robots** premise ... ShieldMan is an original shield-throwing hero ... the enemies are original robots." |
| F9 AC1 | "The player character reads as **Vanguard**, an original shield-throwing hero, and the enemies read as **Sentinel** robots, communicated purely visually with no required reading" | "The player character reads as **ShieldMan**, an original shield-throwing hero, and the enemies read as **robots**, communicated purely visually with no required reading" (unchanged otherwise) |
| F9 AC4 | "Specifically: the hero is named Vanguard and the enemies are Sentinels;" | "Specifically: the product is named **Shield vs Robots**, the hero is named **ShieldMan** and the enemies are called **robots**;" followed by the F22 AC8-AC10 rules. The rest of F9 AC4 is unchanged. |
| NFR-10 | "Vanguard/Sentinels original designs only." | "ShieldMan/robots original designs only, plus F22 AC8-AC10." Hard requirement, not contingent (unchanged). |
| §Out of Scope (v1) bullet 7 | "Multiple playable characters or enemy factions beyond the Vanguard-vs-Sentinels premise." | "Multiple playable characters or enemy factions beyond the Shield vs Robots premise." |
| v2 / v3 | "Vanguard" (hero) and "Sentinel(s)" (enemies) throughout, e.g. v2 F13 "humanoid Vanguard redesign", F14 "Vanguard avatar", F17 | Read as "ShieldMan" and "robot(s)" for all player-facing purposes. The v2/v3 rules themselves (art shapes, colours, the shared blue constant) are unchanged. |

**Acceptance Criteria (website; Android equivalents in §Cross-platform consistency):**

1. **Product name, exact form.** The product name is **"Shield vs Robots"**:
   "vs" with no period, no colon, no subtitle. The old subtitle "Shield
   Invaders" is removed from all player-facing text (PM default, see Q-v4-2).
   All-caps display ("SHIELD VS ROBOTS") is allowed where the design uses all
   caps. Tests compare case-insensitively.
2. **Page title and meta.** `document.title` is exactly "Shield vs Robots".
   Every `<meta>` element whose content names the product (for example
   `description`, `application-name`, `apple-mobile-web-app-title`,
   `og:title`, `og:site_name`, `twitter:title`), and any web manifest `name` /
   `short_name`, uses "Shield vs Robots". None exist today. Any added later
   must follow this AC. No meta content contains "Vanguard", "Sentinel" or
   "Shield Invaders".
3. **Title screen.** The title screen heading reads "Shield vs Robots" (AC1
   casing rule). The title overlay's accessible name ("Title screen" today)
   does not use the old names.
4. **End screens and in-play text.** The Game Over screen, the Game Complete
   sequence, the danger warning (F3 AC6) and every other in-game message
   use "robots" wherever "Sentinel(s)" appeared. Known strings today:
   - "The Sentinel forces have been defeated." → "The robot forces have been
     defeated."
   - "WARNING: SENTINELS APPROACHING" → "WARNING: ROBOTS APPROACHING"
   The wording may be refined by ui-ux-designer, as long as AC5 holds.
5. **No old names anywhere player-facing.** Across **every** screen and state
   (title, title with the F6 AC9 quit message, play, level intro, boss
   warning, pause, Restart Game confirmation, Game Over, Game Complete, and on
   Android the first-launch help, settings and back-button dialogs), no
   player-facing text contains "Vanguard", "Sentinel" or "Shield Invaders"
   (case-insensitive). *Test:* render each state and collect all DOM text
   nodes, `aria-label`/`title`/`alt` attributes, `document.title`, `<meta>`
   content and every string passed to the canvas `fillText`/`strokeText`.
   Assert none contains the three banned strings. Also assert the title
   contains "Shield vs Robots".
6. **The hero's name is ShieldMan.** Wherever the hero is named in
   player-facing text, it is "ShieldMan" (AC1-style casing: all caps only
   inside all-caps text). No such text exists in-game today, and none is
   required. The name must appear in the product-facing docs (AC11) and, on
   Android, wherever the listing or help names the hero.
7. **No gameplay change.** Enemy behavior, HP, art, colours, the shield's
   shape and colour, ShieldMan's art (v2 F13) and every other F1-F21 rule are
   unchanged. The rename changes text only. Existing gameplay tests pass
   unchanged, except tests that assert the old strings, which are updated to
   the new ones.
8. **IP rule — NFR-10 intent kept and tightened.** The intent of F9 AC4 /
   NFR-10 stays binding in full: fully original names, art and logos, with no
   licensed (Marvel or other) names, likenesses or trademark-adjacent motifs.
   In addition:
   (a) The word "Shield" is **never** styled as **S.H.I.E.L.D.** or with
   periods, dots or separators between its letters, in any text, logo, icon or
   store asset. It is never paired with an agency, eagle or government-style
   emblem.
   (b) **No shield** anywhere in the product (the thrown shield, icon, splash,
   logo, store art, title art) uses a **red/white/blue star design**: no star
   on a shield, no red-white-blue concentric rings, no red-white-blue colour
   scheme. The v2 F14 plain avatar-blue circle with its thin outline already
   meets this and does not change.
9. **IP rule for ShieldMan (PM addition within NFR-10's intent).** ShieldMan's
   art, icon and store imagery never use a star emblem, stars-and-stripes, or
   a red-white-blue colour scheme on the costume or helmet. The v2 F13
   blue-and-white design already meets this. The reason: a shield-carrying hero
   with a patriotic star costume is the combination closest to existing
   shield-hero characters (Marvel's Captain America; Archie Comics' "The
   Shield"). The new names bring the word "Shield" to the front, so the visual
   rule must stay strict.
10. **Robots stay generic.** Calling the enemies "robots" does not relax F9
    AC4's rule that enemy robots must not copy any trademarked robot
    character's model or silhouette. The OQ-S1 art constraint (no giant
    purple/magenta humanoid robot, `docs/mobile/PRD-mobile.md` OQ-S1 (a)) still
    applies as good practice even though the name risk is gone.
11. **Product-facing docs.** `docs/README.md` (title and description) and
    `docs/GLOSSARY.md` use "Shield vs Robots", "ShieldMan" and "robot". The
    glossary keeps entries for "Vanguard" and "Sentinel" marked **"former
    name (renamed v4, 2026-09-25)"** so older docs can still be read.
    `package.json` `description` uses the new product name. These updates are
    owned by docs-writer (website step 13) and mobile-technical-writer (Android
    step 13).
12. **Internal identifiers may stay (explicit).** Source identifiers (for
    example `drawVanguard`, `drawSentinel`, `VANGUARD_BLUE`, `VANGUARD_WHITE`),
    code comments, file names, the npm package `name` (`vanguard-vs-sentinels`),
    Docker Compose service/image names, CI workflow names, and the Terraform
    README **do not have to change**. Renaming them is allowed but optional and
    must not change behavior. **Past audit docs** (v1-v3 PRDs, reviews, test
    reports, ADRs) are **not** rewritten. They keep the old names as history
    (traceability-conventions).
13. **Saved data keys must NOT change (explicit, binding).** The existing
    local storage keys stay exactly as they are: **`vvs:metrics`**,
    **`vvs:best`** and **`vvs:settings`** (the `vvs:` prefix is the old
    initials and stays). The rename must not add a migration, clear, or re-key
    any stored value. *Test (website):* set `vvs:best` = `12450` and a valid
    `vvs:metrics` on the pre-rename build, load the post-rename build at the
    same address. The title shows "Best: 12450" and the counters are intact.
    *Test (Android):* the same, installing build N+1 over build N
    (`docs/mobile/PRD-mobile.md` M7.4). The saved best and settings survive.
14. **Site address unchanged.** The rename must not change the website's
    address (origin and path, today GitHub Pages `/ahogancamp_portfolio/`).
    The saved best is kept per site address (F20 AC6), so moving it would reset
    every player's best. If the owner ever wants a renamed URL, that is a
    separate decision with its own migration question.
15. **One implementation.** The shared player-facing strings (title, end
    screens, in-play messages) live once in shared `src/` and are used by both
    platforms. Only Android-only text (launcher label, splash, store listing,
    Android help/settings/back dialogs) is set in the Android project or
    listing, per `docs/mobile/PRD-mobile.md`.

---

## Cross-platform consistency (F21/F22 ↔ `docs/mobile/PRD-mobile.md`)

mobile-product-manager is recording the same two decisions in
`docs/mobile/PRD-mobile.md` at the same time. This document does **not** edit
it. Both pipelines' reviewers should check that these rows line up. If either
document changes a row, the other gets a dated note (§0 rule 3).

| Shared rule | Website (this doc) | Android (`docs/mobile/PRD-mobile.md`) — expected touch point | Same? |
|---|---|---|---|
| Restart Level → score = level-start score | F21 AC1-AC5 | M7.2's "Restart Level ... keeps the run's score under current behavior ... Q-v3-1 pending" sentence should be replaced by a dated note citing v4 F21. Q-v3-1 entry in §7 → resolved (b). | Yes (shared code, F21 AC11) |
| Lives and permanent multiplier not rolled back | F21 AC6 | No mobile-specific change | Yes |
| Best saved while hidden/backgrounded may keep rolled-back points (accepted) | F21 AC7(b): page hidden | M7.2: app goes to the background (and M4.6 process death) | Same rule, platform trigger |
| Product name "Shield vs Robots" | F22 AC1-AC3 | M9.1 store title and launcher label; `capacitor.config.ts` `appName` (architecture doc currently shows 'Vanguard vs. Sentinels'); splash; M12 listing and screenshots | Same name. Platform surfaces differ. |
| Hero "ShieldMan", enemies "robots" | F22 AC4-AC6 | M8.1 help text, M12 listing copy, screenshot captions | Yes |
| No old names in player-facing text | F22 AC5 | Plus launcher label, store listing, splash, Android dialogs | Yes (Android adds surfaces) |
| S.H.I.E.L.D. styling ban, no red/white/blue star shield, ShieldMan costume rule | F22 AC8-AC10 | M9.3 / M11.7 (icon, splash, store art) | Yes |
| Storage keys `vvs:*` unchanged; data survives the update | F22 AC13 | M7.4 (install N+1 over N) | Yes |
| "Sentinels" IP concern | Removed from player-facing text by F22 | OQ-S1 can be closed as resolved by the rename (effectively option (b)) | — |

**Follow-ups for the mobile pipeline (not edited here, per instruction):**
- **M9.1** assumed the name "Vanguard vs. Sentinels" and warned against
  shortening it to "Vanguard" (The Vanguard Group). That warning is now moot.
  The new label "Shield vs Robots" is 16 characters. mobile-marketing-analyst
  should refresh `listing-draft.md` and the name-conflict check in
  `play-store-research.md` §3/§4 for "Shield vs Robots" and "ShieldMan" (see
  Q-v4-2).
- **App ID (OQ-M11).** The placeholder `io.github.hogy86.vanguardvssentinels`
  is permanent after the first Play upload. It is not player-facing and F22
  AC12 does not require changing it, but OQ-S1 (b) already noted it "should
  change before the first upload" if the enemies were renamed. That is
  mobile-product-manager's call under OQ-M11 and must be settled before
  mobile step 15. Changing the app ID before any upload loses no player data,
  since nothing has been published yet.

---

## Cross-cutting NFR notes (v4)

- **NFR-7 (no backend):** unchanged. F21 and F22 are fully client-side.
- **NFR-8 (instrumentation):** unchanged. No new events. The `vvs:metrics`
  key and its format are unchanged (F22 AC13). Restart Level still counts as
  it does today, and the rollback does not touch the counters (F21 AC8).
- **NFR-9 (legibility):** applies to the renamed strings as it did to the old
  ones. "WARNING: ROBOTS APPROACHING" keeps the F3 AC6 non-colour-only
  treatment.
- **NFR-10 (IP):** amended and tightened by F22 AC8-AC10. It stays a **hard
  requirement**.
- **Security (re-review required, both pipelines):** F21 changes no stored
  data. F22 changes no stored data and no keys (AC13). Pass 2 reviewers should
  confirm AC13 (no migration or re-keying code was added) and check the IP
  rules AC8-AC10 against the final art, icon and listing. On Android, this also
  closes the OQ-S1 finding.

---

## Out of Scope (v4 — v1, v2 and v3 lists still hold, with the amendments above)

- Renaming internal code identifiers, file names, the npm package, Docker
  services, CI workflow names or storage keys (optional, not required; storage
  keys must **not** change, F22 AC13).
- Changing the website's address/URL (F22 AC14).
- Any art, colour or shape change to ShieldMan, the robots or the shield.
  F22 is text only (AC7).
- Rewriting past audit docs to use the new names.
- Rolling back lives or the permanent multiplier on Restart Level (F21 AC6;
  see Q-v4-1).
- An in-game "reset best" option or any other change to F20 besides the
  interaction documented in F21 AC7.
- A new logo or wordmark. If one is made later, it must follow F22 AC8-AC10.

---

## Open Questions v4 — for owner decision

| # | Question | Status |
|---|---|---|
| Q-v4-1 | Should Restart Level also roll back the permanent multiplier? | **OPEN — not blocking.** Default applied: no (score only, exactly as decided). |
| Q-v4-2 | Confirm dropping the "Shield Invaders" subtitle, and run a name check on "Shield vs Robots" / "ShieldMan" | **OPEN — not blocking.** Default applied: subtitle dropped; name check scheduled in the mobile pipeline before the first Play upload. |

### Q-v4-1 — Permanent multiplier can still be farmed with Restart Level
**Issue (plain terms).** F21 stops score farming. But Restart Level also keeps
any **permanent ×1.8 hit-power multiplier** caught during the abandoned
attempt (F7 AC7 says it resets only on Restart Game or a new run). A player
could catch it, restart the level, and catch another, making later levels
easier and the final score higher. The effect on Best is much smaller than
score farming: the guaranteed drop is a random type, and points still have
to be earned. **Affects:** `docs/PRD.md` F7 AC7, F21 AC6, both pipelines'
code/test/UX gates, and `docs/mobile/PRD-mobile.md` M7.2 note.
- **(a) Leave it (default).** Score only, exactly as the owner decided. No
  extra cost. Small residual farming path.
- **(b) Also roll back the permanent multiplier to its level-start value.**
  Same code location as F21 (record it alongside the level-start score), plus
  a few tests. It amends F7 AC7. The two gate runs are already open for F21,
  so the added cost is small. It makes Restart Level a true "redo this level".
- **(c) Roll back multiplier and lives.** This makes Restart Level a full
  undo, and it opens a new exploit: lose lives, restart, get them back. Not
  recommended.

**Recommendation: (b)** if the owner wants Best to mean "one clean run";
otherwise (a) is fine and can be revisited later. Lives should stay as they
are in either case.

### Q-v4-2 — Subtitle and name check
**Issue (plain terms).** (1) The old full name had a subtitle, "Shield
Invaders". The owner's new name is "Shield vs Robots", so this addendum
**drops the subtitle** (F22 AC1). "Invaders" also leans on the Space Invaders
name, so dropping it reduces risk too. (2) "Shield vs Robots" and "ShieldMan"
have not been checked for conflicts on Google Play or with existing
characters. The mobile pipeline already does this kind of check for the store
title (`play-store-research.md` §3). **Affects:** F22 AC1, mobile M9.1 / M12,
mobile-marketing-analyst.
- **(a) Drop the subtitle, run the name check before the first Play upload
  (default, recommended).** Low cost (one research pass). It catches a
  conflict while the store title and app ID can still change freely.
- **(b) Keep a subtitle** (for example "Shield vs Robots: Shield Invaders").
  Small text change in F22 AC1-AC3, but it brings back the "Invaders"
  association. Not recommended.
- **(c) Skip the name check.** No cost now, but a conflict found after launch
  means changing the store title under a live listing.

---

## Pipeline impact (both platforms, per `.claude/CLAUDE.md` §One codebase)

F21 and F22 are shared game changes, so before **either** version ships they
must pass:
- **Website:** ui-ux-designer (renamed strings, rollback legibility F21
  AC10), security-compliance-reviewer (F22 AC8-AC10, AC13), code-reviewer
  loop, test-writer / test-validator (F21 AC1-AC9 incl. the AC7(b) accepted
  case; F22 AC5 banned-string scan, AC13 data-survives test), docs-writer
  (F22 AC11), UAT (product-manager), then deploy + smoke (the smoke test
  checks the deployed page title reads "Shield vs Robots").
- **Android:** the matching mobile gates (mobile-ui-ux-designer incl. store
  assets, mobile-security-compliance-reviewer incl. OQ-S1 closure,
  mobile-lead-developer, mobile-lead-tester incl. M7.4 upgrade test with the
  `vvs:*` keys, mobile-technical-writer, mobile UAT).
- `.github/workflows/deploy-pages.yml` remains the single CI check. F21 unit
  tests and the F22 banned-string scan run there for both platforms.
- No solution-architect ADR is required: F21 adds one field to existing world
  state, and F22 is text only. solution-architect may note F21 in the
  architecture doc's world-state section.

---

## Traceability check (v4)

F21 traces to UC7, UC3/UC5, P5, B3 and segment C, under owner decision
Q-v3-1 (b). F22 traces to UC6, P1 and NFR-10 / F9 AC4, under the owner's
2026-09-25 rename decisions, and it answers mobile OQ-S1 /
`docs/mobile/security/review-v1.md` M5. Every amended v1 AC (F6 AC4, F10 AC4,
F9 AC1, F9 AC4), NFR-10, the name-bearing v1 sections, and the affected v3
text (F20 AC4 closing paragraph, the F20 "No change to F6 AC4" line, the §Out
of Scope (v3) bullet, the Q-v3-1 status) are quoted next to their
replacements. `docs/PRD.md`, v2 and v3 are left unedited, and this addendum is
authoritative where they differ. Each rule has an Android counterpart in
§Cross-platform consistency. `docs/mobile/PRD-mobile.md` is cross-referenced,
not edited. Two non-blocking owner questions (Q-v4-1, Q-v4-2) are listed with
options, recommendations and the defaults applied.
