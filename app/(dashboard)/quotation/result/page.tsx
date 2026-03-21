"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Sparkles, Save, Check, AlertCircle } from "lucide-react";
import { CustomerBanner } from "@/components/quotation/customer-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  QuotationDraft,
  RecommendationText,
  GenerateQuotationResponse,
} from "@/lib/types";
import type { CompatibilityIssue } from "@/lib/types/compatibility";

/** 금액 포매팅 */
function formatPrice(value: number): string {
  return value.toLocaleString("ko-KR");
}

/** 견적안 탭 내부 컨텐츠 */
function QuotationTabContent({
  draft,
  recommendation,
}: {
  draft: QuotationDraft;
  recommendation: RecommendationText;
}) {
  return (
    <div className="space-y-6">
      {/* AI 추천 설명 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            AI 추천 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{recommendation.summary}</p>
          {recommendation.pros.length > 0 && (
            <div>
              <p className="font-medium text-green-600">장점</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {recommendation.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {recommendation.cons.length > 0 && (
            <div>
              <p className="font-medium text-red-600">단점</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {recommendation.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 서버 구성별 부품 테이블 */}
      {draft.configs.map((config) => (
        <div key={config.config_name} className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{config.config_name}</h4>
            <Badge variant="secondary">x{config.quantity}</Badge>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>카테고리</TableHead>
                  <TableHead>모델명</TableHead>
                  <TableHead className="text-center">수량</TableHead>
                  <TableHead className="text-right">공급가(원)</TableHead>
                  <TableHead className="text-right">마진율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.parts.map((part, pidx) => {
                  const marginRate =
                    part.unit_supply_price > 0
                      ? (
                          ((part.unit_supply_price - part.unit_cost_price) /
                            part.unit_supply_price) *
                          100
                        ).toFixed(1)
                      : "0.0";
                  return (
                    <TableRow key={pidx}>
                      <TableCell className="text-sm">{part.category}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {part.model_name}
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({part.manufacturer})
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {part.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatPrice(part.unit_supply_price)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {marginRate}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            소계: 원가 {formatPrice(config.subtotal_cost)}원 / 공급가{" "}
            {formatPrice(config.subtotal_supply)}원 / 마진{" "}
            {formatPrice(config.subtotal_margin)}원 ({config.margin_rate.toFixed(1)}%)
          </div>
        </div>
      ))}

      {/* 하단 요약 */}
      <Separator />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">총 원가</p>
            <p className="text-lg font-bold">{formatPrice(draft.total_cost)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">총 공급가</p>
            <p className="text-lg font-bold">{formatPrice(draft.total_supply)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">총 마진</p>
            <p className="text-lg font-bold">{formatPrice(draft.total_margin)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">마진율</p>
            <p className="text-lg font-bold">{draft.margin_rate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function QuotationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rfpId = searchParams.get("rfp_id");
  const customerId = searchParams.get("customer_id") ?? "";
  const source = searchParams.get("source"); // "chat" | "excel" | null
  const draftId = searchParams.get("draft_id");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedType, setSavedType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateQuotationResponse | null>(null);
  const [warnings, setWarnings] = useState<CompatibilityIssue[]>([]);
  const [activeTab, setActiveTab] = useState("profitability");

  // 견적 생성 요청 (rfp_id 또는 sessionStorage specs 사용)
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // draft_id가 있으면 DB에서 source_data 로드
      let specs = null;
      if ((source === "excel" || source === "chat") && draftId) {
        try {
          const draftRes = await fetch(`/api/quotation/${draftId}`);
          const draftJson = await draftRes.json();
          if (draftJson.success && draftJson.data.sourceData) {
            specs = draftJson.data.sourceData.configs;
          }
        } catch {
          // draft 로드 실패 시 sessionStorage 폴백
        }
      }
      // 폴백: 기존 sessionStorage (하위 호환)
      if (!specs && (source === "chat" || source === "excel")) {
        const key = source === "chat" ? "chat_quotation_specs" : "excel_quotation_specs";
        const stored = sessionStorage.getItem(key);
        if (stored) {
          specs = JSON.parse(stored);
          sessionStorage.removeItem(key);
        }
      }

      if (!rfpId && !specs) {
        setError("견적 생성에 필요한 데이터가 없습니다.");
        return;
      }

      const res = await fetch("/api/quotation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfp_id: rfpId || undefined,
          customer_id: customerId,
          specs: specs || undefined,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message ?? "견적 생성에 실패했습니다.");
        return;
      }

      setResult(json.data);
      setWarnings(json.data.compatibility_warnings ?? []);
    } catch {
      setError("견적 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [rfpId, customerId, source, draftId]);

  // 견적 확정 (DB 저장)
  const handleSaveQuotation = useCallback(async (quotationType: string) => {
    if (!result) return;

    const draft = result.quotations[quotationType as keyof typeof result.quotations];
    if (!draft) return;

    setSaving(true);
    setError(null);

    try {
      // draft의 부품 정보를 견적 항목으로 변환
      const items = draft.configs.flatMap((config) =>
        config.parts.map((part) => ({
          item_type: "hardware" as const,
          part_id: part.part_id || undefined,
          item_name: `${part.model_name} (${part.manufacturer})`,
          item_spec: part.category,
          quantity: part.quantity * config.quantity,
          unit: "EA",
          unit_cost_price: part.unit_cost_price,
          unit_supply_price: part.unit_supply_price,
          margin_rate:
            part.unit_supply_price > 0
              ? ((part.unit_supply_price - part.unit_cost_price) / part.unit_supply_price) * 100
              : 0,
        })),
      );

      const res = await fetch("/api/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfp_id: rfpId || undefined,
          customer_id: customerId || undefined,
          quotation_type: quotationType,
          items,
          total_cost: draft.total_cost,
          total_supply: draft.total_supply,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "견적 저장에 실패했습니다.");
        return;
      }

      setSavedType(quotationType);
      // 2초 후 견적 이력 페이지로 이동
      setTimeout(() => {
        router.push("/quotation-history");
      }, 2000);
    } catch {
      setError("견적 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }, [result, rfpId, customerId, router]);

  // rfpId 또는 source가 있으면 자동 생성 시도
  useEffect(() => {
    if ((rfpId || source) && !result && !loading) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfpId, source]);

  return (
    <div className="space-y-6">
      {/* 거래처 배너 */}
      {customerId ? (
        <CustomerBanner customerId={customerId} />
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/30 px-4 py-2.5">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-700 dark:text-orange-400">
            거래처가 선택되지 않았습니다.{" "}
            <a href="/quotation" className="underline font-medium">견적 허브에서 거래처를 선택</a>해주세요.
          </span>
        </div>
      )}

      {/* 제목 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">견적 생성</h2>
          <p className="text-muted-foreground">
            RFP 기반 3가지 견적안 자동 생성 (수익성 / 규격 충족 / 성능 향상)
          </p>
        </div>
        {rfpId && !loading && (
          <Button onClick={handleGenerate} disabled={loading}>
            견적 재생성
          </Button>
        )}
      </div>

      {/* RFP 미선택 */}
      {!rfpId && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              RFP를 먼저 업로드하세요.{" "}
              <a href="/rfp" className="text-primary underline">
                RFP 업로드 페이지로 이동
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      {/* 로딩 */}
      {loading && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              AI가 최적의 부품 조합을 분석하고 있습니다...
            </p>
          </CardContent>
        </Card>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 호환성 경고 */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
            >
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="text-sm">
                <Badge variant="destructive" className="mr-2">
                  {w.error_level === "block" ? "차단" : "경고"}
                </Badge>
                {w.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 견적 결과 — 3가지 탭 */}
      {result && (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profitability">수익성 중심</TabsTrigger>
              <TabsTrigger value="spec_match">규격 충족</TabsTrigger>
              <TabsTrigger value="performance">성능 향상</TabsTrigger>
            </TabsList>

            <TabsContent value="profitability" className="mt-4">
              <QuotationTabContent
                draft={result.quotations.profitability}
                recommendation={result.ai_recommendations.profitability}
              />
            </TabsContent>

            <TabsContent value="spec_match" className="mt-4">
              <QuotationTabContent
                draft={result.quotations.spec_match}
                recommendation={result.ai_recommendations.spec_match}
              />
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              <QuotationTabContent
                draft={result.quotations.performance}
                recommendation={result.ai_recommendations.performance}
              />
            </TabsContent>
          </Tabs>

          {/* 견적 확정 버튼 */}
          <div className="flex justify-end gap-2 pt-4">
            {savedType === activeTab ? (
              <Button disabled className="bg-green-600 hover:bg-green-600">
                <Check className="h-4 w-4 mr-2" />
                저장 완료 — 견적 이력으로 이동 중...
              </Button>
            ) : (
              <Button
                onClick={() => handleSaveQuotation(activeTab)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "저장 중..." : "현재 견적안 확정 저장"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
