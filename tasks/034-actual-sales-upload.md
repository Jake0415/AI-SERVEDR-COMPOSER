# Task 034: 실판매 Excel 업로드

## 개요

실판매 데이터를 Excel 파일 업로드로 자동 파싱하고, 견적 항목과 자동 매핑하는 기능을 구현합니다. 사용자가 최종 계약서/납품서 Excel 파일을 업로드하면 항목을 파싱하여 견적 항목과 모델명/품명 기준으로 자동 매핑하고, 매핑 결과를 검토/수정할 수 있는 UI를 제공합니다.

## 관련 기능

- **F021**: 실판매 기록 — 최종 견적서 Excel 업로드 지원
- **F001**: 부품 DB 등록/관리 — 엑셀 업로드 패턴 참고

## 현재 상태

- Excel 파일 처리: `ExcelJS` 라이브러리 사용 중 (견적서 출력용)
- 부품 엑셀 업로드 기능 존재 (Task 015-1) — 업로드/파싱 패턴 참고 가능
- 실판매 Excel 업로드 기능 없음

## 수락 기준

- [ ] Excel 파일(.xlsx, .xls)을 업로드하면 항목이 자동 파싱됨
- [ ] 파싱된 항목이 견적 항목과 모델명/품명 기준으로 자동 매핑됨
- [ ] 매핑 확인 UI에서 매핑 결과를 검토하고 수정할 수 있음
- [ ] 매핑되지 않은 항목은 `added` 유형으로 표시됨
- [ ] 견적에는 있지만 Excel에 없는 항목은 `removed` 유형으로 표시됨
- [ ] 매핑 확인 후 실판매 기록으로 저장할 수 있음
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: Excel 파싱 API

- [ ] `app/api/actual-sales/parse-excel/route.ts` (신규)
- [ ] `POST /api/actual-sales/parse-excel`
  - 요청: multipart/form-data (Excel 파일 + quotation_id)
  - Excel 파싱 로직:
    - 헤더 행 자동 감지 (품명, 규격, 수량, 단가, 금액 컬럼)
    - 유연한 컬럼 매핑: 다양한 헤더명 인식 (예: "품명"="제품명"="모델명", "단가"="단위가격")
    - 빈 행 스킵, 합계 행 제외
  - 응답: 파싱된 항목 목록
    ```typescript
    {
      parsed_items: {
        row_number: number;
        item_name: string;
        item_spec?: string;
        quantity: number;
        unit_price: number;
        amount: number;
        raw_data: Record<string, string>;  // 원본 행 데이터
      }[];
      total_rows: number;
      parsed_rows: number;
      skipped_rows: number;
    }
    ```

**관련 파일:**
- `app/api/actual-sales/parse-excel/route.ts` (신규)
- `lib/utils/excel-parser.ts` (신규 또는 기존 파서 확장)

### Step 2: 자동 매핑 로직

- [ ] `lib/utils/item-matcher.ts` (신규)
- [ ] 매핑 알고리즘:
  1. 정확 매칭: 품명이 완전 일치하는 견적 항목 찾기
  2. 부분 매칭: 품명에 모델명이 포함된 견적 항목 찾기
  3. 유사도 매칭: 레벤슈타인 거리 기반 유사 항목 제안 (임계값 0.7)
- [ ] 매핑 결과 구조:
  ```typescript
  {
    mapped_items: {
      parsed_item: ParsedItem;
      quotation_item: QuotationItem | null;  // 매핑된 견적 항목
      match_type: 'exact' | 'partial' | 'similar' | 'none';
      confidence: number;  // 매칭 신뢰도 (0~1)
      change_type: 'unchanged' | 'modified' | 'added';
    }[];
    unmapped_quotation_items: QuotationItem[];  // 매핑 안 된 견적 항목 (removed 후보)
  }
  ```

**관련 파일:**
- `lib/utils/item-matcher.ts` (신규)

### Step 3: 매핑 확인 API

- [ ] `app/api/actual-sales/auto-map/route.ts` (신규)
- [ ] `POST /api/actual-sales/auto-map`
  - 요청: 파싱된 항목 목록 + quotation_id
  - 견적 항목 조회 후 자동 매핑 실행
  - 응답: 매핑 결과 (Step 2의 구조)

**관련 파일:**
- `app/api/actual-sales/auto-map/route.ts` (신규)

### Step 4: 매핑 확인 UI

- [ ] `components/actual-sales/excel-upload-dialog.tsx` (신규)
  - 파일 업로드 영역 (드래그앤드롭, .xlsx/.xls 지원)
  - 업로드 진행 상태 표시
- [ ] `components/actual-sales/mapping-review.tsx` (신규)
  - 3단계 플로우: ① Excel 업로드 → ② 매핑 검토 → ③ 저장 확인
  - 매핑 검토 테이블:
    - 컬럼: Excel 항목명, 매핑된 견적 항목, 매칭 유형 배지, 신뢰도, 수량, 단가, 금액
    - 매핑 수동 변경: 드롭다운으로 다른 견적 항목 선택 또는 "새 항목"으로 지정
    - 매핑 해제: 항목을 `added`로 변경
  - 매핑되지 않은 견적 항목 목록 (removed 후보):
    - 체크박스로 `removed` 확인 또는 Excel 항목과 수동 매핑
  - 전체 요약: 매핑 성공 N건, 수동 확인 필요 N건, 새 항목 N건, 제거 항목 N건
  - "실판매 기록으로 저장" 버튼

**관련 파일:**
- `components/actual-sales/excel-upload-dialog.tsx` (신규)
- `components/actual-sales/mapping-review.tsx` (신규)

### Step 5: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] Excel 업로드 → 파싱 → 매핑 → 저장 플로우 확인
- [ ] 다양한 Excel 양식에 대한 파싱 정확도 확인

---

## 실행 순서

```
Step 1 (Excel 파싱 API)
    ↓
Step 2 (자동 매핑 로직)
    ↓
Step 3 (매핑 확인 API)
    ↓
Step 4 (매핑 확인 UI)
    ↓
Step 5 (검증)
```

## 기존 코드 재사용

- `app/api/parts/upload/` — 부품 엑셀 업로드 API 패턴 참고
- `ExcelJS` — Excel 파싱 라이브러리 (이미 의존성에 포함)
- `components/ui/` — shadcn/ui 컴포넌트 (Dialog, Table, Badge, Button, Progress)
- `components/file-upload/` — 파일 업로드 컴포넌트 참고

## 테스트 체크리스트

- [ ] .xlsx 파일 업로드 → 파싱 성공
- [ ] .xls 파일 업로드 → 파싱 성공
- [ ] .csv, .pdf 등 미지원 파일 → 에러 메시지
- [ ] 빈 Excel 파일 → 에러 메시지
- [ ] 헤더만 있는 Excel → 빈 항목 목록 반환
- [ ] 다양한 헤더명("품명", "제품명", "모델명") 인식 확인
- [ ] 정확 매칭: 동일 품명 → confidence 1.0
- [ ] 부분 매칭: 모델명 포함 → confidence 0.8~0.9
- [ ] 유사도 매칭: 비슷한 품명 → confidence 0.7~0.8
- [ ] 매핑 안 된 항목 → match_type 'none'
- [ ] 매핑 수동 변경 → 변경된 매핑으로 저장
- [ ] 매핑 확인 후 저장 → actual_sales 레코드 생성 확인
