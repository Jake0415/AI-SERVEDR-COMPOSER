// ============================================================
// POST /api/rfp/upload — RFP 파일 업로드 (파일 저장만)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, rfpDocuments, quotations, tenants } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads/rfp";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customerId = formData.get("customer_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "NO_FILE", message: "파일이 없습니다." } },
        { status: 400 },
      );
    }

    // 파일 형식 검증
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_FILE_TYPE", message: "PDF 또는 DOCX 파일만 업로드 가능합니다." } },
        { status: 400 },
      );
    }

    // 파일 크기 제한 (20MB)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: "FILE_TOO_LARGE", message: "파일 크기는 20MB 이하만 가능합니다." } },
        { status: 400 },
      );
    }

    // 로컬 파일 저장
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}_${file.name}`;
    const userDir = path.join(UPLOAD_DIR, user.id);
    await mkdir(userDir, { recursive: true });
    const filePath = path.join(userDir, fileName);
    await writeFile(filePath, fileBuffer);

    // DB에 RFP 레코드 생성 (status: uploaded)
    const [rfpRecord] = await db
      .insert(rfpDocuments)
      .values({
        tenantId: user.tenantId,
        uploadedBy: user.id,
        customerId: customerId || undefined,
        fileName: file.name,
        fileUrl: filePath,
        status: "uploaded",
      })
      .returning();

    // draft quotation 자동 생성 (customerId가 있을 때만)
    let draftQuotation: { id: string; quotationNumber: string } | null = null;

    if (customerId) {
      const [tenant] = await db
        .select({ quotationPrefix: tenants.quotationPrefix, defaultValidityDays: tenants.defaultValidityDays })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

      const prefix = tenant?.quotationPrefix ?? "Q";
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

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

      const defaultValidityDays = tenant?.defaultValidityDays ?? 30;
      const defaultValidityDate = new Date(today.getTime() + defaultValidityDays * 86400000)
        .toISOString()
        .slice(0, 10);

      const [draft] = await db
        .insert(quotations)
        .values({
          tenantId: user.tenantId,
          rfpId: rfpRecord.id,
          customerId,
          quotationNumber,
          revision: 1,
          quotationType: "standard",
          status: "draft",
          source: "rfp",
          validityDate: defaultValidityDate,
          createdBy: user.id,
        })
        .returning({ id: quotations.id, quotationNumber: quotations.quotationNumber });

      draftQuotation = draft ?? null;
    }

    return NextResponse.json({
      success: true,
      data: {
        rfp_id: rfpRecord.id,
        file_name: file.name,
        file_size: file.size,
        draft_quotation: draftQuotation,
      },
    });
  } catch (error) {
    console.error("[API Error] /api/rfp/upload", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: { code: "UPLOAD_ERROR", message: "파일 업로드 중 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
