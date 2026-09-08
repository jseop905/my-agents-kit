#!/usr/bin/env python3
"""PreToolUse(Bash) 훅: git commit 메시지가 commit-message 스킬 규칙을 따르는지 검사한다.

검사 항목: 제목이 `type(scope): 요약` 형식, 50자 이하, 끝에 마침표 없음, Co-Authored-By 같은
트레일러 없음. 명령 위치에 있는 `git commit`만, 그 명령 자신의 인자 범위 안에서만 본다
(뒤에 이어지는 `grep -m 1 …` 같은 다른 명령의 -m을 메시지로 오인하지 않는다). `-m`을 여러 번 준
경우 git이 빈 줄로 이어 붙이는 것과 같게 합쳐서 검사한다. 문자열 안에 인용된 명령(echo, 프롬프트
등)은 대체로 건너뛰지만, 인용부호 안에서도 명령 구분자 뒤에 `git commit` 형태가 통째로 들어가면
잡힐 수 있다(휴리스틱 한계). `-m "$(cat <<'EOF' … EOF)"` 히어독은 본문을 읽고, 값을 확정할 수
없는 형태(그 밖의 명령 치환, 변수 확장, -F 파일, --amend --no-edit, -c/-C 재사용 등)는 통과시킨다.
위반 시 exit 2와 stderr 사유로 차단한다. 사유는 Claude가 읽고 고치므로 영어로 쓴다.
"""
import json
import re
import sys

TYPES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'style', 'perf', 'build', 'ci', 'revert']
TITLE_RE = re.compile(r'^(' + '|'.join(TYPES) + r')(\([^()]+\))?: \S.*$')
TRAILER_RE = re.compile(r'^(Co-Authored-By|Signed-off-by):', re.I | re.M)

# 명령 시작 위치(줄 처음, `&&` `||` `;` `|` `(` 뒤)의 git commit만 잡는다.
GIT_COMMIT_RE = re.compile(r'(?:^|[;&|(]|\n)\s*git\s+(?:-\S+\s+(?:\S+\s+)?)*commit\b')
# 인자 하나가 메시지 플래그인지: -m, -am 같은 묶음, --message, --message=
MESSAGE_FLAG_RE = re.compile(r'^(?:-[A-Za-z]*m|--message=?)')
# `$(cat <<'EOF' … EOF)` 형태의 명령 치환. 본문을 그대로 메시지로 쓴다.
HEREDOC_RE = re.compile(r"""\$\(\s*cat\s+<<-?\s*["']?(\w+)["']?[^\n]*\n(.*?)\n[ \t]*\1[ \t]*\n?[ \t]*\)""", re.S)
# 변수 확장. 값을 알 수 없으므로 검사에서 빠진다.
VAR_RE = re.compile(r'\$(?:\{[^}]*\}|[A-Za-z_][A-Za-z0-9_]*|[0-9@*?#!$-])')
# git commit 명령이 끝나는 자리. 인자 스캔을 여기서 멈춘다.
COMMAND_END = ';&|\n)'


def read_single(text, i):
    """text[i]의 작은따옴표 문자열을 읽어 (원본, 값). 닫히지 않으면 None."""
    end = text.find("'", i + 1)
    if end < 0:
        return None
    return text[i:end + 1], text[i + 1:end]


def read_backtick(text, i):
    """text[i]의 백틱 명령 치환을 읽어 (원본, 값, False). 닫히지 않으면 None."""
    end = text.find('`', i + 1)
    if end < 0:
        return None
    return text[i:end + 1], text[i:end + 1], False


def read_cmdsub(text, i):
    """text[i:]의 `$( … )`를 읽어 (원본, 값, 값을 믿을 수 있는지). 닫히지 않으면 None."""
    heredoc = HEREDOC_RE.match(text, i)
    if heredoc:
        return heredoc.group(0), heredoc.group(2), True
    depth = 0
    j = i + 1
    while j < len(text):
        char = text[j]
        if char == '(':
            depth += 1
        elif char == ')':
            depth -= 1
            if depth == 0:
                return text[i:j + 1], text[i:j + 1], False
        elif char in '"\'':
            quoted = read_single(text, j) if char == "'" else read_double(text, j)
            if quoted is None:
                return None
            j += len(quoted[0])
            continue
        j += 1
    return None


def read_double(text, i):
    """text[i]의 큰따옴표 문자열을 읽어 (원본, 값, 값을 믿을 수 있는지). 닫히지 않으면 None."""
    raw, value, trusted = '"', '', True
    j = i + 1
    while j < len(text):
        char = text[j]
        if char == '"':
            return raw + '"', value, trusted
        if char == '\\' and j + 1 < len(text) and text[j + 1] in '"\\$`\n':
            raw += text[j:j + 2]
            if text[j + 1] != '\n':
                value += text[j + 1]
            j += 2
            continue
        if text.startswith('$(', j) or char == '`':
            sub = read_cmdsub(text, j) if char == '$' else read_backtick(text, j)
            if sub is None:
                return None
            raw += sub[0]
            value += sub[1]
            trusted = trusted and sub[2]
            j += len(sub[0])
            continue
        if char == '$':
            var = VAR_RE.match(text, j)
            if var:
                raw += var.group(0)
                value += var.group(0)
                trusted = False
                j = var.end()
                continue
        raw += char
        value += char
        j += 1
    return None


def scan_args(text):
    """git commit 뒤의 인자를 그 명령의 범위 안에서만 (원본, 값, 믿을 수 있는지) 토큰으로 자른다.

    따옴표가 닫히지 않는 등 해석할 수 없으면 None.
    """
    tokens = []
    raw, value, trusted, started = '', '', True, False
    i = 0
    while i < len(text):
        char = text[i]
        if char in ' \t':
            if started:
                tokens.append((raw, value, trusted))
                raw, value, trusted, started = '', '', True, False
            i += 1
            continue
        if char in COMMAND_END:
            break
        started = True
        if char == '\\' and i + 1 < len(text):
            raw += text[i:i + 2]
            if text[i + 1] != '\n':
                value += text[i + 1]
            i += 2
            continue
        if char in '"\'`' or text.startswith('$(', i):
            if char == "'":
                quoted = read_single(text, i)
                quoted = quoted + (True,) if quoted else None
            elif char == '"':
                quoted = read_double(text, i)
            elif char == '`':
                quoted = read_backtick(text, i)
            else:
                quoted = read_cmdsub(text, i)
            if quoted is None:
                return None
            raw += quoted[0]
            value += quoted[1]
            trusted = trusted and quoted[2]
            i += len(quoted[0])
            continue
        if char == '$':
            var = VAR_RE.match(text, i)
            if var:
                raw += var.group(0)
                value += var.group(0)
                trusted = False
                i = var.end()
                continue
        raw += char
        value += char
        i += 1
    if started:
        tokens.append((raw, value, trusted))
    return tokens


def bare_head(raw):
    """토큰에서 따옴표·치환이 시작되기 전의 맨 앞 부분. 플래그 판별에 쓴다."""
    return re.match(r'^[^\'"$`\\]*', raw).group(0)


def messages_in(tokens):
    """토큰에서 -m 값을 순서대로 모은다. 값을 믿을 수 없는 게 하나라도 있으면 None."""
    messages = []
    expecting_value = False
    for raw, value, trusted in tokens:
        if expecting_value:
            if not trusted:
                return None
            messages.append(value)
            expecting_value = False
            continue
        flag = MESSAGE_FLAG_RE.match(bare_head(raw))
        if not flag:
            continue
        attached = value[flag.end():]
        if attached:
            if not trusted:
                return None
            messages.append(attached)
        else:
            expecting_value = True
    return messages


def extract_messages(command):
    """명령 위치의 각 git commit에서 커밋 메시지를 뽑는다. 못 뽑는 형태는 건너뛴다."""
    found = []
    for commit in GIT_COMMIT_RE.finditer(command):
        tokens = scan_args(command[commit.end():])
        if tokens is None:
            continue
        messages = messages_in(tokens)
        if messages:
            # git은 -m 을 여러 번 주면 빈 줄로 이어 붙인다.
            found.append('\n\n'.join(messages))
    return found


def check(message):
    """규칙 위반 목록을 돌려준다. 비어 있으면 통과."""
    lines = [line for line in message.strip().splitlines() if line.strip()]
    title = lines[0].strip() if lines else ''
    problems = []
    if not TITLE_RE.match(title):
        problems.append(f'title must match `type(scope): summary` with type in {", ".join(TYPES)}; got: {title!r}')
    if len(title) > 50:
        problems.append(f'title must be 50 characters or fewer; got {len(title)}')
    if title.endswith('.'):
        problems.append('title must not end with a period')
    if TRAILER_RE.search(message):
        problems.append('do not append trailers such as Co-Authored-By')
    return problems


def main():
    try:
        command = json.load(sys.stdin).get('tool_input', {}).get('command', '')
    except Exception:
        return 0
    problems = []
    for message in extract_messages(command):
        for problem in check(message):
            if problem not in problems:
                problems.append(problem)
    if not problems:
        return 0
    sys.stderr.write('Commit message rejected by commit-message-guard:\n')
    for problem in problems:
        sys.stderr.write(f'- {problem}\n')
    sys.stderr.write('Follow the commit-message skill: Korean title `type(scope): summary` under 50 characters, '
                     'short bullet body, no trailers.\n')
    return 2


if __name__ == '__main__':
    sys.exit(main())
