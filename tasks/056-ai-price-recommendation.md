# Task 056: AI 가격 추천

## 개요

과거 낙찰/실주 이력 데이터를 학습하여 최적의 견적 가격을 AI가 추천합니다. 경쟁사 예상 가격대를 분석하고, 낙찰 확률을 예측하며, 마진과 낙찰률 간의 트레이드오프를 시각화하여 영업 담당자의 가격 결정을 지원합니다.

## 관련 기능

- **F032**: AI 가격 추천 (낙찰 이력 학습)
- **F008**: 낙찰 결과 기록 — 학습 데이터 소스
- **F009**: 낙찰 이력 대시보드 — 분석 데이터 공유
- **F006**: 마진 시뮬레이션 — AI 추천 가격과 연동

## 현재 상태

- 낙찰 결과(bid_results) 데이터 축적 중
- 견적(quotations) 및 항목(quotation_items) 이력 존재
- AI 기반 가격 분석 기능 없음

## 수락 기준

- [ ] 과거 낙찰/실주 데이터 기반 최적 가격 추천
- [ ] 낙찰 확률 예측 표시
- [ ] 마진-낙찰률 트레이드오프 차트 제공
- [ ] 견적 생성 페이지에 AI 추천 패널 표시
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 가격 분석 데이터 파이프라인

- [ ] 낙찰/실주 이력에서 분석용 데이터 추출 로직
- [ ] 카테고리별, 부품별, 거래처 유형별 가격 통계 계산
- [ ] 경쟁사 낙찰가 데이터 활용 (bid_results.competitor_price)
- [ ] `GET /api/price-analysis/data` — 분석 데이터 조회 API

**관련 파일:**
- `lib/ai/price-analysis-pipeline.ts` (신규)
- `app/api/price-analysis/data/route.ts` (신규)

### Step 2: AI 가격 추천 엔진

- [ ] OpenAI GPT-4o 기반 가격 추천 프롬프트 설계
- [ ] 입력: 현재 견적 구성, 과거 유사 견적 이력, 낙찰/실주 통계
- [ ] 출력: 추천 가격, 낙찰 확률, 가격 조정 근거
- [ ] `POST /api/price-analysis/recommend` — 가격 추천 API

**관련 파일:**
- `lib/ai/price-recommender.ts` (신규)
- `app/api/price-analysis/recommend/route.ts` (신규)

### Step 3: 마진-낙찰률 트레이드오프 시각화

- [ ] 마진율별 예상 낙찰 확률 곡선 차트 (Recharts)
- [ ] 현재 견적 위치 마커 표시
- [ ] AI 추천 가격 위치 마커 표시
- [ ] 인터랙티브 슬라이더로 마진 변경 시 확률 업데이트

**관련 파일:**
- `components/price-analysis/tradeoff-chart.tsx` (신규)

### Step 4: 견적 생성 페이지 연동

- [ ] 견적 생성 페이지에 "AI 가격 추천" 패널 추가
- [ ] 추천 가격 "적용" 버튼으로 마진 시뮬레이션 반영
- [ ] 추천 근거 텍스트 표시

**관련 파일:**
- `components/price-analysis/recommendation-panel.tsx` (신규)
- `app/(dashboard)/quotation/page.tsx` (수정)

### Step 5: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 충분한 이력 데이터 시 추천 정확도 검증
- [ ] 이력 데이터 부족 시 적절한 안내 메시지 표시

---

## 관련 파일

- `lib/ai/price-analysis-pipeline.ts` — 데이터 파이프라인 (신규)
- `lib/ai/price-recommender.ts` — 가격 추천 엔진 (신규)
- `components/price-analysis/tradeoff-chart.tsx` — 트레이드오프 차트 (신규)
- `components/price-analysis/recommendation-panel.tsx` — 추천 패널 (신규)
- `app/api/price-analysis/data/route.ts` — 분석 데이터 API (신규)
- `app/api/price-analysis/recommend/route.ts` — 추천 API (신규)

## 테스트 체크리스트

- [ ] 낙찰 이력 10건 이상 시 가격 추천이 정상 생성됨
- [ ] 이력 데이터 부족 시 "데이터 부족" 안내 표시
- [ ] 추천 가격 적용 시 마진 시뮬레이션에 반영됨
- [ ] 트레이드오프 차트가 마진 변경에 따라 업데이트됨
- [ ] 경쟁사 가격 데이터가 있을 때 분석 정확도 향상
