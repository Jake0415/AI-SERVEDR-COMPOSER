// ============================================================
// GET /api/customers/[id] — 거래처 상세 조회
// PUT /api/customers/[id] — 거래처 수정
// DELETE /api/customers/[id] — 거래처 삭제
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, customers, customerContacts, quotations } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
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

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!customer || customer.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "거래처를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    const contacts = await db
      .select()
      .from(customerContacts)
      .where(eq(customerContacts.customerId, id));

    return NextResponse.json({
      success: true,
      data: { ...customer, contacts },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(
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

    if (user.role === "member") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "관리자 이상만 수정할 수 있습니다." } },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!existing || existing.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "거래처를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    const fields = [
      "companyName", "businessNumber", "ceoName", "address",
      "businessType", "businessItem", "phone", "fax", "email",
      "customerType", "paymentTerms", "notes", "isFrequent",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const [updated] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
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

    if (user.role === "member") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "관리자 이상만 삭제할 수 있습니다." } },
        { status: 403 },
      );
    }

    const { id } = await params;

    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!existing || existing.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "거래처를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // 연결된 견적 존재 확인
    const [quotationCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(eq(quotations.customerId, id));

    if (quotationCount && Number(quotationCount.count) > 0) {
      return NextResponse.json(
        { success: false, error: { code: "HAS_QUOTATIONS", message: `연결된 견적이 ${quotationCount.count}건 있어 삭제할 수 없습니다.` } },
        { status: 409 },
      );
    }

    await db.delete(customers).where(eq(customers.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
