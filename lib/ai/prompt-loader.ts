// ============================================================
// 프롬프트 로더 — DB에서 프롬프트 조회, 없으면 폴백 사용
// ============================================================

import "server-only";

import { db, aiPrompts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { DEFAULT_PROMPTS } from "./default-prompts";

export interface PromptConfig {
  systemPrompt: string;
  modelName: string | null;
  temperature: number | null;
  maxTokens: number | null;
}

/**
 * slug와 tenantId로 프롬프트를 로드합니다.
 * DB에 활성 프롬프트가 있으면 사용, 없으면 하드코딩된 폴백 사용.
 */
export async function getPrompt(slug: string, tenantId: string): Promise<PromptConfig> {
  try {
    const rows = await db
      .select()
      .from(aiPrompts)
      .where(
        and(
          eq(aiPrompts.tenantId, tenantId),
          eq(aiPrompts.slug, slug),
          eq(aiPrompts.isActive, true),
        ),
      )
      .limit(1);

    if (rows.length > 0) {
      const row = rows[0];
      return {
        systemPrompt: row.systemPrompt,
        modelName: row.modelName,
        temperature: row.temperature ? parseFloat(row.temperature) : null,
        maxTokens: row.maxTokens,
      };
    }
  } catch {
    // DB 연결 실패 등 — 폴백 사용
  }

  // 폴백: 기본 프롬프트
  const fallback = DEFAULT_PROMPTS[slug];
  if (!fallback) {
    throw new Error(`프롬프트를 찾을 수 없습니다: ${slug}`);
  }

  return {
    systemPrompt: fallback.systemPrompt,
    modelName: null,
    temperature: null,
    maxTokens: null,
  };
}
