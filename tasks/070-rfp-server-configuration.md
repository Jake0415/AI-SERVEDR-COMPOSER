---
id: "070-A"
title: "서버 구성 시작 페이지 + RFP 연결"
status: "completed"
priority: "high"
phase: "7"
estimated_effort: "2d"
dependencies: ["016", "017", "074"]
---

> ℹ️ **재분류**: 이 Task는 독립적인 견적 생성 방식이 아닌 **시나리오 1(RFP 기반 견적)의 하위 프로세스**로 재분류되었습니다. RFP 기반 견적 생성 후 서버별 부품을 수동으로 세부 조정하는 선택적 단계입니다. Task 074(견적 생성 허브)에 의존합니다.

# Task 070-A: 서버 구성 시작 페이지 + RFP 연결

## 현재 구현 상태

- ✅ `/quotation/configure` 페이지 UI 구현 (RFP 목록 카드, 자동/수동 구성 버튼)
- ✅ `/api/assembly/compatible-parts` 호환 부품 조회 API 존재
- ✅ 거래처 선택 우선 흐름 적용 (`customer_id` URL 파라미터 전달)
- ⚠️ 전체 워크플로우 통합 테스트 미완료

## 목표
RFP 파싱 결과에서 추출된 서버 장비 리스트를 카드로 표시하고, 각 서버에 대해 자동/수동 구성을 선택할 수 있는 시작 페이지.

## 구현 범위

### 1. 서버 구성 시작 페이지 `/quotation/configure`
- RFP 목록에서 선택 → `?rfp_id=xxx`로 이동
- RFP 파싱 결과(`ParsedServerConfig[]`)를 카드 목록으로 표시
- 각 카드: 서버명, 수량, 요구 스펙 요약 (CPU 코어, 메모리 GB, 스토리지 등)
- "자동 구성" 버튼 → Task 070-B (자동 모드)
- "수동 구성" 버튼 → Task 070-B (수동 모드)
- 구성 완료/미완료 상태 표시

### 2. RFP 페이지에 "서버 구성 시작" 버튼 추가
- `/rfp` 페이지의 파싱 완료된 RFP에 "서버 구성" 링크 추가

### 3. 메뉴 구조 변경
- 사이드바 "서버 조립" → "서버 구성" (라벨 변경)
- URL: `/assembly` → `/quotation/configure`
- "견적 생성" 메뉴는 유지 (기존 자동 견적 3가지)

### 4. 호환 부품 조회 API
- `GET /api/assembly/compatible-parts?category=cpu&socket=LGA4677`
- 카테고리별 호환 부품 목록 반환 (소켓, DDR 타입 등 필터)

## 관련 파일
- `app/(dashboard)/quotation/configure/page.tsx` (신규)
- `app/api/assembly/compatible-parts/route.ts` (신규)
- `app/(dashboard)/rfp/page.tsx` (수정: 서버 구성 링크)
- `app/(dashboard)/layout.tsx` (수정: 메뉴 변경)

## 검증
- Playwright: RFP 페이지 → "서버 구성" 클릭 → 서버 카드 목록 표시
