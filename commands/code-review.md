---
name: code-review
description: Review the worked-on code across five axes — fix clear issues directly, surface judgment calls for your decision
---

Follow `.claude/skills/code-review-and-quality.md` (the five axes and the severity scheme live there). Adopt `.claude/agents/code-reviewer.md` as the review persona.

Target the current changes (staged or recent commits) — review the worked-on code, not the whole codebase. Produce findings per the agent's Review Output Template: categorized as Critical, Important, or Suggestion, each with a file:line reference and a fix recommendation.

Then resolve the findings in two tracks:

- **Fix directly** — unambiguous, low-risk, localized fixes where the correct change is clear and needs no decision (a clear bug with one right fix, a missing guard, a typo, a mechanical cleanup). Apply them.
- **Share for confirmation** — anything needing a judgment call: design or behavioral tradeoffs, wide-impact or risky changes, deleting code (per the skill's dead-code rule, always ask), or any case where the right answer is unclear. Don't change these — present them with your recommendation and let the user decide.

After applying fixes, verify them (run the tests and build if the project has them) so a fix doesn't introduce a regression. Then report what you fixed and what needs the user's decision.

Note: Correctness, Readability, and Architecture intentionally have no backing checklist — apply judgment. Only Security and Performance have one (`.claude/references/security-checklist.md`, `.claude/references/performance-checklist.md`).
