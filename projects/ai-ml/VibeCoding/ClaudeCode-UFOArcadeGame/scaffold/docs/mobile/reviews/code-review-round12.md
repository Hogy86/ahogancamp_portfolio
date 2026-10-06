# Mobile Code Review, Round 12

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-28
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `4138829`. The scope is narrow, per `code-review-round11.md` "Next step":
- `scripts/refresh-android-mirror.ps1`
- `tests/mobile-e2e/slide-switch.spec.ts`
- `src/platform/android/layout.test.ts` (S1)
- the dated round-12 entry and the L1 correction note in `docs/mobile/tooling-setup-log.md`

**Reviewed against:** `code-review-round11.md` R1(a), R1(b), R2, L1, L2, S1 and S2; the round-4 M1 precedent (the mobile e2e suite gates the deploy with no retries); and the coding-standards and mobile-touch-and-layout skills.

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: PASS (with LOW carry-forwards)

Every round-11 required item is fixed and I verified each one independently:
- **R1(a):** paths containing `[`, `]`, `*` or `?` are now rejected outright.
- **R1(b):** a mirror path that is an alias of the repo, or a real clone, is refused.
- **R2:** the GAMEOVER race in `slide-switch.spec.ts` is gone. My Playwright runs had 0 failures: 279/279, 279/279 and 80/80.
- **L1, L2, S1 and S2** are closed.
- All npm gates, both builds, one real mirror refresh and the mirror `assembleDebug` passed.
- The product bundle hash is unchanged, so no emulator run was needed.

**The developer's R1(b) deviation is acceptable, and it is stronger than what I suggested.** Details are under "R1(b) deviation" below.

What remains is LOW only: one stale comment, a few log inaccuracies, and one misleading comment in the helper. **mobile-junior-tester (step 9) may start.**

## Verification results

| Check | Result |
|---|---|
| `npm run check:secrets` / `typecheck` / `lint` | All exit 0 |
| `npm run test` | **PASS: 29 files, 526 tests** |
| `layout.test.ts` verbose | 0 occurrences of `NaN` in titles. The §6.4 rows now read e.g. "Mid-range 20:9, ~915x412 (height-bound, A12 changes it)". |
| `npm run build` + purity grep (`@capacitor`, `registerPlugin`) on `dist/assets/*.js` | PASS, no matches |
| `npm run build:android` | PASS. `AndroidPlatform-CkwCoiWy.js` has the **same hash as rounds 9-11**, so no product code changed. |
| `check-android-styles.mjs` | exit 0 |
| **Playwright `--repeat-each=3`, run 1** (19:01:04-19:05:26) | **279 passed, 0 failed** (4.3m) |
| **Playwright `--repeat-each=3`, run 2** (19:05:31-19:09:52) | **279 passed, 0 failed** (4.3m) |
| **Playwright `-g "40/40" --repeat-each=10`** (19:10:00-19:19:30) | **80 passed, 0 failed** (9.5m) |
| Repo before and after all Playwright runs, and again after the mirror refresh and build | `git status --porcelain --untracked-files=all` is identical each time (77 entries). `sha1sum -c` on all 77 changed or untracked files is identical after each step. |
| Real mirror refresh: `powershell.exe -NoProfile -File '…\scaffold\scripts\refresh-android-mirror.ps1'` (defaults) | exit 0. robocopy exit 3 (30 files copied; 1 extra, which is the marker, kept by `/XF`). "Parity check passed: 126 file(s) … and 6 named file(s)". The git-status guard passed. The `Test-InsideGitWorkTree` checks passed correctly for the real monorepo-subfolder `-RepoRoot` and for the non-repo mirror. |
| Mirror `build:android`, `npx cap sync android`, `check-capacitor-config.mjs`, `check-android-styles.mjs` | All PASS. Plugins: app 8.1.1, splash-screen 8.0.2. The bundle is `AndroidPlatform-CkwCoiWy.js`. `diff -rq` of `android/app/src/main/res` against the repo: identical. |
| Mirror `gradlew.bat assembleDebug --no-daemon` (JDK 21.0.12, `ANDROID_HOME` as given) | **BUILD SUCCESSFUL** in 19s. 153 tasks (58 executed, 95 up-to-date). `app-debug.apk` is 3,961,037 bytes, the same as rounds 10 and 11. |
| `check-android-manifest.mjs --variant debug --apk …` (`AAPT2_PATH` = build-tools 36.0.0) | PASSED |
| Emulator | Not run. No product code changed (the bundle hash is the same). |
| Processes and cleanup | Before the review, and again after it: no node, java, qemu, emulator or adb process, and no listener on 4173-4175, 4181, 4182 or 9333. The `subst Y:` drive was removed (verified). Both junctions were removed with `cmd /c rmdir` (not recursive), and I confirmed their targets were intact before deleting the throwaway tree. `%TEMP%\r12rev-lead12` is gone. |

**Commands denied:** none. The auto-mode classifier returned "no verdict (transient error)" five times while I was comparing post-run status and starting the mirror refresh. Each retry went through unchanged, and I skipped nothing.

### Script negative-path runs (my own, against the final script as on disk)

These ran on a throwaway tree, `%TEMP%\r12rev-lead12`. It held:
- `repo`, a git repo with `capacitor.config.ts`, `android\app\build.gradle` and a gitignored `android\app\build\gradle-output.txt`
- `mono`, a git repo whose app lives at `mono\projects\scaffold`. This mimics the real layout, where `scaffold/` is a subfolder of a monorepo.
- bracket-named directories holding files
- a `git clone` of `repo`
- a directory that is not a repo

The process cwd and PowerShell location were set to the throwaway root. "Unchanged" means a recursive listing, with a SHA-1 per file and junctions not followed, was identical before and after.

| Case | `-RepoRoot` / `-MirrorPath` | Result |
|---|---|---|
| Existing, unrelated, non-empty `[m]` (`precious.txt`, `other.txt`) | repo / `…\br2\[m]` | exit 1, "contains a wildcard-like character"; **unchanged** (round 11 lost both files here) |
| Existing, non-empty `x[ab]` | repo / `…\br2\x[ab]` | exit 1, same message; unchanged |
| Junction alias of the repo root | repo / `…\alias` → `repo` | exit 1, "is inside a git working tree"; unchanged. `repo\android\app\build\` survived (round 11 deleted it here). |
| **Junction alias of a monorepo subfolder** (no literal child `.git`) | `mono\projects\scaffold` / `…\alias-sub` | **exit 1**, "inside a git working tree"; unchanged |
| **`subst Y:` of the monorepo, mirror `Y:\projects\scaffold`** | `mono\projects\scaffold` / `Y:\projects\scaffold` | **exit 1**, "inside a git working tree"; unchanged |
| A second real clone (it has the capacitor and gradle files) | repo / `…\clone2` | exit 1, "inside a git working tree"; unchanged |
| `-RepoRoot` containing `[1]` | `…\repo[1]` / fresh path | exit 1, "-RepoRoot … is not inside a git working tree"; unchanged |
| `-RepoRoot` is not a repo | `…\notrepo` / fresh path | exit 1, same message; unchanged |
| Relative `-RepoRoot` (L2) | `repo` (cwd = throwaway root) / fresh path | exit 0. It resolved once to `…\repo`, the marker was written, and parity passed. The only changes were inside the new mirror. |
| Monorepo-subfolder repo, fresh mirror (positive control) | `mono\projects\scaffold` / `…\mirror-mono` | exit 0; the marker was written; parity passed |
| The same path again (positive control) | same | exit 0; unchanged |
| Forward slashes | repo / `C:/…/fs` | exit 1, now says "expected 'X:\...', with backslashes - not 'X:/...'" (S2); unchanged |
| Drive-relative (the incident form) | repo / `C:mangled` | exit 1, "not a fully qualified path"; unchanged |

---

## Prior findings status (code-review-round11)

| # | Status | Evidence |
|---|---|---|
| R1(a) wildcard paths | **Closed** (option 2) | `refresh-android-mirror.ps1:90-94` rejects `[ ] * ?` in `-MirrorPath` and `-RepoRoot` before any path cmdlet runs on the mirror. `-ErrorAction SilentlyContinue` has been dropped from the check-4 listing (`:139`). The later `-Path` and `-like` uses (`:219`, `:235`, `:264-265`, `:283-286`, `:307-312`) are now unreachable with wildcard characters. For `-RepoRoot`, `Test-InsideGitWorkTree` (`:56`) runs before the character check, but a bracketed repo root fails safe (see the `repo[1]` row). |
| R1(b) alias or clone of the repo | **Closed, via an accepted deviation** | `:150-168`, `Test-InsideGitWorkTree` (`:54-65`). See below. |
| R2 GAMEOVER race | **Closed** | `slide-switch.spec.ts:233-253`: `currentRects` is a 3-attempt loop. Each attempt runs `ensurePlaying`, reads both boxes with no wait, re-reads `state`, and accepts only non-null boxes with `PLAYING`; otherwise it throws a distinct error. The old 5-second `boxOf` wait is gone. `:298-331`: `runOneSlide` makes 3 attempts, then throws a distinct "data collection interrupted" error instead of asserting over a corrupted log. The M3.3a rule assertions (`:333-382`) are unchanged, so no assertion is retried. The header is updated (`:37-49`). I also checked the case where GAMEOVER lands during `recentreIfNearEdge`'s tap: the Game Over screen's only control is "Play again" (`src/ui/ScreenController.ts:197-201`), so a stray tap cannot strand the test on another screen. Verified at 0/638 failing instances. |
| L1 log accuracy | **Closed** | A dated correction note sits below the round-8 entry. It covers the missing `--workers=1` addendum, the failure count, the root cause, and where the "before" git check actually runs. The original text is not rewritten. |
| L2 normalize `-RepoRoot` | **Closed**, with the same accepted deviation | `:179-193`: `GetFullPath` once, then `Test-InsideGitWorkTree`. Both robocopy and `Push-Location` use the normalized value. Verified in the relative-path row. |
| S1 `layout.test.ts` §6.4 titles | **Closed** | `layout.test.ts:145`, `:164` use `'%s'`. The verbose output has no `NaN`. |
| S2 forward-slash message | **Closed** | `:79` |

### R1(b) deviation: judged acceptable (and stronger than my suggestion)

I suggested checking for a literal `.git` directly under the mirror path. The developer points out that `scaffold/` has no `.git` of its own, because the real `.git` is at the `ahogancamp_portfolio` root. They are right: a literal child-`.git` check would have refused the real default `-RepoRoot` under L2. It would also have missed an alias of `scaffold/` itself, which is the realistic alias in this repo, since it has no child `.git`.

`git -C <path> rev-parse --is-inside-work-tree` works for both cases. I confirmed that Git for Windows resolves junction and `subst` paths to their real location before it searches upward for `.git`. A junction or `subst` alias of the monorepo **subfolder** is refused (rows 4-5 above), and so are an alias of a repo root and a second real clone. My suggestion would have caught neither of the first two.

Two residual edges are accepted and neither is destructive:
1. A mirror path that does not exist yet short-circuits to "not in a work tree" (`:56`), even if it would be created inside some other repo. `/MIR` only fills a new, empty directory, so nothing existing is purged.
2. If git refuses to answer (for example the `safe.directory` ownership check on another user's clone), the helper returns `$false`. Check 4's marker-or-layout rule is still in force, so the only thing that could slip through is another user's clone of this same app.

---

## REQUIRED

None.

## LOW (carry forward; not blocking; owner mobile-junior-developer, fix at the next touch)

- **L1. Stale comment in `slide-switch.spec.ts:294`.**
  - It still says "re-collected (bounded, 2 attempts)", but `RUN_ONE_SLIDE_MAX_ATTEMPTS = 3` (`:298`).
  - Change it to "3 attempts" (or refer to the constant).
- **L2. Round-12 log entry accuracy** (`tooling-setup-log.md`, the round-12 entry). Add a dated correction note; do not rewrite the text.
  - (a) The entry says the `Test-InsideGitWorkTree` exception fix "was caught by running the real mirror refresh … not by the throwaway-repo negative tests". The script's mtime (16:54:35) is later than the test edits, which suggests the negative-path table was produced against an earlier version of the script. Say whether the negative runs were repeated on the final script. My runs above cover the final script, so this is only a record-accuracy item.
  - (b) "77 entries: round 11's 74 … plus `code-review-round11.md` and the two new `code-review-round8/9` files" does not add up: round 11 recorded 75, and the round-8 and round-9 reviews were already included. State the count only (77, which I confirm).
  - (c) The real refresh is described as "recognised … via `capacitor.config.ts` + `android\app\build.gradle`". The `.svr-build-mirror` marker has existed since 15:59:18 (round 11), so both recognition paths were true.
  - (d) "Neither change touches `boxOf`'s old 5s-wait code path" is inaccurate: `boxOf` was removed from the file. That is correct, and it is the fix.
- **L3. The comment on `Test-InsideGitWorkTree` overstates what happens when git is missing** (`refresh-android-mirror.ps1:51-53`).
  - The comment says "only the genuinely unexpected case (git not on PATH at all) still throws". But with `$ErrorActionPreference = 'SilentlyContinue'` in effect around the call (`:58-60`), a missing `git` is a suppressed non-terminating error. The helper then returns `$false`.
  - The outcome is still safe: the `-RepoRoot` check (`:191-193`) then throws "not inside a git working tree", before anything destructive. But the message misdirects, and the comment is wrong.
  - Fix either one: correct the comment, or add `if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'git not found on PATH' }` once at the top of the script.

## Suggested (optional)

- **S1.** Nothing else. Optionally, the `-RepoRoot` wildcard rejection could move ahead of the `Test-InsideGitWorkTree` call (`:191`), so a bracketed repo root gets the clearer "wildcard-like character" message instead of "not inside a git working tree". Both fail safe.

## INFO

- **I1. One codebase:** no product or shared file changed this round. `AndroidPlatform-CkwCoiWy.js` is unchanged and the APK is the same size (3,961,037 bytes). No game logic is branched and no frame-count timing was added.
- **I2. No generated `android/` file was hand-edited:** mirror `res/` is byte-identical to the repo after `cap sync`.
- **I3. Coding standards, per category:**
  - Style: PASS
  - Error handling: PASS. The destructive boundary is now validated fail-fast, and the listing error is no longer swallowed. L3 is a comment-accuracy note only.
  - Logging: n/a
  - Code documentation: PASS, with the stale comment in L1
  - Dead code: none (`boxOf` was removed, not left behind)
  - Tests: PASS on determinism (0 of 638 instances failed across three runs)
- **I4. mobile-touch-and-layout:** not re-checked on a device, because no product change was made. The M3.3a 40/40 slide assertions are unchanged and pass in all four viewport projects.
- **I5.** `controls-behavior.spec.ts` did not fail in any of my runs, so there is no error-context to record.

## Next step

1. **Advance to step 9 (mobile-junior-tester).** Carry L1-L3 forward to mobile-junior-developer's next touch of these files. None of them blocks.
2. **L4 device-matrix decision** (carried from round 10): still with mobile-lead-tester and mobile-it-analyst.
