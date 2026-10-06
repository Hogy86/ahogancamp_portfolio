# ADR M-0001: Capacitor wrapper, project layout, and two build modes from one source

## Status: Proposed (for mobile-security-compliance-reviewer pass 1)

## Context
- Fixed constraints: one `src/` for web and Android (C1), Capacitor wrapper with no rewrite
  (C2), the website build and GitHub Pages deploy stay unchanged (C3). PRD-mobile M0.1
  requires the Android build to wrap the Vite output and never hand-edit web assets inside
  `android/`.
- The web build uses `VITE_BASE_PATH=/ahogancamp_portfolio/` on GitHub Pages. Capacitor
  serves from `https://localhost/`, so the Android bundle needs base `/`.
- W-ADR-0001 made the web runtime dependency-free. Capacitor adds runtime packages, and
  they must not leak into the web bundle.

## Decision
1. **Capacitor (current major, expected 8.x)** wraps the game. Versions are pinned exactly.
   `capacitor.config.ts` sits at the scaffold root, with `webDir: 'dist-android'`.
2. **Two Vite modes, one source.** `npm run build` (unchanged) → `dist/` with WebPlatform.
   `npm run build:android` (`vite build --mode android`) → `dist-android/` with base `/`
   and AndroidPlatform. `vite.config.ts` becomes mode-aware only for `base` and `outDir`.
3. The Android module is loaded by a dynamic import inside
   `if (import.meta.env.MODE === 'android')` in `src/main.ts`. Vite folds the constant,
   so the web bundle contains no Capacitor code. CI proves this with a string check.
4. **`android/` is committed** (created once by `npx cap add android`). The hand-edited
   files are `variables.gradle`, `app/build.gradle`, `AndroidManifest.xml`,
   `MainActivity.java`, `GameShellPlugin.java` and `res/**`. The files `cap sync`
   generates are split two ways. `capacitor.settings.gradle` and
   `app/capacitor.build.gradle` are committed but never hand-edited.
   `assets/public/`, `capacitor.config.json`, `capacitor.plugins.json` and
   `capacitor-cordova-android-plugins/` are git-ignored and never hand-edited. Build
   outputs, `local.properties`, keystores, `*.aab` and `*.apk` are always ignored.

Tool-stack criteria (tool-stack-decision-criteria):
| Criterion | Capacitor |
|---|---|
| Team familiarity | Keeps the whole game in TypeScript. Native code is limited to ~100 lines of Java in allowed areas. |
| Scaling | Fixed single-player load, same as the web (W-ADR-0001). |
| Licensing | MIT. Compatible with a free Play distribution. |
| Hosting | Runs fully offline from bundled assets. No server. |
| Ecosystem | Official App and SplashScreen plugins cover back, lifecycle and splash. |
| Operational cost | One Capacitor major upgrade per year to follow Play's target-API rule. |
| Long-term support | Actively maintained by Ionic on a yearly major cadence tied to Android releases. |

## Alternatives Considered (and why rejected)
- **Trusted Web Activity (Bubblewrap) around the GitHub Pages site.** Rejected. It depends
  on the network and the hosted site (breaks M11.1 offline), cannot lock orientation from
  process start reliably or read gesture insets, and makes the Play version track the
  website on every deploy (against CLAUDE.md "Play version only changes when a release
  ships"). It also conflicts with C2, which names Capacitor.
- **Apache Cordova.** Rejected. It is an older plugin ecosystem with a slower target-API
  cadence, and C2 names Capacitor.
- **Native rewrite (Kotlin/Compose) or a game engine (Unity/Godot).** Rejected by C1/C2:
  the game logic would exist twice.
- **Single build output served to both platforms (runtime `isNativePlatform()` check).**
  Rejected. It puts `@capacitor/core` into the web bundle (breaks W-ADR-0001 zero runtime
  deps and risks C3), and it can't fix the base-path mismatch without a runtime rewrite.
- **Git-ignoring the whole `android/` folder and regenerating it in CI.** Rejected. The
  manifest, MainActivity, GameShell and icon resources are real source, and regenerating
  them would lose the hand edits.

## Consequences
- The web deploy is byte-for-byte driven by the same inputs as before. The only shared
  config change is the mode-aware `vite.config.ts`.
- Two output folders exist. `cap sync` must always follow `build:android` (the
  `android:sync` script chains them).
- The yearly Capacitor upgrade becomes a known maintenance item (risk MR10).
- Traces to: C1-C3, PRD-mobile M0.1, M10.5; `mobile-architecture.md` §2, §3.
