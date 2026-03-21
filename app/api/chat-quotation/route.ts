// ============================================================
// POST /api/chat-quotation — AI 대화형 견적 생성 API
// 자연어 → 서버 사양 추출 (ParsedServerConfig[]) → 프론트 반환
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { handleApiError } from "@/lib/errors";
import { requestStructuredJson } from "@/lib/ai/openai-client";
import { getPrompt } from "@/lib/ai/prompt-loader";
import { DEFAULT_PROMPTS } from "@/lib/ai/default-prompts";
import { rfpParsingResultSchema } from "@/lib/types/schemas";
import type { ParsedServerConfig } from "@/lib/types/ai";

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
          reply: "AI 서비스를 사용할 수 없습니다. 관리자에게 문의하세요.",
          specs: null,
          is_complete: false,
        },
      });
    }

    // DB에서 프롬프트 로드
    const prompt = await getPrompt("chat-quotation", user.tenantId);
    const systemPrompt = prompt.systemPrompt ?? DEFAULT_PROMPTS["chat-quotation"].systemPrompt;

    // 대화 이력을 포함하여 컨텍스트 구성
    const conversationContext = buildConversationContext(message, history);

    try {
      const result = await requestStructuredJson(
        systemPrompt,
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
        {
          model: prompt.modelName,
          temperature: prompt.temperature,
          maxTokens: prompt.maxTokens,
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
