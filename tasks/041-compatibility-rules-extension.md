# Task 041: 호환성 규칙 확장 (C013~C020)

## 개요

기존 12개 호환성 규칙(C001~C012)에 신규 8개 규칙(C013~C020)을 추가하여 총 20개 규칙 체계를 완성합니다. 신규 규칙은 메모리 슬롯, PCIe 슬롯, 드라이브 베이, DIMM 타입, 채널 밸런스, PSU 폼팩터, GPU 물리 크기 등 서버 조립 시 발생하는 물리적/논리적 제약을 검증합니다.

## 관련 기능

- **F025**: 호환성 매트릭스 확장 — 20개 규칙 기반 실시간 호환성 검증
- **F023**: 자동 서버 조립 — 자동 구성 시 호환성 사전 검증
- **F024**: 수동 서버 조립 — 부품 선택 시 실시간 호환성 피드백

## 현재 상태

- `lib/compatibility/matrix.ts`에 기존 12개 규칙(C001~C012) 구현됨
- 규칙 유형: `block` (차단) / `warn` (경고) 분류
- CPU-소켓, DDR 세대, 메모리 속도, TDP 등 기본 호환성 규칙 존재
- 슬롯 수, 베이 수, DIMM 타입 혼합, 채널 밸런스 등 물리적 제약 규칙 없음

## 수락 기준

- [ ] C013~C020 총 8개 신규 규칙이 `lib/compatibility/matrix.ts`에 추가됨
- [ ] 각 규칙이 `block` 또는 `warn` 유형으로 분류됨
- [ ] 규칙 평가 시 Task 040에서 정의한 확장 스펙 필드를 활용함
- [ ] 모든 규칙에 한국어 에러 메시지가 정의됨
- [ ] 기존 12개 규칙과 통합되어 총 20개 규칙이 일괄 평가됨
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 신규 규칙 정의 및 타입 확장

- [ ] 신규 8개 규칙 상수 정의:
  - **C013** — 메모리 슬롯 수 초과 (`block`): 선택한 메모리 모듈 수가 메인보드의 `memory_slots`를 초과
  - **C014** — PCIe 슬롯 수 초과 (`block`): 선택한 확장카드 수가 메인보드의 `pcie_slots` 수를 초과
  - **C015** — 드라이브 베이 수 초과 (`block`): 선택한 드라이브 수가 섀시의 `drive_bays_25` + `drive_bays_35`를 초과
  - **C016** — 드라이브 폼팩터 불일치 (`block`): 2.5인치 드라이브를 3.5인치 전용 베이에 장착하거나 그 반대
  - **C017** — RDIMM/LRDIMM 혼합 금지 (`block`): 동일 시스템에 RDIMM과 LRDIMM을 혼합 장착
  - **C018** — 메모리 채널 불균등 장착 (`warn`): 메모리 모듈이 채널에 균등하게 분배되지 않아 성능 저하 발생
  - **C019** — PSU 폼팩터 불일치 (`block`): 선택한 PSU의 폼팩터가 섀시의 `psu_form_factor`와 불일치
  - **C020** — GPU 물리 크기 제한 (`block`): 선택한 GPU의 물리적 길이가 섀시의 `max_gpu_length`를 초과
- [ ] 규칙 타입에 신규 코드 추가 (`CompatibilityRuleCode` 유니언 확장)

**관련 파일:**
- `lib/compatibility/matrix.ts` (수정)
- `lib/types/compatibility.ts` (수정 — 규칙 코드 타입 확장)

### Step 2: 규칙 평가 함수 구현

- [ ] `checkMemorySlotOverflow(config)` — C013 구현
  - 입력: 메인보드 memory_slots, 선택된 메모리 모듈 수
  - 판정: 모듈 수 > 슬롯 수이면 block
- [ ] `checkPcieSlotOverflow(config)` — C014 구현
  - 입력: 메인보드 pcie_slots 배열 길이, 선택된 확장카드 수
  - 판정: 카드 수 > 슬롯 수이면 block
- [ ] `checkDriveBayOverflow(config)` — C015 구현
  - 입력: 섀시 drive_bays_25 + drive_bays_35, 선택된 드라이브 수
  - 판정: 드라이브 수 > 총 베이 수이면 block
- [ ] `checkDriveFormFactor(config)` — C016 구현
  - 입력: 드라이브 폼팩터(2.5"/3.5"), 배정된 베이 유형
  - 판정: 폼팩터 불일치 시 block
- [ ] `checkDimmTypeMix(config)` — C017 구현
  - 입력: 선택된 메모리 모듈들의 타입(RDIMM/LRDIMM)
  - 판정: 타입이 혼합되면 block
- [ ] `checkMemoryChannelBalance(config)` — C018 구현
  - 입력: 메인보드 memory_channels, dimm_per_channel, 선택된 메모리 모듈 수
  - 판정: 채널에 균등 분배되지 않으면 warn
- [ ] `checkPsuFormFactor(config)` — C019 구현
  - 입력: PSU 폼팩터, 섀시 psu_form_factor
  - 판정: 불일치 시 block
- [ ] `checkGpuPhysicalSize(config)` — C020 구현
  - 입력: GPU 물리 길이, 섀시 max_gpu_length
  - 판정: GPU 길이 > 최대 허용 길이이면 block

**관련 파일:**
- `lib/compatibility/rules/slot-rules.ts` (신규 — 슬롯/베이 관련 규칙)
- `lib/compatibility/rules/dimm-rules.ts` (신규 — DIMM 관련 규칙)
- `lib/compatibility/rules/physical-rules.ts` (신규 — 물리적 제약 규칙)

### Step 3: 규칙 통합 및 메시지 정의

- [ ] 기존 `validateCompatibility()` 함수에 신규 8개 규칙 추가
- [ ] 한국어 에러 메시지 정의:
  - C013: "메모리 슬롯 수를 초과했습니다. (선택: {n}개 / 최대: {max}개)"
  - C014: "PCIe 슬롯 수를 초과했습니다. (선택: {n}개 / 최대: {max}개)"
  - C015: "드라이브 베이 수를 초과했습니다. (선택: {n}개 / 최대: {max}개)"
  - C016: "드라이브 폼팩터가 베이와 일치하지 않습니다. ({drive}를 {bay} 베이에 장착할 수 없습니다)"
  - C017: "RDIMM과 LRDIMM을 혼합 장착할 수 없습니다."
  - C018: "메모리가 채널에 균등하게 분배되지 않았습니다. 성능 저하가 발생할 수 있습니다."
  - C019: "PSU 폼팩터가 섀시와 일치하지 않습니다. ({psu}를 {chassis} 섀시에 장착할 수 없습니다)"
  - C020: "GPU 길이가 섀시 허용 크기를 초과합니다. ({gpu}mm > 최대 {max}mm)"
- [ ] 20개 규칙 전체 목록 문서화 (규칙 코드, 유형, 설명)

**관련 파일:**
- `lib/compatibility/matrix.ts` (수정)
- `lib/compatibility/messages.ts` (수정 또는 신규)

### Step 4: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 기존 12개 규칙이 변경 없이 동작하는지 회귀 테스트
- [ ] 신규 8개 규칙 각각에 대한 단위 테스트

---

## 실행 순서

```
Step 1 (규칙 정의 및 타입)
    ↓
Step 2 (규칙 평가 함수)
    ↓
Step 3 (통합 및 메시지)
    ↓
Step 4 (검증)
```

## 관련 파일

- `lib/compatibility/matrix.ts` — 호환성 규칙 매트릭스 (수정)
- `lib/types/compatibility.ts` — 호환성 관련 타입 (수정)
- `lib/compatibility/rules/slot-rules.ts` — 슬롯/베이 규칙 (신규)
- `lib/compatibility/rules/dimm-rules.ts` — DIMM 규칙 (신규)
- `lib/compatibility/rules/physical-rules.ts` — 물리적 제약 규칙 (신규)
- `lib/compatibility/messages.ts` — 규칙별 한국어 메시지 (수정/신규)

## 테스트 체크리스트

- [ ] C013: 메모리 슬롯 16개 메인보드에 17개 메모리 장착 시 block 반환
- [ ] C014: PCIe 슬롯 6개 메인보드에 7개 카드 장착 시 block 반환
- [ ] C015: 총 베이 28개 섀시에 29개 드라이브 장착 시 block 반환
- [ ] C016: 2.5" 드라이브를 3.5" 전용 베이에 배정 시 block 반환
- [ ] C017: RDIMM 4개 + LRDIMM 4개 혼합 시 block 반환
- [ ] C017: RDIMM만 8개 장착 시 통과
- [ ] C018: 8채널 메인보드에 6개 메모리 장착 시 warn 반환
- [ ] C018: 8채널 메인보드에 8개 메모리 장착 시 통과
- [ ] C019: 1U PSU를 2U 섀시에 장착 시 block 반환
- [ ] C020: 330mm GPU를 max_gpu_length 267mm 섀시에 장착 시 block 반환
- [ ] 기존 C001~C012 규칙이 신규 규칙 추가 후에도 정상 동작
- [ ] 20개 규칙 일괄 평가 시 block과 warn이 올바르게 분리 반환됨
