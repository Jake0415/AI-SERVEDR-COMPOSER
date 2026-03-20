import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import type { ParsedServerConfig } from "@/lib/types/ai";

export const QuotationChatState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  currentSpecs: Annotation<ParsedServerConfig[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  mode: Annotation<"free" | "guide">({
    reducer: (_prev, next) => next ?? "free",
    default: () => "free" as const,
  }),
  isComplete: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  reply: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  suggestedQuestions: Annotation<string[]>({
    reducer: (_prev, next) => next ?? [],
    default: () => [],
  }),
  systemPrompt: Annotation<string>({
    reducer: (_prev, next) => next ?? "",
    default: () => "",
  }),
});

export type QuotationChatStateType = typeof QuotationChatState.State;
