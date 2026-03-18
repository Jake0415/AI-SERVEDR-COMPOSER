// ============================================================
// GET/POST /api/users — 사용자 관리
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }

  const userList = await db
    .select()
    .from(users)
    .where(eq(users.tenantId, user.tenantId))
    .orderBy(users.createdAt);

  return NextResponse.json({ success: true, data: userList });
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "super_admin") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "슈퍼어드민만 사용자를 추가할 수 있습니다" } }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, name, phone, department, role } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "필수 필드 누락" } }, { status: 400 });
  }

  // Supabase Auth로 사용자 생성
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ success: false, error: { code: "AUTH_ERROR", message: authError?.message ?? "사용자 생성 실패" } }, { status: 500 });
  }

  const [newUser] = await db.insert(users).values({
    id: authData.user.id,
    tenantId: currentUser.tenantId,
    email,
    name,
    phone: phone ?? "",
    department: department ?? "",
    role: role ?? "member",
  }).returning();

  return NextResponse.json({ success: true, data: newUser }, { status: 201 });
}
