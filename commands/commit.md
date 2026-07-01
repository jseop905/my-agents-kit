---
name: commit
description: Extract conventional commit message(s) from your changes — message only by default, optionally commit
---

Follow the Commit Workflow in `.claude/skills/git-workflow-and-versioning/SKILL.md` (inspect → scope → message; message-only by default; commit only when asked; never push).

Tool-specific glue: the literal `/commit go` argument is the "user asks to commit" trigger — run the skill's commit step. Bare `/commit` produces the message(s) only.
