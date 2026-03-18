// ============================================================
// Drizzle 클라이언트 인스턴스 — 서버 전용, lazy 초기화
// ============================================================

import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

// lazy 초기화 (빌드 시 DATABASE_URL 없이도 에러 안남)
let _db: ReturnType<typeof createDrizzle> | null = null;

function createDrizzle() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  }

  const client = postgres(connectionString, {
    prepare: false,
  });

  return drizzle(client, {
    schema: { ...schema, ...relations },
  });
}

/** Drizzle DB 인스턴스 (lazy 초기화) */
export const db = new Proxy({} as ReturnType<typeof createDrizzle>, {
  get(_target, prop) {
    if (!_db) {
      _db = createDrizzle();
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// 스키마 re-export
export * from "./schema";
