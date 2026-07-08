# skills/

Codex와 Claude Code에서 공통으로 쓰는 skill 원본. **설치 대상은 `agent-kit.yml`의 `skills.include` 목록이 결정한다** — 여기 있어도 목록에 없으면 설치되지 않는다.

## 구조

```
skills/
└── <skill-name>/
    ├── SKILL.md          # 필수 — 스킬 본문
    └── references/       # 선택 — SKILL.md가 참조하는 번들 자료
```

## 작성 규칙

- **이름은 kebab-case.** 디렉토리명 = frontmatter의 `name` (예: `code-review`).
- **파일명은 `SKILL.md`로 고정.** 다른 이름을 쓰지 않는다.
- **frontmatter는 `name`·`description` 필수.** description은 "무엇을 하는지 + 언제 쓰는지(트리거)"를 담는다 — 에이전트가 이것으로 스킬을 선택한다. 다른 스킬과 트리거가 겹치지 않게 쓴다.
- **도구 중립으로 쓴다.** 본문에 `.claude/`·`.codex/` 경로, 슬래시 커맨드 문법, 서브에이전트 같은 특정 도구 기능을 넣지 않는다.
- **자립적으로 쓴다.** 다른 스킬은 **이름**으로(예: "per `write-tests`"), 번들 자료는 **폴더 상대경로**(`references/...`)로만 참조한다. 존재하지 않는 파일을 참조하지 않는다.
- **역할 분담:** 항상 로드되는 규칙(what)은 `context/`에, 스킬에는 필요할 때 로드되는 실행 절차(how)를 담는다. context 규칙과 모순되지 않게 쓴다.
- **본문 언어:** 문서(README 등)는 한국어, SKILL.md 본문은 영어(모델·도구 간 이식성, 기존 원본과 일치).

## agent별 차이는 override로

스킬은 기본 **공통 하나**(SKILL.md)로 유지한다. 특정 도구에서만 다르게 동작해야 하는 부분이 생기면 그때 해당 도구용 override를 추가한다 — **처음부터 분기하지 않는다.** (override 파일 형식은 첫 사례가 생길 때 확정한다.)

## 현재 스킬

| 스킬 | 역할 |
|---|---|
| `code-review` | 변경을 5축(정확성·가독성·아키텍처·보안·성능)으로 리뷰하고 발견을 해결 |
| `write-tests` | 리스크 기반으로 테스트할 것을 고르고 작성 (Prove-It 포함) |
| `debug-error` | 에러를 체계적으로 진단·수정 (재현→가설검증→근본원인→회귀 고정) |
| `pr-summary` | 브랜치 변경으로부터 PR 제목·설명 생성 |
| `refactor-plan` | 리팩토링을 안전한 소단계로 분해하는 계획 수립 |
