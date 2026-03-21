// ============================================================
// JWT 유틸리티 — jose 기반, httpOnly 쿠키 세션
// ============================================================

import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "auth-token";
const JWT_EXPIRY = "7d";

interface JwtPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
  }
  if (secret.length < 32) {
    throw new Error("JWT_SECRET은 최소 32자 이상이어야 합니다.");
  }
  return new TextEncoder().encode(secret);
}

/** JWT 토큰 생성 */
export async function createToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

/** JWT 토큰 검증 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/** 쿠키에 JWT 세션 설정 */
export async function setSessionCookie(payload: JwtPayload): Promise<void> {
  const token = await createToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7일
  });
}

/** 쿠키에서 JWT 세션 삭제 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** 쿠키에서 JWT 토큰 읽기 및 검증 */
export async function getSessionFromCookie(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;
  return verifyToken(token);
}

/** 미들웨어용: 요청 헤더에서 토큰 읽기 (cookies() 사용 불가) */
export async function verifyTokenFromRequest(
  cookieValue: string | undefined,
): Promise<JwtPayload | null> {
  if (!cookieValue) return null;
  return verifyToken(cookieValue);
}

export { COOKIE_NAME };
export type { JwtPayload };
