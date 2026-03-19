// ============================================================
// GET /api/prompts   — 프롬프트 목록 조회 (category 필터 지원)
// POST /api/prompts  — 프롬프트 신규 추가
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { handleApiError } from "@/lib/errors";
import { db, aiPrompts } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const conditions = [eq(aiPrompts.tenantId, user.tenantId)];
    if (category) {
      conditions.push(eq(aiPrompts.category, category));
    }

    const rows = await db
      .select()
      .from(aiPrompts)
      .where(and(...conditions))
      .orderBy(desc(aiPrompts.updatedAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const body = await request.json();
    const { slug, name, description, category, systemPrompt, outputSchema, modelName, temperature, maxTokens } = body;

    if (!slug || !name || !category || !systemPrompt) {
      return NextResponse.json({ error: "필수 항목(slug, name, category, systemPrompt)을 입력하세요." }, { status: 400 });
    }

    const [row] = await db.insert(aiPrompts).values({
      tenantId: user.tenantId,
      slug,
      name,
      description: description || null,
      category,
      systemPrompt,
      outputSchema: outputSchema || null,
      modelName: modelName || null,
      temperature: temperature != null ? String(temperature) : null,
      maxTokens: maxTokens || null,
      isActive: true,
      isSystem: false,
      version: 1,
      createdBy: user.id,
    }).returning();

    return NextResponse.json({ success: true, data: row }, { status: 201 });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
