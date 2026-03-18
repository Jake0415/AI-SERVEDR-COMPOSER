# Task 040: 베이스 서버 데이터 모델 설계

## 개요

기존 `parts.specs` JSONB 필드를 확장하여 메인보드와 섀시에 서버 조립에 필요한 상세 스펙을 추가합니다. "베이스 서버"란 섀시+메인보드를 묶어 서버 조립의 시작점으로 사용하는 개념으로, 이후 CPU/메모리/스토리지/확장카드/PSU를 슬롯/베이 기반으로 장착합니다.

## 관련 기능

- **F023**: 자동 서버 조립 — 베이스 서버 매칭의 기초 데이터 모델
- **F024**: 수동 서버 조립 — 슬롯/베이 시각화를 위한 상세 스펙
- **F025**: 호환성 매트릭스 확장 — 규칙 평가에 필요한 스펙 필드

## 현재 상태

- `parts` 테이블에 `specs` JSONB 필드 존재
- 메인보드/섀시 카테고리가 기본 14개 카테고리에 포함됨
- 시드 데이터에 메인보드 3개, 섀시 3개 등록됨
- 슬롯 수, 베이 수, 채널 수 등 조립용 상세 스펙은 미정의

## 수락 기준

- [ ] 메인보드 specs에 `memory_slots`, `dimm_per_channel`, `memory_channels`, `pcie_slots`, `supported_storage_interfaces` 필드가 추가됨
- [ ] 섀시 specs에 `drive_bays_25`, `drive_bays_35`, `max_gpu_count`, `max_gpu_length`, `psu_form_factor` 필드가 추가됨
- [ ] "베이스 서버" 개념이 섀시+메인보드 조합으로 정의되고, 조회 API에서 조합 목록을 반환함
- [ ] 기존 시드 데이터(메인보드 3개, 섀시 3개)의 specs가 확장됨
- [ ] TypeScript 인터페이스에 확장된 스펙 타입이 반영됨
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 메인보드 specs JSONB 확장 설계

- [ ] 메인보드 `specs` 필드에 추가할 속성 정의:
  - `memory_slots`: 총 메모리 슬롯 수 (예: 16, 24, 32)
  - `dimm_per_channel`: 채널당 DIMM 수 (예: 1, 2)
  - `memory_channels`: 메모리 채널 수 (예: 8, 12)
  - `pcie_slots`: PCIe 슬롯 배열 `[{gen: number, lanes: number, form_factor: string}]`
    - gen: PCIe 세대 (4, 5)
    - lanes: 레인 수 (4, 8, 16)
    - form_factor: 폼팩터 ("x4", "x8", "x16")
  - `supported_storage_interfaces`: 지원 스토리지 인터페이스 배열 (예: ["NVMe", "SATA", "SAS"])
- [ ] TypeScript 인터페이스 `MotherboardSpecs` 정의

**관련 파일:**
- `lib/types/parts.ts` (수정 — 메인보드 스펙 타입 추가)

### Step 2: 섀시 specs JSONB 확장 설계

- [ ] 섀시 `specs` 필드에 추가할 속성 정의:
  - `drive_bays_25`: 2.5인치 드라이브 베이 수 (예: 8, 24)
  - `drive_bays_35`: 3.5인치 드라이브 베이 수 (예: 0, 4, 12)
  - `max_gpu_count`: 최대 GPU 장착 수 (예: 0, 2, 4, 8)
  - `max_gpu_length`: 최대 GPU 물리 길이 (mm) (예: 267, 330)
  - `psu_form_factor`: PSU 폼팩터 (예: "1U", "2U", "redundant")
- [ ] TypeScript 인터페이스 `ChassisSpecs` 정의

**관련 파일:**
- `lib/types/parts.ts` (수정 — 섀시 스펙 타입 추가)

### Step 3: 베이스 서버 개념 정의

- [ ] "베이스 서버" = 섀시 + 메인보드 조합
- [ ] `BaseServer` TypeScript 인터페이스 정의:
  - `chassis`: 섀시 부품 정보 + 확장 스펙
  - `motherboard`: 메인보드 부품 정보 + 확장 스펙
  - `form_factor`: 폼팩터 (1U/2U/4U)
  - `socket_type`: CPU 소켓 타입
  - `available_memory_slots`: 메모리 슬롯 수
  - `available_pcie_slots`: PCIe 슬롯 목록
  - `available_drive_bays`: 드라이브 베이 수 (2.5"/3.5")
- [ ] 베이스 서버 조합 조회 API 설계: `GET /api/base-servers`

**관련 파일:**
- `lib/types/assembly.ts` (신규 — 조립 관련 타입)
- `app/api/base-servers/route.ts` (신규)

### Step 4: 기존 시드 데이터 확장

- [ ] 메인보드 시드 데이터 3개에 확장 스펙 추가:
  - 예시 1: 듀얼 소켓, 32 메모리 슬롯, 8채널 × 2DPC, PCIe 5.0 x16 × 6
  - 예시 2: 싱글 소켓, 16 메모리 슬롯, 8채널 × 1DPC, PCIe 4.0 x16 × 4
  - 예시 3: 듀얼 소켓, 24 메모리 슬롯, 12채널 × 1DPC, PCIe 5.0 x16 × 8
- [ ] 섀시 시드 데이터 3개에 확장 스펙 추가:
  - 예시 1: 1U, 2.5" × 10, 3.5" × 0, GPU 0, PSU 1U
  - 예시 2: 2U, 2.5" × 24, 3.5" × 4, GPU 2 (max 330mm), PSU 2U
  - 예시 3: 4U, 2.5" × 24, 3.5" × 12, GPU 8 (max 330mm), PSU redundant
- [ ] 시드 데이터 SQL 또는 마이그레이션 업데이트

**관련 파일:**
- `supabase/seed.sql` 또는 해당 시드 파일 (수정)

### Step 5: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 베이스 서버 조합 API가 섀시×메인보드 조합을 반환하는지 확인
- [ ] 확장된 스펙 필드가 부품 관리 UI에서 조회 가능한지 확인

---

## 실행 순서

```
Step 1 (메인보드 스펙 확장)
    ↓
Step 2 (섀시 스펙 확장)
    ↓
Step 3 (베이스 서버 개념 정의)
    ↓
Step 4 (시드 데이터 확장)
    ↓
Step 5 (검증)
```

## 관련 파일

- `lib/types/parts.ts` — 메인보드/섀시 스펙 타입 확장
- `lib/types/assembly.ts` — 베이스 서버, 조립 관련 타입 (신규)
- `app/api/base-servers/route.ts` — 베이스 서버 조합 조회 API (신규)
- `supabase/seed.sql` — 시드 데이터 확장

## 테스트 체크리스트

- [ ] 메인보드 specs에 memory_slots, dimm_per_channel, memory_channels가 정상 저장/조회됨
- [ ] 메인보드 specs에 pcie_slots 배열이 정상 저장/조회됨
- [ ] 섀시 specs에 drive_bays_25, drive_bays_35가 정상 저장/조회됨
- [ ] 섀시 specs에 max_gpu_count, max_gpu_length가 정상 저장/조회됨
- [ ] 베이스 서버 조합 API가 섀시×메인보드 조합 목록을 반환함
- [ ] 폼팩터 필터링(1U/2U/4U)으로 베이스 서버 조합이 필터됨
- [ ] 확장된 스펙이 TypeScript 타입과 일치함
