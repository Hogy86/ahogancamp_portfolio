# Android Release Runbook — Shield vs Robots

**For:** Mobile Release Engineer (Step 15)  
**Product:** Shield vs Robots (Android, Google Play)  
**Process stage:** Step 15 (release build, signing, upload)  
**Prerequisites:**
- All prior gates (UAT Step 14) PASS.
- The reviewed release tree is committed.
- Upload key exists outside repo and OneDrive (§2.1).
- Play App Signing is enrolled (§2.1).

---

## 1. Pre-Release Checklist (before any build)

### 1.1 Conditions from security pass 2

Verify these items from `docs/mobile/security/review-v2.md` conditions C1-C11 are complete and recorded in `docs/mobile/release/submission-checklist.md`:

- [ ] **C1:** OQ-M11 decided: account type, public developer name, contact email, app ID confirmed or updated.
- [ ] **C2:** OQ-M12 decided: Play App Signing enrolled, upload key generated and backed up.
- [ ] **C3:** OQ-M13 decided: target age group (if "under 13", Families policy applies and review-v2 addendum required).
- [ ] **C4:** OQ-M14 decided: ≥ 12 testers recruited and confirmed for closed test.
- [ ] **C5:** OQ-M15 (ShieldMan name check) decided and recorded in PRD-mobile §7.
- [ ] **C6:** V2-M2 (trademark keywords removed from listing).
- [ ] **C7:** V2-M3 closed as owner risk-accepted (PRD addendum v5 r3; review-v2 addendum 4). M9.6 note recorded; no Multiplier or Shield token in any store graphic; icon, splash and feature graphic X-free.
- [ ] **C8:** Privacy text final; hosted URL loads over HTTPS; all three hashes equal.
- [ ] **C9:** V2-L2 release evidence plus live re-check of targetSdk, closed-test rule, and User Data policy wording.
- [ ] **C10:** Play Console answers transcribed and entered exactly.
- [ ] **C11:** No changed build promoted to production without CI and a C9 re-run (due at step 17).

If any condition is OPEN, stop and route back to mobile-product-manager before proceeding.

### 1.2 Tree verification

```powershell
cd <repo>/projects/ai-ml/VibeCoding/ClaudeCode-UFOArcadeGame/scaffold

# Verify the tree is committed and clean:
git status
# Expected: "working tree clean"

# Get the commit SHA (to be recorded in submission-checklist.md):
git rev-parse --short HEAD
# Record this SHA
```

---

## 2. Signing Key Setup (One Time)

**Note:** This section applies only if the upload key does not yet exist. After the first release, skip to §3.

### 2.1 Generate the upload key (outside repo and OneDrive)

The upload key must be generated and stored outside this repository and outside OneDrive, per M-ADR-0011 (Decision 1-3).

**Location:** `%USERPROFILE%\.android-signing\vvs\`  
**Rationale:** This folder is outside OneDrive (which would sync passwords to the cloud). Gradle's signing contract in `android/app/build.gradle` rejects the configured `signing.properties` or `storeFile` path if that path is under the project root, the git top-level, or any `onedrive` path. Storing the key outside keeps builds secure and fail-closed.

**Steps:**

1. **Create the key directory:**

```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\.android-signing\vvs" -Force
```

2. **Restrict the folder's ACL (owner-only):**

```powershell
icacls "$env:USERPROFILE\.android-signing\vvs" /inheritance:r /grant:r "${env:USERNAME}:(OI)(CI)F"
```

This sets the NTFS permissions so only your account can read/write the folder. Verify:

```powershell
icacls "$env:USERPROFILE\.android-signing\vvs"
# Expected: only your username with "(OI)(CI)(F)"
```

3. **Verify OneDrive does not sync the profile root:**

Before creating the keystore, confirm that your profile folder is not synced to OneDrive. OneDrive Known Folder Move covers Desktop, Documents, and Pictures only. Verify:

```powershell
# Check if OneDrive paths exist and where they point:
$env:OneDrive
$env:OneDriveConsumer
$env:OneDriveCommercial

# None of these should be a prefix of $env:USERPROFILE\.android-signing
# Example check (the paths should not match):
$signingDir = "$env:USERPROFILE\.android-signing"
if ($env:OneDrive -and $signingDir -like "$env:OneDrive*") { Write-Host "ERROR: signingDir is under OneDrive" }
if ($env:OneDriveConsumer -and $signingDir -like "$env:OneDriveConsumer*") { Write-Host "ERROR: signingDir is under OneDriveConsumer" }
if ($env:OneDriveCommercial -and $signingDir -like "$env:OneDriveCommercial*") { Write-Host "ERROR: signingDir is under OneDriveCommercial" }

# Also verify OneDrive settings:
# Settings → Accounts → Backup → "Manage backup"
# Only Desktop, Documents, and Pictures should be enabled.
```

4. **Verify GRADLE_USER_HOME is not in OneDrive:**

The `GRADLE_USER_HOME` environment variable must not point into OneDrive. If it is not set, the default is `~/.gradle`, which is in your profile. Verify:

```powershell
$env:GRADLE_USER_HOME
# If set, ensure it is not under OneDrive
# If empty or not set, that is safe (default ~/.gradle is fine outside OneDrive sync).
```

5. **Generate the key using `keytool` (part of JDK 21), with no password flags:**

**Important:** Do NOT use `-keypass` or `-storepass` flags on the command line. Let `keytool` prompt you for the passwords instead, so they never appear in PowerShell history.

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore "$env:USERPROFILE\.android-signing\vvs\shield-vs-robots-upload.jks" `
  -keyalg RSA -keysize 2048 -validity 10950 `
  -alias shield-vs-robots-upload `
  -dname "CN=<Your Name>, OU=<Your Company/Personal>, O=<Organization>, L=<City>, ST=<State>, C=<Country Code>"
```

Example (replace with your own details):

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore "$env:USERPROFILE\.android-signing\vvs\shield-vs-robots-upload.jks" `
  -keyalg RSA -keysize 2048 -validity 10950 `
  -alias shield-vs-robots-upload `
  -dname "CN=Aaron Hogancamp, O=Personal, C=US"
```

The command will prompt you:
```
Enter keystore password: [type a strong password, 32+ characters, random, letters and digits only (no \)]
Re-enter keystore password: [repeat it]
```

**Important:** JDK 21 creates PKCS12 keystores by default. In PKCS12, keytool will not ask for a key password; set `keyPassword` equal to `storePassword`.

**Record both passwords in your password manager immediately after** (see step 7 below).

6. **Verify the key was created:**

```powershell
ls "$env:USERPROFILE\.android-signing\vvs\"
# Expected: shield-vs-robots-upload.jks exists
```

7. **Backup the key and passwords to your password manager:**

   - Attach the `.jks` file to a password manager entry (1Password, Bitwarden, LastPass, etc.).
   - Store the **keystore password** and **key password** as separate fields in the same entry (both equal for PKCS12).
   - Label the entry: "Shield vs Robots upload key and keystore password".
   - **Do NOT use OneDrive, Google Drive, or email for backups.** Password managers are the approved method per M-ADR-0011 (Decision 1).

### 2.2 Create the signing.properties file

The file must live in the same secure folder (not in the repo):

```powershell
# Create the file at:
# $env:USERPROFILE\.android-signing\vvs\signing.properties

# Contents (use forward slashes, not backslashes):
storeFile=C:/Users/<your_username>/.android-signing/vvs/shield-vs-robots-upload.jks
storePassword=<your keystore password from password manager>
keyAlias=shield-vs-robots-upload
keyPassword=<your keystore password from password manager>
```

Example (with fake passwords; replace with your own):

```
storeFile=C:/Users/aaron/.android-signing/vvs/shield-vs-robots-upload.jks
storePassword=MySecureKeyPass123MySecureKeyPass456
keyAlias=shield-vs-robots-upload
keyPassword=MySecureKeyPass123MySecureKeyPass456
```

**Why forward slashes?** Java's `Properties.load()` treats `\` as an escape character. A backslash before most characters is silently dropped, corrupting the path. Forward slashes work on Windows (Java path APIs accept them) and never trigger escape processing. Doubled backslashes (`C:\\Users\\...`) are an alternative, but forward slashes are clearer.

**Critical:** `.gitignore` covers `signing.properties` as a backstop, but it must never be placed in the repository or any OneDrive-synced folder. It lives outside both.

### 2.3 Set the signing.properties path (environment variable or Gradle property)

Gradle needs to find the `signing.properties` file. Choose one method:

**Option A: Set the environment variable (recommended for one-off local builds):**

```powershell
$env:VVS_SIGNING_PROPERTIES = "$env:USERPROFILE/.android-signing/vvs/signing.properties"
```

Then build (see §3.2 below). The environment variable persists for the current PowerShell session only; set it again in a new session. Use forward slashes.

**Option B: Set it in your user Gradle properties (persists across sessions):**

Edit or create `%USERPROFILE%\.gradle\gradle.properties` and add:

```
vvsSigningProperties=C:/Users/<your_username>/.android-signing/vvs/signing.properties
```

Use the full path with forward slashes. This file holds a **path only**, never a password or secret. This option is not recommended for CI (M-ADR-0011 decision 5): CI never signs, and GitHub Actions secrets are a forbidden place for signing values.

### 2.4 Play App Signing enrollment

Shield vs Robots must use **Google Play App Signing**, which means:

- **Upload key** (created above) signs the bundle you upload. You control this key.
- **App signing key** is generated and held by Google. Google uses it to sign the APK delivered to users.

**Enrollment is a one-time setup in Google Play Console:**

1. Go to **Play Console** → **Shield vs Robots** → **Setup** → **App signing**.
2. Confirm that "Google Play App Signing" is enabled (it should be default for new apps).
3. Note the **App signing certificate** fingerprint (displayed for your records).

No action is needed here if it is already enrolled.

---

## 3. Build and Sign

### 3.1 Refresh the build mirror

Before every build, refresh the mirror outside OneDrive to ensure you have the latest committed code. The mirror is a disposable copy maintained at `C:\Users\<owner>\dev-build\shield-vs-robots` per M-ADR-0011 (Amendment A9).

```powershell
# Run the mirror-refresh script from the repository:
powershell.exe -NoProfile -File "<repo>\scripts\refresh-android-mirror.ps1"
```

Replace `<repo>` with your actual scaffold repository root (e.g., `C:\Users\aaron\OneDrive\Documents\GitHub\ahogancamp_portfolio\projects\ai-ml\VibeCoding\ClaudeCode-UFOArcadeGame\scaffold`).

The script:
- Stops stray Node processes that reference the mirror.
- Clears old Gradle build artifacts from the mirror.
- Mirrors the repository into the mirror path via robocopy.
- Performs a parity check to verify the mirror matches the repo.

Expected output: "Parity check passed: NNN file(s) are identical." Record this in submission-checklist.md.

If the script does not exist, it is the one canonical copy at `<repo>/scripts/refresh-android-mirror.ps1`; never recreate it.

### 3.2 Build the AAB (Android App Bundle)

In the **mirror**, NOT in the OneDrive repo:

```powershell
cd C:\Users\<owner>\dev-build\shield-vs-robots

# First, update the web assets and sync to Android:
npm run build:android
npx cap sync android

# Then build the signed bundle:
# (Requires VVS_SIGNING_PROPERTIES env var or vvsSigningProperties in ~/.gradle/gradle.properties)
cd android
.\gradlew.bat bundleRelease --no-daemon
```

**Expected output:** `BUILD SUCCESSFUL` (around 200-250 tasks).

**Location of built bundle:** `android/app/build/outputs/bundle/release/app-release.aab`

### 3.3 Verify the bundle

```powershell
# Check file size (should be several MB, typically 5-15 MB for this game):
(Get-Item android/app/build/outputs/bundle/release/app-release.aab).Length

# Get the SHA-256 hash (to be recorded in submission-checklist.md):
(Get-FileHash android/app/build/outputs/bundle/release/app-release.aab -Algorithm SHA256).Hash

# Or use certUtil:
certUtil -hashfile android/app/build/outputs/bundle/release/app-release.aab SHA256
```

**Record these for submission-checklist.md:**
- Build timestamp
- AAB SHA-256 hash
- File size in bytes

---

## 4. Release Test (V2-L2 Smoke Checks)

Before uploading, run the release-build smoke tests on the emulator:

### 4.1 Install the bundle on a device/emulator

Use `bundletool` (a Java jar) to convert the bundle to APK(s) and install:

**Get bundletool:**

Download from https://github.com/google/bundletool/releases (the latest `.jar` file).

**Create APKs from the bundle and install:**

```powershell
cd C:\Users\<owner>\dev-build\shield-vs-robots

# For a running emulator, use connected-device mode:
java -jar bundletool.jar build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab `
  --output=app-release.apks --connected-device

# Then install:
java -jar bundletool.jar install-apks --apks=app-release.apks
```

### 4.2 Smoke checks (emulator or device)

Start the app on the emulator/device and verify:

1. **Cold start in airplane mode:** turn off WiFi/cellular, launch the app.
   - Title screen renders within 5 seconds.
   - "Shield vs Robots" title and "Best: 0" are visible.
   - Start the game, play for 30 seconds.
   - Score, lives, level update correctly. Touch controls are responsive.

2. **Settings → Privacy policy:** tap Settings, then Privacy policy.
   - Privacy overlay opens with the correct text.
   - Close button dismisses it.
   - Return to Settings.

3. **WebView debugging is OFF:** connect with Chrome DevTools.
   - `chrome://inspect` does NOT list this app's WebView.
   - (This is a release-build safety check.)

4. **No network errors:** check logcat for errors.
   ```powershell
   adb logcat -d | Select-String -Pattern 'net::ERR_|FATAL EXCEPTION|ClassNotFoundException'
   # Expected: no matches
   ```

5. **Manifest is correct:** run the manifest checker on the signed bundle.
   ```powershell
   # Dump the manifest from the bundle:
   java -jar bundletool.jar dump manifest --bundle=android/app/build/outputs/bundle/release/app-release.aab > manifest.xml
   
   # Then run the checker:
   node scripts/check-android-manifest.mjs --variant release --manifest-xml manifest.xml
   ```

**Record the results in submission-checklist.md** (per review-v2 conditions C9 and V2-L2).

---

## 5. Create Release Notes

Generate player-facing release notes (500 characters max for Play Store display):

1. Create `docs/mobile/release/release-notes-v1.md` if this is the first release.
2. Write the "What's new" section covering the release (500 characters max).
3. Listing text comes only from `docs/mobile/market/listing-draft-v2.md` — do not invent new copy here.

Example for v1.0 (238 characters, fits the 500-char limit):

```
Shield vs Robots: an arcade game where you throw a bouncing shield to defeat 
waves of robots. Catch power-ups, face bosses, and beat your best score. 
10 levels, no ads, no account needed. Free and fully offline.
```

---

## 6. Upload to Play Console (Closed Test Track)

### 6.1 Prepare the Play Console

Go to **Google Play Console** → **Shield vs Robots** → **Testing** → **Closed testing**:

1. Confirm the closed test has ≥ 12 opted-in testers (condition C4).
2. Go to **Releases** → **Create new release**.
3. Add the signed `.aab`:
   - Upload `android/app/build/outputs/bundle/release/app-release.aab`.
   - Play Console validates it and shows device compatibility.
4. **Data safety:** confirm the answers from `docs/mobile/security/review-v2.md` §6 (they should match what you entered at step 15).
5. **Store listing:** confirm the short description, long description, and screenshots.
6. **Release notes:** paste the "What's new" notes from §5 (up to 500 characters).

### 6.2 Validate and release to closed test

1. Click **Review release** and verify the summary.
2. Click **Release to Closed Testing**.
3. Play Console sends invitations to the testers; they can install within 24 hours.
4. **Record the release ID and timestamp in submission-checklist.md.**

---

## 7. Closed Test Duration and Results (Step 16)

**Process:** The closed test runs for **14 continuous days** (per Play's requirement for new personal accounts).

**Mobile Product Manager (Step 16) will:**
- Monitor tester feedback and crash reports in Play Console.
- Collect a pass/fail verdict after day 14.
- Document results in `docs/mobile/tests/closed-test-results.md`.

**This is a gate step.** The release cannot proceed to production without a PASS.

---

## 8. Production Release (Step 17)

### 8.1 Owner approval

After the closed-test PASS (step 16), route the approval request through mobile-product-manager to the owner:

> "Closed test passed. Ready for production release? (Requires your explicit approval.)"

**The owner must explicitly approve** before any production release.

### 8.2 Release to production (owner approval only)

Once approved:

1. Go to **Play Console** → **Shield vs Robots** → **Production** (or **Releases**).
2. Click **Create new release** and upload the **same `.aab` that passed closed test** (do not rebuild).
3. Use the **same release notes** from §5.
4. Set **Rollout percentage** (recommended: start at 50% or 100%, depending on risk tolerance).
5. Click **Review release** and then **Release to Production**.

**Record in submission-checklist.md:**
- Production release timestamp
- Rollout percentage
- Version code/name deployed

### 8.3 Monitor after launch

- Check **Android Vitals** in Play Console for crashes, ANRs (App Not Responding), and other issues.
- Monitor **Play Console** feedback and ratings.
- If issues arise, prepare a hotfix (new version code/name) or pause the rollout.

---

## 9. Version Lag: Play Store vs. Website

**Rule (from CLAUDE.md §One codebase):** The Play Store version can lag the website version.

**Privacy policy change rule (from mobile-architecture.md §8.7):** A material change to `public/privacy.html` requires an Android release. No release means the Play Store version still serves the prior privacy policy file.

**Why:** Releases are bundled in a `.aab` and must pass Play's review (24-48 hours). The website deploys on every `master` commit (seconds).

**Typical scenario:**
- Website: v1.3 (deployed immediately, privacy policy updated).
- Play Store: v1.2 (released 2 weeks ago, still rolling out, or awaiting review, privacy policy from v1.2).

**This is expected and not a parity violation.** Both versions are built from the same `src/` and share game rules; the lag is purely in release timing. A privacy policy change always ships in a new release.

**Player communication:** if you need to explain the lag, you can note:
- "Latest version on website" in the listing's short description.
- Or nothing (most players won't notice).

---

## 10. Submission Checklist

Record all the following in `docs/mobile/release/submission-checklist.md` before uploading:

### Pre-build

- [ ] Commit SHA (short): ____________________
- [ ] Tree clean (`git status`): Yes / No
- [ ] C1-C10 complete: Yes / No. C11 acknowledged (re-checked at step 17): Yes / No

### Build

- [ ] Mirror refresh command: ____________________
- [ ] Parity check passed: Yes / No
- [ ] Build timestamp (UTC): ____________________
- [ ] AAB file size (bytes): ____________________
- [ ] AAB SHA-256: ____________________

### Release Test (V2-L2)

- [ ] Cold start in airplane mode: PASS / FAIL
- [ ] Settings → Privacy policy: PASS / FAIL
- [ ] WebView debugging off (chrome://inspect): PASS / FAIL
- [ ] No network errors in logcat: PASS / FAIL
- [ ] Manifest check passed: PASS / FAIL

### Privacy policy (C8) and live policy re-check (C9)

- [ ] Hosted URL (`public/privacy.html` on GitHub Pages): loads over HTTPS
- [ ] Repo copy SHA-256 (from `public/privacy.html`): ____________________
- [ ] Hosted copy SHA-256 (downloaded from `https://hogy86.github.io/ahogancamp_portfolio/privacy.html`): ____________________
- [ ] App-bundled SHA-256 (from `base/assets/public/privacy.html` in AAB): ____________________
- [ ] All three SHA-256 hashes equal (repo, hosted, and bundled versions match): Yes / No
- [ ] C9 live policy re-check: Date checked ______, targetSdk requirement confirmed ______

To extract and hash the files:
```powershell
cd C:\Users\<owner>\dev-build\shield-vs-robots

# Mirror copy (the "repo copy" is actually the mirror copy; parity is checked by §3.1)
(Get-FileHash public/privacy.html -Algorithm SHA256).Hash

# Hosted copy (C8: must load over HTTPS)
Invoke-WebRequest -Uri "https://hogy86.github.io/ahogancamp_portfolio/privacy.html" -OutFile "$env:TEMP\privacy-hosted.html"
(Get-FileHash "$env:TEMP\privacy-hosted.html" -Algorithm SHA256).Hash

# AAB copy (tar ships with Windows 10+; Expand-Archive rejects .aab)
mkdir "$env:TEMP\aab-x" -Force | Out-Null
tar -xf android/app/build/outputs/bundle/release/app-release.aab -C "$env:TEMP\aab-x" base/assets/public/privacy.html
(Get-FileHash "$env:TEMP\aab-x\base\assets\public\privacy.html" -Algorithm SHA256).Hash

# If the hashes differ, check line endings first (the repo has LF, a Windows clone with core.autocrlf=true may produce CRLF).
# Compute all three hashes after A-C1 (the placeholder edit changes the hash) and after that commit is live on GitHub Pages.
```

### Store graphics (C7)

- [ ] Every store screenshot (phone and tablet), the feature graphic and the 512 icon checked by eye: no X token, no circle token. Any power-up shown is the fist or the rabbit.

### Play Console

- [ ] Data safety answers entered (match §6 of review-v2): Yes / No
- [ ] Closed test release ID: ____________________
- [ ] Closed test release timestamp: ____________________
- [ ] Closed test testers confirmed (≥ 12): Yes / No
- [ ] Production release timestamp (if approved): ____________________
- [ ] Production rollout percentage: ____________________

### Sign-off

- [ ] Release engineer (you): ____________________ (date/initials)
- [ ] Mobile product manager: ____________________ (date/initials)

---

## 11. Troubleshooting

### AAB build fails with "Refusing to build"

**Cause:** Signing properties are missing or invalid.

**Fix:**
1. Verify `VVS_SIGNING_PROPERTIES` env var is set (check: `echo $env:VVS_SIGNING_PROPERTIES`), or `vvsSigningProperties` is in `%USERPROFILE%\.gradle\gradle.properties`.
2. Verify the path points to the external `signing.properties` file (not in repo or OneDrive).
3. Verify the file has all four lines: `storeFile`, `storePassword`, `keyAlias`, `keyPassword`.
4. Verify the keystore file exists at `%USERPROFILE%\.android-signing\vvs\shield-vs-robots-upload.jks`.
5. Delete the mirror's `.gradle` folder and rebuild: `rm -r C:\Users\<owner>\dev-build\shield-vs-robots\.gradle`.

### "Error says the keystore is inside the repo, but it isn't"

**Cause:** Backslashes in `signing.properties` are being escape-processed by Java's `Properties.load()`.

**Fix:** Check `signing.properties` for single backslashes. Use forward slashes instead:
```
storeFile=C:/Users/<user>/.android-signing/vvs/shield-vs-robots-upload.jks
```

Doubled backslashes (`C:\\Users\\...`) are the alternative.

### "Unknown windowLayoutInDisplayCutoutMode"

**Cause:** Gradle built from an older branch that lacks the API-version split.

**Fix:** Refresh the mirror from the current `master` and rebuild.

### Play Console rejects the bundle

**Check:**
1. Correct app ID (`io.github.hogy86.shieldvsrobots`)?
2. Version code ≥ previous release?
3. Manifest: no missing permissions, no unexpected features?
4. Data safety answers complete?

See Play's error message in the console for details.

---

## Sources

- `docs/mobile/PRD-mobile.md` § Platform baseline, signing requirements.
- `docs/mobile/architecture/mobile-architecture.md` § §3 (build layout), §7.5 (signing contract), §8.7 (privacy policy rules).
- `docs/mobile/architecture/adr/0011-release-signing-contract.md` — signing key storage, ACL, environment variable setup.
- `docs/mobile/security/review-v2.md` § §6 (Play Console answers), conditions C1-C11.
- `.claude/CLAUDE.md` § Mobile Pipeline (gate structure, version lag rule).
