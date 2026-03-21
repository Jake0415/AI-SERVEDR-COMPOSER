// ============================================================
// GET /api/quotation — 견적 목록 조회
// POST /api/quotation — 견적 저장 (draft → DB)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations, quotationItems, tenants } from "@/lib/db";
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
      .from(quotations)
      .where(eq(quotations.tenantId, user.tenantId))
      .orderBy(desc(quotations.createdAt))
      .limit(100);

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

    const body = await request.json();
    const {
      rfp_id,
      customer_id,
      quotation_type,
      items,
      total_cost,
      total_supply,
      validity_days,
      delivery_terms,
      delivery_date,
      payment_terms,
      notes,
    } = body;

    if (!customer_id || !quotation_type || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "필수 필드가 누락되었습니다." } },
        { status: 400 },
      );
    }

    // 테넌트 설정 조회 (견적번호 프리픽스, 유효기간)
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);

    // 견적번호 자동 생성: PREFIX-YYYYMMDD-NNN
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = tenant?.quotationPrefix ?? "Q";

    // 오늘 날짜 기준 마지막 견적번호 조회
    const pattern = `${prefix}-${dateStr}-%`;
    const [lastQuotation] = await db
      .select({ quotationNumber: quotations.quotationNumber })
      .from(quotations)
      .where(
        sql`${quotations.tenantId} = ${user.tenantId} AND ${quotations.quotationNumber} LIKE ${pattern}`,
      )
      .orderBy(desc(quotations.quotationNumber))
      .limit(1);

    let seq = 1;
    if (lastQuotation) {
      const lastSeq = parseInt(lastQuotation.quotationNumber.split("-").pop() ?? "0", 10);
      seq = lastSeq + 1;
    }
    const quotationNumber = `${prefix}-${dateStr}-${String(seq).padStart(3, "0")}`;

    // VAT 계산 (10%)
    const supplyTotal = Number(total_supply) || 0;
    const costTotal = Number(total_cost) || 0;
    const vat = Math.round(supplyTotal * 0.1);
    const totalAmount = supplyTotal + vat;
    const defaultValidityDays = validity_days ?? tenant?.defaultValidityDays ?? 30;
    const validityDate = new Date(today.getTime() + defaultValidityDays * 86400000)
      .toISOString()
      .slice(0, 10);

    // 견적 레코드 삽입
    const [quotation] = await db
      .insert(quotations)
      .values({
        tenantId: user.tenantId,
        rfpId: rfp_id || null,
        customerId: customer_id,
        quotationNumber,
        quotationType: quotation_type,
        totalCost: costTotal,
        totalSupply: supplyTotal,
        vat,
        totalAmount,
        status: "draft",
        validityDate,
        deliveryTerms: delivery_terms || null,
        deliveryDate: delivery_date || null,
        paymentTerms: payment_terms || tenant?.defaultPaymentTerms || null,
        notes: notes || null,
        createdBy: user.id,
      })
      .returning();

    // 견적 항목 일괄 삽입
    const itemValues = items.map(
      (
        item: {
          item_type?: string;
          part_id?: string;
          item_name: string;
          item_spec?: string;
          quantity: number;
          unit?: string;
          unit_cost_price: number;
          unit_supply_price: number;
          margin_rate?: number;
        },
        idx: number,
      ) => ({
        quotationId: quotation.id,
        itemType: item.item_type ?? "hardware",
        partId: item.part_id || null,
        itemName: item.item_name,
        itemSpec: item.item_spec || null,
        quantity: item.quantity,
        unit: item.unit ?? "EA",
        unitCostPrice: item.unit_cost_price,
        unitSupplyPrice: item.unit_supply_price,
        amount: item.unit_supply_price * item.quantity,
        marginRate: String(item.margin_rate ?? 0),
        sortOrder: idx,
      }),
    );

    await db.insert(quotationItems).values(itemValues);

    return NextResponse.json({
      success: true,
      data: { ...quotation, items: itemValues },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
