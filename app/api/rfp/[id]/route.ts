// ============================================================
// GET /api/rfp/[id] — RFP 문서 상세 조회
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, rfpDocuments } from "@/lib/db";

export async function GET(
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "RFP ID가 필요합니다." } },
        { status: 400 },
      );
    }

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

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}
