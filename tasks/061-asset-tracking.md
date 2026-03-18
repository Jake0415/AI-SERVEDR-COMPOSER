# Task 061: 납품 후 자산 추적 (간이 ITAM)

## 개요

납품 완료된 장비의 시리얼번호, 설치 위치, 보증 만료일, 유지보수 이력을 간이 추적합니다. 보증 만료 알림과 유지보수 갱신 알림을 통해 고객 재구매 기회를 포착하고, 고객과의 지속적인 관계를 유지합니다.

## 관련 기능

- **F037**: 납품 후 자산 추적 (간이 ITAM)
- **F008**: 낙찰 결과 기록 — won 견적에서 자산 생성
- **F020**: 거래처 관리 — 거래처별 자산 조회
- **F016**: 실시간 알림 — 보증 만료/갱신 알림

## 현재 상태

- 낙찰(won) 견적 및 실판매 기록 존재
- 납품 후 장비 추적 기능 없음
- 자산 관리 데이터 모델 없음

## 수락 기준

- [ ] 납품 완료 견적에서 자산 자동/수동 생성
- [ ] 자산별 시리얼번호, 설치 위치, 보증 만료일 관리
- [ ] 유지보수 이력 기록
- [ ] 보증 만료 알림 (30/60/90일 전)
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 데이터 모델 설계 및 마이그레이션

- [ ] `assets` 테이블:
  - `id`, `tenant_id`, `quotation_id`, `customer_id`
  - `asset_name`, `serial_number`, `model_name`, `manufacturer`
  - `install_location`, `install_date`, `warranty_start`, `warranty_end`
  - `status` (active/warranty_expiring/warranty_expired/decommissioned)
  - `notes`, `created_at`, `updated_at`
- [ ] `asset_maintenance_logs` 테이블:
  - `id`, `asset_id`, `maintenance_type` (repair/upgrade/inspection/replacement)
  - `description`, `cost`, `performed_by`, `performed_date`
  - `next_maintenance_date`, `created_at`
- [ ] TypeScript 인터페이스 및 Zod 스키마

**관련 파일:**
- `lib/types/assets.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 2: 자산 CRUD API

- [ ] `POST /api/assets` — 자산 등록
- [ ] `GET /api/assets` — 자산 목록 (거래처별/상태별 필터)
- [ ] `PUT /api/assets/[id]` — 자산 수정
- [ ] `DELETE /api/assets/[id]` — 자산 삭제
- [ ] `POST /api/assets/[id]/maintenance` — 유지보수 기록 추가
- [ ] `POST /api/assets/generate-from-quotation/[id]` — 견적에서 자산 일괄 생성

**관련 파일:**
- `app/api/assets/route.ts` (신규)
- `app/api/assets/[id]/route.ts` (신규)
- `app/api/assets/[id]/maintenance/route.ts` (신규)

### Step 3: 자산 관리 페이지 UI

- [ ] `/assets` 라우트 페이지 생성
- [ ] 자산 목록 테이블 (이름, 시리얼, 거래처, 보증만료, 상태)
- [ ] 자산 상세 뷰 (유지보수 이력 타임라인)
- [ ] 자산 등록/수정 폼
- [ ] 보증 만료 임박 자산 하이라이트
- [ ] 사이드바 메뉴에 "자산 관리" 추가

**관련 파일:**
- `app/(dashboard)/assets/page.tsx` (신규)
- `components/assets/asset-list.tsx` (신규)
- `components/assets/asset-detail.tsx` (신규)
- `components/assets/maintenance-timeline.tsx` (신규)

### Step 4: 견적에서 자산 자동 생성

- [ ] 납품 완료 견적에서 "자산 등록" 버튼
- [ ] 견적 항목을 자산으로 자동 변환
- [ ] 시리얼번호, 보증 기간 일괄 입력 UI

### Step 5: 알림 연동 및 검증

- [ ] 보증 만료 30/60/90일 전 알림
- [ ] 유지보수 예정일 알림
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 관련 파일

- `app/(dashboard)/assets/page.tsx` — 자산 관리 페이지 (신규)
- `components/assets/asset-list.tsx` — 자산 목록 (신규)
- `components/assets/asset-detail.tsx` — 자산 상세 (신규)
- `components/assets/maintenance-timeline.tsx` — 유지보수 타임라인 (신규)
- `lib/types/assets.ts` — 자산 타입 (신규)
- `app/api/assets/route.ts` — 자산 API (신규)

## 테스트 체크리스트

- [ ] 견적에서 자산 일괄 생성 시 항목 수만큼 자산이 생성됨
- [ ] 보증 만료 30일 전 알림이 발생함
- [ ] 유지보수 기록 추가 시 타임라인에 표시됨
- [ ] 거래처별 자산 필터링이 정상 동작함
- [ ] 멤버 역할은 자산 조회만 가능
