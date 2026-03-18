// ============================================================
// GET/POST /api/categories — 부품 카테고리 관리
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, partCategories } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/actions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }

  const categories = await db
    .select()
    .from(partCategories)
    .where(eq(partCategories.tenantId, user.tenantId))
    .orderBy(partCategories.name);

  return NextResponse.json({ success: true, data: categories });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "권한 없음" } }, { status: 403 });
  }

  const body = await request.json();
  const { name, displayName, group, specFields } = body;

  if (!name || !displayName || !group) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "필수 필드 누락" } }, { status: 400 });
  }

  const [category] = await db.insert(partCategories).values({
    tenantId: user.tenantId,
    name,
    displayName,
    group,
    specFields: specFields ?? [],
  }).returning();

  return NextResponse.json({ success: true, data: category }, { status: 201 });
}
