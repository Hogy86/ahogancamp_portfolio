# Android Development & Testing Guide — Shield vs Robots

**Product:** Shield vs Robots (Android, Capacitor)  
**Platform:** Windows 11 Pro  
**Last updated:** 2026-09-29

This guide walks through setting up the Android development environment on Windows, building and running the app on an emulator, and running the test suite.

---

## Prerequisites

- Windows 11 Pro (or Windows 10 with virtualization enabled)
- Git (to clone/update the repository)
- Node.js v24.x and npm v11.x (already installed if you reached this step)
- Sufficient disk space: ~5 GB for Android SDK, emulator images, and build artifacts

---

## 1. Android Development Tooling Setup

### 1.1 JDK 21

Install the Eclipse Temurin JDK 21 from `winget`:

```powershell
winget install "EclipseAdoptium.Temurin.21.JDK"
```

Verify installation:

```powershell
java -version
# Expected: openjdk version "21.0.12.1" or later
```

Set the `JAVA_HOME` environment variable:

```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot", "User")
```

### 1.2 Android SDK

Download and extract the Android SDK Command-line Tools:

1. Download from [Google's official repository](https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip) (or a later version listed there).
2. Extract to `C:\Users\<your_username>\Android\sdk\cmdline-tools\latest`.
3. Set `ANDROID_HOME`:

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\<your_username>\Android\sdk", "User")
```

4. Accept the Android SDK licenses (required, interactive):

```powershell
cd $env:ANDROID_HOME
.\cmdline-tools\latest\bin\sdkmanager.bat --licenses
# Type "y" for each license agreement
```

5. Install required SDK packages:

```powershell
$ANDROID_HOME = $env:ANDROID_HOME
cd $ANDROID_HOME

# Run these commands (they may take several minutes):
.\cmdline-tools\latest\bin\sdkmanager.bat "platforms;android-24" "platforms;android-36"
.\cmdline-tools\latest\bin\sdkmanager.bat "build-tools;36.0.0"
.\cmdline-tools\latest\bin\sdkmanager.bat "system-images;android-24;google_apis;x86_64"
.\cmdline-tools\latest\bin\sdkmanager.bat "system-images;android-36;google_apis;x86_64"
```

### 1.3 Verify Installation

Reload your PowerShell session and verify:

```powershell
$env:ANDROID_HOME
$env:JAVA_HOME
java -version
sdkmanager --version
```

All commands should return without error.

---

## 2. Project Setup

### 2.1 Clone or update the repository

```powershell
cd <your_workspace>
git clone https://github.com/hogy86/ahogancamp_portfolio.git
cd ahogancamp_portfolio/projects/ai-ml/VibeCoding/ClaudeCode-UFOArcadeGame/scaffold
```

### 2.2 Install npm dependencies

```powershell
npm install
```

This installs Capacitor, Playwright, and other dependencies listed in `package.json`.

### 2.3 Create the Android project (first time only)

If the `android/` folder does not yet exist, run:

```powershell
npx cap add android
```

This creates the native Android project structure. Commit the result.

### 2.4 Sync web assets to the Android project

```powershell
npm run build:android
npx cap sync android
```

This builds the web app in Android mode and copies assets into the native project. Run this every time you change `src/`.

---

## 3. Creating Emulator Device Profiles

### 3.1 List available device profiles

```powershell
$ANDROID_HOME = $env:ANDROID_HOME
cd $ANDROID_HOME
.\cmdline-tools\latest\bin\avdmanager.bat list device
```

### 3.2 Create AVDs for testing

Create a high-end phone profile (for primary development):

```powershell
avdmanager create avd -n svr_api36_pixel7 ^
  -k "system-images;android-36;google_apis;x86_64" ^
  -d pixel
```

Create a low-end reference profile (640×360 dp landscape):

```powershell
avdmanager create avd -n svr_api24_small ^
  -k "system-images;android-24;google_apis;x86_64" ^
  -d "Nexus 5"
```

List your AVDs:

```powershell
avdmanager list avd
```

---

## 4. Building the App

### 4.1 Build for the emulator (debug mode)

**Important:** Always build in the mirror outside OneDrive (see §4.3 below).

From the **repository** on your machine, build the web assets and sync:

```powershell
npm run build:android
npx cap sync android
```

Then, **in the mirror** (`C:\Users\<your_username>\dev-build\shield-vs-robots`), build the Android debug APK:

```powershell
cd C:\Users\<your_username>\dev-build\shield-vs-robots
gradlew assembleDebug
```

Or use the npm script (which calls Gradle internally):

```powershell
npm run android:debug
```

The built APK is at: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4.2 Build for release (unsigned)

In the mirror:

```powershell
cd C:\Users\<your_username>\dev-build\shield-vs-robots
gradlew assembleRelease -PvvsCiUnsignedRelease=true -Dorg.gradle.java.home=$env:JAVA_HOME
```

Or:

```powershell
$env:CI = "true"
gradlew assembleRelease
```

### 4.3 The build mirror

**Why:** Gradle cannot build inside the OneDrive-synced repository. Builds create temporary files that OneDrive tries to reparse as cloud objects, and some Gradle paths exceed Windows `MAX_PATH`.

**Solution:** Maintain a disposable mirror outside OneDrive at `C:\Users\<your_username>\dev-build\shield-vs-robots`.

**To refresh the mirror:**

Use the provided PowerShell script:

```powershell
C:\Users\<your_username>\dev-build\scripts\refresh-android-mirror.ps1
```

This script:
- Stops any stray Node processes that reference the mirror path.
- Clears old Gradle build artifacts from the mirror.
- Mirrors the repository into `C:\Users\<your_username>\dev-build\shield-vs-robots` via `robocopy /MIR`, excluding node_modules, .git, and build outputs.
- Runs `npm ci` in the mirror to install locked dependencies.

**Never edit files directly in the mirror.** Always edit in the repository, then refresh the mirror before building.

---

## 5. Running on the Emulator

### 5.1 Start an emulator

Launch an AVD in headless mode (recommended for CI and batch runs):

```powershell
emulator -avd svr_api36_pixel7 -no-window -no-audio -no-snapshot -gpu host
```

Or with a visual window:

```powershell
emulator -avd svr_api36_pixel7 -gpu host
```

Wait for `adb shell getprop sys.boot_completed` to return `1`.

### 5.2 Install and run the debug APK

```powershell
$env:ANDROID_HOME = "C:\Users\<your_username>\Android\sdk"
adb install -r C:\Users\<your_username>\dev-build\shield-vs-robots\android\app\build\outputs\apk\debug\app-debug.apk
adb shell am start -n io.github.hogy86.shieldvsrobots/.MainActivity
```

Or, after building with `npm run android:debug`:

```powershell
adb shell am start -n io.github.hogy86.shieldvsrobots/.MainActivity
```

### 5.3 View logs

```powershell
adb logcat
```

### 5.4 Stop the emulator

```powershell
adb emu kill
```

---

## 6. Running Tests

### 6.1 Unit tests and code checks

```powershell
npm run test          # Vitest: shared game logic
npm run lint          # ESLint: code style
npm run typecheck     # TypeScript type checking
npm run check:secrets # Detect committed secrets
```

### 6.2 End-to-end tests (Playwright, phone emulation)

Tests run in Chromium with mobile device emulation (touch, viewport sizes):

```powershell
npm run test:e2e:mobile
```

This runs all specs in `tests/mobile-e2e/` against four device profiles (API 36 phone, API 30 mid-range, API 24 small, tablet). No real emulator needed; these tests verify the web bundle directly.

### 6.3 Full CI check (as it runs in GitHub Actions)

```powershell
npm run build            # Web build
npm run build:android   # Android-mode web build
npm run typecheck
npm run lint
npm run test            # Unit tests
npm run check:secrets
npm run test:e2e:mobile # Playwright
node scripts/check-android-manifest.mjs --variant debug  # After a debug build
```

---

## 7. Debugging

### 7.1 WebView debugging (Chrome DevTools)

On a running debug build:

```powershell
# In PowerShell:
adb forward tcp:9222 localabstract:chrome_devtools_remote

# Then open Chrome or Edge and navigate to:
# chrome://inspect
```

### 7.2 Logcat filtering

```powershell
# All logs for your app:
adb logcat | grep "io.github.hogy86.shieldvsrobots"

# Errors and warnings only:
adb logcat *:E *:W

# Clear logcat:
adb logcat -c
```

### 7.3 Take a screenshot

```powershell
adb shell screencap /sdcard/screen.png
adb pull /sdcard/screen.png .\
```

---

## 8. Troubleshooting

### No emulator boots

- **Check virtualization:** `emulator -accel-check` should say "WHPX" (Windows Hypervisor Platform) is installed and OK.
- **Restart adb:** `adb kill-server && adb start-server`
- **Wipe and reboot the AVD:** `emulator -avd <name> -wipe-data -no-snapshot`

### APK fails to install

```powershell
# Uninstall first:
adb uninstall io.github.hogy86.shieldvsrobots

# Then reinstall:
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Gradle build fails with "Unable to delete directory"

This usually means the mirror has stale Gradle artifacts. Refresh it:

```powershell
C:\Users\<your_username>\dev-build\scripts\refresh-android-mirror.ps1
```

### JAVA_HOME or ANDROID_HOME not set

Verify in PowerShell:

```powershell
echo $env:JAVA_HOME
echo $env:ANDROID_HOME
```

If empty, set them again (see §1.1 and §1.2), then reload PowerShell.

---

## 9. Next Steps

- **To submit to Play Store:** follow `docs/mobile/release-runbook.md`.
- **To view app requirements:** see `docs/mobile/PRD-mobile.md`.
- **To understand architecture:** see `docs/mobile/architecture/mobile-architecture.md`.

---

## Sources

- `docs/mobile/tooling-setup-log.md` — detailed infrastructure setup history and verification.
- `docs/mobile/architecture/mobile-architecture.md` §3 — project layout and build modes.
- `.claude/CLAUDE.md` — mobile pipeline stages and approval gates.
- `android/app/build.gradle` — build configuration, versionCode/versionName, signing contract.
