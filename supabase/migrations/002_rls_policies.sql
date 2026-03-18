-- ============================================================
-- RLS (Row Level Security) 정책 — 테넌트 격리
-- 스키마: ai_server_composer
-- ============================================================

-- 헬퍼 함수: 현재 인증 사용자의 tenant_id 반환
CREATE OR REPLACE FUNCTION ai_server_composer.get_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM ai_server_composer.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 헬퍼 함수: 현재 인증 사용자의 role 반환
CREATE OR REPLACE FUNCTION ai_server_composer.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM ai_server_composer.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============ RLS 활성화 ============

ALTER TABLE ai_server_composer.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.part_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.part_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.part_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.price_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.price_snapshot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.excel_upload_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.rfp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.bid_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_server_composer.notifications ENABLE ROW LEVEL SECURITY;

-- ============ tenants ============

CREATE POLICY "tenants_select" ON ai_server_composer.tenants
  FOR SELECT USING (id = ai_server_composer.get_tenant_id());

CREATE POLICY "tenants_update" ON ai_server_composer.tenants
  FOR UPDATE USING (
    id = ai_server_composer.get_tenant_id()
    AND ai_server_composer.get_user_role() IN ('super_admin', 'admin')
  );

-- ============ users ============

CREATE POLICY "users_select" ON ai_server_composer.users
  FOR SELECT USING (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "users_insert" ON ai_server_composer.users
  FOR INSERT WITH CHECK (
    tenant_id = ai_server_composer.get_tenant_id()
    AND ai_server_composer.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "users_update" ON ai_server_composer.users
  FOR UPDATE USING (
    tenant_id = ai_server_composer.get_tenant_id()
    AND (id = auth.uid() OR ai_server_composer.get_user_role() = 'super_admin')
  );

CREATE POLICY "users_delete" ON ai_server_composer.users
  FOR DELETE USING (
    tenant_id = ai_server_composer.get_tenant_id()
    AND ai_server_composer.get_user_role() = 'super_admin'
    AND id != auth.uid()
  );

-- ============ tenant_id 직접 보유 테이블 ============

CREATE POLICY "customers_all" ON ai_server_composer.customers
  FOR ALL USING (tenant_id = ai_server_composer.get_tenant_id())
  WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "part_categories_all" ON ai_server_composer.part_categories
  FOR ALL USING (tenant_id = ai_server_composer.get_tenant_id())
  WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "parts_all" ON ai_server_composer.parts
  FOR ALL USING (tenant_id = ai_server_composer.get_tenant_id())
  WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "part_price_history_all" ON ai_server_composer.part_price_history
  FOR ALL USING (tenant_id = ai_server_composer.get_tenant_id())
  WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "price_snapshots_all" ON ai_server_composer.price_snapshots
  FOR ALL USING (tenant_id = ai_server_composer.get_tenant_id())
  WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "price_snapshot_settings_all" ON ai_server_composer.price_snapshot_settings
  FOR ALL USING (tenant_id = ai_server_composer.get_tenant_id())
  WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "excel_upload_logs_all" ON ai_server_composer.excel_upload_logs
  FOR ALL USING (tenant_id = ai_server_composer.get_tenant_id())
  WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "rfp_documents_all" ON ai_server_composer.rfp_documents
  FOR ALL USING (tenant_id = ai_server_composer.get_tenant_id())
  WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "quotations_all" ON ai_server_composer.quotations
  FOR ALL USING (tenant_id = ai_server_composer.get_tenant_id())
  WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "audit_logs_select" ON ai_server_composer.audit_logs
  FOR SELECT USING (tenant_id = ai_server_composer.get_tenant_id());

CREATE POLICY "audit_logs_insert" ON ai_server_composer.audit_logs
  FOR INSERT WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());

-- ============ 조인 기반 테이블 ============

CREATE POLICY "part_prices_select" ON ai_server_composer.part_prices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ai_server_composer.parts WHERE parts.id = part_prices.part_id AND parts.tenant_id = ai_server_composer.get_tenant_id())
  );

CREATE POLICY "part_prices_insert" ON ai_server_composer.part_prices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ai_server_composer.parts WHERE parts.id = part_prices.part_id AND parts.tenant_id = ai_server_composer.get_tenant_id())
  );

CREATE POLICY "part_prices_update" ON ai_server_composer.part_prices
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ai_server_composer.parts WHERE parts.id = part_prices.part_id AND parts.tenant_id = ai_server_composer.get_tenant_id())
  );

CREATE POLICY "part_prices_delete" ON ai_server_composer.part_prices
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM ai_server_composer.parts WHERE parts.id = part_prices.part_id AND parts.tenant_id = ai_server_composer.get_tenant_id())
  );

CREATE POLICY "customer_contacts_all" ON ai_server_composer.customer_contacts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM ai_server_composer.customers WHERE customers.id = customer_contacts.customer_id AND customers.tenant_id = ai_server_composer.get_tenant_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM ai_server_composer.customers WHERE customers.id = customer_contacts.customer_id AND customers.tenant_id = ai_server_composer.get_tenant_id())
  );

CREATE POLICY "quotation_items_all" ON ai_server_composer.quotation_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM ai_server_composer.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.tenant_id = ai_server_composer.get_tenant_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM ai_server_composer.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.tenant_id = ai_server_composer.get_tenant_id())
  );

CREATE POLICY "bid_results_all" ON ai_server_composer.bid_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM ai_server_composer.quotations WHERE quotations.id = bid_results.quotation_id AND quotations.tenant_id = ai_server_composer.get_tenant_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM ai_server_composer.quotations WHERE quotations.id = bid_results.quotation_id AND quotations.tenant_id = ai_server_composer.get_tenant_id())
  );

-- ============ notifications (본인만) ============

CREATE POLICY "notifications_select" ON ai_server_composer.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON ai_server_composer.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON ai_server_composer.notifications
  FOR INSERT WITH CHECK (tenant_id = ai_server_composer.get_tenant_id());
