---
name: write-tests
description: Decides which code deserves a test and writes it — risk-based selection, situational test-first timing, and patterns for tests that verify behavior. Use when writing tests for new or changed code, adding a regression test for a bug fix, or judging whether a change is adequately tested.
---

# Write Tests

## Decide First: Does This Code Earn a Test?

Not all code does — test where a defect is likely or costly:

- **Bug fixes — always.** A reproduction test that fails first, then passes. Highest-ROI test: it stops the same bug from returning.
- **Core / complex logic.** Branching, calculations, state machines — anything with edge cases.
- **Public interfaces / contracts.** Code other modules or callers depend on.
- **Code about to be refactored.** If it lacks tests, add characterization tests first — pin the current behavior (quirks included) so the refactor can prove behavior didn't change.

Skip (a test adds little): trivial glue and pass-through code, one-off scripts, UI scaffolding without logic, code whose correctness is obvious from reading it.

When unsure, ask: *"if this breaks silently, how much does it cost to find out?"* High cost → test it.

## When to Write It

- **Bugs → test-first.** Reproduce before fixing (Prove-It, below).
- **Core logic with a clear spec → test-first.** The test sharpens the design.
- **Exploratory / uncertain code → test-after,** once the shape settles. Don't lock in a design you're still discovering.

Test-first-everything is not required — match the timing to how well the target is understood.

## Prove-It: The Bug-Fix Pattern

1. Write a test that demonstrates the bug.
2. Run it — it must FAIL, confirming the reproduction.
3. Implement the fix.
4. The test passes; run the full suite to check for regressions.

## How to Write a Good Test

- **Arrange–Act–Assert.** Set up preconditions, perform the action under test, verify the outcome.
- **Test state, not interactions.** Assert on outcomes, not on which methods were called internally.
- **Prefer real implementations.** Real > fake (in-memory) > stub (canned data) > mock (interaction checks) — reach for mocks last, and only at system boundaries (database, network, filesystem), never for business logic.
- **DAMP over DRY.** Each test tells a complete story without tracing through shared helpers.
- **One concept per test.** Multiple assertions are fine when they describe the same behavior; split unrelated concepts.
- **Name tests like specifications.** What behavior, under what condition — the name alone should explain a failure.

## Maintenance

- Change tests in the same commit as the code they cover.
- When a test breaks, decide first: is the test wrong, or the code wrong? Fix the right one — never weaken a test to make it pass.
- When a change deliberately removes behavior, remove its tests in the same change; don't let obsolete tests rot in the suite.

## Anti-patterns

| Anti-pattern | Problem | Instead |
|---|---|---|
| Testing implementation details | Breaks on refactor | Test inputs and outputs |
| Snapshot everything | No one reviews snapshot diffs | Assert specific values |
| Shared mutable state between tests | Tests pollute each other | Set up / tear down per test |
| Testing third-party code | Wastes time; not your bug | Mock at that boundary |
| Overly broad assertions | Misses regressions | Assert the specific value |
| Unawaited async assertions | Swallowed errors, false passes | Always await async checks |

## Done When

- [ ] Behavior worth testing (per the criteria above) has a test
- [ ] Bug fixes include a reproduction test that failed before the fix
- [ ] All tests pass; none skipped or disabled to make them pass
- [ ] Test names describe the behavior being verified
