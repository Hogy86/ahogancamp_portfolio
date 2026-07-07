---
name: doc-templates
description: Templates for PRD, Solution Architecture Doc, README, glossary, and API docs. Use whenever product-manager, solution-architect, or docs-writer is producing one of these documents, to keep structure consistent across projects.
---

# Document Templates

Inherits the invoking subagent's model — this skill supplies structure,
not judgment, so no model override is set here.

## PRD template (docs/PRD.md)
```
# Product Requirements Document

## Summary
## Target Users (from market/voice-of-customer.md)
## Goals & Success Metrics (from market/market-goals-and-use-cases.md)
## Use Cases (prioritized)
## Features
  ### Feature N
  - Description
  - Acceptance Criteria (numbered, testable)
## Out of Scope
## Open Questions
```

## Solution Architecture Doc template (docs/architecture/solution-architecture.md)
```
# Solution Architecture

## Overview & Component Diagram (describe or link diagram)
## Tool Stack (with rationale, link ADRs)
## Data Flow
## Integration Points
## Deployment Shape
## Non-Functional Requirements (perf, scale, availability)
## Risks & Mitigations
```

## ADR template (docs/architecture/adr/000N-title.md)
```
# ADR N: <Title>
## Status: Proposed | Accepted | Superseded
## Context
## Decision
## Alternatives Considered (and why rejected)
## Consequences
```

## README template (docs/README.md)
```
# <Project Name>
## What this is (1-2 sentences)
## Setup
## Running it
## Configuration
## Links to PRD / Architecture / API docs
```

## Glossary template (docs/GLOSSARY.md)
```
# Glossary
Term | Definition | Source doc
```

## API doc guidance
- One entry per endpoint/operation.
- Every entry has a request example AND a response example with real
  (not placeholder) values matching the actual implementation.
