import "server-only";
import postgres from "postgres";

// 모델별 토큰 가격 (USD per 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-4": { input: 30.0, output: 60.0 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
};

function calculateCost(
  modelName: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = MODEL_PRICING[modelName] ?? MODEL_PRICING["gpt-4o-mini"];
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

export interface LogLLMCallParams {
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

export async function logLLMCall(params: LogLLMCallParams): Promise<void> {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
    const totalTokens = params.promptTokens + params.completionTokens;
    const estimatedCost = calculateCost(
      params.modelName,
      params.promptTokens,
      params.completionTokens,
    );

    await sql`INSERT INTO ai_server_composer.llm_api_calls
      (tenant_id, user_id, session_id, prompt_slug, model_name,
       prompt_tokens, completion_tokens, total_tokens, estimated_cost,
       latency_ms, request_summary, response_summary, status, error_message)
      VALUES (
        ${params.tenantId}, ${params.userId ?? null}, ${params.sessionId ?? null},
        ${params.promptSlug}, ${params.modelName},
        ${params.promptTokens}, ${params.completionTokens}, ${totalTokens},
        ${estimatedCost.toFixed(6)},
        ${params.latencyMs}, ${params.requestSummary ?? null},
        ${params.responseSummary ?? null}, ${params.status},
        ${params.errorMessage ?? null}
      )`;
    await sql.end();
  } catch {
    // 로깅 실패가 메인 기능을 중단시키면 안 됨
    console.error("[llm-logger] Failed to log LLM call");
  }
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMResult<T> {
  data: T;
  usage: LLMUsage;
  latencyMs: number;
}
