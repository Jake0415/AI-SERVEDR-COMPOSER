// ============================================================
// GET /api/settings/price-snapshot — 스냅샷 설정 조회
// PUT /api/settings/price-snapshot — 스냅샷 설정 변경
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, priceSnapshotSettings } from "@/lib/db";
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

    const [setting] = await db
      .select()
      .from(priceSnapshotSettings)
      .where(eq(priceSnapshotSettings.tenantId, user.tenantId))
      .limit(1);

    // 설정이 없으면 기본값 반환
    if (!setting) {
      return NextResponse.json({
        success: true,
        data: {
          isEnabled: false,
          snapshotHour: 9,
          retentionMonths: 12,
          lastSnapshotAt: null,
        },
      });
    }

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(request: NextRequest) {
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
        { success: false, error: { code: "FORBIDDEN", message: "관리자 이상만 변경할 수 있습니다." } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { isEnabled, snapshotHour, retentionMonths } = body;

    // upsert
    const [existing] = await db
      .select()
      .from(priceSnapshotSettings)
      .where(eq(priceSnapshotSettings.tenantId, user.tenantId))
      .limit(1);

    if (existing) {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
      if (snapshotHour !== undefined) updateData.snapshotHour = snapshotHour;
      if (retentionMonths !== undefined) updateData.retentionMonths = retentionMonths;

      const [updated] = await db
        .update(priceSnapshotSettings)
        .set(updateData)
        .where(eq(priceSnapshotSettings.id, existing.id))
        .returning();

      return NextResponse.json({ success: true, data: updated });
    }

    const [created] = await db
      .insert(priceSnapshotSettings)
      .values({
        tenantId: user.tenantId,
        isEnabled: isEnabled ?? false,
        snapshotHour: snapshotHour ?? 9,
        retentionMonths: retentionMonths ?? 12,
      })
      .returning();

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
