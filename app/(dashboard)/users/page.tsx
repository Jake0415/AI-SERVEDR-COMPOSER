"use client";

// ============================================================
// 사용자 관리 페이지 — 목록 + 추가/수정/삭제 CRUD
// ============================================================

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

// --- 타입 정의 ---

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  department: string;
}

interface UserItem {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  phone: string;
  department: string;
  role: string;
  createdAt: string;
}

interface UserAddForm {
  email: string;
  password: string;
  name: string;
  phone: string;
  department: string;
  role: string;
}

interface UserEditForm {
  name: string;
  phone: string;
  department: string;
  role: string;
}

// --- 역할 Badge 렌더링 ---

function roleBadge(role: string) {
  switch (role) {
    case "super_admin":
      return <Badge variant="destructive">슈퍼어드민</Badge>;
    case "admin":
      return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">관리자</Badge>;
    case "member":
      return <Badge variant="secondary">멤버</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

// --- 빈 폼 초기값 ---

const EMPTY_ADD_FORM: UserAddForm = {
  email: "",
  password: "",
  name: "",
  phone: "",
  department: "",
  role: "member",
};

const EMPTY_EDIT_FORM: UserEditForm = {
  name: "",
  phone: "",
  department: "",
  role: "member",
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function UsersPage() {
  // --- 상태 ---
  const [userList, setUserList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  // 추가 Dialog 상태
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<UserAddForm>(EMPTY_ADD_FORM);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // 수정 Dialog 상태
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState<UserEditForm>(EMPTY_EDIT_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // 삭제 AlertDialog 상태
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);

  const isSuperAdmin = currentUser?.role === "super_admin";

  // --- 현재 사용자 정보 가져오기 ---
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setCurrentUser(data.data);
          }
        }
      } catch {
        // 인증 실패 시 무시
      }
    }
    fetchMe();
  }, []);

  // --- 사용자 목록 가져오기 ---
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUserList(json.data);
        }
      }
    } catch {
      toast.error("사용자 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- 사용자 추가 Dialog 열기 ---
  const openAddDialog = () => {
    setAddForm(EMPTY_ADD_FORM);
    setAddOpen(true);
  };

  // --- 사용자 추가 제출 ---
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addForm.password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setAddSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message ?? "사용자 추가에 실패했습니다.");
        return;
      }

      toast.success("사용자가 추가되었습니다.");
      setAddOpen(false);
      fetchUsers();
    } catch {
      toast.error("요청 중 오류가 발생했습니다.");
    } finally {
      setAddSubmitting(false);
    }
  };

  // --- 사용자 수정 Dialog 열기 ---
  const openEditDialog = (user: UserItem) => {
    setEditTarget(user);
    setEditForm({
      name: user.name,
      phone: user.phone,
      department: user.department,
      role: user.role,
    });
    setEditOpen(true);
  };

  // --- 사용자 수정 제출 ---
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message ?? "사용자 수정에 실패했습니다.");
        return;
      }

      toast.success("사용자 정보가 수정되었습니다.");
      setEditOpen(false);
      setEditTarget(null);
      fetchUsers();
    } catch {
      toast.error("요청 중 오류가 발생했습니다.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // --- 삭제 확인 Dialog 열기 ---
  const openDeleteDialog = (user: UserItem) => {
    if (user.id === currentUser?.id) {
      toast.error("자기 자신은 삭제할 수 없습니다.");
      return;
    }
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  // --- 사용자 삭제 ---
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message ?? "삭제에 실패했습니다.");
        return;
      }

      toast.success("사용자가 삭제되었습니다.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error("삭제 요청 중 오류가 발생했습니다.");
    }
  };

  // --- 테이블 컬럼 수 ---
  const colCount = isSuperAdmin ? 7 : 6;

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">사용자 관리</h2>
          <p className="text-muted-foreground">
            조직 내 사용자 목록을 관리합니다.
            {!loading && ` (총 ${userList.length}명)`}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            사용자 추가
          </Button>
        )}
      </div>

      {/* 사용자 테이블 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>가입일</TableHead>
              {isSuperAdmin && <TableHead className="w-[100px]">관리</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? null : userList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  등록된 사용자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              userList.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department || "-"}</TableCell>
                  <TableCell>{roleBadge(user.role)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 사용자 추가 Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>사용자 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-email">이메일</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((v) => ({ ...v, email: e.target.value }))
                }
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-password">비밀번호</Label>
              <Input
                id="add-password"
                type="password"
                value={addForm.password}
                onChange={(e) =>
                  setAddForm((v) => ({ ...v, password: e.target.value }))
                }
                placeholder="8자 이상 입력"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-name">이름</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((v) => ({ ...v, name: e.target.value }))
                }
                placeholder="홍길동"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-phone">전화번호</Label>
              <Input
                id="add-phone"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((v) => ({ ...v, phone: e.target.value }))
                }
                placeholder="010-1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-department">부서명</Label>
              <Input
                id="add-department"
                value={addForm.department}
                onChange={(e) =>
                  setAddForm((v) => ({ ...v, department: e.target.value }))
                }
                placeholder="영업부"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-role">역할</Label>
              <Select
                value={addForm.role}
                onValueChange={(value) =>
                  setAddForm((v) => ({ ...v, role: value }))
                }
              >
                <SelectTrigger id="add-role">
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">멤버</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={addSubmitting}>
                {addSubmitting ? "추가 중..." : "추가"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 사용자 수정 Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>사용자 수정</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input
                value={editTarget?.email ?? ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">이름</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((v) => ({ ...v, name: e.target.value }))
                }
                placeholder="홍길동"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">전화번호</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((v) => ({ ...v, phone: e.target.value }))
                }
                placeholder="010-1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-department">부서명</Label>
              <Input
                id="edit-department"
                value={editForm.department}
                onChange={(e) =>
                  setEditForm((v) => ({ ...v, department: e.target.value }))
                }
                placeholder="영업부"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">역할</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) =>
                  setEditForm((v) => ({ ...v, role: value }))
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">멤버</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? "수정 중..." : "수정"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사용자 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; ({deleteTarget?.email}) 사용자를
              정말 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
