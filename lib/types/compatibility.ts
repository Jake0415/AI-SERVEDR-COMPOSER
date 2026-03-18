// ============================================================
// 호환성 검증 관련 타입 정의
// ============================================================

/** 호환성 규칙 매치 타입 */
export type MatchType = "exact" | "includes" | "gte" | "lte" | "contains" | "balanced";

/** 에러 레벨: block=설치 불가, warn=비권장 */
export type ErrorLevel = "block" | "warn";

/** 호환성 검증 규칙 */
export interface CompatibilityRule {
  id: string;
  source_category: string;
  target_category: string;
  rule_type: string;
  source_field: string;
  target_field: string;
  match_type: MatchType;
  error_level: ErrorLevel;
  message_ko: string;
}

/** 호환성 검증에서 발견된 개별 이슈 */
export interface CompatibilityIssue {
  rule_id: string;
  source_part: PartRef;
  target_part: PartRef;
  error_level: ErrorLevel;
  message: string;
  suggestion: string | null;
}

/** 부품 참조 (호환성 이슈에서 사용) */
export interface PartRef {
  id: string;
  model_name: string;
  category: string;
}

/** 호환성 검증 전체 결과 */
export interface ValidationResult {
  is_valid: boolean;
  errors: CompatibilityIssue[];
  warnings: CompatibilityIssue[];
}

// --- 전원 계산 관련 ---

/** 전원 계산 입력 */
export interface PowerCalculationInput {
  cpu: { tdp: number; quantity: number };
  memory: { count: number; watt_per_dimm?: number };
  storage_ssd: { count: number; watt_per_unit?: number };
  storage_hdd: { count: number; watt_per_unit?: number };
  gpu: { tdp: number; quantity: number };
  nic: { max_power: number; quantity: number };
  raid: { power: number; quantity: number };
  fans_and_misc: number;
}

/** 전원 계산 결과 */
export interface PowerCalculationResult {
  base_power_w: number;
  peak_power_w: number;
  recommended_psu_w: number;
  redundancy_psu_w: number;
  efficiency_rating: string;
  breakdown: PowerBreakdown;
  warnings: string[];
}

/** 전원 소비 상세 내역 */
export interface PowerBreakdown {
  cpu_w: number;
  memory_w: number;
  storage_w: number;
  gpu_w: number;
  network_w: number;
  raid_w: number;
  misc_w: number;
  total_base_w: number;
}
