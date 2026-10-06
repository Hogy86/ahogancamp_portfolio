# Mobile Code Review, Round 11

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-28
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `4138829`. The scope is narrow, per `code-review-round10.md` "Next step":
- `scripts/refresh-android-mirror.ps1`
- `tests/mobile-e2e/cutout-insets.spec.ts`
- `src/platform/android/layout.test.ts`
- the dated round-11 entry in `docs/mobile/tooling-setup-log.md` (`:1610-1748`) and the S1 pointer (`:390-392`)
- the main session also asked me to judge the intermittent Playwright failure in `slide-switch.spec.ts` / `controls-behavior.spec.ts`

**Reviewed against:**
- `code-review-round10.md` R1, L1-L4 and S1
- `mobile-architecture.md` §10.1 A12
- the code-review-round4 M1 precedent: the mobile e2e suite gates the deploy with no retries
- the coding-standards and mobile-touch-and-layout skills

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: FAIL

**Every round-10 item is fixed as specified.**
- `refresh-android-mirror.ps1` now has a pre-flight block (`Assert-SafeMirrorPath`, `:45-110`) that runs before anything destructive. It checks for a fully qualified path, overlap with the repo, a drive root or USERPROFILE, an unrecognised existing directory, and a failed `git status`.
- L1-L4 and S1 are closed.
- 13 of my own negative-path runs on a throwaway repo behaved correctly (table below).
- The real mirror refresh and `assembleDebug` passed.
- `check:secrets`, `typecheck`, `lint`, `test` (526/526) and `build` all passed.

**Two required items remain.**
1. **R1 (LOW-MEDIUM, process safety).** Check 4 is bypassed by a legal Windows path character.
   - An existing, unrelated, non-empty directory whose name contains `[` … `]` is not recognised as existing, and `/MIR` then deletes its contents.
   - I reproduced this: `precious.txt` and `other.txt` were deleted.
   - A junction alias of the repo also passes the overlap check.
2. **R2 (MEDIUM, CI determinism).** The Playwright failure the developer reported is a **real race in the test code**, not host-timing noise.
   - `slide-switch.spec.ts` failed in both of my `--repeat-each=3` runs: 1 failure, then 2.
   - The cause is a check-then-act race against the game's own GAMEOVER. It gets more likely the slower the host is.
   - The suite gates the website deploy in CI with no retries, so per the round-4 M1 precedent this must be fixed before PASS.

mobile-junior-tester must not start until round 12 reports PASS.

## Verification results

| Check | Result |
|---|---|
| `npm run check:secrets` / `typecheck` / `lint` | All exit 0 |
| `npm run test` | **PASS: 29 files, 526 tests** |
| `layout.test.ts` verbose | 91/91 pass. The grid runs in 1,145 ms. The worked-check titles now read e.g. "row 3: … (unswapped)" with no `NaN`. |
| `npm run build` + purity grep on `dist/assets/*.js` | PASS. No `@capacitor` or `registerPlugin`. |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| `npm run build:android` | PASS. `AndroidPlatform-CkwCoiWy.js` has the **same hash as rounds 9 and 10**, so product JS is unchanged. |
| `check:android-styles` | exit 0 |
| **Playwright `--repeat-each=3`, run 1** (16:09-16:14) | **278 passed, 1 failed.** `[915x412] slide-switch.spec.ts:395` (swap layout, repeat2): `.touch-button--left has no bounding box`. The error-context page snapshot shows the **GAME OVER** screen ("Final Score: 0", "Reached Level 1", "Play again" visible). |
| **Playwright `--repeat-each=3`, run 2** (16:15-16:20) | **277 passed, 2 failed.** `[915x412] slide-switch.spec.ts:385` (default, repeat1): `.touch-button--left has no bounding box`. `[915x412] slide-switch.spec.ts:395` (swap, repeat2): `.touch-button--right has no bounding box`, from `currentRects:226` via `runFortySwipes:371`. Both page snapshots show Level 1, Score 0, Lives 1 and the GAME OVER screen. |
| `cutout-insets.spec.ts` (round-11 scope) | Every case passed in both runs, including the swapped (a) cases that now hold ▶ and assert `toBeGreaterThan` |
| Other processes during the runs | No node, java, qemu or emulator processes. The owner's own desktop Chrome window (a GitHub tab, not started by this review) was open; I did not touch it. `adb.exe` pid 178172 was already running before this review and was left as found. |
| Repo before and after both Playwright runs and the mirror refresh | `git status --porcelain --untracked-files=all` is identical (75 entries = round 10's 74 + `code-review-round10.md`). `sha1sum -c` on all 74 changed or untracked files is identical after each step. `test-results/` is gitignored (`.gitignore:35`). |
| Real mirror refresh: `powershell.exe -NoProfile -File '…\scaffold\scripts\refresh-android-mirror.ps1'` (defaults) | exit 0. The pre-flight recognised the mirror by its marker (written 2026-09-28 15:59:18). robocopy exit 3 (15 files copied; 1 extra, which is the marker, kept by `/XF`). "Parity check passed: 126 file(s) … and 6 named file(s)". Git-status guard passed. No stray `dev-build`, `mangled` or `.svr-build-mirror` file in the repo. |
| Mirror `npm ci`, `build:android`, `npx cap sync android`, `check-capacitor-config.mjs`, `check-android-styles.mjs` | All PASS. Plugins: app 8.1.1, splash-screen 8.0.2. The synced bundle is `AndroidPlatform-CkwCoiWy.js`. `diff -rq` of `android/app/src/main/res` against the repo: identical. |
| Mirror `gradlew.bat assembleDebug --no-daemon` (JDK 21.0.12) | **BUILD SUCCESSFUL**, 153 tasks, `app-debug.apk` 3,961,037 bytes (the same size as round 10) |
| `check-android-manifest.mjs --variant debug` | PASSED |
| Emulator | Not run, because no product code changed (per scope) |
| Cleanup | No node, java, qemu or emulator process and no listener on 4173-4175, 4181, 4182 or 9333 afterwards. The `subst X:` drive used for one test was removed. The junction was removed with `rmdir` (not recursive) before the throwaway tree was deleted. `%TEMP%\r11rev-lead` is gone. |

No command was denied.

### Script negative-path runs (throwaway git repo `%TEMP%\r11rev-lead\repo`; real repo and real directories never targeted)

The throwaway repo contained `capacitor.config.ts`, `android\app\build.gradle` and a gitignored `android\app\build\gradle-output.txt`. The process cwd and PowerShell location were set to the repo, so drive-relative forms resolve the way they did in the round-9 incident. "Unchanged" means a recursive listing of the whole throwaway root was identical before and after.

| Case | `-MirrorPath` | Result |
|---|---|---|
| Drive-relative (incident form) | `C:mangled-mirror` | exit 1, "not a fully qualified path"; tree unchanged |
| Relative / rooted without a drive | `mangled`, `\mangled` | exit 1; unchanged |
| Forward slashes | `C:/…/fs-mirror` | exit 1, "not fully qualified". Safe, but see S2. |
| Mirror equals the repo | `…\repo` | exit 1, "overlaps the repo"; unchanged |
| Same path, different case, trailing `\` | `…\REPO\` | exit 1, overlap; unchanged |
| Ancestor via `..` | `…\repo\scripts\..\..` | exit 1, overlap; unchanged |
| Descendant | `…\repo\nested-mirror` | exit 1, overlap; unchanged |
| **Drive root, isolated** (`subst X:` of a throwaway dir) | `X:\`, and `X:\sub\..` | exit 1, "is a drive root", for both; unchanged |
| **USERPROFILE itself / an ancestor, isolated** (`USERPROFILE` overridden to a throwaway path outside the repo) | `…\fakeusers\me`, `…\fakeusers` | exit 1, "is `$env:USERPROFILE` … or one of its ancestors". The only new files were `AppData\Roaming`, created by `powershell.exe` itself for the fake profile, not by the script. The developer's log only reached this branch via the overlap check, so this is the first isolated evidence that check 3 works. |
| Existing, unrelated, non-empty directory | `…\unrelated` (contains `notes.txt`) | exit 1, "not recognisably a prior mirror"; unchanged |
| Sibling prefix, new directory (positive control) | `…\repo2` | exit 0; the marker was written; parity passed. The `\` comparison correctly does not treat `repo2` as inside `repo`. |
| The same path again (positive control) | `…\repo2` | exit 0; unchanged |
| Broken git (`-RepoRoot` is not a repo) | fresh path | exit 1, "git status --porcelain failed (exit 128)"; unchanged |
| **Existing, unrelated, non-empty, name `[m]` or `x[ab]`** | `…\br2\[m]`, `…\br2\x[ab]` | **exit 1, but only after `/MIR` had run.** The pre-flight did not refuse. `precious.txt` and `other.txt` were **deleted** (robocopy "Extras 2"), the repo tree was copied in, then `Set-Content` of the marker threw. **See R1.** |
| **Junction alias of the repo** | `…\alias` → `…\repo` | Pre-flight passed. `Remove-Item` **deleted the repo's `android\app\build\`** through the junction, and **`.svr-build-mirror` was written into the repo**. The git-status guard then threw (exit 1). **See R1.** |

---

## Prior findings status (code-review-round10)

| # | Status | Evidence |
|---|---|---|
| R1 (pre-flight) | **Fixed as specified; a new bypass is found (R1 below)** | `refresh-android-mirror.ps1:45-110`. Validation runs before `Push-Location` (`:115`), before the stale-node kill (`:133`), before `Remove-Item` (`:150`) and before robocopy (`:164`). Items 1-4 behave correctly for every ordinary path (table above). The marker is excluded from `/MIR` via `/XF` (`:159`) and survives a re-run. |
| R1 item 5 / L4 (git exit code) | **Closed** | `:122-125`, `:243-246`. Verified: exit 128 → throw, nothing written. |
| L1 (swapped insets and the ▶ button) | **Closed** | `cutout-insets.spec.ts:151,157` and `:195,202` always hold `.touch-button--right` and assert `toBeGreaterThan`. `:163-166` and `:249-252` use the physical insets in both swaps. Passes in both runs. |
| L2 (test names and precision) | **Closed** | `layout.test.ts:468-480`: `'%s (unswapped)'` / `'%s (swapped)'`, `toBeCloseTo(…, 3)`. The verbose titles are clean. |
| L3 (stale-node match) | **Closed in intent** | `:133-134` matches `*$MirrorPath*` on the full normalized path. It shares the wildcard defect in R1 (a `[` in the path makes `-like` a character class). |
| S1 (forward pointer) | **Closed** | `tooling-setup-log.md:390-392` |

---

## REQUIRED (must fix before PASS; owner mobile-junior-developer)

### R1 (LOW-MEDIUM, process safety): the pre-flight uses wildcard paths, and it accepts an alias of the repo

**(a) Wildcard paths.** Every PowerShell path cmdlet in the script uses `-Path` (the default), which treats `[` `]` as wildcard characters. `[` and `]` are legal in Windows directory names.

- **Where:**
  - `:95` `Test-Path $mirrorFull`
  - `:96` `Get-ChildItem -Path $mirrorFull`
  - `:98-100` `Test-Path (Join-Path …)`
  - `:150` `Remove-Item … (Join-Path $MirrorPath $rel)`
  - `:179-180` `Test-Path` / `Set-Content -Path $markerPath`
  - `:199` `Get-ChildItem -Path $full`
  - `:201` and `:226-227` `Get-FileHash -Path`
  - `:222-223` `Test-Path`
  - `:134` `-like "*$MirrorPath*"`
- **Effect:** for an existing directory `…\[m]`, `Test-Path` looks for a directory named `m`. It returns `$false`, so check 4 is skipped entirely, and `robocopy /MIR` (which takes the path literally) purges the real `[m]`.
  - Reproduced: two unrelated files were deleted before the script threw at `Set-Content`.
  - This is the exact "wrong-but-absolute existing directory purged by `/MIR`" case that round-10 R1 item 4 exists to stop.
- **Fix, either option:**
  1. Use `-LiteralPath` on every `Test-Path`, `Get-ChildItem`, `Remove-Item`, `Set-Content` and `Get-FileHash` call, and replace the `-like` at `:134` with `$_.CommandLine.IndexOf($MirrorPath, [StringComparison]::OrdinalIgnoreCase) -ge 0`.
  2. Or, simpler and also acceptable: in check 1, reject any `-MirrorPath` **or `-RepoRoot`** that contains `[`, `]`, `*` or `?`, with a clear message.

  In both cases, also drop `-ErrorAction SilentlyContinue` from the check-4 `Get-ChildItem` (`:96`). An access-denied error currently makes a non-empty directory look empty, and the purge proceeds.

**(b) An alias of the repo passes the overlap check.** The overlap check (`:62-69`) is a string comparison, so a junction, symlink or `subst` alias of the repo passes it.

- A second clone of this repo at any absolute path also passes check 4, because it contains `capacitor.config.ts` and `android\app\build.gradle`.
- `/MIR` would then overwrite that clone's working tree. `.git` survives only because `/XD .git` also excludes it from the purge.
- Reproduced with a junction: the repo's `android\app\build` was deleted and the marker was written into the repo before the git-status guard caught it.
- **Fix (one line in check 4):** refuse any `-MirrorPath` under which `.git` exists (`Test-Path -LiteralPath (Join-Path $mirrorFull '.git')`). A real mirror never has one, because `/XD .git`. Add a one-line comment explaining why.

**Log it.** Append to the round-11 log entry the negative runs for `…\[m]` (an existing directory holding a file) and a junction alias of the throwaway repo. Both must exit non-zero with **nothing written or deleted**. Use a throwaway repo only.

### R2 (MEDIUM, CI determinism): `slide-switch.spec.ts` races the game's own GAMEOVER

- **Where:**
  - `tests/mobile-e2e/slide-switch.spec.ts:220-233` (`currentRects`)
  - `:135-144` (`boxOf`)
  - `:278-298` (`runOneSlide`'s re-collection loop)
- **Problem:** No shield is ever thrown, so Level 1 always eventually ends in GAMEOVER, as the file's own comments at `:171-179` and `:352-363` say. When that happens is set by game time plus `Math.random()` enemy behavior, while the test's pacing depends on host speed. The recovery path has a **check-then-act window**:
  1. `ensurePlaying` (`:224`) reads `state === 'PLAYING'` and returns.
  2. GAMEOVER lands, which hides the controls (M3.9).
  3. `boxOf` waits up to 5 s for visibility, but nothing clicks "Play again" during that wait, so the wait can never succeed.
  4. `boundingBox()` returns `null` and the test throws.
- **Evidence:** all three of my failures fit this: the page snapshot shows GAME OVER with "Play again" not clicked, and the stack goes `currentRects:225/226` → `boxOf:142`.
- **A second, related hole:** `runOneSlide` re-collects at most twice (`:278`). If the second attempt is also interrupted, the loop exits with `leftPlaying === true`, and the M3.3a rules are then asserted over a corrupted log. That would show up as a false rule-1, 2 or 3 failure.
- **Why this blocks PASS:**
  - It is a logic race in test code whose likelihood grows the longer a run takes (0 failures in round 10; 1 and then 2 of 24 slide-switch instances in my two runs; 3 of 96 in the developer's four).
  - CI runs these 8 instances (2 tests × 4 projects) on slower shared runners with no retries, and `deploy` needs `mobile-e2e`.
  - Round-4 M1 set the rule: a flaky mobile e2e gate is a required fix.
  - The problem predates this round (the file was last changed on 2026-09-27). Nothing in this round caused it, but it now repeats in every run.
- **Fix, test-only (no product change, and no retry of an M3.3a assertion):**
  1. Make `currentRects` a bounded loop, for example 3 attempts. Each attempt: `ensurePlaying` → read both `boundingBox()` values **without** the 5 s visibility wait → read `snapshot().state` again. Return only if both boxes are non-null **and** the state is still `PLAYING`. Otherwise loop, and `ensurePlaying` clicks "Play again" if needed. After 3 attempts, throw a clear "could not reach PLAYING with visible controls" error. Setup code that recovers from GAMEOVER is not an assertion retry.
  2. In `runOneSlide`, if the final attempt still has `leftPlaying === true`, throw a clear "data collection interrupted by GAMEOVER N times" error (or allow 3 attempts), instead of asserting the rules over that log.
  3. Update the file header's "Measurement design" note to record that GAMEOVER recovery is race-free by construction.
- **Verification to log:** two full `--repeat-each=3` runs with **0 failures**, plus `-g "40/40" --repeat-each=10` with 0 failures, with the `git status` and hash checks before and after.
- **`controls-behavior.spec.ts`:** I did not reproduce the developer's one reported failure there in either run, and the log gives no error text. If it recurs during the R2 verification, record the error-context and stack in the log. It must not be written off as "host timing" without that evidence.

## LOW (not blocking; fix alongside)

- **L1. `tooling-setup-log.md` round-11 entry: accuracy.**
  - `:1725-1726` says "see the addendum below for its result" (the `--workers=1` run), but no addendum exists; the entry ends at `:1748`. Record the result, or say it was not completed.
  - `:1719-1721` says "exactly one flaky failure" in each of four runs, then lists three ("all three in the 1280x800 project"). Make the count consistent.
  - `:1722-1724` attributes the failures to "marginal per-test timing … under load". Replace this with the R2 root cause.
  - `:1674` says the "before" git check is "folded into the R1 pre-flight". It actually runs after `Push-Location` (`:122`), which is fine, but the wording is wrong.
  - Use a dated correction note; do not rewrite the text.
- **L2. Normalize `-RepoRoot` as well.** Right now only `-MirrorPath` is normalized. A relative `-RepoRoot` is resolved by `Push-Location` (`:115`) and then *again* by robocopy relative to the new location (`:164`). Today this fails safely (robocopy exit 16), but it is fragile. Normalize it with `GetFullPath`, require `Test-Path -LiteralPath (Join-Path $repo '.git')`, and use the normalized value everywhere.

## Suggested (optional)

- **S1.** `layout.test.ts:141` and `:159` (the §6.4 tables) use the same positional-printf title pattern as round-10 L2 and print `B=NaN, scale~56`. Apply the same `'%s'` fix. This predates this round.
- **S2.** Forward-slash paths are rejected. That is safe, but the Bash tool naturally produces them. Say so in the error message, e.g. "use backslashes: `C:\…`".

## INFO

- **I1. One codebase.** No shared file and no product file changed. The bundle hash `AndroidPlatform-CkwCoiWy.js` is unchanged, and the APK is the same size as round 10's. No game logic is branched, and no frame-count timing was added.
- **I2. No generated `android/` file was hand-edited.** `res/` is byte-identical to the repo after `cap sync`.
- **I3. Coding standards, per category:**
  - Style: PASS
  - Error handling: **FAIL for the script** (R1: wildcard path handling at a destructive boundary; `SilentlyContinue` on the check-4 listing). Otherwise PASS.
  - Logging: n/a
  - Code documentation: PASS (the pre-flight comments explain why)
  - Dead code: none
  - Tests: **FAIL on determinism** (R2)
- **I4. mobile-touch-and-layout:** not re-checked on a device (no product change). `cutout-insets.spec.ts` now checks the physical inset and the ▶ direction in every swapped case.

## Next step

1. Return to **mobile-junior-developer** (step 7) with this document for **R1 (a)+(b)** and **R2**, with L1 and L2 alongside. Append a dated round-12 log entry with the new negative runs and the Playwright evidence.
2. Round-12 review, narrow scope:
   - `refresh-android-mirror.ps1`
   - `slide-switch.spec.ts`
   - the log entry
   - re-run the bracket and junction negative paths on a throwaway repo
   - two `--repeat-each=3` runs and one `-g "40/40" --repeat-each=10`, each with 0 failures
   - one real mirror refresh plus `assembleDebug`
   - no emulator run unless product code changes
3. **L4 device-matrix decision** (carried over from round 10): still with mobile-lead-tester and mobile-it-analyst.
