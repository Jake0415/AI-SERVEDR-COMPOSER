# Task 030: 설정 메뉴 — 카테고리 관리 기능

## 개요

관리자(super_admin, admin)가 부품 카테고리를 직접 추가/수정/삭제할 수 있는 설정 페이지를 구현합니다. "설정" 메뉴 아래에 코드 관리 성격의 기능을 모아둡니다.

## 관련 기능

- **F001**: 부품 DB 등록/관리 — 카테고리 추가/삭제 가능
- **F017**: 시스템 설정 — 설정 허브 페이지

## 현재 상태

- DB 스키마: `partCategories` 테이블 존재 (name, displayName, group, specFields, isDefault)
- API: `GET/POST /api/categories` 만 존재 (PUT/DELETE 없음)
- UI: 설정 페이지 없음, 부품 페이지에서 탭으로만 카테고리 표시
- 레이아웃: 사이드바에 "설정" 메뉴 없음

## 수락 기준

- [ ] 사이드바에 "설정" 메뉴가 표시됨 (super_admin, admin만)
- [ ] `/settings` 허브 페이지에서 카테고리 관리 카드가 표시됨
- [ ] `/settings/categories`에서 카테고리 목록이 표시됨 (그룹별 탭)
- [ ] 카테고리 추가 Dialog에서 name, displayName, group, specFields를 입력할 수 있음
- [ ] 카테고리 수정 Dialog에서 displayName, group, specFields를 수정할 수 있음
- [ ] 부품이 0개인 비기본 카테고리만 삭제할 수 있음
- [ ] `/parts` 페이지에서 새로 추가한 카테고리가 탭으로 표시됨
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 라우팅 인프라 (레이아웃 + 미들웨어)
- [ ] `app/(dashboard)/layout.tsx` — menuItems에 "설정" 추가 (Settings 아이콘, super_admin/admin)
- [ ] `middleware.ts` — PROTECTED_PATHS에 "/settings" 추가

**관련 파일:**
- `app/(dashboard)/layout.tsx`
- `middleware.ts`

### Step 2: 카테고리 API 확장 (PUT/DELETE)
- [ ] `app/api/categories/[id]/route.ts` (신규) — PUT, DELETE 엔드포인트
  - PUT: displayName, group, specFields 수정 (권한: admin 이상)
  - DELETE: isDefault이면 거부, 부품이 있으면 거부 (권한: admin 이상)
- [ ] `app/api/categories/route.ts` (수정) — GET 응답에 카테고리별 부품 수(partCount) 포함

**관련 파일:**
- `app/api/categories/[id]/route.ts` (신규)
- `app/api/categories/route.ts` (수정)
- `lib/db/schema.ts` — partCategories, parts 테이블
- `lib/auth/actions.ts` — getCurrentUser()

### Step 3: 설정 허브 페이지
- [ ] `app/(dashboard)/settings/page.tsx` (신규)
  - 서버 컴포넌트
  - Card 형태로 하위 메뉴: 카테고리 관리 → `/settings/categories`
  - 향후 확장 placeholder: 회사정보, 알림설정

**관련 파일:**
- `app/(dashboard)/settings/page.tsx` (신규)

### Step 4: 카테고리 관리 UI (핵심)
- [ ] `app/(dashboard)/settings/categories/page.tsx` (신규)
  - "use client" 컴포넌트
  - 그룹별 탭 (전체 / server_parts / network_infra)
  - 테이블: #, name, displayName, group, specFields 개수, 부품 수, isDefault 배지, 관리 버튼
  - 추가 Dialog: displayName, name(영문 slug), group(select), specFields 편집기
  - 수정 Dialog: displayName, group, specFields 수정 (name readonly)
  - 삭제 AlertDialog: isDefault/부품 존재 시 삭제 불가 안내
  - specFields 편집기: key(영문), label(한국어), type(text/number/select), select시 options 입력

**관련 파일:**
- `app/(dashboard)/settings/categories/page.tsx` (신규)

### Step 5: 검증 & 테스트
- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] Playwright E2E: 설정 → 카테고리 관리 → 추가/수정/삭제 → /parts 탭 반영

---

## 실행 순서

```
Step 1 + Step 2  (동시 진행 가능)
    ↓
Step 3  (Step 1 완료 후)
    ↓
Step 4  (Step 2, Step 3 완료 후)
    ↓
Step 5  (전체 완료 후)
```

## 기존 코드 재사용

- `lib/db/schema.ts` — partCategories, parts 테이블
- `lib/auth/actions.ts` — getCurrentUser() 인증/권한
- `app/api/categories/route.ts` — GET/POST 패턴 참고
- `app/api/parts/[id]/route.ts` — PUT/DELETE 패턴 참고
- shadcn/ui: Table, Dialog, AlertDialog, Button, Input, Label, Badge, Tabs, Select, Card

## 테스트 체크리스트

- [ ] GET /api/categories → partCount 포함 확인
- [ ] PUT /api/categories/[id] → displayName 변경 후 확인
- [ ] DELETE /api/categories/[id] → 부품 있는 카테고리 삭제 시 400 에러
- [ ] DELETE /api/categories/[id] → isDefault 카테고리 삭제 시 400 에러
- [ ] DELETE /api/categories/[id] → 빈 비기본 카테고리 삭제 성공
- [ ] /settings/categories → 카테고리 추가 후 목록에 표시
- [ ] /parts → 새 카테고리가 탭에 표시
