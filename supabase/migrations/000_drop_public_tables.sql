-- ============================================================
-- 기존 public 스키마 테이블 삭제 (ai_server_composer 스키마 전환용)
-- ※ 이 스크립트를 먼저 실행한 후 001~004를 실행하세요
-- ============================================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.get_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

-- 의존성 역순으로 테이블 삭제
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.bid_results CASCADE;
DROP TABLE IF EXISTS public.quotation_items CASCADE;
DROP TABLE IF EXISTS public.quotations CASCADE;
DROP TABLE IF EXISTS public.rfp_documents CASCADE;
DROP TABLE IF EXISTS public.excel_upload_logs CASCADE;
DROP TABLE IF EXISTS public.price_snapshot_settings CASCADE;
DROP TABLE IF EXISTS public.price_snapshots CASCADE;
DROP TABLE IF EXISTS public.part_price_history CASCADE;
DROP TABLE IF EXISTS public.part_prices CASCADE;
DROP TABLE IF EXISTS public.parts CASCADE;
DROP TABLE IF EXISTS public.part_categories CASCADE;
DROP TABLE IF EXISTS public.customer_contacts CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
