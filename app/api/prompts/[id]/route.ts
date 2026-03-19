// ============================================================
// GET    /api/prompts/:id — 프롬프트 단건 조회
// PUT    /api/prompts/:id — 프롬프트 수정 (version 자동 증가)
// DELETE /api/prompts/:id — 프롬프트 삭제 (시스템 프롬프트 차단)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/actions";
import { handleApiError } from "@/lib/errors";
import { db, aiPrompts } from "@/lib/db";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const { id } = await params;
    const rows = await db
      .select()
      .from(aiPrompts)
      .where(and(eq(aiPrompts.id, id), eq(aiPrompts.tenantId, user.tenantId)))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "프롬프트를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    // 기존 레코드 조회
    const existing = await db
      .select()
      .from(aiPrompts)
      .where(and(eq(aiPrompts.id, id), eq(aiPrompts.tenantId, user.tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "프롬프트를 찾을 수 없습니다." }, { status: 404 });
    }

    const current = existing[0];

    const [updated] = await db
      .update(aiPrompts)
      .set({
        name: body.name ?? current.name,
        description: body.description !== undefined ? body.description : current.description,
        category: body.category ?? current.category,
        systemPrompt: body.systemPrompt ?? current.systemPrompt,
        outputSchema: body.outputSchema !== undefined ? body.outputSchema : current.outputSchema,
        modelName: body.modelName !== undefined ? body.modelName : current.modelName,
        temperature: body.temperature != null ? String(body.temperature) : (body.temperature === null ? null : current.temperature),
        maxTokens: body.maxTokens !== undefined ? body.maxTokens : current.maxTokens,
        isActive: body.isActive !== undefined ? body.isActive : current.isActive,
        // slug는 시스템 프롬프트면 변경 불가
        slug: current.isSystem ? current.slug : (body.slug ?? current.slug),
        version: current.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(aiPrompts.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const { id } = await params;

    const existing = await db
      .select()
      .from(aiPrompts)
      .where(and(eq(aiPrompts.id, id), eq(aiPrompts.tenantId, user.tenantId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "프롬프트를 찾을 수 없습니다." }, { status: 404 });
    }

    if (existing[0].isSystem) {
      return NextResponse.json({ error: "시스템 기본 프롬프트는 삭제할 수 없습니다." }, { status: 403 });
    }

    await db.delete(aiPrompts).where(eq(aiPrompts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const { body, status } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
