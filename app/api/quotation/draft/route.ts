// ============================================================
// POST /api/quotation/draft — 견적 초안 자동 생성
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations, tenants } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    if (user.role !== "admin" && user.role !== "member") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { customer_id, source, source_data } = body;

    if (!customer_id) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "customer_id는 필수입니다." } },
        { status: 400 },
      );
    }

    const validSources = ["rfp", "excel", "chat"];
    if (source && !validSources.includes(source)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "source는 rfp, excel, chat 중 하나여야 합니다." } },
        { status: 400 },
      );
    }

    // 테넌트 설정 조회 (견적번호 프리픽스, 유효기간)
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);

    // 견적번호 자동 생성: PREFIX-YYYYMMDD-NNN
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = tenant?.quotationPrefix ?? "Q";

    // 오늘 날짜 기준 마지막 견적번호 조회
    const pattern = `${prefix}-${dateStr}-%`;
    const [lastQuotation] = await db
      .select({ quotationNumber: quotations.quotationNumber })
      .from(quotations)
      .where(
        sql`${quotations.tenantId} = ${user.tenantId} AND ${quotations.quotationNumber} LIKE ${pattern}`,
      )
      .orderBy(desc(quotations.quotationNumber))
      .limit(1);

    let seq = 1;
    if (lastQuotation) {
      const lastSeq = parseInt(lastQuotation.quotationNumber.split("-").pop() ?? "0", 10);
      seq = lastSeq + 1;
    }
    const quotationNumber = `${prefix}-${dateStr}-${String(seq).padStart(3, "0")}`;

    // 유효기간 계산
    const defaultValidityDays = tenant?.defaultValidityDays ?? 30;
    const validityDate = new Date(today.getTime() + defaultValidityDays * 86400000)
      .toISOString()
      .slice(0, 10);

    // 견적 초안 레코드 삽입
    const [quotation] = await db
      .insert(quotations)
      .values({
        tenantId: user.tenantId,
        customerId: customer_id,
        quotationNumber,
        quotationType: "standard",
        status: "draft",
        source: source || null,
        sourceData: source_data || null,
        validityDate,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: { id: quotation.id, quotationNumber: quotation.quotationNumber },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
