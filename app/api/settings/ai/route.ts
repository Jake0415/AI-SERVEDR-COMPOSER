// ============================================================
// GET/PUT /api/settings/ai — AI 설정 (LLM API Key) 관리
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, aiSettings } from "@/lib/db";
import { encrypt, decrypt, maskApiKey } from "@/lib/encryption";

const ADMIN_ROLES = new Set(["super_admin", "admin"]);
const SETTINGS_ID = "default";

/** GET — AI 설정 조회 */
export async function GET() {
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

    const rows = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.id, SETTINGS_ID))
      .limit(1);

    const row = rows[0];
    const hasEnvKey = Boolean(process.env.OPENAI_API_KEY);
    const hasClaudeEnvKey = Boolean(process.env.ANTHROPIC_API_KEY);

    if (!row) {
      return NextResponse.json({
        success: true,
        data: {
          provider: "openai",
          openaiModel: "gpt-4o",
          hasApiKey: false,
          hasEnvKey,
          apiKeyMasked: null,
          claudeModel: "claude-sonnet-4-6",
          hasClaudeKey: false,
          hasClaudeEnvKey,
          claudeKeyMasked: null,
        },
      });
    }

    let hasApiKey = false;
    let apiKeyMasked: string | null = null;

    if (row.openaiApiKey) {
      try {
        const decrypted = decrypt(row.openaiApiKey);
        hasApiKey = true;
        apiKeyMasked = maskApiKey(decrypted);
      } catch {
        // 복호화 실패 시 키가 손상된 것으로 간주
        hasApiKey = false;
      }
    }

    let hasClaudeKey = false;
    let claudeKeyMasked: string | null = null;

    if (row.claudeApiKey) {
      try {
        const decrypted = decrypt(row.claudeApiKey);
        hasClaudeKey = true;
        claudeKeyMasked = maskApiKey(decrypted);
      } catch {
        // 복호화 실패 시 키가 손상된 것으로 간주
        hasClaudeKey = false;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: row.provider,
        openaiModel: row.openaiModel,
        hasApiKey,
        hasEnvKey,
        apiKeyMasked,
        claudeModel: row.claudeModel,
        hasClaudeKey,
        hasClaudeEnvKey,
        claudeKeyMasked,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error("[API Error] GET /api/settings/ai", message);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "서버 내부 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}

/** PUT — AI 설정 업데이트 (UPSERT) */
export async function PUT(request: NextRequest) {
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

    const body = await request.json() as {
      provider?: string;
      openaiModel?: string;
      openaiApiKey?: string;
      claudeModel?: string;
      claudeApiKey?: string;
    };

    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.provider) {
      updateValues.provider = body.provider;
    }

    if (body.openaiModel) {
      updateValues.openaiModel = body.openaiModel;
    }

    if (body.openaiApiKey) {
      updateValues.openaiApiKey = encrypt(body.openaiApiKey);
    }

    if (body.claudeModel) {
      updateValues.claudeModel = body.claudeModel;
    }

    if (body.claudeApiKey) {
      updateValues.claudeApiKey = encrypt(body.claudeApiKey);
    }

    // UPSERT: INSERT ... ON CONFLICT DO UPDATE
    await db
      .insert(aiSettings)
      .values({
        id: SETTINGS_ID,
        tenantId: user.tenantId,
        provider: (body.provider as string) || "openai",
        openaiModel: (body.openaiModel as string) || "gpt-4o",
        openaiApiKey: body.openaiApiKey ? encrypt(body.openaiApiKey) : null,
        claudeModel: (body.claudeModel as string) || "claude-sonnet-4-6",
        claudeApiKey: body.claudeApiKey ? encrypt(body.claudeApiKey) : null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: aiSettings.id,
        set: updateValues,
      });

    return NextResponse.json({
      success: true,
      data: { message: "AI 설정이 저장되었습니다." },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error("[API Error] PUT /api/settings/ai", message);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "서버 내부 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
