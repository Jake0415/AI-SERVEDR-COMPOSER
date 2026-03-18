"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TenantData {
  companyName: string;
  businessNumber: string;
  ceoName: string;
  address: string;
  businessType: string;
  businessItem: string;
  phone: string;
  fax: string | null;
  email: string;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  defaultValidityDays: number;
  defaultPaymentTerms: string | null;
  quotationPrefix: string;
}

export default function CompanySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<TenantData>({
    companyName: "",
    businessNumber: "",
    ceoName: "",
    address: "",
    businessType: "",
    businessItem: "",
    phone: "",
    fax: "",
    email: "",
    bankName: "",
    bankAccount: "",
    bankHolder: "",
    defaultValidityDays: 30,
    defaultPaymentTerms: "",
    quotationPrefix: "Q",
  });

  useEffect(() => {
    async function fetchTenant() {
      try {
        const res = await fetch("/api/tenant");
        const json = await res.json();
        if (json.success && json.data) {
          setForm({
            companyName: json.data.companyName ?? "",
            businessNumber: json.data.businessNumber ?? "",
            ceoName: json.data.ceoName ?? "",
            address: json.data.address ?? "",
            businessType: json.data.businessType ?? "",
            businessItem: json.data.businessItem ?? "",
            phone: json.data.phone ?? "",
            fax: json.data.fax ?? "",
            email: json.data.email ?? "",
            bankName: json.data.bankName ?? "",
            bankAccount: json.data.bankAccount ?? "",
            bankHolder: json.data.bankHolder ?? "",
            defaultValidityDays: json.data.defaultValidityDays ?? 30,
            defaultPaymentTerms: json.data.defaultPaymentTerms ?? "",
            quotationPrefix: json.data.quotationPrefix ?? "Q",
          });
        }
      } catch {
        // 로드 실패
      } finally {
        setLoading(false);
      }
    }
    fetchTenant();
  }, []);

  const handleChange = (field: keyof TenantData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // 저장 실패
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
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">회사 정보 관리</h2>
            <p className="text-muted-foreground">견적서에 표시되는 발행사 정보를 관리합니다.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saved ? "저장 완료" : "저장"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>회사명 *</Label>
              <Input value={form.companyName} onChange={(e) => handleChange("companyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>사업자등록번호 *</Label>
              <Input value={form.businessNumber} onChange={(e) => handleChange("businessNumber", e.target.value)} placeholder="000-00-00000" />
            </div>
            <div className="space-y-2">
              <Label>대표자명 *</Label>
              <Input value={form.ceoName} onChange={(e) => handleChange("ceoName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>주소 *</Label>
              <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>업태 *</Label>
                <Input value={form.businessType} onChange={(e) => handleChange("businessType", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>종목 *</Label>
                <Input value={form.businessItem} onChange={(e) => handleChange("businessItem", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 연락처 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">연락처</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>전화번호 *</Label>
              <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>팩스</Label>
              <Input value={form.fax ?? ""} onChange={(e) => handleChange("fax", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>이메일 *</Label>
              <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* 계좌 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">입금 계좌 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>은행명</Label>
              <Input value={form.bankName ?? ""} onChange={(e) => handleChange("bankName", e.target.value)} placeholder="국민은행" />
            </div>
            <div className="space-y-2">
              <Label>계좌번호</Label>
              <Input value={form.bankAccount ?? ""} onChange={(e) => handleChange("bankAccount", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>예금주</Label>
              <Input value={form.bankHolder ?? ""} onChange={(e) => handleChange("bankHolder", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* 견적 기본 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">견적 기본 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>견적번호 접두사</Label>
              <Input value={form.quotationPrefix} onChange={(e) => handleChange("quotationPrefix", e.target.value)} placeholder="Q" />
              <p className="text-xs text-muted-foreground">예: Q-20260318-001</p>
            </div>
            <div className="space-y-2">
              <Label>기본 유효기간 (일)</Label>
              <Input type="number" value={form.defaultValidityDays} onChange={(e) => handleChange("defaultValidityDays", parseInt(e.target.value) || 30)} />
            </div>
            <div className="space-y-2">
              <Label>기본 결제조건</Label>
              <Input value={form.defaultPaymentTerms ?? ""} onChange={(e) => handleChange("defaultPaymentTerms", e.target.value)} placeholder="납품 후 30일 이내" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
