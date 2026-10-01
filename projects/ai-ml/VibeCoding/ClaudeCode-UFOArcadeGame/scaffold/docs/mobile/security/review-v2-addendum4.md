# Security & Play Policy Review — Pass 2, Addendum 4 (F23 power-up glyphs: IP/policy ruling; V2-M3 disposition)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Result: PASS (conditional)** (0 CRITICAL, 0 HIGH, 1 MEDIUM, 3 LOW, 5 INFO).

- The F23 r3 code needs no change.
- The fist, rabbit and circle glyphs are **not hits** under Play's Intellectual Property and Impersonation policies or PRD-mobile M9.6.
- **V2-M3 is CLOSED as RISK-ACCEPTED by the owner (not fixed).**
- **C7 is reworded and stays OPEN** until the two documents in A4-M1 are written and the reviewer delta-checks them.
- The two diff-relevant files have no security impact.

**Findings by severity**

| ID | Severity | One line |
|---|---|---|
| A4-M1 | MEDIUM | The owner's X-risk acceptance is not yet recorded in PRD-mobile M9.6, and `store-assets-spec.md` still says the Multiplier token "may be shown again" and allows the Shield token in screenshot 4. |
| A4-L1 | LOW | The circle Shield token passes M9.6 item 2 only under binding limits; M9.6 item 2 needs a dated clarifying note and the owner has not been told about Q-v5-1. |
| A4-L2 | LOW | `release-runbook.md:26` describes C7 as "ruled on per design review", which is no longer true. |
| A4-L3 | LOW | The addendum records that the owner was told about the shape, not about the consequence to a new personal Play account. |
| A4-I1..I5 | INFO | Circle-plus-X pairing; AC4.3 gap figure; stale line reference; `contextmenu` listener; CI failure-artifact step. |

- **Date:** 2026-09-30
- **Reviewer:** mobile-security-compliance-reviewer
- **Checklists applied:** play-policy-checklist (Intellectual property and metadata; Data and privacy; Content and audience), security-compliance-checklist (application security; infrastructure/CI).
- **Scope (files only):**
  - `docs/PRD-addendum-v5.md` r3 (F23 AC1-AC10, Q-v5-1, the owner-accepted-risk record)
  - `docs/mobile/security/review-v2.md` (V2-M3, C7, §6) and addenda 1-3
  - `src/render/shapes.ts` (`drawPowerUp` `:282-332`, `drawFistGlyph` `:346-362`, `drawRabbitGlyph` `:367-388`)
  - `src/render/powerUpGlyphs.test.ts`
  - renders `docs/mobile/tests/screenshots/f23_tokens_magnified_8x.png`, `f23_tokens_2x.png`, `f23_tokens_24px.png`, `f23_tokens_24px_gray.png`
  - `src/platform/android/AndroidPlatform.ts` (`:199`), `<repo>/.github/workflows/deploy-pages.yml` (`:187-195`), `playwright.mobile.config.ts`, scaffold `.gitignore`
  - cross-checked: `docs/mobile/PRD-mobile.md` M9.6 (`:1041-1073`), `docs/mobile/ux/store-assets-spec.md` (`:93-98`, `:129-136`, `:169-174`), `docs/mobile/market/listing-draft-v2.md` (§3, §5), `docs/mobile/release-runbook.md:26`, `docs/mobile/tests/manual-only-criteria.md:171-179`, `android/app/src/main/res/drawable-v24/ic_launcher_{foreground,monochrome}.xml`
- **Verification limits:**
  - No web access. Policy names are from my own knowledge; C9's live re-check still applies.
  - No git or diff tool. The two "diff-relevant" files were read as they stand in the working tree.
  - I cannot see the project thread. The owner's three messages are taken from the verbatim record in `docs/PRD-addendum-v5.md:59-70`. mobile-product-manager must confirm that record when writing the M9.6 note (A4-M1).
  - The three renders are harness captures, not emulator or device captures. On-device appearance is still owed under F23 AC9 and the device matrix.
  - This is a policy-risk judgment, not legal advice. Nobody in this pipeline can clear a trademark.

**Gate effect:** steps 13-14 are unaffected. Step-15 upload stays blocked by C1-C10 as before. C7 now closes only when A4-M1 is fixed and delta-checked (files only, a short addendum 5). No store screenshot or feature graphic may be captured before C7 closes.

---

## 1. Ruling 1 — fist, rabbit and circle against Play IP / Impersonation policy

### 1.1 What is drawn (code and renders agree)

All four tokens share a dark disc and a 2px amber `#ffd873` ring. Glyphs are one colour, the same amber, inside ±0.45r.

| Token | Code | As rendered |
|---|---|---|
| `HIT_POWER` | `shapes.ts:346-362`: one filled outline, four knuckle domes, flat base, thumb on the left, no wrist | A small mitten-like fist, front view |
| `SPEED` | `shapes.ts:367-388`: one filled outline, whole body, facing right, crouched, two ears leaning back, no cut-outs | A small crouched animal with two ears |
| `SHIELD` | `shapes.ts:313-318`: one stroked circle, radius 0.34r, nothing inside | A small ring centred in the token ring |
| `PERMANENT_MULTIPLIER` | `shapes.ts:319-328`: two diagonals, a = 0.35r | An X that does not touch the ring |

`powerUpGlyphs.test.ts` locks these properties in: single subpath with no holes, amber only, the ±0.45r bound, the circle as "exactly one full circle and nothing else", and an X only in `shapes.ts`.

### 1.2 Fist — NOT A HIT

- A front-view closed fist is a generic pictogram. No known character or brand mark is a four-knuckle fist with a tucked thumb and no arm.
- AC4.1(c) (no forearm or wrist) keeps it away from the raised-fist emblem, which is a political symbol, not a trademark. The test at `powerUpGlyphs.test.ts:430-432` enforces this.
- Content rating (§6.3) is unaffected: a fist icon on a pick-up token is not a depiction of violence against a person.

### 1.3 Rabbit — NOT A HIT (F23 AC4.2(d) satisfied)

Checked by eye at 8×, 2× and 24px against the marks named in AC4.2(d) and others I know of:

| Mark | Distinctive features | This glyph |
|---|---|---|
| Playboy rabbit head | Head only, profile, bow tie, one bent ear, eye cut-out | Whole body, no bow tie, both ears upright, no cut-out |
| Energizer / Duracell bunnies | Upright, standing, costumed, drum or battery | Four-legged crouch, no accessories |
| Bugs Bunny, Nesquik, Trix, Miffy, Lindt | Upright or seated character with face detail, ribbon or bell | Featureless silhouette |
| Volkswagen Rabbit badge | Stretched leaping rabbit, ears flat back, chrome, vehicles | Crouched, ears up, amber, 24px; different goods |

- Bindings to keep it that way (already in AC4.2(d); restated as a condition of this ruling): whole body only, no clothing, bow tie, drum, sunglasses or eye cut-out, never head-only, never upright, amber only.
- Any redraw outside the AC4 ranges needs a new F23 revision and a new IP check.

### 1.4 Circle inside the ring (Q-v5-1) — NOT A HIT under M9.6 item 2, with binding limits (A4-L1)

**Question:** does a circle inside the ring read as the concentric shield emblem of a known character?

**Ruling: no, as drawn.**

- Captain America's shield is identified by three things together: alternating red/white/red bands, a blue centre disc, and a white five-point star. The token has none of them. It is two thin outlines in one amber colour on a dark disc, with a wide empty gap and an empty centre.
- The outer ring is not part of the Shield glyph. It is the frame shared by all four tokens (F23 AC2, tested at `powerUpGlyphs.test.ts:290-306`). Seen beside the other three, it reads as "a ring icon in the standard frame".
- Two plain concentric circles are a generic shape (a target, a record button, the letter O). No rights holder owns that shape without colour or other features.
- M9.6 item 2 says "no concentric-ring shield (the shield stays the plain avatar-blue circle, M9.3 / F14)". Its subject is the shield art, which is unchanged: a plain blue disc (`shapes.ts:106-122`). The launcher icon is also still one plain disc (`ic_launcher_foreground.xml:15-17`).
- At 24px the token is a few pixels of amber. It is not shown in any store asset (F23 AC9).

**Why it is LOW and not "no finding":** the context adds up. This is the "Indestructible Shield" token in a game about a blue-and-white hero who throws a round shield, with V2-M1 ("ShieldMan") still open. A literal reader of M9.6 item 2 could call two concentric circles on a shield token a hit, and item 4 says any hit is a FAIL. The decision must therefore be written down, not left to inference.

**Binding limits (conditions of this ruling):**
1. One amber stroked circle only: no fill, star, dot or second inner ring, no red, white or blue, no alternating bands. The test `SHIELD is exactly one full circle and nothing else` must stay.
2. Radius stays within 0.25r-0.35r (now 0.34r). A larger circle narrows the gap and starts to read as banding.
3. The Shield token appears in **no** store asset: not screenshot 4, not the feature graphic, not the icon, not a tablet screenshot. This makes F23 AC9's "pending Q-v5-1" exclusion permanent.
4. The glyph is never enlarged into a HUD badge, logo, splash or title element.
5. Fallback if a complaint arrives or a later reviewer disagrees: the wall bar (r2 AC4.3), which is already specified.

**On Q-v5-1 option (b), a solid dot:** not recommended. A filled dot inside a ring is closer to the Target Corporation bullseye than the current hollow circle is.

---

## 2. Ruling 2 — V2-M3 disposition

### 2.1 Disposition

**V2-M3: CLOSED — RISK-ACCEPTED BY OWNER (not fixed).** Dated 2026-09-30.

- V2-M3 was MEDIUM. A PASS requires zero CRITICAL/HIGH open, so a MEDIUM that the owner knowingly accepts does not block the gate.
- Basis: `docs/PRD-addendum-v5.md:57-70` and `:87-111`. The owner was told a bold X in the round token is essentially the X-Men logo shape and that V2-M3 asked for its removal. He replied "I'll take the risk" (19:53 UTC).
- My assessment of the shape is unchanged from review-v2: borderline. The arms end about 0.49r from the centre and do not touch the ring; the strokes are thin and amber; the token is 24px. What changed is the record: the PRD now calls it a "capital X" by owner choice, so it can no longer be described as an incidental multiplication sign.
- The residual risk is real and stays on the record: a rights-holder complaint or a Play IP rejection can lead to app removal, and a strike counts against a new personal developer account.

### 2.2 What keeps the acceptance narrow (verified)

| Limit | Status | Evidence |
|---|---|---|
| X only in the Multiplier branch | PASS | `powerUpGlyphs.test.ts:527-564` (source search: diagonal vertices only in `shapes.ts`, exactly four); `drawPowerUp` has one caller, `CanvasRenderer.ts:204` |
| X arms never reach the ring | PASS | a = 0.35r, bounded to 0.3r-0.4r by `powerUpGlyphs.test.ts:503-514` |
| Traceability comment in code | PASS | `shapes.ts:320-321` cites F23 AC4.4 and "review-v2 V2-M3 risk-accepted by owner 2026-09-30" |
| App icon and monochrome icon X-free | PASS | One plain disc each (`ic_launcher_foreground.xml`, `ic_launcher_monochrome.xml`) |
| Store screenshots and feature graphic X-free | **NOT YET ENFORCED → A4-M1** | Assets do not exist; the spec that governs them is stale |
| Acceptance recorded under C7 in PRD-mobile M9.6 | **MISSING → A4-M1** | No such note at `PRD-mobile.md:1041-1073` |

### 2.3 Findings

**[MEDIUM] A4-M1 — Intellectual property and metadata (Play IP policy; PRD-mobile M9.6 items 3-4; F23 AC7/AC9) — `docs/mobile/PRD-mobile.md:1041-1055`; `docs/mobile/ux/store-assets-spec.md:96-98`, `:132-136`, `:174` — The acceptance is not recorded where the mobile gates read it, and the store-asset spec contradicts it**

- **Issue:**
  1. M9.6 still says "no 'X' emblem" and "Any hit is a FAIL" with no exception note. `manual-only-criteria.md:178` already cites "owner-accepted risk C7 in M9.6", which does not exist.
  2. `store-assets-spec.md:132-136` says: "Once the replacement multiplier glyph has passed both gates … the multiplier token may be shown again." There is no replacement glyph. A release engineer could read "F23 passed both gates" as permission to show the X token in a store screenshot.
  3. `store-assets-spec.md:133` allows "HIT_POWER, SPEED or SHIELD" for the catch. F23 AC9 and §1.4 limit 3 above allow only Hit Power or Speed.
  4. `store-assets-spec.md:96-98` (feature graphic) has the same "capture after the replacement glyph ships" wording.
- **Why it matters:** the narrow scope is the only thing that makes the accepted risk small. Store graphics are what Play reviewers and rights-holders' search tools actually see. An X-in-ring in a store screenshot turns a 24px in-game token into listing metadata.
- **Required fix:**
  - **mobile-product-manager** adds a dated note under M9.6 (original text kept), containing all of:
    1. The owner's three messages of 2026-09-30, verbatim, with times, and what he was told before "I'll take the risk".
    2. The risk in plain words: possible Play IP rejection, removal or strike on a new personal account, or a trademark complaint against the website.
    3. Item 3 exception: the `PERMANENT_MULTIPLIER` token glyph (F23 AC4.4) is an owner-accepted exception, **not** a hit under item 4. It is "risk-accepted", never "cleared" or "approved".
    4. Limits: the X stays two 2px amber strokes with a ≤ 0.4r, never touching the ring. No X in the icon, adaptive icon, splash, title or logo, feature graphic, any store screenshot, or listing text.
    5. Item 2 clarification from §1.4, with its five limits, and that Q-v5-1 is answered by this addendum.
    6. Reversal: on any complaint, or if the owner changes his mind, switch to the r2 bars as a new F23 revision through both pipelines.
    7. References: `docs/PRD-addendum-v5.md` r3, `review-v2.md` V2-M3 and C7, this addendum.
  - **mobile-ui-ux-designer** updates `store-assets-spec.md` (with a change-log line):
    - `:96-98` → "No Multiplier (X) token and no Shield (circle) token in the feature graphic. If a power-up is in frame it is the fist or the rabbit."
    - `:132-136` → "The caught token is Hit Power (fist) or Speed (rabbit) only. Never the Multiplier token and never the Shield token. The multiplier appears only as the HUD text readout." Delete the "may be shown again" sentence.
    - `:174` → keep, and add "and any circle-in-ring token".
  - **mobile-marketing-analyst** adds the same token rule to `listing-draft-v2.md` §5 screenshot 4 (`:244`).
  - **Listing text, to keep it honest:**
    - Keep power-ups described by name, as now (`listing-draft-v2.md:106-112`).
    - Keep the originality sentence exactly as "ShieldMan and the robots are original characters created for this game." Do not widen it to "all artwork is original" or "no resemblance to any other property", and do not add a non-affiliation disclaimer (M12.3).
    - Do not describe or promote an "X" icon, badge or emblem anywhere in the title, descriptions, captions or tags.
  - Then the reviewer delta-checks those lines (addendum 5, files only) and C7 closes.

**[LOW] A4-L1 — Intellectual property (PRD-mobile M9.6 item 2; Q-v5-1) — `docs/PRD-addendum-v5.md:474-491`; `docs/mobile/PRD-mobile.md:1048-1051` — The circle ruling must be recorded, and the owner told**

- **Issue:** Q-v5-1 "was not raised with the owner on 2026-09-30". This addendum rules the circle acceptable, but M9.6 item 2 has no note and the owner does not know about the adjacency.
- **Required fix:** the M9.6 note in A4-M1 item 5 covers the record. mobile-product-manager tells the owner in one line in the next update: the circle Shield icon was reviewed, judged acceptable with limits, kept out of store art, and the wall bar is the fallback. No decision is needed from him unless he wants the wall.

**[LOW] A4-L2 — C7 record — `docs/mobile/release-runbook.md:26` — C7 is described as "permanent multiplier glyph ruled on per design review"**

- **Issue:** design-review-round5 ruled "change the glyph"; the owner overrode it. The line also carries a pre-filled "✓" (A3-I1).
- **Required fix (mobile-technical-writer):** "C7: V2-M3 closed as owner risk-accepted (PRD addendum v5 r3; review-v2 addendum 4). M9.6 note recorded; no Multiplier or Shield token in any store graphic; icon, splash and feature graphic X-free." Add a §10 checkbox: "Every store screenshot and the feature graphic checked by eye: no X token, no circle token."

**[LOW] A4-L3 — Informed acceptance — `docs/PRD-addendum-v5.md:67-70` — The record shows the owner was told about the shape, not the consequence**

- **Issue:** the recorded prompt is that the X "is essentially the X-Men logo shape". The consequence (removal or a strike on a new personal Play account) appears in the addendum's own text, not in what the owner was shown.
- **Required fix:** mobile-product-manager states the consequence to the owner in one sentence in the next update and records that it was done in the M9.6 note. This confirms the acceptance; it does not reopen it. If the owner changes his mind, the r2 bars apply.

### 2.4 Informational

- **A4-I1 — Circle and X as a pair.** A circle token and an X token side by side can recall noughts-and-crosses or a console maker's button symbols. With one amber colour and only two of the shapes, I do not rate it a hit. Do not add triangle or square glyphs later, and never show the two tokens together in store art (already excluded by A4-M1).
- **A4-I2 — `docs/PRD-addendum-v5.md:338-340`.** "a gap of at least 7.8px (0.65r) to the ring" is a centre-line figure. With 2px strokes at r = 12 and radius 0.34r, the visible dark gap is about 5.9px. It is still wide enough. Correct the number in the next revision.
- **A4-I3 — `review-v2.md` V2-L2** cites `AndroidPlatform.ts:277` for the test-hook gate. It is now `:280`. The gate itself is unchanged (`?e2e=1` and not `Capacitor.isNativePlatform()`).

---

## 3. Ruling 3 — §6 Play Console answers and conditions C1-C11

### 3.1 §6 answers

| Section | Change | Reason |
|---|---|---|
| 6.1 Data safety | None | F23 is draw code only. No storage, network, plugin or SDK change. |
| 6.2 Other declarations | None | No permission, ads, access or account change. |
| 6.3 Content rating | None | A fist icon on a pick-up token adds no violence, and the rabbit adds no child-directed character. Answers stay as drafted. |
| 6.4 Target audience | None | 13+ as drafted (C3 still pending). V2-I2 still applies: a small animal icon does not change my view, but keep the rabbit out of the icon and feature graphic so the listing does not gain a mascot. |
| 6.5 Store settings and listing | **One bullet amended** | See below. |

**§6.5 "Graphics", second bullet — replace** "The feature graphic and at least 2 screenshots are real Android-build captures meeting M9.6 and V2-M3." **with:**

> The feature graphic and at least 2 screenshots are real Android-build captures from a build that contains F23 r3. They meet M9.6 as amended by the C7 note: no Permanent Multiplier (X) token and no Shield (circle) token in any store graphic; any power-up shown is the fist or the rabbit; the old chevron, speed-line, kite and ringed-"x" tokens appear nowhere.

This addendum is the "review-v2 addendum" that C10 requires for a changed answer.

### 3.2 Conditions

| # | Change |
|---|---|
| C1-C6 | None. V2-M1 (OQ-M15) and V2-M2 dispositions were not re-checked here. |
| **C7** | **Reworded; OPEN.** "V2-M3 is closed as owner risk-accepted. (a) The M9.6 note of A4-M1 is written by mobile-product-manager; (b) `store-assets-spec.md` and `listing-draft-v2.md` §5 carry the fist-or-rabbit-only token rule; (c) the reviewer delta-checks (a) and (b); (d) at step 15, `submission-checklist.md` records that every store screenshot, the feature graphic and the 512 icon were checked by eye and show no X token and no circle token." Owners: mobile-product-manager, mobile-ui-ux-designer, mobile-marketing-analyst, mobile-release-engineer. Due: (a)-(c) before any store asset is captured; (d) before step-15 upload. |
| C8 | None. `privacy.html` is not touched by F23. |
| C9 | No text change. The release evidence must come from a build that contains F23 r3; record the commit SHA (V2-L5). |
| C10 | No text change. Transcribe §6 with the amended §6.5 bullet above. |
| C11 | None. F23 changes `src/` only, so it does not trigger C11's "differs in manifest, Gradle, Capacitor config, plugins or dependencies" clause. If the X is later replaced by the bars, that is a shared art change through both pipelines; it needs no new security review unless something other than `drawPowerUp` changes. |

Also carried, unchanged: A-C1 (owner fills `[DEVELOPER NAME]` and `[CONTACT EMAIL]`).

---

## 4. Security impact of the two diff-relevant files

**A4-I4 — `src/platform/android/AndroidPlatform.ts:199` — new `contextmenu` listener: no security impact.**
- It calls `event.preventDefault()` on the game's click root. It reads nothing, stores nothing and adds no HTML sink or network call.
- It is in the Android-only module, so the website is unchanged.
- It does not reach inside the sandboxed privacy-policy frame. That page has no links or scripts (addendum 2), so a long-press menu there exposes nothing.
- Data safety answers are unaffected.

**A4-I5 — `<repo>/.github/workflows/deploy-pages.yml:187-195` — failure-artifact upload: no security impact.**
- Runs only in `mobile-e2e` and only on failure. That job has `contents: read`, `persist-credentials: false`, and uses no secrets.
- The workflow triggers only on pushes to master and manual dispatch, so no fork code runs.
- The uploaded `test-results/` holds Playwright traces and screenshots of the game served from localhost (`playwright.mobile.config.ts:31-32`). It contains no credentials or personal data.
- Retention is 7 days. `test-results/` is gitignored (`.gitignore:35`).
- `actions/upload-artifact@v4` is tag-pinned, the same as the existing use at `:157`. V2-I1's optional hardening (pin first-party actions by SHA) still stands.

---

## 5. Open conditions carried

| # | Condition | Owner | Due |
|---|---|---|---|
| C7 (reworded, §3.2) | OPEN: A4-M1 fixes, then reviewer delta check, then step-15 by-eye evidence | mobile-product-manager; mobile-ui-ux-designer; mobile-marketing-analyst; mobile-release-engineer | Before any store asset is captured; evidence before step-15 upload |
| A4-L1, A4-L3 | Owner told about the circle ruling and the consequence of the X risk; both recorded in the M9.6 note | mobile-product-manager | With the M9.6 note |
| A4-L2 | Runbook C7 line and §10 checkbox | mobile-technical-writer | Before step 15 |
| A-C1 | OPEN (owner), unchanged | mobile-product-manager → mobile-technical-writer | Before step 15 |
| C1-C6, C8-C11 | Unchanged | As in review-v2 | As in review-v2 |

Everything else in review-v2 and addenda 1-3 is unchanged by this addendum. The website-side record of the same disposition (NFR-10) belongs to security-compliance-reviewer's pass 2.
