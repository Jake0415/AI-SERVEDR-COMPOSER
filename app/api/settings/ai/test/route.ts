// ============================================================
// POST /api/settings/ai/test — AI API Key 연결 테스트 (OpenAI / Claude)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, aiSettings } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const ADMIN_ROLES = new Set(["super_admin", "admin"]);
const SETTINGS_ID = "default";

/** DB에서 복호화된 OpenAI API Key 조회, 없으면 환경변수 폴백 */
async function resolveOpenAIApiKey(): Promise<string | null> {
  try {
    const rows = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.id, SETTINGS_ID))
      .limit(1);

    if (rows[0]?.openaiApiKey) {
      return decrypt(rows[0].openaiApiKey);
    }
  } catch {
    // DB 조회 또는 복호화 실패 시 환경변수 폴백
  }

  return process.env.OPENAI_API_KEY ?? null;
}

/** DB에서 복호화된 Claude API Key 조회, 없으면 환경변수 폴백 */
async function resolveClaudeApiKey(): Promise<string | null> {
  try {
    const rows = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.id, SETTINGS_ID))
      .limit(1);

    if (rows[0]?.claudeApiKey) {
      return decrypt(rows[0].claudeApiKey);
    }
  } catch {
    // DB 조회 또는 복호화 실패 시 환경변수 폴백
  }

  return process.env.ANTHROPIC_API_KEY ?? null;
}

/** OpenAI 연결 테스트 */
async function testOpenAI(): Promise<NextResponse> {
  const apiKey = await resolveOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: { code: "NO_API_KEY", message: "OpenAI API Key가 설정되지 않았습니다. DB 또는 환경변수에 키를 설정하세요." },
    }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });
  const models = await client.models.list();
  const modelCount = models.data.length;

  return NextResponse.json({
    success: true,
    data: {
      message: "OpenAI API 연결 테스트 성공",
      modelCount,
    },
  });
}

/** Claude 연결 테스트 (fetch 방식) */
async function testClaude(): Promise<NextResponse> {
  const claudeKey = await resolveClaudeApiKey();
  if (!claudeKey) {
    return NextResponse.json({
      success: false,
      error: { code: "NO_API_KEY", message: "Claude API Key가 설정되지 않았습니다. DB 또는 환경변수에 키를 설정하세요." },
    }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": claudeKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hi" }],
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    if (res.status === 401) {
      return NextResponse.json({
        success: false,
        error: { code: "AUTH_FAILED", message: "Claude API Key 인증에 실패했습니다. 키를 확인해주세요." },
      }, { status: 401 });
    }
    throw new Error(`Claude API 오류 (${res.status}): ${errorBody}`);
  }

  return NextResponse.json({
    success: true,
    data: {
      message: "Claude API 연결 테스트 성공",
    },
  });
}

/** POST — AI API 연결 테스트 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    if (!ADMIN_ROLES.has(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "관리자 권한이 필요합니다." } },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({})) as {
      provider?: "openai" | "claude";
    };
    const provider = body.provider ?? "openai";

    if (provider === "claude") {
      return await testClaude();
    }

    return await testOpenAI();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // OpenAI API 에러 구분
    if (error instanceof OpenAI.AuthenticationError) {
      return NextResponse.json({
        success: false,
        error: { code: "AUTH_FAILED", message: "API Key 인증에 실패했습니다. 키를 확인해주세요." },
      }, { status: 401 });
    }

    // eslint-disable-next-line no-console
    console.error("[API Error] POST /api/settings/ai/test", message);
    return NextResponse.json(
      { success: false, error: { code: "TEST_FAILED", message: "API 연결 테스트에 실패했습니다." } },
      { status: 500 },
    );
  }
}
