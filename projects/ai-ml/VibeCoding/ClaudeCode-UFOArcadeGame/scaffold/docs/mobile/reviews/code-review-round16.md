# Code Review Round 16: Mobile Pipeline Step 8

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Verdict: PASS (step-8 code gate).** Every finding against the code, scripts and tests in scope is Low. mobile-junior-tester may start step 9.

**Separate accuracy verdict on the step-13 docs and the v5 addendum: FAIL.**
- One High finding (D1) and three Medium (D2, D3, D6).
- D1-D5 go to mobile-technical-writer. They should be fixed before step 14, and at the latest before step 15.
- D6 goes to product-manager (website pipeline) before F23 is implemented.
- They do not block step 9, because none of them is code.

- **Reviewer:** mobile-lead-developer
- **Date:** 2026-09-29
- **Branch / base:** `claude/project-thread-rm5222`, uncommitted diff vs HEAD `09cc962`, plus untracked files
- **Scope:**
  1. Fixes for code-review-round15 M1, M2 and L2 (`android.css`, `glyphs.ts`, `TouchControls.ts`, `layout.ts` comment), plus the new `tests/mobile-e2e/text-scale-fit.spec.ts`.
  2. review-v2 V2-L3 (`scripts/check-no-secrets.mjs` and its test) and V2-L4 (`android/app/build.gradle`, `android/build.gradle`, `.gitignore`).
  3. For accuracy only: `public/privacy.html`, `docs/mobile/README-mobile.md`, `docs/mobile/release-runbook.md`, `docs/mobile/release/release-notes-v1.md`, `docs/GLOSSARY.md`, `docs/PRD-addendum-v5.md`.
  4. The reported one-off Playwright failure (`cutout-insets.spec.ts:238`).
- **Specs used:**
  - `code-review-round15.md`
  - `docs/mobile/security/review-v2.md` (V2-L3, V2-L4, C1-C11)
  - `docs/mobile/architecture/adr/0011-release-signing-contract.md`
  - `docs/mobile/PRD-mobile.md` (M1.4, M2.11, M9.6)
  - `mobile-architecture.md` §7.3 (130% text-zoom cap) and §8.7
  - The coding-standards and mobile-touch-and-layout skills

## 1. Summary

- **M1 (HUD overflow at the largest font): fixed.**
  - Each HUD group now wraps (`android.css:44-63`: `flex-wrap: wrap`, `min-width: 0`, right group `justify-content: flex-end`, `column-gap: 8px`).
  - The trade-off (a wrapped second row can cover the first formation row at the 130% cap) is written in the CSS comment, as round 15 asked. It goes to mobile-ui-ux-designer at step 11.
  - **The new HUD test catches the bug.** I re-created the round-15 CSS (one row, no wrap) by injecting it over the current build. The HUD test then fails 6 of 16 cases, on the right-of-canvas assertion (`text-scale-fit.spec.ts:100`). With the fix, all 16 pass.
- **M2 (THROW label too wide at 130%): fixed in the design.**
  - THROW/WAIT is now SVG `<text>` with a fixed `textLength` (44 for THROW, 32 for WAIT) and `lengthAdjust="spacingAndGlyphs"`.
  - I measured the label at the text element's own 1.3x size (16.9 px): 44.7 px wide and 19 px tall, inside the 44x20 box, and inside the 56dp button's border box.
  - The new test's 1.3x case does not test this, though (see L3).
- **L2 (unscoped `android.css` selectors): fixed.**
  - I parsed the file after stripping comments: no selector lacks the `html.platform-android` prefix.
  - The `.hidden` rule's higher specificity changes nothing today. Every `.hidden` user either has an explicit `.x.hidden` rule (rotate prompt, privacy) or is a shared `.screen-overlay` with no competing Android display rule.
- **V2-L3 (secret scan): done as specified.**
  - The S1 path pattern has the five required additions.
  - The new S7 rule runs the S6a content patterns over every tracked text file of 1 MB or less, with the same `S7: path:line (…)` output.
  - Tests use inline fixtures that are split so the test file does not trip S7.
  - The whole-repo run is clean.
  - **Are the three exceptions narrow enough?** Before any exception, the only pattern hits in the 778 tracked files are:
    - the two documented dummy AKIA values, in two docs and the script and its test;
    - one scikit-learn notebook line (`sk-toggleable__label-arrow`).
  - The dummy-value list and the letters-only `sk-` rule are narrow enough. The CSS-selector rule is broader than it needs to be, and nothing in the repo needs it today (L1).
- **V2-L4 (google-services guard): done and verified.**
  - The template's silent `apply plugin` block is replaced by a `GradleException`.
  - The classpath is removed from `android/build.gradle`.
  - `google-services.json` is in `.gitignore` and in S1.
  - With a dummy file placed in the mirror, `assembleDebug` fails at configuration time with the documented message. Without it, the build succeeds (§2).
- **Shared code untouched.** The website bundle filenames (content-hashed) are `index-Cxv-oqtY.js` and `index-Bee-yMjM.css`, the same bundle round 15 proved byte-identical to HEAD. The web bundle contains no `platform-android` or `touch-glyph`. The only web-visible change is `public/privacy.html` (step 13, intended).
- **The reported `cutout-insets.spec.ts:238` failure: not reproduced, and no race found** (§3.1).

## 2. Verification (run by me)

| Check | Result |
|---|---|
| `npm run check:secrets` | Clean. The one S1 template exemption notice is the Cursor project's `.env.example`, scanned clean. |
| S7 over the 13 untracked files (scratch script calling the exported `processFiles`) | Clean. The new docs will pass once committed. |
| `npm run check:android-styles` | Clean |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, no output |
| `npx prettier --check` on the 8 changed code/test/script files | All formatted |
| `npm run test` | 31 files, **559/559 passed** (540 in round 15, plus the new check-no-secrets cases) |
| `npm run build` (website) | OK. Same content-hashed bundle names as round 15's HEAD-identical build. |
| `npm run build:android` | OK (`AndroidPlatform-D_HPN9Wb.js`, `AndroidPlatform-LwNXZPit.css`) |
| Playwright `--repeat-each=3`, run 1 (default workers) | **609/609 passed** (5.1 min) |
| Playwright `--repeat-each=3`, run 2 (default workers) | **609/609 passed** (5.5 min) |
| Playwright `--repeat-each=3`, run 3 (`--workers=12`, extra CPU contention) | **609/609 passed** (4.4 min) |
| Targeted: `cutout-insets.spec.ts` M2.3b (c), `--repeat-each=40` (320 runs) | **320/320 passed** |
| New HUD test vs the round-15 no-wrap CSS (injected, scratchpad copy of the spec) | 6/16 fail, as they should |
| New HUD test vs the HEAD build | 16/16 pass. Expected: HEAD had the stacked shared layout, and M1 was a regression in round-15's uncommitted CSS, so the no-wrap simulation above is the meaningful control. |
| `git status --porcelain` before, between, and after all runs | Identical every time |
| Mirror: `powershell.exe -NoProfile -File 'scripts\refresh-android-mirror.ps1'` | robocopy exit 3 (informational). **Parity check passed** (134 files plus 6 named files). `android/app/build.gradle`, `android/build.gradle` and `.gitignore` are byte-identical to the repo. |
| Mirror: `build:android`, `npx cap sync android`, `gradlew.bat assembleDebug --no-daemon` (JDK 21.0.12, SDK `C:\Users\aaron\Android\sdk`) | **BUILD SUCCESSFUL** in 19 s. `app-debug.apk` is 3,962,769 bytes. The synced `AndroidPlatform-LwNXZPit.css` and `.js` contain `touch-glyph-word`. |
| **V2-L4 guard, negative test:** dummy `android/app/google-services.json` in the **mirror only**, then `assembleDebug` | **BUILD FAILED** (exit 1): "A problem occurred evaluating project ':app'. > android/app/google-services.json exists: adding Google services requires a security and Data safety review (docs/mobile/security/review-v2.md V2-L4). Remove the file." The file was deleted straight after; a re-run gave BUILD SUCCESSFUL in 12 s. |
| Cleanup | Nothing listening on 4174-4177. No java.exe or emulator running. The scratchpad `node_modules` junctions were removed as links only; the project `node_modules` is intact. No dummy file left in the mirror. |
| **Denied command** | Counting S6a pattern matches (counts only, no values) in `notebooks/prototypes/Python_for_GenAI_Demo_Notebook.ipynb` was **denied** by the permission classifier (credential exploration). I did not try it another way. See L2. |
| Side effect outside the project | One mistaken `npx playwright` call from the scratchpad (before its junction existed) downloaded `playwright@1.63.0` into the user npm cache (`%LocalAppData%\npm-cache\_npx`). Nothing in the project or the mirror changed. |

## 3. Findings: code (junior developer scope)

### 3.1 Investigation: `cutout-insets.spec.ts:238`, three-button insets 0,48,24,0 at 640x360 (no finding)

- **Not reproduced.**
  - 1,827 full-suite test executions (3 runs of 609, one of them at 12 workers), plus 320 targeted executions of the eight M2.3b (c) cases, 40 of them this exact case. No failure.
  - The developer's run left no evidence: the `test-results/` folders are empty screenshot-attachment folders, and `.last-run.json` says `passed`.
- **Every layout assertion in this test is static over time.** I measured them in a throwaway spec at 0, 250, 1000, 2500 and 4000 ms after `startRun`, and the margins never changed:

| Assertion | Measured margin |
|---|---|
| HUD content top vs t | 16.55 px below t |
| `#control-text` content bottom | 67 px above H−b |
| Canvas warning text (`y + 4s`) | 13.03 px below t |
| Controls vs the insets | exactly 0 px (on the inset edge; the check allows 0.5 px) |

- The 0 px control margin comes from deterministic layout arithmetic, not timing.
- **The only time-dependent assertion is line 247**, `state === 'PLAYING'` straight after `startRun`. It fails only if something pauses the game:
  - a `resize` to a new viewport size (`screenFit.ts:129` → `relayout(true)` → `onPause`), or
  - `visibilitychange` → hidden (`lifecycle.ts:41`).
- Neither happens in headless Chromium with a fixed 640x360 viewport:
  - `page.setViewportSize` is a no-op here, because the project is already 640x360.
  - Insets are awaited before the first layout (`screenFit.ts:121-130`).
- **Conclusion:** there is no real race in the code or the spec. The failure was most likely environmental. One example: `dist-android` being rebuilt while `vite preview` served it (Vite empties `outDir` when a build starts), for instance by a concurrent session. That can't be confirmed without the assertion text.
- The real gap is that a CI failure would also leave no evidence (L5).

### L1 (Low, suggested): S7's CSS-selector exception is wider than needed and can hide a real key

- **Where:** `scripts/check-no-secrets.mjs:107` (`CSS_SK_SELECTOR = /[#.]sk-[A-Za-z0-9_-]+/g`), used at `:111`.
- **Problem:**
  - It removes **any** `sk-` token that follows `#` or `.`, digits included, anywhere on a line.
  - That also removes real keys written as `#sk-proj-…` (a shell or Python comment with no space), inside a URL fragment, or after a `.`.
- **Not needed today:**
  - The only real false positive in the repo is the notebook's `sk-toggleable__label-arrow` (line 3911 of `notebooks/exploration/LLM PreTraining and Classification Problem/training_llm_in_class_notebook.ipynb`). The letters-only rule (`:108`) already covers it.
  - `#sk-container-id-1` is too short to match `\bsk-[A-Za-z0-9_-]{20,}` at all.
- **Judgment on the other two exceptions:**
  - `S7_KNOWN_DUMMY_VALUES` is exact-string only. It holds AWS's documented example key and this repo's own fixture, and a real 20-character AKIA key cannot equal either. Narrow enough.
  - The letters-only `sk-` rule is narrow enough: a random 20+ character key with no digit is very unlikely (about 0.02% at 48 characters).
- **Fix (either):**
  - Delete `CSS_SK_SELECTOR` and its `.replace`, or
  - restrict it to digit-free tokens or to scikit-learn's known prefixes (`sk-(container|estimator|toggleable|parallel|serial|item|label|dashed|text-repr)[\w-]*`).
- **Add tests that must fail:** `# sk-proj-` + 24 alphanumerics with digits, and `.sk-` + 24 alphanumerics with digits.
- **Owner:** junior developer. It is Low because V2-L3 is Low and today's tree is clean.

### L2 (Low, suggested; owner decision): S7 skips the one tracked text file most likely to contain an API key

- **Where:** `check-no-secrets.mjs:94` and `:276`.
- **What is skipped:** of the 17 tracked files over 1 MB, 16 are PDFs, `.h5` files or `.docx`. The one text file is `notebooks/prototypes/Python_for_GenAI_Demo_Notebook.ipynb` (1,216,545 bytes), a GenAI demo notebook. That is the kind of file where an OpenAI or Google key gets pasted.
- **Not a defect against the spec:** V2-L3 says "under 1 MB", and the code matches it.
- **My check of this file's contents was denied** and I did not work around it (§2).
- **Suggested:** do one of these:
  - scan `.ipynb`, `.md`, `.json`, `.txt`, `.py` and `.ts` whatever their size, or raise the cap for those extensions, or
  - print a notice naming every text file skipped for size.
- **Route:** mobile-security-compliance-reviewer (and the owner) to decide. The owner may also want to check that notebook by hand.

### L3 (Low, suggested): the M2 test's 1.3x case is vacuous

- **Where:** `tests/mobile-e2e/text-scale-fit.spec.ts:44-53` and `:113-150`.
- **Why:**
  - The injected `.touch-button { font-size: 26px }` never reaches the label.
  - The `<text font-size="13">` presentation attribute (`glyphs.ts:823`) sets the element's own value, which beats inheritance.
  - I measured the label's computed font-size: 13px both with and without the injection.
  - So the "x1.3" THROW/WAIT tests only repeat the x1 tests.
- **The design is still right:** with the text element itself forced to 16.9px, THROW is 44.71 px wide and 19 px tall inside the 44x20 box.
- **Fix:**
  - For `factor > 1`, inject `html.platform-android .touch-glyph-word text { font-size: ${13 * factor}px !important; }`.
  - Also assert `text.height <= svg.height` (the SVG clips overflow, so vertical overflow would be silent).
  - Optionally measure WAIT inside the same `evaluate` as the `not-ready` check. The shield's flight window is about 1.4 s at `SHIELD_SPEED` 480, so it's fine today, but that makes it load-proof.
- **Owner:** junior developer or junior tester.

### L4 (Low, suggested): two figures in the M2 comments are wrong

- **Where:** `android.css:320` and `glyphs.ts:48`.
- **Content-box claim:** both say "the 52 px content box" of the 56dp button.
  - The THROW button is a `<button>` with the browser default `padding: 1px 6px` (measured). Its content box is **40 px**; 52 px is its padding box.
  - The 44 px SVG overflows the content box by 2 px on each side and stays inside the padding box. That is fine, but the comment should say so.
  - "51.6 px … wider than the 52 px content box" also contradicts itself.
- **Compression claim:** `glyphs.ts:52` says "~10% tighter". THROW goes from 51.6 to 44, which is **about 15%** narrower (WAIT is about 7%).
- **Fix:** correct the numbers.

### L5 (Low, suggested): a CI Playwright failure leaves no evidence

- **Where:** `playwright.mobile.config.ts` has no `trace` or `screenshot` settings. The deploy workflow runs `npm run test:e2e:mobile` (`deploy-pages.yml:185`) and uploads no Playwright output.
- **Why it matters:** the suite gates the website deploy with no retries, and a one-off failure (like §3.1) can't be diagnosed afterwards.
- **Fix:**
  - Add `trace: 'retain-on-failure'` and `screenshot: 'only-on-failure'`.
  - Add an `actions/upload-artifact` step pinned like the others, with `if: failure()`, for `test-results/`.
  - Do not add retries.
- **Owner:** junior developer. The CI change is shared, so it goes through the website gates too.

## 4. Findings: step-13 docs and the v5 addendum (accuracy)

### D1 (HIGH, required before step 15, mobile-technical-writer): the runbook's signing steps break M-ADR-0011 and would put the keystore passwords in plaintext inside OneDrive

- **Where:** `docs/mobile/release-runbook.md` §2.1 step 5 (lines 101-123), §3.2 (line 175), §11 (line 430).

1. **Wrong location for the properties file.**
   - The runbook says to create `vvs-signing.properties` "in the repo root" with `storePassword` and `keyPassword` in it.
   - The repo root is inside OneDrive. ADR decision 1 says the file lives in `C:\Users\aaron\.android-signing\vvs\`.
   - Following the runbook syncs both passwords to OneDrive.
   - The Gradle guard would then refuse the file anyway (`build.gradle:25-33`, `:40-41`).
2. **"Gradle will find it" is false.**
   - The path comes only from `VVS_SIGNING_PROPERTIES` or `vvsSigningProperties` (`build.gradle:9-14`; ADR decision 2).
   - The runbook never mentions either. A release engineer following it gets "no signing.properties path was provided – Refusing to build."
3. **"This file is in .gitignore … check-no-secrets.mjs will catch it" is false.** I checked both:
   - `git check-ignore vvs-signing.properties` → not ignored.
   - `classifyTrackedPath('vvs-signing.properties')` → `'none'` (S1 matches only the basename `signing.properties`).
   - A committed copy would pass both git and CI.
4. **Passwords on the command line.**
   - `keytool -keypass/-storepass` (lines 74-75, 85-86) puts the passwords on the command line and in PowerShell history. ADR decision 6 says keytool prompts instead.
   - The example password `MySecureKeyPass123!@#$` is unquoted in PowerShell, so the `$` is expanded, right after the text says to avoid shell metacharacters.
5. **Wrong backup method.** The runbook says "external USB drive or encrypted cloud backup" (line 98). ADR decision 1 says the owner's password manager (keystore as an attachment, plus both passwords), and not OneDrive, Google Drive or email.
6. **Missing ACL step.** There is no NTFS ACL step, although ADR decision 1 and its Consequences section say this runbook documents it.

- **Fix:** rewrite §2.1, §3.2 and §11 from M-ADR-0011:
  - create `%USERPROFILE%\.android-signing\vvs\`;
  - restrict its ACL, for example `icacls "$env:USERPROFILE\.android-signing\vvs" /inheritance:r /grant:r "${env:USERNAME}:(OI)(CI)F"`;
  - run `keytool -genkeypair … -keystore …\shield-vs-robots-upload.jks -alias …` with **no** password flags, so it prompts;
  - create `…\vvs\signing.properties` with the four keys;
  - set `VVS_SIGNING_PROPERTIES` to that path, or put `vvsSigningProperties=<path>` in `%USERPROFILE%\.gradle\gradle.properties` (a path only);
  - back up to the password manager;
  - delete the false `.gitignore` / check-no-secrets claim;
  - point §11 at the external file and the env var.
- **Suggested extra (junior developer, optional):** adding `*signing*.properties` to `.gitignore` and to the S1 pattern would close gap 3 for any future file name.

### D2 (MEDIUM, required, mobile-technical-writer): runbook and README commands and facts that don't match the repo

1. **Mirror script location and behavior.**
   - The script path `C:\Users\<owner>\dev-build\scripts\refresh-android-mirror.ps1` (runbook:150; README:221, :375) does not exist.
   - The real script is `<scaffold>\scripts\refresh-android-mirror.ps1`, run as `powershell.exe -NoProfile -File '<scaffold>\scripts\refresh-android-mirror.ps1'`.
   - It does **not** run `npm ci` (runbook:156; README:228).
   - Runbook:161 ("if the script does not exist yet, create it from the tooling log") contradicts code-review-round9 R2: the script is the one canonical copy.
2. **Gradle commands.**
   - `cd <mirror>` followed by `gradlew …` (runbook:176; README:183) is wrong in two ways: `gradlew.bat` is in `<mirror>\android`, and PowerShell needs `.\gradlew.bat`.
   - README §4.1 runs `build:android` / `cap sync` in the OneDrive repo. Runbook §3.2 runs them in the mirror, which is the correct place. Make README match the runbook.
3. **Unsigned release (README:200-207).** The README gives `-PvvsCiUnsignedRelease=true` and `CI=true` as alternatives. `build.gradle:109` needs **both**, so either one alone fails with "Refusing to build".
4. **Playwright profiles (README:299).** They are four **viewports** (640x360, 800x360, 915x412, 1280x800) of the `dist-android` build, not "API 36 phone, API 30 mid-range, API 24 small, tablet".
5. **Wrong shell syntax and AVD names.**
   - The PowerShell code blocks use cmd's `^` line continuation (README:145-155; runbook:220-225). PowerShell uses a backtick.
   - The low-end reference AVD in `device-matrix.md` is `svr_api36_lowend_640x360`, not `svr_api24_small` / "Nexus 5".
6. **bundletool.**
   - Runbook:217 `go install github.com/google/bundletool/...`: bundletool is a Java jar from its GitHub releases, and there is no Go module. Remove the line.
   - Runbook §4.2 item 5 (line 259) never passes the dump to the checker. It should be `java -jar bundletool.jar dump manifest --bundle=… > manifest.xml`, then `node scripts/check-android-manifest.mjs --variant release --manifest-xml manifest.xml` (the script's usage, line 15). `AAPT2_PATH` is not needed for `--manifest-xml`.
7. **Play text limits.** The runbook (lines 272, 279) and `release-notes-v1.md:14` mix up Play's limits: the store short description is 80 characters; "What's new" release notes are 500.
8. **Wrong step number (runbook:304).** Data safety answers are entered at step 15 (C10), not "step 14".

### D3 (MEDIUM, required, mobile-technical-writer): `release-notes-v1.md` store text is invented and partly false

- **Short description too long:** the "Short description" (line 22) is about 200 characters, and Play's limit is 80, so the Console will reject it.
- **The full description (lines 26-40) is new copy, not listing-draft-v2 text**, and it contains false claims:
  - "optimized for one-handed play": the controls are two-thumb (move on one side, THROW on the other).
  - "No timers": power-ups are timed (the HUD shows "Shield 8.0s").
- **"ShieldMan" is featured prominently** while V2-M1 / C5 is still open. review-v2 says that, if the name is kept, it appears only as a plain in-game label.
- **Internal IDs:** "What's new" lists internal M/F IDs, which mean nothing to players.
- **Fix:**
  - Keep this file to the ≤500-character "What's new" text plus release metadata.
  - Take listing text only from `listing-draft-v2.md`.
  - Remove the false claims and the prominent ShieldMan use.

### D4 (Low, mobile-technical-writer): `public/privacy.html` small inaccuracies

- **What is checked and correct:**
  - The §8.7 rules hold: no script, no external resources, no links.
  - V2-L1 items 2 and 3 are addressed: the no-collection statement is scoped to the app, and there is a GitHub Pages sentence.
  - "No permissions / no internet" matches the merged manifest.
- **Counter list incomplete (line 65).** The list is presented as "only the following" (line 59), but the stored counters also include game overs, victories, restarts, shields caught, boss warnings and sessions (`Instrumentation.ts:10-19`). Say "anonymous gameplay event counts, such as …" or list them all.
- **Web settings claim (line 85).** It says the web version stores "settings". Only the Android app stores settings (`vvs:settings` in `src/platform/android/settings.ts`); the web stores best score and counters only.
- **Consent line (line 103).** "By using the app, you agree to the terms of this policy" is consent language a no-collection policy doesn't need. Remove it.
- **Placeholders.** `[DEVELOPER NAME]` / `[CONTACT EMAIL]` will appear on the live website if this merges before C1. Track under C8.

### D5 (Low, mobile-technical-writer): `docs/GLOSSARY.md` references

- **Wrong line numbers:** versionCode/versionName say "line 68/69"; they are `build.gradle:72-73`.
- **ADR row:** it now counts "5 website ADRs and 12 mobile ADRs", but its topic list describes only the website five.

### D6 (MEDIUM, product-manager, website pipeline; blocks F23 implementation, not this round): `PRD-addendum-v5.md` contradicts itself

- **The conflict:**
  - The F11 AC8 amendment (line 107) requires "each glyph also meets F23 AC1-AC6".
  - AC3 (lines 126-131) bounds "every glyph point" to ±0.45r.
  - The existing HIT_POWER (±0.5r), SPEED (−0.5r) and SHIELD (±0.5r) glyphs break that bound (`src/render/shapes.ts:301-326`).
  - Out of Scope (line 201) forbids changing them.
  - An implementer and a tester can't satisfy both.
- **Fix:**
  - Scope AC3's bound (and AC1's text) to the `PERMANENT_MULTIPLIER` glyph, or loosen the family bound to ±0.5r.
  - Also, AC1's "no pair of diagonal strokes forming an 'X' or '+'" is odd wording: a "+" is not diagonal.
- **Checked and accurate:** the addendum's grounding facts (disc fill, ring color and width, radius 12, the "x" at ±0.35r, the single caller `CanvasRenderer.drawPowerUps`, no existing glyph-geometry test).

## 5. Standards conformance

- **coding-standards**
  - Style: PASS. Lint and prettier are clean. L2 of round 15 is closed.
  - Error handling: PASS.
    - The S7 skips (unreadable or oversized files) are deliberate and commented. Unreadable exempt `.env` templates still fail.
    - `setWordGlyph`'s `if (!text) return` guards an invariant set up by `createWordGlyph`. Acceptable.
  - Logging: N/A.
  - Code documentation: PASS with L4. Every new rule cites its review item and says why.
- **mobile-touch-and-layout**
  - Touch targets unchanged (48/56/64 dp).
  - Text stays at or above the 12 sp floor (HUD floor rule unchanged; label 13 px).
  - Screen fitting: PASS. M1 and M2 are fixed, and the largest-font HUD case is now in CI.
  - Timing, lifecycle and back are untouched.
- **Platform pitfalls**
  - No game logic duplicated or branched per platform. The only code changes are in `src/platform/android/`.
  - No frame-count timing.
  - No change to `touch-action`.
  - No hand edits to generated `android/` assets. The two Gradle files changed are project files that `cap sync` does not overwrite; the mirror sync regenerated assets cleanly.
  - DPR and insets handling unchanged.

## 6. Routing

- **Step 9 (mobile-junior-tester) may start.**
  - L3 (make the 1.3x label case real) can be done there.
  - Carry the step-10 device-matrix rows round 15 asked for: `svr_api36_lowend_640x360` at `font_scale 2.0`, in play with an effect active, including THROW/WAIT.
- **mobile-junior-developer:** L1, L4, L5 (suggested). None blocks.
- **mobile-security-compliance-reviewer / owner:** L2 (the size-skipped GenAI notebook; my content check was denied).
- **mobile-technical-writer (step 13 re-run):**
  - D1 (High) and D2, D3 (Medium) are required. D4 and D5 are suggested.
  - D1 must be fixed before any key is generated (step 15). The C8 privacy delta check follows D4.
- **product-manager (website pipeline):** D6 before F23 goes to code-implementer.
- **§3.1 (the one-off failure):** no action beyond L5. If it happens again, keep the full assertion output.
