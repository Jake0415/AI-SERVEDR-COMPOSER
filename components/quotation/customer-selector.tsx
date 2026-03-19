"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Search, Star, Plus, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectedCustomer {
  id: string;
  companyName: string;
  customerType: string;
}

interface CustomerRow {
  id: string;
  companyName: string;
  businessNumber: string | null;
  ceoName: string | null;
  customerType: string;
  isFrequent: boolean;
}

interface CustomerSelectorProps {
  selectedCustomer: SelectedCustomer | null;
  onSelect: (customer: SelectedCustomer) => void;
}

const CUSTOMER_TYPE_LABEL: Record<string, string> = {
  public: "공공기관",
  private: "민간기업",
  other: "기타",
};

export function CustomerSelector({ selectedCustomer, onSelect }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    company_name: "",
    business_number: "",
    customer_type: "private" as string,
  });
  const [creating, setCreating] = useState(false);

  const fetchCustomers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드 + 검색 debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search);
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, fetchCustomers]);

  const handleSelect = (customer: CustomerRow) => {
    onSelect({
      id: customer.id,
      companyName: customer.companyName,
      customerType: customer.customerType,
    });
    setOpen(false);
    setSearch("");
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.company_name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      const json = await res.json();
      if (json.success) {
        onSelect({
          id: json.data.id,
          companyName: json.data.companyName,
          customerType: json.data.customerType,
        });
        setDialogOpen(false);
        setOpen(false);
        setNewCustomer({ company_name: "", business_number: "", customer_type: "private" });
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  // 자주 사용하는 거래처를 상단으로
  const frequentCustomers = customers.filter((c) => c.isFrequent);
  const otherCustomers = customers.filter((c) => !c.isFrequent);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 text-left"
          >
            {selectedCustomer ? (
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedCustomer.companyName}</span>
                <Badge variant="secondary" className="text-xs">
                  {CUSTOMER_TYPE_LABEL[selectedCustomer.customerType] ?? selectedCustomer.customerType}
                </Badge>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                거래처를 선택하세요
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center gap-2 border-b px-3 h-10">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="회사명 또는 사업자번호 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <CommandList>
              {loading && (
                <div className="py-4 text-center text-sm text-muted-foreground">검색 중...</div>
              )}
              {!loading && customers.length === 0 && (
                <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
              )}
              {!loading && frequentCustomers.length > 0 && (
                <CommandGroup heading="자주 사용">
                  {frequentCustomers.map((c) => (
                    <CommandItem key={c.id} onSelect={() => handleSelect(c)} className="cursor-pointer">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="flex-1">{c.companyName}</span>
                      {c.businessNumber && (
                        <span className="text-xs text-muted-foreground">{c.businessNumber}</span>
                      )}
                      <Badge variant="outline" className="text-xs ml-1">
                        {CUSTOMER_TYPE_LABEL[c.customerType] ?? c.customerType}
                      </Badge>
                      {selectedCustomer?.id === c.id && <Check className="h-4 w-4 text-primary" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!loading && otherCustomers.length > 0 && (
                <>
                  {frequentCustomers.length > 0 && <CommandSeparator />}
                  <CommandGroup heading={frequentCustomers.length > 0 ? "전체" : undefined}>
                    {otherCustomers.map((c) => (
                      <CommandItem key={c.id} onSelect={() => handleSelect(c)} className="cursor-pointer">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1">{c.companyName}</span>
                        {c.businessNumber && (
                          <span className="text-xs text-muted-foreground">{c.businessNumber}</span>
                        )}
                        <Badge variant="outline" className="text-xs ml-1">
                          {CUSTOMER_TYPE_LABEL[c.customerType] ?? c.customerType}
                        </Badge>
                        {selectedCustomer?.id === c.id && <Check className="h-4 w-4 text-primary" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            <CommandSeparator />
            <div className="p-1">
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                신규 거래처 등록
              </button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>신규 거래처 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>회사명 *</Label>
              <Input
                placeholder="회사명을 입력하세요"
                value={newCustomer.company_name}
                onChange={(e) => setNewCustomer((p) => ({ ...p, company_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>사업자번호</Label>
              <Input
                placeholder="000-00-00000"
                value={newCustomer.business_number}
                onChange={(e) => setNewCustomer((p) => ({ ...p, business_number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>거래처 유형</Label>
              <Select
                value={newCustomer.customer_type}
                onValueChange={(v) => setNewCustomer((p) => ({ ...p, customer_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">공공기관</SelectItem>
                  <SelectItem value="private">민간기업</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={!newCustomer.company_name.trim() || creating}
            >
              {creating ? "등록 중..." : "등록 후 선택"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
