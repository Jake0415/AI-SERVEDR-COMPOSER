import { AIMessage } from "@langchain/core/messages";
import type { QuotationChatStateType } from "../state";

export async function generateReply(
  state: QuotationChatStateType,
): Promise<Partial<QuotationChatStateType>> {
  let reply = state.reply;

  if (state.isComplete && !reply.includes("확정")) {
    reply += "\n\n모든 필수 사양이 입력되었습니다. '확정'을 입력하시면 견적 생성으로 진행합니다.";
  }

  if (!state.isComplete && state.suggestedQuestions.length > 0 && state.mode === "guide") {
    reply += "\n\n추가로 확인이 필요한 사항:";
    for (const q of state.suggestedQuestions) {
      reply += `\n• ${q}`;
    }
  }

  return {
    reply,
    messages: [new AIMessage(reply)],
  };
}
