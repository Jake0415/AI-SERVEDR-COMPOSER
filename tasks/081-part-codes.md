# Task 081: 서버 파트 코드 관리 시스템

## 상태
- [x] ✅ 완료

## 개요
서버 확장 부품을 카테고리→부품명 2단계 계층 코드 체계로 관리한다. Task 080(equipment_codes)과 동일한 패턴. `test-document/Server_Part.xlsx` 기준 카테고리 11 + 부품명 20 = 총 31개를 시드로 투입.

## 관련 PRD 기능
- [F049] 서버 파트 코드 관리

## 의존성
- Task 080 (IT 인프라 코드) ✅ 완료 — 동일 패턴 재활용

## 코드 자동생성 규칙

| 레벨 | 형식 | 예시 | 범위 |
|------|------|------|------|
| 카테고리 | `AA` (영문 2자리) | `CP`, `MM`, `ST` | 676가지 |
| 부품명 | `AA-NNN` (영문2 + 숫자3) | `ST-001`, `ST-002` | 카테고리별 999개 |

## 수정/생성 파일

| 파일 | 작업 |
|------|------|
| `lib/db/schema.ts` | part_codes 테이블 추가 |
| `lib/db/relations.ts` | part_codes 관계 정의 |
| `lib/utils/code-generator.ts` | partCodes용 생성 함수 추가 |
| `scripts/seed-data.mjs` | Step 9 — Server_Part.xlsx 시드 |
| `app/api/part-codes/route.ts` | 신규 — GET(트리)/POST API |
| `app/api/part-codes/[id]/route.ts` | 신규 — PUT/DELETE API |
| `app/(dashboard)/settings/part-codes/page.tsx` | 신규 — 트리뷰 관리 페이지 |
| `app/(dashboard)/settings/page.tsx` | 메뉴 카드 추가 |

## 수락 기준
- [ ] part_codes 테이블이 drizzle-kit push로 생성된다
- [ ] 시드 투입 후 카테고리 11 + 부품명 20 = 총 31건 확인
- [ ] 코드 자동생성이 규칙대로 동작한다 (AA / AA-NNN)
- [ ] GET /api/part-codes 호출 시 트리 구조 JSON 반환
- [ ] POST로 신규 코드 추가 시 자동 코드가 발급된다
- [ ] DELETE 시 하위 코드가 있으면 삭제 차단
- [ ] 설정 > 서버 파트 코드 관리 트리뷰 렌더링
- [ ] Docker 배포 후 Playwright 테스트 통과

## 구현 단계
- [ ] DB 스키마 + 관계 + 코드생성 유틸
- [ ] 시드 데이터 (Server_Part.xlsx 전체)
- [ ] API (GET 트리 / POST / PUT / DELETE)
- [ ] UI (트리뷰 관리 페이지)
- [ ] Docker 배포 + 테스트
