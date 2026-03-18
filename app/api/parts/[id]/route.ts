// ============================================================
// 부품 상세 API — PUT (수정) + DELETE (소프트 삭제)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db, parts, partPrices, partPriceHistory } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import type { ApiResponse } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** PUT /api/parts/[id] — 부품 수정 (admin 이상) */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    if (user.role !== "super_admin" && user.role !== "admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "FORBIDDEN", message: "관리자 권한이 필요합니다." } },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    // 부품 존재 여부 및 테넌트 확인
    const [existing] = await db
      .select()
      .from(parts)
      .where(and(eq(parts.id, id), eq(parts.tenantId, user.tenantId), eq(parts.isDeleted, false)))
      .limit(1);

    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "NOT_FOUND", message: "부품을 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      modelName,
      manufacturer,
      specs,
      listPrice,
      marketPrice,
      supplyPrice,
    } = body as {
      modelName?: string;
      manufacturer?: string;
      specs?: Record<string, string | number>;
      listPrice?: number;
      marketPrice?: number;
      supplyPrice?: number;
    };

    // 부품 정보 업데이트 (변경사항이 있는 필드만)
    const partUpdate: Record<string, unknown> = {};
    if (modelName !== undefined) partUpdate.modelName = modelName;
    if (manufacturer !== undefined) partUpdate.manufacturer = manufacturer;
    if (specs !== undefined) partUpdate.specs = specs;

    if (Object.keys(partUpdate).length > 0) {
      await db
        .update(parts)
        .set(partUpdate)
        .where(eq(parts.id, id));
    }

    // 가격 정보 업데이트 (변경사항이 있는 필드만)
    const priceUpdate: Record<string, unknown> = {};
    if (listPrice !== undefined) priceUpdate.listPrice = listPrice;
    if (marketPrice !== undefined) priceUpdate.marketPrice = marketPrice;
    if (supplyPrice !== undefined) priceUpdate.supplyPrice = supplyPrice;

    if (Object.keys(priceUpdate).length > 0) {
      // 가격 이력 기록 (변경 전 값 조회)
      const [oldPrice] = await db
        .select()
        .from(partPrices)
        .where(eq(partPrices.partId, id))
        .limit(1);

      if (oldPrice) {
        await db.insert(partPriceHistory).values({
          partId: id,
          tenantId: user.tenantId,
          changeType: "manual",
          listPriceBefore: oldPrice.listPrice,
          listPriceAfter: listPrice ?? oldPrice.listPrice,
          marketPriceBefore: oldPrice.marketPrice,
          marketPriceAfter: marketPrice ?? oldPrice.marketPrice,
          costPriceBefore: 0,
          costPriceAfter: 0,
          supplyPriceBefore: oldPrice.supplyPrice,
          supplyPriceAfter: supplyPrice ?? oldPrice.supplyPrice,
          changedBy: user.id,
          changeReason: "수동 가격 수정",
        });
      }

      await db
        .update(partPrices)
        .set(priceUpdate)
        .where(eq(partPrices.partId, id));
    }

    // 업데이트된 부품 조회
    const [updatedPart] = await db
      .select()
      .from(parts)
      .where(eq(parts.id, id))
      .limit(1);

    return NextResponse.json<ApiResponse<typeof updatedPart>>({
      success: true,
      data: updatedPart,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "부품 수정 중 오류가 발생했습니다.";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}

/** DELETE /api/parts/[id] — 부품 소프트 삭제 (admin 이상) */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    if (user.role !== "super_admin" && user.role !== "admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "FORBIDDEN", message: "관리자 권한이 필요합니다." } },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    // 부품 존재 여부 및 테넌트 확인
    const [existing] = await db
      .select()
      .from(parts)
      .where(and(eq(parts.id, id), eq(parts.tenantId, user.tenantId), eq(parts.isDeleted, false)))
      .limit(1);

    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "NOT_FOUND", message: "부품을 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // 소프트 삭제: isDeleted = true, deletedAt 설정
    await db
      .update(parts)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(eq(parts.id, id));

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "부품 삭제 중 오류가 발생했습니다.";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}
