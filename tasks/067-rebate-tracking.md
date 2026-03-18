# Task 067: 리베이트/인센티브 추적

## 개요

벤더별 분기/연간 리베이트 프로그램과 판매 인센티브 목표를 추적합니다. 현재 달성률, 예상 리베이트 금액, 목표 달성을 위한 추가 판매 필요액을 계산하여 리베이트 수익을 극대화합니다.

## 관련 기능

- **F043**: 리베이트/인센티브 추적
- **F008**: 낙찰 결과 기록 — 판매 실적 데이터
- **F028**: 딜 레지스트레이션 관리 — 벤더 프로그램 연동

## 현재 상태

- 견적 및 낙찰 이력 데이터 존재
- 벤더별 리베이트 프로그램 관리 기능 없음
- 판매 목표 추적 기능 없음

## 수락 기준

- [ ] 벤더별 리베이트 프로그램 등록/관리
- [ ] 현재 달성률 실시간 추적
- [ ] 예상 리베이트 금액 계산
- [ ] 목표 달성 GAP 분석
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 데이터 모델 설계

- [ ] `rebate_programs` 테이블:
  - `id`, `tenant_id`, `vendor`, `program_name`
  - `period_type` (quarterly/annual), `start_date`, `end_date`
  - `target_amount` (목표 금액), `rebate_tiers` (JSONB — 구간별 리베이트율)
  - `is_active`, `created_at`
- [ ] `rebate_progress` 테이블:
  - `id`, `rebate_program_id`, `period_date`
  - `achieved_amount` (달성 금액), `rebate_earned` (예상 리베이트)
  - `updated_at`
- [ ] TypeScript 인터페이스 및 Zod 스키마

**관련 파일:**
- `lib/types/rebate.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 2: 리베이트 프로그램 관리 API

- [ ] 리베이트 프로그램 CRUD API (`/api/rebates`)
- [ ] 달성률 계산 API (`/api/rebates/[id]/progress`)
- [ ] 낙찰(won) 견적 금액 자동 집계

**관련 파일:**
- `app/api/rebates/route.ts` (신규)
- `app/api/rebates/[id]/route.ts` (신규)
- `app/api/rebates/[id]/progress/route.ts` (신규)

### Step 3: 리베이트 관리 페이지 UI

- [ ] `/rebates` 라우트 페이지 생성
- [ ] 리베이트 프로그램 목록 (벤더, 기간, 목표, 달성률)
- [ ] 달성률 프로그레스 바 시각화
- [ ] 리베이트 구간별 현재 위치 표시
- [ ] GAP 분석: "목표까지 X만원 추가 판매 필요"
- [ ] 사이드바 메뉴에 "리베이트 관리" 추가

**관련 파일:**
- `app/(dashboard)/rebates/page.tsx` (신규)
- `components/rebates/rebate-list.tsx` (신규)
- `components/rebates/progress-chart.tsx` (신규)

### Step 4: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 달성률 계산 정확도 검증
- [ ] 리베이트 구간별 금액 계산 확인

---

## 관련 파일

- `app/(dashboard)/rebates/page.tsx` — 리베이트 관리 페이지 (신규)
- `components/rebates/rebate-list.tsx` — 리베이트 목록 (신규)
- `components/rebates/progress-chart.tsx` — 달성률 차트 (신규)
- `lib/types/rebate.ts` — 리베이트 타입 (신규)
- `app/api/rebates/route.ts` — 리베이트 API (신규)

## 테스트 체크리스트

- [ ] 리베이트 프로그램 등록 시 구간별 리베이트율이 저장됨
- [ ] 낙찰 견적 금액이 달성률에 자동 반영됨
- [ ] 목표 금액 대비 현재 달성률이 정확히 계산됨
- [ ] GAP 분석 금액이 정확함
- [ ] 멤버 역할은 리베이트 조회만 가능
