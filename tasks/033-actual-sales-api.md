# Task 033: 실판매 기록 API

## 개요

실판매 기록의 생성, 조회, 수정 API와 견적 정확도 통계 API를 구현합니다. 낙찰(won) 견적에 대해 실제 계약 금액과 납품 내역을 CRUD로 관리하고, 전체 견적 정확도, 마진 비교 등의 통계 데이터를 제공합니다.

## 관련 기능

- **F021**: 실판매 기록 — CRUD API
- **F022**: 견적 vs 실판매 비교 — 통계 API, 견적 정확도 계산

## 현재 상태

- 견적 API: `GET/POST /api/quotation`, `GET/PUT /api/quotation/[id]` 존재
- 낙찰 결과 API: `POST /api/bid-result` 존재
- 인증/권한 유틸리티: `lib/auth/actions.ts`의 `getCurrentUser()` 사용 중
- 실판매 관련 API 없음

## 수락 기준

- [ ] `POST /api/actual-sales` — 실판매 기록 생성 API 동작
- [ ] `GET /api/actual-sales/[quotationId]` — 특정 견적의 실판매 조회 API 동작
- [ ] `PUT /api/actual-sales/[id]` — 실판매 수정 API 동작
- [ ] `GET /api/actual-sales/stats` — 전체 통계 API 동작
- [ ] 모든 API에서 권한 검증 (super_admin, admin만 접근)
- [ ] 모든 API에서 테넌트 격리 적용
- [ ] 입력 데이터 Zod 검증 적용
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 실판매 기록 생성 API

- [ ] `app/api/actual-sales/route.ts` (신규)
- [ ] `POST /api/actual-sales`
  - 요청 바디:
    ```typescript
    {
      quotation_id: string;        // 견적 ID (won 상태 검증)
      contract_number: string;     // 계약번호
      contract_date: string;       // 계약일자 (ISO date)
      delivery_date?: string;      // 납품일자 (선택)
      file_url?: string;           // 첨부파일 URL
      notes?: string;              // 비고
      items: {
        quotation_item_id?: string;  // 견적 항목 ID (nullable)
        item_name: string;
        item_spec?: string;
        actual_quantity: number;
        actual_unit_price: number;
        change_type: 'unchanged' | 'modified' | 'added' | 'removed';
        change_reason?: string;
        sort_order: number;
      }[];
    }
    ```
  - 검증 로직:
    - 해당 견적이 `won` 상태인지 확인
    - 해당 견적에 이미 실판매 기록이 없는지 확인 (UNIQUE 제약)
    - Zod 스키마로 입력 데이터 검증
  - 총액 자동 계산: actual_total_cost, actual_total_supply, actual_vat, actual_total_amount
  - 트랜잭션으로 actual_sales + actual_sale_items 동시 삽입
  - 응답: 생성된 실판매 기록 (items 포함)

**관련 파일:**
- `app/api/actual-sales/route.ts` (신규)
- `lib/db/schema.ts` — actualSales, actualSaleItems 테이블
- `lib/auth/actions.ts` — getCurrentUser()

### Step 2: 실판매 조회 API

- [ ] `app/api/actual-sales/[quotationId]/route.ts` (신규)
- [ ] `GET /api/actual-sales/[quotationId]`
  - 경로 파라미터: quotationId (견적 ID)
  - 응답: 실판매 기록 + items 배열 + 원본 견적 정보 (비교용)
  - 원본 견적 항목과 실판매 항목을 JOIN하여 비교 데이터 제공
  - 실판매 기록이 없는 경우 404 응답

**관련 파일:**
- `app/api/actual-sales/[quotationId]/route.ts` (신규)

### Step 3: 실판매 수정 API

- [ ] `app/api/actual-sales/[quotationId]/route.ts`에 PUT 추가
- [ ] `PUT /api/actual-sales/[id]`
  - 요청 바디: POST와 동일 구조 (items 전체 교체 방식)
  - 기존 items DELETE 후 새 items INSERT (트랜잭션)
  - 총액 재계산
  - 응답: 수정된 실판매 기록

**관련 파일:**
- `app/api/actual-sales/[quotationId]/route.ts` (수정)

### Step 4: 통계 API

- [ ] `app/api/actual-sales/stats/route.ts` (신규)
- [ ] `GET /api/actual-sales/stats`
  - 쿼리 파라미터: `period` (1m/3m/6m/12m, 기본 12m)
  - 응답 데이터:
    ```typescript
    {
      // 전체 요약
      total_records: number;           // 실판매 기록 수
      avg_accuracy: number;            // 평균 견적 정확도 (%)
      avg_margin_deviation: number;    // 평균 마진 편차 (%)

      // 견적 vs 실제 총액 비교
      total_quoted_amount: number;     // 견적 총액 합계
      total_actual_amount: number;     // 실제 총액 합계
      total_difference: number;        // 차이 합계

      // 과대/과소 견적 비율
      overestimate_count: number;      // 과대 견적 수 (견적 > 실제)
      underestimate_count: number;     // 과소 견적 수 (견적 < 실제)
      exact_count: number;             // 정확 견적 수 (차이 5% 이내)

      // 기간별 추이 (월별)
      monthly_trend: {
        month: string;
        avg_accuracy: number;
        record_count: number;
      }[];

      // 거래처별 정확도 랭킹
      customer_accuracy: {
        customer_id: string;
        customer_name: string;
        record_count: number;
        avg_accuracy: number;
      }[];
    }
    ```
  - 견적 정확도 계산: `min(실제총액, 견적총액) / max(실제총액, 견적총액) × 100`
  - 마진 편차 계산: `(실제마진율 - 예상마진율)` 평균

**관련 파일:**
- `app/api/actual-sales/stats/route.ts` (신규)

### Step 5: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] API 통합 테스트

---

## 실행 순서

```
Step 1 (생성 API)
    ↓
Step 2 (조회 API)
    ↓
Step 3 (수정 API)
    ↓
Step 4 (통계 API)
    ↓
Step 5 (검증)
```

## 기존 코드 재사용

- `app/api/quotation/` — API 라우트 패턴 참고
- `app/api/bid-result/` — 견적 상태 검증 로직 참고
- `lib/auth/actions.ts` — getCurrentUser() 인증/권한
- `lib/db/schema.ts` — Drizzle ORM 쿼리 패턴
- `lib/db/index.ts` — DB 클라이언트 연결

## 테스트 체크리스트

- [ ] POST /api/actual-sales — won 상태 견적에 대해 생성 성공
- [ ] POST /api/actual-sales — draft 상태 견적에 대해 생성 시 400 에러
- [ ] POST /api/actual-sales — 이미 실판매 기록 존재 시 409 에러
- [ ] POST /api/actual-sales — 필수 필드 누락 시 400 에러 (Zod 검증)
- [ ] POST /api/actual-sales — member 역할로 접근 시 403 에러
- [ ] POST /api/actual-sales — 총액 자동 계산 정확성 확인
- [ ] GET /api/actual-sales/[quotationId] — 실판매 기록 + items 조회 성공
- [ ] GET /api/actual-sales/[quotationId] — 존재하지 않는 견적 시 404 에러
- [ ] GET /api/actual-sales/[quotationId] — 다른 테넌트 데이터 조회 불가
- [ ] PUT /api/actual-sales/[id] — items 수정 후 총액 재계산 확인
- [ ] GET /api/actual-sales/stats — 기간별 필터 동작 확인
- [ ] GET /api/actual-sales/stats — 견적 정확도 계산 정확성 확인
- [ ] GET /api/actual-sales/stats — 과대/과소 견적 비율 정확성 확인
