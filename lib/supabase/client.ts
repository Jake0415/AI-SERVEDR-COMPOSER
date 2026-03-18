// ============================================================
// Supabase 브라우저 클라이언트 — 클라이언트 컴포넌트용
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

/** 브라우저/클라이언트 컴포넌트용 Supabase 클라이언트 */
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
