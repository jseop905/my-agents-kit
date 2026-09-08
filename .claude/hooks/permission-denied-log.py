#!/usr/bin/env python3
"""PermissionDenied 훅: auto 모드에서 거부된 도구 호출을 ~/.claude/logs/permission-denied.jsonl에 남긴다.

이 이벤트는 auto 모드 분류기가 거부할 때만 발화한다. settings.json의 deny 규칙, 사용자 거절,
PreToolUse 훅의 exit 2 차단은 여기로 오지 않는다(그쪽 이력은 transcript의 toolDenialKind에 있다).
따라서 이 로그는 auto 모드가 무엇을 막았는지 보는 용도다. 분류기가 자꾸 막는 명령을 allow 규칙으로
올리거나, 거부가 타당했는지 되짚는 데 쓴다.
기록 항목: 시각, 프로젝트(cwd), 권한 모드, 도구, 입력 요약(Bash는 command, 파일 도구는 file_path),
거부 사유. 기록 실패는 조용히 무시한다.
"""
import json
import os
import sys
from datetime import datetime

LOG_PATH = os.path.expanduser('~/.claude/logs/permission-denied.jsonl')


def summarize(tool_input):
    for key in ('command', 'file_path', 'url', 'pattern'):
        if key in tool_input:
            return str(tool_input[key])[:500]
    return json.dumps(tool_input, ensure_ascii=False)[:500]


def main():
    try:
        event = json.load(sys.stdin)
        entry = {
            'time': datetime.now().astimezone().isoformat(timespec='seconds'),
            'cwd': event.get('cwd'),
            'mode': event.get('permission_mode'),
            'tool': event.get('tool_name'),
            'input': summarize(event.get('tool_input') or {}),
            'reason': event.get('reason'),
        }
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, 'a', encoding='utf-8') as log:
            log.write(json.dumps(entry, ensure_ascii=False) + '\n')
    except Exception:
        pass


if __name__ == '__main__':
    main()
    sys.exit(0)
