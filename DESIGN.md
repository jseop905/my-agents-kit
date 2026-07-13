# my-agents-kit — 설계 (DESIGN)

> 프레임워크 자체의 설계 방향·결정·검증 사실. 새 세션에서 이 문서만 읽으면 맥락을 잡고 이어갈 수 있게 유지한다. 사용법은 `README.md`, repo 작업 지침은 `AGENTS.md`.

## 1. 무엇을 · 왜

여러 프로젝트에 일관된 AI 에이전트 설정을 이식하는 **패키지 생성 kit**. 공통 원본(context·skills·hooks)을 이 repo가 들고, `bin/build`가 도구별 완성 패키지를 `dist/`에 **생성**한다. 프로젝트 설치·업데이트는 사용자가 dist를 직접 복사한다(전체 교체 권장). AGENTS.md·CLAUDE.md를 프로젝트마다 중복 관리하지 않는다.

- 대상 도구: **Claude Code + Codex** (+ AGENTS.md/Agent Skills 표준을 읽는 도구들).
- **2026-07 재설계(v3)**: "참조 공유" 모델(v2: 커맨드 셔임 + 수동 복사) → "생성" 모델. 스킬 콘텐츠는 v2에서 증류·병합해 승계. 이후 sync(프로젝트에 직접 쓰기)에서 **패키지 배포 모델**로 조정 — 결정 로그 2026-07-13.

## 2. 아키텍처 — 원본(이 repo) → 패키지(dist/) → 프로젝트(사용자 복사)

| 원본 | 역할 | 패키지 내 위치 (프로젝트 루트 기준) |
|---|---|---|
| `context/*.md` | 항상 로드되는 공통 규칙 (역할 비중첩 파티션) | 이어붙여 → AGENTS.md |
| `templates/*.hbs` | 지시문 파일 골격 | AGENTS.md · CLAUDE.md(`@AGENTS.md` 셔임) |
| `skills/<name>/` | 필요 시 로드되는 실행 절차 | `.claude/skills/` · `.agents/skills/` (양쪽 동일 복사) |
| `profiles/*.yml` | 프로젝트 유형별 preset | `build --profile <name>`로 빌드 시 선택 |
| `hooks/*.sh` | 공통 hook 스크립트 (JSON stdin / exit 2 프로토콜) | `.claude/hooks/` + `.claude/settings.json` 배선(원본: `templates/settings.json`) |
| `agent-kit.yml` | manifest — 등록된 것만 패키지 포함 | — |

**레이어링 기준** (지시문을 어디에 두는가):

- 도구와 무관한 작업 방식 → `context/*.md`
- Claude Code만의 로딩/import/동작 차이 → `templates/CLAUDE.md.hbs` (현재: `@AGENTS.md` import + 플랜 모드 1건)
- Codex만의 설정/동작 차이 → Codex 템플릿 또는 hook config (아직 사례 없음)

## 3. 계약 (불변식)

- **패키지 경계**: build는 kit 밖에 쓰지 않는다 — 산출물은 `<kit>/dist` 뿐, 설치·업데이트는 사용자의 명시적 복사(전체 교체 권장, 부분 업데이트·병합 비지원). 복사된 생성물은 **프로젝트 소유**(수정 자유) — kit은 보존·병합 책임을 지지 않고, 프로젝트 수정분은 git으로 복원한다. 생성 파일 헤더의 kit 버전 스탬프로 사용 버전을 식별한다.
- **manifest 등록**: skills·profiles는 `agent-kit.yml`에 나열된 것만 패키지 포함/선택 대상. repo에 있어도 목록에 없으면 off.
- **profile 의미론**: 생략 필드 = 전역 상속, 명시 = 통째 교체(부분 병합 없음, `extends` 없음). `commands` 시드는 빌드 시 명령어 섹션의 초기값으로 렌더된다.
- **context 파티션**: base(접근 원칙)/testing/security/git/collaboration — 역할 비중첩. 일반 원칙은 base에, 도메인 인스턴스는 각 파일에(의도된 계층).
- **스킬 규칙**: 툴 중립·자립(스킬은 이름, 번들은 `references/` 상대경로로만 참조)·트리거 비중첩. 도구별 차이는 override로 — 형식은 첫 사례에서 확정. 상세는 `skills/README.md`.

## 4. 검증된 사실 (Codex ↔ Claude) — 재조사 방지

*mid-2026 기준, 공식 문서(developers.openai.com/codex, docs.claude.com, agents.md) 확인.*

- **지시문**: Codex는 `AGENTS.md` 직독(글로벌→repo root→cwd 병합, 기본 32KiB 상한). Claude는 `CLAUDE.md`만 읽음 → `@AGENTS.md` import로 브리지. AGENTS.md는 개방표준(Linux Foundation AAIF, 2025-12).
- **스킬**: Agent Skills 개방표준(agentskills.io, 2025-12 공표). `<name>/SKILL.md` + `name`·`description` 프론트매터 + `references/` 등 하위폴더. Claude `.claude/skills/`, Codex `.agents/skills/`(+`~/.codex/skills`, `.codex/skills`도 지원).
- **커맨드**: Codex 커스텀 프롬프트(`~/.codex/prompts/`)는 **공식 deprecated + 회귀 버그(#15941)**. 스킬이 유일한 안정 vehicle — v3에서 커맨드 셔임 레이어를 폐지한 근거.
- **서브에이전트**: Codex는 `.codex/agents/*.toml`, 단 SKILL.md의 서브에이전트 지시가 무시되는 **열린 버그 #23496** — 스킬 본문에 서브에이전트를 넣지 않는 근거.
- **훅**: 스크립트(JSON stdin / exit 2 규약)는 도구 간 재사용 가능, 배선은 다름 — Claude `settings.json` vs Codex `config.toml`(프로젝트 수준 경로 미확정 → manifest `codex.settings: null`).
- **Claude settings.json 문법**(2026-07, code.claude.com/docs 확인): hook `timeout`은 **초 단위**(command 기본 600초). permission 규칙은 `Tool(specifier)` 형태만 유효 — **닫는 괄호 밖 `*`는 무효 문법**, 와일드카드는 specifier 안 어느 위치든 가능, `|`는 규칙 문법이 아니라 명령 구분자(compound command는 subcommand별로 독립 평가).
- **Claude hook 이벤트**(2026-07, 문서 확인): `Notification` 입력에 `notification_type`(문서화 값: permission_prompt·idle_prompt·auth_success·elicitation_*·agent_needs_input·agent_completed)·`message`·`title` 존재. `Stop`은 **정상 응답 완료 시에만** 발화(interrupt 시 미발화), 입력에 `stop_hook_active`(다른 stop 훅이 대화를 이어가는 중 = true), exit 0은 무부작용·exit 2는 중단 차단.

## 5. 로드맵

- ✅ manifest(`agent-kit.yml`) · context 5조각 · templates · skills 5종(구 8종 병합) · profiles 2종 · hooks 3종 정비
- ✅ **build 전환(2026-07-13)** — `bin/sync`를 패키지 생성기 `bin/build.mjs`로 재편: `dist/`에 완성 패키지 생성(instructions 렌더 + skills·hooks·settings 복사), profiles 해석(`--profile`), git describe 버전 스탬프, keep 보존 로직 제거. 문서·템플릿도 build 모델 기준으로 재작성.

## 6. 결정 로그

- **패키지 배포 모델 전환(2026-07-13)**: sync(다운스트림에 직접 생성) → **build(패키지 생성)** 재설계. 배경 — 기존 에이전트 설정이 있는 프로젝트를 도구가 덮어쓸 위험을 로직(소유권 판별·lockfile·해시 — 검토 후 불채택)이 아니라 **구조로 제거**: 도구는 kit 안 `dist/`에만 완성 패키지(instructions + skills + hooks + settings)를 만들고, 프로젝트로의 설치·업데이트는 **사용자의 명시적 복사**(전체 교체 권장). 부분 업데이트는 문제 소지가 많아 **의도적 비지원**. 프로젝트 전용 커스텀 보존도 도구 책임이 아님(사용자가 git으로 관리) → **`kit:keep` 보존 계약 폐기**, `bin/install`도 불필요(복사가 곧 설치). 생성물에 kit 버전을 스탬프해 프로젝트별 사용 버전을 식별(전체 업데이트 판단 근거). **구현(같은 날)**: dist는 단일 트리(양 도구 파일이 경로 비충돌 — 전체 복사 한 번으로 양쪽 설치, dist/는 gitignore, 재빌드 시 통째 재생성), `{{project_name}}` 제거(일반 제목 — 생성물이 프로젝트 소유라 복사 후 자유 수정), 버전 스탬프는 `git describe --tags --always --dirty`(태그 전엔 커밋 해시). 내장 YAML 파서에 블록 스칼라(`|`) 지원 추가(profiles의 `commands` 시드가 사용 — 블록 안은 `#` 주석 스트립 예외), `commands` 시드는 매 빌드 렌더("첫 설치에만" 규칙은 keep 계약과 함께 폐기). `bin/build.test.mjs` 17케이스(파서·렌더러·profile 해석·패키지 생성).
- **v3 재설계(2026-07)**: 디렉토리 구조·manifest·keep 계약·레이어링 기준 확정. sync 검증 — 미니 YAML 파서는 PyYAML과 교차검증 동일, 렌더러는 handlebars와 byte-diff 동일, keep 보존·kit 루트 가드 테스트 통과.
- **스킬 병합(8→5)**: `code-review`(←code-review-and-quality+security-checklist) · `write-tests`(←testing-strategy+test-driven-development) · `debug-error`(신규) · `pr-summary`(←git-workflow 일부) · `refactor-plan`(←planning+incremental). 부활 후보: spec 스킬, exploration 스킬, commit-message 스킬.
- **구세계 정리(2026-07)**: `commands/`(셔임 레이어 폐지 — 스킬 자동 발견에 위임), `agents/code-reviewer`, `*.template`(→`templates/*.hbs`) 삭제. README를 v3 기준 재작성. 전부 git 히스토리에 보존.
- **hooks 정비(2026-07)**: 스크립트 3종 무수정 유지·manifest 등록, `settings.json` → `templates/settings.json`(Claude 배선+권한 원본). manifest `hooks:`는 **평면 경로 리스트** — 내장 YAML 파서가 list-of-maps를 지원하지 않아 의도적 제약. 이벤트 메타데이터는 `hooks/README.md`에 두고, sync가 hooks를 배울 때 스키마와 파서를 함께 확장한다. `notify.sh`의 제목·notification_type은 Claude 페이로드 스키마 종속(문서화됨).
- **생성물 검토·skills 점검(2026-07)**: 생성된 AGENTS.md·CLAUDE.md를 5기준(순서·중복·Claude 전용·명료성·양도구 전달)으로 검토 — 중복 0건, 확정 4건 반영. 핵심: 플랜 승인 정책("설계 선택이 개입하는 큰 변경은 계획 먼저")을 `context/collaboration.md`로 승격해 **양 도구가 같은 정책을 공유**하고, CLAUDE.md.hbs에는 플랜 모드라는 수행 메커니즘 매핑만 남김(레이어링 기준 재확인). 부수: 생성 마커에 원본 소재(kit repo) 명시, 템플릿 이중 빈 줄 제거. manifest `skills:`를 `skills.include`로 개편(context.include와 동형 — sync는 아직 skills를 읽지 않아 무영향). 스킬 5종은 frontmatter·kebab-case·툴 중립 점검 통과, 본문 무수정.
- **코드 점검(2026-07)**: `bin/sync.mjs` 렌더러가 each로 삽입된 조각 본문을 템플릿으로 재해석하던 결함 수정 — 변수 치환을 each 전개보다 앞으로 옮기고 lookaround로 `{{{this}}}` 오인을 차단(handlebars 의미론과 일치, 적대 조각 포함 byte-diff 동일 재검증). `--out` 값 누락 시 명확한 에러로 중단. `templates/settings.json` hook timeout 5000→5(초 단위 — §4 문법 사실 참조).
- **permissions 재작성 + sync 테스트(2026-07)**: `templates/settings.json`의 무효 문법(`)*`) deny 규칙 전면 재작성. 분류 기준 — **deny = 회복 불가·치명(정당한 사용 없음)**: rm 루트/홈/cwd 정확 매칭, sudo, chmod 777, eval·`sh -c`·`bash -c`, `.ssh`/셸 rc 리다이렉트, main·master force push(어순 무관 와일드카드), npm publish, `.env`·`.git` 파일 접근. **ask = 파괴적이나 정당한 사용 존재 + 원격 작업**: `rm -rf *`(치명 대상은 deny가 우선), git reset --hard/clean/restore/merge/rebase(deny에서 이동), curl·wget·ssh·scp·rsync(원격 — 신규). 매칭 안 되는 명령은 default 모드에서 프롬프트로 강등되는 것이 안전망. `bin/sync.mjs`는 함수 export + 직접 실행 가드로 리팩터하고 `bin/sync.test.mjs`(node:test, 무의존) 13케이스 추가 — 파서·렌더러(재해석 금지 회귀 포함)·keep 보존 불변식. CLI 표면은 용법 미확정이라 테스트 제외. remote-command-guard의 ssh 옵션 오탐은 보류(사용자 결정).
- **notify 개선 + 완료 알림(2026-07)**: `Stop` 이벤트를 notify.sh에 배선해 응답 정상 완료 시 "작업 완료" 알림(§4 이벤트 사실 기반 — `stop_hook_active`면 중복 방지 skip). 죽어 있던 터미널 벨 폴백을 `/dev/tty` 직접 쓰기로 소생(기존 stderr 출력은 상위 `2>/dev/null`이 삼켰음). 비문서 타입 `task_completed`를 문서화 타입 `agent_completed`로 교체. 알림 hook timeout 5→10초(PowerShell 기동 여유).
- **v2에서 승계한 결정**: 드롭 — build/test/debug/pr 커맨드, test-engineer·project-analyst 에이전트, wiki 스킬. push는 사용자가 직접(`! git push`).
