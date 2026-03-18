# Task 064: 유지보수/서비스 계약 견적

## 개요

하드웨어 유지보수(연장 보증, 24x7 지원), 설치/구축 서비스, 정기 점검 등을 견적에 포함합니다. SLA 옵션별 가격 설정과 연간/다년 계약 할인 자동 계산을 지원하여 원스톱 견적 서비스를 제공합니다.

## 관련 기능

- **F040**: 유지보수/서비스 계약 견적
- **F007**: 견적서 발행 및 출력 — 품목 구분(service/maintenance) 활용
- **F037**: 납품 후 자산 추적 — 유지보수 계약 연동

## 현재 상태

- 견적 항목(quotation_items)에 `item_type: 'service'`, `'maintenance'` 지원
- 서비스 계약 전용 관리 기능 없음
- SLA 레벨별 가격 모델 없음

## 수락 기준

- [ ] 유지보수/서비스 계약 등록/관리 가능
- [ ] SLA 옵션별 가격 설정 (9x5 NBD, 24x7 4H 등)
- [ ] 연간/다년 계약 할인 자동 계산
- [ ] 견적 항목에 유지보수/서비스 추가 가능
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 데이터 모델 설계

- [ ] `service_contracts` 테이블:
  - `id`, `tenant_id`, `name`, `service_type` (warranty_extension/support/installation/inspection)
  - `sla_level` (9x5_nbd/24x7_4h/24x7_2h/custom)
  - `base_price_annual`, `multi_year_discounts` (JSONB — 2년:5%, 3년:10% 등)
  - `description`, `scope`, `is_active`, `created_at`
- [ ] TypeScript 인터페이스 및 Zod 스키마

**관련 파일:**
- `lib/types/service-contract.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 2: 서비스 계약 관리 API 및 UI

- [ ] 서비스 계약 CRUD API (`/api/service-contracts`)
- [ ] 서비스 계약 등록/수정 폼 (유형별, SLA별)
- [ ] 서비스 계약 목록 테이블

**관련 파일:**
- `app/api/service-contracts/route.ts` (신규)
- `components/services/contract-list.tsx` (신규)
- `components/services/contract-form.tsx` (신규)

### Step 3: 견적 항목에 서비스 추가

- [ ] 견적 생성 시 "서비스 추가" 버튼
- [ ] 서비스 선택 → SLA 레벨 선택 → 계약 기간 선택
- [ ] 다년 계약 할인 자동 적용
- [ ] 하드웨어 수량 기반 서비스 비용 자동 산정

**관련 파일:**
- `lib/quotation/service-price-calculator.ts` (신규)
- `components/quotation/add-service-dialog.tsx` (신규)

### Step 4: 계약 만료 관리

- [ ] 계약 만료일 추적
- [ ] 만료 알림 (F016 연동)
- [ ] 자산 관리(F037)와 연동

### Step 5: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] SLA별, 기간별 가격 계산 정확도 검증

---

## 관련 파일

- `lib/types/service-contract.ts` — 서비스 계약 타입 (신규)
- `lib/quotation/service-price-calculator.ts` — 가격 계산 (신규)
- `components/services/contract-list.tsx` — 계약 목록 (신규)
- `components/services/contract-form.tsx` — 계약 폼 (신규)
- `components/quotation/add-service-dialog.tsx` — 견적에 서비스 추가 (신규)
- `app/api/service-contracts/route.ts` — 서비스 계약 API (신규)

## 테스트 체크리스트

- [ ] 24x7 4H SLA 가격이 9x5 NBD보다 높게 계산됨
- [ ] 3년 계약 시 할인율이 자동 적용됨
- [ ] 서버 10대 견적 시 유지보수 비용이 수량에 비례함
- [ ] 견적서 PDF에 서비스 항목이 별도 구분 표시됨
- [ ] 계약 만료 알림이 정상 발생함
