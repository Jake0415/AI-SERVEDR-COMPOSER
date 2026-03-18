// ============================================================
// PUT /api/quotation/[id]/status — 견적 상태 변경
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

const VALID_STATUSES = ["draft", "review", "approved", "published", "won", "lost", "pending", "expired"];

export async function PUT(
  request: NextRequest,
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

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "유효하지 않은 상태입니다." } },
        { status: 400 },
      );
    }

    // 견적 존재 확인 + 테넌트 검증
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

    const updateData: Record<string, unknown> = { status };
    if (status === "published") {
      updateData.publishedAt = new Date();
    }
    if (status === "approved") {
      updateData.approvedBy = user.id;
    }

    const [updated] = await db
      .update(quotations)
      .set(updateData)
      .where(eq(quotations.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
