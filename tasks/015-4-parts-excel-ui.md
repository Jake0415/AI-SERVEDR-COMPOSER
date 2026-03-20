# Task 015-4: 부품 엑셀 업로드 UI 및 가격 이력 UI 연동

## 상태
- [x] ✅ 완료

## 개요
Task 015-1(엑셀 업로드 API), 015-2(가격 이력 API)에서 구현된 백엔드를 부품 관리 페이지 UI에 연동한다. 엑셀 덤프로 부품을 일괄 등록/업데이트하고, 동일 제품의 가격 변동(리스트가, 시장가, 공급가)이 매 업로드마다 DB에 적재되는 흐름을 UI로 제공한다.

## 관련 PRD 기능
- [F001] 부품 DB 등록/관리 (엑셀 일괄 업로드 UI)
- [F002] 부품 가격 관리 (가격 변동 이력 조회 UI)

## 의존성
- Task 015-1 (엑셀 업로드 API) ✅ 완료
- Task 015-2 (가격 이력 API) ✅ 완료

## 사용할 기존 API
- `GET /api/parts/excel-template` — 엑셀 템플릿 다운로드
- `POST /api/parts/excel-upload` — 엑셀 업로드 (FormData: file, duplicate_mode)
- `GET /api/parts/[id]/price-history` — 부품별 가격 변동 이력 조회

## 수정 파일
- `app/(dashboard)/parts/page.tsx` — 엑셀 버튼, 업로드 Dialog, 가격이력 Dialog 추가

## 수락 기준
- [x] 부품 관리 페이지에 "엑셀 관리" 드롭다운 메뉴가 표시된다
- [x] "템플릿 다운로드" 클릭 시 .xlsx 파일이 다운로드된다
- [x] "엑셀 업로드" 클릭 시 드래그앤드롭 업로드 Dialog가 열린다
- [x] 중복 처리 옵션(건너뛰기/덮어쓰기)을 선택할 수 있다
- [x] 업로드 완료 후 성공/실패 건수와 오류 상세가 표시된다
- [x] 덮어쓰기 모드로 업로드 시 가격 이력이 자동 기록된다
- [x] 부품 목록에서 "이력" 버튼 클릭 시 가격 변동 이력 Dialog가 열린다
- [x] 가격 이력에 날짜, 변경유형, 가격 변동 전/후, 변경사유가 표시된다

## 구현 단계

### 1. 헤더 버튼 영역 변경
- [ ] "부품 추가" 버튼 옆에 "엑셀 관리" DropdownMenu 추가 (shadcn/ui)
  - "템플릿 다운로드" → `GET /api/parts/excel-template` fetch → Blob 다운로드
  - "엑셀 업로드" → 업로드 Dialog 열기

### 2. 엑셀 업로드 Dialog
- [ ] Dialog 컴포넌트 구현
  - 안내 텍스트 + 템플릿 다운로드 링크
  - 파일 선택 input[type=file] (.xlsx/.xls)
  - 중복 처리 RadioGroup: "건너뛰기(skip)" / "덮어쓰기(overwrite)"
  - 업로드 버튼 → `POST /api/parts/excel-upload` (FormData)
  - 로딩 상태 표시
- [ ] 업로드 결과 표시
  - 성공: "총 N건 중 M건 등록 완료"
  - 실패: 오류 테이블 (행번호, 필드, 사유)
- [ ] 완료 후 부품 목록 자동 새로고침

### 3. 가격 이력 Dialog
- [ ] 부품 목록 테이블 관리 컬럼에 "이력" 아이콘 버튼 추가
- [ ] 클릭 시 Dialog 열림 → `GET /api/parts/{id}/price-history` 호출
- [ ] 이력 테이블: 날짜 | 변경유형(수동/엑셀) | 리스트가(전→후) | 시장가(전→후) | 공급가(전→후) | 변경사유

## 참고
- `app/(dashboard)/quotation/excel/page.tsx` — 견적 엑셀 업로드 페이지 (유사 패턴 참고)
- shadcn/ui: Dialog, DropdownMenu, RadioGroup, Table, Button, Badge

## 테스트 체크리스트
- [ ] 엑셀 템플릿 다운로드 → .xlsx 파일 정상 다운로드
- [ ] 엑셀 업로드(신규 부품) → parts + part_prices INSERT 확인
- [ ] 엑셀 업로드(기존 부품, overwrite) → part_price_history INSERT + part_prices UPDATE 확인
- [ ] 업로드 결과 → 성공/실패 건수 정확성
- [ ] 가격 이력 조회 → 최근 변동 이력 표시 확인
