# Product Requirements Document — Addendum v7 (power-up guide, contact details, test gaps)

**Product:** Shield vs Robots (website and Android app; one shared codebase)
**Date:** 2026-10-06
**Author:** main session, acting as product manager for the core team
**Status:** DECIDED by the owner in the project thread on 2026-10-06.

## Sizing and team

The change is sized **medium**. It changes shared UI (the title screen), the Android help
overlay, the privacy page and two test files. Only the builder, reviewer and tester do a
distinct piece of work, which is under the 5-role threshold. The owner also said to use the
3-agent team, so this change uses the **mobile core team**: builder
`mobile-junior-developer`, reviewer `mobile-lead-developer` (one combined web + Android
review) and tester `mobile-lead-tester`.

The owner also ruled: "The website design check should pass before it ships going forward."
This change alters what a desktop browser player sees, so the website `ui-ux-designer` runs
once on it as the design gate before merge. The owner played the current website and said it
does not need re-testing for the earlier arrow-icon change.

## F24 — Power-up guide on the title screen (shared)

1. The title screen shows all four power-up icons on both the website and Android. Each icon
   is drawn by the same `drawPowerUp` code the game uses, so it looks the same as the falling
   token. No separate image files.
2. Each icon has a visible text label next to it, in this order:
   Power (fist), Speed (double arrow), Shield (circle), Multiplier (X).
3. The labels are real text. Screen readers read them; the icons are decorative
   (`aria-hidden`).
4. The guide fits without overlap or scrolling at 800x600 on the website. On Android it fits
   on every phone in the device matrix, including the smallest landscape window (640x360),
   and the Start and menu buttons stay fully visible and tappable.

## F25 — Power-up explanations on the Android help screen

1. The "How to play" overlay lists the four power-ups. Each row has the icon, the label
   (as in F24 AC2) and one simple sentence:
   - **Power:** "Your shield hits 5 times as hard for 8 seconds."
   - **Speed:** "You move 3 times as fast for 8 seconds."
   - **Shield:** "Robot lasers can't hurt you for 8 seconds."
   - **Multiplier:** "Your hits get stronger for the rest of the game."
2. The sentences must match what the code does (`src/config/constants.ts`,
   `src/systems/CollisionSystem.ts`). If they don't, the code wins, and the builder corrects
   the sentence and notes it in the hand-off.
3. The existing control lines and the "Got it" button stay. The overlay still fits at
   640x360 (it may scroll inside itself if it already does; the "Got it" button stays
   reachable).
4. The website has no help screen, and none is added. F24 covers the website.

## F26 — Developer contact details

1. `public/privacy.html` replaces `[DEVELOPER NAME]` with "Aaron Hogancamp" and
   `[CONTACT EMAIL]` with the owner's email address, as given in the thread. This
   supersedes amendment v2.0 §1.6 options (a)-(c); the owner chose (c).
2. The title screen (website and Android) shows the same name and email in one small line,
   for example "Developer: Aaron Hogancamp · <email>". It is set with `textContent` only,
   per the `src/ui/dom.ts` rule.
3. The name and email are defined once in source and used by the title screen and its tests.
   `privacy.html` is static and holds its own copy.
4. Owner privacy rule (2026-10-05): the email appears only in these UI spots. It is not
   written into review docs, logs, validation reports or commit messages.

## F27 — Test gaps and cleanup from code review round 21

1. **L1:** `src/render/powerUpGlyphs.test.ts` must fail for an X-like double arrow. That
   means a pairwise check over all 5 segments that allows a meeting only at a shared endpoint;
   left wing ends x < 0 and right wing ends x > 0; each wing end at least 0.25r from (0, 0);
   and exactly 1 horizontal, 0 vertical and 4 diagonal segments. The wrong comment at
   `:541-542` is corrected. The reviewer checks it by mutation (swap the wing-end x sign; the
   suite must go red).
2. **L4:** add the missing cases from code review round 21 L4:
   - `tests/mobile-e2e/robot-warning.spec.ts`: a `role` assertion, "still shown after
     pause", the inset rows (30,30,28.2,32), (29.7,29.7,28.2,32) and (0,48,24,0), and the
     640x368 (0,0,24,48) window.
   - `topBanner.test.ts`: `data-kind`, no DOM write when the kind is unchanged, and `top`
     follows the HUD height.
   - `CanvasRenderer.test.ts`: the border in the two default cases.
   - An automated check that `dist/` has no `top-banner`.
3. **L3:** remove the dead `SubPath.src` and `closeSrc` fields from
   `powerUpGlyphs.test.ts`.

## Out of scope

Play Store release steps (owner decision 2026-10-05). The level-10 boss play-through on the
emulator.
