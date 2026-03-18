// ============================================================
// PUT/DELETE /api/categories/[id] — 카테고리 수정/삭제
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, count } from "drizzle-orm";
import { db, partCategories, parts } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/actions";
import type { ApiResponse } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** PUT /api/categories/[id] — 카테고리 수정 (admin 이상) */
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

    // 카테고리 존재 여부 및 테넌트 확인
    const [existing] = await db
      .select()
      .from(partCategories)
      .where(and(eq(partCategories.id, id), eq(partCategories.tenantId, user.tenantId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "NOT_FOUND", message: "카테고리를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { displayName, group, specFields } = body as {
      displayName?: string;
      group?: string;
      specFields?: unknown[];
    };

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (group !== undefined) updateData.group = group;
    if (specFields !== undefined) updateData.specFields = specFields;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "VALIDATION_ERROR", message: "수정할 필드가 없습니다." } },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(partCategories)
      .set(updateData)
      .where(eq(partCategories.id, id))
      .returning();

    return NextResponse.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "카테고리 수정 중 오류가 발생했습니다.";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}

/** DELETE /api/categories/[id] — 카테고리 삭제 (admin 이상) */
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

    // 카테고리 존재 여부 및 테넌트 확인
    const [existing] = await db
      .select()
      .from(partCategories)
      .where(and(eq(partCategories.id, id), eq(partCategories.tenantId, user.tenantId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "NOT_FOUND", message: "카테고리를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // 기본 카테고리 삭제 불가
    if (existing.isDefault) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "CANNOT_DELETE_DEFAULT", message: "기본 카테고리는 삭제할 수 없습니다." } },
        { status: 400 },
      );
    }

    // 해당 카테고리에 부품이 있는지 확인
    const [partCount] = await db
      .select({ count: count() })
      .from(parts)
      .where(and(eq(parts.categoryId, id), eq(parts.isDeleted, false)));

    if (partCount.count > 0) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: "HAS_PARTS",
            message: `해당 카테고리에 ${partCount.count}개의 부품이 등록되어 있어 삭제할 수 없습니다.`,
          },
        },
        { status: 400 },
      );
    }

    // 카테고리 삭제
    await db
      .delete(partCategories)
      .where(eq(partCategories.id, id));

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "카테고리 삭제 중 오류가 발생했습니다.";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}
