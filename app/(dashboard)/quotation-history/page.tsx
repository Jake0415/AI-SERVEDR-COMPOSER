"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Trophy,
  X,
  CheckCircle,
  Send,
  Copy,
  Eye,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  DialogDescription,
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* 타입 정의                                                           */
/* ------------------------------------------------------------------ */

interface QuotationRow {
  id: string;
  quotationNumber: string;
  quotationType: string;
  totalAmount: number;
  totalSupply: number;
  vat: number;
  status: string;
  createdAt: string;
  validityDate?: string;
  deliveryTerms?: string;
  deliveryDate?: string;
  paymentTerms?: string;
  notes?: string;
}

interface QuotationItem {
  id: string;
  sortOrder: number;
  itemName: string;
  itemSpec: string | null;
  quantity: number;
  unit: string;
  unitCostPrice: number;
  unitSupplyPrice: number;
  amount: number;
}

interface QuotationDetail extends QuotationRow {
  items: QuotationItem[];
}

type BidResultType = "won" | "lost" | "pending" | "expired";

/* ------------------------------------------------------------------ */
/* 유틸 함수                                                           */
/* ------------------------------------------------------------------ */

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
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-700">
          낙찰
        </Badge>
      );
    case "lost":
      return <Badge variant="destructive">실주</Badge>;
    case "pending":
      return <Badge variant="outline">보류</Badge>;
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

/** 낙찰 결과 라벨 */
function bidResultLabel(result: BidResultType): string {
  switch (result) {
    case "won":
      return "낙찰";
    case "lost":
      return "실주";
    case "pending":
      return "보류";
    case "expired":
      return "만료";
  }
}

/** 금액 포맷 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

/* ------------------------------------------------------------------ */
/* 메인 페이지 컴포넌트                                                 */
/* ------------------------------------------------------------------ */

export default function QuotationHistoryPage() {
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 낙찰 결과 모달
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] =
    useState<QuotationRow | null>(null);
  const [bidResult, setBidResult] = useState<BidResultType>("won");
  const [bidReason, setBidReason] = useState("");
  const [competitorPrice, setCompetitorPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 견적 상세 모달
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<QuotationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ---- 데이터 조회 ---- */

  const fetchQuotations = useCallback(async () => {
    try {
      const res = await fetch("/api/quotation");
      const json = await res.json();
      if (json.success) {
        setQuotations(json.data);
      } else {
        toast.error("견적 목록을 불러오지 못했습니다.");
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  /* ---- 견적 상세 조회 ---- */

  const openDetailModal = async (quotation: QuotationRow) => {
    setDetailData(null);
    setDetailModalOpen(true);
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/quotation/${quotation.id}`);
      const json = await res.json();
      if (json.success) {
        setDetailData(json.data);
      } else {
        toast.error("견적 상세 정보를 불러오지 못했습니다.");
        setDetailModalOpen(false);
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.");
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  /* ---- PDF / Excel 다운로드 ---- */

  const handleDownloadPDF = (
    id: string,
    template: "company" | "g2b",
    quotationNumber?: string,
  ) => {
    const label =
      template === "company" ? "자사 양식 PDF" : "나라장터 양식 PDF";
    toast.info(`${label} 다운로드를 시작합니다.`);
    window.open(
      `/api/quotation/${id}/export?format=pdf&template=${template}`,
      "_blank",
    );
    if (quotationNumber) {
      toast.success(`${quotationNumber} ${label} 다운로드 완료`);
    }
  };

  const handleDownloadExcel = (id: string, quotationNumber?: string) => {
    toast.info("Excel 다운로드를 시작합니다.");
    window.open(`/api/quotation/${id}/export?format=excel`, "_blank");
    if (quotationNumber) {
      toast.success(`${quotationNumber} Excel 다운로드 완료`);
    }
  };

  /* ---- 워크플로우 액션 ---- */

  const handleWorkflow = async (
    id: string,
    action: "approve" | "publish" | "revise",
  ) => {
    const actionLabels: Record<string, string> = {
      approve: "승인",
      publish: "발행",
      revise: "개정",
    };

    try {
      const res = await fetch(`/api/quotation/${id}/${action}`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`견적 ${actionLabels[action]} 처리가 완료되었습니다.`);
        await fetchQuotations();
      } else {
        toast.error(
          json.error?.message ??
            `${actionLabels[action]} 처리에 실패했습니다.`,
        );
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.");
    }
  };

  /* ---- 낙찰 결과 모달 ---- */

  const openBidModal = (quotation: QuotationRow) => {
    setSelectedQuotation(quotation);
    setBidResult("won");
    setBidReason("");
    setCompetitorPrice("");
    setBidModalOpen(true);
  };

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
          competitor_price: competitorPrice
            ? Number(competitorPrice)
            : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          `${selectedQuotation.quotationNumber} — ${bidResultLabel(bidResult)} 결과가 기록되었습니다.`,
        );
        setBidModalOpen(false);
        await fetchQuotations();
      } else {
        toast.error(
          json.error?.message ?? "낙찰 결과 저장에 실패했습니다.",
        );
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  /** 낙찰 결과가 이미 기록된 상태인지 확인 */
  const isBidRecorded = (status: string) =>
    ["won", "lost", "pending", "expired"].includes(status);

  /* ---- 렌더링 ---- */

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">견적 이력</h2>
        <p className="text-muted-foreground">
          생성된 견적서 목록과 상태를 확인하고, 견적서를 출력하거나 낙찰 결과를
          기록합니다.
        </p>
      </div>

      {/* ---- 견적 목록 테이블 ---- */}
      {loading ? null : quotations.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            아직 생성된 견적이 없습니다.
          </p>
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
                <TableHead className="text-center">워크플로우</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((q) => (
                <TableRow key={q.id}>
                  {/* 견적번호 — 클릭 시 상세 보기 */}
                  <TableCell>
                    <button
                      type="button"
                      className="font-medium text-sm text-primary underline-offset-4 hover:underline cursor-pointer"
                      onClick={() => openDetailModal(q)}
                      title="견적 상세 보기"
                    >
                      {q.quotationNumber}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabel(q.quotationType)}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(q.totalAmount)}
                  </TableCell>
                  <TableCell>{statusBadge(q.status)}</TableCell>

                  {/* 출력 버튼 */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="자사 양식 PDF"
                        onClick={() =>
                          handleDownloadPDF(q.id, "company", q.quotationNumber)
                        }
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="나라장터 양식 PDF"
                        onClick={() =>
                          handleDownloadPDF(q.id, "g2b", q.quotationNumber)
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excel 다운로드"
                        onClick={() =>
                          handleDownloadExcel(q.id, q.quotationNumber)
                        }
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* 낙찰 결과 */}
                  <TableCell className="text-center">
                    {!isBidRecorded(q.status) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBidModal(q)}
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        결과입력
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        기록완료
                      </span>
                    )}
                  </TableCell>

                  {/* 워크플로우 */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {q.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWorkflow(q.id, "approve")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          승인
                        </Button>
                      )}
                      {(q.status === "draft" || q.status === "approved") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWorkflow(q.id, "publish")}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          발행
                        </Button>
                      )}
                      {(q.status === "published" ||
                        q.status === "won" ||
                        q.status === "lost") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWorkflow(q.id, "revise")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          개정
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ================================================================ */}
      {/* 견적 상세 보기 모달                                                */}
      {/* ================================================================ */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              견적 상세 보기
            </DialogTitle>
            <DialogDescription>
              견적서의 상세 정보를 확인하고 PDF/Excel로 다운로드할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detailData ? (
            <div className="space-y-5">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">견적번호</span>
                  <p className="font-medium">
                    {detailData.quotationNumber}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">상태</span>
                  <div className="mt-0.5">
                    {statusBadge(detailData.status)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">견적유형</span>
                  <p className="font-medium">
                    {typeLabel(detailData.quotationType)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">작성일</span>
                  <p className="font-medium">
                    {new Date(detailData.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                {detailData.validityDate && (
                  <div>
                    <span className="text-muted-foreground">유효기간</span>
                    <p className="font-medium">{detailData.validityDate}</p>
                  </div>
                )}
                {detailData.deliveryDate && (
                  <div>
                    <span className="text-muted-foreground">납품일</span>
                    <p className="font-medium">{detailData.deliveryDate}</p>
                  </div>
                )}
                {detailData.deliveryTerms && (
                  <div>
                    <span className="text-muted-foreground">납품조건</span>
                    <p className="font-medium">{detailData.deliveryTerms}</p>
                  </div>
                )}
                {detailData.paymentTerms && (
                  <div>
                    <span className="text-muted-foreground">결제조건</span>
                    <p className="font-medium">{detailData.paymentTerms}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* 금액 요약 */}
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">공급가액</span>
                  <span>{formatCurrency(detailData.totalSupply)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">부가세</span>
                  <span>{formatCurrency(detailData.vat)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>합계</span>
                  <span>{formatCurrency(detailData.totalAmount)}</span>
                </div>
              </div>

              {/* 비고 */}
              {detailData.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">비고</span>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/30 p-3">
                    {detailData.notes}
                  </p>
                </div>
              )}

              <Separator />

              {/* 항목 테이블 */}
              <div>
                <h4 className="text-sm font-semibold mb-2">견적 항목</h4>
                {detailData.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    항목이 없습니다.
                  </p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 text-center">
                            #
                          </TableHead>
                          <TableHead>품명</TableHead>
                          <TableHead>규격</TableHead>
                          <TableHead className="text-center">수량</TableHead>
                          <TableHead className="text-center">단위</TableHead>
                          <TableHead className="text-right">단가</TableHead>
                          <TableHead className="text-right">금액</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailData.items.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {item.itemName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.itemSpec ?? "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {item.unit}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {item.unitSupplyPrice.toLocaleString("ko-KR")}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Separator />

              {/* 다운로드 버튼 */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownloadPDF(
                      detailData.id,
                      "company",
                      detailData.quotationNumber,
                    )
                  }
                >
                  <FileText className="h-4 w-4 mr-1" />
                  자사 양식 PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownloadPDF(
                      detailData.id,
                      "g2b",
                      detailData.quotationNumber,
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-1" />
                  나라장터 양식 PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownloadExcel(
                      detailData.id,
                      detailData.quotationNumber,
                    )
                  }
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel 다운로드
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* 낙찰 결과 입력 모달                                                */}
      {/* ================================================================ */}
      <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>낙찰 결과 입력</DialogTitle>
            <DialogDescription>
              해당 견적에 대한 낙찰/실주/보류/만료 결과를 기록합니다.
            </DialogDescription>
          </DialogHeader>

          {selectedQuotation && (
            <div className="space-y-4">
              {/* 선택된 견적 요약 */}
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">
                  {selectedQuotation.quotationNumber}
                </p>
                <p className="text-muted-foreground">
                  {formatCurrency(selectedQuotation.totalAmount)}
                </p>
              </div>

              {/* 결과 선택 */}
              <div className="space-y-2">
                <Label>결과</Label>
                <Select
                  value={bidResult}
                  onValueChange={(v) => setBidResult(v as BidResultType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="won">낙찰</SelectItem>
                    <SelectItem value="lost">실주</SelectItem>
                    <SelectItem value="pending">보류</SelectItem>
                    <SelectItem value="expired">만료</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 사유 / 메모 */}
              <div className="space-y-2">
                <Label>
                  {bidResult === "won"
                    ? "낙찰 메모"
                    : bidResult === "lost"
                      ? "실주 사유"
                      : bidResult === "pending"
                        ? "보류 사유"
                        : "만료 메모"}
                </Label>
                <Textarea
                  placeholder={
                    bidResult === "won"
                      ? "낙찰 관련 메모를 입력하세요"
                      : bidResult === "lost"
                        ? "실주 사유를 입력하세요 (예: 가격 경쟁력 부족)"
                        : bidResult === "pending"
                          ? "보류 사유를 입력하세요 (예: 고객 검토 중)"
                          : "만료 관련 메모를 입력하세요"
                  }
                  value={bidReason}
                  onChange={(e) => setBidReason(e.target.value)}
                  rows={3}
                />
              </div>

              {/* 경쟁사 가격 — 실주 시에만 표시 */}
              {bidResult === "lost" && (
                <div className="space-y-2">
                  <Label>경쟁사 가격 (선택)</Label>
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
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  저장 중...
                </>
              ) : (
                "결과 저장"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
