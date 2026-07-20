# skills/

작업 절차를 담는 Agent Skills. 지금은 비어 있다 — 실제 작업 마찰이 생겼을 때 하나씩 추가한다
(speculative 추가 금지).

## 규칙

- 각 스킬은 `<name>/SKILL.md` 폴더 구조. `name`·`description` 프론트매터 필수.
- **`description`이 곧 트리거**다 — "언제 이 스킬을 쓰는지"를 명확히 쓴다. 트리거가 다른 스킬과
  겹치지 않게 한다.
- 스킬은 자립적으로: 번들 파일은 폴더 상대경로(`references/...`)로, 다른 스킬은 이름으로 참조한다.
