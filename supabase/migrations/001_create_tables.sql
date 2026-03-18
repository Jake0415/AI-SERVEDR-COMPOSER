-- ============================================================
-- AI-SERVER-COMPOSER: 전용 스키마 + 17개 테이블 생성
-- ============================================================

-- 확장 활성화
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 전용 스키마 생성
CREATE SCHEMA IF NOT EXISTS ai_server_composer;

-- ============ 테넌트/사용자 ============

CREATE TABLE ai_server_composer.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  business_number TEXT NOT NULL,
  ceo_name TEXT NOT NULL,
  address TEXT NOT NULL,
  business_type TEXT NOT NULL,
  business_item TEXT NOT NULL,
  phone TEXT NOT NULL,
  fax TEXT,
  email TEXT NOT NULL,
  logo_url TEXT,
  seal_url TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  default_validity_days INTEGER NOT NULL DEFAULT 30,
  default_payment_terms TEXT,
  quotation_prefix TEXT NOT NULL DEFAULT 'Q',
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free','basic','pro','enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_server_composer.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin','admin','member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_tenant ON ai_server_composer.users(tenant_id);
CREATE UNIQUE INDEX idx_users_email ON ai_server_composer.users(email);

-- ============ 거래처 ============

CREATE TABLE ai_server_composer.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  business_number TEXT,
  ceo_name TEXT,
  address TEXT,
  business_type TEXT,
  business_item TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  customer_type TEXT NOT NULL DEFAULT 'private' CHECK (customer_type IN ('public','private','other')),
  payment_terms TEXT,
  notes TEXT,
  is_frequent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_tenant ON ai_server_composer.customers(tenant_id);

CREATE TABLE ai_server_composer.customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES ai_server_composer.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT,
  position TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_customer_contacts_customer ON ai_server_composer.customer_contacts(customer_id);

-- ============ 부품 ============

CREATE TABLE ai_server_composer.part_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  "group" TEXT NOT NULL CHECK ("group" IN ('server_parts','network_infra')),
  spec_fields JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);
CREATE INDEX idx_part_categories_tenant ON ai_server_composer.part_categories(tenant_id);

CREATE TABLE ai_server_composer.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES ai_server_composer.part_categories(id) ON DELETE RESTRICT,
  model_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  specs JSONB NOT NULL DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_parts_tenant ON ai_server_composer.parts(tenant_id);
CREATE INDEX idx_parts_category ON ai_server_composer.parts(category_id);
CREATE INDEX idx_parts_model ON ai_server_composer.parts(model_name);

CREATE TABLE ai_server_composer.part_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES ai_server_composer.parts(id) ON DELETE CASCADE,
  list_price BIGINT NOT NULL DEFAULT 0,
  market_price BIGINT NOT NULL DEFAULT 0,
  cost_price_encrypted BYTEA,
  supply_price BIGINT NOT NULL DEFAULT 0,
  UNIQUE(part_id)
);

CREATE TABLE ai_server_composer.part_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES ai_server_composer.parts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('manual','excel_upload','snapshot')),
  list_price_before BIGINT,
  list_price_after BIGINT NOT NULL,
  market_price_before BIGINT,
  market_price_after BIGINT NOT NULL,
  cost_price_before BIGINT,
  cost_price_after BIGINT NOT NULL,
  supply_price_before BIGINT,
  supply_price_after BIGINT NOT NULL,
  changed_by UUID NOT NULL REFERENCES ai_server_composer.users(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_price_history_part ON ai_server_composer.part_price_history(part_id);
CREATE INDEX idx_price_history_tenant ON ai_server_composer.part_price_history(tenant_id);

-- ============ 가격 스냅샷 ============

CREATE TABLE ai_server_composer.price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '[]',
  part_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, snapshot_date)
);

CREATE TABLE ai_server_composer.price_snapshot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  snapshot_hour INTEGER NOT NULL DEFAULT 9 CHECK (snapshot_hour BETWEEN 0 AND 23),
  retention_months INTEGER NOT NULL DEFAULT 12,
  last_snapshot_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- ============ 엑셀 업로드 ============

CREATE TABLE ai_server_composer.excel_upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES ai_server_composer.users(id),
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','completed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ RFP ============

CREATE TABLE ai_server_composer.rfp_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES ai_server_composer.users(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','parsing','parsed','error')),
  parsed_requirements JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rfp_tenant ON ai_server_composer.rfp_documents(tenant_id);

-- ============ 견적 ============

CREATE TABLE ai_server_composer.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  rfp_id UUID REFERENCES ai_server_composer.rfp_documents(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES ai_server_composer.customers(id) ON DELETE RESTRICT,
  quotation_number TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  parent_quotation_id UUID REFERENCES ai_server_composer.quotations(id) ON DELETE SET NULL,
  quotation_type TEXT NOT NULL CHECK (quotation_type IN ('profitability','spec_match','performance')),
  total_cost BIGINT NOT NULL DEFAULT 0,
  total_supply BIGINT NOT NULL DEFAULT 0,
  vat BIGINT NOT NULL DEFAULT 0,
  total_amount BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published','won','lost','pending','expired')),
  validity_date DATE NOT NULL,
  delivery_terms TEXT,
  delivery_date DATE,
  payment_terms TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES ai_server_composer.users(id),
  approved_by UUID REFERENCES ai_server_composer.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, quotation_number, revision)
);
CREATE INDEX idx_quotations_tenant ON ai_server_composer.quotations(tenant_id);
CREATE INDEX idx_quotations_customer ON ai_server_composer.quotations(customer_id);

CREATE TABLE ai_server_composer.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES ai_server_composer.quotations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'hardware' CHECK (item_type IN ('hardware','software','service','maintenance')),
  part_id UUID REFERENCES ai_server_composer.parts(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  item_spec TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'EA',
  unit_cost_price BIGINT NOT NULL DEFAULT 0,
  unit_supply_price BIGINT NOT NULL DEFAULT 0,
  amount BIGINT NOT NULL DEFAULT 0,
  margin_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_quotation_items_quotation ON ai_server_composer.quotation_items(quotation_id);

-- ============ 낙찰 이력 ============

CREATE TABLE ai_server_composer.bid_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES ai_server_composer.quotations(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK (result IN ('won','lost','pending','expired')),
  reason TEXT,
  competitor_price BIGINT,
  recorded_by UUID NOT NULL REFERENCES ai_server_composer.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ 감사 로그 ============

CREATE TABLE ai_server_composer.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES ai_server_composer.users(id),
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_tenant ON ai_server_composer.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created ON ai_server_composer.audit_logs(created_at DESC);

-- ============ 알림 ============

CREATE TABLE ai_server_composer.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES ai_server_composer.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES ai_server_composer.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_resource_type TEXT,
  related_resource_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON ai_server_composer.notifications(user_id, is_read);
