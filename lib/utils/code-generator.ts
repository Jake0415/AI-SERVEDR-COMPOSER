// IT 인프라 장비 코드 자동생성 유틸리티
// 대분류: AA (영문 2자리)
// 중분류: AA-NN (영문2 + 숫자2)
// 장비명: AA-NN-NNN (영문2 + 숫자2 + 숫자3)

import { db } from "@/lib/db";
import { equipmentCodes, partCodes } from "@/lib/db/schema";
import { eq, and, like, sql } from "drizzle-orm";

// 대분류 코드 생성: 영문 2자리 (AB ~ ZZ), DB 중복 체크
export async function generateMajorCode(tenantId: string): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = chars[Math.floor(Math.random() * 26)] + chars[Math.floor(Math.random() * 26)];
    const [existing] = await db
      .select({ id: equipmentCodes.id })
      .from(equipmentCodes)
      .where(and(eq(equipmentCodes.tenantId, tenantId), eq(equipmentCodes.code, code)))
      .limit(1);
    if (!existing) return code;
  }
  throw new Error("대분류 코드 생성 실패: 사용 가능한 코드가 없습니다");
}

// 중분류 코드 생성: 부모코드-NN (순번)
export async function generateMinorCode(tenantId: string, parentCode: string): Promise<string> {
  const [result] = await db
    .select({ maxCode: sql<string>`MAX(${equipmentCodes.code})` })
    .from(equipmentCodes)
    .where(and(
      eq(equipmentCodes.tenantId, tenantId),
      eq(equipmentCodes.level, 2),
      like(equipmentCodes.code, `${parentCode}-%`),
    ));

  const lastNum = result?.maxCode
    ? parseInt(result.maxCode.split("-")[1] || "0", 10)
    : 0;
  const nextNum = String(lastNum + 1).padStart(2, "0");
  return `${parentCode}-${nextNum}`;
}

// 장비명 코드 생성: 부모코드-NNN (순번)
export async function generateItemCode(tenantId: string, parentCode: string): Promise<string> {
  const [result] = await db
    .select({ maxCode: sql<string>`MAX(${equipmentCodes.code})` })
    .from(equipmentCodes)
    .where(and(
      eq(equipmentCodes.tenantId, tenantId),
      eq(equipmentCodes.level, 3),
      like(equipmentCodes.code, `${parentCode}-%`),
    ));

  const lastNum = result?.maxCode
    ? parseInt(result.maxCode.split("-")[2] || "0", 10)
    : 0;
  const nextNum = String(lastNum + 1).padStart(3, "0");
  return `${parentCode}-${nextNum}`;
}

// === 서버 파트 코드 생성 (part_codes 테이블 대상) ===

// 파트 카테고리 코드: 영문 2자리
export async function generatePartCategoryCode(tenantId: string): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = chars[Math.floor(Math.random() * 26)] + chars[Math.floor(Math.random() * 26)];
    const [existing] = await db
      .select({ id: partCodes.id })
      .from(partCodes)
      .where(and(eq(partCodes.tenantId, tenantId), eq(partCodes.code, code)))
      .limit(1);
    if (!existing) return code;
  }
  throw new Error("파트 카테고리 코드 생성 실패");
}

// 파트 부품명 코드: 부모코드-NNN
export async function generatePartItemCode(tenantId: string, parentCode: string): Promise<string> {
  const [result] = await db
    .select({ maxCode: sql<string>`MAX(${partCodes.code})` })
    .from(partCodes)
    .where(and(
      eq(partCodes.tenantId, tenantId),
      eq(partCodes.level, 2),
      like(partCodes.code, `${parentCode}-%`),
    ));

  const lastNum = result?.maxCode
    ? parseInt(result.maxCode.split("-")[1] || "0", 10)
    : 0;
  const nextNum = String(lastNum + 1).padStart(3, "0");
  return `${parentCode}-${nextNum}`;
}

// 파트 코드 레벨별 자동 생성
export async function generatePartCode(tenantId: string, level: number, parentCode?: string): Promise<string> {
  if (level === 1) return generatePartCategoryCode(tenantId);
  if (level === 2) {
    if (!parentCode) throw new Error("부품명 코드 생성에는 부모 코드가 필요합니다");
    return generatePartItemCode(tenantId, parentCode);
  }
  throw new Error(`유효하지 않은 파트 코드 레벨: ${level}`);
}

// === 장비 코드 생성 (equipment_codes 테이블 대상) ===

// 레벨에 따라 자동 코드 생성
export async function generateCode(tenantId: string, level: number, parentCode?: string): Promise<string> {
  switch (level) {
    case 1:
      return generateMajorCode(tenantId);
    case 2:
      if (!parentCode) throw new Error("중분류 코드 생성에는 부모 코드가 필요합니다");
      return generateMinorCode(tenantId, parentCode);
    case 3:
      if (!parentCode) throw new Error("장비명 코드 생성에는 부모 코드가 필요합니다");
      return generateItemCode(tenantId, parentCode);
    default:
      throw new Error(`유효하지 않은 레벨: ${level}`);
  }
}
