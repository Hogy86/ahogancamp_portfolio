# Release Notes — Shield vs Robots v1.0

**Version:** 1.0  
**Release date:** [To be filled at step 15]  
**Platform:** Android (Google Play)  
**Traces to:** docs/mobile/PRD-mobile.md (M0-M12, platform requirements)

---

## Summary

Shield vs Robots is an arcade game where you throw a bouncing shield to defeat waves of robots. Catch power-ups, face bosses, and beat your best score. 10 levels, no ads, no account needed. Free and fully offline.

**Character count:** 192 (fits Play Store's 500-char limit for short description)

---

## Full Description (for Play Store)

**Title:** Shield vs Robots

**Short description:** An arcade game where you throw a bouncing shield to defeat waves of robots. Catch power-ups, face bosses, and beat your best score. 10 levels, no ads, no account needed. Free and offline.

**Full description (from listing-draft-v2.md, adapted):**

Protect the galaxy from invading robot armies. You are ShieldMan, the hero with a shield that bounces off enemies and catches power-ups. Guide it to destroy waves of robots, unlock power-ups, and defeat the bosses guarding each world.

**Features:**
- **10 levels of escalating difficulty:** Fight robots in formation, then face off against a unique boss.
- **Bouncing shield mechanics:** Throw once and watch your shield bounce, ricochet, and return for catches.
- **Power-ups:** Speed, hit power, invulnerability, and permanent multipliers.
- **Save your best score:** Remember your top run forever.
- **Touch controls:** Optimized for phones and tablets. Play landscape, swap controls if you prefer.
- **No ads, no account:** Fully offline, no sign-in, no tracking.

**Gameplay:**
ShieldMan stands at the bottom of the screen. Robots descend in formation from above. Tap the Move buttons to dodge left and right. Tap Throw to launch your shield, which bounces off robots and deals damage. Catch falling power-ups to boost hit power, speed, or get a temporary shield. Survive all 10 levels and defeat the bosses to win.

**Designed for fun:** Every pause menu, every control, every screen is optimized for one-handed play. Leave the game, come back later—it remembers your best. No timers, no pressure, just fun.

**Free, complete, no in-app purchases.**

---

## What's New in v1.0

This is the first release. The full feature set includes:

- **M0-M12:** All mobile requirements from PRD-mobile v1.7.
- **F1-F10, F11-F19:** All shared game rules from PRD.md and PRD-addendum-v2.md.
- **F20:** Best score saves and persists across runs.
- **F21:** Restart Level rolls the score back to the level start.
- **F22:** Renamed to "Shield vs Robots" with hero "ShieldMan" and enemies "robots".

---

## Known Limitations

- **Small windows:** On devices with very small screens or in split-screen mode (< 624 dp wide), the game may show "Make the window larger to play." This is expected; rotate the device or enlarge the window.
- **WebView version:** Requires Android System WebView version 80 or later. The app will prompt you to update if your WebView is too old.

---

## Support

For issues, questions, or feedback, contact [DEVELOPER NAME] at [CONTACT EMAIL].

Privacy policy: The app collects no data and works fully offline. See the Privacy policy in Settings for details.

---

## Sources

- `docs/mobile/PRD-mobile.md` — mobile feature spec and requirements.
- `docs/mobile/market/listing-draft-v2.md` — store listing text.
- `docs/mobile/release-runbook.md` — how this release was built and tested.
