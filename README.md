# my-agents-kit

Claude Code 설정을 여러 프로젝트에 일관되게 이식하는 kit. 공통 원본(`CLAUDE.md` + `.claude/`)을
프로젝트에 **복사**해서 쓴다. 생성·빌드 단계는 없다 — Claude Code가 이 파일들을 네이티브로 읽는다.

## 설치

대상 프로젝트 루트에서:

```bash
cp -r <kit>/.claude <kit>/CLAUDE.md .
```

복사한 파일은 그 순간부터 프로젝트 소유 — 자유롭게 수정한다.

## 업데이트

kit을 최신으로 당긴 뒤, 원할 때 다시 복사하고 `git diff`로 확인한다. 전체를 덮을지 일부만
가져올지는 사용자가 판단한다(자동 병합·부분 동기화는 지원하지 않는다).

## 구조

- `CLAUDE.md` — 항상 로드되는 상시 규칙 (프로젝트에 복사되는 payload)
- `.claude/skills/` — 작업 절차 스킬. 실제 필요가 생기면 하나씩 추가한다.
- `.claude/hooks/` + `.claude/settings.json` — 위험 명령 가드·완료 알림 + 배선·권한

## 도구 범위

현재 **Claude Code 전용**. Codex 등 다른 도구가 필요하면 그때 스킬을 수동 변환해서 쓴다.
