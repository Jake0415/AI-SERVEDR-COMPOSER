// ============================================================
// PUT /api/quotation/[id]/draft — 견적 초안 업데이트
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

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

    if (user.role !== "admin" && user.role !== "member") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { source_data, source } = body;

    // 해당 견적 조회 (테넌트 필터 포함)
    const [existing] = await db
      .select()
      .from(quotations)
      .where(
        and(
          eq(quotations.id, id),
          eq(quotations.tenantId, user.tenantId),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "견적을 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // draft 상태인 경우에만 업데이트 허용
    if (existing.status !== "draft") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "draft 상태의 견적만 업데이트할 수 있습니다." } },
        { status: 400 },
      );
    }

    // source 유효성 검사
    const validSources = ["rfp", "excel", "chat"];
    if (source && !validSources.includes(source)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "source는 rfp, excel, chat 중 하나여야 합니다." } },
        { status: 400 },
      );
    }

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {};
    if (source_data !== undefined) {
      updateData.sourceData = source_data;
    }
    if (source !== undefined) {
      updateData.source = source;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "업데이트할 필드가 없습니다." } },
        { status: 400 },
      );
    }

    await db
      .update(quotations)
      .set(updateData)
      .where(
        and(
          eq(quotations.id, id),
          eq(quotations.tenantId, user.tenantId),
        ),
      );

    return NextResponse.json({
      success: true,
      data: { message: "초안이 업데이트되었습니다." },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
