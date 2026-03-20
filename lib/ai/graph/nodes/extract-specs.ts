import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { QuotationChatStateType } from "../state";
import type { ParsedServerConfig } from "@/lib/types/ai";

export async function extractSpecs(
  state: QuotationChatStateType,
): Promise<Partial<QuotationChatStateType>> {
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.1,
    maxTokens: 4096,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const extractionPrompt = `${state.systemPrompt}

현재까지 추출된 사양:
${JSON.stringify(state.currentSpecs, null, 2)}

위 사양을 기반으로 사용자의 새 입력에서 추가/수정 사항을 반영하여 업데이트하세요.
반드시 JSON으로만 응답하세요.

응답 형식:
{
  "configs": [{ "config_name": "서버명", "quantity": 1, "requirements": { "cpu": {...}, "memory": {...}, "storage": {...}, "gpu": null, "network": null, "raid": null, "power": null }, "notes": [] }],
  "reply": "사용자에게 보여줄 한국어 응답",
  "is_complete": false,
  "suggested_questions": ["추가 질문1", "추가 질문2"]
}`;

  const messages = [
    new SystemMessage(extractionPrompt),
    ...state.messages,
  ];

  const response = await model.invoke(messages);
  const content = typeof response.content === "string" ? response.content : "";

  try {
    const cleanJson = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    const configs: ParsedServerConfig[] = parsed.configs ?? state.currentSpecs;

    return {
      currentSpecs: configs.length > 0 ? configs : state.currentSpecs,
      reply: parsed.reply ?? "",
      isComplete: parsed.is_complete ?? false,
      suggestedQuestions: parsed.suggested_questions ?? [],
    };
  } catch {
    return {
      currentSpecs: state.currentSpecs,
      reply: "요청을 처리하는 중 문제가 발생했습니다. 다시 한번 말씀해 주세요.",
      isComplete: false,
      suggestedQuestions: [],
    };
  }
}
