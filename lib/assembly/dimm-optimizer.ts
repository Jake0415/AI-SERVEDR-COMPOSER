// ============================================================
// DimmOptimizer — 메모리 채널 균형 최적화
// ============================================================

import type { DimmConfig, DimmOptimizationResult } from "@/lib/types/assembly";

interface DimmOptimizerInput {
  targetCapacityGb: number;
  channels: number;
  dimmPerChannel: number;
  totalSlots: number;
  availableDimms: {
    partId: string;
    partName: string;
    capacityGb: number;
    dimmType: "RDIMM" | "LRDIMM" | "UDIMM";
    speed: number;
    supplyPrice: number;
  }[];
  strategy: "profitability" | "spec_match" | "performance";
}

/**
 * 메모리 구성 최적화
 * - 채널 균등 배치
 * - DIMM 타입 통일
 * - 전략별 용량/가격 최적화
 */
export function optimizeDimmConfig(input: DimmOptimizerInput): DimmOptimizationResult {
  const { targetCapacityGb, channels, dimmPerChannel, availableDimms, strategy } = input;
  const warnings: string[] = [];

  if (availableDimms.length === 0) {
    return { configs: [], totalCapacityGb: 0, channelsUsed: 0, isBalanced: true, warnings: ["사용 가능한 메모리 모듈이 없습니다."] };
  }

  // DIMM 타입별 그룹화 (혼합 금지)
  const dimmTypes = [...new Set(availableDimms.map((d) => d.dimmType))];

  // 전략별 정렬
  const sorted = [...availableDimms].sort((a, b) => {
    switch (strategy) {
      case "profitability":
        return (a.supplyPrice / a.capacityGb) - (b.supplyPrice / b.capacityGb); // GB당 최저가
      case "performance":
        return b.capacityGb - a.capacityGb || b.speed - a.speed; // 최대 용량 + 최고 속도
      case "spec_match":
      default:
        return Math.abs(a.capacityGb * channels - targetCapacityGb) - Math.abs(b.capacityGb * channels - targetCapacityGb); // 목표에 가장 근접
    }
  });

  // 가장 적합한 DIMM 선택
  const selectedDimm = sorted[0];
  const selectedType = selectedDimm.dimmType;

  // 필요 수량 계산 (채널 균등)
  const dimmsPerRound = channels; // 1채널당 1개씩 라운드
  const roundCapacity = selectedDimm.capacityGb * dimmsPerRound;
  const rounds = Math.ceil(targetCapacityGb / roundCapacity);
  const totalDimms = Math.min(rounds * dimmsPerRound, channels * dimmPerChannel);

  // 균등 배치 확인
  const isBalanced = totalDimms % channels === 0;
  if (!isBalanced) {
    warnings.push("메모리가 채널별로 균등하게 배치되지 않습니다.");
  }

  // 혼합 타입 경고
  if (dimmTypes.length > 1) {
    warnings.push(`${dimmTypes.join("/")} 타입이 혼합됩니다. ${selectedType}만 사용합니다.`);
  }

  const configs: DimmConfig[] = [{
    partId: selectedDimm.partId,
    partName: selectedDimm.partName,
    capacityGb: selectedDimm.capacityGb,
    dimmType: selectedType,
    speed: selectedDimm.speed,
    quantity: totalDimms,
  }];

  return {
    configs,
    totalCapacityGb: selectedDimm.capacityGb * totalDimms,
    channelsUsed: Math.min(totalDimms, channels),
    isBalanced,
    warnings,
  };
}
