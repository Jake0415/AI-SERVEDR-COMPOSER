---
id: "070-B"
title: "서버 구성 6단계 위저드 통합"
status: "planned"
priority: "high"
phase: "7"
estimated_effort: "2d"
dependencies: ["070-A", "043", "044", "045", "046", "047"]
---

# Task 070-B: 서버 구성 6단계 위저드 통합

## 목표
RFP에서 추출된 개별 서버에 대해 6단계 부품 선택 위저드를 제공. 기존 Task 043~047 수동 조립 UI를 재사용하여 RFP 요구사항 기반 필터링 + 추천 기능 추가.

## 구현 범위

### 1. 위저드 페이지 `/quotation/configure/[rfpId]/[configIndex]`
- 6단계 스텝바 (진행률 표시)
- 각 단계에서 RFP 요구사항 기준으로 "추천" Badge 표시

### 2. 6단계 위저드

#### Step 1: 베이스 서버 (섀시 + 메인보드)
- 섀시 카드 목록 (폼팩터, 드라이브 베이 수, PSU 슬롯)
- 선택 시 → 호환 메인보드 자동 필터링
- 기존 Task 043 UI 재사용

#### Step 2: CPU
- 메인보드 소켓에 맞는 CPU만 표시
- RFP 요구사항 (min_cores, min_clock_ghz) 충족 여부 표시
- 스펙 비교 테이블 (코어, 클럭, TDP, 가격)
- 기존 Task 043 UI 재사용

#### Step 3: 메모리
- CPU DDR 타입에 맞는 모듈만 표시
- 메모리 슬롯 시각화 (기존 Task 044)
- DIMM 최적화 추천 (`dimm-optimizer.ts`)
- 용량/수량 조합 자동 추천

#### Step 4: 스토리지
- 드라이브 베이 시각화 (기존 Task 045)
- NVMe/SATA/SAS 인터페이스 필터
- RFP 요구 용량 충족 여부 표시

#### Step 5: 확장 카드 (GPU, NIC, RAID, HBA)
- PCIe 슬롯 시각화 (기존 Task 046)
- GPU 폼팩터/전력 호환 체크
- RFP에서 GPU 요구 시 자동 추천

#### Step 6: PSU + 요약
- 전력 계산 (전체 TDP × 1.2)
- 추천 PSU 자동 표시 (기존 Task 047)
- 전체 구성 요약 테이블 (부품명, 수량, 가격)
- 호환성 경고 표시
- "구성 완료" 버튼

### 3. 자동 구성 → 수동 편집 전환
- "자동 구성" 선택 시 `auto-assembler.ts` 실행
- 결과를 위저드 각 Step에 미리 채움
- 관리자가 개별 부품 변경 가능 (수동 오버라이드)

### 4. 상태 관리
- 각 서버 구성 상태를 localStorage 또는 URL 파라미터로 유지
- 페이지 새로고침 시 선택 유지

## 관련 파일
- `app/(dashboard)/quotation/configure/[rfpId]/[configIndex]/page.tsx` (신규)
- `app/api/assembly/auto/route.ts` (신규)
- `lib/assembly/auto-assembler.ts` (기존 강화)
- `lib/assembly/slot-tracker.ts` (기존 활용)
- `lib/assembly/dimm-optimizer.ts` (기존 활용)
- `lib/compatibility/matrix.ts` (기존 활용)

## 검증
- Playwright: 서버 카드 → "수동 구성" → 6단계 위저드 완료
- Playwright: "자동 구성" → 결과 표시 → 부품 변경 → 구성 완료
