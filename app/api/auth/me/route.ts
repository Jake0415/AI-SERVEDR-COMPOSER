// ============================================================
// 현재 로그인 사용자 정보 API — GET /api/auth/me
// ============================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import type { ApiResponse } from "@/lib/types";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  department: string;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    return NextResponse.json<ApiResponse<UserData>>({
      success: true,
      data: user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "사용자 정보 조회 실패";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}
