---
name: update-docs
description: Keep handover-oriented project docs in `docs/handover/` in sync with the code. Use when the user asks to update, refresh, or sync project documentation, or to prepare docs for handover. The first run creates a fixed doc set (index, architecture, setup, operations, decisions, open questions); later runs update only the docs affected by changes since the sync marker. Never commits.
argument-hint: [focus, e.g. a doc name or area to prioritize]
---

# Update docs

Maintain a fixed set of handover documents under `docs/handover/` so a successor can
understand, run, and operate the project without reading the whole codebase. Edit the docs
only; the user reviews and commits.

## Document set

All paths below are relative to `docs/handover/`.

| File | Answers | Typical covered paths |
|---|---|---|
| `README.md` | Index: which docs exist, what each covers, sync marker | — |
| `architecture.md` | What the system is made of and how it flows | source directories |
| `setup.md` | How to set up, run, test, build, deploy | package manifests, Dockerfile, CI, `scripts/`, `.env.example` |
| `operations.md` | What to watch and do while it runs | `infra/`, `deploy/`, monitoring config |
| `decisions.md` | Why things are the way they are (append-only log) | none — judged from commits |
| `open-questions.md` | What only a person can still fill in | none — maintained by this skill |

`README.md` holds the **manifest table** (document → covered paths) and the **sync marker**
`<!-- update-docs:synced <full-sha> -->`. The manifest is the single source for mapping
changed paths to documents. Skeletons live in `templates/` beside this SKILL.md
(`.claude/skills/update-docs/templates/` in a project install).

## Two kinds of content

Every sentence in these documents is one of two kinds, and the skill treats them differently.

- **Code-derived**: anything the code, config, or commits can show — endpoints, modules,
  environment variable names, commands, dependencies. The skill writes and corrects these
  freely.
- **Person-supplied**: anything the repository cannot show — deploy targets, monitoring URLs,
  owners, schedules, reasons not recorded in commits. The skill never writes these. Where one
  is missing it adds a question to `open-questions.md`; where one is present it leaves the
  sentence exactly as written, even during a full re-survey. When unsure which kind a
  sentence is, treat it as person-supplied.

## 1. Decide the mode

Read `README.md`. No file or no marker → **Bootstrap**. Marker present → **Sync**.
If the user passed a focus argument, prioritize that document or area but still run the
full procedure.

## 2. Bootstrap (first run)

1. Survey the repository: `git ls-files` for structure, package manifests, CI and deploy
   config, the root README, anything already in `docs/`. If the repository has more than
   about 200 tracked files, delegate the survey to the Explore subagent and work from its
   summary.
2. Copy each file from `templates/` into `docs/handover/` that does not exist yet. Never
   overwrite an existing document. If an existing document already answers one of these
   questions (for example `docs/ARCHITECTURE.md`), use it in place of the template and skip
   the duplicate; add every existing document to the manifest with the paths it evidently
   covers.
3. Fill each document from the survey with code-derived content only. Replace the template
   hints (the standing notes at the top of `decisions.md` and `open-questions.md` stay);
   drop sections that do not apply. A section that applies but needs person-supplied content
   gets the single line `> 확인 필요: [open-questions.md](open-questions.md) 참고` and one row
   in `open-questions.md` naming the document and section.
4. Fill the manifest paths and write the marker with the full `HEAD` sha.

## 3. Sync (later runs)

1. Check the marker with `git cat-file -e <marker>`. If it is unreachable (rebase, squash),
   skip the diff: re-survey the current tree for every document as in Bootstrap step 3,
   editing in place, then continue from step 6.
2. Collect the change set: `git diff --stat <marker>` (includes the working tree),
   `git status --short` for untracked files, `git log --oneline <marker>..HEAD` for intent.
   Ignore `docs/` itself, lockfiles, and files whose only change is formatting. If nothing
   is left, report that the docs are up to date and stop without editing anything; the
   marker lags behind docs-only commits by design, so do not advance it. If more than about
   50 files are left, re-survey as in step 1 instead of reading the diff.
3. Map changed paths to documents through the manifest. A path no document covers goes to the
   best-fitting document; add it to that manifest row.
4. For each affected document: read the document, read `git diff <marker> -- <paths>` and the
   current files where the diff is not enough, then edit **only the code-derived sentences
   that are now wrong or missing**. Leave every other sentence untouched.
5. `decisions.md`: when the commits show a deliberate design change — a dependency added or
   replaced, a structural move, a feature removed — append one entry. Never edit or remove
   past entries.
6. `open-questions.md`: add a row for each new gap found. Remove a row when its target
   section now contains the answer.
7. Update the marker to the current `HEAD` sha.

## Rules

- **Language**: documents are written in Korean. If the docs already exist in another
  language, keep that language.
- **No guessing**: code-derived content must be verifiable in the repository. Anything else
  is a question in `open-questions.md`, never a sentence in a document.
- **No secrets**: record environment variable names and purposes, never values. Do not read
  `.env` files.
- **Scope**: edit files under `docs/handover/` only. Do not touch the root `README.md` or
  `CLAUDE.md`.
- **Why over what**: prefer explaining intent and constraints over restating code; the code
  itself is the reference for details.
- **Stay short**: a successor should read each document in under ten minutes. If a document
  is outgrowing that, suggest a split to the user instead of doing it silently.

## Output

Report in Korean: one line per document changed (or `변경 없음`), the open-question count
with any rows added or removed this run, and a closing line that nothing was committed. Do
not run any commit command; the user commits after review.
