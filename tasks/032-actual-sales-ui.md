# Task 032: 실판매 기록 입력 UI

## 개요

낙찰(won) 상태의 견적에 대해 실제 계약 금액과 납품 내역을 입력하는 UI와, 견적 금액 대비 실제 판매 금액의 차이를 시각적으로 비교하는 UI를 구현합니다. 견적 이력 페이지에서 won 상태 견적의 "실판매 기록" 버튼을 통해 진입합니다.

## 관련 기능

- **F021**: 실판매 기록 — 낙찰(won) 견적에 대해 실제 계약 금액, 납품 내역을 기록
- **F022**: 견적 vs 실판매 비교 — 원래 견적 금액 대비 실제 판매 금액 차이를 항목별로 비교
- **F007**: 견적서 발행 및 출력 — 견적 이력 페이지에서 진입
- **F008**: 낙찰 결과 기록 — won 상태 견적 식별

## 현재 상태

- 견적 이력 페이지(`/quotation-history`) 존재
- 견적 상세 보기 UI 존재
- won 상태 견적에 대한 추가 액션 없음
- 실판매 기록 관련 UI 없음

## 수락 기준

- [ ] 견적 이력 페이지에서 won 상태 견적에 "실판매 기록" 버튼이 표시됨
- [ ] 실판매 기록 입력 화면에서 견적 항목 기반으로 수량/단가를 수정할 수 있음
- [ ] 계약번호, 계약일자, 납품일자를 입력할 수 있음
- [ ] 새 항목(added) 추가 및 기존 항목 제거(removed) 표시가 가능함
- [ ] 견적 vs 실판매 비교 UI에서 총액 비교 카드 4개가 표시됨
- [ ] 항목별 차이 테이블에서 변경유형 배지(unchanged/modified/added/removed)가 표시됨
- [ ] 비교 화면에서 금액 차이(절대값, 비율)가 정확히 계산됨
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 견적 이력 페이지에 실판매 기록 버튼 추가

- [ ] 견적 목록 테이블에서 `status === 'won'`인 견적에 "실판매 기록" 버튼 표시
- [ ] 이미 실판매 기록이 있는 경우 "실판매 보기" 버튼으로 변경
- [ ] 버튼 클릭 시 실판매 기록 입력/보기 화면으로 이동

**관련 파일:**
- `app/(dashboard)/quotation-history/page.tsx` (수정)

### Step 2: 실판매 기록 입력 UI

- [ ] `app/(dashboard)/quotation-history/[id]/actual-sales/page.tsx` (신규)
- [ ] 상단 영역: 견적 기본 정보 요약 (견적번호, 거래처, 견적 총액)
- [ ] 계약 정보 입력 폼:
  - 계약번호 (Text)
  - 계약일자 (DatePicker)
  - 납품일자 (DatePicker, 선택)
  - 비고 (Textarea, 선택)
- [ ] 항목별 실판매 입력 테이블:
  - 견적 항목을 기본으로 로드 (품명, 규격, 견적 수량, 견적 단가)
  - 실제 수량 입력 (편집 가능)
  - 실제 단가 입력 (편집 가능)
  - 실제 금액 자동 계산 (수량 x 단가)
  - 변경유형 자동 판단: 수량/단가 변경 시 `modified`, 미변경 시 `unchanged`
  - 변경사유 입력 (modified 시 활성화)
- [ ] 새 항목 추가 행 (`added` 유형)
- [ ] 기존 항목 제거 토글 (`removed` 유형, 취소선 표시)
- [ ] 하단 합계: 실제 총 원가, 실제 총 공급가, 부가가치세, 실제 총액
- [ ] 저장 버튼

**관련 파일:**
- `app/(dashboard)/quotation-history/[id]/actual-sales/page.tsx` (신규)
- `components/actual-sales/actual-sales-form.tsx` (신규)
- `components/actual-sales/actual-sale-item-row.tsx` (신규)

### Step 3: 견적 vs 실판매 비교 UI

- [ ] `components/actual-sales/comparison-view.tsx` (신규)
- [ ] 총액 비교 카드 4개:
  - 견적 총액 vs 실제 총액 (차이 금액, 변동률 %)
  - 견적 원가 vs 실제 원가 (차이 금액, 변동률 %)
  - 견적 공급가 vs 실제 공급가 (차이 금액, 변동률 %)
  - 예상 마진 vs 실제 마진 (차이 금액, 변동률 %)
- [ ] 카드 색상: 증가(빨강/위 화살표), 감소(파랑/아래 화살표), 동일(회색)
- [ ] 항목별 차이 테이블:
  - 컬럼: 품명, 규격, 견적수량, 실제수량, 견적단가, 실제단가, 견적금액, 실제금액, 차이, 변경유형
  - 변경유형 배지: `unchanged`(회색), `modified`(노랑), `added`(초록), `removed`(빨강)
  - 변경사유 hover tooltip 표시
- [ ] 견적 정확도 표시: `실제총액 / 견적총액 × 100%`

**관련 파일:**
- `components/actual-sales/comparison-view.tsx` (신규)
- `components/actual-sales/comparison-cards.tsx` (신규)
- `components/actual-sales/comparison-table.tsx` (신규)

### Step 4: 상태 관리 및 데이터 연동

- [ ] 실판매 기록 CRUD를 위한 API 호출 훅: `hooks/use-actual-sales.ts` (신규)
- [ ] 실판매 기록 저장 시 API 호출 (`POST /api/actual-sales`)
- [ ] 기존 실판매 기록 조회 시 API 호출 (`GET /api/actual-sales/[quotationId]`)
- [ ] 수정 시 API 호출 (`PUT /api/actual-sales/[id]`)
- [ ] 비교 데이터 계산 유틸리티: `lib/utils/actual-sales-comparison.ts` (신규)

**관련 파일:**
- `hooks/use-actual-sales.ts` (신규)
- `lib/utils/actual-sales-comparison.ts` (신규)

### Step 5: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 실판매 기록 입력 → 저장 → 비교 화면 표시 플로우 확인
- [ ] 항목 변경유형 자동 판단 로직 확인
- [ ] 금액 계산 정확성 확인

---

## 실행 순서

```
Step 1 (버튼 추가)
    ↓
Step 2 (입력 UI)
    ↓
Step 3 (비교 UI)
    ↓
Step 4 (데이터 연동)
    ↓
Step 5 (검증)
```

## 기존 코드 재사용

- `app/(dashboard)/quotation-history/` — 견적 이력 페이지 패턴 참고
- `components/ui/` — shadcn/ui 컴포넌트 (Table, Card, Badge, Button, Input, DatePicker, Dialog)
- `lib/utils.ts` — cn() 유틸리티
- `hooks/` — 기존 커스텀 훅 패턴 참고

## 테스트 체크리스트

- [ ] won 상태 견적에만 "실판매 기록" 버튼 표시
- [ ] 다른 상태(draft, lost 등) 견적에는 버튼 미표시
- [ ] 실판매 입력 시 견적 항목이 기본값으로 로드됨
- [ ] 수량/단가 변경 시 change_type이 `modified`로 자동 전환
- [ ] 미변경 항목은 `unchanged`로 유지
- [ ] 새 항목 추가 시 `added` 유형으로 표시
- [ ] 항목 제거 시 `removed` 유형으로 표시 (취소선)
- [ ] 총액 비교 카드의 차이 금액/변동률 계산 정확성
- [ ] 항목별 차이 테이블의 배지 색상 정확성
- [ ] 견적 정확도(%) 계산 정확성
