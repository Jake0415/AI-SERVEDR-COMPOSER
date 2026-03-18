# Task 060: 크로스셀/업셀 AI 추천

## 개요

견적 확정 시점에 AI가 추가 판매 가능한 부품이나 서비스를 추천합니다. 메모리 증설, SSD 추가, 유지보수 계약, 백업 솔루션 등 현재 견적 내용을 분석하여 관련 상품을 추천하고, 추천 수락률을 추적하여 추천 품질을 지속적으로 개선합니다.

## 관련 기능

- **F036**: 크로스셀/업셀 AI 추천
- **F005**: 3가지 견적안 자동 생성 — 견적 내용 분석
- **F006**: 마진 시뮬레이션 — 추천 항목 추가 시 마진 재계산

## 현재 상태

- 견적 생성 및 확정 플로우 구현됨
- 추가 판매 추천 기능 없음
- 견적 확정 후 추가 항목 추가 메커니즘 없음

## 수락 기준

- [ ] 견적 확정 시점에 AI 추천 패널 표시
- [ ] 현재 견적 내용 기반 관련 상품 추천
- [ ] 추천 항목을 견적에 추가 가능
- [ ] 추천 수락/거절 추적 및 수락률 분석
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 크로스셀/업셀 추천 엔진

- [ ] 견적 내용 분석 → 추천 항목 생성 로직:
  - 메모리 증설 추천 (현재 용량 대비 업그레이드)
  - SSD/HDD 추가 추천 (빈 베이 활용)
  - 유지보수 계약 추천 (서버 수 기반)
  - 백업 솔루션 추천
  - 네트워크 장비 추천 (서버 수 기반)
- [ ] OpenAI 기반 맞춤 추천 프롬프트 설계
- [ ] `POST /api/recommendations/cross-upsell` — 추천 API

**관련 파일:**
- `lib/ai/cross-upsell-engine.ts` (신규)
- `app/api/recommendations/cross-upsell/route.ts` (신규)

### Step 2: 추천 패널 UI

- [ ] 견적 확정 직전 추천 패널 표시
- [ ] 추천 항목 카드 (상품명, 추천 사유, 예상 금액)
- [ ] "추가" / "건너뛰기" 버튼
- [ ] 추가 시 견적 항목에 반영 및 총액 업데이트
- [ ] 추천 패널 닫기/최소화 기능

**관련 파일:**
- `components/recommendations/cross-upsell-panel.tsx` (신규)
- `components/recommendations/recommendation-card.tsx` (신규)

### Step 3: 추천 수락률 추적

- [ ] `recommendation_logs` 테이블 설계 (추천 내용, 수락/거절, 금액)
- [ ] 추천 수락률 통계 API
- [ ] 관리자 대시보드에 추천 수락률 위젯

**관련 파일:**
- `supabase/migrations/` (신규 마이그레이션)
- `app/api/recommendations/stats/route.ts` (신규)

### Step 4: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 다양한 견적 구성에 대한 추천 품질 검증
- [ ] 추천 추가 시 견적 총액 정상 업데이트 확인

---

## 관련 파일

- `lib/ai/cross-upsell-engine.ts` — 추천 엔진 (신규)
- `components/recommendations/cross-upsell-panel.tsx` — 추천 패널 (신규)
- `components/recommendations/recommendation-card.tsx` — 추천 카드 (신규)
- `app/api/recommendations/cross-upsell/route.ts` — 추천 API (신규)
- `app/api/recommendations/stats/route.ts` — 추천 통계 API (신규)

## 테스트 체크리스트

- [ ] 메모리 16GB 서버 견적 시 32GB 업그레이드 추천이 표시됨
- [ ] 빈 스토리지 베이가 있을 때 SSD 추가 추천이 표시됨
- [ ] 추천 항목 "추가" 시 견적 항목에 반영됨
- [ ] 추천 수락/거절이 로그에 저장됨
- [ ] 추천 수락률 통계가 정확히 계산됨
