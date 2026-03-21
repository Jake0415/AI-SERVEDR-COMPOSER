// ============================================================
// GET /api/customers — 거래처 목록 조회
// POST /api/customers — 거래처 등록
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, customers } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

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
    const search = searchParams.get("search") ?? "";
    const frequentOnly = searchParams.get("frequent") === "true";

    let query = db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, user.tenantId))
      .orderBy(desc(customers.createdAt))
      .$dynamic();

    if (search) {
      query = query.where(
        sql`${customers.tenantId} = ${user.tenantId} AND (${ilike(customers.companyName, `%${search}%`)} OR ${ilike(customers.businessNumber, `%${search}%`)})`,
      );
    }

    if (frequentOnly) {
      query = query.where(
        sql`${customers.tenantId} = ${user.tenantId} AND ${customers.isFrequent} = true`,
      );
    }

    const rows = await query.limit(100);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    if (user.role === "member") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "관리자 이상만 등록할 수 있습니다." } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { company_name, business_number, ceo_name, address, business_type, business_item, phone, fax, email, customer_type, payment_terms, notes } = body;

    if (!company_name || typeof company_name !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "회사명은 필수입니다." } },
        { status: 400 },
      );
    }

    if (business_number && typeof business_number !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "사업자번호 형식이 올바르지 않습니다." } },
        { status: 400 },
      );
    }

    if (email && typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "이메일 형식이 올바르지 않습니다." } },
        { status: 400 },
      );
    }

    // 사업자번호 중복 체크
    if (business_number) {
      const [existing] = await db
        .select()
        .from(customers)
        .where(sql`${customers.tenantId} = ${user.tenantId} AND ${customers.businessNumber} = ${business_number}`)
        .limit(1);

      if (existing) {
        return NextResponse.json(
          { success: false, error: { code: "DUPLICATE", message: "이미 등록된 사업자번호입니다." } },
          { status: 409 },
        );
      }
    }

    const [customer] = await db
      .insert(customers)
      .values({
        tenantId: user.tenantId,
        companyName: company_name,
        businessNumber: business_number || null,
        ceoName: ceo_name || null,
        address: address || null,
        businessType: business_type || null,
        businessItem: business_item || null,
        phone: phone || null,
        fax: fax || null,
        email: email || null,
        customerType: customer_type ?? "private",
        paymentTerms: payment_terms || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
