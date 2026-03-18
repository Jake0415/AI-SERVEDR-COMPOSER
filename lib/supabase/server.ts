// ============================================================
// Supabase 서버 클라이언트 — Server Components, Server Actions, Route Handlers
// ============================================================

import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** 서버 컴포넌트/Route Handler용 Supabase 클라이언트 (RLS 적용) */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Server Component에서 호출 시 쿠키 설정 불가 — 무시
            }
          });
        },
      },
    },
  );
}

/** Service Role 클라이언트 (RLS 우회, 관리 작업 전용) */
export function createSupabaseAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
