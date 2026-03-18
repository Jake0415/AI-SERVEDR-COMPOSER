// ============================================================
// 전원 계산 엔진 — TDP 기반 PSU 추천
// ============================================================

import type {
  PowerCalculationInput,
  PowerCalculationResult,
  PowerBreakdown,
} from "@/lib/types/compatibility";
import type { MatchedPart } from "@/lib/types/ai";

// 기본 전력 소비 상수 (부품별 미지정 시 사용)
const DEFAULT_WATT = {
  DIMM: 12,
  NVME_SSD: 20,
  HDD: 12,
  RAID: 15,
  SYSTEM_OVERHEAD: 75,
} as const;

// 피크 배율 (부스트/스핀업 고려)
const PEAK_MULTIPLIER = 1.2;
// PSU 효율 기준 (80 Plus Platinum)
const PSU_EFFICIENCY = 0.80;
// GPU 전력 비중 경고 임계값
const GPU_POWER_WARN_THRESHOLD = 0.70;

/**
 * 부품 목록에서 전원 소비량을 자동 계산
 * @param parts - 매칭된 부품 목록
 * @returns 전원 계산 결과
 */
export function calculatePowerFromParts(parts: MatchedPart[]): PowerCalculationResult {
  const input = extractPowerInput(parts);
  return calculatePower(input);
}

/**
 * TDP 기반 전원 계산
 * @param input - 부품별 전력 소비 입력
 * @returns 전원 계산 결과 (기본/피크/권장 PSU/이중화)
 */
export function calculatePower(input: PowerCalculationInput): PowerCalculationResult {
  const breakdown = calculateBreakdown(input);
  const warnings: string[] = [];

  const peakPower = Math.ceil(breakdown.total_base_w * PEAK_MULTIPLIER);
  const recommendedPsu = Math.ceil(peakPower / PSU_EFFICIENCY);
  // 이중화(1+1): 동일 용량 PSU 2개
  const redundancyPsu = recommendedPsu;

  // GPU 전력 비중 경고
  if (breakdown.gpu_w > 0) {
    const gpuRatio = breakdown.gpu_w / breakdown.total_base_w;
    if (gpuRatio > GPU_POWER_WARN_THRESHOLD) {
      warnings.push(
        `GPU가 전체 전력의 ${Math.round(gpuRatio * 100)}%를 차지합니다. 별도 전원 레일을 권장합니다.`,
      );
    }
  }

  // 효율 등급 결정
  const efficiencyRating = recommendedPsu > 1600
    ? "80 Plus Titanium 권장"
    : "80 Plus Platinum 이상 권장";

  // 높은 전력 경고
  if (recommendedPsu > 3000) {
    warnings.push(
      `권장 PSU 용량이 ${recommendedPsu}W입니다. 3상 전원 또는 고밀도 전원 솔루션을 검토하세요.`,
    );
  }

  return {
    base_power_w: breakdown.total_base_w,
    peak_power_w: peakPower,
    recommended_psu_w: recommendedPsu,
    redundancy_psu_w: redundancyPsu,
    efficiency_rating: efficiencyRating,
    breakdown,
    warnings,
  };
}

/** 전력 소비 상세 내역 계산 */
function calculateBreakdown(input: PowerCalculationInput): PowerBreakdown {
  const cpuW = input.cpu.tdp * input.cpu.quantity;
  const memoryW = input.memory.count * (input.memory.watt_per_dimm ?? DEFAULT_WATT.DIMM);
  const ssdW = input.storage_ssd.count * (input.storage_ssd.watt_per_unit ?? DEFAULT_WATT.NVME_SSD);
  const hddW = input.storage_hdd.count * (input.storage_hdd.watt_per_unit ?? DEFAULT_WATT.HDD);
  const storageW = ssdW + hddW;
  const gpuW = input.gpu.tdp * input.gpu.quantity;
  const networkW = input.nic.max_power * input.nic.quantity;
  const raidW = input.raid.power * input.raid.quantity;
  const miscW = input.fans_and_misc + DEFAULT_WATT.SYSTEM_OVERHEAD;

  return {
    cpu_w: cpuW,
    memory_w: memoryW,
    storage_w: storageW,
    gpu_w: gpuW,
    network_w: networkW,
    raid_w: raidW,
    misc_w: miscW,
    total_base_w: cpuW + memoryW + storageW + gpuW + networkW + raidW + miscW,
  };
}

/** 매칭된 부품 목록에서 PowerCalculationInput 자동 추출 */
function extractPowerInput(parts: MatchedPart[]): PowerCalculationInput {
  let cpuTdp = 0;
  let cpuQty = 0;
  let memoryCount = 0;
  let ssdCount = 0;
  let hddCount = 0;
  let gpuTdp = 0;
  let gpuQty = 0;
  let nicPower = 0;
  let nicQty = 0;
  let raidPower = 0;
  let raidQty = 0;

  for (const part of parts) {
    switch (part.category) {
      case "cpu":
        cpuTdp = Number(part.specs["tdp_w"] ?? part.specs["tdp"] ?? 0);
        cpuQty += part.quantity;
        break;
      case "memory":
        memoryCount += part.quantity;
        break;
      case "ssd":
        ssdCount += part.quantity;
        break;
      case "hdd":
        hddCount += part.quantity;
        break;
      case "gpu":
        gpuTdp = Number(part.specs["tdp_w"] ?? part.specs["tdp"] ?? 0);
        gpuQty += part.quantity;
        break;
      case "nic":
        nicPower = Number(part.specs["max_power_w"] ?? 25);
        nicQty += part.quantity;
        break;
      case "raid":
        raidPower = Number(part.specs["power_w"] ?? DEFAULT_WATT.RAID);
        raidQty += part.quantity;
        break;
    }
  }

  return {
    cpu: { tdp: cpuTdp, quantity: cpuQty },
    memory: { count: memoryCount },
    storage_ssd: { count: ssdCount },
    storage_hdd: { count: hddCount },
    gpu: { tdp: gpuTdp, quantity: gpuQty },
    nic: { max_power: nicPower, quantity: nicQty },
    raid: { power: raidPower, quantity: raidQty },
    fans_and_misc: 0,
  };
}
