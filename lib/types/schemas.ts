import { z } from "zod";

// --- 인증 스키마 ---

export const setupSchema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  name: z.string().min(1, "이름을 입력하세요"),
  phone: z.string().min(1, "전화번호를 입력하세요"),
  department: z.string().min(1, "부서명을 입력하세요"),
  company_name: z.string().min(1, "회사명을 입력하세요"),
  business_number: z.string().min(1, "사업자등록번호를 입력하세요"),
  ceo_name: z.string().min(1, "대표자명을 입력하세요"),
  address: z.string().min(1, "사업장 주소를 입력하세요"),
  business_type: z.string().min(1, "업태를 입력하세요"),
  business_item: z.string().min(1, "종목을 입력하세요"),
});

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

// --- 사용자 관리 스키마 ---

export const userSchema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  name: z.string().min(1, "이름을 입력하세요"),
  phone: z.string().min(1, "전화번호를 입력하세요"),
  department: z.string().min(1, "부서명을 입력하세요"),
  role: z.enum(["admin", "member"], { error: "역할을 선택하세요" }),
});

// --- 부품 관리 스키마 ---

export const partSchema = z.object({
  category_id: z.string().min(1, "카테고리를 선택하세요"),
  model_name: z.string().min(1, "모델명을 입력하세요"),
  manufacturer: z.string().min(1, "제조사를 입력하세요"),
  specs: z.record(z.string(), z.union([z.string(), z.number()])),
  list_price: z.number().min(0, "리스트가는 0 이상이어야 합니다"),
  market_price: z.number().min(0, "시장가는 0 이상이어야 합니다"),
  cost_price: z.number().min(0, "원가는 0 이상이어야 합니다"),
  supply_price: z.number().min(0, "공급가는 0 이상이어야 합니다"),
});

// --- 카테고리 관리 스키마 ---

export const specFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "number", "select"]),
  options: z.array(z.string()).optional(),
  unit: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "카테고리명을 입력하세요").regex(/^[a-z_]+$/, "영문 소문자와 언더스코어만 사용 가능합니다"),
  display_name: z.string().min(1, "표시명을 입력하세요"),
  group: z.enum(["server_parts", "network_infra"], { error: "그룹을 선택하세요" }),
  spec_fields: z.array(specFieldSchema).min(1, "스펙 필드를 1개 이상 정의하세요"),
});

// --- 거래처 관리 스키마 ---

export const customerSchema = z.object({
  company_name: z.string().min(1, "회사명을 입력하세요"),
  business_number: z.string().optional(),
  ceo_name: z.string().optional(),
  address: z.string().optional(),
  business_type: z.string().optional(),
  business_item: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email("올바른 이메일을 입력하세요").optional().or(z.literal("")),
  customer_type: z.enum(["public", "private", "other"], { error: "고객 유형을 선택하세요" }),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});

export const customerContactSchema = z.object({
  name: z.string().min(1, "담당자명을 입력하세요"),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email("올바른 이메일을 입력하세요").optional().or(z.literal("")),
  is_primary: z.boolean().default(false),
});

// --- 견적 관련 스키마 ---

export const quotationFormSchema = z.object({
  customer_id: z.string().min(1, "거래처를 선택하세요"),
  rfp_id: z.string().optional(),
  quotation_type: z.enum(["profitability", "spec_match", "performance"], { error: "견적 유형을 선택하세요" }),
  validity_days: z.number().min(1).default(30),
  delivery_terms: z.string().optional(),
  delivery_date: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});

export const bidResultSchema = z.object({
  quotation_id: z.string().min(1),
  result: z.enum(["won", "lost", "pending", "expired"], { error: "결과를 선택하세요" }),
  reason: z.string().optional(),
  competitor_price: z.number().min(0).optional(),
});

// --- 시스템 설정 스키마 ---

export const tenantSettingsSchema = z.object({
  company_name: z.string().min(1, "회사명을 입력하세요"),
  business_number: z.string().min(1, "사업자등록번호를 입력하세요"),
  ceo_name: z.string().min(1, "대표자명을 입력하세요"),
  address: z.string().min(1, "주소를 입력하세요"),
  business_type: z.string().min(1, "업태를 입력하세요"),
  business_item: z.string().min(1, "종목을 입력하세요"),
  phone: z.string().min(1, "전화번호를 입력하세요"),
  fax: z.string().optional(),
  email: z.string().email("올바른 이메일을 입력하세요"),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  bank_holder: z.string().optional(),
  default_validity_days: z.number().min(1, "1일 이상이어야 합니다").default(30),
  default_payment_terms: z.string().optional(),
  quotation_prefix: z.string().min(1, "접두사를 입력하세요").default("Q"),
});

export const priceSnapshotSettingsSchema = z.object({
  is_enabled: z.boolean(),
  snapshot_hour: z.number().min(0).max(23),
  retention_months: z.number().min(1).max(60),
});

// --- AI 파싱 결과 검증 스키마 ---

export const cpuRequirementSchema = z.object({
  min_cores: z.number().nullable(),
  min_clock_ghz: z.number().nullable(),
  socket_type: z.string().nullable(),
  architecture: z.string().nullable(),
  max_tdp_w: z.number().nullable(),
});

export const memoryRequirementSchema = z.object({
  min_capacity_gb: z.number(),
  type: z.enum(["DDR4", "DDR5"]).nullable(),
  ecc: z.boolean(),
  min_speed_mhz: z.number().nullable(),
});

export const storageItemSchema = z.object({
  type: z.enum(["SSD", "HDD"]),
  min_capacity_gb: z.number(),
  interface_type: z.enum(["NVMe", "SATA", "SAS"]).nullable(),
  quantity: z.number().min(1),
});

export const gpuRequirementSchema = z.object({
  min_vram_gb: z.number(),
  min_count: z.number().min(1),
  use_case: z.string(),
  preferred_model: z.string().nullable(),
});

export const networkRequirementSchema = z.object({
  min_speed_gbps: z.number(),
  port_count: z.number().nullable(),
  type: z.string().nullable(),
});

export const serverRequirementsSchema = z.object({
  cpu: cpuRequirementSchema.nullable(),
  memory: memoryRequirementSchema.nullable(),
  storage: z.object({ items: z.array(storageItemSchema) }).nullable(),
  gpu: gpuRequirementSchema.nullable(),
  network: networkRequirementSchema.nullable(),
  raid: z.object({ level: z.string(), required: z.boolean() }).nullable(),
  power: z.object({ redundancy: z.boolean(), min_wattage: z.number().nullable() }).nullable(),
});

export const parsedServerConfigSchema = z.object({
  config_name: z.string(),
  quantity: z.number().min(1),
  requirements: serverRequirementsSchema,
  notes: z.array(z.string()),
});

/** LLM 파싱 출력 전체 검증 */
export const rfpParsingResultSchema = z.array(parsedServerConfigSchema);

// --- 견적 생성 요청 스키마 ---

export const generateQuotationSchema = z.object({
  rfp_id: z.string().min(1, "RFP를 선택하세요"),
  customer_id: z.string().min(1, "거래처를 선택하세요"),
});

// --- 타입 추출 ---

export type SetupFormValues = z.infer<typeof setupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type UserFormValues = z.infer<typeof userSchema>;
export type PartFormValues = z.infer<typeof partSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;
export type CustomerFormValues = z.infer<typeof customerSchema>;
export type CustomerContactFormValues = z.infer<typeof customerContactSchema>;
export type QuotationFormValues = z.infer<typeof quotationFormSchema>;
export type BidResultFormValues = z.infer<typeof bidResultSchema>;
export type TenantSettingsFormValues = z.infer<typeof tenantSettingsSchema>;
export type PriceSnapshotSettingsFormValues = z.infer<typeof priceSnapshotSettingsSchema>;
export type ParsedServerConfigValues = z.infer<typeof parsedServerConfigSchema>;
export type RfpParsingResultValues = z.infer<typeof rfpParsingResultSchema>;
export type GenerateQuotationValues = z.infer<typeof generateQuotationSchema>;
