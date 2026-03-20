// ============================================================
// PUT/DELETE /api/equipment-codes/[id] — 장비 코드 수정/삭제
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { equipmentCodes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";

// PUT: 코드 수정 (이름, 정렬순서, 활성여부)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }
  if (user.role !== "super_admin" && user.role !== "admin") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "관리자 권한 필요" } }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const [existing] = await db
    .select()
    .from(equipmentCodes)
    .where(and(eq(equipmentCodes.id, id), eq(equipmentCodes.tenantId, user.tenantId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "코드를 찾을 수 없습니다" } }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "수정할 필드가 없습니다" } }, { status: 400 });
  }

  const [updated] = await db
    .update(equipmentCodes)
    .set(updateData)
    .where(eq(equipmentCodes.id, id))
    .returning();

  return NextResponse.json({ success: true, data: updated });
}

// DELETE: 코드 삭제 (하위 코드가 없을 때만)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }
  if (user.role !== "super_admin" && user.role !== "admin") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "관리자 권한 필요" } }, { status: 403 });
  }

  const { id } = await params;

  // 하위 코드 존재 확인
  const children = await db
    .select({ id: equipmentCodes.id })
    .from(equipmentCodes)
    .where(eq(equipmentCodes.parentId, id))
    .limit(1);

  if (children.length > 0) {
    return NextResponse.json({
      success: false,
      error: { code: "HAS_CHILDREN", message: "하위 코드가 존재하여 삭제할 수 없습니다. 하위 코드를 먼저 삭제하세요." },
    }, { status: 409 });
  }

  await db
    .delete(equipmentCodes)
    .where(and(eq(equipmentCodes.id, id), eq(equipmentCodes.tenantId, user.tenantId)));

  return NextResponse.json({ success: true });
}
