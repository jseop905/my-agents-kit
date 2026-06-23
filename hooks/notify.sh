#!/bin/bash
# notify.sh - Notification 훅
# notification_type별 알림 발송 (Windows PowerShell / WSL PowerShell / Linux notify-send / 터미널 벨)
# 타입: permission_prompt, idle_prompt, elicitation_dialog, task_completed 등
# 쓰로틀링: 5초 이내 동일 타입 중복 방지
# 종료 코드 0 필수

# Python 경로 자동 감지
PYTHON_CMD=""
for cmd in python3 python py; do
    if "$cmd" -c "import sys" &>/dev/null 2>&1; then
        PYTHON_CMD="$cmd"
        break
    fi
done

if [[ -z "$PYTHON_CMD" ]]; then
    printf '\a'
    exit 0
fi

INPUT=$(cat)

if [[ -z "$INPUT" ]]; then
    exit 0
fi

printf '%s' "$INPUT" | $PYTHON_CMD -c "
import sys, json, os, time, subprocess, shutil

try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)

notif_type = d.get('notification_type', 'unknown')
message = d.get('message', '')
title_from_input = d.get('title', '')

# 타입별 제목/메시지 매핑
TYPE_MAP = {
    'permission_prompt': {
        'title': 'Claude Code - 권한 요청',
        'message': '권한 승인이 필요합니다.',
        'icon': 'Warning',
    },
    'idle_prompt': {
        'title': 'Claude Code - 유휴 상태',
        'message': '입력을 기다리고 있습니다.',
        'icon': 'Information',
    },
    'elicitation_dialog': {
        'title': 'Claude Code - 추가 입력 필요',
        'message': '추가 정보를 입력해주세요.',
        'icon': 'Information',
    },
    'task_completed': {
        'title': 'Claude Code - 작업 완료',
        'message': '작업이 완료되었습니다.',
        'icon': 'Information',
    },
}

info = TYPE_MAP.get(notif_type, {
    'title': 'Claude Code',
    'message': message or '확인이 필요합니다.',
    'icon': 'Information',
})

notif_title = title_from_input or info['title']
notif_message = message or info['message']
notif_icon = info['icon']

# 플랫폼 감지
import platform
_plat = platform.system().lower()
is_windows = _plat == 'windows'
is_wsl = (not is_windows and os.path.exists('/proc/version')
           and 'microsoft' in open('/proc/version').read().lower())
is_linux = _plat == 'linux' and not is_wsl

# 쓰로틀링: 동일 타입 5초 이내 중복 방지
if is_windows:
    temp_base = os.environ.get('TEMP', os.environ.get('TMP', os.path.expanduser('~')))
    marker_dir = os.path.join(temp_base, 'claude-notify-markers')
else:
    marker_dir = os.path.join(os.path.expanduser('~'), '.claude', 'tmp', 'notify-markers')
os.makedirs(marker_dir, exist_ok=True)
marker_file = os.path.join(marker_dir, f'last-{notif_type}')

now = int(time.time())
if os.path.exists(marker_file):
    try:
        with open(marker_file) as f:
            last = int(f.read().strip())
        if now - last < 5:
            sys.exit(0)
    except Exception:
        pass

with open(marker_file, 'w') as f:
    f.write(str(now))

notified = False
safe_title = notif_title.replace(\"'\", \"''\")
safe_message = notif_message.replace(\"'\", \"''\")

def send_powershell(pwsh_cmd, timeout_sec=5):
    \"\"\"PowerShell 토스트 알림 (Windows 네이티브 / WSL 공용)\"\"\"
    ps_script = (
        'Add-Type -AssemblyName System.Windows.Forms; '
        '\$n = New-Object System.Windows.Forms.NotifyIcon; '
        '\$n.Icon = [System.Drawing.SystemIcons]::' + notif_icon + '; '
        '\$n.Visible = \$true; '
        '\$n.ShowBalloonTip(5000, '
        \"'\" + safe_title + \"', '\" + safe_message + \"', \"
        '[System.Windows.Forms.ToolTipIcon]::' + notif_icon + '); '
        'Start-Sleep -Milliseconds 300; '
        '\$n.Dispose()'
    )
    try:
        proc = subprocess.Popen(
            [pwsh_cmd, '-NoProfile', '-NonInteractive', '-Command', ps_script],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        proc.wait(timeout=timeout_sec)
        return True
    except subprocess.TimeoutExpired:
        proc.kill()
    except Exception:
        pass
    return False

if is_windows:
    # Windows 네이티브: pwsh > powershell 순서로 탐색
    for cmd in ['pwsh', 'powershell']:
        found = shutil.which(cmd)
        if found:
            notified = send_powershell(found)
            break

elif is_wsl:
    # WSL: powershell.exe (Windows interop)
    pwsh = shutil.which('powershell.exe')
    if pwsh:
        notified = send_powershell(pwsh)

elif is_linux:
    # Linux 네이티브: notify-send
    notify_send = shutil.which('notify-send')
    if notify_send:
        urgency = 'critical' if notif_icon == 'Warning' else 'normal'
        try:
            subprocess.run(
                [notify_send, '-u', urgency, '-t', '5000', notif_title, notif_message],
                timeout=3, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
            notified = True
        except Exception:
            pass

# 알림 실패 시 터미널 벨 폴백
if not notified:
    print('\a', end='', file=sys.stderr)
" 2>/dev/null

exit 0
