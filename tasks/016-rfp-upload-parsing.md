# Task 016: RFP 업로드 및 AI 파싱 구현 (F003, F004)

## 상태
- [x] ✅ 완료

## 개요
RFP 파일 업로드 API와 AI 파싱 엔진을 구현합니다. Supabase Storage를 활용한 파일 저장,
PDF/HWP/DOCX 텍스트 추출, OpenAI GPT-4o 연동을 통한 요구사항 자동 추출을 포함합니다.

## 관련 PRD 기능
- [F003] RFP 업로드
- [F004] RFP AI 파싱

## 관련 파일
- `app/api/rfp/upload/route.ts` — 파일 업로드 API
- `app/api/rfp/route.ts` — RFP 목록 조회 API
- `app/api/rfp/[id]/route.ts` — RFP 삭제 API
- `app/api/rfp/[id]/requirements/route.ts` — 파싱 결과 수정 API
- `lib/parsers/pdf-parser.ts` — PDF 텍스트 추출
- `lib/parsers/docx-parser.ts` — DOCX 텍스트 추출
- `lib/parsers/hwp-parser.ts` — HWP 파일 처리
- `lib/ai/rfp-analyzer.ts` — OpenAI GPT-4o RFP 분석

## 수락 기준
- [ ] RFP 파일 업로드가 Supabase Storage에 저장됨
- [ ] PDF/HWP/DOCX 파일 유효성 검증이 동작함
- [ ] AI 파싱으로 RFP 요구사항이 자동 추출됨
- [ ] 파싱 상태가 올바르게 관리됨 (uploaded → parsing → parsed/error)
- [ ] 추출 결과 수동 수정이 동작함
- [ ] RFP 업로드 페이지가 실제 API와 연동됨

## 구현 단계
- [ ] Supabase Storage 활용 파일 저장 구현
- [ ] PDF/HWP/DOCX 파일 유효성 검증 구현
- [ ] `POST /api/rfp/upload` 파일 업로드 및 RFP 레코드 생성 API 구현
- [ ] `GET /api/rfp` RFP 목록 조회 API 구현
- [ ] `DELETE /api/rfp/[id]` RFP 삭제 API 구현
- [ ] `pdf-parse`로 PDF 텍스트 추출 구현
- [ ] `mammoth`로 DOCX 텍스트 추출 구현
- [ ] HWP 파일 처리 방안 구현
- [ ] OpenAI GPT-4o API 연동 - RFP 요구사항 추출 프롬프트 설계
- [ ] 파싱 결과 JSON 구조화 및 저장
- [ ] 파싱 상태 관리 구현 (uploaded → parsing → parsed/error)
- [ ] `PUT /api/rfp/[id]/requirements` 추출 결과 수동 수정 API 구현
- [ ] RFP 업로드 페이지 더미 데이터를 실제 API로 교체
- [ ] AI 파싱 정확도 테스트

## 테스트 체크리스트
- [ ] 파일 업로드 및 Storage 저장 확인
- [ ] 파일 유효성 검증 (잘못된 형식 업로드 차단)
- [ ] PDF/DOCX 텍스트 추출 정확성 확인
- [ ] AI 파싱 결과 JSON 구조 확인
- [ ] 파싱 상태 전이 확인
- [ ] 수동 수정 API 동작 확인

## 참고사항
Task 009에서 구현한 UI와 연동합니다.
OpenAI API 키가 환경 변수에 설정되어 있어야 합니다.
HWP 파일 처리는 서버 사이드 라이브러리 또는 외부 변환 서비스를 검토합니다.
