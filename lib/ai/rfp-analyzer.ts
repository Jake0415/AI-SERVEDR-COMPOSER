// ============================================================
// RFP AI 파싱 — GPT-4o로 RFP 문서에서 서버 요구사항 추출
// ============================================================

import "server-only";

import { requestStructuredJson } from "./openai-client";
import { getPrompt } from "./prompt-loader";
import { DEFAULT_PROMPTS } from "./default-prompts";

/**
 * RFP 텍스트를 분석하여 구조화된 서버 구성 요구사항을 추출
 * @param rfpText - RFP 문서에서 추출된 텍스트
 * @param tenantId - 테넌트 ID (프롬프트 로딩용)
 * @returns 파싱된 결과 (equipment_list 또는 configs 구조)
 */
export async function analyzeRfpDocument(
  rfpText: string,
  tenantId?: string,
): Promise<unknown> {
  if (!rfpText.trim()) {
    throw new Error("RFP 텍스트가 비어있습니다.");
  }

  const prompt = tenantId
    ? await getPrompt("rfp-equipment-parser", tenantId)
    : null;

  const systemPrompt = prompt?.systemPrompt ?? DEFAULT_PROMPTS["rfp-equipment-parser"].systemPrompt;

  const result = await requestStructuredJson(
    systemPrompt,
    rfpText,
    (raw: string) => {
      try {
        return JSON.parse(raw);
      } catch {
        // JSON이 잘린 경우 마지막 완전한 객체까지 파싱 시도
        const lastBrace = raw.lastIndexOf("}");
        if (lastBrace > 0) {
          return JSON.parse(raw.substring(0, lastBrace + 1));
        }
        throw new Error("LLM 응답이 유효한 JSON이 아닙니다.");
      }
    },
    {
      model: prompt?.modelName ?? undefined,
      temperature: prompt?.temperature ?? 0.1,
      maxTokens: prompt?.maxTokens ?? 8192,
    },
  );

  return result;
}
