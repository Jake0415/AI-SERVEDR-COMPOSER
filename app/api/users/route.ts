// ============================================================
// GET/POST /api/users — 사용자 관리
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/actions";
import { hashPassword } from "@/lib/auth/password";

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

  // 이메일 중복 확인
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ success: false, error: { code: "DUPLICATE_EMAIL", message: "이미 등록된 이메일입니다." } }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db.insert(users).values({
    tenantId: currentUser.tenantId,
    email,
    passwordHash,
    name,
    phone: phone ?? "",
    department: department ?? "",
    role: role ?? "member",
  }).returning();

  return NextResponse.json({ success: true, data: newUser }, { status: 201 });
}
