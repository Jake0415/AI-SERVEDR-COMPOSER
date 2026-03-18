# Task 054: 금액 기반 다단계 승인 워크플로우

## 개요

견적 금액 구간별로 승인 라인을 자동 지정하는 다단계 승인 워크플로우를 구현합니다. 예를 들어 1천만원 미만은 팀장 승인, 1천만원~5천만원은 부서장 승인, 5천만원 이상은 임원 승인과 같이 금액에 따라 자동으로 승인 경로가 결정됩니다. 승인 요청, 승인, 반려, 조건부 승인 등 완전한 워크플로우를 제공합니다.

## 관련 기능

- **F030**: 금액 기반 다단계 승인 워크플로우
- **F007**: 견적서 발행 및 출력 — 승인 후 발행 워크플로우
- **F015**: 견적 공유 및 협업 — 기존 승인 워크플로우 확장
- **F016**: 실시간 알림 — 승인 요청/결과 알림
- **F018**: 감사 로그 — 승인 이력 추적

## 현재 상태

- 견적 상태에 draft/review/approved/published 존재
- 단순 승인 워크플로우(F015)는 구현됨
- 금액 기반 자동 승인 라우팅 없음
- 다단계 승인 규칙 설정 기능 없음

## 수락 기준

- [ ] 금액 구간별 승인 규칙 설정 가능 (슈퍼어드민)
- [ ] 견적 확정 시 금액에 따라 승인 라인이 자동 지정
- [ ] 승인 요청/승인/반려/조건부 승인 워크플로우 동작
- [ ] 승인 대기 목록 및 상태 추적 가능
- [ ] 승인 이력이 감사 로그에 기록
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 데이터 모델 설계 및 마이그레이션

- [ ] `approval_rules` 테이블:
  - `id`, `tenant_id`, `min_amount`, `max_amount`
  - `approver_role` (역할 기반) 또는 `approver_id` (특정 사용자)
  - `approval_level` (승인 단계 순서), `is_active`
  - `created_at`, `updated_at`
- [ ] `approval_requests` 테이블:
  - `id`, `tenant_id`, `quotation_id`, `requested_by`
  - `approver_id`, `approval_level`, `status` (pending/approved/rejected/conditional)
  - `comment` (승인/반려 사유), `condition` (조건부 승인 조건)
  - `requested_at`, `responded_at`
- [ ] TypeScript 인터페이스 및 Zod 스키마 정의

**관련 파일:**
- `lib/types/approval.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 2: 승인 규칙 설정 API 및 UI

- [ ] 승인 규칙 CRUD API (`/api/approval-rules`)
- [ ] 시스템 설정 페이지에 "승인 규칙" 탭 추가
- [ ] 금액 구간 설정 UI (최소/최대 금액, 승인자 지정)
- [ ] 다단계 승인 순서 설정
- [ ] 슈퍼어드민만 접근 가능

**관련 파일:**
- `app/api/approval-rules/route.ts` (신규)
- `components/settings/approval-rules-tab.tsx` (신규)

### Step 3: 승인 요청/처리 API

- [ ] `POST /api/approval-requests` — 승인 요청 생성 (견적 금액 기반 자동 라우팅)
- [ ] `PUT /api/approval-requests/[id]` — 승인/반려/조건부 승인 처리
- [ ] `GET /api/approval-requests` — 승인 대기 목록 조회
- [ ] 승인 완료 시 견적 상태 자동 변경 (approved → published 가능)
- [ ] 반려 시 견적 상태 draft로 복귀

**관련 파일:**
- `app/api/approval-requests/route.ts` (신규)
- `app/api/approval-requests/[id]/route.ts` (신규)

### Step 4: 승인 관리 페이지 UI

- [ ] `/approval` 라우트 페이지 생성
- [ ] 내 승인 대기 목록 (승인자 뷰)
- [ ] 내 승인 요청 목록 (요청자 뷰)
- [ ] 승인/반려/조건부 승인 액션 버튼 및 사유 입력
- [ ] 승인 이력 타임라인 표시
- [ ] 사이드바 메뉴에 "승인 관리" 추가 (대기 건수 뱃지)

**관련 파일:**
- `app/(dashboard)/approval/page.tsx` (신규)
- `components/approval/approval-list.tsx` (신규)
- `components/approval/approval-action-dialog.tsx` (신규)

### Step 5: 알림 및 감사 로그 연동

- [ ] 승인 요청 시 승인자에게 알림 발생 (F016)
- [ ] 승인/반려 시 요청자에게 알림 발생
- [ ] 모든 승인 활동을 감사 로그에 기록 (F018)

### Step 6: 검증 및 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 금액별 승인 라우팅 정상 동작 확인
- [ ] 다단계 승인 순서 동작 확인

---

## 관련 파일

- `app/(dashboard)/approval/page.tsx` — 승인 관리 페이지 (신규)
- `components/approval/approval-list.tsx` — 승인 목록 (신규)
- `components/approval/approval-action-dialog.tsx` — 승인 액션 다이얼로그 (신규)
- `components/settings/approval-rules-tab.tsx` — 승인 규칙 설정 (신규)
- `lib/types/approval.ts` — 승인 타입 정의 (신규)
- `app/api/approval-rules/route.ts` — 승인 규칙 API (신규)
- `app/api/approval-requests/route.ts` — 승인 요청 API (신규)
- `app/api/approval-requests/[id]/route.ts` — 승인 처리 API (신규)

## 테스트 체크리스트

- [ ] 1천만원 미만 견적이 팀장급 승인자에게 라우팅됨
- [ ] 5천만원 이상 견적이 임원급 승인자에게 라우팅됨
- [ ] 승인 완료 시 견적 상태가 approved로 변경됨
- [ ] 반려 시 견적 상태가 draft로 복귀함
- [ ] 조건부 승인 시 조건 내용이 저장됨
- [ ] 승인 규칙이 없는 금액 구간에서는 기본 워크플로우 적용
- [ ] 멤버는 승인 요청만 가능하고 승인 처리 불가
