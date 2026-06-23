---
name: planning-and-task-breakdown
description: Breaks work into ordered tasks. Use when you have a spec or clear requirements and need to break work into implementable tasks. Use when a task feels too large to start, when you need to estimate scope, or when parallel work is possible.
---

# Planning and Task Breakdown

## Overview

Decompose work into small, verifiable tasks with explicit acceptance criteria. Every task should be small enough to implement, test, and verify in a single focused session.

## The Planning Process

### Step 1: Enter Plan Mode (Read-Only)

- Read the spec and relevant codebase sections
- Identify existing patterns and conventions
- Map dependencies between components
- Note risks and unknowns

**Do NOT write code during planning.**

### Step 2: Identify the Dependency Graph

```
Database schema
    │
    ├── API models/types
    │       │
    │       ├── API endpoints
    │       │       │
    │       │       └── Frontend API client
    │       │               │
    │       │               └── UI components
    │       │
    │       └── Validation logic
    │
    └── Seed data / migrations
```

### Step 3: Slice Vertically

**Good (vertical slicing):**
```
Task 1: User can create an account (schema + API + UI for registration)
Task 2: User can log in (auth schema + API + UI for login)
Task 3: User can create a task (task schema + API + UI for creation)
```

### Step 4: Write Tasks

```markdown
## Task [N]: [Short descriptive title]

**Description:** One paragraph explaining what this task accomplishes.

**Acceptance criteria:**
- [ ] [Specific, testable condition]

**Verification:**
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Manual check: [description]

**Dependencies:** [Task numbers or "None"]
**Files likely touched:** [list]
**Estimated scope:** [XS | S | M | L | XL]
```

### Step 5: Order and Checkpoint

Sequence tasks by dependency order and insert a verification checkpoint after each phase.

## Task Sizing Guidelines

| Size | Files | Example |
|------|-------|---------|
| **XS** | 1 | Add a validation rule |
| **S** | 1-2 | Add a new API endpoint |
| **M** | 3-5 | User registration flow |
| **L** | 5-8 | Search with filtering and pagination |
| **XL** | 8+ | **Too large — break it down further** |

If a task is L or larger, it should be broken into smaller tasks. An agent performs best on S and M tasks.

**When to break a task down further:**
- It would take more than one focused session (roughly 2+ hours of agent work)
- You cannot describe the acceptance criteria in 3 or fewer bullet points
- It touches two or more independent subsystems (e.g., auth and billing)
- You find yourself writing "and" in the task title (a sign it is two tasks)

## Plan Document Template

```markdown
# Implementation Plan: [Feature/Project Name]

## Overview
## Architecture Decisions

## Task List
### Phase 1: Foundation
### Checkpoint: Foundation
### Phase 2: Core Features
### Checkpoint: Core Features
### Phase 3: Polish
### Checkpoint: Complete

## Risks and Mitigations
## Open Questions
```

## Parallelization Opportunities

When multiple agents or sessions are available:

- **Safe to parallelize:** Independent feature slices, tests for already-implemented features, documentation
- **Must be sequential:** Database migrations, shared state changes, dependency chains
- **Needs coordination:** Features that share an API contract (define the contract first, then parallelize)

## Red Flags

- Starting implementation without a written task list
- Tasks that say "implement the feature" without acceptance criteria
- No verification steps in the plan
- All tasks are XL-sized
- No checkpoints between tasks
- Dependency order isn't considered

## Verification

- [ ] Every task has acceptance criteria
- [ ] Every task has a verification step
- [ ] Task dependencies are identified and ordered correctly
- [ ] No task touches more than ~8 files (no XL tasks)
- [ ] Checkpoints exist between major phases
- [ ] The human has reviewed and approved the plan
