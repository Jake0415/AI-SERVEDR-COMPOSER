// ============================================================
// GET /api/templates — 견적 템플릿 목록
// POST /api/templates — 템플릿 저장
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations, quotationItems } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

// 템플릿은 quotations 테이블의 status='template'로 관리
// (별도 테이블 없이 기존 구조 재활용)

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    // 템플릿 = notes에 template_category 저장, status가 template인 견적
    const rows = await db
      .select()
      .from(quotations)
      .where(eq(quotations.tenantId, user.tenantId))
      .orderBy(desc(quotations.createdAt));

    // notes에 __template: 접두어가 있는 것만 필터
    const templates = rows.filter((r) => r.notes?.startsWith("__template:"));

    return NextResponse.json({
      success: true,
      data: templates.map((t) => ({
        ...t,
        templateCategory: t.notes?.replace("__template:", "").split("|")[0] ?? "기타",
        templateName: t.notes?.replace("__template:", "").split("|")[1] ?? t.quotationNumber,
      })),
    });
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
    const { quotation_id, template_name, template_category } = body;

    if (!quotation_id || !template_name) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "견적 ID와 템플릿 이름이 필요합니다." } },
        { status: 400 },
      );
    }

    // 원본 견적 + 항목 복사
    const [original] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotation_id))
      .limit(1);

    if (!original || original.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "견적을 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotation_id));

    // 템플릿 견적 생성
    const [template] = await db
      .insert(quotations)
      .values({
        tenantId: user.tenantId,
        customerId: original.customerId,
        quotationNumber: `TPL-${Date.now()}`,
        quotationType: original.quotationType,
        totalCost: original.totalCost,
        totalSupply: original.totalSupply,
        vat: original.vat,
        totalAmount: original.totalAmount,
        status: "draft",
        validityDate: "9999-12-31",
        notes: `__template:${template_category ?? "기타"}|${template_name}`,
        createdBy: user.id,
      })
      .returning();

    if (items.length > 0) {
      await db.insert(quotationItems).values(
        items.map((item) => ({
          quotationId: template.id,
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

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
