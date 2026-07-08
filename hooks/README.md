# hooks/

여러 도구에서 공유하는 hook 스크립트 원본. **스크립트는 공통, 배선(어떤 이벤트에 어떻게 엮는가)은 도구별 설정 파일**로 처리한다.

## 프로토콜

모든 가드 스크립트는 같은 규약을 따른다:

- **입력**: stdin으로 도구가 주는 JSON 페이로드 (파싱 없이 원문을 grep하는 휴리스틱)
- **종료 코드**: `0` = 허용, `2` = 차단 (차단 사유는 stderr)

## 현재 hook

| 스크립트 | 이벤트 (도구 중립) | 역할 |
|---|---|---|
| `db-guard.sh` | 도구 실행 전 (Bash) | 위험 SQL 차단 — DROP TABLE/DATABASE/SCHEMA · TRUNCATE TABLE · WHERE 없는 DELETE |
| `remote-command-guard.sh` | 도구 실행 전 (Bash) | 원격 세션(SSH_*)에서만 — 파괴적 삭제·시크릿 유출·외부 전송·명령 주입·시스템 중단 차단. 로컬 세션은 통과 |
| `notify.sh` | 알림 이벤트 · 응답 완료 | 크로스플랫폼 알림 (Windows/WSL PowerShell · Linux notify-send · `/dev/tty` 벨 폴백) + 동일 타입 5초 쓰로틀. 응답 정상 완료 시 "작업 완료" 알림 |

## 도구별 배선

- **Claude Code** — `templates/settings.json`이 배선 원본(hooks 섹션 + 권한 정책). 설치 시 `.claude/settings.json`으로 복사(기존 파일이 있으면 hooks 섹션만 병합), 스크립트는 `.claude/hooks/`에 복사 후 `chmod +x`. 이벤트 매핑: 도구 실행 전 → `PreToolUse`(matcher `Bash`), 알림 → `Notification`, 응답 완료 → `Stop`. hook `timeout`은 **초 단위**(가드 5초, 알림 10초 — PowerShell 기동 여유).
- **Codex** — 배선 미구현. 스크립트 프로토콜(JSON stdin / exit 2)은 재사용 가능하지만 **페이로드 스키마와 설정 위치(config.toml)가 다르다** — 실제 사례가 생길 때 확정한다 (manifest `codex.settings: null`).

## 알려진 도구 종속

`notify.sh`의 알림 제목("Claude Code - …")과 `notification_type` 값들은 Claude의 페이로드 스키마 기준이다. Codex에 배선하게 되면 함께 조정한다.

## 새 hook 추가하기

1. `hooks/<name>.sh` 작성 (위 프로토콜 준수).
2. `agent-kit.yml`의 `hooks:`에 등록 — 등록된 것만 설치 대상.
3. 배선을 `templates/settings.json`(Claude) 등 도구별 설정에 추가.
