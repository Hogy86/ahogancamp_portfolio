# Mobile Solution Architecture — Shield vs Robots (Android, Capacitor)

**Stage:** Mobile Pipeline Step 4 — mobile-solution-architect
**Date:** 2026-09-25 (v1); revised 2026-09-25 (v1.1); amended 2026-09-25 (v1.2, Amendment A8); amended 2026-09-26 (v1.3, Amendment A9); amended 2026-09-27 (v1.4, Amendment A10); amended 2026-09-27 (v1.5, Amendment A11); amended 2026-09-28 (v1.6, Amendment A12)
**Status:** v1.6. v1.1 was revised after the security pass-1 FAIL (`docs/mobile/security/review-v1.md`)
and re-reviewed in pass 1b (`docs/mobile/security/review-v1b.md`: PASS, conditional). v1.2
adds **Amendment A8**, which closes pass-1b findings N1-N4 and the N5 `allowNavigation` note
(Conditions C2 and C3). v1.3 adds **Amendment A9**, which records the S1 template carve-out
and new secret-check rule S6 from review-v1b **Addendum 1** (triggered by code-review-round1
C3), and the build-outside-OneDrive note from code-review-round1 **I1**. v1.4 adds
**Amendment A10**, which records the API-level split of the theme's cutout mode (triggered by
validation-report-round2 **F1**, an API 28 launch crash; closes code-review-round7 **M1**),
the three-folder `styles.xml` parity rule (code-review-round7 **L3**), the
`scripts/check-android-styles.mjs` guard, and the owner's rename to "Shield vs Robots" /
`io.github.hogy86.shieldvsrobots`. v1.5 adds **Amendment A11**, which answers PRD-mobile
v1.5 **M2.10a** (too-small window, any shape) with the exact size-floor formula, its
precedence against M2.10's portrait rule, and the prompt behavior (§6.2.1). v1.6 adds
**Amendment A12**, which answers PRD-mobile v1.6 **M2.3b** (the playfield may extend under
the top/bottom system-gesture bands; triggered by code-review-round8 **E1**, real insets
measured on the Pixel 7 AVD). With A12:
- GameShell reports the top and bottom display-cutout insets separately.
- Only cutouts limit the playfield's height.
- All playfield text stays inside the full insets.
- The floor, the worked profiles and the headroom are restated with measured insets, on
  both axes.
- Round-8 **I1** (where RotatePrompt lives) and **I3** (keyboard input under the prompt,
  now gated) are closed.

All earlier decisions are kept unless an **Amendment** note says otherwise. See the §16
amendment log.
**Mobile ADRs:** `docs/mobile/architecture/adr/0001..0012-*.md` (0009-0012 are new in
v1.1). To keep them apart from the website ADRs (`docs/architecture/adr/0001..0005`), this
document calls mobile ADRs **M-ADR-000N** and website ADRs **W-ADR-000N**.

**Naming [A10, 2026-09-27].** The product was renamed "Shield vs Robots" (hero "ShieldMan",
enemies "robots") by owner decisions OQ-S1 (b) and OQ-S1a (`docs/mobile/PRD-mobile.md`
v1.3/v1.4 §7; `docs/PRD-addendum-v4.md` F22). The product name, app label and
applicationId in this document are updated (title, §1, §7.1, §7.2). Where the text below
names the hero "Vanguard" (e.g. §5.2, §6.3), read "ShieldMan". Internal identifiers stay as
they are, per F22 AC12-AC13: the `vvs:*` storage keys, `VVS_SIGNING_PROPERTIES`,
`vvsSigningProperties`, `vvsCiUnsignedRelease`, the `...\.android-signing\vvs\` folder and
`window.__vvsTest`.

**Sources (upstream):**
- `docs/mobile/PRD-mobile.md` (Draft v1.1: M0-M12, owner decisions OQ-M1..OQ-M10 in §7, amendment log §9). v1.1 of this doc also relies on criterion **M11.4a**, which mobile-product-manager is adding in parallel.
- `docs/PRD-addendum-v3.md` (F20 saved best score, AC1-AC15; open owner question Q-v3-1)
- `docs/mobile/ux/design-review-round1.md` (F1-F4, N1-N3) and `docs/mobile/ux/design-review-round2.md` (PASS; six carry-forward checks, answered in §13)
- `docs/mobile/ux/store-assets-spec.md` (icon, splash, screenshot constraints)
- `docs/mobile/security/review-v1.md` (FAIL: H1, M1-M5, L1-L6; answered in v1.1, see §16)
- **[v1.2]** `docs/mobile/security/review-v1b.md` (PASS, conditional: C1-C3; new findings N1-N5; answered by A8, see §16)
- **[v1.3]** `docs/mobile/security/review-v1b.md` **Addendum 1** (2026-09-26: S1 template carve-out + S6; answered by A9, see §7.5.3 and §16)
- **[v1.3]** `docs/mobile/reviews/code-review-round1.md` (C3 triggered Addendum 1; **I1** build location outside OneDrive; answered by A9, see §3 and §14)
- **[v1.4]** `docs/mobile/tests/validation-report-round2.md` **F1** (API 28 crash on launch: `UnsupportedOperationException: Unknown windowLayoutInDisplayCutoutMode: 3`) and `docs/mobile/reviews/code-review-round7.md` **M1** (§6.6 edited in place without an amendment), **L1-L3** (guard gaps and three-folder parity) and **I1-I3** (evidence notes); answered by A10, see §6.6 and §16
- **[v1.4]** `docs/PRD-addendum-v4.md` **F22** (rename; AC12-AC13 internal identifiers and storage keys unchanged) and `docs/mobile/PRD-mobile.md` v1.3/v1.4 (OQ-S1 (b), OQ-S1a; app ID placeholder `io.github.hogy86.shieldvsrobots`; M9.1 as amended); applied by A10, see §7.1 and §16
- **[v1.5]** `docs/mobile/PRD-mobile.md` v1.5: **M2.10a** (too-small window, any shape; asks this document for the exact formula), the dated M2.13 note (windows below the floor are not M2.13 failures) and the dated M5 note (back on the M2.10a prompt leaves the app). Its triggers: `docs/mobile/tooling-setup-log.md` 2026-09-27 fold-AVD entry, `docs/mobile/tests/validation-report-round2.md` svr_api36_fold row, `docs/mobile/reviews/code-review-round7.md` **I6**. Answered by A11, see §6.2.1 and §16
- **[v1.6]** `docs/mobile/PRD-mobile.md` v1.6: **M2.3b** (the playfield may extend under the top/bottom system-gesture bands; text, controls and menus stay inside the full insets; tests (a)-(e); known width limit), the dated M2.10a and M2.12 v1.6 notes, and the §9 v1.6 follow-up list. Its trigger: `docs/mobile/reviews/code-review-round8.md` **E1** (real insets measured on `svr_api36_pixel7`: l 51.8/36.2, r 29.7, t 28.2, b 32 dp), plus **I1** (RotatePrompt location) and **I3** (keyboard under the prompt) from the same review. Answered by A12, see §6.1-§6.5, §10.1 and §16
- `docs/architecture/solution-architecture.md` and W-ADR-0001..0005 (the stack, the fixed-timestep loop and state machine, the instrumentation storage pattern)
- Code read: `src/main.ts`, `src/core/{InputManager,GameLoop,GameStateMachine,world,types}.ts`, `src/systems/WinLossSystem.ts`, `src/ui/{ScreenController,HUDView}.ts`, `src/instrumentation/Instrumentation.ts`, `src/config/constants.ts`, `src/style.css`, `index.html`, `package.json`, `vite.config.ts`, `.gitignore`, and the repo-root `.github/workflows/deploy-pages.yml`. **[v1.4]** Also `android/app/src/main/res/values{,-v28,-v30}/styles.xml`, `scripts/check-android-styles.mjs`, `capacitor.config.ts`, `android/app/build.gradle` (namespace/applicationId) and `res/values/strings.xml`. **[v1.5]** Also `src/platform/android/layout.ts` (`computeLayout`, `needsRotatePrompt`). **[v1.6]** Also `android/app/src/main/java/io/github/hogy86/shieldvsrobots/GameShellPlugin.java`, `src/platform/android/{GameShell,layout,screenFit,overlays,AndroidPlatform}.ts`, `src/platform/android/android.css`, `src/render/CanvasRenderer.ts` (canvas text positions), `src/ui/HUDView.ts` and `src/core/KeyboardInputSource.ts`.
- `.claude/CLAUDE.md` §Mobile Pipeline / §One codebase (fixed constraints)

**Fixed constraints I design within (not reopened here):** (C1) one `src/` for web and Android; game rules exist once. (C2) Android is a Capacitor wrapper with no rewrite. (C3) the website build and GitHub Pages deploy keep working unchanged for web players. (C4) `.github/workflows/deploy-pages.yml` is the single CI check for both versions.

---

## 1. Overview and component diagram

The Android app is the existing Vite/TypeScript game running in the Android System WebView
inside a Capacitor shell. The game core is unchanged in rules and structure (W-ADR-0001/0002).
Everything Android-specific sits behind one interface (`Platform`), under
`src/platform/android/`. It is selected once, in `src/main.ts`, by build mode
(M-ADR-0002).

```
 Android device
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ MainActivity (Capacitor BridgeActivity, sensorLandscape, appCategory=game)   │
 │  ├─ native plugins: @capacitor/app, @capacitor/splash-screen, GameShell (ours)│
 │  └─ WebView  https://localhost/  (assets from dist-android, no network)       │
 │      ┌──────────────────────────────────────────────────────────────────────┐ │
 │      │ src/main.ts  (composition root; the ONLY place that picks a platform)│ │
 │      │   │                                                                   │ │
 │      │   ├── SHARED (same code for web & Android) ────────────────────────┐ │ │
 │      │   │  InputManager ◄── KeyboardInputSource (web + Chromebooks)       │ │ │
 │      │   │       ▲      ◄── TouchInputSource  (registered by Android only) │ │ │
 │      │   │  GameStateMachine: dispatch table + GameCommands (all state      │ │ │
 │      │   │       transitions, handleBack, pauseForInterruption)            │ │ │
 │      │   │  GameLoop (fixed 1/60 s step, suspend()/resume())               │ │ │
 │      │   │  Systems, World, LevelConfig, CanvasRenderer(renderScale)       │ │ │
 │      │   │  HUDView / ScreenController (text from PlatformCopy)            │ │ │
 │      │   │  persistence/: safeStorage, bestScore (F20)                    │ │ │
 │      │   └─────────────────────────────────────────────────────────────────┘ │ │
 │      │   └── src/platform/android/  (Android-only; the platform boundary)    │ │
 │      │        TouchControls + moveZone classifier  (touch input)            │ │
 │      │        layout + screenFit                   (screen fitting)          │ │
 │      │        backButton                           (back)                    │ │
 │      │        lifecycle                            (pause/resume/focus/resize)│ │
 │      │        HelpOverlay, SettingsPanel, PrivacyOverlay [v1.1],             │ │
 │      │        RotatePrompt, settings store                                   │ │
 │      └──────────────────────────────────────────────────────────────────────┘ │
 └──────────────────────────────────────────────────────────────────────────────┘
 Website: same src/, built in default mode → WebPlatform (keyboard only, 800×600 fixed,
 no Capacitor code in the bundle).
```

### Component responsibilities (new or changed)

| Component | Where | Responsibility | Traces to |
|---|---|---|---|
| `Platform` interface + `PlatformCopy` | `src/platform/Platform.ts` (shared, types only) | Contract between the shared game and a platform. See §4. | C1; M-ADR-0002 |
| `WebPlatform` | `src/platform/web/WebPlatform.ts` | Today's behavior: keyboard only, `window.close()` quit with F6 AC9 fallback, current web copy. Adds the F20 AC4(e) "page hidden" best-score save trigger. | C3; M3.12; F20 AC4(e) |
| `AndroidPlatform` | `src/platform/android/*` | Touch input, screen fitting, back, lifecycle, help/settings/privacy overlays, keep-awake. | PRD-mobile §0 rule 2 |
| `PrivacyOverlay` **[v1.1]** | `src/platform/android/PrivacyOverlay.ts` | Shows the bundled `/privacy.html` in a sandboxed same-origin iframe. Opened from Settings; closed by Close or back. | M11.4a; review-v1 H1; M-ADR-0009 |
| `InputManager` (refactored) | `src/core/InputManager.ts` | Merges any number of `InputSource`s into one `InputSnapshot`. Applies opposing-cancel once, after the merge. | F1 AC5; M3.4; M-ADR-0003 |
| `KeyboardInputSource` | `src/core/KeyboardInputSource.ts` | Today's keyboard code moved, unchanged. | F1, F2, F6; M3.10 |
| `GameCommands` | `src/core/GameStateMachine.ts` | Named state-transition functions used by keyboard dispatch AND touch/back/lifecycle. There is one implementation of every transition. | W-ADR-0002 decision 2; M4, M5, M6 |
| `GameLoop` (changed) | `src/core/GameLoop.ts` | Takes an injected `InputManager`. Adds `suspend()`/`resume()` so no time is caught up after background. Reports steps run per frame. | M4.2, M10.2, M10.6 |
| `CanvasRenderer` (changed) | `src/render/CanvasRenderer.ts` | Draws in 800×600 logical units under a `renderScale` transform. Web passes 1, so web is unchanged. | M2.2, M2.8 |
| `ScreenController` (changed) | `src/ui/ScreenController.ts` | Text and title actions come from `PlatformCopy`. Items carry `data-action`. Re-renders only when its view key changes (required for taps, §5.4). | M3.8, M6.1, M8.3 |
| `bestScore` | `src/persistence/bestScore.ts` | The single F20 implementation: validate, load, commit max, "New best!". | F20 AC1-AC15; M7.1, M7.2, M7.5 |
| `safeStorage` | `src/persistence/safeStorage.ts` | Fail-closed `localStorage` get/set with in-memory fallback. | F20 AC9-AC10; M7.5 |
| `GameShell` native plugin (ours) | `android/app/src/main/java/io/github/hogy86/shieldvsrobots/GameShellPlugin.java` **[A10]** (v1.3 path segment was `vanguardvssentinels`; the Java package follows the renamed namespace) | Live edge insets (cutout + system gestures), immersive mode, keep-screen-on, window-focus events. **[A12]** Also reports the top and bottom display-cutout insets as separate fields (§6.1 A12). | M2.3a, M2.3b, M2.5, M4.1, M4.5; M-ADR-0004 |

---

## 2. Tool stack

| Layer | Choice | Version policy | ADR |
|---|---|---|---|
| Game | TypeScript + Canvas 2D + DOM HUD, Vite, zero runtime framework | Unchanged from W-ADR-0001 | W-ADR-0001 |
| Wrapper | Capacitor (current major at project creation, expected 8.x) | Exact versions pinned in `package.json` + lockfile, recorded by mobile-it-analyst in `docs/mobile/tooling-setup-log.md` | M-ADR-0001 (fixed constraint C2) |
| Native build | Gradle + Android Gradle Plugin from the Capacitor template; JDK 21 | As required by the installed Capacitor major | M-ADR-0001 |
| Phone-emulation tests | Playwright (Chromium, mobile emulation, touch) | Pinned devDependency | M-ADR-0008 |
| Unit tests | Vitest (existing) | Unchanged | — |

The tool-stack criteria (familiarity, scale, licensing, hosting, ecosystem, operational cost,
long-term support) are applied in M-ADR-0001. Summary: Capacitor is MIT-licensed, keeps the
existing TypeScript skills, and needs no server. It is maintained by Ionic on a yearly
major-version cycle that tracks Play's target-API requirement. Its only operational cost is
one Capacitor major upgrade per year to stay on Play's required target API.

### 2.1 Allowed Capacitor plugins (closed list)

| Package | Why | PRD |
|---|---|---|
| `@capacitor/core`, `@capacitor/android` | The wrapper itself | C2 |
| `@capacitor/cli` (devDependency) | `cap sync` | M0.1 |
| `@capacitor/app` | `backButton`, `pause`/`resume`, `exitApp()`, `minimizeApp()` | M4, M5, M6 |
| `@capacitor/splash-screen` | Keeps the Android 12+ splash up until the first game frame is drawn (`launchAutoHide: false`, `hide()` after frame 1) | M9.4 |
| **GameShell** (first-party local plugin, lives in `android/`, no npm package) | Live cutout + gesture insets, immersive mode, keep-screen-on, window-focus events | M2.3a, M2.5, M4.1, M4.5 |

**Not allowed without a new ADR and a security re-review:** any other plugin, including
community plugins, `@capacitor/preferences` (a contingency only, see §9.4 and M-ADR-0006),
`@capacitor/status-bar`, `@capacitor/haptics`, `@capacitor/network`, `@capacitor/device`, any
Firebase, ads, billing, analytics or crash-reporting SDK (M11.3, M11.5), and Cordova plugins.
I chose one small first-party plugin over three community plugins because this keeps
third-party native code at zero, and each function is about 10 lines against stable
AndroidX APIs (M-ADR-0004).

> **Amendment A1 (2026-09-25, v1.1; review-v1 H1):** the in-app privacy policy adds **no**
> plugin. `@capacitor/browser` and `@capacitor/app-launcher` are explicitly added to the
> "not allowed" list (M-ADR-0009).

---

## 3. Project layout: committed, generated, ignored (M-ADR-0001)

Everything lives under `projects/ai-ml/VibeCoding/ClaudeCode-UFOArcadeGame/scaffold/`. The
existing workflow's `paths:` filter already covers it.

```
scaffold/
├─ capacitor.config.ts          COMMITTED  hand-edited (only Capacitor config file)
├─ package.json / lockfile      COMMITTED  new scripts + deps (§3.2)
├─ vite.config.ts               COMMITTED  mode-aware base (§3.1)
├─ playwright.mobile.config.ts  COMMITTED
├─ index.html                   COMMITTED  unchanged
├─ public/webview-update.html   COMMITTED  static, no JS (M1.4, §7.4)
├─ public/privacy.html          COMMITTED  [v1.1] static, no JS; placeholder at step 7,
│                                          final text by technical writer at step 13 (§8.7)
├─ src/                         COMMITTED  shared + src/platform/{web,android}/
├─ tests/mobile-e2e/            COMMITTED  Playwright phone-emulation specs
├─ scripts/check-android-permissions.mjs   COMMITTED  (CI gate, §10) — [v1.1] renamed and
│                                          widened to check-android-manifest.mjs (§10.3)
├─ scripts/check-no-secrets.mjs            COMMITTED  [v1.1] (CI gate, §7.5.3)
├─ scripts/check-capacitor-config.mjs      COMMITTED  [v1.1] (CI gate, §14.1 L3)
├─ scripts/check-android-styles.mjs        COMMITTED  [v1.4, A10] (+ .test.mjs; CI via
│                                          `npm run test`, §6.6 A10)
├─ dist/                        IGNORED    web build (existing)
├─ dist-android/                IGNORED    Android-mode web build = Capacitor webDir
└─ android/                     native project, created ONCE by `npx cap add android`
   ├─ variables.gradle          COMMITTED  hand-edited: minSdk/compileSdk/targetSdk
   ├─ build.gradle, settings.gradle, gradle/wrapper/*, gradlew, gradlew.bat  COMMITTED
   ├─ gradle.properties         COMMITTED  [v1.1] NEVER contains signing values (§7.5)
   ├─ capacitor.settings.gradle GENERATED by cap sync, COMMITTED, never hand-edit
   ├─ app/build.gradle          COMMITTED  hand-edited: applicationId, versionCode/Name,
   │                                       [v1.1] release signing contract (§7.5)
   ├─ app/capacitor.build.gradle GENERATED by cap sync, COMMITTED, never hand-edit
   ├─ app/src/main/AndroidManifest.xml         COMMITTED  hand-edited (§7.3)
   ├─ app/src/main/java/.../MainActivity.java  COMMITTED  hand-edited (§7.3)
   ├─ app/src/main/java/.../GameShellPlugin.java COMMITTED hand-written
   ├─ app/src/main/res/**       COMMITTED  icons (adaptive + monochrome), splash, styles
   │                                       [v1.1] res/xml/file_paths.xml DELETED (§7.3, L1)
   │                                       [v1.4, A10] styles.xml exists in values/,
   │                                       values-v28/ and values-v30/, kept in parity
   │                                       (§6.6 A10). Template-owned source, not
   │                                       generated: `cap sync` does not touch it.
   ├─ app/src/main/assets/public/              GENERATED by cap sync — IGNORED, NEVER hand-edit
   ├─ app/src/main/assets/capacitor.config.json GENERATED — IGNORED
   ├─ app/src/main/assets/capacitor.plugins.json GENERATED — IGNORED
   ├─ capacitor-cordova-android-plugins/       GENERATED — IGNORED
   ├─ .gradle/, build/, app/build/, app/release/, local.properties   IGNORED
   └─ (no keystore, keystore.properties, *.jks, *.aab, *.apk — ever)   IGNORED
```

Add these lines to `scaffold/.gitignore`. The Capacitor template's `android/.gitignore`
covers most of them already, but the root file is the belt-and-braces guard:
`dist-android/`, `android/app/src/main/assets/public/`,
`android/app/src/main/assets/capacitor.config.json`,
`android/app/src/main/assets/capacitor.plugins.json`,
`android/capacitor-cordova-android-plugins/`, `android/.gradle/`, `android/build/`,
`android/app/build/`, `android/local.properties`, `*.jks`, `*.keystore`,
`keystore.properties`, `*.aab`, `*.apk`, `playwright-report/`, `test-results/`.

> **Amendment A3 (2026-09-25, v1.1; review-v1 M2):** the list above stays, and these lines
> are **added**: `*.p12`, `*.pepk`, `*.pem`, `*.idsig`, `key.properties`,
> `signing.properties`, `android/app/release/`, `.env`, `.env.*`.
> **Landing rule:** the whole extended list is committed to `scaffold/.gitignore`
> **before, or in the same commit as,** `npx cap add android`. The lead developer checks
> the commit order. After `cap add`, `git status --ignored` must show every generated path
> as ignored. Ignoring files does **not** stop OneDrive from uploading them. Signing
> material therefore never lives anywhere in this repo (§7.5).

**Rule (C1, M0.1):** only `npx cap sync android` writes web assets into `android/`. It runs
after `npm run build:android`. Anything under `assets/public` is disposable.

> **Amendment A9 (2026-09-26, v1.3; code-review-round1 I1): where Android builds run on the
> owner's machine.** Gradle cannot build inside this repo: OneDrive turns fresh build outputs
> into cloud reparse points (`Cannot snapshot … not a regular file`), and some build paths
> exceed Windows `MAX_PATH`, which also breaks `aapt2`. Therefore:
> - **Source edits happen only in the repo** (`scaffold/`). The repo is what is committed,
>   reviewed and built by CI.
> - **Android Gradle builds (`assembleDebug`, `assembleRelease`, `bundleRelease`) and
>   emulator installs run from a mirror outside OneDrive:
>   `C:\Users\aaron\dev-build\shield-vs-robots`.** The mirror is a disposable copy of
>   `scaffold/`. Refresh it from the repo before every build; never edit files in it; never
>   commit from it. Build or emulator evidence counts only if it came from a mirror refreshed
>   from the tree under review. mobile-it-analyst records the refresh command in
>   `docs/mobile/tooling-setup-log.md`.
> - The §3 rule above still holds in the mirror: `assets/public` is written only by
>   `npx cap sync android`, never by hand.
> - The §7.5 signing contract is unchanged. Signing material stays in
>   `C:\Users\aaron\.android-signing\vvs\` and is never copied into the mirror. When Gradle
>   runs in the mirror, the §7.5.2 project-root guard resolves to the mirror root.
> - CI (ubuntu) is not affected. The release runbook (step 13) states this build location
>   for step 15.

### 3.1 Two build modes, one source

| Command | Mode | Output | Base URL | Platform chosen |
|---|---|---|---|---|
| `npm run build` (unchanged) | `production` | `dist/` | `VITE_BASE_PATH` or `/` (GitHub Pages sets `/ahogancamp_portfolio/`) | `WebPlatform` |
| `npm run build:android` | `android` | `dist-android/` | always `/` (Capacitor serves from `https://localhost/`) | `AndroidPlatform` |

`vite.config.ts` becomes `defineConfig(({ mode }) => ({ ... base: mode === 'android' ? '/' :
(process.env.VITE_BASE_PATH ?? '/'), build: { outDir: mode === 'android' ? 'dist-android' :
'dist', ... } }))`. Nothing else changes, so the web output is identical (C3).

> **Amendment A7 (2026-09-25, v1.1; review-v1 L2):** one more mode-dependent value:
> `build.sourcemap: mode !== 'android'`. Web keeps source maps (identical output, C3). The
> APK ships no `.map` files.

`src/main.ts` is the only file that reads `import.meta.env.MODE`. The Android module is
loaded by a dynamic `import()` inside `if (import.meta.env.MODE === 'android')`. Vite
replaces `MODE` with a literal, so in the web build the branch and the chunk are removed.
The web bundle therefore contains no Capacitor code. CI checks this (§10). The build target
stays `es2020`, which does not support top-level `await`, so use
`loadPlatform().then(bootstrap)`.

### 3.2 package.json changes

- `dependencies` (first runtime deps; they ship only in the Android bundle):
  `@capacitor/core`, `@capacitor/android`, `@capacitor/app`, `@capacitor/splash-screen`.
- `devDependencies`: `@capacitor/cli`, `@playwright/test`. Pin exact versions, with no `^`,
  matching the existing pinning practice. **[v1.1, L5]** Also change `jsdom` from
  `^24.1.3` to an exact version.
- Scripts:
  - `"build:android": "tsc --noEmit && vite build --mode android"`
  - `"android:sync": "npm run build:android && cap sync android"`
  - `"android:debug": "npm run android:sync && cd android && gradlew assembleDebug"`. Use
    `./gradlew` on Linux/CI and `gradlew` on Windows. A small `scripts/gradle.mjs` wrapper
    is acceptable if the junior developer wants one command on both.
  - `"test:e2e:mobile": "playwright test -c playwright.mobile.config.ts"`
  - **[v1.1]** `"check:secrets": "node scripts/check-no-secrets.mjs"` (§7.5.3)

---

## 4. Platform boundary (M-ADR-0002)

**Rule:** game logic never branches on platform. Only `src/main.ts` knows which platform
it is on. Shared code receives a `Platform` object and calls it. Only four areas have
Android code: touch input, screen fitting, back, and lifecycle. Android packaging
(icon/splash/manifest) is native config, not TypeScript.

```ts
// src/platform/Platform.ts  (shared; types + interfaces only)
export interface PlatformCopy {
  controlHint: string;            // F9 AC2 / M8.3 one-line control text
  titleStartLabel: string;        // web: 'Press Enter to start'; Android: 'Start' button
  titleExtraActions: ReadonlyArray<'help' | 'settings' | 'quit'>; // web: []; Android: all three (M8.2, M6.2)
  showQuitBlockedFallback: boolean; // web: true (F6 AC9); Android: false (M6.1)
  menuHint: string | null;        // web: keyboard hint; Android: null
  gameOverActionLabel: string;    // web: 'Press Enter to start a new run'; Android: 'Play again'
}

export interface GameServices {        // injected into GameCommands (shared)
  bestScore: BestScoreStore;           // src/persistence/bestScore.ts
  quitApp(): 'closed' | 'blocked';     // web: window.close() → 'blocked'; Android: App.exitApp() → 'closed'
}

export interface PlatformContext {
  getWorld(): World;                   // read-only use by the platform layer
  input: InputManager;                 // platform registers extra InputSources
  commands: GameCommandsBound;         // GameCommands pre-bound to world + services
  loop: { suspend(): void; resume(): void };
  dom: { appRoot: HTMLElement; canvas: HTMLCanvasElement; overlayRoot: HTMLElement };
}

export interface Platform {
  readonly id: 'web' | 'android';
  readonly copy: PlatformCopy;
  readonly services: Pick<GameServices, 'quitApp'>;
  init(ctx: PlatformContext): Promise<void>; // mounts touch/fit/back/lifecycle
  onFrame(world: World): void;               // per-frame view sync (touch visibility, keep-awake)
  renderScale(): number;                     // canvas backing-store scale; web returns 1
}
```

**Enforcement (lead developer checks it, ESLint enforces it):** add to the ESLint config:
- `no-restricted-imports`: `@capacitor/*` and `**/platform/android/**` are errors everywhere
  except in `src/platform/android/**` and `src/main.ts`. Outside `src/platform/`, only
  `src/platform/Platform.ts` may be imported, and only with `import type`.
- `no-restricted-syntax` on `MetaProperty` (`import.meta`) everywhere except `src/main.ts`.
- No `navigator.userAgent` sniffing or `Capacitor.getPlatform()` outside
  `src/platform/android/**`.

**What stays shared (never duplicated):** every file in `src/core`, `src/systems`,
`src/config`, `src/render`, `src/ui`, `src/instrumentation`, `src/persistence`. The two
platforms differ only in (a) which `InputSource`s are registered, (b) the `PlatformCopy`
strings, (c) the `quitApp` service, (d) the triggers that call the shared commands, and
(e) layout/CSS. M0.3 holds: no game-rule constant is read from `Platform`.

> **Amendment A1 (2026-09-25, v1.1; H1):** the privacy overlay is another Android shell
> overlay, like Help and Settings. It is not a game state, not a `PlatformCopy` string and
> not a `titleExtraActions` entry (it lives inside Settings). So `Platform.ts` and the
> shared code are unchanged. The policy **text** is one shared file (`public/privacy.html`)
> that the website serves and the app bundles.

---

## 5. Input: keyboard and touch into one interface (M-ADR-0003)

### 5.1 Merged input

```ts
// src/core/InputManager.ts (shared)
export interface InputSource {
  sample(): { left: boolean; right: boolean; throwHeld: boolean };
  consumeEdges(simStepsRun: number): void;
}
```
- `InputManager` keeps the existing `InputSnapshot` shape. Movement is `left = any source
  left`, `right = any source right`, and then **one** opposing-cancel:
  `moveLeft = left && !right` (F1 AC5, M3.4). Two fingers on ◀ and ▶ cancel, and so does
  a finger plus a key.
- The keyboard edge intents (`escPressed`, `menu*Pressed`, `anyKeyPressed`) come only from
  `KeyboardInputSource`. Touch never fakes key presses. Touch menus, PAUSE, back and
  lifecycle call named **GameCommands** instead (§5.4).
- `GameLoop` receives the `InputManager` through its constructor instead of creating one.
  It passes the number of fixed steps run this frame to `consumeEdges`.

### 5.2 Movement: continuous per-pointer tracking over one movement zone (answers UX F4 / M3.3a)

The movement control is **one** DOM element, `#move-zone`. It covers ◀, the 8 dp gap, and ▶.
It is not two independent buttons.

1. `pointerdown` on `#move-zone` calls `setPointerCapture(pointerId)` and adds the pointer
   to `movePointers: Map<pointerId, {x, y, lastDir}>`. Pointer capture means the zone keeps
   receiving `pointermove`/`pointerup` wherever the finger goes.
2. Each `pointermove` updates that pointer's live `(x, y)`, then reclassifies it with a
   **pure function** `classifyMovePointer(pos, rects, lastDir) → {dir, lastDir}`
   (`src/platform/android/moveZone.ts`, unit-tested):
   - inside ◀'s touch rect → `dir = 'left'`, `lastDir = 'left'`
   - inside ▶'s touch rect → `dir = 'right'`, `lastDir = 'right'`
   - inside the gap rect (between the buttons, same vertical band) → `dir = lastDir`
     (the previous direction carries on, so there is no drop). If `lastDir` is `null`
     (the finger landed in the gap), `dir = 'none'`.
   - anywhere else (outward, above, below, onto the playfield) → `dir = 'none'` and
     `lastDir = null`. The pointer stays tracked, so sliding back onto ◀/▶ resumes.
   - For a pointer that is already tracked, the vertical test uses the button band expanded
     by `MOVE_TRACK_VERTICAL_SLOP_DP = 12` (named constant, hysteresis only; UX may set it
     to 0). A new `pointerdown` is always tested against the exact rects.
3. `pointerup` / `pointercancel` / `lostpointercapture` remove the pointer.
4. `TouchInputSource.sample()` returns `left = any tracked pointer dir === 'left'` and
   `right = any === 'right'`. `InputManager` applies the cancel.

How this meets the six M3.3a rules:

| M3.3a rule | Mechanism |
|---|---|
| 1 Switch ≤ 100 ms | Classification runs on every `pointermove`. The next rAF (≤ 16.7 ms at 60 Hz, ≤ 33 ms at 30 FPS) samples it, and the next fixed step moves Vanguard. Worst case ≈ 50 ms < 100 ms. |
| 2 No drop in gap | The gap rect returns `lastDir`. Pointer capture keeps events flowing across the gap. |
| 3 No stick | Direction comes only from the **current** position. The pointer's original target is never used. |
| 4 Slide off / release / land in gap | "Elsewhere" → `none` and `lastDir` cleared. Re-entering a button resumes. Up/cancel removes the pointer. Landing in the gap with `lastDir = null` → no movement. |
| 5 Other controls unaffected | Only pointers whose `pointerdown` hit `#move-zone` are ever tracked. THROW/PAUSE pointers are separate elements, so they never move Vanguard. A second finger on the other movement button gives cancel through §5.1. |
| 6 Both layouts / directions | Rects come from `computeLayout()` (§6). The classifier works in screen coordinates and does not care about sides. |

Evidence required (UX carry-forward 3c): the 40/40 scripted-swipe test (§10.2) runs in CI
and its output goes into `docs/mobile/tests/validation-report.md`. This document does not
count as proof.

### 5.3 Throw, pause, and stray gestures

- **THROW** (`<button aria-label="Throw shield">`): `pointerdown` sets `throwPointers.add(id)`
  and a **throw latch**. `throwHeld = throwPointers.size > 0 || latch`. The latch is
  cleared in `consumeEdges(stepsRun)` only when `stepsRun > 0`. This way a tap shorter than
  one frame still reaches exactly one simulation step. It is consumed there whether or not a
  shield could be thrown, so a tap during flight queues nothing (M3.5, F16 AC3). The
  not-ready state comes from `world.shields.length > 0` in `onFrame`: class `not-ready`
  (dimmed + icon swap, NFR-9).
- **PAUSE** (`<button aria-label="Pause">`, 48×48 dp touch area): `click` →
  `commands.pause()` (no-op unless `PLAYING`).
- **Stray gestures (M3.7):** `html.platform-android` sets `touch-action: none`,
  `user-select: none`, `-webkit-user-select: none`, `-webkit-touch-callout: none`,
  `overscroll-behavior: none`. A `contextmenu` listener calls `preventDefault()`. Natively,
  MainActivity sets `webView.setLongClickable(false)`, `setHapticFeedbackEnabled(false)`,
  and `setOverScrollMode(OVER_SCROLL_NEVER)`. With `width=device-width` there is no
  double-tap zoom. `index.html` is not changed.
- **Visibility (M3.9):** `onFrame` shows `#touch-layer` controls only when
  `state === 'PLAYING'`. This covers the F18 intro (visible, and inert because the intro
  gate ignores input) and the boss warning (live). Only changed classes are written.
- **Labels (M3.11):** the controls are real `<button>` elements with `aria-label`, so the
  WebView's accessibility tree exposes them to TalkBack and Play's pre-launch scanner.
- **Keyboard (M3.10):** `KeyboardInputSource` is always registered, so a hardware keyboard
  on a Chromebook works with no extra code.

### 5.4 Menus, taps and commands

All state transitions are named functions in `GameStateMachine.ts`. They are called by the
keyboard dispatch table (refactored to call them) **and** by touch, back and lifecycle.
JavaScript is single-threaded, so calling a command between frames is race-free.

| Command | Effect (existing rule) | Callers |
|---|---|---|
| `startRun()` | TITLE/GAMEOVER → PLAYING (F9 AC3, F8 AC7) | Enter; Start / Play again tap |
| `pause()` | PLAYING → PAUSED, index 0 (F6 AC1) | Esc; PAUSE tap |
| `resume()` | PAUSED → PLAYING (F6 AC3) | Esc; Resume tap |
| `selectPauseOption(i)` | set index + apply (F6 AC2/AC4/AC5) | Enter; option tap |
| `confirmRestartGame()` / `cancelRestartGame()` | F6 AC11 | Enter/Esc; Confirm/Cancel tap |
| `quit()` | commit best, then `services.quitApp()`; fallback text only if `'blocked'` (F6 AC6/AC9, F20 AC4(d), M6) | Enter on Quit; Quit tap (pause + title) |
| `victoryTap()` | first → hold, second → TITLE (F19 AC9) | any non-Esc key; tap anywhere |
| `returnToTitle()` | GAMEOVER → TITLE (new; used only by Android back, M5) | back |
| `handleBack()` | M5 table, returns `'handled' \| 'leaveApp'` (§8.3) | back |
| `pauseForInterruption()` | §8.1 | lifecycle |

`ScreenController` puts `data-action` attributes on menu items (`start`, `help`, `settings`,
`quit`, `pause-option:<i>`, `confirm`, `cancel`, `play-again`). The Android layer attaches
**one delegated `click` listener** to the stable overlay root. The web platform attaches
none, so web behavior is unchanged (OQ-M10 (a)). Today `ScreenController` clears and
rebuilds the overlay **every frame**. A touch that starts on one element and ends on its
replacement produces no `click`. So `ScreenController` must re-render only when its view
key changes (state, selected index, confirm flag, score, best, new-best, quit-fallback).
This is a shared change that is also a small performance win.

> **Amendment A1 (2026-09-25, v1.1; H1):** the Android shell overlays (Help, Settings,
> Privacy) are built by `src/platform/android/` and use the same delegated listener.
> Their `data-action` values: `help-dismiss` ("Got it"), `settings-swap`, **`privacy`**
> (Settings → open the privacy overlay), and **`overlay-close`** (Close on any shell
> overlay; it closes the topmost overlay). None of these calls a GameCommand, because the
> game state stays `TITLE`.

---

## 6. Rendering and screen fitting (M-ADR-0004)

### 6.1 Units and inputs

- WebView CSS px = Android dp (`width=device-width`). All numbers below are dp.
- **Edge insets** per edge = `max(displayCutout, systemGestures)`. They come from
  **GameShell**, which reads `WindowInsetsCompat.getInsets(WindowInsetsCompat.Type.displayCutout())`
  and `getInsets(WindowInsetsCompat.Type.systemGestures())` and divides by
  `displayMetrics.density`. They are pushed to JS by `getEdgeInsets()` at start and by an
  `edgeInsetsChanged` event whenever Android re-dispatches insets (rotation 180°,
  navigation-mode change, fold, window resize). **No constant 24 dp ships as a real
  value.** 24 dp appears only in this document's planning numbers and in the unit-test
  fixtures (UX carry-forward 2).
- System bars are hidden (immersive, §6.5), so `systemBars` insets are not added. A
  transient swipe-revealed bar overlays the screen for a moment and does not re-lay-out.

> **Amendment A12 (2026-09-28, v1.6; PRD-mobile v1.6 M2.3b; code-review-round8 E1).
> GameShell reports the top/bottom cutout insets separately.**
>
> **1. Payload.** The payload of `getEdgeInsets()` and of every `edgeInsetsChanged` event
> gains two fields. The four existing fields keep their meaning.
>
> | Field | Value (dp) | Used for |
> |---|---|---|
> | `left`, `right`, `top`, `bottom` | `max(displayCutout, systemGestures)` per edge (unchanged) | Controls, menus, prompts, `#safe-layer`, and all text over the playfield (M2.3, M2.3a, M2.3b rules 2-3) |
> | `cutoutTop` **(new)** | `getInsets(Type.displayCutout()).top / density` | The playfield's top limit only (M2.3b rule 1) |
> | `cutoutBottom` **(new)** | `getInsets(Type.displayCutout()).bottom / density` | The playfield's bottom limit only (M2.3b rule 1) |
>
> **2. Native change** (`GameShellPlugin.java`, `toEdgeInsets` and `insetsToJson`). Add the
> two values from the `cutout` `Insets` object that `toEdgeInsets` already reads. The
> `getRootWindowInsets()` fallback goes through the same function, so it reports them too.
> Nothing else changes: the same zero-size probe view, listener, `volatile` payload and
> threads, and the insets are still returned unconsumed (§6.6). There is no new method,
> permission, plugin, I/O or logging. Left and right cutout values are **not** added:
> M2.3b keeps the side rule unchanged, so nothing needs them.
>
> **3. Normalization.** One pure function, `normalizeInsets(raw) → LayoutInsets` in
> `layout.ts` (unit-tested), is applied to every payload before any other use:
> 1. **Edge fields.** A missing, non-finite or negative `left`/`right`/`top`/`bottom` →
>    0. This extends the existing L5 rule (`toFiniteOrZero`) to negatives.
> 2. **Cutout fields.**
>    - A **missing** or non-finite `cutoutTop`/`cutoutBottom` → equal to the matching edge
>      inset. This is fail-safe: a payload without the new fields (for example a stale
>      native build) lays out exactly as in v1.5, with no art in the bands.
>    - A negative value → 0.
> 3. **Raise the edges to the cutouts.** Set `top = max(top, cutoutTop)` and
>    `bottom = max(bottom, cutoutBottom)`. Then `0 ≤ cutoutTop ≤ top` and
>    `0 ≤ cutoutBottom ≤ bottom` always hold. Native already guarantees this; the rule
>    covers test fixtures.
>
> **4. Types.**
> - The payload type in `GameShell.ts` gains `cutoutTop?: number; cutoutBottom?: number`
>   (optional, as delivered).
> - `layout.ts` defines `LayoutInsets = EdgeInsets & { cutoutTop: number; cutoutBottom:
>   number }` with **required** fields. `computeLayout` and `classifyWindow` take a
>   `LayoutInsets`, so a call site cannot silently leave the cutouts out.
>
> **5. Web fallback (Playwright, §10 item 3).** `?insets=l,r,t,b` is unchanged. A new
> optional `?cutout=top,bottom` supplies the two fields:
> - It defaults to `0,0`, because a browser has no cutout.
> - A malformed value parses to 0, as for `?insets=`.
> - The web fallback **always** emits both fields, so the fail-safe default in 3.2 applies
>   only to a native payload that really lacks them.
>
> **6. Debug evidence.** `screenFit.ts` sets `--vvs-cutout-top` and `--vvs-cutout-bottom`
> (dp) on `<html>`, next to the existing `--pf-scale`. Step-10 evidence can then read the
> reported cutouts and the scale over WebView DevTools on a debug build, as round 8 did for
> the edge insets through `#safe-layer`. Nothing is logged, stored or transmitted.
>
> **7. For security pass 2.** This is A12's only native change: two numeric fields added
> to an existing, app-internal plugin payload (see §14 security handoff).

### 6.2 Layout algorithm (pure function, unit-tested)

`computeLayout({W, H}, insets{l,r,t,b}, swapControls) → Layout` in
`src/platform/android/layout.ts`:

```
g = 8 (adjacent-target gap), B = 64 (button size)
repeat for B in [64, 56]:                      // 56 only if 64 misses the 0.5× floor (M3.1)
  moveOuter = swap ? r : l ;  throwOuter = swap ? l : r
  movCol   = moveOuter + B + g + B             // ◀ gap ▶, side by side (M2.12)
  throwCol = throwOuter + B                    // THROW (PAUSE shares this column)
  availW = W − movCol − throwCol
  availH = H − t − b
  s = min(availW / 800, availH / 600)          // uniform scale, never stretched (M2.2)
  if s ≥ 0.5: break
pfW = 800·s, pfH = 600·s
pfX = movCol + (availW − pfW)/2   (mirrored when swapped)
pfY = t + (availH − pfH)/2
Buttons bottom-aligned: bottom edge at H − max(b, 16);  ◀ at x = moveOuter, ▶ at moveOuter+B+g
THROW at x = throwOuter side, same bottom row
PAUSE: 48×48 touch rect, top edge at t + 16, centred horizontally in THROW's B-wide lane
Portrait/too-small rule (M2.10): if W ≤ H or W < 640 or H < 360 → RotatePrompt (see §8.1)
                                 [A11: superseded by the §6.2.1 window classification]
```

If insets are so large that `s < 0.5` even at B = 56, the controls keep their minimum
sizes and stay outside the insets. The playfield shrinks below 0.5×, as M2.3a requires
("playfield shrinks further; controls never shrink"). `layout.ts` sets
`layout.belowFloor = true` so the debug build logs it and the device matrix can flag it.

> **Amendment A11 (2026-09-27, v1.5; PRD-mobile v1.5 M2.10a):** the paragraph above is
> superseded. A playfield below 0.5× is **never drawn**. `belowFloor = true` now means
> "this window is too small to play", and the app shows the M2.10a prompt instead
> (§6.2.1). M2.3a's "playfield shrinks further" still holds down to 0.5×; below that,
> M2.10a applies. The fixed `W < 640 or H < 360` thresholds in the last line of the block
> above are also replaced by §6.2.1, because they ignored the run-time insets that M2.10a
> requires.

> **Amendment A12 (2026-09-28, v1.6; PRD-mobile v1.6 M2.3b rules 1-2).** The playfield's
> vertical size and position change. Unchanged: the horizontal algorithm, the B = 64 → 56
> order, every control position and the A11 meaning of `belowFloor`. Replace the `availH`
> and `pfY` lines of the block above with:
>
> ```
> inputs  insets {l, r, t, b}  = max(cutout, gesture) per edge (unchanged, M2.3a)
>         cutout {cT, cB}      = top/bottom display-cutout insets (§6.1 A12; 0 ≤ cT ≤ t, 0 ≤ cB ≤ b)
> consts  TEXT_TOP_LOGICAL    = 4    // §6.5 A12: nearest playfield text to the top edge (logical px)
>         TEXT_BOTTOM_LOGICAL = 13   // §6.5 A12: nearest playfield text to the bottom edge (logical px)
>         MIN_SCALE           = 0.5  // existing
>
> // sizing (inside the B loop, replaces availH = H − t − b)
> topRes = max(cT, t − TEXT_TOP_LOGICAL·MIN_SCALE)      // = max(cT, t − 2)
> botRes = max(cB, b − TEXT_BOTTOM_LOGICAL·MIN_SCALE)   // = max(cB, b − 6.5)
> availH = H − topRes − botRes
> s = min(availW / 800, availH / 600)                   // unchanged form
>
> // placement (after B and s are chosen; replaces pfY = t + (availH − pfH)/2)
> pfH    = 600·s
> topMin = max(cT, t − TEXT_TOP_LOGICAL·s)              // highest allowed playfield top edge
> botMin = max(cB, b − TEXT_BOTTOM_LOGICAL·s)           // smallest allowed gap under the playfield
> pfY    = topMin + (H − topMin − botMin − pfH) / 2
> ```
>
> Why this is correct:
> - **No art under a cutout (rule 1).** `pfY ≥ topMin ≥ cT` and
>   `pfY + pfH ≤ H − botMin ≤ H − cB`.
> - **All text stays inside the full insets (rule 2).** The topmost text is at logical
>   y ≥ 4, which is `pfY + 4s ≥ t`. The lowest text edge is at `pfY + pfH − 13s ≤ H − b`.
> - **Always feasible.** When `s ≥ 0.5`, `4s ≥ 2` and `13s ≥ 6.5`. So `topMin ≤ topRes`,
>   `botMin ≤ botRes`, and `H − topMin − botMin − pfH ≥ availH − pfH ≥ 0`.
> - **Exact at the floor.** At s = 0.5 the sizing reserves equal the placement minimums.
>   So `availH ≥ 300` means exactly "a 0.5× playfield fits with its text inside the
>   insets", which is what §6.2.1 needs.
> - **Conservative only above the floor.** There the sizing gives up at most
>   `(4 + 13)·(s − 0.5)` dp of height (≈ 1.7 dp at s = 0.6), in exchange for a closed-form,
>   single-pass formula.
> - **Controls are unchanged.**
>   - `#safe-layer` is still inset by the full `l, r, t, b`.
>   - PAUSE's top edge stays at `t + 16`, and the bottom row stays at `H − max(b, 16)`.
>   - Nothing about the controls uses `cT` or `cB`.
>   - The playfield never shares an x range with a control column, so art in a band never
>     sits under a control (M2.4, M2.3b rule 1).
> - **Vertical position.** The playfield is centred between `topMin` and `H − botMin`, so
>   it may sit off-centre in the window, which M2.3b rule 2 allows.
> - **Horizontal is unchanged.** `pfX` stays `movCol + (availW − pfW)/2`, mirrored when
>   swapped.

#### 6.2.1 Window classification: portrait, too small, or playable [new in v1.5; A11; PRD-mobile M2.10, M2.10a, M2.12, M2.13, M3.1, M3.2]

**Inputs.** The viewport `W × H` (dp) and the **run-time** edge insets `l, r, t, b` from
GameShell (§6.1; the same values `computeLayout` receives). The first classification at
launch waits for `getEdgeInsets()`. In the Playwright web fallback, insets come from
`?insets=` (§10 item 3).

**Constants** (named in `layout.ts`, derived from the existing ones, never duplicated as
literals):

| Name | Value | From |
|---|---|---|
| `B_MIN` | 56 | M3.1: smallest allowed size for ◀, ▶, THROW |
| `g` (`CONTROL_GAP_DP`) | 8 | M3.1: adjacent targets ≥ 8 dp apart |
| `CONTROL_COLUMNS_MIN` | `3·B_MIN + g` = **176** | M2.12: movement column ◀ + gap + ▶ (120) + THROW column (56), without insets |
| `PF_MIN_W`, `PF_MIN_H` | `800·0.5` = **400**, `600·0.5` = **300** | M2.13: playfield ≥ 0.5× |
| `PAUSE_STACK_MIN` | `16 + 48 + 24 + 56` = **144**, plus `max(0, 16 − b)` | §6.2 PAUSE top margin + PAUSE (M3.2) + PAUSE-THROW gap (M3.2) + THROW; bottom margin tops up to 16 |

**Formula (binding).** Evaluate in this order:

```
1. if W ≤ H                                   → 'portrait'  (M2.10)
2. minW = l + r + CONTROL_COLUMNS_MIN + PF_MIN_W        = l + r + 576
   minH = t + b + max(PF_MIN_H, PAUSE_STACK_MIN + max(0, 16 − b))
        = t + b + 300                          (the PAUSE stack is ≤ 160, so it never binds)
   if W < minW or H < minH                     → 'tooSmall' (M2.10a)
3. otherwise                                   → 'playable' (computeLayout as in §6.2)
```

- **Same test as the layout.** Step 2 is exactly "`computeLayout` at B = 56 gives
  `s < 0.5`": with B = 56, `availW = W − l − r − 176` and `availH = H − t − b`, and
  `s = min(availW/800, availH/600) ≥ 0.5` holds exactly when `availW ≥ 400` and
  `availH ≥ 300`. The implementation must derive `tooSmall` from the same constants as
  `computeLayout` (preferably `tooSmall = computeLayout(...).belowFloor`), so the two can
  never disagree.
- **Swap does not change the floor.** `l + r` is the same whichever side holds each
  column (M3.13).
- **Shape does not matter, size does** (M2.10a). A landscape window can still be too small.
- **Nominal values.** With the planning insets (24 dp per side, 0 top, 0 bottom),
  `minW = 624` and `minH = 300`, which match the PRD's "narrower than 624 dp or shorter
  than 300 dp". With the §6.3 planning insets (bottom 24), `minH = 324`.
- **Worked checks** (M2.10a tests; they become `layout.test.ts` rows):

| Window (dp) | Insets l, r, t, b | minW / minH | Result |
|---|---|---|---|
| 640 × 360 | 24, 24, 0, 24 | 624 / 324 | playable, s = 0.52 (§6.3); M2.10a (c) |
| 600 × 360 | 24, 24, 0, 24 | 624 / 324 | **tooSmall** (600 < 624); M2.10a (c) |
| 624 × 300 | 24, 24, 0, 0 | 624 / 300 | playable, s = 0.5 exactly (boundary) |
| 623 × 300 | 24, 24, 0, 0 | 624 / 300 | **tooSmall** |
| 624 × 299 | 24, 24, 0, 0 | 624 / 300 | **tooSmall** |
| 412 × 309 (`svr_api36_fold`) | any | ≥ 576 / ≥ 300 | **tooSmall**; M2.10a (a) |
| 640 × 360 | 40, 40, 0, 24 | 656 / 324 | **tooSmall** (real insets above the 32 dp headroom, §6.3) |
| 360 × 640 | any | — | **portrait**; M2.10 |

**Precedence (M2.10a "Precedence").** Portrait is tested first, so a portrait-shaped window
always gets M2.10's text, "Rotate your device or enlarge the window to play.", even when it
is also too small. Every other window below the floor gets **"Make the window larger to
play."** Square windows (`W = H`) stay on the portrait path, as in v1.

**Where it runs.** The classification runs on every re-layout trigger in §6.5 (launch,
`resize`, `edgeInsetsChanged`, fold/unfold, split-screen or free-form changes, rotation)
and on app `resume`. It is synchronous, well under M2.9's 1 s. A Settings "Swap controls"
change cannot change the result.

**Behavior while `'portrait'` or `'tooSmall'`** (one prompt component,
`src/platform/android/RotatePrompt.ts`, showing one of the two messages; Android-only shell
text, not `PlatformCopy`, built with `textContent` per §14.1 L4b):
1. **Pause.** On entering either prompt, call `commands.pauseForInterruption()` (§8.1). A
   run goes to PAUSED; VICTORY holds; TITLE, PAUSED and GAMEOVER are unchanged (M4.1, M4.4).
   No game time passes (M4.2).
2. **Nothing else drawn.** A full-viewport layer on the game background `#05050a` covers
   the window. The message is centred inside the edge insets, meets the ≥ 12 dp floor
   (M2.6), and wraps without clipping at the largest system font (M2.11). While it shows,
   `#app-root` (canvas + HUD), `#touch-layer` and the contents of `#safe-layer` (menus and
   shell overlays) are hidden (`visibility: hidden`), **not destroyed**, so they can return
   as they were. `computeLayout` is not applied, so no playfield below 0.5× is ever drawn.
3. **No taps.** The prompt layer takes every pointer event and does nothing with it
   (M2.10a (a): 5 taps change nothing). Hidden controls receive no events.
4. **No hidden resume.** A hardware keyboard could still send Enter/Esc to the hidden
   pause menu. So while a prompt shows, `onFrame` calls `commands.pauseForInterruption()`
   whenever the state is `PLAYING`. This uses the existing shared command; no shared code
   changes.
5. **Restore.** When the classification returns `'playable'`, the prompt is removed,
   `computeLayout` is applied, and the hidden layers are shown again in the same re-layout
   (≤ 1 s, M2.9). The state is not changed: a run shows the **pause menu** and never
   resumes by itself (M4.3); title, Settings, Help, Privacy, Game Over and Game Complete
   return as they were (M4.4).
6. **Back** leaves the app (`App.minimizeApp()`), and a paused run stays paused in the
   background (M5 "Rotate your device" row as amended in PRD-mobile v1.5; M4.1, M4.6). See
   §8.3 A11 for the rule order.

**Not changed.** 640 × 360 dp stays the smallest designed profile (§6.3, §6.4). No
small-window or band layout is added (OQ-M7 (a)). Web behavior is unchanged: the web
platform does not classify windows (C3, M3.12). No game logic is involved (C1).

> **Amendment A12 (2026-09-28, v1.6; PRD-mobile v1.6 M2.3b, the M2.10a v1.6 note and the
> M2.12 v1.6 note; code-review-round8 E1 and I3).**
>
> **Inputs (amended).** The classification also takes `cT` and `cB` from the normalized
> payload (§6.1 A12). In the web fallback they come from `?cutout=`.
>
> **Restated formula (binding; replaces step 2's `minH`):**
>
> ```
> 1. if W ≤ H                                         → 'portrait'  (M2.10; unchanged)
> 2. minW = l + r + 576                                               (unchanged)
>    minH = max(cT, t − 2) + max(cB, b − 6.5) + 300                   (M2.3b)
>    if W < minW or H < minH                           → 'tooSmall' (M2.10a)
> 3. otherwise                                         → 'playable'
> ```
>
> - **`tooSmall` still equals `computeLayout(...).belowFloor`.** `classifyWindow` stays
>   "portrait test, then `belowFloor`", so the new vertical terms enter both at once. Step
>   2 is exactly "`computeLayout` at B = 56 gives s < 0.5" with the §6.2 A12 `availH`.
> - **No new literals.** `2` and `6.5` are `TEXT_TOP_LOGICAL·MIN_SCALE` and
>   `TEXT_BOTTOM_LOGICAL·MIN_SCALE`; the code derives them from those constants.
> - **The PAUSE stack still never binds.** Whenever `H ≥ minH`,
>   `H − t − b ≥ 300 − 2 − 6.5 = 291.5 > 160` (the largest PAUSE stack).
> - **Swap still does not change the result** (M3.13).
>
> **Nominal values.** Insets are written (l, r, t, b; cT, cB).
> - Planning insets (24, 24, 0, 0; 0, 0): `minW = 624`, `minH = 300`. The PRD's
>   "narrower than 624 dp or shorter than 300 dp" still holds (M2.10a v1.6 note (1)).
> - Measured gesture navigation (30, 30, 28.2, 32; 0, 0), from code-review-round8 E1:
>   `minW = 636`, `minH = 351.7`.
> - Three-button navigation (0, 48, 24, 0; 0, 0): `minW = 624`, `minH = 322`.
>
> **Worked checks (v1.6).** These become `layout.test.ts` rows, each in both swap
> settings. Where a window and insets also appear in the A11 table above, this table's
> numbers win.
>
> | # | Window (dp) | Insets (l, r, t, b; cT, cB) | minW / minH | Result | PRD |
> |---|---|---|---|---|---|
> | 1 | 640 × 360 | 30, 30, 24, 32; 0, 0 | 636 / 347.5 | playable, B 56, s = 0.505, pfY ≈ 26.77 | M2.3b (a) |
> | 2 | 640 × 360 | 30, 30, 28.2, 32; 0, 0 | 636 / 351.7 | playable, B 56, s = 0.505, pfY ≈ 28.87 | M2.3b (a); M2.10a (c) v1.6 |
> | 3 | 640 × 360 | 29.7, 29.7, 28.2, 32; 0, 0 | 635.4 / 351.7 | playable, B 56, s ≈ 0.5058, pfY ≈ 28.65 | M2.3b (a), round-8 measured |
> | 4 | 640 × 360 | 0, 48, 24, 0; 0, 0 | 624 / 322 | playable, B 56, s = 0.52, pfY ≈ 34.96 | M2.3b (b) |
> | 5 | 640 × 360 | 48, 0, 24, 0; 0, 0 | 624 / 322 | playable, B 56, s = 0.52, pfY ≈ 34.96 | M2.3b (b) |
> | 6 | 640 × 360 | 30, 30, 30, 32; 30, 0 | 636 / 355.5 | playable, s = 0.505, pfY ≈ 30.78 (≥ 30) | M2.3b (d) top |
> | 7 | 640 × 360 | 30, 30, 24, 32; 0, 32 | 636 / 354 | playable, s = 0.505, playfield bottom ≈ 326.49 (≤ 328) | M2.3b (d) bottom |
> | 8 | 600 × 360 | 30, 30, 28.2, 32; 0, 0 | 636 / 351.7 | **tooSmall** (600 < 636) | M2.10a (c) v1.6 |
> | 9 | 640 × 360 | 36.2, 29.7, 28.2, 32; 0, 0 | 641.9 / 351.7 | **tooSmall** on width (l + r ≈ 66 > 64): the expected result under the M2.3b known limit (§12 MR4), not an M2.10a (c) failure | M2.10a v1.6 note (2) |
> | 10 | 915 × 412 | 51.8, 29.7, 28.2, 32; 0, 0 | 657.5 / 351.7 | playable, B 64, s ≈ 0.6005 (height binds) | round-8 Pixel 7 native window |
> | 11 | 636 × 351.5 | 30, 30, 28, 32; 0, 0 | 636 / 351.5 | playable, s = 0.5 exactly (boundary) | M2.10a |
> | 12 | 635 × 351.5 | 30, 30, 28, 32; 0, 0 | 636 / 351.5 | **tooSmall** | M2.10a |
> | 13 | 636 × 351 | 30, 30, 28, 32; 0, 0 | 636 / 351.5 | **tooSmall** | M2.10a |
> | 14 | 640 × 352 | 30, 30, 28, 32; 0, 0 | 636 / 351.5 | playable, s ≈ 0.5008 (height binds; the v1.5 formula said tooSmall) | M2.3b |
> | 15 | 624 × 300 / 623 × 300 / 624 × 299 | 24, 24, 0, 0; 0, 0 | 624 / 300 | playable (s = 0.5) / **tooSmall** / **tooSmall** (unchanged) | M2.10a |
> | 16 | 640 × 360 | 24, 24, 0, 24; 0, 0 | 624 / 317.5 | playable, s = 0.52 (the A11 table had minH 324) | §6.3 planning |
> | 17 | 640 × 360 | 40, 40, 0, 24; 0, 0 | 656 / 317.5 | **tooSmall** on width (unchanged) | MR4 |
> | 18 | 412 × 309 (`svr_api36_fold`) | any | ≥ 576 / — | **tooSmall** | M2.10a (a) |
> | 19 | 360 × 640 | any | — | **portrait** | M2.10 |
> | 20 | 640 × 360 | 30, 30, 28.2, 32; cutout fields **absent** (normalized to cT = 28.2, cB = 32) | 636 / 360.2 | **tooSmall**. The fail-safe default reproduces v1.5, which shows the native fields are needed | §6.1 A12 |
>
> Rows 11-14 use values that are exact in binary floating point (multiples of 0.5), so
> `s = 0.5` compares exactly. The other rows use `toBeCloseTo(…, 3)`.
>
> **Behavior 2, clarified (code-review-round8 I1).** The "full-viewport layer" is a
> `<body>`-level fixed element, not a child of `#safe-layer`; see §6.5 A12.
>
> **Behavior 4, amended (code-review-round8 I3): keyboard input is gated while a prompt
> shows.** Decision: close both I3 gaps, entirely inside `src/platform/android/`, with no
> shared-code change.
> - **Mechanism.** `overlays.ts` already has a capture-phase `document` `keydown` listener
>   that stops game keys reaching the shared `KeyboardInputSource` while a shell overlay
>   is open. That listener now checks the prompt **first**:
>   - While `isRotatePromptShowing()`, every `keydown` gets `preventDefault()` and
>     `stopPropagation()`, and nothing else happens.
>   - Esc does **not** close a hidden overlay. This is the same order as back (§8.3 A11).
>   - `preventDefault()` also stops a focused `<button>` from being activated by
>     Enter/Space.
>   - `keyup` is **not** blocked, so a key held before the prompt still releases normally
>     and never sticks.
> - **Focus.** On entering a prompt, if `document.activeElement` is inside `#app-root` or
>   `#safe-layer` (including the privacy iframe), call `.blur()` on it.
> - **Effect.**
>   - Enter on a hidden title cannot start a run.
>   - Esc or Enter on a hidden pause menu cannot resume it, so **no** frame of play passes
>     (the ≈ 16 ms, up to 0.25 s, window that I3 describes is gone).
>   - A hidden Help, Settings or Privacy overlay cannot be closed or changed from the
>     keyboard.
>
>   This meets M2.10a behavior 3 ("no … menu … responds") and M4.2 on hardware-keyboard
>   devices (M1.3 Chromebooks, M3.10).
> - **Defense in depth.** The `onFrame` re-pause guard (behavior 4 as written above)
>   **stays**. It should now never fire.
> - **Alternatives considered (and why rejected).**
>   - **Accept and record.** Rejected. It leaves M2.10a (3) and M4.2 broken, and it can
>     move a player from the title into a paused run they did not start.
>   - **A hold flag in the shared `InputManager`.** Rejected. It is a shared-code change
>     that would need the web gates, and it would not stop the Android overlay Esc handler.
>   - **`loop.suspend()` while a prompt shows.** Rejected. It competes with the lifecycle
>     `resume()` for control of the loop, and buffered key edges would fire after the
>     restore.
> - **Web:** unchanged. The web platform shows no prompt and registers no such listener.
>
> **Not changed by A12:** behaviors 1-3, 5 and 6, the precedence rule, where the
> classification runs, the prompt texts, and OQ-M7 (a) (no new layout).

### 6.3 The 640 × 360 dp profile, worked (M2.12 (a); UX carry-forward 1 and 5)

Planning insets: left 24, right 24 (gesture), top 0, bottom 24 (home-gesture band).
Default layout (movement left).

**Horizontal**

| Band | x from | x to | Width | Contents |
|---|---|---|---|---|
| Left edge inset | 0 | 24 | 24 | nothing interactive |
| ◀ | 24 | 80 | 56 | touch rect 56×56 |
| gap | 80 | 88 | 8 | part of `#move-zone`, carries `lastDir` |
| ▶ | 88 | 144 | 56 | touch rect 56×56 |
| **Playfield** | 144 | 560 | **416** | 800×600 at **s = 0.52** |
| THROW lane | 560 | 616 | 56 | THROW 56×56; PAUSE 48×48 at x 564-612 |
| Right edge inset | 616 | 640 | 24 | nothing interactive |
| **Sum** | | | 24+56+8+56+416+56+24 = **640** ✓ | movement col 144, THROW col 80 |

B = 64 was tried first: 160 + 88 = 248, availW = 392 → s = 0.49 < 0.5, so it falls back to
B = 56 (allowed only on this profile by M3.1). availW = 640 − 144 − 80 = 416 → s = 0.52.
availH = 360 − 0 − 24 = 336 → 0.56. So width is the binding limit: s = 0.52, playfield
**416 × 312**. This is ≥ 400 × 300 (M2.12, M2.13).

**Vertical**

| Item | y from | y to | Height |
|---|---|---|---|
| Playfield | 12 | 324 | 312. Centred in [0, 336]: (336 − 312)/2 = 12 |
| PAUSE (THROW column) | 16 | 64 | 48 touchable |
| Clear space PAUSE → THROW | 64 | 280 | 216 (≥ 24 required, M3.2) |
| ◀ ▶ THROW row | 280 | 336 | 56 |
| Bottom inset | 336 | 360 | 24 |
| **Column sum** | | | 16 + 48 + 216 + 56 + 24 = **360** ✓. The stack itself is 48 + 24 + 56 = 128 ≤ 336 available. |

The playfield's bottom edge (324) lies above the gesture band (336+). Vanguard's row
(logical y 552 → 12 + 552·0.52 ≈ 299) lies above it too. HUD text sits inside the playfield
(top band), so it is also inside the insets (M2.3). No control overlaps the playfield
horizontally: ▶ ends at 144 = playfield start, and THROW starts at 560 = playfield end
(M2.4). Adjacent targets: ◀-▶ 8 dp, PAUSE-THROW 216 dp. **Swap controls** mirrors x
(movement column 496-616 inside a 24 dp right inset; THROW lane 24-80; PAUSE top-left). The
sums are the same.

**Inset headroom (UX carry-forward 2):** on 640 × 360 with B = 56 the floor holds while
`l + r ≤ 640 − 400 − (56+8+56) − 56 = 64`, so up to **32 dp per side edge**. Any larger
value takes the documented `belowFloor` path above. The device-matrix check records the
emulator's actual reported insets next to the screenshot. **[A11]** The `belowFloor` path
is now the M2.10a "Make the window larger to play." prompt (§6.2.1), not a sub-0.5×
playfield.

> **Amendment A12 (2026-09-28, v1.6; PRD-mobile v1.6 M2.12 note and M2.3b;
> code-review-round8 E1 (a)).** The tables above use the v1 planning insets
> (24, 24, 0, 24) and are kept as the historical record; row 16 of §6.2.1 A12 still tests
> them. The **binding worked profile** is now 640 × 360 dp with the **measured**
> gesture-navigation insets l = r = 30, t = 28.2, b = 32 and no cutout, in the default
> layout. That is the M2.3b (a) model, rounded from round-8 E1's 29.7 / 29.7 / 28.2 / 32.
>
> **Horizontal** (only the side insets change)
>
> | Band | x from | x to | Width | Contents |
> |---|---|---|---|---|
> | Left edge inset | 0 | 30 | 30 | nothing interactive, no art |
> | ◀ | 30 | 86 | 56 | touch rect 56×56 |
> | gap | 86 | 94 | 8 | part of `#move-zone` |
> | ▶ | 94 | 150 | 56 | touch rect 56×56 |
> | **Playfield** | 150 | 554 | **404** | 800×600 at **s = 0.505** |
> | THROW lane | 554 | 610 | 56 | THROW 56×56; PAUSE 48×48 at x 558-606 |
> | Right edge inset | 610 | 640 | 30 | nothing interactive, no art |
> | **Sum** | | | 30+56+8+56+404+56+30 = **640** ✓ | movement col 150, THROW col 86 |
>
> - **B = 64 fails:** availW = 640 − 166 − 94 = 380 → 0.475 < 0.5, so B = 56 (M3.1
>   allows 56 on this profile).
> - **At B = 56:** availW = 404 → 0.505, and availH = 360 − 26.2 − 25.5 = 308.3 → 0.514.
> - **Width binds:** s = 0.505, playfield **404 × 303** (≥ 400 × 300; M2.12, M2.13). This
>   matches the PRD's M2.12 v1.6 note ("about 404 × 303 dp (≈ 0.505×)").
>
> **Vertical: playfield and text (M2.3b)**
>
> | Item | y | Check |
> |---|---|---|
> | Top gesture band | 0 to 28.2 | no text, no control |
> | Playfield | **28.87 to 331.87** (303) | centred in [topMin, H − botMin] = [26.18, 334.565]; topMin = 28.2 − 4·0.505, botMin = 32 − 13·0.505 = 25.435 |
> | Topmost playfield text: canvas warning em-box top (logical y 4) | 30.89 | ≥ t = 28.2 ✓ |
> | HUD panel text: content-box top (logical y 15) | 36.45 | ≥ 28.2 ✓ |
> | Hint text: `#control-text` content-box bottom (logical y 587) | 325.31 | ≤ H − b = 328 ✓ |
> | Bottom gesture band | 328 to 360 | the playfield extends 3.87 dp into it: art only, which M2.3b rule 1 allows |
>
> **Vertical: control column (full insets; rule unchanged)**
>
> | Item | y from | y to | Height |
> |---|---|---|---|
> | Top inset | 0 | 28.2 | 28.2 |
> | PAUSE (THROW column) | 44.2 | 92.2 | 48 (top = t + 16) |
> | Clear space PAUSE → THROW | 92.2 | 272 | 179.8 (≥ 24, M3.2) |
> | ◀ ▶ THROW row | 272 | 328 | 56 (bottom = H − max(b, 16)) |
> | Bottom inset | 328 | 360 | 32 |
> | **Column sum** | | | 28.2 + 16 + 48 + 179.8 + 56 + 32 = **360** ✓ |
>
> - ShieldMan's row (logical y 552) is at 28.87 + 552·0.505 ≈ 307.6, above the bottom
>   band.
> - No control overlaps the playfield: ▶ ends at 150, where the playfield starts, and
>   THROW starts at 554, where it ends (M2.4).
> - **Swap controls** mirrors x: movement 490-610, THROW lane 30-86, playfield 86-490. The
>   sums are the same.
>
> **Three-button navigation (0, 48, 24, 0; M2.3b (b))**
> - Columns: movement 0 + 120 (◀ 0-56, ▶ 64-120), playfield 120-536 (**416**), THROW lane
>   536-592, right inset 592-640. Sum 56 + 8 + 56 + 416 + 56 + 48 = 640 ✓.
> - Scale: s = 0.52 (width binds; availH = 360 − 22 − 0 = 338 → 0.563). The playfield is
>   416 × 312 at y 34.96-346.96.
> - Text: HUD and canvas text top ≥ 34.96 + 2.08 = 37.04 ≥ 24 ✓. Hint bottom = 340.2 ≤ 360
>   ✓.
> - Controls: PAUSE 40-88, bottom row 288-344 (16 dp bottom margin).
> - The mirror case (48, 0, 24, 0): movement 48-168, playfield 168-584, THROW 584-640.
>
> **Inset headroom per axis** (replaces "up to 32 dp per side edge"; UX carry-forward 2).
> On 640 × 360 at B = 56:
> - **Width: `l + r ≤ 64`** (not changed by M2.3b).
>   - Gesture navigation: 60, so 4 dp to spare. Round-8 measured: 59.4 (4.6 spare).
>     Three-button: 48 (16 spare).
>   - With gesture navigation, any side cutout wider than about 4 dp, or a back-gesture
>     setting above default, shows the prompt. This is the M2.3b known limit (§12 MR4).
> - **Height: `max(cT, t − 2) + max(cB, b − 6.5) ≤ 60`.** With no cutouts that is
>   `t + b ≤ 68.5`.
>   - Gesture navigation: 28.2 + 32 = 60.2, so 8.3 dp to spare. The top band can grow to
>     36.5 dp with b = 32, or the bottom band to 40.3 dp with t = 28.2.
>   - Three-button: 24 + 0, so 44.5 dp to spare.
>   - A top or bottom cutout counts in full.
> - The device matrix records all six reported inset fields next to each screenshot.

### 6.4 Resulting scale per device-matrix profile (M2.13; UX carry-forward 1)

These are nominal values (same planning insets). The lead tester pins exact AVDs, and the
`layout.test.ts` table asserts these rows so the numbers in this document are tested, not
estimated.

| Profile (landscape dp) | B | Move col / THROW col | Playfield (dp) | Scale | Limiting axis |
|---|---|---|---|---|---|
| Low-end / small phone 640 × 360 | 56 | 144 / 80 | 416 × 312 | 0.52 | width |
| Tall low-end 20:9, 800 × 360 | 64 | 160 / 88 | 448 × 336 | 0.56 | height |
| Mid-range 20:9, ≈ 915 × 412 | 64 | 160 / 88 | 517 × 388 | 0.647 | height |
| 10" tablet 16:10, 1280 × 800 | 64 | 160 / 88 | 1032 × 774 | 1.29 | width |
| 4:3 tablet, 1024 × 768 | 64 | 160 / 88 | 776 × 582 | 0.97 | width |
| Foldable inner, ≈ 841 × 701 | 64 | 160 / 88 | 593 × 445 | 0.741 | width |

Every profile is ≥ 0.5× and uses the same side-column layout. There is no tablet-specific
layout (OQ-M7 (a)).

> **Amendment A11 (2026-09-27, v1.5; PRD-mobile v1.5 M2.13 note):** these rows are the
> profiles at or above the §6.2.1 floor. A matrix window below the floor, such as the
> `svr_api36_fold` AVD's 412 × 309 dp window, is expected to show the M2.10a prompt. The
> device matrix records it that way; it is not an M2.13 failure.

> **Amendment A12 (2026-09-28, v1.6; PRD-mobile v1.6 M2.3b and M2.12 note).** The same
> profiles, recomputed with the measured gesture-navigation insets (30, 30, 28.2, 32; no
> cutout) and the §6.2 A12 formula. `layout.test.ts` asserts these rows. The planning
> rows above stay as tested rows too, because they are still valid inputs; with
> (24, 24, 0, 24) their placement changes slightly (for example the 640 × 360 pfY is 15.38,
> not 12).
>
> | Profile (landscape dp) | B | Move col / THROW col | Playfield (dp) | Scale | Limiting axis |
> |---|---|---|---|---|---|
> | Low-end / small phone 640 × 360 | 56 | 150 / 86 | 404 × 303 | 0.505 | width |
> | Tall low-end 20:9, 800 × 360 | 64 | 166 / 94 | 411.1 × 308.3 | 0.514 | height |
> | Mid-range 20:9, ≈ 915 × 412 | 64 | 166 / 94 | 480.4 × 360.3 | 0.600 | height |
> | 10" tablet 16:10, 1280 × 800 | 64 | 166 / 94 | 997.7 × 748.3 | 1.247 | height |
> | 4:3 tablet, 1024 × 768 | 64 | 166 / 94 | 764 × 573 | 0.955 | width |
> | Foldable inner, ≈ 841 × 701 | 64 | 166 / 94 | 581 × 435.8 | 0.726 | width |
>
> Every profile is still ≥ 0.5×, with the same side-column layout and no tablet-specific
> layout (OQ-M7 (a)). Real devices report their own insets. The device matrix records them
> next to the measured scale, which is judged against the floor and not against these
> nominal rows.

### 6.5 Applying the layout (`screenFit.ts`)

- `html` gets class `platform-android`. All Android CSS lives in
  `src/platform/android/android.css`, scoped under `html.platform-android`, and is imported
  only by the Android module. **`src/style.css` is not edited** (UX N1 / carry-forward 4).
- `#app-root` (canvas + HUD, 800 × 600 logical) is positioned at `(pfX, pfY)` with
  `transform: scale(s)` and `transform-origin: 0 0`. The `margin: 24px auto` rule is
  overridden to `0`. HUD and control-text keep their existing pixel padding and positions,
  because the playfield already sits inside the insets. **No safe-area padding is added to
  `#hud-root` or `#control-text`.** This is the additive answer to N1: the change sits at
  the container level, and the shared constants stay untouched.
- **Text floor (M2.6, M2.11):** inside the scaled root, Android CSS sets
  `--pf-scale: s`, and HUD/control-text sizes become
  `font-size: max(<existing px>, calc(12px / var(--pf-scale)))`. At s = 0.52 that is
  ≈ 23 logical px = 12 dp on screen. On web the rule is absent.
- **Overlays:** on Android, `#overlay-root` moves (once, at init) out of `#app-root` into a
  full-viewport `#safe-layer` that is inset by the edge insets and not scaled. Title,
  pause, confirm, Game Over, Game Complete, help, settings and rotate screens then lay out
  in real dp: `.menu-item { min-height: 48px }` (M3.8) and text ≥ 12 dp. The Game Complete
  overlay stays transparent, so the canvas fireworks show through (the existing F19
  decision). **[v1.1]** The privacy overlay (§8.7) lives in `#safe-layer` too.
- **Canvas backing store (M2.8):** `k = min(s × devicePixelRatio, 3.2)`.
  `canvas.width = round(800k)`, `canvas.height = round(600k)`. The CSS size stays
  800 × 600 inside the scaled root, so one backing pixel ≈ one device pixel. The renderer
  sets `ctx.setTransform(k, 0, 0, k, 0, 0)` at the start of each frame and draws in logical
  units. Web: `renderScale()` returns 1, so web is unchanged. The 3.2 cap (2560 × 1920)
  limits fill cost on large tablets.
- **Background (M2.2):** `html, body` are already `#05050a`, so the letterbox and column
  areas match the game background.
- **Re-layout triggers:** `resize` (viewport change, fold, split-screen, freeform window),
  `edgeInsetsChanged`, and a Settings "Swap controls" change. Re-layout is synchronous and
  well under M2.9's 1 s. A viewport **size** change also pauses (§8.1). An insets-only
  change (e.g. a 180° flip moving the cutout) re-lays-out without pausing. **[A11]** Every
  re-layout first runs the §6.2.1 classification; an insets-only change that drops the
  window below the floor shows the prompt, which pauses (§6.2.1 behavior 1).
- **Small-scale art (M2.7, UX carry-forward 6):** the canvas renders at device density, so
  shapes stay crisp. If the round-2 UX screenshot check finds power-up shapes, enemy tiers
  or the shield trail hard to tell apart at 0.52×, the allowed fix is **render-only** (for
  example a minimum stroke width in device px). Entity sizes and hitboxes are game-rule
  constants (M0.3) and change only through the shared PRD.
- **Performance fallback (M10.1):** if the low-end level-10 benchmark falls below 30 FPS,
  CanvasRenderer pre-renders the enemy/power-up/shield sprites into offscreen canvases keyed
  by `(sprite, damage state, k)` and invalidates them when `k` changes. This is a shared,
  render-only change and goes through both gates.

> **Amendment A12 (2026-09-28, v1.6; PRD-mobile v1.6 M2.3b rules 2-3;
> code-review-round8 I1).**
>
> **1. HUD and hint text placement rule (binding).** All text drawn over the playfield
> lies inside the window minus the **full** edge insets. This is achieved **only** through
> the playfield's vertical position (§6.2 A12). As before:
> - no safe-area padding is added to `#hud-root` or `#control-text`;
> - `src/style.css` and `CanvasRenderer` are not edited (the N1 decision above stands);
> - the sentence above, "because the playfield already sits inside the insets", now reads
>   "because the playfield is placed so that its text sits inside the insets".
>
> The text inventory, and the two constants in `layout.ts` derived from it (each carries
> a comment citing its source line):
>
> | Text | Where | Distance from the nearest playfield edge to its text box (logical px) |
> |---|---|---|
> | Formation warning "WARNING: ROBOTS APPROACHING" (bold 16 px) and boss warning "BOSS INCOMING" (bold 20 px) | canvas, baseline y = 24 (`CanvasRenderer.drawFormationWarning` / `drawBossWarning`) | top: em box ≥ 24 − 20 = **4** → `TEXT_TOP_LOGICAL = 4` |
> | HUD panels (score, lives, level, multiplier, active effect) | DOM `#hud-root` > `.hud-panel` | top: content box at 8 (`#hud-root` padding) + 2 (margin) + 1 (border) + 4 (padding) = 15. Does not bind. |
> | Control hint | DOM `#control-text` | bottom: content box at 8 (`bottom`) + 1 (border) + 4 (padding) = **13** → `TEXT_BOTTOM_LOGICAL = 13` |
> | Level intro "LEVEL N" | canvas, centred | far from both edges |
>
> - These edges are anchored. The Android font floor (`max(15px, 12px / s)`) and
>   `textZoom` (≤ 130 %, §7.3) make text grow away from them, not across them.
> - The `.hud-effect-active` pulse (`scale(1.18)`) moves the HUD content-box top up to
>   about 11 logical px at most, which is still ≥ 4.
> - Panel backgrounds (the `.hud-panel` border and padding, and the `#control-text` box)
>   may extend into a band (M2.3b rule 2).
>
> **2. Change control.** A shared change that moves any playfield text closer to an edge
> than these constants must update the constant in the same change. Examples: moving the
> warning baseline, reducing the HUD padding, or adding a new canvas caption. It is a
> shared-file change, so it goes through both platforms' gates.
> - The §10.1 A12 Playwright check measures the DOM text boxes on every CI run.
> - Canvas text is covered by the constant and the arithmetic check.
> - The lead developer checks any diff to `#hud-root`, `.hud-panel`, `#control-text` or
>   `CanvasRenderer` text calls against this table (§12 MR21).
>
> **3. Unchanged (M2.3b rule 3).** Menus, dialogs, shell overlays and touch controls stay
> in `#safe-layer`, inset by the full `l, r, t, b`. RotatePrompt's message stays padded by
> the full insets.
>
> **4. Re-layout triggers.** Unchanged. An `edgeInsetsChanged` event that changes only
> `cutoutTop` or `cutoutBottom` re-lays-out like any other insets-only change: it does not
> pause, unless the window drops below the floor.
>
> **5. Where RotatePrompt lives (code-review-round8 I1).** This supersedes the "rotate
> screens" item in the Overlays bullet above; the A11 implementation already did this.
> - RotatePrompt is **not** inside `#safe-layer`. It is a `<body>`-level,
>   `position: fixed`, full-viewport layer with z-index 40 (above `#safe-layer`'s 30), and
>   its background covers the whole window.
> - Its message stays inside the edge insets through inline padding with
>   `box-sizing: border-box`.
> - It cannot be a child of the inset `#safe-layer`, because such a child could not cover
>   the inset bands, which §6.2.1 behavior 2 requires.
> - While it shows, `#app-root` and `#safe-layer` are `visibility: hidden` (§6.2.1
>   behavior 2; code-review-round8 R1).
> - Scoping `.rotate-prompt` under `html.platform-android` is optional. `android.css`
>   never reaches the web bundle.
>
> **6. MR5 note.** At s ≈ 0.505 the 12 dp HUD takes a slightly larger share of the
> playfield than at 0.52. The UX round-2 check (step 11) judges it on the representative
> AVD (PRD-mobile M2.12 v1.6 note (c)).

### 6.6 Orientation, edge-to-edge and immersive (M2.1, M2.1a, M2.5, M2.10)

- Manifest activity: `android:screenOrientation="sensorLandscape"`. The lock applies from
  process start, splash included, and allows both landscape directions (M2.1a, UX F1).
- `<application android:appCategory="game">` so that Android 16 large-screen
  orientation/resizability overrides treat the app as a game (M2.10 architect note). If a
  device still forces a portrait or too-small window, the layout's rotate rule shows
  RotatePrompt and keeps the game paused. **[A11]** The rule is now the §6.2.1
  classification (portrait → rotate text; too small → "Make the window larger to play.").
- Edge-to-edge: target API 36 enforces it. **[A10]** The theme's
  `android:windowLayoutInDisplayCutoutMode` is set **per API level**, as specified in
  Amendment A10 directly below (v1.3 set `always` unconditionally; that is replaced for
  API < 30).
  **Capacitor's own edge-to-edge margin/inset handling must be disabled**, so the WebView
  covers the whole window and our layout alone handles insets. In Capacitor 7 this was
  `android.adjustMarginsForEdgeToEdge: 'disable'`; Capacitor 8 moved it to the core
  SystemBars configuration. The junior developer uses the option name for the installed
  version, and the lead developer checks that the WebView fills the screen on a cutout
  emulator.

> **Amendment A10 (2026-09-27, v1.4; trigger validation-report-round2 F1; closes
> code-review-round7 M1; parity rule from code-review-round7 L3). Cutout mode by API
> level.**
>
> *Origin of this text.* The first paragraph below was written in place into §6.6 by
> mobile-junior-developer as part of the F1 fix, without an amendment ID, a version bump or
> a §16 row (code-review-round7 M1). I agree with it technically, and it matches the code
> and the device evidence, so it is adopted here as A10 text. The rest of this block is
> added by the architect. Spec changes proposed by the implementer go into
> `docs/mobile/tooling-setup-log.md` or a handoff note for mobile-solution-architect; the
> implementer does not edit this document or the ADRs.
>
> **A10 text (adopted).** The theme sets `android:windowLayoutInDisplayCutoutMode="always"`
> **on API 30+ only** (`values-v30/styles.xml`); API 28-29 uses `shortEdges`
> (`values-v28/styles.xml`, the same safe value androidx.core:core-splashscreen's own
> version-qualified overrides use for that range), and the unqualified base
> `values/styles.xml` (API < 28) omits the attribute entirely since it does not exist before
> API 28. A real API 28 `google_apis` system image throws
> `UnsupportedOperationException: Unknown windowLayoutInDisplayCutoutMode: 3` if `always` is
> applied unconditionally (mobile validation-report-round2 F1). The three values folders and
> `scripts/check-android-styles.mjs` (a regression guard asserting that no values folder
> below v30 sets this attribute to `always`) exist to prevent that.
>
> **1. Resolved values (binding; all three app styles: `AppTheme`, `AppTheme.NoActionBar`,
> `AppTheme.NoActionBarLaunch`).**
>
> | Folder | Devices it applies to | `android:windowLayoutInDisplayCutoutMode` |
> |---|---|---|
> | `res/values/styles.xml` (base) | API 24-27 | **absent** (the attribute does not exist before API 28) |
> | `res/values-v28/styles.xml` | API 28-29 | `shortEdges` (value 1) |
> | `res/values-v30/styles.xml` | API 30-36 and later | `always` (value 3) |
>
> Why: `LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS` (3) was added in API 30. API 28-29 know only
> 0, 1 and 2, and `PhoneWindow.generateLayout` throws on any other value. Android picks the
> highest `vNN` folder that is ≤ the device API, so 24-27 use base, 28-29 use v28 and 30+
> use v30, with no gaps. The edge-to-edge intent is unchanged: full-bleed under the cutout
> on API 30+; `shortEdges` gives the same full-bleed result on API 28-29 phones in
> landscape, where the cutout sits on a short edge. Controls never depend on the cutout
> mode: GameShell's live `max(cutout, gestures)` insets (§6.1) still keep them clear
> (M2.3, M2.3a).
>
> **2. Three-folder parity rule (binding; from code-review-round7 L3).** Android resolves a
> whole style per qualifier bucket; it does not merge items across buckets. Because the
> base folder now applies only to API 24-27, an edit made only to `values/styles.xml`
> would have no effect on almost every real device. Therefore:
> - The three `styles.xml` files declare the **same style names with the same parents and
>   the same items**. The only difference allowed is the
>   `android:windowLayoutInDisplayCutoutMode` item: absent in base, `shortEdges` on every
>   style in v28, `always` on every style in v30.
> - Any change to one of the three files is made to all three **in the same commit**.
> - `values-v28/` and `values-v30/` must both exist. Deleting `values-v28/` would silently
>   send API 28-29 back to the default letterboxed cutout mode.
> - No other theme attribute may be API-gated through these folders without a new
>   amendment.
> - Either of the two L3 implementations satisfies this rule: **(a)** keep three full
>   copies and have the guard assert parity, or **(b)** move the shared items once into
>   base-only parent styles in `values/` and keep only the one cutout item on the leaf
>   styles in v28/v30. With (b), "parity" means the leaf styles in all three folders have
>   the same names and parents.
>
> **3. Guard: `scripts/check-android-styles.mjs` (+ `scripts/check-android-styles.test.mjs`).**
> It runs in CI through the `build` job's `npm run test -- --run` (the Vitest `include`
> covers `scripts/**/*.{test,spec}.mjs`), so a regression blocks the website deploy (C4).
> The guard is complete only when it checks all of these:
> 1. No `values`/`values-vNN` folder with NN < 30 sets the attribute to `always`. *(In
>    place.)*
> 2. Positive values: `values-v28` exists and sets `shortEdges`, and `values-v30` exists and
>    sets `always`, on every app style. *(Round-7 L3.)*
> 3. Parity across the three files, per rule 2. *(Round-7 L3.)*
> 4. Fails closed: a missing res dir, or no `values` folder found, exits non-zero with an
>    actionable message; the default res dir resolves from the script's own location, not
>    the cwd. *(Round-7 L1.)*
> 5. The item match tolerates extra attributes (e.g. `tools:targetApi="o_mr1"`, which does
>    not stop the value compiling in for API 28-29), single quotes, and whitespace around
>    `=`. *(Round-7 L2.)*
>
> Items 2-5 are the round-7 LOW findings. They are owned by mobile-junior-developer and land
> on the timing the review set (the next time these files are touched). Security pass 2
> can check their status. Making the guard a visible CI step (`npm run
> check:android-styles` in `android-build` after `npx cap sync android`) is optional
> (round-7 S1) and comes only after item 4, so it cannot pass vacuously.
>
> **4. Evidence and known gaps.** Verified in code-review-round7: compiled-APK values via
> `aapt2 dump resources` (no `=3` below v30), two clean API 28 cold launches (0 `FATAL
> EXCEPTION`; the M1.4 fallback page renders), and two API 36 launches with
> `layoutInDisplayCutoutMode=always`. Carried as known gaps, not defects: API 29 itself was
> not launched (round-7 I2; the Play pre-launch report or the closed test should cover a
> real API 29 device); cutout behavior on API 28-29 with WebView ≥ 80 is unverified
> (round-7 I3, device-matrix round-2 gap 3). The API 28 `dumpsys` label `always` is the
> framework's old name for value 1 and is not a regression (round-7 I1).
>
> **5. Prior decision.** v1.3's unconditional `always` is **replaced** for API < 30 and
> **kept** for API 30+. The `styles.xml` files are template-owned sources that `cap sync`
> does not rewrite (confirmed in round 7), so the §3 "never hand-edit generated files" rule
> is not affected. No PRD requirement changed; M1.1 (minSdk 24) and M2 edge-to-edge intent
> are kept. No game logic is involved (C1).

- Immersive: GameShell calls `WindowCompat.getInsetsController(window, decorView)
  .hide(WindowInsetsCompat.Type.systemBars())` with
  `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE` on `load()` and on every window-focus gain. It
  stays on for the whole app (M2.5 needs title + play; all screens is simpler and allowed).
- GameShell's inset listener must not replace a listener Capacitor has already installed.
  It either registers on its own zero-size child view added to the content root, or chains
  to the previous listener, and always returns the insets unconsumed.

---

## 7. Android targets and packaging (M-ADR-0007; amended by M-ADR-0010, 0011, 0012 and Amendments A8, A9, A10)

### 7.1 Identity and SDK levels

| Setting | Value | Source |
|---|---|---|
| applicationId / namespace | `io.github.hogy86.shieldvsrobots` **[A10]** (v1.3 read `io.github.hogy86.vanguardvssentinels`; changed by owner decision OQ-S1 (b), PRD-mobile v1.3 §7). As built, the namespace and Java package are the same value. **Placeholder until OQ-M11 is confirmed. It is permanent after the first Play upload.** Before step 15, changing it means editing `capacitor.config.ts` `appId` and `android/app/build.gradle` `applicationId` only. The namespace/Java package may stay. | OQ-M11 default; OQ-S1 (b) |
| App label | "Shield vs Robots" **[A10]** (v1.3 read "Vanguard vs. Sentinels"). Exact form per F22 AC1: "vs" with no period, no subtitle. | M9.1 (as amended v1.3); PRD-addendum-v4 F22 |
| minSdk | **24** (Android 7.0), the Capacitor 8 template default | M1.1, OQ-M6 (a) |
| compileSdk / targetSdk | **36** (Android 16) | M1.2 |
| minWebViewVersion | **80** (the build target `es2020` needs Chrome 80 for `?.`/`??`) | M1.4 |

> **Note (2026-09-25, v1.1; review-v1 M5 — not decided here):** the app label and the
> applicationId both contain "Sentinels"/"sentinels". The owner is deciding OQ-S1 through
> mobile-product-manager. This architecture takes no position. For the owner's decision,
> note the coupling: the label can change after launch, but the **applicationId cannot**
> after the first upload. If OQ-S1 leads to a rename, OQ-M11 should be re-confirmed before
> step 15. Either way the change is the two-line edit described in the row above.

> **Amendment A10 (2026-09-27, v1.4; PRD-mobile v1.3/v1.4 OQ-S1 (b), OQ-S1a;
> PRD-addendum-v4 F22):** the owner decided OQ-S1 on 2026-09-25 as option (b), rename. The
> label and applicationId in the table above and in §7.2 are updated to "Shield vs Robots"
> and `io.github.hogy86.shieldvsrobots`, matching the built `capacitor.config.ts`,
> `android/app/build.gradle` and `res/values/strings.xml`. The coupling note above still
> applies to **OQ-M11**: the new ID is a placeholder until the owner confirms it before
> step 15, and it becomes permanent at the first upload. Nothing has been published, so
> the change loses no player data. Storage keys and the WebView origin are unchanged
> (F22 AC13, §9.2).

**targetSdk verification note:** this session had no web access, so I did not re-check the
Play requirement live. The value follows Google Play's published annual rule: from
31 August each year, new apps and updates must target the API level released the year
before. That gives API 35 from 31 Aug 2025 and API 36 from 31 Aug 2026, which matches PRD
M1.2. The release engineer re-verifies at step 15 (M1.2 already requires this). If Play
requires higher by then, the fix is a one-line `variables.gradle` change plus a Capacitor
upgrade if the installed major does not support it. (Security review L6 accepted this; no
change in v1.1.)

### 7.2 capacitor.config.ts (load-bearing values)

```ts
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'io.github.hogy86.shieldvsrobots',   // OQ-M11 placeholder [A10: renamed, OQ-S1 (b)]
  appName: 'Shield vs Robots',                // [A10] F22 AC1, M9.1
  webDir: 'dist-android',
  backgroundColor: '#05050a',          // no white flash (M9.4)
  loggingBehavior: 'debug',            // console → logcat only in debug builds (M11.3)
  server: {
    androidScheme: 'https',            // PINNED: origin https://localhost — changing scheme or
    hostname: 'localhost',             //  hostname changes the storage origin and wipes saved data (M7.4)
    errorPath: 'webview-update.html',  // shown when WebView < minWebViewVersion (M1.4)
  },
  android: {
    minWebViewVersion: 80,
    allowMixedContent: false,
    // webContentsDebuggingEnabled left unset: Capacitor enables it only for debuggable builds
  },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#05050a', showSpinner: false },
  },
};
export default config;
```
The key names follow the Capacitor 8 config schema. If the installed version renames one,
the junior developer uses the new name and records it. The **values** are the decision.

> **Amendment A3/A7 (2026-09-25, v1.1; M2, L3):** this file must never contain
> `server.url`, `server.cleartext`, or `android.buildOptions` (`keystorePath`,
> `keystorePassword`, `keystoreAlias`, `keystoreAliasPassword`, `releaseType`, `signingType`).
> CI enforces this with `check-no-secrets.mjs` (§7.5.3) and `check-capacitor-config.mjs`
> (§14.1 L3).

> **Amendment A8 (2026-09-25, v1.2; review-v1b N2, N5):** "left unset" is now enforced, not
> just stated. `check-capacitor-config.mjs` also fails on `webContentsDebuggingEnabled: true`,
> `allowMixedContent: true`, an `androidScheme` other than `'https'`, a `hostname` other than
> `'localhost'`, and any `server.allowNavigation` key. The exact rule set is §14.1 row N2.
> `CapacitorHttp` and `CapacitorCookies` stay unset (they are not in this config and must
> not be added).

### 7.3 Manifest and MainActivity

- **Permissions (M11.2):** delete the template's `INTERNET` line and add
  `<uses-permission android:name="android.permission.INTERNET" tools:node="remove"/>`, so
  no merged library can bring it back. Capacitor loads bundled assets through a local
  request interceptor, not a socket, so the app works without it. As a result any network
  call, even an accidental one, fails (M11.1). The only merged permission allowed is
  AndroidX's `<appId>.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (signature-level, not
  user-facing). CI enforces the allowlist (§10).
  > **Amendment A2 (2026-09-25, v1.1; review-v1 M1):** "so the app works without it" was
  > stated as fact in v1. It is now a **hypothesis that step 7 must verify** on real
  > emulator images before the step-8 review. §7.3.1 has the plan and the documented
  > fallback (M-ADR-0010). The decision to remove INTERNET stands until that verification
  > fails.
- `<application android:appCategory="game" android:allowBackup="false"
  android:dataExtractionRules="@xml/data_extraction_rules" android:usesCleartextTraffic="false">`.
  The data-extraction rules exclude everything from cloud backup and device transfer. With
  backup on, Android Auto Backup would copy the best score to Google Drive, which would be
  a cloud save that M7.6 rules out.
- Activity: `android:screenOrientation="sensorLandscape"`,
  `android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|screenLayout|density|uiMode|navigation|locale"`.
  Without these, a fold, a resize or a density change recreates the activity, which
  reloads the WebView and **loses the run**. M2.9 requires no loss.
- `<uses-feature android:name="android.hardware.touchscreen" android:required="false"/>`
  so keyboard-only Chromebooks stay eligible (M1.3, M3.10).
- `android:enableOnBackInvokedCallback="true"` (predictive back, M5.3). This is the default
  at API 36; setting it explicitly documents it.
- MainActivity: `registerPlugin(GameShellPlugin.class)` before `super.onCreate`. Override
  `onWindowFocusChanged` to forward to GameShell. After the bridge is ready, set the
  WebView's `textZoom = min(round(fontScale × 100), 130)` (M2.11: the system font size is
  honored up to 130%; the ≥ 12 dp floor covers legibility; layouts are tested at the 130%
  cap). Also `setLongClickable(false)`, `setHapticFeedbackEnabled(false)`,
  `setOverScrollMode(View.OVER_SCROLL_NEVER)`.
- **[Amendment A6, 2026-09-25, v1.1; review-v1 L1] No FileProvider, no other components.**
  - Delete the Capacitor template's `<provider android:name="androidx.core.content.FileProvider" …>`
    element and `res/xml/file_paths.xml`. No allowed plugin uses them, and their path grants
    are dead attack surface.
  - **The only exported component is MainActivity (MAIN/LAUNCHER). There are no deep-link
    or custom-scheme intent filters.** ~~and no `<provider>`~~ **[A8]** The only
    `<provider>` allowed in the merged manifest is the non-exported AndroidX Startup
    provider (next bullet).
  - The one tolerated library component is `androidx.profileinstaller.ProfileInstallReceiver`,
    if AndroidX merges it. It is exported but guarded by the system `android.permission.DUMP`
    permission, and it is named on the checker's allowlist (§10.3 R5). Anything else fails CI.
  - > **Amendment A8 (2026-09-25, v1.2; review-v1b N1).** v1.1's "no `<provider>`" would
    > fail the first debug build. Capacitor depends on AndroidX AppCompat, which brings
    > `emoji2`; `emoji2`, `lifecycle-process` and `profileinstaller` register through
    > `androidx.startup.InitializationProvider`, which the manifest merger adds with
    > `android:exported="false"`. The provider rule is therefore:
    > - **Allowed (the only provider allowlist entry):** `androidx.startup.InitializationProvider`
    >   with `android:exported="false"` stated explicitly, and **without**
    >   `android:grantUriPermissions="true"`.
    > - **Always fails, whatever the allowlist says:** any exported provider; any provider
    >   whose class is `androidx.core.content.FileProvider` or a subclass; any provider with a
    >   `<grant-uri-permission>` child; any provider with an
    >   `android.support.FILE_PROVIDER_PATHS` `<meta-data>` entry. This keeps L1 closed.
    > - **Any other provider** fails. Adding one to the allowlist needs a security review.
    > - **Do not** strip `InitializationProvider` with `tools:node="remove"`: that silently
    >   disables baseline-profile install and emoji2 initialization. **Do not** loosen R5
    >   ad hoc. If the first `cap add` merged manifest (§14 step 3b) shows any provider other
    >   than `InitializationProvider`, stop and report it; the main session routes it to
    >   mobile-security-compliance-reviewer.
    > - The enforcing rule is §10.3 R5.

#### 7.3.1 No-INTERNET verification plan and fallback [new in v1.1; M1; M-ADR-0010]

**Verification (mobile-junior-developer, step 7, before handing to step 8).** Evidence goes
in the code-review submission and in `docs/mobile/tooling-setup-log.md`. Build the debug
APK and confirm with `aapt2 dump permissions` that INTERNET is absent. Then cold-start
(`adb shell am force-stop` first) on:

| Image | Record | Pass |
|---|---|---|
| API 36 (Google APIs) | WebView version | Title renders. Help, Settings, Swap controls and **the privacy overlay** (§8.7) work. Level 1 plays. |
| API 36, forced errorPath | Local **uncommitted** build with `minWebViewVersion: 999` | `webview-update.html` renders |
| API 24 | WebView version (`adb shell dumpsys webviewupdate`) | If WebView < 80: `webview-update.html` renders (the same interceptor path). If ≥ 80: same as the API 36 row. |
| Mid image, WebView ≥ 80 (e.g. API 29/30) | Only if the API 24 WebView is < 80 | Title renders and the privacy overlay works |

On every image, logcat must show no `net::ERR_*` and no blocked-load error for
`https://localhost/*`. Missing emulator images are requested in
`docs/mobile/tooling-requests.md`. The junior developer does not install them.
mobile-lead-tester adds the row "cold start, no INTERNET, API 24 + API 36 (+ mid image)"
to `device-matrix.md` for every release candidate.

> **Amendment A8 (2026-09-25, v1.2; review-v1b N4):** this debug-build verification is
> repeated on the **signed release AAB** at step 15, before upload (§10.3 step-15 list,
> item 5). It catches release-only failures (R8, resource shrinking) that the debug build
> cannot show.

**Fallback (only if any row fails; requires security re-review, pass 1c, before merge):**
1. Keep INTERNET: delete the `tools:node="remove"` line. Run the manifest checker with
   `--allow-internet`. That flag is committed only together with the fallback.
2. Add an **Android-mode-only** CSP `<meta>` through a small Vite `transformIndexHtml` hook
   that runs only when `mode === 'android'`. The web output stays byte-identical (C3):
   `default-src 'self'; connect-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'none'; frame-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`
   (`'unsafe-inline'` for scripts covers Capacitor's injected inline bridge script.)
3. Test the CSP on the emulator against the real bridge. With it in place, all of these
   must still work, with no `securitypolicyviolation` in logcat:
   - the splash hide
   - `backButton`
   - `pause`/`resume`
   - GameShell insets and focus events
   - the privacy iframe
4. Keep the M11.1 Playwright no-request check. Add an assertion that
   `dist-android/index.html` contains the CSP `<meta>`.
5. The Data safety answer is unchanged ("No data collected, no data shared").

### 7.4 Old WebView, icon, splash, size

- **M1.4:** `public/webview-update.html` is static HTML on `#05050a` with the text "Please
  update Android System WebView from the Play Store" and no script. Capacitor loads it
  instead of the app when the WebView is below `minWebViewVersion`. It also ends up in the
  web `dist/`, where it is unreferenced and harmless. Verify on an emulator image with an
  old WebView, or record the result as a manual-only criterion if no such image exists.
- **[v1.1, H1] M11.4 / M11.4a:** `public/privacy.html` is the **single** policy file. The
  website serves it at the hosted URL, and the app bundles it at
  `https://localhost/privacy.html` and shows it in-app (§8.7). Its content rules are in
  §8.7.
- **M9.2/M9.3:** adaptive icon = `res/mipmap-anydpi-v26/ic_launcher.xml` with vector
  foreground (the shield circle `#2f6fed`), solid `#05050a` background, and a
  `<monochrome>` layer (store-assets-spec §1). The legacy PNG mipmaps come from the same
  art. No icon-generation tool is added.
- **M9.4:** the Android 12+ splash theme (`Theme.SplashScreen`,
  `windowSplashScreenBackground #05050a`, icon = the foreground). `SplashScreen.hide()` is
  called from `main.ts` after the **first** `render()` completes, so the splash hands off
  directly to a drawn frame.
- **M10.5:** expected AAB download is well under 15 MB (web bundle < 1 MB + Capacitor
  runtime). Release builds use R8 (`minifyEnabled true` in release) only if the Capacitor
  keep-rules are in place. Otherwise leave it off; size is not at risk.

### 7.5 Release signing contract [new in v1.1; review-v1 M2; M-ADR-0011]

Applies from `npx cap add android` onward. mobile-release-engineer applies it for real at
step 15.

#### 7.5.1 Where signing material lives

| Item | Location | Notes |
|---|---|---|
| Upload keystore | `C:\Users\aaron\.android-signing\vvs\upload-keystore.jks` | Created at step 15 with `keytool -genkeypair`. Passwords are entered at the **prompt**, never as arguments. |
| `signing.properties` | `C:\Users\aaron\.android-signing\vvs\signing.properties` | Keys: `storeFile` (absolute path), `storePassword`, `keyAlias`, `keyPassword`. |
| Pointer to it | Env var `VVS_SIGNING_PROPERTIES`, **or** `vvsSigningProperties=<path>` in `%USERPROFILE%\.gradle\gradle.properties` | A path only, never a secret. `GRADLE_USER_HOME` must not point into OneDrive. |
| Backup | Owner's password manager (keystore attachment + both passwords) | OQ-M12 (a). Never OneDrive, Google Drive, email or the repo. |

- `C:\Users\aaron\.android-signing\` is outside the repo and outside every OneDrive-synced
  folder. OneDrive Known Folder Move covers Desktop, Documents and Pictures, not the
  profile root. The release engineer confirms this in OneDrive settings and restricts the
  folder's NTFS ACL to the owner's account. mobile-it-analyst never generates or handles
  keys.

#### 7.5.2 `android/app/build.gradle` behavior (Groovy; the exact structure is the junior developer's, the behavior is binding)

1. **Resolve the path.** `System.getenv('VVS_SIGNING_PROPERTIES')`, else
   `findProperty('vvsSigningProperties')`, else none.
2. **Path guard.** Canonicalize the properties path and `storeFile`. Reject either one
   (treat it as "no signing") if it is:
   - inside the `scaffold/` project root (`rootProject.projectDir.parentFile`)
   - under the `OneDrive`, `OneDriveConsumer` or `OneDriveCommercial` env paths
   - on a path with any segment starting with `OneDrive` (case-insensitive)
   - **[A8, review-v1b N3]** inside the **git top-level** of the repository (today
     `ahogancamp_portfolio/`, three levels above `scaffold/`). See §14.1 row N3 for how it
     is resolved.
3. **Load.** Load the file only if it passes the guard, and require all four keys to be
   non-empty.
4. **Assign.** Set `signingConfigs.release` from the loaded values, and set
   `buildTypes.release.signingConfig` only when the load succeeds. The release build type
   **never** references `signingConfigs.debug`, anywhere.
5. **Fail closed.** In `gradle.taskGraph.whenReady`: if the graph has a release packaging
   task in `:app` (`bundleRelease`, `assembleRelease`, `packageRelease*`,
   `signReleaseBundle`) and signing did not load, throw
   `GradleException("Release signing not configured or unsafe location - see docs/mobile/architecture/mobile-architecture.md §7.5. Refusing to build.")`.
6. **The single exception.** If `System.getenv('CI') == 'true'` **and**
   `findProperty('vvsCiUnsignedRelease') == 'true'`, the release build proceeds with **no**
   signing config and produces an unsigned artifact. It is used only for the CI manifest
   check (§10.3). It is never signed with the debug key.

**Never put signing values in:**
- `android/gradle.properties`
- `app/build.gradle`
- any `*.gradle`/`*.gradle.kts`
- `capacitor.config.ts` (`buildOptions`)
- `.env*`
- GitHub Actions secrets: CI never signs
- command-line arguments

#### 7.5.3 CI tracked-secret check (`scripts/check-no-secrets.mjs`)

Runs in the `build` job **immediately after checkout** (before `npm ci`), and locally via
`npm run check:secrets`. It lists tracked files with `git ls-files` (scope: the `scaffold/`
directory) and fails with the file and line if any of these match:

> **Amendment A8 (2026-09-25, v1.2; review-v1b N3):** the scope is now the **whole
> repository**, not `scaffold/`. The exact invocation and path handling are in §14.1 row
> N3. Rules S1-S5 are unchanged.

| Rule | Files | Fails on |
|---|---|---|
| S1 key/secret files tracked | all tracked | path matches `\.(jks\|keystore\|p12\|pepk\|pem\|aab\|apk)$` or `(^\|/)(keystore\|key\|signing)\.properties$` or `(^\|/)\.env(\.[^/]*)?$`. **[A9]** Carve-out: the path failure is skipped **only** for tracked files whose basename is exactly `.env.example`, `.env.sample` or `.env.template` (case-sensitive); those files go to S6 instead. Every other S1 pattern is unchanged and path-only. |
| S2 password literal in Gradle | tracked `*.gradle`, `*.gradle.kts` | a line matching `^\s*(storePassword\|keyPassword)\s*=?\s*["']` (the contract's `storePassword signing.getProperty(...)` form does not match) |
| S3 signing values in properties | tracked `gradle.properties` (any directory) | `(?i)(storePassword\|keyPassword\|storeFile\|keyAlias\|android\.injected\.signing)` |
| S4 debug key used for release | `android/app/build.gradle` | `signingConfigs\.debug` |
| S5 Capacitor keystore options | `capacitor.config.*` | `(?i)keystore(Path\|Password\|Alias\|AliasPassword)` |
| **S6 env-template content [A9]** | every tracked file exempted from S1 by the carve-out | the file is unreadable, or its text matches rule (a), (b) or (c) in the A9 block below. Output: `S6: <path>:<line> (<a\|b\|c>: env template contains secret-shaped content)`, exit 1. |

S4 is safe because the debug build type signs with the debug key implicitly and never
needs to name it.

> **Amendment A9 (2026-09-26, v1.3; review-v1b Addendum 1; trigger code-review-round1 C3).**
> The whole-repository S1 scan (A8/N3) fails on
> `projects/ai-ml/VibeCoding/Cursor-UFOArcadeGame/UFO_Arcade_Game/.env.example`, a committed
> template in an unrelated sibling project. It holds no secret values and matches on its
> name only, so it is a false positive. The security reviewer's decision is a narrow
> exemption for template files **whose contents are still scanned**. Rejected by the
> reviewer: an exact-path allowlist (it stops checking the file's contents and breaks on the
> next template elsewhere in the portfolio repo), and renaming or removing the file (outside
> this app's scope; needs the owner; committed templates are good practice). The A3 ignore
> list (`.env`, `.env.*`) is unchanged.
>
> **Binding rule (verified by mobile-lead-developer at step 8, re-checked in pass 2):**
> 1. S1 skips the path failure only for tracked files whose basename is exactly
>    `.env.example`, `.env.sample` or `.env.template` (case-sensitive; a named constant in
>    the script, e.g. `S1_TEMPLATE_BASENAMES`, checked with `path.posix.basename`). Every
>    other S1 pattern is unchanged and path-only. No other exemption may be added without
>    security review.
> 2. New rule **S6** scans every exempt file. An unreadable file fails (do not reuse the
>    existing `catch { continue; }`). The file fails on:
>    - (a) anywhere in the file text, comments included: `-----BEGIN [A-Z ]*(PRIVATE KEY|CERTIFICATE)-----`,
>      `AKIA[0-9A-Z]{16}`, `\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}`, `github_pat_[A-Za-z0-9_]{20,}`,
>      `\bsk-[A-Za-z0-9_-]{20,}`, `xox[abprs]-[A-Za-z0-9-]{10,}`, `AIza[0-9A-Za-z_-]{35}`;
>    - (b) a line that, after stripping one leading `#` and whitespace, matches
>      `^([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(.*)$` with a key matching
>      `/(SECRET|PASSWORD|PASSWD|PASSPHRASE|TOKEN|API_?KEY|PRIVATE_?KEY|ACCESS_?KEY|CLIENT_?SECRET|CREDENTIAL|KEYSTORE|STORE_?PASS|KEY_?PASS|SIGNING)/i`
>      and a value that is non-empty after trimming whitespace and matching surrounding
>      quotes (`API_KEY=` and `API_KEY=""` pass; `API_KEY=changeme` fails);
>    - (c) on the same `KEY=VALUE` lines, a trimmed unquoted value containing a run of 32 or
>      more characters from `[A-Za-z0-9+/=_-]`.
>
>    Failures print `S6: <path>:<line> (<a|b|c>: env template contains secret-shaped content)`
>    and exit 1.
> 3. Each exempt file that passes is listed in the script output
>    (`check-no-secrets: S1 template exemption, content scanned clean: <path>`), so the
>    exemption shows in CI logs.
> 4. The S6 scanner is exported as a pure function (e.g. `scanEnvTemplate(text) → failures[]`),
>    `main()` is guarded, and it is unit-tested with inline string fixtures only (no
>    committed `.env.*` fixtures). Tests: (i) the current Cursor file → pass;
>    (ii) `DB_PASSWORD=hunter2` → S6b; (iii) `# API_KEY=abc` → S6b; (iv) `API_KEY=` → pass;
>    (v) a PEM `BEGIN PRIVATE KEY` line → S6a; (vi) `AKIAABCDEFGHIJKLMNOP` → S6a;
>    (vii) `FOO=` plus a 40-character base64-like string → S6c. Basename boundaries:
>    `.env.example` exempt; `.env`, `.env.local`, `.env.example.bak`, `foo/.env.production`
>    and `x.pem` still fail S1. The tests run in CI's `npm run test` (widen the Vitest
>    `include` as code-review-round1 H5 requires for the other checker tests).
> 5. The `.github/workflows/deploy-pages.yml` change is **not merged** until items 1-4 are
>    implemented and `npm run check:secrets` passes on the real tree.
>
> Scope stays the whole repository and the check still fails closed on content, so
> review-v1b N3 stays closed (residual risk LOW per Addendum 1).

---

## 8. Lifecycle, back, quit, timing (M-ADR-0005)

### 8.1 Lifecycle mapping (`src/platform/android/lifecycle.ts`)

| Android signal | Source | Action |
|---|---|---|
| App to background (Home, Recents, lock, call screen) | `@capacitor/app` `pause`; also `document.visibilitychange → hidden` (whichever comes first; the actions are idempotent) | `commands.pauseForInterruption()` → `loop.suspend()` → `GameShell.setKeepAwake(false)` |
| Notification shade, system dialog (the window loses focus but the app is not paused by Android) | GameShell `windowFocusChanged {hasFocus:false}` | `commands.pauseForInterruption()` (the loop keeps rendering; no time passes because state is PAUSED) |
| App to foreground | `@capacitor/app` `resume` | `loop.resume()`. The state is **not** changed: the player sees the pause menu and must tap Resume (M4.3). |
| Viewport size change (fold, split-screen, freeform) | `resize` | `commands.pauseForInterruption()` then re-layout (M2.9) |
| Portrait / too-small window | layout rule | pause + RotatePrompt. It clears automatically when the window is valid again; the game stays PAUSED (M2.10). **[A11]** The rule is the §6.2.1 classification; the prompt shows the portrait text or "Make the window larger to play." (M2.10a), with the behavior in §6.2.1. |
| Process death | Android | Nothing to do. The next launch loads a fresh WebView → TITLE; best/settings are read from storage (M4.6, OQ-M9 (a)). **[v1.1]** Any open shell overlay (Help, Settings, Privacy) is gone, and that is correct. |

`pauseForInterruption()` is **shared** and pure (`GameStateMachine.ts`, Vitest-tested):
- `PLAYING` (including the F18 intro and the F12 boss warning) → `PAUSED`, index 0. This is
  the same result as `pause()` (M4.1).
- `VICTORY` → `victoryHeld = true` (M4.4: the celebration holds while away, mirroring
  F19 AC9).
- `TITLE`, `PAUSED`, `GAMEOVER`: no state change (M4.4). (This includes TITLE with the
  privacy overlay open; the overlay stays open on resume.)
- Then `bestScore.commitIfRunActive(world.score)` when the state is PLAYING or PAUSED
  (F20 AC4(e), M7.2).

The web platform calls **only** `commitIfRunActive` on `visibilitychange → hidden` /
`pagehide` (F20 AC4(e)). It does not auto-pause, because the website behavior stays as
specified (OQ-M10 (a)). If the web team later wants auto-pause, it is one extra line in
`WebPlatform` plus a web PRD change.

### 8.2 Timing: elapsed time, never frame count (M10.2, M4.2, M10.6)

- The existing W-ADR-0002 loop is kept: a fixed `FIXED_DT = 1/60 s` accumulator driven by
  the rAF timestamp, with every gameplay timer stored as remaining duration. At 60, 90 or
  120 Hz the simulation runs 60 steps per real second. At 30 FPS it runs 2 steps per frame.
  The game's real-time speed is identical everywhere.
- **New:** `GameLoop.suspend()` cancels rAF. `GameLoop.resume()` sets
  `lastTimestamp = null` and `accumulator = 0` before requesting a frame. Without this,
  the first frame after returning would feed up to `MAX_FRAME_TIME_SECONDS` (0.25 s) into
  the accumulator. That is harmless while PAUSED, but it would advance a held-off
  `VICTORY` countdown or any non-paused state (M4.2 "no catch-up"). While suspended, no
  loop runs and no wake lock is held (M10.6).
- **Test (Vitest, shared):** drive `GameLoop.tick` with synthetic timestamps at 8.33 ms
  (120 Hz), 11.11 ms (90 Hz), 16.67 ms (60 Hz) and 33.3 ms (30 FPS) over 10 simulated
  seconds. Each run gives 600 ± 1 simulation steps and the same player x after holding
  right. A suspend/resume test with a 10-minute gap gives 0 extra steps.
- Known, accepted visual note: 60 Hz simulation shown on a 90 Hz screen repeats some
  frames (a slight 3:2 judder). Render interpolation with the existing `alpha` would remove
  it. That is a shared renderer change and is **not** in this scope. It is recorded as risk
  MR8.

### 8.3 Back button / gesture (M5; `backButton.ts`)

A single `App.addListener('backButton', …)` listener stays registered for the app's whole
life. The Capacitor App plugin implements it with `OnBackPressedCallback`, which works with
predictive back (M5.3) and never uses the deprecated `onBackPressed`. Resolution order:

1. If an Android shell overlay is open (Help or Settings), close it and return to where it
   was opened.
   > **Amendment A1 (2026-09-25, v1.1; H1):** rule 1 now reads: "If any Android shell
   > overlay is open (Help, Settings **or Privacy**), close the **topmost** one and return
   > to where it was opened." Overlays form a small stack. Privacy sits on top of Settings,
   > so back from Privacy returns to Settings with focus on its "Privacy policy" item, and a
   > second back closes Settings to the title.
2. If RotatePrompt is showing → `App.minimizeApp()` (leave the app).
3. Otherwise → shared `commands.handleBack()`:

> **Amendment A11 (2026-09-27, v1.5; PRD-mobile v1.5 M2.10a behavior 5 and the dated M5
> note):** rule 2 now covers both prompt messages (portrait and "Make the window larger to
> play.") and is evaluated **first**, before rule 1. While a prompt shows, any shell
> overlay underneath is hidden (§6.2.1 behavior 2), so back must leave the app as the M5
> "Rotate your device" row says, not close an overlay the player cannot see. The hidden
> overlay stays open and returns when the window is large enough again.

| State | handleBack result | PRD M5 row |
|---|---|---|
| PLAYING (incl. intro, boss warning) | `pause()` → `'handled'` | Pause |
| PAUSED with confirm pending | `cancelRestartGame()` → `'handled'` | Cancel prompt |
| PAUSED | `resume()` → `'handled'` | Resume |
| GAMEOVER | `returnToTitle()` → `'handled'` | Go to title |
| VICTORY | no-op → `'handled'` (silent, by design) | F19 AC9 Esc exemption |
| TITLE | `'leaveApp'` → platform calls `App.minimizeApp()` | Leave the app |

**[v1.1] Shell-overlay rows (handled before `handleBack()`, rule 1):**

| Overlay open | Back result | PRD |
|---|---|---|
| Help (first-launch or "How to play") | Close. First-launch Help does **not** start the run (only "Got it" does). | M8 |
| Settings | Close → title | M8.2 |
| **Privacy overlay** | **Close → Settings** (focus returns to "Privacy policy") | **M11.4a** |

"Leave the app" uses `minimizeApp()` (task to background, the same thing Android 12+ does
by default at a root activity). **Quit** uses `exitApp()` (the activity finishes; the next
launch starts on the title, M6.1). Back never exits directly from play (M5.2).

### 8.4 Quit (M6)

`commands.quit()` commits the best score first (F20 AC4(d), M6.3) and then calls
`services.quitApp()`. On Android that is `App.exitApp()` and returns `'closed'`, so
`quitBlockedMessageActive` is never set and the tab-close text never appears (M6.1). The
title-screen Quit (M6.2) calls the same command.

### 8.5 Keep screen awake (M4.5)

`onFrame` watches for a change in `state === 'PLAYING'` and calls
`GameShell.setKeepAwake({enabled})`, which adds or clears
`WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON` on the UI thread. Title, pause and end
screens use the normal timeout. This is a window flag, not a `WAKE_LOCK` permission.

### 8.6 First-launch help and settings (M8, M3.13)

- These are Android-only shell overlays (M3.12: the web has no help overlay). The game
  state stays `TITLE` while they are shown.
- Start tap on Android: if `settings.helpSeen` is false → show HelpOverlay; "Got it" →
  persist `helpSeen = true` → `commands.startRun()` (the level-1 F18 intro starts after
  dismissal, M8.1). Otherwise → `startRun()` directly.
- The title has "How to play" and "Settings" buttons (M8.2). They are not added to the
  pause menu, so F6 AC2's four options stay unchanged.
- Settings: "Swap controls" toggle. It is persisted immediately on change and re-lays-out
  immediately.
- **[v1.1, H1] Settings also has a "Privacy policy" item** (`data-action="privacy"`,
  ≥ 48 dp) that opens the privacy overlay (§8.7). Title → Settings → Privacy policy is
  2 taps (M11.4a). Settings is reachable only from the title, so the policy can never be
  opened mid-run.

### 8.7 In-app privacy policy [new in v1.1; review-v1 H1; PRD-mobile M11.4a; M-ADR-0009]

**Structure** (`src/platform/android/PrivacyOverlay.ts`, built with `src/ui/dom.ts`
helpers and `textContent` only, per L4b). It is a full-viewport panel in `#safe-layer`,
inset by the edge insets, background `#05050a`:
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → heading "Privacy policy"
- a "Close" `<button data-action="overlay-close">` with a ≥ 48 dp target, at the top on the
  THROW-side edge, inside the insets
- `<iframe src="/privacy.html" sandbox="" referrerpolicy="no-referrer" title="Privacy policy">`
  filling the rest of the panel
  - The empty `sandbox` disables scripts, forms, popups and top-level navigation, and gives
    the frame an opaque origin.
  - The source path is the constant `'/privacy.html'`: android mode has base `/`, and there
    is no user-supplied URL.
- `touch-action: pan-y` on the panel and iframe (overriding the Android-wide
  `touch-action: none`), so a long policy scrolls. The junior developer verifies scrolling
  on the emulator.

**Behavior:**
- **Open:** from Settings only.
- **Close:** by the Close button or back (§8.3), returning to Settings.
- **No state change:** the game state stays `TITLE` throughout, and no GameCommand is
  called.
- **Keyboard:** Esc on a hardware keyboard closes the overlay, the same as back.
- **The iframe is created on open and removed on close.** Nothing loads at startup, and the
  M10.3 cold start is unaffected.

**Network:** none. The frame request goes to the same origin (`https://localhost/privacy.html`)
and is served from the APK by Capacitor's asset interceptor. It is included in the §7.3.1
verification. No plugin, no `fetch`, no external intent.

**`public/privacy.html` content rules.** mobile-technical-writer owns the final text at
step 13. Step 7 commits a placeholder that meets these rules and states "collects and shares
no data":
- static HTML, `lang="en"`, `<meta charset="utf-8">`,
  `<meta name="viewport" content="width=device-width">`
- **no `<script>`**, no event-handler attributes, no external resources (no remote CSS,
  fonts or images); inline `<style>` only
- **no outbound `<a href>` links.** The hosted URL and contact email are plain text, so
  nothing in the sandboxed frame can try to navigate.
- readable both inside the overlay (dark `#05050a` background, light text, ≥ 16 px body) and
  as a standalone web page

**Same text as hosted.** It is the same file, so it matches by construction for a given
commit. The Play build lags the website, so a **material change to `privacy.html` requires
an Android release**. mobile-technical-writer records this rule in the release runbook.
Pass 2 compares the SHA-256 of the release build's `dist-android/privacy.html` with the
deployed file.

**Web:** unchanged. `WebPlatform` adds no privacy UI. `privacy.html` in `dist/` is the
hosted page that M11.4 already requires.

---

## 9. Local save data (M-ADR-0006)

### 9.1 Decision

Best score and Android settings use the **same WebView `localStorage`** the website uses,
through one shared module. No storage plugin is added. This keeps F20 AC15 literally true
(one implementation, both platforms) and stays inside the one-codebase rule with no owner
exception. The Capacitor WebView origin is pinned to `https://localhost` (§7.2), and its
storage lives in the app's private data directory. That directory survives app close,
process death, reboot and Play updates. It is erased only by uninstall or "Clear storage"
(M7.4).

### 9.2 Keys and schema

| Key | Written by | Value | Validation on read (fail closed → default) |
|---|---|---|---|
| `vvs:best` | shared `bestScore` (web + Android) | JSON number, e.g. `12450` | Must parse; must be a number, integer, finite, ≥ 0, ≤ `Number.MAX_SAFE_INTEGER`. Otherwise → 0. Test inputs include `"abc"`, `"-5"`, `"1.5"`, `"{}"`, `"null"`, `"1e400"`, `""` (F20 AC9). |
| `vvs:settings` | Android `settings.ts` (never written by web) | `{"v":1,"swapControls":false,"helpSeen":false}` | Must parse to a plain object. Each field is validated on its own (`typeof === 'boolean'`, else default). Unknown fields are ignored. **[v1.1, L4c]** Read only the known fields by name into a **fresh** object literal. Never spread, `Object.assign` or merge the parsed object, so an own `__proto__` key has no effect. Test input includes `{"__proto__":{"swapControls":true},"v":1}` → defaults. |
| `vvs:metrics` | existing Instrumentation (W-ADR-0005) | unchanged | unchanged. Separate key, so corrupting one never touches another (F20 AC11). |

- **Why no version wrapper on `vvs:best`:** F20 AC12 says the only thing stored is a single
  whole number. If the format ever changes incompatibly, a new key name is used
  (`vvs:best:v2`) and migration code reads the old key once.
- **Settings schema version `v`:** readers accept `v === 1`. On upgrade to a future `v:2`,
  `settings.ts` gets a `migrate(v1) → v2` function and writes back v2 on the next change.
  A **higher** version than the code knows (a downgrade install) is read field-by-field
  with the same per-field validation and is not overwritten until the player changes a
  setting. A missing or garbage value → defaults, with no crash and no error shown (M7.5).
- **What happens on app upgrade (Play update N → N+1):** nothing runs. The keys and origin
  are unchanged, so values carry over. The M7.4 test installs build N, sets values,
  installs N+1 over it, and checks them. The one upgrade hazard is an origin change
  (`androidScheme`/`hostname`). Those are pinned, and a unit test asserts
  `capacitor.config.ts` still has `androidScheme: 'https'` and `hostname: 'localhost'`.
  **[A8, N2]** `check-capacitor-config.mjs` asserts the same on the generated
  `capacitor.config.json`, which is the file that actually ships.
- **Writes:** synchronous `localStorage.setItem` inside try/catch. On failure (quota, blocked)
  the in-memory value is kept and play is never interrupted (F20 AC10). Settings are
  written on every change. Best is written at each F20 AC4 event.
- **[v1.1]** The privacy overlay stores nothing. No "policy seen" flag is kept.

### 9.3 Best-score module (shared, one implementation — F20 AC15)

```ts
// src/persistence/bestScore.ts
export interface BestScoreStore {
  get(): number;                                        // validated value or in-memory fallback
  commit(score: number): { previous: number; best: number; isNewBest: boolean }; // max(); isNewBest = score > previous && score > 0
  commitIfRunActive(world: World): void;                // F20 AC4(e) helper
}
```
- Call sites (all shared): the GameLoop post-step hook when the state changes
  PLAYING → GAMEOVER (F20 AC4(a)) or → VICTORY (AC4(b), when the sequence begins);
  `confirmRestartGame()` before the reset (AC4(c)); `quit()` before `quitApp()` (AC4(d));
  `pauseForInterruption()` / web page-hidden (AC4(e)).
- New `World` fields (shared): `bestScore: number` (display) and `newBestThisRun: boolean`
  (set from `commit().isNewBest` at run end). ScreenController shows "Best: N" on title and
  end screens and "New best!" as text (F20 AC1-AC3, AC13). The best is not shown in the HUD
  (AC14).
- The website pipeline implements F20 through the same module. If a website ADR for F20
  picks a different key or API before this is built, one of the two ADRs is amended so
  there is still exactly one module. The mobile side has no separate copy.

### 9.4 Contingency: needing a storage plugin is an owner exception, not decided here

If the M7.4 checks fail on the emulator (update N → N+1, reboot, `am kill` after
backgrounding with a 5 s wait, Quit → relaunch), the fallback is `@capacitor/preferences`
behind a `KeyValueStore` adapter. `safeStorage` already has the right seam: `bestScore` and
`settings` call `safeStorage`, not `localStorage` directly. The Android build would then
load from Preferences once at boot (async) into the same in-memory cache. **Storage is not
one of the permitted platform-specific areas.** M-ADR-0006 therefore records this path as
*Proposed — requires owner exception*, and it is raised through mobile-product-manager.
I am not deciding it (see Owner question OQ-A1 at the end of this document).

Note: my agent brief suggested Capacitor Preferences as the default. I deviate on purpose.
F20 AC15, the addendum's own architect note, and the main session's instruction all make
shared storage the default and a plugin the exception.

### 9.5 Restart Level and Q-v3-1 (open owner question): either answer is a small change

- New shared `World.levelStartScore`, set wherever a **fresh** level begins:
  `createNewRunWorld()` (0) and the WinLossSystem level-advance branch (`world.score`
  before `resetForLevel`). Restart Level does **not** set it.
- New shared game-rule constant in `src/config/constants.ts`:
  `export const RESTART_LEVEL_SCORE_POLICY: 'keep' | 'rollback' = 'keep';`. It is the same
  on both platforms (M0.3).
- The Restart Level branch of `selectPauseOption` does
  `if (RESTART_LEVEL_SCORE_POLICY === 'rollback') world.score = world.levelStartScore;`.
- **Option (a) keep:** ship as is. **Option (b) rollback:** flip the constant, add the F6
  AC4/F10 AC4 amendment, and add about 3 tests. **Option (c) exclude restarted runs:** needs
  a `runUsedRestartLevel` flag, a skip in `bestScore.commit`, and a new end-screen message.
  It is not pre-built because it needs UX copy.
- Interaction to note for (b): F20 AC4(e) can save a mid-level score when the app is
  backgrounded, and a later Restart Level then rolls those points back. The best can then
  reflect a peak that was rolled back. It is bounded (one level's points) and cannot be
  farmed. Mentioned so the PM can decide whether the PRD wording needs a note.

---

## 10. CI: one pipeline guards both versions (M-ADR-0008; amended by M-ADR-0011, 0012 and Amendments A8, A9, A10, A11, A12)

Changes to the repo-root `.github/workflows/deploy-pages.yml`. **The existing `build` job's
steps stay exactly as they are** (Node 20, lint, test, build with `VITE_BASE_PATH`,
upload-pages-artifact). Additions:

> **Amendment A4/A5 (2026-09-25, v1.1; M2, M3, M4):** the `build` job gains three steps:
> - the secret check (§7.5.3), first after checkout
> - `npm audit`
> - the purity check (below)
>
> The web build steps themselves (lint, test, build, upload) are unchanged. Permissions
> and concurrency change as specified in §10.3. Items 2 and 3 below are superseded **only**
> where §10.3 says so. The rest of their text stands.

1. `build` job, one new step after `npm run build`: **web-bundle purity check**. It fails
   if `dist/assets/*.js` contains `@capacitor` or `registerPlugin` (proves C3 and the
   tree-shaking in §3.1).
2. New job `android-build` (ubuntu-latest, same working-directory default):
   `actions/checkout@v4` → `actions/setup-java@v4` (temurin, 21) → `actions/setup-node@v4`
   (22, npm cache) → `gradle/actions/setup-gradle@v4` → `npm ci` →
   `npm run build:android` → `npx cap sync android` →
   `./gradlew assembleDebug --no-daemon` (working-directory `…/scaffold/android`) →
   `node scripts/check-android-permissions.mjs` (runs `aapt2 dump permissions` on
   `app-debug.apk`; fails on anything outside the allowlist in §7.3) →
   `actions/upload-artifact@v4` (`app-debug.apk`, retention 7 days).
3. New job `mobile-e2e` (ubuntu-latest): setup-node 22 → `npm ci` →
   `npx playwright install --with-deps chromium` → `npm run build:android` →
   `npm run test:e2e:mobile`. The Playwright config serves `dist-android` with
   `vite preview` and runs Chromium with `hasTouch: true`, `isMobile: true`, landscape
   viewports **640×360, 800×360, 915×412, 1280×800**, `deviceScaleFactor` 2. Outside
   Capacitor, `AndroidPlatform` uses GameShell's **web fallback** (from
   `registerPlugin('GameShell', { web: … })`). It returns insets from the `?insets=l,r,t,b`
   query parameter (default 0) and no-ops keep-awake. The test-only debug hook
   `window.__vvsTest` (read-only world snapshot + per-frame player-x log) is created
   **only** when `?e2e=1` is present **and** `Capacitor.isNativePlatform()` is false. It
   never exists in the installed app. (**[v1.1, L4a]** further constraints in §14.1.)
   **[A12]** The web fallback also reads `?cutout=top,bottom` (default `0,0`; §6.1 A12).
4. `deploy` job: `needs: [build, android-build, mobile-e2e]`. A break in either version
   blocks the website deploy (C4).

Node 22 is used only in the new jobs, because Capacitor's CLI requires it for current
majors. The web job keeps Node 20, so web CI behavior is unchanged. `npm ci` on Node 20 may
print an engines warning for `@capacitor/cli`. That is expected and not an error.

### 10.1 What the phone-emulation suite must cover (minimum)

Layout sums and control positions at each viewport, with and without `?insets=24,24,0,24`
and swap (M2.4, M2.12 (a)); no control inside insets (M2.3a); menu targets ≥ 48 px (M3.8);
touch visibility per state (M3.9); THROW latch and not-ready state (M3.5); two-pointer
cancel (M3.4); back mapping via a test-only call to the same `backButton` handler (M5
table); help overlay first-run and "Got it" (M8.1); settings persistence across reload
(M7.3); best-score fail-closed inputs (F20 AC9, M7.5); no network requests during a run
(Playwright request log empty apart from same-origin assets, M11.1).

**[v1.1, H1 / M11.4a] Added:** Title → Settings → "Privacy policy" opens the overlay in
exactly 2 taps. The iframe loads `/privacy.html` (same-origin request only; the request
log has no other origin). The frame has `sandbox=""`. The Close button and the back
handler each return to Settings with the game state still `TITLE`. The overlay cannot be
reached from PLAYING or PAUSED. Static check: `dist-android/privacy.html` contains no
`<script` and no `href="http`.

**[v1.5, A11 / M2.10a] Added:**
- **Unit (`layout.test.ts`):** every row of the §6.2.1 worked-check table, including the
  exact boundary (624 × 300 playable; 623 × 300 and 624 × 299 too small), plus a check
  that the classification and `computeLayout(...).belowFloor` agree over a grid of sizes
  and insets, in both swap settings.
- **Playwright:**
  - a **600 × 360** viewport with `?insets=24,24,0,24` shows only "Make the window larger
    to play."; 5 taps change nothing.
  - During play at 640 × 360, `page.setViewportSize` to 600 × 360 → the prompt shows and
    the state is PAUSED. Restoring 640 × 360 → the pause menu shows, and the
    `__vvsTest` snapshot (score, lives, level, enemies, timers) matches the pre-shrink
    values.
  - A portrait viewport (360 × 640) shows the rotate text, not the too-small text.
  - The back handler (test-only call) on the prompt takes the leave-app path even with
    Settings open underneath.
- M2.10a (a)-(d) on real AVDs (`svr_api36_fold`, `svr_api36_pixel7` with a window shrink,
  the largest-font check) run in step 10 per `device-matrix.md`.

**[v1.6, A12 / M2.3b] Added** (PRD-mobile M2.3b (a)-(e); M2.10a v1.6 note; code-review-round8 I3, S1):
- **Unit (`layout.test.ts`):**
  - Every row of the §6.2.1 A12 worked-check table in both swap settings, and every
    §6.4 A12 row. The A11 rows whose numbers changed are updated to the A12 values
    (§6.2.1 A12 rows 15-17).
  - `normalizeInsets`:
    - an absent or non-finite cutout field → equal to its edge inset;
    - a negative field → 0;
    - a cutout larger than its edge → the edge is raised;
    - a complete, valid payload is unchanged.
  - An **invariant grid**:
    - W 560-1400 and H 280-820 in 20 dp steps;
    - l and r ∈ {0, 24, 30, 48}, t ∈ {0, 24, 28.2, 36}, b ∈ {0, 24, 32, 40};
    - cT ∈ {0, t} and cB ∈ {0, b};
    - both swap settings.

    For every playable result, assert:
    - `s ≥ 0.5`;
    - `pfY ≥ cT` and `pfY + pfH ≤ H − cB`;
    - `pfY + 4s ≥ t − 1e-9` and `pfY + pfH − 13s ≤ H − b + 1e-9`;
    - every control rect is inside the full insets and does not overlap the playfield's x
      range;
    - `classifyWindow` agrees with `belowFloor`.
- **Playwright** (web fallback `?insets=l,r,t,b&cutout=t,b`; 640 × 360 viewport unless
  stated):
  - **(a) The reference phone plays.** Insets (30,30,24,32), (30,30,28.2,32) and
    (29.7,29.7,28.2,32), each in the default and swapped layouts:
    - no prompt on the title;
    - Start (dismiss Help if shown) → PLAYING;
    - hold ▶ for 500 ms → the player's x increases; tap THROW → a shield is in flight;
    - ◀ ▶ THROW ≥ 56 px, PAUSE ≥ 48 px, ≥ 8 px between adjacent targets, and every
      control inside the full insets;
    - the `#game-canvas` rect is ≥ 400 × 300.
  - **(b) Three-button navigation plays.** The same checks for (0,48,24,0) and
    (48,0,24,0).
  - **(c) Text and controls stay out of the bands.** For every (a) and (b) case, while
    PLAYING and before the first throw (so `#control-text` is laid out):
    - each `.hud-panel` content-box top (`rect.top + borderTopWidth + paddingTop`) ≥ t;
    - the `#control-text` content-box bottom ≤ H − b;
    - canvas text: `canvasRect.top + 4·s ≥ t`, with `s = canvasRect.height / 600`;
    - every control inside the full insets;
    - the playfield rect may extend into [0, t) and (H − b, H]: no assertion.

    Tolerance is 0.01 px. Attach one screenshot per case to the test output.
  - **(d) No art under a cutout.**
    - `?insets=30,30,24,32&cutout=30,0` → playable and `canvasRect.top ≥ 30`.
    - `?insets=30,30,24,32&cutout=0,32` → playable and `canvasRect.bottom ≤ 328`.
  - **M2.10a (c) v1.6.** With `?insets=30,30,28.2,32`: 640 × 360 shows no prompt, and
    600 × 360 shows the prompt. The A11 test at 600 × 360 with the planning insets stays.
  - **Keyboard under the prompt (I3; also round-8 S1 / MR20 regression cover):**
    - At 600 × 360 on TITLE, press Enter → the state stays TITLE and Help is not shown.
    - Start a run at 640 × 360, shrink to 600 × 360, press Escape twice and Enter, wait
      2 frames → the state is PAUSED, and the `__vvsTest` snapshot (enemy positions,
      timers, score) is unchanged. Restore 640 × 360 → the pause menu shows.
    - With Settings open underneath, Escape under the prompt leaves Settings open; it is
      visible again after the restore.
- **Device (step 10, `device-matrix.md`; lead tester):**
  - **M2.3b (e)** on the representative 640 × 360 dp AVD (16:9, no cutout, gesture
    navigation, API 34+):
    - cold launch → title with no prompt; Start → 30 s of normal play;
    - record all six reported inset fields (the `#safe-layer` offsets and
      `--vvs-cutout-top/bottom`) and `--pf-scale` next to the screenshot.
  - **M2.3b (c)** emulator screenshots, one per navigation mode.
  - **M2.10a (c)** and **M2.12 (b)** are re-judged on this AVD.
  - The `svr_api36_pixel7` `wm size` 640 × 360 run is recorded as the expected width-limit
    prompt (§6.2.1 A12 row 9), not as an M2.10a (c) result.

### 10.2 The 40/40 slide test (M3.3a, UX carry-forward 3)

Uses a CDP session `Input.dispatchTouchEvent` to run 20 continuous ◀→▶ and 20 ▶→◀
swipes, each crossing in 150-300 ms, while logging player x per frame through
`window.__vvsTest`. Pass: 40/40 switch within ≤ 100 ms of entering the new button, 0
zero-velocity frames while crossing the gap, and 0 wrong-direction frames after entry. It
runs in default and swap layouts. The same spec runs again on the emulator in step 10, and
the results go in `docs/mobile/tests/validation-report.md`.

**Recommended, not required:** add a `pull_request` trigger (same `paths`) so the three
check jobs run before merge, with `deploy` guarded by
`if: github.event_name != 'pull_request'`. This is left to the PM, because the owner
decision only says "add to deploy-pages.yml". **[v1.1, M3]** If it is adopted: use
`pull_request`, **never** `pull_request_target`, and apply the concurrency change in §10.3.

Full Android-emulator suites (lifecycle, back with gesture and 3-button navigation, M7.4
update/reboot, cutout emulators, 120 Hz) run on the owner's machine in step 10 per
`device-matrix.md`. They are not in CI.

### 10.3 CI hardening and release-manifest gate [new in v1.1; review-v1 M2, M3, M4, L1, L3, L5; M-ADR-0011, M-ADR-0012; amended by A8, A9, A10]

**Permissions (M3):**

```yaml
permissions:            # top level: replaces today's contents/pages/id-token grant
  contents: read
jobs:
  build:          # no permissions block → contents: read only
  android-build:  # no permissions block → contents: read only
  mobile-e2e:     # no permissions block → contents: read only
  deploy:
    permissions:
      pages: write
      id-token: write
```
- Every `actions/checkout` in `build`, `android-build` and `mobile-e2e` sets
  `persist-credentials: false`. `git ls-files` in the secret check does not need
  credentials.
- **Concurrency:** today's workflow-level `concurrency: { group: pages, cancel-in-progress: true }`
  moves onto the `deploy` job unchanged, so the master deploy behavior is unchanged. The
  workflow level becomes `group: ${{ github.workflow }}-${{ github.ref }}`,
  `cancel-in-progress: true`, so a future PR run can never cancel a master deploy.

**`build` job, final step order:**
1. checkout
2. `node scripts/check-no-secrets.mjs` (M2, §7.5.3; **[A8]** whole-repository scope, §14.1 N3; **[A9]** S1 template carve-out + S6 content scan, §7.5.3)
3. setup-node 20
4. `npm ci`
5. **`npm audit --omit=dev --audit-level=high`** (M3)
6. lint
7. test (**[A10]** includes the `check-android-styles` real-tree tests, §6.6 A10 item 3)
8. build (`VITE_BASE_PATH`)
9. web-bundle purity check
10. upload-pages-artifact

Steps 2, 5 and 9 are the only additions.

> **Amendment A10 (2026-09-27, v1.4):** no workflow step is added by A10. The
> `styles.xml` guard runs inside step 7 because the Vitest `include` covers
> `scripts/**/*.{test,spec}.mjs`. A separate visible step in `android-build` is optional
> (code-review-round7 S1) and, if added, goes after `npx cap sync android` and only once
> the guard fails closed (§6.6 A10 item 3.4).

**`android-build` job, final step order** (supersedes the step list in item 2 above):
1. checkout
2. setup-java 21
3. setup-node 22
4. setup-gradle
5. `npm ci`
6. `npm run build:android`
7. `npx cap sync android`
8. **`node scripts/check-capacitor-config.mjs`** (L3; **[A8]** extended by N2 and N5, §14.1)
9. `./gradlew assembleDebug --no-daemon`
10. **`node scripts/check-android-manifest.mjs --variant debug --apk app/build/outputs/apk/debug/app-debug.apk`**
11. **`./gradlew assembleRelease -PvvsCiUnsignedRelease=true --no-daemon`** (unsigned; §7.5.2 rule 6)
12. **`node scripts/check-android-manifest.mjs --variant release --apk app/build/outputs/apk/release/app-release-unsigned.apk`** (M4)
13. upload-artifact (`app-debug.apk` only, 7 days). The unsigned release APK is not uploaded.

**`scripts/check-android-manifest.mjs`** (replaces v1's `check-android-permissions.mjs`,
M4). Input is `--apk` (it runs `aapt2 dump xmltree --file AndroidManifest.xml`) or
`--manifest-xml` (`bundletool dump manifest` output). It checks these rules:

| Rule | Variant | Fails when |
|---|---|---|
| R1 Permissions | both | Any `uses-permission`/`uses-permission-sdk-23` other than `<applicationId>.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. INTERNET is allowed only with `--allow-internet` (the §7.3.1 fallback). |
| R2 Debuggable | release | `android:debuggable="true"` |
| R3 Cleartext | both | `android:usesCleartextTraffic` is not explicitly `false`, or a `networkSecurityConfig` is present |
| R4 Backup | both | `android:allowBackup` is not explicitly `false` |
| R5 Components | both | **Providers [A8, review-v1b N1; replaces v1.1's "Any `<provider>`"]:** every `<provider>` fails **except** `androidx.startup.InitializationProvider` with `android:exported="false"` and no `android:grantUriPermissions="true"`. Independently of that allowlist, a provider always fails if it is exported, if its class is `androidx.core.content.FileProvider` (or a subclass), if it has a `<grant-uri-permission>` child, or if it has a `FILE_PROVIDER_PATHS` (`android.support.FILE_PROVIDER_PATHS`) `<meta-data>` entry. **Other components (unchanged):** any exported component other than MainActivity (MAIN/LAUNCHER) and the allowlisted `androidx.profileinstaller.ProfileInstallReceiver` guarded by `android.permission.DUMP`. Any `<data android:scheme>` in an intent filter. |
| R6 Test-only | release | `android:testOnly="true"` |
| R7 SDK levels | both | `minSdkVersion ≠ 24` or `targetSdkVersion ≠ 36`. Update this together with `variables.gradle`. |

**R5 implementation notes [A8] (binding for mobile-junior-developer):**
- Both allowlist entries (`androidx.startup.InitializationProvider` and
  `androidx.profileinstaller.ProfileInstallReceiver`) are named constants in the checker
  source, each with a comment citing this section and review-v1b N1 / review-v1 L1.
  Matching is on the exact, fully qualified class name after resolving a leading `.`
  against the package. Adding any entry needs a security review.
- `exported` must be **explicitly** false for the allowed provider; absent counts as a
  failure.
- Because the allowlist matches exact names, a FileProvider subclass with any other name
  already fails. The explicit FileProvider / `<grant-uri-permission>` / `FILE_PROVIDER_PATHS`
  checks are defense in depth: they also fire on the allowlisted name, so the allowlist can
  never be used to re-admit a file-sharing provider. As a name heuristic, any provider class
  ending in `FileProvider` also fails. The error message names the provider and the rule
  that fired.
- Parse booleans from both input forms: `aapt2 dump xmltree` (`(type 0x12)0x0` = false,
  `(type 0x12)0xffffffff` = true) and `bundletool dump manifest` (`"false"`/`"true"`).
  Unit-test R5 with fixtures for both forms: (a) the expected Capacitor merged manifest
  (InitializationProvider non-exported + ProfileInstallReceiver) → pass; (b) the template
  FileProvider → fail; (c) InitializationProvider with `exported="true"` → fail;
  (d) InitializationProvider with `grantUriPermissions="true"` → fail;
  (e) InitializationProvider with a `FILE_PROVIDER_PATHS` meta-data entry → fail;
  (f) InitializationProvider with no `exported` attribute → fail; (g) any unknown provider
  → fail.
- The first `cap add` + `assembleDebug` merged manifest is the confirmation the reviewer
  asked for. Attach its provider/receiver list (`aapt2 dump xmltree` excerpt) to the
  step-8 review evidence.

**Step 15 (mobile-release-engineer), required before any upload (M4; [A8] N4):**
1. Run a fresh `npm run android:sync` (L3).
2. Run `gradlew bundleRelease`, signed per §7.5. Build from the command line only; never
   Android Studio's "Generate Signed Bundle/APK" wizard (§14.1 N3).
3. Run `java -jar bundletool-all-<pinned>.jar dump manifest --bundle app/build/outputs/bundle/release/app-release.aab > release-manifest.xml`.
4. Run `node scripts/check-android-manifest.mjs --variant release --manifest-xml release-manifest.xml`.
5. **[A8, review-v1b N4] Signed-AAB cold-start smoke.** Install the **signed release AAB**
   and cold-start it, with INTERNET absent, on two emulator images:
   - the **API 36** image, and
   - an image whose **WebView is ≥ 80**: the API 24 image if its WebView is ≥ 80, otherwise
     the mid image used in §7.3.1.

   For each image:
   - `java -jar bundletool-all-<pinned>.jar build-apks --bundle app/build/outputs/bundle/release/app-release.aab --output <tmp>\vvs-smoke.apks --connected-device`
     (with only that emulator attached, or `--device-id`), then
     `java -jar bundletool-all-<pinned>.jar install-apks --apks <tmp>\vvs-smoke.apks`.
   - `<tmp>` is a scratch folder **outside the repo and outside OneDrive** (the `.apks`
     extension is not covered by the ignore list). Delete the `.apks` file after the smoke;
     it is never uploaded.
   - Do not pass keystore passwords on the command line. If `build-apks` needs a signing
     key for the device APKs, either let it use the local debug keystore (the smoke tests
     the code and resources in the AAB, not the signature, and these APKs are never
     distributed) or pass `--ks-pass=file:<path>` to a file outside the repo and OneDrive.
   - `adb shell am force-stop <appId>`, then launch. **Pass:** the title renders, and
     Title → Settings → Privacy policy opens the privacy overlay. logcat shows no
     `net::ERR_*`, no blocked-load error for `https://localhost/*`, and no
     `ClassNotFoundException`/`NoSuchMethodError` (R8 symptoms).
6. Paste into `docs/mobile/release/submission-checklist.md`: the checker output, the
   bundletool version, the AAB's SHA-256, and **[A8]** the smoke result per image (image,
   API level, WebView version, pass/fail, logcat notes), next to the manifest output.
7. Any failure stops the upload.

bundletool is installed via `tooling-requests.md` on the owner's machine only, never in
CI.

**Pinning (L5):**
- `gradle/actions/setup-gradle` and `actions/setup-java` are referenced by full commit SHA
  (`uses: gradle/actions/setup-gradle@<40-hex> # v4.x.y`).
- Wrapper validation stays on (setup-gradle's default; never set `validate-wrappers: false`).

---

## 11. Non-functional requirements

| Requirement | How it is met |
|---|---|
| M10.1 ≥ 30 FPS low-end at level 10 | Same renderer workload; backing store at s×dpr (≈ 832×624 on 720p low-end); offscreen sprite cache fallback (§6.5) |
| M10.2 frame-rate independence | Fixed-step accumulator + suspend/resume (§8.2) |
| M10.3 cold start ≤ 5 s / 3 s | Small bundle, no network, splash hidden after frame 1. The privacy iframe is created only on open (§8.7). |
| M10.4 endurance | No per-frame DOM rebuild (ScreenController view key, HUDView already diffs); pointer maps cleared on up/cancel |
| M10.5 ≤ 15 MB | Web assets < 1 MB; three official plugins + one local plugin; no source maps in the APK (§3.1, L2) |
| M10.6 background cost | rAF cancelled; keep-awake cleared; no timers |
| M3.6 ≤ 100 ms touch latency | Event → state; sampled next rAF; ≈ ≤ 50 ms |
| M11.1-M11.3 offline, no permissions, no data | No INTERNET permission (verified per §7.3.1 on debug and, **[A8]**, on the signed AAB at step 15; fallback documented), no network code, no SDKs, backup disabled, logcat console only in debug |
| **M11.4a in-app privacy policy [v1.1]** | Bundled `privacy.html` in a sandboxed same-origin iframe overlay, reached Title → Settings (2 taps), offline, back returns to Settings (§8.7) |
| **M2.10a too-small window [v1.5, A11]** | §6.2.1 classification on every re-layout (synchronous, ≤ 1 s); prompt pauses, hides everything else and blocks taps; restore returns to the pause menu or the prior screen |
| **M2.3b playfield under the top/bottom gesture bands [v1.6, A12]** | GameShell reports the top/bottom cutouts separately (§6.1 A12). `computeLayout` limits the playfield height by cutouts only, and places it so that all playfield text stays inside the full insets (§6.2 A12, §6.5 A12). Floor: `H ≥ max(cT, t − 2) + max(cB, b − 6.5) + 300` (§6.2.1 A12). The 640 × 360 reference phone plays at s = 0.505 with 8.3 dp vertical headroom (§6.3 A12). Keyboard is gated while a prompt shows (§6.2.1 A12 behavior 4). |

---

## 12. Risks and mitigations

| # | Risk | Mitigation | Owner |
|---|---|---|---|
| MR1 | WebView `localStorage` loses a just-written best on process kill (Chromium batches disk commits) | Save at every F20 event, not only on exit; M7.4 kill test; contingency §9.4 (owner exception) | junior dev, lead tester, PM |
| MR2 | Capacitor's edge-to-edge handling fights our inset layout | Disable it (§6.6); lead dev verifies full-bleed WebView on a cutout AVD | junior dev, lead dev |
| MR3 | Notification shade / system dialog is not detected by `pause` | GameShell `windowFocusChanged` (§8.1); emulator test in step 10 | junior dev, lead tester |
| MR4 | Real gesture insets > 32 dp on a 640×360 device push the playfield below 0.5× | Documented `belowFloor` path (§6.2); device matrix records actual insets. **[A11]** Such a device now shows the M2.10a prompt instead of a sub-0.5× playfield (§6.2.1). If real devices hit this, the fix goes through mobile-product-manager (e.g. a smaller-control or band layout under OQ-M7), not an ad hoc floor change. **[A12, code-review-round8 E1]** Real devices hit it on the **height** axis, and the PM's M2.3b decision relaxed that axis: the reference phone now fits with 8.3 dp of vertical headroom (§6.2.1 A12, §6.3 A12). **Known width limit (accepted, PRD-mobile M2.3b):** `l + r ≤ 64` on a 640 dp wide window. Gesture navigation (≈ 60) and three-button navigation (48) fit. A side camera cutout (for example the Pixel 7 `wm size` run, l + r ≈ 66; §6.2.1 A12 row 9) or an above-default back-gesture setting still shows the prompt. The closed test (step 16) asks testers to report any "Make the window larger to play." seen in full screen. If it appears, the options go to the owner through mobile-product-manager (PRD §7 v1.6 note), not an ad hoc floor or control-size change. | lead tester, UX, PM |
| MR5 | HUD at the 12 dp floor is ~1.5× larger relative to the playfield at 0.52× and covers more of the formation area | UX round-2 screenshot check (carry-forward 6); the HUD band is DOM, so it can be reflowed in `android.css` without touching game rules | UX, junior dev |
| MR6 | GameShell inset listener clobbers Capacitor's | Own child view or chained listener, insets not consumed (§6.6) | lead dev |
| MR7 | Accidental web behavior change | Web bundle purity check; `WebPlatform` = today's behavior; shared tests; web UX/test gates | lead dev, web pipeline |
| MR8 | 3:2 judder at 90 Hz | Accepted for v1; interpolation is a later shared change | PM (backlog) |
| MR9 | `minWebViewVersion`/`errorPath` do not behave as expected on the oldest API 24 images | Verify in step 10; otherwise record as a manual-only criterion | lead tester |
| MR10 | Play target API rises again during the long closed test | Release engineer re-verifies at step 15 (§7.1) | release engineer |
| **MR11 [v1.1]** | Bundled assets fail to load with INTERNET removed on some WebView versions (blank screen that CI cannot see) | §7.3.1 verification on API 24/36 (+ mid) at step 7; device-matrix row per release candidate; **[A8]** signed-AAB cold-start smoke at step 15 (§10.3 item 5); documented CSP fallback with security re-review | junior dev, lead tester, release engineer, security |
| **MR12 [v1.1]** | Upload key or password leaks via the repo or OneDrive, or a release is signed with the debug key | §7.5 contract (outside repo and OneDrive, fail-closed), ignore list first, CI secret check S1-S5; **[A8]** path guard and secret check cover the whole git repository (§14.1 N3); **[A9]** the only S1 exemption (exact `.env` template basenames) is content-scanned by S6 and logged (§7.5.3) | junior dev, release engineer, lead dev |
| **MR13 [v1.1]** | A compromised CI dependency publishes to Pages | Least-privilege permissions; `persist-credentials: false`; SHA-pinned third-party actions; `npm audit` (§10.3) | junior dev |
| **MR14 [v1.1]** | In-app privacy text drifts from the hosted text because the Play build lags the website | Single file; a material change requires an Android release (runbook); SHA-256 comparison at pass 2 (§8.7) | technical writer, release engineer, security |
| **MR15 [v1.1]** | The release manifest differs from debug (debuggable, exported components, cleartext) | Checker R1-R7 on the unsigned release in CI and on the signed AAB at step 15 (§10.3) | junior dev, release engineer |
| **MR16 [v1.2, A8]** | The manifest gate is wrong for a normal merged manifest, so it gets loosened or worked around without review (reopening L1 or disabling AndroidX Startup) | R5 names the one allowed provider exactly, with FileProvider/grant checks that override the allowlist; fixture tests; "stop and report" on any unexpected provider (§7.3 A6/A8, §10.3 R5) | junior dev, lead dev, security |
| **MR17 [v1.2, A8]** | Release WebView remote debugging, mixed content, an origin change or `allowNavigation` enters via the runtime config, which the manifest checker cannot see | Config guard extended (§14.1 N2); pass-2 `chrome://inspect` check | junior dev, lead dev, security |
| **MR18 [v1.3, A9]** | An emulator or build result comes from a stale or hand-edited build mirror, so it does not reflect the tree under review | Mirror refreshed from the repo before every build, never edited, never committed from; evidence counts only from a freshly refreshed mirror (§3 A9) | junior dev, lead dev, lead tester, release engineer |
| **MR19 [v1.4, A10]** | A theme value that is valid only on newer Android crashes older devices at launch (as `always` did on API 28, validation-report-round2 F1), or the three `styles.xml` copies drift so an edit affects only API 24-27 | Cutout mode split per API level; three-folder parity rule; `check-android-styles` guard in CI with the round-7 L1-L3 completions; API 28 image in the device matrix; Play pre-launch / closed test for API 29 (§6.6 A10) | junior dev, lead dev, lead tester |
| **MR20 [v1.5, A11]** | While a size or rotate prompt hides the pause menu, a hardware keyboard resumes the run unseen, or back closes an overlay the player cannot see | `onFrame` re-pauses any `PLAYING` state while a prompt shows; back checks the prompt before overlays (§6.2.1 behaviors 4 and 6, §8.3 A11); Playwright checks (§10.1). **[A12, code-review-round8 I3]** Closed at the source: while a prompt shows, the Android capture-phase keyboard gate blocks every `keydown` (keyup passes) and blurs focused hidden controls (§6.2.1 A12 behavior 4). The `onFrame` guard stays as defense in depth. Playwright keyboard-under-prompt checks are in §10.1 A12. | junior dev, lead dev |
| **MR21 [v1.6, A12]** | The text-edge constants (`TEXT_TOP_LOGICAL = 4`, `TEXT_BOTTOM_LOGICAL = 13`) drift from the shared HUD CSS or the canvas text positions, so text slides into a gesture band | Constants documented with their sources, plus a change-control rule (§6.5 A12). The Playwright §10.1 A12 (c) check measures the DOM text boxes on every CI run. The lead developer checks any shared change to HUD, hint or warning text positions against the §6.5 A12 table. | junior dev, lead dev |
| **MR22 [v1.6, A12]** | The GameShell payload lacks the new cutout fields (stale native build, bridge change), or reports a cutout larger than the edge inset | Fail-safe normalization: an absent cutout is treated as equal to the edge inset (the v1.5 layout, with no art in the bands), and edges are raised to cutouts (§6.1 A12). Unit rows cover it (§6.2.1 A12 row 20). The step-10 evidence records all six fields. | junior dev, lead dev, lead tester |

---

## 13. UX round-2 carry-forward checks: answers

| # | Check | Answer in this document |
|---|---|---|
| 1 | Exact 640×360 column widths, insets, scale, position; sums close; scale per tablet/foldable profile | §6.3 (144 / 416 / 80 = 640; playfield x 144-560, y 12-324, s = 0.52) and §6.4 table. The rows are asserted by `layout.test.ts`. |
| 2 | Named runtime inset API, queried live; budget still closes with larger insets | §6.1: GameShell → `WindowInsetsCompat.Type.displayCutout()` + `Type.systemGestures()`, live via `edgeInsetsChanged`. §6.3: closes up to 32 dp per side edge on 640×360; beyond that the documented `belowFloor` path applies (**[A11]** now the M2.10a prompt, §6.2.1). |
| 3 | Input model chosen + all six M3.3a rules; 40/40 result in the validation report | §5.2 (continuous per-pointer tracking with pointer capture over one movement zone; rule table); §10.2 (the test, whose results go to the validation report) |
| 4 | Safe-area padding additive to `#hud-root`/`#control-text` constants | §6.5: none added at all. The insets are handled by positioning the scaled `#app-root`. `src/style.css` is untouched, and Android CSS is scoped under `html.platform-android`. The lead developer confirms by diff. |
| 5 | PAUSE vertical placement/height vs THROW | §6.3 vertical table: PAUSE y 16-64 (48), gap 216, THROW y 280-336 (56), bottom inset 24. The sum is 360. |
| 6 | Legibility at the real 0.52× scale | §6.5: 12 dp text floor via `max()`; canvas at device density; render-only mitigation path. Verification is the device-matrix screenshot in steps 10/11. |

**[v1.1] For UX round 2 (new item):** the placement of "Privacy policy" (inside Settings)
and the privacy overlay layout (§8.7) need mobile-ui-ux-designer's confirmation. Moving the
item directly onto the title (1 tap) is allowed without an architecture change.

> **[A12, 2026-09-28]** Rows 1, 2, 4, 5 and 6 now also have answers with measured insets:
> - **Rows 1 and 5:** §6.3 A12. At 640 × 360 with insets 30/30/28.2/32: 150 | 404 | 86 =
>   640; s = 0.505; the playfield is at x 150-554, y 28.87-331.87. PAUSE is at y
>   44.2-92.2, the control row at 272-328, and the column sums to 360. Per-profile scales
>   are in §6.4 A12.
> - **Row 2:** per-axis headroom (§6.3 A12). Width: `l + r ≤ 64`. Height:
>   `max(cT, t − 2) + max(cB, b − 6.5) ≤ 60`. GameShell now also reports
>   `cutoutTop`/`cutoutBottom` (§6.1 A12).
> - **Row 4:** still none. Text safety comes only from the playfield's position (§6.5 A12).
> - **Row 6:** legibility is judged at the real ≈ 0.505× on the representative AVD
>   (PRD-mobile M2.12 v1.6 note (c)). The UX round-2 check also looks at the HUD's
>   position next to the top band (PRD §9 v1.6 follow-ups).

---

## 14. Handoff

### For mobile-junior-developer (build order)
1. Shared refactors with no behavior change, verified by the existing tests passing on web:
   `InputSource`/`KeyboardInputSource`, injected `InputManager`, `GameCommands`,
   `GameLoop.suspend/resume`, `renderScale`, `PlatformCopy` in ScreenController/HUDView,
   ScreenController view-key rendering, the `WebPlatform` composition root, and ESLint
   boundary rules.
2. Shared F20 + Q-v3-1 scaffolding: `safeStorage`, `bestScore`, the World fields, and the
   `RESTART_LEVEL_SCORE_POLICY` constant (`'keep'`). Coordinate with the web pipeline:
   there is one module.
3. Capacitor init: `capacitor.config.ts`, `npx cap add android` (after mobile-it-analyst
   setup), the manifest/MainActivity/variables edits (§7), GameShell, icons/splash.
   **[v1.1]** Split this step into three, in this order:
   - **3a.** Commit the extended `scaffold/.gitignore` (§3 Amendment A3) and
     `scripts/check-no-secrets.mjs` **before, or in the same commit as**, `npx cap add android`.
     **[A8]** `check-no-secrets.mjs` uses whole-repository scope from the start (§14.1 N3).
   - **3b.** Run `cap add`. Then remove the FileProvider and `file_paths.xml` (§7.3 A6).
     **[A8]** Keep `androidx.startup.InitializationProvider` (merged by AndroidX, non-exported);
     never `tools:node="remove"` it. Record the merged provider/receiver list for the step-8
     evidence; if any provider other than InitializationProvider appears, stop and report.
   - **3c.** Add the `app/build.gradle` release signing contract (§7.5.2), **[A8]** including
     the git-top-level path guard (§14.1 N3). Commit **no** signing file. Verify fail-closed
     by running `gradlew bundleRelease` with no properties and checking that it errors.
4. `src/platform/android/`: layout (+ tests), screenFit, TouchControls + moveZone (+ tests),
   backButton, lifecycle, overlays, settings (+ tests), android.css. **[v1.1]** Also
   PrivacyOverlay (§8.7) and a placeholder `public/privacy.html` that meets the §8.7
   content rules.
5. CI jobs (§10) and the Playwright suite. **[v1.1]** Include §10.3 in full (permissions,
   concurrency, secret check, audit, config check, manifest checker on debug and unsigned
   release, SHA pins). **[A8]** R5 exactly as amended, with its fixture tests (§10.3 R5
   implementation notes), and the config guard with the N2/N5 rules (§14.1).
   **[A9, 2026-09-26]** Add the §7.5.3 S1 template carve-out and rule S6 exactly as
   specified there (items 1-4, with the inline-fixture tests). Do not merge the
   `deploy-pages.yml` change until those are in place and `npm run check:secrets` passes on
   the real tree (§7.5.3 A9 item 5).
6. **[v1.1]** No-INTERNET verification (§7.3.1) on emulator images. Attach the evidence to
   the step-8 review. If any row fails, **stop**: do not apply the fallback yourself. Report
   it so the main session routes it to a security re-review (pass 1c).

Every new file carries a traceability header (`// Implements PRD-mobile M…, M-ADR-000N`).
Any need for a tool install goes to `docs/mobile/tooling-requests.md`.

**[A9, 2026-09-26; code-review-round1 I1] Build location.** Edit source only in the repo.
Run Android Gradle builds and emulator installs from the mirror outside OneDrive,
`C:\Users\aaron\dev-build\shield-vs-robots`, refreshed from the repo before every build and
never edited (§3 A9). This applies to every Android build and install on the owner's
machine, including the step-8 review, steps 10 and 14, and the step-15 release build.

**[A10, 2026-09-27; validation-report-round2 F1, code-review-round7 M1/L1-L3/S2] Theme
styles.** Keep `values/`, `values-v28/` and `values-v30/` `styles.xml` in parity, with the
cutout item absent / `shortEdges` / `always` respectively (§6.6 A10 items 1-2). Any edit
to one file goes into all three in the same commit. Complete the guard (§6.6 A10 item 3,
items 2-5 = round-7 L3, L1, L2) the next time these files are touched, and fix the
round-7 S2 citation in the XML comments (`validation-report-round2 F1`, not
code-review-round2). Do not edit this document or the ADRs: put proposed spec changes in
`docs/mobile/tooling-setup-log.md` or a handoff note for mobile-solution-architect.

**[A11, 2026-09-27; PRD-mobile v1.5 M2.10a] Too-small window.** In `layout.ts`, replace
`needsRotatePrompt(viewport)` with a classification that also takes the run-time insets
and returns `'portrait' | 'tooSmall' | 'playable'` exactly per §6.2.1, derived from the
same constants as `computeLayout` (no new literals). Extend RotatePrompt to show either
message with the §6.2.1 behaviors 1-6, move the prompt check to the front of the back
order (§8.3 A11), add the `onFrame` re-pause guard, and add the §10.1 A11 tests. All of
this stays in `src/platform/android/`; no shared file changes.

**[A12, 2026-09-28; PRD-mobile v1.6 M2.3b; code-review-round8 E1, I1, I3] Playfield under
the top/bottom gesture bands.** In this order:
1. **`GameShellPlugin.java`.** Add `cutoutTop` and `cutoutBottom` (dp, taken from the
   `displayCutout()` `Insets` object `toEdgeInsets` already reads) to the inset payload.
   The listener and the `getRootWindowInsets()` fallback both go through `toEdgeInsets`,
   so both report them (§6.1 A12). Change nothing else in native code.
2. **`GameShell.ts`.**
   - The payload type gains `cutoutTop?` and `cutoutBottom?`.
   - The web fallback parses `?cutout=top,bottom` (default `0,0`, malformed → 0) and
     always emits both fields.
3. **`layout.ts`.**
   - Add `LayoutInsets` (cutout fields required), `normalizeInsets`,
     `TEXT_TOP_LOGICAL = 4` and `TEXT_BOTTOM_LOGICAL = 13`. Each constant gets a comment
     citing its source, per the §6.5 A12 table.
   - Change `computeLayout`'s sizing and placement exactly per §6.2 A12.
   - `classifyWindow` stays "portrait test, then `belowFloor`".
   - Control coordinates do not change.
4. **`screenFit.ts`.**
   - Normalize every payload once, at `init` and in the `edgeInsetsChanged` handler.
   - Pass the `LayoutInsets` to layout and classification.
   - `#safe-layer` and the RotatePrompt padding keep using the full edge insets.
   - Set `--vvs-cutout-top` and `--vvs-cutout-bottom` on `<html>`.
5. **`overlays.ts`.** Extend the capture-phase `keydown` listener:
   - check the prompt first: `preventDefault()` + `stopPropagation()`, nothing else;
   - do not block `keyup`;
   - on entering a prompt, blur a focused element inside `#app-root` or `#safe-layer`.

   Keep the `onFrame` guard (§6.2.1 A12 behavior 4). Update the stale header comment
   there, per code-review-round8 R1 item 4.
6. **Tests** per §10.1 A12. Update the existing A11 rows whose numbers changed (§6.2.1
   A12 rows 15-17).

No shared file changes: `src/core`, `src/ui`, `src/render`, `src/config` and
`src/style.css` stay untouched. The code-review-round8 R1 and L1-L3 fixes land as that
review requires; A12 does not change them. Record any deviation from this spec in
`docs/mobile/tooling-setup-log.md`, for the architect.

### 14.1 Binding step-7 constraints from security review-v1 (L2-L5) and review-v1b (N2, N3, N5) [new in v1.1; extended by A8 and A9]

mobile-lead-developer checks each one at step 8. Pass 2 re-checks them.

| # | Constraint | Where |
|---|---|---|
| L2 | `build.sourcemap: mode !== 'android'`. `dist-android/` contains no `*.map`. The web keeps source maps. | §3.1 |
| L3 | `scripts/check-capacitor-config.mjs` (CI, after `cap sync`) fails if `capacitor.config.ts` or the generated `android/app/src/main/assets/capacitor.config.json` has a `server.url` or `server.cleartext: true`. The release runbook (step 13) requires a fresh `npm run android:sync` immediately before `bundleRelease`. **[A8]** Extended by N2 below. | §10.3 |
| L4a | `window.__vvsTest`: (1) exposes a **read-only snapshot** only, with no setters, no GameCommands and no references to live objects (return copies, and use `Object.freeze` on the hook object). (2) Its gate (`?e2e=1` && `!Capacitor.isNativePlatform()`) is evaluated **once at boot**, never re-checked or re-enabled later. (3) It is **absent** in the installed app; the lead developer verifies on the emulator that `typeof window.__vvsTest === 'undefined'`. | §10 item 3 |
| L4b | All new overlay DOM (Help, Settings, Privacy, RotatePrompt, touch controls) is built with `src/ui/dom.ts` helpers / `textContent`. **No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval` or `new Function`** (web constraint 2). An ESLint `no-restricted-properties`/`no-restricted-syntax` rule enforces this. | §8.6, §8.7 |
| L4c | `vvs:settings` validation reads known fields by name into a fresh literal. It never spreads, merges or uses `Object.assign` on the parsed object. The `__proto__` test input is included. | §9.2 |
| L5 | `jsdom` is pinned exactly in `package.json`. `gradle/actions/setup-gradle` and `actions/setup-java` are pinned to full commit SHAs. Gradle wrapper validation stays on. | §3.2, §10.3 |
| **N2 [A8]** (+ **N5**) | `scripts/check-capacitor-config.mjs` checks **both** `capacitor.config.ts` and the generated `android/app/src/main/assets/capacitor.config.json` (the file that ships), and fails on any of: (1) `server.url` present; (2) `server.cleartext: true`; (3) `android.webContentsDebuggingEnabled: true` (or a top-level `webContentsDebuggingEnabled: true`); (4) `android.allowMixedContent: true`; (5) `server.androidScheme` other than `'https'`; (6) `server.hostname` other than `'localhost'`; (7) **[N5]** any `server.allowNavigation` key, whatever its value (even an empty array). Rules 5-6 fail on a missing value in the generated JSON too, since it is the shipped origin (M7.4). Read the `.json` with `JSON.parse`; for the `.ts`, import it with the project's TypeScript toolchain or a strict text match, and document which in the script header. Unit-test each rule with a failing fixture. **Pass-2 check:** on the release build, `chrome://inspect` does not list the app's WebView. | §7.2 A8, §10.3 step 8 |
| **N3 [A8]** | (1) **Signing path guard** (§7.5.2 rule 2): in addition to the scaffold-root and OneDrive rules, reject any properties path or `storeFile` that is inside the **git top-level**. In `app/build.gradle`, find it by walking up from `rootProject.projectDir` to the first ancestor that contains a `.git` entry (directory **or** file, so worktrees and submodules count); if none is found, the other rules still apply. Do not depend on a `git` executable being on the Gradle PATH. Compare canonical paths, case-insensitively on Windows. (2) **Secret check scope** (§7.5.3): `check-no-secrets.mjs` lists files over the **whole repository**: `git ls-files -z --full-name -- ":/"` (or run from `git rev-parse --show-toplevel`). Paths are repo-relative; rule S4's file match becomes a suffix match on `android/app/build.gradle`, and S5 matches `capacitor.config.*` in any directory. If an existing, unrelated tracked file elsewhere in the repo trips a rule, stop and report it; do not add an ad hoc exclusion (any exclusion needs a security review). **[A9, 2026-09-26]** The one reviewed exclusion is the §7.5.3 A9 S1 template carve-out (tracked files whose basename is exactly `.env.example`, `.env.sample` or `.env.template`, via the `S1_TEMPLATE_BASENAMES` constant). Those files are not skipped: rule S6 scans their contents and fails closed, including when a file is unreadable. No other exemption may be added without security review. The check still needs no credentials (`persist-credentials: false`). (3) **Runbook line** (mobile-technical-writer, step 13): "Build `bundleRelease` from the command line only. Do not use Android Studio's *Generate Signed Bundle/APK* wizard." The fail-closed rule already blocks the wizard's `android.injected.signing.*` path; the runbook line says why. | §7.5.2, §7.5.3 (incl. A9), §10.3 step 15 |

L6 (targetSdk live check) needs no step-7 action. The release engineer re-verifies at
step 15 (§7.1). **[A8]** N1 is implemented through §10.3 R5 (step 5 of the build order) and
N4 through the §10.3 step-15 list; neither is a §14.1 row because they are specified in
full there.

### For mobile-security-compliance-reviewer
- Data inventory: `vvs:best` (one integer), `vvs:settings` (two booleans), `vvs:metrics`
  (existing anonymous counters). All on-device, no identifiers, no transmission, backup
  disabled.
- Permissions: none (INTERNET removed). The allowlist is enforced in CI. **[v1.1]**
  Removal is verified per §7.3.1. The fallback (keep INTERNET + android-mode CSP) is
  pre-designed but needs your re-review before use.
- Third-party native code: the Capacitor core + `app` + `splash-screen` (official, MIT).
  First-party: GameShell (insets, immersive, keep-screen-on flag, focus event; no
  permissions, no I/O).
- WebView: `https://localhost` origin, no mixed content, no cleartext, debugging only in
  debuggable builds, console → logcat only in debug.
- Test hook `window.__vvsTest` only in non-native, `?e2e=1` contexts (**[v1.1]** plus the
  L4a constraints in §14.1).
- Signing keys, keystore files and passwords are never in the repo (§3 ignore list). Play
  App Signing is per OQ-M12 (a), for the release engineer. **[v1.1]** The binding contract
  is §7.5: material lives outside the repo **and** outside OneDrive, the release is
  fail-closed and never uses the debug key, the ignore list lands before `cap add`, and CI
  secret check S1-S5 runs.
- **[v1.1] Privacy policy (H1):** in-app via §8.7 (bundled, sandboxed iframe, Title →
  Settings → Privacy, offline, back → Settings). Hosted via M11.4. Same file.
- **[v1.1] CI (M3):** top-level `contents: read`; only `deploy` has `pages: write` +
  `id-token: write`; `npm audit --omit=dev --audit-level=high`; `pull_request` only, never
  `pull_request_target`.
- **[v1.1] Release artifact (M4):** manifest checker R1-R7 runs on the unsigned release in
  CI and on the signed AAB at step 15, with evidence in `submission-checklist.md`.
- **[v1.2, A8] review-v1b closures:** N1 → §10.3 R5 (only non-exported
  `androidx.startup.InitializationProvider` without `grantUriPermissions`; FileProvider and
  subclasses, `<grant-uri-permission>`, `FILE_PROVIDER_PATHS` and any exported provider
  fail) and §7.3 A6/A8. N2 + N5 (`allowNavigation`) → §14.1 row N2. N3 → §14.1 row N3.
  N4 → §10.3 step-15 item 5. Pass 2 can check "the R5 allowlist matches N1 exactly"
  against the named constants in `check-android-manifest.mjs`.
- **[v1.3, A9, 2026-09-26] review-v1b Addendum 1:** recorded verbatim in §7.5.3 (S1
  template carve-out + S6 table row and binding items 1-5) and referenced from §14.1 N3 and
  M-ADR-0011. Pass 2 can check that `S1_TEMPLATE_BASENAMES` holds exactly `.env.example`,
  `.env.sample` and `.env.template`, that S6 fails on unreadable files, that each exempt
  file is logged, and that tests (i)-(vii) and the basename boundaries exist with inline
  fixtures only.
- **[v1.3, A9] Build mirror (code-review-round1 I1):** Android builds and emulator installs
  on the owner's machine run from `C:\Users\aaron\dev-build\shield-vs-robots` (outside
  OneDrive); source edits stay in the repo. The mirror never holds signing material; the
  §7.5 contract is unchanged (§3 A9).
- **[v1.4, A10, 2026-09-27] Cutout-mode split and identity.** The theme's cutout mode is
  set per API level (§6.6 A10). It has no permission, data or network effect; it is a
  launch-stability fix (validation-report-round2 F1). The identity is now
  `io.github.hogy86.shieldvsrobots` / "Shield vs Robots" (§7.1 A10). The manifest
  checker's R1 allowlist entry is `<applicationId>.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`,
  so it follows the new ID. Internal `vvs` identifiers (storage keys, signing env var and
  folder, test hook) are unchanged by design (F22 AC12-AC13). For pass 2: M1 of
  code-review-round7 is closed by this amendment; round-7 L1-L3 (guard completeness) are
  open LOWs owned by mobile-junior-developer.
- **[v1.5, A11, 2026-09-27] Too-small window (M2.10a).** Screen-fitting behavior only
  (§6.2.1, §8.3 A11). It adds no permission, storage, network, plugin or native code; the
  new prompt text is built with `textContent` (§14.1 L4b).
- **[v1.6, A12, 2026-09-28] Playfield under the gesture bands (M2.3b). One small native
  change for pass 2.**
  - `GameShellPlugin.java` adds two numeric fields, `cutoutTop` and `cutoutBottom` (dp),
    to its existing inset payload. They are read from the same `WindowInsetsCompat`
    object, in the same listener and fallback path (§6.1 A12).
  - There is no new plugin method, permission, manifest component, plugin, storage,
    logging or network request.
  - The values are screen geometry, not user data. They are exposed only as two CSS
    custom properties on `<html>` (readable only through DevTools, which is enabled only
    on debuggable builds), and never stored or sent.
  - The Android-only keyboard gate (§6.2.1 A12 behavior 4) only suppresses `keydown`
    events while the size/rotate prompt shows.
  - The Data safety answer is unchanged.
  - Pass 2 can check that `GameShellPlugin.java` still returns the insets unconsumed and
    still registers only on its own probe view (§6.6, MR6).
- Data safety answer expected: "No data collected, no data shared" (M11.3).
- **[v1.1] M5 / OQ-S1** (the "Sentinels" name) is with the owner and not decided here. See
  the §7.1 note on applicationId coupling. (review-v1b Condition C1 is the owner's
  decision record in PRD-mobile §7; A8 does not touch it.) **[A10]** The owner decided
  OQ-S1 (b) on 2026-09-25 (rename; PRD-mobile v1.3 §7). OQ-M11 (confirming the app ID)
  is still pending before step 15.

---

## 15. Traceability

| Decision | Traces to |
|---|---|
| Capacitor, layout, generated files (M-ADR-0001) | C2, C3, M0.1 |
| Platform boundary, composition root, lint rules (M-ADR-0002) | C1, PRD-mobile §0 rule 2, M3.12, OQ-M10 (a) |
| Merged input, movement-zone tracking, throw latch (M-ADR-0003) | M3.1-M3.9, M3.3a, UX F4, F1 AC5, F16 AC3, NFR-3 |
| Layout algorithm, GameShell insets, scaling, text floor (M-ADR-0004) | M2.1-M2.13, M2.3a, UX F1-F3, N1, N2, carry-forward 1/2/4/5/6 |
| Lifecycle, back, quit, keep-awake, timing (M-ADR-0005) | M4.1-M4.6, M5, M6, M10.2, M10.6, W-ADR-0002, F20 AC4(e) |
| Shared localStorage, keys, schema, contingency (M-ADR-0006) | F20 AC1-AC15, M7.1-M7.6, M4.6, addendum-v3 architect note |
| Android targets, manifest, plugin allowlist (M-ADR-0007) | M1.1-M1.5, M2.1a, M2.10, M5.3, M9, M11.1-M11.2, OQ-M6, OQ-M11 |
| CI (M-ADR-0008) | C4, M0.2, M3.3a test, `.claude/CLAUDE.md` §One codebase |
| Q-v3-1 switchable policy (§9.5) | `docs/PRD-addendum-v3.md` Q-v3-1, main-session instruction |
| **[v1.1]** In-app privacy policy (M-ADR-0009; §8.7) | M11.4, **M11.4a**, M11.1, M11.2, review-v1 H1 and L4b, C1, C3 |
| **[v1.1]** No-INTERNET verification + fallback (M-ADR-0010; §7.3.1) | M11.1, M11.2, M1.4, review-v1 M1 |
| **[v1.1]** Release signing contract (M-ADR-0011; §3 A3, §7.5) | OQ-M12 (a), review-v1 M2, CLAUDE.md §Where it runs |
| **[v1.1]** CI least privilege, audit, manifest gate, FileProvider removal (M-ADR-0012; §7.3 A6, §10.3) | C4, M11.2, review-v1 M3, M4, L1, L3, L5 |
| **[v1.1]** Step-7 binding constraints (§14.1) | review-v1 L2-L5; web security binding constraints 1-2 |
| **[v1.2]** A8: R5 provider allowlist (§7.3 A6/A8, §10.3 R5) | review-v1b **N1** / Condition C2; review-v1 L1; M11.2 |
| **[v1.2]** A8: config guard extension (§14.1 N2, §7.2 A8) | review-v1b **N2**, **N5**; review-v1 L3; M7.4, M11.1 |
| **[v1.2]** A8: repo-wide path guard and secret check, CLI-only release build (§14.1 N3, §7.5.2, §7.5.3) | review-v1b **N3** / Condition C3; review-v1 M2; OQ-M12 (a) |
| **[v1.2]** A8: signed-AAB cold-start smoke (§10.3 step 15 item 5) | review-v1b **N4**; review-v1 M1, M4; M11.1, M11.2, M10.5 |
| **[v1.3]** A9: S1 `.env` template carve-out + S6 content scan (§7.5.3, §14.1 N3, §14 item 5; M-ADR-0011 note) | review-v1b **Addendum 1**; code-review-round1 **C3**; review-v1b N3; review-v1 M2; C4 (a false positive must not block the website deploy) |
| **[v1.3]** A9: Android builds and emulator installs from a mirror outside OneDrive (§3 A9, §14; M-ADR-0011 note) | code-review-round1 **I1**; M-ADR-0011 context (OneDrive sync); CLAUDE.md §Where it runs |
| **[v1.4]** A10: cutout mode per API level (base absent, v28 `shortEdges`, v30 `always`), three-folder parity, `check-android-styles` guard (§6.6 A10, §3, §10.3, §12 MR19, §14; M-ADR-0007 note) | validation-report-round2 **F1**; code-review-round7 **M1**, **L1-L3**, S1, S2, I1-I3; M1.1 (minSdk 24), M1.4, M2 (edge-to-edge and cutouts), M2.3/M2.3a; C4 |
| **[v1.4]** A10: identity "Shield vs Robots" / `io.github.hogy86.shieldvsrobots` (§7.1 A10, §7.2, §1, title; M-ADR-0007 note) | PRD-mobile v1.3 **OQ-S1 (b)**, v1.4 OQ-S1a, M9.1 (as amended); PRD-addendum-v4 **F22** (AC1, AC12, AC13); OQ-M11 (still pending) |
| **[v1.5]** A11: window classification (portrait → too small → playable), size-floor formula `W ≥ l + r + 576`, `H ≥ t + b + 300`, prompt behavior, back order, re-pause guard (§6.2 A11, **§6.2.1**, §6.3, §6.4, §6.5, §6.6, §8.1, §8.3 A11, §10.1, §11, §12 MR4/MR20, §13, §14) | PRD-mobile v1.5 **M2.10a**, M2.10, M2.12, M2.13 (v1.5 note), M3.1, M3.2, M2.3a, M2.6, M2.9, M2.11, M4.1-M4.4, M4.6, M5 (v1.5 note); code-review-round7 **I6**; validation-report-round2 svr_api36_fold row; OQ-M7 (a); C1, C3 |
| **[v1.6]** A12: separate top/bottom cutout insets from GameShell with fail-safe normalization (§6.1 A12); playfield height limited by cutouts only, and placement that keeps text in the full insets via `TEXT_TOP_LOGICAL`/`TEXT_BOTTOM_LOGICAL` (§6.2 A12, §6.5 A12); restated floor `H ≥ max(cT, t − 2) + max(cB, b − 6.5) + 300`, still equal to `belowFloor` (§6.2.1 A12); measured-inset profiles and per-axis headroom (§6.3 A12, §6.4 A12); RotatePrompt location (§6.5 A12); keyboard gate under the prompt (§6.2.1 A12 behavior 4); tests (§10.1 A12); risks (§12 MR4, MR20, MR21, MR22); handoff (§13, §14); M-ADR-0004 and M-ADR-0005 notes | PRD-mobile v1.6 **M2.3b** (rules 1-4, tests (a)-(e), known limit), the M2.10a and M2.12 v1.6 notes, the §9 v1.6 follow-up list, M2.3, M2.3a, M2.6, M2.11, M2.13, M3.1, M3.2, M4.2, M1.3, M3.10; code-review-round8 **E1**, **I1**, **I3**, S1; OQ-M7 (a); C1, C3 |

---

## 16. Amendment log

| ID | Date | Trigger | Sections changed | Summary | Prior decision |
|---|---|---|---|---|---|
| A1 | 2026-09-25 | review-v1 **H1**; PRD-mobile M11.4a (added in parallel by mobile-product-manager) | §1, §2.1, §3, §4, §5.4, §6.5, §7.4, §8.1, §8.3, §8.6, **§8.7 (new)**, §10.1, §11, §13, §14, §15; **M-ADR-0009 (new)** | In-app privacy policy: bundled `public/privacy.html` in a sandboxed same-origin iframe overlay, Title → Settings → Privacy (2 taps), offline, no new plugin, back/Close → Settings. `privacy` and `overlay-close` actions; back rule 1 closes the topmost overlay. | v1 had the policy link only in the listing. Kept (M11.4 still applies); in-app access added. |
| A2 | 2026-09-25 | review-v1 **M1** | §7.3 (bullet annotated), **§7.3.1 (new)**, §11, §12 MR11, §14; **M-ADR-0010 (new)** | "Works without INTERNET" downgraded from fact to a verified hypothesis. Emulator verification plan (API 24/36 + mid); documented fallback (keep INTERNET + android-only CSP) that needs a security re-review. | v1 decision (remove INTERNET) **kept**; only its justification changed. |
| A3 | 2026-09-25 | review-v1 **M2** | §3 (ignore list extended + landing rule), §3.2, §7.2 note, **§7.5 (new)**, §12 MR12, §14; **M-ADR-0011 (new)** | Release signing contract: material in `C:\Users\aaron\.android-signing\vvs\` (outside repo and OneDrive), path via env var or user Gradle properties, path guard, fail-closed, never the debug key, CI unsigned-only exception; CI secret check S1-S5. | v1 ignore list **kept** and extended; v1 "never in the repo" kept and made binding. |
| A4 | 2026-09-25 | review-v1 **M3** | §10 note, §10.2, **§10.3 (new)**, §12 MR13, §14 | Top-level `contents: read`; only `deploy` gets `pages`/`id-token`; `persist-credentials: false`; concurrency split; `pull_request` only; `npm audit --omit=dev --audit-level=high`. | v1 job list **kept**; permissions were unspecified (inherited). |
| A5 | 2026-09-25 | review-v1 **M4** | §3 (script rename), §10 item 2 (superseded step list), §10.3, §12 MR15; **M-ADR-0012 (new)** | `check-android-permissions.mjs` → `check-android-manifest.mjs` with rules R1-R7; runs on the debug APK and the unsigned release APK in CI and on the signed AAB (bundletool) at step 15, with evidence in `submission-checklist.md`. | v1 debug-APK permission check **kept** as R1 on the debug variant. |
| A6 | 2026-09-25 | review-v1 **L1** | §3 layout, §7.3 | Template FileProvider and `file_paths.xml` removed; MainActivity is the only exported component (ProfileInstallReceiver tolerated under DUMP); enforced by R5. | v1 was silent on FileProvider. |
| A7 | 2026-09-25 | review-v1 **L2-L5** | §3.1, §3.2, §7.2 note, §9.2, §10 item 3, **§14.1 (new)** | Binding step-7 constraints: no source maps in the APK; `server.url`/cleartext guard + fresh sync before release; `__vvsTest` read-only/boot-gated/absent in native; no `innerHTML` in overlays; settings parse without spread; exact `jsdom` pin; SHA-pinned actions; wrapper validation on. | No v1 decision reversed. |
| — | 2026-09-25 | review-v1 **M5** (owner question OQ-S1) | §7.1 note, §14 | **Not decided here.** Noted the label/applicationId coupling for the owner's decision. | App label and ID unchanged pending the owner. |
| — | 2026-09-25 | review-v1 **L6** | none | Accepted as-is; re-verified at step 15. | Unchanged. |
| **A8** | 2026-09-25 (v1.2) | review-v1b **N1** (MEDIUM; Condition C2), **N2**, **N3** (LOW; Condition C3), **N4** (LOW), **N5** (INFO: `allowNavigation` only) | Header, Sources, §7 heading, §7.2 (A8 note), §7.3 A6 (provider clause replaced + A8 block), §7.3.1 (A8 note), §7.5.2 rule 2, §7.5.3 (scope note), §9.2, §10 heading, §10.3 (`build` step 2, `android-build` step 8, **R5 row replaced**, R5 implementation notes, **step-15 list: item 5 added, items renumbered 5→6, 6→7**), §11, §12 MR11/MR12 + **MR16, MR17 (new)**, §14 items 3a-3c and 5, **§14.1 rows N2 and N3 (new)**, §14 security handoff, §15, §16; dated amendment notes added to **M-ADR-0007** and **M-ADR-0012** (M-ADR-0008: see ADR note below) | **N1:** R5's provider clause becomes "every `<provider>` fails except `androidx.startup.InitializationProvider` with `exported="false"` and no `grantUriPermissions="true"`; any exported provider, any FileProvider or subclass, any `<grant-uri-permission>`, any `FILE_PROVIDER_PATHS` meta-data fails"; allowlist named in the checker source; never `tools:node="remove"` the Startup provider; any other provider needs a security review. **N2 (+N5):** config guard also rejects `webContentsDebuggingEnabled: true`, `allowMixedContent: true`, non-`https` scheme, non-`localhost` hostname, and any `server.allowNavigation`, on both config files. **N3:** signing path guard rejects anything inside the git top-level; secret check scans the whole repo; runbook says CLI-only release builds. **N4:** step 15 cold-starts the signed AAB (bundletool `build-apks --connected-device` + `install-apks`) on API 36 and a WebView ≥ 80 image, checks title + privacy overlay, and records the result in `submission-checklist.md`. | v1.1 R5 "no `<provider>` of any kind" **replaced** (it would fail every Capacitor build). L1 closure, the FileProvider removal and the other R5 clauses **kept**. L3 guard, §7.5 contract and the step-15 manifest check **kept** and extended. No PRD requirement changed. |
| **A9** | 2026-09-26 (v1.3) | review-v1b **Addendum 1** (security decision on code-review-round1 **C3**: S1 false positive on a sibling project's committed `.env.example`); code-review-round1 **I1** (INFO: Gradle cannot build inside OneDrive) | Header, Sources, §3 (**A9 build-location note**), §7 heading, **§7.5.3 (S1 row carve-out, new S6 row, A9 binding block)**, §10 heading, §10.3 heading + `build` step 2, §12 MR12 + **MR18 (new)**, §14 item 5 + **build-location note**, §14.1 heading + **row N3**, §14 security handoff, §15, §16; dated amendment note appended to **M-ADR-0011** | **Secret check:** S1 skips the path failure only for tracked files whose basename is exactly `.env.example`, `.env.sample` or `.env.template` (`S1_TEMPLATE_BASENAMES`, `path.posix.basename`, case-sensitive). New rule **S6** content-scans those files and fails on unreadable files, on key/token signatures anywhere (a), on secret-named `KEY=VALUE` lines with a non-empty value, commented lines included (b), and on 32+ character token-like values (c). Passing exempt files are logged. `scanEnvTemplate` is a pure exported function with inline-fixture tests (i)-(vii) and basename-boundary tests. The workflow change is not merged until this passes on the real tree. No other exemption without security review. **Build location:** Android Gradle builds and emulator installs on the owner's machine run from `C:\Users\aaron\dev-build\shield-vs-robots` (outside OneDrive), a disposable mirror refreshed from the repo before every build; source edits stay in the repo; signing material never enters the mirror. | S1-S5 patterns, the whole-repository scope (A8/N3), the "stop and report; no ad hoc exclusion" rule and the A3 ignore list **kept**. The only change to S1 is the reviewed carve-out, and it adds a content scan. §7.5 signing contract and CI **unchanged**. No PRD requirement changed. |
| **A10** | 2026-09-27 (v1.4) | validation-report-round2 **F1** (API 28 launch crash: `Unknown windowLayoutInDisplayCutoutMode: 3`); code-review-round7 **M1** (§6.6 rewritten in place by the implementer with no amendment, version bump or log row; broken bold markup), **L3** (three-folder parity), L1/L2 (guard completeness), S1/S2; owner rename per PRD-mobile v1.3 **OQ-S1 (b)** / v1.4 OQ-S1a and PRD-addendum-v4 **F22** | Title, header, Status, **Naming note (new)**, Sources, §1 (GameShell path), §3 (layout: `check-android-styles.mjs`, three `styles.xml` folders), **§6.6 (edge-to-edge bullet rewritten, bold markup repaired, A10 block)**, §7 heading, **§7.1 (applicationId and label rows, A10 note)**, **§7.2 (`appId`, `appName`)**, §10 heading, §10.3 heading + `build` step 7 + A10 note, §12 **MR19 (new)**, §14 **theme-styles note** + security handoff, §15, §16, Owner questions (OQ-S1 note); dated amendment note appended to **M-ADR-0007** | **Cutout mode:** `android:windowLayoutInDisplayCutoutMode` is absent in base `values/` (API 24-27), `shortEdges` in `values-v28/` (API 28-29) and `always` in `values-v30/` (API 30+), on all three app styles. The implementer's in-place wording is adopted as the A10 text and marked as such. **Parity rule:** the three `styles.xml` files hold the same styles, parents and items apart from the cutout item; edits land in all three in one commit; v28 and v30 must exist; either L3 option (a) or (b) conforms. **Guard:** `scripts/check-android-styles.mjs` + tests, run by the `build` job's `npm run test`; complete when it also asserts positive v28/v30 values and parity (L3), fails closed (L1) and tolerates attribute variants (L2). **Identity:** applicationId/namespace `io.github.hogy86.shieldvsrobots`, label "Shield vs Robots"; still an OQ-M11 placeholder until confirmed before step 15; `vvs` internal identifiers and storage keys unchanged (F22 AC12-AC13). | v1.3's unconditional `always` **replaced** for API < 30, **kept** for API 30+. v1.3's app ID `io.github.hogy86.vanguardvssentinels` and label "Vanguard vs. Sentinels" **replaced** by the owner's OQ-S1 (b) decision. Edge-to-edge intent, GameShell insets, Capacitor inset handling disabled, minSdk 24 / targetSdk 36 and the OQ-M11 immutability rule **kept**. No PRD requirement changed by this amendment. |
| **A11** | 2026-09-27 (v1.5) | PRD-mobile v1.5 **M2.10a** (too-small window, any shape; asks this document for the exact formula and its interaction with M2.10), with the v1.5 M2.13 and M5 notes; underlying reports: code-review-round7 **I6**, validation-report-round2 svr_api36_fold row, tooling-setup-log 2026-09-27 fold-AVD entry | Header, Status, Sources, §6.2 (code-block annotation + A11 note superseding the sub-0.5× `belowFloor` paragraph), **§6.2.1 (new)**, §6.3 (headroom note), §6.4 (A11 note), §6.5 (re-layout triggers), §6.6 (rotate bullet), §8.1 (portrait/too-small row), **§8.3 (A11 note: prompt rule first)**, §10 heading, **§10.1 (A11 tests)**, §11, §12 MR4 + **MR20 (new)**, §13 row 2, §14 **too-small note** + security handoff, §15, §16 | **Classification**, in order: `W ≤ H` → portrait (M2.10 text); else too small when `W < l + r + 576` or `H < t + b + 300` (M2.12 columns at B = 56 + M3.1 gap + ≥ 0.5× playfield; the M3.2 PAUSE stack, ≤ 160 dp, never binds) → "Make the window larger to play."; else playable. It uses the run-time insets and is identical to `computeLayout(...).belowFloor` at B = 56. Nominal floor 624 × 300 dp. **Behavior:** pause via `pauseForInterruption`; only the prompt is drawn (other layers hidden, not destroyed); taps ignored; `onFrame` re-pauses a hidden `PLAYING` state; restore returns to the pause menu or the prior screen within one re-layout; back leaves the app and is checked before shell overlays. | v1's fixed `W < 640 or H < 360` rotate thresholds and the "playfield shrinks below 0.5×" `belowFloor` path are **replaced**. The portrait rule (`W ≤ H`), the §6.2 layout algorithm for playable windows, the 640 × 360 design profile, the OQ-M7 (a) no-band-layout decision and web behavior are **kept**. No shared game code changes. |
| **A12** | 2026-09-28 (v1.6) | PRD-mobile v1.6 **M2.3b** (with the M2.10a and M2.12 v1.6 notes and the §9 v1.6 follow-up list), a mobile-product-manager decision in response to code-review-round8 **E1**: real insets measured on `svr_api36_pixel7` (l 51.8/36.2, r 29.7, t 28.2, b 32 dp) made the 640 × 360 dp reference window miss the A11 floor. Also code-review-round8 **I1** (RotatePrompt location) and **I3** (keyboard under the prompt). | Header, Status, Sources, §1 (GameShell row), **§6.1 (A12: `cutoutTop`/`cutoutBottom`, `normalizeInsets`, `?cutout=`, debug CSS properties)**, **§6.2 (A12: `availH` and `pfY`)**, **§6.2.1 (A12: restated `minH`, nominal values, v1.6 worked-check table, behavior 2 clarification, behavior 4 keyboard gate)**, **§6.3 (A12: measured-inset profile, three-button profile, per-axis headroom)**, **§6.4 (A12 table)**, **§6.5 (A12: text placement rule and constants, change control, RotatePrompt location)**, §10 heading + item 3 note, **§10.1 (A12 tests)**, §11, §12 MR4 and MR20 + **MR21, MR22 (new)**, §13 note, §14 **A12 note** + security handoff, §15, §16; dated notes on **M-ADR-0004** and **M-ADR-0005** | **Insets:** GameShell adds `cutoutTop`/`cutoutBottom` (display cutout only). JS normalizes every payload: an absent cutout is treated as equal to the edge inset (fail-safe), and edges are raised to the cutouts. **Layout:** `availH = H − max(cT, t − 2) − max(cB, b − 6.5)`, and `pfY` is centred between `max(cT, t − 4s)` and `H − max(cB, b − 13s)`. Art may enter the top/bottom gesture bands but never a cutout or a side inset. All playfield text (canvas warnings at logical y ≥ 4, HUD at ≥ 15, the hint ≤ 13 from the bottom) stays inside the full insets. Controls, menus and prompts are unchanged. **Floor:** `minW = l + r + 576` (unchanged), `minH = max(cT, t − 2) + max(cB, b − 6.5) + 300`, still equal to `computeLayout(...).belowFloor`. At the measured gesture insets, 640 × 360 plays at s = 0.505 (404 × 303) with 8.3 dp vertical and 4 dp horizontal headroom; three-button navigation plays at 0.52. **Keyboard (I3):** while a prompt shows, the Android capture-phase gate blocks every `keydown` (keyup passes) and blurs focused hidden controls; the `onFrame` guard stays. **I1:** RotatePrompt is a `<body>`-level fixed layer, not a `#safe-layer` child. | v1.5's `minH = t + b + 300`, `availH = H − t − b` and `pfY = t + (availH − pfH)/2` are **replaced**. The width rule, the B order, control placement, the 0.5× floor, portrait precedence, prompt behaviors 1-3 and 5-6, the back order, the N1 no-HUD-padding decision and OQ-M7 (a) are **kept**. The §6.3/§6.4 planning tables are kept as history and still tested. v1 §6.5's "rotate screens in `#safe-layer`" is **corrected** (the A11 implementation had already moved it). The "accept and record" option for I3 is **rejected**. No shared game code changes; the web is unchanged. |

**ADR note:** M-ADR-0009..0012 each state which earlier ADR they amend (0001, 0002, 0005,
0007, 0008). In v1.1 the text of M-ADR-0001..0008 was not edited. **[A8, 2026-09-25]** A
short dated "Amendment note" section is now appended to M-ADR-0007, M-ADR-0008 and
M-ADR-0012 pointing at what later ADRs and amendments changed in them; their original
Decision text is left as the historical record. **[A9, 2026-09-26]** The same kind of dated
note is appended to M-ADR-0011 (decision 8 secret-check carve-out + S6; build mirror
context). **[A10, 2026-09-27]** A second dated note is appended to M-ADR-0007 (cutout mode
per API level, parity rule and guard; identity rename). **[A11, 2026-09-27]** A11 changes
decisions recorded in M-ADR-0004 (the sub-0.5× `belowFloor` path) and M-ADR-0005 (the back
resolution order). This log entry and §6.2.1 / §8.3 A11 are the record; a dated pointer
note on those two ADRs is still to be added. Where a new ADR and an old one differ, the
newer ADR and this amendment log win. **[A12, 2026-09-28]** The A11 pointer notes are now in
place: the main session appended them to M-ADR-0004 and M-ADR-0005 on 2026-09-27. A12
appends a second dated note to:
- **M-ADR-0004** (`0004-screen-fitting-insets-and-scaling.md`): the inset fields, the
  vertical fit and placement, the floor, the text constants, the RotatePrompt location and
  A12's rejected alternatives;
- **M-ADR-0005** (`0005-lifecycle-back-quit-and-timing.md`): the keyboard gate while a
  prompt shows, and its rejected alternatives.

M-ADR-0003 (merged input) is not edited. Its decision stands: the keyboard stays a shared
`InputSource`, and touch never fakes key presses. The gate is an Android screen-fitting
behavior layered in front of it, recorded in M-ADR-0005.

---

## Owner questions raised by this architecture (for mobile-product-manager, Job 0)

**OQ-A1 — Conditional storage exception (only if M7.4 fails).** The default is shared
`localStorage` (no exception needed). If the emulator persistence checks fail, Android would
need `@capacitor/preferences` behind the shared best-score module. Storage is not an allowed
platform-specific area.
- (a) Pre-approve a narrow exception now, used only if the M7.4 checks fail: one Android
  storage adapter file, with the best-score rule still implemented once.
- (b) No exception: keep `localStorage` and accept the documented loss cases in the release
  notes.
- (c) Decide only if and when it fails (this may stall step 10).
- **Recommendation: (a).** It costs nothing unless triggered, keeps F20 AC15 intact, and
  avoids a pipeline stall.

**Q-v3-1 (already open, from `docs/PRD-addendum-v3.md`).** The architecture supports
(a)/(b) with a one-constant change (§9.5). See §9.5 for the (b) × AC4(e) interaction.

**OQ-S1 (raised by security review-v1 M5; owned by mobile-product-manager).** This
architecture does not decide it. Input for the decision: the applicationId
`io.github.hogy86.vanguardvssentinels` becomes permanent at the first Play upload, while
the label can change later. If the enemies are renamed, confirm OQ-M11's app ID at the same
time.

> **Amendment A10 (2026-09-27, v1.4):** OQ-S1 is **decided**: the owner chose (b), rename,
> on 2026-09-25 (PRD-mobile v1.3 §7; PRD-addendum-v4 F22). The applicationId is now
> `io.github.hogy86.shieldvsrobots` (§7.1). What remains open is **OQ-M11**, the owner's
> confirmation of that ID, which must happen before step 15 because the ID is permanent
> after the first upload.
