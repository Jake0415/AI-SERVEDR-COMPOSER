# Task 047: 수동 조립 - 실시간 전원/견적 바

## 개요

수동 조립 Step 6에서 실시간 전원 프로그레스 바와 견적 테이블을 구현합니다. 부품별 TDP를 스택 막대로 시각화하고, PSU 용량 라인을 표시하며, PSU 자동 추천 및 이중화(1+1) 옵션을 제공합니다. 견적 테이블은 부품별 수량×단가로 원가/공급가/마진을 실시간 계산합니다.

## 관련 기능

- **F024**: 수동 서버 조립 — 전원 관리 및 PSU 선택
- **F006**: 마진 시뮬레이션 — 수동 조립 견적의 실시간 마진 계산
- **F025**: 호환성 매트릭스 확장 — C019(PSU 폼팩터) 실시간 검증

## 현재 상태

- Task 043~046에서 CPU, 메모리, 스토리지, 확장카드가 선택 완료 상태
- 각 부품의 TDP 정보가 specs에 포함됨
- 기존 마진 시뮬레이션 UI 존재 (부품별 마진 슬라이더)
- PSU 선택 및 전원 시각화 없음

## 수락 기준

- [ ] 전원 프로그레스 바: 부품별 TDP 스택 막대 + PSU 용량 라인 표시
- [ ] PSU 자동 추천 (TDP 합산 × 1.2 여유율 기반)
- [ ] PSU 수동 선택 가능
- [ ] 이중화(1+1) 옵션 토글
- [ ] 견적 실시간 테이블: 부품별 수량 × 단가, 원가/공급가/마진 표시
- [ ] 총액 실시간 업데이트
- [ ] C019 규칙 위반 시 실시간 경고
- [ ] `tsc --noEmit` + `npm run build` 통과

---

## 구현 단계

### Step 1: 전원 TDP 프로그레스 바

- [ ] `components/assembly/power-progress-bar.tsx` (신규)
- [ ] 스택 막대 차트 (가로형):
  - CPU TDP: 빨간색 세그먼트
  - 메모리 TDP: 파란색 세그먼트
  - 스토리지 TDP: 녹색 세그먼트
  - GPU TDP: 주황색 세그먼트
  - 기타(NIC/RAID/HBA) TDP: 회색 세그먼트
  - 각 세그먼트 hover 시 부품명 + TDP 값 툴팁
- [ ] PSU 용량 라인:
  - PSU 정격 용량을 점선으로 표시
  - 이중화 시 PSU 1개 용량 기준 (N+1)
  - 총 TDP > PSU 용량 시 빨간색 경고
- [ ] 전원 여유율 표시: "{total_tdp}W / {psu_capacity}W ({usage}%)"
- [ ] 권장 PSU 용량 라벨: "권장: {total_tdp × 1.2}W 이상"

**관련 파일:**
- `components/assembly/power-progress-bar.tsx` (신규)

### Step 2: PSU 선택 UI

- [ ] `components/assembly/psu-selector.tsx` (신규)
- [ ] PSU 자동 추천:
  - 총 TDP 합산 × 1.2(여유율) 이상인 PSU 중 최적 추천
  - 섀시 psu_form_factor와 호환되는 PSU만 후보
  - 추천 PSU에 "추천" Badge 표시
- [ ] PSU 수동 선택:
  - PSU 목록 카드 (모델명, 용량(W), 효율 등급, 폼팩터, 가격)
  - 용량 부족 PSU에 경고 표시
- [ ] 이중화(1+1) 토글:
  - 활성화 시 PSU 2개로 수량 변경
  - 이중화 설명: "전원 이중화(N+1): 1개 PSU 장애 시에도 서버 운영 보장"
  - 비용 자동 2배 반영
- [ ] C019 위반 시 경고: "PSU 폼팩터가 섀시와 일치하지 않습니다"

**관련 파일:**
- `components/assembly/psu-selector.tsx` (신규)

### Step 3: 견적 실시간 테이블

- [ ] `components/assembly/quotation-table.tsx` (신규)
- [ ] 테이블 컬럼:
  - 카테고리 (섀시, 메인보드, CPU, 메모리, SSD/HDD, NIC/RAID/GPU/HBA, PSU)
  - 부품명 / 모델명
  - 수량
  - 단위 원가 (₩)
  - 단위 공급가 (₩)
  - 금액 (수량 × 공급가)
  - 마진율 (%)
  - 마진 금액 (₩)
- [ ] 소계/합계 행:
  - 카테고리별 소계
  - 총 원가 합계
  - 총 공급가 합계
  - 부가세 (공급가 × 10%)
  - 총액 (공급가 + 부가세)
  - 총 마진 합계 / 총 마진율
- [ ] 부품별 마진율 슬라이더 (기존 F006 마진 시뮬레이션 연동)
- [ ] 변경 시 실시간 재계산

**관련 파일:**
- `components/assembly/quotation-table.tsx` (신규)

### Step 4: 견적 확정 및 저장

- [ ] "견적 확정" 버튼:
  - 호환성 최종 검증 (20개 규칙)
  - block 규칙 위반 시 확정 불가 + 에러 목록 표시
  - warn 규칙 위반 시 경고 표시 + 확정 가능
- [ ] 확정 시 quotations + quotation_items 테이블에 저장
- [ ] 저장 완료 후 견적 이력 페이지로 이동

**관련 파일:**
- `components/assembly/assembly-confirm.tsx` (신규)

### Step 5: 검증 & 테스트

- [ ] `tsc --noEmit` 타입 체크 통과
- [ ] `npm run build` 빌드 통과
- [ ] 전원 프로그레스 바 렌더링 및 TDP 합계 정확성 확인
- [ ] PSU 자동 추천 동작 확인
- [ ] 견적 테이블 금액 계산 정확성 확인

---

## 실행 순서

```
Step 1 (전원 프로그레스 바)
    ↓
Step 2 (PSU 선택)
    ↓
Step 3 (견적 테이블)
    ↓
Step 4 (견적 확정)
    ↓
Step 5 (검증)
```

## 관련 파일

- `components/assembly/power-progress-bar.tsx` — TDP 프로그레스 바 (신규)
- `components/assembly/psu-selector.tsx` — PSU 선택 (신규)
- `components/assembly/quotation-table.tsx` — 견적 실시간 테이블 (신규)
- `components/assembly/assembly-confirm.tsx` — 견적 확정 (신규)

## 테스트 체크리스트

- [ ] TDP 프로그레스 바 — CPU 2×250W + GPU 4×300W + 기타 100W = 1700W 정확 표시
- [ ] TDP 프로그레스 바 — 부품별 색상 세그먼트 구분
- [ ] PSU 자동 추천 — 총 TDP 1700W 시 2040W 이상 PSU 추천
- [ ] PSU 폼팩터 불일치 시 C019 경고 표시
- [ ] 이중화 토글 — 활성 시 PSU 수량 2개, 비용 2배
- [ ] 견적 테이블 — 수량×단가 금액 계산 정확성
- [ ] 견적 테이블 — 마진율 슬라이더 변경 시 실시간 재계산
- [ ] 견적 테이블 — 부가세 = 공급가×10% 정확성
- [ ] 견적 확정 — block 규칙 위반 시 확정 불가
- [ ] 견적 확정 — 성공 시 quotations/quotation_items에 저장 확인
- [ ] 총액이 부품 추가/제거 시 실시간 업데이트
