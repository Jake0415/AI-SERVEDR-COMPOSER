# Task 020: 대시보드 및 낙찰 이력 대시보드 구현 (F009, F012)

## 상태
- [x] ✅ 완료

## 개요
대시보드와 낙찰 이력 페이지에 실제 데이터를 연동합니다. 대시보드 요약 API, 낙찰 이력 통계 API를 구현하고,
Recharts 차트에 실제 데이터를 연결하며, 기간 필터와 역할별 데이터 필터링을 적용합니다.

## 관련 PRD 기능
- [F009] 낙찰 이력
- [F012] 대시보드

## 관련 파일
- `app/api/dashboard/summary/route.ts` — 대시보드 요약 API
- `app/api/dashboard/recent-quotations/route.ts` — 최근 견적 API
- `app/api/bid-history/stats/route.ts` — 낙찰 통계 API
- `app/api/bid-history/trend/route.ts` — 월별 추이 API
- `app/api/bid-history/failure-reasons/route.ts` — 실패 사유 API
- `app/(auth)/dashboard/page.tsx` — 대시보드 페이지
- `app/(auth)/bid-history/page.tsx` — 낙찰 이력 페이지

## 수락 기준
- [ ] 대시보드 통계 카드가 실제 데이터를 표시함
- [ ] 최근 견적 5건이 실제 데이터로 표시됨
- [ ] 낙찰 이력 차트가 실제 데이터로 렌더링됨
- [ ] 기간 필터(1/3/6/12개월)가 동작함
- [ ] 역할별 데이터 필터링이 동작함 (멤버: 본인 건만)

## 구현 단계
- [ ] `GET /api/dashboard/summary` 대시보드 요약 API 구현 (진행 중/완료/낙찰 건수, 월간 낙찰률)
- [ ] `GET /api/dashboard/recent-quotations` 최근 견적 5건 API 구현
- [ ] `GET /api/bid-history/stats` 전체 낙찰률, 평균 마진율 API 구현
- [ ] `GET /api/bid-history/trend` 월별 낙찰률 추이 API 구현
- [ ] `GET /api/bid-history/failure-reasons` 실패 사유 분포 API 구현
- [ ] Recharts 차트 컴포넌트에 실제 데이터 연동
- [ ] 기간 필터 기능 구현 (1/3/6/12개월)
- [ ] 역할별 데이터 필터링 구현 (멤버: 본인 건만)
- [ ] 대시보드 페이지 더미 데이터를 실제 API로 교체
- [ ] 낙찰 이력 페이지 더미 데이터를 실제 API로 교체

## 테스트 체크리스트
- [ ] 대시보드 통계 데이터 정확성 확인
- [ ] 최근 견적 목록 데이터 정확성 확인
- [ ] 차트 데이터 렌더링 확인
- [ ] 기간 필터 적용 결과 확인
- [ ] 멤버 역할 시 본인 데이터만 표시 확인

## 참고사항
Task 007, Task 011에서 구현한 UI와 연동합니다.
모든 API에 테넌트 격리가 적용되어야 합니다.
