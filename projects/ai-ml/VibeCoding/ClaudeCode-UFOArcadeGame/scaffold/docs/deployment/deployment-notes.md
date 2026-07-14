# Deployment Notes — Vanguard vs. Sentinels: Shield Invaders

**Stage:** 16 — Deployment Engineer
**Date:** 2026-07-06
**Status:** built, run, and verified (see "Verification" below)

## What this is

A fully static, client-side game (TypeScript + Vite + Canvas, no backend, no
database — see `docs/architecture/solution-architecture.md` "Deployment
Shape"). The container is a two-stage build: a throwaway Node stage that runs
`npm ci && npm run build`, and a minimal `nginx:alpine`-based runtime stage
that serves the resulting `dist/` bundle with a hardened nginx config.

## How to build and run

```bash
docker compose up --build
```

The game is served at **http://localhost:8080/**. A health check endpoint is
available at `/healthz` (returns `200`).

To stop: `docker compose down`.

## Security hardening applied (traces to `docs/security/security-review-v2.md`)

| Control | Where | Verified |
|---|---|---|
| Non-root process | `Dockerfile` — reuses nginx:alpine's built-in `nginx` user (uid 101), no root fallback | `docker inspect` → `Config.User = nginx` |
| Read-only root filesystem | `docker-compose.yml` `read_only: true`, with `tmpfs` mounts for nginx's required scratch paths (`/tmp`, `/var/cache/nginx`, `/var/run`) so the read-only rootfs doesn't break nginx's normal operation | `docker inspect` → `HostConfig.ReadonlyRootfs = true` |
| `no-new-privileges` | `docker-compose.yml` `security_opt` | `docker inspect` → `SecurityOpt = [no-new-privileges:true]` |
| Drop all Linux capabilities | `docker-compose.yml` `cap_drop: [ALL]` — nginx serving static files needs none of them | `docker inspect` → `HostConfig.CapDrop = [ALL]` |
| Strict CSP | `deploy/nginx/nginx.conf` — `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'` | Confirmed present via `curl -D -` (see below) — achievable with zero code changes since the app has no runtime third-party dependencies and no inline scripts/styles (security-review-v2.md) |
| `X-Content-Type-Options: nosniff` | `deploy/nginx/nginx.conf` | Confirmed via `curl -D -` |
| `Referrer-Policy: no-referrer` | `deploy/nginx/nginx.conf` | Confirmed via `curl -D -` |
| Bonus hardening (not explicitly required, added as good practice) | `X-Frame-Options: DENY`, `Permissions-Policy: geolocation=(), microphone=(), camera=()` | Confirmed via `curl -D -` |
| No secrets/private keys in the image | Only `dist/` (build output) is copied into the runtime stage; no `.env`, credentials, or key material exist anywhere in this repo | Confirmed by inspection of `Dockerfile` `COPY` instructions |
| Pinned base images | `node:20.19.0-alpine3.20` (build stage), `nginx:1.27.3-alpine3.20-slim` (runtime stage) — no `:latest` tags | Confirmed via `Dockerfile` |
| Pinned, reproducible dependency install | `npm ci` against the committed, pinned `package-lock.json` | Confirmed via `Dockerfile` |

## Verification performed

- `docker compose up --build` — image built successfully (~19.7MB final image), container started and reported `healthy` via its `HEALTHCHECK`.
- `curl -s -D - -o /dev/null http://localhost:8080/` — confirmed `200 OK` and all of the headers listed in the table above present on the actual HTTP response.
- `curl -s http://localhost:8080/` — confirmed the served HTML is the game's real built `index.html` (not a placeholder/default nginx page).
- `curl -o /dev/null -w "%{http_code}" http://localhost:8080/healthz` — confirmed `200`.
- `docker inspect` — confirmed `Config.User=nginx`, `HostConfig.ReadonlyRootfs=true`, `HostConfig.CapDrop=[ALL]`, `HostConfig.SecurityOpt=[no-new-privileges:true]` all match the intended hardening.

## TLS

This container serves **plain HTTP on port 8080** and does not terminate TLS
itself. Per the cert-management skill's guidance and the app's minimal,
static-only nature (no cookies, no sessions, no user-submitted data — see
`docs/security/security-review-v1.md`/`v2.md`), TLS termination is treated as
a **reverse-proxy/host responsibility** rather than baked into this
container: in production, place this service behind a reverse proxy or cloud
load balancer (nginx, Caddy, Cloudflare, an ALB, etc.) that terminates TLS
using certificates from a trusted, documented source (e.g. Let's Encrypt,
your cloud provider's managed certs) and forwards plain HTTP to this
container internally. This keeps the container simple and avoids vendoring
or baking any certificate/key material into the image, consistent with the
"no secrets in the image" constraint above. For purely local/demo use,
`http://localhost:8080` is sufficient as shipped.

## Assumptions / limitations

- No environment variables or runtime configuration are needed — the game is
  a static bundle with all tuning baked in at build time (see
  `src/config/constants.ts` and `src/config/levelConfig.ts` if a rebuild with
  different balance values is ever wanted).
- `npm audit` should be re-run in CI as a standing check (security-review-v2.md
  carry-forward item 1) rather than at image-build time, to keep builds
  reproducible and usable offline.
- This is a v1 demo-scale deployment (single service, no orchestration,
  no autoscaling) — appropriate for the project's stated scope.
