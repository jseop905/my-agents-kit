---
name: plan
description: Plan a feature on an existing codebase — break the goal into small verifiable tasks with dependency ordering
---

Follow `.claude/skills/planning-and-task-breakdown/SKILL.md`.

Use `/plan` to add a feature to an existing codebase. Start from the user's stated goal; if a spec exists (docs/SPEC.md or equivalent), read it too. Then:

1. Enter plan mode — read only, no code changes
2. Read the relevant code sections to pin down the impact scope and the existing patterns the change must follow (use the project structure in CLAUDE.md to navigate)
3. Identify the dependency graph between components
4. Slice work vertically (one complete path per task, not horizontal layers)
5. Write tasks with acceptance criteria and verification steps
6. Add checkpoints between phases
7. Present the plan for human review

Save the plan to docs/tasks/plan.md and task list to docs/tasks/todo.md. Create the output directory first if it does not exist.
