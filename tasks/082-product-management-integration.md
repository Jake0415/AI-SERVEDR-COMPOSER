# Task 082: 제품 관리 통합 — 2제품군 분리 UI + IT 인프라 장비 CRUD

## 상태
- [ ] 🚀 진행 예정

## 개요
부품 관리 페이지를 **IT 인프라 장비**(equipment_codes 기반)와 **서버 파트**(기존 parts + part_codes) 두 제품군으로 분리. 각 제품군에서 제품을 추가/수정/삭제하고, 가격 관리 및 이력 조회가 가능하도록 함.

## 관련 PRD 기능
- [F050] 제품 관리 통합 (2제품군)
- [F048] IT 인프라 코드 관리
- [F049] 서버 파트 코드 관리

## 의존성
- Task 080 (IT 인프라 코드) ✅ 완료
- Task 081 (서버 파트 코드) ✅ 완료

## 수정/생성 파일

| 파일 | 작업 |
|------|------|
| `lib/db/schema.ts` | equipment_products, equipment_product_prices, equipment_price_history 신규 + parts.partCodeId |
| `lib/db/relations.ts` | 신규 관계 정의 |
| `app/api/equipment-products/route.ts` | 신규 — GET(필터+페이지네이션)/POST |
| `app/api/equipment-products/[id]/route.ts` | 신규 — PUT/DELETE |
| `app/api/equipment-products/[id]/price-history/route.ts` | 신규 — 가격 이력 조회 |
| `app/(dashboard)/parts/page.tsx` | 2탭 메인 레이아웃으로 리팩토링 |
| `app/(dashboard)/parts/_components/equipment-tab.tsx` | 신규 — IT 인프라 장비 탭 |
| `app/(dashboard)/parts/_components/server-parts-tab.tsx` | 신규 — 서버 파트 탭 (기존 로직 이동) |
| `app/(dashboard)/parts/_components/product-add-dialog.tsx` | 신규 — 통합 제품 추가 Dialog |
| `app/(dashboard)/parts/_components/price-history-dialog.tsx` | 신규 — 가격 이력 Dialog (공통) |

## 수락 기준
- [ ] IT 인프라 장비 / 서버 파트 2탭이 표시된다
- [ ] IT 인프라 장비 탭에서 대분류→중분류 캐스케이드 필터가 동작한다
- [ ] IT 인프라 장비 제품 추가 시 3단계 코드(대→중→장비명)를 선택할 수 있다
- [ ] 서버 파트 탭에서 기존 기능(카테고리 탭, 부품 추가, 엑셀, 가격이력)이 유지된다
- [ ] 제품 추가 Dialog에서 제품군 선택에 따라 폼이 분기된다
- [ ] 가격 수정 시 이력이 자동 기록된다
- [ ] Docker 배포 후 Playwright 테스트 통과

## 구현 단계

### Phase 1: DB 스키마
- [ ] equipment_products 테이블 (id, tenantId, equipmentCodeId FK, modelName, manufacturer, specs, isDeleted, createdAt)
- [ ] equipment_product_prices 테이블 (id, productId FK, listPrice, marketPrice, supplyPrice)
- [ ] equipment_price_history 테이블 (가격 변동 이력)
- [ ] parts 테이블에 partCodeId nullable FK 추가
- [ ] relations.ts 관계 정의

### Phase 2: API
- [ ] GET /api/equipment-products (대분류/중분류 필터, 검색, 페이지네이션)
- [ ] POST /api/equipment-products (제품 등록)
- [ ] PUT /api/equipment-products/[id] (수정 + 가격 이력 기록)
- [ ] DELETE /api/equipment-products/[id] (소프트 삭제)
- [ ] GET /api/equipment-products/[id]/price-history (가격 이력)

### Phase 3: UI 리팩토링
- [ ] parts/page.tsx → 2탭 메인 레이아웃
- [ ] equipment-tab.tsx (IT 인프라 장비 전용)
- [ ] server-parts-tab.tsx (기존 부품 로직 이동)
- [ ] product-add-dialog.tsx (제품군 분기 Dialog)
- [ ] price-history-dialog.tsx (공통 가격 이력)

## 테스트 체크리스트
- [ ] IT 인프라 장비 탭: 대분류 필터 → 중분류 필터 → 테이블 갱신
- [ ] 장비 제품 추가 → equipment_products + prices INSERT 확인
- [ ] 장비 가격 수정 → equipment_price_history INSERT 확인
- [ ] 서버 파트 탭: 기존과 동일하게 동작
- [ ] 제품 추가 Dialog: IT 인프라 / 서버 파트 분기 확인
