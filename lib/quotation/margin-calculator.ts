// ============================================================
// 마진 계산 & 목표 마진 역산
// ============================================================

import type { QuotationDraft, MatchedPart } from "@/lib/types/ai";

/** 마진 시뮬레이션 입력 */
export interface MarginSimulationInput {
  /** 부품별 마진율 조정 (part_id → 새 마진율 %) */
  adjustments: Map<string, number>;
  /** 목표 전체 마진율 (%) */
  target_margin_rate?: number;
}

/** 마진 시뮬레이션 결과 */
export interface MarginSimulationResult {
  original_margin: number;
  original_margin_rate: number;
  adjusted_margin: number;
  adjusted_margin_rate: number;
  adjusted_parts: MatchedPart[];
}

/**
 * 부품별 마진율을 조정하여 시뮬레이션
 */
export function simulateMargin(
  draft: QuotationDraft,
  input: MarginSimulationInput,
): MarginSimulationResult {
  const allParts = draft.configs.flatMap((c) =>
    c.parts.map((p) => ({ ...p, config_quantity: c.quantity })),
  );

  const adjustedParts: (MatchedPart & { config_quantity: number })[] = allParts.map((part) => {
    const newMarginRate = input.adjustments.get(part.part_id);
    if (newMarginRate == null) return part;

    // 새 마진율로 공급가 재계산: supply = cost / (1 - margin_rate/100)
    const newSupplyPrice = part.unit_cost_price / (1 - newMarginRate / 100);

    return {
      ...part,
      unit_supply_price: Math.round(newSupplyPrice),
    };
  });

  const totalCost = adjustedParts.reduce(
    (sum, p) => sum + p.unit_cost_price * p.quantity * p.config_quantity,
    0,
  );
  const totalSupply = adjustedParts.reduce(
    (sum, p) => sum + p.unit_supply_price * p.quantity * p.config_quantity,
    0,
  );

  return {
    original_margin: draft.total_margin,
    original_margin_rate: draft.margin_rate,
    adjusted_margin: totalSupply - totalCost,
    adjusted_margin_rate: totalSupply > 0
      ? Math.round(((totalSupply - totalCost) / totalSupply) * 10000) / 100
      : 0,
    adjusted_parts: adjustedParts,
  };
}

/**
 * 목표 마진율을 달성하기 위한 균등 마진율 역산
 * @param draft - 현재 견적안
 * @param targetMarginRate - 목표 마진율 (%)
 * @returns 모든 부품에 적용해야 할 균등 마진율
 */
export function reverseCalculateMarginRate(
  draft: QuotationDraft,
  targetMarginRate: number,
): number {
  // 목표 마진율 = (전체 공급가 - 전체 원가) / 전체 공급가 * 100
  // 전체 공급가 = 전체 원가 / (1 - 목표 마진율/100)
  // 각 부품의 균등 마진율 ≈ 목표 마진율 (단순화)
  return Math.max(0, Math.min(100, targetMarginRate));
}
