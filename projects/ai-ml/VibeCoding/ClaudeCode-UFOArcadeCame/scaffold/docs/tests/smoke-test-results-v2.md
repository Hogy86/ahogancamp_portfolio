# Smoke Test Results — v2 Feature Update Redeployment

**Date:** 2026-07-08
**Executed by:** main pipeline session, against the rebuilt/redeployed container

## Verdict: PASS

No Dockerfile/dependency changes were needed for v2 (no new runtime dependencies, same build/serve pipeline as v1) — this was a straight rebuild-and-redeploy of the existing infrastructure with the new application code.

## Checks performed

| Check | Result |
|---|---|
| `docker compose up --build -d` | Built and started successfully, no errors |
| Container health status | `healthy` (Docker healthcheck passing) |
| `GET /` returns 200 with the real built HTML | PASS |
| Security headers present (CSP, X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy) | PASS — all present, unchanged from v1's hardening |
| `GET /healthz` | 200 |
| Deployed JS bundle contains new v2 strings ("GAME COMPLETE", "BOSS INCOMING") | PASS — confirms the actual v2 code is what's running, not a stale v1 build |
| `GET` on a real asset path | 200 |
| `GET` on a nonexistent asset path | 404 (correct — confirms a broken build would still be caught, distinct from the intentional SPA-fallback behavior on missing *page* routes) |
| Container security posture (`docker inspect`) | Non-root (`nginx`), read-only rootfs, all capabilities dropped, `no-new-privileges` — all unchanged from v1 |

## Gate decision

**PASS.** The v2 feature update (F11-F19) is deployed and verified running correctly in its production-shaped container. This closes out the v2 pipeline.
