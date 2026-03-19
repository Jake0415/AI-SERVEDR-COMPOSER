// ============================================================
// RFP AI 파싱 — GPT-4o로 RFP 문서에서 서버 요구사항 추출
// ============================================================

import "server-only";

import { requestStructuredJson } from "./openai-client";
import { getPrompt } from "./prompt-loader";
import { DEFAULT_PROMPTS } from "./default-prompts";
import { rfpParsingResultSchema } from "@/lib/types/schemas";
import type { ParsedServerConfig } from "@/lib/types/ai";

/**
 * RFP 텍스트를 분석하여 구조화된 서버 구성 요구사항을 추출
 * @param rfpText - RFP 문서에서 추출된 텍스트
 * @param tenantId - 테넌트 ID (프롬프트 로딩용)
 * @returns 파싱된 서버 구성 배열
 */
export async function analyzeRfpDocument(
  rfpText: string,
  tenantId?: string,
): Promise<ParsedServerConfig[]> {
  if (!rfpText.trim()) {
    throw new Error("RFP 텍스트가 비어있습니다.");
  }

  const prompt = tenantId
    ? await getPrompt("rfp-analyzer", tenantId)
    : null;

  const systemPrompt = prompt?.systemPrompt ?? DEFAULT_PROMPTS["rfp-analyzer"].systemPrompt;

  const result = await requestStructuredJson(
    systemPrompt,
    rfpText,
    (raw: string) => {
      const parsed = JSON.parse(raw);
      const configs = parsed.configs ?? parsed;
      const validated = rfpParsingResultSchema.parse(
        Array.isArray(configs) ? configs : [configs],
      );
      return validated;
    },
    prompt ? {
      model: prompt.modelName,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
    } : undefined,
  );

  return result;
}
