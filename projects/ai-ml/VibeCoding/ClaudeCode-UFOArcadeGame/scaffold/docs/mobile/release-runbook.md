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

Verify these items from `docs/mobile/security/review-v2.md` conditions C1-C10 are complete and recorded in `docs/mobile/release/submission-checklist.md`:

- ✓ **C1:** OQ-M11 decided: account type, public developer name, contact email, app ID confirmed or updated.
- ✓ **C2:** OQ-M12 decided: Play App Signing enrolled, upload key generated and backed up.
- ✓ **C3:** OQ-M13 decided: target age group (if "under 13", Families policy applies and review-v2 addendum required).
- ✓ **C4:** OQ-M14 decided: ≥ 12 testers recruited and confirmed for closed test.
- ✓ **C5:** OQ-M15 (ShieldMan name check) decided and recorded in PRD-mobile §7.
- ✓ **C6:** V2-M2 (trademark keywords removed from listing).
- ✓ **C7:** V2-M3 (permanent multiplier glyph ruled on per design review).

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

The upload key must be generated and stored outside this repository and outside OneDrive.

**Location:** `C:\Users\<owner>\.android-signing\vvs\`  
**Rationale:** Gradle's signing contract in `android/app/build.gradle` (lines 16-33) refuses to build if any key material is found under the repo, OneDrive, or git root. Storing the key outside all three keeps builds secure and fail-closed.

**Steps:**

1. Create the key directory:

```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\.android-signing\vvs" -Force
```

2. Generate the key using `keytool` (part of JDK 21):

```powershell
# Replace <your_password> with a strong password (32+ characters, random, NO shell metacharacters).
# Record the password in your password manager before running this command.

& "$env:JAVA_HOME\bin\keytool.exe" -genkey -v -keystore "$env:USERPROFILE\.android-signing\vvs\shield-vs-robots-upload.jks" `
  -keyalg RSA -keysize 2048 -validity 10950 `
  -alias shield-vs-robots-upload `
  -keypass <your_password> `
  -storepass <your_password> `
  -dname "CN=<Your Name>, OU=<Your Company/Personal>, O=<Organization>, L=<City>, ST=<State>, C=<Country Code>"
```

Example (with fake data; replace with your own):

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkey -v -keystore "$env:USERPROFILE\.android-signing\vvs\shield-vs-robots-upload.jks" `
  -keyalg RSA -keysize 2048 -validity 10950 `
  -alias shield-vs-robots-upload `
  -keypass MySecureKeyPass123!@#$ `
  -storepass MySecureKeyPass123!@#$ `
  -dname "CN=Aaron Hogancamp, O=Personal, C=US"
```

3. Verify the key was created:

```powershell
ls "$env:USERPROFILE\.android-signing\vvs\"
# Expected: shield-vs-robots-upload.jks exists
```

4. **Backup the key and password:**
   - Copy `shield-vs-robots-upload.jks` to an **external USB drive or encrypted cloud backup** (not OneDrive).
   - Store the password in your password manager (1Password, Bitwarden, etc.) with the note "Shield vs Robots upload key password".

5. Create the signing properties file (do not commit; in `.gitignore`):

```powershell
# In the repo root, create (but do NOT commit) this file:
# vvs-signing.properties

# Contents:
storeFile=C:\Users\<your_username>\.android-signing\vvs\shield-vs-robots-upload.jks
storePassword=<your_password>
keyAlias=shield-vs-robots-upload
keyPassword=<your_password>
```

Example:

```
storeFile=C:\Users\aaron\.android-signing\vvs\shield-vs-robots-upload.jks
storePassword=MySecureKeyPass123!@#$
keyAlias=shield-vs-robots-upload
keyPassword=MySecureKeyPass123!@#$
```

**Critical:** This file is in `.gitignore` and must NEVER be committed. `check-no-secrets.mjs` will catch it if it is.

### 2.2 Play App Signing enrollment

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

Before every build, refresh the mirror outside OneDrive to ensure you have the latest committed code:

```powershell
# Run the mirror-refresh script:
C:\Users\<owner>\dev-build\scripts\refresh-android-mirror.ps1

# This script:
# 1. Stops stray Node processes that reference the mirror.
# 2. Clears old Gradle artifacts.
# 3. Mirrors the repo into C:\Users\<owner>\dev-build\shield-vs-robots via robocopy.
# 4. Runs 'npm ci' to install locked dependencies.

# The script outputs a "Parity check passed" line. Record it in submission-checklist.md.
```

If the script does not exist yet, create it from the procedure in `docs/mobile/tooling-setup-log.md` (§2026-09-27 round 3 entry).

### 3.2 Build the AAB (Android App Bundle)

In the **mirror**, NOT in the OneDrive repo:

```powershell
cd C:\Users\<owner>\dev-build\shield-vs-robots

# First, update the web assets and sync to Android:
npm run build:android
npx cap sync android

# Then build the signed bundle:
# (Requires vvs-signing.properties in the repo root; Gradle will find it)
gradlew bundleRelease --no-daemon

# Or, use a Gradle wrapper wrapper if available:
.\gradlew.bat bundleRelease --no-daemon
```

**Expected output:** `BUILD SUCCESSFUL` (around 200-250 tasks).

**Location of built bundle:** `android/app/build/outputs/bundle/release/app-release.aab`

### 3.3 Verify the bundle

```powershell
# Check file size (should be several MB, typically 5-15 MB for this game):
ls -la android/app/build/outputs/bundle/release/app-release.aab | Format-Table Length

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

Use `bundletool` to convert the bundle to APK(s) and install:

```powershell
# Download bundletool if you don't have it:
# https://developer.android.com/studio/command-line/bundletool
# (Or use Google's version: $ go install github.com/google/bundletool/cmd/bundletool@latest)

# Create APKs from the bundle (for your emulator's configuration):
java -jar bundletool.jar build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab ^
  --output=app-release.apks --connected-device

# Or for a specific device (use this for emulator):
java -jar bundletool.jar build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab ^
  --output=app-release.apks --device-id=<emulator-device-id>

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
   adb logcat | grep -E "(net::ERR_|FATAL EXCEPTION|ClassNotFoundException)"
   # Expected: no matches
   ```

5. **Manifest is correct:** run the manifest checker on the signed bundle.
   ```powershell
   # Extract the release APK from the bundle first, or use bundletool to dump the manifest:
   java -jar bundletool.jar dump manifest --bundle=app-release.aab
   
   # Then run:
   $env:AAPT2_PATH = "C:\Users\<owner>\Android\sdk\build-tools\36.0.0\aapt2.exe"
   node scripts/check-android-manifest.mjs --variant release
   ```

**Record the results in submission-checklist.md** (per review-v2 conditions C9 and V2-L2).

---

## 5. Create Release Notes

Generate player-facing release notes (500 characters max for Play Store display):

1. Create `docs/mobile/release/release-notes-v1.md` if this is the first release.
2. Write the notes covering:
   - Main game features (shield, enemies, levels).
   - What's new (if not first release).
   - Control/gameplay highlights.
   - **Limit to 500 characters for Play Store's short description.**

Example for v1.0:

```
Shield vs Robots: an arcade game where you throw a bouncing shield to defeat 
waves of robots. Catch power-ups, face bosses, and beat your best score. 
10 levels, no ads, no account needed. Free and fully offline.
```

(This is 238 characters; typical range is 150–300 for good readability on Play.)

---

## 6. Upload to Play Console (Closed Test Track)

### 6.1 Prepare the Play Console

Go to **Google Play Console** → **Shield vs Robots** → **Testing** → **Closed testing**:

1. Confirm the closed test has ≥ 12 opted-in testers (condition C4).
2. Go to **Releases** → **Create new release**.
3. Add the signed `.aab`:
   - Upload `android/app/build/outputs/bundle/release/app-release.aab`.
   - Play Console validates it and shows device compatibility.
4. **Data safety:** confirm the answers from `docs/mobile/security/review-v2.md` §6 (they should match what you entered at step 14).
5. **Store listing:** confirm the short description, long description, and screenshots.
6. **Release notes:** paste the notes from §5.

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

**Why:** Releases are bundled in a `.aab` and must pass Play's review (24-48 hours). The website deploys on every `master` commit (seconds).

**Typical scenario:**
- Website: v1.3 (deployed immediately).
- Play Store: v1.2 (released 2 weeks ago, still rolling out, or awaiting review).

**This is expected and not a parity violation.** Both versions are built from the same `src/` and share game rules; the lag is purely in release timing.

**Player communication:** if you need to explain the lag, you can note:
- "Latest version on website" in the listing's short description.
- Or nothing (most players won't notice).

---

## 10. Submission Checklist

Record all the following in `docs/mobile/release/submission-checklist.md` before uploading:

### Pre-build

- [ ] Commit SHA (short): ____________________
- [ ] Tree clean (`git status`): Yes / No
- [ ] All conditions C1-C10 from review-v2 complete: Yes / No

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
1. Verify `vvs-signing.properties` exists in the mirror's repo root.
2. Verify the file has all four lines (storeFile, storePassword, keyAlias, keyPassword).
3. Verify the keystore file exists at `C:\Users\<owner>\.android-signing\vvs\shield-vs-robots-upload.jks`.
4. Verify the password is correct.
5. Delete the mirror's `.gradle` folder and rebuild: `rm -r C:\Users\<owner>\dev-build\shield-vs-robots\android\.gradle` (Windows: `rmdir /s .gradle`).

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
- `docs/mobile/architecture/mobile-architecture.md` § §3 (build layout), §7.5 (signing contract).
- `docs/mobile/security/review-v2.md` § §6 (Play Console answers), conditions C1-C10.
- `.claude/CLAUDE.md` § Mobile Pipeline (gate structure, version lag rule).
