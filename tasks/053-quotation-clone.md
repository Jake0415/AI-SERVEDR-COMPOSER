# Task 053: 견적 복제 및 변형

## 개요

기존 견적을 한 클릭으로 복제하여 일부만 수정함으로써 유사 견적의 반복 작업을 효율화합니다. 복제 시 원본 견적과의 참조 관계를 유지하고, 부품 교체, 수량 변경, 마진 조정 등 일부만 수정한 후 새 견적으로 저장합니다.

## 관련 기능

- **F029**: 견적 복제 및 변형 — 기존 견적 한 클릭 복제
- **F007**: 견적서 발행 및 출력 — 견적 이력에서 복제 시작
- **F006**: 마진 시뮬레이션 — 복제 후 마진 재조정

## 현재 상태

- 견적(quotations) 테이블에 `parent_quotation_id` 필드 존재 (개정 용도)
- 견적 항목(quotation_items) 복사 메커니즘 없음
- 견적 이력 페이지에 복제 기능 없음

## 수락 기준

- [ ] 견적 이력에서 "복제" 버튼으로 전체 견적 항목 복사
- [ ] 복제된 견적은 새 견적번호가 부여되고 draft 상태로 생성
- [ ] 복제 후 편집 모드 진입하여 부품 교체/수량 변경/마진 조정 가능
- [ ] 원본 견적 참조 링크 유지
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 견적 복제 API 구현

- [ ] `POST /api/quotations/[id]/clone` — 견적 복제 API
  - 원본 quotation 정보 복사 (새 ID, 새 견적번호, status: draft)
  - 원본 quotation_items 전체 복사
  - `cloned_from_id` 필드 추가 또는 `parent_quotation_id` 활용
  - 현재 사용자를 `created_by`로 설정
- [ ] 복제 이력 추적 (감사 로그 연동)

**관련 파일:**
- `app/api/quotations/[id]/clone/route.ts` (신규)

### Step 2: 견적 이력 페이지에 복제 버튼 추가

- [ ] 견적 목록 테이블 각 행에 "복제" 아이콘 버튼 추가
- [ ] 복제 확인 다이얼로그 (원본 견적 정보 요약 표시)
- [ ] 복제 완료 시 새 견적의 편집 모드로 자동 이동
- [ ] 원본 참조 표시 ("QXXX에서 복제됨" 뱃지)

**관련 파일:**
- `app/(dashboard)/quotation-history/page.tsx` (수정)
- `components/quotation/clone-dialog.tsx` (신규)

### Step 3: 복제 견적 편집 모드

- [ ] 복제된 견적을 견적 생성 페이지에서 편집
- [ ] 부품 교체: 기존 부품을 다른 부품으로 교체
- [ ] 수량 변경: 서버 대수, 부품 수량 조정
- [ ] 마진 조정: 마진 시뮬레이션 연동
- [ ] 변경 사항 하이라이트 표시 (원본 대비 변경된 항목)

**관련 파일:**
- `app/(dashboard)/quotation/page.tsx` (수정 — 편집 모드 지원)
- `components/quotation/change-highlight.tsx` (신규)

### Step 4: 검증 및 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 복제 후 원본 견적은 변경되지 않음 확인
- [ ] 복제 견적의 모든 항목이 정확히 복사됨 확인

---

## 관련 파일

- `app/api/quotations/[id]/clone/route.ts` — 견적 복제 API (신규)
- `app/(dashboard)/quotation-history/page.tsx` — 견적 이력 페이지 (수정)
- `app/(dashboard)/quotation/page.tsx` — 견적 생성/편집 페이지 (수정)
- `components/quotation/clone-dialog.tsx` — 복제 확인 다이얼로그 (신규)
- `components/quotation/change-highlight.tsx` — 변경 하이라이트 (신규)

## 테스트 체크리스트

- [ ] 복제 시 새 견적번호가 자동 생성됨
- [ ] 복제된 견적의 상태가 draft로 설정됨
- [ ] 원본 견적의 모든 항목(부품, 수량, 가격)이 복사됨
- [ ] 복제 후 원본 견적은 변경되지 않음
- [ ] 복제된 견적에서 부품 교체/수량 변경이 가능함
- [ ] 멤버 역할은 본인 견적만 복제 가능
