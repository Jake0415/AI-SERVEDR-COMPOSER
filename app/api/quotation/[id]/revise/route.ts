// ============================================================
// POST /api/quotation/[id]/revise — 견적서 개정 (새 버전 생성)
// 발행된 견적을 복사하여 revision +1, parent_quotation_id 연결
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations, quotationItems } from "@/lib/db";
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

    // published 또는 won/lost 상태에서만 개정 가능
    if (!["published", "won", "lost"].includes(original.status)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_STATUS", message: "발행된 견적만 개정할 수 있습니다." } },
        { status: 400 },
      );
    }

    // 원본 항목 조회
    const originalItems = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, id))
      .orderBy(asc(quotationItems.sortOrder));

    // 새 개정 견적 생성
    const newRevision = original.revision + 1;
    const parentId = original.parentQuotationId ?? original.id;

    const [revised] = await db
      .insert(quotations)
      .values({
        tenantId: original.tenantId,
        rfpId: original.rfpId,
        customerId: original.customerId,
        quotationNumber: original.quotationNumber,
        revision: newRevision,
        parentQuotationId: parentId,
        quotationType: original.quotationType,
        totalCost: original.totalCost,
        totalSupply: original.totalSupply,
        vat: original.vat,
        totalAmount: original.totalAmount,
        status: "draft",
        validityDate: original.validityDate,
        deliveryTerms: original.deliveryTerms,
        deliveryDate: original.deliveryDate,
        paymentTerms: original.paymentTerms,
        notes: original.notes,
        createdBy: user.id,
      })
      .returning();

    // 항목 복사
    if (originalItems.length > 0) {
      const copiedItems = originalItems.map((item) => ({
        quotationId: revised.id,
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
      }));

      await db.insert(quotationItems).values(copiedItems);
    }

    return NextResponse.json({
      success: true,
      data: revised,
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
