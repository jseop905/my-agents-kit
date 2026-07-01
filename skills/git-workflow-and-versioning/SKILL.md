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
<type>(<scope>): <한 줄 요약>

<왜 바꿨는지 설명하는 선택적 본문 — 무엇이 아니라 왜>
```

Write the subject and body in Korean.

**Types** — pick the one that makes the nature of the change obvious. The three that matter most:

- `feat` — 기능 추가
- `fix` — 오류 수정
- `revert` — 이전 변경 되돌림(번복)

And the rest:

- `refactor` — 동작 변화 없는 구조 개선
- `test` — 테스트 추가·수정
- `docs` — 문서
- `chore` — 빌드·설정 등 잡무

**Scope** (optional) — when the repo has distinct units (a monorepo, or separate packages / apps / modules), put that unit's representative name in parentheses: `feat(web):`, `fix(api):`. Omit it for a single-structure repo.

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

## Commit Workflow

Turn the current changes into well-formed commit message(s). By default, produce the message(s) only — do not commit. Perform the actual commit only when the user asks for it.

1. **Inspect the changes.** Run `git status`, `git diff --staged`, `git diff`, and list any untracked files, so you see the full picture of what changed.
2. **Determine the scope.**
   - If anything is staged, treat the staged set as the scope — the user already chose it. Write a message for that set and ignore unstaged changes.
   - If nothing is staged, analyze all uncommitted changes and group them by concern (see Atomic Commits and Keep Concerns Separate): one concern → one message; mixed concerns → propose N commits, each with its own file group.
3. **Write each message** in the Descriptive Messages convention above, scoped to its group.
4. **Default — message only.** Present the message(s) with the file grouping for each, then stop. Do not stage or commit.
5. **When the user asks to commit,** apply the Pre-Commit Hygiene above, then for each group `git add` its files and commit with its message, in order. Never push.
