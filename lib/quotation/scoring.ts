// ============================================================
// 3가지 견적안 스코어링 전략
// ============================================================

import type { Part, PartPrice } from "@/lib/types";

/** 스코어링에 사용되는 부품+가격 조합 */
export interface ScoringCandidate {
  part: Part;
  price: PartPrice;
  spec_match_ratio: number;
  performance_uplift: number;
}

/** 스코어링 결과 */
export interface ScoringResult {
  candidate: ScoringCandidate;
  score: number;
  breakdown: Record<string, number>;
}

// --- 수익성 중심 스코어링 ---

/**
 * 수익성 중심안: 마진율 최우선
 * score = margin_rate × 0.50 + spec_match × 0.30 + availability × 0.10 + reliability × 0.10
 */
export function scoreProfitability(candidate: ScoringCandidate): ScoringResult {
  const marginRate = calculateMarginRate(candidate.price);
  const specMatch = candidate.spec_match_ratio;
  const availability = 80; // 기본값 (재고 연동 시 업데이트)
  const reliability = getManufacturerReliability(candidate.part.manufacturer);

  const breakdown = {
    margin_rate: marginRate * 0.50,
    spec_match: specMatch * 0.30,
    availability: availability * 0.10,
    reliability: reliability * 0.10,
  };

  return {
    candidate,
    score: Object.values(breakdown).reduce((a, b) => a + b, 0),
    breakdown,
  };
}

// --- 규격 충족 스코어링 ---

/**
 * 규격 충족안: 스펙 일치도 최우선
 * score = spec_match × 0.60 + reliability × 0.20 + margin_rate × 0.10 + availability × 0.10
 * 오버스펙 150%↑ 페널티, 100~110% 보너스
 */
export function scoreSpecMatch(candidate: ScoringCandidate): ScoringResult {
  let specMatch = candidate.spec_match_ratio;

  // 정확 매칭 보너스: 100~110% 범위
  if (specMatch >= 100 && specMatch <= 110) {
    specMatch += 20;
  }
  // 오버스펙 페널티: 150% 이상
  if (candidate.performance_uplift > 50) {
    specMatch -= 10;
  }
  specMatch = Math.max(0, Math.min(120, specMatch));

  const marginRate = calculateMarginRate(candidate.price);
  const availability = 80;
  const reliability = getManufacturerReliability(candidate.part.manufacturer);

  const breakdown = {
    spec_match: specMatch * 0.60,
    reliability: reliability * 0.20,
    margin_rate: marginRate * 0.10,
    availability: availability * 0.10,
  };

  return {
    candidate,
    score: Object.values(breakdown).reduce((a, b) => a + b, 0),
    breakdown,
  };
}

// --- 성능 향상 스코어링 ---

/**
 * 성능 향상안: 요구 대비 10~30% 업스펙
 * score = performance_uplift × 0.50 + price_performance × 0.25 + future_proof × 0.15 + margin × 0.10
 */
export function scorePerformance(candidate: ScoringCandidate): ScoringResult {
  const uplift = candidate.performance_uplift;
  // 15~30% 업스펙이 이상적
  const upliftScore = uplift >= 15 && uplift <= 30
    ? 100
    : uplift > 30
      ? Math.max(0, 100 - (uplift - 30) * 2) // 30% 초과 시 감점
      : uplift * (100 / 15); // 15% 미만 시 비례

  // 가성비: 성능 향상 / 가격 증가 비율
  const pricePerformance = uplift > 0 ? Math.min(100, uplift * 3) : 50;

  // 미래 확장성: 최신 세대 부품 보너스
  const futurePoof = candidate.spec_match_ratio > 100 ? 80 : 50;

  const marginRate = calculateMarginRate(candidate.price);

  const breakdown = {
    performance_uplift: upliftScore * 0.50,
    price_performance: pricePerformance * 0.25,
    future_proof: futurePoof * 0.15,
    margin_rate: marginRate * 0.10,
  };

  return {
    candidate,
    score: Object.values(breakdown).reduce((a, b) => a + b, 0),
    breakdown,
  };
}

// --- 유틸리티 ---

/** 마진율 계산 (0~100 스케일) */
function calculateMarginRate(price: PartPrice): number {
  if (price.supply_price <= 0) return 0;
  const margin = price.supply_price - price.cost_price;
  const rate = (margin / price.supply_price) * 100;
  return Math.max(0, Math.min(100, rate));
}

/** 제조사 신뢰도 점수 (0~100) */
function getManufacturerReliability(manufacturer: string): number {
  const tier1 = ["intel", "amd", "nvidia", "samsung", "sk hynix", "micron", "broadcom", "dell", "hpe", "lenovo"];
  const tier2 = ["supermicro", "asus", "gigabyte", "mellanox", "western digital", "seagate", "kingston"];

  const name = manufacturer.toLowerCase();
  if (tier1.some((t) => name.includes(t))) return 95;
  if (tier2.some((t) => name.includes(t))) return 85;
  return 70;
}

/** 견적 유형별 스코어링 함수 선택 */
export function getScorer(quotationType: "profitability" | "spec_match" | "performance") {
  switch (quotationType) {
    case "profitability":
      return scoreProfitability;
    case "spec_match":
      return scoreSpecMatch;
    case "performance":
      return scorePerformance;
  }
}
