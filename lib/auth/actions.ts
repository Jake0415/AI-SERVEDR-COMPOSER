// ============================================================
// 인증 Server Actions — 자체 JWT + bcrypt 기반
// ============================================================

"use server";

import { redirect } from "next/navigation";
import { db, tenants, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./password";
import { setSessionCookie, clearSessionCookie, getSessionFromCookie } from "./jwt";
import type { UserRole } from "@/lib/types";

/** 초기 설정: 슈퍼어드민 + 테넌트 생성 */
export async function setupAction(formData: {
  email: string;
  password: string;
  name: string;
  phone: string;
  department: string;
  companyName: string;
  businessNumber: string;
  ceoName: string;
  address: string;
  businessType: string;
  businessItem: string;
}): Promise<{ error: string } | undefined> {
  const passwordHash = await hashPassword(formData.password);

  // 1. 테넌트 생성
  const [tenant] = await db.insert(tenants).values({
    companyName: formData.companyName,
    businessNumber: formData.businessNumber,
    ceoName: formData.ceoName,
    address: formData.address,
    businessType: formData.businessType,
    businessItem: formData.businessItem,
    phone: formData.phone,
    email: formData.email,
  }).returning();

  // 2. 사용자 생성 (슈퍼어드민)
  const [newUser] = await db.insert(users).values({
    tenantId: tenant.id,
    email: formData.email,
    passwordHash,
    name: formData.name,
    phone: formData.phone,
    department: formData.department,
    role: "super_admin",
  }).returning();

  // 3. 세션 쿠키 설정
  await setSessionCookie({
    userId: newUser.id,
    email: newUser.email,
    tenantId: tenant.id,
    role: "super_admin",
  });

  redirect("/dashboard");
}

/** 로그인 */
export async function loginAction(formData: {
  email: string;
  password: string;
}): Promise<{ error?: string; success?: boolean }> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, formData.email))
    .limit(1);

  if (rows.length === 0) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const user = rows[0];
  const valid = await verifyPassword(formData.password, user.passwordHash);

  if (!valid) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
  });

  return { success: true };
}

/** 로그아웃 */
export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

/** 현재 로그인 사용자 정보 조회 */
export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  department: string;
} | null> {
  const session = await getSessionFromCookie();
  if (!session) return null;

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (rows.length === 0) return null;

  const u = rows[0];
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserRole,
    tenantId: u.tenantId,
    department: u.department,
  };
}
