# profiles/

프로젝트 유형별 preset. 다운스트림 프로젝트에 설치할 때 하나를 골라, kit 전역 선언(`agent-kit.yml`)을 프로젝트 유형에 맞게 조정한다.

## 동작 원리

**생략 = 전역 상속, 명시 = 교체.**

- profile에 없는 필드는 `agent-kit.yml`의 전역 선언(context·skills·hooks)을 그대로 쓴다.
- 필드를 명시하면 전역 목록을 **그 목록으로 교체**한다(부분 병합 아님 — 단순하고 예측 가능하게).
- 따라서 모든 profile은 암묵적으로 default를 확장하는 셈이고, `extends` 같은 상속 문법은 두지 않는다.

skills의 override 원칙과 같은 철학: **필요한 차이만 선언하고, 처음부터 분기하지 않는다.**

## 스키마

```yaml
profile:
  name: <profile-name>        # 필수 — 파일명과 일치 (kebab-case)
  description: <한 줄 설명>    # 필수

context:                      # 선택 — 전역 context.include 목록을 교체
  - context/base.md
skills:                       # 선택 — 전역 skills.include 목록을 교체
  - skills/code-review
commands: |                   # 선택 — 첫 설치 때 kit:keep:commands 영역의 초기값
  npm test
```

`commands` 시드는 **첫 설치에만** 적용된다. 이후 재생성에서는 프로젝트가 keep 영역에서 수정한 내용이 보존되고, profile 값으로 다시 덮지 않는다(templates의 keep 계약과 동일).

## profile 선택

설치/동기화 시점에 지정한다 — 지정 형식(예: `bin/sync --profile node`)은 sync 구상에서 확정. 지정이 없으면 `default`.

## 새 profile 추가하기

1. `profiles/<name>.yml` 생성 (위 스키마).
2. `agent-kit.yml`의 `profiles:`에 등록 — 등록된 것만 사용 가능.
3. 전역과 차이가 없는 필드는 쓰지 않는다.

## 현재 profile

| profile | 용도 |
|---|---|
| `default` | 스택 독립 기본 — 전역 선언 그대로 |
| `node` | Node.js 프로젝트 — npm 명령어 시드 |

nextjs · backend · monorepo 등은 실제 필요가 생길 때 추가한다.
