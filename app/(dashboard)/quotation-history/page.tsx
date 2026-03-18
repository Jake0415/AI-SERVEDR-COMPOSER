"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, FileText, FileSpreadsheet, Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface QuotationRow {
  id: string;
  quotationNumber: string;
  quotationType: string;
  totalAmount: number;
  totalSupply: number;
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
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationRow | null>(null);
  const [bidResult, setBidResult] = useState<"won" | "lost">("won");
  const [bidReason, setBidReason] = useState("");
  const [competitorPrice, setCompetitorPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQuotations = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // PDF 다운로드
  const handleDownloadPDF = (id: string, template: "company" | "g2b") => {
    window.open(`/api/quotation/${id}/export?format=pdf&template=${template}`, "_blank");
  };

  // Excel 다운로드
  const handleDownloadExcel = (id: string) => {
    window.open(`/api/quotation/${id}/export?format=excel`, "_blank");
  };

  // 낙찰 결과 모달 열기
  const openBidModal = (quotation: QuotationRow) => {
    setSelectedQuotation(quotation);
    setBidResult("won");
    setBidReason("");
    setCompetitorPrice("");
    setBidModalOpen(true);
  };

  // 낙찰 결과 저장
  const handleSubmitBidResult = async () => {
    if (!selectedQuotation) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/bid-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotation_id: selectedQuotation.id,
          result: bidResult,
          reason: bidReason || undefined,
          competitor_price: competitorPrice ? Number(competitorPrice) : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setBidModalOpen(false);
        await fetchQuotations(); // 목록 새로고침
      }
    } catch {
      // 에러 처리
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">견적 이력</h2>
        <p className="text-muted-foreground">
          생성된 견적서 목록과 상태를 확인하고, 견적서를 출력하거나 낙찰 결과를 기록합니다.
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
                <TableHead className="text-center">출력</TableHead>
                <TableHead className="text-center">낙찰결과</TableHead>
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
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="자사 양식 PDF"
                        onClick={() => handleDownloadPDF(q.id, "company")}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="나라장터 양식 PDF"
                        onClick={() => handleDownloadPDF(q.id, "g2b")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excel 다운로드"
                        onClick={() => handleDownloadExcel(q.id)}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {q.status !== "won" && q.status !== "lost" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBidModal(q)}
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        결과입력
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">기록완료</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 낙찰 결과 입력 모달 */}
      <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>낙찰 결과 입력</DialogTitle>
          </DialogHeader>

          {selectedQuotation && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">{selectedQuotation.quotationNumber}</p>
                <p className="text-muted-foreground">
                  {selectedQuotation.totalAmount.toLocaleString("ko-KR")}원
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">결과</label>
                <Select
                  value={bidResult}
                  onValueChange={(v) => setBidResult(v as "won" | "lost")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="won">낙찰</SelectItem>
                    <SelectItem value="lost">실주</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {bidResult === "won" ? "낙찰 메모" : "실주 사유"}
                </label>
                <Textarea
                  placeholder={
                    bidResult === "won"
                      ? "낙찰 관련 메모를 입력하세요"
                      : "실주 사유를 입력하세요 (예: 가격 경쟁력 부족)"
                  }
                  value={bidReason}
                  onChange={(e) => setBidReason(e.target.value)}
                  rows={3}
                />
              </div>

              {bidResult === "lost" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">경쟁사 가격 (선택)</label>
                  <Input
                    type="number"
                    placeholder="경쟁사 낙찰 가격"
                    value={competitorPrice}
                    onChange={(e) => setCompetitorPrice(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBidModalOpen(false)}
              disabled={submitting}
            >
              <X className="h-4 w-4 mr-1" />
              취소
            </Button>
            <Button onClick={handleSubmitBidResult} disabled={submitting}>
              {submitting ? "저장 중..." : "결과 저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
