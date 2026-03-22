// ============================================================
// GET /api/rfp/[id] — RFP 문서 상세 조회
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { unlink } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, rfpDocuments, quotations } from "@/lib/db";

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

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "RFP ID가 필요합니다." } },
        { status: 400 },
      );
    }

    const rows = await db
      .select()
      .from(rfpDocuments)
      .where(
        and(
          eq(rfpDocuments.id, id),
          eq(rfpDocuments.tenantId, user.tenantId),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "RFP를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("[API Error] /api/rfp/[id]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "서버 내부 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}

// ============================================================
// DELETE /api/rfp/[id] — RFP 문서 삭제
// ============================================================

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

    const { id } = await params;

    // 1. RFP 레코드 조회 + tenantId 검증
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

    // 2. 연결된 draft quotation 삭제
    await db
      .delete(quotations)
      .where(
        and(
          eq(quotations.rfpId, id),
          eq(quotations.status, "draft"),
        ),
      );

    // 3. 로컬 파일 삭제 (에러 무시)
    try {
      const filePath = path.isAbsolute(rfp.fileUrl)
        ? rfp.fileUrl
        : path.resolve(rfp.fileUrl);
      await unlink(filePath);
    } catch {
      /* 파일 없어도 OK */
    }

    // 4. RFP 레코드 삭제
    await db.delete(rfpDocuments).where(eq(rfpDocuments.id, id));

    return NextResponse.json({ success: true, data: { message: "삭제되었습니다." } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "서버 내부 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
