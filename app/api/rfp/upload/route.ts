// ============================================================
// POST /api/rfp/upload — RFP 파일 업로드 & AI 파싱
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { analyzeRfpDocument } from "@/lib/ai/rfp-analyzer";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, rfpDocuments } from "@/lib/db";
import { extractTextFromPdf } from "@/lib/parsers/pdf-parser";
import { extractTextFromDocx } from "@/lib/parsers/docx-parser";
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

    // DB에 RFP 레코드 생성 (status: parsing)
    const [rfpRecord] = await db
      .insert(rfpDocuments)
      .values({
        tenantId: user.tenantId,
        uploadedBy: user.id,
        fileName: file.name,
        fileUrl: filePath,
        status: "parsing",
      })
      .returning();

    // 텍스트 추출
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

    // AI 파싱
    const configs = await analyzeRfpDocument(text);

    // 파싱 결과 저장
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
