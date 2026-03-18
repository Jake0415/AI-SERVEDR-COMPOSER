# Task 065: 나라장터 공고 자동 수집

## 개요

나라장터(G2B) 서버/인프라 관련 공고를 자동으로 수집하여 목록화합니다. 키워드 필터링으로 관련 공고만 추출하고, 입찰 마감일 알림을 제공하며, 공고에서 RFP 문서를 자동으로 연결할 수 있습니다.

## 관련 기능

- **F041**: 나라장터 공고 자동 수집
- **F003**: RFP 파일 업로드 — 공고 RFP 자동 연결
- **F016**: 실시간 알림 — 마감일 알림

## 현재 상태

- RFP 업로드 및 파싱 기능 구현됨
- 외부 공고 수집 기능 없음
- 나라장터 API 연동 없음

## 수락 기준

- [ ] 나라장터 서버/인프라 관련 공고 자동 수집
- [ ] 키워드 필터링 설정 가능
- [ ] 공고 목록 조회/상세 UI
- [ ] 입찰 마감일 알림 발생
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 나라장터 API 연동

- [ ] 나라장터(G2B) 공공데이터포털 API 조사 및 키 발급
- [ ] API 클라이언트 구현 (입찰 공고 조회)
- [ ] 서버/인프라 관련 키워드 필터 설정 (서버, 스토리지, 네트워크 등)
- [ ] 공고 데이터 파싱 및 정규화

**관련 파일:**
- `lib/external/g2b-api-client.ts` (신규)
- `lib/external/g2b-notice-parser.ts` (신규)

### Step 2: 공고 데이터 저장 및 API

- [ ] `g2b_notices` 테이블:
  - `id`, `tenant_id`, `notice_number`, `title`, `organization`
  - `notice_type` (bid/negotiation), `estimated_amount`
  - `bid_start_date`, `bid_end_date`, `notice_date`
  - `detail_url`, `status` (open/closed/awarded)
  - `is_bookmarked`, `linked_rfp_id`, `notes`, `created_at`
- [ ] 공고 CRUD API (`/api/g2b-notices`)
- [ ] 자동 수집 스케줄러 (매일 또는 설정 주기)

**관련 파일:**
- `app/api/g2b-notices/route.ts` (신규)
- `app/api/g2b-notices/sync/route.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 3: 공고 관리 페이지 UI

- [ ] `/g2b-notices` 라우트 페이지 생성
- [ ] 공고 목록 테이블 (제목, 기관, 예상금액, 마감일, 상태)
- [ ] 마감일 기준 정렬/필터
- [ ] 북마크 기능
- [ ] 공고 상세 뷰 (외부 링크 연동)
- [ ] 사이드바 메뉴에 "나라장터 공고" 추가

**관련 파일:**
- `app/(dashboard)/g2b-notices/page.tsx` (신규)
- `components/g2b/notice-list.tsx` (신규)
- `components/g2b/notice-detail.tsx` (신규)

### Step 4: RFP 연결 및 알림

- [ ] 공고에서 "RFP 연결" 기능 (기존 RFP 선택 또는 새 업로드)
- [ ] 입찰 마감 3일/7일 전 알림
- [ ] 키워드 필터 설정 UI

### Step 5: 검증 및 테스트

- [ ] `tsc --noEmit` + `npm run build` 통과
- [ ] 나라장터 API 연동 정상 동작 확인
- [ ] 공고 수집 및 필터링 확인

---

## 관련 파일

- `app/(dashboard)/g2b-notices/page.tsx` — 나라장터 공고 페이지 (신규)
- `components/g2b/notice-list.tsx` — 공고 목록 (신규)
- `lib/external/g2b-api-client.ts` — 나라장터 API 클라이언트 (신규)
- `lib/external/g2b-notice-parser.ts` — 공고 파싱 (신규)
- `app/api/g2b-notices/route.ts` — 공고 API (신규)
- `app/api/g2b-notices/sync/route.ts` — 공고 동기화 API (신규)

## 테스트 체크리스트

- [ ] 나라장터 API에서 공고 데이터가 정상 수집됨
- [ ] 키워드 필터로 서버 관련 공고만 추출됨
- [ ] 마감일 3일 전 알림이 발생함
- [ ] 공고에서 RFP 연결이 정상 동작함
- [ ] 멤버 역할은 공고 조회만 가능
