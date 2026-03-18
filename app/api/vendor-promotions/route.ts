// ============================================================
// GET/POST /api/vendor-promotions — 벤더 프로모션 관리
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { handleApiError } from "@/lib/errors";

// 프로모션은 추후 DB 테이블 추가 시 연동
// 현재는 인메모리 구조로 API 골격 제공

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } }, { status: 401 });
    }
    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } }, { status: 401 });
    }
    if (user.role === "member") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "관리자 이상만 등록할 수 있습니다." } }, { status: 403 });
    }
    const body = await request.json();
    return NextResponse.json({ success: true, data: { id: crypto.randomUUID(), ...body, createdAt: new Date().toISOString() } });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
