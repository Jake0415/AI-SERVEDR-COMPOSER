// ============================================================
// AES-256-GCM 암호화/복호화 유틸리티
// 원가 데이터 보호용 — 서버 전용
// ============================================================

import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.");
  }
  // 32바이트(256비트) 키 필요
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY는 64자리 16진수(32바이트)여야 합니다.");
  }
  return keyBuffer;
}

/** 문자열 AES-256-GCM 암호화 → base64 문자열 반환 */
export function encrypt(plainText: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  // iv + tag + encrypted 를 합쳐서 base64 인코딩
  const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, "hex")]);
  return combined.toString("base64");
}

/** base64 암호문 → 복호화된 문자열 반환 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}

/** 숫자 암호화 */
export function encryptNumber(value: number): string {
  return encrypt(String(value));
}

/** 암호화된 숫자 복호화 */
export function decryptNumber(encryptedBase64: string): number {
  return Number(decrypt(encryptedBase64));
}

/** API Key 마스킹 (첫 7자 + **** + 마지막 4자) */
export function maskApiKey(key: string): string {
  if (key.length <= 11) return "****";
  return key.substring(0, 7) + "****" + key.substring(key.length - 4);
}
