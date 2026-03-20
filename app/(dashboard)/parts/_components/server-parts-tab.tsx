"use client";

// ============================================================
// 부품 관리 페이지 — 카테고리 탭 + 검색 + CRUD Dialog
// ============================================================

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Search, Pencil, Trash2, FileSpreadsheet, Download, Upload, History, ChevronDown, Loader2 } from "lucide-react";

// --- 타입 정의 ---

interface PartCategory {
  id: string;
  name: string;
  displayName: string;
  group: string;
}

interface PartItem {
  id: string;
  tenantId: string;
  categoryId: string;
  modelName: string;
  manufacturer: string;
  specs: Record<string, string | number>;
  isDeleted: boolean;
  createdAt: string;
  priceId: string | null;
  listPrice: number | null;
  marketPrice: number | null;
  supplyPrice: number | null;
  categoryName: string | null;
  categoryDisplayName: string | null;
  categoryGroup: string | null;
}

interface PartFormValues {
  categoryId: string;
  modelName: string;
  manufacturer: string;
  specs: Record<string, string | number>;
  listPrice: number;
  marketPrice: number;
  supplyPrice: number;
}

interface UserInfo {
  id: string;
  role: string;
  tenantId: string;
}

// --- 14개 기본 카테고리 매핑 ---

const DEFAULT_CATEGORIES: { name: string; displayName: string; group: string }[] = [
  { name: "cpu", displayName: "CPU", group: "server_parts" },
  { name: "memory", displayName: "메모리", group: "server_parts" },
  { name: "ssd", displayName: "SSD", group: "server_parts" },
  { name: "hdd", displayName: "HDD", group: "server_parts" },
  { name: "nic", displayName: "NIC", group: "server_parts" },
  { name: "raid", displayName: "RAID", group: "server_parts" },
  { name: "gpu", displayName: "GPU", group: "server_parts" },
  { name: "psu", displayName: "PSU", group: "server_parts" },
  { name: "mainboard", displayName: "메인보드", group: "server_parts" },
  { name: "chassis", displayName: "섀시", group: "server_parts" },
  { name: "hba", displayName: "HBA", group: "server_parts" },
  { name: "switch", displayName: "스위치", group: "network_infra" },
  { name: "transceiver", displayName: "트랜시버", group: "network_infra" },
  { name: "cable", displayName: "케이블", group: "network_infra" },
];

// --- 가격 포맷 헬퍼 ---

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "-";
  return value.toLocaleString("ko-KR");
}

function calcMarginRate(supplyPrice: number | null, costPrice: number): string {
  if (!supplyPrice || supplyPrice === 0) return "-";
  const rate = ((supplyPrice - costPrice) / supplyPrice) * 100;
  return `${rate.toFixed(1)}%`;
}

// --- 빈 폼 초기값 ---

const EMPTY_FORM: PartFormValues = {
  categoryId: "",
  modelName: "",
  manufacturer: "",
  specs: {},
  listPrice: 0,
  marketPrice: 0,
  supplyPrice: 0,
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function ServerPartsTab() {
  // --- 상태 ---
  const [categories, setCategories] = useState<PartCategory[]>([]);
  const [items, setItems] = useState<PartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Dialog 상태
  const [formOpen, setFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartItem | null>(null);
  const [formValues, setFormValues] = useState<PartFormValues>(EMPTY_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // 삭제 확인 Dialog 상태
  const [deleteTarget, setDeleteTarget] = useState<PartItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // 엑셀 업로드 Dialog 상태
  const [excelOpen, setExcelOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelDragOver, setExcelDragOver] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [excelDuplicateMode, setExcelDuplicateMode] = useState<string>("overwrite");
  const [excelUploading, setExcelUploading] = useState(false);
  const [excelResult, setExcelResult] = useState<{
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors: { row: number; field: string; message: string }[];
  } | null>(null);

  // 가격 이력 Dialog 상태
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPart, setHistoryPart] = useState<PartItem | null>(null);
  const [historyData, setHistoryData] = useState<{
    id: string;
    changeType: string;
    listPriceBefore: number;
    listPriceAfter: number;
    marketPriceBefore: number;
    marketPriceAfter: number;
    supplyPriceBefore: number;
    supplyPriceAfter: number;
    changeReason: string | null;
    createdAt: string;
  }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const limit = 20;
  const isAdmin = userInfo?.role === "super_admin" || userInfo?.role === "admin";

  // --- 사용자 정보 가져오기 ---
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUserInfo(data.data);
          }
        }
      } catch {
        // 인증 실패 시 무시
      }
    }
    fetchUser();
  }, []);

  // --- 카테고리 목록 가져오기 ---
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/parts?limit=1");
        if (res.ok) {
          // 카테고리 목록을 별도로 가져올 수 없으므로 기본 매핑 사용
          // 실제로는 DB 카테고리를 기반으로 하지만, 탭 표시를 위해 기본값 유지
        }
      } catch {
        // 무시
      }
    }
    fetchCategories();
  }, []);

  // --- 부품 목록 가져오기 ---
  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategoryId && selectedCategoryId !== "all") {
        params.set("category_id", selectedCategoryId);
      }
      if (search) {
        params.set("search", search);
      }
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/parts?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setItems(json.data.items);
          setTotal(json.data.total);

          // 응답에서 카테고리 ID 매핑 추출
          const catMap = new Map<string, PartCategory>();
          for (const item of json.data.items as PartItem[]) {
            if (item.categoryId && item.categoryName) {
              catMap.set(item.categoryId, {
                id: item.categoryId,
                name: item.categoryName,
                displayName: item.categoryDisplayName ?? item.categoryName,
                group: item.categoryGroup ?? "server_parts",
              });
            }
          }
          // 기존 카테고리에 없는 것만 추가
          if (catMap.size > 0) {
            setCategories((prev) => {
              const merged = new Map(prev.map((c) => [c.id, c]));
              for (const [id, cat] of catMap) {
                merged.set(id, cat);
              }
              return Array.from(merged.values());
            });
          }
        }
      }
    } catch {
      // 에러 처리
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, search, page]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // --- 카테고리 탭 변경 ---
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setPage(1);
  };

  // --- 검색 ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchParts();
  };

  // --- 부품 추가 Dialog 열기 ---
  const openAddDialog = () => {
    setEditingPart(null);
    setFormValues({
      ...EMPTY_FORM,
      categoryId: selectedCategoryId !== "all" ? selectedCategoryId : "",
    });
    setFormOpen(true);
  };

  // --- 부품 수정 Dialog 열기 ---
  const openEditDialog = (part: PartItem) => {
    setEditingPart(part);
    setFormValues({
      categoryId: part.categoryId,
      modelName: part.modelName,
      manufacturer: part.manufacturer,
      specs: (part.specs ?? {}) as Record<string, string | number>,
      listPrice: part.listPrice ?? 0,
      marketPrice: part.marketPrice ?? 0,
      supplyPrice: part.supplyPrice ?? 0,
    });
    setFormOpen(true);
  };

  // --- 부품 저장 (추가/수정) ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      if (editingPart) {
        // 수정
        const res = await fetch(`/api/parts/${editingPart.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelName: formValues.modelName,
            manufacturer: formValues.manufacturer,
            specs: formValues.specs,
            listPrice: formValues.listPrice,
            marketPrice: formValues.marketPrice,
            supplyPrice: formValues.supplyPrice,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error?.message ?? "수정에 실패했습니다.");
          return;
        }
      } else {
        // 추가
        const res = await fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formValues),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error?.message ?? "등록에 실패했습니다.");
          return;
        }
      }

      setFormOpen(false);
      fetchParts();
    } catch {
      alert("요청 중 오류가 발생했습니다.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // --- 삭제 ---
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/parts/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error?.message ?? "삭제에 실패했습니다.");
        return;
      }

      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchParts();
    } catch {
      alert("삭제 요청 중 오류가 발생했습니다.");
    }
  };

  // --- 엑셀 템플릿 다운로드 ---
  const handleTemplateDownload = async () => {
    try {
      const res = await fetch("/api/parts/excel-template");
      if (!res.ok) throw new Error("다운로드 실패");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "부품_템플릿.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("템플릿 다운로드에 실패했습니다.");
    }
  };

  // --- 엑셀 업로드 ---
  const handleExcelUpload = async () => {
    if (!excelFile) return;
    setExcelUploading(true);
    setExcelResult(null);
    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("duplicate_mode", excelDuplicateMode);
      const res = await fetch("/api/parts/excel-upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setExcelResult({
          totalRows: json.data.totalRows,
          successRows: json.data.successRows,
          failedRows: json.data.failedRows,
          errors: json.data.errors ?? [],
        });
        fetchParts();
      } else {
        alert(json.error?.message ?? "업로드에 실패했습니다.");
      }
    } catch {
      alert("업로드 요청 중 오류가 발생했습니다.");
    } finally {
      setExcelUploading(false);
    }
  };

  // --- 엑셀 Dialog 초기화 ---
  const openExcelDialog = () => {
    setExcelFile(null);
    setExcelResult(null);
    setExcelDuplicateMode("overwrite");
    setExcelOpen(true);
  };

  // --- 가격 이력 조회 ---
  const openHistoryDialog = async (part: PartItem) => {
    setHistoryPart(part);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      const res = await fetch(`/api/parts/${part.id}/price-history?period=12`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setHistoryData(json.data);
        }
      }
    } catch {
      // 무시
    } finally {
      setHistoryLoading(false);
    }
  };

  // --- 카테고리 탭 목록 구성 ---
  // DB에서 가져온 카테고리와 기본 카테고리를 합침
  const tabCategories = categories.length > 0
    ? categories
    : DEFAULT_CATEGORIES.map((c) => ({ id: c.name, ...c }));

  const serverParts = tabCategories.filter((c) => c.group === "server_parts");
  const networkParts = tabCategories.filter((c) => c.group === "network_infra");

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* 버튼 영역 */}
      <div className="flex items-center justify-end">
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              부품 추가
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  엑셀 관리
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleTemplateDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  템플릿 다운로드
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openExcelDialog}>
                  <Upload className="mr-2 h-4 w-4" />
                  엑셀 업로드
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="모델명 또는 제조사 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          검색
        </Button>
      </form>

      {/* 카테고리 탭 */}
      <Tabs
        value={selectedCategoryId}
        onValueChange={handleCategoryChange}
        className="w-full"
      >
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all">전체</TabsTrigger>
          {serverParts.length > 0 && (
            <>
              <span className="mx-1 self-center text-xs text-muted-foreground">|</span>
              {serverParts.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.displayName}
                </TabsTrigger>
              ))}
            </>
          )}
          {networkParts.length > 0 && (
            <>
              <span className="mx-1 self-center text-xs text-muted-foreground">|</span>
              {networkParts.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.displayName}
                </TabsTrigger>
              ))}
            </>
          )}
        </TabsList>

        <TabsContent value={selectedCategoryId} className="mt-4">
          {/* 데이터 테이블 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>모델명</TableHead>
                  <TableHead>제조사</TableHead>
                  <TableHead>주요 스펙</TableHead>
                  <TableHead className="text-right">리스트가</TableHead>
                  <TableHead className="text-right">시장가</TableHead>
                  <TableHead className="text-right">공급가</TableHead>
                  <TableHead className="text-right">마진율</TableHead>
                  {isAdmin && <TableHead className="w-[100px]">관리</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // 스켈레톤 로딩
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {Array.from({ length: isAdmin ? 10 : 9 }).map((_, j) => (
                        <TableCell key={`skeleton-${i}-${j}`}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 10 : 9}
                      className="h-24 text-center text-muted-foreground"
                    >
                      등록된 부품이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.categoryDisplayName ?? item.categoryName ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.modelName}
                      </TableCell>
                      <TableCell>{item.manufacturer}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {formatSpecs(item.specs)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrice(item.listPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrice(item.marketPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrice(item.supplyPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {calcMarginRate(item.supplyPrice, 0)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="가격 이력"
                              onClick={() => openHistoryDialog(item)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteTarget(item);
                                setDeleteOpen(true);
                              }}
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

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                총 {total}건 중 {(page - 1) * limit + 1}-
                {Math.min(page * limit, total)}건
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </Button>
                <span className="flex items-center px-2 text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 부품 추가/수정 Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPart ? "부품 수정" : "부품 추가"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* 카테고리 선택 (추가 시에만) */}
            {!editingPart && (
              <div className="space-y-2">
                <Label htmlFor="categoryId">카테고리</Label>
                <select
                  id="categoryId"
                  value={formValues.categoryId}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, categoryId: e.target.value }))
                  }
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">카테고리 선택</option>
                  {tabCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="modelName">모델명</Label>
              <Input
                id="modelName"
                value={formValues.modelName}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, modelName: e.target.value }))
                }
                placeholder="예: Xeon Gold 6438Y+"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">제조사</Label>
              <Input
                id="manufacturer"
                value={formValues.manufacturer}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, manufacturer: e.target.value }))
                }
                placeholder="예: Intel"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="listPrice">리스트가 (원)</Label>
                <Input
                  id="listPrice"
                  type="number"
                  min={0}
                  value={formValues.listPrice}
                  onChange={(e) =>
                    setFormValues((v) => ({
                      ...v,
                      listPrice: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marketPrice">시장가 (원)</Label>
                <Input
                  id="marketPrice"
                  type="number"
                  min={0}
                  value={formValues.marketPrice}
                  onChange={(e) =>
                    setFormValues((v) => ({
                      ...v,
                      marketPrice: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplyPrice">공급가 (원)</Label>
                <Input
                  id="supplyPrice"
                  type="number"
                  min={0}
                  value={formValues.supplyPrice}
                  onChange={(e) =>
                    setFormValues((v) => ({
                      ...v,
                      supplyPrice: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            {/* 스펙 입력 (간단한 key-value) */}
            <div className="space-y-2">
              <Label>주요 스펙</Label>
              <SpecEditor
                specs={formValues.specs}
                onChange={(specs) => setFormValues((v) => ({ ...v, specs }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? "저장 중..." : editingPart ? "수정" : "등록"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>부품 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.modelName}&quot; 부품을 삭제하시겠습니까?
              <br />
              삭제된 부품은 목록에 표시되지 않지만, 데이터는 보존됩니다.
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

      {/* 엑셀 업로드 Dialog */}
      <Dialog open={excelOpen} onOpenChange={setExcelOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>엑셀 업로드</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              기존 부품(모델명+제조사 동일)은 가격이 업데이트되며 변동 이력이 자동 기록됩니다.
            </p>

            {/* 드래그앤드롭 영역 */}
            <div
              className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
                excelDragOver
                  ? "border-primary bg-primary/5"
                  : excelFile
                    ? "border-green-500 bg-green-500/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setExcelDragOver(true); }}
              onDragLeave={() => setExcelDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setExcelDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
                  setExcelFile(file);
                  setExcelResult(null);
                }
              }}
              onClick={() => excelInputRef.current?.click()}
            >
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  setExcelFile(e.target.files?.[0] ?? null);
                  setExcelResult(null);
                }}
              />
              {excelFile ? (
                <>
                  <FileSpreadsheet className="h-10 w-10 text-green-500" />
                  <p className="text-sm font-medium">{excelFile.name}</p>
                  <p className="text-xs text-muted-foreground">클릭하여 다른 파일 선택</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium">파일을 끌어다 놓거나 클릭하여 선택</p>
                  <p className="text-xs text-muted-foreground">.xlsx, .xls 파일 지원</p>
                </>
              )}
            </div>

            {/* 중복 처리 옵션 */}
            <div className="space-y-2">
              <Label>중복 부품 처리</Label>
              <RadioGroup value={excelDuplicateMode} onValueChange={setExcelDuplicateMode}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overwrite" id="overwrite" />
                  <Label htmlFor="overwrite" className="font-normal">덮어쓰기 (가격 이력 기록)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skip" id="skip" />
                  <Label htmlFor="skip" className="font-normal">건너뛰기</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 업로드 버튼 */}
            <Button
              className="w-full"
              disabled={!excelFile || excelUploading}
              onClick={handleExcelUpload}
            >
              {excelUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  업로드
                </>
              )}
            </Button>

            {/* 결과 표시 */}
            {excelResult && (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex gap-4 text-sm">
                  <span>총 <strong>{excelResult.totalRows}</strong>건</span>
                  <span className="text-green-600">성공 <strong>{excelResult.successRows}</strong>건</span>
                  {excelResult.failedRows > 0 && (
                    <span className="text-destructive">실패 <strong>{excelResult.failedRows}</strong>건</span>
                  )}
                </div>
                {excelResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">행</TableHead>
                          <TableHead>필드</TableHead>
                          <TableHead>오류</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {excelResult.errors.slice(0, 20).map((err, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{err.row}</TableCell>
                            <TableCell className="text-sm">{err.field}</TableCell>
                            <TableCell className="text-sm text-destructive">{err.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 가격 이력 Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              가격 변동 이력 — {historyPart?.modelName}
            </DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historyData.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              가격 변동 이력이 없습니다.
            </p>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead className="text-right">리스트가</TableHead>
                    <TableHead className="text-right">시장가</TableHead>
                    <TableHead className="text-right">공급가</TableHead>
                    <TableHead>사유</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(h.createdAt).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={h.changeType === "excel_upload" ? "default" : "outline"}>
                          {h.changeType === "excel_upload" ? "엑셀" : h.changeType === "manual" ? "수동" : h.changeType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatPrice(h.listPriceBefore)} → {formatPrice(h.listPriceAfter)}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatPrice(h.marketPriceBefore)} → {formatPrice(h.marketPriceAfter)}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatPrice(h.supplyPriceBefore)} → {formatPrice(h.supplyPriceAfter)}
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">
                        {h.changeReason ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// 스펙 편집기 서브컴포넌트
// ============================================================

interface SpecEditorProps {
  specs: Record<string, string | number>;
  onChange: (specs: Record<string, string | number>) => void;
}

function SpecEditor({ specs, onChange }: SpecEditorProps) {
  const entries = Object.entries(specs);

  const addField = () => {
    onChange({ ...specs, "": "" });
  };

  const updateKey = (oldKey: string, newKey: string, index: number) => {
    const newSpecs: Record<string, string | number> = {};
    let i = 0;
    for (const [k, v] of Object.entries(specs)) {
      if (i === index) {
        newSpecs[newKey] = v;
      } else {
        newSpecs[k] = v;
      }
      i++;
    }
    onChange(newSpecs);
  };

  const updateValue = (key: string, value: string) => {
    onChange({ ...specs, [key]: value });
  };

  const removeField = (key: string) => {
    const newSpecs = { ...specs };
    delete newSpecs[key];
    onChange(newSpecs);
  };

  return (
    <div className="space-y-2">
      {entries.map(([key, value], index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="항목명 (예: 코어)"
            value={key}
            onChange={(e) => updateKey(key, e.target.value, index)}
            className="flex-1"
          />
          <Input
            placeholder="값 (예: 32코어)"
            value={String(value)}
            onChange={(e) => updateValue(key, e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeField(key)}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addField}>
        <Plus className="mr-1 h-3 w-3" />
        스펙 항목 추가
      </Button>
    </div>
  );
}

// --- 스펙 문자열 포맷 ---

function formatSpecs(specs: Record<string, string | number> | null): string {
  if (!specs || typeof specs !== "object") return "-";
  const entries = Object.entries(specs);
  if (entries.length === 0) return "-";
  return entries
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}
