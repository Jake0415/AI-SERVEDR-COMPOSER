"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, FileText, Loader2, ServerCog, Lightbulb, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { LoadingModal, type LoadingStep } from "@/components/ui/loading-modal";
import { CustomerBanner } from "@/components/quotation/customer-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RfpRecord {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  linkedQuotationCount?: number;
}

/** RFP 상태별 Badge variant 매핑 */
function statusBadge(status: string) {
  switch (status) {
    case "uploaded":
      return <Badge variant="outline">업로드됨</Badge>;
    case "parsing":
      return <Badge variant="outline">파싱중</Badge>;
    case "parsed":
      return <Badge>파싱완료</Badge>;
    case "error":
      return <Badge variant="destructive">오류</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function RfpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer_id") ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);

  const [rfpList, setRfpList] = useState<RfpRecord[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [dragOver, setDragOver] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(true);

  // RFP 이력 조회 (customer_id 필터링)
  const fetchRfpList = useCallback(async () => {
    try {
      const res = await fetch(`/api/rfp?customer_id=${customerId}`);
      const json = await res.json();
      if (json.success) {
        setRfpList(json.data);
      }
    } catch {
      // 조회 실패 시 빈 목록 유지
    } finally {
      setListLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchRfpList();
  }, [fetchRfpList]);

  // 파일 업로드 처리
  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (customerId) formData.append("customer_id", customerId);
      const res = await fetch("/api/rfp/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        setUploadError(json.error?.message ?? "업로드에 실패했습니다.");
        return;
      }
      toast.success("파일이 업로드되었습니다.");
      await fetchRfpList();
    } catch {
      setUploadError("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // AI 분석 시작
  const handleAnalyze = async (rfpId: string) => {
    setAnalyzingId(rfpId);
    setLoadingSteps([
      { label: "PDF 텍스트 추출", status: "in_progress" },
      { label: "AI 장비 요구사항 분석", status: "pending" },
      { label: "분석 결과 저장", status: "pending" },
    ]);
    try {
      // 1초 후 2단계로 전환 (텍스트 추출은 빠르므로)
      const stepTimer = window.setTimeout(() => {
        setLoadingSteps([
          { label: "PDF 텍스트 추출", status: "completed" },
          { label: "AI 장비 요구사항 분석", status: "in_progress" },
          { label: "분석 결과 저장", status: "pending" },
        ]);
      }, 1500);

      const res = await fetch(`/api/rfp/${rfpId}/analyze`, { method: "POST" });
      clearTimeout(stepTimer);

      const json = await res.json();
      if (!json.success) {
        setLoadingSteps((prev) => prev.map((s) => s.status === "in_progress" ? { ...s, status: "error" } : s));
        toast.error(json.error?.message ?? "분석에 실패했습니다.");
        return;
      }

      // 3단계: 저장 완료
      setLoadingSteps([
        { label: "PDF 텍스트 추출", status: "completed" },
        { label: "AI 장비 요구사항 분석", status: "completed" },
        { label: "분석 결과 저장", status: "completed" },
      ]);
      await new Promise((r) => window.setTimeout(r, 500));

      toast.success(`${json.data.config_count ?? 0}개 장비가 추출되었습니다.`);
      await fetchRfpList();
    } catch {
      setLoadingSteps((prev) => prev.map((s) => s.status === "in_progress" ? { ...s, status: "error" } : s));
      toast.error("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzingId(null);
      setLoadingSteps([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* AI 분석 로딩 모달 */}
      <LoadingModal
        open={!!analyzingId}
        title="RFP 분석 중"
        description="AI가 RFP 문서에서 장비 요구사항을 추출하고 있습니다. 약 30초~1분 소요됩니다."
        steps={loadingSteps}
      />

      {/* 거래처 배너 */}
      {customerId && <CustomerBanner customerId={customerId} />}

      {/* 메인 + 사이드바 flex 래퍼 (페이지 전체) */}
      <div className="flex gap-6">
        {/* 왼쪽: 메인 콘텐츠 */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* 제목 */}
          <div>
            <h2 className="text-2xl font-bold">RFP 업로드</h2>
            <p className="text-muted-foreground">
              분석할 RFP(제안요청서) 파일을 업로드하세요
            </p>
            <p className="text-xs text-amber-600 mt-1">
              AI 분석 정확도를 위해 인프라 장비 요구사항이 포함된 부분만 별도 PDF로 업로드해주세요.
            </p>
          </div>

          {/* 드래그앤드롭 업로드 영역 */}
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  파일을 업로드하고 있습니다...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-xs text-muted-foreground">
                  PDF 형식 지원 (최대 50MB)
                </p>
                <Button variant="outline" size="sm" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  파일 선택
                </Button>
              </div>
            )}
          </div>

          {/* 업로드 에러 */}
          {uploadError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{uploadError}</p>
            </div>
          )}

          {/* RFP 이력 테이블 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">RFP 이력</h3>
            {listLoading ? null : rfpList.length === 0 ? (
              <div className="border rounded-lg p-6 text-center">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  업로드된 RFP가 없습니다.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>파일명</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>연결 견적</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfpList.map((rfp) => (
                      <TableRow key={rfp.id}>
                        <TableCell className="text-sm">
                          {new Date(rfp.createdAt).toLocaleDateString("ko-KR")}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {rfp.fileName}
                        </TableCell>
                        <TableCell>{statusBadge(rfp.status)}</TableCell>
                        <TableCell>
                          {rfp.linkedQuotationCount ? (
                            <Badge variant="secondary">{rfp.linkedQuotationCount}건</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {rfp.status === "uploaded" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAnalyze(rfp.id)}
                              disabled={analyzingId === rfp.id}
                            >
                              {analyzingId === rfp.id ? (
                                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />분석 중...</>
                              ) : (
                                "분석 시작"
                              )}
                            </Button>
                          )}
                          {rfp.status === "parsed" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(`/quotation/rfp/${rfp.id}`)
                                }
                              >
                                결과 보기
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/quotation/configure?rfp_id=${rfp.id}&customer_id=${customerId}`
                                  )
                                }
                                disabled={!customerId}
                                title={!customerId ? "견적 허브에서 거래처를 먼저 선택하세요" : undefined}
                              >
                                <ServerCog className="h-3.5 w-3.5 mr-1.5" />
                                서버 구성
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(`/quotation/result?rfp_id=${rfp.id}&customer_id=${customerId}`)
                                }
                                disabled={!customerId}
                                title={!customerId ? "견적 허브에서 거래처를 먼저 선택하세요" : undefined}
                              >
                                견적 생성
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 작성 팁 사이드바 (페이지 전체 높이) */}
        {tipsOpen ? (
          <div className="hidden lg:block w-80 shrink-0">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    작성 팁
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTipsOpen(false)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">PDF 원본 파일 사용</span>
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">필수</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    PDF 원본으로 업로드하면 텍스트 추출 정확도가 높습니다. 스캔 이미지 PDF는 텍스트 인식률이 낮을 수 있습니다.
                  </p>
                </div>
                <div className="rounded-lg border p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">핵심 문서 선택</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">권장</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    RFP에 첨부파일이 여러 개라면, 제안요청서 본문과 과업지시서를 우선 업로드하세요. 별첨 서식은 나중에 참고해도 됩니다.
                  </p>
                </div>
                <div className="rounded-lg border p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">최신 버전 확인</span>
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">필수</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    입찰 공고에 수정공고(변경공고)가 있는지 확인하세요. 최종 수정된 RFP를 기반으로 분석해야 정확합니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="hidden lg:flex items-start shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 mt-1" onClick={() => setTipsOpen(true)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
