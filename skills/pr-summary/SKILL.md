---
name: pr-summary
description: Generates a pull request title and description from the branch's changes — what changed, why, how it was verified, and what reviewers should look at. Use when opening or updating a pull request, or when asked to summarize a branch for review.
---

# PR Summary

## Process

1. **Collect the change.** Gather the branch's commits and the full diff against the base branch — the summary describes what the diff actually does, not what was intended.
2. **Extract the story.** What problem does this solve (why)? What approach was taken (how)? Group changes by concern, not by file.
3. **Write the title.** Imperative and specific, under ~70 characters: "Add rate limiting to login endpoint", not "Updates". If the project squash-merges (the PR title becomes the commit message), follow the project's commit message convention instead.
4. **Write the description** using the structure below.
5. **Posting is a separate step.** Present the summary as text; submit it to the platform only when asked — publishing is an outward-facing action.

## Description Structure

Omit sections that don't apply:

- **Summary** — 1–3 sentences: what and why.
- **Changes** — grouped by concern, each with the key files.
- **Verification** — what was actually run (tests, builds, manual checks). Only claim what was executed.
- **Out of scope** — related things deliberately not touched, so reviewers don't assume they were missed.
- **Notes for reviewers** — where to start reading, risky spots, decisions that need extra eyes.
- **Breaking changes / migration** — only if real.

## Principles

- **Describe the diff, not the intention.** If the code doesn't do it, the description doesn't say it.
- **Honest verification.** Never list checks that weren't run.
- **Reviewer-first.** Optimize for the person deciding whether to merge: lead with impact, flag risk.
- **Right-size it.** A one-line fix gets a two-line description; don't pad.
