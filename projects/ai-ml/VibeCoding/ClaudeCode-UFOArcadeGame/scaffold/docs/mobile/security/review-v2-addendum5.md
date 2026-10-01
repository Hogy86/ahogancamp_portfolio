# Security & Play Policy Review — Pass 2, Addendum 5 (delta check for condition C7)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Result: PASS** (0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW, 4 INFO).

- **A4-M1 is CLOSED.** The M9.6 note and the store-asset token rules are in place and agree with each other.
- **C7 parts (a), (b) and (c) are CLOSED.** Part (d) stays OPEN as step-15 evidence.
- Store screenshots and the feature graphic may now be captured, from a build that contains F23 r3, under the fist-or-rabbit-only rule.
- A4-L1 and A4-L3 are PARTIAL: the record is written, but whether the owner was actually sent the update cannot be confirmed from files (A5-L1).
- A4-L2 is CLOSED, with one gap in the checkbox wording (A5-L2).
- V2-M3 stays CLOSED as risk-accepted by the owner, not fixed.

**Details**

- **Date:** 2026-09-30
- **Reviewer:** mobile-security-compliance-reviewer
- **Checklists applied:** play-policy-checklist (Intellectual property and metadata), security-compliance-checklist (no application-security surface in this delta: documents only).
- **Scope (files only, delta lines only):**
  - `docs/mobile/security/review-v2-addendum4.md` (the findings being checked)
  - `docs/mobile/PRD-mobile.md` `:15`, `:131-148`, `:182-184`, `:1064-1217`, `:1477-1492`, `:2047-2068`
  - `docs/PRD-addendum-v5.md` `:61-145`, `:353-366`, `:440-458`, `:467-483`, `:506-559`
  - `docs/mobile/ux/store-assets-spec.md` `:18-25`, `:71-99`, `:130-135`, `:166-177`
  - `docs/mobile/market/listing-draft-v2.md` `:244-251`
  - `docs/mobile/release-runbook.md` (whole file)
  - `docs/mobile/security/review-v2-addendum3.md` `:46-63` (A3-I1 to A3-I4)
- **Verification limits:**
  - I cannot see the project thread. Statements that the main session told the owner something are checked only as text in the documents.
  - No shell. The runbook's PowerShell commands were checked by reading them, not by running them.
  - No web access. C9's live policy re-check still applies.
  - The listing's wider text was checked with one search for X-icon wording, not re-read in full.
  - This is a policy-risk judgment, not legal advice.

**Gate effect:** steps 13-14 are unaffected. Step-15 upload stays blocked by C1-C6, C7(d), C8-C10 and A-C1 as before. A5-L1 and A5-L2 are due before step-15 upload.

---

## 1. Finding-by-finding status

| ID | Status | One line |
|---|---|---|
| A4-M1 | **CLOSED** | M9.6 note carries all seven required items; the store-asset spec and listing carry the token rule. |
| A4-L1 | **PARTIAL** | Circle ruling recorded under M9.6 item 2; delivery of the one-line owner update is not evidenced. |
| A4-L2 | **CLOSED** | Runbook C7 line matches the required wording; §10 checkbox added (see A5-L2). |
| A4-L3 | **PARTIAL** | Consequence wording recorded; delivery to the owner is not evidenced. |
| A4-I2 | **CLOSED** | AC4.3 gap figure corrected; arithmetic checked. |

### 1.1 A4-M1 — CLOSED

**PRD-mobile M9.6 note (`docs/mobile/PRD-mobile.md:1098-1217`).** Items 1-8 are kept unchanged at `:1064-1096`.

| Required item | Evidence | Result |
|---|---|---|
| 1. Owner's three messages, verbatim, with times, and what he was told | C7.1 `:1105-1122`. The quotes match `docs/PRD-addendum-v5.md:65-74` word for word. | Met |
| 2. Risk in plain words | C7.2 `:1134-1146`: rejection, later removal, account strike, website trademark complaint. | Met |
| 3. Item 3 exception, "risk-accepted", never "cleared" or "approved" | C7.3 `:1148-1156`. It also keeps the rest of item 3 in force. | Met |
| 4. Limits | C7.4 `:1158-1167`: two 2px amber strokes, a ≤ 0.4r, never touching the ring; no X in icon, adaptive icon (including monochrome), splash, title or logo, feature graphic, any store screenshot, or listing text. | Met |
| 5. Item 2 clarification with five limits; Q-v5-1 answered | C7.5 `:1169-1189`. The five limits match addendum 4 §1.4. | Met |
| 6. Reversal | C7.6 `:1197-1201`: r2 bars, new F23 revision, both pipelines. | Met |
| 7. References | C7.7 `:1203-1207`. | Met |

Supporting records agree with the note: the status line (`:15`), the v1.8 amendment summary (`:131-148`), the §7 owner decision log (`:1477-1492`) and the §9 change record (`:2047-2068`). The reference `manual-only-criteria.md:178` made to "owner-accepted risk C7 in M9.6" now resolves.

**`docs/mobile/ux/store-assets-spec.md`.**

| Required edit | Evidence | Result |
|---|---|---|
| Feature graphic rule | `:97-99`: "No Multiplier (X) token and no Shield (circle) token in the feature graphic. If a power-up is in frame it is the fist or the rabbit". | Met |
| Screenshot 4 token rule; "may be shown again" deleted | `:133-135`: Hit Power (fist) or Speed (rabbit) only; never Multiplier, never Shield; multiplier only as HUD text. The "may be shown again" sentence is gone from live text. | Met |
| Cross-cutting constraint | `:173-174`: adds "and any circle-in-ring token". | Met |
| Change-log line | `:25`, dated 2026-09-30, cites A4-M1 and C7. | Met |

**`docs/mobile/market/listing-draft-v2.md` §5 screenshot 4.** `:248-251` carries the same token rule with a dated note. A search of the file for X-icon, emblem or badge wording found only this rule line, so the listing does not describe or promote an X.

### 1.2 A4-L1 and A4-L3 — PARTIAL (record written; delivery not evidenced)

- The record part of both fixes is done:
  - A4-L1: `PRD-mobile.md:1190-1195` and `PRD-addendum-v5.md:528-534`.
  - A4-L3: `PRD-mobile.md:1124-1132` and the decision log `:1484-1490`.
- The wording is right. It says "stated to the owner", not a new approval, and names rejection, removal and a strike on his new personal account.
- The same document lists the delivery as still to do: `PRD-mobile.md:2067-2068`, "**main session** sends the owner the thread update described in C7.1 and C7.5."
- So the note says the update "accompanies this note", while the follow-up list says it has yet to be sent. I cannot tell from files which is true. See A5-L1.
- This does not block C7 (a)-(c). Both findings are LOW, and the acceptance itself ("I'll take the risk") is on record.

### 1.3 A4-L2 — CLOSED

- `docs/mobile/release-runbook.md:26` now reads exactly as required: "V2-M3 closed as owner risk-accepted (PRD addendum v5 r3; review-v2 addendum 4). M9.6 note recorded; no Multiplier or Shield token in any store graphic; icon, splash and feature graphic X-free."
- The pre-filled "✓" is gone; the line is a `- [ ]` checkbox.
- `:496` adds the by-eye checkbox with the wording addendum 4 asked for. That wording was mine and is narrower than C7(d). See A5-L2.

### 1.4 A4-I2 — CLOSED

- `docs/PRD-addendum-v5.md:355-361` now says the centre-line distance is at least 7.8px and the visible dark gap is "at least about 5.8px (about 5.9px at the implemented radius of 0.34r)".
- Checked at r = 12 with 2px strokes: the ring's inner edge is at 11px. At 0.35r the circle's outer edge is at 5.2px, so the gap is 5.8px. At 0.34r it is 5.92px. Both figures are correct.
- The superseded r3 sentence is kept and marked (`:362-366`). No bound changed.

### 1.5 Other r4 lines in `docs/PRD-addendum-v5.md` — consistent

- **AC9 (`:440-454`):** the Shield-token exclusion is permanent and covers screenshot 4, every other phone or tablet screenshot, the feature graphic and the store icon. This matches addendum 4 §1.4 limit 3.
- **Q-v5-1 (`:506-534`):** marked answered, with the five limits copied correctly and the r3 question text kept for the audit trail (`:536-555`). Option (b) is recorded as not recommended.
- **Revision table (`:134-145`):** states that r4 changes no shape, radius band, colour, test bound or owner decision. I found nothing that contradicts that.

---

## 2. Release runbook — addendum 3 suggestions and regressions

| ID | Status | Evidence |
|---|---|---|
| A3-I1 | **Applied** | `:20-30` are `- [ ]` checkboxes; no pre-filled "✓". |
| A3-I2 | **Applied** | `:470` reads "C1-C10 complete: Yes / No. C11 acknowledged (re-checked at step 17): Yes / No". The heading at `:488` is now "Privacy policy (C8) and live policy re-check (C9)". |
| A3-I3 | **Not applied** | `:495` still records only the date and the targetSdk requirement. `:520` still records only the Data safety answers. See A5-I1. |
| A3-I4 | **Applied** | `:500` adds the `cd` to the mirror; `:502` says the "repo copy" is the mirror copy; `:514` adds the line-endings note; `:515` says to hash after A-C1 and after the Pages deploy. The optional `.gitattributes` suggestion was not taken, which is acceptable. |

**Hash commands (`:499-516`) — still correct as written.**
- With the `cd` at `:500`, the relative paths `public/privacy.html` and `android/app/build/outputs/bundle/release/app-release.aab` resolve inside the mirror.
- The `tar -xf … -C "$env:TEMP\aab-x" base/assets/public/privacy.html` line extracts one member from the bundle, and the path matches where Capacitor's web assets land in an AAB.
- The two new notes are `#` comments inside the code block, so pasting the block does not break it.
- Not run; checked by reading.

**Nothing else in the runbook changed in a way that affects security or policy.** The signing sections (§2), build (§3), smoke checks (§4) and upload steps (§6-§8) read as they did at addendum 3.

---

## 3. New findings

**[LOW] A5-L1 — Informed acceptance (A4-L1, A4-L3 carried) — `docs/mobile/PRD-mobile.md:1124-1132`, `:1190-1195`, `:2067-2068`; `docs/PRD-addendum-v5.md:528-532` — The owner update is recorded as given, and also listed as still to send**

- **Issue:** the M9.6 note says the main session "states the consequence to the owner" in the update "that accompanies this note". The §9 follow-up list in the same document says the main session "sends" that update. No date-and-time record shows it was sent.
- **Why it matters:** the X risk falls on the owner's new personal Play account. The record should show he was told the consequence, not only that someone intended to tell him.
- **Required fix:** after the update is sent, mobile-product-manager adds one dated line under C7.1 giving the UTC time the update was posted, and whether the owner replied. If he asks for the bars or the wall, C7.6 or C7.5 limit 5 applies. Due before step-15 upload. No reviewer re-check is needed; the release engineer confirms the line exists when ticking C7 in runbook §1.1.

**[LOW] A5-L2 — C7 part (d) evidence — `docs/mobile/release-runbook.md:496` — The by-eye checkbox omits the 512 icon and sits under the privacy heading**

- **Issue:** C7(d) and `PRD-mobile.md:1211-1214` require the check to cover "every store screenshot, the feature graphic and the 512 icon". The checkbox covers only screenshots and the feature graphic. That wording came from addendum 4 A4-L2, so the gap is mine, not the writer's. The checkbox is also the last item under "Privacy policy (C8) and live policy re-check (C9)", where it is easy to miss.
- **Why it matters:** the release engineer fills `submission-checklist.md` from this list. Part (d) is judged against C7's wording, so a checklist that follows the runbook exactly would fall short.
- **Required fix (mobile-technical-writer):** change the line to "Every store screenshot (phone and tablet), the feature graphic and the 512 icon checked by eye: no X token, no circle token. Any power-up shown is the fist or the rabbit." Move it under its own §10 heading, for example "Store graphics (C7)". Due before step 15.

**Informational**

- **A5-I1 — A3-I3 still open (`release-runbook.md:495`, `:520`).** The suggestion stands: add fields for the closed-test rule found (testers and days), the User Data policy's privacy-policy wording, the content rating (§6.3) and the target audience (§6.4/§6.5). Until then the release engineer must cross-reference §1.1 for C9 and C10.
- **A5-I2 — `release-runbook.md:273-281`, pre-existing, not part of this delta.** §3.2 ends with the shell in `android\`, and §3.3's commands use `android/app/build/...`. Run as written, they fail with "path not found". They fail safely, but a `cd ..` or the mirror `cd` at the top of §3.3 would avoid it. §4.1 and the §10 hash block already have their own `cd`.
- **A5-I3 — `docs/PRD-addendum-v5.md:475`.** The cross-platform AC9 row still quotes C7's old wording ("before screenshots are captured (step 15)"). C7 as reworded says (a)-(c) come before any store asset is captured and (d) before upload. Correct it in the next revision.
- **A5-I4 — Incidental tokens in other screenshots.** Screenshots 1-3 and the tablet shot are live gameplay, where a Multiplier or Shield token can fall into frame by chance. The rule is covered by `store-assets-spec.md:173-174`, `PRD-addendum-v5.md:446-449` and the step-15 by-eye check. The release engineer should re-take any capture where one appears, not crop or edit it out (M12.4: real captures).

---

## 4. Conditions

| # | Status after this addendum |
|---|---|
| **C7 (a)** M9.6 note written | **CLOSED** (`PRD-mobile.md:1098-1217`) |
| **C7 (b)** fist-or-rabbit-only rule in the store-asset spec and listing §5 | **CLOSED** (`store-assets-spec.md:97-99`, `:133-135`, `:173-174`; `listing-draft-v2.md:248-251`) |
| **C7 (c)** reviewer delta check | **CLOSED** (this addendum) |
| **C7 (d)** by-eye evidence in `submission-checklist.md` | **OPEN.** Owner: mobile-release-engineer. Due before step-15 upload. Must cover every store screenshot, the feature graphic and the 512 icon. |
| A5-L1 | OPEN. Owner: mobile-product-manager, with the main session. Due before step-15 upload. |
| A5-L2 | OPEN. Owner: mobile-technical-writer. Due before step 15. |
| A-C1 | OPEN (owner), unchanged. |
| C1-C6, C8-C11 | Unchanged from review-v2 and addenda 1-4. |

`PRD-mobile.md:1214-1217` and `:2050-2051` say "C7 stays open until the reviewer delta-checks". That text was correct when written and already points to addendum 5, so it needs no edit. From this addendum on, only part (d) of C7 is open.

The amended §6.5 "Graphics" bullet from addendum 4 §3.1 still stands and is what C10 transcribes. Everything else in review-v2 and addenda 1-4 is unchanged.
