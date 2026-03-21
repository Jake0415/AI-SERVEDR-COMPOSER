// ============================================================
// PDF 텍스트 추출 — pdf-parse v2 래퍼
// ============================================================

import "server-only";

/**
 * PDF 파일에서 텍스트를 추출
 * @param buffer - PDF 파일 Buffer
 * @returns 추출된 텍스트
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}
