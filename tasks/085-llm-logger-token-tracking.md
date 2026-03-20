# Task 085: LLM 호출 로거 + 토큰/비용 추적

## 상태: [ ] 미완료

## 의존성: Task 083 완료 필요 (llm_api_calls 테이블)

## 목표
모든 LLM API 호출을 자동으로 DB에 기록하고, 토큰 사용량과 비용을 추적하는 시스템 구현.

## 관련 기능
- F052 (LLM 호출 비용/토큰 추적)

## 구현 단계

### 1. LLM 로거 (`lib/ai/llm-logger.ts`)

```typescript
// 모델별 토큰 가격 (USD per 1M tokens)
const MODEL_PRICING = {
  "gpt-4o":       { input: 2.5,  output: 10.0 },
  "gpt-4o-mini":  { input: 0.15, output: 0.6  },
  "gpt-4-turbo":  { input: 10.0, output: 30.0 },
};

interface LogLLMCallParams {
  tenantId: string;
  userId?: string;
  sessionId?: string;
  promptSlug: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  requestSummary?: string;
  responseSummary?: string;
  status: "success" | "error";
  errorMessage?: string;
}

async function logLLMCall(params: LogLLMCallParams): Promise<void>
```

- 비용 자동 계산: `totalTokens * pricePerToken`
- DB 비동기 INSERT (응답 지연 방지)

### 2. OpenAI 클라이언트 개선 (`lib/ai/openai-client.ts`)

```typescript
// 기존 반환: T
// 변경 반환: LLMResult<T>
interface LLMResult<T> {
  data: T;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
}
```

- `response.usage` 수집 (현재 무시하고 있음)
- 호출 완료 시 `logLLMCall()` 자동 실행
- 기존 호출부 호환성 유지 (data 필드로 기존 값 접근)

### 3. 기존 AI 모듈 토큰 추적 추가
- `lib/ai/rfp-analyzer.ts` — logLLMCall 연동
- `lib/ai/recommendation-explainer.ts` — logLLMCall 연동

## 수정 파일
- `lib/ai/openai-client.ts` (usage 수집 + 로깅)
- `lib/ai/rfp-analyzer.ts` (호출부 업데이트)
- `lib/ai/recommendation-explainer.ts` (호출부 업데이트)

## 생성 파일
- `lib/ai/llm-logger.ts`

## 수락 기준
- [ ] LLM 호출 시 llm_api_calls 테이블에 자동 기록
- [ ] 토큰 수 정확히 수집 (promptTokens, completionTokens)
- [ ] 비용 자동 계산 (모델별 가격표 기반)
- [ ] 기존 rfp-analyzer, recommendation-explainer 정상 동작
- [ ] npm run build 성공
