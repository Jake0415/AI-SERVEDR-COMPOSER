// ============================================================
// GET/POST /api/equipment-codes — IT 인프라 장비 코드 관리
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { equipmentCodes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";
import { generateCode } from "@/lib/utils/code-generator";

// GET: 트리 구조로 전체 코드 반환
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "인증 필요" } }, { status: 401 });
  }

  const all = await db
    .select()
    .from(equipmentCodes)
    .where(eq(equipmentCodes.tenantId, user.tenantId))
    .orderBy(asc(equipmentCodes.sortOrder), asc(equipmentCodes.code));

  // 트리 구조 빌드
  interface TreeNode {
    id: string;
    code: string;
    name: string;
    level: number;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
    children: TreeNode[];
  }

  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of all) {
    nodeMap.set(item.id, { ...item, children: [] });
  }

  for (const item of all) {
    const node = nodeMap.get(item.id)!;
    if (item.parentId && nodeMap.has(item.parentId)) {
      nodeMap.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return NextResponse.json({
    success: true,
    data: { tree: roots, total: all.length },
  });
}

// POST: 코드 추가
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
    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "name, level 필수 (level>1이면 parentId도 필수)" } }, { status: 400 });
  }

  // 부모 코드 조회
  let parentCode: string | undefined;
  if (parentId) {
    const [parent] = await db
      .select({ code: equipmentCodes.code })
      .from(equipmentCodes)
      .where(and(eq(equipmentCodes.id, parentId), eq(equipmentCodes.tenantId, user.tenantId)))
      .limit(1);
    if (!parent) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "부모 코드를 찾을 수 없습니다" } }, { status: 404 });
    }
    parentCode = parent.code;
  }

  const code = await generateCode(user.tenantId, level, parentCode);

  const [created] = await db
    .insert(equipmentCodes)
    .values({
      tenantId: user.tenantId,
      code,
      name,
      level,
      parentId: parentId || null,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
