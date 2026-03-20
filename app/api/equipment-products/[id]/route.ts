// ============================================================
// PUT/DELETE /api/equipment-products/[id]
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { equipmentProducts, equipmentProductPrices, equipmentPriceHistory } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  if (user.role !== "super_admin" && user.role !== "admin") return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "관리자 권한 필요" } }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const [existing] = await db.select().from(equipmentProducts)
    .where(and(eq(equipmentProducts.id, id), eq(equipmentProducts.tenantId, user.tenantId))).limit(1);
  if (!existing) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "제품 없음" } }, { status: 404 });

  // 제품 정보 수정
  const productUpdate: Record<string, unknown> = {};
  if (body.modelName !== undefined) productUpdate.modelName = body.modelName;
  if (body.manufacturer !== undefined) productUpdate.manufacturer = body.manufacturer;
  if (body.specs !== undefined) productUpdate.specs = body.specs;

  if (Object.keys(productUpdate).length > 0) {
    await db.update(equipmentProducts).set(productUpdate).where(eq(equipmentProducts.id, id));
  }

  // 가격 수정 + 이력 기록
  const { listPrice, marketPrice, supplyPrice } = body;
  if (listPrice !== undefined || marketPrice !== undefined || supplyPrice !== undefined) {
    const [oldPrice] = await db.select().from(equipmentProductPrices)
      .where(eq(equipmentProductPrices.productId, id)).limit(1);

    if (oldPrice) {
      await db.insert(equipmentPriceHistory).values({
        productId: id,
        tenantId: user.tenantId,
        changeType: "manual",
        listPriceBefore: oldPrice.listPrice,
        listPriceAfter: listPrice ?? oldPrice.listPrice,
        marketPriceBefore: oldPrice.marketPrice,
        marketPriceAfter: marketPrice ?? oldPrice.marketPrice,
        supplyPriceBefore: oldPrice.supplyPrice,
        supplyPriceAfter: supplyPrice ?? oldPrice.supplyPrice,
        changedBy: user.id,
        changeReason: "수동 가격 수정",
      });

      const priceUpdate: Record<string, unknown> = {};
      if (listPrice !== undefined) priceUpdate.listPrice = listPrice;
      if (marketPrice !== undefined) priceUpdate.marketPrice = marketPrice;
      if (supplyPrice !== undefined) priceUpdate.supplyPrice = supplyPrice;
      await db.update(equipmentProductPrices).set(priceUpdate).where(eq(equipmentProductPrices.productId, id));
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  if (user.role !== "super_admin" && user.role !== "admin") return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "관리자 권한 필요" } }, { status: 403 });

  const { id } = await params;
  await db.update(equipmentProducts).set({ isDeleted: true, deletedAt: new Date() })
    .where(and(eq(equipmentProducts.id, id), eq(equipmentProducts.tenantId, user.tenantId)));

  return NextResponse.json({ success: true });
}
