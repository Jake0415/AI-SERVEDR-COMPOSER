-- ============================================================
-- AI-SERVER-COMPOSER — 권한 부여 (03)
-- 스키마+테이블 생성 후 실행됨
-- ============================================================

GRANT ALL ON SCHEMA ai_server_composer TO postgres;
GRANT USAGE ON SCHEMA ai_server_composer TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai_server_composer GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai_server_composer GRANT ALL ON SEQUENCES TO postgres;
