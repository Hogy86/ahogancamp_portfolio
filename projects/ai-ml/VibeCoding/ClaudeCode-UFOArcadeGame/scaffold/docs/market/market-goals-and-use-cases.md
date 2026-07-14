# Market Goals and Use Cases — Captain America vs. Ultron: Shield Invaders

**Stage:** 1 — Marketing Analyst (pre-PRD)
**Date:** 2026-07-06
**Author:** marketing-analyst subagent
**Input to:** product-manager (PRD). No product features are specified here
— goals and use cases only. The PRD owns translating these into features
and acceptance criteria.

## 1. Market goals

Goals are split business-side (what success looks like for the owner
shipping this project) and player-side (what success looks like for the
person playing it). Every metric is measurable and time-bound so the PRD
and later the test-validator/UAT stages can verify against them.

### Business goals

| # | Goal | Metric | Target | Timeframe |
|---|---|---|---|---|
| B1 | Differentiate from generic Space Invaders clones enough to earn repeat visits | Replay rate (players who start a second run in the same session) | >= 30% of sessions include a second run | At first playable build (post code-implementer) |
| B2 | Give players a reason to finish, not just sample | Level-completion rate for level 1 | >= 60% of players who start level 1 finish it | At first playable build |
| B3 | Prove the difficulty curve retains skill-chasers to the finite endgame | % of sessions that reach level 5+ | >= 15% of sessions reach level 5 | Within first round of playtesting |
| B4 | Keep the game viable as a portfolio/demo artifact with near-zero drop-off from technical friction | Time from page load to first controllable input | <= 3 seconds on a typical broadband connection | At first playable build |

### Player goals

| # | Goal | Metric | Target | Timeframe |
|---|---|---|---|---|
| P1 | Get into the action with no learning curve | Time from page load to player's first shield throw | <= 10 seconds without reading external instructions | At first playable build |
| P2 | Feel the game respects short, interruptible sessions | % of pause events (Esc) that successfully resume or exit without lost progress within the current level | 100% | At first playable build (this is a correctness bar, not an aspiration) |
| P3 | Feel meaningful escalation across a run, not flat repetition | Player-reported (informal playtest) ability to distinguish level 1 from level 5 difficulty unprompted | >= 80% of playtesters correctly rank order 3 shown levels by difficulty | Within first round of playtesting |
| P4 | Feel power-ups are worth chasing, not incidental | % of dropped power-ups actually caught (vs. falling past wasted) in playtest sessions | >= 50% caught | Within first round of playtesting |
| P5 | Experience a definitive, satisfying end state | % of playtesters who reach level 10 and report the ending feels like a deliberate conclusion (not a cutoff) | >= 90% of those who reach level 10 | Within first round of playtesting |

Notes on measurement: this is a single, non-networked browser game with no
backend by default, so B1-B4 and P1-P5 are intended to be measured via
lightweight client-side instrumentation (e.g. session/level/timer counters
logged to console or local storage during playtesting) or manual/informal
playtest observation — not a production analytics pipeline. The
data-storage-architect and solution-architect stages should decide the
actual mechanism; this doc only states what needs to be measurable and why.

## 2. Prioritized use cases

Ranked by: (a) breadth across the four player segments (Nostalgic
replayer=A, Marvel fan=B, Skill-chaser=C, Time-boxed casual=D), (b) how
acute the underlying pain point is, (c) feasibility given this is a
client-side browser game with no backend.

| Rank | Use case | Segments served | Tied to pain point / goal | One-line justification |
|---|---|---|---|---|
| 1 | Player picks up and plays within seconds using only arrow keys and space bar, no tutorial required | A, B, C, D | Segment D's pain (unskippable friction burns their whole window); goal P1 | The single highest-leverage use case — every segment abandons immediately if this fails, so it gates all other value. |
| 2 | Player pauses mid-session via Esc and resumes exactly where they left off, or exits cleanly | D (primarily), all others secondarily | Segment D's pain (interruption = lost session); goal P2 | Time-boxed players are the segment most likely to *need* to leave mid-run; failing this converts a returning player into a lost one. |
| 3 | Player experiences a visibly escalating challenge across levels (one-hit to mixed to multi-hit enemies, faster enemy fire) | C (primarily), A secondarily | Skill-chaser pain (flat difficulty = nothing to master); goals P3, B3 | Directly answers the "nothing to master" gap identified against generic clones in the competitive research. |
| 4 | Player catches a falling power-up to gain a temporary or permanent combat advantage | A, C (both reward mechanical depth), B (visual/power fantasy payoff) | Nostalgic replayer's pain (clones feel stale after one play); goal P4 | This is the single clearest mechanical differentiator versus every literal Space Invaders clone found in research — it's the "reason to pick this one." |
| 5 | Player reaches a definitive final level (10) and experiences a clear end state rather than an infinite loop | C (primarily), A secondarily | Skill-chaser pain (games that never end have nothing to brag about); goal P5 | Completionist-driven segment needs a finish line to justify sustained play; also differentiates from "endless wave" clones. |
| 6 | Player instantly recognizes the Captain America / Ultron premise without needing narrative setup | B (primarily), A secondarily (novelty layer) | Marvel-fan pain (no free, instant, browser-native way to "be" Cap for two minutes); market gap vs. Cosmic Invasion/fan-game beat-em-ups | High differentiation value but ranked below core-loop items because it is a skin/framing layer, not a mechanical hook — it earns the click, the mechanics earn the replay. |
| 7 | Player restarts a level or restarts the whole game from the pause menu without reloading the page | D (primarily), C secondarily (fast retry loop for mastery) | Segment D's pain (friction on re-entry); segment C's need for fast iteration to improve | Lower rank than pause/resume itself because it's a refinement of the pause menu rather than a distinct pain point, but still meaningfully reduces friction for repeat attempts. |

## 3. Explicitly out of scope for this stage

The following are legitimate future-looking ideas surfaced during research
but are **not** use cases here because they are features/solutions, not
market-level goals or pain points — they belong to the PRD or later stages
if the product-manager and owner choose to pursue them:
- Leaderboards or score-sharing (would serve segment C further, but is a
  feature decision, not a market goal)
- Portal submission/distribution packaging (relevant context for reach, not
  a use case for this build)
- Mobile/touch controls (owner's brief specifies arrow keys and space bar;
  no evidence yet that this build targets mobile)

## 4. Traceability check

Every use case above cites: the segment(s) it serves (from
`voice-of-customer.md` section 2), the specific pain point or goal it
answers, and a feasibility-aware justification. No use case is introduced
without a corresponding pain point or goal already stated in the companion
document.
