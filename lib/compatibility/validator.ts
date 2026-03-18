// ============================================================
// 호환성 검증 엔진 — 부품 조합의 호환성을 규칙 기반으로 검증
// ============================================================

import type {
  CompatibilityIssue,
  CompatibilityRule,
  ValidationResult,
} from "@/lib/types/compatibility";
import type { MatchedPart } from "@/lib/types/ai";
import { COMPATIBILITY_RULES } from "./matrix";

/** 부품 목록의 호환성을 검증 */
export function validateCompatibility(
  parts: MatchedPart[],
  totalPowerRecommended?: number,
): ValidationResult {
  const errors: CompatibilityIssue[] = [];
  const warnings: CompatibilityIssue[] = [];

  for (const rule of COMPATIBILITY_RULES) {
    const issues = checkRule(rule, parts, totalPowerRecommended);
    for (const issue of issues) {
      if (issue.error_level === "block") {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

/** 개별 규칙 검증 */
function checkRule(
  rule: CompatibilityRule,
  parts: MatchedPart[],
  totalPowerRecommended?: number,
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  // 특수 카테고리: 전원 계산 결과 vs PSU
  if (rule.source_category === "_total_power") {
    if (totalPowerRecommended == null) return [];
    const psuParts = parts.filter((p) => p.category === "psu");
    for (const psu of psuParts) {
      const capacity = getSpecValue(psu, rule.target_field);
      if (capacity != null && totalPowerRecommended > Number(capacity)) {
        issues.push(createIssue(rule, { id: "_system", model_name: "시스템 전체", category: "_total_power" }, psu));
      }
    }
    return issues;
  }

  // 특수 카테고리: 총 메모리 vs CPU 최대
  if (rule.source_category === "_total_memory") {
    const memoryParts = parts.filter((p) => p.category === "memory");
    const cpuParts = parts.filter((p) => p.category === "cpu");
    const totalMemoryGb = memoryParts.reduce((sum, m) => {
      const capacity = Number(m.specs["capacity_gb"] ?? 0);
      return sum + capacity * m.quantity;
    }, 0);

    for (const cpu of cpuParts) {
      const maxMemory = getSpecValue(cpu, rule.target_field);
      if (maxMemory != null && totalMemoryGb > Number(maxMemory)) {
        issues.push(createIssue(
          rule,
          { id: "_memory_total", model_name: `총 ${totalMemoryGb}GB`, category: "_total_memory" },
          cpu,
        ));
      }
    }
    return issues;
  }

  // 일반 규칙: source 카테고리 부품 vs target 카테고리 부품
  const sourceParts = parts.filter((p) => p.category === rule.source_category);
  const targetParts = parts.filter((p) => p.category === rule.target_category);

  for (const source of sourceParts) {
    for (const target of targetParts) {
      const sourceValue = getSpecValue(source, rule.source_field);
      const targetValue = getSpecValue(target, rule.target_field);

      if (sourceValue == null || targetValue == null) continue;

      const isCompatible = evaluateMatch(rule.match_type, sourceValue, targetValue);
      if (!isCompatible) {
        issues.push(createIssue(rule, source, target));
      }
    }
  }

  return issues;
}

/** 스펙 값 추출 */
function getSpecValue(part: MatchedPart | { id: string; model_name: string; category: string; specs?: Record<string, string | number> }, field: string): string | number | null {
  if ("specs" in part && part.specs) {
    const value = part.specs[field];
    return value ?? null;
  }
  return null;
}

/** 매칭 조건 평가 */
function evaluateMatch(
  matchType: string,
  sourceValue: string | number,
  targetValue: string | number,
): boolean {
  switch (matchType) {
    case "exact":
      return String(sourceValue).toLowerCase() === String(targetValue).toLowerCase();

    case "includes": {
      const target = String(targetValue).toLowerCase();
      const source = String(sourceValue).toLowerCase();
      // target이 배열 형식인 경우 (쉼표 구분)
      if (target.includes(",")) {
        return target.split(",").map((s) => s.trim()).includes(source);
      }
      return target.includes(source);
    }

    case "gte":
      return Number(sourceValue) >= Number(targetValue);

    case "lte":
      return Number(sourceValue) <= Number(targetValue);

    default:
      return true;
  }
}

/** 이슈 객체 생성 */
function createIssue(
  rule: CompatibilityRule,
  source: MatchedPart | { id: string; model_name: string; category: string },
  target: MatchedPart | { id: string; model_name: string; category: string },
): CompatibilityIssue {
  return {
    rule_id: rule.id,
    source_part: {
      id: "part_id" in source ? (source as MatchedPart).part_id : source.id,
      model_name: source.model_name,
      category: source.category,
    },
    target_part: {
      id: "part_id" in target ? (target as MatchedPart).part_id : target.id,
      model_name: target.model_name,
      category: target.category,
    },
    error_level: rule.error_level,
    message: rule.message_ko,
    suggestion: null,
  };
}
