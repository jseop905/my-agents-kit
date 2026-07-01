# my-agents-kit

AI 코딩 에이전트용 커맨드·스킬·에이전트·훅·지침 모음. 공통 지침(`AGENTS.md`)은 Claude Code·Codex 등에서 공유하고, 나머지 리소스는 현재 Claude Code(`.claude/`) 기준이다 (다른 도구 지원은 점진 확장).

## 사전 요구사항

- **Claude Code** CLI 설치

## 설치

### 1. 리소스 복사

```bash
mkdir -p .claude/agents .claude/commands .claude/hooks .claude/skills .claude/references
cp -r my-agents-kit/agents/*     .claude/agents/
cp -r my-agents-kit/commands/*   .claude/commands/
cp -r my-agents-kit/hooks/*      .claude/hooks/
cp -r my-agents-kit/skills/*     .claude/skills/
cp -r my-agents-kit/references/* .claude/references/
```

필요한 것만 골라 복사해도 된다.

### 2. settings.json 복사

```bash
cp my-agents-kit/settings.json .claude/settings.json
```

기존 `.claude/settings.json`이 있으면 `hooks` 섹션만 병합한다.

### 3. AGENTS.md · CLAUDE.md 생성

```bash
cp my-agents-kit/AGENTS.md.template ./AGENTS.md   # 공통 지침 (도구 무관)
cp my-agents-kit/CLAUDE.md.template ./CLAUDE.md   # Claude Code 커맨드 매핑 (@AGENTS.md import)
```

`AGENTS.md`에 프로젝트의 기술 스택·명령어·코드 스타일·경계를 채운다 — Codex 등 AGENTS.md를 읽는 도구가 이 파일을 공유한다. `CLAUDE.md`는 `@AGENTS.md`로 공통 지침을 불러오고 Claude 슬래시 커맨드 워크플로만 담으므로 그대로 두면 된다.

### 4. 훅 실행 권한 (Linux/macOS)

```bash
chmod +x .claude/hooks/*.sh
```

---

## 매뉴얼

### Commands

| 커맨드 | 설명 |
|--------|------|
| `/explore` | 코드베이스 일부를 조사해 설명. 탐색은 서브에이전트가 수행해 메인 컨텍스트를 절약. `/explore save`로 `docs/explore/`에 저장 |
| `/spec` | 요구사항을 구조화된 스펙으로 정리. 목적, 기능, 기술 스택, 경계를 질문하고 `docs/SPEC.md` 생성 |
| `/plan` | 스펙 또는 요청을 수직 슬라이스로 작업 분해. 관련 코드를 읽어 영향 범위를 좁힌 뒤 `docs/tasks/`에 계획 저장 |
| `/code-review` | 5축 코드 리뷰 (정확성, 가독성, 아키텍처, 보안, 성능). Critical/Important/Suggestion 분류 |
| `/commit` | 작업 변경사항에서 컨벤션 커밋 메시지 추출. 기본은 메시지만, `/commit go`로 바로 커밋. 관심사별 원자 분할 제안 |

### Agents

| 에이전트 | 역할 |
|----------|------|
| `code-reviewer` | `/code-review`의 리뷰어 페르소나. 5축 리뷰 기준과 판단 |

### Skills

| 스킬 | 내용 |
|------|------|
| `testing-strategy` | 테스트 정책 — 무엇을(리스크 기반)·언제(상황별)·유지관리 |
| `test-driven-development` | TDD 사이클 (RED → GREEN → REFACTOR) |
| `incremental-implementation` | 점진적 구현과 검증 루프 |
| `spec-driven-development` | 스펙 작성 프로세스와 구조 |
| `codebase-exploration` | 코드 탐색·설명 방법 — 진입점→흐름→패턴, 결론·`file:line` 중심(덤프 금지) |
| `planning-and-task-breakdown` | 수직 슬라이스 작업 분해, 의존성 그래프 |
| `code-review-and-quality` | 5축 리뷰 기준과 심각도 분류 |
| `git-workflow-and-versioning` | 브랜치 전략, 커밋 컨벤션, 버전 관리 |

### Hooks

| 훅 | 시점 | 역할 |
|----|------|------|
| `db-guard.sh` | Bash 실행 전 | 위험 SQL 차단 (DROP, TRUNCATE, WHERE 없는 DELETE) |
| `remote-command-guard.sh` | Bash 실행 전 | 원격 세션 위험 명령 차단 |
| `notify.sh` | 알림 이벤트 | 크로스플랫폼 알림 (Windows/WSL/Linux) |

### References

| 레퍼런스 | 참조 시점 |
|----------|-----------|
| `security-checklist.md` | `/code-review` |
| `performance-checklist.md` | `/code-review` |
| `testing-patterns.md` | `test-driven-development`·`testing-strategy` skill |

---

## 커스터마이즈

- **선택적 복사** — 사용하지 않는 파일은 복사하지 않으면 된다.
- **경로 수정** — commands 내 산출물 경로(`docs/SPEC.md`, `docs/tasks/`)는 프로젝트에 맞게 변경.
- **hooks 선택** — 필요한 훅만 `settings.json`에 등록.
- **references 교체** — 프로젝트 기술 스택에 맞는 체크리스트로 교체 또는 보강.
- **CLAUDE.md** — `CLAUDE.md.template`을 기반으로 프로젝트에 맞게 수정.
