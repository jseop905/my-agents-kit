---
name: testing-strategy
description: Decides whether, what, and when to test — risk-based scope, situational timing, and test maintenance. Use to decide if code needs a test before writing one, or to judge whether a change is adequately tested.
---

# Testing Strategy

## Overview

Not all code earns a test. This decides *whether* to test, *what* to test, and *when* — so effort goes where defects are costly, not everywhere. For *how* to write a test once you've decided to, see `test-driven-development` and `testing-patterns`.

## What to Test (risk-based)

Test where a defect is likely or costly:

- **Bug fixes — always.** A reproduction test that fails first, then passes (the Prove-It pattern). This is the highest-ROI test: it stops the same bug from returning.
- **Core / complex logic.** Branching logic, calculations, state machines — anything with edge cases.
- **Public interfaces / contracts.** Code other modules or callers depend on.

Skip it (a test adds little):

- Trivial glue and pass-through code
- One-off scripts and throwaway spikes
- UI scaffolding with no logic
- Code whose correctness is obvious from reading it

When unsure, ask: *"if this breaks silently, how much does it cost to find out?"* High cost → test it.

## When to Write It (situational)

- **Bugs → test-first.** Reproduce before fixing (Prove-It).
- **Core logic with a clear spec → test-first.** The test sharpens the design when behavior is well-defined.
- **Exploratory / uncertain code → test-after**, once the shape settles. Don't lock in a design you're still discovering.
- **Skippable code → no test.**

Strict test-first-everything (TDD as dogma) is not required. Match the timing to how well you understand the target.

## Maintaining Tests

- Change tests in the **same commit** as the code they cover.
- When a test breaks after a change, decide first: **is the test wrong, or the code wrong?** Fix the right one — never weaken or delete a test just to make it pass.
- Delete tests for removed behavior deliberately — don't let obsolete tests rot in the suite.

## See Also

- `test-driven-development` — the test-first cycle and how to write a good test
- `testing-patterns` (in the `test-driven-development` skill) — concrete assertion, mocking, and structure patterns
