// ============================================================
// AI-SERVER-COMPOSER 타입 정의 — PRD 프로덕션 기준
// ============================================================

// AI & 호환성 타입 re-export
export type {
  ParsedServerConfig,
  ServerRequirements,
  CpuRequirement,
  MemoryRequirement,
  StorageRequirement,
  StorageItem,
  GpuRequirement,
  NetworkRequirement,
  RaidRequirement,
  PowerRequirement,
  MatchedPart,
  ServerConfigResult,
  QuotationDraft,
  RecommendationText,
  GenerateQuotationRequest,
  GenerateQuotationResponse,
} from "./ai";

export type {
  CompatibilityRule,
  CompatibilityIssue,
  PartRef,
  ValidationResult,
  PowerCalculationInput,
  PowerCalculationResult,
  PowerBreakdown,
} from "./compatibility";

// --- 공통 Enum 타입 ---

export type UserRole = "super_admin" | "admin" | "member";

export type CategoryGroup = "server_parts" | "network_infra";

export type QuotationType = "profitability" | "spec_match" | "performance";

export type RfpStatus = "uploaded" | "parsing" | "parsed" | "error";

export type QuotationStatus =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "won"
  | "lost"
  | "pending"
  | "expired";

export type BidResultType = "won" | "lost" | "pending" | "expired";

export type PlanType = "free" | "basic" | "pro" | "enterprise";

export type CustomerType = "public" | "private" | "other";

export type PriceChangeType = "manual" | "excel_upload" | "snapshot";

export type QuotationItemType = "hardware" | "software" | "service" | "maintenance";

export type AuditActionType =
  | "login"
  | "logout"
  | "user_create"
  | "user_update"
  | "user_delete"
  | "part_create"
  | "part_update"
  | "part_delete"
  | "price_update"
  | "quotation_create"
  | "quotation_update"
  | "quotation_approve"
  | "quotation_publish"
  | "rfp_upload"
  | "excel_upload"
  | "settings_update";

// --- 데이터 모델: 테넌트/사용자 ---

export interface Tenant {
  id: string;
  company_name: string;
  business_number: string;
  ceo_name: string;
  address: string;
  business_type: string;
  business_item: string;
  phone: string;
  fax: string | null;
  email: string;
  logo_url: string | null;
  seal_url: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  default_validity_days: number;
  default_payment_terms: string | null;
  quotation_prefix: string;
  plan_type: PlanType;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  phone: string;
  department: string;
  role: UserRole;
  created_at: string;
}

// --- 데이터 모델: 거래처 ---

export interface Customer {
  id: string;
  tenant_id: string;
  company_name: string;
  business_number: string | null;
  ceo_name: string | null;
  address: string | null;
  business_type: string | null;
  business_item: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  customer_type: CustomerType;
  payment_terms: string | null;
  notes: string | null;
  is_frequent: boolean;
  created_at: string;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  department: string | null;
  position: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  is_primary: boolean;
}

// --- 데이터 모델: 부품 ---

export interface PartCategory {
  id: string;
  tenant_id: string;
  name: string;
  display_name: string;
  group: CategoryGroup;
  spec_fields: SpecFieldDefinition[];
  is_default: boolean;
  created_at: string;
}

export interface SpecFieldDefinition {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
  unit?: string;
}

export interface Part {
  id: string;
  tenant_id: string;
  category_id: string;
  model_name: string;
  manufacturer: string;
  specs: Record<string, string | number>;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface PartPrice {
  id: string;
  part_id: string;
  list_price: number;
  market_price: number;
  cost_price: number; // 복호화된 값 (DB에서는 AES-256 암호화)
  supply_price: number;
  margin?: number; // 계산: supply_price - cost_price
  margin_rate?: number; // 계산: margin / supply_price * 100
}

export interface PartPriceHistory {
  id: string;
  part_id: string;
  tenant_id: string;
  change_type: PriceChangeType;
  list_price_before: number | null;
  list_price_after: number;
  market_price_before: number | null;
  market_price_after: number;
  cost_price_before: number | null; // 복호화된 값
  cost_price_after: number;
  supply_price_before: number | null;
  supply_price_after: number;
  changed_by: string;
  change_reason: string | null;
  created_at: string;
}

export interface PriceSnapshot {
  id: string;
  tenant_id: string;
  snapshot_date: string;
  snapshot_data: PartPriceSnapshotItem[];
  part_count: number;
  created_at: string;
}

export interface PartPriceSnapshotItem {
  part_id: string;
  model_name: string;
  category: string;
  list_price: number;
  market_price: number;
  cost_price: number; // 복호화된 값
  supply_price: number;
}

export interface PriceSnapshotSettings {
  id: string;
  tenant_id: string;
  is_enabled: boolean;
  snapshot_hour: number; // 0-23, KST
  retention_months: number;
  last_snapshot_at: string | null;
  updated_at: string;
}

export interface ExcelUploadLog {
  id: string;
  tenant_id: string;
  uploaded_by: string;
  file_name: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  error_details: ExcelUploadError[] | null;
  status: "processing" | "completed" | "failed";
  created_at: string;
}

export interface ExcelUploadError {
  row: number;
  field: string;
  value: string;
  message: string;
}

// --- 데이터 모델: RFP ---

export interface RfpDocument {
  id: string;
  tenant_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  status: RfpStatus;
  parsed_requirements: ParsedRequirement[] | null;
  created_at: string;
}

export interface ParsedRequirement {
  category: string;
  item: string;
  spec: string;
  quantity: number;
  notes?: string;
}

// --- 데이터 모델: 견적 ---

export interface Quotation {
  id: string;
  tenant_id: string;
  rfp_id: string | null;
  customer_id: string;
  quotation_number: string;
  revision: number;
  parent_quotation_id: string | null;
  quotation_type: QuotationType;
  total_cost: number;
  total_supply: number;
  vat: number;
  total_amount: number;
  status: QuotationStatus;
  validity_date: string;
  delivery_terms: string | null;
  delivery_date: string | null;
  payment_terms: string | null;
  notes: string | null;
  created_by: string;
  approved_by: string | null;
  published_at: string | null;
  created_at: string;
  // 계산 필드
  total_margin?: number;
  margin_rate?: number;
  // 조인 데이터
  customer?: Customer;
  rfp?: RfpDocument;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  item_type: QuotationItemType;
  part_id: string | null;
  item_name: string;
  item_spec: string | null;
  quantity: number;
  unit: string;
  unit_cost_price: number;
  unit_supply_price: number;
  amount: number;
  margin_rate: number;
  sort_order: number;
  // 조인 데이터
  part?: Part;
}

export interface BidResultRecord {
  id: string;
  quotation_id: string;
  result: BidResultType;
  reason: string | null;
  competitor_price: number | null;
  recorded_by: string;
  recorded_at: string;
}

// --- 데이터 모델: 운영 기능 ---

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action_type: AuditActionType;
  resource_type: string;
  resource_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  // 조인
  user?: User;
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_resource_type: string | null;
  related_resource_id: string | null;
  created_at: string;
}

// --- API 요청/응답 타입 ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { page: number; total: number; limit: number };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PartsFilterParams extends PaginationParams {
  category_id?: string;
  manufacturer?: string;
}

// --- 폼 입력 타입 ---

export interface SetupFormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  department: string;
  company_name: string;
  business_number: string;
  ceo_name: string;
  address: string;
  business_type: string;
  business_item: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface UserFormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  department: string;
  role: "admin" | "member";
}

export interface PartFormData {
  category_id: string;
  model_name: string;
  manufacturer: string;
  specs: Record<string, string | number>;
  list_price: number;
  market_price: number;
  cost_price: number;
  supply_price: number;
}

export interface CategoryFormData {
  name: string;
  display_name: string;
  group: CategoryGroup;
  spec_fields: SpecFieldDefinition[];
}

export interface CustomerFormData {
  company_name: string;
  business_number?: string;
  ceo_name?: string;
  address?: string;
  business_type?: string;
  business_item?: string;
  phone?: string;
  fax?: string;
  email?: string;
  customer_type: CustomerType;
  payment_terms?: string;
  notes?: string;
}

export interface CustomerContactFormData {
  name: string;
  department?: string;
  position?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  is_primary: boolean;
}

export interface QuotationFormData {
  customer_id: string;
  rfp_id?: string;
  quotation_type: QuotationType;
  validity_days?: number;
  delivery_terms?: string;
  delivery_date?: string;
  payment_terms?: string;
  notes?: string;
}

export interface BidResultFormData {
  quotation_id: string;
  result: BidResultType;
  reason?: string;
  competitor_price?: number;
}

export interface TenantSettingsFormData {
  company_name: string;
  business_number: string;
  ceo_name: string;
  address: string;
  business_type: string;
  business_item: string;
  phone: string;
  fax?: string;
  email: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  default_validity_days: number;
  default_payment_terms?: string;
  quotation_prefix: string;
}

// --- 대시보드 타입 ---

export interface DashboardSummary {
  in_progress: number;
  completed: number;
  won: number;
  monthly_win_rate: number;
  total_parts: number;
  total_customers: number;
}

export interface BidHistoryStats {
  total_win_rate: number;
  average_margin_rate: number;
  total_quotations: number;
  monthly_trend: { month: string; win_rate: number }[];
  failure_reasons: { reason: string; count: number }[];
}
