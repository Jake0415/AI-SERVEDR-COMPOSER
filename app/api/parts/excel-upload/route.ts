// ============================================================
// POST /api/parts/excel-upload — 엑셀 일괄 업로드
// 파싱 → 검증 → 일괄 등록 → 이력 저장
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, parts, partPrices, partCategories, excelUploadLogs, partPriceHistory } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

interface RowError {
  row: number;
  field: string;
  value: string;
  message: string;
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
        { success: false, error: { code: "FORBIDDEN", message: "관리자 이상만 업로드할 수 있습니다." } },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const duplicateMode = (formData.get("duplicate_mode") as string) ?? "skip";

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "파일이 필요합니다." } },
        { status: 400 },
      );
    }

    // 엑셀 파싱
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const ws = workbook.getWorksheet("부품 데이터") ?? workbook.worksheets[0];

    if (!ws) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "워크시트를 찾을 수 없습니다." } },
        { status: 400 },
      );
    }

    // 카테고리 맵 구축
    const categories = await db
      .select()
      .from(partCategories)
      .where(eq(partCategories.tenantId, user.tenantId));
    const categoryMap = new Map(categories.map((c) => [c.displayName, c.id]));

    const errors: RowError[] = [];
    let successCount = 0;
    let totalRows = 0;

    // 행 순회 (2행부터, 1행은 헤더)
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 건너뛰기
      totalRows++;
    });

    // 로그 먼저 생성
    const [uploadLog] = await db.insert(excelUploadLogs).values({
      tenantId: user.tenantId,
      uploadedBy: user.id,
      fileName: file.name,
      totalRows,
      status: "processing",
    }).returning();

    // 행별 처리
    const rowsToProcess: Array<{
      rowNum: number;
      categoryId: string;
      modelName: string;
      manufacturer: string;
      listPrice: number;
      marketPrice: number;
      costPrice: number;
      supplyPrice: number;
      specs: Record<string, string>;
    }> = [];

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const categoryName = String(row.getCell(1).value ?? "").trim();
      const modelName = String(row.getCell(2).value ?? "").trim();
      const manufacturer = String(row.getCell(3).value ?? "").trim();
      const listPrice = Number(row.getCell(4).value) || 0;
      const marketPrice = Number(row.getCell(5).value) || 0;
      const costPrice = Number(row.getCell(6).value) || 0;
      const supplyPrice = Number(row.getCell(7).value) || 0;
      const specsStr = String(row.getCell(8).value ?? "").trim();

      // 유효성 검증
      if (!categoryName) {
        errors.push({ row: rowNumber, field: "카테고리명", value: "", message: "필수 항목입니다." });
        return;
      }
      if (!modelName) {
        errors.push({ row: rowNumber, field: "모델명", value: "", message: "필수 항목입니다." });
        return;
      }
      if (!manufacturer) {
        errors.push({ row: rowNumber, field: "제조사", value: "", message: "필수 항목입니다." });
        return;
      }

      const categoryId = categoryMap.get(categoryName);
      if (!categoryId) {
        errors.push({ row: rowNumber, field: "카테고리명", value: categoryName, message: "존재하지 않는 카테고리입니다." });
        return;
      }

      if (listPrice < 0 || marketPrice < 0 || costPrice < 0 || supplyPrice < 0) {
        errors.push({ row: rowNumber, field: "가격", value: "", message: "가격은 0 이상이어야 합니다." });
        return;
      }

      // 스펙 파싱
      const specs: Record<string, string> = {};
      if (specsStr) {
        specsStr.split(";").forEach((pair) => {
          const [k, v] = pair.split("=");
          if (k && v) specs[k.trim()] = v.trim();
        });
      }

      rowsToProcess.push({
        rowNum: rowNumber,
        categoryId,
        modelName,
        manufacturer,
        listPrice,
        marketPrice,
        costPrice,
        supplyPrice,
        specs,
      });
    });

    // DB 등록
    for (const row of rowsToProcess) {
      try {
        // 중복 체크
        const [existing] = await db
          .select()
          .from(parts)
          .where(
            and(
              eq(parts.tenantId, user.tenantId),
              eq(parts.modelName, row.modelName),
              eq(parts.manufacturer, row.manufacturer),
              eq(parts.categoryId, row.categoryId),
              eq(parts.isDeleted, false),
            ),
          )
          .limit(1);

        if (existing) {
          if (duplicateMode === "skip") {
            errors.push({ row: row.rowNum, field: "모델명", value: row.modelName, message: "이미 등록된 부품입니다 (건너뜀)." });
            continue;
          }

          // 덮어쓰기: 가격 업데이트 + 이력 기록
          const [oldPrice] = await db
            .select()
            .from(partPrices)
            .where(eq(partPrices.partId, existing.id))
            .limit(1);

          if (oldPrice) {
            await db.insert(partPriceHistory).values({
              partId: existing.id,
              tenantId: user.tenantId,
              changeType: "excel_upload",
              listPriceBefore: oldPrice.listPrice,
              listPriceAfter: row.listPrice,
              marketPriceBefore: oldPrice.marketPrice,
              marketPriceAfter: row.marketPrice,
              costPriceBefore: 0,
              costPriceAfter: row.costPrice,
              supplyPriceBefore: oldPrice.supplyPrice,
              supplyPriceAfter: row.supplyPrice,
              changedBy: user.id,
              changeReason: `엑셀 업로드 (${file.name})`,
            });

            await db
              .update(partPrices)
              .set({
                listPrice: row.listPrice,
                marketPrice: row.marketPrice,
                supplyPrice: row.supplyPrice,
              })
              .where(eq(partPrices.partId, existing.id));
          }

          await db
            .update(parts)
            .set({ specs: row.specs })
            .where(eq(parts.id, existing.id));

          successCount++;
          continue;
        }

        // 신규 등록
        const [newPart] = await db.insert(parts).values({
          tenantId: user.tenantId,
          categoryId: row.categoryId,
          modelName: row.modelName,
          manufacturer: row.manufacturer,
          specs: row.specs,
        }).returning();

        await db.insert(partPrices).values({
          partId: newPart.id,
          listPrice: row.listPrice,
          marketPrice: row.marketPrice,
          supplyPrice: row.supplyPrice,
        });

        successCount++;
      } catch {
        errors.push({ row: row.rowNum, field: "시스템", value: "", message: "DB 등록 중 오류가 발생했습니다." });
      }
    }

    // 업로드 로그 업데이트
    await db
      .update(excelUploadLogs)
      .set({
        totalRows,
        successRows: successCount,
        failedRows: errors.length,
        errorDetails: errors.length > 0 ? errors : null,
        status: "completed",
      })
      .where(eq(excelUploadLogs.id, uploadLog.id));

    return NextResponse.json({
      success: true,
      data: {
        uploadId: uploadLog.id,
        totalRows,
        successRows: successCount,
        failedRows: errors.length,
        errors: errors.slice(0, 50),
      },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
