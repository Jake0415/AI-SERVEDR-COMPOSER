// ============================================================
// OpenAI 클라이언트 래퍼 — 서버 전용 (server-only)
// ============================================================

import "server-only";

import OpenAI from "openai";

let clientInstance: OpenAI | null = null;

/** OpenAI 클라이언트 싱글톤 */
export function getOpenAIClient(): OpenAI {
  if (!clientInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
    }
    clientInstance = new OpenAI({ apiKey });
  }
  return clientInstance;
}

/** 사용할 모델명 */
export function getModelName(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}

/** 구조화된 JSON 응답 요청 옵션 */
export interface StructuredJsonOptions {
  model?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

/** 구조화된 JSON 응답 요청 */
export async function requestStructuredJson<T>(
  systemPrompt: string,
  userContent: string,
  parseResponse: (raw: string) => T,
  options?: StructuredJsonOptions,
): Promise<T> {
  const client = getOpenAIClient();
  const model = options?.model || getModelName();
  const temperature = options?.temperature ?? 0.1;
  const maxTokens = options?.maxTokens ?? 4096;

  const messages = options?.messages ?? [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userContent },
  ];

  const response = await client.chat.completions.create({
    model,
    messages,
    response_format: { type: "json_object" },
    temperature,
    max_tokens: maxTokens,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 응답이 비어있습니다.");
  }

  return parseResponse(content);
}
