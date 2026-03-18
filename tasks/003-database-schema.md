# Task 003: 데이터베이스 스키마 설계 및 마이그레이션 파일 작성

## 상태
- [x] ✅ 완료

## 개요
Supabase PostgreSQL 기반으로 9개 테이블의 SQL 마이그레이션을 작성하고, RLS 정책을 설계합니다.
기본 14개 부품 카테고리 시드 데이터와 원가 필드 암호화 처리 방안도 포함합니다.

## 관련 PRD 기능
- [F001] 부품 관리
- [F002] 부품 가격 관리
- [F003] RFP 업로드
- [F005] 견적 생성
- [F009] 낙찰 이력
- [F010] 인증 시스템
- [F013] 사용자 관리

## 관련 파일
- `supabase/migrations/001_create_tables.sql` — 테이블 생성 마이그레이션
- `supabase/migrations/002_rls_policies.sql` — RLS 정책
- `supabase/migrations/003_seed_categories.sql` — 시드 데이터
- `supabase/migrations/004_encryption.sql` — 암호화 함수

## 수락 기준
- [ ] 9개 테이블 SQL 마이그레이션이 작성됨
- [ ] RLS 정책이 테넌트 격리를 보장하도록 설계됨
- [ ] 14개 부품 카테고리 시드 데이터가 작성됨
- [ ] 외래 키 관계 및 인덱스가 설계됨
- [ ] `cost_price` AES-256 암호화 처리 방안이 문서화됨

## 구현 단계
- [ ] `tenants` 테이블 SQL 작성
- [ ] `users` 테이블 SQL 작성
- [ ] `part_categories` 테이블 SQL 작성
- [ ] `parts` 테이블 SQL 작성
- [ ] `part_prices` 테이블 SQL 작성
- [ ] `rfp_documents` 테이블 SQL 작성
- [ ] `quotations` 테이블 SQL 작성
- [ ] `quotation_items` 테이블 SQL 작성
- [ ] `bid_results` 테이블 SQL 작성
- [ ] 외래 키 관계 설정
- [ ] 인덱스 설계 및 추가
- [ ] RLS 정책 설계 (테넌트별 데이터 격리)
- [ ] 서버 부품 시드 데이터 작성 (CPU, 메모리, SSD, HDD, NIC, RAID, GPU, PSU, 메인보드, 섀시, HBA)
- [ ] 네트워크·인프라 시드 데이터 작성 (스위치, 광 트랜시버, 케이블)
- [ ] `cost_price` AES-256 암호화 함수 설계 (pgcrypto 확장)

## 테스트 체크리스트
- [ ] 마이그레이션 SQL 문법 오류 없음
- [ ] 외래 키 관계 정상 동작 확인
- [ ] 시드 데이터 삽입 성공 확인

## 참고사항
Task 002의 TypeScript 타입 정의와 필드명/타입이 일치해야 합니다. pgcrypto 확장은 Supabase에서 기본 제공됩니다.
