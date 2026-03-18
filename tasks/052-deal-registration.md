# Task 052: 딜 레지스트레이션 관리

## 개요

Dell, HPE, Lenovo 등 주요 벤더의 딜 레지스트레이션(Deal Registration) 등록 현황을 추적하고 관리합니다. 딜 등록 시 받는 추가 할인율을 견적 생성에 자동 반영하여 마진을 극대화하고, 만료 임박 딜에 대한 알림으로 할인 기회를 놓치지 않도록 합니다.

## 관련 기능

- **F028**: 딜 레지스트레이션 관리 — 벤더 딜 등록 현황 + 추가 할인율
- **F005**: 3가지 견적안 자동 생성 — 딜 할인율 자동 반영
- **F016**: 실시간 알림 — 만료 임박 알림

## 현재 상태

- 벤더별 딜 관리 기능 없음
- 부품(parts) 테이블에 제조사(manufacturer) 필드 존재
- 견적 생성 시 벤더 할인을 반영하는 메커니즘 없음

## 수락 기준

- [ ] 딜 레지스트레이션 CRUD (등록/조회/수정/삭제) 가능
- [ ] 벤더별(Dell/HPE/Lenovo/기타) 딜 등록 및 상태 관리
- [ ] 등록일/만료일/승인상태(pending/approved/rejected/expired) 추적
- [ ] 추가 할인율이 견적 생성 시 자동 반영
- [ ] 만료 임박 딜에 대한 알림 발생
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 데이터 모델 설계 및 마이그레이션

- [ ] `deal_registrations` 테이블 설계:
  - `id`, `tenant_id`, `created_by`, `vendor` (dell/hpe/lenovo/other)
  - `deal_number` (벤더 딜 번호), `customer_id` (거래처)
  - `product_line` (제품 라인), `estimated_amount` (예상 금액)
  - `discount_rate` (추가 할인율 %), `status` (pending/approved/rejected/expired)
  - `registered_date`, `expiry_date`, `approved_date`
  - `notes`, `created_at`, `updated_at`
- [ ] TypeScript 인터페이스 및 Zod 스키마 정의
- [ ] RLS 정책 적용

**관련 파일:**
- `lib/types/deal-registration.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 2: 딜 레지스트레이션 CRUD API

- [ ] `POST /api/deal-registrations` — 딜 등록
- [ ] `GET /api/deal-registrations` — 딜 목록 조회 (벤더별/상태별 필터)
- [ ] `PUT /api/deal-registrations/[id]` — 딜 수정 (상태 변경 포함)
- [ ] `DELETE /api/deal-registrations/[id]` — 딜 삭제

**관련 파일:**
- `app/api/deal-registrations/route.ts` (신규)
- `app/api/deal-registrations/[id]/route.ts` (신규)

### Step 3: 딜 레지스트레이션 관리 페이지 UI

- [ ] `/deal-registration` 라우트 페이지 생성
- [ ] 딜 목록 테이블 (벤더, 딜번호, 거래처, 할인율, 상태, 만료일)
- [ ] 상태별 필터 탭 (전체/승인/대기/만료)
- [ ] 딜 등록 모달 폼
- [ ] 만료 임박(30일 이내) 딜 하이라이트 표시
- [ ] 사이드바 메뉴에 "딜 레지스트레이션" 추가

**관련 파일:**
- `app/(dashboard)/deal-registration/page.tsx` (신규)
- `components/deal/deal-list.tsx` (신규)
- `components/deal/deal-form.tsx` (신규)

### Step 4: 견적 생성 시 딜 할인 자동 반영

- [ ] 견적 생성 시 해당 거래처+벤더의 승인된 딜 자동 탐지
- [ ] 적용 가능한 딜의 할인율을 부품 가격에 자동 적용
- [ ] 할인 적용 여부 토글 기능
- [ ] 적용된 딜 정보 견적서에 표시

**관련 파일:**
- `lib/quotation/deal-discount-calculator.ts` (신규)
- `app/(dashboard)/quotation/page.tsx` (수정)

### Step 5: 만료 알림 연동

- [ ] 만료 30일 전 알림 생성 로직
- [ ] 기존 알림 시스템(F016)과 연동
- [ ] 만료된 딜 자동 상태 변경 (approved → expired)

### Step 6: 검증 및 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 딜 CRUD 정상 동작 확인
- [ ] 견적 생성 시 딜 할인 자동 반영 확인

---

## 관련 파일

- `app/(dashboard)/deal-registration/page.tsx` — 딜 관리 페이지 (신규)
- `components/deal/deal-list.tsx` — 딜 목록 (신규)
- `components/deal/deal-form.tsx` — 딜 등록/수정 폼 (신규)
- `lib/types/deal-registration.ts` — 딜 타입 정의 (신규)
- `lib/quotation/deal-discount-calculator.ts` — 딜 할인 계산 (신규)
- `app/api/deal-registrations/route.ts` — 딜 API (신규)
- `app/api/deal-registrations/[id]/route.ts` — 딜 상세 API (신규)

## 테스트 체크리스트

- [ ] 딜 등록 시 DB에 정상 저장됨
- [ ] 만료일 지난 딜의 상태가 expired로 자동 변경됨
- [ ] 견적 생성 시 해당 거래처의 승인된 딜 할인율이 자동 반영됨
- [ ] 만료된 딜의 할인율은 견적에 반영되지 않음
- [ ] 멤버 역할은 딜 조회만 가능하고 등록/수정 불가
- [ ] 다른 테넌트의 딜 데이터에 접근 불가
