# Smoke Test Plan — Vanguard vs. Sentinels: Shield Invaders

**Stage:** 17 — Product Manager (final gate)
**Date:** 2026-07-06
**Target:** deployed container `scaffold-vanguard-vs-sentinels-1`
(image `vanguard-vs-sentinels:latest`), serving http://localhost:8080/

## Purpose & scope

Smoke tests verify the **deployed artifact is fundamentally alive and
correctly configured** — not full gameplay correctness. Gameplay and
functional acceptance were already validated by UAT against the dev
server (`docs/tests/uat-results.md`). These checks are fast, binary
(PASS/FAIL), and run against the **live running container**, not a local
dev build.

## Sources

- `docs/deployment/deployment-notes.md` — what was deployed, how, and the
  hardening claims being independently re-confirmed here.
- `docs/security/security-review-v2.md` — the security controls
  (CSP, headers, non-root, read-only rootfs) that S-05/S-06 re-verify.
- `uat-smoke-test-design` skill — smoke tests are infra-focused,
  seconds-fast, binary.

## Checks

| ID | Check | Method | Pass condition |
|----|-------|--------|----------------|
| S-01 | Container running & healthy | `docker ps`, `docker inspect --format '{{.State.Health.Status}}'` | Status `running`, health `healthy`, RestartCount low (no crash loop) |
| S-02 | Root serves the real game (not default/placeholder nginx page) | `curl -s http://localhost:8080/` | HTTP 200 and body contains `<title>Vanguard vs. Sentinels: Shield Invaders</title>` and `id="game-canvas"` |
| S-03 | Health endpoint responds | `curl http://localhost:8080/healthz` | HTTP 200, body `ok` |
| S-04 | Built JS/CSS assets referenced by index.html are reachable | `curl` each `/assets/*.js` and `/assets/*.css` path parsed from the served index.html | Each returns HTTP 200 with the correct content-type (not 404) |
| S-05 | Security headers present on responses | `curl -D -` on `/` | `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` all present (independently re-confirming deployment-engineer's claims) |
| S-06 | Container hardened as configured | `docker inspect` + `docker exec ... id` | `Config.User=nginx` (uid 101, non-root), `HostConfig.ReadonlyRootfs=true`, `CapDrop=[ALL]`, `SecurityOpt=[no-new-privileges:true]` |
| S-07 | Nonexistent paths behave correctly (no 200-for-missing-asset, no crash/5xx) | `curl` a nonexistent asset and a nonexistent page | Nonexistent **asset** (e.g. `/assets/nope.js`) returns real **404**; nonexistent **page** path returns the SPA `index.html` (200) *by design* — see note below; no 5xx anywhere |

### Note on S-07 and SPA routing

The running nginx config (verified via `nginx -T`) uses:
- `location /` → `try_files $uri $uri/ /index.html` — an **intentional
  single-page-app fallback**. Any nonexistent *page* path serves the
  game's `index.html` (HTTP 200) so client-side routing works. This is
  expected and correct for a client-side game, not a defect.
- `location ~* \.(js|css|map|svg|...)$` → `try_files $uri =404` — missing
  **assets** return a real 404 rather than silently falling back to HTML.

The meaningful smoke assertion is therefore: **missing assets return 404**
(catches broken/mismatched build hashes) and **the server never 5xx's or
crashes** on unexpected input. The HTML fallback for page paths is a
deliberate design choice, documented here so it isn't mistaken for a
failure.

## Verdict rule

All checks must PASS. Any FAIL means the pipeline is **not** complete and
routes back to deployment-engineer (infra) or further upstream
(functional), per gate discipline — never a silent re-mark.
