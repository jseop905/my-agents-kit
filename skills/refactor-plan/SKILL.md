---
name: refactor-plan
description: Plans a refactoring before touching code — defines the target state, secures behavior-preserving checks, and breaks the work into small steps that each keep the system working. Use before any structural change, code reorganization, or refactor spanning more than one file.
---

# Refactor Plan

## Planning Is Read-Only

Read code and documents; don't change code while planning. The output is a plan for review, not a diff.

## Process

1. **Name the problem.** What concretely hurts (duplication, wrong boundary, unreadable module)? If you can't state the problem, you don't need the refactor.
2. **Define the target state** in verifiable terms: "X no longer depends on Y", "the three copies share one implementation" — not "cleaner code".
3. **Secure the safety net first.** Refactoring means behavior does not change — something must verify that. If the affected code lacks tests, add characterization tests (pin current behavior, per `write-tests`) as step 0 of the plan.
4. **Break into small steps.** Each step:
   - changes one thing — if the step title needs "and", split it;
   - leaves the system green: building, existing tests passing;
   - is a natural commit boundary (atomic, revertable).
5. **Order the steps additive-first.** Introduce the new structure alongside the old, migrate callers over, remove the old last — deletion comes at the end, when nothing depends on it.
6. **Present the plan for review before executing.** List steps with their verification; flag risky ones.

## Step Format

```markdown
## Step N: [title]
- Change: [what]
- Verify: [command or check that proves the system is still green]
- Risk: [low / medium / high — and why, if not low]
```

## Rules

- **Refactor and behavior change never mix.** A needed feature or fix is a separate change before or after the refactor — not woven in.
- **No big bang.** If a step can't keep the system working, the slicing is wrong — find the smaller move.
- **Scope discipline.** "While I'm here" improvements outside the named problem go into a note, not the diff.
- **Stop rule.** If mid-refactor the plan proves wrong (unforeseen coupling), stop and re-plan — don't improvise through it.

## Signals a Step Is Too Big

- It touches two or more independent subsystems.
- Its verification can't be described in a line or two.
- It wouldn't fit in one focused session.
