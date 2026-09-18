#!/usr/bin/env python3
"""PostToolUse(Bash|Read|Grep) 훅: 도구 결과에 든 비밀 값을 Claude가 보기 전에 가린다.

형태가 확실한 것만 잡는다 — 제공자 접두어가 있는 토큰(AWS·GitHub·GitLab·Slack·OpenAI/Anthropic·Stripe·
Google·npm·SendGrid), JWT, 개인 키 블록, URL 속 비밀번호(scheme://user:PASS@), Bearer 토큰, 잘 알려진
환경 변수 이름의 값. 일반 `password=…` 형태, 긴 문자열 추정, Base64 디코딩은 하지 않는다. 소스 코드의
`token = get_token()` 같은 줄까지 가려 코드 이해를 망치기 때문이다.

tool_response의 문자열 값을 구조를 유지한 채 치환하고, 바뀐 것이 있을 때만 updatedToolOutput으로
돌려준다. 가린 자리는 `[masked <종류>]`로 표시해 Claude가 무엇이 가려졌는지는 알 수 있게 한다.
가린 횟수·종류만 ~/.claude/logs/secret-mask.jsonl에 남기고 값은 기록하지 않는다. 실패는 조용히 무시한다.
"""
import json
import os
import re
import sys
from datetime import datetime

LOG_PATH = os.path.expanduser('~/.claude/logs/secret-mask.jsonl')

ENV_NAMES = (r'(?:AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY|GITHUB_TOKEN|'
             r'GH_TOKEN|GITLAB_TOKEN|NPM_TOKEN|SLACK_(?:BOT_)?TOKEN|STRIPE_SECRET_KEY|SENDGRID_API_KEY|'
             r'DB_PASSWORD|POSTGRES_PASSWORD|MYSQL_(?:ROOT_)?PASSWORD|REDIS_PASSWORD|SECRET_KEY|JWT_SECRET|'
             r'SESSION_SECRET)')

# (종류, 정규식, 그룹). 그룹 0은 매치 전체를, 그 외는 그 그룹만 가린다. 개인 키 블록을 먼저 처리해
# 블록 안 문자열이 다른 패턴에 조각으로 잡히지 않게 한다.
PATTERNS = [
    ('private key', re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----', re.S), 0),
    ('aws key', re.compile(r'\b(?:AKIA|ASIA)[0-9A-Z]{16}\b'), 0),
    ('github token', re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b'), 0),
    ('gitlab token', re.compile(r'\bglpat-[A-Za-z0-9_-]{20,}\b'), 0),
    ('slack token', re.compile(r'\bxox[abposr]-[A-Za-z0-9-]{10,}\b'), 0),
    # OpenAI·Anthropic. CSS 클래스 같은 `sk-something-long`과 구분하려고 32자 이상 + 숫자나 대문자 포함을 요구한다.
    ('api key', re.compile(r'\bsk-(?=[A-Za-z0-9_-]*[0-9A-Z])[A-Za-z0-9_-]{32,}\b'), 0),
    ('stripe key', re.compile(r'\b[sr]k_(?:live|test)_[A-Za-z0-9]{20,}\b'), 0),
    ('google api key', re.compile(r'\bAIza[0-9A-Za-z_-]{35}\b'), 0),
    ('npm token', re.compile(r'\bnpm_[A-Za-z0-9]{36}\b'), 0),
    ('sendgrid key', re.compile(r'\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b'), 0),
    ('jwt', re.compile(r'\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b'), 0),
    ('url password', re.compile(r'://[^/\s:@]*:([^@\s/]{4,})@'), 1),
    ('bearer token', re.compile(r'\b[Bb]earer\s+([A-Za-z0-9_.~+/=-]{20,})'), 1),
    # 값이 `$`·`<`·`{`로 시작하면 참조나 자리표시자이므로 두고, 16자 이상만 가린다.
    ('env value', re.compile(r'\b' + ENV_NAMES + r'\s*[=:]\s*["\']?([^\s"\'$<{][^\s"\']{15,})', re.I), 1),
]


def mask_text(text, counts):
    """text 안의 비밀 값을 `[masked <종류>]`로 바꾸고 종류별 횟수를 counts에 더한다."""
    for kind, regex, group in PATTERNS:
        def repl(m, kind=kind, group=group):
            counts[kind] = counts.get(kind, 0) + 1
            label = f'[masked {kind}]'
            if group == 0:
                return label
            whole = m.group(0)
            return whole[:m.start(group) - m.start()] + label + whole[m.end(group) - m.start():]
        text = regex.sub(repl, text)
    return text


def mask_value(value, counts):
    """dict·list 구조는 유지하고 문자열만 가린다."""
    if isinstance(value, str):
        return mask_text(value, counts)
    if isinstance(value, list):
        return [mask_value(v, counts) for v in value]
    if isinstance(value, dict):
        return {k: mask_value(v, counts) for k, v in value.items()}
    return value


def log(event, counts):
    entry = {
        'time': datetime.now().astimezone().isoformat(timespec='seconds'),
        'cwd': event.get('cwd'),
        'tool': event.get('tool_name'),
        'masked': counts,
    }
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')


def main():
    try:
        event = json.load(sys.stdin)
        response = event.get('tool_response')
        if response is None:
            return
        counts = {}
        masked = mask_value(response, counts)
        if not counts:
            return
        json.dump({'hookSpecificOutput': {
            'hookEventName': 'PostToolUse',
            'updatedToolOutput': masked,
        }}, sys.stdout, ensure_ascii=False)
        log(event, counts)
    except Exception:
        pass


if __name__ == '__main__':
    main()
    sys.exit(0)
