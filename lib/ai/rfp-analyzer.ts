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
      const parsed = JSON.parse(raw);
      // 새 프롬프트: { project_name, equipment_list: [...] }
      // 기존 프롬프트: { configs: [...] }
      return parsed;
    },
    prompt ? {
      model: prompt.modelName,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
    } : undefined,
  );

  return result;
}
