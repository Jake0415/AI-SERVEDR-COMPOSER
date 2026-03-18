# Task 066: ERP 연동

## 개요

SAP, 더존 등 기존 ERP 시스템과 양방향 데이터를 연동합니다. 견적 확정 시 ERP 주문을 자동 생성하고, ERP 재고를 조회하며, 매출/매입 데이터를 동기화하여 이중 입력을 제거하고 데이터 정합성을 확보합니다.

## 관련 기능

- **F042**: ERP 연동 (SAP/더존)
- **F007**: 견적서 발행 및 출력 — 견적 확정 후 ERP 전송
- **F017**: 시스템 설정 — 연동 설정

## 현재 상태

- 견적 확정 워크플로우 구현됨
- 외부 ERP 연동 기능 없음
- 데이터 이중 입력 발생

## 수락 기준

- [ ] ERP 연동 어댑터 인터페이스 설계 (확장 가능)
- [ ] 견적 확정 → ERP 주문 자동 생성
- [ ] ERP 재고 조회 연동
- [ ] 연동 설정 UI (시스템 설정)
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: ERP 연동 어댑터 인터페이스

- [ ] 추상 ERP 어댑터 인터페이스 설계:
  - `createOrder(quotation)` — 주문 생성
  - `getInventory(partId)` — 재고 조회
  - `syncSalesData(dateRange)` — 매출 동기화
  - `syncPurchaseData(dateRange)` — 매입 동기화
  - `testConnection()` — 연결 테스트
- [ ] SAP 어댑터 스텁 구현
- [ ] 더존 어댑터 스텁 구현

**관련 파일:**
- `lib/erp/erp-adapter.ts` (신규 — 인터페이스)
- `lib/erp/adapters/sap-adapter.ts` (신규)
- `lib/erp/adapters/douzone-adapter.ts` (신규)

### Step 2: ERP 연동 API

- [ ] `POST /api/erp/order` — ERP 주문 생성
- [ ] `GET /api/erp/inventory/[partId]` — 재고 조회
- [ ] `POST /api/erp/sync` — 데이터 동기화
- [ ] `POST /api/erp/test-connection` — 연결 테스트

**관련 파일:**
- `app/api/erp/order/route.ts` (신규)
- `app/api/erp/inventory/[partId]/route.ts` (신규)
- `app/api/erp/sync/route.ts` (신규)

### Step 3: 연동 설정 UI

- [ ] 시스템 설정 페이지에 "ERP 연동" 탭 추가
- [ ] ERP 유형 선택 (SAP/더존/기타)
- [ ] 연결 정보 입력 (URL, API 키, 인증 정보)
- [ ] 연결 테스트 버튼
- [ ] 동기화 스케줄 설정

**관련 파일:**
- `components/settings/erp-integration-tab.tsx` (신규)

### Step 4: 견적 확정 시 자동 전송

- [ ] 견적 확정 후 ERP 주문 자동 생성 옵션
- [ ] 전송 성공/실패 상태 추적
- [ ] 재전송 기능

### Step 5: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 어댑터 인터페이스 구현 확인
- [ ] 연결 테스트 동작 확인

---

## 관련 파일

- `lib/erp/erp-adapter.ts` — ERP 어댑터 인터페이스 (신규)
- `lib/erp/adapters/sap-adapter.ts` — SAP 어댑터 (신규)
- `lib/erp/adapters/douzone-adapter.ts` — 더존 어댑터 (신규)
- `components/settings/erp-integration-tab.tsx` — 연동 설정 UI (신규)
- `app/api/erp/order/route.ts` — ERP 주문 API (신규)

## 테스트 체크리스트

- [ ] ERP 어댑터 인터페이스가 SAP/더존 모두 구현됨
- [ ] 연결 테스트 성공/실패 피드백이 표시됨
- [ ] 견적 확정 시 ERP 주문이 정상 생성됨
- [ ] 슈퍼어드민만 ERP 연동 설정 접근 가능
- [ ] 연동 실패 시 재전송이 가능함
