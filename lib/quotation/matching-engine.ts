// ============================================================
// 부품 매칭 엔진 — RFP 요구사항 기반 부품 자동 조합 (핵심 로직)
// ============================================================

import type { Part, PartPrice, QuotationType } from "@/lib/types";
import type {
  ParsedServerConfig,
  ServerRequirements,
  MatchedPart,
  ServerConfigResult,
  QuotationDraft,
} from "@/lib/types/ai";
import type { ValidationResult } from "@/lib/types/compatibility";
import { getScorer } from "./scoring";
import type { ScoringCandidate } from "./scoring";
import { validateCompatibility } from "@/lib/compatibility/validator";
import { calculatePowerFromParts } from "@/lib/power/calculator";

/** 부품 DB에서 조회된 부품+가격 조합 */
export interface PartWithPrice {
  part: Part;
  price: PartPrice;
}

/**
 * 매칭 순서: CPU → 메인보드 → 메모리 → GPU → SSD → HDD → RAID → NIC → 섀시 → PSU
 * CPU가 소켓, DDR 타입, PCIe 버전을 결정하므로 가장 먼저 선정
 */
const MATCHING_ORDER = [
  "cpu",
  "motherboard",
  "memory",
  "gpu",
  "ssd",
  "hdd",
  "raid",
  "nic",
  "hba",
  "chassis",
  "psu",
] as const;

/**
 * 3가지 견적안을 동시에 생성
 * @param configs - RFP에서 파싱된 서버 구성 요구사항 배열
 * @param partsInventory - 부품 DB (카테고리별 부품+가격 목록)
 * @returns 수익성/규격/성능 3가지 견적안 + 호환성 검증 결과
 */
export function generateAllQuotations(
  configs: ParsedServerConfig[],
  partsInventory: Map<string, PartWithPrice[]>,
): {
  profitability: QuotationDraft;
  spec_match: QuotationDraft;
  performance: QuotationDraft;
  compatibility: ValidationResult;
} {
  const types: QuotationType[] = ["profitability", "spec_match", "performance"];

  const results = {} as Record<QuotationType, QuotationDraft>;
  let mergedCompatibility: ValidationResult = { is_valid: true, errors: [], warnings: [] };

  for (const type of types) {
    const draft = generateSingleQuotation(configs, partsInventory, type);
    results[type] = draft.quotation;

    // 호환성 결과 병합 (spec_match 기준으로 대표)
    if (type === "spec_match") {
      mergedCompatibility = draft.compatibility;
    }
  }

  return {
    profitability: results.profitability,
    spec_match: results.spec_match,
    performance: results.performance,
    compatibility: mergedCompatibility,
  };
}

/**
 * 단일 견적안 생성
 */
function generateSingleQuotation(
  configs: ParsedServerConfig[],
  partsInventory: Map<string, PartWithPrice[]>,
  quotationType: QuotationType,
): { quotation: QuotationDraft; compatibility: ValidationResult } {
  const scorer = getScorer(quotationType);
  const serverConfigs: ServerConfigResult[] = [];
  let allParts: MatchedPart[] = [];

  for (const config of configs) {
    const matched = matchPartsForConfig(
      config.requirements,
      partsInventory,
      scorer,
      quotationType,
    );

    const subtotalCost = matched.reduce(
      (sum, p) => sum + p.unit_cost_price * p.quantity,
      0,
    );
    const subtotalSupply = matched.reduce(
      (sum, p) => sum + p.unit_supply_price * p.quantity,
      0,
    );
    const subtotalMargin = subtotalSupply - subtotalCost;
    const marginRate = subtotalSupply > 0 ? (subtotalMargin / subtotalSupply) * 100 : 0;

    serverConfigs.push({
      config_name: config.config_name,
      quantity: config.quantity,
      parts: matched,
      subtotal_cost: subtotalCost * config.quantity,
      subtotal_supply: subtotalSupply * config.quantity,
      subtotal_margin: subtotalMargin * config.quantity,
      margin_rate: Math.round(marginRate * 100) / 100,
    });

    allParts = [...allParts, ...matched];
  }

  // 전원 계산
  const powerResult = calculatePowerFromParts(allParts);

  // 호환성 검증
  const compatibility = validateCompatibility(
    allParts,
    powerResult.recommended_psu_w,
  );

  const totalCost = serverConfigs.reduce((s, c) => s + c.subtotal_cost, 0);
  const totalSupply = serverConfigs.reduce((s, c) => s + c.subtotal_supply, 0);
  const totalMargin = totalSupply - totalCost;

  return {
    quotation: {
      quotation_type: quotationType,
      configs: serverConfigs,
      total_cost: totalCost,
      total_supply: totalSupply,
      total_margin: totalMargin,
      margin_rate: totalSupply > 0
        ? Math.round((totalMargin / totalSupply) * 10000) / 100
        : 0,
    },
    compatibility,
  };
}

/**
 * 서버 1대 구성을 위한 부품 매칭
 */
function matchPartsForConfig(
  requirements: ServerRequirements,
  inventory: Map<string, PartWithPrice[]>,
  scorer: (c: ScoringCandidate) => { score: number; candidate: ScoringCandidate },
  quotationType: QuotationType,
): MatchedPart[] {
  const matched: MatchedPart[] = [];

  for (const category of MATCHING_ORDER) {
    const candidates = inventory.get(category) ?? [];
    if (candidates.length === 0) continue;

    const requirement = getRequirementForCategory(category, requirements);
    if (!requirement) continue;

    // 성능 향상안: 요구사항 15~30% 상향
    const adjustedReq = quotationType === "performance"
      ? adjustRequirementForPerformance(requirement)
      : requirement;

    // 후보 필터링 & 스코어링
    const scored = candidates
      .map((c) => {
        const specMatchRatio = calculateSpecMatchRatio(c.part, adjustedReq);
        const performanceUplift = calculatePerformanceUplift(c.part, requirement);

        return scorer({
          part: c.part,
          price: c.price,
          spec_match_ratio: specMatchRatio,
          performance_uplift: performanceUplift,
        });
      })
      .filter((r) => r.candidate.spec_match_ratio >= getMinMatchThreshold(quotationType))
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const best = scored[0];
      const qty = getQuantityForCategory(category, requirements);
      matched.push({
        category,
        part_id: best.candidate.part.id,
        model_name: best.candidate.part.model_name,
        manufacturer: best.candidate.part.manufacturer,
        specs: best.candidate.part.specs,
        quantity: qty,
        unit_cost_price: best.candidate.price.cost_price,
        unit_supply_price: best.candidate.price.supply_price,
        match_score: Math.round(best.score * 100) / 100,
        match_reason: formatMatchReason(best.candidate, quotationType),
      });
    }
  }

  return matched;
}

// --- 요구사항 매핑 ---

interface CategoryRequirement {
  min_value?: number;
  type?: string;
  interface_type?: string;
}

function getRequirementForCategory(
  category: string,
  req: ServerRequirements,
): CategoryRequirement | null {
  switch (category) {
    case "cpu":
      return req.cpu ? { min_value: req.cpu.min_cores ?? 0 } : null;
    case "memory":
      return req.memory ? { min_value: req.memory.min_capacity_gb, type: req.memory.type ?? undefined } : null;
    case "gpu":
      return req.gpu ? { min_value: req.gpu.min_vram_gb } : null;
    case "ssd":
      return req.storage?.items.find((i) => i.type === "SSD")
        ? { min_value: req.storage.items.find((i) => i.type === "SSD")!.min_capacity_gb }
        : null;
    case "hdd":
      return req.storage?.items.find((i) => i.type === "HDD")
        ? { min_value: req.storage.items.find((i) => i.type === "HDD")!.min_capacity_gb }
        : null;
    case "nic":
      return req.network ? { min_value: req.network.min_speed_gbps } : null;
    case "raid":
      return req.raid?.required ? { type: req.raid.level } : null;
    case "motherboard":
    case "chassis":
    case "psu":
    case "hba":
      // 이 카테고리들은 다른 부품 선정 후 결정
      return { min_value: 0 };
    default:
      return null;
  }
}

function getQuantityForCategory(category: string, req: ServerRequirements): number {
  switch (category) {
    case "cpu":
      return req.cpu ? 1 : 0;
    case "memory": {
      if (!req.memory) return 0;
      // 서버는 보통 8/12/16 DIMM 구성
      return Math.max(1, Math.ceil(req.memory.min_capacity_gb / 64));
    }
    case "gpu":
      return req.gpu?.min_count ?? 0;
    case "ssd":
      return req.storage?.items.find((i) => i.type === "SSD")?.quantity ?? 0;
    case "hdd":
      return req.storage?.items.find((i) => i.type === "HDD")?.quantity ?? 0;
    case "nic":
      return req.network?.port_count ?? 1;
    case "raid":
      return req.raid?.required ? 1 : 0;
    case "motherboard":
    case "chassis":
    case "psu":
      return 1;
    case "hba":
      return 0;
    default:
      return 1;
  }
}

// --- 스펙 매칭 계산 ---

function calculateSpecMatchRatio(part: Part, requirement: CategoryRequirement): number {
  if (!requirement.min_value || requirement.min_value === 0) return 100;

  // 부품 스펙에서 주요 수치를 추출
  const mainSpec = getMainSpecValue(part);
  if (mainSpec <= 0) return 50;

  return (mainSpec / requirement.min_value) * 100;
}

function calculatePerformanceUplift(part: Part, requirement: CategoryRequirement | null): number {
  if (!requirement?.min_value || requirement.min_value === 0) return 0;
  const mainSpec = getMainSpecValue(part);
  if (mainSpec <= 0) return 0;
  return Math.max(0, ((mainSpec - requirement.min_value) / requirement.min_value) * 100);
}

function getMainSpecValue(part: Part): number {
  // 카테고리별 대표 스펙 필드 우선순위
  const specKeys = [
    "cores", "total_cores", "capacity_gb", "vram_gb",
    "speed_gbps", "capacity_tb", "capacity_w",
  ];
  for (const key of specKeys) {
    const val = part.specs[key];
    if (val != null && Number(val) > 0) return Number(val);
  }
  return 0;
}

// --- 성능 향상안 요구사항 조정 ---

function adjustRequirementForPerformance(req: CategoryRequirement): CategoryRequirement {
  return {
    ...req,
    min_value: req.min_value ? Math.ceil(req.min_value * 1.2) : req.min_value,
  };
}

// --- 최소 매칭 임계값 ---

function getMinMatchThreshold(type: QuotationType): number {
  switch (type) {
    case "profitability":
      return 80; // 최소 80% 충족
    case "spec_match":
      return 95; // 거의 정확히 충족
    case "performance":
      return 100; // 요구사항 이상
  }
}

// --- 매칭 사유 포맷 ---

function formatMatchReason(candidate: ScoringCandidate, type: QuotationType): string {
  const marginRate = candidate.price.supply_price > 0
    ? ((candidate.price.supply_price - candidate.price.cost_price) / candidate.price.supply_price * 100).toFixed(1)
    : "0";

  switch (type) {
    case "profitability":
      return `마진율 ${marginRate}%, 스펙 충족도 ${candidate.spec_match_ratio.toFixed(0)}%`;
    case "spec_match":
      return `스펙 충족도 ${candidate.spec_match_ratio.toFixed(0)}%, 마진율 ${marginRate}%`;
    case "performance":
      return `성능 향상 ${candidate.performance_uplift.toFixed(0)}%, 마진율 ${marginRate}%`;
  }
}
