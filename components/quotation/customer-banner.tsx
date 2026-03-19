"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CustomerInfo {
  id: string;
  companyName: string;
  customerType: string;
  businessNumber: string | null;
}

interface CustomerBannerProps {
  customerId: string;
}

const CUSTOMER_TYPE_LABEL: Record<string, string> = {
  public: "공공기관",
  private: "민간기업",
  other: "기타",
};

export function CustomerBanner({ customerId }: CustomerBannerProps) {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    if (!customerId) return;
    fetch(`/api/customers/${customerId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCustomer(json.data);
      })
      .catch(() => {});
  }, [customerId]);

  if (!customerId || !customer) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border bg-blue-50 dark:bg-blue-950/30 px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium">{customer.companyName}</span>
        <Badge variant="secondary" className="text-xs">
          {CUSTOMER_TYPE_LABEL[customer.customerType] ?? customer.customerType}
        </Badge>
        {customer.businessNumber && (
          <span className="text-xs text-muted-foreground">({customer.businessNumber})</span>
        )}
      </div>
      <Link
        href="/quotation"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        거래처 변경
      </Link>
    </div>
  );
}
