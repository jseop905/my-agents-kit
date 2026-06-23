---
name: test-driven-development
description: Drives development with tests. Use when you need to prove that code works, when a bug report arrives, or when you're about to modify existing functionality.
---

# Test-Driven Development

## Overview

Write a failing test before writing the code that makes it pass. For bug fixes, reproduce the bug with a test before attempting a fix. Tests are proof — "seems right" is not done.

## The TDD Cycle

```
    RED                GREEN              REFACTOR
 Write a test    Write minimal code    Clean up the
 that fails  ──→  to make it pass  ──→  implementation  ──→  (repeat)
```

## The Prove-It Pattern (Bug Fixes)

```
Bug report arrives
       │
       ▼
  Write a test that demonstrates the bug
       │
       ▼
  Test FAILS (confirming the bug exists)
       │
       ▼
  Implement the fix
       │
       ▼
  Test PASSES (proving the fix works)
       │
       ▼
  Run full test suite (no regressions)
```

## The Test Pyramid

```
          ╱╲
         ╱  ╲         E2E Tests (~5%)
        ╱    ╲
       ╱──────╲
      ╱        ╲      Integration Tests (~15%)
     ╱          ╲
    ╱────────────╲
   ╱              ╲   Unit Tests (~80%)
  ╱                ╲
 ╱──────────────────╲
```

## Writing Good Tests

### Test State, Not Interactions
Assert on the *outcome*, not on which methods were called internally.

### DAMP Over DRY in Tests
Each test should tell a complete story without tracing through shared helpers.

### Prefer Real Implementations Over Mocks
```
Preference order:
1. Real implementation  → Highest confidence
2. Fake                 → In-memory version of a dependency
3. Stub                 → Returns canned data
4. Mock (interaction)   → Use sparingly
```

### Arrange-Act-Assert Pattern
Structure each test as Arrange (set up data and preconditions), Act (perform the action under test), Assert (verify the outcome).

### One Assertion Per Concept
A test verifies a single behavior. Multiple `expect`s are fine when they describe the same concept; split unrelated concepts into separate tests.

### Name Tests Descriptively
A test name reads like a specification: what behavior, under what condition. The name should explain the failure without reading the body.

For concrete assertion/mocking/example patterns and the full anti-pattern table, see references/testing-patterns.md.

## Verification

- [ ] Every new behavior has a corresponding test
- [ ] All tests pass
- [ ] Bug fixes include a reproduction test
- [ ] Test names describe the behavior being verified
- [ ] No tests were skipped or disabled
