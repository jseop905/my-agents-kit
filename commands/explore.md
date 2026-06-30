---
name: explore
description: Investigate a part of the codebase and explain it — runs in a subagent so the detail never bloats the main context
---

Follow `.claude/skills/codebase-exploration.md`.

Use `/explore` to understand a part of the codebase — a location (file / directory / symbol) or a question about how something works ("where is auth handled?", "how does this function flow?"). Reach for it when entering unfamiliar or half-forgotten code, or to scope an area before `/plan`.

Dispatch the investigation to a subagent so the file reading stays out of the main context:

1. Spawn an **Explore** subagent (Agent tool, `subagent_type: "Explore"`). Give it the target and instruct it to follow `.claude/skills/codebase-exploration.md` and return the structured explanation.
2. Relay the subagent's explanation. Do **not** re-read the files in the main thread — keeping the main context lean is the whole point.

If invoked as `/explore save <target>` (or the user asks to save it), also write the explanation to `docs/explore/<slug>.md`, where `<slug>` is derived from the target. Create the directory first if it does not exist.
