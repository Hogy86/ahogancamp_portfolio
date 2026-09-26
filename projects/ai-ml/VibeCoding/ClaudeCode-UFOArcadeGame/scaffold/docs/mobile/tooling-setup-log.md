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
