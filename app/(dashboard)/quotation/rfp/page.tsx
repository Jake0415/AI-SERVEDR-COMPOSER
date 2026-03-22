"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, FileText, Loader2, ServerCog, Lightbulb, ChevronRight, ChevronLeft, ArrowRight, X } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RfpRecord {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  linkedQuotationCount?: number;
  parsedRequirements?: Record<string, unknown>;
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
  const replaceFileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);

  const [rfpList, setRfpList] = useState<RfpRecord[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedRfp, setSelectedRfp] = useState<RfpRecord | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(true);
  const [uploadedRfp, setUploadedRfp] = useState<{
    id: string;
    fileName: string;
    fileSize: number;
    draftId: string | null;
  } | null>(null);

  // RFP -> draft 연결 맵 (업로드 시 draft가 함께 생성된 경우)
  const [rfpDraftMap, setRfpDraftMap] = useState<Record<string, string>>({});

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
      // uploadedRfp 상태 설정
      setUploadedRfp({
        id: json.data.rfp_id,
        fileName: json.data.file_name,
        fileSize: json.data.file_size,
        draftId: json.data.draft_quotation?.id ?? null,
      });
      // draft_quotation이 응답에 포함되면 rfp→draft 연결 저장
      const rfpId = json.data.rfp_id as string | undefined;
      const draftQuotation = json.data.draft_quotation as { id: string } | undefined;
      if (rfpId && draftQuotation?.id) {
        setRfpDraftMap((prev) => ({ ...prev, [rfpId]: draftQuotation.id }));
      }
      toast.success("파일이 업로드되었습니다.");
      await fetchRfpList();
    } catch {
      setUploadError("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // AI 분석 시작 (2단계 순차 호출)
  const handleAnalyze = async (rfpId: string) => {
    setAnalyzingId(rfpId);
    setLoadingSteps([
      { label: "PDF 텍스트 추출", status: "in_progress" },
      { label: "장비 목록 추출 (AI 1차 분석)", status: "pending" },
      { label: "장비별 상세 스펙 추출 (AI 2차 분석)", status: "pending" },
      { label: "결과 저장", status: "pending" },
    ]);
    try {
      // 2초 후: 1차 분석 단계로 전환
      const timer1 = window.setTimeout(() => {
        setLoadingSteps([
          { label: "PDF 텍스트 추출", status: "completed" },
          { label: "장비 목록 추출 (AI 1차 분석)", status: "in_progress" },
          { label: "장비별 상세 스펙 추출 (AI 2차 분석)", status: "pending" },
          { label: "결과 저장", status: "pending" },
        ]);
      }, 2000);

      // 10초 후: 2차 분석 단계로 전환 (1차는 보통 5~10초)
      const timer2 = window.setTimeout(() => {
        setLoadingSteps([
          { label: "PDF 텍스트 추출", status: "completed" },
          { label: "장비 목록 추출 (AI 1차 분석)", status: "completed" },
          { label: "장비별 상세 스펙 추출 중... (약 1~2분 소요)", status: "in_progress" },
          { label: "결과 저장", status: "pending" },
        ]);
      }, 10000);

      const res = await fetch(`/api/rfp/${rfpId}/analyze`, { method: "POST" });
      clearTimeout(timer1);
      clearTimeout(timer2);

      const json = await res.json();
      if (!json.success) {
        setLoadingSteps((prev) => prev.map((s) => s.status === "in_progress" ? { ...s, status: "error" } : s));
        toast.error(json.error?.message ?? "분석에 실패했습니다.");
        return;
      }

      // 완료
      setLoadingSteps([
        { label: "PDF 텍스트 추출", status: "completed" },
        { label: "장비 목록 추출 (AI 1차 분석)", status: "completed" },
        { label: "장비별 상세 스펙 추출 (AI 2차 분석)", status: "completed" },
        { label: "결과 저장", status: "completed" },
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

  const handleDelete = async () => {
    if (!uploadedRfp) return;
    try {
      await fetch(`/api/rfp/${uploadedRfp.id}`, { method: "DELETE" });
      setUploadedRfp(null);
      toast.success("파일이 삭제되었습니다.");
      await fetchRfpList();
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleReplace = async (file: File) => {
    if (uploadedRfp) {
      await fetch(`/api/rfp/${uploadedRfp.id}`, { method: "DELETE" });
    }
    await handleUpload(file);
    toast.success("파일이 교체되었습니다.");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (uploadedRfp) handleReplace(file);
      else handleUpload(file);
    }
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

          {/* 업로드 영역: 조건부 렌더링 */}
          {uploadedRfp ? (
            <div className="border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{uploadedRfp.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedRfp.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => replaceFileRef.current?.click()}>
                    파일 변경
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDelete}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <input ref={replaceFileRef} type="file" accept=".pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplace(f); }} />

              <p className="text-sm text-muted-foreground">
                다음 단계에서 AI가 장비 요구사항을 분석합니다.
              </p>
              <Button onClick={() => {
                if (uploadedRfp.draftId) router.push(`/quotation/analyze/${uploadedRfp.draftId}`);
                else toast.error("견적 초안이 생성되지 않았습니다.");
              }}>
                다음 단계: 분석 화면으로 이동
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
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
          )}

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
                    {/* 현재 작업 */}
                    {rfpList.filter(r => r.id === uploadedRfp?.id).length > 0 && (
                      <>
                        <TableRow>
                          <TableCell colSpan={5} className="text-xs text-muted-foreground font-medium bg-muted/30 py-1">현재 작업</TableCell>
                        </TableRow>
                        {rfpList.filter(r => r.id === uploadedRfp?.id).map(rfp => (
                          <TableRow key={rfp.id} className="bg-primary/5 border-l-2 border-l-primary">
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
                              {uploadedRfp?.draftId && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    router.push(`/quotation/analyze/${uploadedRfp.draftId}`)
                                  }
                                >
                                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                                  다음 단계
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}

                    {/* 이전 기록 */}
                    {rfpList.filter(r => r.id !== uploadedRfp?.id).length > 0 && (
                      <>
                        <TableRow>
                          <TableCell colSpan={5} className="text-xs text-muted-foreground font-medium bg-muted/30 py-1">이전 기록</TableCell>
                        </TableRow>
                        {rfpList.filter(r => r.id !== uploadedRfp?.id).map(rfp => (
                          <TableRow key={rfp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRfp(rfp)}>
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
                              {/* draft가 연결된 RFP: 다음 단계 버튼 */}
                              {rfpDraftMap[rfp.id] && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/quotation/analyze/${rfpDraftMap[rfp.id]}`);
                                  }}
                                >
                                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                                  다음 단계
                                </Button>
                              )}
                              {rfp.status === "parsed" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/quotation/rfp/${rfp.id}`);
                                    }}
                                  >
                                    결과 보기
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/quotation/configure?rfp_id=${rfp.id}&customer_id=${customerId}`
                                      );
                                    }}
                                    disabled={!customerId}
                                    title={!customerId ? "견적 허브에서 거래처를 먼저 선택하세요" : undefined}
                                  >
                                    <ServerCog className="h-3.5 w-3.5 mr-1.5" />
                                    서버 구성
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/quotation/result?rfp_id=${rfp.id}&customer_id=${customerId}`);
                                    }}
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
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* RFP 상태 팝업 */}
          <Dialog open={!!selectedRfp} onOpenChange={() => setSelectedRfp(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedRfp?.fileName}
                </DialogTitle>
              </DialogHeader>
              {selectedRfp && (
                <div className="space-y-4">
                  {/* 기본 정보 */}
                  <div className="rounded-lg border p-3 space-y-1.5 text-sm">
                    <p><span className="text-muted-foreground">파일명:</span> {selectedRfp.fileName}</p>
                    <p><span className="text-muted-foreground">업로드일:</span> {new Date(selectedRfp.createdAt).toLocaleString("ko-KR")}</p>
                  </div>

                  {/* 처리 상태 */}
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="font-medium text-sm">처리 상태</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✅</span>
                        <span>파일 업로드</span>
                        <span className="text-muted-foreground ml-auto">완료</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedRfp.status === "uploaded" ? (
                          <><span className="text-muted-foreground">○</span><span>AI 분석</span><span className="text-muted-foreground ml-auto">대기</span></>
                        ) : selectedRfp.status === "parsing" ? (
                          <><span className="text-blue-600">⟳</span><span>AI 분석</span><span className="text-blue-600 ml-auto">진행 중</span></>
                        ) : selectedRfp.status === "parsed" ? (
                          <><span className="text-green-600">✅</span><span>AI 분석</span><span className="text-muted-foreground ml-auto">완료</span></>
                        ) : (
                          <><span className="text-red-600">❌</span><span>AI 분석</span><span className="text-red-600 ml-auto">실패</span></>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedRfp.status === "parsed" ? (
                          <><span className="text-green-600">✅</span><span>장비 추출</span>
                            <span className="text-muted-foreground ml-auto">
                              {selectedRfp.parsedRequirements
                                ? `${(selectedRfp.parsedRequirements as Record<string,unknown>)?.equipment_list
                                  ? ((selectedRfp.parsedRequirements as Record<string,unknown>).equipment_list as unknown[]).length
                                  : 0}개 장비`
                                : "완료"}
                            </span>
                          </>
                        ) : (
                          <><span className="text-muted-foreground">○</span><span>장비 추출</span><span className="text-muted-foreground ml-auto">대기</span></>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 연결 견적 */}
                  <div className="rounded-lg border p-3 space-y-1.5 text-sm">
                    <p className="font-medium">연결 견적</p>
                    <p className="text-muted-foreground">
                      {selectedRfp.linkedQuotationCount && selectedRfp.linkedQuotationCount > 0
                        ? `${selectedRfp.linkedQuotationCount}건의 견적이 연결되어 있습니다.`
                        : "연결된 견적이 없습니다."}
                    </p>
                  </div>

                  {/* 장비 요약 (parsed일 때만) */}
                  {selectedRfp.status === "parsed" && selectedRfp.parsedRequirements && (() => {
                    const pr = selectedRfp.parsedRequirements as Record<string, unknown>;
                    const eqList = (pr.equipment_list ?? []) as Array<Record<string, unknown>>;
                    // 카테고리별 그룹핑
                    const groups: Record<string, { count: number; totalQty: number; names: string[] }> = {};
                    for (const eq of eqList) {
                      const cat = String(eq.category ?? "other");
                      if (!groups[cat]) groups[cat] = { count: 0, totalQty: 0, names: [] };
                      groups[cat].count++;
                      groups[cat].totalQty += Number(eq.quantity ?? 1);
                      groups[cat].names.push(String(eq.name ?? ""));
                    }
                    return (
                      <div className="rounded-lg border p-3 space-y-1.5 text-sm">
                        <p className="font-medium">추출 장비 요약</p>
                        {Object.entries(groups).map(([cat, g]) => (
                          <p key={cat}>
                            <span className="text-muted-foreground">{cat}:</span> {g.count}종 {g.totalQty}대
                            <span className="text-xs text-muted-foreground ml-1">({g.names.slice(0, 3).join(", ")}{g.names.length > 3 ? "..." : ""})</span>
                          </p>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </DialogContent>
          </Dialog>
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
