# Task 058: 부품 EOL/EOS 관리

## 개요

부품별 End of Life(EOL) 및 End of Support(EOS) 날짜를 등록하고 추적합니다. EOL 임박 부품에 대한 사전 알림을 제공하고, 견적 생성 시 EOL 부품이 포함되면 경고를 표시하며, 대체 부품을 자동 추천합니다.

## 관련 기능

- **F034**: 부품 EOL/EOS 관리
- **F001**: 부품 DB 등록/관리 — 부품 테이블 확장
- **F005**: 3가지 견적안 자동 생성 — EOL 부품 경고
- **F016**: 실시간 알림 — EOL 임박 알림

## 현재 상태

- 부품(parts) 테이블에 EOL/EOS 관련 필드 없음
- 부품 관리 페이지 구현됨
- 부품 수명 주기 추적 기능 없음

## 수락 기준

- [ ] 부품별 EOL/EOS 날짜 등록 및 관리 가능
- [ ] EOL 임박(30/60/90일 전) 부품 알림 발생
- [ ] 견적 생성 시 EOL 부품 포함 경고 표시
- [ ] 대체 부품 추천 (동일 카테고리/상위 스펙)
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 부품 테이블 확장

- [ ] `parts` 테이블에 필드 추가:
  - `eol_date` (DATE, NULLABLE) — End of Life 날짜
  - `eos_date` (DATE, NULLABLE) — End of Support 날짜
  - `eol_status` (active/eol_approaching/eol/eos) — 자동 계산 필드
  - `replacement_part_id` (-> parts.id, NULLABLE) — 대체 부품
- [ ] TypeScript 인터페이스 업데이트

**관련 파일:**
- `lib/types/parts.ts` (수정)
- `supabase/migrations/` (신규 마이그레이션)

### Step 2: EOL/EOS 관리 UI

- [ ] 부품 관리 페이지에 EOL/EOS 날짜 입력 필드 추가
- [ ] EOL 상태 뱃지 표시 (활성/임박/EOL/EOS)
- [ ] EOL 임박 부품 필터 기능
- [ ] 대체 부품 지정 기능 (동일 카테고리 내 부품 선택)
- [ ] EOL 대시보드 위젯 (임박 부품 요약)

**관련 파일:**
- `app/(dashboard)/parts/page.tsx` (수정)
- `components/parts/eol-badge.tsx` (신규)
- `components/parts/eol-dashboard-widget.tsx` (신규)

### Step 3: 견적 생성 시 EOL 경고

- [ ] 견적 부품 구성 시 EOL 부품 자동 감지
- [ ] 경고 배너 표시 ("EOL 부품 N개 포함")
- [ ] 대체 부품 추천 팝업
- [ ] 대체 부품으로 일괄 교체 기능

**관련 파일:**
- `lib/quotation/eol-checker.ts` (신규)
- `components/quotation/eol-warning.tsx` (신규)

### Step 4: 알림 연동 및 검증

- [ ] EOL 30/60/90일 전 알림 자동 생성
- [ ] 알림 센터(F016)와 연동
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 관련 파일

- `app/(dashboard)/parts/page.tsx` — 부품 관리 페이지 (수정)
- `components/parts/eol-badge.tsx` — EOL 상태 뱃지 (신규)
- `components/parts/eol-dashboard-widget.tsx` — EOL 위젯 (신규)
- `components/quotation/eol-warning.tsx` — EOL 경고 (신규)
- `lib/quotation/eol-checker.ts` — EOL 체크 로직 (신규)

## 테스트 체크리스트

- [ ] EOL 날짜 설정 후 상태 뱃지가 정확히 표시됨
- [ ] EOL 30일 이내 부품에 알림이 발생함
- [ ] 견적에 EOL 부품 포함 시 경고가 표시됨
- [ ] 대체 부품 추천이 동일 카테고리 내에서 제안됨
- [ ] 대체 부품으로 교체 시 가격이 자동 업데이트됨
