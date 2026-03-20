# Task 080: IT 인프라 코드 관리 시스템

## 상태
- [x] ✅ 완료

## 개요
IT 인프라 장비를 대분류→중분류→장비명 3단계 계층으로 분류하는 코드 체계를 구축한다. 코드는 자동생성되며(영문2+숫자N), 설정 페이지에서 트리뷰로 관리한다. `test-document/IT_Infra_Code.xlsx` 기준 대분류 11 + 중분류 48 + 장비명 101개를 시드로 투입한다.

## 관련 PRD 기능
- [F048] IT 인프라 코드 관리

## 의존성
- Task 015 (부품 API) ✅ 완료

## 코드 자동생성 규칙

| 레벨 | 형식 | 자릿수 | 예시 | 범위 |
|------|------|--------|------|------|
| 대분류 | `AA` | 영문 2자리 | `CM`, `ST`, `NW` | 676가지 |
| 중분류 | `AA-NN` | 영문2 + 숫자2 | `CM-01`, `NW-12` | 부모별 99개 |
| 장비명 | `AA-NN-NNN` | 영문2 + 숫자2 + 숫자3 | `CM-01-001` | 중분류별 999개 |

겹침 방지: 레벨별 자릿수가 다름 (2/5/9자리, 하이픈 포함) → 구조적 중복 불가

## 수정/생성 파일

| 파일 | 작업 |
|------|------|
| `lib/db/schema.ts` | equipment_codes 테이블 추가 |
| `lib/db/relations.ts` | equipment_codes 관계 정의 (self-referencing) |
| `lib/utils/code-generator.ts` | 신규 — 코드 자동생성 유틸 |
| `scripts/seed-data.mjs` | IT_Infra_Code.xlsx 기반 시드 데이터 추가 |
| `app/api/equipment-codes/route.ts` | 신규 — GET(트리)/POST API |
| `app/api/equipment-codes/[id]/route.ts` | 신규 — PUT/DELETE API |
| `app/(dashboard)/settings/codes/page.tsx` | 신규 — 코드 관리 페이지 |
| `app/(dashboard)/settings/page.tsx` | 코드 관리 메뉴 링크 추가 |

## 수락 기준
- [ ] equipment_codes 테이블이 drizzle-kit push로 생성된다
- [ ] 시드 투입 후 대분류 11 + 중분류 48 + 장비명 101 = 총 160건 확인
- [ ] 코드 자동생성이 규칙대로 동작한다 (AA / AA-NN / AA-NN-NNN)
- [ ] GET /api/equipment-codes 호출 시 트리 구조 JSON 반환
- [ ] POST로 신규 코드 추가 시 자동 코드가 발급된다
- [ ] DELETE 시 하위 코드가 있으면 삭제 차단
- [ ] 설정 > 코드 관리 페이지에서 트리뷰가 렌더링된다
- [ ] 코드 추가/수정/삭제가 UI에서 동작한다
- [ ] Docker 배포 후 Playwright 테스트 통과

## 구현 단계

### 1. DB 스키마 추가
- [ ] `lib/db/schema.ts`에 `equipmentCodes` 테이블 정의
  - id, tenantId, code, name, level, parentId, sortOrder, isActive, createdAt
  - UNIQUE INDEX: (tenantId, code)
  - INDEX: parentId
- [ ] `lib/db/relations.ts`에 관계 정의 (parent → children self-reference)

### 2. 코드 자동생성 유틸
- [ ] `lib/utils/code-generator.ts` 신규 생성
  - `generateMajorCode(tenantId)`: 영문 2자리 랜덤, DB 중복 체크
  - `generateMinorCode(tenantId, parentCode)`: 부모코드-숫자2자리 순번
  - `generateItemCode(tenantId, parentCode)`: 부모코드-숫자3자리 순번

### 3. 시드 데이터
- [ ] `scripts/seed-data.mjs`에 IT_Infra_Code.xlsx 데이터를 코드로 변환하여 UPSERT
  - 대분류: CM, ST, NW, SC, OP, CN, PW, RK, DR, VD, SW
  - 중분류: CM-01, CM-02, ..., SW-04
  - 장비명: CM-01-001, CM-01-002, ...

### 4. API 구현
- [ ] `app/api/equipment-codes/route.ts`
  - GET: 전체 코드를 트리 구조로 반환 (대분류 → children: 중분류 → children: 장비명)
  - POST: 코드 추가 (level, parentId, name 받으면 code 자동생성)
- [ ] `app/api/equipment-codes/[id]/route.ts`
  - PUT: name, sortOrder, isActive 수정
  - DELETE: 하위 코드 존재 시 차단, 없으면 삭제

### 5. 설정 > 코드 관리 페이지
- [ ] `app/(dashboard)/settings/codes/page.tsx` 신규
  - 트리뷰: 대분류 펼침 → 중분류 펼침 → 장비명 목록
  - 각 노드: 코드 | 장비명 | 수정/삭제 버튼
  - 추가 Dialog: 레벨 선택 → 부모 선택 → 이름 입력 → 코드 자동생성
- [ ] `app/(dashboard)/settings/page.tsx`에 코드 관리 카드/링크 추가

### 6. 부품 관리 연동 (선택)
- [ ] `parts` 테이블에 `equipmentCodeId` 필드 추가 (nullable)
- [ ] 부품 추가/수정 시 장비명 코드 선택 가능

## 테스트 체크리스트
- [ ] 시드 데이터 → DB에 160건 코드 확인
- [ ] 코드 자동생성 → 규칙대로 발급 확인 (AA, AA-NN, AA-NN-NNN)
- [ ] API 트리 조회 → 3단계 계층 구조 확인
- [ ] 코드 추가 → 부모 아래에 올바른 코드 생성
- [ ] 코드 삭제 → 하위 존재 시 차단 확인
- [ ] Docker 배포 → 설정 > 코드 관리 페이지 트리뷰 확인
