import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import postgres from "postgres";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "month";

    const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

    let interval = "30 days";
    if (period === "week") interval = "7 days";
    if (period === "day") interval = "1 day";

    const [summary] = await sql`
      SELECT
        COUNT(*) as total_calls,
        COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(estimated_cost::numeric), 0) as total_cost,
        COALESCE(AVG(latency_ms), 0) as avg_latency
      FROM ai_server_composer.llm_api_calls
      WHERE tenant_id = ${user.tenantId}
        AND created_at >= NOW() - ${interval}::interval`;

    const byModel = await sql`
      SELECT model_name,
        COUNT(*) as calls,
        COALESCE(SUM(total_tokens), 0) as tokens,
        COALESCE(SUM(estimated_cost::numeric), 0) as cost
      FROM ai_server_composer.llm_api_calls
      WHERE tenant_id = ${user.tenantId}
        AND created_at >= NOW() - ${interval}::interval
      GROUP BY model_name
      ORDER BY cost DESC`;

    const byPrompt = await sql`
      SELECT prompt_slug,
        COUNT(*) as calls,
        COALESCE(SUM(total_tokens), 0) as tokens
      FROM ai_server_composer.llm_api_calls
      WHERE tenant_id = ${user.tenantId}
        AND created_at >= NOW() - ${interval}::interval
      GROUP BY prompt_slug
      ORDER BY calls DESC`;

    await sql.end();

    return NextResponse.json({
      success: true,
      data: { summary, byModel, byPrompt, period },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ai-usage] Error:", error);
    }
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "사용량 조회 실패" } }, { status: 500 });
  }
}
