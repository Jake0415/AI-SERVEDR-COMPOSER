# Task 068: 멀티 벤더 가격 비교

## 개요

동일 사양의 부품/서버에 대해 Dell, HPE, Lenovo 등 멀티 벤더의 가격을 나란히 비교합니다. 벤더별 장단점, 납기, 보증 조건을 비교 매트릭스로 제공하여 최적의 벤더를 선택할 수 있도록 지원합니다.

## 관련 기능

- **F044**: 멀티 벤더 가격 비교
- **F001**: 부품 DB 등록/관리 — 벤더별 부품 데이터
- **F005**: 3가지 견적안 자동 생성 — 벤더 선택 시 견적 반영

## 현재 상태

- 부품(parts) 테이블에 제조사(manufacturer) 필드 존재
- 동일 사양 부품을 벤더별로 비교하는 기능 없음
- 벤더별 납기/보증 정보 없음

## 수락 기준

- [ ] 동일 사양 부품의 벤더별 가격 비교 매트릭스
- [ ] 벤더별 납기, 보증 조건 비교
- [ ] 최적 벤더 추천 로직
- [ ] 견적 생성 시 벤더 비교 패널
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 벤더 비교 데이터 모델

- [ ] `vendor_part_mappings` 테이블:
  - `id`, `tenant_id`, `spec_group_id` (동일 사양 그룹)
  - `part_id`, `vendor`, `lead_time_days` (납기 일수)
  - `warranty_years`, `warranty_type` (basic/onsite/premium)
  - `notes`, `created_at`
- [ ] 동일 사양 그룹 자동/수동 매핑 로직
- [ ] TypeScript 인터페이스

**관련 파일:**
- `lib/types/vendor-comparison.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 2: 벤더 비교 API

- [ ] `GET /api/vendor-comparison/[specGroupId]` — 사양 그룹별 벤더 비교
- [ ] `POST /api/vendor-comparison/map` — 부품 매핑 등록
- [ ] `GET /api/vendor-comparison/recommend` — 최적 벤더 추천

**관련 파일:**
- `app/api/vendor-comparison/route.ts` (신규)

### Step 3: 벤더 비교 매트릭스 UI

- [ ] 비교 매트릭스 테이블 (벤더, 가격, 납기, 보증, 총점)
- [ ] 가중치 설정 슬라이더 (가격/납기/보증 중요도)
- [ ] 최적 벤더 하이라이트

**관련 파일:**
- `components/vendor/comparison-matrix.tsx` (신규)
- `components/vendor/vendor-score-card.tsx` (신규)

### Step 4: 견적 생성 연동

- [ ] 견적 생성 시 부품 선택 단계에서 "벤더 비교" 버튼
- [ ] 비교 결과에서 벤더 선택 → 해당 부품으로 견적 반영

**관련 파일:**
- `components/quotation/vendor-comparison-panel.tsx` (신규)

### Step 5: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 벤더 비교 매트릭스 정상 표시 확인
- [ ] 가중치 변경 시 추천 순위 변동 확인

---

## 관련 파일

- `lib/types/vendor-comparison.ts` — 벤더 비교 타입 (신규)
- `components/vendor/comparison-matrix.tsx` — 비교 매트릭스 (신규)
- `components/vendor/vendor-score-card.tsx` — 벤더 점수 카드 (신규)
- `components/quotation/vendor-comparison-panel.tsx` — 견적 내 비교 패널 (신규)
- `app/api/vendor-comparison/route.ts` — 벤더 비교 API (신규)

## 테스트 체크리스트

- [ ] 동일 사양 부품의 3개 벤더 가격이 나란히 비교됨
- [ ] 가중치 변경 시 추천 순위가 변동됨
- [ ] 선택한 벤더의 부품이 견적에 반영됨
- [ ] 납기/보증 조건이 비교 매트릭스에 표시됨
- [ ] 매핑되지 않은 부품에 대한 안내 메시지 표시
