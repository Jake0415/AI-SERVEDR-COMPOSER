# Task 002: TypeScript 타입 정의 및 인터페이스 설계

## 상태
- [x] ✅ 완료

## 개요
9개 데이터 모델에 대한 TypeScript 인터페이스를 정의하고, 사용자 역할, 부품 카테고리, 견적 유형 등의 타입을 설계합니다.
API 요청/응답 타입과 폼 검증용 Zod 스키마도 함께 정의합니다.

## 관련 PRD 기능
- [F001] 부품 관리
- [F002] 부품 가격 관리
- [F003] RFP 업로드
- [F005] 견적 생성
- [F009] 낙찰 이력
- [F010] 인증 시스템
- [F013] 사용자 관리

## 관련 파일
- `types/models.ts` — 데이터 모델 인터페이스
- `types/enums.ts` — 역할, 카테고리 그룹, 상태 등 타입 정의
- `types/api.ts` — API 요청/응답 타입
- `lib/schemas.ts` — Zod 스키마 정의

## 수락 기준
- [ ] 9개 데이터 모델 인터페이스가 정의됨
- [ ] 모든 열거형 타입(역할, 카테고리 그룹, 상태 등)이 정의됨
- [ ] API 요청/응답 타입이 정의됨
- [ ] Zod 스키마가 정의되어 폼 검증에 사용 가능함
- [ ] TypeScript 컴파일 에러 없음 (`npx tsc --noEmit`)

## 구현 단계
- [ ] `Tenant` 인터페이스 정의
- [ ] `User` 인터페이스 정의
- [ ] `PartCategory` 인터페이스 정의
- [ ] `Part` 인터페이스 정의
- [ ] `PartPrice` 인터페이스 정의
- [ ] `RfpDocument` 인터페이스 정의
- [ ] `Quotation` 인터페이스 정의
- [ ] `QuotationItem` 인터페이스 정의
- [ ] `BidResult` 인터페이스 정의
- [ ] 사용자 역할 타입 정의 (`super_admin` / `admin` / `member`)
- [ ] 부품 카테고리 그룹 타입 정의 (`server_parts` / `network_infra`)
- [ ] 견적 유형 타입 정의 (`profitability` / `spec_match` / `performance`)
- [ ] RFP 상태 타입 정의 (`uploaded` / `parsing` / `parsed` / `error`)
- [ ] 견적 상태 타입 정의 (`draft` / `confirmed` / `won` / `lost`)
- [ ] API 요청/응답 타입 정의
- [ ] 로그인 폼 Zod 스키마 정의
- [ ] 초기설정 폼 Zod 스키마 정의
- [ ] 부품등록 폼 Zod 스키마 정의
- [ ] 사용자추가 폼 Zod 스키마 정의

## 테스트 체크리스트
- [ ] `npx tsc --noEmit` 컴파일 에러 없음
- [ ] 모든 Zod 스키마의 유효성 검증 동작 확인

## 참고사항
이 타입 정의는 프로젝트 전체에서 사용되므로, 데이터베이스 스키마(Task 003)와 일관성을 유지해야 합니다.
