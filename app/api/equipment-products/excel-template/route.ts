// ============================================================
// GET /api/equipment-products/excel-template
// IT 인프라 장비 엑셀 템플릿 다운로드 (코드 참조 시트 포함)
// ============================================================

import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { equipmentCodes } from "@/lib/db/schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }

  // equipment_codes 전체 조회 (코드 참조용)
  const allCodes = await db
    .select()
    .from(equipmentCodes)
    .where(eq(equipmentCodes.tenantId, user.tenantId))
    .orderBy(asc(equipmentCodes.code));

  // Level 3 코드만 드롭다운에 사용
  const level3Codes = allCodes.filter(c => c.level === 3);
  const codeList = level3Codes.map(c => c.code);

  // 부모 이름 매핑
  const codeMap = new Map(allCodes.map(c => [c.id, c]));

  const workbook = new ExcelJS.Workbook();

  // === Sheet 1: 장비 데이터 ===
  const ws = workbook.addWorksheet("장비 데이터", { pageSetup: { orientation: "landscape" } });

  ws.columns = [
    { header: "장비코드 *", key: "code", width: 15 },
    { header: "모델명 *", key: "modelName", width: 30 },
    { header: "제조사 *", key: "manufacturer", width: 15 },
    { header: "수량", key: "quantity", width: 8 },
    { header: "리스트가 *", key: "listPrice", width: 15 },
    { header: "시장가", key: "marketPrice", width: 15 },
    { header: "공급가", key: "supplyPrice", width: 15 },
    { header: "CPU", key: "cpu", width: 22 },
    { header: "메모리", key: "memory", width: 15 },
    { header: "디스크", key: "disk", width: 22 },
    { header: "네트워크", key: "network", width: 22 },
    { header: "전원", key: "power", width: 18 },
    { header: "비고", key: "note", width: 25 },
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

  // A열 드롭다운 (장비코드)
  if (codeList.length > 0) {
    for (let row = 2; row <= 200; row++) {
      ws.getCell(`A${row}`).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`"${codeList.join(",")}"`],
        showErrorMessage: true,
        errorTitle: "잘못된 장비코드",
        error: "코드 참조 시트에서 확인 후 입력하세요.",
      };
    }
  }

  // 가격 열 숫자 포맷
  for (let row = 2; row <= 200; row++) {
    ["E", "F", "G"].forEach(col => {
      ws.getCell(`${col}${row}`).numFmt = "#,##0";
    });
    ws.getCell(`D${row}`).numFmt = "0";
  }

  // RFP 기반 샘플 데이터
  const samples = [
    ["CM-01-001", "PowerEdge R760", "Dell", 1, 8500000, 7200000, 6100000, "8Core 2.60GHz x2", "32GB", "480GB SSD x2", "1G UTP 8포트, HBA 32G Dual x2", "Platinum 이중화", "웹서버"],
    ["CM-01-001", "PowerEdge R760", "Dell", 3, 8500000, 7200000, 6100000, "8Core 2.60GHz x2", "32GB", "480GB SSD x2", "1G UTP 8포트, 10G SFP+ 4포트", "Platinum 이중화", "환경관리_Master"],
    ["CM-01-001", "PowerEdge R760", "Dell", 3, 8500000, 7200000, 6100000, "8Core 2.60GHz x2", "32GB", "480GB SSD x2", "1G UTP 8포트, 10G SFP+ 4포트", "Platinum 이중화", "환경관리_Infra"],
    ["CM-01-001", "PowerEdge R760", "Dell", 1, 9800000, 8500000, 7200000, "12Core 2.40GHz x2", "64GB", "960GB SSD x2", "1G UTP 8포트, 10G SFP+ 4포트", "Platinum 이중화", "환경관리_Bastion"],
    ["CM-01-001", "PowerEdge R760", "Dell", 3, 15000000, 13000000, 11000000, "32Core 2.8GHz x2", "128GB", "480GB SSD x2", "1G UTP 8포트, 10G SFP+ 4포트", "Platinum 이중화", "응용서버"],
    ["CM-01-001", "PowerEdge R760", "Dell", 3, 12000000, 10500000, 8900000, "16Core 2.0GHz x2", "64GB", "480GB SSD x2", "1G UTP 8포트, 10G SFP+ 4포트", "Platinum 이중화", "DB서버"],
    ["CM-01-001", "PowerEdge R760", "Dell", 1, 8500000, 7200000, 6100000, "8Core 2.60GHz x2", "32GB", "960GB SSD x2", "1G UTP 8포트, 10G SFP+ 4포트", "Platinum 이중화", "성능관리"],
    ["CM-01-002", "PowerEdge T560", "Dell", 1, 6500000, 5500000, 4600000, "8Core 2.60GHz x1", "32GB", "480GB SSD x2", "1G UTP 8포트, HBA 32G Dual x2", "", "백업서버+Windows"],
  ];
  samples.forEach(row => ws.addRow(row));

  // === Sheet 2: 코드 참조 ===
  const refWs = workbook.addWorksheet("코드 참조");
  refWs.columns = [
    { header: "장비코드", key: "code", width: 15 },
    { header: "장비명", key: "name", width: 25 },
    { header: "대분류", key: "major", width: 20 },
  ];

  const refHeader = refWs.getRow(1);
  refHeader.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF70AD47" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  for (const code of level3Codes) {
    // 부모 경로 구성
    let majorName = "";
    if (code.parentId) {
      const parent = codeMap.get(code.parentId);
      if (parent?.parentId) {
        const grandparent = codeMap.get(parent.parentId);
        majorName = grandparent ? `${grandparent.name} > ${parent.name}` : parent.name;
      } else if (parent) {
        majorName = parent.name;
      }
    }
    refWs.addRow([code.code, code.name, majorName]);
  }

  // === Sheet 3: 안내 ===
  const guideWs = workbook.addWorksheet("안내");
  guideWs.getColumn("A").width = 15;
  guideWs.getColumn("B").width = 55;
  guideWs.addRow(["필드", "설명"]);
  guideWs.addRow(["장비코드", "코드 참조 시트의 장비코드를 입력 (드롭다운 선택)"]);
  guideWs.addRow(["모델명", "제품 모델명 (필수)"]);
  guideWs.addRow(["제조사", "제조사명 (필수)"]);
  guideWs.addRow(["수량", "도입 수량 (참고용, DB에 직접 반영되지 않음)"]);
  guideWs.addRow(["리스트가", "제조사 권장 소비자가 (원)"]);
  guideWs.addRow(["시장가", "시장 유통가 (원)"]);
  guideWs.addRow(["공급가", "당사 고객 공급가 (원)"]);
  guideWs.addRow(["CPU~비고", "상세 스펙으로 자동 저장됨"]);

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer as unknown as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="equipment-template.xlsx"',
    },
  });
}
