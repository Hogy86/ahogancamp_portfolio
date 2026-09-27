# Mobile Build Tooling Setup Log

**Date:** 2026-09-25  
**Agent:** mobile-it-analyst (Claude Haiku 4.5)  
**Owner:** Aaron Hogancamp (aaron.hogancamp@gmail.com)  
**Approval:** Granted 2026-09-25

---

## Installation Summary

This log records the setup of Android SDK and build tooling for the UFO Arcade Game Android app on the owner's Windows 11 desktop. All infrastructure-level tooling has been installed from official sources only.

---

## Installed Tooling

### 1. JDK 21

| Item | Value |
|---|---|
| **Product** | Eclipse Temurin JDK 21.0.12.101 (Hotspot) |
| **Source** | Official Eclipse Adoptium (via winget) |
| **Install Method** | `winget install "EclipseAdoptium.Temurin.21.JDK"` |
| **Install Path** | `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot` |
| **Version Verified** | openjdk version "21.0.12.1" 2026-08-18 LTS |
| **Environment Variable** | `JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot` |
| **Required By** | Mobile architecture (§2, "JDK 21") |

**Verification:**
```bash
java -version
# Output: openjdk version "21.0.12.1" 2026-08-18 LTS
```

### 2. Android SDK Command-line Tools

| Item | Value |
|---|---|
| **Product** | Android SDK Command-line Tools (revision 12.0) |
| **Source** | Google's official download (https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip) |
| **Download Size** | 153.6 MB |
| **Extract Path** | `C:\Users\aaron\Android\sdk\cmdline-tools\latest` |
| **Contains** | sdkmanager, avdmanager, platform tools, build system |
| **Version Verified** | sdkmanager --version: 12.0 |
| **Environment Variable** | `ANDROID_HOME=C:\Users\aaron\Android\sdk` |

**Directory Structure:**
```
C:\Users\aaron\Android\sdk\
├── cmdline-tools/
│   └── latest/
│       ├── bin/             (sdkmanager.bat, avdmanager.bat, etc.)
│       ├── lib/
│       ├── source.properties
│       └── NOTICE.txt
```

**Verification:**
```bash
sdkmanager --version
# Output: 12.0
```

---

## Pending Installation — Android SDK Packages and Emulator Images

The following packages are **required** but have **not yet been installed** because they require the owner's explicit license acceptance.

### Android SDK Licenses

The Android SDK uses Google's proprietary licenses that must be accepted interactively. **The owner must run the following command and accept the license agreements:**

**Command to run (in PowerShell as the owner):**
```powershell
cd C:\Users\aaron\Android\sdk
.\cmdline-tools\latest\bin\sdkmanager.bat --licenses
```

**What happens:**
1. The tool will display several license agreements (Android SDK License, Android SDK Preview License, Intel HAXM License, etc.)
2. For each one, read the terms and type `y` or `yes` to accept
3. Type `n` or `no` to decline (not recommended; packages will not install)
4. After accepting, the `licenses/` directory will be created in `ANDROID_HOME`

### Packages to Install (After License Acceptance)

Once licenses are accepted, **one of these two approaches** can be used:

#### Approach A: Individual Installation (Recommended for Verification)

Run these commands in sequence (the owner or automation can do this):

```powershell
$ANDROID_HOME = "C:\Users\aaron\Android\sdk"
cd $ANDROID_HOME

# Install SDK Platforms
.\cmdline-tools\latest\bin\sdkmanager.bat "platforms;android-24"
.\cmdline-tools\latest\bin\sdkmanager.bat "platforms;android-36"

# Install Build Tools
.\cmdline-tools\latest\bin\sdkmanager.bat "build-tools;36.0.0"

# Install System Images for Emulators
.\cmdline-tools\latest\bin\sdkmanager.bat "system-images;android-24;google_apis;x86_64"
.\cmdline-tools\latest\bin\sdkmanager.bat "system-images;android-36;google_apis;x86_64"
```

#### Approach B: Batch Installation

Alternatively, all packages in one command (if all download/install steps succeed atomically):

```powershell
$ANDROID_HOME = "C:\Users\aaron\Android\sdk"
cd $ANDROID_HOME

.\cmdline-tools\latest\bin\sdkmanager.bat `
  "platforms;android-24" `
  "platforms;android-36" `
  "build-tools;36.0.0" `
  "system-images;android-24;google_apis;x86_64" `
  "system-images;android-36;google_apis;x86_64"
```

### Required Packages Detail

| Package | Purpose | Size (approx.) | Required By |
|---|---|---|---|
| `platforms;android-24` | SDK Platform for API 24 (Android 7.0) | ~130 MB | M1.1 (minSdk) |
| `platforms;android-36` | SDK Platform for API 36 (Android 16) | ~310 MB | M1.2 (targetSdk) |
| `build-tools;36.0.0` | Build system for Android 16 apps | ~90 MB | Gradle build |
| `system-images;android-24;google_apis;x86_64` | Emulator image: API 24 with Google APIs | ~900 MB | §7.3.1 verification, device-matrix testing |
| `system-images;android-36;google_apis;x86_64` | Emulator image: API 36 with Google APIs | ~1.2 GB | Primary platform, all app testing |

**Total download size after installation: ~2.6 GB**

---

## Emulator Device Profiles (To Be Created)

After system images are installed, the AVD Manager will create virtual device profiles. The architecture (§6.4, device-matrix) requires these device profiles for testing:

| Profile Name | API | Architecture | Device Size | Purpose |
|---|---|---|---|---|
| `pixel-api36-google` | 36 | x86_64 | Nexus 5 or smaller phone | Primary testing (M2.13 nominal) |
| `pixel-api24-google` | 24 | x86_64 | Nexus 5 or smaller phone | Backward compat + no-INTERNET verification (§7.3.1) |
| `pixel-mid-webview` | 29 or 30 | x86_64 | Mid-range phone | Optional: if API 24 WebView < 80 (§7.3.1, line 744) |

These are created by the developer using:
```bash
avdmanager create avd -n pixel-api36-google -k "system-images;android-36;google_apis;x86_64" -d pixel
```

---

## Environment Variables (To Set Permanently)

For the developer's daily use, these environment variables should be set as user variables (not system variables, to avoid permission issues):

**Via PowerShell (run as the owner):**
```powershell
# Set ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\aaron\Android\sdk", "User")

# Set JAVA_HOME (if not already set)
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot", "User")

# Add to PATH (append if not already there)
$path = [Environment]::GetEnvironmentVariable("PATH", "User")
if (-not $path.Contains("C:\Users\aaron\Android\sdk\cmdline-tools\latest\bin")) {
    $path += ";C:\Users\aaron\Android\sdk\cmdline-tools\latest\bin"
    [Environment]::SetEnvironmentVariable("PATH", $path, "User")
}

# Reload environment in current PowerShell
$env:ANDROID_HOME = "C:\Users\aaron\Android\sdk"
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
```

**Verify after setting:**
```powershell
echo $env:ANDROID_HOME
echo $env:JAVA_HOME
java -version
sdkmanager --version
```

---

## Gradle and Capacitor

**Note:** The developer (mobile-junior-developer) will handle:
- `npm install` to fetch Capacitor and other npm dependencies into the project
- `npm run android:sync` to run `npx cap sync android` and generate the Gradle project
- The Gradle wrapper (`gradlew.bat`) in the `android/` directory will use the installed SDK and build tools

The build system is now ready for the developer to proceed.

---

## Node.js and npm (Already Present)

- **Node.js:** v24.14.1 (confirmed)
- **npm:** 11.11 (confirmed)
- **Action:** None needed; versions meet or exceed requirements

---

## Summary: What Still Needs to Be Done

1. **[OWNER ACTION REQUIRED]** Accept Android SDK licenses:
   ```powershell
   cd C:\Users\aaron\Android\sdk
   .\cmdline-tools\latest\bin\sdkmanager.bat --licenses
   ```
   The owner must read and accept the displayed license agreements.

2. **[OWNER ACTION REQUIRED]** Set environment variables (copy the PowerShell commands above into a PowerShell window run as the owner).

3. **[DEVELOPER ACTION]** (step 7) After licenses/environment are set, the junior developer can:
   - Run `npm install` in `scaffold/`
   - Run `npm run android:sync` to pull the web assets and generate the native Android project
   - Run `npm run android:debug` to build and test the debug APK

4. **[SYSTEM AUTO]** (steps 10, 14, 15) The lead tester and release engineer will create AVD profiles and run emulator tests once the system images are installed.

---

## Troubleshooting

### sdkmanager not found
- **Cause:** `ANDROID_HOME/cmdline-tools/latest/bin` is not in `PATH`
- **Fix:** Reload the PowerShell session after setting environment variables, or run `sdkmanager` with the full path:
  ```powershell
  C:\Users\aaron\Android\sdk\cmdline-tools\latest\bin\sdkmanager.bat --list
  ```

### License acceptance failed
- **Cause:** Closed the prompt without accepting any licenses
- **Fix:** Run `sdkmanager --licenses` again and type `y` for each agreement

### Emulator won't boot
- **Cause:** System image not installed
- **Fix:** Check with `sdkmanager --list_installed` and install the image if missing

### OutOfMemoryError during Gradle build
- **Cause:** Gradle heap is too small for large projects
- **Fix:** Create `gradle.properties` in the project root with `org.gradle.jvmargs=-Xmx4g`

---

## Platform Support

- **Windows Version:** Windows 11 Pro 10.0.26200 (confirmed)
- **Free Disk Space:** ~835 GB available (as of 2026-09-25)
- **Architecture:** x64
- **Virtualization:** Assumed enabled (required for Android Emulator)

---

## Sign-off

All infrastructure-level tooling has been installed from official sources. The owner has everything needed to proceed with the mobile development pipeline once:
1. Android SDK licenses are accepted
2. Environment variables are set

**Next Step:** mobile-junior-developer (step 7) can proceed with `npm install` and building the Android app.

---

**End of Log**

## 2026-09-26 — Completion (main session)

- Owner accepted the Android SDK licenses himself (`sdkmanager --licenses`); `C:\Users\aaron\Android\sdk\licenses\` now holds 7 license files.
- User env vars set at the owner's request: `JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot`, `ANDROID_HOME=C:\Users\aaron\Android\sdk` (PATH unchanged; tools are called by full path).
- Installed with sdkmanager (exit 0): `platform-tools`, `emulator` (37.1.11.0), `platforms;android-24`, `platforms;android-36`, `build-tools;36.0.0`, `system-images;android-24;google_apis;x86_64`, `system-images;android-36;google_apis;x86_64`.
- Hardware acceleration: `emulator -accel-check` → WHPX 10.0.26200 installed and usable.
- AVDs created: `svr_api36_pixel7` (Pixel 7, API 36) and `svr_api24_small` (Nexus 5 = 360×640 dp, i.e. the 640×360 dp low-end landscape profile, API 24).
- Boot check: `svr_api36_pixel7` booted headless, `sys.boot_completed=1` after 65 s, `ro.build.version.sdk=36`; emulator shut down cleanly.
- Cleanup: an earlier extraction had left a stray 148 MB copy of cmdline-tools at `docs/mobile/architecture/adr/$destination/` (unexpanded PowerShell variable). Verified the real copy under `C:\Users\aaron\Android\sdk` works, then deleted the stray folder.

## 2026-09-26 — Step 7 (mobile-junior-developer): §7.3.1 no-INTERNET verification evidence

Debug APK (`android/app/build/outputs/apk/debug/app-debug.apk`) built from this commit's
`src/`. `aapt2 dump permissions` confirms `android.permission.INTERNET` is absent (only
`io.github.hogy86.shieldvsrobots.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`, the AndroidX
signature-level permission, is present).

| Image | WebView | Result |
|---|---|---|
| `svr_api36_pixel7` (API 36, Google APIs) | 133.0.6943.137 | Cold start (`am force-stop` then `am start`) renders the title screen ("Shield vs Robots", "Best: 0", Start/How to play/Settings/Quit). Tapped through: Start → first-launch Help overlay → "Got it" → level 1 plays (HUD score/lives/level updating, enemies/formation/player rendering, touch controls visible). Android back button → pause menu (Resume highlighted). Home + relaunch → still paused, lives unchanged (no time lost, M4.2). Quit → activity finishes to the launcher (M6.1); relaunch → fresh title, "Best: 0" persisted, Help not shown again (`helpSeen` persisted, M7.3/M7.4). `adb logcat` shows no `net::ERR_*`, no blocked-load error for `https://localhost/*`, and no `FATAL EXCEPTION`/`AndroidRuntime` crash for the app process throughout. |
| `svr_api24_small` (Nexus 5, 640×360 dp landscape, API 24) | 53.0.2785.124 (< minWebViewVersion 80) | Cold start renders `webview-update.html`'s fallback text ("Please update Android System WebView from the Play Store.") via the same local-asset interceptor path — not a blank/white screen, not a crash. `adb logcat` shows no `net::ERR_*` and no crash for the app process. |

Both rows pass per §7.3.1's table. The INTERNET-removal decision stands; the CSP fallback
was not needed and was not applied. This evidence is also referenced in the step-8 code
review submission.

Note found during this step (not an app bug, reported for the record): `node
scripts/check-no-secrets.mjs`, run with its new whole-repository scope (§14.1 row N3),
flags one pre-existing, unrelated tracked file elsewhere in the repo -
`projects/ai-ml/VibeCoding/Cursor-UFOArcadeGame/UFO_Arcade_Game/.env.example` (rule S1,
path pattern). Its contents are a harmless config template (TLS mode/port/paths), not a
real secret. Per the binding instruction in mobile-architecture.md §14.1 row N3 ("if an
existing, unrelated tracked file elsewhere in the repo trips a rule, stop and report it;
do not add an ad hoc exclusion"), no exclusion was added. This will make the CI `build`
job's secret-check step fail until mobile-security-compliance-reviewer decides whether to
rename/remove that file or approve a documented exclusion.

**Resolved 2026-09-26 (round 2):** the security reviewer's Addendum 1 (see
`docs/mobile/security/review-v1b.md`) and architecture Amendment A9 close this - `.env.example`/
`.env.sample`/`.env.template` basenames are now content-scanned by new rule S6 instead of
failing on path alone. `npm run check:secrets` now passes on the real tree.

## 2026-09-26 — Step 7 round 2 (mobile-junior-developer): C1/C2 fix verification

- `avdmanager list avd` now also lists `svr_api30_mid` (Pixel 4, API 30, google_apis
  x86_64) - installed by mobile-it-analyst per the round-1 request.
- Per code-review-round1.md I1, all Android Gradle builds below ran from the mirror
  `C:\Users\aaron\dev-build\shield-vs-robots` (refreshed from the repo via
  `robocopy /MIR`, excluding `node_modules`, `.git`, `android/build`, `android/app/build`,
  `android/.gradle`), never in place in the OneDrive-synced repo.
- `npm run build:android && npx cap sync android && node scripts/check-capacitor-config.mjs`
  → PASSED.
- `gradlew assembleDebug --no-daemon` → **BUILD SUCCESSFUL** (153 tasks). `gradlew
  assembleRelease -PvvsCiUnsignedRelease=true --no-daemon` (with `CI=true`) → **BUILD
  SUCCESSFUL** (203 tasks).
- `check-android-manifest.mjs --variant debug` and `--variant release` (against the real
  APKs, via `aapt2 dump xmltree`) → **PASSED** on both. (This surfaced and fixed a real bug
  in the checker itself: real aapt2 indentation is not a uniform "2 spaces per level" -
  see H3 in the round-2 fix list - caught only by running against a real APK, not the
  hand-written fixtures.)
- Re-verified the two fail-closed signing paths still refuse correctly from the mirror:
  `gradlew bundleRelease` with no `signing.properties` → refuses ("Refusing to build.").
  `-PvvsCiUnsignedRelease=true` without `CI=true` → also refuses.
- `npm run test:e2e:mobile` (Playwright phone-emulation suite, now with touch emulation
  actually enabled per M4) → **12/12 PASSED**, including the new
  `tests/mobile-e2e/controls-layout.spec.ts` (C1 required fix 4): ◀/▶/THROW/PAUSE meet
  their minimum touch-target size, no control rect intersects `#app-root`, no control lies
  inside the insets, and every title-screen menu item is ≥ 48 px tall - at all four
  device-matrix viewports, with and without `?insets=24,24,0,24`.
- **Real-emulator interactive re-verification (§7.3.1 table) - INCOMPLETE, flagged for
  mobile-lead-tester at step 9/10.** `svr_api36_pixel7` was booted headless
  (`-gpu swiftshader_indirect`, no hardware GPU passthrough available in this sandboxed
  session) to visually confirm the C1 fix on a real device. The emulator's OWN System UI
  reported "System UI isn't responding" during this attempt (a software-rendering/
  performance symptom of this sandboxed environment, not an app crash - `adb logcat`
  showed no `FATAL EXCEPTION`/`AndroidRuntime` crash for the app process), and a
  `screencap` taken during that ANR showed the Title screen and the Privacy-policy overlay
  composited on top of each other. This was reproduced twice, including once from a
  freshly wiped install (`adb uninstall` + `-no-snapshot` boot), so it is NOT explained by
  stale emulator-snapshot state. **This could not be attributed with confidence to either
  the app or the environment in the time available.** The Playwright suite above exercises
  the identical HTML/CSS/JS bundle (minus the native Capacitor wrapper) and shows no such
  overlap at any viewport, which is evidence toward "environment," not "app" - but it does
  not touch the Privacy overlay at all, so it cannot rule out a real bug in
  `AndroidOverlays`/`ScreenFit` interacting with Capacitor's WebView specifically.
  **Action for step 9/10:** reproduce on the owner's machine with real GPU acceleration
  (not headless swiftshader) and confirm whether Settings→Privacy ever opens
  unprompted on a cold launch; if so, this is a real bug and must come back through
  code review before UAT.
- The mid-image (API 30) §7.3.1 row and the forced-`errorPath`/mid-WebView-≥80 rows from
  H9 were NOT re-run this round given the emulator instability above; they remain open for
  mobile-lead-tester's step-9/10 device-matrix pass.

## 2026-09-27 — Step 7 round 3 (mobile-junior-developer): C1/C2/M3 fix verification on real GPU hardware

- **Mirror refresh command (record required by round-2 review I1; corrected round 4,
  see below; round-5 addition below), run before every build below:**
  **code-review-round4 INFO I4:** stop any node process whose command line references
  `dev-build\shield-vs-robots` (for example a `vite preview` server left running from
  an earlier session) before the robocopy/`npm ci` steps below. A stale process can
  hold an open handle on a file under the mirror's `node_modules` (the round-4
  reviewer hit this on `node_modules\@esbuild\win32-x64\esbuild.exe`, ports
  4181/4182), which makes `npm ci` fail with no obvious connection to the real cause.
  PowerShell:
  ```
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -like '*dev-build\shield-vs-robots*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  ```
  ```
  robocopy "<repo>\projects\ai-ml\VibeCoding\ClaudeCode-UFOArcadeGame\scaffold" ^
    C:\Users\aaron\dev-build\shield-vs-robots /MIR ^
    /XD node_modules .git build .gradle .terraform ^
    /XF terraform-deploy_accessKeys.csv *.csv .env .env.* *.tfstate *.tfstate.* terraform.tfvars /NFL /NDL /NJH
  ```
  **Round-4 correction (code-review-round3 I4):** the round-3 command above used to
  read `/XD node_modules .git "android\build" "android\app\build" "android\.gradle"`.
  Round 4 found, while acting on I4, that this DID NOT actually work: robocopy's `/XD`
  only reliably excludes a directory by its bare NAME (verified with `/L` list-only
  runs) - a multi-segment relative pattern like `android\build` silently matches
  nothing, so `/MIR` copied the real, untracked `android\build`/`android\app\build`
  (leftover Gradle output already present in the OneDrive-synced repo working tree,
  itself gitignored but never cleaned up) straight into the mirror on every refresh,
  ReadOnly attributes and all - reintroducing exactly the "Unable to delete directory"
  failure I4 was meant to close, even after clearing the mirror's own `build`/`.gradle`
  directories beforehand (`Remove-Item` below), because the very next robocopy just
  put them right back. Switching to bare `build`/`.gradle` (confirmed the only
  directories anywhere under `scaffold/` outside `node_modules` with those exact
  names, so this excludes nothing else) fixed it: a subsequent `/L` list-only run
  shows no `android\build`/`android\app\build`/`android\.gradle` path, and `gradlew
  assembleDebug`/`assembleRelease` against the refreshed mirror below completed
  without the deletion failure.
  **code-review-round4 L5 (latent risk):** bare `build`/`.gradle` excludes EVERY
  directory anywhere under `scaffold/` with those exact names, not just the two
  Gradle output directories intended today. If a future source directory is ever
  named `build` (for example `scripts/build/`), this pattern would silently drop it
  from the mirror with no error. Whoever adds such a directory must change the `/XD`
  pattern back to explicit paths (or add an `/XF`-style carve-out) rather than assume
  bare names stay safe forever.
  Also run this immediately BEFORE the robocopy above, every refresh, not only when a
  failure is already seen - belt-and-braces for anything `/XD` still lets through
  (e.g. `capacitor-cordova-android-plugins\build`, a real subdirectory name, not
  bare `build`, so it needs its own explicit clear) (PowerShell; the `cmd.exe`-style
  `attrib`/`rd /s /q` equivalent works too, but `Remove-Item -Force` clears the
  ReadOnly attribute itself, so no separate `attrib` pass is needed here):
  ```
  Remove-Item -Recurse -Force `
    'C:\Users\aaron\dev-build\shield-vs-robots\android\build' `
    -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force `
    'C:\Users\aaron\dev-build\shield-vs-robots\android\app\build' `
    -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force `
    'C:\Users\aaron\dev-build\shield-vs-robots\android\capacitor-cordova-android-plugins\build' `
    -ErrorAction SilentlyContinue
  ```
  (`-ErrorAction SilentlyContinue` because the directory legitimately does not exist
  yet on a from-scratch mirror, which is not a failure.) Verified this round: ran
  against the round-3 mirror, which still had `android\build` left over (ReadOnly
  files inside, from that round's Gradle runs) from before this fix existed - the
  `Remove-Item -Force` calls deleted it without needing a separate `attrib` step, and
  a subsequent `dir` of `android\` no longer lists `build`. The from-scratch case (the
  directory not existing yet) is a silent no-op, confirmed by the `-ErrorAction
  SilentlyContinue` calls returning without error. With BOTH this clear step and the
  corrected `/XD build .gradle` pattern above, `gradlew assembleDebug`/
  `assembleRelease` against the refreshed mirror below completed with **BUILD
  SUCCESSFUL** and never saw "Unable to delete directory" again.
  (`.env`/`.env.*` here excludes real per-machine env files from ever landing in the
  mirror; any tracked `.env.example`-style template that lives INSIDE `scaffold/`
  would be unaffected by these basename-only `/XF` patterns, same as any other
  ordinary source file. Round-3 review L7: this mirror source path is
  `<repo>\...\ClaudeCode-UFOArcadeGame\scaffold` only - the Cursor project's own
  `.env.example` lives in a sibling project directory outside `scaffold/` entirely,
  so it is never copied into this mirror at all, and no claim about it "landing in
  the mirror" is meaningful here.) Confirmed **no** `.csv`/`.env*` file exists anywhere in the
  mirror after this refresh, and the previously-reported `terraform-deploy_accessKeys.csv`
  copy is gone and does not come back on repeated refreshes.
- `svr_api36_pixel7` **booted successfully this round with real GPU acceleration**
  (`-gpu host`, confirmed in the emulator log: "Found physical GPU 'AMD Radeon RX 5600
  XT'... hasSufficientHwGpu: Ok"). The round-2 "System UI isn't responding"/ANR
  instability was a `-gpu host` **plus the Qt display window** combination in this
  sandboxed session specifically; passing `-no-window` (headless, GPU still real/host,
  not software) avoided the crash entirely and booted cleanly. `svr_api30_mid` needed
  the same `-no-window` flag; `-gpu host` alone on that AVD hit a *different* failure
  (`chromium: tile_manager.cc WARNING: tile memory limits exceeded`, WebView content
  never painted, splash never hid) - resolved by using `-gpu swiftshader_indirect`
  for that lower-spec profile instead. Recommendation for step 9/10's device matrix:
  always pass `-no-window`; use `-gpu host` on `svr_api36_pixel7` and
  `-gpu swiftshader_indirect` on `svr_api30_mid`/`svr_api24_small`.
- **§7.3.1 table, `svr_api36_pixel7` (API 36, real GPU host mode):**
  - Cold start: title renders immediately, no Privacy overlay visible (C2 fixed -
    confirmed via `screencap`).
  - Start → Help ("Got it") → PLAYING: confirmed via `screencap` + `adb shell input`.
  - Move (`<`/`>`), THROW, PAUSE: confirmed working via real `adb shell input`
    tap/swipe against the actual installed APK (not just Playwright) - THROW spawned a
    shield and destroyed an enemy (score 0 → 100), holding `<` moved the player and
    score/lives changed from ongoing play (score → 350, lives 3 → 1), PAUSE showed the
    "PAUSED" menu with "Resume"/"Restart Level"/"Restart Game"/"Quit".
  - Settings → Swap: `Settings` screen confirmed correct.
  - Settings → Privacy: opens on tap only (not on cold launch, C2), opaque `#05050a`
    panel, Close on the right (THROW-side default edge, M1 fixed), text content
    correct; Close returns to Settings.
  - `Quit`: confirmed `App.exitApp()` returns to the OS home screen (M6.1).
  - `edgeInsetsChanged`: dispatched (confirmed in round 2 already; re-confirmed
    functionally via the touch-control positions rendering inset from the screen edge
    in every screenshot this round).
  - Best score persisted across a full app relaunch (`Best: 350` after Quit + relaunch).
- **§7.3.1 table, `svr_api30_mid` (API 30, WebView 83.0.4103.106, confirmed ≥ 80):**
  title renders cleanly (no Privacy overlay stuck on top); `logcat` shows no
  `net::ERR_*` lines. M5's pre-API-30 insets check: queried `#safe-layer`'s computed
  inline style via the WebView's own remote-debugging protocol (`chrome://inspect`
  equivalent, `adb forward` to the `@webview_devtools_remote_*` socket) -
  `{"left":"0px","right":"48px","top":"30.1818px","bottom":"0px"}`, i.e. the
  `edgeInsetsChanged` probe genuinely reached the WebView and produced non-zero,
  real values (not the all-zero placeholder) on this pre-API-30-adjacent profile.
- **Forced-`errorPath` build (§7.3.1, uncommitted `minWebViewVersion: 999`):** built
  ONLY in the mirror (`capacitor.config.ts`'s tracked copy in the repo was never
  touched - re-verified `grep minWebViewVersion` on the real repo file shows `80`
  after this check). Installed on `svr_api24_small` (WebView too old to satisfy 999):
  `webview-update.html` rendered ("Please update Android System WebView from the Play
  Store."); `logcat` showed `Capacitor: Handling local request:
  https://localhost/webview-update.html` and no `net::ERR_*` line at all.
- **Real-device rendering findings (not in the round-2 review, found while verifying
  C1/M3 - documented for the record, both fixed this round, see
  docs/mobile/reviews/code-review-round2.md disposition in the round-3 report):**
  - The pictographic touch-button glyphs (`\u25C0`/`\u25B6`/`\u23F8`/`\u{1F6E1}`)
    rendered as literally nothing on `svr_api36_pixel7`'s WebView (confirmed via a
    4x-zoomed screenshot crop of the empty button interiors) - switched to plain
    ASCII (`<`, `>`, `THROW`, `II`), confirmed rendering correctly afterward.
  - `.menu-item` (title/pause/settings/privacy buttons) had no explicit
    `background`/`color`/`appearance`, so it fell back to the WebView's native control
    chrome under some (non-deterministic across sessions in this sandboxed
    environment) condition - confirmed via the WebView's own remote-debugging
    protocol: computed `background-color: rgb(239,239,239)`, `color: rgb(0,0,0)`,
    `appearance: auto`. Fixed this round with `appearance: none` plus explicit
    `background`/`color` on the shared `.menu-item` rule in `src/style.css`.
    **Round-4 correction (code-review-round3 M1):** that edit broke §6.5 ("`src/
    style.css` is not edited") and made every menu button transparent on Android
    (the title text underneath showed through Help/Settings/Pause). Round 4 reverted
    `src/style.css` to HEAD and moved the same fix to
    `html.platform-android .menu-item` in `src/platform/android/android.css`
    instead, with an opaque background so nothing shows through. See
    `docs/mobile/reviews/code-review-round4.md` for the device screenshots.
- All three AVDs (`svr_api36_pixel7`, `svr_api30_mid`) were shut down
  (`adb emu kill` + `taskkill` cleanup) at the end of this session; none left running.

## 2026-09-27 — Step 7 round 4 (mobile-junior-developer): H1/H2/M1/M2/L1-L7 fix verification

- Mirror refreshed with the corrected robocopy command (see I4 entry above) and the
  clear-before-refresh step; `npm run test` **418/418 passed** in both the repo and
  the refreshed mirror (round-3's `check-no-secrets.test.mjs` mirror failure, H1, is
  closed - the Cursor `.env.example` fixture is now an inline template literal).
- **§7.3.1 row 1 (H2 item 1), API 36, forced `errorPath`:** rebuilt the mirror's
  `capacitor.config.ts` with `minWebViewVersion: 999` (uncommitted, mirror-only -
  `git diff capacitor.config.ts` in the repo is empty and the repo file still reads
  `80`, re-confirmed after restoring the mirror's copy back to `80`), `cap sync`,
  `gradlew assembleDebug`, installed on `svr_api36_pixel7` (real WebView
  133.0.6943.137, `-gpu host -no-window`). `logcat` showed `Capacitor: Handling local
  request: https://localhost/webview-update.html` and the device rendered "Please
  update Android System WebView from the Play Store." No `net::ERR_*` line. This is
  the row H2 flagged as missing: API 24's WebView (53) is already below 80, so it
  never proved the error path triggers on a MODERN WebView the way this one does.
- **§7.3.1 row 2 (H2 item 2), API 30 mid, privacy overlay:** `svr_api30_mid` (real
  WebView 83.0.4103.106, `-gpu swiftshader_indirect -no-window`). Title rendered
  cleanly cold (no Privacy overlay stuck visible). Settings → Privacy policy → opens
  an opaque `#05050a` panel with the real privacy copy and a Close button at the
  top-right; Close returns to Settings with focus back on "Privacy policy" (§8.3 A1).
  `logcat`: no `net::ERR_*`/`FATAL EXCEPTION`/`AndroidRuntime` exception/
  `ClassNotFound` lines.
- **New bug found and fixed while chasing the row-2 evidence, NOT in
  code-review-round3.md:** on first attempt, the Settings overlay on this device
  rendered as a ~220px-wide sliver bleeding off the LEFT edge of the screen (buttons
  showing only "...ntrols: Off" / "...y policy" / "...ose"). Chrome DevTools Protocol
  (`adb forward` to the WebView's own `webview_devtools_remote_*` socket,
  `Runtime.evaluate`) showed `#shell-overlay-root`'s computed `width`/`height` were
  both `0` - its CSS used the `inset: 0` shorthand, which Chromium did not support
  until version 87 (Nov 2020); WebView 83 silently drops the whole declaration,
  leaving the element with NO positioning at all, so it collapses to zero size and
  every `.screen-overlay` child's `width: 100%`/`height: 100%` resolves against that
  zero-size containing block. Fixing `src/platform/android/android.css` to use
  `top`/`left` plus explicit `width: 100%`/`height: 100%` (not `right`/`bottom`, which
  Vite's production CSS minifier re-collapsed right back into the same unsupported
  `inset` shorthand at build time - confirmed by grepping the actual
  `dist-android/assets/*.css` output, not just the source file) fixed it on this
  device without touching `svr_api36_pixel7` (re-verified cold title + Move/THROW/
  PAUSE there after the fix - unaffected). `#safe-layer` and `.privacy-overlay`
  already used explicit inset properties, not the shorthand, so neither needed this
  fix. `npm run typecheck`/`lint`/`test` (418/418) /`build` and the mobile Playwright
  suite (44/44) were re-run after this fix, in addition to the checks above.
- **§7.3.1 row 3 (H2 item 3), API 36, Swap controls:** Settings → "Swap controls: Off"
  tapped → label reads "Swap controls: On" immediately. Started a run: THROW/PAUSE
  moved to the LEFT, ◀/▶ moved to the RIGHT (mirrored from default), and the Help/
  controlHint text below the touch layer still reads `< > move · THROW · II pause`
  (L2). Force-stopped and relaunched the app cold, started another run: the mirrored
  layout persisted (THROW/PAUSE still left, ◀/▶ still right) - confirmed via
  screenshots, not just the toggle label.
- `gradlew assembleDebug` / `CI=true gradlew assembleRelease -PvvsCiUnsignedRelease=true`
  → **BUILD SUCCESSFUL / BUILD SUCCESSFUL** from the refreshed mirror (the I4 clearing
  step plus the corrected `/XD build .gradle` pattern - see above - both needed; see
  that entry for why the round-3 `/XD "android\build" "android\app\build"
  "android\.gradle"` pattern never actually excluded anything).
  `check-android-manifest.mjs --variant debug|release` against the real APKs →
  PASSED/PASSED. `gradlew bundleRelease` with no signing properties → refuses
  correctly ("Refusing to build.").
- Both AVDs (`svr_api36_pixel7`, `svr_api30_mid`) were shut down (`adb emu kill`) at
  the end of this session; none left running.

## 2026-09-27 — Step 7 round 5 (mobile-junior-developer): M1/L1/L2/L5/I4 fix verification

- **M1 (required), `tests/mobile-e2e/controls-behavior.spec.ts`:** the cold-load
  Privacy spec's `page.evaluate` ran right after `page.goto`, which resolves on
  `load`, but the shell overlays are mounted by the dynamically imported
  `AndroidPlatform` chunk (`main.ts`'s `loadPlatform().then(bootstrap)`), which can
  still be pending at that point. Added
  `await expect(page.locator('#shell-overlay-root > *').first()).toBeAttached();`
  before the `evaluate`, so the assertion waits for the mount instead of racing it.
  No `retries` were added anywhere (the review explicitly ruled that out).
  - Audited every other spec in `tests/mobile-e2e/` for the same
    "query/evaluate right after goto with no wait" pattern:
    - `help-flow.spec.ts`: confirmed safe as the round-4 review found - the one
      `page.evaluate` right after `goto` only calls `localStorage.clear()`, which
      does not depend on any DOM mount, and every state read follows a
      `toBeVisible`/`toBeHidden` locator assertion first.
    - `smoke.spec.ts`: only uses `expect(locator).toHaveText`/`toBeVisible`, which
      auto-retry until the mount appears; no bare `.evaluate()`/`.count()` right
      after `goto`.
    - `controls-layout.spec.ts`: found the same class of race - `menuItems.count()`
      ran right after `goto`, and `ScreenController` (the title screen's menu items)
      is constructed by the same `bootstrap()` call that is gated on the
      `AndroidPlatform` dynamic import, so the count could read 0 before the
      import resolves. `.count()` does not auto-wait. Fixed the same way: added
      `await expect(menuItems.first()).toBeAttached();` before the `.count()` call.
  - **Evidence required by the review:** built `dist-android` (`npm run
    build:android`), then ran
    `npx playwright test -c playwright.mobile.config.ts --repeat-each=5` in the
    repo: **220 passed, 0 failed** (44 tests x 5 repeats, all four device-matrix
    viewports). No `retries` field was added to `playwright.mobile.config.ts` or
    `.github/workflows/deploy-pages.yml`.
- **L1, `public/privacy.html`:** the round-3 fix comment (line 19) itself contained
  the literal text the §10.1 static check greps for, so it kept matching. Reworded
  to describe the rule without spelling out the tag. Confirmed
  `grep -c "<script" public/privacy.html` = **0**.
- **L2, `tests/mobile-e2e/help-flow.spec.ts`:** removed the permanently-skipped
  "overlay-close" dismissal variant (Help has no `overlay-close` control, so
  `test.skip()` always ran - dead code). Added a file-header note that Escape is
  Help's only non-"Got it" dismissal, already covered by the remaining test.
- **L5, this file:** added a note next to the round-4 `/XD build .gradle` correction
  above, warning that bare `build`/`.gradle` excludes ANY future directory with those
  exact names anywhere under `scaffold/`, not just today's two Gradle output
  directories, so whoever adds such a directory must revisit the pattern.
- **INFO I4:** added "stop any node process whose command line references
  `dev-build\shield-vs-robots`" to the documented mirror-refresh procedure above,
  before the robocopy step, with the PowerShell one-liner used to do it. Checked
  before this round's refresh: no matching processes were running. Separately found
  and stopped two stale `vite preview` processes on port 4173 left over from an
  earlier session (unrelated to the mirror path, but the same class of hygiene
  issue) - confirmed no `LISTENING` socket on 4173 afterward.
- **Repo checks (post-fix):** `npm run typecheck` PASS, `npm run lint` PASS,
  `npm run test` PASS (28 files, 418 tests), `npm run build` PASS.
- **Mirror refresh, run exactly as documented above (clears, then robocopy):**
  robocopy exit code 1 (files copied, no failures/mismatches). Confirmed no
  `.csv`/`.env`/`.env.*` file anywhere in the mirror outside `node_modules`, and the
  only `build`/`.gradle` directory left is the mirror's own `android/.gradle`
  (expected, per the round-3/4 note on `/XD` and destination directories). Diffed
  every file touched this round (`controls-behavior.spec.ts`, `controls-layout.spec.ts`,
  `help-flow.spec.ts`, `public/privacy.html`) against the repo - byte-identical.
  `npm ci` then `npm run test` in the mirror: **PASS, 28 files, 418 tests**.
- **Not run this round (scope per the round-5 code review's routing):** the reviewer-run
  Android Gradle builds (`assembleDebug`, unsigned `assembleRelease`, the
  `bundleRelease` refusal, and the manifest check) - the round-4 review asked for
  these to be independently re-run by the round-5 reviewer or by the main session,
  not by the developer fixing M1/L1/L2/L5/I4. The "## 2026-09-27 — Step 7 round 4
  (mobile-junior-developer): H1/H2/M1/M2/L1-L7 fix verification" section above already
  records BUILD SUCCESSFUL/PASSED for both variants from a from-scratch mirror
  refresh; nothing in this round touched Android/Gradle source, config, or the
  manifest-check script.
- Preview server started for the Playwright run was stopped by Playwright itself at
  the end of the run (no `vite preview --port 4174` process or `LISTENING` socket
  on 4174 remained afterward); no AVD was started this round.

## 2026-09-27 — mobile-it-analyst: Code-review-round5 tooling items (L2 part 3, L3, I1)

**Requested by:** mobile-lead-developer (code-review-round5.md)

**Items applied to the setup log:**

1. **L2 part 3: Document AAPT2_PATH for local manifest-check step.** Added a new subsection below this entry describing how to run `check-android-manifest.mjs` locally with the required environment variable set.

2. **L3: Replace stale line-number cross-references with section-heading references.** Replaced the reference to `:552-559` at the end of the round-5 developer section with a reference to the section heading "## 2026-09-27 — Step 7 round 4 (mobile-junior-developer): H1/H2/M1/M2/L1-L7 fix verification".

3. **I1: Update mirror refresh robocopy command and note Terraform cleanup.** Updated the robocopy command to add `.terraform` to `/XD` exclusions and `*.tfstate *.tfstate.* terraform.tfvars` to `/XF` exclusions (see the round-3 mirror refresh command documentation above). Noted that the main session deleted copies of `infra/aws/.terraform/`, `terraform.tfstate`, and related files from `C:\Users\aaron\dev-build\shield-vs-robots` on 2026-09-27; these files will no longer be copied on subsequent mirror refreshes.

### Local manifest-check procedure with AAPT2_PATH

**To run the manifest-check locally** (e.g., from the build mirror or during development):

```powershell
# Set the AAPT2_PATH environment variable to point to the Android build-tools aapt2 executable
$env:AAPT2_PATH = "C:\Users\aaron\Android\sdk\build-tools\36.0.0\aapt2.exe"

# Run the manifest check against a debug APK
node scripts/check-android-manifest.mjs --variant debug --apk android/app/build/outputs/apk/debug/app-debug.apk

# Or against a release APK
node scripts/check-android-manifest.mjs --variant release --apk android/app/build/outputs/apk/release/app-release-unsigned.apk
```

If `AAPT2_PATH` is not set or points to a missing file, the script will fail with an actionable error message indicating that the environment variable must be set. CI pipelines (e.g., `.github/workflows/deploy-pages.yml`) export this variable automatically; this subsection documents the local procedure for developers or when running in non-CI environments.

**No new infrastructure installation was required.** All three items were documentation changes to this log only.

## 2026-09-27 — Step 10 (mobile-it-analyst): Device matrix emulator setup

**Requested by:** mobile-lead-tester (docs/mobile/tooling-requests.md)

**System image installed:**
- `system-images;android-28;google_apis;x86_64` (approximately 1.2 GB download via sdkmanager; exit code 0).

**AVDs created and tested:**

1. **`svr_api29_webview` (API 28, google_apis, Nexus 5 device profile)**
   - Created via avdmanager with system image `system-images;android-28;google_apis;x86_64`.
   - Booted headless with `-no-window -no-audio -no-snapshot -wipe-data` to test.
   - Boot status verified: `adb shell getprop sys.boot_completed` returned 1 (successful boot).
   - **WebView version check:** `adb shell dumpsys package com.google.android.webview | grep versionName`
     returned `versionName=69.0.3497.100`.
   - **Finding:** This API 28 google_apis image ships with **WebView 69.0**, which is **below the
     app's minWebViewVersion of 80**. This confirms the known limitation noted in the request:
     "Google's api28/29 `google_apis` images have historically bundled WebView in the low 60s-70s."

2. **`svr_api36_tablet` (API 36, google_apis, pixel_tablet device profile)**
   - Created via avdmanager with system image `system-images;android-36;google_apis;x86_64` (already
     installed from previous steps).
   - Booted headless with `-no-window -no-audio -no-snapshot -wipe-data` to test.
   - Boot status verified: `adb shell getprop sys.boot_completed` returned 1 (successful boot).
   - Device profile: 10-inch tablet (pixel_tablet).

3. **`svr_api36_fold` (API 36, google_apis, resizable device profile)**
   - Created via avdmanager with system image `system-images;android-36;google_apis;x86_64`.
   - Booted headless with `-no-window -no-audio -no-snapshot -wipe-data` to test.
   - Boot status verified: `adb shell getprop sys.boot_completed` returned 1 (successful boot).
   - Device profile: resizable with foldable device-state configuration (CLOSED, HALF_OPENED, OPENED states).

**WebView version issue (item 3 recommendation):**

The `svr_api29_webview` AVD uses an API 28 google_apis image that ships with WebView 69.0, below
the required 80. To test insets on a pre-API-30 device with WebView ≥ 80, the lead tester can:

- **Option A:** Request a `google_apis_playstore` system image (API 28 or 29) instead, which allows
  WebView updates via Play Store sign-in. This would require the owner's Google account to sign in
  to Play Store on the emulator, per CLAUDE.md escalation rules. Contact mobile-product-manager if
  this option is chosen.

- **Option B:** Continue using `svr_api29_webview` (WebView 69) and document the device-matrix gap
  in the validation report. The Playwright phone-emulation suite and `svr_api24_small`'s fallback
  screen verify most of the required coverage.

**Summary:**
- ✓ All three AVDs created successfully (2 with API 36, 1 with API 28).
- ✓ All three booted headless without error.
- ⚠️ `svr_api29_webview` WebView version below 80; see options above.

**Date:** 2026-09-27  
**Commands used:** Java-invoked sdkmanager and avdmanager CLI (Windows bash/POSIX env).
