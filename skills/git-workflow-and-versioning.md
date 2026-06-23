---
name: git-workflow-and-versioning
description: Structures git workflow practices — branching strategy, commit discipline, conflict resolution, and worktrees. Use when committing, branching, resolving conflicts, or organizing work across multiple parallel streams.
---

# Git Workflow and Versioning

## Overview

Git is your safety net. Treat commits as save points, branches as sandboxes, and history as documentation. With AI agents generating code at high speed, disciplined version control is the mechanism that keeps changes manageable, reviewable, and reversible.

## Core Principles

### 1. Trunk-Based Development (Recommended)

Keep `main` always deployable. Work in short-lived feature branches that merge back within 1-3 days.

```
main ──●──●──●──●──●──●──●──●──●──  (always deployable)
        ╲      ╱  ╲    ╱
         ●──●─╱    ●──╱    ← short-lived feature branches (1-3 days)
```

### 2. Commit Early, Commit Often

Each successful increment gets its own commit. Don't accumulate large uncommitted changes.

```
Work pattern:
  Implement slice → Test → Verify → Commit → Next slice
```

### 3. Atomic Commits

Each commit does one logical thing.

### 4. Descriptive Messages

```
<type>: <short description>

<optional body explaining why, not what>
```

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

End every commit message with a Co-Authored-By trailer for Claude Code:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

### 5. Keep Concerns Separate

Don't combine formatting changes with behavior changes. Don't combine refactors with features.

### 6. Size Your Changes

```
~100 lines  → Easy to review, easy to revert
~300 lines  → Acceptable for a single logical change
~1000 lines → Split into smaller changes
```

## Branching Strategy

```
main (always deployable)
  │
  ├── feature/task-creation
  ├── feature/user-settings
  └── fix/duplicate-tasks
```

- Branch from `main`
- Keep branches short-lived (1-3 days)
- Delete branches after merge
- Commit and push only when the user requests it. If you are on the default branch (`main`/`master`), create a feature branch first.

## Working with Worktrees

For parallel AI agent work, use git worktrees to run multiple branches simultaneously:

```bash
# Create a worktree for a feature branch
git worktree add ../project-feature-a feature/task-creation
git worktree add ../project-feature-b feature/user-settings

# Each worktree is a separate directory with its own branch
ls ../
  project/              ← main branch
  project-feature-a/    ← task-creation branch
  project-feature-b/    ← user-settings branch

# When done, merge and clean up
git worktree remove ../project-feature-a
```

Benefits:
- Multiple agents can work on different features simultaneously
- No branch switching needed (each directory has its own branch)
- If one experiment fails, delete the worktree — nothing is lost
- Changes are isolated until explicitly merged

## The Save Point Pattern

```
Agent starts work
    │
    ├── Makes a change
    │   ├── Test passes? → Commit → Continue
    │   └── Test fails? → Revert to last commit → Investigate
    │
    └── Feature complete → All commits form a clean history
```

## Change Summaries

```
CHANGES MADE:
- src/routes/tasks.ts: Added validation middleware to POST endpoint

THINGS I DIDN'T TOUCH (intentionally):
- src/routes/auth.ts: Has similar validation gap but out of scope

POTENTIAL CONCERNS:
- The Zod schema is strict — rejects extra fields. Confirm this is desired.
```

## Pre-Commit Hygiene

Before every commit:
1. Check what you're about to commit (`git diff --staged`)
2. Ensure no secrets
3. Run tests
4. Run linting
5. Run type checking
