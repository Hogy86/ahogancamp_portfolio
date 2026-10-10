---
name: tool-stack-decision-criteria
description: Decision matrix for choosing languages, frameworks, databases, and hosting. Use by solution-architect when selecting the tool stack.
---

# Tool Stack Decision Criteria

Inherits invoking subagent's model (no override needed — this is a
structured checklist, not a judgment call in itself).

## Evaluate every candidate stack against:
1. **Team familiarity** — what can be maintained without a long ramp-up?
2. **Scaling needs** — expected load today vs. in 12-24 months; does the
   stack bend or break under that growth?
3. **Licensing** — any GPL/AGPL or other license incompatible with the
   product's distribution model?
4. **Hosting constraints** — does it run where the owner needs it to run
   (cloud provider, on-prem, air-gapped)?
5. **Ecosystem maturity** — library support for the specific integrations
   this product needs (payments, auth, etc.)
6. **Operational cost** — managed-service cost vs. self-hosted maintenance
   burden.
7. **Long-term support** — is the stack actively maintained with a
   realistic lifespan beyond this project?

## Output requirement
Document the decision as an ADR (see doc-templates skill) that names the
alternatives considered and why each was rejected — not just the winner.
A stack choice with no rejected alternatives listed is not yet justified.
