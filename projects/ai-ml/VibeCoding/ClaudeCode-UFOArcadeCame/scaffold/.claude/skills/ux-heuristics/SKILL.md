---
name: ux-heuristics
description: Usability heuristics and accessibility baseline questions. Use by ui-ux-designer in both early and late review rounds.
---

# UX Heuristics

Inherits invoking subagent's model.

## Core heuristics (adapted from Nielsen)
- Visibility of system status — does the user know what's happening?
- Match between system and real world — familiar language, not jargon.
- User control — can mistakes be undone easily?
- Consistency — same action, same result, everywhere in the product.
- Error prevention — does the design prevent mistakes before they happen?
- Recognition over recall — don't make users remember information
  across steps.
- Flexibility — does it work for both novice and power users?
- Minimalist design — no unnecessary information competing for
  attention.
- Help users recognize, diagnose, and recover from errors — error
  messages are specific and suggest a fix.

## Accessibility baseline (WCAG-inspired)
- Sufficient color contrast; not color-alone as the only signal.
- Keyboard-navigable if a visual UI.
- Alt text / labels for non-text content.
- Focus order is logical.

## Standing questions for every flow reviewed
- What happens if the user does X wrong at this step?
- Is every error state accounted for and actionable?
- Is this the shortest reasonable path to value?
- Would a first-time user understand this without a support ticket?

## Findings format
`[Flow/Screen] — [Heuristic violated] — [Specific issue] — [Suggested
fix]`. Findings must be specific enough to act on without re-deriving
the problem.
