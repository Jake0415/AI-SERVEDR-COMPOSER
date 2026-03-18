# Task 051: 견적 템플릿 관리

## 개요

자주 사용하는 서버 구성을 템플릿으로 저장하고 재사용하여 반복 견적 작업 시간을 단축합니다. 웹서버, DB서버, AI서버 등 카테고리별 분류를 지원하며, 기존 견적에서 템플릿을 생성하거나 처음부터 새 템플릿을 만들 수 있습니다. 팀 전체 공유 템플릿과 개인 전용 템플릿을 분리합니다.

## 관련 기능

- **F027**: 견적 템플릿 관리 — 표준 서버 구성 템플릿 저장/재사용
- **F005**: 3가지 견적안 자동 생성 — 템플릿에서 견적 생성 시 연동
- **F007**: 견적서 발행 및 출력 — 기존 견적에서 템플릿 저장

## 현재 상태

- 견적(quotations) 및 견적 항목(quotation_items) 테이블 존재
- 견적 생성/이력 페이지 구현됨
- 견적 구성을 재사용하는 메커니즘 없음

## 수락 기준

- [ ] 템플릿 CRUD (생성/조회/수정/삭제) 가능
- [ ] 기존 견적에서 "템플릿으로 저장" 가능
- [ ] 템플릿 기반 빠른 견적 생성 가능
- [ ] 템플릿 카테고리 분류 (웹서버, DB서버, AI서버, 스토리지 등)
- [ ] 팀 공유/개인 전용 템플릿 분리
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 데이터 모델 설계 및 마이그레이션

- [ ] `quotation_templates` 테이블 설계:
  - `id`, `tenant_id`, `created_by`, `name`, `description`, `category` (web/db/ai/storage/custom)
  - `is_shared` (팀 공유 여부), `template_items` (JSONB — 부품 구성)
  - `created_at`, `updated_at`
- [ ] TypeScript 인터페이스 정의
- [ ] Zod 검증 스키마 정의

**관련 파일:**
- `lib/types/templates.ts` (신규)
- `supabase/migrations/` (신규 마이그레이션)

### Step 2: 템플릿 CRUD API 구현

- [ ] `POST /api/templates` — 템플릿 생성
- [ ] `GET /api/templates` — 템플릿 목록 조회 (카테고리 필터, 공유/개인 필터)
- [ ] `GET /api/templates/[id]` — 템플릿 상세 조회
- [ ] `PUT /api/templates/[id]` — 템플릿 수정
- [ ] `DELETE /api/templates/[id]` — 템플릿 삭제
- [ ] RLS 정책: 같은 테넌트만 접근, 개인 템플릿은 작성자만

**관련 파일:**
- `app/api/templates/route.ts` (신규)
- `app/api/templates/[id]/route.ts` (신규)

### Step 3: 템플릿 관리 페이지 UI

- [ ] `/templates` 라우트 페이지 생성
- [ ] 템플릿 목록 (카드/테이블 뷰 전환)
- [ ] 카테고리별 필터 탭
- [ ] 공유/개인 필터
- [ ] 템플릿 생성 모달 (이름, 설명, 카테고리, 부품 구성)
- [ ] 템플릿 수정/삭제 기능
- [ ] 사이드바 메뉴에 "견적 템플릿" 추가

**관련 파일:**
- `app/(dashboard)/templates/page.tsx` (신규)
- `components/templates/template-list.tsx` (신규)
- `components/templates/template-form.tsx` (신규)

### Step 4: 기존 견적에서 템플릿 저장

- [ ] 견적 이력 페이지에 "템플릿으로 저장" 버튼 추가
- [ ] 견적 항목을 템플릿 형식으로 변환
- [ ] 저장 시 이름/설명/카테고리 입력 모달

**관련 파일:**
- `app/(dashboard)/quotation-history/page.tsx` (수정)
- `components/templates/save-as-template-dialog.tsx` (신규)

### Step 5: 템플릿 기반 견적 생성

- [ ] 템플릿 상세에서 "견적 생성" 버튼
- [ ] 템플릿 부품 구성을 견적 생성 페이지로 전달
- [ ] 부품 가격은 현재 최신 가격으로 자동 갱신
- [ ] 마진 시뮬레이션 연동

**관련 파일:**
- `components/templates/create-from-template.tsx` (신규)

### Step 6: 검증 및 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 템플릿 CRUD 정상 동작 확인
- [ ] 기존 견적 → 템플릿 저장 → 템플릿에서 견적 생성 플로우 확인

---

## 관련 파일

- `app/(dashboard)/templates/page.tsx` — 템플릿 관리 페이지 (신규)
- `components/templates/template-list.tsx` — 템플릿 목록 (신규)
- `components/templates/template-form.tsx` — 템플릿 생성/수정 폼 (신규)
- `components/templates/save-as-template-dialog.tsx` — 템플릿 저장 다이얼로그 (신규)
- `components/templates/create-from-template.tsx` — 템플릿 기반 견적 생성 (신규)
- `lib/types/templates.ts` — 템플릿 타입 정의 (신규)
- `app/api/templates/route.ts` — 템플릿 API (신규)
- `app/api/templates/[id]/route.ts` — 템플릿 상세 API (신규)

## 테스트 체크리스트

- [ ] 새 템플릿 생성 시 DB에 정상 저장됨
- [ ] 기존 견적에서 "템플릿으로 저장" 시 부품 구성이 완전히 복사됨
- [ ] 템플릿 기반 견적 생성 시 현재 최신 가격이 반영됨
- [ ] 개인 템플릿은 다른 사용자에게 노출되지 않음
- [ ] 공유 템플릿은 같은 테넌트의 모든 사용자에게 조회됨
- [ ] 멤버 역할은 조회/사용만 가능하고 생성/수정/삭제 불가
