# Deploy the App: next steps to Google Play

Where the Android app stands and what is left before it can go on the
Google Play Store. Written 2026-10-10 from the Play Store readiness review.

**Current state:** the app ("Shield vs Robots", app ID
`io.github.hogy86.shieldvsrobots`) builds and passed UAT in the Android
emulator (PRs #12, #13, #14). Nothing has been published, signed for
release, or uploaded. The scope so far stopped at the emulator on purpose
(see "Scope" in `.claude/CLAUDE.md`), so starting the Play release is a new
project decision.

## 1. Already ready (no change needed)

| Area | Status | Where |
|---|---|---|
| Target SDK | targetSdk 36, which Play requires for new apps since 2026-08-31. minSdk 24. | `android/variables.gradle` |
| Release signing | Fail-closed: refuses to build a release without an upload key stored outside the repo and OneDrive; never signs with the debug key. | `android/app/build.gradle` |
| Permissions | None. INTERNET is removed, no cleartext traffic, backup off. Data safety can answer "no data collected". | `android/app/src/main/AndroidManifest.xml` |
| App icon | Adaptive icon with foreground, background and monochrome layers, all densities. | `android/app/src/main/res/` |
| Native libraries | None, so Play's 16 KB page-size rule does not apply. | |
| Release process | Step-by-step Windows runbook (key, AAB build, closed test, production). | `docs/mobile/release-runbook.md` |
| Store listing text | Draft v2, trademark keywords removed. | `docs/mobile/market/listing-draft-v2.md` |

## 2. Decisions for the owner (still pending in `docs/mobile/PRD-mobile.md`)

Make these first. Each has a recommendation.

1. **Hero name "ShieldMan" (OQ-M15).** The market research flagged it as
   close to Captain America (`docs/mobile/market/play-store-research.md`
   §6.4). It is the biggest rejection or takedown risk.
   *Recommendation:* rename the hero to a generic name before the first
   upload. It is a small text change now and a painful one after launch.
2. **Account type, app ID and developer name (OQ-M11).** A personal
   account costs $25 and needs the 12-tester, 14-day closed test. An
   organization account needs a D-U-N-S number but skips the test. The app
   ID can never change after the first upload.
   *Recommendation:* personal account, keep `io.github.hogy86.shieldvsrobots`,
   and pick the public developer name shown on the listing.
3. **Target age group (OQ-M13).** *Recommendation:* "13 and over", which
   keeps the app out of the stricter Families policy.
4. **Testers (OQ-M14).** Google requires 12 testers to stay opted in for
   14 continuous days. *Recommendation:* a Google Group with 15 to 20
   people, so drop-outs don't put the 14 days at risk. Start recruiting
   early; this is the longest step.
5. **App signing (OQ-M12).** *Recommendation:* Play App Signing (Google
   holds the app key; you keep only an upload key, which Google can reset
   if lost). Decide where to back up the upload key and its password.
6. **Price and ads.** Earlier decision: free, no ads. Confirm it still
   stands, since ads later change Data safety and the content rating.
7. **Lift the emulator-only scope** in `.claude/CLAUDE.md` ("Scope") so
   the release steps of the mobile pipeline can run.

## 3. What Claude can do (one small PR, after the decisions)

1. Apply the hero-name decision across the game text, listing and docs.
2. Make the store graphics from `docs/mobile/ux/store-assets-spec.md`: the
   512 x 512 listing icon, the 1024 x 500 feature graphic and listing
   phone screenshots. None exist yet; the images in
   `docs/mobile/tests/screenshots/` are test evidence, not listing shots.
3. Write a Play Console answers sheet (Data safety, content rating, target
   audience, ads) to copy into the forms (runbook condition C10).
4. Create `docs/mobile/release/submission-checklist.md`, which the runbook
   records into but which does not exist yet.
5. Record the decisions in `docs/mobile/PRD-mobile.md` and close runbook
   conditions C1 to C11.

## 4. What only the owner can do (your accounts, your PC)

1. Open `https://hogy86.github.io/ahogancamp_portfolio/privacy.html` in a
   browser and confirm it loads (Claude's cloud sandbox can't reach it).
2. Create the Play Console account: pay $25, pass identity and phone
   verification.
3. Generate the upload key on the Windows PC and back it up
   (runbook §2).
4. Build the signed app bundle (AAB) on the PC (runbook §3). CI never
   signs, by design.
5. Install the release build on at least one **real Android phone** and
   play a few levels. All testing so far was on emulators.
6. Fill in the Play Console forms: content rating questionnaire (expected
   about Everyone 10+ / PEGI 7), Data safety, target audience, ads, category
   (Game > Arcade), privacy policy URL.
7. Upload to the closed testing track and keep 12+ testers opted in for 14
   days (runbook §6 and §7).
8. Apply for production access, then promote the **same** AAB that passed
   the closed test (runbook §8).

## 5. Suggested order

1. Owner decides the hero name and the account type (section 2).
2. Owner starts recruiting testers in parallel.
3. Claude does the section 3 PR; owner reviews and merges.
4. Owner does section 4, steps 1 to 7.
5. After 14 days and Google's approval, owner releases to production.

## 6. Picking this up again in Claude Code Desktop

The full background is in the Claude project "Mobile App", in the thread
that asked about deploying to the Android store. You can continue there or
start fresh on your PC.

**Option A: from the Claude project (cloud, easiest).** Post a new message
in the project chat, for example: *"Start the Play Store release. Read
`Deploy-App.md` in the scaffold folder. My decisions: hero name ...,
personal account, 13+."* A new thread picks it up.

**Option B: Claude Code Desktop on your Windows PC.** Use this for anything
that must run on your PC (the emulator, building and signing the AAB).

1. Open the **Claude desktop app** and go to the **Code** tab.
2. If you don't have the repo on this PC yet, clone it once in a terminal
   (PowerShell):
   ```powershell
   cd $HOME\source
   git clone https://github.com/Hogy86/ahogancamp_portfolio.git
   ```
   Keep the clone out of OneDrive, because the signing setup refuses to
   run there.
3. Start a **new session** and choose this folder (the scaffold folder,
   not the repo root, so the mobile agents register):
   `...\ahogancamp_portfolio\projects\ai-ml\VibeCoding\ClaudeCode-UFOArcadeGame\scaffold`
4. As the first message, paste:
   ```
   Pull master first. Then read Deploy-App.md and
   docs/owner-guide-starting-a-change.md. We are starting the Play Store
   release. My decisions: <hero name>, <account type>, <age group>.
   Size the change and tell me the team before starting.
   ```
5. Claude reads this file, records your decisions, and walks the release
   runbook with you. Steps that need your accounts or passwords (Play
   Console, the upload key) stay with you; Claude never handles the key or
   its password.

**Terminal alternative:** open PowerShell in the scaffold folder, run
`git pull`, then `claude`, and paste the same first message.

See `docs/owner-guide-starting-a-change.md` for the general rules on
starting a new change (one change per new session, what to put in the
first message).
