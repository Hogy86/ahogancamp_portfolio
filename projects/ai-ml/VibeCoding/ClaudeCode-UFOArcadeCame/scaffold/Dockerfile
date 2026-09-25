# syntax=docker/dockerfile:1
#
# Vanguard vs. Sentinels: Shield Invaders — deployment container.
#
# This is a fully static, client-side app (TypeScript + Vite + Canvas,
# no backend, no database — see docs/architecture/solution-architecture.md
# "Deployment Shape"). This Dockerfile builds the static bundle in a
# throwaway build stage, then serves it from a minimal, non-root,
# read-only-rootfs-compatible nginx stage.
#
# Security hardening implemented here traces to
# docs/security/security-review-v2.md carry-forward items for step 16:
#   1. npm audit is clean (0 vulnerabilities) as of that review — re-run
#      `npm audit` in CI as a standing check (not repeated at image-build
#      time to keep builds reproducible/offline-friendly).
#   2. Strict CSP + security headers — configured in deploy/nginx/nginx.conf,
#      not in this Dockerfile.
#   3. Non-root, read-only rootfs, no-new-privileges — non-root user is set
#      below; read-only rootfs + no-new-privileges + cap-drop are enforced in
#      docker-compose.yml (filesystem mode is a runtime property, not an
#      image property).
#   4. No secrets or private keys are baked into this image at any stage.

# ---- Stage 1: build ----
# Pinned exact digest-free but version-pinned tag (no `:latest`).
FROM node:20.19.0-alpine3.20 AS build

WORKDIR /app

# Install dependencies first for better layer caching. Uses the committed,
# pinned lockfile (security-review-v2.md constraint 4) with `npm ci` for
# reproducible installs — dev dependencies only, none of which ship to the
# final stage.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public

RUN npm run build

# ---- Stage 2: runtime ----
# Minimal static-serving image. Pinned exact version, Alpine-based for a
# small final image.
FROM nginx:1.27.3-alpine3.20-slim AS runtime

# Custom nginx config: security headers/CSP, non-privileged temp paths for a
# read-only root filesystem, logs to stdout/stderr.
COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf

# Only the built static bundle is copied in — no source, no node_modules,
# no build tooling, no secrets ship in the final image.
COPY --from=build /app/dist /usr/share/nginx/html

# Create a non-root user to own/serve the content and run the nginx master
# process. nginx:alpine already ships an `nginx` user (uid 101); reuse it
# instead of creating a new one, and make sure it owns what it needs to.
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && touch /tmp/nginx.pid \
    && chown nginx:nginx /tmp/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
