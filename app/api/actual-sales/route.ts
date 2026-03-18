// ============================================================
// POST /api/actual-sales — 실판매 기록 생성
// GET /api/actual-sales — 실판매 목록 조회
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, actualSales, actualSaleItems, quotations } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

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
      .from(actualSales)
      .where(eq(actualSales.tenantId, user.tenantId))
      .orderBy(desc(actualSales.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    if (user.role === "member") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "관리자 이상만 등록할 수 있습니다." } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { quotation_id, contract_number, contract_date, delivery_date, notes, items } = body;

    if (!quotation_id || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "견적 ID와 항목은 필수입니다." } },
        { status: 400 },
      );
    }

    // 견적 확인 (won 상태만)
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

    if (quotation.status !== "won") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_STATUS", message: "낙찰(won) 상태의 견적만 실판매를 기록할 수 있습니다." } },
        { status: 400 },
      );
    }

    // 중복 체크
    const [existing] = await db
      .select()
      .from(actualSales)
      .where(eq(actualSales.quotationId, quotation_id))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE", message: "이미 실판매가 기록된 견적입니다." } },
        { status: 409 },
      );
    }

    // 합계 계산
    const totalCost = items.reduce((sum: number, i: { unit_cost_price: number; quantity: number }) => sum + i.unit_cost_price * i.quantity, 0);
    const totalSupply = items.reduce((sum: number, i: { unit_supply_price: number; quantity: number }) => sum + i.unit_supply_price * i.quantity, 0);
    const totalAmount = totalSupply + Math.round(totalSupply * 0.1);

    const [sale] = await db
      .insert(actualSales)
      .values({
        tenantId: user.tenantId,
        quotationId: quotation_id,
        contractNumber: contract_number || null,
        contractDate: contract_date || null,
        deliveryDate: delivery_date || null,
        totalCost: totalCost,
        totalSupply: totalSupply,
        totalAmount: totalAmount,
        notes: notes || null,
        createdBy: user.id,
      })
      .returning();

    // 항목 삽입
    const itemValues = items.map(
      (item: {
        quotation_item_id?: string;
        change_type?: string;
        item_name: string;
        item_spec?: string;
        quantity: number;
        unit?: string;
        unit_cost_price: number;
        unit_supply_price: number;
      }, idx: number) => ({
        actualSaleId: sale.id,
        quotationItemId: item.quotation_item_id || null,
        changeType: item.change_type ?? "unchanged",
        itemName: item.item_name,
        itemSpec: item.item_spec || null,
        quantity: item.quantity,
        unit: item.unit ?? "EA",
        unitCostPrice: item.unit_cost_price,
        unitSupplyPrice: item.unit_supply_price,
        amount: item.unit_supply_price * item.quantity,
        sortOrder: idx,
      }),
    );

    await db.insert(actualSaleItems).values(itemValues);

    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
