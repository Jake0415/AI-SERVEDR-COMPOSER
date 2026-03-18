# Task 043: 수동 조립 - 베이스 서버/CPU 선택 UI

## 개요

수동 서버 조립의 첫 두 단계인 베이스 서버(섀시+메인보드) 선택과 CPU 선택 UI를 구현합니다. 카드 레이아웃으로 조합을 비교하고, 필터링 및 소켓 기반 자동 호환성 필터링을 제공합니다.

## 관련 기능

- **F024**: 수동 서버 조립 — 시각적 부품 선택 UI의 시작점
- **F025**: 호환성 매트릭스 확장 — 소켓 호환성 실시간 필터링

## 현재 상태

- 견적 생성 페이지(`/quotation`) 존재
- 부품 선택은 카테고리별 테이블에서 단순 선택 방식
- 베이스 서버 개념 및 슬롯 기반 선택 UI 없음
- Task 040에서 베이스 서버 데이터 모델이 정의됨

## 수락 기준

- [ ] Step 1 — 베이스 서버(섀시+메인보드) 카드 레이아웃으로 조합 표시
- [ ] 폼팩터(1U/2U/4U), 소켓, 제조사 필터 동작
- [ ] 베이스 서버 선택 시 스펙 상세(슬롯 수, 베이 수, 채널 수) 표시
- [ ] Step 2 — CPU 선택 시 메인보드 소켓 기반 자동 필터링
- [ ] CPU 비교 카드(코어, 클럭, TDP, 가격) 표시
- [ ] 듀얼 소켓 메인보드에서 CPU 2개 선택 가능
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 수동 조립 페이지 레이아웃

- [ ] 견적 생성 페이지에 "수동 조립" 탭 추가
- [ ] 수동 조립 스텝 네비게이션 구현:
  - Step 1: 베이스 서버 선택
  - Step 2: CPU 선택
  - Step 3: 메모리 (Task 044)
  - Step 4: 스토리지 (Task 045)
  - Step 5: PCIe 확장카드 (Task 046)
  - Step 6: PSU/견적 확정 (Task 047)
- [ ] 각 스텝 완료 상태 표시 (체크마크/진행바)
- [ ] 이전/다음 스텝 이동 버튼

**관련 파일:**
- `app/(dashboard)/quotation/manual/page.tsx` (신규)
- `components/assembly/step-navigation.tsx` (신규)

### Step 2: 베이스 서버 선택 UI (Step 1)

- [ ] `components/assembly/base-server-selector.tsx` (신규)
- [ ] 필터 영역:
  - 폼팩터 필터: 1U / 2U / 4U (토글 버튼)
  - 소켓 필터: LGA 4677 / SP5 / 기타 (드롭다운)
  - 제조사 필터: 다중 선택 체크박스
- [ ] 카드 레이아웃 (그리드 표시):
  - 각 카드: 섀시 이미지(또는 아이콘) + 메인보드 모델명
  - 섀시 스펙: 폼팩터, 드라이브 베이 수, GPU 슬롯 수
  - 메인보드 스펙: 소켓, 메모리 슬롯, PCIe 슬롯 수
  - 가격 합계 (섀시 + 메인보드)
- [ ] 카드 선택 시 스펙 상세 패널 표시:
  - 메모리: {channels}채널 × {dpc}DPC = {total_slots}슬롯
  - PCIe: 슬롯 목록 (Gen/Lanes별)
  - 스토리지: 2.5" {n}개 + 3.5" {n}개 = 총 {total}개 베이
  - GPU: 최대 {n}개, 최대 길이 {mm}mm
  - PSU: {form_factor} 폼팩터
- [ ] Task 040의 `GET /api/base-servers` API 연동

**관련 파일:**
- `components/assembly/base-server-selector.tsx` (신규)
- `components/assembly/base-server-card.tsx` (신규)
- `components/assembly/base-server-detail.tsx` (신규)

### Step 3: CPU 선택 UI (Step 2)

- [ ] `components/assembly/cpu-selector.tsx` (신규)
- [ ] 소켓 자동 필터링:
  - 선택된 메인보드의 소켓 타입으로 CPU 목록 자동 필터링
  - 필터링된 소켓 타입 Badge 표시 (예: "LGA 4677 호환만 표시")
- [ ] CPU 비교 카드 레이아웃:
  - 모델명, 제조사
  - 코어 수 / 스레드 수
  - 기본 클럭 / 부스트 클럭
  - TDP (전력 소비)
  - 가격
- [ ] 듀얼 소켓 메인보드 처리:
  - 메인보드가 듀얼 소켓이면 CPU 선택 영역 2개 표시
  - "CPU 1"과 "CPU 2"를 동일 모델로 자동 채우는 옵션
  - 각각 개별 선택도 가능
- [ ] CPU 선택 시 총 TDP 합계 표시

**관련 파일:**
- `components/assembly/cpu-selector.tsx` (신규)
- `components/assembly/cpu-card.tsx` (신규)

### Step 4: 상태 관리

- [ ] 수동 조립 전역 상태 관리 (React Context 또는 Zustand):
  - `selectedBaseServer`: 선택된 베이스 서버 (섀시+메인보드)
  - `selectedCpus`: 선택된 CPU (1~2개)
  - `slotTracker`: SlotTracker 인스턴스 (Task 042)
  - `currentStep`: 현재 스텝 번호
- [ ] 스텝 간 데이터 전달 및 유지

**관련 파일:**
- `lib/assembly/assembly-context.tsx` (신규)
- `hooks/use-assembly.ts` (신규)

### Step 5: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 베이스 서버 카드 목록 렌더링 확인
- [ ] 필터링 동작 확인 (폼팩터, 소켓, 제조사)
- [ ] CPU 소켓 자동 필터링 확인
- [ ] 듀얼 소켓 메인보드 시 CPU 2개 선택 확인

---

## 실행 순서

```
Step 1 (페이지 레이아웃)
    ↓
Step 2 (베이스 서버 선택)
    ↓
Step 3 (CPU 선택)
    ↓
Step 4 (상태 관리)
    ↓
Step 5 (검증)
```

## 관련 파일

- `app/(dashboard)/quotation/manual/page.tsx` — 수동 조립 페이지 (신규)
- `components/assembly/step-navigation.tsx` — 스텝 네비게이션 (신규)
- `components/assembly/base-server-selector.tsx` — 베이스 서버 선택 (신규)
- `components/assembly/base-server-card.tsx` — 베이스 서버 카드 (신규)
- `components/assembly/base-server-detail.tsx` — 베이스 서버 상세 (신규)
- `components/assembly/cpu-selector.tsx` — CPU 선택 (신규)
- `components/assembly/cpu-card.tsx` — CPU 카드 (신규)
- `lib/assembly/assembly-context.tsx` — 조립 상태 Context (신규)
- `hooks/use-assembly.ts` — 조립 커스텀 Hook (신규)

## 테스트 체크리스트

- [ ] 베이스 서버 카드 목록이 API 데이터로 렌더링됨
- [ ] 폼팩터 필터(1U/2U/4U) 선택 시 해당 조합만 표시
- [ ] 소켓 필터 선택 시 해당 소켓 조합만 표시
- [ ] 베이스 서버 카드 클릭 시 스펙 상세 패널 표시
- [ ] CPU 목록이 선택된 메인보드 소켓으로 자동 필터링됨
- [ ] 싱글 소켓 메인보드에서 CPU 1개만 선택 가능
- [ ] 듀얼 소켓 메인보드에서 CPU 2개 선택 가능
- [ ] "동일 모델로 채우기" 버튼 동작 확인
- [ ] 스텝 간 이동 시 선택 상태가 유지됨
- [ ] 반응형 레이아웃 (모바일/데스크톱) 확인
