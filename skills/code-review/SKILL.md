---
name: code-review
description: Reviews a code change across five axes — correctness, readability, architecture, security, performance — and resolves the findings. Use before merging any change, after completing a feature or bug fix, or when evaluating code produced by another agent or a human.
---

# Code Review

## Scope

Review the current change — the staged diff or recent commit(s) — not the whole codebase. When "current" is ambiguous, prefer the uncommitted/staged diff, then the most recent commits.

## Process

1. **Understand the context.** What is this change trying to accomplish? What is the expected behavior change?
2. **Review the tests first.** Do tests exist where they matter (core/complex logic, bug-fix regressions, public interfaces — per `write-tests`)? Do they test behavior, not implementation details? Don't demand tests for trivial or throwaway code.
3. **Review the implementation** across the five axes below, file by file.
4. **Categorize findings:**

   | Severity | Meaning | Examples |
   |----------|---------|----------|
   | Critical | Blocks merge | Security vulnerability, data loss, broken functionality |
   | Important | Fix before merge | Missing test, wrong abstraction, poor error handling |
   | Suggestion | Optional | Naming, style, optional optimization |

5. **Resolve findings in two tracks:**
   - **Fix directly** — unambiguous, low-risk, localized: a clear bug with one right fix, a missing boundary check, a typo. Apply, then re-run tests/build so the fix itself doesn't regress.
   - **Surface for confirmation** — anything needing judgment: design tradeoffs, wide-impact changes, deleting code. Present with a recommendation; let the author decide.
6. **Verify the verification.** Confirm tests pass and the build succeeds (where the project has them) before approving — don't take the author's word for it.

## The Five Axes

### 1. Correctness
- Does it match the requirements? Are edge cases (null, empty, boundary values) and error paths handled?
- Off-by-one errors, race conditions, state inconsistencies?
- Do the tests actually test the right things?

### 2. Readability & Simplicity
- Understandable without the author explaining it? Names descriptive and consistent with project conventions?
- Could this be done in fewer lines? Are abstractions earning their complexity (don't generalize before the third use case)?
- Dead-code artifacts: unused variables, backwards-compat shims, `// removed` comments?

### 3. Architecture
- Follows existing patterns, or introduces a new one — and if new, is it justified?
- Clean module boundaries, dependencies flowing in one direction, no duplication that should be shared?
- New dependencies justified? Prefer the standard library and existing utilities over adding one.

### 4. Security
- No secrets in code or logs. Input validated at trust boundaries.
- Injection vectors closed: query building, shell invocation, path handling, HTML output.
- Auth checks present on protected operations; external data treated as untrusted.
- For a security-focused review, work through `references/security-checklist.md`.

### 5. Performance
- N+1 query patterns, unbounded loops or reads, missing indexes on hot filters/sorts, missing pagination on list operations.
- Only flag hot-path issues you can articulate concretely — no speculative micro-optimization.

## Principles

- **Approval standard:** approve when the change definitely improves overall code health, even if imperfect. Don't block a change because it isn't how you would have written it.
- **Honesty:** no rubber-stamp "LGTM"; don't soften real issues; quantify when possible ("adds ~50ms per item" beats "could be slow"); accept an informed override gracefully.
- **Dead code:** list now-unused elements explicitly and ask before deleting.
- **Large changes:** if the diff is too big to review properly (roughly 1,000+ changed lines), say so and suggest splitting — don't skim and approve.
