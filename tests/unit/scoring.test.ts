// ============================================================
// 견적 스코어링 단위 테스트
// ============================================================

import { describe, it, expect } from "vitest";
import {
  scoreProfitability,
  scoreSpecMatch,
  scorePerformance,
  getScorer,
} from "@/lib/quotation/scoring";
import type { ScoringCandidate } from "@/lib/quotation/scoring";

function createCandidate(overrides?: Partial<ScoringCandidate>): ScoringCandidate {
  return {
    part: {
      id: "p1",
      tenant_id: "t1",
      category_id: "c1",
      model_name: "Xeon Gold 6430",
      manufacturer: "Intel",
      specs: {},
      is_deleted: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
    },
    price: {
      id: "pr1",
      part_id: "p1",
      list_price: 5000000,
      market_price: 4500000,
      cost_price: 3500000,
      supply_price: 4200000,
    },
    spec_match_ratio: 95,
    performance_uplift: 10,
    ...overrides,
  };
}

describe("scoreProfitability", () => {
  it("마진율이 높을수록 높은 점수를 반환한다", () => {
    const highMargin = createCandidate({
      price: { id: "pr1", part_id: "p1", list_price: 5000000, market_price: 4500000, cost_price: 2000000, supply_price: 4200000 },
    });
    const lowMargin = createCandidate({
      price: { id: "pr2", part_id: "p1", list_price: 5000000, market_price: 4500000, cost_price: 4000000, supply_price: 4200000 },
    });

    const highResult = scoreProfitability(highMargin);
    const lowResult = scoreProfitability(lowMargin);

    expect(highResult.score).toBeGreaterThan(lowResult.score);
  });

  it("점수가 0 이상이다", () => {
    const result = scoreProfitability(createCandidate());
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe("scoreSpecMatch", () => {
  it("스펙 매칭 비율이 높을수록 높은 점수를 반환한다", () => {
    const highMatch = createCandidate({ spec_match_ratio: 100 });
    const lowMatch = createCandidate({ spec_match_ratio: 50 });

    const highResult = scoreSpecMatch(highMatch);
    const lowResult = scoreSpecMatch(lowMatch);

    expect(highResult.score).toBeGreaterThan(lowResult.score);
  });
});

describe("scorePerformance", () => {
  it("성능 향상률이 높을수록 높은 점수를 반환한다", () => {
    const highPerf = createCandidate({ performance_uplift: 50 });
    const lowPerf = createCandidate({ performance_uplift: 5 });

    const highResult = scorePerformance(highPerf);
    const lowResult = scorePerformance(lowPerf);

    expect(highResult.score).toBeGreaterThan(lowResult.score);
  });
});

describe("getScorer", () => {
  it("견적 유형별 올바른 스코어러를 반환한다", () => {
    expect(getScorer("profitability")).toBe(scoreProfitability);
    expect(getScorer("spec_match")).toBe(scoreSpecMatch);
    expect(getScorer("performance")).toBe(scorePerformance);
  });
});
