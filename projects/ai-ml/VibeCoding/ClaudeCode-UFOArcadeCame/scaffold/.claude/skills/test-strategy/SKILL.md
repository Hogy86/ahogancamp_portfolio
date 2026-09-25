---
name: test-strategy
description: Coverage thresholds and test-design conventions used by test-writer and test-validator.
---

# Test Strategy

Inherits invoking subagent's model.

## Coverage expectations
- Every PRD acceptance criterion has at least one test mapped to it.
- Critical paths (auth, payment, data mutation) require both unit and
  integration coverage.
- Edge cases and error states are tested, not just the happy path.

## What makes a valid test (vs. a tautological one)
- Asserts observable behavior/output, not internal implementation detail
  that would break on a harmless refactor.
- Fails when the acceptance criterion is violated — verify this by
  mentally (or actually) breaking the code and confirming the test would
  catch it.
- Test names describe the behavior under test, not just "test1".

## Unit vs. integration split
- Unit: isolated logic, fast, no external dependencies (mock them).
- Integration: real interactions between components (DB, API, etc.) for
  flows that unit tests can't validate alone.

## test-validator's independent check
- Re-derive: does each test actually map to a stated acceptance
  criterion? Flag orphan tests (no criterion) and uncovered criteria
  (no test).
- Run the suite; a reported PASS from test-writer isn't accepted without
  test-validator independently re-running it.
