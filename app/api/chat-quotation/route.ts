// ============================================================
// POST /api/chat-quotation — 자연어 견적 생성 API
// 자연어 → 서버 사양 추출 → 견적 생성 엔진 연동
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "메시지가 필요합니다." } },
        { status: 400 },
      );
    }

    // OpenAI로 자연어 → 구조화된 서버 사양 추출
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({
        success: true,
        data: {
          reply: "AI 서비스가 설정되지 않았습니다. OPENAI_API_KEY 환경변수를 확인해주세요.\n\n대신 RFP 업로드 페이지에서 견적을 생성할 수 있습니다.",
          quotation_id: null,
        },
      });
    }

    // GPT로 사양 추출
    const systemPrompt = `당신은 서버 인프라 견적 전문가입니다. 사용자의 자연어 요청에서 서버 사양을 추출하세요.
응답은 한국어로 하되, 추출된 사양을 정리하여 안내하고 추가 정보가 필요하면 질문하세요.
다음 정보를 파악하세요: 서버 수량, CPU(코어/모델), 메모리(GB), 스토리지(종류/용량), GPU, 네트워크, 용도`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const aiResult = await res.json();
    const reply = aiResult.choices?.[0]?.message?.content ?? "응답을 생성하지 못했습니다.";

    return NextResponse.json({
      success: true,
      data: { reply, quotation_id: null },
    });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
