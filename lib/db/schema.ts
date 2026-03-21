// ============================================================
// Drizzle ORM 스키마 정의 — ai_server_composer 전용 스키마
// 28개 테이블 + 인덱스 + CHECK 제약
// ============================================================

import {
  pgSchema,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  inet,
  customType,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// 전용 스키마
export const schema = pgSchema("ai_server_composer");

// BYTEA 커스텀 타입 (암호화된 원가)
const bytea = customType<{ data: Buffer | null }>({
  dataType() {
    return "bytea";
  },
});

// ============ 테넌트/사용자 ============

export const tenants = schema.table("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  businessNumber: text("business_number").notNull(),
  ceoName: text("ceo_name").notNull(),
  address: text("address").notNull(),
  businessType: text("business_type").notNull(),
  businessItem: text("business_item").notNull(),
  phone: text("phone").notNull(),
  fax: text("fax"),
  email: text("email").notNull(),
  logoUrl: text("logo_url"),
  sealUrl: text("seal_url"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  bankHolder: text("bank_holder"),
  defaultValidityDays: integer("default_validity_days").notNull().default(30),
  defaultPaymentTerms: text("default_payment_terms"),
  quotationPrefix: text("quotation_prefix").notNull().default("Q"),
  planType: text("plan_type").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = schema.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  department: text("department").notNull(),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_users_tenant").on(table.tenantId),
  uniqueIndex("idx_users_email").on(table.email),
]);

// ============ 거래처 ============

export const customers = schema.table("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  businessNumber: text("business_number"),
  ceoName: text("ceo_name"),
  address: text("address"),
  businessType: text("business_type"),
  businessItem: text("business_item"),
  phone: text("phone"),
  fax: text("fax"),
  email: text("email"),
  customerType: text("customer_type").notNull().default("private"),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  isFrequent: boolean("is_frequent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_customers_tenant").on(table.tenantId),
]);

export const customerContacts = schema.table("customer_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  department: text("department"),
  position: text("position"),
  phone: text("phone"),
  mobile: text("mobile"),
  email: text("email"),
  isPrimary: boolean("is_primary").notNull().default(false),
}, (table) => [
  index("idx_customer_contacts_customer").on(table.customerId),
]);

// ============ 부품 ============

export const partCategories = schema.table("part_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  group: text("group").notNull(),
  specFields: jsonb("spec_fields").notNull().default([]),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_part_categories_tenant").on(table.tenantId),
  uniqueIndex("idx_part_categories_unique").on(table.tenantId, table.name),
]);

export const parts = schema.table("parts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => partCategories.id, { onDelete: "restrict" }),
  modelName: text("model_name").notNull(),
  manufacturer: text("manufacturer").notNull(),
  specs: jsonb("specs").notNull().default({}),
  partCodeId: uuid("part_code_id").references(() => partCodes.id),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_parts_tenant").on(table.tenantId),
  index("idx_parts_category").on(table.categoryId),
  index("idx_parts_model").on(table.modelName),
]);

export const partPrices = schema.table("part_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  partId: uuid("part_id").notNull().references(() => parts.id, { onDelete: "cascade" }),
  listPrice: bigint("list_price", { mode: "number" }).notNull().default(0),
  marketPrice: bigint("market_price", { mode: "number" }).notNull().default(0),
  costPriceEncrypted: bytea("cost_price_encrypted"),
  supplyPrice: bigint("supply_price", { mode: "number" }).notNull().default(0),
}, (table) => [
  uniqueIndex("idx_part_prices_part").on(table.partId),
]);

export const partPriceHistory = schema.table("part_price_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  partId: uuid("part_id").notNull().references(() => parts.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  changeType: text("change_type").notNull(),
  listPriceBefore: bigint("list_price_before", { mode: "number" }),
  listPriceAfter: bigint("list_price_after", { mode: "number" }).notNull(),
  marketPriceBefore: bigint("market_price_before", { mode: "number" }),
  marketPriceAfter: bigint("market_price_after", { mode: "number" }).notNull(),
  costPriceBefore: bigint("cost_price_before", { mode: "number" }),
  costPriceAfter: bigint("cost_price_after", { mode: "number" }).notNull(),
  supplyPriceBefore: bigint("supply_price_before", { mode: "number" }),
  supplyPriceAfter: bigint("supply_price_after", { mode: "number" }).notNull(),
  changedBy: uuid("changed_by").notNull().references(() => users.id),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_price_history_part").on(table.partId),
  index("idx_price_history_tenant").on(table.tenantId),
]);

// ============ 가격 스냅샷 ============

export const priceSnapshots = schema.table("price_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  snapshotDate: date("snapshot_date").notNull(),
  snapshotData: jsonb("snapshot_data").notNull().default([]),
  partCount: integer("part_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_price_snapshots_unique").on(table.tenantId, table.snapshotDate),
]);

export const priceSnapshotSettings = schema.table("price_snapshot_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").notNull().default(false),
  snapshotHour: integer("snapshot_hour").notNull().default(9),
  retentionMonths: integer("retention_months").notNull().default(12),
  lastSnapshotAt: timestamp("last_snapshot_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_snapshot_settings_tenant").on(table.tenantId),
]);

// ============ 엑셀 업로드 ============

export const excelUploadLogs = schema.table("excel_upload_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  totalRows: integer("total_rows").notNull().default(0),
  successRows: integer("success_rows").notNull().default(0),
  failedRows: integer("failed_rows").notNull().default(0),
  errorDetails: jsonb("error_details"),
  status: text("status").notNull().default("processing"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============ RFP ============

export const rfpDocuments = schema.table("rfp_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  customerId: uuid("customer_id").references(() => customers.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status").notNull().default("uploaded"),
  parsedRequirements: jsonb("parsed_requirements"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_rfp_tenant").on(table.tenantId),
]);

// ============ 견적 ============

export const quotations = schema.table("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  rfpId: uuid("rfp_id").references(() => rfpDocuments.id, { onDelete: "set null" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  quotationNumber: text("quotation_number").notNull(),
  revision: integer("revision").notNull().default(1),
  parentQuotationId: uuid("parent_quotation_id"),
  quotationType: text("quotation_type").notNull(),
  totalCost: bigint("total_cost", { mode: "number" }).notNull().default(0),
  totalSupply: bigint("total_supply", { mode: "number" }).notNull().default(0),
  vat: bigint("vat", { mode: "number" }).notNull().default(0),
  totalAmount: bigint("total_amount", { mode: "number" }).notNull().default(0),
  status: text("status").notNull().default("draft"),
  source: text("source"),  // "rfp" | "excel" | "chat" | null
  sourceData: jsonb("source_data"),  // 작성 중간 데이터 JSONB
  validityDate: date("validity_date").notNull(),
  deliveryTerms: text("delivery_terms"),
  deliveryDate: date("delivery_date"),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_quotations_tenant").on(table.tenantId),
  index("idx_quotations_customer").on(table.customerId),
  uniqueIndex("idx_quotations_unique").on(table.tenantId, table.quotationNumber, table.revision),
]);

export const quotationItems = schema.table("quotation_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull().default("hardware"),
  partId: uuid("part_id").references(() => parts.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  itemSpec: text("item_spec"),
  quantity: integer("quantity").notNull().default(1),
  unit: text("unit").notNull().default("EA"),
  unitCostPrice: bigint("unit_cost_price", { mode: "number" }).notNull().default(0),
  unitSupplyPrice: bigint("unit_supply_price", { mode: "number" }).notNull().default(0),
  amount: bigint("amount", { mode: "number" }).notNull().default(0),
  marginRate: numeric("margin_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  index("idx_quotation_items_quotation").on(table.quotationId),
]);

// ============ 낙찰 이력 ============

export const bidResults = schema.table("bid_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  result: text("result").notNull(),
  reason: text("reason"),
  competitorPrice: bigint("competitor_price", { mode: "number" }),
  recordedBy: uuid("recorded_by").notNull().references(() => users.id),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============ 실판매 기록 ============

export const actualSales = schema.table("actual_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  quotationId: uuid("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  contractNumber: text("contract_number"),
  contractDate: date("contract_date"),
  deliveryDate: date("delivery_date"),
  totalCost: bigint("total_cost", { mode: "number" }).notNull().default(0),
  totalSupply: bigint("total_supply", { mode: "number" }).notNull().default(0),
  totalAmount: bigint("total_amount", { mode: "number" }).notNull().default(0),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_actual_sales_quotation").on(table.quotationId),
  index("idx_actual_sales_tenant").on(table.tenantId),
]);

export const actualSaleItems = schema.table("actual_sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  actualSaleId: uuid("actual_sale_id").notNull().references(() => actualSales.id, { onDelete: "cascade" }),
  quotationItemId: uuid("quotation_item_id").references(() => quotationItems.id, { onDelete: "set null" }),
  changeType: text("change_type").notNull().default("unchanged"),
  itemName: text("item_name").notNull(),
  itemSpec: text("item_spec"),
  quantity: integer("quantity").notNull().default(1),
  unit: text("unit").notNull().default("EA"),
  unitCostPrice: bigint("unit_cost_price", { mode: "number" }).notNull().default(0),
  unitSupplyPrice: bigint("unit_supply_price", { mode: "number" }).notNull().default(0),
  amount: bigint("amount", { mode: "number" }).notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  index("idx_actual_sale_items_sale").on(table.actualSaleId),
]);

// ============ 감사 로그 ============

export const auditLogs = schema.table("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  changes: jsonb("changes"),
  ipAddress: inet("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_audit_logs_tenant").on(table.tenantId),
  index("idx_audit_logs_created").on(table.createdAt),
]);

// ============ 알림 ============

export const notifications = schema.table("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  relatedResourceType: text("related_resource_type"),
  relatedResourceId: uuid("related_resource_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_notifications_user").on(table.userId, table.isRead),
]);

// ============ AI 프롬프트 관리 ============

export const aiPrompts = schema.table("ai_prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  outputSchema: text("output_schema"),
  modelName: text("model_name"),
  temperature: numeric("temperature"),
  maxTokens: integer("max_tokens"),
  isActive: boolean("is_active").notNull().default(true),
  isSystem: boolean("is_system").notNull().default(false),
  version: integer("version").notNull().default(1),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_ai_prompts_slug_tenant").on(table.tenantId, table.slug),
  index("idx_ai_prompts_category").on(table.category),
]);

// --- IT 인프라 장비 코드 (21) ---
export const equipmentCodes = schema.table("equipment_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  parentId: uuid("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_equipment_codes_tenant_code").on(table.tenantId, table.code),
  index("idx_equipment_codes_parent").on(table.parentId),
  index("idx_equipment_codes_level").on(table.tenantId, table.level),
]);

// --- 서버 파트 코드 (22) ---
export const partCodes = schema.table("part_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  parentId: uuid("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_part_codes_tenant_code").on(table.tenantId, table.code),
  index("idx_part_codes_parent").on(table.parentId),
  index("idx_part_codes_level").on(table.tenantId, table.level),
]);

// --- IT 인프라 장비 제품 (23) ---
export const equipmentProducts = schema.table("equipment_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  equipmentCodeId: uuid("equipment_code_id").notNull().references(() => equipmentCodes.id),
  modelName: text("model_name").notNull(),
  manufacturer: text("manufacturer").notNull(),
  specs: jsonb("specs").notNull().default({}),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_equipment_products_tenant").on(table.tenantId),
  index("idx_equipment_products_code").on(table.equipmentCodeId),
]);

// --- IT 인프라 장비 가격 (24) ---
export const equipmentProductPrices = schema.table("equipment_product_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => equipmentProducts.id, { onDelete: "cascade" }),
  listPrice: bigint("list_price", { mode: "number" }).notNull().default(0),
  marketPrice: bigint("market_price", { mode: "number" }).notNull().default(0),
  supplyPrice: bigint("supply_price", { mode: "number" }).notNull().default(0),
}, (table) => [
  uniqueIndex("idx_equipment_product_prices_product").on(table.productId),
]);

// --- IT 인프라 장비 가격 변동 이력 (25) ---
export const equipmentPriceHistory = schema.table("equipment_price_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => equipmentProducts.id),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  changeType: text("change_type").notNull(),
  listPriceBefore: bigint("list_price_before", { mode: "number" }).notNull().default(0),
  listPriceAfter: bigint("list_price_after", { mode: "number" }).notNull().default(0),
  marketPriceBefore: bigint("market_price_before", { mode: "number" }).notNull().default(0),
  marketPriceAfter: bigint("market_price_after", { mode: "number" }).notNull().default(0),
  supplyPriceBefore: bigint("supply_price_before", { mode: "number" }).notNull().default(0),
  supplyPriceAfter: bigint("supply_price_after", { mode: "number" }).notNull().default(0),
  changedBy: uuid("changed_by").references(() => users.id),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_equipment_price_history_product").on(table.productId),
  index("idx_equipment_price_history_tenant").on(table.tenantId),
]);

// --- AI 대화 세션 (26) ---
export const aiChatSessions = schema.table("ai_chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  customerId: uuid("customer_id").references(() => customers.id),
  threadId: text("thread_id").notNull(),
  mode: text("mode").notNull().default("free"),
  status: text("status").notNull().default("active"),
  finalSpecs: jsonb("final_specs"),
  quotationId: uuid("quotation_id"),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_ai_chat_sessions_user").on(table.userId),
  index("idx_ai_chat_sessions_tenant").on(table.tenantId),
  uniqueIndex("idx_ai_chat_sessions_thread").on(table.threadId),
]);

// --- AI 대화 메시지 (27) ---
export const aiChatMessages = schema.table("ai_chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => aiChatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  specs: jsonb("specs"),
  tokenCount: integer("token_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_ai_chat_messages_session").on(table.sessionId),
]);

// --- AI 설정 (29) ---
export const aiSettings = schema.table("ai_settings", {
  id: text("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("openai"),
  openaiModel: text("openai_model").notNull().default("gpt-4o"),
  openaiApiKey: text("openai_api_key"),
  claudeModel: text("claude_model").notNull().default("claude-sonnet-4-6"),
  claudeApiKey: text("claude_api_key"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- LLM API 호출 로그 (28) ---
export const llmApiCalls = schema.table("llm_api_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  sessionId: uuid("session_id").references(() => aiChatSessions.id),
  promptSlug: text("prompt_slug").notNull(),
  modelName: text("model_name").notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  estimatedCost: numeric("estimated_cost"),
  latencyMs: integer("latency_ms"),
  requestSummary: text("request_summary"),
  responseSummary: text("response_summary"),
  status: text("status").notNull().default("success"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_llm_api_calls_tenant").on(table.tenantId),
  index("idx_llm_api_calls_session").on(table.sessionId),
  index("idx_llm_api_calls_created").on(table.createdAt),
]);
