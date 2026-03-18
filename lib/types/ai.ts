// ============================================================
// AI 관련 타입 정의 — RFP 파싱, 추천 설명 생성
// ============================================================

// --- RFP 파싱 결과 ---

/** LLM이 RFP에서 추출한 서버 구성 요구사항 */
export interface ParsedServerConfig {
  config_name: string;
  quantity: number;
  requirements: ServerRequirements;
  notes: string[];
}

export interface ServerRequirements {
  cpu: CpuRequirement | null;
  memory: MemoryRequirement | null;
  storage: StorageRequirement | null;
  gpu: GpuRequirement | null;
  network: NetworkRequirement | null;
  raid: RaidRequirement | null;
  power: PowerRequirement | null;
}

export interface CpuRequirement {
  min_cores: number | null;
  min_clock_ghz: number | null;
  socket_type: string | null;
  architecture: string | null;
  max_tdp_w: number | null;
}

export interface MemoryRequirement {
  min_capacity_gb: number;
  type: "DDR4" | "DDR5" | null;
  ecc: boolean;
  min_speed_mhz: number | null;
}

export interface StorageRequirement {
  items: StorageItem[];
}

export interface StorageItem {
  type: "SSD" | "HDD";
  min_capacity_gb: number;
  interface_type: "NVMe" | "SATA" | "SAS" | null;
  quantity: number;
}

export interface GpuRequirement {
  min_vram_gb: number;
  min_count: number;
  use_case: string;
  preferred_model: string | null;
}

export interface NetworkRequirement {
  min_speed_gbps: number;
  port_count: number | null;
  type: string | null;
}

export interface RaidRequirement {
  level: string;
  required: boolean;
}

export interface PowerRequirement {
  redundancy: boolean;
  min_wattage: number | null;
}

// --- 부품 매칭 결과 ---

/** 매칭된 개별 부품 */
export interface MatchedPart {
  category: string;
  part_id: string;
  model_name: string;
  manufacturer: string;
  specs: Record<string, string | number>;
  quantity: number;
  unit_cost_price: number;
  unit_supply_price: number;
  match_score: number;
  match_reason: string;
}

/** 서버 1대 구성 결과 */
export interface ServerConfigResult {
  config_name: string;
  quantity: number;
  parts: MatchedPart[];
  subtotal_cost: number;
  subtotal_supply: number;
  subtotal_margin: number;
  margin_rate: number;
}

/** 견적안 초안 */
export interface QuotationDraft {
  quotation_type: "profitability" | "spec_match" | "performance";
  configs: ServerConfigResult[];
  total_cost: number;
  total_supply: number;
  total_margin: number;
  margin_rate: number;
}

// --- AI 추천 설명 ---

/** 견적안별 AI 추천 텍스트 */
export interface RecommendationText {
  summary: string;
  pros: string[];
  cons: string[];
  selling_points: string[];
}

/** 견적 생성 API 요청 */
export interface GenerateQuotationRequest {
  rfp_id: string;
  customer_id: string;
}

/** 견적 생성 API 응답 */
export interface GenerateQuotationResponse {
  quotations: {
    profitability: QuotationDraft;
    spec_match: QuotationDraft;
    performance: QuotationDraft;
  };
  compatibility_warnings: import("./compatibility").CompatibilityIssue[];
  ai_recommendations: {
    profitability: RecommendationText;
    spec_match: RecommendationText;
    performance: RecommendationText;
  };
}
