"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Sheet, MessageSquareText, ArrowRight, X, Trash2, Play, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerSelector, type SelectedCustomer } from "@/components/quotation/customer-selector";

const CUSTOMER_TYPE_LABEL: Record<string, string> = {
  public: "공공기관",
  private: "민간기업",
  other: "기타",
};

const scenarios = [
  {
    basePath: "/quotation/rfp",
    icon: FileText,
    title: "RFP 기반 견적",
    description: "RFP 문서(PDF)를 업로드하면 AI가 요구사항을 분석하여 3가지 견적안을 자동 생성합니다.",
    features: ["PDF 지원", "AI 자동 파싱", "3가지 견적안"],
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  {
    basePath: "/quotation/excel",
    icon: Sheet,
    title: "엑셀 업로드 견적",
    description: "엑셀 파일로 서버 구성(서버명, 수량, CPU/메모리/스토리지 사양)을 입력하여 견적을 생성합니다.",
    features: ["엑셀 템플릿 제공", "서버 구성 파싱", "부품 자동 매칭"],
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "hover:border-green-300 dark:hover:border-green-700",
  },
  {
    basePath: "/quotation/chat",
    icon: MessageSquareText,
    title: "AI 대화형 견적",
    description: "AI와 대화하며 서버 사양을 결정하고 견적을 생성합니다. 자유 입력 또는 가이드 모드를 선택하세요.",
    features: ["자연어 입력", "가이드 모드", "실시간 사양 결정"],
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "hover:border-purple-300 dark:hover:border-purple-700",
  },
];

interface DraftItem {
  id: string;
  quotationNumber: string;
  source: "rfp" | "excel" | "chat" | string;
  customerId: string;
  rfpId: string | null;
  customerName?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

const SOURCE_ICON: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  rfp: { icon: FileText, label: "RFP 기반", color: "text-blue-600" },
  excel: { icon: Sheet, label: "엑셀", color: "text-green-600" },
  chat: { icon: MessageSquareText, label: "AI 대화", color: "text-purple-600" },
};

export default function QuotationHubPage() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/quotation?status=draft");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDrafts(json.data);
      }
    } catch {
      // 조회 실패 시 무시
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const resumeDraft = async (draft: DraftItem) => {
    // RFP 기반이고 rfpId가 있으면 RFP 상태 확인
    if (draft.source === "rfp" && draft.rfpId) {
      try {
        const res = await fetch(`/api/rfp/${draft.rfpId}`);
        const json = await res.json();
        if (json.success && json.data?.status === "uploaded") {
          // 파일만 업로드됨 → 업로드 화면으로
          router.push(`/quotation/rfp?customer_id=${draft.customerId}`);
          return;
        }
      } catch {
        // API 실패 시 분석 화면으로 이동
      }
    }
    // 분석 완료 또는 엑셀/AI → 분석 화면으로
    router.push(`/quotation/analyze/${draft.id}`);
  };

  const deleteDraft = async (id: string) => {
    try {
      const res = await fetch(`/api/quotation/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchDrafts();
      }
    } catch {
      // 삭제 실패 시 무시
    }
  };

  const isEnabled = selectedCustomer !== null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">견적 생성</h2>
        <p className="text-muted-foreground">
          의뢰 거래처를 선택한 후, 견적 생성 방법을 선택하세요.
        </p>
      </div>

      {/* 작성 중인 견적 — 좌우 스크롤 카드 */}
      {drafts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold">작성 중인 견적</h3>
              <p className="text-sm text-muted-foreground">이전에 작성 중이던 견적을 이어서 작성할 수 있습니다.</p>
            </div>
            <Badge variant="secondary">{drafts.length}건</Badge>
          </div>
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex gap-4" style={{ minWidth: "min-content" }}>
              {drafts.map((draft) => {
                const sourceInfo = SOURCE_ICON[draft.source] ?? { icon: FileText, label: draft.source ?? "기타", color: "text-muted-foreground" };
                const Icon = sourceInfo.icon;
                return (
                  <Card key={draft.id} className="shrink-0 w-72 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-4 pb-3 space-y-3">
                      {/* 상단: 아이콘 + 타입 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md bg-muted ${sourceInfo.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{sourceInfo.label}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">초안</Badge>
                      </div>

                      {/* 견적 정보 */}
                      <div>
                        <p className="font-semibold text-sm">{draft.quotationNumber}</p>
                        {draft.customerName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{draft.customerName}</p>
                        )}
                      </div>

                      {/* 최종 수정일 */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(draft.updatedAt ?? draft.createdAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>

                      {/* 버튼 */}
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="flex-1" onClick={() => resumeDraft(draft)}>
                          <Play className="h-3.5 w-3.5 mr-1" />
                          재진행
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteDraft(draft.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: 거래처 선택 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant="default" className="rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs">1</Badge>
            거래처 선택
          </CardTitle>
          <CardDescription>
            견적을 의뢰한 회사를 선택하세요. 등록되지 않은 거래처는 신규 등록할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedCustomer ? (
            <div className="flex items-center gap-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 px-4 py-3">
              <div className="flex-1">
                <span className="font-medium">{selectedCustomer.companyName}</span>
                <Badge variant="secondary" className="text-xs ml-2">
                  {CUSTOMER_TYPE_LABEL[selectedCustomer.customerType] ?? selectedCustomer.customerType}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedCustomer(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
          )}
        </CardContent>
      </Card>

      {/* Step 2: 견적 방법 선택 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={isEnabled ? "default" : "secondary"} className="rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs">2</Badge>
          <span className={`text-base font-semibold ${isEnabled ? "" : "text-muted-foreground"}`}>
            견적 생성 방법 선택
          </span>
        </div>
        {!isEnabled && (
          <p className="text-sm text-muted-foreground ml-8">
            견적을 생성하려면 먼저 거래처를 선택하세요.
          </p>
        )}
      </div>

      <div className={`grid gap-6 md:grid-cols-3 transition-opacity duration-200 ${isEnabled ? "" : "opacity-50 pointer-events-none"}`}>
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const href = `${scenario.basePath}?customer_id=${selectedCustomer?.id ?? ""}`;

          const cardContent = (
            <Card className={`h-full transition-all duration-200 ${scenario.borderColor} ${isEnabled ? "group-hover:shadow-md cursor-pointer" : "cursor-not-allowed"}`}>
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${scenario.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 ${scenario.color}`} />
                </div>
                <CardTitle className="text-lg">{scenario.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {scenario.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {scenario.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  시작하기
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          );

          if (isEnabled) {
            return (
              <Link key={scenario.basePath} href={href} className="group">
                {cardContent}
              </Link>
            );
          }

          return (
            <div key={scenario.basePath}>
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
