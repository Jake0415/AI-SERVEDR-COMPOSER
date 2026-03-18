// ============================================================
// POST /api/quotation/[id]/clone — 견적 복제
// 원본 견적의 모든 항목을 새 견적으로 복사 (draft 상태)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, asc, desc, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations, quotationItems, tenants } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function POST(
  _request: NextRequest,
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

    const [original] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, id))
      .limit(1);

    if (!original || original.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "견적을 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // 새 견적번호 생성
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    const prefix = tenant?.quotationPrefix ?? "Q";
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const pattern = `${prefix}-${dateStr}-%`;

    const [last] = await db
      .select({ quotationNumber: quotations.quotationNumber })
      .from(quotations)
      .where(sql`${quotations.tenantId} = ${user.tenantId} AND ${quotations.quotationNumber} LIKE ${pattern}`)
      .orderBy(desc(quotations.quotationNumber))
      .limit(1);

    let seq = 1;
    if (last) {
      seq = parseInt(last.quotationNumber.split("-").pop() ?? "0", 10) + 1;
    }
    const quotationNumber = `${prefix}-${dateStr}-${String(seq).padStart(3, "0")}`;

    // 견적 복제
    const [cloned] = await db
      .insert(quotations)
      .values({
        tenantId: original.tenantId,
        rfpId: original.rfpId,
        customerId: original.customerId,
        quotationNumber,
        parentQuotationId: original.id,
        quotationType: original.quotationType,
        totalCost: original.totalCost,
        totalSupply: original.totalSupply,
        vat: original.vat,
        totalAmount: original.totalAmount,
        status: "draft",
        validityDate: original.validityDate,
        deliveryTerms: original.deliveryTerms,
        paymentTerms: original.paymentTerms,
        notes: `복제 원본: ${original.quotationNumber}`,
        createdBy: user.id,
      })
      .returning();

    // 항목 복제
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, id))
      .orderBy(asc(quotationItems.sortOrder));

    if (items.length > 0) {
      await db.insert(quotationItems).values(
        items.map((item) => ({
          quotationId: cloned.id,
          itemType: item.itemType,
          partId: item.partId,
          itemName: item.itemName,
          itemSpec: item.itemSpec,
          quantity: item.quantity,
          unit: item.unit,
          unitCostPrice: item.unitCostPrice,
          unitSupplyPrice: item.unitSupplyPrice,
          amount: item.amount,
          marginRate: item.marginRate,
          sortOrder: item.sortOrder,
        })),
      );
    }

    return NextResponse.json({ success: true, data: cloned });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
