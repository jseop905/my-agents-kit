---
name: codebase-exploration
description: Method for investigating unfamiliar code and explaining it concisely — locate entry points, trace flow, surface patterns, and report conclusions with file:line anchors instead of raw dumps. Use when explaining how a part of a codebase works.
---

# Codebase Exploration and Explanation

## Purpose

Explain how a part of the codebase works so the reader can act on it — enter unfamiliar or half-forgotten code, or scope a change — without having to read it themselves.

## The Frugality Principle (most important)

Investigate widely, report narrowly. Read whatever you need to understand the code, but return **conclusions and `file:line` anchors, not raw code dumps**. The cost of reading should live in your context, not the caller's. Quote a snippet only when a specific line *is* the answer — never paste whole files.

## Method

1. **Locate the entry point** — where the feature or execution starts (route, handler, command, exported function, component). Search by symbol or string; don't read files blindly.
2. **Trace the flow** — follow the control and data path from entry to effect. Note the hops (caller → service → db, or event → reducer → view).
3. **Identify the patterns** — the conventions this area follows (error handling, validation, naming, layering) that a change here must match.
4. **Mark the boundaries** — what is in scope versus adjacent, plus any gotchas or assumptions worth confirming.

## Output Structure

Report concisely under these headings, omitting any that don't apply:

- **What** — one or two lines: what this code does.
- **Flow** — the path through the code as steps or an arrow chain, each with a `file:line`.
- **Key locations** — the few `file:line` anchors that matter (entry point, core logic, config).
- **Patterns** — conventions to follow when changing this area.
- **Watch out** — gotchas, edge cases, or things to confirm (only if real).

Keep it scannable. If the question was narrow ("what does X do?"), answer just that — don't pad it out to the full template.
