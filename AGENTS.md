# my-agents-kit — 개발 지침

> 이 파일은 **이 repo(kit 자체)를 작업할 때** 로드되는 공통 지침이다.
> 설계 방향·결정·검증 사실은 `DESIGN.md`, 설치·사용법은 `README.md`.

## 이 repo는

여러 AI 코딩 에이전트(Claude Code·Codex)용 설정을 **공통 원본 → 생성물** 모델로 관리하는 installer kit. 공통 원본은 이 repo가 들고, `bin/sync`가 다운스트림 프로젝트에 도구별 파일을 생성한다.

## 구조

- `agent-kit.yml` — 무엇을 어디에 설치하는지 선언하는 manifest. **등록된 것만 설치 대상.**
- `context/*.md` — 항상 로드되는 공통 규칙 조각 (역할 비중첩: base/testing/security/git/collaboration)
- `skills/<name>/SKILL.md` — 필요 시 로드되는 실행 절차 (작성 규칙: `skills/README.md`)
- `templates/*.hbs` — AGENTS.md·CLAUDE.md 생성 템플릿 (`kit:keep` 계약)
- `profiles/*.yml` — 프로젝트 유형별 preset (`profiles/README.md`)
- `bin/sync.mjs` — 생성 스크립트 (무의존 — 내장 최소 YAML 파서·렌더러)
- `hooks/*.sh` — 공통 hook 스크립트 (프로토콜·배선: `hooks/README.md`, Claude 배선 원본은 `templates/settings.json`)

**레이어링 기준**: 도구 무관 작업 방식 → `context/`, Claude Code만의 로딩/동작 차이 → `templates/CLAUDE.md.hbs`, Codex만의 설정/동작 차이 → Codex 템플릿 또는 hook config.

## 편집 규칙 (Always)

- **스킬·context는 툴 중립 유지** — 본문에 `.claude/`·`.codex/` 경로, 서브에이전트, 슬래시 문법을 넣지 않는다. 다른 스킬은 **이름**으로, 번들 파일은 **폴더 상대경로**(`references/...`)로 참조.
- **생성물 계약 동기화** — `kit:keep` 마커나 템플릿 데이터 계약을 바꾸면 `templates/`와 `bin/sync.mjs`를 함께 바꾸고, 생성 테스트로 확인한다.
- **동기화** — 자산을 추가/삭제/개명하면 `agent-kit.yml` 등록 목록과 `README.md`·`DESIGN.md` 상호 참조를 함께 갱신하고, `grep`으로 고아·깨진 참조를 확인한다.
- **커밋**은 `context/git.md` 원칙을, **테스트**는 `write-tests` 스킬을 따른다. `bin/` 변경은 `node --test bin/sync.test.mjs`로 검증한다.

## Never

- speculative 추가 (안 쓰는 기능/추상화/manifest 필드).
- 스킬·context에 도구 전용 요소 하드코딩.
- 확정 없이 자산 삭제.

## Ask First

- 새 스킬/context 조각/profile 추가, 자산 삭제·개명.
- manifest 스키마·`kit:keep` 계약·레이어 구조 변경.
