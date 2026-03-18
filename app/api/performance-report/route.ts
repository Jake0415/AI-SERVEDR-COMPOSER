// ============================================================
// GET /api/performance-report — AI 성과 분석 리포트
// 월간/분기별 성과 데이터 + AI 인사이트 생성
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, gte, and, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations, bidResults } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") ?? "3");

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    // 기간 내 견적 통계
    const allQuotations = await db
      .select()
      .from(quotations)
      .where(and(eq(quotations.tenantId, user.tenantId), gte(quotations.createdAt, since)));

    const results = await db
      .select({ result: bidResults.result, quotationId: bidResults.quotationId })
      .from(bidResults)
      .innerJoin(quotations, eq(quotations.id, bidResults.quotationId))
      .where(and(eq(quotations.tenantId, user.tenantId), gte(bidResults.recordedAt, since)));

    const wonCount = results.filter((r) => r.result === "won").length;
    const lostCount = results.filter((r) => r.result === "lost").length;
    const totalBids = wonCount + lostCount;

    const totalQuotations = allQuotations.length;
    const totalAmount = allQuotations.reduce((s, q) => s + q.totalAmount, 0);
    const winRate = totalBids > 0 ? Math.round((wonCount / totalBids) * 100) : 0;

    const avgMargin = allQuotations.length > 0
      ? Math.round(allQuotations.reduce((s, q) => s + (q.totalSupply - q.totalCost), 0) / allQuotations.length)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: `최근 ${months}개월`,
        totalQuotations,
        totalBids,
        wonCount,
        lostCount,
        winRate,
        totalAmount,
        avgMargin,
        insights: [
          winRate >= 60 ? "낙찰률이 양호합니다." : "낙찰률 개선이 필요합니다.",
          `총 ${totalQuotations}건의 견적이 생성되었습니다.`,
          avgMargin > 0 ? `평균 마진: ${avgMargin.toLocaleString()}원` : "마진 데이터가 부족합니다.",
        ],
      },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
