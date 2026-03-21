// ============================================================
// GET /api/rfp — RFP 문서 목록 조회
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, rfpDocuments } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const customerId = request.nextUrl.searchParams.get("customer_id");

    const conditions = [eq(rfpDocuments.tenantId, user.tenantId)];
    if (customerId) {
      conditions.push(eq(rfpDocuments.customerId, customerId));
    }

    const rows = await db
      .select()
      .from(rfpDocuments)
      .where(and(...conditions))
      .orderBy(desc(rfpDocuments.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("[API Error] /api/rfp", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "서버 내부 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
