// ============================================================
// 인증 Server Actions — Supabase Auth + Drizzle DB
// ============================================================

"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, tenants, users } from "@/lib/db";
import { eq } from "drizzle-orm";
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
}) {
  const supabase = await createSupabaseServerClient();

  // 1. Supabase Auth 사용자 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "회원가입 실패" };
  }

  // 2. 테넌트 생성
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

  // 3. 사용자 생성 (슈퍼어드민)
  await db.insert(users).values({
    id: authData.user.id,
    tenantId: tenant.id,
    email: formData.email,
    name: formData.name,
    phone: formData.phone,
    department: formData.department,
    role: "super_admin",
  });

  // 4. 기본 카테고리 시드 (Supabase RPC 호출)
  const { error: seedError } = await supabase.rpc("seed_default_categories", {
    p_tenant_id: tenant.id,
  });

  if (seedError) {
    // 시드 실패해도 계속 진행 (나중에 수동 추가 가능)
  }

  // 5. 자동 로그인
  await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  redirect("/dashboard");
}

/** 로그인 */
export async function loginAction(formData: {
  email: string;
  password: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

/** 로그아웃 */
export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
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
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
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
