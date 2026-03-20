// ============================================================
// PUT/DELETE /api/part-codes/[id] — 서버 파트 코드 수정/삭제
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { partCodes } from "@/lib/db/schema";
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

  const [existing] = await db.select().from(partCodes)
    .where(and(eq(partCodes.id, id), eq(partCodes.tenantId, user.tenantId))).limit(1);
  if (!existing) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "코드 없음" } }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  if (Object.keys(updateData).length === 0) return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "수정할 필드 없음" } }, { status: 400 });

  const [updated] = await db.update(partCodes).set(updateData).where(eq(partCodes.id, id)).returning();
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  if (user.role !== "super_admin" && user.role !== "admin") return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "관리자 권한 필요" } }, { status: 403 });

  const { id } = await params;

  const children = await db.select({ id: partCodes.id }).from(partCodes).where(eq(partCodes.parentId, id)).limit(1);
  if (children.length > 0) {
    return NextResponse.json({ success: false, error: { code: "HAS_CHILDREN", message: "하위 코드가 존재하여 삭제 불가" } }, { status: 409 });
  }

  await db.delete(partCodes).where(and(eq(partCodes.id, id), eq(partCodes.tenantId, user.tenantId)));
  return NextResponse.json({ success: true });
}
