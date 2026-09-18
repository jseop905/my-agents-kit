---
name: release-notes
description: Write release notes from the commits since the last release. Use when the user asks for a changelog, release notes, 변경 로그, 릴리스 노트, or a summary of what changed to share with non-developers. From one commit range it produces two files — a Keep a Changelog entry in `CHANGELOG.md` for developers and a plain-language note in `docs/release-notes/` for non-developers, every note item derived from a changelog bullet. Proposes a version but never tags or commits.
argument-hint: [version such as 1.4.0, or a range such as v1.3.0..HEAD]
---

# Release notes

Turn the commits since the last release into two documents: a developer changelog entry and
a non-developer note. Edit those two files only; the user reviews, commits, and tags.

## Two documents, one source

| File | Reader | Says |
|---|---|---|
| `CHANGELOG.md` (repository root) | developers | what changed, by category, one line per change with its commit |
| `docs/release-notes/<version>.md` | non-developers | what the reader can now do, what looks or behaves differently, what to do about it |

The changelog entry is written first, from the commits. The note is written second, from the
changelog entry alone: every note item corresponds to one or more bullets of that entry, and
the note never says anything the entry does not. This is what keeps the note honest — the
entry is checkable against commits, and the note is checkable against the entry.

`CHANGELOG.md` also carries the sync marker `<!-- release-notes:synced <full-sha> -->`, the
last commit these documents cover. Skeletons live in `templates/` beside this SKILL.md
(`.claude/skills/release-notes/templates/` in a project install).

## 1. Decide the range

Only commits count; uncommitted changes are mentioned in the report and otherwise ignored.
Pick the starting point in this order and use `<start>..HEAD`:

1. **Argument containing `..`** — the user chose the range; use it as given.
2. **Marker** in `CHANGELOG.md`, if `git merge-base --is-ancestor <sha> HEAD` succeeds. An
   unreachable marker (rebase, squash) is ignored.
3. **Latest tag** reachable from `HEAD`: `git describe --tags --abbrev=0`. Any tag counts —
   it is a boundary the user set — and the report names it so the user can pass a range
   instead if it was not a release.
4. **Whole history** otherwise. If that is more than about 100 commits, ask the user for a
   starting commit or tag before continuing rather than summarizing everything.

An argument without `..` is the version to use (step 4), not a range.

List the commits with `git log --no-merges --format='%h%x09%s' <range>`. If the range is
empty, report that there is nothing to release and stop without editing anything.

## 2. Read the commits

The commit title (`type(scope): summary`, see the commit-message skill) is the first hint;
the diff is the evidence. For every `feat`, `fix`, `perf`, and `revert` commit, and for any
other commit whose title suggests a visible effect, read `git show <sha>` and decide what a
user or operator would notice. Read the diff before writing a sentence about a commit: the
title says what the developer meant, the diff says what happened. If more than about 40
commits need reading, or a single commit touches more than about 500 lines, start with
`git show --stat` and open the full diff only where the effect stays unclear.

The unit of a changelog is an **effect** — one thing a user or operator would notice — not a
commit. A commit with several effects yields several bullets; commits that together produce
one effect (a feature and its follow-up before any release, a change and its later
adjustment) share one bullet. Classify each effect by what it does to the reader, with the
commit type as the default hint:

| Category | Default types | Also |
|---|---|---|
| 추가 | `feat` | — |
| 변경 | `perf`; `feat` that alters existing behavior | any commit that changes how the project is run or configured (new required tool or setting, new runtime version, changed command); a safeguard or restriction that was loosened |
| 수정 | `fix` | — |
| 제거 | title ending in `제거` or `드롭` | any commit that removes a capability, whatever its type |
| 보안 | — | any effect that fixes a vulnerability or tightens access |
| 지원 중단 예정 | — | any commit marking something for future removal |
| omitted | `docs`, `test`, `style`, `ci`, `refactor`, `build`, `chore` | only while the diff shows no effect on users or operators — in a repository whose product is documents or instructions (a config kit, a prompt library), `docs` commits often do have one |

A change undone later in the same range — by a `revert` or by any later commit — is omitted
together with the commit that undid it; a `revert` whose target is outside the range is
classified by its effect. Omitted commits are still
counted for the report and for the note's `내부 변경` line.

## 3. Write the changelog entry

Format is [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/), in Korean:

```
## [1.4.0] - 2026-09-14

### 추가
- 결제 완료 전 주문의 취소와 취소 시 재고 복원·알림 발송 (a1b2c3d)

### 변경
- 훅 스크립트가 셸 대신 python3로 실행되어 PATH에 python3 필요 (b2c3d4e)

### 수정
- 결제 실패 후 장바구니가 비워지는 문제 (e4f5a6b)
```

- One bullet is one effect on one line, under about 80 characters not counting the sha list,
  ending with the short sha in parentheses; a shared bullet lists every sha, comma-separated. When a sentence needs a
  second clause to explain the effect, it is probably two effects.
- Say what changed for whoever it affects. Do not restate the commit title. Do not list the
  changed files; name a path only when the reader needs it to find something (a log
  location, a config directory).
- Anything an operator must now do differently — install a tool, set a value, run a
  different command — is its own bullet, because the note's `해야 할 일` is derived from
  the entry and cannot say what the entry does not.
- Sections appear in the order 추가, 변경, 지원 중단 예정, 제거, 수정, 보안; empty sections
  are left out.
- The date is today's (`date +%F`).

If `CHANGELOG.md` does not exist, create it from `templates/CHANGELOG.md`. If it exists
without a marker, keep its content and add the marker below the header. Insert the new entry
directly below the marker, above older entries. Set the marker to the full `HEAD` sha.

## 4. Propose the version

Take the current version from the topmost changelog entry, else from the latest tag that
looks like a version (`1.2.3` or `v1.2.3`). Bump by what the range contains: a breaking
change the commits or the user declare → major; any 추가 or 제거 → minor; otherwise patch.
With no previous version, propose `1.0.0` and report `이전 버전 없음` as the reason. The
version is a proposal: it names the entry and the note file, and the user renames both if
they disagree. Never create a tag.

## 5. Write the note

Create `docs/release-notes/<version>.md` from `templates/note.md`. Derive every item from the
changelog entry; write nothing the entry does not support. Each changelog section feeds one
note section:

| Changelog | Note |
|---|---|
| 추가 | 새로 할 수 있는 것 |
| 변경, 보안 | 달라진 것 |
| 수정 | 고쳐진 것 |
| 제거, 지원 중단 예정 | 없어진 것 (지원 중단 예정 is phrased as "곧 없어집니다") |
| operator-action bullets from any section | 해야 할 일 |
| omitted commits | 내부 변경 (count only) |

- **Open with one short sentence** naming the main change of the release.
- **The note selects; the changelog is complete**: a bullet that means nothing to a
  non-developer (an allowlist entry, an internal rule) stays in the changelog only. Every note
  item still traces to a bullet; not every bullet earns a note item.
- **Lead with what the reader would name**: each item starts with a bold label — a screen, a
  feature, a role. A label appears once per section: its bullets merge into one item of at
  most three sentences, keeping what the reader would notice or act on and leaving the rest
  to the changelog. In a repository with several projects, the label starts with the project
  name.
- **Write for the reader**: what they can now do, what will look or behave differently, what
  no longer goes wrong. Fixes describe the symptom that stopped, not the cause. One or two
  sentences per item.
- **No code vocabulary**: no file, function, endpoint, table, or variable names — except in
  `해야 할 일`, where an operator may need the exact name of a tool, setting, or command.
- **No invented motivation or benefit**: state the change; add a consequence only when the
  diff shows it directly.
- **Empty sections are left out**, except `해야 할 일`, which then says `없습니다.`.
- **`내부 변경`** is the single template sentence with the count of omitted commits. Never
  itemize it.
- **`확인 필요`** is for the user, not the reader: they resolve each row and delete the
  section before sharing. It holds three kinds of rows — an effect you could not verify from
  the diff (with its sha and what to check), a loosened safeguard or removed restriction the
  user should confirm was intended (with its sha), and wording you doubt a non-developer
  would understand (no sha). An unverifiable effect goes here or into the `내부 변경` count,
  never into the body as a guess.

Keep the note to one screen. When the entry has many bullets, group harder rather than
listing longer.

## Rules

- **Language**: both documents are written in Korean. If `CHANGELOG.md` already exists in
  another language, keep that language for it.
- **Commits only**: nothing in either document may lack a commit in the range behind it.
- **No secrets**: setting names and purposes, never values. Do not read `.env` files.
- **Scope**: edit `CHANGELOG.md` and `docs/release-notes/` only.
- **Never commit, tag, or push.**

## Output

Report in Korean: the range (`<start>..HEAD`, commit count, how many documented and how many
omitted), the proposed version with the bump reason, one line per file written, the count of
`확인 필요` rows, whether uncommitted changes exist that were not covered, and a closing line
that nothing was committed or tagged.

## Example

One change at each of its three levels.

Commit:

```
feat: 주문 취소 엔드포인트 추가

- 결제 완료 전 주문만 취소 가능하도록 상태 검증
- 취소 시 재고 복원 및 알림 발송
```

Changelog bullet, under `### 추가`:

```
- 결제 완료 전 주문의 취소와 취소 시 재고 복원·알림 발송 (a1b2c3d)
```

Note item, under `## 새로 할 수 있는 것`:

```
- **주문 취소**: 결제가 끝나기 전의 주문은 취소할 수 있습니다. 취소하면 재고가 되돌아가고 알림이 발송됩니다.
```

A `refactor: 결제 모듈 구조 정리` commit whose diff moves code without changing behavior is
omitted from the changelog and counted in the note's `내부 변경`. A `chore: 권한 규칙 정비`
commit whose diff both blocks force-push and stops blocking reads of `.git` yields two
bullets — one under 보안, one under 변경 — and a `확인 필요` row asking whether the loosening
was intended. A `fix: 세션 만료 처리 수정` commit whose diff changes a timeout constant, when
the diff alone does not tell you what the user experiences, goes in the changelog under 수정
with exactly what the diff shows, and in the note under `확인 필요` rather than in the body.
