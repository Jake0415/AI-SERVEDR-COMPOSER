// ============================================================
// GET /api/quotation/[id]/export — 견적서 다운로드 (PDF/Excel)
// ?format=pdf&template=company — 자사 양식 PDF
// ?format=pdf&template=g2b — 나라장터 양식 PDF
// ?format=excel — Excel
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, quotations, quotationItems, tenants } from "@/lib/db";
import { generateCompanyQuotationPDF, generateG2BQuotationPDF } from "@/lib/export/pdf-generator";
import { generateQuotationExcel } from "@/lib/export/excel-generator";
import { handleApiError } from "@/lib/errors";

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "pdf";
    const template = searchParams.get("template") ?? "company";

    // 견적 조회
    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, id))
      .limit(1);

    if (!quotation || quotation.tenantId !== user.tenantId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "견적을 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    // 항목 조회
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, id))
      .orderBy(asc(quotationItems.sortOrder));

    // 회사 정보 조회
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);

    const company = {
      companyName: tenant.companyName,
      businessNumber: tenant.businessNumber,
      ceoName: tenant.ceoName,
      address: tenant.address,
      phone: tenant.phone,
      fax: tenant.fax,
      email: tenant.email,
      businessType: tenant.businessType,
      businessItem: tenant.businessItem,
    };

    const quotationData = {
      quotationNumber: quotation.quotationNumber,
      createdAt: quotation.createdAt.toISOString(),
      validityDate: quotation.validityDate,
      quotationType: quotation.quotationType,
      totalSupply: quotation.totalSupply,
      vat: quotation.vat,
      totalAmount: quotation.totalAmount,
      deliveryTerms: quotation.deliveryTerms,
      deliveryDate: quotation.deliveryDate,
      paymentTerms: quotation.paymentTerms,
      notes: quotation.notes,
    };

    const itemsData = items.map((item) => ({
      sortOrder: item.sortOrder,
      itemName: item.itemName,
      itemSpec: item.itemSpec,
      quantity: item.quantity,
      unit: item.unit,
      unitSupplyPrice: item.unitSupplyPrice,
      amount: item.amount,
    }));

    if (format === "excel") {
      const buffer = await generateQuotationExcel(quotationData, itemsData, company);
      const fileName = `quotation-${quotation.quotationNumber}.xlsx`;

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      });
    }

    // PDF
    const buffer =
      template === "g2b"
        ? generateG2BQuotationPDF(quotationData, itemsData, company)
        : generateCompanyQuotationPDF(quotationData, itemsData, company);

    const fileName = `quotation-${quotation.quotationNumber}-${template}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
