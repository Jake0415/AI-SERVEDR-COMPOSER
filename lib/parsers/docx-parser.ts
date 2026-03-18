// ============================================================
// DOCX 텍스트 추출 — mammoth 래퍼
// ============================================================

import "server-only";

/**
 * DOCX 파일에서 텍스트를 추출
 * @param buffer - DOCX 파일 Buffer
 * @returns 추출된 텍스트
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
