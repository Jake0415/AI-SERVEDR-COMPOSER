# Code Review

인자가 없으면 uncommitted 변경사항을, "전체" 또는 "full"이 포함되면 전체 코드베이스를 리뷰합니다.

## 모드 판별

- `$ARGUMENTS`에 "전체", "full", "all"이 포함되면 → **전체 리뷰 모드**
- 그 외 → **변경사항 리뷰 모드** (git diff 기반)

---

## 변경사항 리뷰 모드 (기본)

1. `git diff --name-only HEAD`로 변경 파일 목록 확인
2. 각 파일의 변경 내용을 읽고 아래 체크리스트 적용

## 전체 리뷰 모드

1. 다음 디렉토리를 순차 탐색:
   - `app/api/` — API 라우트 (보안, 인증, tenantId 필터링)
   - `lib/auth/` — 인증/JWT/비밀번호
   - `lib/db/` — 스키마, 쿼리
   - `middleware.ts` — 미들웨어
   - `app/(dashboard)/` — 페이지 컴포넌트 (React 패턴)
   - `lib/ai/` — AI/LLM 통합
2. 각 파일을 읽고 아래 체크리스트 적용

---

## 리뷰 체크리스트

### Security (CRITICAL)

- 하드코딩된 시크릿 (API 키, 비밀번호, 토큰)
- SQL 인젝션 (문자열 연결 쿼리)
- XSS (사용자 입력 이스케이프 누락)
- 인증 누락 (`getCurrentUser()` 없는 API)
- tenantId 필터링 누락 (멀티테넌시 위반)
- Path traversal (사용자 제어 파일 경로)

### Code Quality (HIGH)

- 50줄 초과 함수
- 800줄 초과 파일
- 4단계 초과 중첩
- 빈 catch 블록
- `any` 타입 사용
- `console.log` 프로덕션 코드
- 사용되지 않는 import/변수

### React/Next.js (HIGH)

- useEffect 의존성 배열 누락
- Server Component에서 클라이언트 훅 사용
- 리스트 key 누락 또는 index 사용
- 불필요한 `"use client"` 지시자

### Backend (HIGH)

- Zod 검증 없는 사용자 입력
- N+1 쿼리 패턴
- LIMIT 없는 쿼리
- 에러 메시지에 내부 정보 노출

### Performance (MEDIUM)

- 불필요한 리렌더링 (메모이제이션 누락)
- 큰 번들 import (tree-shaking 불가)

---

## 출력 형식

```
[SEVERITY] 이슈 제목
File: 경로:줄번호
Issue: 설명
Fix: 수정 방법
```

## 요약 테이블

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | N     | block/pass |
| HIGH     | N     | warn/pass |
| MEDIUM   | N     | info |

Verdict: APPROVE / WARNING / BLOCK
