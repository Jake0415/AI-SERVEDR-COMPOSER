"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Pencil, Trash2, History, Loader2, Eye, FileSpreadsheet } from "lucide-react";

interface CodeNode {
  id: string; code: string; name: string; level: number; children: CodeNode[];
}

interface PartItem {
  id: string;
  modelName: string;
  manufacturer: string;
  specs: Record<string, string | number>;
  listPrice: number | null;
  marketPrice: number | null;
  supplyPrice: number | null;
  partCodeId: string | null;
  partCodeCode: string | null;
  partCodeName: string | null;
  categoryDisplayName: string | null;
}

interface PriceHistory {
  id: string; changeType: string;
  listPriceBefore: number; listPriceAfter: number;
  marketPriceBefore: number; marketPriceAfter: number;
  supplyPriceBefore: number; supplyPriceAfter: number;
  changeReason: string | null; createdAt: string;
}

function formatPrice(v: number | null | undefined): string {
  if (v == null) return "-";
  return v.toLocaleString("ko-KR");
}

function parseSpecs(specs: unknown): Record<string, string | number> {
  if (!specs) return {};
  if (typeof specs === "object" && !Array.isArray(specs)) return specs as Record<string, string | number>;
  if (typeof specs === "string") {
    try { const p = JSON.parse(specs); return typeof p === "object" ? p : {}; } catch { return {}; }
  }
  return {};
}

export default function ServerPartsTab() {
  const [codeTree, setCodeTree] = useState<CodeNode[]>([]);
  const [majorCode, setMajorCode] = useState("");
  const [items, setItems] = useState<PartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // 추가 Dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addMajor, setAddMajor] = useState("");
  const [addPartCode, setAddPartCode] = useState("");
  const [addModel, setAddModel] = useState("");
  const [addMfr, setAddMfr] = useState("");
  const [addListPrice, setAddListPrice] = useState(0);
  const [addMarketPrice, setAddMarketPrice] = useState(0);
  const [addSupplyPrice, setAddSupplyPrice] = useState(0);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // 수정 Dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PartItem | null>(null);
  const [editModel, setEditModel] = useState("");
  const [editMfr, setEditMfr] = useState("");
  const [editListPrice, setEditListPrice] = useState(0);
  const [editMarketPrice, setEditMarketPrice] = useState(0);
  const [editSupplyPrice, setEditSupplyPrice] = useState(0);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // 삭제
  const [deleteTarget, setDeleteTarget] = useState<PartItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // 이력
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<PartItem | null>(null);
  const [historyData, setHistoryData] = useState<PriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 상세보기
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<PartItem | null>(null);

  // 엑셀
  const fileRef = useRef<HTMLInputElement>(null);

  const limit = 20;

  // 사용자 정보
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.success && d.data) setIsAdmin(d.data.role === "super_admin" || d.data.role === "admin");
    }).catch(() => {});
  }, []);

  // 파트 코드 트리 로드
  useEffect(() => {
    fetch("/api/part-codes").then(r => r.json()).then(d => {
      if (d.success && d.data) {
        // API 응답: { tree: CodeNode[], total: number }
        const tree = d.data.tree as CodeNode[];
        if (Array.isArray(tree)) {
          setCodeTree(tree);
        }
      }
    }).catch(() => {});
  }, []);

  // 부품 목록
  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (majorCode) params.set("part_code", majorCode);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/parts?${params}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setItems(json.data.items);
          setTotal(json.data.total);
        }
      }
    } catch {} finally { setLoading(false); }
  }, [majorCode, search, page]);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  // 대분류 변경
  const handleMajorChange = (code: string) => {
    setMajorCode(code);
    setPage(1);
  };

  // 추가
  const handleAdd = async () => {
    if (!addPartCode || !addModel || !addMfr) return;
    setAddSubmitting(true);
    try {
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partCodeId: addPartCode, modelName: addModel, manufacturer: addMfr,
          listPrice: addListPrice, marketPrice: addMarketPrice, supplyPrice: addSupplyPrice,
        }),
      });
      if (res.ok) { setAddOpen(false); fetchParts(); }
      else { const e = await res.json(); alert(e.error?.message ?? "추가 실패"); }
    } catch { alert("오류"); } finally { setAddSubmitting(false); }
  };

  // 수정
  const openEdit = (p: PartItem) => {
    setEditTarget(p); setEditModel(p.modelName); setEditMfr(p.manufacturer);
    setEditListPrice(p.listPrice ?? 0); setEditMarketPrice(p.marketPrice ?? 0); setEditSupplyPrice(p.supplyPrice ?? 0);
    setEditOpen(true);
  };
  const handleEdit = async () => {
    if (!editTarget) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/parts/${editTarget.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName: editModel, manufacturer: editMfr, listPrice: editListPrice, marketPrice: editMarketPrice, supplyPrice: editSupplyPrice }),
      });
      if (res.ok) { setEditOpen(false); fetchParts(); }
      else { const e = await res.json(); alert(e.error?.message ?? "수정 실패"); }
    } catch { alert("오류"); } finally { setEditSubmitting(false); }
  };

  // 삭제
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/parts/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) { setDeleteOpen(false); setDeleteTarget(null); fetchParts(); }
      else { const e = await res.json(); alert(e.error?.message ?? "삭제 실패"); }
    } catch { alert("오류"); }
  };

  // 이력
  const openHistory = async (p: PartItem) => {
    setHistoryTarget(p); setHistoryOpen(true); setHistoryLoading(true); setHistoryData([]);
    try {
      const res = await fetch(`/api/parts/${p.id}/price-history?period=12`);
      if (res.ok) { const j = await res.json(); if (j.success) setHistoryData(j.data); }
    } catch {} finally { setHistoryLoading(false); }
  };

  // 엑셀 다운로드
  const downloadTemplate = async () => {
    const res = await fetch("/api/parts/excel-template");
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "Server-Parts-template.xlsx"; a.click();
      URL.revokeObjectURL(url);
    }
  };

  // 엑셀 업로드
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/parts/excel-upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        alert(`${json.data?.successRows ?? 0}건 등록, ${json.data?.failedRows ?? 0}건 실패`);
        fetchParts();
      } else {
        alert(json.error?.message ?? "업로드 실패");
      }
    } catch { alert("업로드 오류"); }
    if (fileRef.current) fileRef.current.value = "";
  };

  // 추가 Dialog에서 캐스케이드 옵션
  const addMajorNode = codeTree.find(n => n.code === addMajor);
  const addPartCodeOptions = addMajorNode?.children ?? [];

  const totalPages = Math.ceil(total / limit);

  // 분류 경로 구성 (카테고리 > 부품명)
  const getCodePath = (item: PartItem): string => {
    if (!item.partCodeCode) return item.categoryDisplayName ?? "-";
    // partCodeCode가 Level 2이면 "Level1이름 > Level2이름"
    for (const major of codeTree) {
      const child = major.children.find(c => c.code === item.partCodeCode);
      if (child) return `${major.name} > ${child.name}`;
    }
    // Level 1이면 이름만
    const l1 = codeTree.find(n => n.code === item.partCodeCode);
    if (l1) return l1.name;
    return item.partCodeName ?? "-";
  };

  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* 버튼 영역 */}
      <div className="flex items-center justify-end gap-2">
        {isAdmin && (
          <Button onClick={() => { setAddMajor(""); setAddPartCode(""); setAddModel(""); setAddMfr(""); setAddListPrice(0); setAddMarketPrice(0); setAddSupplyPrice(0); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            부품 추가
          </Button>
        )}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><FileSpreadsheet className="mr-2 h-4 w-4" />엑셀 관리</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadTemplate}>템플릿 다운로드</DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileRef.current?.click()}>엑셀 업로드</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
      </div>

      {/* 대분류 필터 */}
      <div className="flex flex-wrap gap-2">
        <Button variant={majorCode === "" ? "default" : "outline"} size="sm" onClick={() => handleMajorChange("")}>전체</Button>
        {codeTree.map(n => (
          <Button key={n.code} variant={majorCode === n.code ? "default" : "outline"} size="sm" onClick={() => handleMajorChange(n.code)}>
            {n.name}
          </Button>
        ))}
      </div>

      {/* 검색 */}
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchParts(); }} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="모델명 또는 제조사 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button type="submit" variant="secondary">검색</Button>
      </form>

      {/* 테이블 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>파트코드</TableHead>
              <TableHead>분류</TableHead>
              <TableHead>모델명</TableHead>
              <TableHead>제조사</TableHead>
              <TableHead className="text-right">리스트가</TableHead>
              <TableHead className="text-right">시장가</TableHead>
              <TableHead className="text-right">공급가</TableHead>
              {isAdmin && <TableHead className="w-[120px]">관리</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? null : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="h-24 text-center text-muted-foreground">
                  등록된 서버 파트가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{(page - 1) * limit + idx + 1}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{item.partCodeCode ?? "-"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getCodePath(item)}</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium cursor-default">{item.modelName}</span>
                      </TooltipTrigger>
                      {Object.keys(parseSpecs(item.specs)).length > 0 && (
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1 text-xs">
                            {Object.entries(parseSpecs(item.specs)).map(([k, v]) => (
                              <div key={k}><span className="font-semibold">{k}:</span> {String(v)}</div>
                            ))}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell>{item.manufacturer}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(item.listPrice)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(item.marketPrice)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(item.supplyPrice)}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="자세히 보기" onClick={() => { setDetailTarget(item); setDetailOpen(true); }}><Eye className="h-4 w-4 text-blue-500" /></Button>
                        <Button variant="ghost" size="icon" title="가격 이력" onClick={() => openHistory(item)}><History className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget(item); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">총 {total}건 중 {(page - 1) * limit + 1}-{Math.min(page * limit, total)}건</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</Button>
            <span className="flex items-center px-2 text-sm">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>다음</Button>
          </div>
        </div>
      )}

      {/* 추가 Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>서버 파트 추가</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>카테고리</Label>
                <select value={addMajor} onChange={(e) => { setAddMajor(e.target.value); setAddPartCode(""); }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">선택</option>
                  {codeTree.map(n => <option key={n.code} value={n.code}>{n.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>부품명</Label>
                <select value={addPartCode} onChange={(e) => setAddPartCode(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">선택</option>
                  {addPartCodeOptions.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>모델명</Label><Input value={addModel} onChange={(e) => setAddModel(e.target.value)} placeholder="예: Xeon Gold 6430" required /></div>
            <div className="space-y-2"><Label>제조사</Label><Input value={addMfr} onChange={(e) => setAddMfr(e.target.value)} placeholder="예: Intel" required /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>리스트가</Label><Input type="number" min={0} value={addListPrice} onChange={(e) => setAddListPrice(Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>시장가</Label><Input type="number" min={0} value={addMarketPrice} onChange={(e) => setAddMarketPrice(Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>공급가</Label><Input type="number" min={0} value={addSupplyPrice} onChange={(e) => setAddSupplyPrice(Number(e.target.value))} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>취소</Button>
              <Button onClick={handleAdd} disabled={addSubmitting || !addPartCode || !addModel || !addMfr}>
                {addSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}등록
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 수정 Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>서버 파트 수정</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>모델명</Label><Input value={editModel} onChange={(e) => setEditModel(e.target.value)} /></div>
            <div className="space-y-2"><Label>제조사</Label><Input value={editMfr} onChange={(e) => setEditMfr(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>리스트가</Label><Input type="number" min={0} value={editListPrice} onChange={(e) => setEditListPrice(Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>시장가</Label><Input type="number" min={0} value={editMarketPrice} onChange={(e) => setEditMarketPrice(Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>공급가</Label><Input type="number" min={0} value={editSupplyPrice} onChange={(e) => setEditSupplyPrice(Number(e.target.value))} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>취소</Button>
              <Button onClick={handleEdit} disabled={editSubmitting}>{editSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}수정</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>서버 파트 삭제</AlertDialogTitle>
            <AlertDialogDescription>&quot;{deleteTarget?.modelName}&quot; 부품을 삭제하시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 가격 이력 */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>가격 변동 이력 — {historyTarget?.modelName}</DialogTitle></DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : historyData.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">가격 변동 이력이 없습니다.</p>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead><TableHead>유형</TableHead>
                    <TableHead className="text-right">리스트가</TableHead>
                    <TableHead className="text-right">시장가</TableHead>
                    <TableHead className="text-right">공급가</TableHead>
                    <TableHead>사유</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(h.createdAt).toLocaleDateString("ko-KR")}</TableCell>
                      <TableCell><Badge variant={h.changeType === "excel_upload" ? "default" : "outline"}>{h.changeType === "excel_upload" ? "엑셀" : "수동"}</Badge></TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatPrice(h.listPriceBefore)} → {formatPrice(h.listPriceAfter)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatPrice(h.marketPriceBefore)} → {formatPrice(h.marketPriceAfter)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatPrice(h.supplyPriceBefore)} → {formatPrice(h.supplyPriceAfter)}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{h.changeReason ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* 상세보기 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>부품 상세 정보 — {detailTarget?.modelName}</DialogTitle></DialogHeader>
          {detailTarget && (
            <div className="space-y-5 max-h-[500px] overflow-auto">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">기본 정보</h4>
                <div className="grid grid-cols-[100px_1fr] gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">파트코드</span>
                  <span><Badge variant="outline" className="font-mono text-xs">{detailTarget.partCodeCode ?? "-"}</Badge></span>
                  <span className="text-muted-foreground">분류</span>
                  <span>{getCodePath(detailTarget)}</span>
                  <span className="text-muted-foreground">모델명</span>
                  <span className="font-medium">{detailTarget.modelName}</span>
                  <span className="text-muted-foreground">제조사</span>
                  <span>{detailTarget.manufacturer}</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">가격 정보</h4>
                <div className="grid grid-cols-[100px_1fr] gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">리스트가</span>
                  <span className="tabular-nums">{formatPrice(detailTarget.listPrice)}원</span>
                  <span className="text-muted-foreground">시장가</span>
                  <span className="tabular-nums">{formatPrice(detailTarget.marketPrice)}원</span>
                  <span className="text-muted-foreground">공급가</span>
                  <span className="tabular-nums font-medium">{formatPrice(detailTarget.supplyPrice)}원</span>
                </div>
              </div>
              {detailTarget.specs && typeof detailTarget.specs === "object" && Object.keys(detailTarget.specs).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">상세 스펙</h4>
                  <div className="grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
                    {Object.entries(detailTarget.specs).map(([k, v]) => (
                      <div key={k} className="contents">
                        <span className="text-muted-foreground">{k}</span>
                        <span>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">추가 정보</h4>
                <p className="text-sm text-muted-foreground">제품번호, 시리얼, 보증기간, 인증 등 — 데이터 입력 시 자동 표시됩니다.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
