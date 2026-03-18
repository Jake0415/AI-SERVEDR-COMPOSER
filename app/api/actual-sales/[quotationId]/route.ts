// ============================================================
// GET /api/actual-sales/[quotationId] — 실판매 상세 조회 (비교 데이터 포함)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, actualSales, actualSaleItems, quotations, quotationItems } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quotationId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const { quotationId } = await params;

    // 실판매 기록 조회
    const [sale] = await db
      .select()
      .from(actualSales)
      .where(eq(actualSales.quotationId, quotationId))
      .limit(1);

    if (!sale || sale.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "실판매 기록을 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // 실판매 항목
    const saleItems = await db
      .select()
      .from(actualSaleItems)
      .where(eq(actualSaleItems.actualSaleId, sale.id))
      .orderBy(asc(actualSaleItems.sortOrder));

    // 원본 견적 + 항목
    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId))
      .limit(1);

    const qItems = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotationId))
      .orderBy(asc(quotationItems.sortOrder));

    // 비교 데이터 계산
    const comparison = {
      quotation_total: quotation?.totalAmount ?? 0,
      actual_total: sale.totalAmount,
      difference: sale.totalAmount - (quotation?.totalAmount ?? 0),
      accuracy: quotation?.totalAmount
        ? Math.round((sale.totalAmount / quotation.totalAmount) * 10000) / 100
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        sale,
        saleItems,
        quotation,
        quotationItems: qItems,
        comparison,
      },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
