"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface QuotationRow {
  id: string;
  quotationNumber: string;
  quotationType: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

/** 견적 상태별 Badge */
function statusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">초안</Badge>;
    case "review":
      return <Badge variant="outline">검토중</Badge>;
    case "approved":
      return <Badge variant="outline">승인됨</Badge>;
    case "published":
      return <Badge>발행됨</Badge>;
    case "won":
      return <Badge className="bg-green-600 text-white hover:bg-green-700">낙찰</Badge>;
    case "lost":
      return <Badge variant="destructive">실주</Badge>;
    case "pending":
      return <Badge variant="outline">대기</Badge>;
    case "expired":
      return <Badge variant="secondary">만료</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

/** 견적 유형 한국어 */
function typeLabel(type: string) {
  switch (type) {
    case "profitability":
      return "수익성";
    case "spec_match":
      return "규격충족";
    case "performance":
      return "성능향상";
    default:
      return type;
  }
}

export default function QuotationHistoryPage() {
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotations() {
      try {
        const res = await fetch("/api/quotation");
        const json = await res.json();
        if (json.success) {
          setQuotations(json.data);
        }
      } catch {
        // 조회 실패 시 빈 목록 유지
      } finally {
        setLoading(false);
      }
    }
    fetchQuotations();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">견적 이력</h2>
        <p className="text-muted-foreground">
          생성된 견적서 목록과 상태를 확인합니다.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : quotations.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">아직 생성된 견적이 없습니다.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>견적번호</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>견적유형</TableHead>
                <TableHead className="text-right">총액</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium text-sm">
                    {q.quotationNumber}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabel(q.quotationType)}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {q.totalAmount.toLocaleString("ko-KR")}원
                  </TableCell>
                  <TableCell>{statusBadge(q.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
