// ============================================================
// POST /api/settings/ai/test — OpenAI API Key 연결 테스트
// ============================================================

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, aiSettings } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const ADMIN_ROLES = new Set(["super_admin", "admin"]);
const SETTINGS_ID = "default";

/** DB에서 복호화된 API Key 조회, 없으면 환경변수 폴백 */
async function resolveApiKey(): Promise<string | null> {
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

/** POST — OpenAI API 연결 테스트 */
export async function POST() {
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

    const apiKey = await resolveApiKey();
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: { code: "NO_API_KEY", message: "API Key가 설정되지 않았습니다. DB 또는 환경변수에 키를 설정하세요." },
      }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });

    // 간단한 테스트: 모델 목록 조회
    const models = await client.models.list();
    const modelCount = models.data.length;

    return NextResponse.json({
      success: true,
      data: {
        message: "OpenAI API 연결 테스트 성공",
        modelCount,
      },
    });
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
