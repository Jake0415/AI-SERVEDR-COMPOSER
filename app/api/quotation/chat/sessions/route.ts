import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { db, aiChatSessions, customers } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } }, { status: 401 });
    }

    const sessions = await db.select({
      id: aiChatSessions.id,
      threadId: aiChatSessions.threadId,
      mode: aiChatSessions.mode,
      status: aiChatSessions.status,
      messageCount: aiChatSessions.messageCount,
      createdAt: aiChatSessions.createdAt,
      updatedAt: aiChatSessions.updatedAt,
      customerId: aiChatSessions.customerId,
      customerName: customers.companyName,
    })
      .from(aiChatSessions)
      .leftJoin(customers, eq(customers.id, aiChatSessions.customerId))
      .where(and(eq(aiChatSessions.userId, user.id), eq(aiChatSessions.tenantId, user.tenantId)))
      .orderBy(desc(aiChatSessions.updatedAt))
      .limit(50);

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("[chat-sessions] Error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "세션 목록 조회 실패" } }, { status: 500 });
  }
}
