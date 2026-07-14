---
name: security-compliance-checklist
description: Security and compliance checklist applied to architecture, data models, and code. Use whenever security-compliance-reviewer runs (both passes), and by solution-architect / data-storage-architect as a pre-check before their docs go to review.
model: opus
effort: high
---

# Security & Compliance Checklist

This skill forces a higher reasoning tier (opus, high effort) regardless
of which subagent loads it, since security/compliance findings are the
highest cost-of-error category in this pipeline.

## Application security
- Input validation and output encoding at every trust boundary
- AuthN/AuthZ enforced server-side, never trusted from client
- Secrets never in source, config files, or container images — use a
  secrets manager or injected environment variables
- Dependency versions pinned; no known-CVE versions in use
- Error messages don't leak internals (stack traces, paths, versions)

## Data protection
- PII/sensitive fields identified and classified (see
  data-modeling-standards skill)
- Encryption in transit (TLS) and at rest for sensitive data
- Data retention policy matches stated compliance requirements
- Least-privilege access to data stores

## Compliance (adapt to applicable framework — GDPR/CCPA/SOC2/HIPAA/etc.)
- Lawful basis / consent captured for data collection, if applicable
- Right-to-deletion / data export supported if required
- Audit logging exists for access to sensitive data
- Data residency requirements met, if applicable

## Infrastructure / deployment
- No hardcoded credentials or private keys in Dockerfiles or compose files
- Container runs as non-root
- CA certificates sourced from a trusted, documented location (see
  cert-management skill), not vendored ad hoc

## Output format for findings
Each finding: `[CRITICAL|HIGH|MEDIUM|LOW] <location> — <issue> — <why it
matters> — <suggested remediation>`. PASS requires zero CRITICAL/HIGH
findings outstanding.
