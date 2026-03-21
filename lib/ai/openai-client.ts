// ============================================================
// OpenAI 클라이언트 래퍼 — 서버 전용 (server-only)
// ============================================================

import "server-only";

import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db, aiSettings } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

let clientInstance: OpenAI | null = null;
let cachedApiKey: string | null = null;

/** DB ai_settings에서 암호화된 API Key 복호화 조회 */
async function getApiKeyFromDb(): Promise<string | null> {
  try {
    const rows = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.id, "default"))
      .limit(1);

    if (rows[0]?.openaiApiKey) {
      return decrypt(rows[0].openaiApiKey);
    }
  } catch {
    // DB 실패 시 null
  }
  return null;
}

/** OpenAI 클라이언트 (DB Key 우선 → 환경변수 폴백) */
export async function getOpenAIClient(): Promise<OpenAI> {
  // 1. DB에서 API Key 조회
  const dbKey = await getApiKeyFromDb();

  // 2. 환경변수 폴백
  const apiKey = dbKey ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API Key가 설정되지 않았습니다. DB 또는 환경변수를 확인하세요.");
  }

  // Key가 변경되었으면 클라이언트 재생성
  if (!clientInstance || cachedApiKey !== apiKey) {
    clientInstance = new OpenAI({ apiKey });
    cachedApiKey = apiKey;
  }

  return clientInstance;
}

/** 사용할 모델명 (DB 우선 → 환경변수 폴백) */
export async function getModelName(): Promise<string> {
  try {
    const rows = await db
      .select({ openaiModel: aiSettings.openaiModel })
      .from(aiSettings)
      .where(eq(aiSettings.id, "default"))
      .limit(1);

    if (rows[0]?.openaiModel) {
      return rows[0].openaiModel;
    }
  } catch {
    // DB 실패 시 환경변수 폴백
  }
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}

/** 활성 AI 프로바이더 조회 (DB 우선 → 기본값 "openai") */
export async function getActiveProvider(): Promise<"openai" | "claude"> {
  try {
    const rows = await db
      .select({ provider: aiSettings.provider })
      .from(aiSettings)
      .where(eq(aiSettings.id, "default"))
      .limit(1);

    const provider = rows[0]?.provider;
    if (provider === "claude") {
      return "claude";
    }
  } catch {
    // DB 실패 시 기본값
  }
  return "openai";
}

/** Claude 모델명 조회 (DB 우선 → 기본값) */
export async function getClaudeModelName(): Promise<string> {
  try {
    const rows = await db
      .select({ claudeModel: aiSettings.claudeModel })
      .from(aiSettings)
      .where(eq(aiSettings.id, "default"))
      .limit(1);

    if (rows[0]?.claudeModel) {
      return rows[0].claudeModel;
    }
  } catch {
    // DB 실패 시 기본값
  }
  return "claude-sonnet-4-6";
}

/** Claude API Key 조회 (DB 우선 → 환경변수 폴백) */
export async function getClaudeApiKey(): Promise<string | null> {
  try {
    const rows = await db
      .select({ claudeApiKey: aiSettings.claudeApiKey })
      .from(aiSettings)
      .where(eq(aiSettings.id, "default"))
      .limit(1);

    if (rows[0]?.claudeApiKey) {
      return decrypt(rows[0].claudeApiKey);
    }
  } catch {
    // DB 실패 시 환경변수 폴백
  }
  return process.env.ANTHROPIC_API_KEY ?? null;
}

/** 구조화된 JSON 응답 요청 옵션 */
export interface StructuredJsonOptions {
  model?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

/** 구조화된 JSON 응답 요청 */
export async function requestStructuredJson<T>(
  systemPrompt: string,
  userContent: string,
  parseResponse: (raw: string) => T,
  options?: StructuredJsonOptions,
): Promise<T> {
  const client = await getOpenAIClient();
  const model = options?.model || await getModelName();
  const temperature = options?.temperature ?? 0.1;
  const maxTokens = options?.maxTokens ?? 4096;

  const messages = options?.messages ?? [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userContent },
  ];

  const response = await client.chat.completions.create({
    model,
    messages,
    response_format: { type: "json_object" },
    temperature,
    max_tokens: maxTokens,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 응답이 비어있습니다.");
  }

  return parseResponse(content);
}
