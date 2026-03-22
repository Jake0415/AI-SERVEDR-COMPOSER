// ============================================================
// POST /api/rfp/[id]/match — RFP 장비 매칭 (parts + equipment_products)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import {
  db,
  rfpDocuments,
  parts,
  partPrices,
  equipmentProducts,
  equipmentProductPrices,
} from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const { id } = await params;

    // RFP 레코드 조회
    const [rfp] = await db
      .select()
      .from(rfpDocuments)
      .where(
        and(
          eq(rfpDocuments.id, id),
          eq(rfpDocuments.tenantId, user.tenantId),
        ),
      )
      .limit(1);

    if (!rfp) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "RFP를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    if (!rfp.parsedRequirements) {
      return NextResponse.json(
        { success: false, error: { code: "NO_DATA", message: "분석된 요구사항이 없습니다. 먼저 AI 분석을 실행하세요." } },
        { status: 400 },
      );
    }

    // equipment_list 추출 (다양한 JSON 구조 대응)
    const parsed = rfp.parsedRequirements as Record<string, unknown>;
    const equipmentList = (
      parsed.equipment_list ?? parsed.configs ?? parsed
    ) as Array<Record<string, unknown>>;

    if (!Array.isArray(equipmentList)) {
      return NextResponse.json(
        { success: false, error: { code: "NO_DATA", message: "장비 목록이 없습니다." } },
        { status: 400 },
      );
    }

    // 각 장비에 대해 매칭 검색
    const matches = [];

    for (const equip of equipmentList) {
      const name = String(equip.name ?? equip.item_name ?? "");
      const category = String(equip.category ?? equip.type ?? "");

      // parts 테이블에서 검색 (서버 파트)
      const matchedParts = await db
        .select({
          id: parts.id,
          modelName: parts.modelName,
          manufacturer: parts.manufacturer,
          specs: parts.specs,
          listPrice: partPrices.listPrice,
          marketPrice: partPrices.marketPrice,
          supplyPrice: partPrices.supplyPrice,
        })
        .from(parts)
        .leftJoin(partPrices, eq(parts.id, partPrices.partId))
        .where(
          and(
            eq(parts.tenantId, user.tenantId),
            eq(parts.isDeleted, false),
          ),
        )
        .limit(10);

      // equipment_products 테이블에서 검색 (IT 인프라 장비)
      const matchedEquipment = await db
        .select({
          id: equipmentProducts.id,
          modelName: equipmentProducts.modelName,
          manufacturer: equipmentProducts.manufacturer,
          specs: equipmentProducts.specs,
          listPrice: equipmentProductPrices.listPrice,
          marketPrice: equipmentProductPrices.marketPrice,
          supplyPrice: equipmentProductPrices.supplyPrice,
        })
        .from(equipmentProducts)
        .leftJoin(
          equipmentProductPrices,
          eq(equipmentProducts.id, equipmentProductPrices.productId),
        )
        .where(
          and(
            eq(equipmentProducts.tenantId, user.tenantId),
            eq(equipmentProducts.isDeleted, false),
          ),
        )
        .limit(10);

      matches.push({
        equipment_name: name,
        equipment_category: category,
        equipment_index: equip.item_index ?? matches.length,
        matched_parts: matchedParts,
        matched_equipment: matchedEquipment,
      });
    }

    return NextResponse.json({ success: true, data: { matches } });
  } catch (error) {
    console.error(
      "[API Error] /api/rfp/[id]/match",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { success: false, error: { code: "MATCH_ERROR", message: "매칭 중 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
