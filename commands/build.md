---
name: build
description: Implement the next task incrementally — build, test, verify, commit
---

Follow `.claude/skills/incremental-implementation.md` and `.claude/skills/test-driven-development.md`.

Use /build to implement planned tasks; for standalone test authoring or bug reproduction use /test, and for trivial throwaway tasks skip RED/GREEN and use /quick-build.

Pick the next pending task from docs/tasks/ (produced by /plan). For each task:

1. Read the task's acceptance criteria
2. Load relevant context (existing code, patterns, types)
3. Write a failing test for the expected behavior (RED)
4. Implement the minimum code to pass the test (GREEN)
5. Run the full test suite to check for regressions
6. Run the build to verify compilation
7. Commit only if the user has authorized committing for this run, following `.claude/skills/git-workflow-and-versioning.md` (do not commit automatically by default)
8. Mark the task complete and move to the next one

If any step fails, follow `.claude/skills/debugging-and-error-recovery.md`.
