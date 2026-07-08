# my-agents-kit

Codex와 Claude Code에서 함께 사용할 수 있는 agent context, skills, hooks 설정을 관리하는 portable kit.

## Goal

- 여러 프로젝트에 일관된 AI agent 설정을 이식한다.
- AGENTS.md와 CLAUDE.md를 직접 중복 관리하지 않는다.
- 공통 원본을 기준으로 도구별 설정 파일을 생성한다.
- skills와 hooks는 최대한 공통으로 관리하고, 필요한 경우에만 agent별 override를 둔다.

## Directory Structure

- `context/`: AGENTS.md에 들어갈 공통 작업 지침 — base(작업 원칙)·testing·security·git·collaboration, 역할 비중첩
- `skills/`: Codex와 Claude Code에서 사용할 공통 skill 원본 (작성 규칙: `skills/README.md`)
- `hooks/`: agent hook에서 실행할 공통 스크립트와 정책 — 스크립트는 공통, 배선은 도구별 (`hooks/README.md`)
- `templates/`: AGENTS.md, CLAUDE.md, 설정 파일 생성을 위한 템플릿 (`kit:keep` 보존 계약 포함)
- `profiles/`: 프로젝트 유형별 preset (스키마: `profiles/README.md`)
- `bin/`: install, sync, doctor 같은 실행 스크립트 (현재: `sync.mjs` MVP)
- `agent-kit.yml`: kit 설정 manifest

## Usage

프로젝트에 지시문 파일을 생성한다:

```bash
node <kit>/bin/sync.mjs                # 현재 디렉토리(프로젝트 루트)에 생성
node <kit>/bin/sync.mjs --out <dir>    # 지정 디렉토리에 생성
```

- `agent-kit.yml`의 `context.include` 조각들이 순서대로 합쳐져 **AGENTS.md**로 렌더되고, **CLAUDE.md**는 `@AGENTS.md` 셔임 + Claude 전용 지침으로 생성된다.
- 생성 파일의 `<!-- kit:keep:... -->` 영역(명령어·프로젝트 노트)은 **프로젝트 소유** — 직접 수정해도 재생성 시 보존된다. 그 밖의 영역은 kit 원본(context/·templates/)을 수정한 뒤 재생성한다.
- MVP 범위: 지시문 생성만. skills·hooks·profiles 설치는 미구현 — 당분간 수동:
  - skills: `cp -r <kit>/skills/<name> .claude/skills/` 또는 `.agents/skills/`
  - hooks(Claude): 스크립트를 `.claude/hooks/`에 복사(`chmod +x`), `templates/settings.json`을 `.claude/settings.json`으로 복사(기존 파일이 있으면 hooks 섹션만 병합)

## Principles

- 공통 원본을 먼저 만들고, Codex/Claude용 파일은 생성물로 다룬다.
- skill은 `skills/<skill-name>/SKILL.md` 구조를 기본으로 한다.
- agent별 차이는 처음부터 분리하지 않고, 필요할 때 override로 처리한다.
- hook은 공통 script를 공유하고, 설정 파일만 agent별로 생성한다.
- 한 번에 크게 만들지 않고 작은 단위로 확장한다.

## 자산 현황

| 종류 | 목록 |
|---|---|
| context (5) | `base` `testing` `security` `git` `collaboration` |
| skills (5) | `code-review`(+security-checklist) `write-tests` `debug-error` `pr-summary` `refactor-plan` |
| hooks (3) | `db-guard` `remote-command-guard` `notify` |
| profiles (2) | `default` `node` |
| templates (3) | `AGENTS.md.hbs` `CLAUDE.md.hbs` `settings.json`(Claude 배선+권한) |
| bin (2) | `sync.mjs` — 지시문 생성 MVP · `sync.test.mjs` — 핵심 로직 테스트 (`node --test bin/sync.test.mjs`) |

설계 방향·결정·검증 사실의 상세는 `DESIGN.md`.
