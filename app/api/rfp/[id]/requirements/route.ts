// ============================================================
// PUT /api/rfp/[id]/requirements — RFP 분석 결과 JSON 수정 저장
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, rfpDocuments } from "@/lib/db";

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

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "RFP ID가 필요합니다." } },
        { status: 400 },
      );
    }

    // RFP 존재 여부 확인
    const rows = await db
      .select()
      .from(rfpDocuments)
      .where(
        and(
          eq(rfpDocuments.id, id),
          eq(rfpDocuments.tenantId, user.tenantId),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "RFP를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // body에서 requirements JSON 객체 받기
    const body: unknown = await request.json();

    if (
      body === null ||
      typeof body !== "object" ||
      !("requirements" in body)
    ) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "requirements 필드가 필요합니다." } },
        { status: 400 },
      );
    }

    const { requirements } = body as { requirements: unknown };

    if (requirements === null || requirements === undefined) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "requirements 값이 비어있습니다." } },
        { status: 400 },
      );
    }

    // parsedRequirements 업데이트
    await db
      .update(rfpDocuments)
      .set({ parsedRequirements: requirements })
      .where(eq(rfpDocuments.id, id));

    return NextResponse.json({
      success: true,
      data: { message: "요구사항이 저장되었습니다." },
    });
  } catch (error) {
    console.error(
      "[API Error] /api/rfp/[id]/requirements",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "서버 내부 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
