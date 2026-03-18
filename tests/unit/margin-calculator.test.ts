// ============================================================
// 마진 시뮬레이션 단위 테스트
// ============================================================

import { describe, it, expect } from "vitest";
import {
  simulateMargin,
  reverseCalculateMarginRate,
} from "@/lib/quotation/margin-calculator";
import type { QuotationDraft } from "@/lib/types/ai";

function createMockDraft(overrides?: Partial<QuotationDraft>): QuotationDraft {
  return {
    quotation_type: "profitability",
    configs: [
      {
        config_name: "테스트 서버",
        quantity: 1,
        parts: [
          {
            category: "CPU",
            part_id: "p1",
            model_name: "Xeon Gold 6430",
            manufacturer: "Intel",
            specs: {},
            quantity: 2,
            unit_cost_price: 3000000,
            unit_supply_price: 4000000,
            match_score: 90,
            match_reason: "스펙 일치",
          },
          {
            category: "메모리",
            part_id: "p2",
            model_name: "DDR5 64GB",
            manufacturer: "Samsung",
            specs: {},
            quantity: 4,
            unit_cost_price: 500000,
            unit_supply_price: 700000,
            match_score: 85,
            match_reason: "용량 일치",
          },
        ],
        subtotal_cost: 8000000,
        subtotal_supply: 10800000,
        subtotal_margin: 2800000,
        margin_rate: 25.93,
      },
    ],
    total_cost: 8000000,
    total_supply: 10800000,
    total_margin: 2800000,
    margin_rate: 25.93,
    ...overrides,
  };
}

describe("simulateMargin", () => {
  it("조정 없이 원본 마진을 반환한다", () => {
    const draft = createMockDraft();
    const result = simulateMargin(draft, { adjustments: new Map() });

    expect(result.original_margin).toBe(2800000);
    expect(result.adjusted_margin).toBe(2800000);
  });

  it("부품별 마진율 조정이 반영된다", () => {
    const draft = createMockDraft();
    const adjustments = new Map([["p1", 30]]); // CPU 마진율을 30%로 조정

    const result = simulateMargin(draft, { adjustments });

    // CPU 공급가: 3000000 / (1 - 0.3) = 4285714 (반올림)
    expect(result.adjusted_margin).not.toBe(result.original_margin);
    expect(result.adjusted_margin_rate).toBeGreaterThan(0);
  });
});

describe("reverseCalculateMarginRate", () => {
  it("목표 마진율을 0~100 사이로 클램핑한다", () => {
    const draft = createMockDraft();

    expect(reverseCalculateMarginRate(draft, 150)).toBe(100);
    expect(reverseCalculateMarginRate(draft, -10)).toBe(0);
    expect(reverseCalculateMarginRate(draft, 25)).toBe(25);
  });
});
