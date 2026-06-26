# my-claude-v2

Claude Code를 위한 커맨드, 스킬, 에이전트, 보안 훅 모음.
프로젝트의 `.claude/` 디렉토리에 복사하여 사용한다.

## 사전 요구사항

- **Claude Code** CLI 설치

## 설치

### 1. 리소스 복사

```bash
mkdir -p .claude/agents .claude/commands .claude/hooks .claude/skills .claude/references
cp -r my-claude-v2/agents/*     .claude/agents/
cp -r my-claude-v2/commands/*   .claude/commands/
cp -r my-claude-v2/hooks/*      .claude/hooks/
cp -r my-claude-v2/skills/*     .claude/skills/
cp -r my-claude-v2/references/* .claude/references/
```

필요한 것만 골라 복사해도 된다.

### 2. settings.json 복사

```bash
cp my-claude-v2/settings.json .claude/settings.json
```

기존 `.claude/settings.json`이 있으면 `hooks` 섹션만 병합한다.

### 3. CLAUDE.md 생성

```bash
cp my-claude-v2/CLAUDE.md.template ./CLAUDE.md
```

프로젝트의 기술 스택, 명령어, 코드 스타일에 맞게 수정한다.

### 4. 훅 실행 권한 (Linux/macOS)

```bash
chmod +x .claude/hooks/*.sh
```

---

## 매뉴얼

### Commands

| 커맨드 | 설명 |
|--------|------|
| `/spec` | 요구사항을 구조화된 스펙으로 정리. 목적, 기능, 기술 스택, 경계를 질문하고 `docs/SPEC.md` 생성 |
| `/plan` | 스펙 또는 요청을 수직 슬라이스로 작업 분해. wiki를 참고해 범위를 좁힌 뒤 `docs/tasks/`에 계획 저장 |
| `/build` | 다음 pending 작업을 TDD로 구현. RED → GREEN → 리팩터링 → 커밋 |
| `/test` | 테스트 작성. 버그는 Prove-It 패턴(재현 테스트 FAIL → 수정 → PASS) |
| `/code-review` | 5축 코드 리뷰 (정확성, 가독성, 아키텍처, 보안, 성능). Critical/Important/Suggestion 분류 |

### Agents

| 에이전트 | 역할 |
|----------|------|
| `code-reviewer` | `/code-review`의 리뷰어 페르소나. 5축 리뷰 기준과 판단 |
| `test-engineer` | `/test`의 QA 페르소나. 테스트 전략, 커버리지 분석, Prove-It 패턴 |

### Skills

| 스킬 | 내용 |
|------|------|
| `test-driven-development` | TDD 사이클 (RED → GREEN → REFACTOR) |
| `incremental-implementation` | 점진적 구현과 검증 루프 |
| `spec-driven-development` | 스펙 작성 프로세스와 구조 |
| `planning-and-task-breakdown` | 수직 슬라이스 작업 분해, 의존성 그래프 |
| `code-review-and-quality` | 5축 리뷰 기준과 심각도 분류 |
| `git-workflow-and-versioning` | 브랜치 전략, 커밋 컨벤션, 버전 관리 |
| `debugging-and-error-recovery` | 디버깅 접근법, 에러 복구 전략 |

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
| `testing-patterns.md` | `/test`, `/build` |

---

## 커스터마이즈

- **선택적 복사** — 사용하지 않는 파일은 복사하지 않으면 된다.
- **경로 수정** — commands 내 산출물 경로(`docs/SPEC.md`, `docs/tasks/`)는 프로젝트에 맞게 변경.
- **hooks 선택** — 필요한 훅만 `settings.json`에 등록.
- **references 교체** — 프로젝트 기술 스택에 맞는 체크리스트로 교체 또는 보강.
- **CLAUDE.md** — `CLAUDE.md.template`을 기반으로 프로젝트에 맞게 수정.
