# Mobile Security & Play Policy Review — Pass 1 (Architecture)

**Stage:** Mobile Pipeline Step 5 — mobile-security-compliance-reviewer
**Date:** 2026-09-25
**Reviewed (files only, no writer explanations):**
- docs/mobile/architecture/mobile-architecture.md (v1)
- docs/mobile/architecture/adr/0001..0008-*.md
- Against: docs/mobile/PRD-mobile.md (Draft v1.1), docs/PRD-addendum-v3.md,
  docs/security/security-review-v1.md, -v2.md, -v2-update.md (web binding constraints 1-5)
- Current tree: src/ (network/DOM-sink grep), index.html, package.json, vite.config.ts,
  scaffold/.gitignore, repo-root .github/workflows/deploy-pages.yml
**Checklists applied:** security-compliance-checklist, play-policy-checklist

> Transcription note: the reviewer is read-only by design, so the main session wrote this
> file verbatim from the reviewer's returned content.

## Verdict: FAIL

1 HIGH finding is open (H1: no in-app privacy policy, a Play User Data policy requirement).
The checklist allows PASS only with zero CRITICAL or HIGH findings open. The rest of the
architecture is strong for its threat surface:
- INTERNET permission removed; no SDKs; closed plugin allowlist
- backup disabled; fail-closed storage validation
- no signing in CI; permission allowlist enforced in CI; web bundle purity check

**Gate:** mobile-junior-developer (step 7) must not start until a re-review marks this PASS.
The fix for H1 is small. Fold M1-M5 into the same architecture revision so the re-review
closes them together.

Current-tree sanity checks:
- `src/` has no network code: no `fetch`, XHR, WebSocket, `sendBeacon`, `window.open` or
  `http(s)://`.
- `src/` has no `innerHTML`, `eval` or `new Function`.
- `index.html` loads no external resources.
- No `*.jks`, `*.keystore`, `*.p12`, `*.pem`, `*.aab` or `*.apk` exists under scaffold/.

---

## Findings (ranked by severity)

### [HIGH] H1 — Play User Data policy: privacy policy must be available inside the app
- **Where:** PRD-mobile.md M11.4 (lines 671-675); mobile-architecture.md §8.6 (Settings/Help overlays), §7.4. Play Console field: App content → Privacy policy.
- **Issue:** The design links the privacy policy only in the Play listing. No design
  element makes it reachable inside the app. `grep -i privacy docs/mobile` finds only M11.4.
  Google Play's User Data policy says all apps must post a privacy policy in the Play
  Console field **and** inside the app. This applies even when the app collects no data.
- **Why it matters:** This is a common reason Play review rejects an app or issues a policy
  warning. It would surface at step 15 or 16, after the UX round-2 gate, and force a UI
  change late.
- **Required fix:**
  1. mobile-product-manager adds acceptance criterion **M11.4a**: "A 'Privacy policy' item
     is reachable from the title screen (e.g. in Settings) in ≤ 2 taps. It shows the same
     text as the hosted policy, works in airplane mode, and back returns to where it was
     opened."
  2. mobile-solution-architect specifies the mechanism in §8.6/§7.4:
     - Show the **bundled** `privacy.html`. It is in `public/`, so Vite copies it into
       `dist-android/` and it is served from `https://localhost/privacy.html`.
     - Show it in an Android shell overlay (e.g. a same-origin iframe or a static text
       panel). It needs no network and no new plugin. Opening it must not reload the
       WebView mid-run; it is only reachable from TITLE.
     - Do **not** add `@capacitor/browser` or `app-launcher`, and do not rely on an external
       browser intent (that needs `<queries>` on API 30+).
     - Add the item to the §5.4 `data-action` list and to the M5 back table ("Privacy
       overlay → close").
  3. mobile-technical-writer (step 13) owns the final `public/privacy.html` text. Until
     then, step 7 uses a placeholder. Pass 2 checks that the bundled copy matches the
     hosted URL.
- **Verification note:** this session had no web access. The policy wording is from
  Google Play's User Data policy ("Privacy Policy" section) as I know it. The release
  engineer re-confirms it against the Policy Center at step 15. The fix costs almost
  nothing either way.
- **Owners:** mobile-product-manager (PRD AC), then mobile-solution-architect (architecture).
  mobile-ui-ux-designer confirms placement at round 2.

### [MEDIUM] M1 — "App works without INTERNET" is an unverified assumption, and CI cannot detect it
- **Where:** mobile-architecture.md §7.3 bullet 1 ("Capacitor loads bundled assets
  through a local request interceptor, not a socket, so the app works without it");
  M-ADR-0007 Decision/Manifest.
- **Issue:** Without INTERNET, Android WebView defaults `WebSettings.blockNetworkLoads` to
  true. Capacitor serves `https://localhost` via `shouldInterceptRequest`, which should
  bypass that block, but the architecture states this as fact without evidence. It also
  depends on the WebView version: the oldest API 24 images ship old WebViews. The
  `errorPath` page (M1.4) goes through the same path. The CI `mobile-e2e` job runs desktop
  Chromium, not Android WebView, so a blank-screen regression would pass CI.
- **Required fix:**
  - Step 7: cold-start the debug build on an API 24 image and an API 36 image, with
    INTERNET removed. Record in `docs/mobile/tooling-setup-log.md` or the code-review
    evidence that:
    - title renders
    - `webview-update.html` renders when forced
    - Settings/help work
  - Architect adds a documented fallback in §7.3 in case this fails: keep INTERNET, add an
    android-mode CSP `connect-src 'none'` that is tested against Capacitor's injected bridge
    script, and keep the M11.1 no-request Playwright check. The Data safety answer is
    unchanged (a permission is not data collection). A fallback needs a security
    re-review.
  - Lead tester adds "cold start with no INTERNET on API 24 + 36" to device-matrix.md.
- **Owners:** mobile-solution-architect (fallback text); mobile-junior-developer
  (verification); mobile-lead-tester (matrix row).

### [MEDIUM] M2 — Signing-key handling has no binding contract, and the repo sits in a OneDrive-synced folder
- **Where:** mobile-architecture.md §3 (ignore list, line 150/159-160), §14 "Signing
  keys…never in the repo"; M-ADR-0008 Decision 2; PRD-mobile OQ-M12. Repo path
  `C:\Users\aaron\OneDrive\Documents\GitHub\...`.
- **Issue:** The ignore list and "no signing in CI" are correct. But nothing says how
  `android/app/build.gradle` (a committed, hand-edited file) will get its release
  `signingConfig`. The common failure is `storePassword`/`keyPassword` literals in
  `build.gradle` or in the committed `android/gradle.properties`. Also, `.gitignore`
  protects git only. A keystore or `keystore.properties` saved anywhere inside this repo is
  still uploaded to OneDrive cloud storage.
- **Required fix:** add a §7.5 "Release signing contract" to the architecture:
  - `signingConfigs.release` reads `storeFile`/`storePassword`/`keyAlias`/`keyPassword`
    from a properties file whose path comes from an env var or from
    `~/.gradle/gradle.properties`. That file lives **outside the repo and outside any
    OneDrive-synced folder** (e.g. `C:\Users\aaron\.android-signing\vvs\`).
  - If the properties are absent, the release build fails clearly. It never falls back to
    the debug key.
  - Never put signing values in `android/gradle.properties`, `app/build.gradle`,
    `capacitor.config.ts`, or CI secrets. OQ-M12 (a): upload key only; backup goes in the
    owner's password manager.
  - Extend the planned `.gitignore` lines with: `*.p12`, `*.pepk`, `key.properties`,
    `signing.properties`, `android/app/release/`, `.env`, `.env.*`.
  - The current `scaffold/.gitignore` has only 5 lines. All planned Android entries must
    land **before or in the same commit as** `npx cap add android`.
  - Add a CI step to the `build` job that fails if `git ls-files` matches
    `\.(jks|keystore|p12|pepk)$|keystore\.properties|key\.properties`, or if any tracked
    `*.gradle`/`gradle.properties` contains `storePassword` or `keyPassword`.
- **Owners:** mobile-solution-architect (contract); mobile-junior-developer (gitignore + CI
  step); mobile-release-engineer (applies it at step 15).

### [MEDIUM] M3 — CI token scope: new build jobs would inherit `pages: write` + `id-token: write`
- **Where:** .github/workflows/deploy-pages.yml:24-27 (top-level `permissions`);
  mobile-architecture.md §10 items 2-3; M-ADR-0008.
- **Issue:** Permissions are granted at workflow level, so the new `android-build` and
  `mobile-e2e` jobs would run with an OIDC-token and Pages-write grant. Those jobs run a
  much larger third-party toolchain:
  - Capacitor npm packages
  - AGP and Gradle plugins from Maven
  - Playwright's browser download

  A compromised dependency could use those grants to publish to the Pages site.
- **Required fix:**
  - §10 specifies top-level `permissions: { contents: read }`, with `pages: write` and
    `id-token: write` only on the `deploy` job.
  - If the recommended PR trigger is adopted, use `pull_request`, never
    `pull_request_target`.
  - Add `npm audit --omit=dev --audit-level=high` to the `build` job (carried forward from
    the web v2-update review). Capacitor adds the first runtime dependencies.
- **Owners:** mobile-solution-architect (spec); mobile-junior-developer (implementation).

### [MEDIUM] M4 — Permission and hardening checks run only on the debug APK
- **Where:** mobile-architecture.md §10 item 2 (`aapt2 dump permissions` on
  `app-debug.apk`); §7.3.
- **Issue:** The merged manifest of the release variant can differ from the debug one:
  - release-only dependencies
  - `android:debuggable` handling
  - manifest placeholders

  The shipped artifact is the AAB, and it is never checked.
- **Required fix:**
  - §10/§14: step 15 runs `bundletool dump manifest` on the signed release AAB, with
    the same allowlist script, and fails if:
    - any permission is outside the allowlist
    - `android:debuggable="true"` is present
    - `usesCleartextTraffic` is not `false`
    - `allowBackup` is not `false`
    - any exported component other than MainActivity's launcher is present
  - Optionally, CI also runs an unsigned `bundleRelease` for the same check.
  - Record the output in `docs/mobile/release/submission-checklist.md`.
- **Owners:** mobile-solution-architect (spec); mobile-release-engineer (execution).

### [MEDIUM] M5 — Play IP: "Sentinels" is a Marvel (X-Men) robot name; the IP scan missed it — OWNER QUESTION
- **Where:** App label / store title "Vanguard vs. Sentinels" (mobile-architecture.md §7.1,
  PRD-mobile M9.1); play-store-research.md §3/§4 (checked only Play name collisions, not
  Marvel's catalog); PRD NFR-10.
- **Issue:** In Marvel's X-Men, the Sentinels are well-known giant robot antagonists. The
  game started as a Captain America theme and has a shield-throwing hero. Together, the name
  and hero are the "trademark-adjacent motif" combination NFR-10 prohibits. Play does not
  police this proactively, but a rightsholder complaint can remove the app or add a strike
  to the account. The title can change after launch; the app ID cannot.
- **Required fix:** mobile-product-manager raises OQ-S1 with the owner (options below).
  Whichever option is chosen, pass 2 checks that:
  - the enemy art is not a giant purple/magenta humanoid robot
  - the listing and screenshots never use "mutant", X-Men-style iconography, red/white/blue,
    or star motifs
  - mobile-marketing-analyst adds a Marvel-catalog check to §4
- **Owner:** mobile-product-manager (owner question); mobile-marketing-analyst (IP scan).

### [LOW] L1 — Remove the Capacitor template's unused FileProvider
- **Where:** mobile-architecture.md §7.3 (not mentioned); the template `AndroidManifest.xml`
  `<provider android:name="androidx.core.content.FileProvider">` and
  `res/xml/file_paths.xml` (`external-path path="."`, `cache-path path="."`).
- **Issue:** None of the allowed plugins (App, SplashScreen, GameShell) use it. Its broad
  path grants are dead attack surface and are flagged by pre-launch and security scanners.
- **Fix:**
  - Delete the provider element and `file_paths.xml`.
  - §7.3 states "the only exported component is MainActivity (launcher); no deep-link or
    custom-scheme intent filters".
- **Owner:** mobile-solution-architect / mobile-junior-developer.

### [LOW] L2 — Source maps ship inside the APK
- **Where:** vite.config.ts:17 `sourcemap: true`, which is inherited by the planned android
  mode (§3.1).
- **Fix:** `sourcemap: mode !== 'android'`. This keeps web behavior identical (C3), removes
  `.map` files from `dist-android`/APK, and reduces size.
- **Owner:** mobile-junior-developer.

### [LOW] L3 — Live-reload / `server.url` guard
- **Where:** mobile-architecture.md §7.2; generated
  `android/app/src/main/assets/capacitor.config.json`.
- **Issue:** The committed config correctly has no `server.url` or `cleartext`. But
  `npx cap run --live-reload` writes `server.url` into the generated JSON, and a release
  could be built from those stale assets. With INTERNET removed it would fail visibly
  rather than silently, so this is LOW.
- **Fix:**
  - The `android-build` CI step fails if the generated `capacitor.config.json` or
    `capacitor.config.ts` contains `"url"` under `server` or `cleartext: true`.
  - The release runbook requires a fresh `npm run android:sync` immediately before
    `bundleRelease`.
- **Owner:** mobile-junior-developer; mobile-technical-writer (runbook).

### [LOW] L4 — Test hook and shell overlays must carry the web binding constraints forward
- **Where:** mobile-architecture.md §10 item 3 (`window.__vvsTest`), §8.6 (HelpOverlay,
  SettingsPanel, RotatePrompt), §9.2 (`vvs:settings`).
- **Fix, stated as binding step-7 constraints:**
  - **(a) Test hook:**
    - `__vvsTest` exposes a read-only snapshot only: no setters, no GameCommands.
    - Its gate is evaluated once at boot.
    - It is absent when `Capacitor.isNativePlatform()` is true. Lead dev verifies.
  - **(b) New DOM:** all new overlay DOM goes through `src/ui/dom.ts` helpers /
    `textContent`, never `innerHTML` (web constraint 2).
  - **(c) Settings validation:** `vvs:settings` validation reads only the known fields and
    never spreads, merges or `Object.assign`s the parsed object. An own `__proto__` key
    would otherwise change the target's prototype.
- **Owner:** mobile-junior-developer; mobile-lead-developer checks.

### [LOW] L5 — Supply-chain pinning
- **Where:** package.json:22 (`jsdom ^24.1.3`, carried forward from the web review);
  deploy-pages.yml and §10 (actions pinned by tag, e.g. `gradle/actions/setup-gradle@v4`).
- **Fix:**
  - Pin `jsdom` exactly.
  - Pin third-party actions (`gradle/actions`, `actions/setup-java`) to commit SHAs.
  - Keep Gradle wrapper validation on (setup-gradle's default).
- **Owner:** mobile-junior-developer.

### [LOW] L6 — targetSdk 36 not live-verified
- **Where:** mobile-architecture.md §7.1; M-ADR-0007.
- **Status:** The architect disclosed this correctly. I also had no web access.
- **Fix:** Release engineer confirms against Play Console Help at step 15 (already in
  M1.2/MR10). No action now.

---

## Checklist disposition

| Item | Result |
|---|---|
| Permissions planned | None. INTERNET is removed with `tools:node="remove"`. Only the signature-level AndroidX `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` is allowed, enforced by CI allowlist. Keep-awake uses a window flag, not WAKE_LOCK. **Good.** (M1 verification, M4 release check.) |
| Data stored / leaves device | `vvs:best` (int), `vvs:settings` (2 booleans), `vvs:metrics` (existing anonymous counters). All in private app storage. `allowBackup=false` plus data-extraction rules exclude everything. No network. **Good.** |
| Input validation on stored data | Fail-closed validation specified with test inputs (§9.2). Matches web constraint 1. **Good** (see L4c). |
| Plugins allowed | Closed list: core, android, cli (dev), app, splash-screen, first-party GameShell. Explicit exclusions; `@capacitor/preferences` needs an owner exception (OQ-A1). **Good.** |
| Analytics / ads / crash SDKs | None (M11.5). **Good.** |
| Data safety expected answer | "No data collected, no data shared." Consistent with the design. Crash/ANR data in Android vitals is collected by Google Play, not by the app, and is not declared. **Consistent.** Final check in pass 2. |
| Privacy policy | URL in listing is planned. **In-app access missing: H1.** |
| targetSdk / minSdk | 36 / 24; re-verify at step 15 (L6). |
| Release debuggable / WebView debugging | Capacitor default (debuggable builds only); `loggingBehavior 'debug'`. Verify on the AAB (M4). |
| Cleartext / mixed content / server.url | `usesCleartextTraffic=false`, `allowMixedContent=false`, no `server.url`. Guard in L3. |
| Keystore / passwords in repo | Ignore list planned but not yet in `.gitignore`. Signing contract missing: **M2.** |
| CI | Single workflow, web purity check, deploy blocked by Android breaks. Token scope: **M3.** |
| Content rating / audience | IARC answers per M11.6. Target audience 13+ (OQ-M13 still pending, before step 12). Pass 2 also checks the Console question "could the listing unintentionally appeal to children". |
| IP | Plain blue circle shield, original art (M9.3). **Name: M5 / OQ-S1.** |
| .aab + Play App Signing, closed test | Planned (OQ-M12 (a), MG7: 12 testers × 14 days). Pass 2 / step 15. |
| CSP | Not applicable as a finding. No network, no untrusted input, and Capacitor injects an inline bridge script. Only needed under the M1 fallback. |

## Required for re-review (pass 1b)
- The amended PRD-mobile M11.4a.
- An architecture revision (mobile-architecture.md §7.3/§7.5/§8.6/§10 and M-ADR-0007/0008)
  that closes H1 and M1-M4.
- A mobile-product-manager record of the OQ-S1 owner decision.

L1-L6 may be closed during step 7 and are re-checked in pass 2.

## Owner question (via mobile-product-manager)
**OQ-S1 — "Sentinels" and Marvel's X-Men Sentinels.**
- **(a) Keep the name (recommended).** Add binding constraints:
  - enemy art is not purple/magenta giant humanoids
  - the listing never uses "mutant" or X-Men-style imagery
  - the IP scan is updated

  Cost: none now; residual complaint risk is low to moderate.
- **(b) Rename the enemies before the first Play upload.** This changes shared game rules
  (docs/PRD.md NFR-10 names), so both pipelines' gates must re-run, plus the listing and the
  app label. It removes the risk.
