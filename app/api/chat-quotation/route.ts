// ============================================================
// POST /api/chat-quotation — AI 대화형 견적 생성 API
// 자연어 → 서버 사양 추출 (ParsedServerConfig[]) → 프론트 반환
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { handleApiError } from "@/lib/errors";
import { requestStructuredJson } from "@/lib/ai/openai-client";
import { rfpParsingResultSchema } from "@/lib/types/schemas";
import type { ParsedServerConfig } from "@/lib/types/ai";

const CHAT_SYSTEM_PROMPT = `당신은 한국 서버 인프라 견적 전문가 AI입니다.
사용자와 대화하며 서버 사양을 파악합니다.

## 응답 규칙
1. 반드시 아래 JSON 형식으로 응답하세요.
2. 사용자의 요청에서 서버 사양을 최대한 추출하세요.
3. 정보가 충분하면 is_complete: true로 설정하세요.
4. 정보가 부족하면 is_complete: false로 설정하고, reply에 추가 질문을 포함하세요.
5. 추측하지 말고, 명시되지 않은 사양은 null로 설정하세요.

## 출력 JSON 스키마
{
  "reply": "사용자에게 보여줄 한국어 응답 메시지",
  "is_complete": true|false,
  "configs": [
    {
      "config_name": "서버 용도명",
      "quantity": 수량,
      "requirements": {
        "cpu": { "min_cores": null|숫자, "min_clock_ghz": null|숫자, "socket_type": null|문자열, "architecture": null|문자열, "max_tdp_w": null|숫자 } | null,
        "memory": { "min_capacity_gb": 숫자, "type": null|"DDR4"|"DDR5", "ecc": true|false, "min_speed_mhz": null|숫자 } | null,
        "storage": { "items": [{ "type": "SSD"|"HDD", "min_capacity_gb": 숫자, "interface_type": null|"NVMe"|"SATA"|"SAS", "quantity": 숫자 }] } | null,
        "gpu": null | { "min_vram_gb": 숫자, "min_count": 숫자, "use_case": "문자열", "preferred_model": null|문자열 },
        "network": null | { "min_speed_gbps": 숫자, "port_count": null|숫자, "type": null|문자열 },
        "raid": null | { "level": "문자열", "required": true|false },
        "power": null | { "redundancy": true|false, "min_wattage": null|숫자 }
      },
      "notes": ["특이사항"]
    }
  ]
}`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const { message, history } = await request.json() as {
      message: string;
      history?: ChatMessage[];
    };

    if (!message) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "메시지가 필요합니다." } },
        { status: 400 },
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({
        success: true,
        data: {
          reply: "AI 서비스가 설정되지 않았습니다. OPENAI_API_KEY 환경변수를 확인해주세요.",
          specs: null,
          is_complete: false,
        },
      });
    }

    // 대화 이력을 포함하여 컨텍스트 구성
    const conversationContext = buildConversationContext(message, history);

    try {
      const result = await requestStructuredJson(
        CHAT_SYSTEM_PROMPT,
        conversationContext,
        (raw: string) => {
          const parsed = JSON.parse(raw);
          const configs = parsed.configs ?? [];
          let validatedSpecs: ParsedServerConfig[] | null = null;

          if (configs.length > 0) {
            const validated = rfpParsingResultSchema.safeParse(configs);
            if (validated.success) {
              validatedSpecs = validated.data;
            }
          }

          return {
            reply: parsed.reply ?? "요청을 처리하지 못했습니다.",
            is_complete: parsed.is_complete ?? false,
            specs: validatedSpecs,
          };
        },
      );

      return NextResponse.json({ success: true, data: result });
    } catch {
      // LLM 호출 실패 시 더미 응답
      return NextResponse.json({
        success: true,
        data: {
          reply: "AI 응답을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.",
          specs: null,
          is_complete: false,
        },
      });
    }
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

function buildConversationContext(message: string, history?: ChatMessage[]): string {
  if (!history || history.length === 0) {
    return message;
  }

  const recentHistory = history.slice(-6);
  const contextParts = recentHistory.map(
    (msg) => `${msg.role === "user" ? "[사용자]" : "[AI]"} ${msg.content}`,
  );
  contextParts.push(`[사용자] ${message}`);

  return contextParts.join("\n\n");
}
