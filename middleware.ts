// ============================================================
// Next.js 미들웨어 — JWT 쿠키 기반 인증
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "auth-token";

const PROTECTED_PATHS = [
  "/dashboard",
  "/parts",
  "/rfp",
  "/quotation",
  "/quotation-history",
  "/bid-history",
  "/users",
  "/settings",
  "/customers",
  "/assembly",
  "/actual-sales",
  "/notifications",
];

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) return new Uint8Array();
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, getJwtSecret());
      isAuthenticated = true;
    } catch {
      // 만료되거나 유효하지 않은 토큰
    }
  }

  const isProtected = PROTECTED_PATHS.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );

  if (!isAuthenticated && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 보안 헤더
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
