# Task 055: 벤더 프로모션/특별가 관리

## 개요

벤더별 프로모션(기간 한정 할인, 번들 특가, 물량 할인)을 등록하고 관리합니다. 견적 생성 시 적용 가능한 프로모션을 자동으로 탐지하여 알려주고, 프로모션 만료 알림으로 할인 기회를 놓치지 않도록 합니다.

## 관련 기능

- **F031**: 벤더 프로모션/특별가 관리
- **F005**: 3가지 견적안 자동 생성 — 프로모션 가격 반영
- **F016**: 실시간 알림 — 프로모션 만료 알림

## 현재 상태

- 부품 가격 관리(F002) 구현됨
- 벤더별 프로모션/특별가를 관리하는 기능 없음
- 시한부 할인을 추적하는 메커니즘 없음

## 수락 기준

- [ ] 벤더 프로모션 CRUD 가능
- [ ] 프로모션 유형별 관리 (기간 한정, 번들, 물량)
- [ ] 견적 생성 시 적용 가능 프로모션 자동 탐지
- [ ] 프로모션 만료 알림 발생
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 데이터 모델 설계 및 마이그레이션

- [ ] `vendor_promotions` 테이블 설계:
  - `id`, `tenant_id`, `vendor` (제조사), `promotion_name`
  - `promotion_type` (discount/bundle/volume), `discount_rate`, `discount_amount`
  - `target_categories` (적용 카테고리 JSONB), `target_parts` (적용 부품 JSONB)
  - `min_quantity` (최소 수량 — 물량 할인), `bundle_items` (번들 구성 JSONB)
  - `start_date`, `end_date`, `is_active`
  - `notes`, `created_by`, `created_at`
- [ ] TypeScript 인터페이스 및 Zod 스키마

**관련 파일:**
- `lib/types/vendor-promotion.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 2: 프로모션 CRUD API

- [ ] `POST /api/vendor-promotions` — 프로모션 등록
- [ ] `GET /api/vendor-promotions` — 프로모션 목록 (벤더/유형/상태 필터)
- [ ] `PUT /api/vendor-promotions/[id]` — 프로모션 수정
- [ ] `DELETE /api/vendor-promotions/[id]` — 프로모션 삭제

**관련 파일:**
- `app/api/vendor-promotions/route.ts` (신규)
- `app/api/vendor-promotions/[id]/route.ts` (신규)

### Step 3: 프로모션 관리 페이지 UI

- [ ] `/vendor-promotions` 라우트 페이지 생성
- [ ] 프로모션 목록 (활성/만료/예정 상태별 탭)
- [ ] 프로모션 등록/수정 폼 (유형별 필드 분기)
- [ ] 프로모션 달력 뷰 (기간 시각화)
- [ ] 사이드바 메뉴에 "벤더 프로모션" 추가

**관련 파일:**
- `app/(dashboard)/vendor-promotions/page.tsx` (신규)
- `components/promotions/promotion-list.tsx` (신규)
- `components/promotions/promotion-form.tsx` (신규)

### Step 4: 견적 생성 시 프로모션 자동 탐지

- [ ] 견적 부품 구성 시 적용 가능 프로모션 자동 매칭
- [ ] 프로모션 적용 시 할인 가격 자동 계산
- [ ] 프로모션 적용/미적용 토글
- [ ] 적용된 프로모션 정보 표시 패널

**관련 파일:**
- `lib/quotation/promotion-matcher.ts` (신규)

### Step 5: 만료 알림 및 검증

- [ ] 프로모션 만료 7일 전 알림 생성
- [ ] 만료된 프로모션 자동 비활성화
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 관련 파일

- `app/(dashboard)/vendor-promotions/page.tsx` — 프로모션 관리 페이지 (신규)
- `components/promotions/promotion-list.tsx` — 프로모션 목록 (신규)
- `components/promotions/promotion-form.tsx` — 프로모션 폼 (신규)
- `lib/types/vendor-promotion.ts` — 프로모션 타입 (신규)
- `lib/quotation/promotion-matcher.ts` — 프로모션 매칭 (신규)
- `app/api/vendor-promotions/route.ts` — 프로모션 API (신규)

## 테스트 체크리스트

- [ ] 프로모션 등록 시 DB에 정상 저장됨
- [ ] 활성 프로모션 기간 내 견적 생성 시 자동 탐지됨
- [ ] 물량 할인 프로모션이 최소 수량 충족 시에만 적용됨
- [ ] 만료된 프로모션은 견적에 적용되지 않음
- [ ] 만료 7일 전 알림이 정상 발생함
