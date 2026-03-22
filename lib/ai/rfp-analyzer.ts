// ============================================================
// RFP AI 파싱 — 2단계 호출: 1차 장비 목록 → 2차 장비별 상세 스펙
// ============================================================

import "server-only";

import { requestStructuredJson } from "./openai-client";
import { getPrompt } from "./prompt-loader";
import { DEFAULT_PROMPTS } from "./default-prompts";

export interface AnalyzeProgress {
  step: string;
  current: number;
  total: number;
  equipment_name?: string;
}

async function getPromptText(slug: string, tenantId?: string): Promise<string> {
  if (tenantId) {
    try {
      const p = await getPrompt(slug, tenantId);
      if (p?.systemPrompt) return p.systemPrompt;
    } catch {
      /* fallback to default */
    }
  }
  return DEFAULT_PROMPTS[slug]?.systemPrompt ?? "";
}

function parseJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    // JSON 잘림 복구
    let fixed = raw;
    const ob = (fixed.match(/\{/g) || []).length;
    const cb = (fixed.match(/\}/g) || []).length;
    for (let i = 0; i < ob - cb; i++) fixed += "}";
    const oar = (fixed.match(/\[/g) || []).length;
    const car = (fixed.match(/\]/g) || []).length;
    for (let i = 0; i < oar - car; i++) fixed += "]";
    try {
      return JSON.parse(fixed);
    } catch {
      const last = raw.lastIndexOf("},");
      if (last > 0) return JSON.parse(raw.substring(0, last + 1) + "]}");
      throw new Error("LLM 응답이 유효한 JSON이 아닙니다.");
    }
  }
}

/**
 * RFP 텍스트를 2단계로 분석하여 구조화된 장비 요구사항을 추출
 * 1차: 장비 목록 + 공통 요건 추출
 * 2차: 장비별 상세 스펙 추출 (반복)
 *
 * @param rfpText - RFP 문서에서 추출된 텍스트
 * @param tenantId - 테넌트 ID (프롬프트 로딩용)
 * @param onProgress - 진행 상황 콜백
 * @returns 파싱된 결과 (equipment_list 구조)
 */
export async function analyzeRfpDocument(
  rfpText: string,
  tenantId?: string,
  onProgress?: (progress: AnalyzeProgress) => void,
): Promise<unknown> {
  if (!rfpText.trim()) throw new Error("RFP 텍스트가 비어있습니다.");

  // === 1차: 장비 목록 + 공통 요건 ===
  onProgress?.({ step: "summary", current: 0, total: 1 });
  const summaryPrompt = await getPromptText("rfp-equipment-summary", tenantId);
  const summary = await requestStructuredJson(
    summaryPrompt,
    rfpText,
    parseJson,
    { maxTokens: 4096, temperature: 0.1 },
  );

  const equipList = (summary.equipment_summary ?? []) as Array<Record<string, unknown>>;
  onProgress?.({ step: "summary_done", current: 1, total: equipList.length });

  if (equipList.length === 0) {
    // 폴백: 기존 단일 호출 방식
    const fallbackPrompt = await getPromptText("rfp-equipment-parser", tenantId);
    return await requestStructuredJson(
      fallbackPrompt,
      rfpText,
      parseJson,
      { maxTokens: 16384, temperature: 0.1 },
    );
  }

  // === 2차: 장비별 상세 스펙 ===
  const detailPrompt = await getPromptText("rfp-equipment-detail", tenantId);
  const detailed: Array<Record<string, unknown>> = [];

  for (let i = 0; i < equipList.length; i++) {
    const eq = equipList[i];
    const name = String(eq.name ?? "");
    const ecrId = String(eq.ecr_id ?? "");
    const category = String(eq.category ?? "");

    onProgress?.({
      step: "detail",
      current: i + 1,
      total: equipList.length,
      equipment_name: name,
    });

    const userMsg = `장비명: ${name}\nECR ID: ${ecrId}\n카테고리: ${category}\n\n--- RFP 텍스트 ---\n${rfpText}`;

    try {
      const detail = await requestStructuredJson(
        detailPrompt,
        userMsg,
        parseJson,
        { maxTokens: 4096, temperature: 0.1 },
      );
      const commonReqs = summary.common_requirements as Record<string, unknown> | undefined;
      detailed.push({
        ...eq,
        item_index: i + 1,
        requirements: detail,
        warranty_years:
          (detail.warranty_years as number) ??
          (commonReqs?.warranty_years as number) ??
          3,
      });
    } catch (err) {
      // 개별 장비 실패 시 기본값으로 추가
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[RFP Detail] ${name} 추출 실패:`, errMsg);
      detailed.push({
        ...eq,
        item_index: i + 1,
        requirements: null,
        notes: ["상세 스펙 추출 실패"],
      });
    }
  }

  onProgress?.({ step: "done", current: equipList.length, total: equipList.length });

  return {
    project_name: summary.project_name,
    total_equipment_count: detailed.reduce(
      (s, e) => s + (Number(e.quantity) || 1),
      0,
    ),
    common_requirements: summary.common_requirements,
    equipment_list: detailed,
  };
}
