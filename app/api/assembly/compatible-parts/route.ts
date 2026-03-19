// ============================================================
// GET /api/assembly/compatible-parts — 호환 부품 조회 API
// 사용법: GET /api/assembly/compatible-parts?category=cpu&filter=socket:LGA4677
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, ilike } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, parts, partPrices, partCategories } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const filter = searchParams.get("filter"); // key:value 형식
    const manufacturer = searchParams.get("manufacturer");
    const search = searchParams.get("search");
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "category 파라미터가 필요합니다." } },
        { status: 400 },
      );
    }

    // 1. 카테고리 ID 조회
    const categoryRows = await db
      .select()
      .from(partCategories)
      .where(
        and(
          eq(partCategories.tenantId, user.tenantId),
          eq(partCategories.name, category),
        ),
      )
      .limit(1);

    if (categoryRows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: `카테고리 '${category}'를 찾을 수 없습니다.` } },
        { status: 404 },
      );
    }

    const categoryId = categoryRows[0].id;

    // 2. 부품 + 가격 조인 쿼리
    const conditions = [
      eq(parts.tenantId, user.tenantId),
      eq(parts.categoryId, categoryId),
      eq(parts.isDeleted, false),
    ];

    // 제조사 필터
    if (manufacturer) {
      conditions.push(ilike(parts.manufacturer, `%${manufacturer}%`));
    }

    // 모델명 검색
    if (search) {
      conditions.push(ilike(parts.modelName, `%${search}%`));
    }

    const rows = await db
      .select({
        id: parts.id,
        modelName: parts.modelName,
        manufacturer: parts.manufacturer,
        specs: parts.specs,
        createdAt: parts.createdAt,
        listPrice: partPrices.listPrice,
        marketPrice: partPrices.marketPrice,
        supplyPrice: partPrices.supplyPrice,
      })
      .from(parts)
      .leftJoin(partPrices, eq(parts.id, partPrices.partId))
      .where(and(...conditions))
      .limit(limit);

    // 3. specs 필드 기반 필터 (filter=key:value)
    let filtered = rows;
    if (filter) {
      const [filterKey, filterValue] = filter.split(":");
      if (filterKey && filterValue) {
        filtered = rows.filter((row) => {
          const specs = row.specs as Record<string, unknown>;
          const specVal = String(specs[filterKey] ?? "").toLowerCase();
          return specVal.includes(filterValue.toLowerCase());
        });
      }
    }

    const data = filtered.map((row) => ({
      id: row.id,
      modelName: row.modelName,
      manufacturer: row.manufacturer,
      specs: row.specs,
      listPrice: row.listPrice ?? 0,
      marketPrice: row.marketPrice ?? 0,
      supplyPrice: row.supplyPrice ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { total: data.length },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}
