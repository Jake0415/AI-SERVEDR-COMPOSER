# Task 077: AI 프롬프트 관리 시스템

## 상태: [x] 완료

## 목표
LLM에 전달되는 시스템 프롬프트를 DB에 저장하고, 설정 UI에서 CRUD 관리할 수 있도록 구현.
기존 하드코딩된 프롬프트를 DB 기반으로 전환하여 코드 재배포 없이 프롬프트 수정 가능.

## 구현 내용

### DB
- `ai_prompts` 테이블 추가 (lib/db/schema.ts)
- 컬럼: slug, name, description, category, systemPrompt, outputSchema, modelName, temperature, maxTokens, isActive, isSystem, version

### API
- `GET/POST /api/prompts` — 목록 조회 (category 필터), 신규 추가
- `GET/PUT/DELETE /api/prompts/[id]` — 단건 조회, 수정 (version +1), 삭제 (isSystem 차단)

### 프롬프트 로더
- `lib/ai/prompt-loader.ts` — `getPrompt(slug, tenantId)` DB 조회 → 폴백
- `lib/ai/default-prompts.ts` — 기본 프롬프트 상수 (폴백용)

### AI 모듈 리팩터링
- `lib/ai/openai-client.ts` — `requestStructuredJson`에 옵션 파라미터 추가
- `lib/ai/rfp-analyzer.ts` — `getPrompt("rfp-analyzer")` 사용
- `app/api/chat-quotation/route.ts` — `getPrompt("chat-quotation")` 사용
- `lib/ai/recommendation-explainer.ts` — `getPrompt("recommendation")` 사용

### UI
- `app/(dashboard)/settings/prompts/page.tsx` — 프롬프트 관리 페이지
- 기능: 목록 카드, 편집 모달, 복제, 삭제(시스템 차단), 활성 토글

### 시드 데이터
- 3개 시스템 프롬프트: rfp-analyzer, chat-quotation, recommendation

## 수락 기준
- [x] 설정 > AI 프롬프트 관리에서 3개 시스템 프롬프트 표시
- [x] 프롬프트 수정 시 version 자동 증가
- [x] 시스템 프롬프트 삭제 차단
- [x] 신규 프롬프트 추가/복제 가능
- [x] DB 프롬프트가 AI 분석에 실제 적용됨
- [x] npm run build 성공
