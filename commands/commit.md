---
name: commit
description: Extract conventional commit message(s) from your changes — message only by default, optionally commit
---

Follow `.claude/skills/git-workflow-and-versioning/SKILL.md` for the message format, atomic-commit grouping, and pre-commit hygiene — don't redefine them here.

Use `/commit` to turn the current changes into well-formed commit message(s). By default it only produces the message(s) and does not commit. Invoke as `/commit go` (or tell it to commit) to also stage and commit.

1. Inspect the changes: `git status`, `git diff --staged`, `git diff`, and any untracked files.
2. Determine the scope:
   - If anything is staged, treat the staged set as the scope — the user already chose it. Message that set and ignore unstaged changes.
   - If nothing is staged, analyze all uncommitted changes and group them by concern (skill: Atomic Commits, Keep Concerns Separate): one concern → one message; mixed concerns → propose N commits, each with its own file group.
3. Write each message in the skill's convention, scoped to its group.
4. Default — present the message(s) with the file grouping for each, then stop. Do not stage or commit.
5. If committing (`/commit go` or the user asks): apply the skill's Pre-Commit Hygiene, then for each group `git add` its files and commit with its message, in order. Never `git push`.

Report what was committed, or in default mode the proposed message(s) and grouping.
