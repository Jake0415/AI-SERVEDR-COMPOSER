// ============================================================
// PDF 텍스트 추출 — pdf-parse v1 래퍼
// ============================================================

import "server-only";

/**
 * PDF 파일에서 텍스트를 추출
 * @param buffer - PDF 파일 Buffer
 * @returns 추출된 텍스트
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (data: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text;
}
