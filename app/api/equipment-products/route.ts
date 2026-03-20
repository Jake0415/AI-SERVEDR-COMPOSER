// ============================================================
// GET/POST /api/equipment-products — IT 인프라 장비 제품 관리
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, like, or, sql, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { equipmentProducts, equipmentProductPrices, equipmentCodes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";

// GET: 장비 제품 목록 (대/중분류 필터, 검색, 페이지네이션)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const majorCode = searchParams.get("major_code");
  const minorCode = searchParams.get("minor_code");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  // 장비 코드 ID 필터 구성
  let codeFilter: string[] = [];
  if (minorCode) {
    // 중분류 선택 시 해당 중분류 하위 장비명(level3) 코드 ID
    const codes = await db.select({ id: equipmentCodes.id }).from(equipmentCodes)
      .where(and(eq(equipmentCodes.tenantId, user.tenantId), like(equipmentCodes.code, `${minorCode}-%`), eq(equipmentCodes.level, 3)));
    codeFilter = codes.map(c => c.id);
  } else if (majorCode) {
    // 대분류 선택 시 해당 대분류 하위 모든 장비명(level3)
    const codes = await db.select({ id: equipmentCodes.id }).from(equipmentCodes)
      .where(and(eq(equipmentCodes.tenantId, user.tenantId), like(equipmentCodes.code, `${majorCode}-%`), eq(equipmentCodes.level, 3)));
    codeFilter = codes.map(c => c.id);
  }

  // 기본 조건
  const conditions = [
    eq(equipmentProducts.tenantId, user.tenantId),
    eq(equipmentProducts.isDeleted, false),
  ];
  if (codeFilter.length > 0) {
    conditions.push(sql`${equipmentProducts.equipmentCodeId} = ANY(${codeFilter})`);
  }
  if (search) {
    conditions.push(or(
      like(equipmentProducts.modelName, `%${search}%`),
      like(equipmentProducts.manufacturer, `%${search}%`),
    )!);
  }

  const whereClause = and(...conditions);

  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(equipmentProducts).where(whereClause);

  const items = await db
    .select({
      id: equipmentProducts.id,
      tenantId: equipmentProducts.tenantId,
      equipmentCodeId: equipmentProducts.equipmentCodeId,
      modelName: equipmentProducts.modelName,
      manufacturer: equipmentProducts.manufacturer,
      specs: equipmentProducts.specs,
      createdAt: equipmentProducts.createdAt,
      listPrice: equipmentProductPrices.listPrice,
      marketPrice: equipmentProductPrices.marketPrice,
      supplyPrice: equipmentProductPrices.supplyPrice,
      equipmentCode: equipmentCodes.code,
      equipmentName: equipmentCodes.name,
    })
    .from(equipmentProducts)
    .leftJoin(equipmentProductPrices, eq(equipmentProductPrices.productId, equipmentProducts.id))
    .leftJoin(equipmentCodes, eq(equipmentCodes.id, equipmentProducts.equipmentCodeId))
    .where(whereClause)
    .orderBy(desc(equipmentProducts.createdAt))
    .limit(limit)
    .offset(offset);

  // 장비 코드의 부모 경로 (대분류>중분류) 보강
  const codeIds = [...new Set(items.map(i => i.equipmentCodeId))];
  const codePathMap = new Map<string, string>();

  if (codeIds.length > 0) {
    for (const item of items) {
      if (item.equipmentCode && !codePathMap.has(item.equipmentCodeId)) {
        const parts = item.equipmentCode.split("-");
        if (parts.length >= 2) {
          const majorC = parts[0];
          const minorC = `${parts[0]}-${parts[1]}`;
          const [major] = await db.select({ name: equipmentCodes.name }).from(equipmentCodes)
            .where(and(eq(equipmentCodes.tenantId, user.tenantId), eq(equipmentCodes.code, majorC))).limit(1);
          const [minor] = await db.select({ name: equipmentCodes.name }).from(equipmentCodes)
            .where(and(eq(equipmentCodes.tenantId, user.tenantId), eq(equipmentCodes.code, minorC))).limit(1);
          codePathMap.set(item.equipmentCodeId, `${major?.name ?? ""} > ${minor?.name ?? ""}`);
        }
      }
    }
  }

  const enriched = items.map(item => ({
    ...item,
    codePath: codePathMap.get(item.equipmentCodeId) ?? "",
  }));

  return NextResponse.json({
    success: true,
    data: { items: enriched, total: Number(countResult.count), page, limit },
  });
}

// POST: 장비 제품 추가
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }
  if (user.role !== "super_admin" && user.role !== "admin") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "관리자 권한 필요" } }, { status: 403 });
  }

  const body = await request.json();
  const { equipmentCodeId, modelName, manufacturer, specs, listPrice, marketPrice, supplyPrice } = body;

  if (!equipmentCodeId || !modelName || !manufacturer) {
    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "equipmentCodeId, modelName, manufacturer 필수" } }, { status: 400 });
  }

  const [product] = await db.insert(equipmentProducts).values({
    tenantId: user.tenantId,
    equipmentCodeId,
    modelName,
    manufacturer,
    specs: specs ?? {},
  }).returning();

  await db.insert(equipmentProductPrices).values({
    productId: product.id,
    listPrice: listPrice ?? 0,
    marketPrice: marketPrice ?? 0,
    supplyPrice: supplyPrice ?? 0,
  });

  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
