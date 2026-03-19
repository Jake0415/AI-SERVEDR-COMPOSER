---
id: "070"
title: "RFP 기반 서버 구성 워크플로우"
status: "planned"
priority: "high"
phase: "7"
estimated_effort: "5d"
dependencies: ["016", "017", "018"]
---

# Task 070: RFP 기반 서버 구성 워크플로우

## 목표
RFP 업로드 후 AI가 추출한 서버 장비 리스트를 기반으로, 관리자가 각 서버의 부품을 자동/수동으로 구성하여 견적을 생성하는 통합 워크플로우.

## 현재 문제
- "서버 조립" 메뉴가 RFP와 연결되지 않은 독립 페이지
- 견적 생성이 자동으로만 가능하고 수동 부품 선택 불가
- RFP에서 추출된 서버 목록을 기반으로 단계별 구성 UI 없음

## 구현 범위

### 1. 메뉴 구조 변경
- "서버 조립" → 삭제 (서버 구성에 통합)
- "견적 생성" → "서버 구성" (RFP 기반 단계별 선택)

### 2. 서버 구성 시작 페이지 `/quotation/configure`
- RFP 파싱 결과에서 서버 목록 카드 표시
- 각 서버: 이름, 수량, 요구 스펙 요약
- "자동 구성" / "수동 구성" 선택

### 3. 수동 구성 6단계 위저드
Step 1: 베이스 서버 (섀시 + 메인보드)
Step 2: CPU (소켓 호환 필터)
Step 3: 메모리 (DDR 타입 필터 + 슬롯 시각화)
Step 4: 스토리지 (드라이브 베이 + RAID)
Step 5: 확장 카드 (GPU, NIC, RAID, HBA + PCIe 슬롯)
Step 6: PSU + 전체 요약 + 견적 추가

### 4. 자동 구성 강화
- auto-assembler.ts 실행 → 결과를 수동 구성 UI로 표시
- 관리자가 개별 부품 수동 오버라이드 가능

### 5. 비교 + 견적 확정
- 모든 서버 구성 완료 후 3가지 전략 비교
- 견적서 생성 → quotation-history

## 관련 파일
- `app/(dashboard)/quotation/configure/page.tsx` (신규)
- `app/(dashboard)/quotation/configure/[rfpId]/[configIndex]/page.tsx` (신규)
- `app/api/assembly/auto/route.ts` (신규)
- `app/api/assembly/compatible-parts/route.ts` (신규)
- `lib/assembly/auto-assembler.ts` (기존 강화)
- `lib/assembly/slot-tracker.ts` (기존 활용)
- `lib/assembly/dimm-optimizer.ts` (기존 활용)
- `app/(dashboard)/layout.tsx` (메뉴 변경)

## 검증
- Playwright E2E: RFP 업로드 → 서버 목록 → 수동 구성 6단계 → 견적 생성
