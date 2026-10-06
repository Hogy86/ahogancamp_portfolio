# Product Requirements Document — Addendum v3

**Product:** Vanguard vs. Sentinels: Shield Invaders
**Stage:** 2 — Product Manager (PRD addendum, shared game change)
**Date:** 2026-09-25
**Author:** product-manager subagent
**Status:** v3 — DECIDED in scope (owner decision OQ-M8 (a), 2026-09-25).
One follow-up question (Q-v3-1, Restart Level score farming) is open for the
owner in §Open Questions v3. It does **not** block this addendum: the ACs
below are written against today's Restart Level behavior, and Q-v3-1 only
adds a rule if the owner chooses to.

**What this addendum does.** It makes exactly one shared game change: a
**locally saved best score ("Best: N")** on **both** the website and the
Android app. It amends `docs/PRD.md` **F10 AC6** (score is session-only) and
the matching **§Out of Scope (v1)** bullet. Nothing else in F1-F19 changes.
The Android-side requirements for the same feature are in
`docs/mobile/PRD-mobile.md` **M7.1, M7.2** (and M7.4-M7.6). This document is
the shared source of truth for the game rule. The mobile PRD maps it to
Android lifecycle and storage. §Cross-platform consistency lists how they line up.

**Sources (upstream):**
- `docs/PRD.md` — v1 spec. F10 (session score) is the feature amended here;
  F6 AC4-AC6/AC11 (restart/quit), F8 AC5-AC7 (end screens), NFR-7 (no
  backend), NFR-8 (localStorage instrumentation), NFR-9 (legibility) are
  referenced.
- `docs/PRD-addendum-v2.md` — v2 spec. F19 AC7-AC9 (Game Complete shows the
  final score; optional key-hold) is referenced. F-numbering continues here at
  **F20**.
- `docs/mobile/PRD-mobile.md` — §0 rule 3 (shared game changes go through both
  pipelines), M7.1-M7.6 (saved best score and settings on Android), M4.6
  (process death), M6.3 (Quit saves best first), M11.3 (no data collection),
  §7 OQ-M8 (owner decision: option (a), local "Best: N" on both platforms).
- `docs/market/voice-of-customer.md` — segment C "screenshot a high score" /
  skill-chaser motivation. `docs/market/market-goals-and-use-cases.md` — UC3,
  UC5, goals P5, B3 (same traces as F10).
- Existing implementation, read to ground the ACs in what exists:
  - `src/instrumentation/Instrumentation.ts`: current on-device localStorage
    counters (key `vvs:metrics` in `src/config/constants.ts`), and the
    fail-closed read pattern required by `docs/security/security-review-v1.md`
    MEDIUM #1.
  - `src/core/GameStateMachine.ts`: pause options. Restart Level calls
    `resetForLevel` and keeps the run's score. Restart Game is behind the
    F6 AC11 confirmation. Quit attempts tab close and falls back to TITLE.
  - `src/core/world.ts`: `resetForLevel` does not reset `world.score`.
  - `src/ui/ScreenController.ts`: Game Over and Game Complete already render
    `Final Score: N`.

**Terminology (carried from v1/v2):** "run" = one full playthrough from
level 1. New in v3:
- **"best score" / "Best"**: the highest **final score of any run** played
  in this browser profile on this site (website) or on this device (Android).
- **"final score"**: the value of the run's score at the moment the run
  ends, by any of the run-ending events in F20 AC4.
- **"page hidden"**: the browser reports the game page is no longer visible
  (tab switched, window minimized, tab or browser closing), i.e.
  `visibilitychange` to `hidden` or `pagehide`. It is the website counterpart
  of Android's "app goes to the background" in M7.2.

---

## Summary of the change → feature mapping

| # | Owner decision (short) | Feature | Amends v1/v2 |
|---|---|---|---|
| 1 | OQ-M8 (a): add a locally saved "Best: N" on both website and Android. Data stays on the device, no network. | **F20** | `docs/PRD.md` F10 description + **F10 AC6**. §Out of Scope (v1) bullet 1. Touches F8 AC5 and F19 AC7 (end screens gain a Best line). No change to F6, NFR-7, or NFR-8. |

---

## Amendment to `docs/PRD.md` F10

**F10 description, amended.** The phrase *"The score is session-only — there
is no leaderboard, no cross-session persistence, and no online high-score
table"* is replaced by: *"The running score is per-run. A single **best
score** is saved on the player's own device (F20). There is no leaderboard,
no online high-score table, and no multi-entry score history."*

**F10 AC6, superseded.** The v1 text is:

> 6. The score is **session-only**: it is not written to a leaderboard and is
> not required to persist beyond the current run/tab (no backend, consistent
> with NFR-7).

It is replaced by:

> 6. **(v3, amended by F20.)** The **running score** is per-run: it starts at
> 0 each run (AC1, AC4) and is not written to any leaderboard or server. The
> **one** value that persists beyond the run is the device-local **best
> score** defined in **F20**. It is stored only in the browser's local
> storage (website) or on the device (Android, `docs/mobile/PRD-mobile.md`
> M7). It is never transmitted anywhere. No backend is used, consistent with
> NFR-7.

F10 AC1-AC5 are **unchanged**. In particular, AC4 (score resets to 0 on
Restart Game / fresh run) applies to the running score only. The best score
is never reset by any in-game action (F20 AC8).

---

## Features (v3)

### F20 — Saved best score ("Best: N"), on-device
Traces to: UC3, UC5, goals P5, B3 (as F10). Segment C "screenshot a high
score" / beat-my-best motivation. Mobile UC-M2 ("come back tomorrow and see
my best"). Owner decision OQ-M8 (a), `docs/mobile/PRD-mobile.md` §7.

- Description: The game remembers the highest final score ever reached on
  this browser (website) or device (Android). It shows it as **"Best: N"** on
  the title screen and on both end screens (Game Over, Game Complete). When a
  run beats the saved best, the end screen says **"New best!"**. The value is
  a single integer kept on the player's own device. It is not an account, not
  a leaderboard, and never leaves the device.

**Supersedes / amends:** `docs/PRD.md` F10 description and **F10 AC6** (see
§Amendment above). §Out of Scope (v1) bullet 1 (see §Out of Scope (v3)).
Additive to **F8 AC5** (Game Over shows the final score) and **v2 F19 AC7**
(Game Complete shows the final score): both screens also show the Best line.
**No change** to F6 AC4 (Restart Level), F6 AC5/AC11 (Restart Game +
confirmation), F6 AC6/AC9 (Quit + fallback), F19 AC5/AC8/AC9 (auto-return,
run reset, key-hold). **No change** to NFR-8: the instrumentation counters
are separate data (AC11). v1 tests affected: any test asserting F10 AC6's
"not persisted" wording, and end-screen/title-screen DOM snapshot tests in
`src/ui/ScreenController.test.ts`.

**Acceptance Criteria (website; Android equivalents in §Cross-platform consistency):**

1. **Title screen.** The title screen shows the text **"Best: N"**, where N
   is the saved best score as a whole number. On a first visit, with no
   saved value, it shows **"Best: 0"**.
2. **End screens.** The Game Over screen (F8) and the Game Complete sequence
   (F19) each show **"Best: N"** next to the existing "Final Score: N" line
   (F8 AC5, F19 AC7). On Game Complete it stays visible for the whole 5-second
   sequence and throughout the optional F19 AC9 key-hold.
3. **"New best!" marker.** If the run's final score is **strictly greater**
   than the best score saved before the run ended, the end screen shows
   **"New best!"** and "Best: N" shows the new value (equal to the final
   score). If the final score is equal to or lower than the previous best, no
   marker is shown and Best is unchanged. A final score of 0 never shows the
   marker.
4. **When the best is saved.** After each of the following, the saved best
   equals max(previous best, current score):
   (a) the run ends in **Game Over** (saved when the Game Over screen appears);
   (b) the run ends in **Game Complete** (saved when the sequence begins, not
   after the 5 s, so a tab closed during the celebration keeps it);
   (c) **Restart Game** is **confirmed** (F6 AC11), saved before the score
   resets to 0. Cancelling the confirmation saves nothing and changes nothing;
   (d) **Quit** is selected (F6 AC6), saved **before** the tab-close attempt,
   so it holds whether the tab closes or the F6 AC9 fallback appears;
   (e) the **page becomes hidden** during a run (tab switch, minimize, tab or
   browser close) while the current score exceeds the saved best. This is the
   website counterpart of M7.2's "app goes to the background".
   **Restart Level** (F6 AC4) does not end the run and triggers no save by
   itself. The run's score carries on under current behavior (see Q-v3-1), and
   rules (a)-(e) still apply later in the same run.
5. **Never decreases.** No event in the game ever lowers the saved best. A
   lower-scoring run leaves it unchanged.
6. **Persistence (website).** The saved best is still there after: a page
   reload, closing and reopening the tab, closing and reopening the browser,
   and a new deploy of the site to the same address (tested by setting a
   best, deploying a new build, and reloading). It is kept **per browser
   profile, per site address**. A different browser, profile, or device has
   its own best, and this is expected, not a defect. In private/incognito
   windows the browser may discard it when the window closes. That is also
   expected.
7. **Clearing.** The best is erased only when the player clears the site's
   data through their browser. After that the game behaves like a first visit
   ("Best: 0", AC1), with no error.
8. **No in-game reset.** No in-game action resets the best score: not
   Restart Level, not Restart Game, not Quit, not the F19 return to title,
   not a new run. The F6 AC11 Restart Game confirmation text needs no change.
   It refers to the current run's score. If ui-ux-designer finds the wording
   ambiguous, a clarifying copy change is allowed within this AC.
9. **Bad or missing stored data (fail closed).** If the stored value is
   missing, not valid JSON or not a number, negative, not a whole number, not
   finite, or larger than `Number.MAX_SAFE_INTEGER`, the game treats the best
   as **0**. It does not crash, shows no error to the player, and plays
   normally. The next valid save overwrites the bad value. This follows the
   same fail-closed pattern `docs/security/security-review-v1.md` MEDIUM #1
   required for the instrumentation read path. Test inputs must include at
   least: `"abc"`, `"-5"`, `"1.5"`, `"{}"`, `"null"`, `"1e400"`, and an empty
   string.
10. **Storage unavailable.** If the browser blocks or rejects local storage
    (disabled storage, full quota, some private modes), the game still starts
    and plays a full run with no error shown. "Best: N" shows the highest
    final score reached **in the current page session** (kept in memory). A
    failed write never interrupts or delays gameplay.
11. **Separate from instrumentation.** The best score is stored separately
    from the NFR-8 instrumentation counters. Corrupting or clearing either one
    does not reset or change the other, and the instrumentation validation
    rules do not reject a valid best score (and vice versa).
12. **Stays on the device.** Reading or saving the best score makes **no
    network request** and sets **no cookie**. The only thing stored is a single
    whole number: no name, initials, timestamp, run history, or identifier.
    Verified by recording browser network activity over a full run that sets
    a new best: no request other than the site's own static assets. Consistent
    with NFR-7 and `docs/mobile/PRD-mobile.md` M7.6 / M11.3.
13. **Legibility.** "Best: N" and "New best!" meet NFR-9. They stay readable
    against the background, including over the F19 fireworks. "New best!" is
    shown as **text**, not by colour alone. Both use the same readable HUD/end-
    screen type treatment as "Final Score: N".
14. **Not in the play HUD.** The best score is **not** added to the in-play
    HUD (F10 AC1 / NFR-9(b) HUD set unchanged). It appears only on the title
    screen and end screens. This matches `docs/mobile/PRD-mobile.md` M7.1.
15. **One implementation.** The rule for what the best is, when it is saved,
    the "New best!" logic, and data validation lives **once** in the shared
    `src/`. It is used unchanged by the website and the Android app, per the
    one-codebase rule in `.claude/CLAUDE.md`. Only the trigger for AC4(e)
    (page hidden on the web, app backgrounded on Android) is platform-specific
    lifecycle code.

---

## Cross-platform consistency (F20 ↔ `docs/mobile/PRD-mobile.md` M7)

Both pipelines' reviewers should check that these rows stay aligned. If
either document changes a row, the other must be amended with a dated note
(`docs/mobile/PRD-mobile.md` §0 rule 3).

| Shared rule | Website (this doc) | Android (`docs/mobile/PRD-mobile.md`) | Same? |
|---|---|---|---|
| "Best: N" on title + Game Over + Game Complete | F20 AC1, AC2 | M7.1 | Yes |
| "New best!" on end screen when the best is beaten | F20 AC3 (strictly greater) | M7.1 | Yes. M7.1 does not say "strictly greater". Mobile PM should adopt AC3's wording so the tests agree. |
| Save on Game Over, Game Complete, Restart Game, Quit | F20 AC4 (a)-(d) | M7.2; M6.3 (Quit saves first) | Yes |
| Save when leaving mid-run with a higher score | F20 AC4(e): page hidden | M7.2: app backgrounded (covers M4.6 process death) | Same rule, platform trigger (AC15) |
| Never decreases; no in-game reset | F20 AC5, AC8 | M7.2 (implied), M7.4 | Yes |
| Survives restart/update | F20 AC6: reload, browser restart, new deploy | M7.4: app close, process death, reboot, Play update | Same intent, platform-specific tests |
| Erased only by clearing site/app data | F20 AC7 | M7.4 (uninstall / Clear storage) | Yes |
| Bad data → best = 0, no crash | F20 AC9, AC10 | M7.5 | Yes |
| Nothing leaves the device | F20 AC12 | M7.6, M11.3 | Yes |
| Not shown in play HUD | F20 AC14 | M7.1 (title/end screens only) | Yes |

**Follow-ups for the mobile pipeline (not edited here, per instruction):**
- `docs/mobile/PRD-mobile.md` M7.1/M7.2 are still labelled "PM default,
  pending OQ-M8 — requires a shared PRD amendment". This addendum is that
  amendment. mobile-product-manager should update those labels with a dated
  note citing `docs/PRD-addendum-v3.md` F20, and take in AC3's
  "strictly greater" rule.
- **Storage backend (architect note, not a PRD decision).** M7.4 requires the
  best to survive app updates and reboots. If the Capacitor WebView's
  localStorage meets M7.4 on the emulator, one storage implementation serves
  both platforms. If Android needs a different backend (e.g. the Capacitor
  Preferences plugin), mobile-solution-architect must record that in an ADR
  and keep AC15 intact: a small storage adapter behind one shared best-score
  module. Storage is not one of the listed platform-specific areas in
  `.claude/CLAUDE.md`, so if an adapter is needed, product-manager will raise
  it with the owner as a narrow exception. It is not being decided here.

---

## Cross-cutting NFR notes (v3)

- **NFR-7 (no backend):** unchanged and binding. F20 is fully client-side.
- **NFR-8 (instrumentation):** unchanged. The best score is **not** an
  instrumentation counter (F20 AC11). No new instrumentation events are
  required. An optional `newBest` counter may be added only if
  solution-architect wants it, under ADR-0005's existing rules.
- **NFR-9 (legibility):** applies to the new Best / New best! text (F20 AC13).
- **Security (re-review required):** this adds a second persisted local
  storage value that the game reads back. security-compliance-reviewer pass 2
  should confirm that F20 AC9-AC12 are implemented with the same fail-closed
  read pattern as `security-review-v1.md` MEDIUM #1. They should also confirm
  that no cookie or consent banner is triggered: a single user-facing game
  value, no identifiers, nothing transmitted.

---

## Out of Scope (v3 — v1 and v2 lists still hold, with one amendment)

**Amended v1 bullet.** `docs/PRD.md` §Out of Scope (v1), bullet 1, currently:

> Leaderboards, score-sharing, or online/cross-session high-score tables —
> note the in-run score in F10 is session-only and explicitly does NOT include
> these (market doc §3; owner decision Q2).

is replaced by:

> Leaderboards, score-sharing, online high-score tables, and any **multi-entry**
> local score table (top-N list, per-run history). **Exception (v3, owner
> decision OQ-M8 (a)):** a single device-local best score is in scope, per
> F20. It is one whole number, not a table, never transmitted.

**Still out of scope (unchanged or clarified by v3):**
- Saving and continuing a run later (v1 §Out of Scope bullet 5; mobile OQ-M9 (a)).
  The best score is **not** run progress. No level, lives, or power-up state
  is saved.
- Cloud sync, accounts, Google Play Games sign-in, or moving the best between
  browsers/devices (see also `docs/mobile/PRD-mobile.md` M7.6).
- An in-game "reset best score" button or setting (F20 AC8). Players can
  clear it through browser/app data (F20 AC7). Can be added later on request.
- Showing the best score in the in-play HUD (F20 AC14).
- Per-level or per-mode bests, and player names/initials.
- Any change to how points are earned (F10 AC2-AC3 unchanged) or to Restart
  Level score behavior (see Q-v3-1).

---

## Open Questions v3 — for owner decision

| # | Question | Status |
|---|---|---|
| Q-v3-1 | Restart Level can be used to inflate the saved best | **OPEN — owner decision needed.** Default applied: none (current behavior kept). |

### Q-v3-1 — Restart Level score farming now affects a saved number
**Issue (plain terms).** Today, **Restart Level** (F6 AC4) resets the level
but **keeps the score earned during the abandoned attempt**
(`resetForLevel` in `src/core/world.ts` does not touch `world.score`). A
player can clear most of a level, pause, Restart Level, and repeat, adding
points without limit. While the score vanished at the end of the run this
did not matter much. Once the best score is **saved and shown on the title
screen**, a farmed number sticks around and weakens the "beat my best" hook
segment C cares about. The best is only local and only affects that player,
so there is no fairness harm to anyone else.
**Affects:** `docs/PRD.md` F6 AC4 and F10 AC4 (shared game rule, so both
pipelines), code-implementer / mobile-junior-developer, test-writer /
mobile-junior-tester, UAT on both platforms.

- **(a) Leave it as is.** Restart Level keeps the score. No rule change.
  Consequence: zero extra cost. The best can be farmed, but only by the player
  themselves on their own device.
- **(b) Restart Level rolls the score back to what it was when the level
  started.** Consequence: one new AC on F6 AC4 / F10 AC4, a small code change
  (remember the score at level start), and a few tests. Both platforms' gates
  are re-running for F20 anyway, so the extra review/test cost is small. Best
  becomes an honest "one clean run" number. It changes current Restart Level
  behaviour that returning web players may have noticed.
- **(c) Runs that used Restart Level do not count toward Best.** Consequence:
  no change to in-run scoring, but it needs a new "used restart" flag and a
  message explaining why a high run did not become the best. That is more UI
  and more confusion than (b).

**Recommendation: (b).** It is the smallest change that makes Best mean
something. The marginal cost is low because both review/test loops are
already open for F20. It keeps one simple rule on both platforms. If the
owner prefers not to touch existing game rules in this change, (a) is
acceptable: F20 as written works either way, and (b) can come later as its
own addendum.

---

## Pipeline impact (both platforms, per `.claude/CLAUDE.md` §One codebase)

F20 is a shared game change, so before **either** version ships it must pass:
- **Website:** ui-ux-designer (title/end screen Best + New best! text),
  solution-architect (ADR, or an ADR-0005 amendment, for the best-score storage
  key and module), security-compliance-reviewer, code-reviewer loop,
  test-writer / test-validator, UAT (product-manager), then deploy + smoke.
- **Android:** the matching mobile gates for M7.1/M7.2 (mobile-ui-ux-designer,
  mobile-solution-architect, mobile-security-compliance-reviewer,
  mobile-lead-developer, mobile-lead-tester, mobile UAT).
- `.github/workflows/deploy-pages.yml` remains the single CI check. F20 unit
  tests run there for both.

---

## Traceability check (v3)

F20 traces to the same use cases and goals as F10 (UC3, UC5, P5, B3) plus
segment C and mobile UC-M2. Its authority is owner decision OQ-M8 (a)
(`docs/mobile/PRD-mobile.md` §7, 2026-09-25). The one superseded v1 AC (F10
AC6), the amended F10 description, and the amended v1 Out-of-Scope bullet are
quoted verbatim above, next to their replacements, so nothing in
`docs/PRD.md` is silently overwritten. `docs/PRD.md` itself is left unedited
and this addendum is authoritative where they differ. Each website AC has an
Android counterpart listed in §Cross-platform consistency, with M7.1/M7.2 as
the primary cross-references. The one question needing the owner (Q-v3-1) is
listed with options and a recommendation, and no default rule change is
applied.
