# Task 011: 견적 이력 및 낙찰 이력 페이지 UI 구현

## 상태
- [x] ✅ 완료

## 개요
견적 이력 페이지와 낙찰 이력 페이지의 UI를 구현합니다. 견적 이력에는 목록 테이블, 상세 보기, 출력 옵션,
낙찰/실패 결과 입력 모달이 포함되고, 낙찰 이력에는 차트(원형, 라인, 바)와 통계 카드가 포함됩니다.

## 관련 PRD 기능
- [F007] 견적 이력
- [F008] 견적서 출력
- [F009] 낙찰 이력

## 관련 파일
- `app/(auth)/quotation-history/page.tsx` — 견적 이력 페이지
- `components/quotation-history/quotation-list.tsx` — 견적 목록 테이블
- `components/quotation-history/quotation-detail.tsx` — 견적 상세 보기
- `components/quotation-history/export-options.tsx` — 견적서 출력 옵션
- `components/quotation-history/bid-result-modal.tsx` — 낙찰/실패 결과 입력
- `app/(auth)/bid-history/page.tsx` — 낙찰 이력 페이지
- `components/bid-history/win-rate-chart.tsx` — 낙찰률 원형 차트
- `components/bid-history/trend-chart.tsx` — 월별 낙찰률 추이 차트
- `components/bid-history/failure-reasons-chart.tsx` — 실패 사유 분포 차트

## 수락 기준
- [ ] 견적 목록 테이블이 더미 데이터로 표시됨
- [ ] 견적 상세 보기 영역이 동작함
- [ ] 견적서 출력 옵션 UI가 동작함 (나라장터/자사 양식, PDF/Excel)
- [ ] 낙찰/실패 결과 입력 모달이 동작함
- [ ] 낙찰 이력 차트(원형, 라인, 바)가 더미 데이터로 렌더링됨
- [ ] 기간 필터(1/3/6/12개월)가 동작함

## 구현 단계
- [ ] 견적 이력 페이지 레이아웃 구현
- [ ] 견적 목록 테이블 구현 (날짜, RFP명, 견적안 유형, 총액, 상태)
- [ ] 견적 상세 보기 영역 구현 (부품 구성, 가격 상세)
- [ ] 견적서 출력 옵션 UI 구현 (나라장터 양식 / 자사 양식, PDF/Excel 선택)
- [ ] 낙찰/실패 결과 입력 모달 구현 (결과 선택, 사유 입력)
- [ ] 낙찰 이력 페이지 레이아웃 구현
- [ ] 전체 낙찰률 원형 차트 구현
- [ ] 월별 낙찰률 추이 라인 차트 구현
- [ ] 평균 마진율 통계 카드 구현
- [ ] 실패 사유 분포 바 차트 구현
- [ ] 기간 필터 구현 (최근 1/3/6/12개월)

## 테스트 체크리스트
- [ ] 견적 목록 테이블 더미 데이터 표시
- [ ] 견적 상세 보기 동작 확인
- [ ] 출력 옵션 선택 UI 동작
- [ ] 낙찰/실패 모달 입력 동작
- [ ] 3가지 차트 더미 데이터 렌더링
- [ ] 기간 필터 전환 동작

## 참고사항
Task 005의 차트 컴포넌트와 데이터 테이블 컴포넌트를 재사용합니다.
실제 데이터 연동은 Task 019(견적서 출력), Task 020(낙찰 이력)에서 구현합니다.
