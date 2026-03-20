# Task 086: 멀티턴 대화 API + 세션 관리 API

## 상태: [ ] 미완료

## 의존성: Task 084 (LangGraph 그래프), Task 085 (LLM 로거)

## 목표
LangGraph 기반 멀티턴 대화 API와 세션 CRUD API를 구현.
기존 `/api/chat-quotation`을 대체하는 신규 API.

## 관련 기능
- F026 (AI 대화형 견적 생성)
- F051 (AI 대화 세션 관리)
- F052 (LLM 비용/토큰 추적)

## 구현 단계

### 1. 멀티턴 대화 API (`app/api/quotation/chat/route.ts`)

**POST 요청:**
```typescript
{
  message: string;
  threadId?: string;    // 없으면 새 세션 생성
  mode?: "free" | "guide";
  customerId?: string;
}
```

**처리 흐름:**
1. 인증 확인 (getCurrentUser)
2. threadId 없으면 → ai_chat_sessions INSERT + threadId 생성
3. DB에서 프롬프트 로드 (prompt-loader.ts 재사용)
4. LangGraph 실행 (체크포인터가 이전 대화 자동 복원)
5. ai_chat_messages INSERT (user 메시지 + assistant 응답)
6. ai_chat_sessions.message_count 업데이트
7. llm_api_calls 자동 기록 (llm-logger.ts)

**POST 응답:**
```typescript
{
  success: true,
  data: {
    reply: string;
    specs: ParsedServerConfig[] | null;
    isComplete: boolean;
    suggestedQuestions: string[];
    threadId: string;
    usage: { promptTokens, completionTokens, totalTokens };
  }
}
```

### 2. 세션 목록 API (`app/api/quotation/chat/sessions/route.ts`)

**GET:** 사용자의 대화 세션 목록
- 정렬: updatedAt DESC
- 필터: status (active/completed/all)
- 반환: id, threadId, mode, status, messageCount, createdAt, updatedAt, customerName

### 3. 세션 상세 API (`app/api/quotation/chat/[sessionId]/route.ts`)

**GET:** 특정 세션의 메시지 이력 전체 조회
- 반환: 세션 정보 + messages 배열

**DELETE:** 세션 폐기 (status → abandoned)

### 4. AI 사용량 API (`app/api/ai-usage/route.ts`)

**GET:** 테넌트별 AI 사용량 집계
- 기간별 (일/주/월) 토큰 사용량
- 모델별 비용 breakdown
- 프롬프트별 호출 빈도
- 사용자별 사용량 top 5

### 5. 기존 API deprecated 처리
- `app/api/chat-quotation/route.ts` — 신규 API로 리디렉트 또는 deprecated 경고 추가

## 생성 파일
- `app/api/quotation/chat/route.ts` (기존 파일 전면 리팩터링)
- `app/api/quotation/chat/sessions/route.ts`
- `app/api/quotation/chat/[sessionId]/route.ts`
- `app/api/ai-usage/route.ts`

## 수정 파일
- `app/api/chat-quotation/route.ts` (deprecated)

## 수락 기준
- [ ] POST /api/quotation/chat → LangGraph 실행 → 응답 정상
- [ ] threadId로 이전 대화 이어가기 성공
- [ ] GET /api/quotation/chat/sessions → 세션 목록 반환
- [ ] GET /api/quotation/chat/[sessionId] → 메시지 이력 반환
- [ ] GET /api/ai-usage → 토큰/비용 집계 반환
- [ ] ai_chat_messages, llm_api_calls 테이블에 데이터 정상 기록
- [ ] npm run build 성공
