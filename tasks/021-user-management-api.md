# Task 021: 사용자 관리 기능 구현 (F013)

## 상태
- [x] ✅ 완료

## 개요
사용자 관리 CRUD API를 구현합니다. Supabase Auth 계정 생성과 users 테이블 삽입을 동시에 처리하고,
슈퍼어드민 전용 접근 제어를 적용합니다.

## 관련 PRD 기능
- [F013] 사용자 관리

## 관련 파일
- `app/api/users/route.ts` — 사용자 목록 조회 / 추가 API
- `app/api/users/[id]/route.ts` — 사용자 수정 / 삭제 API
- `app/(auth)/users/page.tsx` — 사용자 관리 페이지 (API 연동)

## 수락 기준
- [ ] 사용자 추가 시 Supabase Auth 계정과 users 테이블이 동시에 생성됨
- [ ] 사용자 목록 조회, 수정, 삭제가 동작함
- [ ] 역할 변경이 동작함
- [ ] 슈퍼어드민 전용 접근 제어가 적용됨
- [ ] 사용자 관리 페이지가 실제 API와 연동됨

## 구현 단계
- [ ] `POST /api/users` 사용자 추가 API 구현 (Supabase Auth 계정 생성 + users 테이블 삽입)
- [ ] `GET /api/users` 사용자 목록 조회 API 구현
- [ ] `PUT /api/users/[id]` 사용자 정보 수정 API 구현 (역할 변경 포함)
- [ ] `DELETE /api/users/[id]` 사용자 삭제 API 구현
- [ ] 슈퍼어드민 전용 접근 제어 미들웨어 적용
- [ ] 사용자 관리 페이지 더미 데이터를 실제 API로 교체
- [ ] 사용자 CRUD 테스트

## 테스트 체크리스트
- [ ] 사용자 추가 → Auth + DB 동시 생성 확인
- [ ] 사용자 목록 조회 동작 확인
- [ ] 사용자 수정 (역할 변경 포함) 동작 확인
- [ ] 사용자 삭제 동작 확인
- [ ] 비 슈퍼어드민 접근 시 403 응답 확인

## 참고사항
Task 012에서 구현한 UI와 연동합니다.
사용자 삭제 시 Supabase Auth 계정도 함께 삭제해야 합니다.
Service Role Key를 사용하여 관리자 API로 Auth 계정을 관리합니다.
