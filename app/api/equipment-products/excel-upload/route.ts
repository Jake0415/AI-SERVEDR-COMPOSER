// ============================================================
// POST /api/equipment-products/excel-upload
// IT 인프라 장비 엑셀 업로드 → DB 대량 등록
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { equipmentCodes, equipmentProducts, equipmentProductPrices } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }
  if (user.role !== "super_admin" && user.role !== "admin") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "관리자 권한 필요" } }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "파일이 없습니다." } }, { status: 400 });
  }

  if (!file.name.endsWith('.xlsx')) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "xlsx 파일만 업로드 가능합니다." } },
      { status: 400 },
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "파일 크기는 10MB 이하여야 합니다." } },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(arrayBuffer as any);

  const ws = workbook.getWorksheet("장비 데이터") ?? workbook.getWorksheet(1);
  if (!ws) {
    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "장비 데이터 시트를 찾을 수 없습니다." } }, { status: 400 });
  }

  // equipment_codes 캐시 (code → id)
  const allCodes = await db
    .select({ id: equipmentCodes.id, code: equipmentCodes.code })
    .from(equipmentCodes)
    .where(eq(equipmentCodes.tenantId, user.tenantId));
  const codeToId = new Map(allCodes.map(c => [c.code, c.id]));

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // 행 파싱 (2행부터, 1행은 헤더)
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // 헤더 스킵

    const code = String(row.getCell(1).value ?? "").trim();
    const modelName = String(row.getCell(2).value ?? "").trim();
    const manufacturer = String(row.getCell(3).value ?? "").trim();

    if (!code || !modelName || !manufacturer) {
      if (code || modelName || manufacturer) {
        errors.push(`${rowNumber}행: 장비코드/모델명/제조사 필수`);
      }
      return;
    }

    // 나중에 비동기 처리를 위해 데이터 수집
    (ws as ExcelJS.Worksheet & { _parsedRows?: unknown[] })._parsedRows =
      (ws as ExcelJS.Worksheet & { _parsedRows?: unknown[] })._parsedRows ?? [];
  });

  // 다시 순회하며 비동기 처리
  const rows: {
    code: string; modelName: string; manufacturer: string;
    listPrice: number; marketPrice: number; supplyPrice: number;
    specs: Record<string, string>; rowNum: number;
  }[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const code = String(row.getCell(1).value ?? "").trim();
    const modelName = String(row.getCell(2).value ?? "").trim();
    const manufacturer = String(row.getCell(3).value ?? "").trim();

    if (!code || !modelName || !manufacturer) return;

    const listPrice = Number(row.getCell(5).value) || 0;
    const marketPrice = Number(row.getCell(6).value) || 0;
    const supplyPrice = Number(row.getCell(7).value) || 0;

    // H~M열 → specs jsonb
    const specs: Record<string, string> = {};
    const specKeys = ["cpu", "memory", "disk", "network", "power", "note"];
    specKeys.forEach((key, idx) => {
      const val = String(row.getCell(8 + idx).value ?? "").trim();
      if (val) specs[key] = val;
    });

    rows.push({ code, modelName, manufacturer, listPrice, marketPrice, supplyPrice, specs, rowNum: rowNumber });
  });

  // DB 삽입
  for (const r of rows) {
    const equipmentCodeId = codeToId.get(r.code);
    if (!equipmentCodeId) {
      errors.push(`${r.rowNum}행: 장비코드 "${r.code}" 미등록`);
      skipped++;
      continue;
    }

    // 중복 체크
    const [existing] = await db
      .select({ id: equipmentProducts.id })
      .from(equipmentProducts)
      .where(and(
        eq(equipmentProducts.tenantId, user.tenantId),
        eq(equipmentProducts.modelName, r.modelName),
        eq(equipmentProducts.manufacturer, r.manufacturer),
      ))
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    const [product] = await db.insert(equipmentProducts).values({
      tenantId: user.tenantId,
      equipmentCodeId,
      modelName: r.modelName,
      manufacturer: r.manufacturer,
      specs: r.specs,
    }).returning();

    await db.insert(equipmentProductPrices).values({
      productId: product.id,
      listPrice: r.listPrice,
      marketPrice: r.marketPrice,
      supplyPrice: r.supplyPrice,
    });

    inserted++;
  }

  return NextResponse.json({
    success: true,
    data: { inserted, skipped, errors: errors.slice(0, 20), totalRows: rows.length },
  });
}
