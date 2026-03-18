"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface SaleItem {
  quotation_item_id: string | null;
  change_type: string;
  item_name: string;
  item_spec: string;
  quantity: number;
  unit: string;
  unit_cost_price: number;
  unit_supply_price: number;
}

export default function ActualSalesPage({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractNumber, setContractNumber] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [quotationTotal, setQuotationTotal] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        // 견적 항목 로드하여 초기값으로 설정
        const res = await fetch(`/api/quotation/${quotationId}`);
        const json = await res.json();
        if (json.success) {
          setQuotationTotal(json.data.totalAmount ?? 0);
          const qItems = json.data.items ?? [];
          setItems(
            qItems.map((item: { id: string; itemName: string; itemSpec: string | null; quantity: number; unit: string; unitCostPrice: number; unitSupplyPrice: number }) => ({
              quotation_item_id: item.id,
              change_type: "unchanged",
              item_name: item.itemName,
              item_spec: item.itemSpec ?? "",
              quantity: item.quantity,
              unit: item.unit,
              unit_cost_price: item.unitCostPrice,
              unit_supply_price: item.unitSupplyPrice,
            })),
          );
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [quotationId]);

  const updateItem = (idx: number, field: keyof SaleItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        // 변경 감지
        if (item.quotation_item_id && updated.change_type === "unchanged") {
          updated.change_type = "modified";
        }
        return updated;
      }),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        quotation_item_id: null,
        change_type: "added",
        item_name: "",
        item_spec: "",
        quantity: 1,
        unit: "EA",
        unit_cost_price: 0,
        unit_supply_price: 0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const actualTotal = items.reduce((sum, i) => sum + i.unit_supply_price * i.quantity, 0);
  const vatAmount = Math.round(actualTotal * 0.1);
  const grandTotal = actualTotal + vatAmount;
  const diff = grandTotal - quotationTotal;
  const accuracy = quotationTotal > 0 ? Math.round((grandTotal / quotationTotal) * 10000) / 100 : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/actual-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotation_id: quotationId,
          contract_number: contractNumber || undefined,
          contract_date: contractDate || undefined,
          delivery_date: deliveryDate || undefined,
          notes: notes || undefined,
          items,
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.push("/quotation-history");
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">실판매 기록</h2>
            <p className="text-muted-foreground">낙찰된 견적의 실제 판매 내역을 기록합니다.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || items.length === 0}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>

      {/* 비교 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">견적 총액</p>
            <p className="text-lg font-bold">{quotationTotal.toLocaleString()}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">실판매 총액</p>
            <p className="text-lg font-bold">{grandTotal.toLocaleString()}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">차이</p>
            <p className={`text-lg font-bold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}>
              {diff > 0 ? "+" : ""}{diff.toLocaleString()}원
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">정확도</p>
            <p className="text-lg font-bold">{accuracy}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 계약 정보 */}
      <Card>
        <CardHeader><CardTitle className="text-base">계약 정보</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>계약번호</Label>
            <Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>계약일</Label>
            <Input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>납품일</Label>
            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label>비고</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* 항목 테이블 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">판매 항목</h3>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3 w-3 mr-1" />항목 추가
          </Button>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">변경</TableHead>
                <TableHead>품명</TableHead>
                <TableHead>규격</TableHead>
                <TableHead className="w-16">수량</TableHead>
                <TableHead className="w-28">원가</TableHead>
                <TableHead className="w-28">공급가</TableHead>
                <TableHead className="w-28">금액</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Badge variant={item.change_type === "added" ? "default" : item.change_type === "modified" ? "outline" : "secondary"} className="text-[10px]">
                      {item.change_type === "added" ? "신규" : item.change_type === "modified" ? "변경" : "원본"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Input className="h-8 text-sm" value={item.item_name} onChange={(e) => updateItem(idx, "item_name", e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8 text-sm" value={item.item_spec} onChange={(e) => updateItem(idx, "item_spec", e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8 text-sm text-center" type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8 text-sm text-right" type="number" value={item.unit_cost_price} onChange={(e) => updateItem(idx, "unit_cost_price", parseInt(e.target.value) || 0)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8 text-sm text-right" type="number" value={item.unit_supply_price} onChange={(e) => updateItem(idx, "unit_supply_price", parseInt(e.target.value) || 0)} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {(item.unit_supply_price * item.quantity).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
