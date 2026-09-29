# Mobile Code Review, Round 10

**Stage:** Mobile Pipeline Step 8, mobile-lead-developer (independent review)
**Date:** 2026-09-28
**Change reviewed:** the uncommitted working tree on `claude/project-thread-rm5222` compared with HEAD `4138829`, plus untracked files. The scope is narrow, per `code-review-round9.md` "Next step":
- `src/platform/android/layout.test.ts`
- `tests/mobile-e2e/cutout-insets.spec.ts` and `tests/mobile-e2e/too-small-window.spec.ts`
- the new `scripts/refresh-android-mirror.ps1`
- the dated 2026-09-28 round-10 entry in `docs/mobile/tooling-setup-log.md` (R2, L3, L4)
- the S1 and S2 comments in `layout.ts:190-197` and `screenFit.ts:169-174`

**Reviewed against:**
- `mobile-architecture.md` v1.6: §6.2.1 A12 worked-check table (rows 1-20) and §10.1 A12
- `code-review-round9.md` R1, R2, L1-L4, S1, S2
- the coding-standards and mobile-touch-and-layout skills

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

## Verdict: FAIL

**Every round-9 test and doc finding is closed.** Round-9 R1, L1, L2, L3, S1 and S2 are fixed properly.
- The §10.1 A12 invariant grid is now the full spec grid: 2,465,792 cases, all five assertions, about 1.0 s.
- I mutation-tested it in the scratchpad. Each of three one-line layout defects was caught by the grid.
- Playwright `--repeat-each=3`: 279/279 passed. The repo was byte-identical before and after.
- Product code is unchanged since round 9. The Android bundle hash `AndroidPlatform-CkwCoiWy.js` is the same as round 9's.

**One required item remains, and it is in the round-9 R2 fix itself.**
- `scripts/refresh-android-mirror.ps1` fixes the quoting and adds a parity check and a git-status guard that both fail loudly.
- But it runs `robocopy /MIR` (and `Remove-Item`) against `-MirrorPath` **without validating it first**.
- The script says overrides are supported, so a bad path is a real risk:
  - a drive-relative path (the exact round-9 incident),
  - an ancestor directory,
  - the repo itself.
- With such a path it can still write into the repo, or purge a directory that is not the mirror, **before** any check runs.
- I reproduced the drive-relative case on a throwaway repo. The parity check caught it afterwards, but the stray nested copy was already in the repo.
- This fails the "no destructive action outside the mirror" criterion for this review. The fix is a few lines of pre-flight validation.

mobile-junior-tester must not start until round 11 reports PASS. Round 11 can be very narrow: only the script and its log line.

## Verification results

| Check | Result |
|---|---|
| `npm run check:secrets` / `typecheck` / `lint` | All exit 0 |
| `npm run test` | **PASS: 29 files, 526 tests** (509 in round 9). `layout.test.ts` has 91 tests. |
| Invariant-grid test duration | 1,043 ms (vitest verbose) |
| **Mutation check of the grid.** Scratch copies of `layout.ts` and `layout.test.ts`; `node_modules` via a junction, removed afterwards with a non-recursive delete. | Unmutated: 91/91 pass. `controlRowY + 1`: grid **FAILS** ("control rect … outside the full insets"). `throwButtonX − 60`: grid **FAILS** ("control rect x-range overlaps the playfield"). `pauseButtonX + 9`: grid **FAILS**. Assertion 4 is live and effective. |
| `npm run build` + CI purity grep on `dist/assets/*.js` | PASS. No `@capacitor` or `registerPlugin`. |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| `npm run build:android` | PASS. `AndroidPlatform-CkwCoiWy.js` has the **same content hash as round 9**, so product JS is unchanged. |
| `check:android-styles` (repo) | exit 0 |
| Playwright `-c playwright.mobile.config.ts --repeat-each=3`, whole suite, cwd = scaffold, nothing else running | **279 passed, 0 failed** (4.3 min). 279 = 273 − 3 (the duplicate boundary test was removed) + 9 (three new swapped (c) cases × 3). |
| Repo before and after Playwright | `git status --porcelain --untracked-files=all` is identical (74 entries). SHA-1 of every changed or untracked file is identical, including the five committed `m2_3b_c_*.png` files. **Round-9 L1 is confirmed closed in practice.** |
| Mirror refresh with the new script: `powershell.exe -NoProfile -File '…\scaffold\scripts\refresh-android-mirror.ps1'` (defaults) | exit 0. robocopy exit 1. "Parity check passed: 126 file(s) … and 6 named file(s)". Git-status guard passed. |
| Independent parity (`diff -rq`, `cmp`) | Identical: `src`, `tests`, `scripts`, `public`, `android/app/src`, `package.json`, `package-lock.json`, `capacitor.config.ts`, `vite.config.ts`, `playwright.mobile.config.ts`, `android/app/build.gradle` |
| Repo after the refresh | `git status` identical, file hashes identical. No `*Usersaaron*`, `dev-build` or `shield-vs-robots` directory anywhere under the repo. |
| Script on a **clean** tree (throwaway git repo under `%TEMP%\r10ct`, removed afterwards) | exit 0. `Compare-Object` binds correctly when `git status` returns nothing, so the guard does not break once this batch is committed. |
| Script with `-MirrorPath 'C:mangled-mirror'` (throwaway repo) | robocopy wrote `repo\mangled-mirror\` **and** `repo\mangled-mirror\mangled-mirror\` (self-nesting) **inside the repo**. The parity check then threw (exit 1). Fails loudly, but only after the write. See R1. |
| Mirror `npm ci`, `build:android`, `npx cap sync android`, `check-capacitor-config.mjs`, `check-android-styles.mjs` | All PASS. Plugins: app 8.1.1, splash-screen 8.0.2. `res/` identical to the repo after sync. The synced bundle is `AndroidPlatform-CkwCoiWy.js`. |
| Mirror `gradlew.bat assembleDebug --no-daemon` (JDK 21.0.12) | **BUILD SUCCESSFUL**, 153 tasks, `app-debug.apk` 3,961,037 bytes |
| `check-android-manifest.mjs --variant debug` (aapt2 36.0.0) | PASSED |
| Emulator | Not run. No product code changed, per scope. |
| Cleanup | No node, java, qemu or emulator process. No listener on 4173-4175, 4181, 4182 or 9333. `adb.exe` (pid 178172) was already running before this review and was left as found. Scratch files are only in the session scratchpad; `%TEMP%\r10ct` was removed. Side effect: vitest runs through the scratch junction may have refreshed the gitignored `node_modules/.vite` cache in the repo; that is not a project file, and git status is unchanged. |

No command was denied.

---

## Prior findings status (code-review-round9)

| # | Status | Evidence |
|---|---|---|
| R1 (grid) | **Closed** | `layout.test.ts:279-414`.<br>- The lattices are built with loops (`:289-292`), using the spec value sets, cT ∈ {0, t}, cB ∈ {0, b}, and both swaps.<br>- All five §10.1 A12 assertions are there: s ≥ 0.5 (`:352`); cutout top and bottom (`:356-361`); text top and bottom (`:363-368`); **control rects inside the full insets and clear of the playfield x-range** (`:374-401`); `classifyWindow` ⇔ `belowFloor` for every case (`:341`).<br>- Violations are collected and asserted once (`:412`).<br>- The grid is proven effective by mutation (see the table above). |
| R1 (worked-check numerics) | **Closed** | `layout.test.ts:416-476`: s and pfY for rows 1-7, 10 and 14, in both swap settings. The values agree with the §6.2.1 A12 table; row 7 pfY 23.49 = 326.49 − 303. See L2 for a precision nit. |
| R2 (mirror procedure) | **Partially closed; see R1 below** | The script runs from one shell, via `-File`, with single-quoted parameters. Parity is checked by hash in both directions (missing, mismatch and extra files) and the script `throw`s on any difference. robocopy's exit code is explicitly treated as not being evidence. Git-status before/after guard. A dated, append-only log entry (`tooling-setup-log.md:1497-1552`). **Missing: pre-flight validation of the destination.** |
| L1 (screenshots into the repo) | **Closed** | `cutout-insets.spec.ts:277-280` uses `testInfo.attach`. The committed PNGs are unchanged after 279 runs. |
| L2 (a) (8 cases for (c)) | **Closed** | `cutout-insets.spec.ts:221-230` |
| L2 (b) (same checks in (b)) | **Closed** | `assertControlSizes` is shared (`:105-114`, called at `:164` and `:205`) |
| L2 (c) (timers) | **Closed** | `too-small-window.spec.ts:309` does a full `toEqual(before)` on the snapshot. The comment explains why no field is wall-clock. |
| L2 (duplicate boundary test) | **Closed** | Kept only in `too-small-window.spec.ts:235-249` |
| L3 (log inaccuracies) | **Closed** | `tooling-setup-log.md:1381-1384` and `:1285-1297` are corrected with inline correction notes; the old text is kept. |
| L4 (fold override) | **Closed (junior part).** The device-matrix decision stays with mobile-lead-tester and mobile-it-analyst. | `:1554-1602`: override confirmed, reset, and the natural `device_state CLOSED` window measured as 412 × 309 dp over CDP, with 0 Button nodes and a screenshot `m2_10a_fold_prompt_natural_round10.png`. The "no `wm size` override" recommendation is recorded for `device-matrix.md`. I did not re-run it on a device (out of scope, no product change). |
| S1 | **Closed** | `layout.ts:191-197` |
| S2 | **Closed** | `screenFit.ts:169-174` |

---

## REQUIRED (must fix before PASS; owner mobile-junior-developer)

- **R1 (LOW-MEDIUM, process safety). `refresh-android-mirror.ps1` validates the destination only after it has already mirrored into it.**
  - **Where:** `scripts/refresh-android-mirror.ps1`:
    - `:31-34`: the params, with no validation;
    - `:50-56`: the stale-node kill;
    - `:63-69`: `Remove-Item -Recurse -Force` under `$MirrorPath`;
    - `:79`: `robocopy $RepoRoot $MirrorPath /MIR`.
  - **Problem:** `/MIR` deletes everything at the destination that is not in the source. The parity and git-status checks (`:93-158`) only run afterwards. I reproduced this: `-MirrorPath 'C:mangled-mirror'`, the same drive-relative form as the round-9 incident, resolves against the pushed location (the repo). robocopy then wrote a self-nesting copy **inside the repo** before the parity check threw.
  - **Worse cases that no post-check can undo:**
    - A dropped leaf (`'C:\Users\aaron\dev-build'`), `'C:\Users\aaron'` or a drive root would purge every sibling project or file in that directory.
    - `-MirrorPath` equal to `$RepoRoot`, or an ancestor of it, would make `/MIR` and `Remove-Item` act on the repo itself.
  - The header (`:19-21`) invites `-RepoRoot` and `-MirrorPath` overrides, so this is a supported path, not a hypothetical.
  - **Fix.** Add a pre-flight block right after `$ErrorActionPreference = 'Stop'`, before `Push-Location` and before anything destructive, that `throw`s on:
    1. **A path that is not fully qualified.** Require `^[A-Za-z]:\\` on the raw `$MirrorPath` string, which rejects `C:foo`, `foo` and `\foo`. Then normalize both paths with `[System.IO.Path]::GetFullPath(...)` and `.TrimEnd('\')`.
    2. **Overlap with the repo.** Throw if the mirror equals the repo, is inside it, or contains it. Compare case-insensitively with a trailing `\` on both, so that `...\scaffold2` is not treated as inside `...\scaffold`.
    3. **A drive root, or `$env:USERPROFILE` or one of its ancestors.**
    4. **An existing directory that is not recognisably the mirror.** If `$MirrorPath` exists and is non-empty, require that it contains `capacitor.config.ts` **and** `android\app\build.gradle`, or else a marker file the script writes on first creation, for example `.svr-build-mirror`. This is what stops a wrong-but-absolute existing directory from being purged.
    5. **A failed `git status` (L4 below).** Check `$LASTEXITCODE` after each `git status --porcelain` and throw if it is non-zero.
  - Add a one-line test of the new failure paths to the log entry. For example, `-MirrorPath 'C:mangled'` and `-MirrorPath '<RepoRoot>'` both exit non-zero **with nothing written**. Run these on a throwaway repo, as the junior already did for the parity path.

## LOW (not blocking; fix alongside R1)

- **L1. `cutout-insets.spec.ts`: the swapped cases mirror the device insets and hold the wrong button.**
  - **Mirrored insets.** `:162` and `:245` swap `left`/`right` insets when `swap` is true. Swap controls mirrors the control columns, not the physical system insets. `layout.test.ts:307-309` correctly uses `insets.left` in both swaps. Today every swapped case has l = r, so this does no harm, but it would pass a real bug for asymmetric insets. Fix: always use the physical insets.
  - **Wrong button.** `:148` holds `.touch-button--left` (◀, "Move left") in the swapped layout and asserts only `not.toBe`. §10.1 A12 (a) says "hold ▶ … → the player's x **increases**". Fix: always hold `.touch-button--right` and assert `toBeGreaterThan(before.player.x)`, in `:155` and in (b) at `:197`.
  - This was already present in round 9; I missed it then.
- **L2. `layout.test.ts:416-476` has cosmetic and precision nits.**
  - **Test names.** They print `s~NaN, playfieldY~NaN`. The `%f` placeholders consume the viewport and insets objects (positional printf). Use `$`-style names, or drop the placeholders.
  - **Scale precision.** Scale is checked with `toBeCloseTo(…, 2)` (±0.005), which cannot tell row 3's 0.5058 from 0.505, or row 14's 0.5008 from 0.5. Use precision 3 for `s`, as the separate row-14 test at `:125` already does.
- **L3. The stale-node kill matches the mirror's leaf name** (`:50-52`, `-like "*$mirrorLeaf*"`). This is broader than the round-4 procedure, which matched `*dev-build\shield-vs-robots*`. Match on the full normalized mirror path, so a non-default `-MirrorPath` with a generic leaf cannot kill unrelated `node.exe` processes. It is harmless with today's default leaf.
- **L4. The exit code of `git status --porcelain` (`:45`, `:149`) is not checked.** `$ErrorActionPreference = 'Stop'` does not cover native commands. If git fails, for example because it is not on PATH or the directory is not a repo, both snapshots are empty and the guard passes silently. This is folded into R1 step 5.

## Suggested (optional)

- **S1.** Add a one-line forward pointer next to the superseded §3 A9 robocopy block (`tooling-setup-log.md:384-389`), for example "Superseded 2026-09-28: use `scripts/refresh-android-mirror.ps1` (see the round-10 entry)". Readers who land on the old block first would then find the script. This is an annotation, not a rewrite, so it is consistent with the round-6 I1 traceability guidance.

## INFO

- **I1. One codebase.** No shared file changed. The only `src` changes since round 9 are the two S1/S2 comments. The bundle hash is identical, so no behavior changed. No game logic is branched, and no frame-count timing was added.
- **I2. No generated `android/` file was hand-edited.** `res/` is byte-identical after `cap sync` in the mirror.
- **I3. Coding standards, per category:**
  - Style: PASS
  - Error handling: **FAIL for the new script** (R1: no validation of input at a destructive boundary; L4: a swallowed native-command failure). PASS elsewhere.
  - Logging: n/a
  - Code documentation: PASS (the script header, and the "why" comments in the test files)
  - Dead code: none
  - Test conformance to §10.1 A12: PASS (L1 and L2 are non-blocking)
- **I4. mobile-touch-and-layout:** not re-checked on a device this round, because no product code changed. The round-9 device results stand, and the full grid now guards controls-inside-insets and clear of the playfield for every lattice window.

## Next step

1. Return to **mobile-junior-developer** (step 7) with this document for **R1**, with L1-L4 alongside. Add a dated line to the round-10 tooling-log entry recording the new pre-flight checks and their negative tests.
2. Round-11 review, narrow scope:
   - `scripts/refresh-android-mirror.ps1`
   - its log line
   - the `cutout-insets.spec.ts` and `layout.test.ts` touch-ups
   - re-run `npm run test` and Playwright `--repeat-each=3`, and one real mirror refresh plus `assembleDebug`
   - the negative-path runs of the script on a throwaway repo
   - no emulator run, unless product code changes
3. **L4 device-matrix decision:** still with mobile-lead-tester and mobile-it-analyst. The junior's recommendation (natural `device_state CLOSED` window, no `wm size` override) is recorded at `tooling-setup-log.md:1595-1602`.
