#!/usr/bin/env python3
"""Claude Code 알림 훅 (Notification / Stop / StopFailure).

세 가지 상황을 OS 알림으로 알린다. 제목으로 상황을 구분하고 본문에 세부 내용을 담는다.
  답변 필요    Notification — 권한 요청, 입력 대기, MCP 입력, 백그라운드 에이전트 입력
               (알림을 보낼 타입은 settings.json의 matcher가 정한다)
  작업 완료    Stop — 마지막 응답의 첫 줄을 미리보기로 보여준다. 백그라운드 작업이 남아 있으면
               아직 끝난 게 아니므로 보내지 않는다
  오류로 중단  StopFailure — API 오류·사용량 한도·인증 실패 등으로 턴이 끊긴 경우

대화형 세션만 알린다. `claude -p`나 SDK로 띄운 세션(다른 Claude 세션이 검증용으로 돌리는 것 포함)의
훅은 CLAUDE_CODE_ENTRYPOINT가 sdk-*로 오므로 여기서 걸러낸다.
발송 순서: powershell.exe(WSL·Windows) → notify-send(Linux). 앞선 수단이 실패하면 다음을 시도하고,
모두 실패하면 systemMessage로 Claude Code UI에 띄운다(훅 자식 프로세스는 제어 터미널이 없어
터미널 벨은 쓸 수 없다).
항상 종료 코드 0으로 끝난다. Stop 훅이 exit 2로 끝나면 Claude의 중단을 막기 때문이다.
"""
import json
import os
import re
import shutil
import subprocess
import sys

INPUT_BODY = {
    'permission_prompt': '권한 승인이 필요합니다.',
    'worker_permission_prompt': '백그라운드 작업이 권한 승인을 기다립니다.',
    'idle_prompt': '입력을 기다리고 있습니다.',
    'elicitation_dialog': 'MCP 서버가 추가 입력을 요청합니다.',
    'elicitation_url_dialog': 'MCP 서버가 브라우저 인증을 요청합니다.',
    'agent_needs_input': '백그라운드 에이전트가 입력을 기다립니다.',
}

ERROR_BODY = {
    'rate_limit': '사용량 한도에 도달했습니다.',
    'overloaded': 'API가 과부하 상태입니다.',
    'authentication_failed': '인증에 실패했습니다.',
    'oauth_org_not_allowed': '조직 정책으로 접근이 차단되었습니다.',
    'account_on_hold': '계정이 보류 상태입니다.',
    'billing_error': '결제 오류가 발생했습니다.',
    'invalid_request': '잘못된 요청입니다.',
    'model_not_found': '모델을 찾을 수 없습니다.',
    'server_error': '서버 오류가 발생했습니다.',
    'max_output_tokens': '출력 토큰 한도를 초과했습니다.',
}


def first_line(text, limit=120):
    """비어 있지 않은 첫 줄을 공백 정리해 limit 길이로 잘라 돌려준다."""
    line = next((l.strip() for l in (text or '').splitlines() if l.strip()), '')
    line = re.sub(r'\s+', ' ', line)
    return line if len(line) <= limit else line[:limit - 1] + '…'


def build(event):
    """훅 입력을 (제목, 본문, 아이콘)으로 바꾼다. 알림을 보내지 않을 때는 None.

    아이콘은 ToolTipIcon 멤버명(Info/Warning/Error)이다. 'Information'은 멤버가 아니라서
    풍선이 조용히 뜨지 않으니 쓰지 않는다.
    """
    name = event.get('hook_event_name')

    if name == 'Stop':
        if event.get('stop_hook_active'):
            return None  # 다른 Stop 훅이 대화를 이어가는 중
        if event.get('background_tasks'):
            return None  # 백그라운드 작업이 끝나면 세션이 깨어나 다시 Stop이 온다
        body = first_line(event.get('last_assistant_message')) or '작업이 완료되었습니다.'
        return '작업 완료', body, 'Info'

    if name == 'StopFailure':
        error = event.get('error', 'unknown')
        body = ERROR_BODY.get(error, f'알 수 없는 오류입니다. ({error})')
        details = first_line(event.get('error_details'), 100)
        return '오류로 중단', f'{body} {details}' if details else body, 'Error'

    ntype = event.get('notification_type', '')
    body = INPUT_BODY.get(ntype, '확인이 필요합니다.')
    if ntype == 'permission_prompt':
        m = re.search(r'permission to use (.+)$', event.get('message') or '')
        if m:
            body = f'{m.group(1)} 사용 권한을 승인해 주세요.'
    return '답변 필요', body, 'Warning'


def send_powershell(exe, title, body, icon):
    def quote(s):
        return "'" + s.replace("'", "''") + "'"

    sys_icon = 'Information' if icon == 'Info' else icon
    script = '; '.join([
        'Add-Type -AssemblyName System.Windows.Forms',
        '$n = New-Object System.Windows.Forms.NotifyIcon',
        f'$n.Icon = [System.Drawing.SystemIcons]::{sys_icon}',
        '$n.Visible = $true',
        f'$n.ShowBalloonTip(5000, {quote(title)}, {quote(body)}, [System.Windows.Forms.ToolTipIcon]::{icon})',
        'Start-Sleep -Milliseconds 300',
        '$n.Dispose()',
    ])
    return run([exe, '-NoProfile', '-NonInteractive', '-Command', script], 5)


def send_notify_send(exe, title, body, icon):
    urgency = 'normal' if icon == 'Info' else 'critical'
    return run([exe, '-u', urgency, '-t', '5000', title, body], 3)


def run(command, timeout):
    """알림 명령을 실행하고 성공했는지 돌려준다."""
    try:
        proc = subprocess.run(command, timeout=timeout,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return proc.returncode == 0
    except Exception:
        return False


def send(title, body, icon):
    """쓸 수 있는 수단을 차례로 시도한다. 하나라도 성공하면 True."""
    for name, sender in (('powershell.exe', send_powershell), ('notify-send', send_notify_send)):
        exe = shutil.which(name)
        if exe and sender(exe, title, body, icon):
            return True
    return False


def is_headless():
    """`claude -p`·SDK 세션인지. 대화형 터미널 세션은 CLAUDE_CODE_ENTRYPOINT=cli 로 온다."""
    return os.environ.get('CLAUDE_CODE_ENTRYPOINT', '').startswith('sdk')


def main():
    if is_headless():
        return
    try:
        result = build(json.load(sys.stdin))
        if result:
            title, body, icon = result
            if not send(f'Claude Code - {title}', body, icon):
                # OS 알림이 모두 실패하면 Claude Code UI에 한 줄로 띄운다.
                json.dump({'systemMessage': f'{title}: {body}'}, sys.stdout, ensure_ascii=False)
    except Exception:
        pass  # 알림 실패가 Claude를 멈추게 하지 않는다


if __name__ == '__main__':
    main()
    sys.exit(0)
