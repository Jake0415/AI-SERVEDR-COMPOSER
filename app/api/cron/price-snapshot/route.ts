// ============================================================
// POST /api/cron/price-snapshot — Vercel Cron Job 엔드포인트
// 매시 정각 실행 → 해당 시간의 활성 테넌트 스냅샷 생성
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, lt, sql } from "drizzle-orm";
import { db, tenants, parts, partPrices, partCategories, priceSnapshots, priceSnapshotSettings } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Cron 인증 (CRON_SECRET 환경변수)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentHour = now.getUTCHours(); // UTC 기준
    const today = now.toISOString().slice(0, 10);

    // 활성화된 스냅샷 설정 중 현재 시간에 해당하는 테넌트 조회
    const activeSettings = await db
      .select()
      .from(priceSnapshotSettings)
      .where(
        and(
          eq(priceSnapshotSettings.isEnabled, true),
          eq(priceSnapshotSettings.snapshotHour, currentHour),
        ),
      );

    let processedCount = 0;

    for (const setting of activeSettings) {
      try {
        // 오늘 이미 스냅샷이 있는지 확인
        const [existing] = await db
          .select()
          .from(priceSnapshots)
          .where(
            and(
              eq(priceSnapshots.tenantId, setting.tenantId),
              eq(priceSnapshots.snapshotDate, today),
            ),
          )
          .limit(1);

        if (existing) continue; // 이미 생성됨

        // 해당 테넌트의 전체 부품+가격 조회
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
              eq(parts.tenantId, setting.tenantId),
              eq(parts.isDeleted, false),
            ),
          );

        // 스냅샷 저장
        const snapshotData = partsData.map((p) => ({
          part_id: p.partId,
          model_name: p.modelName,
          category: p.categoryName ?? "",
          list_price: p.listPrice ?? 0,
          market_price: p.marketPrice ?? 0,
          cost_price: 0,
          supply_price: p.supplyPrice ?? 0,
        }));

        await db.insert(priceSnapshots).values({
          tenantId: setting.tenantId,
          snapshotDate: today,
          snapshotData,
          partCount: partsData.length,
        });

        // 설정 업데이트
        await db
          .update(priceSnapshotSettings)
          .set({ lastSnapshotAt: now, updatedAt: now })
          .where(eq(priceSnapshotSettings.id, setting.id));

        // 보관 기간 초과 스냅샷 삭제
        const retentionDate = new Date();
        retentionDate.setMonth(retentionDate.getMonth() - setting.retentionMonths);
        const retentionDateStr = retentionDate.toISOString().slice(0, 10);

        await db
          .delete(priceSnapshots)
          .where(
            and(
              eq(priceSnapshots.tenantId, setting.tenantId),
              lt(priceSnapshots.snapshotDate, retentionDateStr),
            ),
          );

        processedCount++;
      } catch {
        // 개별 테넌트 실패 시 다른 테넌트 계속 처리
      }
    }

    return NextResponse.json({
      success: true,
      data: { processedTenants: processedCount, totalActive: activeSettings.length },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "스냅샷 생성 중 오류";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
