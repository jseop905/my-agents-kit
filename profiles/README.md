# profiles/

프로젝트 유형별 preset. 패키지를 빌드할 때 하나를 골라, kit 전역 선언(`agent-kit.yml`)을 프로젝트 유형에 맞게 조정한다.

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
commands: |                   # 선택 — 명령어 섹션의 초기값 시드
  npm test
```

`commands` 시드는 빌드 때 AGENTS.md의 명령어 섹션 초기값으로 렌더된다. 복사 후 프로젝트에서 수정한 내용은 프로젝트 소유 — kit 업데이트(통째 교체) 때 git으로 복원한다.

## profile 선택

빌드 시점에 지정한다: `node bin/build.mjs --profile node`. 지정이 없으면 `default`.

## 새 profile 추가하기

1. `profiles/<name>.yml` 생성 (위 스키마).
2. `agent-kit.yml`의 `profiles:`에 등록 — 등록된 것만 빌드 시 선택 가능.
3. 전역과 차이가 없는 필드는 쓰지 않는다.

## 현재 profile

| profile | 용도 |
|---|---|
| `default` | 스택 독립 기본 — 전역 선언 그대로 |
| `node` | Node.js 프로젝트 — npm 명령어 시드 |

nextjs · backend · monorepo 등은 실제 필요가 생길 때 추가한다.
