#!/bin/bash
# remote-command-guard.sh - PreToolUse 훅 (Bash)
# 원격 세션에서 위험한 Bash 명령(원격 실행/유출/민감 경로 접근)을 차단
#
# 트리거: PreToolUse, 매처: Bash
# 종료 코드: 0 = 허용, 2 = 차단
#
# 원격 세션 감지: SSH_CONNECTION, SSH_TTY, REMOTE_SESSION 환경변수
# 로컬 세션에서는 검사를 건너뜀
#
# JSON 파싱 없이 stdin 원본 전체를 grep으로 스캔하는 휴리스틱 가드.

# 로컬 세션이면 검사 건너뜀
if [[ -z "${SSH_CONNECTION:-}" && -z "${SSH_TTY:-}" && -z "${REMOTE_SESSION:-}" ]]; then
    exit 0
fi

input=$(cat)

block() { echo "BLOCKED: $1" >&2; exit 2; }

# 1. 파괴적 삭제
grep -iqE '\brm[[:space:]]+-[a-z]*[rf][a-z]*[[:space:]]+(/|~|\*)' <<< "$input" && block "파괴적 삭제 명령 감지"

# 2. 환경변수/시크릿 유출 (명령 머리에 고정 → 'npm run set' 오탐 방지)
# JSON 블롭 스캔이므로 명령 머리/꼬리 경계로 따옴표(")도 허용
grep -iqE '(^|["'\'';&|][[:space:]]*)(env|printenv|set)([[:space:]"'\'']|$)' <<< "$input" && block "시크릿/환경변수 유출 시도 감지"
grep -iqE '\bcat[[:space:]]+[^|;&]*(\.env|\.netrc|credentials|/\.ssh/)' <<< "$input" && block "시크릿/환경변수 유출 시도 감지"

# 3. 민감 시스템 경로 접근
grep -iqE '/etc/(passwd|shadow|sudoers)|/proc/(self|[0-9]+)/' <<< "$input" && block "민감 시스템 경로 접근 감지"

# 4. 외부 네트워크 통신 / 유출
grep -iqE '\b(curl|wget|nc|ncat|netcat|telnet|scp|sftp|ftp|socat)[[:space:]]' <<< "$input" && block "외부 네트워크 통신 시도 감지"
grep -iqE '\brsync[[:space:]][^|;&]*:' <<< "$input" && block "외부 네트워크 통신 시도 감지"

# ssh: 대화형 'ssh host'는 허용하되, 원격 명령 실행 문자열이 붙으면 차단
grep -iqE '\bssh[[:space:]]+[^[:space:]]+[[:space:]]+[^[:space:]-]' <<< "$input" && block "ssh 원격 명령 실행 감지"

# 5. 명령 주입 / 원격 실행 ('exec'는 docker|kubectl|podman 컨테이너 진입은 허용)
grep -iqE '\|[[:space:]]*(sh|bash)\b' <<< "$input" && block "명령 주입 패턴 감지"
grep -iqE '\bbase64[[:space:]]+-d[[:space:]]*\|[[:space:]]*(sh|bash)\b' <<< "$input" && block "명령 주입 패턴 감지"
grep -iqE '(^|["'\'';&|][[:space:]]*)exec[[:space:]]' <<< "$input" \
    && ! grep -iqE '\b(docker|kubectl|podman)[[:space:]]+[^|;&]*exec\b' <<< "$input" \
    && block "명령 주입 패턴 감지"

exit 0
