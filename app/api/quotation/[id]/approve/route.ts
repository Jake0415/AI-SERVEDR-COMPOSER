// ============================================================
// POST /api/quotation/[id]/approve — 견적서 승인
// draft/review → approved 상태 전환
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    // 관리자 이상만 승인 가능
    if (user.role === "member") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "관리자 이상만 승인할 수 있습니다." } },
        { status: 403 },
      );
    }

    const { id } = await params;

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, id))
      .limit(1);

    if (!quotation || quotation.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "견적을 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    if (!["draft", "review"].includes(quotation.status)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_STATUS", message: `현재 상태(${quotation.status})에서는 승인할 수 없습니다.` } },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(quotations)
      .set({
        status: "approved",
        approvedBy: user.id,
      })
      .where(eq(quotations.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
