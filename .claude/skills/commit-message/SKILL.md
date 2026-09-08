---
name: commit-message
description: Write commit messages. Use when the user asks for a commit message, or asks to commit and a message must be written. Analyzes the changes and proposes a short Korean message with a `type(scope): summary` title and bullet body; when unrelated concerns are mixed, proposes how to split them into separate commits. Never runs the commit itself.
argument-hint: [hint about intent, scope, or emphasis]
---

# Commit message

Read the changes and **propose** commit messages only. The user commits themselves or asks
separately.

## 1. Understand the changes

- Run `git status --short` for the overall state.
- If anything is staged, review only `git diff --cached` — respect the range the user chose.
  Otherwise the scope is `git diff HEAD` plus every untracked file.
- Run `git log --oneline -5` to see this repository's title style.
- If the user gave a hint, let it drive the interpretation of intent.

## 2. Split into commits

One commit is one concern. A concern is a purpose, not a file type: changes made for the same
reason (one cleanup pass, one feature) belong together even when they touch unrelated files.
When changes serve different purposes, split them and propose a message plus the list of
included files for each commit. When the split is debatable, split anyway and state the reason
in one line.

Splits are at file granularity. When a single file mixes changes for different purposes, say
so, assign the whole file to the commit it fits best, and suggest that the user stage the
hunks manually (`git add -p`) and call the skill again if they want a clean split.

## 3. Message format

```
type(scope): summary

- feature implemented or changed 1
- feature implemented or changed 2
```

- **Language**: the message is written in Korean.
- **Title**: under 50 characters, no trailing period. End with what was done, in the style of
  `추가` (add), `수정` (fix), `제거` (remove), `전환` (switch).
- **type**: `feat` new capability · `fix` bug fix · `refactor` structural change with no behavior
  change · `docs` documentation · `test` tests · `chore` config and housekeeping · `style`
  formatting · `perf` performance · `build` build and dependencies · `ci` CI · `revert` revert.
- **scope**: in a monorepo (project directories under a workspace root such as `packages/`,
  `apps/`, `services/`), use the affected project name. In a single-project repository omit it,
  and use a module name only when the change is clearly confined to one module.
- **Body**: after a blank line, 1–4 bullets, one line each. Each bullet names a feature that was
  implemented or changed. Do not list file names, describe implementation details, or add
  background paragraphs. Omit the body when the title alone explains a small change.
- **No trailers**: never append `Co-Authored-By` or any other trailer.

## 4. Output

For each commit, present the message in a code block followed by one line listing the included
files, so the user can copy it as-is. Do not run any commit command.

If the user then asks to commit: `git add` only the proposed files by name, pass the message via
heredoc to `git commit`, never use `--amend` or `--no-verify`, and confirm with `git status`
afterwards. Never push.

## Examples

```
feat(api): 주문 취소 엔드포인트 추가

- 결제 완료 전 주문만 취소 가능하도록 상태 검증
- 취소 시 재고 복원 및 알림 발송
```

```
docs: README 설치 절차 갱신
```
