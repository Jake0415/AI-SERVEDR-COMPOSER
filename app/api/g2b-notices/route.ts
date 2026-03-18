// ============================================================
// GET /api/g2b-notices — 나라장터 공고 조회 (공공데이터 API 연동 골격)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") ?? "서버";

    // G2B 공공데이터 API 연동 (API 키 설정 후 활성화)
    const g2bApiKey = process.env.G2B_API_KEY;
    if (!g2bApiKey) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "나라장터 API 키(G2B_API_KEY)를 설정하면 공고를 자동 수집합니다.",
      });
    }

    // 실제 API 호출은 키 설정 후 구현
    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
