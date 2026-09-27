# Mobile tooling requests

Format: what, why, which agent, date.

---

## 2026-09-27 — mobile-lead-tester (step 10)

**What:** Three additional/replacement emulator images for the device matrix in
`docs/mobile/PRD-mobile.md` §M10 and the carry-forwards routed to this step by
`docs/mobile/reviews/code-review-round4.md`/`code-review-round5.md`:

1. **A tablet AVD** (e.g. Pixel Tablet or a generic 10" `google_apis` x86_64
   image, API 33+). Needed for M2.8, M2.13, M12.4's optional tablet
   screenshots, and the "tablet" row of this step's required device matrix
   (PRD-mobile.md step-10 instructions). No such AVD currently exists
   (`avdmanager list avd` shows only `svr_api24_small`, `svr_api30_mid`,
   `svr_api36_pixel7` — all phone-shaped).
2. **A foldable AVD** (Android Studio's built-in "7.6 Fold-in with outer
   display" or similar `google_apis` foldable device definition). Needed for
   M2.9 (fold/unfold pauses, re-lays-out ≤1s, loses no state) and the
   "foldable, folded and unfolded" row of the required device matrix. No
   foldable AVD exists.
3. **An API 28 or 29 `google_apis` x86_64 image with a real WebView ≥ 80**,
   small-phone-shaped (640×360 dp landscape) if possible. This closes carried
   finding I2 (`code-review-round4.md` I1 → `code-review-round5.md` I2 →
   routed to step 10): "insets on API 24-29 with WebView ≥ 80" was never
   checked, because the only two AVDs spanning that range are `svr_api24_small`
   (API 24, real WebView 53 — below the app's own `minWebViewVersion: 80`, so
   it only ever shows the "please update WebView" fallback screen and can
   never render the game itself) and `svr_api30_mid` (API 30, which is the
   *other* side of the "pre-API-30" boundary the finding is about). Related:
   this same gap means the **low-end reference profile itself** (M10.1, M10.4,
   M2.6, M2.7, M3.1's 640×360 dp minimums) cannot be verified by *actually
   playing the built app* on `svr_api24_small` today — only by the Playwright
   phone-emulation suite at the same viewport size (a Chromium tab, not a real
   WebView). See `docs/mobile/tests/device-matrix.md` "Known gaps" for the
   disposition applied this round.

**Why:** Per this step's instructions, "if an emulator image is missing,
request it via `docs/mobile/tooling-requests.md` and stop" rather than
install it myself. These three rows of the device matrix (tablet, foldable,
pre-API-30-with-modern-WebView insets/low-end-profile) are stopped pending
these images; every other row in `docs/mobile/tests/device-matrix.md` was
completed this round on the three existing AVDs.

**Which agent:** mobile-it-analyst, to install and register the AVDs (and,
for item 3, confirm which system image channel actually ships WebView ≥ 80
at API 28/29 — Google's api28/29 `google_apis` images have historically
bundled WebView in the low 60s-70s; a `google_apis_playstore` image might be
needed so the WebView can be updated via Play Store sign-in, which would also
need the owner's account per `.claude/CLAUDE.md`'s escalation rule for
anything needing the owner's account).

---

## 2026-09-27 — COMPLETED — mobile-it-analyst (step 6)

**What:** Three new AVDs for device matrix testing.

**Which agent:** mobile-it-analyst

**Status:** COMPLETED 2026-09-27

**Actions taken:**

1. **Installed API 28 google_apis x86_64 system image** via sdkmanager
   (approximately 1.2 GB download). API 29 image also available but not
   downloaded.

2. **Created three new AVDs:**
   - `svr_api29_webview` (API 28, google_apis, Nexus 5 device profile)
   - `svr_api36_tablet` (API 36, google_apis, pixel_tablet device profile)
   - `svr_api36_fold` (API 36, google_apis, resizable device profile with
     foldable device-state configuration)

3. **Boot-tested each AVD headless** with `-no-window -no-audio -no-snapshot
   -wipe-data`. All three booted successfully and reached `sys.boot_completed=1`.

**Finding on item 3 (WebView version):**

The API 28 `google_apis` system image ships with **WebView 69.0.3497.100**,
which is **below the required minimum of 80** for the app per
`src/config/constants.ts` `minWebViewVersion: 80`. This confirms the
historical observation in the request: "Google's api28/29 `google_apis` images
have historically bundled WebView in the low 60s-70s."

**Recommendation for step 10 (mobile-lead-tester):**

The `svr_api29_webview` AVD cannot be used to test the "insets on API 24-29
with WebView ≥ 80" scenario until one of these occurs:

- **Option A (simplest):** Install a `google_apis_playstore` system image
  (API 28 or 29) instead of `google_apis`. The Play Store image allows WebView
  to be updated via Play Store sign-in, which would satisfy `WebView ≥ 80`.
  **Blocker:** This requires the owner's Google account to sign in to the Play
  Store on the emulator, per CLAUDE.md escalation rules.

- **Option B:** Continue using the `svr_api29_webview` AVD as-is (with WebView
  69) and rely on the `svr_api24_small` AVD's fallback screen verification
  plus the Playwright phone-emulation suite at 640×360 dp to close the
  device-matrix gap. Record the gap in the validation report.

**Completed items:**
- ✓ Item 1 (tablet AVD): `svr_api36_tablet` created and tested.
- ✓ Item 2 (foldable AVD): `svr_api36_fold` created and tested.
- ⚠️ Item 3 (WebView ≥ 80): `svr_api29_webview` created with API 28 image,
   but ships with WebView 69 (below 80). See recommendation above.

**Log reference:** See `docs/mobile/tooling-setup-log.md`, dated 2026-09-27.
