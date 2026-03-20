// ============================================================
// GET/POST /api/part-codes — 서버 파트 코드 관리
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { partCodes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";
import { generatePartCode } from "@/lib/utils/code-generator";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }

  const all = await db
    .select()
    .from(partCodes)
    .where(eq(partCodes.tenantId, user.tenantId))
    .orderBy(asc(partCodes.sortOrder), asc(partCodes.code));

  interface TreeNode {
    id: string; code: string; name: string; level: number;
    parentId: string | null; sortOrder: number; isActive: boolean;
    children: TreeNode[];
  }

  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  for (const item of all) nodeMap.set(item.id, { ...item, children: [] });
  for (const item of all) {
    const node = nodeMap.get(item.id)!;
    if (item.parentId && nodeMap.has(item.parentId)) {
      nodeMap.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return NextResponse.json({ success: true, data: { tree: roots, total: all.length } });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }
  if (user.role !== "super_admin" && user.role !== "admin") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "관리자 권한 필요" } }, { status: 403 });
  }

  const body = await request.json();
  const { name, level, parentId } = body;

  if (!name || !level || (level > 1 && !parentId)) {
    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "name, level 필수" } }, { status: 400 });
  }

  let parentCode: string | undefined;
  if (parentId) {
    const [parent] = await db.select({ code: partCodes.code }).from(partCodes)
      .where(eq(partCodes.id, parentId)).limit(1);
    if (!parent) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "부모 코드 없음" } }, { status: 404 });
    }
    parentCode = parent.code;
  }

  const code = await generatePartCode(user.tenantId, level, parentCode);

  const [created] = await db.insert(partCodes).values({
    tenantId: user.tenantId, code, name, level,
    parentId: parentId || null, sortOrder: body.sortOrder ?? 0,
  }).returning();

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
