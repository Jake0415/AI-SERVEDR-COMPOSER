"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FolderTree,
} from "lucide-react";

interface CodeNode {
  id: string;
  code: string;
  name: string;
  level: number;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children: CodeNode[];
}

const LEVEL_LABELS: Record<number, string> = {
  1: "대분류",
  2: "중분류",
  3: "장비명",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  2: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  3: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function EquipmentCodesPage() {
  const [tree, setTree] = useState<CodeNode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Dialog 상태
  const [addOpen, setAddOpen] = useState(false);
  const [addLevel, setAddLevel] = useState(1);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addParentName, setAddParentName] = useState("");
  const [addName, setAddName] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CodeNode | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/equipment-codes");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTree(json.data.tree);
          setTotal(json.data.total);
        }
      }
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collect = (nodes: CodeNode[]) => {
      for (const n of nodes) {
        if (n.children.length > 0) {
          allIds.add(n.id);
          collect(n.children);
        }
      }
    };
    collect(tree);
    setExpanded(allIds);
  };

  const collapseAll = () => setExpanded(new Set());

  // 추가 Dialog
  const openAddDialog = (level: number, parentId: string | null, parentName: string) => {
    setAddLevel(level);
    setAddParentId(parentId);
    setAddParentName(parentName);
    setAddName("");
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!addName.trim()) return;
    setAddSubmitting(true);
    try {
      const res = await fetch("/api/equipment-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName.trim(), level: addLevel, parentId: addParentId }),
      });
      if (res.ok) {
        setAddOpen(false);
        fetchTree();
      } else {
        const err = await res.json();
        alert(err.error?.message ?? "추가 실패");
      }
    } catch {
      alert("요청 중 오류");
    } finally {
      setAddSubmitting(false);
    }
  };

  // 수정 Dialog
  const openEditDialog = (node: CodeNode) => {
    setEditTarget(node);
    setEditName(node.name);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget || !editName.trim()) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/equipment-codes/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        setEditOpen(false);
        fetchTree();
      } else {
        const err = await res.json();
        alert(err.error?.message ?? "수정 실패");
      }
    } catch {
      alert("요청 중 오류");
    } finally {
      setEditSubmitting(false);
    }
  };

  // 삭제
  const handleDelete = async (node: CodeNode) => {
    if (!confirm(`"${node.name}" (${node.code})를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/equipment-codes/${node.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTree();
      } else {
        const err = await res.json();
        alert(err.error?.message ?? "삭제 실패");
      }
    } catch {
      alert("삭제 요청 중 오류");
    }
  };

  // 트리 노드 렌더링
  const renderNode = (node: CodeNode, depth: number) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group"
          style={{ paddingLeft: `${depth * 24 + 8}px` }}
        >
          {/* 펼침/접기 */}
          {hasChildren ? (
            <button onClick={() => toggleExpand(node.id)} className="shrink-0 p-0.5">
              {isExpanded
                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          {/* 코드 뱃지 */}
          <Badge variant="outline" className="font-mono text-xs shrink-0">
            {node.code}
          </Badge>

          {/* 레벨 뱃지 */}
          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${LEVEL_COLORS[node.level]}`}>
            {LEVEL_LABELS[node.level]}
          </span>

          {/* 이름 */}
          <span className="text-sm flex-1 truncate">{node.name}</span>

          {/* 액션 버튼 */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {node.level < 3 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title={`${LEVEL_LABELS[node.level + 1]} 추가`}
                onClick={() => openAddDialog(node.level + 1, node.id, node.name)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="수정"
              onClick={() => openEditDialog(node)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="삭제"
              onClick={() => handleDelete(node)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        {/* 자식 노드 */}
        {isExpanded && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">IT 인프라 코드 관리</h1>
          <p className="text-muted-foreground">
            대분류 → 중분류 → 장비명 3단계 계층 코드 체계 ({total}건)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>전체 펼침</Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>전체 접기</Button>
          <Button size="sm" onClick={() => openAddDialog(1, null, "")}>
            <Plus className="mr-1 h-4 w-4" />
            대분류 추가
          </Button>
        </div>
      </div>

      {/* 트리뷰 */}
      <div className="rounded-md border">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <FolderTree className="h-10 w-10" />
            <p>등록된 장비 코드가 없습니다.</p>
          </div>
        ) : (
          <div className="p-2">
            {tree.map((node) => renderNode(node, 0))}
          </div>
        )}
      </div>

      {/* 추가 Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{LEVEL_LABELS[addLevel]} 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {addParentName && (
              <div className="text-sm text-muted-foreground">
                상위: <strong>{addParentName}</strong>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="codeName">이름</Label>
              <Input
                id="codeName"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder={`${LEVEL_LABELS[addLevel]}명 입력`}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              코드는 자동 생성됩니다.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>취소</Button>
              <Button onClick={handleAdd} disabled={addSubmitting || !addName.trim()}>
                {addSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                추가
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 수정 Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>코드 수정 — {editTarget?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">이름</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>취소</Button>
              <Button onClick={handleEdit} disabled={editSubmitting || !editName.trim()}>
                {editSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                수정
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
