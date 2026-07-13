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
- `templates/`: AGENTS.md, CLAUDE.md, 설정 파일 생성을 위한 템플릿 (데이터 계약은 각 템플릿 상단 주석)
- `profiles/`: 프로젝트 유형별 preset (스키마: `profiles/README.md`)
- `bin/`: 실행 스크립트 (`build.mjs` — dist 패키지 생성)
- `agent-kit.yml`: kit 설정 manifest

## Usage

**패키지 생성** (kit repo에서):

```bash
node bin/build.mjs                  # dist/ 에 default profile로 생성
node bin/build.mjs --profile node   # agent-kit.yml에 등록된 profile로 생성
```

**설치·업데이트** (대상 프로젝트 루트에서):

```bash
cp -r <kit>/dist/. .   # 전체 복사(권장) — 기존 동명 파일을 덮어쓴다
```

- build는 kit 밖에 아무것도 쓰지 않는다 — 산출물은 `<kit>/dist` 뿐이고, 프로젝트로 가져가는 것은 항상 사용자의 명시적 복사다.
- `context.include` 조각들이 순서대로 합쳐져 **AGENTS.md**로 렌더되고, **CLAUDE.md**는 `@AGENTS.md` 셔임 + Claude 전용 지침으로 생성된다. skills는 `.claude/skills/`·`.agents/skills/` 양쪽 트리로, hooks 스크립트·settings(Claude 배선+권한)는 `.claude/` 아래로 담긴다.
- **복사된 파일은 프로젝트 소유** — 자유롭게 수정해도 된다. 파일 헤더의 kit 버전 스탬프로 어떤 버전을 쓰는지 식별한다.
- **업데이트 = 통째 교체**: kit을 pull → 재빌드 → 전체 복사 → `git diff`로 변경 확인(프로젝트 수정분은 직접 복원) → 커밋. 부분 업데이트·병합은 지원하지 않는다.
- 일부만 골라 가도 된다(skill 폴더는 자립적) — 가져간 뒤의 관리 책임은 프로젝트에 있다.
- 개선하고 싶은 내용이 생기면 프로젝트의 생성물이 아니라 **kit 원본**(context/·skills/·templates/)을 고친다 — 다음 빌드부터 모든 프로젝트에 전파된다.

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
| bin (2) | `build.mjs` — dist 패키지 생성 · `build.test.mjs` — 핵심 로직 테스트 (`node --test bin/build.test.mjs`) |

설계 방향·결정·검증 사실의 상세는 `DESIGN.md`.
