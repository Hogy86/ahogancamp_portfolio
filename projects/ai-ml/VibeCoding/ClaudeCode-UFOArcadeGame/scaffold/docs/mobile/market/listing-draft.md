# Play Store Listing Draft — Vanguard vs. Sentinels

**Stage:** Mobile Pipeline Step 1 — Mobile Marketing Analyst
**Date:** 2026-09-25
**Author:** mobile-marketing-analyst subagent
**Status:** Draft input to `mobile-product-manager` and `mobile-ui-ux-designer`
(store-assets-spec, step 3). Text only — no screenshots/icon are produced
here; §4 specifies what each screenshot should depict for whoever builds
the store assets.

**Grounded in:**
- `docs/mobile/market/play-store-research.md` (comparable apps, complaints,
  price-model recommendation, name check)
- `docs/PRD.md` / `docs/PRD-addendum-v2.md` (only features already
  confirmed there are referenced below — no new features are invented
  here, per this agent's scope)

---

## 1. App title

**Vanguard vs. Sentinels**

- Character count: 22 / 30 max.
- Rationale: uses the full combined name (never "Vanguard" alone) per
  the name-check finding in `play-store-research.md` §3 — "Vanguard"
  alone collides in search with The Vanguard Group's finance apps;
  the combined title has no found conflicts and is fully within the
  30-character limit. No room remains to append "Shield Invaders" as a
  subtitle within the 30-char field; that phrase is used instead in the
  short description and keywords (§2, §3) where there is room.
- No third-party IP terms present (per `play-store-research.md` §4).

---

## 2. Short description (max 80 characters)

**Throw. Bounce. Survive 10 waves of robots in this retro arcade shooter.**

- Character count: 75 / 80 max.
- Rationale: leads with the mechanical hook (throw/bounce — the
  differentiator identified in `docs/PRD-addendum-v2.md` F15/F16, the
  bouncing-shield mechanic) rather than the theme, consistent with the
  research finding (`play-store-research.md` §1) that this genre's
  screenshots/descriptions lead with gameplay feel, not narrative. "Retro
  arcade shooter" signals the familiar Space-Invaders formula to segment
  A (nostalgic replayer) instantly, per `docs/market/voice-of-customer.md`
  segment A's need for "familiar formation-shooter rhythm intact."
  "10 waves" signals the finite structure that matters to segment C
  (skill-chaser), per market-goals-and-use-cases.md UC5.

---

## 3. Full description (max 4000 characters)

```
Vanguard is the last line of defense. The Sentinels are coming in
formation — and your only weapon is a shield that never runs out.

VANGUARD VS. SENTINELS is a fast, free, no-ads retro arcade shooter built
on the classic formation-shooter formula you already know — move, throw,
survive — with a twist that makes every throw matter: your shield
bounces.

THROW A SHIELD THAT FIGHTS FOR YOU
Hit a Sentinel dead-on and it stops cold. Clip a corner or a side and it
deflects — straight through the next robot in the row, and the next.
One throw, one line of fallen Sentinels, if you aim it right. Time your
throw well enough and the shield bounces all the way back to you — catch
it for an extra life.

10 LEVELS, ONE ESCALATING FIGHT
No infinite waves, no filler. Ten levels, each one visibly harder than
the last: bigger formations, tougher Sentinels that take more hits, and
Sentinels that fire faster the closer you get to the end. Every fifth
level ends in a boss fight against a Sentinel five times the size and
toughness of anything you've faced yet. Beat level 10 and you get a real
ending, not a cutoff.

POWER-UPS WORTH DIVING FOR
Destroyed Sentinels drop power-ups — catch them before they hit the
ground:
- 5x Hit Power — every shield throw hits five times harder
- 3x Speed — outrun incoming fire
- Indestructible Shield — become briefly invulnerable
- Permanent Power Boost — stacks for the rest of your run
Only one temporary power-up is active at a time, so every catch is a
real decision, not a freebie.

BUILT FOR A QUICK SESSION
No install beyond the app itself, no account, no login. Load in, throw
your first shield in seconds, and pick up exactly where you left off if
you need to pause and step away — your progress is never lost mid-level.

NO ADS. NO IN-APP PURCHASES. JUST THE GAME.
This app has zero ads and zero in-app purchases. Nothing to buy, nothing
interrupting your run — every level, every power-up, and the full
10-level campaign are unlocked from the moment you install.

WHO THIS IS FOR
- Players who grew up on formation shooters and want the classic rhythm
  back, with something new to master
- Anyone who wants a two-minute break that respects their time — fast
  load, simple controls, clean pause and resume
- Completionists who want a real finish line: beat all 10 levels and
  see the ending

Vanguard and the Sentinel robots are original characters created for
this game. Vanguard vs. Sentinels is not affiliated with, endorsed by,
or associated with any comic book publisher, film studio, or other
third-party media franchise.

Move. Throw. Bounce. Survive. Ten levels stand between you and the last
Sentinel.
```

- Approximate character count: ~2,150 / 4000 max (well within limit,
  room for future revision without a rewrite).
- No feature is described here that is not already confirmed in
  `docs/PRD.md` or `docs/PRD-addendum-v2.md` (shield bounce/catch = F15/
  F16; 10 levels/boss every 5th = F5/F12; four power-ups + mutual
  exclusion = F7/F11; pause/resume = F6; no ads/no IAP = price-model
  recommendation in `play-store-research.md` §2 — to be confirmed by
  mobile-product-manager, not assumed shippable by this draft alone).
- The explicit non-affiliation line is included because the product's
  own history (original `docs/market/voice-of-customer.md` research
  phase) involved a licensed-superhero concept before the owner's
  generic-re-theme decision (PRD Q4) — this line pre-empts any player
  assumption of a Marvel/Captain-America connection given the shield-
  throwing-hero premise's obvious genre echo, without naming any
  third-party IP itself.

---

## 4. Keywords

Grouped by intent, for use in the title/short description (already
placed above), the full description's natural-language repetition, and
Play Console's keyword-relevant metadata (developer-controlled fields,
not a literal tag list, since Play ranks primarily off title/description
text).

**Primary (genre + mechanic — highest search volume, matches how
comparable apps are found per `play-store-research.md` §1):**
- arcade shooter
- space invaders style
- retro shooter
- formation shooter
- shield throw / bouncing shield

**Secondary (structure/appeal — matches segment-specific pain points from
`docs/market/voice-of-customer.md`):**
- 10 levels (finite structure — segment C)
- boss fight
- power ups
- no ads (trust signal — segment D/B, per `play-store-research.md` §2
  citing "Invaders from Androidia" using "no IAP" as a positioning
  signal)
- offline game / no wifi needed (NFR-7, fully client-side)
- quick play / short sessions (segment D)

**Branded (only the confirmed, cleared name — see name-check):**
- Vanguard vs Sentinels

**Explicitly excluded (per name-check and IP scan in
`play-store-research.md` §3-4):**
- "Vanguard" used alone as a standalone keyword/tag (search-collides with
  The Vanguard Group's finance apps; always pair with "Sentinels" or
  "arcade"/"shooter" in any keyword field)
- Any Marvel, Captain America, Ultron, Avengers, or other third-party
  IP term — none are used anywhere in title, keywords, or description,
  consistent with the hard constraint in `docs/PRD.md` NFR-10/F9 AC4.

---

## 5. Screenshot storyline (order matters — Play shows ~3 before most
users stop scrolling, per `play-store-research.md` §1 sourced guidance)

1. **Core gameplay, mid-action.** Vanguard on screen, a formation of
   Sentinels above, a shield mid-flight bouncing off one row toward
   another. Caption overlay: "Every throw bounces." — leads with the
   mechanical differentiator (F15/F16) first, matching the research
   finding that this genre's top screenshot should show real in-game
   action, not menus or story art.
2. **Difficulty escalation, side-by-side or single dramatic frame.** A
   denser, tougher-looking formation (darker-gray Sentinels per F17) with
   the level indicator visibly reading a high number (e.g. "LEVEL 7").
   Caption overlay: "10 levels. Every one harder." — targets segment C
   (skill-chaser) and reinforces the finite-structure claim in the short
   description.
3. **Boss fight.** The 5x-scale, uniquely colored boss Sentinel (F12/F17)
   filling much of the screen against a normal-size Vanguard for scale
   contrast. Caption overlay: "Boss fight every 5 levels." — this is the
   single most visually distinct asset available and belongs early,
   per the "90% don't scroll past screenshot 3" guidance.
4. **Power-up catch moment.** A power-up icon mid-fall with the HUD
   showing an active-effect indicator and the permanent-multiplier
   readout (F7 AC10/AC11). Caption overlay: "Catch it. Use it." —
   demonstrates the catch mechanic and on-screen feedback loop.
5. **Pause menu / session-respecting UI.** The pause overlay showing
   Resume / Restart Level / Restart Game / Quit (F6). Caption overlay:
   "Pause anytime. Pick up right where you left off." — directly answers
   segment D's core pain point (interruption = lost session) called out
   in `docs/market/voice-of-customer.md`.
6. **Victory / "Game Complete" screen.** The fireworks celebration screen
   (F19) with a visible final score (F10). Caption overlay: "Beat all 10.
   See it through." — gives the completionist segment a payoff image and
   closes the storyline on the game's defined ending, distinguishing it
   from "endless wave" clones per the original competitive research.

Ordering rationale: gameplay-in-motion first (matches what every
comparable app's best-performing listing leads with), escalation and the
boss as the two strongest differentiation visuals next (within the
critical first-three slots), then power-ups, pause/session-respect, and
the ending as supporting proof points for players who scroll further.
No screenshot in this storyline depicts a loading screen, a title screen
alone, or any UI/state not already specified in `docs/PRD.md` or
`docs/PRD-addendum-v2.md`.
