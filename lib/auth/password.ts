// ============================================================
// 비밀번호 해싱 유틸리티 — bcryptjs 기반
// ============================================================

import "server-only";

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/** 비밀번호 해싱 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** 비밀번호 검증 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
