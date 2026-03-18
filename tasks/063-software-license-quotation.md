# Task 063: 소프트웨어 라이선스 견적

## 개요

OS, 가상화(VMware, Hyper-V), 백업, 보안 등 소프트웨어 라이선스를 견적에 포함할 수 있도록 합니다. 라이선스 유형(영구/구독/볼륨), 가격 모델(CPU/코어/사용자 기반)에 따른 가격 계산과 갱신 관리를 지원합니다.

## 관련 기능

- **F039**: 소프트웨어 라이선스 견적
- **F007**: 견적서 발행 및 출력 — 품목 구분(software) 활용
- **F027**: 견적 템플릿 관리 — S/W 포함 템플릿

## 현재 상태

- 견적 항목(quotation_items)에 `item_type: 'software'` 지원
- 소프트웨어 라이선스 전용 관리 기능 없음
- 라이선스 유형별 가격 모델 없음

## 수락 기준

- [ ] 소프트웨어 라이선스 등록/관리 가능
- [ ] 라이선스 유형별 가격 모델 지원 (영구/구독/볼륨)
- [ ] 견적 항목에 S/W 라이선스 추가 가능
- [ ] 가격 자동 계산 (CPU/코어/사용자 수 기반)
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 데이터 모델 설계

- [ ] `software_licenses` 테이블:
  - `id`, `tenant_id`, `name`, `vendor`, `version`
  - `license_type` (perpetual/subscription/volume)
  - `pricing_model` (per_cpu/per_core/per_user/per_server/flat)
  - `base_price`, `unit_price`
  - `renewal_period_months` (구독: 12/36 등)
  - `volume_discounts` (JSONB — 수량별 할인율)
  - `is_active`, `created_at`
- [ ] TypeScript 인터페이스 및 Zod 스키마

**관련 파일:**
- `lib/types/software-license.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 2: 라이선스 관리 API 및 UI

- [ ] 라이선스 CRUD API (`/api/software-licenses`)
- [ ] 부품 관리 페이지에 "소프트웨어" 탭 추가 또는 별도 메뉴
- [ ] 라이선스 등록/수정 폼 (유형별 필드 분기)
- [ ] 라이선스 목록 테이블

**관련 파일:**
- `app/api/software-licenses/route.ts` (신규)
- `components/software/license-list.tsx` (신규)
- `components/software/license-form.tsx` (신규)

### Step 3: 견적 항목에 라이선스 추가

- [ ] 견적 생성 시 "소프트웨어 추가" 버튼
- [ ] 라이선스 선택 → 수량 입력 → 가격 자동 계산
- [ ] 가격 모델별 계산 로직 (CPU 수 x 단가, 코어 수 x 단가 등)
- [ ] 볼륨 할인 자동 적용

**관련 파일:**
- `lib/quotation/license-price-calculator.ts` (신규)
- `components/quotation/add-software-dialog.tsx` (신규)

### Step 4: 갱신 관리

- [ ] 구독 라이선스 갱신일 추적
- [ ] 갱신 만료 알림 (F016 연동)

### Step 5: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 각 가격 모델별 계산 정확도 검증

---

## 관련 파일

- `lib/types/software-license.ts` — 라이선스 타입 (신규)
- `lib/quotation/license-price-calculator.ts` — 가격 계산 (신규)
- `components/software/license-list.tsx` — 라이선스 목록 (신규)
- `components/software/license-form.tsx` — 라이선스 폼 (신규)
- `components/quotation/add-software-dialog.tsx` — 견적에 S/W 추가 (신규)
- `app/api/software-licenses/route.ts` — 라이선스 API (신규)

## 테스트 체크리스트

- [ ] 영구 라이선스의 가격이 정확히 계산됨
- [ ] 구독 라이선스의 연간/다년 가격이 정확히 계산됨
- [ ] per_core 모델에서 코어 수에 따른 가격이 정확함
- [ ] 볼륨 할인이 수량에 따라 자동 적용됨
- [ ] 견적서 PDF에 소프트웨어 항목이 별도 구분 표시됨
