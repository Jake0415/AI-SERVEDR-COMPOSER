// ============================================================
// GET /api/equipment-products/[id]/price-history
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { equipmentPriceHistory, equipmentProducts } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const period = parseInt(searchParams.get("period") || "12");

  const [product] = await db.select().from(equipmentProducts)
    .where(and(eq(equipmentProducts.id, id), eq(equipmentProducts.tenantId, user.tenantId))).limit(1);
  if (!product) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "제품 없음" } }, { status: 404 });

  const since = new Date();
  since.setMonth(since.getMonth() - period);

  const history = await db.select().from(equipmentPriceHistory)
    .where(and(eq(equipmentPriceHistory.productId, id), gte(equipmentPriceHistory.createdAt, since)))
    .orderBy(desc(equipmentPriceHistory.createdAt));

  return NextResponse.json({ success: true, data: history });
}
