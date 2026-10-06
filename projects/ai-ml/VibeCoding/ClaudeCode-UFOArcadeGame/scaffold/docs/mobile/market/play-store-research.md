# Play Store Research — Vanguard vs. Sentinels (Android)

**Stage:** Mobile Pipeline Step 1 — Mobile Marketing Analyst
**Date:** 2026-09-25
**Author:** mobile-marketing-analyst subagent
**Status:** Input to mobile-product-manager (mobile PRD addendum). No mobile
features are prescribed here — pricing, keywords, naming, and store-listing
research only.

**Builds on (not repeated):**
- `docs/market/voice-of-customer.md` (player segments A-D, web competitive
  landscape)
- `docs/market/market-goals-and-use-cases.md` (business/player goals,
  prioritized use cases UC1-UC7)
- `docs/PRD.md` and `docs/PRD-addendum-v2.md` (confirmed product: a
  single-player, 2D, 10-level formation shooter with an original
  **Vanguard** hero vs. **Sentinel** robots — no licensed IP, keyboard-only
  on web, ported via Capacitor for this mobile track)

This document does not repeat segment definitions or use-case rankings —
it extends them into the Play Store distribution context: what comparable
Android arcade shooters charge, what their listings emphasize, what their
reviews complain about, and what that implies for this app's price model,
naming, and store copy.

---

## 1. Comparable apps on Google Play

All of the following are direct genre comparables — Space-Invaders-formula
or retro arcade shooters distributed on Google Play — found via Play Store
search and general web search (accessed 2026-09-25).

| App | Model observed | What it emphasizes (screenshots/description) | Evidence |
|---|---|---|---|
| **Plasma Invaders: Space Shooter** (com.gazzappergames.invaders.spaceshooter) | Free, ad-supported | Both button and touchscreen control options highlighted as a selling point | Reviewers note ads as "a common nuisance" despite otherwise decent controls |
| **Classic Invaders Retro** (com.GazzapperGames.retro.invaders.classicarcade) | Free, ad-supported (light — ads mostly gated behind settings screens, not mid-play) | Multiple control/screen-fit settings offered up front | Reviewers reported minimal in-play ads but flagged a **pause-button touch-target ratio problem** and a **partially-cut-off score display** — i.e., HUD/screen-fit issues |
| **Invaders - Classic Shooter** (uk.co.coffeeinducedgames.invaders) | Free, ad-supported | Three difficulty modes (normal/hard/hardcore) marketed as replay value | Complaint: the **fire button lags/glitches as invaders get closer**, breaking shooting rhythm at the exact moment precision matters most |
| **Invaders Deluxe** (uk.co.coffeeinducedgames.invadersdeluxe) | Free, ad-supported (same developer as above) | Similar control breadth (drag mode, gamepad support, lit-up buttons) | No distinct complaints found beyond the shared developer's control-lag pattern |
| **Invaders from Androidia** (com.gazzapper.invadersandroidiafree) | Free, **no in-app purchases** | "Dark Mode" difficulty variant marketed as novelty/replay hook | No IAP is called out positively in its own listing — treated as a trust signal |
| **Retro Space War: Shooter Game** | Free, ad-supported | Retro pixel-art styling | Reviewer: game "doesn't run that smooth, then later crash" — stability complaint |
| **Retro Games (Arcade)** (emulator-style compilation app) | Free, heavily ad-supported | Large bundle of classic-style games as the pitch | Reviewers: "nothing but ads," "4 ads within 2 minutes of gameplay" — the most extreme ad-fatigue complaint found |
| **Galaxiga: Space Arcade Shooter** | Free, ad-supported, ~4.7★ | Positioned as a faithful, polished arcade shooter | Reviewers say it's "a solid game" but "the ads can be annoying" — ads are the recurring gap even on well-reviewed titles |

### Pattern across all eight comparables
1. **Every single comparable is free + ad-supported**, or free with no IAP.
   None found a paid/premium listing gaining traction in this genre on
   Play — consistent with general 2026 mobile monetization research
   showing premium one-time-purchase mobile games "rarely find traction"
   and that arcade/casual is one of the strongest ad-monetization genres,
   but only **at scale** (a low-install-volume indie title starves on
   ad revenue alone).
2. **Ads are the single most common complaint category**, ranging from
   "annoying" (well-reviewed titles like Galaxiga) to "nothing but ads"
   (compilation apps). Even apps with otherwise good mechanics take a
   review-rating hit specifically for ad frequency/placement.
3. **Controls and screen-fit are the second most common complaint
   category**: touch-target sizing (pause button), HUD elements getting
   cut off (score display), and input lag/glitches near high-density
   enemy formations (fire button response under load).
4. **Crashes/stability** appear as an occasional but serious complaint
   (Retro Space War) — arcade shooters with formation logic and many
   simultaneous projectiles are exactly the workload where frame-rate
   dips can tip into crashes on lower-end Android devices.
5. **Screenshots/descriptions consistently lead with control-scheme
   flexibility and difficulty/replay variety**, not story or theme —
   reinforcing that this genre's buyers decide on "will this feel good
   to play on my phone," not narrative hook.

### Implication for this app
The comparable set is undifferentiated on price (all free) and
differentiated mainly on **ad tolerance and control quality**. Given this
project already has (per `docs/PRD.md`/`docs/PRD-addendum-v2.md`) a
finite 10-level structure, an escalating difficulty curve, and a
catchable power-up layer as its stated differentiators against generic
clones, the Play Store version's biggest **execution risk** — not
feature risk — is repeating the two complaint patterns above: (a) ad
fatigue and (b) touch-target/HUD screen-fit problems on the
Capacitor-wrapped build. Both are addressable at the architecture/UX
review stages (mobile pipeline steps 3-4), not here, but are flagged so
the mobile PRD and mobile-ui-ux-designer treat touch-target sizing and
HUD-safe-area fitting as first-class acceptance criteria, not
afterthoughts, given this is where competitors visibly lose players.

---

## 2. Price-model recommendation

### Recommendation: **Free, no ads, no IAP, for the first release**

**Rationale, traced to evidence above:**
- The single most common review complaint across every comparable app
  found is ad frequency/placement — even well-reviewed titles
  (Galaxiga, 4.7★) lose points specifically for this. Shipping with ads
  in a first release directly imports the genre's #1 known failure mode
  before this app even has installs to justify the ad-tech integration
  effort.
- Ad monetization "requires massive scale" to be worthwhile per current
  monetization research — a low-install-volume first release (this is a
  portfolio/demo-originated project per `docs/market/voice-of-customer.md`
  §1, not a funded live-service launch) will not clear that scale
  threshold, so ad revenue would be marginal while ad-fatigue complaints
  would not be.
- One comparable (**Invaders from Androidia**) explicitly markets "no
  in-app purchases" as a trust signal in its own listing — evidence that
  "no ads / no IAP" is itself a positioning advantage in this genre, not
  just an absence of monetization.
- This is consistent with the existing PRD's non-negotiable constraints:
  `docs/PRD.md` NFR-6 (no install/no account) and NFR-7 (no backend) —
  the product was already designed with zero server dependency and zero
  friction; ads and IAP would be the first server/SDK dependency
  introduced, working against that design intent.
- A free/no-ads listing removes an entire category of Play Console
  policy surface (ad SDK data-safety disclosures, ad-ID permissions,
  IAP billing integration) that the mobile-security-compliance-reviewer
  and mobile-release-engineer stages would otherwise have to review —
  reducing review-gate risk for a first submission.

### Alternatives considered and their tradeoffs

| Alternative | Pros | Cons (traced to evidence) |
|---|---|---|
| **Free, ad-supported (interstitial/banner)** | Matches every comparable's model; some revenue potential if the app scales | Directly imports the #1 complaint pattern found across all 8 comparables; needs meaningful install volume to be worth the ad-tech integration and Play data-safety disclosure burden; risks review-bombing on ad frequency exactly like Retro Games (Arcade) and Galaxiga |
| **Free, rewarded-video-only (opt-in, e.g. "watch an ad for an extra life")** | Research notes rewarded video "preserves retention better than forced formats" and is opt-in, so it doesn't force interruption | Still introduces ad SDK dependency, data-safety disclosure, and Play Console ad policy surface for a first release where the underlying goal (validate the mobile port) doesn't need monetization; worth revisiting for a v2 release once install/retention data exists |
| **Paid, one-time purchase (e.g. $1.99-$4.99)** | No ad complaints possible; matches "premium" positioning | Research: premium mobile games "rarely find traction" in 2026's market; every comparable found is free, so a paid listing would be priced against zero free direct competitors but also against the free expectation the entire genre has set — high risk of near-zero installs, which defeats the purpose of validating the mobile port at all |
| **Free with IAP (e.g. cosmetic unlocks, extra continues)** | Some monetization upside without forcing ads | Typical F2P conversion is 1-3% of players; needs a much larger install base than this project is likely to have at first release to be worth the Play Console billing integration and review surface; also risks conflicting with `docs/PRD.md` F8's finite-lives/no-pay-to-win design intent (extra continues for money would contradict the skill-chaser segment's stated need for a legitimate difficulty curve, UC3/UC5) |

**Recommendation for the mobile PRD:** ship **free, no ads, no IAP** for
the first Play Store release. Revisit rewarded-video-only monetization
as an explicit, opt-in v2 decision once real install/retention numbers
exist to justify the ad-tech integration cost — this is a note for
`mobile-product-manager`'s Job 0, not a decision made here.

---

## 3. Name check — "Vanguard vs. Sentinels"

**Search performed:** Google Play search for `"Vanguard vs Sentinels"` and
related terms, 2026-09-25.

**Finding: no direct conflict for the full title "Vanguard vs. Sentinels"
or "Vanguard vs. Sentinels: Shield Invaders."** No existing Play Store
listing under this combined name was found.

**However, two partial-name collision risks were found and should be
flagged to the owner/mobile-product-manager:**

1. **"Vanguard" alone is a heavily-used name on Google Play, most
   notably by The Vanguard Group, Inc.** — the real-world financial
   services company — which publishes multiple apps titled "Vanguard,"
   "Vanguard: Save, Invest, Retire," and others, plus third-party
   "Vanguard tracker" apps (e.g., "Sentinel — Vanguard tracker"). This is
   a large, established brand in an unrelated category (finance), but it
   means:
   - A store search for just "Vanguard" will surface a finance app
     first, not this game — a discoverability/keyword risk, not a legal
     conflict (this is a common word, not exclusive IP, and the game's
     use is clearly unrelated in category and context).
   - There is a small brand-confusion/trust risk if the listing's
     icon/branding is ever mistaken for a finance-app notification or
     search result; this is mitigated by the "Sentinels" qualifier
     always appearing in the full title and by clear game-category
     screenshots.
2. **"Sentinel" alone is also a used name** (e.g., "SENTINEL" utility
   app, "Sentinels: Learn to Play" for the Sentinels of the Multiverse
   card game, "Sentinel (iOS game)"). None of these overlap in genre
   (arcade shooter) or in the exact plural/combined phrase used here.

**Conclusion:** No blocking name conflict for the combined title. The
word "Vanguard" is common enough that exact keyword-ranking competition
with The Vanguard Group's finance apps is likely for the single word
"Vanguard," but the combined title "Vanguard vs. Sentinels" and its
"Shield Invaders" subtitle are free of direct listing conflicts. No
action required beyond keeping the full combined title (never truncating
to "Vanguard" alone) in all store-facing copy, and leading keyword
strategy with genre terms ("arcade shooter," "space invaders style") plus
the full combined name, not "Vanguard" in isolation (see listing draft).

---

## 4. Third-party IP scan (Marvel / Captain America / other)

Per `docs/PRD.md` (owner decision Q4, Q4 rationale, F9 AC4, NFR-10) and
`docs/PRD-addendum-v2.md`, this product is **confirmed to use fully
original characters** — Vanguard (hero) and Sentinel robots (enemies) —
specifically **to eliminate licensed-IP exposure** after the project
began as a Captain-America-vs.-Ultron concept in the original
`docs/market/voice-of-customer.md` research phase.

Checked against this mobile-market research and the draft listing
(§ below) for any residual reference:
- **No use of "Marvel," "Captain America," "Ultron," "Avengers," or any
  Marvel-owned term** anywhere in the proposed app title, keywords, or
  description drafts.
- **No visual-motif language** in this research or the listing draft
  references a red-white-blue concentric-star shield, a specific
  hero/villain likeness, or any trademark-adjacent silhouette — consistent
  with the hard constraint already recorded in `docs/PRD.md` NFR-10 and
  F9 AC4, and carried into `docs/PRD-addendum-v2.md` F13/F14 (humanoid
  blue-and-white Vanguard, plain blue circular shield — explicitly *not*
  a red-white-blue star disc).
- **No other third-party IP identified** in the comparable-app research
  above that this game's name, keywords, or copy could be confused with
  (the "Vanguard"/"Sentinel" naming overlaps found in §3 are unrelated
  finance/card-game apps, not IP the owner needs to license or avoid on
  legal grounds — they are a discoverability consideration only).

**Conclusion: no third-party IP conflict found.** The existing PRD-level
constraint (NFR-10, F9 AC4) is upheld by this research; no new IP risk is
introduced by the proposed Play Store name, keywords, or listing copy.

---

## 5. Sources

- [Plasma Invaders: Space Shooter - Google Play](https://play.google.com/store/apps/details?id=com.gazzappergames.invaders.spaceshooter&hl=en)
- [Classic Invaders Retro - Google Play](https://play.google.com/store/apps/details?id=com.GazzapperGames.retro.invaders.classicarcade&hl=en_US)
- [Invaders - Classic Shooter - Google Play](https://play.google.com/store/apps/details?id=uk.co.coffeeinducedgames.invaders&hl=en_US)
- [Invaders Deluxe - Google Play](https://play.google.com/store/apps/details?id=uk.co.coffeeinducedgames.invadersdeluxe&hl=en_GB&gl=US)
- [Invaders from Androidia - Google Play](https://play.google.com/store/apps/details?id=com.gazzapper.invadersandroidiafree&hl=en_US&gl=US)
- [Arcade Invaders From Space - Google Play](https://play.google.com/store/apps/details?id=com.TudouGames.ArcadeInvaders&hl=en_US)
- [Retro Space War: Shooter Game - Google Play](https://play.google.com/store/apps/details?id=com.baabaa.pixelplane&hl=en&gl=US)
- [Retro Games (Arcade) - Google Play](https://play.google.com/store/apps/details?id=com.retro64.retrogames&hl=en_CA)
- [Galaxiga: Space Arcade Shooter](https://grand-screen.com/games/galaxiga-space-arcade-shooter/)
- [Sentinel - Vanguard tracker - Google Play](https://play.google.com/store/apps/details?id=com.fred.folio.android&hl=en_US&gl=US)
- [Vanguard - Google Play](https://play.google.com/store/apps/details?id=com.vanguardapp)
- [SENTINEL - Google Play](https://play.google.com/store/apps/details?id=com.enel.mobile.sentinel&hl=en)
- [Sentinels: Learn to Play - Google Play](https://play.google.com/store/apps/details?id=com.handelabra.SentinelsLearnToPlay&hl=en)
- [Vanguard: Save, Invest, Retire - Google Play](https://play.google.com/store/apps/details?id=com.vanguard&hl=en_US&gl=US)
- [Android Apps by The Vanguard Group, Inc.](https://play.google.com/store/apps/developer?id=The+Vanguard+Group%2C+Inc.&hl=en_US)
- [Indie Game Monetization in 2026 - DEV Community](https://dev.to/linou518/indie-game-monetization-in-2026-premium-dlc-or-subscription-which-path-is-right-for-you-955)
- [Game Monetisation Guide 2026 - Ocean View Games](https://oceanviewgames.co.uk/blog/posts/monetise-your-game)
- [Top 7 mobile game monetization models in 2026 - Adapty](https://adapty.io/blog/mobile-game-monetization/)
- [Mobile Game Revenue 2026: IAP vs Ads vs Premium - EarnifyHub](https://earnifyhub.com/gaming/mobile-game-revenue-2026)
- [Google Play Screenshot Guidelines & Best Practices - Gummicube](https://www.gummicube.com/blog/google-play-screenshot-guidelines-best-practices/)
- [Best practices for your store listing - Play Console Help](https://support.google.com/googleplay/android-developer/answer/13393723?hl=en)

---

## 6. Name check addendum — "Shield vs Robots" (hero "ShieldMan") — 2026-09-25

**Trigger:** `docs/mobile/security/review-v1.md` finding M5 flagged "Sentinels" as a
Marvel X-Men robot name. The owner decided OQ-S1 (b): rename the enemies from
"Sentinels" to "robots" and the game from "Vanguard vs. Sentinels" to **"Shield
vs Robots."** Mid-task, the owner separately renamed the hero from "Vanguard" to
**"ShieldMan."** This section is an append-only addition; §1-§5 above are
historical record of the pre-rename research and are not edited.

This section repeats the review-v1 ask explicitly: Google Play name collisions
for the new title, a Marvel/DC catalog scan (including "S.H.I.E.L.D."
adjacency), and any other well-known IP — now also covering the new hero name
"ShieldMan," per the coordinator's mid-task instruction. All searches performed
2026-09-25.

### 6.1 Google Play collisions — "Shield vs Robots" (combined title)

**No direct Play Store listing found under "Shield vs Robots" or close
variants.** Search for the exact combined phrase returned no matching app.

**However, "Shield" alone is heavily used on Google Play, and — unlike the
old "Vanguard" collision (an unrelated finance category) — the collisions
found here are in the *same* genre (arcade/action), which is a stronger
discoverability risk than the one found for the old name:**

- **Shield Shooter** (com.ShieldShooter.android) — vertical shooter, "become
  the shield" mechanic.
- **Shield Breaker** (com.forgeguard.shieldbreaker; also
  com.shieldbreaker.game, a second, unrelated app with the same name) — space
  arcade shooter, shield-breaking mechanic.
- **ShieldGuard** (com.yy.shieldguard) — vertical space-shooter "defender"
  game.
- **Shield Up!** (com.tftl.shieldup) — orbit-a-shield-to-block-projectiles
  arcade game.
- **Shield Master** (two unrelated listings: com.nomadicbeargames.shieldmaster
  and com.kaigames.shieldmaster) — throw/angle-a-shield combat games.
- **ShieldWall** (com.shieldwall.game) — shield-formation strategy/puzzle
  game.

None of these titles collide with the full combined phrase "Shield vs
Robots," and none is the same specific mechanic (bounce-and-catch shield vs.
formation robots) — this is a **discoverability/keyword-crowding risk, not a
listing-name conflict.** A store search for the single word "Shield" will
return several same-genre competitors before this app, which is a materially
higher-crowding risk than the old title's "Vanguard" collision with an
unrelated finance brand.

**Recommendation carried into the v2 listing draft:** never use "Shield"
alone as a title or leading keyword; always pair it with "vs Robots" in the
title field, and lead keyword strategy with mechanic/genre terms ("bouncing
shield," "arcade shooter," "formation shooter") rather than "shield" in
isolation, exactly as was done for "Vanguard" previously.

### 6.2 Marvel / DC catalog scan, including "S.H.I.E.L.D." adjacency

- **Marvel's S.H.I.E.L.D.** is a fictional spy agency (an acronym, always
  styled with periods: S.H.I.E.L.D.). The proposed title/copy use the common
  English noun "shield" (an object ShieldMan throws), not the stylized
  acronym, and never refers to an intelligence agency, agents, or the Marvel
  Cinematic Universe. **No collision found** with the S.H.I.E.L.D.
  organization name or its stylization. Recommendation: never render the word
  "Shield" in all-caps-with-periods style ("S.H.I.E.L.D.") anywhere in the
  listing, to keep zero visual echo of the acronym.
- **Captain America's shield** itself (the specific red-white-blue,
  concentric-ring, star-emblazoned disc) is the subject of an active
  USPTO-documented Marvel trademark. This is a **design-level** risk, not a
  naming one, and is already addressed by the existing hard constraint
  (`docs/PRD.md` NFR-10 / F9 AC4, carried into `docs/PRD-addendum-v2.md`
  F13/F14): the hero's shield is specified as a plain avatar-blue circle,
  explicitly *not* the star-and-stripes design. This constraint must be
  re-confirmed at UX round 2 and security pass 2 now that the hero's own name
  contains the word "Shield" (see §6.3 — this raises the stakes on that
  constraint, it does not change it).
- **Marvel's Blue Shield** (Joseph Cartelli, Dazzler #5, 1981) — a minor
  Marvel character with "Shield" in the name and a belt-based power source,
  no thrown weapon, no genre overlap, low profile. **No meaningful
  collision** (different power, different medium, not a recognizable
  character to the mass market).
- **DC Comics:** DC does not currently own a flagship "Shield" character.
  Archie/MLJ's **"The Shield"** — a patriotic, shield-carrying superhero who
  actually predates Captain America (debuted Jan. 1940, 14 months before Cap)
  — was licensed to DC's Impact Comics imprint 1991-1995 and again briefly
  around 2010-2011, but the rights **reverted to Archie Comics in 2011** and
  current publication is under Archie's Dark Circle Comics imprint, not DC.
  This is the **closest character-level adjacency found in this whole
  research pass**: a patriotic, shield-throwing hero named essentially
  "Shield." It is not Marvel or DC-owned today, but it is a real, named,
  trademarked comic-book character in the same conceptual space as this
  game's hero. See §6.3 for why the "ShieldMan" rename sharpens this risk.
- **No X-Men, Sentinels, Avengers, Ultron, or other previously-flagged Marvel
  term** appears anywhere in the new name, hero name, or draft copy — the
  original M5 finding is fully closed by the "robots" rename.

### 6.3 New name check — hero "ShieldMan" (added mid-task, coordinator instruction)

**Google Play / general search:** No app or game titled "ShieldMan" or
"Shield Man" was found on Google Play. One unrelated hit was found off-Play:
**"Shield Man"** is a small, unaffiliated indie 2D platformer distributed on
itch.io (Windows only, not Google Play) — no genre, mechanic, or brand
overlap beyond the coincidental name; not a blocking conflict, but the exact
hero name is not fully original in the indie-game space at large, only on
Play specifically.

**Marvel/DC catalog:** No character literally named "ShieldMan" or "Shield
Man" was found in either publisher's catalog.

**Real conflict flagged — the naming *pattern*, not an exact-name hit.**
"[Object]-Man" (Spider-Man, Iron Man, Ant-Man, Aqua-Man) is the single most
recognizable superhero-naming convention in the industry, and it is not
exclusive to Marvel — but pairing that convention with the specific object
**"Shield"** recreates, at the level of the hero's own proper name, the exact
association NFR-10 was written to prevent: a shield-throwing patriotic-style
hero is Captain America's most iconic signature trait. Where the previous
name "Vanguard" was a generic word carrying no such association on its own
(the association only existed at the mechanic level — throwing a shield —
which NFR-10/F13/F14 already mitigate through non-patriotic art), **"ShieldMan"
puts the word "Shield" directly into the character's identity**, stacking a
second, independent signal (the name) on top of the first (the mechanic).
This is a materially higher-risk combination than "Vanguard vs. Sentinels"
ever was, and higher than "Shield vs Robots" (game title) alone would be with
a differently-named hero.

This is not a Play Store listing collision (no such app exists) and not a
registered-trademark hit (no character is literally named "ShieldMan") — so
it is not a hard blocker on legal grounds. It is a **brand-adjacency judgment
call**, exactly the kind flagged for the owner in security review v1's M5/
OQ-S1, and it is flagged the same way here.

### 6.4 Owner question — OQ-M15 (new, raised here)

**Issue:** Renaming the hero to "ShieldMan" reintroduces, at the character-name
level, the Captain-America-adjacent signal that the "Vanguard" → generic-name
mitigation had removed. No exact Play Store or trademark collision exists, but
the naming pattern (object + "-Man," object = "shield") is the closest this
entire research pass has come to an actual named patriotic shield-hero
archetype (see Archie/Dark Circle's "The Shield," §6.2).

**Options:**
- **(a) Keep "ShieldMan" (as instructed), with binding art/copy constraints
  (recommended only if the owner wants to keep the name):**
  - The shield stays the plain avatar-blue circle already specified in
    `docs/PRD.md` NFR-10 / F9 AC4 and `docs/PRD-addendum-v2.md` F13/F14 — no
    red/white/blue, no concentric rings, no star, no patriotic color scheme
    anywhere on ShieldMan's design, costume, or the game's key art.
  - ShieldMan's costume/art is never posed or colored to evoke a
    star-spangled/patriotic look.
  - The listing, screenshots, and description never use the words "patriot,"
    "captain," "star-spangled," or "America(n)" in any context.
  - This is a re-statement, not a new rule — but it now carries more weight
    because the hero's own name repeats "Shield," so a single missed art
    review is more consequential than before.
- **(b) Revert the hero name to "Vanguard" (or another generic, non-object
  name) and keep "Shield vs Robots" only as the *game title*, where "shield"
  describes the weapon/mechanic, not the hero's identity.** This restores the
  one-signal-only risk profile (mechanic-level shield reference only, no
  name-level reinforcement) and most closely matches the original mitigation
  intent behind the "Vanguard" naming. Lowest residual risk of the two
  options; costs a second round of copy/asset changes if art or code already
  reference "ShieldMan."
- **(c) Rename the hero to something with no "shield" reference at all** (a
  fresh generic name, as "Vanguard" was) while keeping the *game* title
  "Shield vs Robots" — same effect as (b), stated as a distinct option in
  case "Vanguard" specifically is off the table for another reason.

**Recommendation: (b) or (c).** The word "shield" doing double duty as both
the weapon/mechanic *and* the hero's own name is the single easiest thing for
a casual observer (or a rightsholder's automated brand-monitoring scan) to
flag, and it costs nothing at this stage to avoid — no code, art, or
published listing yet exists under "ShieldMan." If the owner prefers to keep
"ShieldMan" regardless, option (a)'s art/copy constraints are the minimum
required mitigation and must be checked at UX round 2 and security pass 2,
the same gates that will re-check the M5/OQ-S1 "Sentinels"→"robots" rename.

Per this agent's scope, this is a flagged owner question for
`mobile-product-manager`'s Job 0 to carry to the owner — no decision is made
here, and `docs/mobile/market/listing-draft-v2.md` uses "ShieldMan" as
instructed pending that decision, with the §6.3/§6.4 risk noted alongside it.

### 6.5 Sources (this section)

- [Armored Squad: Mechs vs Robots - Google Play](https://play.google.com/store/apps/details?id=com.FoxForceGames.ArmoredSquad&hl=en_US)
- [Shield Shooter - Google Play](https://play.google.com/store/apps/details?id=com.ShieldShooter.android)
- [Shield Breaker - Google Play](https://play.google.com/store/apps/details?id=com.forgeguard.shieldbreaker&hl=en_GB)
- [Shield Breaker (second listing) - Google Play](https://play.google.com/store/apps/details?id=com.shieldbreaker.game&hl=en)
- [ShieldGuard - Google Play](https://play.google.com/store/apps/details?id=com.yy.shieldguard&hl=en_US)
- [Shield Up! - Google Play](https://play.google.com/store/apps/details?id=com.tftl.shieldup&hl=en_US)
- [Shield Master - Google Play](https://play.google.com/store/apps/details?id=com.nomadicbeargames.shieldmaster&gl=US)
- [Shield Master (second listing) - Google Play](https://play.google.com/store/apps/details?id=com.kaigames.shieldmaster&hl=en_GB)
- [ShieldWall - Google Play](https://play.google.com/store/apps/details?id=com.shieldwall.game)
- [Nvidia Shield Portable - Wikipedia](https://en.wikipedia.org/wiki/Nvidia_Shield_Portable)
- [Nvidia Shield TV - Wikipedia](https://en.wikipedia.org/wiki/Nvidia_Shield_TV)
- [S.H.I.E.L.D. (2010 series) - Wikipedia](https://en.wikipedia.org/wiki/S.H.I.E.L.D._(2010_series))
- [Captain America's shield - Wikipedia](https://en.wikipedia.org/wiki/Captain_America%27s_shield)
- [USPTO on Captain America's shield trademark - X/Twitter](https://x.com/uspto/status/1894483922756534694)
- [Blue Shield (character) - Wikipedia](https://en.wikipedia.org/wiki/Blue_Shield_(character))
- [Shield (Archie Comics) - Wikipedia](https://en.wikipedia.org/wiki/Shield_(Archie_Comics))
- [Shield (comics) - Wikipedia](https://en.wikipedia.org/wiki/Shield_(comics))
- [Mighty Crusaders - Wikipedia](https://en.wikipedia.org/wiki/Mighty_Crusaders)
- [Dark Circle Comics - Wikipedia](https://en.wikipedia.org/wiki/Dark_Circle_Comics)
- [The Shield (Character) - Comic Vine](https://comicvine.gamespot.com/the-shield/4005-32405/)
- [Shield Man (itch.io)](https://shield-man.itch.io/shield-man)
- [Intellectual Property - Play Console Help](https://support.google.com/googleplay/android-developer/answer/9888072?hl=en)
