# Task 031: 실판매 기록 DB 스키마 설계

## 개요

낙찰(won) 상태의 견적에 대해 실제 계약 금액과 납품 내역을 기록하는 `actual_sales`, `actual_sale_items` 테이블을 설계하고 마이그레이션합니다. 견적 금액 대비 실제 판매 금액의 차이를 항목별로 추적하여 견적 정확도 분석의 기초 데이터를 제공합니다.

## 관련 기능

- **F021**: 실판매 기록 — 낙찰(won) 견적에 대해 실제 계약 금액, 납품 내역을 기록
- **F022**: 견적 vs 실판매 비교 — 원래 견적 금액 대비 실제 판매 금액 차이를 항목별로 비교

## 현재 상태

- DB 스키마: `quotations`, `quotation_items`, `bid_results` 테이블 존재
- 견적 상태에 `won` 상태 포함 (draft/review/approved/published/won/lost/pending/expired)
- 실판매 기록 관련 테이블 없음
- Drizzle ORM으로 스키마 정의 (`lib/db/schema.ts`, `ai_server_composer` 스키마)

## 수락 기준

- [ ] `actual_sales` 테이블이 생성되고 `quotations` 테이블과 FK 관계가 설정됨
- [ ] `actual_sale_items` 테이블이 생성되고 `actual_sales`, `quotation_items` 테이블과 FK 관계가 설정됨
- [ ] `change_type` 컬럼이 `unchanged/modified/added/removed` 4가지 값을 지원함
- [ ] RLS 정책이 적용되어 테넌트별 데이터가 격리됨
- [ ] Drizzle ORM 스키마에 두 테이블이 정의됨
- [ ] 마이그레이션 SQL이 작성되고 실행 가능함
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: Drizzle ORM 스키마 정의

- [ ] `lib/db/schema.ts`에 `actualSales` 테이블 정의

```
actual_sales 테이블:
├── id               — UUID, PK, 기본값 gen_random_uuid()
├── quotation_id     — UUID, FK → quotations.id, NOT NULL
├── tenant_id        — UUID, FK → tenants.id, NOT NULL
├── contract_number  — TEXT, 계약번호
├── contract_date    — DATE, 계약일자
├── delivery_date    — DATE, 납품일자, NULLABLE
├── actual_total_cost    — INTEGER, 실제 총 원가
├── actual_total_supply  — INTEGER, 실제 총 공급가
├── actual_vat           — INTEGER, 실제 부가가치세
├── actual_total_amount  — INTEGER, 실제 총액 (공급가 + VAT)
├── file_url         — TEXT, 첨부파일 경로, NULLABLE
├── notes            — TEXT, 비고, NULLABLE
├── recorded_by      — UUID, FK → users.id, NOT NULL
└── created_at       — TIMESTAMP, 기본값 now()
```

- [ ] `lib/db/schema.ts`에 `actualSaleItems` 테이블 정의

```
actual_sale_items 테이블:
├── id                  — UUID, PK, 기본값 gen_random_uuid()
├── actual_sale_id      — UUID, FK → actual_sales.id, NOT NULL, CASCADE DELETE
├── quotation_item_id   — UUID, FK → quotation_items.id, NULLABLE
├── item_name           — TEXT, 품명, NOT NULL
├── item_spec           — TEXT, 규격/상세, NULLABLE
├── actual_quantity     — INTEGER, 실제 수량
├── actual_unit_price   — INTEGER, 실제 단가
├── actual_amount       — INTEGER, 실제 금액 (수량 x 단가)
├── change_type         — TEXT, 변경유형 (unchanged/modified/added/removed)
├── change_reason       — TEXT, 변경사유, NULLABLE
└── sort_order          — INTEGER, 정렬순서
```

**관련 파일:**
- `lib/db/schema.ts` (수정)

### Step 2: 마이그레이션 SQL 작성

- [ ] `actual_sales` 테이블 CREATE 문 작성
- [ ] `actual_sale_items` 테이블 CREATE 문 작성
- [ ] 인덱스 생성: `actual_sales(quotation_id)`, `actual_sales(tenant_id)`, `actual_sale_items(actual_sale_id)`
- [ ] UNIQUE 제약: `actual_sales(quotation_id)` — 견적 1건당 실판매 기록 1건

**관련 파일:**
- `drizzle/` 또는 `supabase/migrations/` 디렉토리에 마이그레이션 파일

### Step 3: RLS 정책 적용

- [ ] `actual_sales` 테이블 RLS 활성화
- [ ] SELECT 정책: `tenant_id = auth.jwt() ->> 'tenant_id'`
- [ ] INSERT 정책: `tenant_id = auth.jwt() ->> 'tenant_id'` AND 역할이 super_admin 또는 admin
- [ ] UPDATE 정책: `tenant_id = auth.jwt() ->> 'tenant_id'` AND 역할이 super_admin 또는 admin
- [ ] DELETE 정책: `tenant_id = auth.jwt() ->> 'tenant_id'` AND 역할이 super_admin
- [ ] `actual_sale_items` 테이블 RLS 활성화
- [ ] `actual_sale_items`는 `actual_sales`와 JOIN하여 테넌트 격리

**관련 파일:**
- 마이그레이션 SQL 파일

### Step 4: TypeScript 타입 정의

- [ ] `ActualSale` 인터페이스 정의 (Drizzle InferSelectModel 활용)
- [ ] `ActualSaleItem` 인터페이스 정의
- [ ] `ChangeType` 유니언 타입: `'unchanged' | 'modified' | 'added' | 'removed'`
- [ ] `ActualSaleWithItems` 복합 타입 정의 (관계 포함)
- [ ] Zod 검증 스키마: `createActualSaleSchema`, `updateActualSaleSchema`

**관련 파일:**
- `lib/types/` 디렉토리 (신규 또는 기존 타입 파일 수정)

### Step 5: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 마이그레이션 SQL 실행 확인
- [ ] RLS 정책 동작 확인 (테넌트 간 데이터 격리)

---

## 실행 순서

```
Step 1 (스키마 정의)
    ↓
Step 2 (마이그레이션 SQL)
    ↓
Step 3 (RLS 정책)
    ↓
Step 4 (타입 정의)
    ↓
Step 5 (검증)
```

## 기존 코드 재사용

- `lib/db/schema.ts` — 기존 테이블 스키마 패턴 참고 (quotations, quotationItems)
- `lib/db/schema.ts` — `ai_server_composer` 스키마 네임스페이스
- 기존 마이그레이션 파일 — SQL 작성 패턴 참고
- `lib/types/` — 기존 TypeScript 타입 정의 패턴 참고

## 테스트 체크리스트

- [ ] actual_sales 테이블에 데이터 INSERT 후 정상 조회 확인
- [ ] quotation_id FK 제약 — 존재하지 않는 견적 ID로 INSERT 시 에러
- [ ] quotation_id UNIQUE 제약 — 동일 견적에 대해 중복 실판매 기록 시 에러
- [ ] actual_sale_items에 change_type 값이 4가지 중 하나인지 확인
- [ ] CASCADE DELETE — actual_sales 삭제 시 하위 actual_sale_items 자동 삭제
- [ ] RLS — 다른 테넌트의 actual_sales 데이터 조회 불가
- [ ] RLS — member 역할로 INSERT 시 거부
- [ ] RLS — admin 역할로 INSERT/UPDATE 성공
