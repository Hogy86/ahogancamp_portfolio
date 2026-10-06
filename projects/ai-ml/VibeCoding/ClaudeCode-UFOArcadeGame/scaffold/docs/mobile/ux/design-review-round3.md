# Mobile UX Design Review - Round 3 (Step 11, late review of the built app)

**Reviewer:** mobile-ui-ux-designer subagent
**Stage:** Mobile Pipeline Step 11 **[GATE]**
**Date:** 2026-09-28
**Verdict: FAIL** (two blocking findings, B1 and B2; both are small)
**Inputs (files only):** PRD-mobile v1.7, PRD-addendum-v3/v4, design-review-round1 and round2 (this reviewer's own, validated decisions), store-assets-spec.md, validation-report-round5.md, device-matrix.md (rounds 1-5), screenshots (viewed: `m2_3c_lowend_title_gesture_round5`, `m2_3c_lowend_3button_prompt_round5`, `f2_pixel7_640x360_prompt_round5`, `f1_lowend_help/pause/gameover/settings_round5`, `m2_3b_lowend_playing_round4`, `api36_pixel7_title_round4`, `api36_pixel7_playing_round4`), `src/platform/android/android.css`, `overlays.ts`, `TouchControls.ts`, `public/privacy.html`.
**Limits of this review:** I had only file-read access, so I could not list the screenshot folder. I reviewed the screenshots named above (found from the reports). I did not view `api30_mid_*` or the fold/tablet captures and rely on the lead tester's DOM measurements for those. Round-numbering: round 1 and round 2 of this reviewer were pre-architecture; this is round 3 and the first post-implementation review.

## Round 1/2 decisions - did the build keep them?

| Decision (round 1/2) | Build | Result |
|---|---|---|
| Buttons, tap-to-fire, not drag/tilt/auto-fire | Buttons: `<`, `>` left, THROW right, PAUSE top right | Kept |
| Landscape only, both directions, no bespoke tablet layout | Matches PRD M2.1a; tablet plays, small windows get prompt | Kept |
| Column arithmetic (M2.12), targets >= 56 dp (>= 48 dp PAUSE), 8 dp gap | 640x360 profile: buttons 112 px at 2x = 56 dp, gap 8 dp, PAUSE 48 dp, THROW right edge 610 dp, inside insets | Kept |
| Back map per screen, no auto-resume, pause menu on return | Round 5 report: all rows pass, no auto-resume after shrink/restore | Kept |
| First-launch help after Start, reopenable from title | Present ("How to play" / "Got it") | Kept, copy issue F3 |
| Haptics: none in v1 | None | Kept |
| No feature shown that does not exist (store spec) | Best/New best now exist | Kept |

No regression of a round 1/2 decision. Menus in the 640x360 profile sit inside the insets (Title 37.8-314.3 dp of 24-328), which closes the round-4 clipping.

## Blocking findings

### B1 - Gameplay hint box sits on top of ShieldMan (owner: mobile-junior-developer)
[Play screen, all profiles; worst on 640x360] - Visibility of status / Match with real world - `#control-text` ("< > move . THROW . II pause") is drawn at the bottom centre of the playfield, exactly on ShieldMan's row. In `m2_3b_lowend_playing_round4.png` and `api36_pixel7_playing_round4.png` the hero is almost completely covered (only a sliver of blue above the box). The hint stays until the first throw (M8.3), so a first-time player cannot see their own character or where it is during the moments MG4 measures (first throw within 10 s). PRD M2.4 requires that nothing covers ShieldMan's row.
Fix (pick one, do not shrink the text below 12 sp):
1. Move the hint to a row above ShieldMan (about 40-60 dp above the hero row, inside the playfield, below the robot formation's lowest row), or
2. Put it in the left/right column gap between the controls at the bottom edge and off the playfield, or
3. Drop the hint text on Android and rely on the labelled buttons plus the first-launch help.
Acceptance: on `svr_api36_lowend_640x360` and pixel7, a screenshot at level start shows ShieldMan fully visible and the hint (if kept) not overlapping it; hint text still inside the insets (M2.3b rule 2). Update the e2e bounds test to assert the hint box does not intersect ShieldMan's canvas row.

### B2 - Small-scale art legibility (M2.7) is not evidenced (owner: mobile-lead-tester, with mobile-junior-developer if art is not legible)
[640x360 profile, scale 0.505] - PRD M2.7 / M2.12(c) / round-2 carry-forward 6 - The only gameplay screenshots supplied are level 1 with 24 identical white robots. M2.7 requires the UX reviewer to confirm, on a screenshot at the real scale, (a) the four falling power-up types are distinguishable by shape, (b) 1-hit and 4-hit robots are distinguishable, (c) the shield trail is visible. None of the three can be judged from what exists. What I can confirm: robots at level 1 are readable (about 20 dp wide, distinct silhouette), HUD text at 640x360 measures about 12 sp or more, score/lives/level/power all legible, and nothing is under the gesture bands.
Fix: add `*_round6` screenshots on `svr_api36_lowend_640x360` of (1) a mid-level formation with mixed toughness (level 3+), (2) each power-up mid-fall (or one frame with two types), (3) a shield mid-bounce with trail, (4) the boss level if reachable. If any of (a)-(c) is not distinguishable at 0.505x, raise it back as a FAIL to mobile-junior-developer (larger sprite outlines or colours/shape cues, not a lower floor).

## Non-blocking findings, ranked

### F1 - Faint outlined box below Quit on the title (the "API 36" box), also behind pause and Game Over (owner: mobile-junior-developer) - Medium
Cause found: it is the gameplay hint `#control-text` and the empty HUD panels bleeding through the translucent game-screen overlay. It is visible in `api36_pixel7_title_round4.png` (box overlapping Quit's bottom edge at y about 795-835 of 900) and in `m2_3c_lowend_title_gesture_round5.png` (two ghost HUD stubs at the top corners plus the hint box under Quit). On the pause menu and Game Over, the whole HUD and hint show dimmed. Fix: on the Android title, make the overlay behind the menu opaque (as already done for shell overlays, `#05050a`), or hide `#hud-root` and `#control-text` when state is TITLE. Keep the dimmed HUD on pause (it helps orientation) but hide the hint there.

### F2 - Final touch-glyph set (owner: mobile-junior-developer for build, me for the decision) - Medium
Decision: keep ASCII words in text, but stop using bare ASCII punctuation as icons.
- Buttons: draw the arrows and pause bars with inline SVG or CSS shapes (`border` triangles, two rounded rects). No font is involved, so this is safe on every WebView (the reason ASCII was chosen) and reads as arrows. Keep the THROW word (it reads well in `m2_3b_lowend_playing_round4.png`). Not-ready state: keep dashed border and dim, and replace `...` by a small SVG "recharging" ring or the word "WAIT"; `...` is ambiguous.
- Why: `<` and `>` read as comparison symbols, and `II` reads as a Roman numeral or lowercase "Il" (the hint literally reads "II pause"). `aria-label`s stay unchanged.
- Not blocking because the buttons are positioned/labelled and work; needed before the closed test and before store screenshots are captured (screenshots must not show the placeholder glyphs).

### F3 - Help and hint copy must match the glyphs, and the help line wraps badly (owner: mobile-junior-developer) - Medium
`f1_lowend_help_round5.png`: the one-line help wraps as "... . II" / "Pause", orphaning the symbol from its word. Proposed copy, stacked as three short lines (no separators, so no orphan):
- "Left and right buttons: move ShieldMan"
- "THROW: throw your shield. One at a time. Catch it on the rebound for +1 life."
- "Pause button: pause the game"
Hint in play, short: "Left / right: move  .  THROW  .  Pause: top right" or, with SVG icons from F2, icon + word pairs. This also satisfies PRD F22 AC6 (hero named "ShieldMan" wherever the help names the hero). Keep "Got it" (>= 48 dp; it is).

### F4 - Title heading "visible above the Help panel" (owner: mobile-junior-developer) - Low
Not reproduced in `f1_lowend_help_round5.png` (help is fully opaque there). The android.css rule `#shell-overlay-root > .screen-overlay { background: #05050a }` should cover it. If it still shows on another profile, it is the translucent title overlay under an opaque help panel that does not cover the full safe layer (e.g. font scale 2.0, panel taller than overlay) - lead tester to attach the exact screenshot (which profile and font) or close the item. Fix F1 (opaque or hidden title behind shell overlays) removes the cause.

### F5 - Uneven gap between Start and How to play on the tall phone title (owner: mobile-junior-developer) - Low
`api36_pixel7_title_round4.png`: about 63 px gap between Start and How to play versus 18 px between the other buttons. The 640x360 title has even gaps (media query `max-height: 420px` sets 6 px). Above 420 px height the shared `.menu-list` spacing applies unevenly. Make spacing uniform outside the media query too. Inconsistent with the website only if the website shows the same; check and match.

### F6 - "Make the window larger to play." prompt screen (owner: none for text; PM if changed) - Low, accepted
Seen in `m2_3c_lowend_3button_prompt_round5.png` and `f2_pixel7_640x360_prompt_round5.png`. Text is centred, on the game background, about 20 px (well above 12 sp), one line, inside insets, no clipped part, and no controls showing (matches M2.10a). It is a dead end for a player with no idea why (no icon, no cause). Recommendation for the closed test and store notes rather than a change now: keep the message; if a real phone shows it, PM's v1.7 option (a) applies. Do not add tappable elements (M2.10a behavior 3).

### F7 - Prompt zoom-out (visualViewport 0.868, text about 13% smaller), L1 (owner: mobile-junior-developer, best-effort) - Low
Message at 0.868x is still about 18 px on the 640x360 view, above the 12 sp floor, and the screen is a single line. Not user-visible harm. Recommend adding `<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">` or checking that nothing in the prompt has a min-width larger than the visual viewport, which is the usual cause. Carry to the code review of the next fix; do not block.

### F8 - Flex-gap on WebView 80-83 - Closed (relied on report)
Lead tester's round 3 and round 5 device evidence (api30_mid, WebView 83) shows clear spacing on pause, title, Settings, Privacy header. I did not view those screenshots. No further action.

### F9 - Pause menu heading overlaps dimmed robots (owner: none) - Info
`f1_lowend_pause_round5.png`: "PAUSED" overlaps dimmed formation art. Legible. Accept.

### F10 - Third empty HUD box under "Power x1.00" (owner: mobile-junior-developer) - Low
An empty thin outlined bar sits under Power in every play screenshot (the active power-up indicator with no content). It reads as a rendering glitch. Hide it while no effect is active (shared HUD; check the website does the same and keep both consistent).

## Marvel-avoidance (M9.6) and naming - what I can see

- Title: exactly "Shield vs Robots" (no period, no subtitle). Pass (F22 AC1, M9.6 item 1).
- No "Vanguard", "Sentinel", "Shield Invaders" in any screenshot or in `overlays.ts`, `privacy.html` (title "Privacy policy - Shield vs Robots"). No "S.H.I.E.L.D." styling. Pass.
- Enemies: small white humanoid robots with red eyes; no purple/magenta giant humanoid, no X emblem. Pass on what is shown (boss not seen).
- ShieldMan: hidden by B1, so only a plain blue circle/sliver is visible; no star, no red/white/blue costume seen. Cannot fully verify item 6 until B1 is fixed and a screenshot shows the hero. Advisory: a blue shield among white robots with red eye/laser accents could read as red-white-blue in store screenshots; keep red minimal and never pair the shield with a star.
- Help text does not yet name ShieldMan (see F3).
- **Store assets are not built, and `store-assets-spec.md` is stale.** It still says "Vanguard", "Sentinel", and specifies a "VANGUARD VS. SENTINELS" lockup (written 2026-09-25 before the rename). Required before step 15: I will revise the spec to "Shield vs Robots", "ShieldMan", "robots", and keep the M9.6 constraints in its cross-cutting section (owner: mobile-ui-ux-designer, a follow-up task; the icon, 512 px icon, feature graphic and screenshots do not exist in the evidence so M9.6 items 4-7 for those are unverified, not passed).

## Touch, edges, lifecycle summary (from evidence)

- Touch targets: `<`, `>`, THROW 56 dp at 640x360, PAUSE 48 dp, gap 8 dp, all inside insets. Pass.
- Menus: all inside insets at normal and largest font on the 640x360 AVD; no scrolling. Pass.
- Back/pause/resume: pass per validation-report-round5 (Back pause->resume, play->pause, Home then relaunch on pause menu, shrink/restore returns to pause menu with score and lives unchanged). Pass.
- Consistency with the website: the same title, menu wording, pause menu, Game Over layout; Android adds Best, Settings, How to play as intended.

## Routing

FAIL, back to mobile-junior-developer for B1 (plus F1-F3, F5, F10 in the same change, they touch the same CSS/markup) and to mobile-lead-tester for B2 evidence. Then lead-developer and lead-tester re-run, and I re-review only B1, B2 and F1-F3 (round 4). No owner question is raised: none of these changes scope, cost or risk. The store-assets-spec revision is mine.
