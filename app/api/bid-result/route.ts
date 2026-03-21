// ============================================================
// POST /api/bid-result — 낙찰/실패 결과 기록
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations, bidResults } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

const VALID_RESULTS = ["won", "lost", "pending", "expired"];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { quotation_id, result, reason, competitor_price } = body;

    if (!quotation_id || !result || !VALID_RESULTS.includes(result)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "필수 필드가 누락되었거나 유효하지 않습니다." } },
        { status: 400 },
      );
    }

    if (competitor_price !== undefined && competitor_price !== null) {
      const parsed = Number(competitor_price);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { success: false, error: { code: "BAD_REQUEST", message: "경쟁사 가격은 0 이상의 숫자여야 합니다." } },
          { status: 400 },
        );
      }
    }

    // 견적 존재 확인 + 테넌트 검증
    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotation_id))
      .limit(1);

    if (!quotation || quotation.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "견적을 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // 낙찰 결과 기록
    const [bidResult] = await db
      .insert(bidResults)
      .values({
        quotationId: quotation_id,
        result,
        reason: reason || null,
        competitorPrice: competitor_price ? Number(competitor_price) : null,
        recordedBy: user.id,
      })
      .returning();

    // 견적 상태 동시 업데이트
    await db
      .update(quotations)
      .set({ status: result })
      .where(eq(quotations.id, quotation_id));

    return NextResponse.json({ success: true, data: bidResult });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
