#!/bin/bash
# db-guard.sh - PreToolUse 훅 (Bash)
# Bash 명령 내 위험 SQL 패턴 차단: DROP TABLE/DATABASE/SCHEMA, TRUNCATE TABLE, WHERE 없는 DELETE
#
# 트리거: PreToolUse, 매처: Bash
# 종료 코드: 0 = 허용, 2 = 차단
#
# JSON 파싱 없이 stdin 원본 전체를 grep으로 스캔하는 휴리스틱 가드.
# 알려진 한계: 다중 구문 명령에서 어느 한 구문에라도 WHERE가 있으면
# WHERE 없는 DELETE 검사를 우회할 수 있음 (구문별 파싱은 범위 외).

input=$(cat)

if grep -iqE '\bDROP[[:space:]]+(TABLE|DATABASE|SCHEMA)\b' <<< "$input"; then
    echo "BLOCKED: 파괴적 DDL (DROP TABLE/DATABASE/SCHEMA) 감지" >&2
    exit 2
fi

# coreutils 'truncate -s 0 file'은 차단하지 않도록 TABLE 단어를 요구
if grep -iqE '\bTRUNCATE[[:space:]]+TABLE\b' <<< "$input"; then
    echo "BLOCKED: 테이블 비우기 (TRUNCATE TABLE) 감지" >&2
    exit 2
fi

if grep -iqE '\bDELETE[[:space:]]+FROM\b' <<< "$input" && ! grep -iqE '\bWHERE\b' <<< "$input"; then
    echo "BLOCKED: WHERE 없는 DELETE 감지" >&2
    exit 2
fi

exit 0
