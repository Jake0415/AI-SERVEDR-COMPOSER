---
id: "082-B"
title: "IT 인프라 장비 엑셀 템플릿 + 대량 업로드"
priority: high
status: in-progress
phase: 9
features: ["F050"]
---

# Task 082-B: IT 인프라 장비 엑셀 템플릿 + 대량 업로드

## 배경

RFP 기반으로 IT 인프라 장비를 엑셀로 대량 등록할 수 있는 기능 필요.
서버 파트용 엑셀 API는 이미 존재하며, 동일 패턴을 IT 인프라 장비에 적용.

## 수락 기준

- [ ] 엑셀 템플릿 다운로드 API (`/api/equipment-products/excel-template`)
- [ ] 엑셀 업로드 API (`/api/equipment-products/excel-upload`)
- [ ] 장비코드(문자열) → equipmentCodeId(UUID) 자동 매핑
- [ ] CPU/메모리/디스크 등 스펙 컬럼 → specs jsonb 변환
- [ ] equipment-tab에 엑셀 관리 DropdownMenu 추가
- [ ] RFP 기반 샘플 데이터 16행 포함
- [ ] 빌드 에러 없음

## 수정 파일

| 파일 | 작업 |
|------|------|
| `app/api/equipment-products/excel-template/route.ts` | 신규: 템플릿 생성 API |
| `app/api/equipment-products/excel-upload/route.ts` | 신규: 업로드 파싱 API |
| `app/(dashboard)/parts/_components/equipment-tab.tsx` | 엑셀 관리 버튼 추가 |
