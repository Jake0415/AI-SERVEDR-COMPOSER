# Task 062: 견적 비교 리포트 PDF

## 개요

복수 견적안을 나란히 비교하는 전문 리포트 PDF를 생성합니다. 부품별 가격 비교, 성능 비교, TCO(Total Cost of Ownership) 분석, 추천안 하이라이트를 포함하여 고객의 의사결정을 지원합니다.

## 관련 기능

- **F038**: 견적 비교 리포트 PDF
- **F007**: 견적서 발행 및 출력 — PDF 생성 인프라 재사용
- **F005**: 3가지 견적안 자동 생성 — 견적안 간 비교

## 현재 상태

- jsPDF 기반 PDF 생성 구현됨 (F007)
- 단일 견적서 PDF 출력 가능
- 복수 견적 비교 리포트 기능 없음

## 수락 기준

- [ ] 2~4개 견적을 선택하여 비교 리포트 생성
- [ ] 부품별 가격 비교 테이블 포함
- [ ] TCO 분석 (초기 비용 + 유지보수 + 전력비용)
- [ ] 추천안 하이라이트 표시
- [ ] PDF 다운로드 가능
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 비교 대상 선택 UI

- [ ] 견적 이력 페이지에 체크박스 추가 (복수 선택)
- [ ] "비교 리포트 생성" 버튼 (2~4개 선택 시 활성화)
- [ ] 비교 미리보기 모달

**관련 파일:**
- `app/(dashboard)/quotation-history/page.tsx` (수정)
- `components/quotation/comparison-selector.tsx` (신규)

### Step 2: 비교 데이터 구조화

- [ ] 선택된 견적들의 항목 정렬 및 매핑
- [ ] 부품별/카테고리별 가격 비교 데이터 생성
- [ ] TCO 계산 로직 (초기비용, 예상 유지보수비, 전력비용)
- [ ] `POST /api/quotations/compare` — 비교 데이터 API

**관련 파일:**
- `lib/quotation/comparison-analyzer.ts` (신규)
- `app/api/quotations/compare/route.ts` (신규)

### Step 3: 비교 리포트 PDF 생성

- [ ] jsPDF 기반 비교 리포트 레이아웃 설계
- [ ] 표지 (비교 견적 요약)
- [ ] 가격 비교 테이블 (견적별 부품 가격 나란히)
- [ ] TCO 분석 차트
- [ ] 추천안 하이라이트 섹션
- [ ] 결론/요약 페이지

**관련 파일:**
- `lib/pdf/comparison-report-generator.ts` (신규)

### Step 4: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 2개, 3개, 4개 견적 비교 리포트 정상 생성 확인
- [ ] PDF 레이아웃 깨짐 없이 출력 확인

---

## 관련 파일

- `components/quotation/comparison-selector.tsx` — 비교 선택 (신규)
- `lib/quotation/comparison-analyzer.ts` — 비교 분석 (신규)
- `lib/pdf/comparison-report-generator.ts` — PDF 생성 (신규)
- `app/api/quotations/compare/route.ts` — 비교 API (신규)

## 테스트 체크리스트

- [ ] 2개 견적 비교 리포트가 정상 생성됨
- [ ] 4개 견적 비교 시 PDF 레이아웃이 정상임
- [ ] TCO 분석 수치가 정확히 계산됨
- [ ] 추천안이 하이라이트되어 표시됨
- [ ] 멤버 역할은 본인 견적만 비교 가능
