#!/usr/bin/env python3
"""PostToolUse(Edit|Write) 훅: 편집된 파일을 그 파일이 속한 프로젝트의 prettier로 포맷한다.

파일 위치에서 위로 올라가며 node_modules/.bin/prettier를 찾되, .git이 있는 디렉터리(프로젝트 루트)와
홈 디렉터리에서 멈춘다. 프로젝트 밖 파일을 편집했을 때 상위의 무관한 prettier·설정에 걸리지 않게
하기 위해서다. 못 찾으면 아무것도 하지 않으므로 prettier를 쓰지 않는 프로젝트에 복사해도 안전하다.
찾은 디렉터리를 작업 디렉터리로 삼아 실행하므로 그 프로젝트의 .prettierrc와 .prettierignore가 그대로
적용되고, prettier가 모르는 파일은 건너뛴다.

포맷으로 파일 내용이 실제로 바뀌면 additionalContext로 Claude에게 알린다. 방금 쓴 내용과 디스크가
달라진 상태에서 다음 Edit의 old_string이 어긋나는 걸 막기 위해서다. 실패는 조용히 무시한다.
편집 도중의 문법 오류까지 Claude에게 되돌려주면 소음이 되기 때문이다.
"""
import json
import os
import subprocess
import sys


def find_prettier(directory):
    """편집한 파일이 속한 프로젝트 안에서만 (프로젝트 루트, prettier 경로)를 찾는다. 없으면 None."""
    home = os.path.expanduser('~')
    while directory != home:
        prettier = os.path.join(directory, 'node_modules', '.bin', 'prettier')
        if os.access(prettier, os.X_OK):
            return directory, prettier
        if os.path.exists(os.path.join(directory, '.git')):
            return None
        parent = os.path.dirname(directory)
        if parent == directory:
            return None
        directory = parent
    return None


def main():
    try:
        event = json.load(sys.stdin)
        path = event.get('tool_input', {}).get('file_path')
        if not path:
            return
        path = os.path.abspath(os.path.join(event.get('cwd', ''), path))
        if not os.path.isfile(path):
            return
        found = find_prettier(os.path.dirname(path))
        if not found:
            return
        root, prettier = found
        with open(path, 'rb') as before:
            original = before.read()
        subprocess.run([prettier, '--write', '--ignore-unknown', path], cwd=root,
                       timeout=25, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with open(path, 'rb') as after:
            if after.read() == original:
                return
        json.dump({'hookSpecificOutput': {
            'hookEventName': 'PostToolUse',
            'additionalContext': f'prettier reformatted {path} after this edit, so the file on disk no longer '
                                 'matches what you just wrote. Re-read it before editing it again.',
        }}, sys.stdout)
    except Exception:
        pass


if __name__ == '__main__':
    main()
    sys.exit(0)
