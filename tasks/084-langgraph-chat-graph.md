# Task 084: LangGraph 대화 그래프 구현

## 상태: [ ] 미완료

## 의존성: Task 083 완료 필요

## 목표
LangGraph StateGraph 기반 멀티턴 대화 워크플로우 구현.
3개 노드(사양추출, 완료판단, 응답생성) + PostgreSQL 체크포인터로 대화 상태 자동 관리.

## 관련 기능
- F026 (AI 대화형 견적 생성)
- F051 (AI 대화 세션 관리)

## 아키텍처

```
[사용자 메시지]
    |
    v
__start__ → extractSpecs → evaluateCompleteness → generateReply → END
              (LLM 1회)       (로직만)              (LLM 1회)
    |
    v
[PostgreSQL Checkpointer] ← thread_id별 상태 자동 저장/복원
```

## 구현 단계

### 1. State 정의 (`lib/ai/graph/state.ts`)
```typescript
QuotationChatState = {
  messages: BaseMessage[],          // LangGraph messagesStateReducer
  currentSpecs: ParsedServerConfig[], // 누적 사양
  mode: "free" | "guide",
  isComplete: boolean,
  reply: string,
  suggestedQuestions: string[],
  systemPrompt: string,             // DB에서 로드
}
```

### 2. extractSpecs 노드 (`lib/ai/graph/nodes/extract-specs.ts`)
- ChatOpenAI + StructuredOutput으로 사양 추출
- 기존 사양(currentSpecs)과 병합 (누적 업데이트)
- DB 프롬프트 로드: `getPrompt("chat-quotation")` 재사용

### 3. evaluateCompleteness 노드 (`lib/ai/graph/nodes/evaluate-completeness.ts`)
- LLM 호출 없이 로직만으로 판단
- 필수 사양 체크: CPU, 메모리, 스토리지 최소 1개 이상
- 부족하면 isComplete=false + 누락 항목 목록 생성

### 4. generateReply 노드 (`lib/ai/graph/nodes/generate-reply.ts`)
- ChatOpenAI로 사용자 응답 생성
- 가이드 모드: 다음 단계 질문 포함
- isComplete=true면 확정 안내 메시지

### 5. 그래프 조립 (`lib/ai/graph/quotation-chat-graph.ts`)
- StateGraph 조립 + compile

### 6. PostgreSQL 체크포인터 (`lib/ai/graph/checkpointer.ts`)
- `@langchain/langgraph-checkpoint-postgres` PostgresSaver
- DATABASE_URL 기반 싱글톤
- public 스키마에 체크포인트 테이블 자동 생성

## 생성 파일
- `lib/ai/graph/state.ts`
- `lib/ai/graph/nodes/extract-specs.ts`
- `lib/ai/graph/nodes/evaluate-completeness.ts`
- `lib/ai/graph/nodes/generate-reply.ts`
- `lib/ai/graph/quotation-chat-graph.ts`
- `lib/ai/graph/checkpointer.ts`

## 수락 기준
- [ ] StateGraph 정상 컴파일
- [ ] 체크포인터 DB 연결 성공
- [ ] 단일 메시지 → 3노드 순차 실행 → 응답 반환 확인
- [ ] thread_id로 이전 대화 상태 복원 확인
- [ ] npm run build 성공
