---
name: spec
description: Investigate and write a structured spec for a new feature or project before coding
---

Follow `.claude/skills/spec-driven-development.md`.

Use `/spec` for a new feature or a new project — when you need to investigate and design before any code exists.

First, investigate to ground the spec (don't spec in a vacuum):
- New feature in an existing codebase: read the relevant existing code, patterns, and constraints it must fit.
- New project: survey the domain, viable approaches, and key technical constraints.

Then ask clarifying questions about what is still unresolved:
1. The objective and target users
2. Core features and acceptance criteria
3. Tech stack preferences and constraints
4. Known boundaries (what to always do, ask first about, and never do)

Generate a structured spec covering all template sections (defined in the skill).

Save the spec as docs/SPEC.md and confirm with the user before proceeding. Create the output directory first if it does not exist.
