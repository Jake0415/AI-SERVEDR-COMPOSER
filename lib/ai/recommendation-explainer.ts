// ============================================================
// AI 추천 설명 생성 — 견적안별 추천 근거 자연어 생성
// ============================================================

import "server-only";

import { requestStructuredJson } from "./openai-client";
import { getPrompt } from "./prompt-loader";
import { DEFAULT_PROMPTS } from "./default-prompts";
import type { ParsedServerConfig, QuotationDraft, RecommendationText } from "@/lib/types/ai";

interface RecommendationInput {
  requirements: ParsedServerConfig[];
  profitability: QuotationDraft;
  spec_match: QuotationDraft;
  performance: QuotationDraft;
}

interface RecommendationOutput {
  profitability: RecommendationText;
  spec_match: RecommendationText;
  performance: RecommendationText;
}

/**
 * 3가지 견적안에 대한 AI 추천 설명을 생성
 */
export async function generateRecommendations(
  input: RecommendationInput & { tenantId?: string },
): Promise<RecommendationOutput> {
  const userContent = JSON.stringify({
    rfp_requirements: input.requirements,
    quotations: {
      profitability: summarizeDraft(input.profitability),
      spec_match: summarizeDraft(input.spec_match),
      performance: summarizeDraft(input.performance),
    },
  });

  const prompt = input.tenantId
    ? await getPrompt("recommendation", input.tenantId)
    : null;

  const systemPrompt = prompt?.systemPrompt ?? DEFAULT_PROMPTS["recommendation"].systemPrompt;

  const result = await requestStructuredJson(
    systemPrompt,
    userContent,
    (raw: string) => {
      const parsed = JSON.parse(raw) as RecommendationOutput;
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

/** 견적안을 LLM 입력용으로 요약 */
function summarizeDraft(draft: QuotationDraft) {
  return {
    type: draft.quotation_type,
    total_cost: draft.total_cost,
    total_supply: draft.total_supply,
    margin_rate: draft.margin_rate,
    configs: draft.configs.map((c) => ({
      name: c.config_name,
      quantity: c.quantity,
      parts: c.parts.map((p) => ({
        category: p.category,
        model: p.model_name,
        manufacturer: p.manufacturer,
        quantity: p.quantity,
        supply_price: p.unit_supply_price,
      })),
    })),
  };
}
