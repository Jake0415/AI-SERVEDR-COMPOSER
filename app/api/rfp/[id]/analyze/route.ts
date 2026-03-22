// ============================================================
// POST /api/rfp/[id]/analyze — RFP AI 파싱 실행
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, rfpDocuments } from "@/lib/db";
import { analyzeRfpDocument } from "@/lib/ai/rfp-analyzer";
import { extractTextFromPdf } from "@/lib/parsers/pdf-parser";
import { extractTextFromDocx } from "@/lib/parsers/docx-parser";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(
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

    const { id } = await params;

    // RFP 레코드 조회
    const [rfp] = await db
      .select()
      .from(rfpDocuments)
      .where(eq(rfpDocuments.id, id))
      .limit(1);

    if (!rfp) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "RFP를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // 이미 파싱 완료된 경우
    if (rfp.status === "parsed" && rfp.parsedRequirements) {
      return NextResponse.json({
        success: true,
        data: { configs: rfp.parsedRequirements, already_parsed: true },
      });
    }

    // 파싱 시작 상태 업데이트
    await db
      .update(rfpDocuments)
      .set({ status: "parsing" })
      .where(eq(rfpDocuments.id, id));

    // 파일 읽기 (상대 경로 → 절대 경로 변환)
    const filePath = path.isAbsolute(rfp.fileUrl) ? rfp.fileUrl : path.resolve(rfp.fileUrl);
    const fileBuffer = await readFile(filePath);

    // 텍스트 추출
    const isPdf = rfp.fileName.toLowerCase().endsWith(".pdf");
    const text = isPdf
      ? await extractTextFromPdf(fileBuffer)
      : await extractTextFromDocx(fileBuffer);

    if (!text.trim()) {
      await db
        .update(rfpDocuments)
        .set({ status: "error" })
        .where(eq(rfpDocuments.id, id));

      return NextResponse.json(
        { success: false, error: { code: "EMPTY_CONTENT", message: "파일에서 텍스트를 추출할 수 없습니다." } },
        { status: 422 },
      );
    }

    // AI 파싱
    const configs = await analyzeRfpDocument(text, user.tenantId);

    // 결과 저장
    await db
      .update(rfpDocuments)
      .set({ parsedRequirements: configs, status: "parsed" })
      .where(eq(rfpDocuments.id, id));

    const configCount = Array.isArray(configs)
      ? configs.length
      : Array.isArray((configs as Record<string, unknown>)?.equipment_list)
        ? ((configs as Record<string, unknown>).equipment_list as unknown[]).length
        : 0;

    return NextResponse.json({
      success: true,
      data: { configs, config_count: configCount },
    });
  } catch (error) {
    console.error("[API Error] /api/rfp/[id]/analyze", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: { code: "PARSING_ERROR", message: "AI 분석 중 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
