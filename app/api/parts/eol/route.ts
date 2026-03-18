// ============================================================
// GET /api/parts/eol — EOL/EOS 임박 부품 목록 조회
// ============================================================

import { NextResponse } from "next/server";
import { eq, and, lte, gte } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, parts, partCategories } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } }, { status: 401 });
    }

    // specs JSONB에 eol_date가 있는 부품 중 90일 이내 만료 부품 조회
    // 실제 구현은 eol_date 컬럼 추가 후 완성
    // 현재는 빈 배열 반환 (골격)
    return NextResponse.json({
      success: true,
      data: [],
      message: "EOL/EOS 관리를 위해 부품에 eol_date, eos_date 필드를 설정하세요.",
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
