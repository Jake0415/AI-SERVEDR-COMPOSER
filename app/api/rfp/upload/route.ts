// ============================================================
// POST /api/rfp/upload — RFP 파일 업로드 & AI 파싱
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { analyzeRfpDocument } from "@/lib/ai/rfp-analyzer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, rfpDocuments, users } from "@/lib/db";
import { extractTextFromPdf } from "@/lib/parsers/pdf-parser";
import { extractTextFromDocx } from "@/lib/parsers/docx-parser";

/**
 * RFP 파일 업로드 → Storage 저장 → 텍스트 추출 → AI 파싱 → DB 저장
 * - Supabase: auth + storage
 * - Drizzle: DB 쿼리
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase는 인증 + Storage만 사용
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

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

    // Drizzle로 tenant_id 조회
    const userRows = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "사용자 정보를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    const tenantId = userRows[0].tenantId;

    // 1. Supabase Storage에 파일 업로드
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = `rfp/${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("rfp-documents")
      .upload(filePath, fileBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: { code: "UPLOAD_ERROR", message: `파일 업로드 실패: ${uploadError.message}` } },
        { status: 500 },
      );
    }

    // 2. Drizzle로 RFP 레코드 생성 (status: parsing)
    const [rfpRecord] = await db
      .insert(rfpDocuments)
      .values({
        tenantId,
        uploadedBy: user.id,
        fileName: file.name,
        fileUrl: filePath,
        status: "parsing",
      })
      .returning();

    // 3. 텍스트 추출
    const text = await extractTextFromFile(file.type, fileBuffer);

    if (!text.trim()) {
      await db
        .update(rfpDocuments)
        .set({ status: "error" })
        .where(eq(rfpDocuments.id, rfpRecord.id));

      return NextResponse.json(
        { success: false, error: { code: "EMPTY_CONTENT", message: "파일에서 텍스트를 추출할 수 없습니다." } },
        { status: 422 },
      );
    }

    // 4. AI 파싱
    const configs = await analyzeRfpDocument(text);

    // 5. Drizzle로 파싱 결과 저장 (status: parsed)
    await db
      .update(rfpDocuments)
      .set({ parsedRequirements: configs, status: "parsed" })
      .where(eq(rfpDocuments.id, rfpRecord.id));

    return NextResponse.json({
      success: true,
      data: {
        rfp_id: rfpRecord.id,
        file_name: file.name,
        file_size: file.size,
        parsed_configs: configs,
        config_count: configs.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { success: false, error: { code: "PARSING_ERROR", message } },
      { status: 500 },
    );
  }
}

/** 파일 형식에 따른 텍스트 추출 */
async function extractTextFromFile(fileType: string, buffer: Buffer): Promise<string> {
  if (fileType === "application/pdf") {
    return extractTextFromPdf(buffer);
  }
  if (fileType.includes("wordprocessingml") || fileType === "application/msword") {
    return extractTextFromDocx(buffer);
  }
  throw new Error(`지원하지 않는 파일 형식: ${fileType}`);
}
