import { redirect } from "next/navigation";
import { db, users } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  // DB에 사용자가 0명이면 초기 설정 페이지로 이동
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  const userCount = result[0]?.count ?? 0;

  if (userCount === 0) {
    redirect("/setup");
  }

  // 인증 확인
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
