---
id: "070-C"
title: "전략 비교 + 견적 확정"
status: "planned"
priority: "high"
phase: "7"
estimated_effort: "1d"
dependencies: ["070-B", "017", "018"]
---

# Task 070-C: 전략 비교 + 견적 확정

## 목표
모든 서버 구성이 완료된 후, 3가지 전략(수익성/규격/성능)으로 비교하고 최종 견적을 확정하는 화면.

## 구현 범위

### 1. 비교 화면 `/quotation/configure/[rfpId]/compare`
- 모든 서버 구성 결과를 종합
- 3가지 전략별 탭:
  - **수익성 중심**: 마진율 최대화 부품 조합
  - **규격 충족**: RFP 요구사항 정확 매칭
  - **성능 향상**: 스펙 20~30% 상향

### 2. 비교 테이블
- 서버별: 총 원가, 공급가, 마진율
- 부품별: 선택된 모델, 가격 비교
- 3가지 전략 간 가격 차이 시각화

### 3. 견적 확정
- 전략 선택 → "견적서 생성" 버튼
- 거래처 선택 (기존 거래처 목록)
- `POST /api/quotation` 호출
- `quotations` + `quotation_items` DB 저장
- 완료 → `/quotation-history` 이동

### 4. AI 추천 텍스트
- 기존 `recommendation-explainer.ts` 활용
- 각 전략별 장단점 + 제안 포인트 표시

## 관련 파일
- `app/(dashboard)/quotation/configure/[rfpId]/compare/page.tsx` (신규)
- `lib/quotation/matching-engine.ts` (기존 활용)
- `lib/ai/recommendation-explainer.ts` (기존 활용)
- `app/api/quotation/route.ts` (기존 활용)

## 검증
- Playwright: 모든 서버 구성 완료 → 비교 화면 → 전략 선택 → 견적 생성 → 이력 확인
