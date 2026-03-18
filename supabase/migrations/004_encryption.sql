-- ============================================================
-- 원가(cost_price) AES-256 암호화/복호화 함수
-- 스키마: ai_server_composer
-- ============================================================

CREATE OR REPLACE FUNCTION ai_server_composer.encrypt_cost_price(price BIGINT, encryption_key TEXT)
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(price::text, encryption_key)
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION ai_server_composer.decrypt_cost_price(encrypted BYTEA, encryption_key TEXT)
RETURNS BIGINT AS $$
  SELECT pgp_sym_decrypt(encrypted, encryption_key)::bigint
$$ LANGUAGE sql IMMUTABLE;

-- ============================================================
-- Storage 버킷 생성 (RFP 문서 저장용)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('rfp-documents', 'rfp-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "rfp_storage_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'rfp-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "rfp_storage_download" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'rfp-documents'
    AND auth.role() = 'authenticated'
  );
