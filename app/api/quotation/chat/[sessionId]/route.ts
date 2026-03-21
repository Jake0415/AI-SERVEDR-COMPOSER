import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, aiChatSessions, aiChatMessages, customers } from "@/lib/db";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } }, { status: 401 });
    }

    const { sessionId } = await params;

    const sessions = await db.select({
      id: aiChatSessions.id,
      threadId: aiChatSessions.threadId,
      mode: aiChatSessions.mode,
      status: aiChatSessions.status,
      messageCount: aiChatSessions.messageCount,
      finalSpecs: aiChatSessions.finalSpecs,
      createdAt: aiChatSessions.createdAt,
      customerName: customers.companyName,
    })
      .from(aiChatSessions)
      .leftJoin(customers, eq(customers.id, aiChatSessions.customerId))
      .where(and(eq(aiChatSessions.id, sessionId), eq(aiChatSessions.userId, user.id)))
      .limit(1);

    if (sessions.length === 0) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "세션을 찾을 수 없습니다." } }, { status: 404 });
    }

    const messages = await db.select({
      id: aiChatMessages.id,
      role: aiChatMessages.role,
      content: aiChatMessages.content,
      specs: aiChatMessages.specs,
      tokenCount: aiChatMessages.tokenCount,
      createdAt: aiChatMessages.createdAt,
    })
      .from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionId))
      .orderBy(asc(aiChatMessages.createdAt));

    return NextResponse.json({ success: true, data: { session: sessions[0], messages } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[chat-session-detail] Error:", error);
    }
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "세션 조회 실패" } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } }, { status: 401 });
    }

    const { sessionId } = await params;

    await db.update(aiChatSessions)
      .set({ status: "abandoned", updatedAt: new Date() })
      .where(and(eq(aiChatSessions.id, sessionId), eq(aiChatSessions.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[chat-session-delete] Error:", error);
    }
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "세션 삭제 실패" } }, { status: 500 });
  }
}
