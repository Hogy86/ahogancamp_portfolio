# ADR M-9: In-app privacy policy from the bundled `public/privacy.html`

## Status: Accepted (2026-09-25, architecture v1.1)

Amends M-ADR-0002 (the Android shell overlays) and M-ADR-0005 (the back resolution order).
Closes security finding **H1** in `docs/mobile/security/review-v1.md`.

## Context

- Google Play's User Data policy requires a privacy policy in two places: the Play Console
  field and **inside the app**. This applies even when the app collects no data.
  Architecture v1 only linked the policy from the listing (PRD-mobile M11.4). The security
  review called this out as H1 (HIGH), and the gate failed.
- mobile-product-manager is adding PRD-mobile criterion **M11.4a** in parallel: "A
  'Privacy policy' item is reachable from the title screen (e.g. in Settings) in ≤ 2 taps.
  It shows the same text as the hosted policy, works in airplane mode, and back returns to
  where it was opened."
- Constraints that bind the choice:
  - C1 (one codebase) and C3 (web unchanged).
  - M11.1 (no network at any time).
  - M11.2 (no INTERNET permission, M-ADR-0007).
  - The closed plugin allowlist (§2.1).
  - The web binding constraint "no `innerHTML`" (review L4b).
- `public/privacy.html` is already planned as the hosted policy (M11.4). Vite copies
  `public/` into both `dist/` (web, served by GitHub Pages) and `dist-android/` (served from
  `https://localhost/privacy.html` inside the app).

## Decision

1. **One file, two uses.** `public/privacy.html` is the only copy of the policy text.
   - The website serves it at the hosted URL.
   - The Android build bundles the same file through `dist-android/`.
   - "Same text as hosted" therefore holds by construction for any given commit.
2. **The Android shell shows it in a `PrivacyOverlay`** (`src/platform/android/PrivacyOverlay.ts`).
   This is a full-viewport shell overlay in `#safe-layer`. It contains:
   - a heading "Privacy policy"
   - a 48 dp "Close" button (`data-action="overlay-close"`)
   - an `<iframe src="/privacy.html" sandbox="" referrerpolicy="no-referrer" title="Privacy policy">`
   The empty `sandbox` blocks scripts, forms, popups and top navigation, and gives the frame
   an opaque origin.
3. **Entry point.** Settings (title-only) gets a "Privacy policy" item
   (`data-action="privacy"`). The path is Title → Settings → Privacy policy, which is 2 taps
   (M11.4a). It is not reachable during a run, so opening it can never disturb a run.
4. **Back and Close.** Either one closes the overlay and returns to Settings with focus on
   the "Privacy policy" item. Back resolution order (M-ADR-0005, §8.3 rule 1): close the
   **topmost** open shell overlay first.
5. **No network, no plugin.** The iframe request is same-origin. Capacitor's local asset
   interceptor serves it from the APK, exactly like `index.html`. No `@capacitor/browser`,
   no `app-launcher`, no external browser intent (that would need `<queries>` on API 30+),
   and no `fetch`.
6. **Content constraints on `privacy.html`**, which the technical writer owns at step 13.
   Step 7 ships a placeholder that already meets them:
   - static HTML, `lang="en"`, `<meta name="viewport" content="width=device-width">`
   - no `<script>`, and no external resources (no remote CSS, fonts or images; inline
     `<style>` only)
   - no outbound `<a href>` links; the hosted URL and contact email appear as plain text
   - readable on `#05050a` and on its own as a web page
7. **Web is unchanged.** `WebPlatform` adds no privacy UI. The web gets only the hosted
   page, which M11.4 already requires.

## Alternatives Considered (and why rejected)

| Alternative | Why rejected |
|---|---|
| Open the hosted URL with `@capacitor/browser` (Custom Tab) | Adds a plugin outside the closed allowlist, needs network and therefore INTERNET (conflicts with M11.1/M11.2), and fails in airplane mode (M11.4a). |
| `Intent.ACTION_VIEW` to an external browser | Needs network, needs `<queries>` on API 30+, leaves the app, and fails offline. |
| Navigate the whole WebView to `/privacy.html` | Unloads the game page and its in-memory state. Back would need a native navigation-history rule. It also risks the "reload mid-run" failure the review warns about. |
| Copy the text into a TypeScript string or a Vite `?raw` import and render it in a DOM panel | Makes a second copy that can drift from the hosted one. Rendering formatted HTML would need `innerHTML` (forbidden by L4b); `textContent` would lose the formatting. |
| Put "Privacy policy" directly on the title screen | Also valid (1 tap), but it adds a fifth title action next to Start. Settings keeps the title uncluttered and meets ≤ 2 taps. mobile-ui-ux-designer may move it at round 2 without changing this ADR. |

## Consequences

- H1 is closed at the design level. Pass 2 verifies the implementation and that the bundled
  copy matches the hosted copy.
- **Lag risk:** the website redeploys on every push, but the Play build changes only on
  release. A material change to `privacy.html` therefore requires an Android release, so
  the in-app copy never shows a policy that is out of date. The release runbook (technical
  writer, step 13) records this rule. Pass 2 compares the SHA-256 of `dist-android/privacy.html`
  from the release build with the deployed file.
- The iframe load is one more request through the no-INTERNET path, so it is added to the
  M1 verification (M-ADR-0010).
- New e2e coverage (§10.1): open from Settings, the frame loads, only a same-origin request
  is made, and back closes it to Settings.

## Sources

PRD-mobile M11.1, M11.2, M11.4, M11.4a (being added by mobile-product-manager); review-v1 H1
and L4b; C1 and C3; mobile-architecture.md §7.4, §8.3, §8.7.
