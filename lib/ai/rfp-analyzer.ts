// ============================================================
// RFP AI 파싱 — GPT-4o로 RFP 문서에서 서버 요구사항 추출
// ============================================================

import "server-only";

import { requestStructuredJson } from "./openai-client";
import { rfpParsingResultSchema } from "@/lib/types/schemas";
import type { ParsedServerConfig } from "@/lib/types/ai";

const SYSTEM_PROMPT = `당신은 한국 IT 인프라 견적 전문가입니다.
RFP(제안요청서) 문서에서 서버 하드웨어 요구사항을 정확히 추출합니다.

## 규칙
1. 반드시 아래 JSON 스키마로 출력하세요.
2. 명시되지 않은 사양은 null로 설정하세요. 절대 추측하지 마세요.
3. 수량이 불명확하면 notes 배열에 기록하세요.
4. 한국 공공기관 RFP의 관용적 표현을 이해하세요:
   - "고성능 서버" = GPU 서버 가능성 높음
   - "대용량 스토리지" = HDD 기반, 10TB 이상
   - "이중화" = 전원 이중화 (1+1 PSU)
   - "인공지능/딥러닝/머신러닝" = GPU 필수
5. 서버 구성이 여러 종류면 각각 별도 객체로 분리하세요.

## 출력 스키마
{
  "configs": [
    {
      "config_name": "서버 용도 (예: AI 학습용 GPU 서버)",
      "quantity": 서버 수량,
      "requirements": {
        "cpu": { "min_cores": null|숫자, "min_clock_ghz": null|숫자, "socket_type": null|문자열, "architecture": null|문자열, "max_tdp_w": null|숫자 },
        "memory": { "min_capacity_gb": 숫자, "type": null|"DDR4"|"DDR5", "ecc": true|false, "min_speed_mhz": null|숫자 },
        "storage": { "items": [{ "type": "SSD"|"HDD", "min_capacity_gb": 숫자, "interface_type": null|"NVMe"|"SATA"|"SAS", "quantity": 숫자 }] },
        "gpu": null | { "min_vram_gb": 숫자, "min_count": 숫자, "use_case": "문자열", "preferred_model": null|문자열 },
        "network": { "min_speed_gbps": 숫자, "port_count": null|숫자, "type": null|문자열 },
        "raid": null | { "level": "문자열", "required": true|false },
        "power": null | { "redundancy": true|false, "min_wattage": null|숫자 }
      },
      "notes": ["특이사항 배열"]
    }
  ]
}`;

/**
 * RFP 텍스트를 분석하여 구조화된 서버 구성 요구사항을 추출
 * @param rfpText - RFP 문서에서 추출된 텍스트
 * @returns 파싱된 서버 구성 배열
 */
export async function analyzeRfpDocument(
  rfpText: string,
): Promise<ParsedServerConfig[]> {
  if (!rfpText.trim()) {
    throw new Error("RFP 텍스트가 비어있습니다.");
  }

  const result = await requestStructuredJson(
    SYSTEM_PROMPT,
    rfpText,
    (raw: string) => {
      const parsed = JSON.parse(raw);
      // LLM 응답의 configs 배열을 Zod로 검증
      const configs = parsed.configs ?? parsed;
      const validated = rfpParsingResultSchema.parse(
        Array.isArray(configs) ? configs : [configs],
      );
      return validated;
    },
  );

  return result;
}
