# Task 015-2: 가격 변동 이력 관리 및 시각화 구현

## 상태
- [ ] 미완료

## 개요
부품 가격 변경 시 변경 전후를 자동 기록하고, 가격 변동 추이를 차트로 시각화하는 기능을 구현한다. F002 확장.

## 관련 PRD 기능
- [F002] 부품 가격 관리 (가격 변동 이력, 가격 변동 시각화)

## 의존성
- Task 013 (DB 구축) 완료 필요
- Task 015 (부품 API) 완료 필요

## 관련 파일
- `app/api/parts/[id]/price-history/route.ts` — 가격 이력 조회 API
- `app/api/parts/price-trend/route.ts` — 카테고리별 가격 추이 API
- `lib/services/price-history.ts` — 가격 이력 서비스
- `components/parts/price-history-chart.tsx` — 가격 추이 차트 컴포넌트
- `components/parts/price-comparison-table.tsx` — 가격 비교 테이블

## 수락 기준
- [ ] 가격 수동 수정 시 part_price_history에 자동 기록된다
- [ ] 부품별 가격 추이 차트(4가지 가격)가 정상 렌더링된다
- [ ] 기간 필터(1/3/6/12개월) 전환 시 차트가 올바르게 업데이트된다
- [ ] 카테고리별 평균 가격 추이 집계가 정확하다
- [ ] 두 날짜 간 가격 변동 비교 테이블이 표시된다

## 구현 단계
- [ ] 가격 수정 시 part_price_history 자동 INSERT 로직 구현
  - 수동 수정(change_type: 'manual'), 엑셀 업로드('excel_upload') 구분
  - 변경 전/후 값, 변경자, 변경 사유 기록
- [ ] 가격 변동 이력 조회 API 구현
  - `GET /api/parts/[id]/price-history` (기간 필터, 페이지네이션)
- [ ] 카테고리별 가격 추이 집계 API 구현
  - `GET /api/parts/price-trend?category_id=...&period=...`
- [ ] 가격 추이 라인 차트 컴포넌트 구현 (Recharts)
  - 4가지 가격(리스트가/시장가/원가/공급가) 시계열
  - 기간 필터 (1/3/6/12개월)
- [ ] 가격 비교 기능 구현
  - 두 날짜 간 가격 변동 테이블 (변동률 표시)
  - 변동률 상위 N개 부품 하이라이트
- [ ] 부품 관리 페이지 UI와 연동
  - 부품 상세 모달 내 가격 추이 차트 표시
  - "가격 이력" 탭/패널 추가

## 테스트 체크리스트
- [ ] 가격 수정 → 이력 테이블에 변경 전/후 기록 확인
- [ ] 이력 조회 API → 기간 필터 정확성 확인
- [ ] 차트 렌더링 → 데이터 포인트 정확성 확인
- [ ] 카테고리 집계 → 평균 계산 정확성 확인
- [ ] 원가(암호화 필드) 이력 → 복호화 후 차트 표시 확인
