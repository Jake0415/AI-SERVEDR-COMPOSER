import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { getPrompt } from "@/lib/ai/prompt-loader";
import { DEFAULT_PROMPTS } from "@/lib/ai/default-prompts";
import { getCompiledGraph } from "@/lib/ai/graph/quotation-chat-graph";
import { HumanMessage } from "@langchain/core/messages";
import { logLLMCall } from "@/lib/ai/llm-logger";
import { db, aiChatSessions, aiChatMessages } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } }, { status: 401 });
    }

    const { message, threadId: inputThreadId, mode, customerId } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "메시지를 입력해주세요." } }, { status: 400 });
    }

    const startTime = Date.now();
    let threadId = inputThreadId;
    let sessionId: string;

    // 세션 조회 또는 생성
    if (threadId) {
      const existing = await db.select({ id: aiChatSessions.id })
        .from(aiChatSessions)
        .where(and(eq(aiChatSessions.threadId, threadId), eq(aiChatSessions.userId, user.id)))
        .limit(1);
      if (existing.length > 0) {
        sessionId = existing[0].id;
      } else {
        threadId = null;
      }
    }

    if (!threadId) {
      threadId = uuidv4();
      const [newSession] = await db.insert(aiChatSessions).values({
        tenantId: user.tenantId,
        userId: user.id,
        customerId: customerId ?? null,
        threadId,
        mode: mode ?? "free",
      }).returning({ id: aiChatSessions.id });
      sessionId = newSession.id;
    }

    // 사용자 메시지 저장
    await db.insert(aiChatMessages).values({
      sessionId: sessionId!,
      role: "user",
      content: message,
    });

    // 프롬프트 로드
    const prompt = await getPrompt("chat-quotation", user.tenantId);
    const systemPrompt = prompt.systemPrompt ?? DEFAULT_PROMPTS["chat-quotation"].systemPrompt;

    // LangGraph 실행
    const graph = getCompiledGraph();
    const config = { configurable: { thread_id: threadId } };

    const result = await graph.invoke({
      messages: [new HumanMessage(message)],
      mode: mode ?? "free",
      systemPrompt,
    }, config);

    const latencyMs = Date.now() - startTime;

    // AI 응답 메시지 저장
    await db.insert(aiChatMessages).values({
      sessionId: sessionId!,
      role: "assistant",
      content: result.reply,
      specs: result.currentSpecs,
    });

    // 세션 업데이트
    await db.update(aiChatSessions)
      .set({
        messageCount: (await db.select({ cnt: aiChatSessions.messageCount }).from(aiChatSessions).where(eq(aiChatSessions.id, sessionId!)))[0].cnt + 2,
        updatedAt: new Date(),
        finalSpecs: result.currentSpecs,
      })
      .where(eq(aiChatSessions.id, sessionId!));

    // LLM 호출 로그 (비동기, 실패해도 무관)
    logLLMCall({
      tenantId: user.tenantId,
      userId: user.id,
      sessionId: sessionId!,
      promptSlug: "chat-quotation",
      modelName: prompt.modelName ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      promptTokens: 0,
      completionTokens: 0,
      latencyMs,
      requestSummary: message.slice(0, 200),
      responseSummary: result.reply.slice(0, 200),
      status: "success",
    });

    return NextResponse.json({
      success: true,
      data: {
        reply: result.reply,
        specs: result.currentSpecs,
        isComplete: result.isComplete,
        suggestedQuestions: result.suggestedQuestions,
        threadId,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[quotation-chat] Error:", error);
    }
    return NextResponse.json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "대화 처리 중 오류가 발생했습니다." },
    }, { status: 500 });
  }
}
