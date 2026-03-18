// ============================================================
// GET /api/parts/excel-template — 엑셀 업로드 템플릿 다운로드
// 현재 카테고리 목록이 반영된 동적 템플릿 생성
// ============================================================

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, partCategories } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    // 카테고리 목록 조회
    const categories = await db
      .select()
      .from(partCategories)
      .where(eq(partCategories.tenantId, user.tenantId));

    const categoryNames = categories.map((c) => c.displayName);

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("부품 데이터", {
      pageSetup: { orientation: "landscape" },
    });

    // 열 정의
    ws.columns = [
      { header: "카테고리명 *", key: "category", width: 15 },
      { header: "모델명 *", key: "modelName", width: 30 },
      { header: "제조사 *", key: "manufacturer", width: 15 },
      { header: "리스트가 *", key: "listPrice", width: 15 },
      { header: "시장가 *", key: "marketPrice", width: 15 },
      { header: "원가 *", key: "costPrice", width: 15 },
      { header: "공급가 *", key: "supplyPrice", width: 15 },
      { header: "스펙 (key=value;...)", key: "specs", width: 30 },
    ];

    // 헤더 스타일
    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" },
      };
    });

    // 카테고리 드롭다운 유효성 검사 (최대 1000행)
    if (categoryNames.length > 0) {
      for (let row = 2; row <= 1001; row++) {
        ws.getCell(`A${row}`).dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${categoryNames.join(",")}"`],
          showErrorMessage: true,
          errorTitle: "잘못된 카테고리",
          error: "목록에서 선택해주세요.",
        };
      }
    }

    // 가격 열 숫자 포맷
    for (let row = 2; row <= 1001; row++) {
      ["D", "E", "F", "G"].forEach((col) => {
        ws.getCell(`${col}${row}`).numFmt = "#,##0";
      });
    }

    // 예시 데이터 1행
    ws.addRow([
      categoryNames[0] ?? "CPU",
      "Xeon Gold 6430",
      "Intel",
      5000000,
      4500000,
      3800000,
      4200000,
      "cores=32;frequency=2.1GHz;tdp=270W",
    ]);

    // 안내 시트
    const guideWs = workbook.addWorksheet("안내");
    guideWs.getColumn("A").width = 20;
    guideWs.getColumn("B").width = 50;
    guideWs.addRow(["필드", "설명"]);
    guideWs.addRow(["카테고리명", "등록된 카테고리 중 선택 (드롭다운)"]);
    guideWs.addRow(["모델명", "부품 모델명 (필수)"]);
    guideWs.addRow(["제조사", "제조사명 (필수)"]);
    guideWs.addRow(["리스트가", "제조사 공시 가격 (원, 숫자)"]);
    guideWs.addRow(["시장가", "시장 거래 가격 (원, 숫자)"]);
    guideWs.addRow(["원가", "구매 원가 (원, 숫자)"]);
    guideWs.addRow(["공급가", "고객 공급 가격 (원, 숫자)"]);
    guideWs.addRow(["스펙", "key=value;key2=value2 형식으로 입력"]);

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(new Uint8Array(Buffer.from(buffer)), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="parts-template.xlsx"',
      },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
