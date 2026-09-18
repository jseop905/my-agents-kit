# my-agents-kit

Claude Code 개인 설정 kit입니다. 프로젝트 루트에 그대로 복사해 넣는 `.claude/` 트리와 `CLAUDE.md`
한 장으로 이루어져 있고, 생성 단계나 설치 도구는 없습니다.

```
.claude/                kit 소유. 업데이트 때 통째로 덮어씁니다
  rules/kit.md         모든 작업에 걸리는 상시 규칙 (스킬 분담, 훅 대응, 계획 승인, 커밋, 외부 출력·제한)
  settings.json        권한 규칙, 훅 배선, 커밋 attribution
  hooks/               안전 가드·자동 포맷·알림·기록 훅 6종
  skills/              반복 작업용 스킬 3종
CLAUDE.md               프로젝트 소유. 프로젝트 규칙만 담고, 처음 한 번만 복사합니다
```

상시 규칙이 `CLAUDE.md`가 아니라 `.claude/rules/kit.md`에 있는 이유는 업데이트 때문입니다. Claude Code는
`.claude/rules/` 아래 `.md` 파일을 `CLAUDE.md`와 같은 우선순위로 자동 로드하므로, `.claude/`만 다시 복사하면
새 상시 규칙이 따라오고 프로젝트가 `CLAUDE.md`에 적어 둔 규칙은 건드리지 않습니다.

## 설치와 업데이트

- **처음 설치**: `.claude/` 폴더와 `CLAUDE.md`를 프로젝트 루트에 복사합니다. 프로젝트 규칙은 `CLAUDE.md`의
  "프로젝트 규칙" 절에 적습니다.
- **업데이트**: `.claude/` 폴더만 덮어씁니다. `CLAUDE.md`는 건드리지 않습니다. 자동 병합은 없으므로,
  프로젝트에서 `.claude/` 안의 파일을 직접 고쳤다면 덮어쓰기 전에 git으로 차이를 확인합니다. 프로젝트
  고유의 권한 규칙은 `.claude/settings.local.json`에 두면 업데이트에 덮이지 않습니다.
- 명령으로 하려면 추적 파일만 내보내는 `git archive`가 안전합니다.

  ```bash
  git -C <kit> archive HEAD .claude CLAUDE.md | tar -x -C <project>   # 처음 설치
  git -C <kit> archive HEAD .claude | tar -x -C <project>             # 업데이트
  ```

- 훅은 `python3`로 실행되므로 PATH에 `python3`가 있어야 합니다. prettier는 프로젝트의
  `node_modules`에 있을 때만 쓰이므로 없어도 됩니다.

## 스킬

`.claude/skills/<이름>/SKILL.md`의 description으로 자동 발견되므로 `/이름`으로 부르거나 자연어로
요청하면 됩니다. 세 스킬 모두 산출물을 제안·작성만 하고, 사용자가 따로 요청하지 않는 한 커밋·태그·push를
하지 않습니다.

| 스킬 | 호출 | 하는 일 |
|---|---|---|
| commit-message | `/commit-message [의도 힌트]` | 변경을 읽고 한국어 `type(scope): 요약` + 짧은 불릿 메시지를 제안합니다. 관심사가 섞여 있으면 커밋 분할안을 함께 냅니다. 커밋을 요청하면 제안한 파일만 add·commit 합니다. |
| update-docs | `/update-docs [집중할 문서]` | `docs/handover/`에 인수인계 문서 6종(색인·아키텍처·세팅·운영·결정 이력·확인 필요)을 처음 한 번 만들고, 이후에는 동기화 마커 이후 변경에 걸린 문서만 갱신합니다. 저장소로 검증되는 문장만 쓰고, 사람이 쓴 문장은 고치지 않으며, 사람이 채워야 할 정보는 `open-questions.md`에 질문으로 모읍니다. |
| release-notes | `/release-notes [버전 또는 범위]` | 마지막 릴리스 이후 커밋으로 `CHANGELOG.md`(Keep a Changelog, 개발자용)와 `docs/release-notes/<버전>.md`(비개발자용 안내)를 만듭니다. 안내 노트는 CHANGELOG 항목에서만 파생되고, 확인이 필요한 항목은 공유 전에 지우는 절로 분리됩니다. 버전은 제안만 합니다. |

세 스킬의 지시문(SKILL.md)은 영어로, 산출물은 한국어로 씁니다.

## 훅

| 이벤트 | 스크립트 | 동작 |
|---|---|---|
| PreToolUse (Bash) | `db-guard.sh` | 테이블·데이터베이스·스키마를 지우는 DDL, 테이블 비우기, `WHERE` 없는 삭제 SQL을 차단합니다. 명령 원문을 grep으로 보는 휴리스틱이라 문서 텍스트에 든 키워드도 잡습니다. |
| PreToolUse (Bash) | `remote-command-guard.sh` | SSH 원격 세션에서만 동작합니다. 파괴적 삭제, 환경변수·시크릿 유출, 민감 시스템 경로, 외부 네트워크 통신, 명령 주입, 시스템 중단·광범위 프로세스 종료를 차단합니다. |
| PreToolUse (Bash) | `commit-message-guard.py` | `git commit` 메시지가 commit-message 스킬 규칙(형식, 50자, 마침표 없음, 트레일러 없음)을 어기면 차단합니다. 히어독 메시지는 본문을 읽고, 값을 알 수 없는 형태는 통과시킵니다. |
| PostToolUse (Edit·Write) | `auto-format.py` | 편집한 파일이 속한 프로젝트의 prettier로 포맷합니다. 없으면 아무 일도 하지 않고, 포맷으로 내용이 바뀌면 Claude에게 다시 읽으라고 알립니다. |
| PermissionDenied | `permission-denied-log.py` | auto 모드 분류기가 거부한 도구 호출을 `~/.claude/logs/permission-denied.jsonl`에 한 줄씩 남깁니다. deny 규칙이나 사용자 거절은 이 이벤트로 오지 않습니다. |
| Notification · Stop · StopFailure | `notify.py` | 답변 필요 / 작업 완료 / 오류로 중단 세 상황을 OS 알림으로 보냅니다. powershell.exe(WSL) → notify-send → Claude Code UI 메시지 순으로 시도하고, `claude -p`·SDK 세션은 알리지 않습니다. |

## 권한 (`settings.json`)

- **allow**: 파일 읽기·편집, Skill, Task 도구, 질문, 읽기 전용 git 명령(`status` `diff` `log` `show`
  `blame` `describe` `merge-base` `rev-list` `rev-parse` `ls-files` `cat-file` 등).
- **ask**: git 쓰기(`add` `commit` `checkout` `push` `merge` `rebase` `reset --hard` 등), `rm` 전체,
  패키지 설치, 네트워크(`curl` `wget` `ssh` `scp` `rsync`), WebSearch, 그리고 `.claude/settings*.json`
  편집. 이 규칙은 Edit·Write 도구와 셸 리다이렉트에만 걸리므로, 스크립트로 쓰는 우회는 `CLAUDE.md`의
  우회 금지 규칙이 맡습니다.
- **deny**: 루트·홈·현재 디렉터리 삭제, `sudo`·`su`, 디스크 포맷(`mkfs`)과 장치 직접 쓰기(`dd of=/dev/`,
  `/dev/null` 같은 무해한 대상도 함께 막히지만 개발 작업에서 `dd`를 쓸 일이 거의 없어 넓게 둡니다),
  `chmod 777`, `eval`·`sh -c`·인자 없는 셸,
  force push(`-f`·`--force`, `--force-with-lease`는 확인), 패키지 publish, `.git` 편집, `.env`·`.pem`·`.key`·`~/.ssh`·AWS 자격 증명
  읽기, 홈 셸 설정 파일 편집.
- `attribution.commit`이 빈 문자열이라 Claude가 만든 커밋에 `Co-Authored-By`가 붙지 않습니다.

## 관례

- 스킬과 훅은 실제로 반복되는 마찰이 생겼을 때 하나씩 추가합니다. 코드 리뷰·보안 리뷰는 내장
  `/code-review`·`/security-review`를 씁니다.
- 새 스킬은 저장소를 스크래치 디렉터리에 복제하고 새 컨텍스트의 서브에이전트에게 SKILL.md를 문자
  그대로 따르게 해 검증합니다. 모호한 지시문을 보고받을 수 있어 `claude -p` 헤드리스 실행보다 낫습니다.
- 훅은 스크립트로 실행되므로 `__pycache__`가 생기지 않습니다. 훅 함수를 import해서 테스트할 때는
  `python3 -B`로 실행해 캐시가 남지 않게 합니다.
- 상시 규칙은 `.claude/rules/kit.md`에, 프로젝트 규칙은 `CLAUDE.md`에 둡니다. 스킬 전체 목록은 두지 않고,
  스킬 분담과 훅 대응처럼 지켜야 할 것만 적습니다.
