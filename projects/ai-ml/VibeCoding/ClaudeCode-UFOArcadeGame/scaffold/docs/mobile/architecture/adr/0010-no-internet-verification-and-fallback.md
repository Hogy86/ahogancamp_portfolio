# ADR M-10: Verifying the no-INTERNET build, with a documented fallback

## Status: Accepted (2026-09-25, architecture v1.1). The fallback path is **Proposed**; it needs a security re-review before use.

Amends M-ADR-0007 (manifest and permissions). Closes security finding **M1** in
`docs/mobile/security/review-v1.md`.

## Context

- M-ADR-0007 and architecture v1 §7.3 remove `android.permission.INTERNET`
  (`tools:node="remove"`), which is the strongest way to guarantee M11.1 (no network at any
  time).
- v1 stated as fact that "the app works without it". Here is why that needs checking:
  - Without INTERNET, Android WebView sets `WebSettings.blockNetworkLoads` to true.
  - Capacitor serves `https://localhost/` from `shouldInterceptRequest`, and interception
    should bypass the block. Neither source nor docs guarantee this, and it may depend on
    the WebView version.
  - The oldest API 24 images ship old WebViews.
  - The same path serves `errorPath` (`webview-update.html`, M1.4) and now also the privacy
    iframe (M-ADR-0009).
- CI cannot detect this failure. The `mobile-e2e` job runs desktop Chromium, not an Android
  WebView, so a blank-screen regression would pass CI.

## Decision

1. **Keep INTERNET removed**, subject to verification.
2. **Verification before the step-8 review (step 7).** It is recorded in the code-review
   evidence and in `docs/mobile/tooling-setup-log.md`. Run a cold start of the debug build,
   with `aapt2 dump permissions` confirming there is no INTERNET, on:
   - **API 36** image. Title renders. Help, Settings, Swap controls and the privacy overlay
     all work. Level 1 is playable. `webview-update.html` renders when forced by a
     **local, uncommitted** build with `minWebViewVersion: 999`.
   - **API 24** image. Record the image's WebView version. If it is < 80, the expected pass
     is `webview-update.html` rendering, because that exercises the same interceptor path.
     If it is ≥ 80, the title and overlays must render as on API 36.
   - If the API 24 image's WebView is < 80, add **one mid image whose WebView is ≥ 80**
     (e.g. an API 29 or 30 Google APIs image) and check that the title renders. The first
     API with a WebView ≥ 80 is then covered, not only API 36.
   - On every image: logcat shows no `net::ERR_` and no blocked-load error for
     `https://localhost/*`.
   - Missing images go to `docs/mobile/tooling-requests.md` (mobile-it-analyst installs
     them).
3. **Ongoing check:** mobile-lead-tester adds the row "cold start with no INTERNET on
   API 24 + API 36 (+ mid image if needed)" to `device-matrix.md` for every release
   candidate.
4. **Fallback, used only if step 2 fails on any image.** It needs a security re-review
   (pass 1c) before merge. The junior developer does not apply it on their own authority.
   - Keep INTERNET: delete the `tools:node="remove"` line and add
     `android.permission.INTERNET` to the manifest-check allowlist behind an explicit
     `--allow-internet` flag. The flag is committed only with the fallback.
   - Add an **Android-mode-only** Content-Security-Policy `<meta>`. A small Vite
     `transformIndexHtml` hook injects it only when `mode === 'android'`, so the web output
     stays byte-identical (C3):
     `default-src 'self'; connect-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'none'; frame-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`
     - `script-src 'unsafe-inline'` is there because Capacitor may inject its bridge as an
       inline `<script>` into the served HTML. Script hashes would change on every
       Capacitor version.
   - Test the CSP against the real bridge on the emulator. With the CSP in place, all of
     these must still work, with no `securitypolicyviolation` in logcat:
     - the splash hide
     - `backButton`
     - `pause`/`resume`
     - GameShell insets and focus events
     - the privacy iframe
   - Keep the M11.1 Playwright no-request check. Add an e2e assertion that
     `dist-android/index.html` contains the CSP `<meta>`.
   - The Data safety answer is unchanged ("No data collected, no data shared"), because a
     permission is not data collection. The M11.2 wording already allows keeping INTERNET
     when needed.

## Alternatives Considered (and why rejected)

| Alternative | Why rejected |
|---|---|
| Keep INTERNET from the start with only a CSP | Weaker. It depends on every request type being covered by CSP, and it gives up the OS-level guarantee. Kept only as the fallback. |
| Trust the interceptor without testing | This is v1's position. Rejected by the review: the behavior depends on the WebView version and CI cannot see it. |
| Run an Android emulator in CI to catch it | Slow and flaky on hosted runners, and CLAUDE.md puts emulator suites on the owner's machine (steps 10 and 14). The device-matrix row gives the same coverage for each release. |
| Call `setBlockNetworkLoads(false)` from MainActivity | Without INTERNET it would still fail at the socket, so it proves nothing and adds code. |

## Consequences

- M11.1/M11.2 keep the OS-level guarantee if verification passes. If it fails, there is a
  pre-designed, reviewable fallback, so step 7 does not stall on a redesign.
- The fallback adds one build hook and one CSP string, both in android mode only. The web
  build is unaffected.

## Sources

PRD-mobile M1.1, M1.4, M11.1, M11.2; review-v1 M1; M-ADR-0007; M-ADR-0009; C3; CLAUDE.md
§Where it runs.
