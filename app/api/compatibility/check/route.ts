// ============================================================
// POST /api/compatibility/check — 부품 호환성 검증 API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCompatibility } from "@/lib/compatibility/validator";
import type { MatchedPart } from "@/lib/types/ai";

const matchedPartSchema = z.object({
  category: z.string(),
  part_id: z.string(),
  model_name: z.string(),
  manufacturer: z.string(),
  specs: z.record(z.string(), z.union([z.string(), z.number()])),
  quantity: z.number().min(1),
  unit_cost_price: z.number(),
  unit_supply_price: z.number(),
  match_score: z.number().default(0),
  match_reason: z.string().default(""),
});

const requestSchema = z.object({
  parts: z.array(matchedPartSchema),
  total_power_recommended: z.number().optional(),
});

/**
 * 부품 목록의 호환성을 독립적으로 검증
 * 견적 생성 외에도 부품 수동 조합 시 사용 가능
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const parts = parsed.data.parts as MatchedPart[];
    const result = validateCompatibility(parts, parsed.data.total_power_recommended);

    return NextResponse.json({
      success: true,
      data: {
        is_valid: result.is_valid,
        error_count: result.errors.length,
        warning_count: result.warnings.length,
        errors: result.errors,
        warnings: result.warnings,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}
