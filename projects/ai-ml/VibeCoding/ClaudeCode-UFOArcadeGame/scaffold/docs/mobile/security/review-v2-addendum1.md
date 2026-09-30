# Security & Play Policy Review — Pass 2, Addendum 1 (C8 delta check)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Result: FAIL** (0 CRITICAL, 0 HIGH, 2 MEDIUM, 5 LOW, 3 INFO). Doc-only fixes. Route to mobile-technical-writer; a re-check of the changed lines closes this addendum.

- **Date:** 2026-09-29
- **Reviewer:** mobile-security-compliance-reviewer
- **Scope (files only):**
  - `public/privacy.html` (step-13 text), checked against:
    - review-v2 V2-L1
    - review-v2 §6.1 (Data safety)
    - mobile-architecture.md §8.7 content rules
    - the code it describes: `src/persistence/bestScore.ts`, `src/persistence/safeStorage.ts`, `src/platform/android/settings.ts`, `src/instrumentation/Instrumentation.ts`, `src/main.ts`
  - `docs/mobile/release-runbook.md` §2 (signing) and the signing troubleshooting section, checked against `docs/mobile/architecture/adr/0011-release-signing-contract.md` and `android/app/build.gradle`.
- **Not in scope:** anything else in the tree. Findings and conditions in review-v2 other than C8 are unchanged.

**Why FAIL and not PASS-with-conditions:** C8 asks for a delta check of the *final* privacy text.
- The committed file ships internal release-tracking content on a public page, including the owner's personal email (A-M1). That is not final text.
- The runbook's signing steps, followed exactly, cannot produce a signed build. The error message they trigger then points the release engineer the wrong way (A-M2).

**Gate effect:** step 14 (UAT) may proceed. **C8 stays OPEN**, and step-15 upload stays blocked until:
- A-M1, A-M2 and A-L1 through A-L3 are fixed and re-checked
- OQ-M11 fills the two placeholders (condition A-C1)

---

## 1. What passed

### 1.1 privacy.html vs V2-L1

| V2-L1 item | Result | Evidence |
|---|---|---|
| Names the app; covers the "Shield vs Robots Android app" | PASS | `privacy.html:52,56-58,108` |
| No-collection statement scoped to the app; one GitHub Pages hosting sentence for the website | PASS | `:67-71` (app), `:73-79` (website), `:88-93` (GitHub Pages may log IP under GitHub's own statement) |
| Developer name and contact email | **OPEN, expected** (OQ-M11 → condition A-C1) | `:97-98` placeholders `[DEVELOPER NAME]`, `[CONTACT EMAIL]` |
| Hosted URL live and hashes match | **OPEN, step 15** (C8 second half) | Not yet on master |

### 1.2 privacy.html vs the code

| Statement | Result | Evidence |
|---|---|---|
| Best score stored locally | TRUE | `bestScore.ts:12,69` (`vvs:best` via `safeStorage.ts:27-34`) |
| Control layout and help-seen settings stored locally, Android only | TRUE | `settings.ts:9,13-14,49-51`. Called only from `overlays.ts:52,294,302`. `AndroidPlatform` is imported only when `import.meta.env.MODE === 'android'` (`main.ts:31-36`). So "Settings ... are **not** stored by the website" (`privacy.html:77`) is correct. |
| Anonymous gameplay counters | TRUE | `Instrumentation.ts:10-19,57-60`. Integer counts keyed by event name (plus `levelReached_N`). No identifiers. The "such as" list (`privacy.html:65`) omits `bossWarningStarted`; "such as" covers it. |
| Never sent anywhere; no internet | TRUE | No `fetch`, XHR, WebSocket or `sendBeacon` in non-test `src/`. Only `localStorage` is used (grep). The merged release manifest has no INTERNET permission (review-v2 §4). |
| No ads, analytics or crash-reporting SDKs | TRUE | review-v2 §4 "Plugins and SDKs". The dormant google-services hook is now fail-closed (`android/app/build.gradle:148-152`, V2-L4 fixed). |
| Consistent with §6.1 "No data collected / No data shared" | PASS (the wording nit is in A-L4) | On-device-only processing is not "collection" under Play's definition. |

### 1.3 privacy.html vs §8.7 content rules

| Rule | Result |
|---|---|
| Static HTML, `lang="en"`, `meta charset`, `meta viewport` | PASS (`:17,19,20`) |
| No `<script>`, no event-handler attributes | PASS (no `<script`, no `on*=` anywhere) |
| No external resources (no remote CSS, fonts or images) | PASS (no `src=`, `<link>` or `url(`; system font stack only) |
| No outbound `<a href>` | PASS (no `<a>` elements) |
| "Inline `<style>` only" | **Deviation → A-L2** (four `style=""` attributes) |
| Body ≥ 16 px | **Deviation → A-L2** (14 px and 12 px text) |

### 1.4 Runbook signing sections vs M-ADR-0011 and build.gradle

| ADR requirement | Result | Evidence |
|---|---|---|
| Key and `signing.properties` in `%USERPROFILE%\.android-signing\vvs\`, outside the repo and OneDrive | PASS | Runbook `:50-62,123-129` |
| Owner-only NTFS ACL | PASS | `:65-76` (`/inheritance:r /grant:r <user>:(OI)(CI)F`, with a verify step). A file created later inherits the owner-only ACE. |
| Passwords prompted, never on the command line | PASS | `:78-88`: no `-storepass`/`-keypass`; keytool prompts |
| Path from `VVS_SIGNING_PROPERTIES` or the `vvsSigningProperties` user Gradle property; the property holds a path only | PASS (wording issue in A-L3; file-format bug in A-M2) | `:149-169`; matches `build.gradle:9-14` |
| Backup is a password manager (keystore attachment plus both passwords), not OneDrive, Google Drive or email | PASS | `:116-121` |
| Fail-closed, never falls back to the debug key | PASS (described accurately) | `:465-474` vs `build.gradle:98-100,108-121` |

---

## 2. Findings

### [MEDIUM] A-M1 — Privacy policy / Play User Data policy — `public/privacy.html:112-118` — The public policy page contains internal release-tracking text and the owner's personal email
- **Issue:**
  - Lines 112-118 show readers a block headed "Placeholders to be filled before release (track under security-review-v2.md C8)".
  - It contains an example that is the owner's personal email address.
- **Why it matters:**
  1. This one file is both the hosted policy (deployed by `deploy-pages.yml` on every master merge) and the in-app policy.
  2. Merging as-is publishes the owner's personal address on a public page, and inside the AAB if built. OQ-M11 is exactly the owner's choice of public contact email, and it has not been decided. The owner may want a dedicated address.
  3. Internal pipeline references in a user-facing legal page make the policy look unfinished to Play reviewers.
  4. Any later edit to remove the block changes the file, and so changes the hash C8 compares.
- **Required fix:**
  - Delete lines 112-118 (the `<p>` and `<ul>` placeholder note) from `privacy.html`.
  - Track the two placeholders in `docs/mobile/release/submission-checklist.md` under C1/C8 instead.
  - Keep only `[DEVELOPER NAME]` and `[CONTACT EMAIL]` at lines 97-98 until OQ-M11 is recorded.
  - Do not publish any email the owner has not chosen.

### [MEDIUM] A-M2 — Release signing contract (M-ADR-0011 decisions 1-2) — `docs/mobile/release-runbook.md:132,141,166` — Windows backslash paths in `.properties` files are corrupted by Java `Properties.load`, so following the runbook guarantees a failed build with a misleading error
- **Issue:**
  1. `signing.properties` is read with `Properties.load` (`android/app/build.gradle:43-44`). Gradle reads `%USERPROFILE%\.gradle\gradle.properties` the same way.
  2. In that format, `\` is an escape character, and a backslash before a non-escape character is silently dropped.
  3. So `storeFile=C:\Users\aaron\.android-signing\vvs\shield-vs-robots-upload.jks` (runbook `:141`) loads as `C:Usersaaron.android-signingvvsshield-vs-robots-upload.jks`.
  4. `file(storeFile)` (`build.gradle:57`) resolves that relative to `app/` inside the mirror.
  5. The guard then rejects it with "keystore (storeFile) path is inside the repo/scaffold/OneDrive". That error is wrong, and it invites the engineer to move the keystore or edit the guard.
  6. Option B, `vvsSigningProperties=C:\Users\...` (`:166`), fails the same way ("signing.properties not found at C:Users...").
  7. A password containing `\` would be silently altered too. The runbook's "NO shell metacharacters" hint (`:102`) is the wrong constraint: prompts never pass through the shell.
- **Security effect:** none. The build fails closed, which is why this is not HIGH. It is still a certain release blocker, and the troubleshooting section (`:465-474`) does not mention the cause.
- **Required fix:**
  1. In `:132`, `:141` and `:166`, use forward slashes: `storeFile=C:/Users/<user>/.android-signing/vvs/shield-vs-robots-upload.jks` and `vvsSigningProperties=C:/Users/<user>/.android-signing/vvs/signing.properties`. Doubled backslashes are the alternative.
  2. Add one sentence explaining why.
  3. Replace "NO shell metacharacters" with: "letters and digits only (no `\`); a `\` in a .properties value is silently changed".
  4. Add a troubleshooting bullet: "Error says the keystore is inside the repo, but it isn't → check for single backslashes in `signing.properties`."
  5. Option A (the env var) is not affected, because environment variables are not escape-processed. The runbook may note this.

### [LOW] A-L1 — §8.7 "Same text as hosted" / C8 — `docs/mobile/release-runbook.md` (§1.1 `:18-26`, §9 `:403-417`, §10 `:421-459`) — The runbook omits the privacy-policy rules the architecture assigns to it
- **Issue:**
  - §8.7 (`mobile-architecture.md:1834-1838`) says: "a material change to `privacy.html` requires an Android release. mobile-technical-writer records this rule in the release runbook." §9 (version lag) does not say this.
  - §1.1 lists only C1-C7.
  - §10 has no lines for C8's evidence: the hosted URL loading over HTTPS, and SHA-256 of the hosted file, `public/privacy.html`, and the `privacy.html` inside the AAB (`base/assets/public/privacy.html`).
- **Required fix:**
  - Add the material-change rule to §9.
  - Add C8, C9 and C10 to §1.1.
  - Add four §10 checklist lines: hosted URL, hosted SHA-256, repo SHA-256, AAB SHA-256, with "all three equal". Include a command: extract the file from the AAB with `Expand-Archive` or `tar -xf`, then run `Get-FileHash`.

### [LOW] A-L2 — §8.7 content rules — `public/privacy.html:105,107,112,115` — Inline `style=""` attributes, and body text below 16 px
- **Issue:**
  - §8.7 permits "inline `<style>` only".
  - Lines 105, 107, 112 and 115 use `style` attributes.
  - Line 107 sets 14 px; lines 112 and 115 set 12 px. §8.7 requires ≥ 16 px body text.
  - There is no security effect: the frame is `sandbox=""` and there is no script.
- **Required fix:**
  - Move these styles into the `<style>` element as classes (for example `.footer`, and a rule for `hr`).
  - Keep the footer ≥ 16 px, or make it an `<h2>`-less `<p>` at the body size.
  - Lines 112/115 disappear with A-M1.

### [LOW] A-L3 — M-ADR-0011 decisions 1, 2, 5 — `docs/mobile/release-runbook.md:54-55,153,161-169` — Missing ADR checks and one contradiction
- **Issue:**
  1. Decision 1 requires the release engineer to confirm in OneDrive settings that the profile root is not synced (Known Folder Move covers Desktop, Documents and Pictures only). The runbook has no such step.
  2. Decision 2 forbids pointing `GRADLE_USER_HOME` into OneDrive. Not mentioned.
  3. `:153` calls Option A "recommended for CI". Decisions 5 and 6 say CI never signs, and GitHub Actions secrets are a forbidden place for signing values.
- **Required fix:**
  1. Add a verify step: `$env:OneDrive`, `$env:OneDriveConsumer` and `$env:OneDriveCommercial` are not prefixes of `$env:USERPROFILE\.android-signing`, and OneDrive → Settings → Manage backup shows only Desktop, Documents and Pictures.
  2. Add a check that `$env:GRADLE_USER_HOME` is empty or outside OneDrive.
  3. Change `:153` to "recommended for one-off local builds. CI never signs (M-ADR-0011 decision 5)."

### [LOW] A-L4 — Data safety consistency / Play User Data policy — `public/privacy.html:58,70` — Awkward "no data from the network" wording, and no retention or deletion statement
- **Issue:**
  - "collects no data from the network" (`:58`) could be read as "collects data, just not over the network". The §6.1 label is "No data collected".
  - The policy never says how long local data is kept or how to delete it. Play's User Data policy expects the privacy policy to state retention and deletion.
  - "requires no ... permissions" (`:70`) is fine for users. The only manifest entry is the app-private, signature-level `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`.
- **Required fix:**
  - `:58` → "The Shield vs Robots Android app does not collect or share any data. It stores only the following on your device, in the app's private storage:"
  - Add: "This information stays until you uninstall the app or clear its storage (Android Settings → Apps → Shield vs Robots → Storage → Clear storage). It is not included in device backups. On the website, clearing this site's data in your browser removes it."
  - The "not included in device backups" wording is backed by `allowBackup="false"` plus `data_extraction_rules.xml`.

### [LOW] A-L5 — keytool behaviour (M-ADR-0011 decision 1) — `docs/mobile/release-runbook.md:100-105,133-135` — Wrong prompt transcript for the JDK 21 default PKCS12 keystore
- **Issue:**
  - JDK 21 `keytool` creates PKCS12 by default. It does not prompt for a separate key password; the key password equals the store password.
  - The shown "Enter key password for <alias>" prompt will not appear.
  - An engineer who stores a different `keyPassword` in `signing.properties` gets a signing failure.
- **Required fix:**
  - Show only the two store-password prompts.
  - State that `keyPassword` must equal `storePassword` for this keystore.
  - Keep both fields in the password-manager entry.

### [INFO] A-I1 — `docs/mobile/release-runbook.md:147`
- "This file is NOT in `.gitignore`" is inaccurate: `scaffold/.gitignore:29` covers `signing.properties` as a backstop.
- Suggested text: "`.gitignore` covers it as a backstop, but it must never be placed in the repo or any OneDrive folder."

### [INFO] A-I2 — `docs/mobile/release-runbook.md:55`
- "refuses to build if any key material is found under the repo or OneDrive" overstates the guard.
- It rejects the *configured* `signing.properties` or `storeFile` path if that path is under the project root, the git top-level or any `onedrive` path (`build.gradle:25-33`). It does not scan for key material. Reword so nobody relies on a scan that doesn't exist.

### [INFO] A-I3 — Outside the signing scope, but affects C9 evidence — `docs/mobile/release-runbook.md:236,298,305`
- These commands fail in PowerShell as written:
  - `ls -la`: use `Get-Item <path> | Select Length`
  - `adb logcat | grep`: use `adb logcat -d | Select-String -Pattern 'net::ERR_|FATAL EXCEPTION|ClassNotFoundException'`
  - `dump manifest --bundle=app-release.aab`: the relative path is wrong from the mirror root; use `android/app/build/outputs/bundle/release/app-release.aab`
- Fix these before step 15 so the V2-L2 / C9 evidence can actually be produced.

---

## 3. Open conditions carried

| # | Condition | Owner | Due |
|---|---|---|---|
| A-C1 | OQ-M11 recorded (C1), then `[DEVELOPER NAME]` and `[CONTACT EMAIL]` in `privacy.html:97-98` replaced with the owner's chosen values. The contact email appears as plain text (no `mailto:` link, per §8.7). The same email is used in the IARC questionnaire (§6.3). This text change needs no further security review if it changes nothing else in the file. | mobile-product-manager (owner) → mobile-technical-writer | Before step 15 |
| A-C2 | A-M1, A-M2, A-L1 to A-L5 fixed. The reviewer re-checks only the changed lines of `public/privacy.html` and `docs/mobile/release-runbook.md`. | mobile-technical-writer | Before step 15 |
| C8 (rest) | At step 15, record in `submission-checklist.md`: the hosted URL loads over HTTPS, and the SHA-256 is equal for the hosted file, `public/privacy.html` and the AAB copy. Recompute after A-C1: any placeholder edit changes the hash. | mobile-release-engineer | Before step 15 upload |

Everything else in review-v2 (C1-C7, C9-C11, §6 answers) is unchanged by this addendum.
