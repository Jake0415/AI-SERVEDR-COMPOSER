// ============================================================
// Excel 견적서 생성기 — ExcelJS 기반
// ============================================================

import "server-only";

import ExcelJS from "exceljs";

interface QuotationData {
  quotationNumber: string;
  createdAt: string;
  validityDate: string;
  quotationType: string;
  totalSupply: number;
  vat: number;
  totalAmount: number;
  deliveryTerms: string | null;
  paymentTerms: string | null;
  notes: string | null;
}

interface QuotationItemData {
  sortOrder: number;
  itemName: string;
  itemSpec: string | null;
  quantity: number;
  unit: string;
  unitSupplyPrice: number;
  amount: number;
}

interface CompanyInfo {
  companyName: string;
  businessNumber: string;
  ceoName: string;
  phone: string;
}

function quotationTypeLabel(type: string): string {
  switch (type) {
    case "profitability": return "수익성 중심";
    case "spec_match": return "규격 충족";
    case "performance": return "성능 향상";
    default: return type;
  }
}

export async function generateQuotationExcel(
  quotation: QuotationData,
  items: QuotationItemData[],
  company: CompanyInfo,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = company.companyName;
  workbook.created = new Date();

  const ws = workbook.addWorksheet("견적서", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
  });

  // 열 너비 설정
  ws.columns = [
    { key: "no", width: 6 },
    { key: "itemName", width: 30 },
    { key: "itemSpec", width: 25 },
    { key: "quantity", width: 8 },
    { key: "unit", width: 6 },
    { key: "unitPrice", width: 15 },
    { key: "amount", width: 18 },
  ];

  // 헤더 스타일
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  const headerFont: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 10,
  };
  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  // 제목
  const titleRow = ws.addRow(["견적서"]);
  ws.mergeCells("A1:G1");
  titleRow.getCell(1).font = { bold: true, size: 18 };
  titleRow.getCell(1).alignment = { horizontal: "center" };
  titleRow.height = 30;

  // 부제
  const subtitleRow = ws.addRow([`(${quotationTypeLabel(quotation.quotationType)})`]);
  ws.mergeCells("A2:G2");
  subtitleRow.getCell(1).font = { size: 10, color: { argb: "FF666666" } };
  subtitleRow.getCell(1).alignment = { horizontal: "center" };

  ws.addRow([]); // 빈 행

  // 견적 정보
  ws.addRow(["견적번호", quotation.quotationNumber, "", "견적일자", new Date(quotation.createdAt).toLocaleDateString("ko-KR")]);
  ws.addRow(["유효기한", new Date(quotation.validityDate).toLocaleDateString("ko-KR"), "", "공급자", company.companyName]);
  ws.addRow(["사업자번호", company.businessNumber, "", "대표자", company.ceoName]);
  ws.addRow(["연락처", company.phone]);

  // 정보 행 스타일링
  for (let r = 4; r <= 7; r++) {
    const row = ws.getRow(r);
    row.getCell(1).font = { bold: true, size: 9 };
    row.getCell(4).font = { bold: true, size: 9 };
  }

  ws.addRow([]); // 빈 행

  // 금액 요약
  const summaryRow = ws.addRow(["", "", "", "", "공급가", "VAT", "합계(VAT포함)"]);
  summaryRow.eachCell((cell) => {
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: "center" };
  });

  const amountRow = ws.addRow([
    "", "", "", "",
    quotation.totalSupply,
    quotation.vat,
    quotation.totalAmount,
  ]);
  amountRow.getCell(5).numFmt = "#,##0";
  amountRow.getCell(6).numFmt = "#,##0";
  amountRow.getCell(7).numFmt = "#,##0";
  amountRow.getCell(7).font = { bold: true, size: 12 };

  ws.addRow([]); // 빈 행

  // 테이블 헤더
  const tableHeader = ws.addRow(["No", "품명", "규격", "수량", "단위", "단가", "금액"]);
  tableHeader.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.border = borderStyle;
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  tableHeader.height = 22;

  // 항목 행
  items.forEach((item, idx) => {
    const row = ws.addRow([
      idx + 1,
      item.itemName,
      item.itemSpec ?? "",
      item.quantity,
      item.unit,
      item.unitSupplyPrice,
      item.amount,
    ]);

    row.eachCell((cell) => {
      cell.border = borderStyle;
      cell.font = { size: 9 };
    });

    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(4).alignment = { horizontal: "center" };
    row.getCell(5).alignment = { horizontal: "center" };
    row.getCell(6).numFmt = "#,##0";
    row.getCell(6).alignment = { horizontal: "right" };
    row.getCell(7).numFmt = "#,##0";
    row.getCell(7).alignment = { horizontal: "right" };
  });

  // 합계 행
  const totalRow = ws.addRow(["", "합  계", "", "", "", "", quotation.totalAmount]);
  totalRow.eachCell((cell) => {
    cell.border = borderStyle;
    cell.font = { bold: true, size: 10 };
  });
  totalRow.getCell(7).numFmt = "#,##0";
  totalRow.getCell(7).alignment = { horizontal: "right" };

  ws.addRow([]); // 빈 행

  // 비고
  if (quotation.deliveryTerms || quotation.paymentTerms || quotation.notes) {
    ws.addRow(["비고"]);
    if (quotation.deliveryTerms) {
      ws.addRow([`  납품조건: ${quotation.deliveryTerms}`]);
    }
    if (quotation.paymentTerms) {
      ws.addRow([`  결제조건: ${quotation.paymentTerms}`]);
    }
    if (quotation.notes) {
      ws.addRow([`  ${quotation.notes}`]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
