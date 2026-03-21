// ============================================================
// POST /api/quotation/generate — 3가지 견적안 자동 생성 API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { generateQuotationSchema, rfpParsingResultSchema } from "@/lib/types/schemas";
import { generateAllQuotations } from "@/lib/quotation/matching-engine";
import { generateRecommendations } from "@/lib/ai/recommendation-explainer";
import { db, rfpDocuments, parts, partPrices, partCategories } from "@/lib/db";
import type { GenerateQuotationResponse } from "@/lib/types/ai";
import type { ParsedServerConfig } from "@/lib/types/ai";
import type { PartWithPrice } from "@/lib/quotation/matching-engine";

/**
 * 견적 생성 API
 *
 * 흐름:
 * 1. rfp_id로 파싱된 요구사항 조회 (Drizzle)
 * 2. 부품 DB에서 카테고리별 부품+가격 조회 (Drizzle)
 * 3. 매칭 엔진으로 3가지 견적안 생성
 * 4. LLM으로 추천 설명 생성
 * 5. 통합 결과 반환
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = generateQuotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const { rfp_id, customer_id, specs } = parsed.data;
    void customer_id;

    // 1. RFP 파싱 결과 조회 (rfp_id 또는 직접 specs)
    let rfpConfigs: ParsedServerConfig[] | null = null;
    if (specs && specs.length > 0) {
      rfpConfigs = specs;
    } else if (rfp_id) {
      rfpConfigs = await getRfpParsedConfigs(rfp_id);
    }
    if (!rfpConfigs || rfpConfigs.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "RFP_NOT_FOUND", message: "RFP 파싱 결과가 없습니다." } },
        { status: 404 },
      );
    }

    // 2. 부품 DB 조회
    const partsInventory = await getPartsInventory();

    // 3. 3가지 견적안 생성 (결정론적)
    const { profitability, spec_match, performance, compatibility } =
      generateAllQuotations(rfpConfigs, partsInventory);

    // 4. AI 추천 설명 생성 (LLM)
    let aiRecommendations;
    try {
      aiRecommendations = await generateRecommendations({
        requirements: rfpConfigs,
        profitability,
        spec_match,
        performance,
      });
    } catch {
      aiRecommendations = {
        profitability: { summary: "수익성 중심 견적안입니다.", pros: [], cons: [], selling_points: [] },
        spec_match: { summary: "RFP 규격에 정확히 부합하는 견적안입니다.", pros: [], cons: [], selling_points: [] },
        performance: { summary: "성능 향상을 고려한 견적안입니다.", pros: [], cons: [], selling_points: [] },
      };
    }

    // 5. 응답 조합
    const response: GenerateQuotationResponse = {
      quotations: { profitability, spec_match, performance },
      compatibility_warnings: [...compatibility.errors, ...compatibility.warnings],
      ai_recommendations: aiRecommendations,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("[API Error] /api/quotation/generate", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "서버 내부 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}

// --- Drizzle 데이터 조회 함수 ---

async function getRfpParsedConfigs(rfpId: string): Promise<ParsedServerConfig[] | null> {
  const rows = await db
    .select({ parsedRequirements: rfpDocuments.parsedRequirements })
    .from(rfpDocuments)
    .where(and(eq(rfpDocuments.id, rfpId), eq(rfpDocuments.status, "parsed")))
    .limit(1);

  if (rows.length === 0 || !rows[0].parsedRequirements) return null;

  const validated = rfpParsingResultSchema.safeParse(rows[0].parsedRequirements);
  return validated.success ? validated.data : null;
}

async function getPartsInventory(): Promise<Map<string, PartWithPrice[]>> {
  const rows = await db
    .select({
      part: parts,
      price: partPrices,
      categoryName: partCategories.name,
    })
    .from(parts)
    .innerJoin(partCategories, eq(parts.categoryId, partCategories.id))
    .leftJoin(partPrices, eq(parts.id, partPrices.partId))
    .where(eq(parts.isDeleted, false));

  const inventory = new Map<string, PartWithPrice[]>();

  for (const row of rows) {
    if (!row.price) continue;

    const entry: PartWithPrice = {
      part: {
        id: row.part.id,
        tenant_id: row.part.tenantId,
        category_id: row.part.categoryId,
        model_name: row.part.modelName,
        manufacturer: row.part.manufacturer,
        specs: row.part.specs as Record<string, string | number>,
        is_deleted: row.part.isDeleted,
        deleted_at: row.part.deletedAt?.toISOString() ?? null,
        created_at: row.part.createdAt.toISOString(),
      },
      price: {
        id: row.price.id,
        part_id: row.price.partId,
        list_price: row.price.listPrice,
        market_price: row.price.marketPrice,
        cost_price: 0, // 암호화 필드는 별도 복호화 필요
        supply_price: row.price.supplyPrice,
      },
    };

    const existing = inventory.get(row.categoryName) ?? [];
    existing.push(entry);
    inventory.set(row.categoryName, existing);
  }

  return inventory;
}
