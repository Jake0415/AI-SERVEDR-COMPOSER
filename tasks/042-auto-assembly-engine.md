# Task 042: 자동 조립 엔진 고도화

## 개요

RFP 요구사항을 기반으로 서버를 자동 조립하는 9단계 파이프라인을 구현합니다. 베이스 서버(섀시+메인보드) 매칭부터 CPU, 메모리, 스토리지, 확장카드, PSU 선택까지 슬롯/베이 잔여를 추적하며 최적의 서버 구성을 자동으로 결정합니다. `SlotTracker` 클래스로 자원 추적, `DimmOptimizer` 클래스로 메모리 채널 균등 배치를 자동화합니다.

## 관련 기능

- **F023**: 자동 서버 조립 — 핵심 자동 조립 엔진
- **F005**: 3가지 견적안 자동 생성 — 기존 매칭 엔진을 고도화
- **F025**: 호환성 매트릭스 확장 — 20개 규칙으로 최종 검증

## 현재 상태

- `lib/quotation/matching-engine.ts`에 기존 부품 매칭 로직 존재
- 기존 매칭은 카테고리별 단순 매칭 (슬롯/베이 추적 없음)
- Task 040에서 확장된 메인보드/섀시 스펙이 가용
- Task 041에서 20개 호환성 규칙이 가용

## 수락 기준

- [ ] 9단계 자동 조립 파이프라인이 구현됨
- [ ] `SlotTracker` 클래스가 메모리 슬롯, PCIe 슬롯, 드라이브 베이 잔여를 추적함
- [ ] `DimmOptimizer` 클래스가 채널 균등, 용량 최적화, 타입 일관성을 보장함
- [ ] 3가지 견적안(수익성/규격/성능) 각각에 대해 자동 조립이 동작함
- [ ] 조립 결과가 20개 호환성 규칙을 모두 통과함
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: SlotTracker 클래스 구현

- [ ] `SlotTracker` 클래스 설계 및 구현:
  - 초기화: 메인보드의 memory_slots, pcie_slots, 섀시의 drive_bays_25, drive_bays_35
  - `allocateMemorySlot(count)`: 메모리 슬롯 할당, 잔여 반환
  - `allocatePcieSlot(gen, lanes, formFactor)`: PCIe 슬롯 할당, 호환 슬롯 자동 선택
  - `allocateDriveBay(formFactor)`: 드라이브 베이 할당 (2.5"/3.5")
  - `getRemainingMemorySlots()`: 잔여 메모리 슬롯 수
  - `getRemainingPcieSlots()`: 잔여 PCIe 슬롯 목록
  - `getRemainingDriveBays()`: 잔여 드라이브 베이 수 (폼팩터별)
  - `canAllocate(resourceType, requirement)`: 할당 가능 여부 사전 검사
  - `getSnapshot()`: 현재 할당 상태 스냅샷 반환

**관련 파일:**
- `lib/assembly/slot-tracker.ts` (신규)

### Step 2: DimmOptimizer 클래스 구현

- [ ] `DimmOptimizer` 클래스 설계 및 구현:
  - 입력: 요구 총 메모리 용량, 메인보드 채널 수, DPC, 총 슬롯 수
  - `optimize(targetCapacityGB)`: 최적 DIMM 구성 반환
    - 채널 균등 배치: 모든 채널에 동일 수의 DIMM 장착
    - 용량 최적화: 요구 용량을 충족하는 최소 비용 조합
    - 타입 일관성: 동일 타입(RDIMM 또는 LRDIMM) 강제
  - `getSupportedConfigurations()`: 가능한 DIMM 구성 목록 (예: 8×32GB, 16×16GB)
  - `calculateEfficiency(config)`: 구성의 효율성 점수 (채널 활용률, 용량 활용률)

**관련 파일:**
- `lib/assembly/dimm-optimizer.ts` (신규)

### Step 3: 9단계 자동 조립 파이프라인 구현

- [ ] 파이프라인 메인 함수 `autoAssembleServer(rfpRequirements, strategy)` 구현:
  1. **RFP 파싱 → 요구사항 추출**: 기존 파싱 결과에서 CPU/메모리/스토리지/GPU 요구사항 추출
  2. **폼팩터 결정**: GPU 수, 드라이브 수 기반으로 1U/2U/4U 결정
     - GPU 필요 → 최소 2U
     - GPU 4개 이상 → 4U
     - 드라이브 12개 이상 → 최소 2U
  3. **베이스 서버 매칭**: 폼팩터에 맞는 섀시+메인보드 후보 선정 (Task 040 API 활용)
  4. **CPU 선택**: 메인보드 소켓 호환 + 요구 코어/클럭/TDP 매칭
  5. **메모리 최적 DIMM 구성**: DimmOptimizer로 채널 균등 + 용량 충족 구성
  6. **스토리지 구성**: 지원 인터페이스 + 베이 잔여 기반 NVMe/SATA/SAS 배치
  7. **확장카드 배치**: PCIe 슬롯 잔여/규격 기반 NIC/RAID/GPU/HBA 배치
  8. **PSU 선택**: 전체 TDP 합산 × 1.2(여유율) + 이중화 옵션
  9. **호환성 최종 검증**: 20개 규칙으로 전체 구성 검증 (Task 041)
- [ ] 각 단계의 실패 시 대체 후보 자동 탐색 (fallback 로직)

**관련 파일:**
- `lib/assembly/auto-assembler.ts` (신규)
- `lib/assembly/pipeline-steps/` (신규 — 단계별 모듈)

### Step 4: 3가지 전략별 조립 로직

- [ ] 전략별 파이프라인 파라미터 차별화:
  - **수익성 중심 (profitability)**: 각 단계에서 마진 최대화 부품 우선 선택
  - **규격 충족 (spec_match)**: RFP 요구사항에 정확히 매칭되는 부품 선택
  - **성능 향상 (performance)**: 10~30% 업스펙 부품 선택
- [ ] 기존 `lib/quotation/matching-engine.ts` 연동 (호환성 유지)

**관련 파일:**
- `lib/assembly/strategies/profitability.ts` (신규)
- `lib/assembly/strategies/spec-match.ts` (신규)
- `lib/assembly/strategies/performance.ts` (신규)

### Step 5: 조립 결과 API

- [ ] `POST /api/assembly/auto` — 자동 조립 실행 API
  - 입력: rfp_id, strategy (profitability/spec_match/performance)
  - 출력: 조립 결과 (부품 목록, SlotTracker 상태, 호환성 검증 결과)
- [ ] 조립 결과를 quotations/quotation_items 형태로 변환하는 유틸리티

**관련 파일:**
- `app/api/assembly/auto/route.ts` (신규)
- `lib/assembly/result-converter.ts` (신규)

### Step 6: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 9단계 파이프라인 통합 테스트
- [ ] SlotTracker 할당/해제/잔여 추적 테스트
- [ ] DimmOptimizer 채널 균등 배치 테스트

---

## 실행 순서

```
Step 1 (SlotTracker)
    ↓
Step 2 (DimmOptimizer)
    ↓
Step 3 (9단계 파이프라인)
    ↓
Step 4 (3가지 전략)
    ↓
Step 5 (API)
    ↓
Step 6 (검증)
```

## 관련 파일

- `lib/assembly/slot-tracker.ts` — 슬롯/베이 잔여 추적 (신규)
- `lib/assembly/dimm-optimizer.ts` — DIMM 채널 최적화 (신규)
- `lib/assembly/auto-assembler.ts` — 자동 조립 메인 파이프라인 (신규)
- `lib/assembly/pipeline-steps/` — 파이프라인 단계별 모듈 (신규)
- `lib/assembly/strategies/` — 전략별 조립 로직 (신규)
- `lib/assembly/result-converter.ts` — 조립 결과 → 견적 항목 변환 (신규)
- `app/api/assembly/auto/route.ts` — 자동 조립 API (신규)
- `lib/quotation/matching-engine.ts` — 기존 매칭 엔진 (연동)
- `lib/compatibility/matrix.ts` — 20개 호환성 규칙 (연동)

## 테스트 체크리스트

- [ ] SlotTracker — 메모리 슬롯 16개 중 8개 할당 후 잔여 8개 반환
- [ ] SlotTracker — PCIe x16 슬롯 할당 후 잔여 목록에서 해당 슬롯 제거
- [ ] SlotTracker — 드라이브 베이 초과 할당 시 에러 반환
- [ ] DimmOptimizer — 256GB 요구, 8채널 2DPC 시 16×16GB 또는 8×32GB 반환
- [ ] DimmOptimizer — 채널 불균등 구성(예: 7개)은 결과에서 제외
- [ ] 파이프라인 — GPU 4개 요구 시 폼팩터 4U 결정
- [ ] 파이프라인 — 수익성 전략에서 마진 높은 부품이 우선 선택됨
- [ ] 파이프라인 — 호환성 검증 실패 시 대체 부품으로 재시도
- [ ] 최종 조립 결과가 20개 호환성 규칙을 모두 통과
- [ ] 3가지 전략 모두 유효한 조립 결과를 반환
