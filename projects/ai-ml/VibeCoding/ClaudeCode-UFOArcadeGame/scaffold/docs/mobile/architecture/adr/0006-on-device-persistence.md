# ADR M-0006: On-device persistence — shared WebView localStorage; storage plugin only as an owner exception

## Status: Proposed. Part 1 (shared localStorage) is proposed for acceptance. Part 2
(`@capacitor/preferences` contingency) **requires an owner exception** and is not decided
here (OQ-A1).

## Context
- F20 (`docs/PRD-addendum-v3.md`) makes "Best: N" a shared rule. AC15 says the rule,
  timing, "New best!" logic and validation live **once** in `src/`. Only the AC4(e) trigger
  is platform-specific. The addendum's architect note says: use localStorage on Android if
  it meets M7.4; otherwise any plugin is a narrow owner exception, because storage is not
  an allowed platform-specific area.
- M7.3 Android settings: swap controls, help seen. M7.4 survive close, process death,
  reboot and Play update; erased only by uninstall / Clear storage. M7.5 fail closed. M7.6
  nothing leaves the device.
- The existing fail-closed pattern: `Instrumentation.ts` (security-review-v1 MEDIUM #1).
- My agent brief suggested Capacitor Preferences as the default. The main session's
  instruction and F20 AC15 take precedence, so shared storage is the default.

## Decision
1. **Storage = WebView `localStorage`**, through `src/persistence/safeStorage.ts`
   (try/catch, in-memory fallback). Consumers: shared `bestScore.ts` (F20) and Android
   `settings.ts`.
2. **Origin pinned**: `server.androidScheme: 'https'`, `hostname: 'localhost'`. A unit test
   asserts both, because changing either changes the origin and orphans saved data.
3. **Keys:**
   - `vvs:best` = bare JSON integer, validated (integer, finite, ≥ 0, ≤ MAX_SAFE_INTEGER,
     else 0)
   - `vvs:settings` = `{"v":1,"swapControls":bool,"helpSeen":bool}`, validated per field,
     unknown fields ignored
   - `vvs:metrics` is unchanged and separate (F20 AC11)
4. **Schema/versioning:** best has no wrapper (F20 AC12: a single number). An
   incompatible change uses a new key plus a one-time read of the old key. Settings carry
   `v`: known versions are migrated, and a higher unknown version is read field-by-field
   and not overwritten until the player changes a setting.
5. **Write timing:** at every F20 AC4 event and every settings change, never only on exit.
6. **Backup disabled** (`allowBackup=false`, data-extraction rules exclude everything), so
   no cloud copy is made (M7.6).
7. **Verification that decides Part 2:** on the emulator, (i) install N → set → install
   N+1, (ii) reboot, (iii) background, wait 5 s, `adb shell am kill`, relaunch, (iv) Quit
   → relaunch, (v) Clear storage → first-launch defaults. All pass → Part 2 stays unused.

**Part 2 (contingency, owner exception needed):** if the checks in 7 fail, add
`@capacitor/preferences` as a `KeyValueStore` adapter under
`src/platform/android/storage.ts`. It is loaded once at boot into the same in-memory cache
that `safeStorage` exposes. `bestScore.ts` stays the single rule implementation.

## Alternatives Considered (and why rejected)
- **`@capacitor/preferences` as the default.** Rejected as the default. It adds an
  Android-only storage path in an area the one-codebase rule does not permit, and it would
  split F20 persistence across two backends while the web already meets F20 with
  localStorage. It is kept only as the contingency (Part 2).
- **IndexedDB.** Rejected. It is async and heavier for one integer and two booleans, has
  the same origin-bound durability as localStorage, and offers no benefit.
- **Native SharedPreferences through GameShell.** Rejected. It is the same exception
  problem as Preferences, with more first-party native code to review.
- **Filesystem plugin / JSON file.** Rejected. It needs another plugin and is overkill.
- **Versioned wrapper object for the best score.** Rejected. F20 AC12 says only a single
  whole number is stored, and the F20 AC9 test inputs assume a bare JSON number.
- **Keeping Android Auto Backup on (restoring the best on a new phone).** Rejected. It is
  effectively a cloud save (M7.6) and adds a Data safety nuance.

## Consequences
- One persistence implementation serves both platforms, so no exception is needed unless
  verification fails.
- Known residual risk (MR1): Chromium batches storage commits, so a kill right after a
  write could lose that write. It is covered by the step-7 kill test and the contingency.
- On a new phone the best score starts at 0 (no backup). This is consistent with M7.4 and
  M7.6.
- Traces to: F20 AC1-AC15, M4.6, M7.1-M7.6, M11.3, `docs/PRD-addendum-v3.md` architect note,
  W-ADR-0005 pattern; `mobile-architecture.md` §9.
