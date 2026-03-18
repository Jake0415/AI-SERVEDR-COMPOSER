# Task 004: Supabase 클라이언트 및 유틸리티 설정

## 상태
- [x] ✅ 완료

## 개요
Supabase 클라이언트를 초기화하고, 서버/클라이언트 컴포넌트용 클라이언트를 분리합니다.
미들웨어 기반 세션 관리 골격과 공통 에러 핸들링 유틸리티를 작성합니다.

## 관련 PRD 기능
- [F010] 인증 시스템
- [F011] 초기 설정

## 관련 파일
- `lib/supabase/server.ts` — 서버 컴포넌트용 Supabase 클라이언트
- `lib/supabase/client.ts` — 클라이언트 컴포넌트용 Supabase 클라이언트
- `lib/supabase/middleware.ts` — 미들웨어용 Supabase 클라이언트
- `middleware.ts` — Next.js 미들웨어
- `lib/errors.ts` — 공통 에러 핸들링 유틸리티
- `.env.local` — 환경 변수

## 수락 기준
- [ ] 서버 컴포넌트용 Supabase 클라이언트가 정상 동작함
- [ ] 클라이언트 컴포넌트용 Supabase 클라이언트가 정상 동작함
- [ ] 미들웨어 기반 세션 관리 골격이 구현됨
- [ ] 환경 변수가 올바르게 설정됨
- [ ] 공통 에러 핸들링 유틸리티가 작성됨

## 구현 단계
- [ ] `@supabase/ssr` 패키지 설치
- [ ] 서버 컴포넌트용 Supabase 클라이언트 초기화 (`@supabase/ssr` 활용)
- [ ] 클라이언트 컴포넌트용 Supabase 클라이언트 초기화
- [ ] 미들웨어용 Supabase 클라이언트 구현
- [ ] Next.js 미들웨어 기반 세션 관리 골격 구현
- [ ] 환경 변수 설정 (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 등)
- [ ] 공통 에러 핸들링 유틸리티 작성

## 테스트 체크리스트
- [ ] Supabase 클라이언트 연결 테스트 성공
- [ ] 미들웨어 세션 확인 동작 테스트
- [ ] 환경 변수 누락 시 적절한 에러 메시지 표시

## 참고사항
`@supabase/ssr` 패키지를 사용하여 SSR 환경에서의 쿠키 기반 세션 관리를 구현합니다.
`.env.example` 파일도 함께 업데이트하여 필요한 환경 변수를 문서화합니다.
