"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Star, StarOff, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CustomerRow {
  id: string;
  companyName: string;
  businessNumber: string | null;
  ceoName: string | null;
  phone: string | null;
  email: string | null;
  customerType: string;
  isFrequent: boolean;
  createdAt: string;
}

interface CustomerForm {
  company_name: string;
  business_number: string;
  ceo_name: string;
  address: string;
  business_type: string;
  business_item: string;
  phone: string;
  fax: string;
  email: string;
  customer_type: string;
  payment_terms: string;
  notes: string;
}

const emptyForm: CustomerForm = {
  company_name: "", business_number: "", ceo_name: "", address: "",
  business_type: "", business_item: "", phone: "", fax: "", email: "",
  customer_type: "private", payment_terms: "", notes: "",
};

function customerTypeLabel(type: string) {
  switch (type) {
    case "public": return "공공기관";
    case "private": return "민간기업";
    default: return "기타";
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/customers?${params}`);
      const json = await res.json();
      if (json.success) setCustomers(json.data);
    } catch {
      // 거래처 조회 실패 시 기본값 유지
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEditDialog = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      const json = await res.json();
      if (json.success) {
        const c = json.data;
        setForm({
          company_name: c.companyName ?? "",
          business_number: c.businessNumber ?? "",
          ceo_name: c.ceoName ?? "",
          address: c.address ?? "",
          business_type: c.businessType ?? "",
          business_item: c.businessItem ?? "",
          phone: c.phone ?? "",
          fax: c.fax ?? "",
          email: c.email ?? "",
          customer_type: c.customerType ?? "private",
          payment_terms: c.paymentTerms ?? "",
          notes: c.notes ?? "",
        });
        setEditingId(id);
        setError(null);
        setDialogOpen(true);
      }
    } catch {
      // 거래처 상세 조회 실패 시 무시
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PUT" : "POST";

      // PUT은 camelCase 필드명 사용
      const payload = editingId
        ? {
            companyName: form.company_name,
            businessNumber: form.business_number || null,
            ceoName: form.ceo_name || null,
            address: form.address || null,
            businessType: form.business_type || null,
            businessItem: form.business_item || null,
            phone: form.phone || null,
            fax: form.fax || null,
            email: form.email || null,
            customerType: form.customer_type,
            paymentTerms: form.payment_terms || null,
            notes: form.notes || null,
          }
        : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "저장 실패");
        return;
      }

      setDialogOpen(false);
      await fetchCustomers();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFrequent = async (id: string, current: boolean) => {
    await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFrequent: !current }),
    });
    await fetchCustomers();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "삭제 실패");
      }
      setDeleteTarget(null);
      await fetchCustomers();
    } catch {
      // 삭제 실패 시 무시 (목록 재조회로 상태 동기화)
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">거래처 관리</h2>
          <p className="text-muted-foreground">고객사 정보를 등록하고 관리합니다.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          거래처 등록
        </Button>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="회사명 또는 사업자번호 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 테이블 */}
      {loading ? null : customers.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">등록된 거래처가 없습니다.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>회사명</TableHead>
                <TableHead>사업자번호</TableHead>
                <TableHead>대표자</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>구분</TableHead>
                <TableHead className="text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleFrequent(c.id, c.isFrequent)}
                    >
                      {c.isFrequent ? (
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{c.companyName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.businessNumber ?? "-"}</TableCell>
                  <TableCell className="text-sm">{c.ceoName ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.phone ?? c.email ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{customerTypeLabel(c.customerType)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(c.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 등록/수정 모달 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "거래처 수정" : "거래처 등록"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>회사명 *</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>사업자번호</Label>
                <Input value={form.business_number} onChange={(e) => setForm({ ...form, business_number: e.target.value })} placeholder="000-00-00000" />
              </div>
              <div className="space-y-2">
                <Label>구분</Label>
                <Select value={form.customer_type} onValueChange={(v) => setForm({ ...form, customer_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">공공기관</SelectItem>
                    <SelectItem value="private">민간기업</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>대표자</Label>
              <Input value={form.ceo_name} onChange={(e) => setForm({ ...form, ceo_name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>주소</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>업태</Label>
                <Input value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>종목</Label>
                <Input value={form.business_item} onChange={(e) => setForm({ ...form, business_item: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>전화번호</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>팩스</Label>
                <Input value={form.fax} onChange={(e) => setForm({ ...form, fax: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>이메일</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>기본 결제조건</Label>
              <Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="납품 후 30일 이내" />
            </div>

            <div className="space-y-2">
              <Label>비고</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              <X className="h-4 w-4 mr-1" />취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.company_name}>
              {submitting ? "저장 중..." : editingId ? "수정" : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>거래처 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.companyName}&quot;을(를) 삭제하시겠습니까? 연결된 견적이 있으면 삭제할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
