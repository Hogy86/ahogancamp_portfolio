# Security & Play Policy Review — Pass 2, Addendum 2 (A-C2 re-check)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Result: FAIL** (0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW open, 5 INFO). Nine of the ten addendum-1 findings are closed. A-L1 is only partly fixed, so condition A-C2 stays OPEN. The remaining fixes are runbook-only. `public/privacy.html` needs no further change except the A-C1 placeholders.

- **Date:** 2026-09-30
- **Reviewer:** mobile-security-compliance-reviewer
- **Scope (files only):** the lines of `public/privacy.html` and `docs/mobile/release-runbook.md` that address addendum-1 findings A-M1, A-M2, A-L1 to A-L5 and A-I1 to A-I3. Cross-checked against:
  - `docs/mobile/security/review-v2.md` conditions table (`:74-77`)
  - `docs/mobile/security/review-v2-addendum1.md`
- **Method note:** the reviewer had no git or diff tool. Each finding was checked against the current working-tree text of both files, at the line numbers below. The committed versions were not diffed. Anything in these files that addendum 1 did not cite was not re-reviewed.
- **Not in scope:** everything else. review-v2 conditions C1-C11 and the §6 answers are unchanged.

**Gate effect:** step 14 is unaffected. Step-15 upload stays blocked until:
- A-C2 closes (fix A2-L1 and A2-L2 below, then re-check those lines only)
- A-C1 closes (owner fills the placeholders)

---

## 1. Closure table

| Finding | Status | Evidence (current text) |
|---|---|---|
| A-M1 — internal placeholder block and personal email on public page | **CLOSED** | `privacy.html`: the "Placeholders to be filled…" block is gone. No email address or pipeline reference appears anywhere in the file. Only `[DEVELOPER NAME]` (`:112`) and `[CONTACT EMAIL]` (`:113`) remain, as A-C1 expects. `docs/mobile/release/submission-checklist.md` does not exist yet (it is created at step 15), so the placeholders are tracked by A-C1 here until then. |
| A-M2 — backslash paths in `.properties` | **CLOSED** | Forward slashes at runbook `:166`, `:175`, `:202`. The reason is explained at `:181`. The password rule is at `:135`: "letters and digits only (no \)". The troubleshooting entry is at `:527-536`. The Option A env var (`:192`) mixes separators, which is safe because env vars are not escape-processed. |
| A-L1 — privacy-policy rules missing from runbook | **PARTIAL → A2-L1, A2-L2** | The §9 material-change rule is present (`:443`, `:451`). C8-C10 are added to §1.1 (`:27-29`), but with the wrong descriptions and without C11. §10 (`:485-496`) is missing the separate hosted-file hash line, and its AAB extraction command fails. See §2. |
| A-L2 — inline `style=""`, text < 16 px | **CLOSED** | No `style=` attributes remain. The `hr` rule (`:49-53`) and `.footer-meta` (`:54-57`, 16 px) are in the `<style>` element. The footer uses `class="footer-meta"` (`:122`). Still true: no `<script`, no `on*=`, no `<a>`, no external resources. |
| A-L3 — OneDrive / GRADLE_USER_HOME checks; "recommended for CI" | **CLOSED** (nits in A2-I1, A2-I2) | OneDrive check `:81-99`. GRADLE_USER_HOME check `:101-109`. Option A now says "recommended for one-off local builds" (`:189`). "CI never signs (M-ADR-0011 decision 5)" is at `:205`. |
| A-L4 — "no data from the network" wording; retention and deletion | **CLOSED** | `privacy.html:67-68` matches the required wording. The retention, deletion and not-in-backups statement is at `:81-86`. This is consistent with review-v2 §6.1 "No data collected / No data shared". |
| A-L5 — PKCS12 prompt transcript | **CLOSED** (nit in A2-I3) | Only the two store-password prompts are shown (`:133-137`). "key password equals the store password" is at `:139`. The same value for both is at `:167/169` and `:153`. |
| A-I1 — `.gitignore` statement | **CLOSED** | `:183` |
| A-I2 — guard overstated as a scan | **CLOSED** | `:58` now describes the configured-path check accurately. |
| A-I3 — PowerShell-incompatible commands | **CLOSED** | `:272` `Get-Item … .Length`; `:334` `adb logcat -d \| Select-String …`; `:341` full AAB path. |

---

## 2. Findings still open (block A-C2)

### [LOW] A2-L1 — C8/C9 evidence completeness — `docs/mobile/release-runbook.md:18-29`, `:467`, `:561` — The §1.1 descriptions of C9 and C10 do not match review-v2, and C11 is missing
- **Issue:**
  - The runbook defines C9 as "Privacy policy deployment confirmed" and C10 as "Privacy policy inclusion in AAB verified".
  - In `review-v2.md:75-76`, C9 is actually:
    - release-artifact evidence (V2-L2)
    - a **live** re-check of the current targetSdk requirement
    - the personal-account closed-test rule
    - the in-app privacy-policy wording in the User Data policy
  - C10 is actually the **Play Console answers**, transcribed from §6 into `submission-checklist.md` and entered in the Console exactly as drafted.
  - C11 (`review-v2.md:77`: no promotion of a changed build to production without CI and a C9 re-run) is left out. `:18`, `:467` and `:561` all say "C1-C10".
- **Why it matters:** a release engineer following §1.1 would tick C9 and C10 without doing the live targetSdk and closed-test re-check or the Console transcription. These are the checks most likely to prevent a Play rejection.
- **Required fix:**
  - Replace the §1.1 descriptions with review-v2's text:
    - C8: privacy text final; hosted URL loads over HTTPS; all three hashes equal
    - C9: V2-L2 release evidence plus the live re-check of targetSdk, the closed-test rule and the User Data policy wording
    - C10: Play Console answers transcribed and entered exactly
    - C11: no changed build promoted to production without CI and a C9 re-run (due at step 17)
  - Change "C1-C10" to "C1-C11" at `:18`, `:467` and `:561`.
  - Add a §10 checkbox for the C9 live policy re-check, with the date checked and the targetSdk requirement found.

### [LOW] A2-L2 — C8 hash evidence — `docs/mobile/release-runbook.md:487-496` — The hosted-file hash is not captured separately, and the AAB extraction command fails
- **Issue:**
  1. `:488`, "Hosted SHA-256 (from `public/privacy.html` in repo)", merges two of the three hashes C8 asks for. There is no line or command for hashing the file actually served at the hosted URL. Yet `:490` asks whether "all three" are equal. That is the exact drift C8 exists to catch: GitHub Pages serving an older or newer copy.
  2. `Expand-Archive app-release.aab …` (`:494`) fails. The Microsoft.PowerShell.Archive module rejects any extension other than `.zip`: "'.aab' is not a supported archive file format". The relative path `app-release.aab` also doesn't match the working directory used elsewhere (`android/app/build/outputs/bundle/release/app-release.aab`).
- **Required fix:** split `:488` into two lines and give working commands:
  ```powershell
  # Repo copy
  (Get-FileHash public/privacy.html -Algorithm SHA256).Hash
  # Hosted copy (C8: must load over HTTPS)
  Invoke-WebRequest -Uri "<hosted privacy URL>" -OutFile "$env:TEMP\privacy-hosted.html"
  (Get-FileHash "$env:TEMP\privacy-hosted.html" -Algorithm SHA256).Hash
  # AAB copy (tar ships with Windows 10+; Expand-Archive rejects .aab)
  mkdir "$env:TEMP\aab-x" -Force | Out-Null
  tar -xf android/app/build/outputs/bundle/release/app-release.aab -C "$env:TEMP\aab-x" base/assets/public/privacy.html
  (Get-FileHash "$env:TEMP\aab-x\base\assets\public\privacy.html" -Algorithm SHA256).Hash
  ```
  - Keep `:490` as "all three equal".
  - Note that A-C1's placeholder edit changes the hash, so compute all three after A-C1.
  - The alternative is to copy the file to `app-release.zip` before `Expand-Archive`.

---

## 3. Informational (fix whenever convenient; they do not block A-C2)

- **A2-I1** — Runbook `:93-94`:
  - `$profile = …` overwrites PowerShell's automatic `$PROFILE` variable for the session. Rename it to `$signingDir`.
  - The automated check tests only `$env:OneDrive`. Extend it to `$env:OneDriveConsumer` and `$env:OneDriveCommercial`, as the text above it already says.
- **A2-I2** — Runbook `:107` says GRADLE_USER_HOME must not be "under OneDrive or `$env:USERPROFILE`". The next line (`:108`) says the default under the profile is fine. Only OneDrive matters (M-ADR-0011 decision 2), so drop "or `$env:USERPROFILE`".
- **A2-I3** — Runbook `:139`, "just press Enter after the store password prompts": with the PKCS12 default no key-password prompt appears, so there is nothing to press Enter at. Suggested text: "keytool will not ask for a key password; set `keyPassword` equal to `storePassword`."
- **A2-I4** — Runbook `:141`, "(see step 5 below)": the password-manager backup is now step 7.
- **A2-I5** — `privacy.html:74`: the "such as" list still omits `bossWarningStarted`. It remains acceptable, as in addendum 1 §1.2. No action needed.

---

## 4. Open conditions carried

| # | Condition | Owner | Due |
|---|---|---|---|
| A-C1 | **OPEN (owner).** OQ-M11 is recorded (C1). Then `[DEVELOPER NAME]` (`privacy.html:112`) and `[CONTACT EMAIL]` (`:113`) are replaced with the owner's chosen values. The email is plain text, with no `mailto:`. The same email is used in IARC (§6.3). If only those two tokens change, no further security review is needed. | mobile-product-manager (owner) → mobile-technical-writer | Before step 15 |
| A-C2 | **OPEN.** Fix A2-L1 and A2-L2 in `docs/mobile/release-runbook.md`. The reviewer re-checks only those lines (§1.1, the C1-C11 references, and §10's privacy block). A-M1, A-M2, A-L2 to A-L5 and A-I1 to A-I3 are closed and will not be re-opened unless their lines change. | mobile-technical-writer | Before step 15 |
| C8 (rest) | At step 15, record in `submission-checklist.md`: the hosted URL loads over HTTPS, and all three SHA-256 values match (hosted, repo, AAB). Compute them after A-C1. | mobile-release-engineer | Before step 15 upload |

Everything else in review-v2 (C1-C7, C9-C11, §6 answers) is unchanged by this addendum.
