// ============================================================
// GET /api/parts/[id]/price-history — 부품별 가격 변동 이력 조회
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, desc, gte, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, parts, partPriceHistory } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "12"; // months

    // 부품 소유권 확인
    const [part] = await db
      .select()
      .from(parts)
      .where(eq(parts.id, id))
      .limit(1);

    if (!part || part.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "부품을 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // 기간 필터
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(period));

    const history = await db
      .select()
      .from(partPriceHistory)
      .where(
        and(
          eq(partPriceHistory.partId, id),
          gte(partPriceHistory.createdAt, monthsAgo),
        ),
      )
      .orderBy(desc(partPriceHistory.createdAt));

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
