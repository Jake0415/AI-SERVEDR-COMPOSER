-- ============================================================
-- AI-SERVER-COMPOSER — PostgreSQL 부트스트랩 (01)
-- 확장 설치 + 스키마 생성. 테이블은 drizzle-kit push가 담당.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS "ai_server_composer";
