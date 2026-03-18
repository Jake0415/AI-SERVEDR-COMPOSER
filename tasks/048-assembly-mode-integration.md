# Task 048: 자동/수동 조립 전환 통합

## 개요

자동 조립과 수동 조립을 하나의 견적 생성 플로우에서 자유롭게 전환할 수 있도록 통합합니다. 자동 조립 결과를 수동 UI에서 편집하거나, 수동 조립 중 빈 슬롯을 AI가 자동으로 채울 수 있습니다. 최종 조립 결과는 3가지 견적안(수익성/규격/성능) 각각에 대해 자동/수동 조합이 가능합니다.

## 관련 기능

- **F023**: 자동 서버 조립 — 자동 조립 결과를 수동 편집으로 전환
- **F024**: 수동 서버 조립 — 수동 조립 중 AI 추천으로 빈 슬롯 채우기
- **F005**: 3가지 견적안 자동 생성 — 각 견적안에 대해 자동/수동 가능

## 현재 상태

- Task 042에서 자동 조립 엔진 구현
- Task 043~047에서 수동 조립 UI 구현
- 자동/수동 간 전환 메커니즘 없음
- 견적 생성 페이지에 자동 조립 탭과 수동 조립 탭이 별도로 존재

## 수락 기준

- [ ] 자동 조립 결과 → "수동 편집" 버튼으로 수동 UI 전환 (기존 선택 유지)
- [ ] 수동 조립 중 → "AI 추천" 버튼으로 빈 슬롯 자동 채우기
- [ ] 최종 조립 결과 → 견적 확정 → quotations/quotation_items 저장
- [ ] 3가지 견적안 각각에 대해 자동/수동 전환 가능
- [ ] 전환 시 SlotTracker 상태 동기화
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 견적 생성 페이지 탭 통합

- [ ] 견적 생성 페이지에 모드 전환 UI 구현:
  - "자동 조립" 탭: 기존 3가지 견적안 자동 생성 (Task 017 + Task 042)
  - "수동 조립" 탭: 6단계 수동 조립 (Task 043~047)
- [ ] 3가지 견적안 탭 내에서 개별적으로 자동/수동 전환 가능
- [ ] 탭 전환 시 현재 조립 상태 유지

**관련 파일:**
- `app/(dashboard)/quotation/page.tsx` (수정)
- `components/assembly/mode-switcher.tsx` (신규)

### Step 2: 자동 → 수동 전환 ("수동 편집" 버튼)

- [ ] 자동 조립 결과 카드에 "수동 편집" 버튼 추가
- [ ] 전환 시 처리:
  - 자동 조립 결과의 부품 선택을 수동 조립 상태로 변환
  - SlotTracker 초기화: 자동 선택된 베이스 서버의 슬롯/베이 정보로 초기화
  - 이미 선택된 부품들을 SlotTracker에 할당 반영
  - 수동 조립 UI의 각 스텝에 기존 선택이 채워진 상태로 표시
- [ ] 사용자에게 안내 메시지: "자동 조립 결과를 기반으로 수동 편집 모드로 전환합니다. 각 부품을 개별적으로 변경할 수 있습니다."

**관련 파일:**
- `lib/assembly/mode-converter.ts` (신규)
- `components/assembly/auto-to-manual-button.tsx` (신규)

### Step 3: 수동 → AI 추천 ("AI 추천" 버튼)

- [ ] 수동 조립 각 스텝에 "AI 추천" 버튼 추가
- [ ] 기능별 AI 추천:
  - 메모리: 빈 슬롯에 DimmOptimizer 기반 최적 DIMM 자동 배치
  - 스토리지: 빈 베이에 RFP 요구사항 기반 드라이브 자동 배치
  - PCIe: 빈 슬롯에 요구 확장카드 자동 배치
  - PSU: TDP 기반 최적 PSU 자동 추천
- [ ] "빈 슬롯만 채우기" vs "전체 재구성" 옵션 제공
- [ ] AI 추천 결과 미리보기 후 적용/취소 선택

**관련 파일:**
- `components/assembly/ai-recommend-button.tsx` (신규)
- `lib/assembly/partial-auto-fill.ts` (신규)

### Step 4: 견적안별 상태 독립 관리

- [ ] 3가지 견적안 각각의 조립 상태를 독립적으로 관리:
  - `profitabilityAssembly`: 수익성 중심안 조립 상태
  - `specMatchAssembly`: 규격 충족안 조립 상태
  - `performanceAssembly`: 성능 향상안 조립 상태
- [ ] 각 안이 자동/수동 모드를 독립적으로 가질 수 있음
- [ ] 견적안 전환 시 해당 안의 상태 복원

**관련 파일:**
- `lib/assembly/assembly-context.tsx` (수정 — 다중 상태 관리)

### Step 5: 최종 견적 확정 통합

- [ ] "견적 확정" 플로우:
  1. 선택된 견적안의 조립 결과 최종 검증 (20개 호환성 규칙)
  2. block 규칙 위반 시 확정 불가 + 에러 목록
  3. warn 규칙 위반 시 경고 + 확정 가능
  4. 확정 시 quotations 레코드 생성
  5. 조립 결과를 quotation_items로 변환 및 저장
  6. 저장 완료 → 견적 이력 페이지로 이동
- [ ] 자동/수동 혼합 상태에서도 동일한 확정 플로우

**관련 파일:**
- `app/api/assembly/confirm/route.ts` (신규)
- `lib/assembly/result-converter.ts` (수정 — 통합 변환)

### Step 6: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 자동→수동 전환 시 기존 선택 유지 확인
- [ ] 수동→AI 추천 시 빈 슬롯만 채워지는지 확인
- [ ] 3가지 견적안 독립 상태 관리 확인
- [ ] 견적 확정 후 DB 저장 확인

---

## 실행 순서

```
Step 1 (탭 통합)
    ↓
Step 2 (자동→수동)
    ↓
Step 3 (수동→AI 추천)
    ↓
Step 4 (견적안별 상태)
    ↓
Step 5 (견적 확정)
    ↓
Step 6 (검증)
```

## 관련 파일

- `app/(dashboard)/quotation/page.tsx` — 견적 생성 페이지 (수정)
- `components/assembly/mode-switcher.tsx` — 모드 전환 UI (신규)
- `components/assembly/auto-to-manual-button.tsx` — 자동→수동 버튼 (신규)
- `components/assembly/ai-recommend-button.tsx` — AI 추천 버튼 (신규)
- `lib/assembly/mode-converter.ts` — 모드 변환 로직 (신규)
- `lib/assembly/partial-auto-fill.ts` — 부분 자동 채우기 (신규)
- `lib/assembly/assembly-context.tsx` — 조립 상태 Context (수정)
- `app/api/assembly/confirm/route.ts` — 견적 확정 API (신규)
- `lib/assembly/result-converter.ts` — 조립→견적 변환 (수정)

## 테스트 체크리스트

- [ ] 자동→수동 전환 — CPU, 메모리, 스토리지 선택이 수동 UI에 유지됨
- [ ] 자동→수동 전환 — SlotTracker가 기존 할당을 정확히 반영
- [ ] 수동→AI 추천 — 이미 채워진 슬롯은 변경되지 않음
- [ ] 수동→AI 추천 — 빈 슬롯에만 부품이 배치됨
- [ ] 수동→AI 추천 — 미리보기 후 취소 시 변경 없음
- [ ] 3가지 견적안 — 각각 독립적으로 자동/수동 전환 가능
- [ ] 견적안 A를 수동 편집 중 견적안 B로 전환 후 다시 A로 돌아왔을 때 상태 유지
- [ ] 견적 확정 — 자동 조립 결과 확정 시 quotations/quotation_items 저장
- [ ] 견적 확정 — 수동 조립 결과 확정 시 quotations/quotation_items 저장
- [ ] 견적 확정 — 자동+수동 혼합 결과 확정 시 정상 저장
- [ ] 견적 확정 — block 규칙 위반 시 확정 차단 확인
