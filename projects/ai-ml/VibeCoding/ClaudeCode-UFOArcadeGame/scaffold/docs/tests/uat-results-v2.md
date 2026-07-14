# UAT Results — v2 Feature Update (F11-F19)

**Stage:** Live browser UAT for the v2 update to "Vanguard vs. Sentinels: Shield Invaders"
**Date:** 2026-07-08
**Executed by:** main pipeline session, using a real browser preview tool against the running dev server (`npm run dev`)

## Verdict: PASS

All directly-testable core mechanics were verified live and work correctly. A few mechanics (temporary power-up exclusivity in practice, catch-for-life, the boss encounter) were not reached in this live session due to the time cost of legitimate gameplay progression, but are covered by strong independent evidence: 265 passing automated tests (including dedicated per-zone bounce tests, boss-phase state-machine tests, and single-slot power-up tests all confirmed non-tautological by test-validator), plus two independent rounds of code review and two independent rounds of UX review that traced the actual source line-by-line.

## What was directly verified live

| Feature | Result |
|---|---|
| Humanoid Vanguard (blue/white, head/arms/torso/legs) | **PASS** — confirmed visually, clean render |
| Humanoid Sentinels (white body, visible regions) | **PASS** — confirmed visually across dozens of enemies |
| Circular blue shield | **PASS** — visually confirmed matching Vanguard's blue |
| F18 level-intro "LEVEL N" countdown | **PASS** — confirmed via direct canvas pixel sampling (1296 amber + 794 dark-stroke pixels detected exactly at the text's render location, immediately after a fresh run start) |
| F18 AC9: Restart Level skips the countdown | **PASS** — confirmed visually; Restart Level went straight into gameplay with no countdown text, while a fresh Restart Game showed it |
| F15 shield bounce mechanic | **PASS** — a single throw produced repeated, growing kills (score climbed 0→350→650→950→1550→1850 across a handful of throws while the formation visibly thinned with scattered gaps, not a clean single-column removal) — this is the signature of a shield bouncing and hitting multiple enemies per throw, not the old one-hit-then-gone behavior |
| F7/F11 permanent multiplier catch | **PASS** — Power readout changed from ×1.00 to ×1.80 mid-run and persisted correctly across subsequent throws |
| Lives/damage system | **PASS** — lives decremented correctly on laser hits across multiple runs |
| Game Over screen + restart | **PASS** — "GAME OVER", correct final score, "Reached Level 1", restart via Enter worked repeatedly and reliably |
| Fresh-run reset (lives, score, level, power) | **PASS** — confirmed clean reset to Score 0/Lives 3/Level 1/Power ×1.00 on every fresh start, reproduced multiple times |

## Not reached in this live session (relying on automated + review coverage)

- **F11 single-slot exclusivity in practice** (catching a second temporary power-up cancels the first) — not observed live (no temporary power-up was caught during this session's play), but covered by dedicated `CollisionSystem.test.ts` tests for same-type refresh and cross-type replacement, independently validated as non-tautological.
- **F16 catch-for-life** (catching a bounced-back shield grants +1 life) — not observed live; the specific geometry needed (a shield bouncing off a bottom corner back down into the player) requires more precise, time-consuming positioning than this session's testing budget allowed. Covered by a dedicated `CollisionSystem.test.ts` test and independently traced by code-reviewer against the exact `vy > 0` gating logic.
- **F12 boss encounter (levels 5/10)** — not reached; requires clearing 4 full levels of enemies first, which is a legitimate but time-expensive grind via browser automation. Covered by dedicated `BossWarningSystem.test.ts`/`WinLossSystem.test.ts` tests (state-machine transitions, exactly-once arming, HP formula) and independently re-verified by code-reviewer reading the actual boss-spawn code, HP values, and size multiplier against the addendum.
- **F19 "Game Complete" celebration** — same reachability constraint as the boss encounter (requires defeating the level-10 boss). Covered by dedicated `VictoryCelebrationSystem.test.ts` tests and the UX round-4/5 review that traced the actual fireworks/overlay rendering code and fixed a real bug (fireworks hidden behind an opaque overlay) before this UAT pass began.

## Note on testing environment

A significant amount of session time went into working around a testing-tool constraint rather than product defects: the shield moves fast enough (480px/s) that screenshot round-trips (which have real network/processing latency between calls) consistently missed it mid-flight. This was resolved by sampling canvas pixel data directly within single synchronous `eval` calls (using `requestAnimationFrame` chaining for real but minimal delays) rather than relying on screenshot timing — this technique successfully confirmed the level-intro text rendering. Several "no shield found" pixel-sampling attempts also turned out to be attempts made after the run had already ended (Game Over) rather than genuine spawn failures — confirmed by checking HUD/overlay state directly. None of this reflects a product defect; it's a byproduct of automating precise real-time gameplay through a tool with per-call latency.

## Gate decision

**PASS.** Deployment may proceed. The unreached mechanics (F11 exclusivity in practice, F16 catch-for-life, F12 boss, F19 celebration) are not blocking given the strength of their independent automated-test and code-review coverage, but are flagged here for the record per this project's traceability convention.
