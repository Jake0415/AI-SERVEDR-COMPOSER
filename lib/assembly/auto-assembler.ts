// ============================================================
// 자동 조립 엔진 — 9단계 파이프라인
// ============================================================

import type { AssemblyPipelineInput, AssemblyPipelineResult, AssemblyCompatibilityIssue } from "@/lib/types/assembly";
import { COMPATIBILITY_RULES } from "@/lib/compatibility/matrix";

/**
 * 9단계 자동 조립 파이프라인
 * 1. RFP 요구사항 파싱
 * 2. 폼팩터 결정
 * 3. 베이스 서버 매칭 (섀시+메인보드)
 * 4. CPU 선택
 * 5. 메모리 최적 구성
 * 6. 스토리지 배치
 * 7. 확장 카드 (GPU/NIC/RAID/HBA)
 * 8. PSU 선택
 * 9. 최종 호환성 검증
 */
export function runAssemblyPipeline(
  input: AssemblyPipelineInput,
): AssemblyPipelineResult {
  const issues: AssemblyCompatibilityIssue[] = [];

  // Step 1: 요구사항 파싱 (이미 구조화됨)
  const req = input.rfpRequirements;

  // Step 2: 폼팩터 결정
  const formFactor = determineFormFactor(req);

  // Step 3~8: 부품 선택 (실제로는 DB 조회 필요 — 여기서는 구조만 정의)
  // 각 단계는 이전 단계의 결과에 의존

  // Step 9: 호환성 검증
  const totalRules = COMPATIBILITY_RULES.length;
  if (totalRules < 20) {
    issues.push({
      ruleId: "SYSTEM",
      level: "warning",
      message: `호환성 규칙 ${totalRules}개 적용 (목표 20개)`,
    });
  }

  return {
    baseServer: null, // DB 조회 후 채워짐
    cpu: null,
    memory: [],
    storage: [],
    pcie: [],
    psu: null,
    totalTdp: 0,
    totalCost: 0,
    totalSupply: 0,
    compatibilityIssues: issues,
  };
}

/** 요구사항 기반 폼팩터 결정 */
function determineFormFactor(req: AssemblyPipelineInput["rfpRequirements"]): string {
  if (req.form_factor) return req.form_factor;

  // GPU가 필요하면 2U 이상
  if (req.gpu_count && req.gpu_count > 0) return "2U";

  // 스토리지 10TB 이상이면 2U
  if (req.storage_tb && req.storage_tb >= 10) return "2U";

  // 기본 1U
  return "1U";
}

/** TDP 기반 PSU 용량 권장값 */
export function recommendPsuWattage(totalTdp: number, redundancy: boolean): number {
  const base = Math.ceil(totalTdp * 1.2); // 20% 여유
  // 100W 단위 올림
  const rounded = Math.ceil(base / 100) * 100;
  return redundancy ? rounded : rounded;
}
