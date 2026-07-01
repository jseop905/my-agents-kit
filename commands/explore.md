---
name: explore
description: Investigate a part of the codebase and explain it — runs in a subagent so the detail never bloats the main context
---

Method lives in `.claude/skills/codebase-exploration/SKILL.md`.

Spawn an **Explore** subagent (Agent tool, `subagent_type: "Explore"`) with the target, instruct it to follow that skill, and relay its structured explanation without re-reading the files in the main thread. If invoked as `/explore save <target>` (or the user asks to save), have it also write the explanation to `docs/explore/<slug>.md` per the skill's Optional Save step.
