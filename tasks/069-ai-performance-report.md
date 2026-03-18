# Task 069: AI 성과 분석 리포트

## 개요

AI가 월간/분기별 영업 성과를 종합 분석하여 리포트를 자동 생성합니다. 낙찰률 추이, 마진 분석, 카테고리별 성과, 개선 제안, 다음 분기 예측을 포함하는 데이터 기반 영업 전략 수립 도구입니다.

## 관련 기능

- **F045**: AI 성과 분석 리포트
- **F009**: 낙찰 이력 대시보드 — 성과 데이터 소스
- **F022**: 견적 vs 실판매 비교 — 정확도 데이터 소스

## 현재 상태

- 낙찰 이력 대시보드(F009) 구현됨
- 실판매 분석 대시보드(Task 035) 구현됨
- AI 기반 자동 분석 및 리포트 생성 기능 없음

## 수락 기준

- [ ] 월간/분기별 성과 데이터 자동 집계
- [ ] AI 기반 성과 분석 및 인사이트 생성
- [ ] 개선 제안 및 다음 분기 예측 제공
- [ ] PDF 리포트 자동 생성
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 성과 데이터 집계 로직

- [ ] 기간별 성과 지표 집계:
  - 총 견적 건수/금액, 낙찰 건수/금액, 낙찰률
  - 평균 마진율, 최대/최소 마진 건
  - 카테고리별/벤더별/거래처별 분석
  - 견적 정확도 (실판매 대비)
  - 영업 담당자별 성과
- [ ] `GET /api/performance/aggregate` — 집계 데이터 API

**관련 파일:**
- `lib/analytics/performance-aggregator.ts` (신규)
- `app/api/performance/aggregate/route.ts` (신규)

### Step 2: AI 성과 분석 엔진

- [ ] OpenAI GPT-4o 기반 성과 분석 프롬프트 설계
- [ ] 입력: 집계 데이터, 전기 대비 변화, 트렌드
- [ ] 출력: 핵심 인사이트, 개선 제안, 다음 분기 예측
- [ ] `POST /api/performance/analyze` — AI 분석 API

**관련 파일:**
- `lib/ai/performance-analyzer.ts` (신규)
- `app/api/performance/analyze/route.ts` (신규)

### Step 3: 성과 리포트 페이지 UI

- [ ] `/performance-report` 라우트 페이지 생성
- [ ] 기간 선택 (월간/분기별)
- [ ] 성과 차트 대시보드 (Recharts):
  - 낙찰률 추이 차트
  - 마진 분포 차트
  - 카테고리별 매출 차트
  - 영업 담당자별 성과 비교
- [ ] AI 인사이트 섹션 (텍스트)
- [ ] 개선 제안 카드
- [ ] 사이드바 메뉴에 "성과 리포트" 추가

**관련 파일:**
- `app/(dashboard)/performance-report/page.tsx` (신규)
- `components/performance/performance-charts.tsx` (신규)
- `components/performance/ai-insights.tsx` (신규)
- `components/performance/improvement-suggestions.tsx` (신규)

### Step 4: PDF 리포트 생성

- [ ] jsPDF 기반 성과 리포트 PDF 생성
- [ ] 차트 이미지 포함 (html2canvas 활용)
- [ ] AI 인사이트 텍스트 포함
- [ ] "PDF 다운로드" 버튼

**관련 파일:**
- `lib/pdf/performance-report-generator.ts` (신규)

### Step 5: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 성과 데이터 집계 정확도 검증
- [ ] AI 분석 품질 검증
- [ ] PDF 레이아웃 확인

---

## 관련 파일

- `app/(dashboard)/performance-report/page.tsx` — 성과 리포트 페이지 (신규)
- `components/performance/performance-charts.tsx` — 성과 차트 (신규)
- `components/performance/ai-insights.tsx` — AI 인사이트 (신규)
- `components/performance/improvement-suggestions.tsx` — 개선 제안 (신규)
- `lib/analytics/performance-aggregator.ts` — 데이터 집계 (신규)
- `lib/ai/performance-analyzer.ts` — AI 분석 엔진 (신규)
- `lib/pdf/performance-report-generator.ts` — PDF 생성 (신규)
- `app/api/performance/aggregate/route.ts` — 집계 API (신규)
- `app/api/performance/analyze/route.ts` — 분석 API (신규)

## 테스트 체크리스트

- [ ] 월간 성과 데이터가 정확히 집계됨
- [ ] 분기별 데이터가 월간 데이터의 합계와 일치함
- [ ] AI 인사이트가 데이터에 기반한 합리적 분석을 제공함
- [ ] PDF 리포트에 차트와 인사이트가 포함됨
- [ ] 멤버 역할은 본인 관련 성과만 조회 가능
- [ ] 데이터 부족 시 적절한 안내 메시지 표시
