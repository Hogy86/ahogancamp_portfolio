# Mobile Security & Play Policy Review: Pass 2 (Final app + Play Console answers)

**Stage:** Mobile Pipeline Step 12, mobile-security-compliance-reviewer
**Date:** 2026-09-29
**Branch / tree:** `claude/project-thread-rm5222`, working tree. The in-flight Android CSS fix (`src/platform/android/android.css`, `layout.ts`) was not reviewed. It has no security surface.
**Baseline:** `docs/mobile/security/review-v1.md` (FAIL), `docs/mobile/security/review-v1b.md` (PASS, conditional) + Addendum 1, including its "Carried to pass 2" list.
**Checklists applied:** security-compliance-checklist, play-policy-checklist

**Files reviewed:**
- `android/app/src/main/AndroidManifest.xml`
- The locally built merged release manifest: `android/app/build/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml`
- `android/app/build.gradle`, `android/build.gradle`, `android/variables.gradle`, `android/gradle.properties`, `android/app/capacitor.build.gradle`
- `android/.gitignore`, `android/app/.gitignore`, `android/local.properties`
- `android/app/src/main/res/**`, including `xml/data_extraction_rules.xml` and the launcher icon
- `MainActivity.java`, `GameShellPlugin.java`
- `android/app/src/main/assets/{capacitor.config.json, capacitor.plugins.json, public/**}`
- `capacitor.config.ts`, `vite.config.ts`, `index.html`, `public/privacy.html`, `public/webview-update.html`
- `src/**`, with a focus on `src/platform/android/**`, `src/render/shapes.ts`, `src/instrumentation/**`, `src/persistence/**`
- `.eslintrc.cjs`
- `scripts/check-no-secrets.mjs`, `check-android-manifest.mjs`, `check-capacitor-config.mjs`, `refresh-android-mirror.ps1`
- `<repo>/.github/workflows/deploy-pages.yml`
- scaffold `.gitignore`, `infra/aws/.gitignore`
- `package.json`
- `docs/mobile/PRD-mobile.md` v1.7, `docs/mobile/architecture/mobile-architecture.md` (+ ADRs)
- `docs/mobile/market/listing-draft-v2.md`, `docs/mobile/market/play-store-research.md` §6
- `docs/mobile/ux/store-assets-spec.md`, `docs/mobile/ux/design-review-round3.md`, `docs/mobile/ux/design-review-round4.md`
- `docs/mobile/tests/validation-report*.md`, `docs/mobile/tests/device-matrix.md`

**Verification limits:**
- No web access. Play policy numbers (targetSdk, tester rule) and User Data policy wording come from my own knowledge and are marked for live re-verification at step 15.
- No emulator.
- No git CLI in this session. Tracked-file status is inferred from the `.gitignore` files, a filesystem glob of the working tree (no `*.jks/*.keystore/*.p12/*.pepk/*.pem/*.aab/*.apk/*.idsig/signing.properties` outside the ignored `android/app/build/`), and the recorded `check:secrets` PASS runs in validation rounds 2-4.
- `docs/mobile/release/submission-checklist.md` does not exist yet (step 15 creates it). The Play Console answers are therefore drafted in §6 below, for the release engineer to transcribe.
- I did not open `terraform-deploy_accessKeys.csv`, `terraform.tfstate` or `terraform.tfvars`.

> Transcription note: the reviewer is read-only by design. The main session writes this file verbatim from the reviewer's returned content.

---

## 1. Verdict: **PASS (conditional)**

**Result:**
- No CRITICAL or HIGH findings are open against the app, its build, its CI, or the drafted Play Console answers.
- The release build as built is correct:
  - not debuggable
  - WebView debugging left at Capacitor's default (debuggable builds only)
  - no cleartext traffic
  - no `server.url`
  - **no permissions except the library-generated, signature-level `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`**
  - no key material in the tree
- "No data collected, no data shared" matches the code.

**Open findings:**
- 3 MEDIUM (V2-M1..M3): IP/listing items
- 6 LOW
- 3 INFO
- 1 out-of-scope owner advisory (AWS credentials in the OneDrive-synced folder). It does not gate this app review, but it needs the owner's action now.

**Gate:**
- Step 13 (mobile-technical-writer) and step 14 (UAT) may proceed.
- **mobile-release-engineer may not upload any build (step 15) until conditions C1-C10 below are recorded as met.** C11 applies before production (step 17).

### Conditions on this PASS

| # | Condition | Owner | Due |
|---|---|---|---|
| C1 | **OQ-M11 decided and recorded** in PRD-mobile §7 with a date: account type, public developer name, contact email, and final confirmation of `io.github.hogy86.shieldvsrobots`. The app ID is permanent after the first upload. If the owner picks a different ID, `capacitor.config.ts:12`, `android/app/build.gradle:66,69` and the Java package are changed together and re-checked (R5 exact class match uses `${package}.MainActivity`). | mobile-product-manager (owner) | Before step 15 |
| C2 | **OQ-M12 decided and recorded:** Play App Signing enrolled. Upload key generated outside the repo and OneDrive (M-ADR-0011 location, owner-only ACL). Key and passwords backed up in the owner's password manager. Build from the command line only (review-v1b N3). | mobile-product-manager (owner); mobile-release-engineer | Before step 15 |
| C3 | **OQ-M13 decided and recorded.** The §6 drafts assume (a) "13 and over". If the owner picks (b) (under-13s included), the Families policy applies, the §6.4/§6.5 answers are invalid, and a review-v2 addendum is required before upload. | mobile-product-manager (owner) | Before step 15 (review-v1b asked for this before step 12; carried here at the caller's instruction) |
| C4 | **OQ-M14 decided** and at least 12 testers recruited, ideally 15-20 per the PM plan. Re-verify the current number and duration live (see C9). | mobile-product-manager (owner) | Before step 16 starts |
| C5 | **V2-M1:** the owner's disposition of OQ-M15 ("ShieldMan" adjacency) is recorded in PRD-mobile §7. | mobile-product-manager (owner) | Before step 15 and before store assets are produced |
| C6 | **V2-M2:** third-party trademark removed from the listing keywords. | mobile-marketing-analyst | Before step 15 |
| C7 | **V2-M3:** the ringed "x" power-up glyph is ruled on under M9.6 item 3. | mobile-ui-ux-designer; mobile-product-manager | Before screenshots are captured (step 15) |
| C8 | **Final privacy policy:** after step 13, the reviewer does a short delta check (a review-v2 addendum, files only) of the final `public/privacy.html` against V2-L1 and the §8.7 content rules. At step 15, the release engineer records in `submission-checklist.md`: the hosted URL loading over HTTPS, and matching SHA-256 hashes for the hosted file, `public/privacy.html` and the copy inside the AAB. | mobile-technical-writer; mobile-security-compliance-reviewer; mobile-release-engineer | Before step 15 upload |
| C9 | **Release-artifact evidence (V2-L2)**, plus a live policy re-check: the current targetSdk requirement (L6/R7), the personal-account closed-test rule, and the User Data policy's in-app privacy-policy wording. All recorded in `submission-checklist.md`. | mobile-release-engineer | Before step 15 upload |
| C10 | **Play Console answers** transcribed from §6 into `submission-checklist.md`, and entered in the Console exactly as drafted. Any deviation needs a review-v2 addendum. | mobile-release-engineer | Before step 15 upload |
| C11 | No build that differs from the reviewed tree in manifest, Gradle, Capacitor config, plugins or dependencies is promoted to production without the CI checks and a re-run of the C9 evidence. | mobile-release-engineer | Step 17 |

---

## 2. Findings (ranked)

### [MEDIUM] V2-M1: The "ShieldMan" name check found an adjacency and recommended a change, but no owner disposition is recorded
- **Checklist item:** Intellectual property and metadata (Play IP policy, Impersonation/trademark complaints).
- **Where:**
  - `docs/mobile/market/play-store-research.md:346-416`:
    - §6.3 flags a "brand-adjacency" conflict: object + "-Man" naming, with "Shield", for a shield-throwing blue-and-white hero, next to Captain America and Archie/Dark Circle's "The Shield".
    - §6.4 raises **OQ-M15** and recommends (b) or (c): take "shield" out of the hero's name.
  - `docs/mobile/PRD-mobile.md:1069-1073` (M9.6 item 8) says: "If it finds a conflict, the PM raises it with the owner (Job 0) before any upload."
  - PRD §7 OQ-S1a (lines 1621-1674) records "keep ShieldMan, conditional on a clean check". **The check was not clean, and OQ-M15 appears nowhere in PRD-mobile.**
  - The name ships in the app (`src/platform/android/overlays.ts:72`: "move ShieldMan") and in the listing (`listing-draft-v2.md:76,123`).
- **Why it matters:**
  - The whole product started as a Captain America theme.
  - The stacked signals are: a blue/white humanoid, a round shield that is thrown and comes back, the title "Shield vs Robots", and a hero named "ShieldMan". Together they are the combination most likely to draw a rights-holder complaint.
  - On Play, a complaint means removal or a strike against a new personal account.
  - The hero name is cheap to change now and costly after launch (store assets, both pipelines' gates).
  - The art constraints (plain blue disc, no stars or red/white/blue) are met (see §4). This finding is only about the name.
- **Required fix:**
  - mobile-product-manager puts OQ-M15 to the owner with the analyst's options and records the decision with a date in PRD-mobile §7.
  - If kept: M9.6 items 5-7 stay binding, and the listing keeps "ShieldMan" as a plain in-game label only (`listing-draft-v2.md:193-196`).
  - If renamed: it is a shared game change through both pipelines' gates. It needs no security re-review unless something other than text and listing changes.

### [MEDIUM] V2-M2: The listing keywords include a third-party trademark ("space invaders style")
- **Checklist item:** Listing accuracy / no keyword stuffing / no third-party names (Play Metadata policy; IP policy).
- **Where:** `docs/mobile/market/listing-draft-v2.md:169`, under "Primary" keywords. Line 162 says these are "for use in the title/short description... the full description's natural-language repetition".
- **Why it matters:**
  - "Space Invaders" is a Taito trademark.
  - Play's Metadata policy disallows using other apps' or brands' names to draw search traffic. It is a common reason for listing rejections and trademark takedowns.
  - The current full description (lines 75-127) does not contain it, but the keyword list tells whoever finalizes the listing to use it.
- **Required fix:**
  - Delete the "space invaders style" line.
  - Add "Space Invaders" and "Galaga" (Bandai Namco) to the §4 "Explicitly excluded" list.
  - Use generic genre terms only ("retro arcade shooter", "formation shooter").

### [MEDIUM] V2-M3: The Permanent Multiplier power-up is drawn as an "x" inside a ring, an unassessed hit against M9.6 item 3 ("no 'X' emblem")
- **Checklist item:** Intellectual property and metadata (in-app art, screenshots).
- **Where:**
  - `src/render/shapes.ts:290-296` draws a circular ring (amber `#ffd873` outline).
  - `src/render/shapes.ts:332-339` draws a diagonal "x" inside that ring (`PERMANENT_MULTIPLIER`).
  - `listing-draft-v2.md:228-231` and `store-assets-spec.md:124-126` (screenshot 4, "Power-up catch moment") specifically feature a falling power-up.
  - `design-review-round3.md:81` and `design-review-round4.md:22` assessed only the enemies and the boss for X iconography, not the power-up tokens.
- **Why it matters:**
  - A bold X inside a circle is the X-Men emblem's basic shape.
  - The name was originally changed because of X-Men "Sentinels" (review-v1 M5).
  - M9.6 item 4 says "any hit is a FAIL" and leaves the call to the UX designer and this reviewer. I judge it borderline: a thin multiplication sign, small, amber, reads as "×". It needs a recorded decision, not silence.
- **Required fix (one of):**
  - (a) **Preferred:** a shared glyph change (for example "+", a double chevron, or text "×N" without a surrounding ring), routed through both pipelines per CLAUDE.md §One codebase.
  - (b) mobile-ui-ux-designer records in a design review that the glyph is not an emblem (as drawn, at in-game size). mobile-product-manager accepts that. Store screenshots and the feature graphic must not show the multiplier token (capture screenshot 4 with a different power-up).

### [LOW] V2-L1: The privacy policy is still the step-7 placeholder, and one statement is too broad for the website
- **Checklist item:** A privacy policy URL is provided and matches the Data safety answers (Play User Data policy).
- **Where:** `public/privacy.html:48-55`.
- **Issues:**
  1. `Contact: TBD`. Play requires a privacy contact in the policy.
  2. "The app and website ... None of this is ever sent anywhere" / "collects and shares no data". True for the app. The website is hosted on GitHub Pages, which logs visitor IP addresses on the server (GitHub's own processing).
  3. The hosted URL (`hogy86.github.io/ahogancamp_portfolio/privacy.html`) goes live only when this branch reaches master.
- **Checked and correct:**
  - The listed stored values (best score, settings, on-device counters) match the code: `src/persistence/bestScore.ts`, `src/platform/android/settings.ts:9`, `src/instrumentation/Instrumentation.ts:35-59`.
  - The §8.7 content rules hold: no script, no external resources, no outbound `href`.
- **Required fix (step 13):**
  - Final text names the app and the developer (per OQ-M11) and gives a contact email.
  - It says the policy covers the "Shield vs Robots Android app" and scopes the no-collection statement to the app. For the website, add one sentence that GitHub Pages hosting may log technical request data under GitHub's own privacy statement.
  - The §8.7 content rules stay intact.
  - Then complete C8.

### [LOW] V2-L2: Every piece of on-device evidence comes from debug builds. The release-only checks are still owed.
- **Checklist item:** Release build hardening; review-v1b "Carried to pass 2 → Evidence"; N4.
- **Where:** `docs/mobile/tests/device-matrix.md:4` ("Build tested: debug APK"). No `chrome://inspect` or installed-app `__vvsTest` evidence exists in `docs/mobile/tests/`.
- **Status by code inspection (good):**
  - The merged release manifest has no `android:debuggable`, has `usesCleartextTraffic="false"`, and has no INTERNET permission.
  - `webContentsDebuggingEnabled` is unset (`capacitor.config.ts:22-27`). Capacitor enables it only when the app is debuggable.
  - The test hook returns early when `Capacitor.isNativePlatform()` (`src/platform/android/AndroidPlatform.ts:277`).
  - `minifyEnabled false` (`android/app/build.gradle:93`) lowers, but does not remove, the release-only failure risk.
- **Required fix:** extend the §10.3 step-15 item 5 smoke (signed AAB via `bundletool install-apks` on API 36 and on a WebView ≥ 80 image) so it records:
  - (i) cold start in airplane mode → title renders; Settings → Privacy policy opens
  - (ii) `chrome://inspect` on the host does **not** list the app's WebView
  - (iii) no `net::ERR_*` / `ClassNotFoundException` in logcat
  - (iv) the `bundletool dump manifest` output passes `check-android-manifest.mjs --variant release`
  - (v) the AAB contains no `lib/**.so`. If any appear, confirm 16 KB page alignment.
  - Put everything in `submission-checklist.md` with the AAB's SHA-256.
- A `__vvsTest` runtime probe is not possible without debugging. The code gate plus (ii) is sufficient.

### [LOW] V2-L3: The secret check has no rule for cloud-credential files or content outside env templates
- **Where:**
  - `scripts/check-no-secrets.mjs:39`: the S1 path pattern covers key and signing files and `.env*` only.
  - `:69-77`: the AKIA/PEM/token content patterns (S6a) apply only to exempt `.env.example`-type files.
- **Why it matters:**
  - A file like the scaffold's `terraform-deploy_accessKeys.csv` (the AWS console's key-download format) is protected only by `.gitignore:5`.
  - A `git add -f`, a renamed copy, or an AKIA key pasted into any tracked text file would pass CI.
  - Separately, the workflow runs only on `scaffold/**` paths (`deploy-pages.yml:22-27`), and there is no repo-root `.gitignore`. A secret committed elsewhere in the portfolio repo is not scanned until the next scaffold change, and CI runs after the push anyway.
- **Required fix:**
  - S1 adds `(^|/)[^/]*accessKeys[^/]*\.csv$`, `(^|/)credentials(\.csv)?$`, `\.tfstate(\.|$)`, `terraform\.tfvars$`, `(^|/)google-services\.json$`.
  - A new S7 runs the S6a content patterns (`AKIA…`, PEM private key, GitHub/Slack/OpenAI/Google API tokens) over every tracked text file under 1 MB, with the same failure output format.
  - Add unit tests with inline fixtures only.
  - Recommend (owner's call, outside scaffold) a repo-root `.gitignore` with the signing and credential patterns, and a local pre-commit hook that runs `npm run check:secrets`.

### [LOW] V2-L4: Template code applies the Google Services plugin automatically if a `google-services.json` appears
- **Where:** `android/app/build.gradle:144-151`; classpath `android/build.gradle:11`.
- **Why it matters:** dropping in a Firebase config file would change the build with no manifest or dependency diff for anyone to notice. It is also the usual first step toward adding Firebase SDKs, which would make the Data safety answer (§6.1) and the privacy policy wrong. It does nothing today (no file, no Firebase dependencies).
- **Required fix:** delete both blocks, or replace the try-block with a `GradleException` if `google-services.json` exists ("adding Google services requires a security and Data safety review"). Add `google-services.json` to the scaffold `.gitignore` and to S1 (V2-L3).

### [LOW] V2-L5: The step-15 artifact is built from the out-of-repo mirror. Record where it came from.
- **Where:**
  - `scripts/refresh-android-mirror.ps1:33`: the mirror is `C:\Users\aaron\dev-build\shield-vs-robots`.
  - `device-matrix.md:5`.
- **Issues:**
  - The signing path guard's git-top-level rule (`android/app/build.gradle:16-33`) finds no `.git` in the mirror, so only the mirror-root and OneDrive rules apply there. That is sufficient today, because the key directory is outside both.
  - Nothing yet ties the signed AAB to a reviewed commit.
- **Required fix:** the release engineer, at step 15:
  1. Commits the release tree.
  2. Runs `refresh-android-mirror.ps1` immediately before `bundleRelease`.
  3. Records in `submission-checklist.md`: the commit SHA, the script's "Parity check passed" line, and the AAB SHA-256.
- The mirror's `/XF` list already excludes `*.csv`, `.env*`, `*.tfstate*` and `terraform.tfvars` (lines 242-245). Good.

### [LOW] V2-L6: The description and feature-graphic lockup put "SHIELD" in all caps
- **Where:**
  - `listing-draft-v2.md:79` ("SHIELD VS ROBOTS is a fast…")
  - `store-assets-spec.md:80-81` (title lockup "SHIELD VS ROBOTS")
- **Why it matters:** this is not an M9.6 item 1 violation (no periods, no agency styling). But an all-caps "SHIELD" matches the NVIDIA SHIELD mark and the dot-less "Agents of SHIELD" marketing. With V2-M1 still open, it adds to the "Shield" association for no benefit.
- **Required fix (advisory):** use title case "Shield vs Robots" in the description body and the feature-graphic lockup.

### [INFO] V2-I1: First-party GitHub Actions are pinned by tag, not SHA
- **Where:** `deploy-pages.yml:48,55,91,112,157,173,205`.
- **Note:** consistent with L5 as written (third-party pinned by SHA: setup-java, setup-gradle). Optional hardening: pin `actions/*` by SHA as well.

### [INFO] V2-I2: The "Appeals to children" risk under a 13+ audience
- **Note:** simple cartoon vector art and an arcade premise may lead Google's review to treat the app as appealing to children. If that happens, Play can require Families policy compliance.
- **Current exposure:** compliance would be easy (no ads, no data, no SDKs, no external links), so the risk is low.
- **Guidance:** keep the listing free of child-directed language (it is now). If Play raises it, reply through the Console rather than changing the app.

### [INFO] V2-I3: `console.log` instrumentation in release
- **Where:** `src/instrumentation/Instrumentation.ts:80`.
- **Note:** event names and level numbers only, no identifiers. With `loggingBehavior: 'debug'` (`capacitor.config.ts:16`), Capacitor does not forward to logcat in release. No action.

---

## 3. Disposition of review-v1b "Carried to pass 2"

| Item | Result | Evidence |
|---|---|---|
| L2: no source maps in Android | **PASS** | `vite.config.ts:27` (`sourcemap: mode !== 'android'`); no `*.map` under `android/app/src/main/assets/public/` |
| L3 / N2 / N5: config guard | **PASS** | `scripts/check-capacitor-config.mjs:32-102` fails on `server.url`, `cleartext`, `webContentsDebuggingEnabled`, `allowMixedContent`, scheme ≠ https, hostname ≠ localhost, any `allowNavigation`. Checks both the `.ts` and the shipped `.json`. Runs in CI after `cap sync` (`deploy-pages.yml:124-126`). The shipped `capacitor.config.json` is clean. |
| L4a: test hook | **PASS (code)**; runtime → C9 | `AndroidPlatform.ts:275-301`: gated on `?e2e=1 && !isNativePlatform()`, deep-frozen, read-only |
| L4b: no HTML sinks | **PASS** | `.eslintrc.cjs:83-92` bans innerHTML/outerHTML/insertAdjacentHTML/eval. Grep of `src/` (non-test) finds no sinks and no network APIs (`fetch`, XHR, WebSocket, `sendBeacon`, `window.open`, `location=`). |
| L4c: settings parsing | **PASS** | `src/platform/android/settings.ts:19-47`: field-by-field into a fresh literal |
| L5: pinning | **PASS** | All `package.json` versions are exact (`jsdom` `24.1.3`). Third-party actions are pinned by SHA. setup-gradle v4 validates the wrapper by default. |
| N1: R5 allowlist | **PASS** | `check-android-manifest.mjs:25-27,204-243`: only `androidx.startup.InitializationProvider` with `exported=false`. FileProvider-shaped providers, grant-uri children, FILE_PROVIDER_PATHS meta and `grantUriPermissions=true` all fail. The receiver allowlist requires `DUMP`. The merged release manifest matches exactly (the provider has 3 startup initializers; the receiver is DUMP-guarded). |
| N3: whole-repo scope, git-top-level guard | **PASS** | `check-no-secrets.mjs:162-172` (`--show-toplevel`, `ls-files :/`); `build.gradle:16-33` |
| Addendum 1: S1 template exemption / S6 | **PASS** | `check-no-secrets.mjs:31,69-144,153-160,178-232` match items 1-4 exactly (frozen array, basename-only, content-scanned, unreadable = fail, exported pure functions, guarded `main`) |
| Signing contract (M2) | **PASS** | `build.gradle:6-63,81-122`: path from env var or property only; rejects scaffold, OneDrive and git-top paths for both the properties file and `storeFile`; release never uses `signingConfigs.debug`; fails closed on any release packaging task, except CI unsigned with `CI=true` + `-PvvsCiUnsignedRelease`. No keystore or `signing.properties` in the tree. Validation rounds 1-4 record the signing-refusal contract. |
| Privacy iframe | **PASS** | `overlays.ts:276-279`: `sandbox=""` (no tokens), `referrerpolicy=no-referrer`, fixed `/privacy.html`, created on open and removed on close (`:263-266`) |
| Privacy SHA-256 bundled = hosted; final text | **OPEN → C8** | Placeholder text (V2-L1); hosted copy not live yet |
| No-INTERNET evidence | **PASS (debug)**; release → C9 | Merged release manifest has no INTERNET (`tools:node="remove"`, `AndroidManifest.xml:55`). `device-matrix.md` lines 49/65/84 show no `net::ERR_*` on API 36/30/24. errorPath fallback confirmed on WebView 53 (line 83). |
| `chrome://inspect` hides the release WebView | **OPEN → C9** | Not done yet (V2-L2) |
| OQ-S1 constraints (M9.6 items 1-3) | **PASS, except V2-M3** | Enemies are white-to-dark grey with red eyes; boss `#242428` (`constants.ts:97-114`), not purple. No "mutant", "Sentinel" or "Vanguard" in player-visible text (grep of `src`, `public`, `index.html`, `res`). Marvel catalog scan is in `play-store-research.md` §6.2. |
| OQ-M13 + Play Console answers | **OPEN → C3, C10** | Owner decision pending; answers drafted in §6 |

---

## 4. Checklist disposition (as built)

### Release build hardening

| Check | Result | Evidence |
|---|---|---|
| Not debuggable | PASS | Merged release manifest has no `android:debuggable`. CI R2 on the unsigned release APK (`deploy-pages.yml:148-155`). Negative control recorded (`validation-report-round2.md:81`). |
| WebView debugging off in release | PASS (config); runtime → C9 | `capacitor.config.ts:22-27` / shipped JSON: key absent. Guarded by the config check. |
| No cleartext | PASS | `usesCleartextTraffic="false"`, no `networkSecurityConfig`, `allowMixedContent: false`, `androidScheme: 'https'` |
| No live-reload `server.url` | PASS | Absent in `.ts` and in the shipped `.json`; CI guard |
| Backup / device transfer | PASS | `allowBackup="false"` + `data_extraction_rules.xml` excludes all domains for cloud backup and device transfer |
| Exported components | PASS | Only `MainActivity` (LAUNCHER) and the DUMP-guarded `ProfileInstallReceiver`. No deep-link `<data>` schemes. |

### Permissions (merged release manifest)

| Permission | Kept? | Why |
|---|---|---|
| `io.github.hogy86.shieldvsrobots.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | Yes | Generated by AndroidX core for targetSdk ≥ 33. Signature-level and app-private. Not a user-facing permission, and it needs no Play declaration. |
| `android.permission.INTERNET` | **Removed** | `tools:node="remove"`. The app loads bundled assets through the local interceptor. Evidence from debug builds; release → C9. |
| Anything else | None | No `AD_ID`, no storage, camera, location, notifications, foreground service, exact alarm or query-all. `uses-feature touchscreen required=false`. |

### Plugins and SDKs
- `capacitor.plugins.json` lists only `@capacitor/app` and `@capacitor/splash-screen`.
- The first-party `GameShellPlugin` does no I/O and needs no permissions (`GameShellPlugin.java`).
- Native dependencies: AndroidX appcompat, coordinatorlayout, core-splashscreen, and Capacitor.
- No analytics, ads, crash-reporting, billing or Firebase code. See V2-L4 for the dormant google-services hook.

### Data stored / leaves the device
- Stored in WebView localStorage in app-private storage:
  - best score
  - settings (`swapControls`, `helpSeen`)
  - anonymous event counters (ADR-0005)
- Nothing is transmitted: no network APIs in `src/`, no INTERNET permission, backups excluded.

### targetSdk / minSdk
- Values: 36 / 24 (`variables.gradle:2-4`). Enforced by R7.
- To my knowledge, 36 meets the requirement in force for new apps as of this date. **Re-verify live at step 15 (L6 → C9).**

### Keystore and secrets
- No key material in the tree.
- Scaffold `.gitignore:21-33` covers `*.jks`, `*.keystore`, `*.p12`, `*.pepk`, `*.pem`, `*.idsig`, `keystore.properties`, `key.properties`, `signing.properties`, `*.aab`, `*.apk`, `.env*`.
- `android/local.properties` holds only `sdk.dir` and is ignored.
- `android/gradle.properties` has no signing values.
- Gaps: V2-L3.

### CI
- Least privilege: top-level `contents: read`; `pages`/`id-token` only on `deploy`.
- `persist-credentials: false` on every non-deploy checkout.
- No `pull_request_target`.
- The secret scan runs first; `npm audit --omit=dev --audit-level=high`.

### IP: name, icon, screenshots, listing
- **Name:** "Shield vs Robots" (`strings.xml:3-4`, `index.html:7`, `ScreenController.ts:96`). No Marvel, Captain America, X-Men or "Sentinel" terms.
- **Icon:** a plain `#2f6fed` disc on `#05050a` (`ic_launcher_foreground.xml:15-17`). No rings, star or text.
- **In-game art:** blue/white humanoid hero; plain blue disc shield with a thin white edge (not concentric rings); grey robots with red eyes. The firework palette is multicolour, not a red/white/blue set.
- **Listing text:** no Marvel/DC terms and no S.H.I.E.L.D. styling.
- **Screenshots and feature graphic:** do not exist yet. Their spec (`store-assets-spec.md` §3-§5) carries the M9.6 constraints. They must be real Android-build captures (M12.4), checked by UX and the release engineer at step 15.
- Open items: **V2-M1, V2-M2, V2-M3, V2-L6.**

---

## 5. Out-of-scope owner advisory (does not gate this app review)

**[Owner action: HIGH for the AWS account] AWS access keys and Terraform state in plaintext in the OneDrive-synced scaffold folder**
- **Where:**
  - `scaffold/terraform-deploy_accessKeys.csv` (gitignored at `.gitignore:5`; excluded from the build mirror)
  - `scaffold/infra/aws/terraform.tfstate` and `scaffold/infra/aws/terraform.tfvars` (gitignored at `infra/aws/.gitignore:2-4`)
  - I did not open any of these files.
- **Why it matters:**
  - An `*_accessKeys.csv` is the AWS console's one-time download of an IAM access key ID **and secret key** in plaintext.
  - OneDrive copies it to Microsoft's cloud and to every device linked to the account.
  - Any local tool or AI agent with read access to `scaffold/` can read it. That includes this pipeline's subagents.
  - Terraform state often contains secrets and resource details in plaintext.
  - These files are outside the app, so they do not affect the Play review. But they are a live credential-exposure risk now.
- **Recommended owner actions:**
  1. In IAM, deactivate and then delete that access key. Create a replacement only if still needed. Prefer `aws configure sso` or short-lived credentials, with the profile stored in `%USERPROFILE%\.aws\` (outside OneDrive).
  2. Delete the CSV from `scaffold/`. Also check OneDrive's version history and recycle bin, and delete it there too.
  3. Move Terraform state to an encrypted remote backend, or at minimum out of the OneDrive tree.
  4. Confirm the files were never committed, with `git log --all -- '*accessKeys*' '*.tfstate' '*.tfvars'` from the repo root. If they were, rotate first and then purge history.
  5. V2-L3 adds the CI guard, so a copy can never be committed silently.

---

## 6. Drafted Play Console answers (assume OQ-M11 (a), OQ-M12 (a), OQ-M13 (a); OQ-M1 free/no ads/no IAP)

Transcribe these into `docs/mobile/release/submission-checklist.md` (C10). Any answer that changes needs a review-v2 addendum.

### 6.1 App content → Data safety

| Question | Answer | Basis in code |
|---|---|---|
| Does your app collect or share any of the required user data types? | **No** | Only best score, settings and anonymous counters are stored, on the device only (`safeStorage.ts`, `settings.ts:9`, `Instrumentation.ts:35-59`). No INTERNET permission (merged manifest). No network APIs in `src/`. Backups and device transfer excluded (`data_extraction_rules.xml`, `allowBackup=false`). Under Play's definition, data processed only on the device is not "collected". |
| (Follow-ups on encryption in transit / deletion requests) | Not shown when the answer is "No" | — |
| Account creation | **My app does not allow users to create an account** (no login) | No account code |
| Third-party SDKs that collect data | None | Plugins: `@capacitor/app` and `@capacitor/splash-screen`; AndroidX only |
| Resulting store label | "No data collected" · "No data shared with third parties" | Must match the final `privacy.html` (C8) |

### 6.2 App content → other declarations

| Declaration | Answer |
|---|---|
| Privacy policy URL | `https://hogy86.github.io/ahogancamp_portfolio/privacy.html`. Confirm it is live and its hash matches (C8). |
| Ads: "Does your app contain ads?" | **No** |
| App access | **All functionality is available without special access** (no login, no restricted areas) |
| Advertising ID: "Does your app use advertising ID?" | **No** (no `AD_ID` permission, no ads/analytics SDK) |
| Government app | No |
| Financial features | My app doesn't provide any financial features |
| Health | Not a health app / no health features |
| News app | No |
| Sensitive permission declarations (photos/video, foreground service, exact alarm, full-screen intent, accessibility, VPN, `QUERY_ALL_PACKAGES`) | None apply: no such permissions in the merged manifest |
| In-app purchases / Play Billing | None |

### 6.3 Content rating (IARC questionnaire)
- **Category:** Game (arcade). Give the contact email per OQ-M11.
- **Violence:** **Yes.**
  - Fantasy/cartoon violence.
  - The player throws a shield that destroys stylized, non-realistic robots.
  - Robots shoot projectiles at the player's character, who loses a life on a hit.
  - Not realistic humans; no blood, gore or dismemberment; no violence against realistic humans or animals.
  - Violence is the main activity of play; no rewards for violence against humans.
- **Fear / horror:** No
- **Sexuality / nudity:** No
- **Language / profanity / crude humour:** No
- **Controlled substances (drugs, alcohol, tobacco):** No
- **Gambling, simulated gambling, loot boxes:** No
- **User interaction:** No chat/communication between users. No user-generated content shared. No sharing of the user's location. No sharing of personal information.
- **Digital purchases:** No
- **Unrestricted internet or web-browser access:** No (no INTERNET permission; privacy policy shown offline in a sandboxed frame)
- **Expected outcome (computed by IARC, not chosen):** roughly ESRB Everyone/E10+ (Fantasy Violence), PEGI 7, USK 6-12. Record the certificate ID and ratings in `submission-checklist.md`.

### 6.4 Target audience and content (OQ-M13 (a))
- **Target age groups:** **13-15, 16-17, 18 and over.** No under-13 bands (5 and under, 6-8, 9-12) selected.
- **Could the store listing unintentionally appeal to children?** **No.** Justification: an arcade shooter aimed at teens and adults, with no child-directed language, characters or claims. Note V2-I2.
- **Consequence:** the Families policy and the Teacher Approved rules do not apply. If the owner chooses OQ-M13 (b), stop: the Families policy applies and this section must be re-reviewed (C3).

### 6.5 Store settings and listing
- **App category:** Game → Arcade
- **Tags:** genre terms only
- **Contact details:** email per OQ-M11 (required); website optional (the GitHub Pages URL)
- **Title:** "Shield vs Robots" (16/30). No "free", "best", "#1" or other promotional terms in the title, icon or developer name (Play Metadata policy).
- **Short and full description:** `listing-draft-v2.md` §2-§3, after V2-M2 and V2-L6. The originality sentence follows the outcome of V2-M1.
- **Graphics:**
  - 512×512 icon = the launcher shield.
  - The feature graphic and at least 2 screenshots are real Android-build captures meeting M9.6 and V2-M3.
  - No baked-in "Free/No Ads" text.
- **Release format:** a signed `.aab`, uploaded with the upload key, and Play App Signing enrolled (C2).
- **New personal account:** closed test with the currently required number of testers (12 as far as I know) for the required continuous days (14 as far as I know) before production access. Re-verify live (C9) and plan per OQ-M14 (C4).
