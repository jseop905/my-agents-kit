---
name: wiki-management
description: Rules and format for creating and maintaining project wiki documents in docs/wiki/
---

# Wiki 문서 관리 규칙

`docs/wiki/` 문서의 작성, 갱신, 구조에 대한 기준.

## 문서 포맷

모든 wiki 문서는 YAML frontmatter로 시작한다:

```markdown
---
title: 문서 제목
updated: YYYY-MM-DD
scope: 이 문서가 다루는 범위 (디렉토리 경로 또는 도메인)
---
```

- `scope`는 `/plan`이 관련 문서를 빠르게 찾는 데 사용된다
- `updated`는 문서 갱신 시 반드시 업데이트한다

## 작성 원칙

### 1. 코드가 아닌 구조를 기술한다

```
# 나쁜 예 — 코드 복사
UserService.createUser()는 bcrypt로 해싱 후 DB에 저장합니다.

# 좋은 예 — 역할과 관계
UserService는 사용자 생성/조회/수정을 담당한다.
인증(AuthService)과 저장소(UserRepository)에 의존한다.
```

### 2. 한 문서 = 한 관심사

문서 하나가 여러 주제를 다루면 분리한다. `/plan`이 필요한 문서만 골라 읽을 수 있어야 한다.

### 3. 불확실한 정보는 표시한다

자동 생성 시 코드에서 확인되지 않는 내용은 `[추정]` 태그를 붙인다. 사용자가 이후 검증하고 제거한다.

### 4. 변경 시 영향 범위를 명시한다

모듈 간 의존 관계가 바뀌면 해당 모듈 문서뿐 아니라 `architecture.md`나 `modules.md`도 함께 갱신한다.

## 기본 문서 구조

다섯 개의 표준 문서는 **온디맨드**로 생성한다 — `architecture.md`, `modules.md`, `conventions.md`는 항상 생성하고, `data-model.md`는 DB 스키마가 있을 때만, `api-surface.md`는 API 라우트가 있을 때만 생성한다. 필수 세트가 아니므로 작은 프로젝트는 다섯 개를 모두 만들 필요가 없다.

### architecture.md

```markdown
---
title: 시스템 아키텍처
updated: YYYY-MM-DD
scope: 전체
---

## 개요
[시스템의 전체 구조를 1~2문단으로]

## 디렉토리 역할
[최상위 디렉토리 → 역할 매핑. 예: src/lib/ = 공유 유틸리티, src/features/ = 기능 모듈]

## 레이어 구조
[계층 간 역할과 의존 방향]

## 핵심 설계 결정
[왜 이 구조인지 — 알 수 있는 경우에만]

## 외부 의존성
[DB, 외부 API, 메시지 큐 등]
```

### modules.md

```markdown
---
title: 모듈 구성
updated: YYYY-MM-DD
scope: 전체
---

## [모듈명]

- **경로:** `src/features/todo/`
- **역할:** TODO 항목의 CRUD와 상태 관리
- **진입점:** `index.ts` (외부 노출 API)
- **패턴:** Repository 패턴, React hooks 노출
- **의존:** `database`, `auth`
- **의존받는 곳:** `api/routes/todo`
```

### data-model.md

```markdown
---
title: 데이터 모델
updated: YYYY-MM-DD
scope: 데이터베이스
---

## 엔티티 관계
[ER 다이어그램 또는 텍스트 설명]

## 주요 테이블/모델
[각 모델의 역할, 핵심 필드, 관계]
```

### api-surface.md

```markdown
---
title: API 인터페이스
updated: YYYY-MM-DD
scope: API 라우트
---

## 엔드포인트 요약
[메서드, 경로, 설명을 테이블로]

## 인증/인가
[적용 방식]

## 공통 규칙
[에러 포맷, 페이지네이션 등]
```

### conventions.md

```markdown
---
title: 코딩 컨벤션
updated: YYYY-MM-DD
scope: 전체
---

## 네이밍 규칙
[파일, 변수, 함수 네이밍 패턴]

## 아키텍처 패턴
[Repository, Service layer 등 사용 중인 패턴]

## 에러 처리
[Result 타입, 예외, 에러 코드 등]

## 상태 관리
[해당 시 — 상태 구조, 접근 방식]

## 공통 유틸리티
[공유 헬퍼 위치, 사용 기준]
```

## 갱신 규칙

1. **새 모듈 추가 시** — `modules.md`에 항목 추가, 필요 시 `architecture.md` 갱신
2. **DB 스키마 변경 시** — `data-model.md` 갱신
3. **API 변경 시** — `api-surface.md` 갱신
4. **구조적 변경 시** — `architecture.md` 갱신, 영향받는 모듈 문서도 갱신
5. **코딩 패턴 변경 시** — `conventions.md` 갱신
6. **문서와 코드가 충돌하면** — 코드가 진실이다. 문서를 코드에 맞춘다
