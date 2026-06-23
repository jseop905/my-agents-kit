---
name: project
description: Analyze the codebase and generate project wiki documentation for efficient context scoping
---

프로젝트를 분석하여 `docs/wiki/`에 문서를 생성한다. 출력 디렉토리가 없으면 먼저 생성한다.

**이 커맨드는 별도 에이전트에게 분석을 위임한다.** `.claude/agents/project-analyst.md` 페르소나로 에이전트를 실행하여 컨텍스트를 분리한다.

## 실행 흐름

1. `docs/wiki/`에 기존 문서가 있는지 확인한다
   - 있으면: 사용자에게 덮어쓸지 확인한다
   - 없으면: 진행한다
2. `.claude/agents/project-analyst.md` 에이전트에게 분석을 위임한다
3. 에이전트가 `.claude/skills/wiki-management.md` 규칙에 따라 문서를 생성한다
4. 생성된 문서 목록을 사용자에게 보고한다
5. `[추정]` 태그가 포함된 항목이 있으면 사용자 검증을 요청한다

## 생성 문서

문서는 `.claude/skills/wiki-management.md`의 표에 따라 생성한다.

문서 포맷과 규칙은 `.claude/skills/wiki-management.md`를 따른다.
