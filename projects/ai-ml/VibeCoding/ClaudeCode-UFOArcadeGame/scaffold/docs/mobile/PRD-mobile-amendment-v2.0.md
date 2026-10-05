# Mobile PRD Addendum (Android) — Amendment v2.0

**Product:** Shield vs Robots (Android app)
**Amends:** `docs/mobile/PRD-mobile.md` (v1.9). That file is not edited by
this amendment; where the two differ, this file is the later record.
**Date:** 2026-10-05
**Author:** mobile-product-manager
**Status:** Two owner decisions recorded. No acceptance criterion's wording
or threshold changes.

**How the decisions reached this document.** mobile-product-manager cannot
see the project thread. Both owner messages below were given to it word for
word by the main session, which is the source. They are the only owner
words quoted in this file. Everything else is the product manager's record
of what follows from them, and is labelled as such where it is a judgment.

---

## Summary

1. **Scope (OD-v2.0).** The Android work stops once the app works on an
   Android emulator. It is not submitted to Google Play. The Mobile
   Pipeline ends at step 14 (UAT on the emulator).
2. **Speed icon (Q-v5-2).** The Speed power-up icon changes from the rabbit
   to the "<-->" double arrow. The drawing is shared with the website and
   is specified in `docs/PRD-addendum-v5-r6.md` (F23 r6).

Terms used below, in plain words:
- **Emulator:** a simulated Android phone that runs on the owner's PC.
- **AAB** (Android App Bundle): the file that is uploaded to Google Play.
- **Closed test:** Google's rule that a new personal developer account
  must have at least 12 invited testers keep the app installed for 14 days
  before it may be published.
- **Data safety form:** a Google Play questionnaire about what data an app
  collects.
- **UAT:** the product manager's end-user test run (step 14).

---

## 1. OD-v2.0 — Scope: stop at the emulator; no Google Play release

**DECIDED 2026-10-05 by the owner (a direct instruction, not a choice among
PM options).** On 2026-10-05 at 17:25:06 UTC the owner (Aaron) wrote in the
project thread:

> "I want to stop where it works in an emulator but I do not try to actually push the app to the Android store."

### 1.1 What this changes

- **The Mobile Pipeline ends at step 14.** A UAT PASS on Android emulators
  is the finish line for the Android app.
- **Steps 15, 16 and 17 will not run:** no signed release bundle (AAB), no
  upload, no Google Play closed test, no production release.
- No Play developer account, payment, signing key, upload key or Play
  Console entry is needed. No agent creates any of them and no agent
  uploads anything.
- `docs/mobile/PRD-mobile.md` §5 lists three release gates. Only the first
  (UAT, step 14) remains. The closed-test and production bullets are kept
  there as the original record.

### 1.2 Closed as "not applicable: no store release"

"Closed" here means the item no longer needs an answer or a check. It does
**not** mean decided, met or passed. Each item stays on file as written.

| Item | What it was | Where it lives |
|---|---|---|
| OQ-M11 | Play developer account, app ID, public developer name, contact email | `PRD-mobile.md` §7 |
| OQ-M12 | App signing key | `PRD-mobile.md` §7 |
| OQ-M13 | Target age group and content rating | `PRD-mobile.md` §7 |
| OQ-M14 | Where the 12 or more closed-test testers come from | `PRD-mobile.md` §7 |
| A-C1 | Fill `[DEVELOPER NAME]` and `[CONTACT EMAIL]` on the privacy page (`public/privacy.html` lines 112-113) | `docs/mobile/security/review-v2-addendum1.md` to `-addendum3.md` |
| C1-C11 | Security review conditions due before or at the step-15 upload, as far as each was still open. This includes **C7 part (d)**: the release engineer's by-eye check that no store screenshot, feature graphic or store icon shows the X or circle token. A condition already closed by a security addendum stays closed. | `docs/mobile/security/review-v2.md` §conditions and its addenda; `PRD-mobile.md` M9.6 |
| Real-phone frame-rate question | "Is a real Android phone available for the frame-rate check?" Asked as Q1 in UAT round 1, carried as Q1 and N1 in round 2, never answered. | `docs/mobile/tests/uat-results.md`, `uat-results-round2.md` |
| N3 | Real edge back-swipe (a finger on a real phone) | `docs/mobile/tests/uat-results-round2.md` |
| N4 | Incoming-call screen | same |
| N5 | Real fold and split-screen resize | same |

N3, N4 and N5 had been deferred to the closed test. With no closed test
they are not checked at all. They are recorded in UAT as "not applicable:
no store release; not tested on a real device", never as PASS.

### 1.3 Frame rate stays an emulator-only measurement

M10.1 (frame rate on the low-end profile) is measured on emulators only. An
emulator draws with the PC's graphics card, so its numbers do not prove or
clear any real phone. UAT reports what was measured and says so. The M10.1
thresholds are unchanged and are not claimed as met on phone hardware.

### 1.4 Store-only criteria (product manager's reading, not an owner statement)

The owner's sentence does not list criteria. The following is
mobile-product-manager's reading of what cannot be checked without Google
Play or real testers. These are **not applicable** and are not UAT
failures. If the main session or the owner reads any of them differently,
that item is put back in scope; nothing here is an owner ruling.

| Criterion | Why it cannot be checked without a store release |
|---|---|
| M1.2, the step-15 part only | "Release engineer re-verifies at step 15" that Google Play accepts the target API level. The level set in the build is still checked from the project files. |
| M8.4, MG4, MG5 | Answers from closed-test testers. |
| MG1, MG2, MG7 | Play Console crash and freeze statistics; the 12-tester, 14-day gate. |
| MG6, the closed-test half only | "0 reports ... across the device matrix **and closed test**". The device-matrix half still applies. |
| M9.5 | The 512 × 512 store icon and the 1024 × 500 feature graphic exist only for the Play listing. The app's own launcher icon and splash screen (the other M9 criteria) still apply. |
| M9.6 item 8; C7 part (d) | Checks due "before step 15" or "at step 15". |
| M10.5 | Download size as reported by Play Console for the AAB. |
| M10.7 | Google's pre-launch report, which runs only after an upload. |
| M11.3, the form only | The Data safety form. "No data leaves the device" still applies and is still checked. |
| M11.4, the listing link only | "linked in the Play listing". See 1.6 for the page itself. |
| M11.5, the Console field only | Play Console "Contains ads" = No. "No ads, no purchases, no ad or analytics SDK in the app" still applies. |
| M11.6 | The content-rating questionnaire and audience declaration. |
| M12 (M12.1-M12.6) | The store listing: title, descriptions, screenshots, category. |
| M2.3b, M2.3c, the closed-test watch only | "The closed test asks testers to report any 'Make the window larger to play.'" The on-emulator behaviour still applies. |

Everything that an emulator can show still applies in full, including
M11.4a (the in-app privacy screen), M11.1 (offline), M11.2 (permissions)
and M11.7 (no licensed IP in the app).

### 1.5 Not changed

- The one-codebase rule (`PRD-mobile.md` §0, `.claude/CLAUDE.md` "One
  codebase"): **game rules are shared with the website.** Any rule or
  design change still updates the shared acceptance criteria in
  `docs/PRD.md` or its addenda and must pass BOTH the website and the
  mobile gates. For the Android app the last gate is now step 14.
- Every on-device acceptance criterion in M0-M11 as far as an emulator can
  show it. Owner decisions OQ-M1 to OQ-M10, OQ-S1, OQ-S1a, OQ-A1 and Q-v3-1.
- The website and its pipeline.
- The shared IP rules (`docs/PRD-addendum-v4.md` F22 AC8,
  `docs/PRD-addendum-v5.md` F23 AC7) and the owner-accepted X risk (M9.6
  C7.1-C7.7), because the website draws the same tokens. Only C7 part (d),
  which concerns store images, has nothing left to check.

### 1.6 Consequences (for the record)

- **Cost:** none. No account fee, no key to keep safe.
- **What is given up:** the app is not available to anyone outside the
  owner's PC, and nothing is proven on a real phone: touch feel with real
  fingers, real frame rate, the real back swipe, an incoming call, a real
  fold.
- **Reversible at any time.** If the owner later wants a store release,
  every item in 1.2 and 1.4 reopens exactly as written, steps 15-17 run as
  specified in `.claude/CLAUDE.md`, and a real-phone check is needed first.
  Nothing recorded here counts as an answer to any of those questions.
- **One point the owner may want to know about (not decided here).**
  `public/privacy.html` still shows the two placeholders `[DEVELOPER NAME]`
  and `[CONTACT EMAIL]`. Closing A-C1 means nobody is required to fill
  them. That file is part of the website's `public/` folder and is also
  the text the app shows under Settings → Privacy policy, so the
  placeholders remain visible in both places. Options, if the owner wants
  to act: (a) leave it as it is (no work; a reader sees bracketed
  placeholders); (b) have mobile-technical-writer replace the two lines
  with a neutral sentence such as "This app is not published on an app
  store" (small docs change, then the security reviewer's short delta
  check); (c) fill in a real name and email (the OQ-M11 question again).
  Recommendation: (b), because it removes unfinished-looking text at low
  cost without publishing personal details. Until the owner says
  otherwise, (a) is the state of the repo.
- `.claude/CLAUDE.md` still lists mobile steps 15-17. This amendment does
  not edit it; whether to mark them parked is for the owner and the main
  session.

---

## 2. Q-v5-2 — Speed power-up icon: the double arrow

**DECIDED 2026-10-05 by the owner: the arrow.** Q-v5-2 offered three
options: the arrow, keep the rabbit, or bigger tokens. On 2026-10-05 at
17:25:24 UTC the owner wrote:

> "Yes, I want to replace the rabbit with the arros."

"arros" is his typo for "arrows": the "<-->" double arrow he first offered
on 2026-09-30.

- **Why the question was asked.** The rabbit failed the step-11 design
  gate on the 640 × 360 dp reference phone
  (`docs/mobile/ux/design-review-round9.md`: about 15 pixels wide, reads as
  a squiggle). It was put to the owner as Q2 in
  `docs/mobile/tests/uat-results-round2.md`.
- **What changes.** The Speed token glyph becomes the horizontal double
  arrow "<-->". The fist (Hit Power), the circle (Shield) and the capital X
  (Multiplier) are unchanged. Token size, the catch hitbox, the Speed
  effect and the HUD text "3x Speed" are unchanged; the "bigger tokens"
  option was not chosen.
- **Where the criterion lives.** This is a shared art change, so the
  testable criterion is in the shared PRD: `docs/PRD-addendum-v5-r6.md`,
  F23 r6 AC4.2. It applies to the website and the Android app and goes
  through both pipelines' gates.
- **Mobile criteria.** No mobile AC text changes. M2.7 ("distinguishable by
  shape" on the 640 × 360 dp profile) is re-judged on the new icon by
  mobile-ui-ux-designer and again in UAT round 3, from a real emulator
  capture.

---

## 3. Follow-ups (each by the agent that owns the work)

- **mobile-junior-developer → mobile-lead-developer** (and the website
  code-implementer → code-reviewer): the double arrow is in the working
  tree (`src/render/shapes.ts`, `drawDoubleArrowGlyph`). It still goes
  through code review for both platforms. See the comment follow-up in
  `docs/PRD-addendum-v5-r6.md` §Test coverage.
- **mobile-junior-tester / mobile-lead-tester** (and the website
  test-writer / test-validator): close the test gaps listed in
  `docs/PRD-addendum-v5-r6.md`; confirm the `_r6` renders.
- **mobile-ui-ux-designer** (round 10) and **ui-ux-designer**: judge the
  arrow unprimed, low-end profile included.
- **mobile-product-manager:** UAT round 3 on the committed build, as the
  final Android gate. The results state what "works in an emulator" does
  and does not cover (1.2-1.4), and include an emulator capture of the
  Speed token.
- **mobile-release-engineer:** no work. Steps 15 and 17 do not run.
- **main session:** add a pointer to this file from
  `docs/mobile/PRD-mobile.md`; raise the privacy-page point in 1.6 with
  the owner if he wants it tidied.

---

## Sources

- Owner message, 2026-10-05 17:25:06 UTC, relayed verbatim by the main
  session → §1.
- Owner message, 2026-10-05 17:25:24 UTC, relayed verbatim by the main
  session → §2.
- `docs/mobile/PRD-mobile.md` v1.9: §0 (one codebase), §2 (MG1-MG7), M1.2,
  M2.3b, M2.3c, M2.7, M8.4, M9.5, M9.6 (items 1-8, C7.1-C7.7, "C7 part
  (d)"), M10.1, M10.5, M10.7, M11.3-M11.6, M12, §5, §7 (OQ-M11 to OQ-M14).
- `docs/mobile/security/review-v2.md` (conditions C1-C11) and
  `review-v2-addendum1.md` to `-addendum6.md` (A-C1).
- `docs/mobile/tests/uat-results.md` (Q1, N1) and
  `docs/mobile/tests/uat-results-round2.md` (N1, N3-N5, Q1, Q2).
- `docs/mobile/ux/design-review-round9.md` (FAIL for the rabbit on the
  low-end profile; the options).
- `docs/PRD-addendum-v5.md` (F23 r1-r5) and `docs/PRD-addendum-v5-r6.md`
  (F23 r6, the shared Speed-glyph criterion).
- `.claude/CLAUDE.md` §Mobile Pipeline (steps 14-17) and §One codebase.
