# Mobile Security & Play Policy Review — Pass 1b (Architecture re-review)

**Stage:** Mobile Pipeline Step 5 (re-run) — mobile-security-compliance-reviewer
**Date:** 2026-09-25
**Reviewed (files only, no writer explanations):**
- docs/mobile/architecture/mobile-architecture.md (v1.1, incl. §16 amendment log A1-A7)
- docs/mobile/architecture/adr/0009-in-app-privacy-policy.md
- docs/mobile/architecture/adr/0010-no-internet-verification-and-fallback.md
- docs/mobile/architecture/adr/0011-release-signing-contract.md
- docs/mobile/architecture/adr/0012-ci-least-privilege-and-release-manifest-gate.md
- docs/mobile/PRD-mobile.md (Draft v1.2: M11.4a, M5 table, §7 OQ-S1/OQ-A1, §9)
- Baseline: docs/mobile/security/review-v1.md (FAIL: H1, M1-M5, L1-L6)
**Checklists applied:** security-compliance-checklist, play-policy-checklist
**Verification limits:** no web access and no emulator in this session. Play policy
wording and AndroidX manifest-merge behavior are from my own knowledge. Items that need
live confirmation are marked.

> Transcription note: the reviewer is read-only by design, so the main session wrote this
> file verbatim from the reviewer's returned content.

## Verdict: PASS (conditional)

No CRITICAL or HIGH findings are open. The review-v1 findings stand as follows:
- H1 and M1-M4 are **closed** at the architecture level.
- L1-L5 are **closed as binding step-7 constraints**. They are re-checked at step 8 and in
  pass 2.
- L6 is **accepted** and carried to step 15.
- M5 is **open as an owner decision** (OQ-S1). It is Condition C1 below.

The revision adds one new MEDIUM (N1) and three new LOWs (N2-N4), plus advance notes (N5)
for a possible pass 1c. None of them blocks the gate.

**Gate:** mobile-junior-developer (step 7) may start once **C1** is met.

### Conditions on this PASS

| # | Condition | Owner | Due |
|---|---|---|---|
| C1 | The owner's OQ-S1 decision is recorded in PRD-mobile §7 with a date. The main session does not start step 7 until the record exists. If the owner chooses **(a) keep**, the binding art/listing constraints in OQ-S1 (a) become acceptance criteria, and pass 2 checks them. If the owner chooses **(b) rename**, the new name gets the same IP check (Marvel/DC catalogs plus Play name collisions) before it is used. The applicationId is re-confirmed under OQ-M11. The rename runs through both pipelines' gates per CLAUDE.md §One codebase. It needs **no** security re-review unless the architecture changes beyond the two-line label/appId edit (§7.1). | mobile-product-manager (owner) | Before step 7 starts; final before step 15 |
| C2 | N1 is fixed by an architecture amendment: rule R5 allows the non-exported AndroidX Startup provider. | mobile-solution-architect | Before `check-android-manifest.mjs` is committed (preferably before step 7 starts) |
| C3 | N2 and N3 are added to the §14.1 binding step-7 constraints. mobile-lead-developer checks them at step 8. | mobile-junior-developer; mobile-lead-developer | Step 8 |

**Why OQ-S1 is a condition and not a blocker:**
- M5 is MEDIUM. The checklist blocks PASS only on CRITICAL or HIGH.
- Nothing built in step 7 makes the name permanent before step 15. The label and
  applicationId are a two-line edit until the first upload (§7.1 row and note, lines
  601-612). The Java namespace is internal and may keep "sentinels".
- The permanent part, the applicationId, is protected by OQ-M11's "before step 15" deadline.
- The caller's instruction requires the decision to be recorded before step 7. C1 enforces
  that, so the owner's choice is known before any name-bearing assets or strings are built.

---

## Disposition of review-v1 findings

### H1 — In-app privacy policy: **CLOSED (design)**
- **PRD:** M11.4a (PRD-mobile lines 693-720) and the M5 back-table row (line 513) state the
  requirement correctly:
  - ≤ 2 taps from the title; not reachable mid-run
  - same text as hosted, from a bundled copy
  - works in airplane mode; no request, no plugin, no external app
  - back/Close returns to the opener
  - ≥ 12 sp text that scrolls; 48 dp tap targets
- **Architecture:** §8.7 (lines 949-999) and M-ADR-0009 meet every point:
  - one shared file, `public/privacy.html`
  - shown in a `PrivacyOverlay` iframe with an empty `sandbox=""` and `no-referrer`
  - fixed source path `'/privacy.html'`
  - Title → Settings → Privacy (2 taps)
  - back rule 1 closes the topmost overlay (§8.3)
  - DOM built with `textContent` only
  - the iframe is created on open and removed on close
  - content rules: no script, no external resources, no outbound `<a href>`
  - `@capacitor/browser` and `app-launcher` are explicitly disallowed (§2.1 A1)
  - e2e coverage is added in §10.1
  - drift control (MR14): an Android release is required for any material change, and
    pass 2 compares SHA-256 hashes
- **Positive side effect, to preserve:** Capacitor's local server injects its bridge script
  into served HTML. The empty sandbox stops that script from running in the policy frame.
  **Pass 2 check:** the `sandbox` attribute stays empty. It must never gain `allow-scripts`
  (and never `allow-scripts` together with `allow-same-origin`), or the frame would gain
  bridge access.
- **Live check still owed at step 15:** re-confirm the User Data policy's in-app
  requirement wording in the Policy Center (unchanged from v1).

### M1 — No-INTERNET assumption: **CLOSED (design)**
- §7.3 A2 downgrades "works without INTERNET" to a hypothesis.
- §7.3.1 (lines 701-737) and M-ADR-0010 add:
  - a concrete cold-start matrix on API 36 and API 24, plus a mid image if the API 24
    WebView is < 80
  - the errorPath forced through a local, uncommitted `minWebViewVersion: 999` build
  - the privacy iframe included in the verification
  - a logcat check for `net::ERR_*`
  - evidence recorded before step 8
  - a device-matrix row for every release candidate
- The fallback (keep INTERNET plus an android-mode CSP with `connect-src 'none'`) is
  pre-designed. It is correctly gated on pass 1c, and the junior developer is told to stop,
  not self-apply it (§14 item 6).
- See N4 (release-artifact smoke) and N5 (pass 1c inputs).

### M2 — Signing contract / OneDrive: **CLOSED (design)**
§7.5 (lines 762-829), M-ADR-0011 and §3 A3 cover every v1 requirement:
- key material lives in `C:\Users\aaron\.android-signing\vvs\`, outside the repo and
  OneDrive, with an owner-only ACL
- the Gradle build gets only a path to it (env var or the user-level `gradle.properties`)
- a path guard rejects the scaffold root, the OneDrive env paths and any `OneDrive*` path
  segment
- the release build fails closed through `taskGraph.whenReady`, and the release build
  type never references `signingConfigs.debug`
- CI may build only unsigned releases
- the places signing values may never appear are listed
- the extended ignore list lands before `cap add` (§14 item 3a)
- CI secret-check rules S1-S5 run first in the `build` job

Side note: the fail-closed rule also blocks Android Studio's "Generate Signed Bundle"
wizard. That wizard injects `android.injected.signing.*`, often with passwords as
command-line properties. Blocking it is correct. The release runbook should say "build from
the command line only". See N3.

### M3 — CI token scope: **CLOSED (design)**
§10.3 (lines 1179-1230) and M-ADR-0012 decisions 1-3 specify:
- top-level `contents: read`; `pages: write` and `id-token: write` only on `deploy`
- `persist-credentials: false` on every non-deploy checkout
- `pull_request` only, never `pull_request_target`, and `deploy` is skipped on PRs
- split concurrency, so a PR run can never cancel a master deploy
- `npm audit --omit=dev --audit-level=high` right after `npm ci`

### M4 — Release-variant manifest check: **CLOSED (design), see N1**
`check-android-manifest.mjs` rules R1-R7 run in three places:
- on the debug APK in CI
- on the unsigned release APK in CI
- on the signed AAB at step 15, via `bundletool dump manifest`, with the output, the
  bundletool version and the SHA-256 recorded in `submission-checklist.md`; a failure
  stops the upload

R2 (not debuggable) also covers WebView remote debugging, because Capacitor enables it only
for debuggable builds. See N2 for the config-level gap.

### M5 — "Sentinels" (Marvel X-Men): **OPEN, owner decision, Condition C1**
- PRD-mobile §7 OQ-S1 (lines 1028-1064) states the issue and both options accurately,
  including the applicationId coupling. The architecture correctly takes no position
  (§7.1 note, lines 607-612).
- I agree with recommendation (a), provided its binding constraints are adopted as
  acceptance criteria.

### L1-L6
| # | Status | Where |
|---|---|---|
| L1 FileProvider | Closed (design). R5 enforces it. **R5 is over-strict: see N1.** | §7.3 A6 (lines 691-699); M-ADR-0012 dec. 5 |
| L2 Source maps | Closed: `sourcemap: mode !== 'android'`; step 8 confirms `dist-android` has no `*.map`. | §3.1 A7; §14.1 |
| L3 `server.url` / cleartext guard | Closed: `check-capacitor-config.mjs` runs after `cap sync`, and the runbook requires a fresh sync. **Scope extended by N2.** | §10.3 step 8; §14.1 L3 |
| L4 a/b/c | Closed: the test hook is read-only, frozen, gated once at boot and absent in native; no `innerHTML`-family sinks, enforced by ESLint; settings are parsed field-by-field into a fresh literal, with a `__proto__` test. | §14.1 L4a-c; §9.2 |
| L5 Pinning | Closed: exact `jsdom`; third-party actions pinned to SHAs; wrapper validation on. | §3.2; §10.3; M-ADR-0012 dec. 7 |
| L6 targetSdk 36 | Accepted: re-verified live at step 15. R7 (target == 36) must be updated together with `variables.gradle` if Play has raised the level by then. | §7.1 |

---

## New findings introduced by v1.1

### [MEDIUM] N1 — Manifest checker R5 "no `<provider>` of any kind" will fail on a normal Capacitor merged manifest
- **Where:**
  - mobile-architecture.md §10.3 R5 (line 1242) and §7.3 A6 (lines 695-699: "no `<provider>`")
  - M-ADR-0012 decision 4, R5 (lines 54-61)
- **Issue:** Capacitor's Android library depends on AndroidX AppCompat, and AppCompat
  brings in `emoji2`. `emoji2`, `lifecycle-process` and `profileinstaller` register through
  **`androidx.startup.InitializationProvider`**, which the manifest merger adds with
  `android:exported="false"`. That merge also brings `ProfileInstallReceiver`, which the
  architecture already allows. So R5 as written fails the first debug build.
  - Please confirm this against the first `cap add` merged manifest. I had no build
    environment.
- **Why it matters:** the security gate would be wrong on day one. The junior developer
  would then either:
  - loosen R5 ad hoc, which could let a FileProvider back in and reopen L1, or
  - strip `InitializationProvider` with `tools:node="remove"`, which silently disables
    baseline-profile install and emoji2 initialization

  Neither change would get a security review.
- **Required fix:** architect amendment A8 (to §7.3 A6, §10.3 R5 and M-ADR-0012). Replace
  the R5 provider clause with:
  - Every `<provider>` fails **except** `androidx.startup.InitializationProvider` with
    `android:exported="false"` and no `android:grantUriPermissions="true"`.
  - Every exported provider fails. Every provider whose class is
    `androidx.core.content.FileProvider` (or a subclass), or which has a `<grant-uri-permission>`
    or a `FILE_PROVIDER_PATHS` meta-data entry, fails. This keeps L1 closed.

  The allowlist is named in the checker source, the same way `ProfileInstallReceiver` is.
  Any other provider that appears later needs a security review.
- **Owner:** mobile-solution-architect (amendment); mobile-junior-developer (implements it
  in the checker).

### [LOW] N2 — Config guard does not cover `webContentsDebuggingEnabled` or `allowMixedContent`
- **Where:**
  - §7.2 (lines 638-642) says `webContentsDebuggingEnabled` is "left unset"
  - `check-capacitor-config.mjs` scope (§10.3 step 8; §14.1 L3, line 1361; M-ADR-0012
    dec. 6) covers only `server.url` and `server.cleartext`
- **Issue:** Setting `android.webContentsDebuggingEnabled: true` enables WebView remote
  debugging in the **release** build. That flag is a runtime setting in
  `capacitor.config.json`, not a manifest attribute, so R2 cannot see it.
  `allowMixedContent: true` is also invisible to the manifest checker.
- **Required fix (binding step-7 constraint, added to §14.1):** `check-capacitor-config.mjs`
  also fails when either `capacitor.config.ts` or the generated `capacitor.config.json` has:
  - `webContentsDebuggingEnabled: true`
  - `allowMixedContent: true`
  - `androidScheme` other than `'https'`, or `hostname` other than `'localhost'`. This
    duplicates the §9.2 unit test on the generated file, which is the one that actually
    ships.

  **Pass 2 check:** on the release build, `chrome://inspect` does not list the app's WebView.
- **Owner:** mobile-junior-developer; mobile-lead-developer checks at step 8.

### [LOW] N3 — Signing path guard and secret check are scoped to `scaffold/`, but the git repo root is higher
- **Where:**
  - §7.5.2 rule 2 (lines 786-790: "inside the `scaffold/` project root")
  - §7.5.3 (line 817: `git ls-files` "scope: the `scaffold/` directory")
  - M-ADR-0011 dec. 3
- **Issue:** The git repository is `ahogancamp_portfolio/`, three levels above `scaffold/`.
  A keystore or `signing.properties` saved elsewhere in the repo, for example the repo root,
  would pass the scaffold-root guard. It would also be outside the scaffold `.gitignore` and
  outside S1's scope. Today the `OneDrive*` path-segment rule catches it, but only because
  the repo happens to sit in OneDrive. A clone outside OneDrive would lose that protection.
- **Required fix (binding step-7 constraint):**
  - The path guard rejects any path inside the **git top-level**. Resolve it with
    `git rev-parse --show-toplevel`, or walk up to the first ancestor that contains `.git`.
    Keep the scaffold-root and OneDrive rules as well.
  - `check-no-secrets.mjs` runs `git ls-files` over the **whole repository**. The paths are
    repo-relative; the `.github/` and other project trees are small.
  - The release runbook (technical writer, step 13) says: build `bundleRelease` from the
    command line only; do not use Android Studio's "Generate Signed Bundle/APK" wizard.
- **Owner:** mobile-junior-developer; mobile-technical-writer (runbook line).

### [LOW] N4 — The no-INTERNET cold start is never run on the actual release artifact before upload
- **Where:**
  - §7.3.1 (debug build only)
  - the device-matrix row is "per release candidate" at step 10, which uses unsigned or
    debug builds
  - §7.4 (lines 758-760) allows R8 minification in release
  - §10.3 step-15 list (lines 1246-1253) is manifest-only
- **Issue:** A release-only failure, such as R8 stripping a Capacitor or GameShell class,
  or release-only resource shrinking, would show as a blank screen on the first build that
  testers install. The Play pre-launch report would catch it only after upload.
- **Required fix:** add a step 15 item (release engineer; architect adds it to the §10.3
  step-15 list):
  1. Install the signed AAB on the API 36 image and a WebView ≥ 80 image, using
     `bundletool build-apks --connected-device` then `install-apks`.
  2. Cold start and confirm the title renders and the privacy overlay opens.
  3. Record the result in `submission-checklist.md` next to the manifest output.
- **Owner:** mobile-solution-architect (list item); mobile-release-engineer (execution).

### [INFO] N5 — Inputs for pass 1c, only if the M-ADR-0010 fallback is triggered
These are not needed now. They are recorded so a pass 1c review can be quick:
- CSP does not govern top-level navigation. Capacitor's WebView client hands non-app URLs
  to an external `ACTION_VIEW` intent. Under the fallback (INTERNET kept), pass 1c will
  therefore check two things:
  - The Android shell has no navigation sinks: no `location =`, no `<a href>` to external
    origins.
  - `server.allowNavigation` is unset. N2's config guard should also reject it now, at no
    cost.
- The CSP `<meta>` covers only `index.html`. `privacy.html` and `webview-update.html` are
  static, have no script and load no resources, so their exposure is acceptable. Pass 1c
  confirms this.
- The CSP must be checked with `CapacitorHttp`/`CapacitorCookies` off. Neither is enabled
  in §7.2, and both must stay unset.

---

## Checklist disposition (delta from v1)

| Item | Result |
|---|---|
| Permissions planned | None; INTERNET removed, verification planned (M1 closed). Allowlist enforced on debug, unsigned release and the signed AAB (M4 closed). R5 correction: N1. |
| Data stored / leaves device | Unchanged from v1. The privacy overlay stores nothing (§9.2). **Good.** |
| Privacy policy | Hosted (M11.4) **and** in-app (M11.4a, §8.7). One file; SHA-256 check in pass 2. **H1 closed.** |
| Plugins allowed | Closed list unchanged; `browser` and `app-launcher` explicitly excluded. **OQ-A1 note:** if the owner pre-approves (a), `@capacitor/preferences` is acceptable from a security standpoint. It uses SharedPreferences in private storage and adds no permission or network. Condition: `data_extraction_rules` must keep excluding the `sharedpref` domain, and pass 2 re-checks the plugin list and the merged manifest. |
| Release debuggable / WebView debugging | R2 covers the manifest; N2 covers the runtime config flag. |
| Cleartext / `server.url` | R3 plus the config guard (L3 closed); N2 extends it. |
| Keystore / passwords in repo | Contract, path guard, fail-closed release, ignore-first ordering, S1-S5 (M2 closed); scope widened by N3. |
| CI | Least privilege, no `pull_request_target`, audit, SHA pins (M3, L5 closed). |
| Data safety | Still "No data collected, no data shared". Unchanged under the fallback and under OQ-A1 (a). |
| Content rating / audience | OQ-M13 still pending with the owner. **Must be decided before step 12** (pass 2). |
| IP | Plain blue circle shield, original art. **Name: OQ-S1 → C1.** |
| targetSdk | 36; live re-verify at step 15 (L6). |

## Carried to pass 2 (step 12)
- **Implementation of every closure.** The §14.1 L2-L5 constraints, plus N2 and N3.
- **Privacy iframe.** The iframe keeps `sandbox=""`.
- **Privacy policy copies.** The bundled and hosted `privacy.html` have matching SHA-256.
  The final text states "collects and shares no data" and names the app as actually titled
  after OQ-S1.
- **Evidence.**
  - The no-INTERNET evidence exists (§7.3.1).
  - The R5 allowlist matches N1 exactly.
  - `typeof window.__vvsTest === 'undefined'` in the installed app.
  - `chrome://inspect` does not show the release WebView.
- **OQ-S1 constraints.** If the owner chose (a): enemy art is not purple/magenta humanoid
  robots; no "mutant", X-Men-style iconography, red/white/blue or star motifs in the
  listing or screenshots; mobile-marketing-analyst has run the Marvel-catalog scan.
- **OQ-M13 and Play Console answers.** OQ-M13 is decided. The Data safety, content rating
  and target-audience drafts in `submission-checklist.md` match the code.

---

## Addendum 1 (2026-09-26): S1 false positive on `.env.example` templates (code-review-round1 C3)

> Transcription note: written verbatim by the main session from the reviewer's returned text.

**Trigger:** `docs/mobile/reviews/code-review-round1.md` C3. The whole-repository secret
check required by N3 (`scripts/check-no-secrets.mjs`, S1) fails on
`projects/ai-ml/VibeCoding/Cursor-UFOArcadeGame/UFO_Arcade_Game/.env.example`, a committed
template in an unrelated sibling project. Reviewed contents: TLS mode, ports, cert and key
*paths*, `ENV`, `LOG_LEVEL`, commented-out Vite flags. It contains no secret values. It
matches on its name only, so this is a false positive.

**Decision:** a narrow exemption for template files whose contents are still scanned.
Rejected: an exact-path allowlist (it stops checking the file's contents and breaks on the
next template elsewhere in the portfolio repo), and renaming or removing the file (outside
this app's scope; needs the owner; committed templates are good practice).

**Binding rule (verified by mobile-lead-developer at step 8, re-checked in pass 2):**
1. S1 skips the path failure only for tracked files whose basename is exactly
   `.env.example`, `.env.sample` or `.env.template` (case-sensitive; a named constant in the
   script, e.g. `S1_TEMPLATE_BASENAMES`, checked with `path.posix.basename`). Every other S1
   pattern is unchanged and path-only. No other exemption may be added without security review.
2. New rule **S6** scans every exempt file. An unreadable file fails (do not reuse the
   existing `catch { continue; }`). The file fails on:
   - (a) anywhere in the file text, comments included: `-----BEGIN [A-Z ]*(PRIVATE KEY|CERTIFICATE)-----`,
     `AKIA[0-9A-Z]{16}`, `\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}`, `github_pat_[A-Za-z0-9_]{20,}`,
     `\bsk-[A-Za-z0-9_-]{20,}`, `xox[abprs]-[A-Za-z0-9-]{10,}`, `AIza[0-9A-Za-z_-]{35}`;
   - (b) a line that, after stripping one leading `#` and whitespace, matches
     `^([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(.*)$` with a key matching
     `/(SECRET|PASSWORD|PASSWD|PASSPHRASE|TOKEN|API_?KEY|PRIVATE_?KEY|ACCESS_?KEY|CLIENT_?SECRET|CREDENTIAL|KEYSTORE|STORE_?PASS|KEY_?PASS|SIGNING)/i`
     and a value that is non-empty after trimming whitespace and matching surrounding quotes
     (`API_KEY=` and `API_KEY=""` pass; `API_KEY=changeme` fails);
   - (c) on the same `KEY=VALUE` lines, a trimmed unquoted value containing a run of 32 or more
     characters from `[A-Za-z0-9+/=_-]`.
   Failures print `S6: <path>:<line> (<a|b|c>: env template contains secret-shaped content)` and
   exit 1.
3. Each exempt file that passes is listed in the script output
   (`check-no-secrets: S1 template exemption, content scanned clean: <path>`), so the exemption
   shows in CI logs.
4. The S6 scanner is exported as a pure function (e.g. `scanEnvTemplate(text) → failures[]`),
   `main()` is guarded, and it is unit-tested with inline string fixtures only (no committed
   `.env.*` fixtures). Tests: (i) the current Cursor file → pass; (ii) `DB_PASSWORD=hunter2` →
   S6b; (iii) `# API_KEY=abc` → S6b; (iv) `API_KEY=` → pass; (v) a PEM `BEGIN PRIVATE KEY` line →
   S6a; (vi) `AKIAABCDEFGHIJKLMNOP` → S6a; (vii) `FOO=` plus a 40-character base64-like string →
   S6c. Basename boundaries: `.env.example` exempt; `.env`, `.env.local`, `.env.example.bak`,
   `foo/.env.production` and `x.pem` still fail S1.
5. §7.5.3 gains an S6 row (architect amendment). The deploy-pages workflow change is not
   merged until items 1-4 are implemented and `npm run check:secrets` passes on the real tree.

**Effect on this review:** the verdict and conditions are unchanged. N3 stays closed: the
scope is still the whole repository, and the check still fails closed on content. Residual
risk: LOW.
