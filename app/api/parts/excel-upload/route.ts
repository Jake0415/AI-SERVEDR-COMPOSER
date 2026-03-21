// ============================================================
// POST /api/parts/excel-upload — 서버 파트 엑셀 일괄 업로드
// 파트코드 기반 매핑 (IT 인프라 장비 방식과 동일)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, parts, partPrices, partCategories, partCodes, excelUploadLogs, partPriceHistory } from "@/lib/db";
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

    // 파트코드 맵 구축 (code → {id, name, level, parentId})
    const allPartCodes = await db
      .select()
      .from(partCodes)
      .where(eq(partCodes.tenantId, user.tenantId));
    const codeToPartCode = new Map(allPartCodes.map((c) => [c.code, c]));

    // 카테고리 맵 구축 (name → id) — partCode Level1 name과 매핑
    const categories = await db
      .select()
      .from(partCategories)
      .where(eq(partCategories.tenantId, user.tenantId));
    const categoryNameToId = new Map(categories.map((c) => [c.name, c.id]));

    // Level1 코드 name → category name 매핑 (소문자 변환)
    // seed-data.mjs 참조: partCodeMap = { "cpu": "CP-001", ... }
    // Level1 name(예: "CPU") → category name(예: "cpu")
    const level1ToCategoryId = new Map<string, string>();
    for (const pc of allPartCodes) {
      if (pc.level === 1) {
        // Level1 name을 소문자로 변환하여 카테고리 매칭 시도
        const catId = categoryNameToId.get(pc.name.toLowerCase())
          ?? categoryNameToId.get(pc.name);
        if (catId) {
          level1ToCategoryId.set(pc.id, catId);
        }
      }
    }

    const errors: RowError[] = [];
    let successCount = 0;
    let totalRows = 0;

    // 행 수 카운트
    ws.eachRow((_, rowNumber) => {
      if (rowNumber > 1) totalRows++;
    });

    // 업로드 로그 생성
    const [uploadLog] = await db.insert(excelUploadLogs).values({
      tenantId: user.tenantId,
      uploadedBy: user.id,
      fileName: file.name,
      totalRows,
      status: "processing",
    }).returning();

    // 행별 파싱
    const rowsToProcess: Array<{
      rowNum: number;
      partCodeId: string;
      categoryId: string;
      modelName: string;
      manufacturer: string;
      listPrice: number;
      marketPrice: number;
      supplyPrice: number;
      specs: Record<string, string>;
    }> = [];

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const partCodeStr = String(row.getCell(1).value ?? "").trim();
      const modelName = String(row.getCell(2).value ?? "").trim();
      const manufacturer = String(row.getCell(3).value ?? "").trim();
      const listPrice = Number(row.getCell(4).value) || 0;
      const marketPrice = Number(row.getCell(5).value) || 0;
      const supplyPrice = Number(row.getCell(6).value) || 0;

      // 필수 필드 검증
      if (!partCodeStr) {
        errors.push({ row: rowNumber, field: "파트코드", value: "", message: "필수 항목입니다." });
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

      // 파트코드 유효성 검증
      const partCodeEntry = codeToPartCode.get(partCodeStr);
      if (!partCodeEntry) {
        errors.push({ row: rowNumber, field: "파트코드", value: partCodeStr, message: "등록되지 않은 파트코드입니다." });
        return;
      }

      // 파트코드 → Level1 부모 → categoryId 매핑
      let categoryId: string | undefined;
      if (partCodeEntry.level === 1) {
        categoryId = level1ToCategoryId.get(partCodeEntry.id);
      } else {
        // Level 2 이상: 부모 Level 1 찾기
        const parentEntry = allPartCodes.find((c) => c.id === partCodeEntry.parentId);
        if (parentEntry) {
          categoryId = level1ToCategoryId.get(parentEntry.id);
        }
      }

      if (!categoryId) {
        // 매핑 실패 시 첫 번째 카테고리를 기본값으로 사용
        categoryId = categories[0]?.id;
        if (!categoryId) {
          errors.push({ row: rowNumber, field: "파트코드", value: partCodeStr, message: "매핑 가능한 카테고리가 없습니다." });
          return;
        }
      }

      if (listPrice < 0 || marketPrice < 0 || supplyPrice < 0) {
        errors.push({ row: rowNumber, field: "가격", value: "", message: "가격은 0 이상이어야 합니다." });
        return;
      }

      // 스펙 추출 (G~L 컬럼)
      const specs: Record<string, string> = {};
      const specKeys = ["cores", "frequency", "capacity", "interface", "tdp", "note"];
      specKeys.forEach((key, idx) => {
        const val = String(row.getCell(7 + idx).value ?? "").trim();
        if (val) specs[key] = val;
      });

      rowsToProcess.push({
        rowNum: rowNumber,
        partCodeId: partCodeEntry.id,
        categoryId,
        modelName,
        manufacturer,
        listPrice,
        marketPrice,
        supplyPrice,
        specs,
      });
    });

    // DB 등록
    for (const row of rowsToProcess) {
      try {
        // 중복 체크 (modelName + manufacturer)
        const [existing] = await db
          .select()
          .from(parts)
          .where(
            and(
              eq(parts.tenantId, user.tenantId),
              eq(parts.modelName, row.modelName),
              eq(parts.manufacturer, row.manufacturer),
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
              costPriceAfter: 0,
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
            .set({ specs: row.specs, partCodeId: row.partCodeId })
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
          partCodeId: row.partCodeId,
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
