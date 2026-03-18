# Task 015-3: 자동 스냅샷 및 스케줄러 구현

## 상태
- [x] ✅ 완료

## 개요
매일 사용자가 설정한 시간에 전체 부품 가격을 스냅샷으로 저장하고, 스냅샷 설정을 관리하는 기능을 구현한다. F002 확장.

## 관련 PRD 기능
- [F002] 부품 가격 관리 (자동 스냅샷)

## 의존성
- Task 013 (DB 구축) 완료 필요
- Task 015-2 (가격 이력) 완료 필요

## 관련 파일
- `app/api/cron/price-snapshot/route.ts` — Cron Job 엔드포인트
- `app/api/settings/price-snapshot/route.ts` — 스냅샷 설정 API
- `app/api/settings/price-snapshot/manual/route.ts` — 수동 스냅샷 트리거
- `lib/services/price-snapshot.ts` — 스냅샷 서비스
- `vercel.json` — Cron Job 설정 추가

## 수락 기준
- [ ] Cron API 호출 시 해당 시간의 테넌트에 대해 스냅샷이 생성된다
- [ ] 스냅샷 설정 변경(시간, 활성화, 보관 기간) 시 다음 실행부터 반영된다
- [ ] 보관 기간 초과 스냅샷이 자동 삭제된다
- [ ] 수동 스냅샷 트리거 시 즉시 스냅샷이 생성된다
- [ ] 스냅샷 이력 목록에서 날짜별 스냅샷을 조회할 수 있다

## 구현 단계
- [ ] 스냅샷 실행 API 구현 (`POST /api/cron/price-snapshot`)
  - API Key 인증 (Vercel Cron 전용, CRON_SECRET 환경변수)
  - 모든 활성 테넌트 조회
  - 각 테넌트의 설정 시간(snapshot_hour)과 현재 시간 비교
  - 해당 시간의 테넌트만 필터링하여 전체 가격을 price_snapshots에 INSERT
  - 보관 기간 초과 스냅샷 자동 삭제
  - last_snapshot_at 업데이트
- [ ] 스냅샷 설정 API 구현
  - `GET /api/settings/price-snapshot` — 현재 설정 조회
  - `PUT /api/settings/price-snapshot` — 설정 변경 (시간, 활성화, 보관 기간)
  - 슈퍼어드민/관리자만 접근 가능
- [ ] 수동 스냅샷 트리거 API 구현
  - `POST /api/settings/price-snapshot/manual` — 즉시 스냅샷 생성
- [ ] Vercel Cron Job 설정 (vercel.json)
  - 매시 정각 실행: `"crons": [{ "path": "/api/cron/price-snapshot", "schedule": "0 * * * *" }]`
- [ ] 스냅샷 이력 조회 API
  - `GET /api/settings/price-snapshot/history` — 날짜별 스냅샷 목록
  - 클릭 시 해당 시점 가격 테이블 표시
- [ ] 부품 관리 페이지 설정 모달과 연동 (Task 008 UI)

## 테스트 체크리스트
- [ ] Cron API 호출 → 스냅샷 정상 생성 확인
- [ ] 비활성 테넌트 → 스냅샷 미생성 확인
- [ ] 설정 시간 불일치 → 스냅샷 미생성 확인
- [ ] 보관 기간 초과 데이터 → 자동 삭제 확인
- [ ] 수동 스냅샷 → 즉시 생성 확인
- [ ] API Key 없는 요청 → 401 거부 확인

## 참고사항
- Vercel Cron은 매시 정각에 실행하되, 내부에서 테넌트별 설정 시간을 비교하여 처리
- 무료 플랜: 일 1회, Pro 플랜: 시간별 가능
- 스냅샷 데이터는 JSONB로 저장하여 유연성 확보
