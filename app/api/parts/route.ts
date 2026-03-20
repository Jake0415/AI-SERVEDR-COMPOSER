// ============================================================
// 부품 API — GET (목록 조회) + POST (부품 추가)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db, parts, partPrices, partCategories, partCodes } from "@/lib/db";
import { eq, and, like, sql, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import type { ApiResponse } from "@/lib/types";

/** GET /api/parts — 부품 목록 조회 (조인 + 필터 + 페이지네이션) */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get("category_id");
    const partCodeFilter = searchParams.get("part_code");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const offset = (page - 1) * limit;

    // 조건 배열 구성
    const conditions = [
      eq(parts.tenantId, user.tenantId),
      eq(parts.isDeleted, false),
    ];

    if (categoryId) {
      conditions.push(eq(parts.categoryId, categoryId));
    }

    // 파트 코드 기준 필터 (Level 1 code, 예: "CP", "MM")
    if (partCodeFilter) {
      conditions.push(like(partCodes.code, `${partCodeFilter}%`));
    }

    if (search) {
      conditions.push(
        or(
          like(parts.modelName, `%${search}%`),
          like(parts.manufacturer, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    // 전체 건수 조회
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(parts);
    if (partCodeFilter) {
      countQuery.leftJoin(partCodes, eq(partCodes.id, parts.partCodeId));
    }
    const [countResult] = await countQuery.where(whereClause);

    const total = countResult?.count ?? 0;

    // 부품 + 가격 + 카테고리 조인 조회
    const items = await db
      .select({
        id: parts.id,
        tenantId: parts.tenantId,
        categoryId: parts.categoryId,
        modelName: parts.modelName,
        manufacturer: parts.manufacturer,
        specs: parts.specs,
        isDeleted: parts.isDeleted,
        createdAt: parts.createdAt,
        // 가격 정보
        priceId: partPrices.id,
        listPrice: partPrices.listPrice,
        marketPrice: partPrices.marketPrice,
        supplyPrice: partPrices.supplyPrice,
        // 카테고리 정보
        categoryName: partCategories.name,
        categoryDisplayName: partCategories.displayName,
        categoryGroup: partCategories.group,
        // 파트 코드 정보
        partCodeId: parts.partCodeId,
        partCodeCode: partCodes.code,
        partCodeName: partCodes.name,
      })
      .from(parts)
      .leftJoin(partPrices, eq(partPrices.partId, parts.id))
      .leftJoin(partCategories, eq(partCategories.id, parts.categoryId))
      .leftJoin(partCodes, eq(partCodes.id, parts.partCodeId))
      .where(whereClause)
      .orderBy(parts.createdAt)
      .limit(limit)
      .offset(offset);

    return NextResponse.json<ApiResponse<{ items: typeof items; total: number; page: number; limit: number }>>({
      success: true,
      data: { items, total, page, limit },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "부품 목록 조회 중 오류가 발생했습니다.";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}

/** POST /api/parts — 부품 신규 등록 (admin 이상) */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    if (user.role !== "super_admin" && user.role !== "admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "FORBIDDEN", message: "관리자 권한이 필요합니다." } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      categoryId,
      modelName,
      manufacturer,
      specs,
      listPrice,
      marketPrice,
      supplyPrice,
    } = body as {
      categoryId: string;
      modelName: string;
      manufacturer: string;
      specs: Record<string, string | number>;
      listPrice: number;
      marketPrice: number;
      supplyPrice: number;
    };

    // 필수 필드 검증
    if (!categoryId || !modelName || !manufacturer) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: { code: "VALIDATION_ERROR", message: "카테고리, 모델명, 제조사는 필수입니다." } },
        { status: 400 },
      );
    }

    // 부품 INSERT
    const [newPart] = await db
      .insert(parts)
      .values({
        tenantId: user.tenantId,
        categoryId,
        modelName,
        manufacturer,
        specs: specs ?? {},
      })
      .returning();

    // 가격 INSERT
    await db.insert(partPrices).values({
      partId: newPart.id,
      listPrice: listPrice ?? 0,
      marketPrice: marketPrice ?? 0,
      supplyPrice: supplyPrice ?? 0,
    });

    return NextResponse.json<ApiResponse<typeof newPart>>({
      success: true,
      data: newPart,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "부품 등록 중 오류가 발생했습니다.";
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}
