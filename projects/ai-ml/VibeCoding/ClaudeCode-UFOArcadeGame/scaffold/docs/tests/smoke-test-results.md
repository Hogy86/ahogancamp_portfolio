# Smoke Test Results — Vanguard vs. Sentinels: Shield Invaders

**Stage:** 17 — Product Manager (final gate)
**Date:** 2026-07-06
**Executed against:** live container `scaffold-vanguard-vs-sentinels-1`
(image `vanguard-vs-sentinels:latest`) at http://localhost:8080/
**Plan:** `docs/tests/smoke-test-plan.md`

## Verdict: **PASS** — all 7 checks passed.

The deployed container is up, healthy, serving the real game, hardened as
designed, and behaves correctly on missing paths. The pipeline's final
gate is satisfied.

## Results

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| S-01 | Container running & healthy | **PASS** | `docker ps` → `Up (healthy)`; `docker inspect` → `State.Health.Status=healthy`, `Status=running`, `RestartCount=0` (no crash loop) |
| S-02 | Root serves the real game | **PASS** | `curl /` → HTTP 200; body contains `<title>Vanguard vs. Sentinels: Shield Invaders</title>` and `<canvas id="game-canvas" ...>` — this is the built game, not the default nginx welcome page |
| S-03 | Health endpoint responds | **PASS** | `curl /healthz` → HTTP 200, body `ok` |
| S-04 | Built JS/CSS assets reachable | **PASS** | Asset paths parsed from served index.html: `/assets/index-D36T071i.js` → 200 (`application/javascript`), `/assets/index-OOnoIODe.css` → 200 (`text/css`). No 404s. |
| S-05 | Security headers present | **PASS** | `curl -D - /` response includes `Content-Security-Policy: default-src 'self'; ...`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` (plus bonus `X-Frame-Options: DENY`, `Permissions-Policy`). Independently re-confirmed, not taken on trust. |
| S-06 | Container hardened as configured | **PASS** | `docker inspect` → `Config.User=nginx`, `ReadonlyRootfs=true`, `CapDrop=[ALL]`, `SecurityOpt=[no-new-privileges:true]`; `docker exec ... id` → `uid=101(nginx) gid=101(nginx)` (confirmed non-root at runtime) |
| S-07 | Nonexistent paths behave correctly | **PASS** | Missing **asset** `/assets/nope.js` → real **404**; missing **page** `/foo/bar/baz` and `/this-does-not-exist-12345.html` → 200 serving the SPA `index.html` **by design** (nginx `try_files ... /index.html`, verified via `nginx -T`); no 5xx observed on any route |

## Raw evidence captured during the run

**Container status**
```
NAMES                              STATUS                   PORTS
scaffold-vanguard-vs-sentinels-1   Up (healthy)             0.0.0.0:8080->8080/tcp
State.Health.Status = healthy
RestartCount=0  Status=running
```

**Root page (S-02, S-05) — `curl -s -D - http://localhost:8080/`**
```
HTTP/1.1 200 OK
Server: nginx/1.27.3
Content-Type: text/html
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Frame-Options: DENY
Permissions-Policy: geolocation=(), microphone=(), camera=()
...
<title>Vanguard vs. Sentinels: Shield Invaders</title>
<script type="module" crossorigin src="/assets/index-D36T071i.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-OOnoIODe.css">
...
<canvas id="game-canvas" width="800" height="600"></canvas>
```

**Health, assets, timing (S-03, S-04) — status + total time per route**
```
200  0.003s  /
200  0.003s  /healthz            (body: "ok")
200  0.003s  /assets/index-D36T071i.js    (application/javascript)
200  0.004s  /assets/index-OOnoIODe.css   (text/css)
```
All primary routes respond in ~3 ms; no TLS involved (plain HTTP on 8080
by design — TLS is a reverse-proxy responsibility per deployment-notes.md).

**Hardening (S-06)**
```
Config.User            = nginx
ReadonlyRootfs         = true
CapDrop                = [ALL]
SecurityOpt            = [no-new-privileges:true]
docker exec ... id     = uid=101(nginx) gid=101(nginx) groups=101(nginx)
```

**Missing-path behavior (S-07)**
```
/assets/nope.js               -> HTTP 404   (real 404 for missing asset)
/foo/bar/baz                  -> HTTP 200   (SPA index.html fallback, by design)
/this-does-not-exist-12345.html -> HTTP 200 (SPA index.html fallback, by design)
nginx -T: location / { try_files $uri $uri/ /index.html; }
          location ~* \.(js|css|...)$ { try_files $uri =404; }
```

## Notes for the owner

- **No blocking issues.** Everything the container claims to do, it
  actually does — verified independently against the live artifact.
- **SPA fallback (S-07) is intentional and safe:** page-not-found paths
  return the game's index.html (client-side routing pattern), while
  *missing assets* correctly return 404 — so a broken build (mismatched
  asset hashes) would still be caught. No route returns a 5xx or crashes.
- **TLS is deliberately out of scope for this container** — it serves
  plain HTTP on 8080 and expects a reverse proxy / load balancer to
  terminate TLS in production (see `deployment-notes.md` "TLS"). For
  local/demo use this is correct as shipped. If a production deployment
  target is chosen later, that's a deployment-engineer follow-up, not a
  smoke-test failure.

## Gate outcome

Smoke test **PASS** → the final gate (step 17) is satisfied. The project
is complete per `.claude/CLAUDE.md` completion criteria.
