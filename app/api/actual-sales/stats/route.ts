// ============================================================
// GET /api/actual-sales/stats — 실판매 통계 (정확도, 마진 비교 등)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, gte, and, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, actualSales, quotations } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") ?? "12");

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    // 실판매 + 견적 조인 조회
    const rows = await db
      .select({
        saleId: actualSales.id,
        saleTotal: actualSales.totalAmount,
        saleCost: actualSales.totalCost,
        saleSupply: actualSales.totalSupply,
        quotationTotal: quotations.totalAmount,
        quotationCost: quotations.totalCost,
        quotationSupply: quotations.totalSupply,
        createdAt: actualSales.createdAt,
      })
      .from(actualSales)
      .innerJoin(quotations, eq(quotations.id, actualSales.quotationId))
      .where(
        and(
          eq(actualSales.tenantId, user.tenantId),
          gte(actualSales.createdAt, since),
        ),
      );

    const totalRecords = rows.length;
    if (totalRecords === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalRecords: 0,
          avgAccuracy: 0,
          avgMarginDeviation: 0,
          totalActualAmount: 0,
          totalQuotationAmount: 0,
        },
      });
    }

    // 정확도 계산
    const accuracies = rows.map((r) =>
      r.quotationTotal > 0 ? (r.saleTotal / r.quotationTotal) * 100 : 100,
    );
    const avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / totalRecords * 100) / 100;

    // 마진 편차
    const marginDeviations = rows.map((r) => {
      const qMargin = r.quotationSupply - r.quotationCost;
      const sMargin = r.saleSupply - r.saleCost;
      return sMargin - qMargin;
    });
    const avgMarginDeviation = Math.round(marginDeviations.reduce((a, b) => a + b, 0) / totalRecords);

    const totalActualAmount = rows.reduce((sum, r) => sum + r.saleTotal, 0);
    const totalQuotationAmount = rows.reduce((sum, r) => sum + r.quotationTotal, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalRecords,
        avgAccuracy,
        avgMarginDeviation,
        totalActualAmount,
        totalQuotationAmount,
      },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
