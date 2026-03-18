-- ============================================================
-- AI-SERVER-COMPOSER — PostgreSQL 초기화 스크립트
-- Docker entrypoint에서 자동 실행됨
-- ============================================================

-- 전용 스키마 생성
CREATE SCHEMA IF NOT EXISTS ai_server_composer;

-- UUID 확장 (gen_random_uuid 사용을 위해)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 권한 부여
GRANT ALL ON SCHEMA ai_server_composer TO postgres;
GRANT USAGE ON SCHEMA ai_server_composer TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai_server_composer GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai_server_composer GRANT ALL ON SEQUENCES TO postgres;
