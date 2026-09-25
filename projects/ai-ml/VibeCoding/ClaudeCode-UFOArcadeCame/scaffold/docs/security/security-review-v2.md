# Security & Compliance Review — Pass 2 (Final Code + Data Flows)

**Target:** Vanguard vs. Sentinels: Shield Invaders — implemented source under `scaffold/src/`, `index.html`, `dist/index.html`, `package.json`, `package-lock.json`
**Reviewer:** security-compliance-reviewer (independent gate, pipeline step 12, pass 2)
**Date:** 2026-07-06
**Checklist applied:** `security-compliance-checklist` skill

## Verdict: PASS

Zero CRITICAL and zero HIGH findings outstanding. All five pass-1 binding constraints are correctly implemented in the actual code and independently verified below (not rubber-stamped). The IP/asset compliance sign-off is affirmed against the real draw functions. Test files introduce no risk. The end-to-end data flow contains no network egress and no PII. `docs-writer` (step 13) is cleared to proceed.

---

## Binding-constraint re-verification

### Constraint 1 — localStorage read path validates + fails closed — PASS
`Instrumentation.ts`: `JSON.parse` wrapped in its own try/catch, independent of the storage-access try/catch; `isFiniteIntegerCounterMap` rejects non-objects/null/arrays/non-finite-integer values; fails closed to `{}`. Confirmed by 13 adversarial test cases.

### Constraint 2 — all HUD/overlay DOM text via textContent/createTextNode, never innerHTML — PASS
`ui/dom.ts` is the sole text path (textContent only). The recently-added aria-live/role attributes in `ScreenController.ts` use `setAttribute` only — no innerHTML introduced. Codebase-wide grep for `innerHTML|insertAdjacentHTML|outerHTML|document.write`: zero hits in production code.

### Constraint 3 — zero setTimeout/setInterval/Date.now/performance.now-as-timer in sim/system code — PASS
Grep across `src/core` and `src/systems`: no matches outside doc comments explicitly documenting their absence. All effect timers use the fixed-timestep remaining-duration/`dt` pattern.

### Constraint 4 — committed pinned lockfile with clean audit — PASS
`package-lock.json` committed, `lockfileVersion: 3`, 294 packages with integrity hashes, zero runtime deps ship to the player. **`npm audit` executed independently: 0 vulnerabilities.**
- **[LOW]** `package.json` specifies `jsdom` as `^24.1.3` (caret) while other devDependencies are exact-pinned; lockfile pins it exactly so builds are reproducible today. Recommend aligning to an exact pin for consistency. Non-blocking.

### Constraint 5 — no eval/Function constructor, no inline-script/style-injection blocking a strict CSP — PASS
Zero `eval`/`new Function` hits. `index.html` and `dist/index.html` load only an external `type="module"` script + external stylesheet, no inline script/style. A strict `script-src 'self'` CSP is achievable with no code change.
- **[LOW]** `ScreenController.ts` sets `message.style.color` via CSSOM (not markup injection) — a maximally strict `style-src 'self'` without `'unsafe-inline'` would need this moved to a CSS class. Optional hardening for step 16.

---

## IP / asset compliance sign-off (F9 AC4 / NFR-10) — AFFIRMED, CLEAR

Independently re-inspected `src/render/shapes.ts`:
- **Shield**: plain angular kite/diamond, teal fill. Not a red-white-blue concentric-star disc.
- **Vanguard**: rounded-helmet/triangular-torso silhouette with a plain chevron chest emblem (not a star). No recognizable licensed likeness.
- **Sentinels**: generic blocky rectangle body, single circular sensor, angular boss crown. Not modeled on any trademarked robot silhouette.
- **Power-ups/laser**: abstract geometric glyphs. No logos/wordmarks.
- No third-party fonts loaded; no wordmarks anywhere; only original text strings ("VANGUARD vs. SENTINELS", "Shield Invaders", control hints).

**Affirmative verdict: reviewed against F9 AC4 prohibitions — CLEAR.**

---

## Full-codebase sweep for new risk since pass 1

- **Test files:** No secrets, no disabled security checks, no `.only`/skip masking failures. Test payloads (e.g. `<b>`/`<script>` strings, "DROP TABLE") are adversarial inputs that *verify* the validators/textContent contract, not injections.
- **Data flow end-to-end:** The only persistence sink in the codebase is `localStorage` under one namespaced key (`vvs:metrics`), storing anonymous integer counters only. Grep for `fetch|XMLHttpRequest|WebSocket|navigator.*|document.cookie`: zero network/egress calls anywhere. No PII → no GDPR/CCPA obligations triggered.
- **Correction to reviewer's initial note:** the reviewer's draft flagged `emit()` as apparently unused in production code (based on a grep of `main.ts` only). Independently re-checked: `emit()` **is** called from `src/core/GameStateMachine.ts` (`sessionStart`, `runRestart`), `src/systems/CollisionSystem.ts` (`powerUpCaught`), and `src/systems/WinLossSystem.ts` (`gameOver`, `victory`, `levelReached`) — NFR-8's instrumentation hooks are correctly wired. No functional gap; the initial note is withdrawn.

---

## Checklist disposition summary

| Checklist area | Disposition |
|---|---|
| Input validation at trust boundaries | localStorage read-back validates + fails closed — PASS. |
| Output encoding / XSS | textContent-only contract enforced; no innerHTML — PASS. |
| AuthN/AuthZ | N/A — no server, no accounts. |
| Secrets in source/config/image | None found. |
| Dependency pinning / CVEs | Pinned lockfile; `npm audit` — 0 vulnerabilities (confirmed executed). One LOW: `jsdom` caret pin. |
| Error messages leak internals | Player-facing state text only; instrumentation failures swallowed. |
| PII identified/classified | None collected; anonymous integer counters only. |
| Encryption in transit/at rest | No sensitive data; TLS is a step-16 concern. |
| Compliance (GDPR/CCPA) | No personal data → no obligations. |
| Infra: non-root/read-only/CSP/no keys | Deferred to deployment-engineer (step 16); build output is strict-CSP-compatible. |
| IP/originality (NFR-10/F9 AC4) | Affirmatively reviewed against real draw functions — CLEAR. |

---

## Gate decision and handoff

**PASS.** `docs-writer` (step 13) may proceed. No FAIL — nothing changes scope, risk, or direction.

Carry-forward items (non-blocking) for **deployment-engineer (step 16)**:
1. Run `npm audit` in CI as a standing check (already 0 vulnerabilities as of this review).
2. Serve a strict CSP (`default-src 'self'`; `script-src 'self'` no `unsafe-inline`/`unsafe-eval`; `object-src 'none'`; `base-uri 'none'`; `frame-ancestors 'none'`), plus `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`. Optionally refactor the one `style.color` assignment into a CSS class to avoid needing `style-src 'unsafe-inline'`.
3. Non-root + read-only-rootfs + `no-new-privileges` container; confirm no private key committed or baked into the image.
4. LOW: align `jsdom` in `package.json` to an exact pin (`24.1.3`).

**Reviewed:** `docs/PRD.md`, `docs/security/security-review-v1.md`, `src/instrumentation/Instrumentation.ts`, `src/ui/dom.ts`, `src/ui/HUDView.ts`, `src/ui/ScreenController.ts`, `src/render/shapes.ts`, `src/core/GameLoop.ts`, `src/core/GameStateMachine.ts`, `src/systems/CollisionSystem.ts`, `src/systems/WinLossSystem.ts`, `src/main.ts`, `src/config/constants.ts`, `index.html`, `dist/index.html`, `package.json`, `package-lock.json`.
