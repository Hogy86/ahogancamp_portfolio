---
name: play-policy-checklist
description: Google Play policy and Android release-safety checklist for the game - Data safety, permissions, content rating, target audience, IP, target API level, and release build hardening. Use by mobile-security-compliance-reviewer (both passes) and mobile-release-engineer.
---

# Play Policy Checklist

Inherits invoking subagent's model.

Google Play policies change. Before each review, confirm current
requirements (especially the required targetSdk and testing rules)
against Google's official Play Console Help and Developer Policy
Center — don't rely on remembered numbers.

## Data and privacy
- Data safety form answers match the code exactly. For an offline game
  that stores only high score/settings on-device and sends nothing,
  the expected answer is "no data collected or shared" — verify no
  plugin or SDK contradicts that.
- A privacy policy URL is provided and matches the Data safety answers.
- No analytics, ads, or crash-reporting SDKs unless the PRD requires
  them; if added, the Data safety form and privacy policy are updated.

## Permissions
- Merged AndroidManifest.xml declares only permissions the app uses.
  Question every one (including defaults added by Capacitor or
  plugins) and document why each is kept.

## Content and audience
- Content rating questionnaire answered consistently with the game
  (cartoon/fantasy violence, no user interaction, no purchases).
- Target audience and content set deliberately. If children under 13
  are in scope, the Families policy applies — flag to the owner.

## Intellectual property and metadata
- App name, icon, feature graphic, screenshots, and description
  contain no Marvel, Captain America, or other third-party names,
  logos, or look-alikes.
- Listing is accurate: screenshots are real gameplay, no misleading
  claims, no keyword stuffing.

## Technical requirements
- targetSdk meets the current Play requirement.
- Release is an app bundle (.aab) signed with the upload key; Play App
  Signing enrolled.
- New personal developer accounts: closed test with the required
  number of testers for the required continuous days before
  production access.

## Release build hardening
- Not debuggable; WebView remote debugging disabled in release.
- No cleartext (HTTP) traffic; no Capacitor `server.url` (live reload)
  in the release config.
- No keystore, key password, or `keystore.properties` in the repo;
  `.gitignore` covers them.

## Findings format
`[Severity] — [Checklist item] — [File:line / config key / Console
field] — [Issue] — [Required fix]`.
