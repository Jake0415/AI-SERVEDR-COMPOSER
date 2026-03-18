// ============================================================
// GET /api/rfp — RFP 문서 목록 조회
// ============================================================

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, rfpDocuments } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const rows = await db
      .select()
      .from(rfpDocuments)
      .where(eq(rfpDocuments.tenantId, user.tenantId))
      .orderBy(desc(rfpDocuments.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}
