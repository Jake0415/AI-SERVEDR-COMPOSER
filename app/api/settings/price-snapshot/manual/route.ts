// ============================================================
// POST /api/settings/price-snapshot/manual — 수동 스냅샷 즉시 생성
// ============================================================

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, parts, partPrices, partCategories, priceSnapshots } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function POST() {
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
        { success: false, error: { code: "FORBIDDEN", message: "관리자 이상만 실행할 수 있습니다." } },
        { status: 403 },
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    // 오늘 이미 스냅샷 존재 확인
    const [existing] = await db
      .select()
      .from(priceSnapshots)
      .where(
        and(
          eq(priceSnapshots.tenantId, user.tenantId),
          eq(priceSnapshots.snapshotDate, today),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_EXISTS", message: "오늘 스냅샷이 이미 존재합니다." } },
        { status: 409 },
      );
    }

    // 부품+가격 조회
    const partsData = await db
      .select({
        partId: parts.id,
        modelName: parts.modelName,
        categoryName: partCategories.displayName,
        listPrice: partPrices.listPrice,
        marketPrice: partPrices.marketPrice,
        supplyPrice: partPrices.supplyPrice,
      })
      .from(parts)
      .leftJoin(partPrices, eq(partPrices.partId, parts.id))
      .leftJoin(partCategories, eq(partCategories.id, parts.categoryId))
      .where(
        and(
          eq(parts.tenantId, user.tenantId),
          eq(parts.isDeleted, false),
        ),
      );

    const snapshotData = partsData.map((p) => ({
      part_id: p.partId,
      model_name: p.modelName,
      category: p.categoryName ?? "",
      list_price: p.listPrice ?? 0,
      market_price: p.marketPrice ?? 0,
      cost_price: 0,
      supply_price: p.supplyPrice ?? 0,
    }));

    const [snapshot] = await db
      .insert(priceSnapshots)
      .values({
        tenantId: user.tenantId,
        snapshotDate: today,
        snapshotData,
        partCount: partsData.length,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: { id: snapshot.id, date: today, partCount: partsData.length },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
