# Mobile UX Design Review - Round 4 (Step 11 re-run)

**Reviewer:** mobile-ui-ux-designer subagent
**Date:** 2026-09-29
**Verdict: PASS** (no blocking findings). One new High finding (N1, HUD panels covering the formation) must be fixed before step 15 (closed test), not before step 12.
**Builds on:** design-review-round3.md (B1, B2, F1-F5, F10 are its items). Round 1/2 decisions are unchanged and were not reopened.
**Inputs (files only):** PRD-mobile v1.7, PRD-addendum-v4, device-matrix.md ("2026-09-29 - Round 6 B2 evidence"), code-review-round14.md, `android.css`, `glyphs.ts`, `src/style.css`. Screenshots viewed: `api36_pixel7_title_round6`, `api36_pixel7_playing_hint_round6`, `f1_lowend_help_round6`, `f1_lowend_pause_round6`, and `m2_7_lowend_*_round6_b2` (mixed_robots_L5, mixed_robots_powerups_L3, powerups_caret_equals_L2, shield_trail_level1, boss_L5, boss_shield_trail_L5).
**Limits:** file access only, I could not list the folder. I did not find the 640x360 "playing with hint" and "prompt" round6 captures under the names I guessed, so the 640x360 hint position rests on code-review-round14's measured values (hint bottom 334.3 dp vs hero top 357.8 dp on pixel7) and on the 0.505x B2 frames (which show the hero and controls, but hint already faded). Lead tester: attach or name those two files if you want them cited.

## Round 3 items

| Item | Result | Evidence |
|---|---|---|
| B1 hint covers ShieldMan | **Closed** | pixel7 playing frame: hint at y about 710 of 900, hero clearly visible below it (about 800), no overlap. Copy is words: "Left / right: move . THROW . Pause: top corner". Code review measured 23.5 dp clearance. |
| F1 ghost HUD/hint behind menus | **Closed** | Title has no boxes or stubs. Pause shows the dimmed HUD and no hint, as I asked. |
| F2 glyphs | **Closed** | Solid SVG arrows and two-bar pause icon; recharging reads "WAIT" with a dashed border. Reads correctly on both screens. |
| F3 copy | **Closed** | Help is three stacked lines, names ShieldMan, no orphaned symbol. |
| F4 title around Help | **Closed** | Help is fully opaque, nothing shows around it. |
| F5 uneven title gaps | **Closed** | Four buttons evenly spaced on pixel7 title. |
| F10 empty HUD bar | **Closed** | Only Score/Lives/Level/Power remain. |

Also confirmed: title is exactly "Shield vs Robots"; hero is a small blue figure with no star or red-white-blue costume; enemies are small robots with red eyes; boss is a dark grey humanoid with red eyes and no emblem (M9.6 items 1, 3, 6 pass on what is shown; store-asset items 4-7 remain a step-15 concern).

## B2 - M2.7 legibility at 0.505x (each item)

| Item | Verdict | Notes |
|---|---|---|
| (a) Four power-ups distinguishable | **PASS** | Bars, chevron, X, diamond are each distinct inside the same yellow ring in the L2 and L3 frames (about 13 dp ring). I agree with the tester: chevron and diamond are the closest pair but still differ. Advisory only (A1). |
| (b) Robot toughness | **PASS with caveat** | L5 frame shows white, light grey, dark grey robots with the same silhouette; separable at 20 dp. Brightness-only, so weak for colour-blind or low-brightness use (A2). Nothing tells the player what a tone means; darker can read as "already damaged". |
| (c) Shield trail | **PASS (borderline)** | The shield is a bright blue disc with a white rim and reads clearly in every frame. The trail is a short dotted dark-blue streak, visible on the L1 frame and clearly diagonal on the boss frame, but faint. F15 AC9 says "visible": it is, just barely. The trail is a secondary cue, so I do not block. A3 is optional. |
| Boss | **PASS** | About 100x80 px dark grey body, light outline, red eyes. Low body contrast but silhouette and eyes carry it; damage chevrons visible. |

## New finding

### N1 - HUD panels cover the top rows of the formation and can hide the shield (High; fix before step 15)
[Play screen, 640x360 profile, Levels 1-5] - Visibility of status / M2.4 - In `mixed_robots_powerups_L3` the "Power x1.80" panel sits over three robots in the top row (right side, x 930-1080 px). In `mixed_robots_L5` the "Lives: 2" panel covers the far-left robot (x 463, y 158) and the "Level: 5/10" panel hides a thrown shield (x 1030, y 80) that is partly behind it. Hiding the shield matters: catching the rebound is the +1 life mechanic.

Cause, from the source: the HUD is DOM inside the 800x600 playfield (`#hud-root`, `src/style.css`), shared with the website. Two things add up.
1. Shared: the formation's first row starts close to the HUD band and drifts sideways under the right and left panels. The stacked two-panel layout (Score over Lives, Level over Power) is about 70-80 logical px tall on the website too. I could not check the website in this review, so I cannot say how much it overlaps there.
2. Android-only amplifier: `android.css` sets `font-size: max(15px, calc(12px / var(--pf-scale)))`. At scale 0.505 that is about 23.8 logical px, so each panel is about 60% taller than on the website and the stack reaches about logical y 104 (row 1 sits at about 87). That is where the overlap comes from on the phone.

Whose: mobile-junior-developer first, Android-only, no gate change. Fix without lowering the 12 sp floor: on Android, make each panel a tighter box (line-height 1.2, padding 2px 8px, margin 1px) so the stack ends above the first formation row, and/or lay Level and Power out on one row so the stack is one panel high. Acceptance: on `svr_api36_lowend_640x360` at Levels 1, 3 and 5, no HUD panel overlaps a robot in the first row at start, and a screenshot shows it. Lead tester adds the frames.

Shared follow-up, only if the Android-only fix is not enough: moving the formation's start y down, or shrinking the shared HUD, changes game layout for the website too. That would need the website pipeline gates and both PRDs (docs/PRD.md addendum and PRD-mobile), per the one-codebase rule. Do not start it without the owner via mobile-product-manager. I expect it is not needed.

## Other findings, ranked

### A2 - Toughness is brightness-only (Low; shared game art)
Accept for v1. Any shape, outline or hit-count cue (pips, cracked outline) is a change to shared enemy art and would need both pipelines' gates. Record it as a website and Android backlog item. Cheap Android-free mitigation: none needed now.

### L1 - THROW/WAIT label is 11 px (Low; mobile-junior-developer)
`android.css` `.touch-button--throw .touch-glyph { font-size: 11px }` is below the 12 sp floor the HUD and hint follow. The label is readable in screenshots, but raise it to 12-13px bold to match the floor, checking "THROW" still fits the 56 dp button (touch-button borders are 2px). WAIT is dimmed to 0.45 opacity on purpose (dashed border also signals state); fine.

### A1 - Power-up ring (Advisory)
If any tester confuses chevron and diamond, thicken the glyph stroke. This is shared art. Not needed now.

### A3 - Trail (Advisory)
A brighter or longer trail would remove the borderline call. It is shared renderer art, so it would need both gates. Not requested.

### F9 - PAUSED heading overlaps dimmed robots (Info)
Still legible in `f1_lowend_pause_round6`. Accept.

## Routing

PASS. Step 12 (security v2) may proceed. Send N1 and L1 to mobile-junior-developer as a small CSS change through step 8 (lead developer) and a lead-tester frame check; both must be closed before step 15. No owner question is raised unless the shared fix is needed.
