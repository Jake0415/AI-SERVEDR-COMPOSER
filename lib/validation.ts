// ============================================================
// 서버 사이드 Zod 검증 유틸리티
// API 라우트에서 공통으로 사용
// ============================================================

import { z } from "zod";
import { NextResponse } from "next/server";

/** Zod 스키마로 요청 body 검증 후 파싱된 데이터 또는 에러 응답 반환 */
export function validateBody<T extends z.ZodSchema>(
  schema: T,
  data: unknown,
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력 데이터가 유효하지 않습니다.",
            details: errors,
          },
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}

// --- 공통 Zod 스키마 ---

export const bidResultSchema = z.object({
  quotation_id: z.string().uuid("유효한 견적 ID가 필요합니다."),
  result: z.enum(["won", "lost", "pending", "expired"], {
    error: "결과는 won, lost, pending, expired 중 하나여야 합니다.",
  }),
  reason: z.string().max(500, "사유는 500자 이내로 입력하세요.").optional(),
  competitor_price: z.number().min(0, "경쟁사 가격은 0 이상이어야 합니다.").optional(),
});

export const customerSchema = z.object({
  company_name: z.string().min(1, "회사명은 필수입니다.").max(100),
  business_number: z.string().max(20).optional(),
  ceo_name: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  business_type: z.string().max(50).optional(),
  business_item: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  fax: z.string().max(20).optional(),
  email: z.string().email("유효한 이메일을 입력하세요.").optional().or(z.literal("")).or(z.undefined()),
  customer_type: z.enum(["public", "private", "other"]).default("private"),
  payment_terms: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export const partSchema = z.object({
  categoryId: z.string().uuid("유효한 카테고리 ID가 필요합니다."),
  modelName: z.string().min(1, "모델명은 필수입니다.").max(200),
  manufacturer: z.string().min(1, "제조사는 필수입니다.").max(100),
  specs: z.record(z.string(), z.union([z.string(), z.number()])).optional().default({}),
  listPrice: z.number().min(0, "리스트가는 0 이상이어야 합니다.").default(0),
  marketPrice: z.number().min(0, "시장가는 0 이상이어야 합니다.").default(0),
  supplyPrice: z.number().min(0, "공급가는 0 이상이어야 합니다.").default(0),
});

export const tenantUpdateSchema = z.object({
  companyName: z.string().min(1).max(100).optional(),
  businessNumber: z.string().max(20).optional(),
  ceoName: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  businessType: z.string().max(50).optional(),
  businessItem: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  fax: z.string().max(20).optional(),
  email: z.string().email().optional(),
  bankName: z.string().max(50).optional(),
  bankAccount: z.string().max(50).optional(),
  bankHolder: z.string().max(50).optional(),
  defaultValidityDays: z.number().min(1).max(365).optional(),
  defaultPaymentTerms: z.string().max(200).optional(),
  quotationPrefix: z.string().min(1).max(10).optional(),
});
