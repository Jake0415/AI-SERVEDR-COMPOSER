# Task 097: quotations 테이블 확장 + Draft API

## 목표
견적 작성 중간 데이터를 DB에 저장하여 작성 중단/재개 지원

## 상세
- quotations 테이블에 source, source_data 컬럼 추가
- POST /api/quotation/draft — 초안 자동 생성
- PUT /api/quotation/[id]/draft — 초안 업데이트
- GET /api/quotation?status=draft — 미완성 초안 목록

## 수락 기준
- [ ] source 컬럼으로 견적 생성 경로 추적
- [ ] source_data에 중간 데이터 JSONB 저장
- [ ] draft API CRUD 동작
