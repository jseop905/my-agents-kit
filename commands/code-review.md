---
name: code-review
description: Conduct a five-axis code review — correctness, readability, architecture, security, performance
---

Follow `.claude/skills/code-review-and-quality.md` (the five axes and the severity scheme live there). Adopt `.claude/agents/code-reviewer.md` as the review persona.

Target the current changes (staged or recent commits). Output per the agent's Review Output Template: findings categorized as Critical, Important, or Suggestion, each with a file:line reference and a fix recommendation.

Note: Correctness, Readability, and Architecture intentionally have no backing checklist — apply judgment. Only Security and Performance have one (`.claude/references/security-checklist.md`, `.claude/references/performance-checklist.md`).
