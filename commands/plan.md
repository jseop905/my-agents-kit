---
name: plan
description: Break work into small verifiable tasks with acceptance criteria and dependency ordering
---

Follow `.claude/skills/planning-and-task-breakdown.md`.

Read the existing spec (docs/SPEC.md or equivalent). Then:

1. Enter plan mode — read only, no code changes
2. If `docs/wiki/` exists, read the wiki docs (architecture.md, modules.md, etc.) to pin down the impact scope. If there is no wiki, read only the relevant code sections based on the project structure in CLAUDE.md.
3. Identify the dependency graph between components
4. Slice work vertically (one complete path per task, not horizontal layers)
5. Write tasks with acceptance criteria and verification steps
6. Add checkpoints between phases
7. Present the plan for human review

Save the plan to docs/tasks/plan.md and task list to docs/tasks/todo.md. Create the output directory first if it does not exist.
