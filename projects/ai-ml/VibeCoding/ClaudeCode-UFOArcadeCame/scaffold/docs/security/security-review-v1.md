# Security & Compliance Review — Pass 1 (Architecture + Data Model)

**Target:** Vanguard vs. Sentinels: Shield Invaders — solution architecture + ADRs 0001-0005
**Reviewer:** security-compliance-reviewer (independent gate, pipeline step 6, pass 1)
**Date:** 2026-07-06
**Checklist applied:** `security-compliance-checklist` skill
**Scope note:** Fully client-side, no-backend, no-account, no-PII browser game. Step 5 (data-storage-architect) intentionally skipped per CLAUDE.md optional-roles; no separate data-model doc exists, so this is an architecture-only review. Data model reviewed as the localStorage/in-memory state described inline in the architecture and ADR-0005.

## Verdict: PASS

Zero CRITICAL and zero HIGH findings outstanding. The architecture is sound for its threat surface: no server, no secrets, no PII, no third-party runtime dependencies, no network at play time. `code-implementer` (step 7) is cleared to start. The findings below are MEDIUM and LOW — they are not gate-blockers, but each is a specific, actionable constraint that must be verified against the real implementation in pass 2 (step 12). They are recorded now so they cannot silently regress.

---

## Findings

### [MEDIUM] ADR-0005 §Decision item 2 / solution-architecture.md §Data Flow "Instrumentation persistence flow" (lines 140-143) — localStorage counters are read back and incremented but no read-side validation/sanitization is specified — user-controllable client state is trusted on read

The instrumentation flow is "counters are read/incremented/written to `localStorage` under a single namespaced key." `localStorage` is fully user-controllable (any user can open devtools and set `vvs:metrics` to `"not-json"`, `null`, a huge string, a nested object, or `{ sessionStart: "DROP" }`). ADR-0005 wraps the *access* in try/catch (Risk R7, for quota/private-mode), but a try/catch around `getItem` does **not** cover a successful read of malformed content that then fails at `JSON.parse` or produces `NaN`/`undefined` on `existing.counter + 1`.

Why it matters: without validation, a corrupted `vvs:metrics` value can throw inside the emit path (defeating the "never throw into the game loop" guarantee, Risk R7) or silently poison the counters. This is the one place in the whole design where externally-controllable data crosses a trust boundary and is read back.

Suggested remediation: specify that the read path (a) wraps `JSON.parse` in try/catch **in addition** to the access wrapper, (b) validates the parsed value is a plain object of finite integer counters and discards/reinitializes it otherwise (fail closed to a fresh counter object), and (c) never trusts the shape. Call this out as a code-review assertion for pass 2. This is a design-level clarification, not a redesign.

### [MEDIUM] solution-architecture.md §Component responsibilities "HUD overlay (DOM)" (line 78) + ScreenController (line 79) — DOM overlays are built from state; the safe-DOM-construction method (textContent, not innerHTML) is not specified as a contract

The HUD and the non-play screens (title, pause, Game Over, Victory, the F6 AC9 "Run ended — you may now close this tab" text) are rendered as **DOM elements** synced from a view-model. All current inputs to that view-model are internally-computed numbers (score, lives, level, multiplier) with no user-entered free text, so today the XSS surface is effectively nil. However, the architecture does not state the DOM-writing contract, and the F7 AC10 multiplier readout ("Power ×3.24") and F6 AC9 text are string-formatted for display.

Why it matters: the risk is not the current data — it is that "build DOM from a string" without a stated `textContent`/`createTextNode`-only rule is exactly how an `innerHTML` habit slips in, becoming a latent XSS sink the moment any future field carries external content. Establishing the contract now costs nothing and makes pass-2 verification a one-line check.

Suggested remediation: state as a rendering contract that all HUD/overlay text is written via `textContent`/`createTextNode` (never `innerHTML`/`insertAdjacentHTML` with interpolated values). Verify in pass 2 against the actual renderer/ScreenController code.

### [MEDIUM] ADR-0004 §Decision "anti-motif design rules" (lines 42-52) / NFR-10 / F9 AC4 — the IP-compliance mechanism is a set of prose prohibitions with no positive verification gate defined at the code level

The IP constraint (the project's highest-cost compliance item, correctly flagged as Risk R6) is architecturally well-placed: procedural vector draw functions in source are line-by-line auditable, which is a genuinely stronger anti-infringement posture than raster/generated/third-party art (ADR-0004 alternatives A-D are correctly rejected). The architecture *does* structurally prevent whole classes of infringement: no third-party wordmarks/logos, no third-party hosted fonts (self-hosted/system stack only, ADR-0004 line 52 + solution-architecture.md line 157), no external art packs.

However, ADR-0004's assurance is a list of "must not" prohibitions (no red-white-blue concentric-star shield, no trademarked robot silhouette). Prohibitions are necessary but not self-verifying — they prevent the two named motifs but do not by themselves guarantee an implementer's shield/robot shapes are clear of *other* trademark-adjacent designs, and there is no defined positive check ("shield reviewed against the named prohibitions and signed off") wired into a gate.

Why it matters: NFR-10/F9 AC4 is a hard, binding, non-contingent constraint. The approach substantially reduces the surface and makes review *possible*, but the final guarantee still rests on a human motif judgment at pass 2 / ui-ux-designer round 2. That is acceptable and correctly routed (Risk R6 names both gates), but it must be an explicit, recorded sign-off, not an implicit assumption.

Suggested remediation: no architecture change required. Record here that the IP sign-off is a mandatory, explicit pass-2 gate item: pass 2 must inspect the actual shield/robot/power-up draw functions and record an affirmative "reviewed against F9 AC4 prohibitions — clear" verdict (co-gated with ui-ux-designer round 2 per Risk R6). Flagging so it is not treated as closed by ADR-0004's prose alone.

### [MEDIUM] solution-architecture.md §Deployment Shape (lines 164-178) + §Security & Compliance Pre-Check "Infrastructure/deployment" (lines 254-260) — deployment security posture is stated as prose intent but is not yet a binding constraint on step 16; several static-hosting hardening defaults are unspecified

The architecture correctly hands deployment-engineer (step 16) the right intent: non-root container, read-only static assets, no secrets, no outbound network, no DB, TLS as a deployment concern. This is good and matches the checklist's infrastructure section. Because deployment-engineer builds the container next, this review should constrain that step now.

Gaps to constrain before/at step 16 (verify in pass 2, since the Dockerfile/compose will exist by then):
- **Non-root + read-only-rootfs are stated as "should," not "must."** They should be binding acceptance criteria for the container (`USER` non-root, read-only filesystem, `no-new-privileges`, drop capabilities).
- **Response security headers are unspecified.** For a static bundle, a restrictive **Content-Security-Policy** is the single most valuable hardening and directly reinforces the two DOM findings above. Given zero runtime third-party dependencies (ADR-0001) and self-hosted/system fonts only (ADR-0004), a tight CSP is achievable: e.g. `default-src 'self'`, no `unsafe-inline`/`unsafe-eval` for scripts (Vite output supports this), `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`. Also recommend `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`.
- **The `certs/`, nginx `https.conf.template`, and `generate-selfsigned` script visible in the wider repo tree** (from a prior related project) must not vendor private keys or ad-hoc CA material into this deliverable — the checklist's "CA certificates from a trusted, documented source, not vendored ad hoc" item. Architecture already says CA/TLS material is sourced per the deployment stage's documented process (line 259-260); pass 2 must confirm no private key is committed or baked into the image.

Why it matters: a static game has almost no application attack surface, so the deployment layer is where the remaining realistic hardening lives. These are cheap defaults that make the CSP/DOM/localStorage findings defense-in-depth.

Suggested remediation: treat the above as the binding constraint set handed to step 16, and verify each against the actual Dockerfile/compose/server config in pass 2. No change to the current architecture doc is required to pass this gate.

### [LOW] solution-architecture.md §Tool Stack (lines 106-110) + §Security Pre-Check "Dependency pinning" (lines 231-233) — dev/build dependency supply-chain control is asserted (pinned, lockfile, CVE-scanned) but no lockfile or `package.json` exists yet to verify

The stack correctly ships **zero runtime third-party dependencies** to the player (ADR-0001) — this eliminates the CDN/runtime supply-chain surface entirely, which is the strongest possible answer to that checklist item. The residual supply-chain exposure is dev/build-time only (Vite, TypeScript, Vitest, lint/format), which cannot reach the player but can affect the build.

Why it matters: at pass 1 there is no `package.json`/lockfile to inspect, so "pinned and CVE-scanned" is a stated intention, not a verified fact. This is LOW because it cannot affect the shipped artifact's runtime, but a compromised build dependency could still tamper with the bundle.

Suggested remediation: verify in pass 2 that a committed lockfile exists, versions are pinned, and a dependency audit (e.g. `npm audit`/equivalent) shows no known-CVE build dependencies. No action needed now beyond recording the deferral.

### [LOW] ADR-0002 §Consequences (lines 127-129) / §Decision item 5 — the "no setTimeout/setInterval/wall-clock" constraint is a correctness invariant with a minor security-adjacent benefit; ensure it is an enforced code-review item

ADR-0002 correctly mandates that all timed effects use the remaining-duration pattern and forbids `setTimeout`/`setInterval`/`Date.now()` in the sim. This is primarily a correctness rule (pause/timer-drift, F6 AC7), but it also keeps timing deterministic and avoids dangling async callbacks that outlive a state transition (e.g. a stray timer firing into a torn-down Game Over screen). No security defect exists here; noting it only to ensure pass 2 confirms the implementation honors it, since a violation would reintroduce the async-race class ADR-0002 designed out.

Suggested remediation: confirm in pass 2 that no `setTimeout`/`setInterval`/`Date.now()`/`performance.now()`-for-timers appears in simulation/system code (grep-verifiable). Already named as a code-review hook in ADR-0002; this just links it to the pass-2 checklist.

---

## Checklist disposition summary

| Checklist area | Disposition |
|---|---|
| Input validation at trust boundaries | Keyboard input whitelisted (correct). **localStorage read-back not validated — MEDIUM finding.** |
| Output encoding / XSS | No user free-text today; **DOM-construction contract (textContent-only) unspecified — MEDIUM finding.** |
| AuthN/AuthZ | N/A — no server, no accounts (correctly dispositioned). |
| Secrets in source/config/image | None exist; correct. Verify no private keys vendored at step 16 (folded into deployment finding). |
| Dependency pinning / CVEs | Zero runtime deps (strong). Build-dep pinning **unverifiable at pass 1 — LOW finding.** |
| Error messages leak internals | Player-facing states only; instrumentation failures swallowed. Adequate. |
| PII identified/classified | None collected; anonymous integer counters only. Correct and well-reasoned (ADR-0005). |
| Encryption in transit/at rest | No sensitive data; TLS is a deployment concern (folded into deployment finding). |
| Compliance (GDPR/CCPA) | No personal data → no obligations triggered; future-telemetry re-review trigger correctly flagged. |
| Infra: non-root, read-only, no creds | Stated as intent; **must be made binding for step 16 — MEDIUM finding.** |
| CA/TLS sourcing | Deferred to documented deployment process; **verify no ad-hoc/vendored key at pass 2.** |
| IP/originality (NFR-10/F9 AC4) | Architecture materially reduces surface; **positive sign-off must be an explicit pass-2 gate — MEDIUM finding.** |

---

## Gate decision and handoff

**PASS.** `code-implementer` (step 7) may proceed. No FAIL — nothing here changes scope, risk, or direction enough to require product-manager owner escalation; these are implementation-and-deployment verification items, not architectural defects.

The five MEDIUM/LOW findings are carried forward as the **pass-2 (step 12) verification checklist**, to be re-run against the real code and the actual Dockerfile/server config:
1. localStorage read path validates/sanitizes and fails closed (MEDIUM).
2. All HUD/overlay DOM text via `textContent`/`createTextNode`, never `innerHTML` (MEDIUM).
3. Explicit affirmative IP sign-off against F9 AC4 prohibitions on the actual draw functions, co-gated with ui-ux-designer round 2 (MEDIUM).
4. Container is non-root + read-only rootfs + `no-new-privileges`; a restrictive CSP and `nosniff`/`Referrer-Policy` headers are served; no private key committed or baked into the image (MEDIUM).
5. Committed pinned lockfile with a clean dependency audit; no `setTimeout`/`setInterval`/wall-clock timers in sim code (LOW).

**Reviewed:**
- `docs/PRD.md`
- `docs/architecture/solution-architecture.md`
- `docs/architecture/adr/0001-stack-and-canvas-rendering.md`
- `docs/architecture/adr/0002-fixed-timestep-loop-and-state-machine.md`
- `docs/architecture/adr/0003-data-driven-level-config.md`
- `docs/architecture/adr/0004-procedural-vector-assets.md`
- `docs/architecture/adr/0005-client-side-instrumentation.md`
