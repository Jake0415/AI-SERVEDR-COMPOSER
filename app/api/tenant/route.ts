// ============================================================
// GET /api/tenant — 테넌트(회사) 정보 조회
// PUT /api/tenant — 테넌트(회사) 정보 수정
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, tenants } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "테넌트를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: tenant });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    // 관리자 이상만 수정 가능
    if (user.role === "member") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "관리자 이상만 수정할 수 있습니다." } },
        { status: 403 },
      );
    }

    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "companyName", "businessNumber", "ceoName", "address",
      "businessType", "businessItem", "phone", "fax", "email",
      "logoUrl", "sealUrl", "bankName", "bankAccount", "bankHolder",
      "defaultValidityDays", "defaultPaymentTerms", "quotationPrefix",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "수정할 필드가 없습니다." } },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, user.tenantId))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
