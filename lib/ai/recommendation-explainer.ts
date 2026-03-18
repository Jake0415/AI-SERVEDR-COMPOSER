// ============================================================
// AI 추천 설명 생성 — 견적안별 추천 근거 자연어 생성
// ============================================================

import "server-only";

import { requestStructuredJson } from "./openai-client";
import type { ParsedServerConfig, QuotationDraft, RecommendationText } from "@/lib/types/ai";

const SYSTEM_PROMPT = `당신은 서버 하드웨어 구성 컨설턴트입니다.
고객에게 제안할 견적안의 추천 근거를 작성합니다.

## 규칙
1. 각 견적안별 2-3문장으로 추천 이유를 작성하세요.
2. 경쟁 우위 포인트를 반드시 포함하세요.
3. 가격 대비 성능(가성비) 관점을 포함하세요.
4. 한국어, 비즈니스 톤으로 작성하세요.
5. 구체적인 모델명과 수치를 언급하세요.

## 출력 스키마
{
  "profitability": {
    "summary": "수익성 중심안 요약 (2-3문장)",
    "pros": ["장점1", "장점2"],
    "cons": ["단점1"],
    "selling_points": ["고객 제안 포인트1", "포인트2"]
  },
  "spec_match": { ... 동일 구조 ... },
  "performance": { ... 동일 구조 ... }
}`;

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
  input: RecommendationInput,
): Promise<RecommendationOutput> {
  const userContent = JSON.stringify({
    rfp_requirements: input.requirements,
    quotations: {
      profitability: summarizeDraft(input.profitability),
      spec_match: summarizeDraft(input.spec_match),
      performance: summarizeDraft(input.performance),
    },
  });

  const result = await requestStructuredJson(
    SYSTEM_PROMPT,
    userContent,
    (raw: string) => {
      const parsed = JSON.parse(raw) as RecommendationOutput;
      return parsed;
    },
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
