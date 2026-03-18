// ============================================================
// PUT/DELETE /api/users/[id] — 사용자 수정/삭제
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/actions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "super_admin") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "권한 없음" } }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, phone, department, role } = body;

  const [updated] = await db
    .update(users)
    .set({
      ...(name && { name }),
      ...(phone && { phone }),
      ...(department && { department }),
      ...(role && { role }),
    })
    .where(and(eq(users.id, id), eq(users.tenantId, currentUser.tenantId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다" } }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "super_admin") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "권한 없음" } }, { status: 403 });
  }

  const { id } = await params;

  if (id === currentUser.id) {
    return NextResponse.json({ success: false, error: { code: "SELF_DELETE", message: "자기 자신은 삭제할 수 없습니다" } }, { status: 400 });
  }

  const [deleted] = await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.tenantId, currentUser.tenantId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다" } }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
