// ============================================================
// PDF 견적서 생성기 — jsPDF 기반
// 자사 양식 / 나라장터 양식 지원
// ============================================================

import "server-only";

import jsPDF from "jspdf";

// --- 공통 타입 ---

interface QuotationData {
  quotationNumber: string;
  createdAt: string;
  validityDate: string;
  quotationType: string;
  totalSupply: number;
  vat: number;
  totalAmount: number;
  deliveryTerms: string | null;
  deliveryDate: string | null;
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
  address: string;
  phone: string;
  fax: string | null;
  email: string;
  businessType: string;
  businessItem: string;
}

// --- 유틸리티 ---

function formatPrice(value: number): string {
  return value.toLocaleString("ko-KR");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function quotationTypeLabel(type: string): string {
  switch (type) {
    case "profitability": return "수익성 중심";
    case "spec_match": return "규격 충족";
    case "performance": return "성능 향상";
    default: return type;
  }
}

// --- 자사 양식 PDF 생성 ---

export function generateCompanyQuotationPDF(
  quotation: QuotationData,
  items: QuotationItemData[],
  company: CompanyInfo,
): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // jsPDF에서 한국어 폰트가 없으면 기본 폰트 사용 (영문 fallback)
  // 실제 프로덕션에서는 NanumGothic 등 한글 폰트를 addFont으로 등록
  doc.setFont("helvetica");

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // 제목
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`(${quotationTypeLabel(quotation.quotationType)})`, pageWidth / 2, y + 5, { align: "center" });
  y += 15;

  // 견적 정보 박스
  doc.setFontSize(9);
  doc.setDrawColor(100);

  // 좌측: 견적번호, 일자, 유효기한
  doc.text(`No: ${quotation.quotationNumber}`, margin, y);
  doc.text(`Date: ${formatDate(quotation.createdAt)}`, margin, y + 5);
  doc.text(`Valid Until: ${formatDate(quotation.validityDate)}`, margin, y + 10);

  // 우측: 공급자 정보
  const rightX = pageWidth - margin;
  doc.text(company.companyName, rightX, y, { align: "right" });
  doc.text(`${company.businessNumber}`, rightX, y + 5, { align: "right" });
  doc.text(`${company.ceoName}`, rightX, y + 10, { align: "right" });
  doc.text(`TEL: ${company.phone}${company.fax ? ` / FAX: ${company.fax}` : ""}`, rightX, y + 15, { align: "right" });
  y += 25;

  // 구분선
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // 금액 요약
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Amount: ${formatPrice(quotation.totalAmount)} KRW (VAT incl.)`, margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Supply: ${formatPrice(quotation.totalSupply)} / VAT: ${formatPrice(quotation.vat)}`, margin, y);
  y += 10;

  // 항목 테이블 헤더
  const colWidths = [10, contentWidth * 0.3, contentWidth * 0.25, 15, 15, contentWidth * 0.12, contentWidth * 0.13];
  const headers = ["No", "Item", "Spec", "Qty", "Unit", "Unit Price", "Amount"];

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 1, contentWidth, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  let colX = margin + 1;
  headers.forEach((header, i) => {
    doc.text(header, colX, y + 4);
    colX += colWidths[i];
  });
  y += 9;

  // 항목 행
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  items.forEach((item, idx) => {
    // 페이지 넘김 체크
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    colX = margin + 1;
    doc.text(String(idx + 1), colX, y);
    colX += colWidths[0];
    doc.text(item.itemName.slice(0, 30), colX, y);
    colX += colWidths[1];
    doc.text((item.itemSpec ?? "").slice(0, 25), colX, y);
    colX += colWidths[2];
    doc.text(String(item.quantity), colX, y);
    colX += colWidths[3];
    doc.text(item.unit, colX, y);
    colX += colWidths[4];
    doc.text(formatPrice(item.unitSupplyPrice), colX, y);
    colX += colWidths[5];
    doc.text(formatPrice(item.amount), colX, y);

    y += 5;
  });

  // 합계 행
  y += 2;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL", margin + 1, y);
  doc.text(`${formatPrice(quotation.totalAmount)} KRW`, pageWidth - margin - 1, y, { align: "right" });
  y += 10;

  // 조건 사항
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (quotation.deliveryTerms) {
    doc.text(`Delivery: ${quotation.deliveryTerms}`, margin, y);
    y += 5;
  }
  if (quotation.deliveryDate) {
    doc.text(`Delivery Date: ${formatDate(quotation.deliveryDate)}`, margin, y);
    y += 5;
  }
  if (quotation.paymentTerms) {
    doc.text(`Payment: ${quotation.paymentTerms}`, margin, y);
    y += 5;
  }
  if (quotation.notes) {
    doc.text(`Notes: ${quotation.notes}`, margin, y);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

// --- 나라장터 양식 PDF 생성 ---

export function generateG2BQuotationPDF(
  quotation: QuotationData,
  items: QuotationItemData[],
  company: CompanyInfo,
): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFont("helvetica");

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // 외곽 테두리
  doc.setLineWidth(1);
  doc.rect(10, 10, pageWidth - 20, doc.internal.pageSize.getHeight() - 20);

  // 제목
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ESTIMATION", pageWidth / 2, y + 10, { align: "center" });
  y += 20;

  // 견적번호, 일자
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`No: ${quotation.quotationNumber}`, margin + 5, y);
  doc.text(`Date: ${formatDate(quotation.createdAt)}`, pageWidth - margin - 5, y, { align: "right" });
  y += 8;

  // 합계 금액 강조 박스
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 12, "FD");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total: ${formatPrice(quotation.totalAmount)} KRW (VAT incl.)`,
    pageWidth / 2,
    y + 8,
    { align: "center" },
  );
  y += 18;

  // 공급자 / 수요처 정보
  const halfWidth = contentWidth / 2 - 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("SUPPLIER", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  const supplierInfo = [
    `Company: ${company.companyName}`,
    `BN: ${company.businessNumber}`,
    `CEO: ${company.ceoName}`,
    `Address: ${company.address}`,
    `Type: ${company.businessType} / ${company.businessItem}`,
    `TEL: ${company.phone}${company.fax ? ` FAX: ${company.fax}` : ""}`,
  ];
  supplierInfo.forEach((line) => {
    doc.text(line.slice(0, 50), margin, y, { maxWidth: halfWidth });
    y += 4;
  });
  y += 5;

  // 항목 테이블
  const colWidths = [10, contentWidth * 0.28, contentWidth * 0.22, 12, 12, contentWidth * 0.13, contentWidth * 0.15];
  const headers = ["No", "Item", "Spec", "Qty", "Unit", "Unit Price", "Amount"];

  // 테이블 헤더
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, y, contentWidth, 7, "FD");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");

  let colX = margin + 1;
  headers.forEach((header, i) => {
    doc.text(header, colX, y + 5);
    colX += colWidths[i];
  });
  y += 9;

  // 항목 행
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  items.forEach((item, idx) => {
    if (y > 255) {
      doc.addPage();
      doc.setLineWidth(1);
      doc.rect(10, 10, pageWidth - 20, doc.internal.pageSize.getHeight() - 20);
      y = 20;
    }

    // 행 구분선
    doc.setLineWidth(0.1);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);

    colX = margin + 1;
    doc.text(String(idx + 1), colX, y + 4);
    colX += colWidths[0];
    doc.text(item.itemName.slice(0, 28), colX, y + 4);
    colX += colWidths[1];
    doc.text((item.itemSpec ?? "").slice(0, 22), colX, y + 4);
    colX += colWidths[2];
    doc.text(String(item.quantity), colX, y + 4);
    colX += colWidths[3];
    doc.text(item.unit, colX, y + 4);
    colX += colWidths[4];
    doc.text(formatPrice(item.unitSupplyPrice), colX, y + 4);
    colX += colWidths[5];
    doc.text(formatPrice(item.amount), colX, y + 4);

    y += 6;
  });

  // 합계
  y += 2;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  doc.text(`Supply: ${formatPrice(quotation.totalSupply)}`, margin + 1, y);
  doc.text(`VAT: ${formatPrice(quotation.vat)}`, margin + contentWidth * 0.35, y);
  doc.text(`Total: ${formatPrice(quotation.totalAmount)}`, pageWidth - margin - 1, y, { align: "right" });
  y += 8;

  // 비고
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (quotation.deliveryTerms || quotation.paymentTerms || quotation.notes) {
    doc.text("Remarks:", margin, y);
    y += 5;
    if (quotation.deliveryTerms) {
      doc.text(`- Delivery: ${quotation.deliveryTerms}`, margin + 3, y);
      y += 4;
    }
    if (quotation.paymentTerms) {
      doc.text(`- Payment: ${quotation.paymentTerms}`, margin + 3, y);
      y += 4;
    }
    if (quotation.notes) {
      doc.text(`- ${quotation.notes}`, margin + 3, y);
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}
