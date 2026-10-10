---
name: cert-management
description: How CA certificates should be sourced, mounted, and verified in the container. Use by deployment-engineer.
---

# CA Certificate Management

Inherits invoking subagent's model.

## Sourcing
- Identify whether the deployment needs a corporate/internal CA bundle,
  a public CA (already trusted by base image), or both.
- Document the source of truth for the CA bundle (e.g., a specific
  internal artifact repository or secret store) — never hardcode a
  cert's contents directly into the Dockerfile as a literal.

## Mounting vs. baking in
- Prefer mounting certs at runtime (volume or secret mount) over baking
  them into the image, so rotation doesn't require a rebuild.
- If baking in is unavoidable (e.g., air-gapped deployment), document
  exactly which file goes where and how it gets updated.

## Verification
- After container start, verify TLS works against every internal
  endpoint the app depends on (`curl -v` or equivalent against each,
  checking for handshake success, not just HTTP 200).
- Verify the cert chain is complete (no "unable to get local issuer
  certificate" errors) and not expired.

## Rotation
- Document the rotation process in deployment-notes.md: where the new
  cert comes from, how it's deployed, whether a restart is required.
- Note the current cert's expiry date so it's not discovered by an
  outage.
