# Play Store Listing Draft v2 — Shield vs Robots (hero "ShieldMan")

> **Revision note (2026-09-29):** Applied `docs/mobile/security/review-v2.md`
> findings V2-M2 and V2-L6.
> - **V2-M2:** Deleted the "space invaders style" keyword (Section 4). Added
>   "Space Invaders" (Taito) and "Galaga" (Bandai Namco) to the explicitly
>   excluded list. Keywords now use generic genre terms only.
> - **V2-L6:** In the full description body, "SHIELD VS ROBOTS" is now title
>   case, "Shield vs Robots".
> No other content changed.

**Stage:** Mobile Pipeline Step 1 — Mobile Marketing Analyst (revision)
**Date:** 2026-09-25
**Author:** mobile-marketing-analyst subagent
**Status:** Draft input to `mobile-product-manager` and `mobile-ui-ux-designer`.
This is a **new file, v2** — `docs/mobile/market/listing-draft.md` (v1) is
left unmodified as the historical record of the pre-rename draft.

**Supersedes, for the renamed product only:**
- The game title changes from "Vanguard vs. Sentinels" to **"Shield vs
  Robots"** (owner decision, following `docs/mobile/security/review-v1.md`
  finding M5 / OQ-S1 (b): "Sentinels" is a Marvel X-Men robot name).
- The hero changes from "Vanguard" to **"ShieldMan"** (owner update,
  mid-task, relayed by the coordinator). The enemies are "robots" (plain
  noun, not a proper name).
- **`docs/mobile/PRD-mobile.md` M12.2** — the "your progress is never lost
  mid-level" claim is **removed** (it overpromises against M4.6: an
  Android-killed background process loses the in-progress run).
- **`docs/mobile/PRD-mobile.md` M12.3 / owner decision OQ-M3 (b)** — the
  disclaimer is reduced to the single positive originality sentence; the
  "not affiliated with… any comic book publisher, film studio…" sentence is
  removed.
- See `docs/mobile/market/play-store-research.md` §6 for the full name-check
  evidence behind this rewrite, including **OQ-M15**, a new, unresolved
  owner question about the "ShieldMan" name's Captain-America adjacency.
  **This draft uses "ShieldMan" as instructed, pending that owner decision.**
  If the owner picks OQ-M15 (b) or (c), only the hero name in this file
  needs to change — the game title, mechanics text, and structure below are
  unaffected either way.

**Grounded in:**
- `docs/mobile/market/play-store-research.md` §1-§5 (comparable apps,
  complaints, price-model recommendation) and new §6 (rename name-check)
- `docs/PRD.md` / `docs/PRD-addendum-v2.md` / `docs/PRD-addendum-v3.md`
  (only features already confirmed there are referenced below — no new
  features are invented here, per this agent's scope)
- `docs/mobile/PRD-mobile.md` M12.2, M12.3 (the two required copy
  corrections this revision implements)

---

## 1. App title

**Shield vs Robots**

- Character count: 16 / 30 max.
- Rationale: uses the owner's new combined name exactly. Per the name-check
  in `play-store-research.md` §6.1, "Shield" alone is crowded by several
  same-genre competitors (Shield Shooter, Shield Breaker, ShieldGuard,
  Shield Up!, Shield Master ×2, ShieldWall) and by the NVIDIA SHIELD
  gaming-hardware brand — so the title never truncates to "Shield" alone,
  exactly as "Vanguard" alone was avoided in v1.
- No exact Play Store listing collision found for the full combined phrase
  (§6.1). No third-party IP term present (§6.2).

---

## 2. Short description (max 80 characters)

**Throw. Bounce. Survive 10 waves of robots in this retro arcade shooter.**

- Character count: 75 / 80 max.
- Unchanged from v1 — it already said "robots," not "Sentinels," and made
  no persistence/progress claim, so no M12.2/M12.3 correction applies here.
  Still leads with the mechanical hook (throw/bounce, `docs/PRD-addendum-v2.md`
  F15/F16) rather than theme, per the genre pattern in
  `play-store-research.md` §1 (screenshots/descriptions lead with gameplay
  feel, not narrative).

---

## 3. Full description (max 4000 characters)

```
ShieldMan is the last line of defense. The robots are coming in formation —
and your only weapon is a shield that never runs out.

Shield vs Robots is a fast, free, no-ads retro arcade shooter built on the
classic formation-shooter formula you already know — move, throw, survive —
with a twist that makes every throw matter: your shield bounces.

THROW A SHIELD THAT FIGHTS FOR YOU
Hit a robot dead-on and it stops cold. Clip a corner or a side and it
deflects — straight through the next robot in the row, and the next. One
throw, one line of fallen robots, if you aim it right. Time your throw well
enough and the shield bounces all the way back to you — catch it for an
extra life.

10 LEVELS, ONE ESCALATING FIGHT
No infinite waves, no filler. Ten levels, each one visibly harder than the
last: bigger formations, tougher robots that take more hits, and robots
that fire faster the closer you get to the end. Every fifth level ends in a
boss fight against a robot five times the size and toughness of anything
you've faced yet. Beat level 10 and you get a real ending, not a cutoff.

POWER-UPS WORTH DIVING FOR
Destroyed robots drop power-ups — catch them before they hit the ground:
- 5x Hit Power — every shield throw hits five times harder
- 3x Speed — outrun incoming fire
- Indestructible Shield — become briefly invulnerable
- Permanent Power Boost — stacks for the rest of your run
Only one temporary power-up is active at a time, so every catch is a real
decision, not a freebie.

BUILT FOR A QUICK SESSION
No account, no login. Load in, throw your first shield in seconds. Leave the
app mid-level and it pauses automatically — tap Resume and carry on.

NO ADS. NO IN-APP PURCHASES. JUST THE GAME.
This app has zero ads and zero in-app purchases. Nothing to buy, nothing
interrupting your run — every level, every power-up, and the full 10-level
campaign are unlocked from the moment you install.

WHO THIS IS FOR
- Players who grew up on formation shooters and want the classic rhythm
  back, with something new to master
- Anyone who wants a two-minute break that respects their time — fast load,
  simple controls, clean pause and resume
- Completionists who want a real finish line: beat all 10 levels and see
  the ending

ShieldMan and the robots are original characters created for this game.

Move. Throw. Bounce. Survive. Ten levels stand between you and the last
robot.
```

- Approximate character count: ~2,000 / 4000 max.
- **M12.2 applied:** the v1 line "pick up exactly where you left off if you
  need to pause and step away — your progress is never lost mid-level" is
  removed. Replaced, per the PRD's own suggested wording, with "Leave the
  app mid-level and it pauses automatically — tap Resume and carry on." —
  true under `docs/mobile/PRD-mobile.md` M4.1-M4.3 even though M4.6 means an
  Android process kill does not save an in-progress run. "No install beyond
  the app itself" is also replaced with "No account, no login" per M12.2's
  second correction.
- **M12.3 / OQ-M3 (b) applied:** the v1 non-affiliation sentence ("Shield vs
  Robots is not affiliated with, endorsed by, or associated with any comic
  book publisher, film studio, or other third-party media franchise.") is
  **removed**. Only the single positive originality sentence remains:
  "ShieldMan and the robots are original characters created for this game."
- **V2-L6 applied (2026-09-29):** the description body now uses title case
  "Shield vs Robots" instead of all-caps "SHIELD VS ROBOTS".
- No feature is described here that is not already confirmed in
  `docs/PRD.md`, `docs/PRD-addendum-v2.md`, or `docs/PRD-addendum-v3.md`
  (shield bounce/catch = F15/F16; 10 levels/boss every 5th = F5/F12; four
  power-ups + mutual exclusion = F7/F11; pause/resume = F6, M4; no ads/no
  IAP = price-model recommendation in `play-store-research.md` §2, to be
  confirmed by mobile-product-manager, not assumed shippable by this draft
  alone).
- The word "Shield" never appears in an all-caps, period-separated style
  ("S.H.I.E.L.D.") anywhere in this copy, per
  `play-store-research.md` §6.2's recommendation. No "patriot," "captain,"
  "star-spangled," or "America(n)" wording appears anywhere, per §6.4's
  interim mitigation for the still-pending OQ-M15 ("ShieldMan" name risk).

---

## 4. Keywords

Grouped by intent, for use in the title/short description (already placed
above), the full description's natural-language repetition, and Play
Console's keyword-relevant metadata (developer-controlled fields, not a
literal tag list, since Play ranks primarily off title/description text).
Generic genre terms only; no third-party game names (V2-M2).

**Primary (genre + mechanic — highest search volume, matches how
comparable apps are found per `play-store-research.md` §1):**
- arcade shooter
- retro shooter
- formation shooter
- bouncing shield / shield throw

**Secondary (structure/appeal — matches segment-specific pain points from
`docs/market/voice-of-customer.md`):**
- 10 levels (finite structure — segment C)
- boss fight
- power ups
- no ads (trust signal — segment D/B, per `play-store-research.md` §2
  citing "Invaders from Androidia" using "no IAP" as a positioning signal)
- offline game / no wifi needed (NFR-7, fully client-side)
- quick play / short sessions (segment D)

**Branded (only the confirmed, cleared name — see name-check):**
- Shield vs Robots

**Explicitly excluded (per `play-store-research.md` §6.1-§6.4 and
`docs/mobile/security/review-v2.md` V2-M2):**
- **"Space Invaders"** (Taito) and **"Galaga"** (Bandai Namco), and any
  "space invaders style" / "galaga-like" phrasing, in any field. Third-party
  game trademarks are not used as keywords; describe the genre with generic
  terms only (arcade shooter, retro shooter, formation shooter).
- **"Shield" used alone** as a standalone keyword/tag — search-collides
  with multiple same-genre competitors (Shield Shooter, Shield Breaker,
  ShieldGuard, Shield Up!, Shield Master, ShieldWall) and with the NVIDIA
  SHIELD gaming-hardware brand. Always pair "Shield" with "vs Robots" or
  "arcade"/"shooter" in any keyword field.
- **"S.H.I.E.L.D."** in its acronym/period-separated styling, in any field.
- **"ShieldMan" used alone as a standalone marketing hook or tagline** (e.g.
  never "Become ShieldMan!" styled to echo a "-Man" superhero movie
  tagline) while OQ-M15 is unresolved; the name is used only as the plain
  in-game hero label.
- Any Marvel, DC, Captain America, Ultron, Avengers, X-Men, Sentinels, "The
  Shield" (Archie/Dark Circle Comics), "patriot," "star-spangled," or other
  third-party IP or patriotic-superhero term — none are used anywhere in
  title, keywords, or description, consistent with the hard constraint in
  `docs/PRD.md` NFR-10 / F9 AC4.

---

## 5. Screenshot storyline (order matters — Play shows ~3 before most users
stop scrolling, per `play-store-research.md` §1 sourced guidance)

1. **Core gameplay, mid-action.** ShieldMan on screen, a formation of robots
   above, a shield mid-flight bouncing off one row toward another. Caption
   overlay: "Every throw bounces." — leads with the mechanical differentiator
   (F15/F16) first, matching the research finding that this genre's top
   screenshot should show real in-game action, not menus or story art. Art
   note (carried from `play-store-research.md` §6.2/§6.4): the shield is the
   plain avatar-blue circle already specified in NFR-10/F13/F14 — no
   red/white/blue, no star, no concentric rings — and ShieldMan's costume is
   not posed or colored to evoke a patriotic/star-spangled look.
2. **Difficulty escalation, side-by-side or single dramatic frame.** A
   denser, tougher-looking formation (darker-gray robots per F17) with the
   level indicator visibly reading a high number (e.g. "LEVEL 7"). Caption
   overlay: "10 levels. Every one harder." — targets segment C
   (skill-chaser) and reinforces the finite-structure claim in the short
   description.
3. **Boss fight.** The 5x-scale, uniquely colored boss robot (F12/F17)
   filling much of the screen against a normal-size ShieldMan for scale
   contrast. Caption overlay: "Boss fight every 5 levels." — this is the
   single most visually distinct asset available and belongs early, per the
   "90% don't scroll past screenshot 3" guidance.
4. **Power-up catch moment.** A power-up icon mid-fall with the HUD showing
   an active-effect indicator and the permanent-multiplier readout (F7
   AC10/AC11). Caption overlay: "Catch it. Use it." — demonstrates the catch
   mechanic and on-screen feedback loop.
   Token rule: the falling/caught token is the fist (Hit Power) or the rabbit
   (Speed) only. Never the Multiplier (X) token and never the Shield (circle)
   token. The multiplier appears only as the HUD readout. (Note 2026-09-30:
   added from review-v2 addendum 4, A4-M1, condition C7.)
5. **Pause menu / session-respecting UI.** The pause overlay showing Resume /
   Restart Level / Restart Game / Quit (F6). Caption overlay: "Pause
   anytime. Tap Resume and carry on." — updated wording to match the
   corrected M12.2 claim (no "never lost" language); still answers segment
   D's core pain point (interruption) called out in
   `docs/market/voice-of-customer.md`.
6. **Victory / "Game Complete" screen.** The fireworks celebration screen
   (F19) with a visible final score (F10). Caption overlay: "Beat all 10.
   See it through." — gives the completionist segment a payoff image and
   closes the storyline on the game's defined ending, distinguishing it from
   "endless wave" clones per the original competitive research.

Ordering rationale: gameplay-in-motion first (matches what every comparable
app's best-performing listing leads with), escalation and the boss as the
two strongest differentiation visuals next (within the critical first-three
slots), then power-ups, pause/session-respect, and the ending as supporting
proof points for players who scroll further. No screenshot in this storyline
depicts a loading screen, a title screen alone, or any UI/state not already
specified in `docs/PRD.md`, `docs/PRD-addendum-v2.md`, or
`docs/PRD-addendum-v3.md`.

---

## 6. Owner question carried into this draft

**OQ-M15 (raised in `play-store-research.md` §6.4, not decided here):**
whether to keep the hero name "ShieldMan" (with the art/copy constraints in
§6.4 (a) of that document — plain blue circle shield, no patriotic color
scheme, no "patriot"/"captain"/"star-spangled"/"America(n)" wording), or
revert to "Vanguard" or another non-object hero name (§6.4 (b)/(c),
**recommended**) while keeping the game title "Shield vs Robots" as-is. This
draft uses "ShieldMan" throughout as instructed; if the owner decides
otherwise, only the hero-name occurrences above need to change — title,
mechanics copy, keywords, and screenshot ordering are unaffected.
