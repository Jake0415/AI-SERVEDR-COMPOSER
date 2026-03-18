// ============================================================
// POST /api/ai-price-recommendation — AI 가격 추천
// 낙찰 이력 기반 최적 가격 및 낙찰 확률 예측
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations, bidResults } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } }, { status: 401 });
    }

    const body = await request.json();
    const { total_supply, quotation_type } = body;

    // 과거 낙찰/실주 데이터 분석
    const pastQuotations = await db
      .select({
        totalSupply: quotations.totalSupply,
        totalAmount: quotations.totalAmount,
        status: quotations.status,
        result: bidResults.result,
        competitorPrice: bidResults.competitorPrice,
      })
      .from(quotations)
      .leftJoin(bidResults, eq(bidResults.quotationId, quotations.id))
      .where(
        and(
          eq(quotations.tenantId, user.tenantId),
          eq(quotations.quotationType, quotation_type ?? "spec_match"),
        ),
      );

    const wonQuotations = pastQuotations.filter((q) => q.result === "won");
    const lostQuotations = pastQuotations.filter((q) => q.result === "lost");
    const totalBids = wonQuotations.length + lostQuotations.length;

    // 낙찰률 계산
    const winRate = totalBids > 0 ? Math.round((wonQuotations.length / totalBids) * 100) : 50;

    // 평균 낙찰 금액 대비 추천
    const avgWonAmount = wonQuotations.length > 0
      ? Math.round(wonQuotations.reduce((s, q) => s + q.totalAmount, 0) / wonQuotations.length)
      : total_supply;

    // 경쟁사 평균 가격
    const competitorPrices = lostQuotations
      .filter((q) => q.competitorPrice && q.competitorPrice > 0)
      .map((q) => q.competitorPrice!);
    const avgCompetitor = competitorPrices.length > 0
      ? Math.round(competitorPrices.reduce((s, p) => s + p, 0) / competitorPrices.length)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        currentSupply: total_supply,
        recommendedSupply: avgWonAmount,
        winRate,
        avgCompetitorPrice: avgCompetitor,
        dataPoints: totalBids,
        recommendation: winRate >= 60
          ? "현재 가격대가 적절합니다."
          : winRate >= 40
            ? "가격을 소폭 낮추면 낙찰률을 높일 수 있습니다."
            : "가격 경쟁력을 크게 강화할 필요가 있습니다.",
      },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
