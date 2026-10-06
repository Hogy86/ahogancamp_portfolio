# Security & Play Policy Review — Pass 2, Addendum 3 (A-C2 re-check)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Result: PASS** (0 CRITICAL, 0 HIGH, 0 MEDIUM, 0 LOW, 4 INFO). A2-L1 and A2-L2 are closed, so condition A-C2 is **CLOSED**. A2-I1 to A2-I4 are also closed. A-C1 (owner placeholders) stays open and was not part of this re-check.

- **Date:** 2026-09-30
- **Reviewer:** mobile-security-compliance-reviewer
- **Scope (files only):** these lines of `docs/mobile/release-runbook.md` (current working tree):
  - §1.1 (`:16-32`)
  - every "C1-C1x" reference (`:18`, `:470`, `:575`)
  - §10's privacy block (`:488-510`)
  - the lines addressed by A2-I1 to A2-I4 (`:86-112`, `:136-144`)
- **Cross-checked against:**
  - `docs/mobile/security/review-v2.md` conditions table (`:61`, `:74-77`)
  - `docs/mobile/security/review-v2-addendum2.md`
  - `docs/mobile/PRD-mobile.md:1128` (hosted URL)
  - `vite.config.ts`
- **Method note:** the reviewer had no git or diff tool, so the working-tree text was checked directly. The rest of the runbook was not re-reviewed.

**Gate effect:** step-15 upload is blocked only by A-C1 (owner fills `[DEVELOPER NAME]` and `[CONTACT EMAIL]`) and by the step-15 evidence conditions C1-C10 in review-v2.

---

## 1. Closure table

| Finding | Status | Evidence (current text) |
|---|---|---|
| A2-L1 — §1.1 C9/C10 descriptions wrong, C11 missing, "C1-C10" references | **CLOSED** | Each §1.1 description matches review-v2 in substance:<br>- C8 (`:27`) matches `review-v2.md:74`.<br>- C9 (`:28`) matches `:75`: V2-L2 evidence plus the live re-check of targetSdk, the closed-test rule and the User Data policy wording.<br>- C10 (`:29`) matches `:76`.<br>- C11 (`:30`) matches `:77` and is marked "due at step 17".<br><br>No "C1-C10" string remains anywhere in the file. The references now say C1-C11 at `:18`, `:470` and `:575`.<br><br>A C9 live re-check checkbox with the date and the targetSdk requirement is at `:495`, as addendum 2 required. |
| A2-L2 — hosted hash merged with repo hash; `Expand-Archive` on `.aab` fails | **CLOSED** | There are three separate capture lines: repo copy `:491`, hosted copy `:492`, AAB-bundled copy `:493`. The "all three equal" check is at `:494`.<br><br>The commands at `:498-510` work:<br>- `Get-FileHash` on the repo copy.<br>- `Invoke-WebRequest -OutFile`, then `Get-FileHash` on the hosted copy.<br>- `tar -xf <full bundle path> -C "$env:TEMP\aab-x" base/assets/public/privacy.html`, then `Get-FileHash`. Windows bsdtar reads zip-format `.aab` files and accepts the member-path filter. The AAB path matches §3.2.<br><br>`Expand-Archive` no longer appears. The hosted URL `https://hogy86.github.io/ahogancamp_portfolio/privacy.html` (`:492`, `:503`) matches `PRD-mobile.md:1128`, `review-v2.md:136,341` and the Pages subpath described in `vite.config.ts:15-18`. The in-AAB path `base/assets/public/privacy.html` is correct for Vite `publicDir: 'public'` with Capacitor's `assets/public` web root. |
| A2-I1 — `$profile` overwrite; OneDrive check tests only `$env:OneDrive` | **CLOSED** | `$signingDir` at `:94`. There are three `-like` checks for `$env:OneDrive`, `$env:OneDriveConsumer` and `$env:OneDriveCommercial` (`:95-97`). `-like` is case-insensitive in PowerShell, which is correct for Windows paths. |
| A2-I2 — "or `$env:USERPROFILE`" contradiction | **CLOSED** | `:106` now says only "must not point into OneDrive". `:111` says the default `~/.gradle` is fine. |
| A2-I3 — "press Enter" at a prompt that never appears | **CLOSED** | `:142`: "keytool will not ask for a key password; set `keyPassword` equal to `storePassword`." |
| A2-I4 — wrong step cross-reference | **CLOSED** | `:144` says "see step 7 below". Step 7 is the password-manager backup (`:153`). |

---

## 2. Findings still open

None.

---

## 3. Informational (fix whenever convenient; none block A-C2 or any gate)

- **A3-I1** — Runbook `:20-30`: §1.1 marks every condition with a pre-filled "✓".
  - A reader could take these as already met, when they are items to verify. `:32` ("If any condition is OPEN, stop") mitigates this.
  - Suggest `- [ ]` checkboxes, matching §10.
- **A3-I2** — Runbook `:470`: the pre-build line "All conditions C1-C11 from review-v2 complete: Yes / No" can't truthfully be answered "Yes" at step 15. `review-v2.md:61` makes C11 a step-17 condition.
  - Suggest: "C1-C10 complete: Yes / No. C11 acknowledged (re-checked at step 17): Yes / No".
  - Also, the §10 heading at `:488`, "Privacy policy (C8, C9, C10, C11)", groups conditions that aren't about privacy. Suggest "Privacy policy (C8) and live policy re-check (C9)".
- **A3-I3** — Runbook `:495` and `:514`: the §10 checklist captures only part of the C9 and C10 evidence.
  - C9 (`:495`) records the date and the targetSdk requirement. It has no fields for the other two parts of the C9 re-check:
    - the closed-test rule found (testers and days)
    - the User Data policy's in-app privacy-policy wording
  - C10 (`:514`) records only the Data safety answers. It does not cover the content rating (§6.3) or target audience (§6.4/§6.5).
  - Suggest adding those fields, so `submission-checklist.md` is complete without cross-referencing §1.1.
- **A3-I4** — Runbook `:497-510`: some notes would prevent false mismatches when the three hashes are compared.
  - The block has no `cd`. After §3.2 the shell may still be in `android\`. Suggest starting the block with `cd C:\Users\<owner>\dev-build\shield-vs-robots`.
  - With that `cd`, the "repo copy" is really the mirror copy. §3.1's parity check makes the two identical, but that is worth one sentence.
  - The repository has no `.gitattributes`. `public/privacy.html` currently has LF line endings (0 CR bytes found). A Windows clone with `core.autocrlf=true` would produce CRLF in the repo copy and the AAB copy, while Pages serves the LF copy built by CI.
  - Suggest adding "if the hashes differ, check line endings first". Or, better, suggest the owning writer add `public/privacy.html text eol=lf` to a `.gitattributes`.
  - A-C1's placeholder edit changes the hash, so compute all three hashes after A-C1 and after the Pages deploy of that commit. The deploy detail is new here; the "after A-C1" part was already said in addendum 2.

---

## 4. Open conditions carried

| # | Condition | Owner | Due |
|---|---|---|---|
| A-C1 | **OPEN (owner), unchanged from addendum 2.** OQ-M11 is recorded (C1). Then `[DEVELOPER NAME]` and `[CONTACT EMAIL]` in `public/privacy.html` are replaced with the owner's chosen values. The email is plain text, with no `mailto:`. The same email is used in IARC (§6.3). If only those two tokens change, no further security review is needed. | mobile-product-manager (owner) → mobile-technical-writer | Before step 15 |
| A-C2 | **CLOSED** by this addendum. | — | — |
| C8 (rest) | At step 15, record in `submission-checklist.md` (runbook §10 `:490-494`): the hosted URL loads over HTTPS, and all three SHA-256 values match (repo, hosted, AAB). Compute them after A-C1 and after that commit is live on Pages. | mobile-release-engineer | Before step 15 upload |

Everything else in review-v2 (C1-C7, C9-C11, the §6 answers) and in addenda 1-2 is unchanged by this addendum.
