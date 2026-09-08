---
name: update-docs
description: Keep handover-oriented project docs in `docs/` in sync with the code. Use when the user asks to update, refresh, or sync project documentation, or to prepare docs for handover. The first run creates a fixed doc set (index, architecture, setup, operations, decisions); later runs update only the docs affected by changes since the sync marker. Never commits.
argument-hint: [focus, e.g. a doc name or area to prioritize]
---

# Update docs

Maintain a fixed set of handover documents under `docs/` so a successor can understand, run,
and operate the project without reading the whole codebase. Edit the docs only; the user
reviews and commits.

## Document set

| File | Answers | Typical covered paths |
|---|---|---|
| `docs/README.md` | Index: which docs exist, what each covers, sync marker | — |
| `docs/architecture.md` | What the system is made of and how it flows | source directories |
| `docs/setup.md` | How to set up, run, test, build, deploy | package manifests, Dockerfile, CI, `scripts/`, `.env.example` |
| `docs/operations.md` | What to watch and do while it runs | `infra/`, `deploy/`, monitoring config |
| `docs/decisions.md` | Why things are the way they are (append-only log) | none — judged from commits |

`docs/README.md` holds the **manifest table** (document → covered paths) and the **sync
marker** `<!-- update-docs:synced <full-sha> -->`. The manifest is the single source for
mapping changed paths to documents. Skeletons live in `templates/` beside this SKILL.md
(`.claude/skills/update-docs/templates/` in a project install).

## 1. Decide the mode

Read `docs/README.md`. No file or no marker → **Bootstrap**. Marker present → **Sync**.
If the user passed a focus argument, prioritize that document or area but still run the
full procedure.

## 2. Bootstrap (first run)

1. Survey the repository: `git ls-files` for structure, package manifests, CI and deploy
   config, the root README, anything already in `docs/`. If the repository has more than
   about 200 tracked files, delegate the survey to the Explore subagent and work from its
   summary.
2. Copy each file from `templates/` to `docs/` that does not exist yet. Never overwrite an
   existing document. If an existing document already answers one of the five questions
   (for example `docs/ARCHITECTURE.md`), use it in place of the template and skip the
   duplicate; add every existing document to the manifest with the paths it evidently
   covers.
3. Fill each document from the survey. Replace the template hints (the standing note at the
   top of `decisions.md` stays); drop sections that do not apply rather than leaving them
   empty.
4. Fill the manifest paths and write the marker with the full `HEAD` sha.

## 3. Sync (later runs)

1. Check the marker with `git cat-file -e <marker>`. If it is unreachable (rebase, squash),
   skip the diff: re-survey the current tree for every document as in Bootstrap step 3,
   editing in place, then go to step 6.
2. Collect the change set: `git diff --stat <marker>` (includes the working tree),
   `git status --short` for untracked files, `git log --oneline <marker>..HEAD` for intent.
   Ignore `docs/` itself, lockfiles, and files whose only change is formatting. If nothing
   is left, report that the docs are up to date and stop without editing anything; the
   marker lags behind docs-only commits by design, so do not advance it. If more than about
   50 files are left, re-survey as in step 1 instead of reading the diff.
3. Map changed paths to documents through the manifest. A path no document covers goes to the
   best-fitting document; add it to that manifest row.
4. For each affected document: read the document, read `git diff <marker> -- <paths>` and the
   current files where the diff is not enough, then edit **only the sections that are now
   wrong or missing**. Leave every other sentence untouched.
5. `docs/decisions.md`: when the commits show a deliberate design change — a dependency
   added or replaced, a structural move, a feature removed — append one entry. Never edit or
   remove past entries.
6. Update the marker to the current `HEAD` sha.

## Rules

- **Language**: documents are written in Korean. If `docs/` already exists in another
  language, keep that language.
- **Facts only**: write what the code, config, and commits show. Operational details you
  cannot verify — monitoring URLs, deploy targets, owners, on-call — are never invented;
  leave a `> 확인 필요:` note saying what is missing.
- **No secrets**: record environment variable names and purposes, never values. Do not read
  `.env` files.
- **Scope**: edit files under `docs/` only. Do not touch the root `README.md` or `CLAUDE.md`.
- **Why over what**: prefer explaining intent and constraints over restating code; the code
  itself is the reference for details.
- **Stay short**: a successor should read each document in under ten minutes. If a document
  is outgrowing that, suggest a split to the user instead of doing it silently.

## Output

Report in Korean: one line per document changed (or `변경 없음`), the list of open
`확인 필요` notes, and a closing line that nothing was committed. Do not run any commit
command; the user commits after review.
