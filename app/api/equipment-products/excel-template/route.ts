// ============================================================
// GET /api/equipment-products/excel-template
// IT 인프라 장비 엑셀 템플릿 다운로드 (정적 파일 서빙)
// ============================================================

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getCurrentUser } from "@/lib/auth/actions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } },
      { status: 401 },
    );
  }

  try {
    const filePath = join(process.cwd(), "template-doc", "IT-Infra-equipments-template.xlsx");
    const buffer = await readFile(filePath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="IT-Infra-equipments-template.xlsx"',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "템플릿 파일을 찾을 수 없습니다." } },
      { status: 404 },
    );
  }
}
