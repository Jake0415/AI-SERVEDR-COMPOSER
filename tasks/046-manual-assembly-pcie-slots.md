# Task 046: 수동 조립 - PCIe 슬롯 시각화

## 개요

수동 조립 Step 5에서 PCIe 슬롯을 다이어그램으로 시각화합니다. 각 슬롯의 Gen/Lane 정보를 표시하고, 슬롯 클릭 시 호환 확장카드(NIC, RAID, GPU, HBA) 목록을 표시합니다. GPU는 물리적 크기 제한을 시각적으로 나타내고, PCIe Lane 총 사용량을 표시합니다.

## 관련 기능

- **F024**: 수동 서버 조립 — PCIe 슬롯 시각화 및 확장카드 선택
- **F025**: 호환성 매트릭스 확장 — C014(슬롯 초과), C020(GPU 물리 크기) 실시간 검증

## 현재 상태

- Task 043에서 베이스 서버 선택 완료 → 메인보드의 pcie_slots 배열 정보 가용
- Task 040에서 섀시의 max_gpu_count, max_gpu_length 정보 가용
- PCIe 슬롯 시각화 UI 없음
- Task 041의 호환성 규칙 C014, C020 활용 가능

## 수락 기준

- [ ] PCIe 슬롯 다이어그램이 Gen/Lane 정보와 함께 표시됨
- [ ] 슬롯 클릭 시 호환 카드 목록(NIC, RAID, GPU, HBA) 표시
- [ ] GPU 카드에 물리적 크기 제한 표시 (섀시 max_gpu_length 기준)
- [ ] PCIe Lane 총 사용량 / CPU 제공 Lane 표시
- [ ] C014, C020 규칙 위반 시 실시간 경고
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: PCIe 슬롯 다이어그램 컴포넌트

- [ ] `components/assembly/pcie-slot-diagram.tsx` (신규)
- [ ] 슬롯 목록 레이아웃 (세로 정렬, 메인보드 시각적 표현):
  - 각 슬롯: 슬롯 번호, Gen 표시 (PCIe 4.0/5.0), Lane 수 (x4/x8/x16)
  - 슬롯 크기에 따라 시각적 길이 차등 (x16이 x4보다 길게)
- [ ] 슬롯 상태별 시각 구분:
  - 빈 슬롯: 회색 배경
  - 채워진 슬롯: 카테고리별 색상 (NIC: 파랑, RAID: 주황, GPU: 초록, HBA: 보라)
  - 채워진 슬롯에 카드명 라벨 표시
- [ ] 슬롯 hover 시 툴팁 (슬롯 스펙 및 장착된 카드 정보)

**관련 파일:**
- `components/assembly/pcie-slot-diagram.tsx` (신규)
- `components/assembly/pcie-slot.tsx` (신규 — 개별 슬롯 컴포넌트)

### Step 2: 확장카드 선택 패널

- [ ] `components/assembly/pcie-card-selector-panel.tsx` (신규)
- [ ] 슬롯 클릭 시 사이드 패널(Sheet) 오픈:
  - 선택한 슬롯 스펙 표시 (예: "Slot 3 — PCIe 5.0 x16")
  - 호환 카드 목록 (슬롯 Gen/Lane에 맞는 카드만)
- [ ] 카드 카테고리 필터: NIC / RAID / GPU / HBA
- [ ] 각 카드 정보:
  - NIC: 모델명, 포트 수, 속도 (10G/25G/100G), PCIe 요구사항
  - RAID: 모델명, 지원 레벨, 캐시 용량, PCIe 요구사항
  - GPU: 모델명, VRAM, TDP, **물리적 길이(mm)**, PCIe 요구사항
  - HBA: 모델명, 포트 수, 지원 인터페이스, PCIe 요구사항
- [ ] GPU 카드에 물리적 크기 제한 표시:
  - 섀시 max_gpu_length 초과 시 빨간 경고 Badge
  - "이 섀시에서 장착 불가 (GPU: {length}mm > 최대: {max}mm)"
  - 장착 가능 GPU에는 초록 체크 표시
- [ ] 카드 선택 시 해당 슬롯에 즉시 반영

**관련 파일:**
- `components/assembly/pcie-card-selector-panel.tsx` (신규)

### Step 3: PCIe Lane 사용량 표시

- [ ] `components/assembly/pcie-lane-usage.tsx` (신규)
- [ ] PCIe Lane 사용량 프로그레스 바:
  - 총 CPU 제공 Lane 수 (CPU 스펙에서 추출)
  - 현재 사용 중인 Lane 수 (장착된 카드의 Lane 합계)
  - 프로그레스 바: 사용량/총 Lane (초과 시 빨간색)
- [ ] Lane 사용 상세 테이블: 슬롯별 카드명, 사용 Lane 수

**관련 파일:**
- `components/assembly/pcie-lane-usage.tsx` (신규)

### Step 4: 호환성 검증 및 요약

- [ ] PCIe 슬롯 변경 시 실시간 호환성 검증:
  - C014: 슬롯 초과 시 빨간 배지 + 메시지
  - C020: GPU 물리 크기 초과 시 빨간 배지 + 메시지
- [ ] PCIe 요약 정보 표시:
  - 사용 슬롯: {used}개 / {total}개
  - GPU: {count}개 / 최대 {max}개
  - Lane 사용량: {used} / {total} Lanes
  - 총 확장카드 비용: ₩{total}

**관련 파일:**
- `components/assembly/pcie-summary.tsx` (신규)

### Step 5: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 다양한 PCIe 슬롯 구성(x4 2개 + x16 4개 등)에서 다이어그램 렌더링 확인
- [ ] 슬롯 클릭→카드 선택→다이어그램 반영 플로우 확인

---

## 실행 순서

```
Step 1 (슬롯 다이어그램)
    ↓
Step 2 (카드 선택 패널)
    ↓
Step 3 (Lane 사용량)
    ↓
Step 4 (호환성 검증 및 요약)
    ↓
Step 5 (검증)
```

## 관련 파일

- `components/assembly/pcie-slot-diagram.tsx` — PCIe 슬롯 다이어그램 (신규)
- `components/assembly/pcie-slot.tsx` — 개별 슬롯 컴포넌트 (신규)
- `components/assembly/pcie-card-selector-panel.tsx` — 확장카드 선택 패널 (신규)
- `components/assembly/pcie-lane-usage.tsx` — Lane 사용량 표시 (신규)
- `components/assembly/pcie-summary.tsx` — PCIe 요약 (신규)

## 테스트 체크리스트

- [ ] PCIe 5.0 x16 × 6 + x4 × 2 슬롯 구성에서 올바른 다이어그램 렌더링
- [ ] x16 슬롯 클릭 시 x16 이하 카드 모두 표시
- [ ] x4 슬롯 클릭 시 x4 이하 카드만 표시
- [ ] GPU 카드 — 물리적 길이 초과 시 경고 표시 및 선택 차단
- [ ] GPU 카드 — max_gpu_count 초과 시 경고 표시
- [ ] NIC/RAID/HBA 카테고리 필터 동작
- [ ] Lane 사용량 프로그레스 바 정상 업데이트
- [ ] C014 위반 — 모든 슬롯 채워진 후 추가 시도 시 에러
- [ ] C020 위반 — 330mm GPU를 267mm 제한 섀시에 장착 시 에러
- [ ] 비용 합계가 실시간 업데이트
