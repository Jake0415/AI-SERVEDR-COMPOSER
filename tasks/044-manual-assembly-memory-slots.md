# Task 044: 수동 조립 - 메모리 슬롯 시각화

## 개요

수동 조립 Step 3에서 메모리 슬롯을 채널별 다이어그램으로 시각화하고, 슬롯 클릭 시 호환 DIMM 목록을 표시하며, 자동 균등 배치 기능을 제공합니다. 채널 밸런스 최적화와 총 메모리 용량 표시를 포함합니다.

## 관련 기능

- **F024**: 수동 서버 조립 — 메모리 슬롯 시각화 및 부품 선택
- **F025**: 호환성 매트릭스 확장 — C013(슬롯 초과), C017(DIMM 혼합), C018(채널 불균등) 실시간 검증

## 현재 상태

- Task 043에서 베이스 서버 선택 완료 → 메인보드의 memory_slots, memory_channels, dimm_per_channel 정보 가용
- 메모리 슬롯 시각화 UI 없음
- Task 041의 호환성 규칙 C013, C017, C018 활용 가능
- Task 042의 DimmOptimizer 활용 가능

## 수락 기준

- [ ] 채널별 슬롯 다이어그램이 메인보드 스펙에 따라 동적 렌더링됨
- [ ] 빈 슬롯(회색), 채워진 슬롯(파란색), 비호환 슬롯(빨간 테두리) 시각 구분
- [ ] 슬롯 클릭 시 호환 DIMM 목록(DDR 타입, 속도 필터링) 표시
- [ ] "자동 균등 배치" 버튼으로 채널 밸런스 최적화
- [ ] 총 메모리 용량 / 최대 가능 용량 표시
- [ ] C013, C017, C018 규칙 위반 시 실시간 경고 표시
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 메모리 슬롯 다이어그램 컴포넌트

- [ ] `components/assembly/memory-slot-diagram.tsx` (신규)
- [ ] 채널별 슬롯 그리드 레이아웃:
  - 가로: 채널 (예: CH0 ~ CH7)
  - 세로: DPC (예: DIMM 0, DIMM 1)
  - 총 슬롯: channels × dimm_per_channel (예: 8채널 × 2DPC = 16슬롯)
- [ ] 슬롯 상태별 시각 구분:
  - 빈 슬롯: 회색 배경 + 점선 테두리
  - 채워진 슬롯: 파란색 배경 + DIMM 모델명/용량 라벨
  - 비호환 슬롯: 빨간 테두리 + 경고 아이콘 (규칙 위반 시)
- [ ] 채널 라벨 및 DPC 라벨 표시
- [ ] 슬롯 hover 시 툴팁 (장착된 DIMM 정보 또는 "비어 있음")

**관련 파일:**
- `components/assembly/memory-slot-diagram.tsx` (신규)
- `components/assembly/memory-slot.tsx` (신규 — 개별 슬롯 컴포넌트)

### Step 2: DIMM 선택 패널

- [ ] `components/assembly/dimm-selector-panel.tsx` (신규)
- [ ] 슬롯 클릭 시 사이드 패널(Sheet) 오픈:
  - 선택한 슬롯 위치 표시 (예: "CH3 / DIMM 1")
  - 호환 DIMM 목록 표시
- [ ] DIMM 필터링:
  - DDR 타입 필터 (DDR5, DDR4 — 메인보드 지원 타입만 활성)
  - 속도 필터 (4800MHz, 5200MHz, 5600MHz 등)
  - 용량 필터 (16GB, 32GB, 64GB, 128GB)
  - 타입 필터 (RDIMM, LRDIMM)
- [ ] 이미 다른 슬롯에 장착된 DIMM과 동일 타입만 표시 (C017 사전 필터링)
- [ ] DIMM 선택 시 해당 슬롯에 즉시 반영

**관련 파일:**
- `components/assembly/dimm-selector-panel.tsx` (신규)

### Step 3: 자동 균등 배치 기능

- [ ] "자동 균등 배치" 버튼 구현
- [ ] 사용자가 원하는 총 메모리 용량 입력 (예: 256GB)
- [ ] DimmOptimizer (Task 042) 호출:
  - 채널 균등 배치 계산
  - 가능한 구성 목록 표시 (예: "8×32GB RDIMM" vs "16×16GB RDIMM")
  - 사용자 구성 선택 후 모든 슬롯에 자동 배치
- [ ] 배치 결과 다이어그램 즉시 반영
- [ ] 기존 수동 배치 덮어쓰기 전 확인 다이얼로그

**관련 파일:**
- `components/assembly/auto-memory-fill.tsx` (신규)

### Step 4: 호환성 실시간 검증 및 요약

- [ ] 메모리 슬롯 변경 시 실시간 호환성 검증:
  - C013: 슬롯 초과 시 빨간 배지 + 메시지
  - C017: RDIMM/LRDIMM 혼합 시 빨간 배지 + 메시지
  - C018: 채널 불균등 시 노란 배지 + 경고 메시지
- [ ] 메모리 요약 정보 표시:
  - 총 메모리 용량: {현재}GB / 최대 {max}GB
  - 사용 슬롯: {used}개 / {total}개
  - 채널 밸런스: 균등 ✅ / 불균등 ⚠️
  - 총 메모리 비용: ₩{total}

**관련 파일:**
- `components/assembly/memory-summary.tsx` (신규)

### Step 5: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 다양한 메인보드 스펙(8채널×2DPC, 12채널×1DPC 등)에서 다이어그램 렌더링 확인
- [ ] 슬롯 클릭→DIMM 선택→다이어그램 반영 플로우 확인

---

## 실행 순서

```
Step 1 (슬롯 다이어그램)
    ↓
Step 2 (DIMM 선택 패널)
    ↓
Step 3 (자동 균등 배치)
    ↓
Step 4 (호환성 검증 및 요약)
    ↓
Step 5 (검증)
```

## 관련 파일

- `components/assembly/memory-slot-diagram.tsx` — 채널별 슬롯 다이어그램 (신규)
- `components/assembly/memory-slot.tsx` — 개별 슬롯 컴포넌트 (신규)
- `components/assembly/dimm-selector-panel.tsx` — DIMM 선택 패널 (신규)
- `components/assembly/auto-memory-fill.tsx` — 자동 균등 배치 (신규)
- `components/assembly/memory-summary.tsx` — 메모리 요약 정보 (신규)
- `lib/assembly/dimm-optimizer.ts` — DimmOptimizer (Task 042에서 구현)

## 테스트 체크리스트

- [ ] 8채널×2DPC 메인보드에서 16슬롯 다이어그램 렌더링
- [ ] 12채널×1DPC 메인보드에서 12슬롯 다이어그램 렌더링
- [ ] 빈 슬롯 클릭 시 DIMM 선택 패널 오픈
- [ ] 채워진 슬롯 클릭 시 교체/제거 옵션 표시
- [ ] RDIMM이 장착된 상태에서 LRDIMM이 필터링되어 표시되지 않음
- [ ] 자동 균등 배치 — 256GB 입력 시 8×32GB 구성 제안
- [ ] 자동 균등 배치 — 채널 수의 배수로만 DIMM 수 제안
- [ ] C013 위반 — 슬롯 초과 시 에러 표시
- [ ] C018 위반 — 불균등 배치 시 경고 표시
- [ ] 총 메모리 용량이 실시간으로 업데이트됨
- [ ] 비용 합계가 실시간으로 업데이트됨
