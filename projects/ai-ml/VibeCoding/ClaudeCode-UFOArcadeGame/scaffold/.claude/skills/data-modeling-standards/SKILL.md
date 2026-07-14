---
name: data-modeling-standards
description: Star-schema conventions, naming, and PII classification tags. Use by data-storage-architect.
---

# Data Modeling Standards

Inherits invoking subagent's model.

## Star schema conventions
- Fact tables: one row per transaction/event, named `fact_<event>` (e.g.
  `fact_login`, `fact_purchase`). Contains foreign keys to dimensions +
  measures (counts, durations, amounts).
- Dimension tables: `dim_<entity>` (e.g. `dim_user`, `dim_product`,
  `dim_time`). Slowly-changing dimensions noted explicitly (type 1 vs
  type 2).
- Surrogate keys for dimensions; natural keys preserved as attributes.

## PII classification
Tag every field as one of:
- `PUBLIC` — no restriction
- `INTERNAL` — internal use only, not PII
- `PII` — directly identifies a person (name, email, etc.)
- `SENSITIVE_PII` — health, financial, biometric, or similarly high-risk

Any `PII`/`SENSITIVE_PII` field must have a stated retention period and
access restriction — hand this list to security-compliance-reviewer
explicitly.

## Usage event schema (who/when/how)
Minimum fields: `user_id` (or anonymized equivalent), `timestamp`,
`event_type`, `context` (feature/page/action), `session_id`. Add fields
only when a specific analytics question requires them — avoid
collect-everything schemas.

## Logging schema
- Structured (JSON or equivalent), not free text.
- Include `correlation_id` / `request_id` to trace a request across
  services.
- Explicit retention policy per log category (debug vs. audit logs
  often differ).
