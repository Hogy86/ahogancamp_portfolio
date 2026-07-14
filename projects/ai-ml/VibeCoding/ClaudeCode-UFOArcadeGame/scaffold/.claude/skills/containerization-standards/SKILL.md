---
name: containerization-standards
description: Docker build and image conventions. Use by deployment-engineer.
---

# Containerization Standards

Inherits invoking subagent's model.

## Build
- Multi-stage builds: build stage separate from runtime stage, so build
  tools don't ship in the final image.
- Pin base image versions explicitly (no `:latest`).
- Minimize final image size — only runtime dependencies in the last
  stage.

## Runtime
- Container runs as a non-root user.
- Read-only filesystem where the app allows it; explicit volumes for
  anything that must be writable.
- Health check defined (`HEALTHCHECK` or compose equivalent) so
  orchestration and smoke tests have something concrete to probe.

## Secrets & config
- No secrets baked into the image or committed to the Dockerfile.
- Configuration via environment variables or mounted config, documented
  in deployment-notes.md.

## Networking / certs
- See cert-management skill for CA certificate handling specifically.
- Expose only the ports the app actually needs.

## Verification before handoff
- Image builds cleanly from a fresh checkout (no reliance on local
  build cache/state).
- Container starts and passes its health check without manual
  intervention.
